import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { initDatabase, query, closeDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';

describe('Operational Admin Dashboard Integration Tests', () => {
  let customerToken = '';
  let customerId = '';
  let adminToken = '';
  let testProductId = '';
  let lowStockVariantId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    await runMigrations();
    await runSeed();

    // 1. Authenticate customer
    const custRes = await request(app).post('/api/auth/login').send({
      email: 'alex@example.com',
      password: 'User@123',
    });
    customerToken = custRes.body.data.accessToken;
    customerId = custRes.body.data.user.id;

    // 2. Authenticate admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@shoppe.com',
      password: 'Admin@123',
    });
    adminToken = adminRes.body.data.accessToken;

    // 3. Find a test product
    const pRes = await query(`SELECT id FROM products WHERE is_active = true LIMIT 1;`);
    testProductId = pRes.rows[0].id;

    // 4. Create an explicit low-stock variant for deterministic testing
    const lowSku = `LOW-STOCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const varRes = await query(
      `INSERT INTO variants (id, product_id, sku, size, color, price, mrp)
       VALUES ($1, $2, $3, 'M', 'Crimson', 199900, 249900)
       RETURNING id;`,
      [crypto.randomUUID(), testProductId, lowSku]
    );
    lowStockVariantId = varRes.rows[0].id;

    // Set quantity_on_hand = 3, reserved = 1 -> available = 2 <= reorder_level = 5
    await query(
      `INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
       VALUES ($1, 3, 1, 5)
       ON CONFLICT (variant_id) DO UPDATE
       SET quantity_on_hand = 3, quantity_reserved = 1, reorder_level = 5;`,
      [lowStockVariantId]
    );
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Security & Authorization Guard (requireRole admin)', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const summaryRes = await request(app).get('/api/admin/summary');
      expect(summaryRes.status).toBe(401);

      const customersRes = await request(app).get('/api/admin/customers');
      expect(customersRes.status).toBe(401);

      const customerRes = await request(app).get(`/api/admin/customers/${customerId}`);
      expect(customerRes.status).toBe(401);

      const lowStockRes = await request(app).get('/api/admin/inventory/low-stock');
      expect(lowStockRes.status).toBe(401);
    });

    it('should reject regular customer tokens with 403 Forbidden', async () => {
      const summaryRes = await request(app)
        .get('/api/admin/summary')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(summaryRes.status).toBe(403);
      expect(summaryRes.body.error.message).toMatch(/permission|forbidden|denied/i);

      const customersRes = await request(app)
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(customersRes.status).toBe(403);

      const lowStockRes = await request(app)
        .get('/api/admin/inventory/low-stock')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(lowStockRes.status).toBe(403);
    });
  });

  describe('GET /api/admin/summary', () => {
    it('should return operational dashboard summary metrics with accurate keys', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toHaveProperty('today_orders');
      expect(data).toHaveProperty('today_revenue');
      expect(data).toHaveProperty('pending_orders');
      expect(data).toHaveProperty('low_stock_count');
      expect(data).toHaveProperty('pending_returns');

      expect(typeof data.today_orders).toBe('number');
      expect(typeof data.today_revenue).toBe('number');
      expect(typeof data.pending_orders).toBe('number');
      expect(typeof data.low_stock_count).toBe('number');
      expect(typeof data.pending_returns).toBe('number');

      expect(data.low_stock_count).toBeGreaterThanOrEqual(1);
    });

    it('should accurately reflect orders created and paid today in summary metrics', async () => {
      const initialSummary = (
        await request(app)
          .get('/api/admin/summary')
          .set('Authorization', `Bearer ${adminToken}`)
      ).body.data;

      // Insert a paid order created today
      const orderNum = `ORD-TEST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const amountPaise = 250000;

      const orderRes = await query(
        `INSERT INTO orders (
          order_number, user_id, address_snapshot, subtotal, discount,
          shipping_fee, tax, total, status, payment_status, created_at
        )
        VALUES ($1, $2, '{}'::jsonb, $3, 0, 0, 0, $3, 'placed', 'paid', CURRENT_TIMESTAMP)
        RETURNING id;`,
        [orderNum, customerId, amountPaise]
      );
      const insertedOrderId = orderRes.rows[0].id;

      // Insert a pending return
      const itemRes = await query(
        `INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku, unit_price, quantity, line_total)
         VALUES ($1, $2, 'Test Product', 'TEST-SKU', $3, 1, $3)
         RETURNING id;`,
        [insertedOrderId, lowStockVariantId, amountPaise]
      );

      await query(
        `INSERT INTO returns (order_item_id, reason, status, refund_amount)
         VALUES ($1, 'Dashboard test pending return', 'requested', $2);`,
        [itemRes.rows[0].id, amountPaise]
      );

      const updatedSummary = (
        await request(app)
          .get('/api/admin/summary')
          .set('Authorization', `Bearer ${adminToken}`)
      ).body.data;

      expect(updatedSummary.today_orders).toBe(initialSummary.today_orders + 1);
      expect(updatedSummary.today_revenue).toBe(initialSummary.today_revenue + amountPaise);
      expect(updatedSummary.pending_orders).toBe(initialSummary.pending_orders + 1);
      expect(updatedSummary.pending_returns).toBe(initialSummary.pending_returns + 1);
    });
  });

  describe('GET /api/admin/customers', () => {
    it('should list customers with pagination and order statistics', async () => {
      const res = await request(app)
        .get('/api/admin/customers?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(1);
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data.total_pages).toBeGreaterThanOrEqual(1);

      // Verify customer item properties
      const customer = data.items[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('phone');
      expect(customer).toHaveProperty('role', 'customer');
      expect(customer).toHaveProperty('orders_count');
      expect(customer).toHaveProperty('total_spent');
      expect(customer).not.toHaveProperty('password_hash');
    });

    it('should search customers by name, email, or phone', async () => {
      // Search for alex
      const res = await request(app)
        .get('/api/admin/customers?search=alex')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      const match = res.body.data.items.find((c) => c.email === 'alex@example.com');
      expect(match).toBeDefined();
      expect(match.name).toMatch(/Alex/i);

      // Search for non-existent customer
      const noMatchRes = await request(app)
        .get('/api/admin/customers?search=NonExistentCustomerXYZ999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(noMatchRes.status).toBe(200);
      expect(noMatchRes.body.data.items).toHaveLength(0);
      expect(noMatchRes.body.data.total).toBe(0);
    });

    it('should respect pagination limit parameter', async () => {
      const res = await request(app)
        .get('/api/admin/customers?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.limit).toBe(1);
    });
  });

  describe('GET /api/admin/customers/:id', () => {
    it('should return customer profile, saved addresses, and orders with items', async () => {
      const res = await request(app)
        .get(`/api/admin/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const customer = res.body.data;
      expect(customer.id).toBe(customerId);
      expect(customer.email).toBe('alex@example.com');
      expect(customer).not.toHaveProperty('password_hash');

      // Addresses array
      expect(Array.isArray(customer.addresses)).toBe(true);
      expect(customer.addresses.length).toBeGreaterThanOrEqual(1);
      expect(customer.addresses[0]).toHaveProperty('city');
      expect(customer.addresses[0]).toHaveProperty('line1');

      // Orders array with line items
      expect(Array.isArray(customer.orders)).toBe(true);
      expect(customer.orders.length).toBeGreaterThanOrEqual(1);
      expect(customer.orders[0]).toHaveProperty('order_number');
      expect(customer.orders[0]).toHaveProperty('total');
      expect(Array.isArray(customer.orders[0].items)).toBe(true);

      // Aggregates
      expect(customer).toHaveProperty('total_orders');
      expect(customer).toHaveProperty('total_spent');
      expect(customer.total_orders).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent customer ID', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await request(app)
        .get(`/api/admin/customers/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('should return 422 for malformed UUID', async () => {
      const res = await request(app)
        .get('/api/admin/customers/not-a-valid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });
  });

  describe('GET /api/admin/inventory/low-stock', () => {
    it('should return variants where quantity_on_hand - quantity_reserved <= reorder_level', async () => {
      const res = await request(app)
        .get('/api/admin/inventory/low-stock')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(1);
      expect(data.total).toBeGreaterThanOrEqual(1);

      // Check low stock condition for every item
      for (const item of data.items) {
        expect(item).toHaveProperty('variant_id');
        expect(item).toHaveProperty('sku');
        expect(item).toHaveProperty('product_name');
        expect(item).toHaveProperty('quantity_on_hand');
        expect(item).toHaveProperty('quantity_reserved');
        expect(item).toHaveProperty('available');
        expect(item).toHaveProperty('reorder_level');

        // Condition check: available <= reorder_level
        expect(item.quantity_on_hand - item.quantity_reserved).toBeLessThanOrEqual(
          item.reorder_level
        );
      }

      // Check our created test variant is in the low stock list
      const found = data.items.find((i) => i.variant_id === lowStockVariantId);
      expect(found).toBeDefined();
      expect(found.quantity_on_hand).toBe(3);
      expect(found.quantity_reserved).toBe(1);
      expect(found.available).toBe(2);
      expect(found.reorder_level).toBe(5);
    });

    it('should support pagination on low-stock endpoint', async () => {
      const res = await request(app)
        .get('/api/admin/inventory/low-stock?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.limit).toBe(1);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });
});
