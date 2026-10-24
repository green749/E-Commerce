import { query } from '../db/index.js';

export const wishlistRepository = {
  /**
   * Find all wishlist items for a user with product & category metadata
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    const sql = `
      SELECT
        w.id,
        w.user_id,
        w.product_id,
        w.created_at,
        p.name as product_name,
        p.slug as product_slug,
        p.brand,
        p.base_price,
        p.mrp,
        p.image_urls,
        p.is_active,
        p.deleted_at,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE((
          SELECT SUM(GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0)))::int
          FROM variants v
          LEFT JOIN inventory inv ON inv.variant_id = v.id
          WHERE v.product_id = p.id
        ), 0) as total_available
      FROM wishlist_items w
      JOIN products p ON p.id = w.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE w.user_id = $1
        AND p.deleted_at IS NULL
      ORDER BY w.created_at DESC;
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  },

  /**
   * Add item to wishlist (idempotent)
   * @param {string} userId
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async addItem(userId, productId) {
    const res = await query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id, user_id, product_id, created_at, updated_at;`,
      [userId, productId]
    );
    return res.rows[0] || null;
  },

  /**
   * Remove item from wishlist by product_id or wishlist item id
   * @param {string} userId
   * @param {string} identifier (productId or wishlist itemId)
   * @returns {Promise<boolean>}
   */
  async removeItem(userId, identifier) {
    const res = await query(
      `DELETE FROM wishlist_items WHERE user_id = $1 AND (product_id = $2 OR id = $2);`,
      [userId, identifier]
    );
    return res.rowCount > 0;
  },

  /**
   * Check if a product is in the user's wishlist
   * @param {string} userId
   * @param {string} productId
   * @returns {Promise<boolean>}
   */
  async exists(userId, productId) {
    const res = await query(
      `SELECT 1 FROM wishlist_items WHERE user_id = $1 AND product_id = $2;`,
      [userId, productId]
    );
    return res.rows.length > 0;
  },
};
