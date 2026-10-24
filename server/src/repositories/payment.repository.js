import { query } from '../db/index.js';

export const paymentRepository = {
  /**
   * Create a payment record
   * @param {Object} params
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async create(
    {
      order_id,
      gateway = 'razorpay',
      gateway_order_id = null,
      gateway_payment_id = null,
      amount,
      status = 'created',
      raw_payload = {},
    },
    client = query
  ) {
    const sql = `
      INSERT INTO payments (
        order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, raw_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, raw_payload, created_at, updated_at;
    `;
    const res = await client(sql, [
      order_id,
      gateway,
      gateway_order_id,
      gateway_payment_id,
      amount,
      status,
      JSON.stringify(raw_payload || {}),
    ]);
    return res.rows[0];
  },

  /**
   * Find payment by unique gateway payment ID (e.g. 'pay_...')
   * @param {string} gatewayPaymentId
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findByGatewayPaymentId(gatewayPaymentId, client = query) {
    const res = await client(`SELECT * FROM payments WHERE gateway_payment_id = $1;`, [
      gatewayPaymentId,
    ]);
    return res.rows[0] || null;
  },

  /**
   * Find payments for an order
   * @param {string} orderId
   * @param {Function} [client]
   * @returns {Promise<Array>}
   */
  async findByOrderId(orderId, client = query) {
    const res = await client(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC;`,
      [orderId]
    );
    return res.rows;
  },

  /**
   * Find payment by gateway order ID
   * @param {string} gatewayOrderId
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findByGatewayOrderId(gatewayOrderId, client = query) {
    const res = await client(
      `SELECT * FROM payments WHERE gateway_order_id = $1 ORDER BY created_at DESC LIMIT 1;`,
      [gatewayOrderId]
    );
    return res.rows[0] || null;
  },

  /**
   * Update payment status and gateway payment ID
   * @param {string} id
   * @param {Object} data
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async update(id, { status, gateway_payment_id = null, raw_payload = null }, client = query) {
    const fields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [status];
    let idx = 2;

    if (gateway_payment_id !== undefined && gateway_payment_id !== null) {
      fields.push(`gateway_payment_id = $${idx++}`);
      values.push(gateway_payment_id);
    }
    if (raw_payload !== undefined && raw_payload !== null) {
      fields.push(`raw_payload = $${idx++}`);
      values.push(JSON.stringify(raw_payload));
    }

    values.push(id);
    const sql = `
      UPDATE payments
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    const res = await client(sql, values);
    return res.rows[0];
  },
};
