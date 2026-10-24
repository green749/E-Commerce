import { query } from '../db/index.js';

export const inventoryRepository = {
  /**
   * Find inventory by variant ID with computed available stock
   * @param {string} variantId
   * @returns {Promise<Object|null>}
   */
  async findByVariantId(variantId) {
    const res = await query(
      `SELECT id, variant_id, quantity_on_hand, quantity_reserved, reorder_level,
              GREATEST(0, quantity_on_hand - quantity_reserved) as available,
              created_at, updated_at
       FROM inventory
       WHERE variant_id = $1;`,
      [variantId]
    );
    return res.rows[0] || null;
  },

  /**
   * Initialize or update inventory record for a variant
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async upsert({ variant_id, quantity_on_hand = 0, reorder_level = 5 }) {
    const sql = `
      INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
      VALUES ($1, $2, 0, $3)
      ON CONFLICT (variant_id) DO UPDATE
      SET quantity_on_hand = EXCLUDED.quantity_on_hand,
          reorder_level = EXCLUDED.reorder_level
      RETURNING id, variant_id, quantity_on_hand, quantity_reserved, reorder_level,
                GREATEST(0, quantity_on_hand - quantity_reserved) as available,
                created_at, updated_at;
    `;
    const res = await query(sql, [variant_id, quantity_on_hand, reorder_level]);
    return res.rows[0];
  },

  /**
   * Adjust inventory quantity (direct set or delta adjustment)
   * @param {string} variantId
   * @param {Object} options
   * @param {number} [options.quantity_on_hand]
   * @param {number} [options.adjustment]
   * @returns {Promise<Object|null>}
   */
  async adjustStock(variantId, { quantity_on_hand, adjustment }) {
    let sql;
    let values;

    if (quantity_on_hand !== undefined && quantity_on_hand !== null) {
      sql = `
        INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
        VALUES ($1, $2, 0, 5)
        ON CONFLICT (variant_id) DO UPDATE
        SET quantity_on_hand = $2
        RETURNING id, variant_id, quantity_on_hand, quantity_reserved, reorder_level,
                  GREATEST(0, quantity_on_hand - quantity_reserved) as available,
                  created_at, updated_at;
      `;
      values = [variantId, Math.max(0, Number(quantity_on_hand))];
    } else if (adjustment !== undefined && adjustment !== null) {
      sql = `
        INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
        VALUES ($1, GREATEST(0, $2), 0, 5)
        ON CONFLICT (variant_id) DO UPDATE
        SET quantity_on_hand = GREATEST(0, inventory.quantity_on_hand + $2)
        RETURNING id, variant_id, quantity_on_hand, quantity_reserved, reorder_level,
                  GREATEST(0, quantity_on_hand - quantity_reserved) as available,
                  created_at, updated_at;
      `;
      values = [variantId, Number(adjustment)];
    } else {
      return this.findByVariantId(variantId);
    }

    const res = await query(sql, values);
    return res.rows[0] || null;
  },
};
