import { query, withTransaction } from '../db/index.js';
import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const internalService = {
  /**
   * Check if a request_id has already succeeded in internal_actions
   * @param {string} requestId
   * @returns {Promise<{ isDuplicate: boolean, originalRecordId?: string }>}
   */
  async checkIdempotency(requestId) {
    if (!requestId) {
      throw new ValidationError('request_id is required');
    }
    const res = await query(
      `SELECT * FROM internal_actions WHERE request_id = $1 AND result_status = 'success';`,
      [requestId]
    );
    if (res.rows.length > 0) {
      const action = res.rows[0];
      const originalRecordId = action.payload?.record_id || action.target;
      return { isDuplicate: true, originalRecordId };
    }
    return { isDuplicate: false };
  },

  /**
   * Record audit row in internal_actions table (supports upsert if prior attempt failed)
   */
  async recordAction(
    client,
    { requestId, action, target = null, payload = {}, resultStatus = 'success' }
  ) {
    if (!requestId) return;
    await client(
      `INSERT INTO internal_actions (request_id, action, target, payload, result_status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (request_id) DO UPDATE
       SET action = EXCLUDED.action,
           target = EXCLUDED.target,
           payload = EXCLUDED.payload,
           result_status = EXCLUDED.result_status,
           updated_at = CURRENT_TIMESTAMP;`,
      [requestId, action, target, JSON.stringify(payload), resultStatus]
    );
  },

  /**
   * Record failure audit entry outside transaction
   */
  async recordFailure({ requestId, action, target = null, payload = {}, error }) {
    if (!requestId) return;
    try {
      await this.recordAction(query, {
        requestId,
        action,
        target,
        payload: { ...payload, error: error?.message || String(error) },
        resultStatus: 'failure',
      });
    } catch {
      // Ignore secondary audit logging error to preserve original error
    }
  },

  /**
   * Helper to resolve product by UUID or slug
   */
  async resolveProduct(identifier) {
    if (!identifier) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );
    if (isUuid) {
      return await productRepository.findById(identifier);
    }
    return await productRepository.findBySlug(identifier);
  },

  /**
   * 1. POST /api/internal/products/:id/pause
   * @param {Object} params
   * @param {string} params.id - product UUID or slug
   * @param {string} params.requestId
   */
  async pauseProduct({ id, requestId }) {
    const idempotency = await this.checkIdempotency(requestId);
    if (idempotency.isDuplicate) {
      return { duplicate: true, originalRecordId: idempotency.originalRecordId };
    }

    const product = await this.resolveProduct(id);
    if (!product) {
      const err = new NotFoundError('Product not found');
      await this.recordFailure({
        requestId,
        action: 'product_pause',
        target: id,
        payload: { id },
        error: err,
      });
      throw err;
    }

    try {
      return await withTransaction(async (tx) => {
        await tx(
          `UPDATE products
           SET is_active = false, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1;`,
          [product.id]
        );

        await this.recordAction(tx, {
          requestId,
          action: 'product_pause',
          target: product.id,
          payload: { record_id: product.id, product_id: product.id, slug: product.slug },
          resultStatus: 'success',
        });

        return { duplicate: false, id: product.id };
      });
    } catch (err) {
      await this.recordFailure({
        requestId,
        action: 'product_pause',
        target: product.id,
        payload: { id: product.id },
        error: err,
      });
      throw err;
    }
  },

  /**
   * 2. POST /api/internal/products/:id/resume
   * @param {Object} params
   * @param {string} params.id - product UUID or slug
   * @param {string} params.requestId
   */
  async resumeProduct({ id, requestId }) {
    const idempotency = await this.checkIdempotency(requestId);
    if (idempotency.isDuplicate) {
      return { duplicate: true, originalRecordId: idempotency.originalRecordId };
    }

    const product = await this.resolveProduct(id);
    if (!product) {
      const err = new NotFoundError('Product not found');
      await this.recordFailure({
        requestId,
        action: 'product_resume',
        target: id,
        payload: { id },
        error: err,
      });
      throw err;
    }

    try {
      return await withTransaction(async (tx) => {
        await tx(
          `UPDATE products
           SET is_active = true, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1;`,
          [product.id]
        );

        await this.recordAction(tx, {
          requestId,
          action: 'product_resume',
          target: product.id,
          payload: { record_id: product.id, product_id: product.id, slug: product.slug },
          resultStatus: 'success',
        });

        return { duplicate: false, id: product.id };
      });
    } catch (err) {
      await this.recordFailure({
        requestId,
        action: 'product_resume',
        target: product.id,
        payload: { id: product.id },
        error: err,
      });
      throw err;
    }
  },

  /**
   * 3. POST /api/internal/orders/:orderNumber/hold
   * @param {Object} params
   * @param {string} params.orderNumber
   * @param {string} params.requestId
   * @param {string} [params.reason]
   */
  async holdOrder({ orderNumber, requestId, reason = 'Placed on hold via internal API' }) {
    const idempotency = await this.checkIdempotency(requestId);
    if (idempotency.isDuplicate) {
      return { duplicate: true, originalRecordId: idempotency.originalRecordId };
    }

    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      const err = new NotFoundError('Order not found');
      await this.recordFailure({
        requestId,
        action: 'order_hold',
        target: orderNumber,
        payload: { orderNumber, reason },
        error: err,
      });
      throw err;
    }

    // Must be paid
    if (order.payment_status !== 'paid') {
      const err = new ValidationError(
        `Order cannot be put on hold: order must be paid (current payment_status: "${order.payment_status}")`
      );
      await this.recordFailure({
        requestId,
        action: 'order_hold',
        target: orderNumber,
        payload: { orderNumber, payment_status: order.payment_status, reason },
        error: err,
      });
      throw err;
    }

    // Must not be shipped, delivered, or cancelled (or returned)
    const nonHoldableStatuses = ['shipped', 'delivered', 'cancelled', 'returned'];
    if (nonHoldableStatuses.includes(order.status)) {
      const err = new ValidationError(
        `Order cannot be put on hold: order is already in "${order.status}" status`
      );
      await this.recordFailure({
        requestId,
        action: 'order_hold',
        target: orderNumber,
        payload: { orderNumber, status: order.status, reason },
        error: err,
      });
      throw err;
    }

    try {
      return await withTransaction(async (tx) => {
        await tx(
          `UPDATE orders
           SET is_held = true,
               held_at = CURRENT_TIMESTAMP,
               hold_reason = $1,
               previous_status = COALESCE(previous_status, status),
               status = 'hold',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2;`,
          [reason, order.id]
        );

        await orderRepository.addStatusHistory(
          {
            order_id: order.id,
            from_status: order.status,
            to_status: 'hold',
            note: reason,
          },
          tx
        );

        await this.recordAction(tx, {
          requestId,
          action: 'order_hold',
          target: order.order_number,
          payload: {
            record_id: order.id,
            order_id: order.id,
            order_number: order.order_number,
            reason,
          },
          resultStatus: 'success',
        });

        return { duplicate: false, id: order.id };
      });
    } catch (err) {
      await this.recordFailure({
        requestId,
        action: 'order_hold',
        target: order.order_number,
        payload: { orderNumber, reason },
        error: err,
      });
      throw err;
    }
  },

  /**
   * 4. POST /api/internal/orders/:orderNumber/release
   * @param {Object} params
   * @param {string} params.orderNumber
   * @param {string} params.requestId
   */
  async releaseOrder({ orderNumber, requestId }) {
    const idempotency = await this.checkIdempotency(requestId);
    if (idempotency.isDuplicate) {
      return { duplicate: true, originalRecordId: idempotency.originalRecordId };
    }

    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      const err = new NotFoundError('Order not found');
      await this.recordFailure({
        requestId,
        action: 'order_release',
        target: orderNumber,
        payload: { orderNumber },
        error: err,
      });
      throw err;
    }

    if (!order.is_held && order.status !== 'hold') {
      const err = new ValidationError('Order is not currently on hold');
      await this.recordFailure({
        requestId,
        action: 'order_release',
        target: orderNumber,
        payload: { orderNumber, is_held: order.is_held, status: order.status },
        error: err,
      });
      throw err;
    }

    try {
      return await withTransaction(async (tx) => {
        const targetStatus =
          order.previous_status && order.previous_status !== 'hold'
            ? order.previous_status
            : 'placed';

        await tx(
          `UPDATE orders
           SET is_held = false,
               held_at = NULL,
               hold_reason = NULL,
               status = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2;`,
          [targetStatus, order.id]
        );

        await orderRepository.addStatusHistory(
          {
            order_id: order.id,
            from_status: order.status,
            to_status: targetStatus,
            note: 'Released from hold via internal API',
          },
          tx
        );

        await this.recordAction(tx, {
          requestId,
          action: 'order_release',
          target: order.order_number,
          payload: {
            record_id: order.id,
            order_id: order.id,
            order_number: order.order_number,
          },
          resultStatus: 'success',
        });

        return { duplicate: false, id: order.id };
      });
    } catch (err) {
      await this.recordFailure({
        requestId,
        action: 'order_release',
        target: order.order_number,
        payload: { orderNumber },
        error: err,
      });
      throw err;
    }
  },

  /**
   * 5. POST /api/internal/purchase-requests
   * Reorder request to supplier.
   * Must NOT deduct stock and must NOT create rows in orders or order_items.
   * @param {Object} params
   * @param {string} params.requestId
   * @param {string} params.sku
   * @param {number} params.quantity
   * @param {string} [params.supplier]
   * @param {string} [params.requestedBy]
   */
  async createPurchaseRequest({ requestId, sku, quantity, supplier = null, requestedBy = null }) {
    const idempotency = await this.checkIdempotency(requestId);
    if (idempotency.isDuplicate) {
      return { duplicate: true, originalRecordId: idempotency.originalRecordId };
    }

    const trimmedSku = sku?.trim();
    if (!trimmedSku) {
      const err = new ValidationError('sku is required');
      await this.recordFailure({
        requestId,
        action: 'purchase_request',
        target: null,
        payload: { sku, quantity, supplier, requested_by: requestedBy },
        error: err,
      });
      throw err;
    }

    // Lookup variant by variants.sku (404 if not found)
    const varRes = await query(
      `SELECT id, product_id, sku, price, mrp FROM variants WHERE sku = $1;`,
      [trimmedSku]
    );
    const variant = varRes.rows[0];
    if (!variant) {
      const err = new NotFoundError(`Variant with SKU "${trimmedSku}" not found`);
      await this.recordFailure({
        requestId,
        action: 'purchase_request',
        target: trimmedSku,
        payload: { sku: trimmedSku, quantity, supplier, requested_by: requestedBy },
        error: err,
      });
      throw err;
    }

    // Validate quantity 1 to 100000
    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty < 1 || numQty > 100000) {
      const err = new ValidationError('Quantity must be an integer between 1 and 100000');
      await this.recordFailure({
        requestId,
        action: 'purchase_request',
        target: trimmedSku,
        payload: { sku: trimmedSku, quantity, supplier, requested_by: requestedBy },
        error: err,
      });
      throw err;
    }

    try {
      return await withTransaction(async (tx) => {
        // Insert row in purchase_requests table (inventory, orders, order_items untouched!)
        const insRes = await tx(
          `INSERT INTO purchase_requests (
            variant_id, sku, quantity, supplier, status, requested_by, request_id
          ) VALUES ($1, $2, $3, $4, 'requested', $5, $6)
          RETURNING id;`,
          [variant.id, trimmedSku, numQty, supplier || null, requestedBy || null, requestId]
        );
        const purchaseRequestId = insRes.rows[0].id;

        await this.recordAction(tx, {
          requestId,
          action: 'purchase_request',
          target: trimmedSku,
          payload: {
            record_id: purchaseRequestId,
            variant_id: variant.id,
            sku: trimmedSku,
            quantity: numQty,
            supplier,
            requested_by: requestedBy,
          },
          resultStatus: 'success',
        });

        return { duplicate: false, id: purchaseRequestId };
      });
    } catch (err) {
      await this.recordFailure({
        requestId,
        action: 'purchase_request',
        target: trimmedSku,
        payload: { sku: trimmedSku, quantity: numQty, supplier, requested_by: requestedBy },
        error: err,
      });
      throw err;
    }
  },
};
