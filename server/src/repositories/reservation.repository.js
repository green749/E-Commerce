import { query } from '../db/index.js';

export const reservationRepository = {
  /**
   * Lock inventory row for a variant with SELECT ... FOR UPDATE
   * @param {string} variantId
   * @param {Function} [client] - Optional transactional query client
   * @returns {Promise<Object|null>}
   */
  async lockVariantForUpdate(variantId, client = query) {
    const sql = `
      SELECT
        i.id,
        i.variant_id,
        i.quantity_on_hand,
        i.quantity_reserved,
        GREATEST(0, i.quantity_on_hand - i.quantity_reserved) as available,
        v.sku,
        v.price,
        v.mrp,
        p.id as product_id,
        p.name as product_name,
        p.is_active,
        p.deleted_at
      FROM inventory i
      JOIN variants v ON v.id = i.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE i.variant_id = $1
      FOR UPDATE;
    `;
    const res = await client(sql, [variantId]);
    return res.rows[0] || null;
  },

  /**
   * Create an inventory reservation and increment reserved quantity
   * @param {Object} params
   * @param {string} params.variantId
   * @param {string} params.orderId
   * @param {string} [params.cartId]
   * @param {number} params.quantity
   * @param {number} [params.durationMinutes=15]
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async createReservation(
    { variantId, orderId, cartId = null, quantity, durationMinutes = 15 },
    client = query
  ) {
    // 1. Increment reserved stock on inventory
    await client(
      `UPDATE inventory
       SET quantity_reserved = quantity_reserved + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE variant_id = $2;`,
      [quantity, variantId]
    );

    // 2. Insert reservation record (expires in 15 minutes by default)
    const sql = `
      INSERT INTO inventory_reservations (
        variant_id, order_id, cart_id, quantity, expires_at, status
      )
      VALUES (
        $1, $2, $3, $4,
        CURRENT_TIMESTAMP + ($5 || ' minutes')::interval,
        'held'
      )
      RETURNING id, variant_id, order_id, cart_id, quantity, expires_at, status, created_at, updated_at;
    `;
    const res = await client(sql, [variantId, orderId, cartId, quantity, String(durationMinutes)]);
    return res.rows[0];
  },

  /**
   * Commit reservations for an order upon successful payment:
   * Deduct quantity_on_hand, reduce quantity_reserved, mark reservation 'committed'
   * @param {string} orderId
   * @param {Function} [client]
   * @returns {Promise<Array>}
   */
  async commitReservationsForOrder(orderId, client = query) {
    const heldRes = await client(
      `SELECT id, variant_id, quantity
       FROM inventory_reservations
       WHERE order_id = $1 AND status = 'held';`,
      [orderId]
    );

    for (const r of heldRes.rows) {
      await client(
        `UPDATE inventory
         SET quantity_on_hand = GREATEST(0, quantity_on_hand - $1),
             quantity_reserved = GREATEST(0, quantity_reserved - $1),
             updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = $2;`,
        [r.quantity, r.variant_id]
      );

      await client(
        `UPDATE inventory_reservations
         SET status = 'committed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1;`,
        [r.id]
      );
    }

    return heldRes.rows;
  },

  /**
   * Release held reservations for an order:
   * Deduct quantity_reserved, mark reservation 'released'
   * @param {string} orderId
   * @param {Function} [client]
   * @returns {Promise<Array>}
   */
  async releaseReservationsForOrder(orderId, client = query) {
    const heldRes = await client(
      `SELECT id, variant_id, quantity
       FROM inventory_reservations
       WHERE order_id = $1 AND status = 'held';`,
      [orderId]
    );

    for (const r of heldRes.rows) {
      await client(
        `UPDATE inventory
         SET quantity_reserved = GREATEST(0, quantity_reserved - $1),
             updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = $2;`,
        [r.quantity, r.variant_id]
      );

      await client(
        `UPDATE inventory_reservations
         SET status = 'released',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1;`,
        [r.id]
      );
    }

    return heldRes.rows;
  },

  /**
   * Restore committed stock to quantity_on_hand (e.g. customer cancels order before shipping)
   * @param {string} variantId
   * @param {number} quantity
   * @param {Function} [client]
   */
  async restoreCommittedStock(variantId, quantity, client = query) {
    await client(
      `UPDATE inventory
       SET quantity_on_hand = quantity_on_hand + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE variant_id = $2;`,
      [quantity, variantId]
    );
  },

  /**
   * Find and release all expired held reservations across the system
   * @param {Function} [client]
   * @returns {Promise<Array>} List of released reservations and cancelled order IDs
   */
  async releaseExpiredReservations(client = query) {
    const expiredRes = await client(
      `SELECT id, variant_id, order_id, quantity
       FROM inventory_reservations
       WHERE status = 'held' AND expires_at < CURRENT_TIMESTAMP;`
    );

    const cancelledOrderIds = new Set();

    for (const r of expiredRes.rows) {
      await client(
        `UPDATE inventory
         SET quantity_reserved = GREATEST(0, quantity_reserved - $1),
             updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = $2;`,
        [r.quantity, r.variant_id]
      );

      await client(
        `UPDATE inventory_reservations
         SET status = 'released',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1;`,
        [r.id]
      );

      if (r.order_id) {
        cancelledOrderIds.add(r.order_id);
      }
    }

    // Cancel stale pending_payment orders
    for (const orderId of cancelledOrderIds) {
      const updateRes = await client(
        `UPDATE orders
         SET status = 'cancelled',
             payment_status = 'expired',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending_payment'
         RETURNING id;`,
        [orderId]
      );

      if (updateRes.rowCount > 0) {
        await client(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note)
           VALUES ($1, 'pending_payment', 'cancelled', 'Order cancelled automatically due to reservation expiry');`,
          [orderId]
        );
      }
    }

    return {
      releasedCount: expiredRes.rows.length,
      cancelledOrders: Array.from(cancelledOrderIds),
    };
  },
};
