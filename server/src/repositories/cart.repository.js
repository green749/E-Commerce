import { query } from '../db/index.js';

export const cartRepository = {
  /**
   * Find active cart for authenticated user
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findActiveByUserId(userId) {
    const res = await query(
      `SELECT id, user_id, session_id, coupon_id, status, created_at, updated_at
       FROM carts
       WHERE user_id = $1 AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT 1;`,
      [userId]
    );
    return res.rows[0] || null;
  },

  /**
   * Find active cart for guest session
   * @param {string} sessionId
   * @returns {Promise<Object|null>}
   */
  async findActiveBySessionId(sessionId) {
    const res = await query(
      `SELECT id, user_id, session_id, coupon_id, status, created_at, updated_at
       FROM carts
       WHERE session_id = $1 AND user_id IS NULL AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT 1;`,
      [sessionId]
    );
    return res.rows[0] || null;
  },

  /**
   * Find cart by ID
   * @param {string} cartId
   * @returns {Promise<Object|null>}
   */
  async findById(cartId) {
    const res = await query(
      `SELECT id, user_id, session_id, coupon_id, status, created_at, updated_at
       FROM carts
       WHERE id = $1;`,
      [cartId]
    );
    return res.rows[0] || null;
  },

  /**
   * Create a new cart
   * @param {Object} params
   * @param {string|null} params.userId
   * @param {string|null} params.sessionId
   * @returns {Promise<Object>}
   */
  async create({ userId = null, sessionId = null }) {
    const res = await query(
      `INSERT INTO carts (user_id, session_id, status)
       VALUES ($1, $2, 'active')
       RETURNING id, user_id, session_id, coupon_id, status, created_at, updated_at;`,
      [userId || null, sessionId || null]
    );
    return res.rows[0];
  },

  /**
   * Update coupon on cart
   * @param {string} cartId
   * @param {string|null} couponId
   * @returns {Promise<Object>}
   */
  async updateCoupon(cartId, couponId) {
    const res = await query(
      `UPDATE carts
       SET coupon_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, user_id, session_id, coupon_id, status, created_at, updated_at;`,
      [couponId || null, cartId]
    );
    return res.rows[0];
  },

  /**
   * Get all line items for a cart with current variant prices, product details, and stock levels
   * @param {string} cartId
   * @returns {Promise<Array>}
   */
  async getItems(cartId) {
    const sql = `
      SELECT
        ci.id as item_id,
        ci.cart_id,
        ci.variant_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        v.product_id,
        v.sku,
        v.size,
        v.color,
        v.price,
        v.mrp,
        p.name as product_name,
        p.slug as product_slug,
        p.brand,
        p.image_urls,
        p.is_active,
        p.deleted_at,
        COALESCE(inv.quantity_on_hand, 0) as quantity_on_hand,
        COALESCE(inv.quantity_reserved, 0) as quantity_reserved,
        GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0)) as available
      FROM cart_items ci
      JOIN variants v ON v.id = ci.variant_id
      JOIN products p ON p.id = v.product_id
      LEFT JOIN inventory inv ON inv.variant_id = v.id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC;
    `;
    const res = await query(sql, [cartId]);
    return res.rows;
  },

  /**
   * Find specific item by cart ID and variant ID
   * @param {string} cartId
   * @param {string} variantId
   * @returns {Promise<Object|null>}
   */
  async getItemByCartAndVariant(cartId, variantId) {
    const res = await query(
      `SELECT id, cart_id, variant_id, quantity, created_at, updated_at
       FROM cart_items
       WHERE cart_id = $1 AND variant_id = $2;`,
      [cartId, variantId]
    );
    return res.rows[0] || null;
  },

  /**
   * Find cart item by ID
   * @param {string} itemId
   * @returns {Promise<Object|null>}
   */
  async getItemById(itemId) {
    const sql = `
      SELECT
        ci.id as item_id,
        ci.cart_id,
        ci.variant_id,
        ci.quantity,
        v.product_id,
        v.sku,
        v.price,
        c.user_id,
        c.session_id
      FROM cart_items ci
      JOIN carts c ON c.id = ci.cart_id
      JOIN variants v ON v.id = ci.variant_id
      WHERE ci.id = $1;
    `;
    const res = await query(sql, [itemId]);
    return res.rows[0] || null;
  },

  /**
   * Add item to cart
   * @param {string} cartId
   * @param {string} variantId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  async addItem(cartId, variantId, quantity) {
    const res = await query(
      `INSERT INTO cart_items (cart_id, variant_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, variant_id) DO UPDATE
       SET quantity = cart_items.quantity + EXCLUDED.quantity,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, cart_id, variant_id, quantity, created_at, updated_at;`,
      [cartId, variantId, quantity]
    );
    return res.rows[0];
  },

  /**
   * Update item quantity in cart
   * @param {string} itemId
   * @param {number} quantity
   * @returns {Promise<Object|null>}
   */
  async updateItemQuantity(itemId, quantity) {
    const res = await query(
      `UPDATE cart_items
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, cart_id, variant_id, quantity, created_at, updated_at;`,
      [quantity, itemId]
    );
    return res.rows[0] || null;
  },

  /**
   * Remove item from cart
   * @param {string} itemId
   * @returns {Promise<boolean>}
   */
  async removeItem(itemId) {
    const res = await query(`DELETE FROM cart_items WHERE id = $1;`, [itemId]);
    return res.rowCount > 0;
  },

  /**
   * Clear all items from a cart
   * @param {string} cartId
   * @returns {Promise<void>}
   */
  async clearItems(cartId) {
    await query(`DELETE FROM cart_items WHERE cart_id = $1;`, [cartId]);
  },

  /**
   * Merge guest cart into user cart:
   * Combines items, respects max quantity 10 & available stock, transfers coupon, and converts guest cart
   * @param {string} guestCartId
   * @param {string} userCartId
   * @returns {Promise<void>}
   */
  async mergeGuestCart(guestCartId, userCartId) {
    if (guestCartId === userCartId) return;

    const guestItems = await this.getItems(guestCartId);
    const guestCart = await this.findById(guestCartId);
    const userCart = await this.findById(userCartId);

    for (const gItem of guestItems) {
      const existingUserItem = await this.getItemByCartAndVariant(userCartId, gItem.variant_id);
      const available = gItem.available;

      if (existingUserItem) {
        // Sum quantities, capped at available stock and max 10
        const mergedQty = Math.min(
          10,
          Math.min(available, existingUserItem.quantity + gItem.quantity)
        );
        if (mergedQty > 0) {
          await this.updateItemQuantity(existingUserItem.id, mergedQty);
        }
      } else {
        const initialQty = Math.min(10, Math.min(available, gItem.quantity));
        if (initialQty > 0) {
          await this.addItem(userCartId, gItem.variant_id, initialQty);
        }
      }
    }

    // Transfer coupon if user cart has none
    if (guestCart?.coupon_id && !userCart?.coupon_id) {
      await this.updateCoupon(userCartId, guestCart.coupon_id);
    }

    // Mark guest cart as converted
    await query(`UPDATE carts SET status = 'converted' WHERE id = $1;`, [guestCartId]);
  },
};
