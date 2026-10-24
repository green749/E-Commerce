import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase, query } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { runRetentionArchival } from '../src/jobs/retention.job.js';

describe('Analytics Readiness & Event Ingestion Integration Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    await runMigrations();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/events (Batched, Rate-Limited, Validated)', () => {
    it('should track a single event with session_id, device_type, page_url, and properties', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .set('x-session-id', 'sess_test_mobile_123')
        .send({
          event_type: 'page_view',
          page_url: 'https://shoppe.example.com/shop',
          properties: { category: 'audiophile', sort: 'popularity' },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tracked).toBe(true);
      expect(res.body.data.count).toBe(1);

      // Verify row in database
      const dbRes = await query(
        `SELECT * FROM events WHERE session_id = 'sess_test_mobile_123' ORDER BY occurred_at DESC LIMIT 1;`
      );
      expect(dbRes.rows.length).toBe(1);
      const row = dbRes.rows[0];
      expect(row.event_type).toBe('page_view');
      expect(row.device_type).toBe('mobile');
      expect(row.page_url).toBe('https://shoppe.example.com/shop');
      expect(row.properties).toEqual({ category: 'audiophile', sort: 'popularity' });
    });

    it('should accept a batched array of events in a single call', async () => {
      const sessionId = 'sess_batch_' + Date.now();
      const batchPayload = [
        {
          event_type: 'search',
          session_id: sessionId,
          page_url: 'https://shoppe.example.com/shop?q=sennheiser',
          device_type: 'desktop',
          properties: { query: 'sennheiser', resultsCount: 4 },
        },
        {
          event_type: 'product_view',
          session_id: sessionId,
          page_url: 'https://shoppe.example.com/product/sennheiser-hd660s2',
          device_type: 'desktop',
          properties: { slug: 'sennheiser-hd660s2', price: 4999900 },
        },
        {
          event_type: 'add_to_cart',
          session_id: sessionId,
          page_url: 'https://shoppe.example.com/product/sennheiser-hd660s2',
          device_type: 'desktop',
          properties: { sku: 'SENN-660-BLK', quantity: 1, price: 4999900 },
        },
        {
          event_type: 'remove_from_cart',
          session_id: sessionId,
          page_url: 'https://shoppe.example.com/cart',
          device_type: 'desktop',
          properties: { sku: 'SENN-660-BLK', quantity: 1 },
        },
        {
          event_type: 'begin_checkout',
          session_id: sessionId,
          page_url: 'https://shoppe.example.com/checkout',
          device_type: 'desktop',
          properties: { items_count: 2, subtotal: 9999800 },
        },
        {
          event_type: 'purchase',
          session_id: sessionId,
          page_url: 'https://shoppe.example.com/order-success/ORD-999',
          device_type: 'desktop',
          properties: { orderNumber: 'ORD-999', total: 9999800 },
        },
      ];

      const res = await request(app)
        .post('/api/events')
        .send(batchPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tracked).toBe(true);
      expect(res.body.data.count).toBe(6);

      // Verify all 6 events are stored in database with matching session_id
      const dbRes = await query(
        `SELECT event_type FROM events WHERE session_id = $1;`,
        [sessionId]
      );
      expect(dbRes.rows.length).toBe(6);
      const types = dbRes.rows.map((r) => r.event_type);
      expect(types).toEqual(
        expect.arrayContaining([
          'search',
          'product_view',
          'add_to_cart',
          'remove_from_cart',
          'begin_checkout',
          'purchase',
        ])
      );
    });

    it('should reject invalid event types with validation error', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({
          event_type: 'invalid_event_action_not_allowed',
          properties: {},
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Analytics SQL Views with Incremental Sync Columns', () => {
    it('should query daily_sales view and expose updated_at timestamp', async () => {
      const res = await query(`SELECT * FROM daily_sales LIMIT 5;`);
      expect(res.rows).toBeDefined();
      if (res.rows.length > 0) {
        const row = res.rows[0];
        expect(row).toHaveProperty('sale_date');
        expect(row).toHaveProperty('total_orders');
        expect(row).toHaveProperty('completed_orders');
        expect(row).toHaveProperty('gross_sales_amount');
        expect(row).toHaveProperty('net_sales_amount');
        expect(row).toHaveProperty('updated_at');
        expect(row.updated_at).toBeInstanceOf(Date);
      }
    });

    it('should query order_funnel view and expose updated_at timestamp', async () => {
      const res = await query(`SELECT * FROM order_funnel LIMIT 5;`);
      expect(res.rows).toBeDefined();
      if (res.rows.length > 0) {
        const row = res.rows[0];
        expect(row).toHaveProperty('funnel_date');
        expect(row).toHaveProperty('device_type');
        expect(row).toHaveProperty('page_views');
        expect(row).toHaveProperty('searches');
        expect(row).toHaveProperty('add_to_carts');
        expect(row).toHaveProperty('purchases');
        expect(row).toHaveProperty('updated_at');
        expect(row.updated_at).toBeInstanceOf(Date);
      }
    });

    it('should query inventory_snapshot view and expose updated_at timestamp', async () => {
      const res = await query(`SELECT * FROM inventory_snapshot LIMIT 5;`);
      expect(res.rows.length).toBeGreaterThan(0);
      const row = res.rows[0];
      expect(row).toHaveProperty('variant_id');
      expect(row).toHaveProperty('sku');
      expect(row).toHaveProperty('product_name');
      expect(row).toHaveProperty('quantity_on_hand');
      expect(row).toHaveProperty('available_quantity');
      expect(row).toHaveProperty('is_low_stock');
      expect(row).toHaveProperty('inventory_valuation');
      expect(row).toHaveProperty('updated_at');
      expect(row.updated_at).toBeInstanceOf(Date);
    });

    it('should query returns_summary view and expose updated_at timestamp', async () => {
      const res = await query(`SELECT * FROM returns_summary LIMIT 5;`);
      expect(res.rows).toBeDefined();
      if (res.rows.length > 0) {
        const row = res.rows[0];
        expect(row).toHaveProperty('return_date');
        expect(row).toHaveProperty('status');
        expect(row).toHaveProperty('total_requests');
        expect(row).toHaveProperty('total_refund_amount');
        expect(row).toHaveProperty('updated_at');
        expect(row.updated_at).toBeInstanceOf(Date);
      }
    });
  });

  describe('Data Retention Archival Job', () => {
    it('should move events older than threshold to events_archive and delete from events', async () => {
      const oldSession = 'old_sess_' + Date.now();
      // Insert an event with occurred_at 95 days in the past
      await query(
        `INSERT INTO events (session_id, event_type, device_type, page_url, properties, occurred_at)
         VALUES ($1, 'page_view', 'mobile', 'https://shoppe.example.com/old', '{}'::jsonb, CURRENT_TIMESTAMP - INTERVAL '95 days');`,
        [oldSession]
      );

      // Run archival for records older than 90 days
      const result = await runRetentionArchival({ days: 90 });
      expect(result.archivedEventsCount).toBeGreaterThanOrEqual(1);

      // Verify row is in events_archive
      const archRes = await query(
        `SELECT * FROM events_archive WHERE session_id = $1;`,
        [oldSession]
      );
      expect(archRes.rows.length).toBe(1);
      expect(archRes.rows[0].session_id).toBe(oldSession);
      expect(archRes.rows[0]).toHaveProperty('archived_at');

      // Verify row is no longer in active events table
      const activeRes = await query(
        `SELECT * FROM events WHERE session_id = $1;`,
        [oldSession]
      );
      expect(activeRes.rows.length).toBe(0);
    });

    it('should move closed orders older than threshold to orders_archive and order_items_archive', async () => {
      const orderNumber = 'ORD-ARCHIVE-' + Date.now();
      // Insert a closed order delivered 100 days ago
      const orderRes = await query(
        `INSERT INTO orders (order_number, status, payment_status, subtotal, discount, shipping_fee, tax, total, address_snapshot, created_at, updated_at)
         VALUES ($1, 'delivered', 'paid', 200000, 0, 0, 36000, 236000, '{"line1":"123 Main St","city":"Mumbai"}'::jsonb, CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP - INTERVAL '100 days')
         RETURNING id;`,
        [orderNumber]
      );
      const orderId = orderRes.rows[0].id;

      // Insert an order item for this order
      await query(
        `INSERT INTO order_items (order_id, product_name_snapshot, sku, unit_price, quantity, line_total, created_at, updated_at)
         VALUES ($1, 'Archived Audiophile DAC', 'DAC-ARCH-01', 200000, 1, 200000, CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP - INTERVAL '100 days');`,
        [orderId]
      );

      // Run archival
      const result = await runRetentionArchival({ days: 90 });
      expect(result.archivedOrdersCount).toBeGreaterThanOrEqual(1);

      // Verify in orders_archive
      const archOrderRes = await query(
        `SELECT * FROM orders_archive WHERE order_number = $1;`,
        [orderNumber]
      );
      expect(archOrderRes.rows.length).toBe(1);
      expect(archOrderRes.rows[0].order_number).toBe(orderNumber);
      expect(archOrderRes.rows[0]).toHaveProperty('archived_at');

      // Verify in order_items_archive
      const archItemsRes = await query(
        `SELECT * FROM order_items_archive WHERE order_id = $1;`,
        [orderId]
      );
      expect(archItemsRes.rows.length).toBe(1);
      expect(archItemsRes.rows[0].sku).toBe('DAC-ARCH-01');

      // Verify deleted from active orders
      const activeOrderRes = await query(
        `SELECT * FROM orders WHERE order_number = $1;`,
        [orderNumber]
      );
      expect(activeOrderRes.rows.length).toBe(0);
    });
  });
});
