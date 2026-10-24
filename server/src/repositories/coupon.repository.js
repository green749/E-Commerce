import { query } from '../db/index.js';

export const couponRepository = {
  /**
   * Find coupon by code (case-insensitive)
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  async findByCode(code) {
    const res = await query(
      `SELECT id, code, type, value, min_order_amount, max_discount,
              starts_at, ends_at, usage_limit, used_count, is_active, created_at, updated_at
       FROM coupons
       WHERE code = $1;`,
      [code.trim().toUpperCase()]
    );
    return res.rows[0] || null;
  },

  /**
   * Find coupon by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await query(
      `SELECT id, code, type, value, min_order_amount, max_discount,
              starts_at, ends_at, usage_limit, used_count, is_active, created_at, updated_at
       FROM coupons
       WHERE id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Find coupons for admin management with search, filter, and pagination
   * @param {Object} options
   * @returns {Promise<{ items: Array, total: number, page: number, totalPages: number }>}
   */
  async findAll({ search = '', is_active = null, page = 1, limit = 20 }) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (search && search.trim()) {
      conditions.push(`code ILIKE $${idx++}`);
      values.push(`%${search.trim()}%`);
    }

    if (is_active !== null && is_active !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      values.push(is_active === 'true' || is_active === true);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*)::int as count FROM coupons ${where};`, values);
    const total = countRes.rows[0]?.count || 0;

    const offset = (page - 1) * limit;
    values.push(limit, offset);
    const res = await query(
      `SELECT * FROM coupons ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++};`,
      values
    );

    return {
      items: res.rows.map((c) => ({
        ...c,
        value: Number(c.value),
        min_order_amount: Number(c.min_order_amount),
        max_discount: c.max_discount ? Number(c.max_discount) : null,
        used_count: Number(c.used_count || 0),
        usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Create new promotional coupon
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const res = await query(
      `INSERT INTO coupons (
        code, type, value, min_order_amount, max_discount, starts_at, ends_at, usage_limit, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        data.code.trim().toUpperCase(),
        data.type,
        data.value,
        data.min_order_amount || 0,
        data.max_discount || null,
        data.starts_at || new Date().toISOString(),
        data.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        data.usage_limit || null,
        data.is_active ?? true,
      ]
    );
    const c = res.rows[0];
    return {
      ...c,
      value: Number(c.value),
      min_order_amount: Number(c.min_order_amount),
      max_discount: c.max_discount ? Number(c.max_discount) : null,
      used_count: Number(c.used_count || 0),
      usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
    };
  },

  /**
   * Update coupon
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const fields = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];
    let idx = 1;

    const allowed = [
      'code',
      'type',
      'value',
      'min_order_amount',
      'max_discount',
      'starts_at',
      'ends_at',
      'usage_limit',
      'is_active',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        if (key === 'code') {
          fields.push(`code = $${idx++}`);
          values.push(data.code.trim().toUpperCase());
        } else {
          fields.push(`${key} = $${idx++}`);
          values.push(data[key]);
        }
      }
    }

    values.push(id);
    const sql = `
      UPDATE coupons
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    const res = await query(sql, values);
    if (!res.rows[0]) return null;
    const c = res.rows[0];
    return {
      ...c,
      value: Number(c.value),
      min_order_amount: Number(c.min_order_amount),
      max_discount: c.max_discount ? Number(c.max_discount) : null,
      used_count: Number(c.used_count || 0),
      usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
    };
  },

  /**
   * Disable/Delete coupon
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const res = await query(
      `UPDATE coupons SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id;`,
      [id]
    );
    return res.rowCount > 0;
  },
};
