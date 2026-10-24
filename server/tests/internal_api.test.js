import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { query, closeDatabase, initDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { env } from '../src/config/env.js';

describe('Internal API (/api/internal) Comprehensive Test Suite', () => {
  let adminToken;
  let testVariant;
  let testProduct;

  beforeAll(async () => {
    await initDatabase();
    await runMigrations();

    // Authenticate as admin for PATCH /api/admin/orders/:id/status tests
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shoppe.com', password: 'Admin@123' });
    adminToken = loginRes.body?.data?.accessToken;

    // Fetch an active product and variant from database
    const varRes = await query(
      `SELECT v.*, p.id as p_id, p.slug as p_slug, p.is_active as p_active
       FROM variants v
       JOIN products p ON p.id = v.product_id
       LIMIT 1;`
    );
    testVariant = varRes.rows[0];
    testProduct = { id: testVariant.p_id, slug: testVariant.p_slug };
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('1. Auth Header: X-Internal-Key (Strict & Case-Insensitive)', () => {
    it('should reject request without X-Internal-Key header with 401', async () => {
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });

    it('should reject request with wrong X-Internal-Key header with 401', async () => {
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('X-Internal-Key', 'wrong-key-1234567890abcdef')
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject legacy x-api-key header with 401', async () => {
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('x-api-key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject legacy x-internal-api-key header with 401', async () => {
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('x-internal-api-key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject Authorization: Bearer header with 401', async () => {
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('Authorization', `Bearer ${env.INTERNAL_API_KEY}`)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should accept lowercase x-internal-key header', async () => {
      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('x-internal-key', env.INTERNAL_API_KEY)
        .send({ request_id: reqId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProduct.id);
    });
  });

  describe('2. Surface Reduction (Only 5 POST Routes Allowed)', () => {
    it('should return 404 for removed GET /api/internal/orders', async () => {
      const res = await request(app)
        .get('/api/internal/orders')
        .set('X-Internal-Key', env.INTERNAL_API_KEY);

      expect(res.status).toBe(404);
    });

    it('should return 404 for removed POST /api/internal/purchases alias', async () => {
      const res = await request(app)
        .post('/api/internal/purchases')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ sku: testVariant.sku, quantity: 1, request_id: crypto.randomUUID() });

      expect(res.status).toBe(404);
    });

    it('should return 404 for removed PATCH /api/internal/orders/:id', async () => {
      const res = await request(app)
        .patch('/api/internal/orders/test-id')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ status: 'shipped' });

      expect(res.status).toBe(404);
    });
  });

  describe('3. Valid Calls for Each of the 5 Routes', () => {
    let activeOrder;

    beforeAll(async () => {
      const ts = Date.now();
      const orderRes = await query(
        `INSERT INTO orders (
          order_number, address_snapshot, subtotal, discount, shipping_fee, tax, total,
          status, payment_status
        ) VALUES ($1, '{}'::jsonb, 10000, 0, 0, 1800, 11800, 'placed', 'paid')
        RETURNING *;`,
        [`ORD-INT-TEST-${ts}`]
      );
      activeOrder = orderRes.rows[0];
    });

    it('Route 1: POST /api/internal/products/:id/pause pauses product and hides from catalog', async () => {
      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: reqId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProduct.id);

      // Verify DB column is_active = false
      const dbProd = await query(`SELECT is_active FROM products WHERE id = $1;`, [testProduct.id]);
      expect(dbProd.rows[0].is_active).toBe(false);

      // Verify public catalog hides it (404 on detail)
      const pubDetail = await request(app).get(`/api/products/${testProduct.slug}`);
      expect(pubDetail.status).toBe(404);
    });

    it('Route 2: POST /api/internal/products/:id/resume resumes product and restores in catalog', async () => {
      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/internal/products/${testProduct.id}/resume`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: reqId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProduct.id);

      // Verify DB column is_active = true
      const dbProd = await query(`SELECT is_active FROM products WHERE id = $1;`, [testProduct.id]);
      expect(dbProd.rows[0].is_active).toBe(true);

      // Verify public catalog displays it
      const pubDetail = await request(app).get(`/api/products/${testProduct.slug}`);
      expect(pubDetail.status).toBe(200);
      expect(pubDetail.body.data.id).toBe(testProduct.id);
    });

    it('Route 3: POST /api/internal/orders/:orderNumber/hold places order on hold by orderNumber', async () => {
      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/internal/orders/${activeOrder.order_number}/hold`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: reqId,
          reason: 'Manual risk assessment required',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(activeOrder.id);

      // Verify order state in DB
      const dbOrder = await query(`SELECT * FROM orders WHERE id = $1;`, [activeOrder.id]);
      expect(dbOrder.rows[0].is_held).toBe(true);
      expect(dbOrder.rows[0].status).toBe('hold');
      expect(dbOrder.rows[0].hold_reason).toBe('Manual risk assessment required');
    });

    it('Admin cannot move held order to shipped via PATCH /api/admin/orders/:id/status', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${activeOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped', note: 'Attempting to dispatch held order' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cannot move.*held order.*shipped/i);
    });

    it('Route 4: POST /api/internal/orders/:orderNumber/release releases held order by orderNumber', async () => {
      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/internal/orders/${activeOrder.order_number}/release`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: reqId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(activeOrder.id);

      // Verify order state restored in DB
      const dbOrder = await query(`SELECT * FROM orders WHERE id = $1;`, [activeOrder.id]);
      expect(dbOrder.rows[0].is_held).toBe(false);
      expect(dbOrder.rows[0].status).toBe('placed');
    });

    it('Route 5: POST /api/internal/purchase-requests creates supplier reorder request', async () => {
      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: reqId,
          sku: testVariant.sku,
          quantity: 250,
          supplier: 'Acme Garments Corp',
          requested_by: 'ops-lead-01',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      // Check DB table purchase_requests
      const dbReq = await query(`SELECT * FROM purchase_requests WHERE id = $1;`, [
        res.body.data.id,
      ]);
      expect(dbReq.rows.length).toBe(1);
      const pr = dbReq.rows[0];
      expect(pr.variant_id).toBe(testVariant.id);
      expect(pr.sku).toBe(testVariant.sku);
      expect(pr.quantity).toBe(250);
      expect(pr.supplier).toBe('Acme Garments Corp');
      expect(pr.status).toBe('requested');
      expect(pr.requested_by).toBe('ops-lead-01');
      expect(pr.request_id).toBe(reqId);
    });
  });

  describe('4. Idempotency & Audit Table (internal_actions)', () => {
    it('should return 409 with original record id on duplicate request_id and not repeat the action', async () => {
      const reqId = crypto.randomUUID();

      // Initial call
      const firstRes = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: reqId,
          sku: testVariant.sku,
          quantity: 50,
          supplier: 'Bulk Supplier Ltd',
          requested_by: 'inventory-system',
        });

      expect(firstRes.status).toBe(200);
      const originalRecordId = firstRes.body.data.id;

      // Duplicate call with exact same request_id
      const dupRes = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: reqId,
          sku: testVariant.sku,
          quantity: 999, // even with different quantity
          supplier: 'Different Supplier',
          requested_by: 'inventory-system',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(true);
      expect(dupRes.body.data.id).toBe(originalRecordId);

      // Verify in DB that only 1 purchase_requests row was created for this request_id
      const dbRows = await query(`SELECT * FROM purchase_requests WHERE request_id = $1;`, [reqId]);
      expect(dbRows.rows.length).toBe(1);
      expect(dbRows.rows[0].quantity).toBe(50); // Original quantity preserved
    });

    it('should write an audit row in internal_actions table for successful call', async () => {
      const reqId = crypto.randomUUID();

      await request(app)
        .post(`/api/internal/products/${testProduct.id}/pause`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: reqId });

      const audit = await query(`SELECT * FROM internal_actions WHERE request_id = $1;`, [reqId]);
      expect(audit.rows.length).toBe(1);
      expect(audit.rows[0].action).toBe('product_pause');
      expect(audit.rows[0].target).toBe(testProduct.id);
      expect(audit.rows[0].result_status).toBe('success');
      expect(audit.rows[0].payload.record_id).toBe(testProduct.id);
    });

    it('should write an audit row in internal_actions table for failed call', async () => {
      const reqId = crypto.randomUUID();

      const res = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: reqId,
          sku: 'UNKNOWN-SKU-FAIL',
          quantity: 10,
        });

      expect(res.status).toBe(404);

      const audit = await query(`SELECT * FROM internal_actions WHERE request_id = $1;`, [reqId]);
      expect(audit.rows.length).toBe(1);
      expect(audit.rows[0].action).toBe('purchase_request');
      expect(audit.rows[0].result_status).toBe('failure');
      expect(audit.rows[0].payload.error).toMatch(/Variant with SKU "UNKNOWN-SKU-FAIL" not found/i);
    });
  });

  describe('5. Error Handling: Unknown Product, Order, or SKU (404)', () => {
    it('should return 404 for unknown product id on pause/resume', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/internal/products/${fakeUuid}/pause`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/product not found/i);
    });

    it('should return 404 for unknown orderNumber on hold/release', async () => {
      const res = await request(app)
        .post('/api/internal/orders/ORD-NONEXISTENT-999999/hold')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID(), reason: 'Unknown order test' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/order not found/i);
    });

    it('should return 404 for unknown sku on purchase-requests', async () => {
      const res = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: crypto.randomUUID(),
          sku: 'TOTALLY-UNKNOWN-SKU',
          quantity: 10,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Variant with SKU "TOTALLY-UNKNOWN-SKU" not found/i);
    });
  });

  describe('6. Validation & Eligibility: Hold on Unpaid or Shipped Orders (422)', () => {
    let unpaidOrder;
    let shippedOrder;
    let deliveredOrder;
    let cancelledOrder;

    beforeAll(async () => {
      const createOrder = async (orderNum, status, paymentStatus) => {
        const res = await query(
          `INSERT INTO orders (
            order_number, address_snapshot, subtotal, discount, shipping_fee, tax, total,
            status, payment_status
          ) VALUES ($1, '{}'::jsonb, 5000, 0, 0, 900, 5900, $2, $3)
          RETURNING *;`,
          [orderNum, status, paymentStatus]
        );
        return res.rows[0];
      };

      const ts = Date.now();
      unpaidOrder = await createOrder(`ORD-UNPAID-${ts}`, 'pending_payment', 'unpaid');
      shippedOrder = await createOrder(`ORD-SHIPPED-${ts}`, 'shipped', 'paid');
      deliveredOrder = await createOrder(`ORD-DELIVERED-${ts}`, 'delivered', 'paid');
      cancelledOrder = await createOrder(`ORD-CANCELLED-${ts}`, 'cancelled', 'paid');
    });

    it('should return 422 when attempting to hold an unpaid order', async () => {
      const res = await request(app)
        .post(`/api/internal/orders/${unpaidOrder.order_number}/hold`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID(), reason: 'Pending payment verification' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/must be paid/i);
    });

    it('should return 422 when attempting to hold a shipped order', async () => {
      const res = await request(app)
        .post(`/api/internal/orders/${shippedOrder.order_number}/hold`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID(), reason: 'Hold after dispatch' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already in "shipped" status/i);
    });

    it('should return 422 when attempting to hold a delivered order', async () => {
      const res = await request(app)
        .post(`/api/internal/orders/${deliveredOrder.order_number}/hold`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/already in "delivered" status/i);
    });

    it('should return 422 when attempting to hold a cancelled order', async () => {
      const res = await request(app)
        .post(`/api/internal/orders/${cancelledOrder.order_number}/hold`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/already in "cancelled" status/i);
    });

    it('should return 422 when attempting to release an order that is not on hold', async () => {
      const res = await request(app)
        .post(`/api/internal/orders/${shippedOrder.order_number}/release`)
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({ request_id: crypto.randomUUID() });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/not currently on hold/i);
    });
  });

  describe('7. Purchase Requests: Zero Impact on Inventory and Orders', () => {
    it('should validate quantity bounds (1 to 100000)', async () => {
      // 0 quantity
      const resZero = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: crypto.randomUUID(),
          sku: testVariant.sku,
          quantity: 0,
        });
      expect(resZero.status).toBe(422);
      expect(resZero.body.error.message).toMatch(/between 1 and 100000/i);

      // > 100000 quantity
      const resHigh = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: crypto.randomUUID(),
          sku: testVariant.sku,
          quantity: 100001,
        });
      expect(resHigh.status).toBe(422);
      expect(resHigh.body.error.message).toMatch(/between 1 and 100000/i);
    });

    it('should leave inventory, orders, and order_items completely untouched', async () => {
      // Record state BEFORE purchase request
      const invBefore = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );
      const ordersCountBefore = await query(`SELECT count(*)::int as count FROM orders;`);
      const orderItemsCountBefore = await query(`SELECT count(*)::int as count FROM order_items;`);

      const reqId = crypto.randomUUID();
      const res = await request(app)
        .post('/api/internal/purchase-requests')
        .set('X-Internal-Key', env.INTERNAL_API_KEY)
        .send({
          request_id: reqId,
          sku: testVariant.sku,
          quantity: 500,
          supplier: 'Test Global Suppliers',
          requested_by: 'lead-purchaser',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Record state AFTER purchase request
      const invAfter = await query(
        `SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE variant_id = $1;`,
        [testVariant.id]
      );
      const ordersCountAfter = await query(`SELECT count(*)::int as count FROM orders;`);
      const orderItemsCountAfter = await query(`SELECT count(*)::int as count FROM order_items;`);

      // Verify inventory unchanged
      expect(invAfter.rows[0].quantity_on_hand).toBe(invBefore.rows[0].quantity_on_hand);
      expect(invAfter.rows[0].quantity_reserved).toBe(invBefore.rows[0].quantity_reserved);

      // Verify orders and order_items tables untouched
      expect(ordersCountAfter.rows[0].count).toBe(ordersCountBefore.rows[0].count);
      expect(orderItemsCountAfter.rows[0].count).toBe(orderItemsCountBefore.rows[0].count);
    });
  });
});
