import { query } from '../db/index.js';

export const userRepository = {
  /**
   * Find active user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const res = await query(
      `SELECT id, name, email, phone, password_hash, role, is_active, created_at, updated_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL;`,
      [email.trim().toLowerCase()]
    );
    return res.rows[0] || null;
  },

  /**
   * Find active user by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await query(
      `SELECT id, name, email, phone, role, is_active, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Find user by ID including password hash (for password operations)
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findByIdWithPassword(id) {
    const res = await query(
      `SELECT id, name, email, phone, password_hash, role, is_active, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Create a new user
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async create({ name, email, phone = null, password_hash, role = 'customer' }) {
    const res = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at;`,
      [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, password_hash, role]
    );
    return res.rows[0];
  },

  /**
   * Update profile fields (name, phone)
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object|null>}
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name.trim());
    }

    if (updates.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(updates.phone ? updates.phone.trim() : null);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx} AND deleted_at IS NULL
      RETURNING id, name, email, phone, role, is_active, created_at, updated_at;
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Update user's password hash
   * @param {string} id
   * @param {string} password_hash
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, password_hash) {
    const res = await query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2 AND deleted_at IS NULL;`,
      [password_hash, id]
    );
    return res.rowCount > 0;
  },
};
