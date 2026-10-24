import { query } from '../db/index.js';

export const orderRepository = {
  /**
   * Find order by ID
   * @param {string} orderId
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findById(orderId, client = query) {
    const res = await client(`SELECT * FROM orders WHERE id = $1;`, [orderId]);
    return res.rows[0] || null;
  },

  /**
   * Find order by order number (e.g. 'ORD-20261020-XXXX')
   * @param {string} orderNumber
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findByOrderNumber(orderNumber, client = query) {
    const res = await client(`SELECT * FROM orders WHERE order_number = $1;`, [orderNumber]);
    return res.rows[0] || null;
  },

  /**
   * Find order by Idempotency-Key
   * @param {string} key
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findByIdempotencyKey(key, client = query) {
    if (!key) return null;
    const res = await client(`SELECT * FROM orders WHERE idempotency_key = $1;`, [key]);
    return res.rows[0] || null;
  },

  /**
   * Create an order record
   * @param {Object} data
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async create(data, client = query) {
    const sql = `
      INSERT INTO orders (
        order_number, user_id, address_snapshot, subtotal, discount,
        shipping_fee, tax, total, coupon_id, status, payment_status, idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const res = await client(sql, [
      data.order_number,
      data.user_id,
      JSON.stringify(data.address_snapshot),
      data.subtotal,
      data.discount || 0,
      data.shipping_fee || 0,
      data.tax || 0,
      data.total,
      data.coupon_id || null,
      data.status || 'pending_payment',
      data.payment_status || 'unpaid',
      data.idempotency_key || null,
    ]);
    return res.rows[0];
  },

  /**
   * Insert line items snapshots for an order
   * @param {string} orderId
   * @param {Array} items
   * @param {Function} [client]
   * @returns {Promise<Array>}
   */
  async createItems(orderId, items, client = query) {
    const inserted = [];
    for (const item of items) {
      const sql = `
        INSERT INTO order_items (
          order_id, variant_id, product_name_snapshot, sku, unit_price, quantity, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const res = await client(sql, [
        orderId,
        item.variant_id,
        item.name || item.product_name,
        item.sku,
        item.price,
        item.quantity,
        item.line_total || item.price * item.quantity,
      ]);
      inserted.push(res.rows[0]);
    }
    return inserted;
  },

  /**
   * Log order status transition to order_status_history
   * @param {Object} params
   * @param {string} params.order_id
   * @param {string|null} [params.from_status]
   * @param {string} params.to_status
   * @param {string|null} [params.changed_by]
   * @param {string|null} [params.note]
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async addStatusHistory(
    { order_id, from_status = null, to_status, changed_by = null, note = null },
    client = query
  ) {
    const sql = `
      INSERT INTO order_status_history (
        order_id, from_status, to_status, changed_by, note
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await client(sql, [order_id, from_status, to_status, changed_by, note]);
    return res.rows[0];
  },

  /**
   * Update order status and payment status with optional status history entry
   * @param {string} orderId
   * @param {Object} params
   * @param {string} params.status
   * @param {string} [params.payment_status]
   * @param {string} [params.changed_by]
   * @param {string} [params.note]
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async updateStatus(
    orderId,
    { status, payment_status = null, changed_by = null, note = null },
    client = query
  ) {
    const current = await this.findById(orderId, client);
    if (!current) return null;

    const fields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [status];
    let idx = 2;

    if (payment_status) {
      fields.push(`payment_status = $${idx++}`);
      values.push(payment_status);
    }

    values.push(orderId);
    const sql = `
      UPDATE orders
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    const res = await client(sql, values);
    const updated = res.rows[0];

    // Log status history transition
    if (current.status !== status) {
      await this.addStatusHistory(
        {
          order_id: orderId,
          from_status: current.status,
          to_status: status,
          changed_by,
          note,
        },
        client
      );
    }

    return updated;
  },

  /**
   * Put an order on hold
   * @param {string} orderId
   * @param {Object} options
   * @param {string} [options.reason]
   * @param {string|null} [options.changed_by]
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async holdOrder(orderId, { reason = 'Placed on hold', changed_by = null } = {}, client = query) {
    const current = await this.findById(orderId, client);
    if (!current) return null;

    const sql = `
      UPDATE orders
      SET is_held = true,
          held_at = CURRENT_TIMESTAMP,
          hold_reason = $1,
          previous_status = COALESCE(previous_status, status),
          status = 'hold',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const res = await client(sql, [reason, orderId]);
    const updated = res.rows[0];

    await this.addStatusHistory(
      {
        order_id: orderId,
        from_status: current.status,
        to_status: 'hold',
        changed_by,
        note: reason,
      },
      client
    );

    return updated;
  },

  /**
   * Release an order from hold
   * @param {string} orderId
   * @param {Object} options
   * @param {string} [options.note]
   * @param {string|null} [options.changed_by]
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async releaseOrder(orderId, { note = 'Released from hold', changed_by = null } = {}, client = query) {
    const current = await this.findById(orderId, client);
    if (!current) return null;

    const targetStatus = current.previous_status && current.previous_status !== 'hold'
      ? current.previous_status
      : 'placed';

    const sql = `
      UPDATE orders
      SET is_held = false,
          held_at = NULL,
          hold_reason = NULL,
          status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const res = await client(sql, [targetStatus, orderId]);
    const updated = res.rows[0];

    await this.addStatusHistory(
      {
        order_id: orderId,
        from_status: current.status,
        to_status: targetStatus,
        changed_by,
        note,
      },
      client
    );

    return updated;
  },

  /**
   * Get single order with complete line items, address, payments, and timeline
   * @param {string} identifier - order_number or order ID (UUID)
   * @param {string|null} [userId=null] - for customer access verification
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findWithDetails(identifier, userId = null, client = query) {
    let orderSql = `SELECT o.* FROM orders o WHERE (o.order_number = $1 OR o.id::text = $1)`;
    const params = [identifier];

    if (userId) {
      orderSql += ` AND o.user_id = $2`;
      params.push(userId);
    }

    const orderRes = await client(orderSql, params);
    const order = orderRes.rows[0];
    if (!order) return null;

    // Fetch line items
    const itemsRes = await client(
      `SELECT oi.*, p.image_urls as product_images
       FROM order_items oi
       LEFT JOIN variants v ON v.id = oi.variant_id
       LEFT JOIN products p ON p.id = v.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.created_at ASC;`,
      [order.id]
    );

    // Fetch payments
    const paymentsRes = await client(
      `SELECT id, gateway, gateway_order_id, gateway_payment_id, amount, status, created_at
       FROM payments
       WHERE order_id = $1
       ORDER BY created_at DESC;`,
      [order.id]
    );

    // Fetch status history timeline
    const historyRes = await client(
      `SELECT osh.*, u.name as changed_by_name
       FROM order_status_history osh
       LEFT JOIN users u ON u.id = osh.changed_by
       WHERE osh.order_id = $1
       ORDER BY osh.created_at ASC;`,
      [order.id]
    );

    // Fetch reservations (if pending_payment)
    const reservationsRes = await client(
      `SELECT id, variant_id, quantity, expires_at, status
       FROM inventory_reservations
       WHERE order_id = $1;`,
      [order.id]
    );

    return {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping_fee: Number(order.shipping_fee),
      tax: Number(order.tax),
      total: Number(order.total),
      items: itemsRes.rows.map((i) => ({
        ...i,
        unit_price: Number(i.unit_price),
        line_total: Number(i.line_total),
      })),
      payments: paymentsRes.rows.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      timeline: historyRes.rows,
      reservations: reservationsRes.rows,
    };
  },

  /**
   * Find list of customer orders with pagination
   * @param {Object} params
   * @param {string} params.userId
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @returns {Promise<{ items: Array, total: number, page: number, totalPages: number }>}
   */
  async findByUserId({ userId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const countRes = await query(`SELECT COUNT(*)::int as count FROM orders WHERE user_id = $1;`, [
      userId,
    ]);
    const total = countRes.rows[0]?.count || 0;

    const ordersRes = await query(
      `SELECT o.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', oi.id,
                  'product_name', oi.product_name_snapshot,
                  'sku', oi.sku,
                  'unit_price', oi.unit_price,
                  'quantity', oi.quantity,
                  'line_total', oi.line_total
                )
              ) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3;`,
      [userId, limit, offset]
    );

    return {
      items: ordersRes.rows.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        shipping_fee: Number(o.shipping_fee),
        tax: Number(o.tax),
        total: Number(o.total),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find orders for admin with filtering and pagination
   * @param {Object} options
   * @returns {Promise<{ items: Array, total: number, page: number, totalPages: number }>}
   */
  async findForAdmin({
    status = null,
    payment_status = null,
    search = null,
    page = 1,
    limit = 20,
  }) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      values.push(status);
    }
    if (payment_status) {
      conditions.push(`o.payment_status = $${idx++}`);
      values.push(payment_status);
    }
    if (search && search.trim().length > 0) {
      const term = search.trim();
      conditions.push(
        `(o.order_number ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx})`
      );
      values.push(`%${term}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int as count
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ${whereClause};
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.count || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    values.push(offset);

    const sql = `
      SELECT o.*,
             u.name as customer_name,
             u.email as customer_email,
             COUNT(oi.id)::int as items_count
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereClause}
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const res = await query(sql, values);

    return {
      items: res.rows.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        shipping_fee: Number(o.shipping_fee),
        tax: Number(o.tax),
        total: Number(o.total),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find order item by ID (used for returns)
   * @param {string} orderItemId
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findOrderItemById(orderItemId, client = query) {
    const res = await client(
      `SELECT oi.*, o.order_number, o.status as order_status, o.user_id, o.updated_at as order_updated_at
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = $1;`,
      [orderItemId]
    );
    return res.rows[0] || null;
  },

  /**
   * Create a return record
   * @param {Object} data
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async createReturn(
    { order_item_id, reason, refund_amount, status = 'requested' },
    client = query
  ) {
    const sql = `
      INSERT INTO returns (order_item_id, reason, status, refund_amount)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const res = await client(sql, [order_item_id, reason, status, refund_amount]);
    return res.rows[0];
  },

  /**
   * Find return by ID
   * @param {string} returnId
   * @param {Function} [client]
   * @returns {Promise<Object|null>}
   */
  async findReturnById(returnId, client = query) {
    const sql = `
      SELECT r.*,
             oi.product_name_snapshot,
             oi.sku,
             oi.quantity as item_quantity,
             oi.unit_price,
             oi.line_total,
             oi.variant_id,
             o.id as order_id,
             o.order_number,
             o.status as order_status,
             o.user_id,
             p.gateway_payment_id
      FROM returns r
      JOIN order_items oi ON oi.id = r.order_item_id
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'captured'
      WHERE r.id = $1;
    `;
    const res = await client(sql, [returnId]);
    return res.rows[0] || null;
  },

  /**
   * Update return status and refund amount
   * @param {string} returnId
   * @param {Object} data
   * @param {Function} [client]
   * @returns {Promise<Object>}
   */
  async updateReturn(returnId, { status, refund_amount = null }, client = query) {
    const fields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [status];
    let idx = 2;

    if (refund_amount !== null && refund_amount !== undefined) {
      fields.push(`refund_amount = $${idx++}`);
      values.push(refund_amount);
    }

    values.push(returnId);
    const sql = `
      UPDATE returns
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    const res = await client(sql, values);
    return res.rows[0];
  },

  /**
   * Find returns for admin
   * @param {Object} options
   * @returns {Promise<{ items: Array, total: number, page: number, totalPages: number }>}
   */
  async findReturnsForAdmin({ status = null, page = 1, limit = 20 }) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) {
      conditions.push(`r.status = $${idx++}`);
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT COUNT(*)::int as count FROM returns r ${whereClause};`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.count || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    values.push(offset);

    const sql = `
      SELECT r.*,
             oi.product_name_snapshot,
             oi.sku,
             oi.unit_price,
             oi.quantity as item_quantity,
             o.order_number,
             u.name as customer_name,
             u.email as customer_email
      FROM returns r
      JOIN order_items oi ON oi.id = r.order_item_id
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN users u ON u.id = o.user_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const res = await query(sql, values);
    return {
      items: res.rows.map((r) => ({
        ...r,
        refund_amount: Number(r.refund_amount),
        unit_price: Number(r.unit_price),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
};
