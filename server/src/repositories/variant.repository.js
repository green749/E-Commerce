import { query } from '../db/index.js';

export const variantRepository = {
  /**
   * Find variants by product ID with inventory
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async findByProductId(productId) {
    const res = await query(
      `SELECT v.*,
              COALESCE(inv.quantity_on_hand, 0) as quantity_on_hand,
              COALESCE(inv.quantity_reserved, 0) as quantity_reserved,
              GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0)) as available
       FROM variants v
       LEFT JOIN inventory inv ON inv.variant_id = v.id
       WHERE v.product_id = $1
       ORDER BY v.price ASC;`,
      [productId]
    );
    return res.rows;
  },

  /**
   * Find variant by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await query(
      `SELECT v.*,
              COALESCE(inv.quantity_on_hand, 0) as quantity_on_hand,
              COALESCE(inv.quantity_reserved, 0) as quantity_reserved,
              GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0)) as available
       FROM variants v
       LEFT JOIN inventory inv ON inv.variant_id = v.id
       WHERE v.id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Find variant by SKU
   * @param {string} sku
   * @returns {Promise<Object|null>}
   */
  async findBySku(sku) {
    const res = await query(`SELECT * FROM variants WHERE sku = $1;`, [sku]);
    return res.rows[0] || null;
  },

  /**
   * Create variant
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const res = await query(
      `INSERT INTO variants (product_id, sku, size, color, price, mrp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, product_id, sku, size, color, price, mrp, created_at, updated_at;`,
      [
        data.product_id,
        data.sku.trim(),
        data.size ? data.size.trim() : null,
        data.color ? data.color.trim() : null,
        data.price,
        data.mrp,
      ]
    );
    return res.rows[0];
  },

  /**
   * Update variant
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['sku', 'size', 'color', 'price', 'mrp'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE variants
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, product_id, sku, size, color, price, mrp, created_at, updated_at;
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Delete variant
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const res = await query(`DELETE FROM variants WHERE id = $1;`, [id]);
    return res.rowCount > 0;
  },
};
