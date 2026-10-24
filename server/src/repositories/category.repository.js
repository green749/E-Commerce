import { query } from '../db/index.js';

export const categoryRepository = {
  /**
   * Find all categories ordered by name
   * @returns {Promise<Array>}
   */
  async findAll() {
    const res = await query(
      `SELECT id, name, slug, parent_id, image_url, created_at, updated_at
       FROM categories
       WHERE slug IN ('cleansers', 'serums', 'moisturizers', 'masks', 'body-care', 'refills-sets')
       ORDER BY 
         CASE slug
           WHEN 'cleansers' THEN 1
           WHEN 'serums' THEN 2
           WHEN 'moisturizers' THEN 3
           WHEN 'masks' THEN 4
           WHEN 'body-care' THEN 5
           WHEN 'refills-sets' THEN 6
           ELSE 7
         END ASC;`
    );
    return res.rows;
  },

  /**
   * Find category by slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    const res = await query(
      `SELECT id, name, slug, parent_id, image_url, created_at, updated_at
       FROM categories
       WHERE slug = $1;`,
      [slug]
    );
    return res.rows[0] || null;
  },

  /**
   * Find category by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await query(
      `SELECT id, name, slug, parent_id, image_url, created_at, updated_at
       FROM categories
       WHERE id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Create a new category
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const res = await query(
      `INSERT INTO categories (name, slug, parent_id, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slug, parent_id, image_url, created_at, updated_at;`,
      [data.name.trim(), data.slug.trim(), data.parent_id || null, data.image_url || null]
    );
    return res.rows[0];
  },

  /**
   * Update category
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(data.slug.trim());
    }
    if (data.parent_id !== undefined) {
      fields.push(`parent_id = $${idx++}`);
      values.push(data.parent_id || null);
    }
    if (data.image_url !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(data.image_url || null);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, slug, parent_id, image_url, created_at, updated_at;
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Delete category
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const res = await query(`DELETE FROM categories WHERE id = $1;`, [id]);
    return res.rowCount > 0;
  },
};
