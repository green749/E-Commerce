import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { initDatabase, query, closeDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';

describe('Cart and Wishlist APIs Integration Tests', () => {
  let customerToken = '';
  let customerId = '';
  let customer2Token = '';
  let customer2Id = '';

  let availableVariant1 = null;
  let availableVariant2 = null;
  let lowStockVariant = null;
  let testProductId = null;

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

    // 3. Find variants with ample stock
    const varRes = await query(`
      SELECT v.id, v.product_id, v.sku, v.price, v.mrp,
             GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0)) as available
      FROM variants v
      JOIN products p ON p.id = v.product_id
      LEFT JOIN inventory inv ON inv.variant_id = v.id
      WHERE p.is_active = true AND p.deleted_at IS NULL
        AND (COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0)) >= 15
      LIMIT 2;
    `);

    availableVariant1 = varRes.rows[0];
    availableVariant2 = varRes.rows[1];
    testProductId = availableVariant1.product_id;

    // 4. Create a specific low-stock variant (only 3 in stock) for boundary testing
    const testSku = `TEST-LOW-STOCK-${crypto.randomUUID().slice(0, 8)}`;
    const lowStockVarRes = await query(
      `INSERT INTO variants (id, product_id, sku, size, color, price, mrp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, product_id, sku, price, mrp;`,
      [
        crypto.randomUUID(),
        testProductId,
        testSku,
        'Standard',
        'Red',
        150000, // ₹1,500
        199900,
      ]
    );
    lowStockVariant = lowStockVarRes.rows[0];

    await query(
      `INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
       VALUES ($1, 3, 0, 1)
       ON CONFLICT (variant_id) DO UPDATE SET quantity_on_hand = 3, quantity_reserved = 0;`,
      [lowStockVariant.id]
    );

    // 5. Create specific coupons for edge-case testing
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const future = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Inactive coupon
    await query(
      `INSERT INTO coupons (id, code, type, value, min_order_amount, starts_at, ends_at, is_active)
       VALUES ($1, 'INACTIVE50', 'percent', 50, 0, $2, $3, false)
       ON CONFLICT (code) DO NOTHING;`,
      [crypto.randomUUID(), past, future]
    );

    // Expired coupon
    await query(
      `INSERT INTO coupons (id, code, type, value, min_order_amount, starts_at, ends_at, is_active)
       VALUES ($1, 'EXPIRED20', 'percent', 20, 0, $2, $3, true)
       ON CONFLICT (code) DO NOTHING;`,
      [crypto.randomUUID(), new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), past]
    );

    // Exhausted coupon (usage_limit = 5, used_count = 5)
    await query(
      `INSERT INTO coupons (id, code, type, value, min_order_amount, starts_at, ends_at, usage_limit, used_count, is_active)
       VALUES ($1, 'MAXEDOUT', 'flat', 10000, 0, $2, $3, 5, 5, true)
       ON CONFLICT (code) DO NOTHING;`,
      [crypto.randomUUID(), past, future]
    );

    // High min-order coupon (min order ₹50,000 / 5,000,000 paise)
    await query(
      `INSERT INTO coupons (id, code, type, value, min_order_amount, starts_at, ends_at, is_active)
       VALUES ($1, 'BIGSPENDER', 'percent', 30, 5000000, $2, $3, true)
       ON CONFLICT (code) DO NOTHING;`,
      [crypto.randomUUID(), past, future]
    );
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // ==========================================================================
  // 1. GUEST CART OPERATIONS
  // ==========================================================================
  describe('Guest Cart Functionality', () => {
    let guestSessionCookie = '';
    let guestItemId = '';

    it('GET /api/cart should initialize a new guest cart and set session_id cookie', async () => {
      const res = await request(app).get('/api/cart');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.user_id).toBeNull();
      expect(res.body.data.session_id).toBeTruthy();
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.subtotal).toBe(0);
      expect(res.body.data.total).toBe(0);

      // Verify session cookie or header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c) => c.startsWith('session_id='));
      expect(sessionCookie).toBeDefined();
      guestSessionCookie = sessionCookie.split(';')[0];
    });

    it('POST /api/cart/items should add an item to the guest cart', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Cookie', guestSessionCookie)
        .send({
          variant_id: availableVariant1.id,
          quantity: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);

      const item = res.body.data.items[0];
      expect(item.variant_id).toBe(availableVariant1.id);
      expect(item.quantity).toBe(2);
      expect(item.price).toBe(Number(availableVariant1.price));
      expect(item.line_total).toBe(Number(availableVariant1.price) * 2);

      // Check subtotal, tax, shipping, and total calculation
      expect(res.body.data.subtotal).toBe(item.line_total);
      expect(res.body.data.tax).toBe(Math.round(item.line_total * 0.18));
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.warnings)).toBe(true);

      guestItemId = item.id;
    });

    it('PATCH /api/cart/items/:id should update line item quantity', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${guestItemId}`)
        .set('Cookie', guestSessionCookie)
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const updatedItem = res.body.data.items.find((i) => i.id === guestItemId);
      expect(updatedItem.quantity).toBe(4);
      expect(res.body.data.item_count).toBe(4);
    });

    it('DELETE /api/cart/items/:id should remove the line item from cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/${guestItemId}`)
        .set('Cookie', guestSessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.subtotal).toBe(0);
      expect(res.body.data.total).toBe(0);
    });

    it('DELETE /api/cart should clear the entire cart', async () => {
      // First add an item back
      await request(app)
        .post('/api/cart/items')
        .set('Cookie', guestSessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 1 });

      const clearRes = await request(app)
        .delete('/api/cart')
        .set('Cookie', guestSessionCookie);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.success).toBe(true);
      expect(clearRes.body.data.items).toEqual([]);
      expect(clearRes.body.data.subtotal).toBe(0);
    });
  });

  // ==========================================================================
  // 2. QUANTITY & STOCK VALIDATION
  // ==========================================================================
  describe('Cart Stock & Quantity Rules', () => {
    let sessionCookie = '';

    beforeAll(async () => {
      const init = await request(app).get('/api/cart');
      const cookies = init.headers['set-cookie'];
      sessionCookie = cookies.find((c) => c.startsWith('session_id=')).split(';')[0];
    });

    it('should reject quantity < 1', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 0 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject quantity > 10 (exceeds max per item)', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 11 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error)).toMatch(/10/);
    });

    it('should reject cumulative quantity exceeding 10', async () => {
      // Add 6 units
      const firstRes = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 6 });
      expect(firstRes.status).toBe(201);

      // Try adding 5 more (total would be 11)
      const secondRes = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 5 });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error.message).toMatch(/exceed the maximum limit of 10/);
    });

    it('should reject adding quantity exceeding available stock', async () => {
      // lowStockVariant has available stock = 3
      const res = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: lowStockVariant.id, quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Only 3 unit\(s\) available in stock/);
    });

    it('should allow adding within available stock boundary', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: lowStockVariant.id, quantity: 3 });

      expect(res.status).toBe(201);
      const lowStockItem = res.body.data.items.find((i) => i.variant_id === lowStockVariant.id);
      expect(lowStockItem).toBeDefined();
      expect(lowStockItem.quantity).toBe(3);
    });

    it('should adjust cart quantity and return warnings if inventory drops', async () => {
      // Artificially drop lowStockVariant inventory to 1 on-hand
      await query(`UPDATE inventory SET quantity_on_hand = 1 WHERE variant_id = $1`, [
        lowStockVariant.id,
      ]);

      // Fetch cart again
      const res = await request(app).get('/api/cart').set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      const lowStockItem = res.body.data.items.find((i) => i.variant_id === lowStockVariant.id);
      expect(lowStockItem).toBeDefined();
      expect(lowStockItem.quantity).toBe(1); // Adjusted down to 1
      expect(res.body.data.warnings.length).toBeGreaterThan(0);
      expect(res.body.data.warnings.some((w) => w.includes('dropped to 1'))).toBe(true);

      // Restore inventory
      await query(`UPDATE inventory SET quantity_on_hand = 5 WHERE variant_id = $1`, [
        lowStockVariant.id,
      ]);
    });
  });

  // ==========================================================================
  // 3. COUPON VALIDATION & PRICING RULES
  // ==========================================================================
  describe('Coupon Application & Calculation Rules', () => {
    let sessionCookie = '';

    beforeAll(async () => {
      const init = await request(app).get('/api/cart');
      const cookies = init.headers['set-cookie'];
      sessionCookie = cookies.find((c) => c.startsWith('session_id=')).split(';')[0];

      // Add item to have some subtotal
      await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 1 });
    });

    it('should return 404 for non-existent coupon code', async () => {
      const res = await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', sessionCookie)
        .send({ code: 'DOESNOTEXIST123' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/does not exist/);
    });

    it('should reject inactive coupon with clear error message', async () => {
      const res = await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', sessionCookie)
        .send({ code: 'INACTIVE50' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/inactive or disabled/);
    });

    it('should reject expired coupon with clear error message', async () => {
      const res = await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', sessionCookie)
        .send({ code: 'EXPIRED20' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/expired/);
    });

    it('should reject coupon when usage limit is reached', async () => {
      const res = await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', sessionCookie)
        .send({ code: 'MAXEDOUT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/usage limit has been reached/);
    });

    it('should reject coupon when cart subtotal is below minimum order amount', async () => {
      const res = await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', sessionCookie)
        .send({ code: 'BIGSPENDER' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/below the required minimum order amount/);
    });

    it('should successfully apply valid percentage coupon (WELCOME10) and calculate discount', async () => {
      // Make sure cart has enough for WELCOME10 (min ₹1,000 / 100,000 paise)
      await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant2.id, quantity: 2 });

      const res = await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', sessionCookie)
        .send({ code: 'WELCOME10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.coupon).toBeDefined();
      expect(res.body.data.coupon.code).toBe('WELCOME10');
      expect(res.body.data.discount).toBeGreaterThan(0);

      // Verify discount formula (10% capped at max_discount 50,000 paise)
      const expectedDiscount = Math.min(
        50000,
        Math.round((res.body.data.subtotal * 10) / 100)
      );
      expect(res.body.data.discount).toBe(expectedDiscount);

      // Verify total computation: taxableBase + shipping + tax
      const taxableBase = res.body.data.subtotal - res.body.data.discount;
      const expectedTax = Math.round(taxableBase * 0.18);
      expect(res.body.data.tax).toBe(expectedTax);
      expect(res.body.data.total).toBe(taxableBase + res.body.data.shipping_fee + expectedTax);
    });

    it('DELETE /api/cart/coupon should remove coupon and reset discount', async () => {
      const res = await request(app)
        .delete('/api/cart/coupon')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.coupon).toBeNull();
      expect(res.body.data.discount).toBe(0);
    });
  });

  // ==========================================================================
  // 4. CART MERGE ON LOGIN
  // ==========================================================================
  describe('Cart Merge on Login', () => {
    it('should merge guest cart items into authenticated user cart upon login', async () => {
      // 1. Create a guest session and add 2 items
      const guestInit = await request(app).get('/api/cart');
      const cookies = guestInit.headers['set-cookie'];
      const guestCookie = cookies.find((c) => c.startsWith('session_id=')).split(';')[0];
      const guestSessionId = guestInit.body.data.session_id;

      await request(app)
        .post('/api/cart/items')
        .set('Cookie', guestCookie)
        .send({ variant_id: availableVariant1.id, quantity: 2 });

      // Apply WELCOME10 coupon in guest cart
      await request(app)
        .post('/api/cart/coupon')
        .set('Cookie', guestCookie)
        .send({ code: 'WELCOME10' });

      // 2. Customer 2 (Elena) starts with an empty cart
      await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customer2Token}`);

      // 3. Customer 2 logs in while presenting the guest session cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Cookie', guestCookie)
        .send({
          email: 'elena@example.com',
          password: 'User@123',
          session_id: guestSessionId,
        });

      expect(loginRes.status).toBe(200);

      // 4. Check Customer 2 cart now contains the merged guest items and transferred coupon
      const userCartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(userCartRes.status).toBe(200);
      expect(userCartRes.body.data.user_id).toBe(customer2Id);
      expect(userCartRes.body.data.items.length).toBeGreaterThanOrEqual(1);

      const mergedItem = userCartRes.body.data.items.find(
        (i) => i.variant_id === availableVariant1.id
      );
      expect(mergedItem).toBeDefined();
      expect(mergedItem.quantity).toBe(2);
      expect(userCartRes.body.data.coupon?.code).toBe('WELCOME10');

      // 5. Verify the guest cart was marked as converted
      const checkGuestCart = await query(
        `SELECT status FROM carts WHERE session_id = $1 AND user_id IS NULL;`,
        [guestSessionId]
      );
      expect(checkGuestCart.rows[0].status).toBe('converted');
    });
  });

  // ==========================================================================
  // 5. WISHLIST OPERATIONS (Logged-in only)
  // ==========================================================================
  describe('Wishlist Functionality', () => {
    it('should reject unauthenticated requests to /api/wishlist with 401', async () => {
      const getRes = await request(app).get('/api/wishlist');
      expect(getRes.status).toBe(401);

      const postRes = await request(app)
        .post('/api/wishlist')
        .send({ product_id: testProductId });
      expect(postRes.status).toBe(401);

      const delRes = await request(app).delete(`/api/wishlist/${testProductId}`);
      expect(delRes.status).toBe(401);
    });

    it('POST /api/wishlist should add product for authenticated customer', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: testProductId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product_id).toBe(testProductId);
    });

    it('POST /api/wishlist should be idempotent on duplicate addition', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: testProductId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/wishlist should reject non-existent product with 404', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_id: crypto.randomUUID() });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/Product not found/);
    });

    it('GET /api/wishlist should return items with product details and stock status', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);

      const wishItem = res.body.data.items.find((i) => i.product_id === testProductId);
      expect(wishItem).toBeDefined();
      expect(wishItem).toHaveProperty('name');
      expect(wishItem).toHaveProperty('slug');
      expect(wishItem).toHaveProperty('base_price');
      expect(wishItem).toHaveProperty('in_stock');
      expect(typeof wishItem.in_stock).toBe('boolean');
    });

    it('DELETE /api/wishlist/:id should remove product from wishlist', async () => {
      const res = await request(app)
        .delete(`/api/wishlist/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it no longer appears in GET /api/wishlist
      const listRes = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);
      const deletedItem = listRes.body.data.items.find((i) => i.product_id === testProductId);
      expect(deletedItem).toBeUndefined();
    });
  });

  // ==========================================================================
  // 6. ANALYTICS EVENTS LOGGING
  // ==========================================================================
  describe('Analytics Events Logging (add_to_cart & remove_from_cart)', () => {
    it('should record add_to_cart and remove_from_cart events in the events table', async () => {
      const sessionRes = await request(app).get('/api/cart');
      const cookies = sessionRes.headers['set-cookie'];
      const sessionCookie = cookies.find((c) => c.startsWith('session_id=')).split(';')[0];
      const sessionId = sessionRes.body.data.session_id;

      // Add item to cart
      const addRes = await request(app)
        .post('/api/cart/items')
        .set('Cookie', sessionCookie)
        .send({ variant_id: availableVariant1.id, quantity: 2 });

      expect(addRes.status).toBe(201);
      const itemId = addRes.body.data.items[0].id;

      // Check events table for add_to_cart event
      const addEventRes = await query(
        `SELECT event_type, session_id, properties
         FROM events
         WHERE session_id = $1 AND event_type = 'add_to_cart'
         ORDER BY occurred_at DESC
         LIMIT 1;`,
        [sessionId]
      );

      expect(addEventRes.rows.length).toBe(1);
      const addEvent = addEventRes.rows[0];
      expect(addEvent.event_type).toBe('add_to_cart');
      const addProps = typeof addEvent.properties === 'string'
        ? JSON.parse(addEvent.properties)
        : addEvent.properties;
      expect(addProps.variant_id).toBe(availableVariant1.id);
      expect(addProps.quantity_added).toBe(2);

      // Remove item from cart
      const delRes = await request(app)
        .delete(`/api/cart/items/${itemId}`)
        .set('Cookie', sessionCookie);

      expect(delRes.status).toBe(200);

      // Check events table for remove_from_cart event
      const removeEventRes = await query(
        `SELECT event_type, session_id, properties
         FROM events
         WHERE session_id = $1 AND event_type = 'remove_from_cart'
         ORDER BY occurred_at DESC
         LIMIT 1;`,
        [sessionId]
      );

      expect(removeEventRes.rows.length).toBe(1);
      const removeEvent = removeEventRes.rows[0];
      expect(removeEvent.event_type).toBe('remove_from_cart');
      const removeProps = typeof removeEvent.properties === 'string'
        ? JSON.parse(removeEvent.properties)
        : removeEvent.properties;
      expect(removeProps.variant_id).toBe(availableVariant1.id);
      expect(removeProps.quantity_removed).toBe(2);
    });
  });
});
