import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { initDatabase, query, closeDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';
import { paymentService } from '../src/services/payment.service.js';
import { orderService } from '../src/services/order.service.js';
import { orderRepository } from '../src/repositories/order.repository.js';

describe('Checkout, Orders, and Payments API Integration Tests', () => {
  let customerToken = '';
  let customerId = '';
  let customer2Token = '';
  let customer2Id = '';
  let adminToken = '';

  let userAddressId = '';
  let user2AddressId = '';
  let testVariant = null;
  let limitedVariant = null;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    await runMigrations();
    await runSeed();

    // 1. Authenticate customer 1 (Alex Vance)
    const custRes = await request(app).post('/api/auth/login').send({
      email: 'alex@example.com',
      password: 'User@123',
    });
    customerToken = custRes.body.data.accessToken;
    customerId = custRes.body.data.user.id;

    // 2. Authenticate customer 2 (Elena Rostova)
    const cust2Res = await request(app).post('/api/auth/login').send({
      email: 'elena@example.com',
      password: 'User@123',
    });
    customer2Token = cust2Res.body.data.accessToken;
    customer2Id = cust2Res.body.data.user.id;

    // 3. Authenticate admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@shoppe.com',
      password: 'Admin@123',
    });
    adminToken = adminRes.body.data.accessToken;

    // 4. Get address for customer 1
    const addrRes = await request(app)
      .get('/api/me/addresses')
      .set('Authorization', `Bearer ${customerToken}`);
    userAddressId = addrRes.body.data[0].id;

    // 5. Create address for customer 2
    const addr2Res = await request(app)
      .post('/api/me/addresses')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        full_name: 'Elena Rostova',
        phone: '+91 9123456781',
        line1: 'Flat 402, Highline Residency',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        is_default: true,
      });
    user2AddressId = addr2Res.body.data.id;

    // 6. Fetch a variant with plenty of stock
    const vRes = await query(`
      SELECT v.id, v.sku, v.price, v.mrp, v.product_id, p.name as product_name
      FROM variants v
      JOIN products p ON p.id = v.product_id
      JOIN inventory i ON i.variant_id = v.id
      WHERE p.is_active = true AND p.deleted_at IS NULL AND (i.quantity_on_hand - i.quantity_reserved) >= 20
      LIMIT 1;
    `);
    testVariant = vRes.rows[0];

    // 7. Create a special limited variant with EXACTLY 2 items in stock for concurrency testing
    const limitedSku = `LIMITED-STOCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const limVRes = await query(
      `INSERT INTO variants (id, product_id, sku, size, color, price, mrp)
       VALUES ($1, $2, $3, 'Limited', 'Gold', 200000, 250000)
       RETURNING id, product_id, sku, price, mrp;`,
      [crypto.randomUUID(), testVariant.product_id, limitedSku]
    );
    limitedVariant = limVRes.rows[0];

    await query(
      `INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
       VALUES ($1, 2, 0, 1)
       ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 2, quantity_reserved = 0;`,
      [limitedVariant.id]
    );
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // ==========================================================================
  // 1. CHECKOUT START & IDEMPOTENCY
  // ==========================================================================
  describe('POST /api/checkout/start', () => {
    it('should reject checkout if active cart is empty', async () => {
      // Clear cart first
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);

      const res = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          address_id: userAddressId,
          shipping_option: 'standard',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/empty cart/i);
    });

    it('should successfully start checkout, lock inventory, create 15-min reservations, and return Razorpay details', async () => {
      // Add items to customer cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 2 });

      // Apply WELCOME10 coupon
      await request(app)
        .post('/api/cart/coupon')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'WELCOME10' });

      const idempotencyKey = crypto.randomUUID();

      const res = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          address_id: userAddressId,
          shipping_option: 'standard',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('order');
      expect(res.body.data).toHaveProperty('razorpay');

      const { order, razorpay } = res.body.data;
      expect(order.order_number).toMatch(/^ORD-/);
      expect(order.status).toBe('pending_payment');
      expect(order.payment_status).toBe('unpaid');
      expect(order.items.length).toBe(1);
      expect(order.items[0].quantity).toBe(2);
      expect(order.discount).toBeGreaterThan(0);
      expect(order.idempotency_key).toBe(idempotencyKey);

      // Verify Razorpay payload
      expect(razorpay).toHaveProperty('order_id');
      expect(razorpay.amount).toBe(order.total);
      expect(razorpay.currency).toBe('INR');

      // Verify reservations in database
      const resCheck = await query(
        `SELECT * FROM inventory_reservations WHERE order_id = $1 AND status = 'held';`,
        [order.id]
      );
      expect(resCheck.rows.length).toBe(1);
      expect(resCheck.rows[0].quantity).toBe(2);

      // Verify idempotency replay returns same order without creating duplicate
      const replayRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          address_id: userAddressId,
          shipping_option: 'standard',
        });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.success).toBe(true);
      expect(replayRes.body.data.order.order_number).toBe(order.order_number);
      expect(replayRes.body.data.idempotentReplay).toBe(true);
    });
  });

  // ==========================================================================
  // 2. OVERSELLING PREVENTION UNDER CONCURRENT REQUESTS
  // ==========================================================================
  describe('Overselling Prevention under Concurrent Requests', () => {
    it('should prevent overselling when concurrent checkouts compete for limited inventory (SELECT FOR UPDATE)', async () => {
      // limitedVariant has quantity_on_hand = 2, quantity_reserved = 0
      // Customer 1 and Customer 2 both add 2 units of limitedVariant to cart
      await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: limitedVariant.id, quantity: 2 });

      await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customer2Token}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ variant_id: limitedVariant.id, quantity: 2 });

      // Fire 2 concurrent checkout requests for the same limited variant
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/checkout/start')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ address_id: userAddressId }),
        request(app)
          .post('/api/checkout/start')
          .set('Authorization', `Bearer ${customer2Token}`)
          .send({ address_id: user2AddressId }),
      ]);

      const statuses = [res1.status, res2.status];
      // Exactly ONE request must succeed (201) and ONE must fail with 409 Conflict
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // Verify database inventory: quantity_reserved must be exactly 2, NEVER 4
      const invCheck = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [limitedVariant.id]
      );
      expect(invCheck.rows[0].quantity_on_hand).toBe(2);
      expect(invCheck.rows[0].quantity_reserved).toBe(2);
    });
  });

  // ==========================================================================
  // 3. PAYMENT VERIFICATION & COMMITMENT
  // ==========================================================================
  describe('POST /api/payments/verify', () => {
    let orderToPay = null;
    let razorpayDetails = null;

    beforeAll(async () => {
      // Reset inventory and cart
      await query(`UPDATE inventory SET quantity_reserved = 0 WHERE variant_id = $1;`, [
        testVariant.id,
      ]);
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_id: userAddressId });

      orderToPay = checkoutRes.body.data.order;
      razorpayDetails = checkoutRes.body.data.razorpay;
    });

    it('should reject payment verification with invalid signature (400)', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          order_number: orderToPay.order_number,
          razorpay_order_id: razorpayDetails.order_id,
          razorpay_payment_id: 'pay_test_fake_123',
          razorpay_signature: 'invalid_tampered_signature_hex',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid payment signature/i);
    });

    it('should verify valid signature, mark order placed, commit reservation, clear cart, and record purchase event', async () => {
      const paymentId = `pay_${crypto.randomBytes(6).toString('hex')}`;
      const validSignature = paymentService.generateTestSignature(
        razorpayDetails.order_id,
        paymentId
      );

      // Record inventory before verification
      const invBefore = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          order_number: orderToPay.order_number,
          razorpay_order_id: razorpayDetails.order_id,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('placed');
      expect(res.body.data.order.payment_status).toBe('paid');

      // 1. Verify reservation committed
      const resCheck = await query(
        `SELECT status FROM inventory_reservations WHERE order_id = $1;`,
        [orderToPay.id]
      );
      expect(resCheck.rows[0].status).toBe('committed');

      // 2. Verify stock deducted from on_hand and reserved reduced
      const invAfter = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );
      expect(invAfter.rows[0].quantity_on_hand).toBe(invBefore.rows[0].quantity_on_hand - 1);
      expect(invAfter.rows[0].quantity_reserved).toBe(invBefore.rows[0].quantity_reserved - 1);

      // 3. Verify cart was cleared
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cartRes.body.data.items.length).toBe(0);

      // 4. Verify order_status_history entry
      const historyCheck = await query(
        `SELECT * FROM order_status_history WHERE order_id = $1 AND to_status = 'placed';`,
        [orderToPay.id]
      );
      expect(historyCheck.rows.length).toBe(1);

      // 5. Verify purchase event logged
      const eventCheck = await query(
        `SELECT * FROM events WHERE user_id = $1 AND event_type = 'purchase' ORDER BY occurred_at DESC LIMIT 1;`,
        [customerId]
      );
      expect(eventCheck.rows.length).toBe(1);
    });
  });

  // ==========================================================================
  // 4. DUPLICATE WEBHOOK HANDLING (IDEMPOTENCY)
  // ==========================================================================
  describe('POST /api/payments/webhook (Idempotent Webhooks)', () => {
    let webhookOrder = null;
    let webhookRzpDetails = null;

    beforeAll(async () => {
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_id: userAddressId });

      webhookOrder = checkoutRes.body.data.order;
      webhookRzpDetails = checkoutRes.body.data.razorpay;
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_test_1',
              order_id: webhookRzpDetails.order_id,
              amount: webhookOrder.total,
            },
          },
        },
      });

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature_hex')
        .send(JSON.parse(payload));

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/webhook signature/i);
    });

    it('should handle payment.captured idempotently (duplicate webhook does not double commit or update)', async () => {
      const webhookPaymentId = `pay_hook_${crypto.randomBytes(6).toString('hex')}`;
      const payloadObj = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: webhookPaymentId,
              order_id: webhookRzpDetails.order_id,
              amount: webhookOrder.total,
              status: 'captured',
            },
          },
        },
      };

      const payloadString = JSON.stringify(payloadObj);
      const validWebhookSig = paymentService.generateWebhookSignature(payloadString);

      // First webhook delivery
      const firstRes = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validWebhookSig)
        .send(payloadObj);

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.result.status).toBe('captured');

      // Check stock after first webhook
      const invAfterFirst = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );

      // Second webhook delivery (same gateway_payment_id)
      const secondRes = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validWebhookSig)
        .send(payloadObj);

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.result.status).toBe('already_processed');

      // Stock must remain unchanged after duplicate webhook delivery
      const invAfterSecond = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );
      expect(invAfterSecond.rows[0].quantity_on_hand).toBe(invAfterFirst.rows[0].quantity_on_hand);
      expect(invAfterSecond.rows[0].quantity_reserved).toBe(invAfterFirst.rows[0].quantity_reserved);
    });

    it('should handle payment.failed webhook and release held reservations', async () => {
      // Create new checkout order
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_id: userAddressId });

      const failedOrder = checkoutRes.body.data.order;
      const failedRzp = checkoutRes.body.data.razorpay;

      const failedPaymentId = `pay_fail_${crypto.randomBytes(6).toString('hex')}`;
      const payloadObj = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: failedPaymentId,
              order_id: failedRzp.order_id,
              amount: failedOrder.total,
              status: 'failed',
            },
          },
        },
      };

      const payloadString = JSON.stringify(payloadObj);
      const signature = paymentService.generateWebhookSignature(payloadString);

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(payloadObj);

      expect(res.status).toBe(200);
      expect(res.body.result.status).toBe('failed_recorded');

      // Verify order cancelled and reservations released
      const orderCheck = await query(`SELECT status, payment_status FROM orders WHERE id = $1;`, [
        failedOrder.id,
      ]);
      expect(orderCheck.rows[0].status).toBe('cancelled');
      expect(orderCheck.rows[0].payment_status).toBe('failed');

      const resCheck = await query(
        `SELECT status FROM inventory_reservations WHERE order_id = $1;`,
        [failedOrder.id]
      );
      expect(resCheck.rows[0].status).toBe('released');
    });
  });

  // ==========================================================================
  // 5. RESERVATION EXPIRY & BACKGROUND CLEANUP JOB
  // ==========================================================================
  describe('Reservation Expiry & Background Cleanup', () => {
    it('should release expired reservations and cancel stale pending_payment orders', async () => {
      // 1. Create a checkout order
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_id: userAddressId });

      const order = checkoutRes.body.data.order;

      // 2. Artificially expire the reservation into the past
      await query(
        `UPDATE inventory_reservations
         SET expires_at = CURRENT_TIMESTAMP - INTERVAL '5 minutes'
         WHERE order_id = $1;`,
        [order.id]
      );

      // 3. Trigger the cleanup worker
      const cleanupResult = await orderService.releaseExpiredReservations();
      expect(cleanupResult.releasedCount).toBeGreaterThanOrEqual(1);
      expect(cleanupResult.cancelledOrders).toContain(order.id);

      // 4. Verify reservation is marked released
      const resCheck = await query(
        `SELECT status FROM inventory_reservations WHERE order_id = $1;`,
        [order.id]
      );
      expect(resCheck.rows[0].status).toBe('released');

      // 5. Verify order is cancelled
      const orderCheck = await query(`SELECT status, payment_status FROM orders WHERE id = $1;`, [
        order.id,
      ]);
      expect(orderCheck.rows[0].status).toBe('cancelled');
      expect(orderCheck.rows[0].payment_status).toBe('expired');
    });
  });

  // ==========================================================================
  // 6. CUSTOMER ORDER OPERATIONS & TIMELINE
  // ==========================================================================
  describe('Customer Order Endpoints', () => {
    let placedOrderNumber = '';
    let placedOrderItemId = '';

    beforeAll(async () => {
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_id: userAddressId });

      const order = checkoutRes.body.data.order;
      const rzp = checkoutRes.body.data.razorpay;

      const payId = `pay_order_test_${crypto.randomBytes(4).toString('hex')}`;
      const sig = paymentService.generateTestSignature(rzp.order_id, payId);

      const payRes = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          order_number: order.order_number,
          razorpay_order_id: rzp.order_id,
          razorpay_payment_id: payId,
          razorpay_signature: sig,
        });

      placedOrderNumber = payRes.body.data.order.order_number;
      placedOrderItemId = payRes.body.data.order.items[0].id;
    });

    it('GET /api/orders should list orders for the customer', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/orders/:orderNumber should return order with items, address snapshot, and timeline', async () => {
      const res = await request(app)
        .get(`/api/orders/${placedOrderNumber}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order_number).toBe(placedOrderNumber);
      expect(res.body.data.address_snapshot).toHaveProperty('line1');
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.timeline)).toBe(true);
      expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/orders/:orderNumber/cancel should cancel order before shipping and restore stock', async () => {
      const invBefore = await query(
        `SELECT quantity_on_hand FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );

      const res = await request(app)
        .post(`/api/orders/${placedOrderNumber}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Found a better deal' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
      expect(res.body.data.payment_status).toBe('refunded');

      // Verify stock was restored to quantity_on_hand
      const invAfter = await query(
        `SELECT quantity_on_hand FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );
      expect(invAfter.rows[0].quantity_on_hand).toBe(invBefore.rows[0].quantity_on_hand + 1);
    });
  });

  // ==========================================================================
  // 7. ADMIN ORDER MANAGEMENT & INVALID STATUS TRANSITIONS
  // ==========================================================================
  describe('Admin Order Transitions & Returns', () => {
    let adminOrder = null;

    beforeAll(async () => {
      // Create and place a new order for admin transition testing
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variant_id: testVariant.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/checkout/start')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ address_id: userAddressId });

      const order = checkoutRes.body.data.order;
      const rzp = checkoutRes.body.data.razorpay;

      const payId = `pay_admin_test_${crypto.randomBytes(4).toString('hex')}`;
      const sig = paymentService.generateTestSignature(rzp.order_id, payId);

      const payRes = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          order_number: order.order_number,
          razorpay_order_id: rzp.order_id,
          razorpay_payment_id: payId,
          razorpay_signature: sig,
        });

      adminOrder = payRes.body.data.order;
    });

    it('GET /api/admin/orders should list orders with filters', async () => {
      const res = await request(app)
        .get('/api/admin/orders?status=placed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.some((o) => o.id === adminOrder.id)).toBe(true);
    });

    it('PATCH /api/admin/orders/:id/status should reject invalid status transitions (e.g. placed -> delivered)', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${adminOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid status transition/i);
    });

    it('PATCH /api/admin/orders/:id/status should successfully transition placed -> packed -> shipped -> delivered', async () => {
      // 1. Transition: placed -> packed
      const packedRes = await request(app)
        .patch(`/api/admin/orders/${adminOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'packed', note: 'Order packed in warehouse' });
      expect(packedRes.status).toBe(200);
      expect(packedRes.body.data.status).toBe('packed');

      // 2. Transition: packed -> shipped
      const shippedRes = await request(app)
        .patch(`/api/admin/orders/${adminOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped', note: 'Handed to courier' });
      expect(shippedRes.status).toBe(200);
      expect(shippedRes.body.data.status).toBe('shipped');

      // 3. Customer cannot cancel once shipped
      const cancelAttempt = await request(app)
        .post(`/api/orders/${adminOrder.order_number}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Too late' });
      expect(cancelAttempt.status).toBe(400);
      expect(cancelAttempt.body.error.message).toMatch(/before shipping/i);

      // 4. Transition: shipped -> delivered
      const deliveredRes = await request(app)
        .patch(`/api/admin/orders/${adminOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered', note: 'Delivered to customer doorstep' });
      expect(deliveredRes.status).toBe(200);
      expect(deliveredRes.body.data.status).toBe('delivered');
    });

    it('POST /api/orders/:orderNumber/return should create return request for delivered order within 7 days', async () => {
      const orderDetails = await orderRepository.findWithDetails(adminOrder.order_number);
      const orderItemId = orderDetails.items[0].id;

      const res = await request(app)
        .post(`/api/orders/${adminOrder.order_number}/return`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          order_item_id: orderItemId,
          reason: 'Defective audio channel on right ear',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('requested');

      const returnId = res.body.data.id;

      // Admin handles return action: refund
      const refundRes = await request(app)
        .patch(`/api/admin/returns/${returnId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'refund', reason: 'Defect confirmed' });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.data.status).toBe('refunded');
    });
  });
});
