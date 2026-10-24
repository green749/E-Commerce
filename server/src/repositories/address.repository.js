import { query } from '../db/index.js';

export const addressRepository = {
  /**
   * List all addresses for a user, sorted with default first
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    const res = await query(
      `SELECT id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC;`,
      [userId]
    );
    return res.rows;
  },

  /**
   * Find address by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await query(
      `SELECT id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
       FROM addresses
       WHERE id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Find address by ID and user ID
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findByIdAndUserId(id, userId) {
    const res = await query(
      `SELECT id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
       FROM addresses
       WHERE id = $1 AND user_id = $2;`,
      [id, userId]
    );
    return res.rows[0] || null;
  },

  /**
   * Count total addresses for a user
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async countByUserId(userId) {
    const res = await query(`SELECT COUNT(*)::int as count FROM addresses WHERE user_id = $1;`, [
      userId,
    ]);
    return res.rows[0]?.count || 0;
  },

  /**
   * Set is_default = false for all addresses belonging to a user
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async unsetDefaults(userId) {
    await query(`UPDATE addresses SET is_default = false WHERE user_id = $1;`, [userId]);
  },

  /**
   * Create address
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(userId, data) {
    const res = await query(
      `INSERT INTO addresses (user_id, full_name, phone, line1, line2, city, state, pincode, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at;`,
      [
        userId,
        data.full_name,
        data.phone,
        data.line1,
        data.line2 || null,
        data.city,
        data.state,
        data.pincode,
        data.is_default ?? false,
      ]
    );
    return res.rows[0];
  },

  /**
   * Update address
   * @param {string} id
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, userId, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'full_name',
      'phone',
      'line1',
      'line2',
      'city',
      'state',
      'pincode',
      'is_default',
    ];
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return this.findByIdAndUserId(id, userId);
    }

    values.push(id, userId);
    const sql = `
      UPDATE addresses
      SET ${fields.join(', ')}
      WHERE id = $${idx++} AND user_id = $${idx}
      RETURNING id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at;
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Delete address
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async delete(id, userId) {
    const res = await query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2;`, [id, userId]);
    return res.rowCount > 0;
  },
};
