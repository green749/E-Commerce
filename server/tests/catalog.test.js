import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';

describe('Catalog API Integration Tests (Filtering, Pagination, Full-Text Search)', () => {
  let adminToken = '';
  let customerToken = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    await runMigrations();
    await runSeed();

    // Login admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@shoppe.com',
      password: 'Admin@123',
    });
    adminToken = adminRes.body.data.accessToken;

    // Login customer
    const custRes = await request(app).post('/api/auth/login').send({
      email: 'alex@example.com',
      password: 'User@123',
    });
    customerToken = custRes.body.data.accessToken;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // --------------------------------------------------------------------------
  // 1. CATEGORIES (Tree & 5-minute In-Memory Cache)
  // --------------------------------------------------------------------------
  describe('GET /api/categories', () => {
    it('should return a hierarchical category tree with children array', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(6);

      const audioCat = res.body.data.find((c) => c.slug === 'audio-acoustics');
      expect(audioCat).toBeDefined();
      expect(Array.isArray(audioCat.children)).toBe(true);
    });

    it('should serve subsequent request from in-memory cache', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/categories');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });

  // --------------------------------------------------------------------------
  // 2. PRODUCTS (Pagination)
  // --------------------------------------------------------------------------
  describe('GET /api/products (Pagination)', () => {
    it('should return default paginated results with metadata', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(10);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(40);
      expect(res.body.data.pagination.totalPages).toBeGreaterThanOrEqual(4);
      expect(res.body.data.pagination.hasNextPage).toBe(true);
    });

    it('should return distinct items across page 1 and page 2', async () => {
      const page1Res = await request(app).get('/api/products?page=1&limit=5');
      const page2Res = await request(app).get('/api/products?page=2&limit=5');

      expect(page1Res.body.data.items.length).toBe(5);
      expect(page2Res.body.data.items.length).toBe(5);

      const page1Ids = page1Res.body.data.items.map((i) => i.id);
      const page2Ids = page2Res.body.data.items.map((i) => i.id);

      // Check no intersection between page 1 and page 2
      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. PRODUCTS (Sorting)
  // --------------------------------------------------------------------------
  describe('GET /api/products (Sorting)', () => {
    it('should sort products by price ascending (price_asc)', async () => {
      const res = await request(app).get('/api/products?sort=price_asc&limit=10');

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].base_price).toBeLessThanOrEqual(items[i + 1].base_price);
      }
    });

    it('should sort products by price descending (price_desc)', async () => {
      const res = await request(app).get('/api/products?sort=price_desc&limit=10');

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].base_price).toBeGreaterThanOrEqual(items[i + 1].base_price);
      }
    });

    it('should sort by newest by default', async () => {
      const res = await request(app).get('/api/products?sort=newest&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // 4. PRODUCTS (Filtering: Category, Price, Brand, Size, Color, Stock, Sale)
  // --------------------------------------------------------------------------
  describe('GET /api/products (Filtering)', () => {
    it('should filter by category slug (audio-acoustics)', async () => {
      const res = await request(app).get('/api/products?category=audio-acoustics');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      for (const item of res.body.data.items) {
        expect(item.category_slug).toBe('audio-acoustics');
      }
    });

    it('should filter by price range (min_price & max_price in paise)', async () => {
      const min = 1000000; // ₹10,000
      const max = 3000000; // ₹30,000
      const res = await request(app).get(`/api/products?min_price=${min}&max_price=${max}`);

      expect(res.status).toBe(200);
      for (const item of res.body.data.items) {
        expect(item.base_price).toBeGreaterThanOrEqual(min);
        expect(item.base_price).toBeLessThanOrEqual(max);
      }
    });

    it('should filter by brand', async () => {
      const res = await request(app).get('/api/products?brand=Aura%20Acoustics');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      for (const item of res.body.data.items) {
        expect(item.brand.toLowerCase()).toContain('aura acoustics');
      }
    });

    it('should filter by variant color', async () => {
      const res = await request(app).get('/api/products?color=Matte%20Black');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      for (const item of res.body.data.items) {
        const hasColor = item.variants.some((v) => v.color && v.color.toLowerCase().includes('black'));
        expect(hasColor).toBe(true);
      }
    });

    it('should filter by in_stock=true (only products with positive available quantity)', async () => {
      const res = await request(app).get('/api/products?in_stock=true&limit=20');

      expect(res.status).toBe(200);
      for (const item of res.body.data.items) {
        expect(item.total_available).toBeGreaterThan(0);
      }
    });

    it('should filter by on_sale=true (only products where mrp > base_price)', async () => {
      const res = await request(app).get('/api/products?on_sale=true');

      expect(res.status).toBe(200);
      for (const item of res.body.data.items) {
        expect(item.mrp).toBeGreaterThan(item.base_price);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. POSTGRESQL FULL-TEXT SEARCH (tsvector + GIN)
  // --------------------------------------------------------------------------
  describe('GET /api/products?q= (Full-Text Search)', () => {
    it('should search products using tsvector matching keyword "headphones"', async () => {
      const res = await request(app).get('/api/products?q=headphones');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      // Verify returned products contain matching relevance
      const matchedNames = res.body.data.items.map((i) => i.name.toLowerCase());
      expect(matchedNames.some((n) => n.includes('headphones'))).toBe(true);
    });

    it('should search products using tsvector matching "mechanical"', async () => {
      const res = await request(app).get('/api/products?q=mechanical');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should return empty list when no matching tsvector terms exist', async () => {
      const res = await request(app).get('/api/products?q=nonexistentxyzphrase999');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. PRODUCT DETAIL & RELATED PRODUCTS (/api/products/:slug)
  // --------------------------------------------------------------------------
  describe('GET /api/products/:slug', () => {
    it('should return product details with variants, stock availability, and 4 related products', async () => {
      const slug = 'aura-pro-planar-magnetic-headphones';
      const res = await request(app).get(`/api/products/${slug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe(slug);

      // Verify variants with computed available stock
      expect(Array.isArray(res.body.data.variants)).toBe(true);
      expect(res.body.data.variants.length).toBeGreaterThan(0);
      for (const v of res.body.data.variants) {
        expect(v.sku).toBeDefined();
        expect(v.price).toBeDefined();
        expect(typeof v.available).toBe('number');
        expect(v.available).toBe(v.quantity_on_hand - v.quantity_reserved);
      }

      // Verify up to 4 related products
      expect(Array.isArray(res.body.data.related_products)).toBe(true);
      expect(res.body.data.related_products.length).toBeLessThanOrEqual(4);
      for (const rel of res.body.data.related_products) {
        expect(rel.slug).not.toBe(slug); // Excludes current product
      }
    });

    it('should return 404 for non-existent product slug', async () => {
      const res = await request(app).get('/api/products/unknown-missing-product-slug');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // --------------------------------------------------------------------------
  // 7. SEARCH SUGGESTIONS (/api/search/suggestions?q=)
  // --------------------------------------------------------------------------
  describe('GET /api/search/suggestions', () => {
    it('should return up to 6 quick suggestions for query "dac"', async () => {
      const res = await request(app).get('/api/search/suggestions?q=dac');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(6);
    });

    it('should return empty array for empty search query', async () => {
      const res = await request(app).get('/api/search/suggestions?q=');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 8. ADMIN OPERATIONS (requireRole admin)
  // --------------------------------------------------------------------------
  describe('Admin Catalog Operations & Soft Delete', () => {
    let createdProdId = '';
    let createdVariantId = '';

    it('should reject non-admin from creating product with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Product',
          slug: 'unauthorized-product',
          brand: 'Brand',
          description: 'Description text',
          base_price: 1000,
          mrp: 1500,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin to create a new product', async () => {
      const timestamp = Date.now();
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Admin Test Monitor Arm ${timestamp}`,
          slug: `admin-test-monitor-arm-${timestamp}`,
          brand: 'Voltaire Studio',
          description: 'Heavy duty gas-spring monitor arm supporting up to 34 inch ultrawide displays.',
          base_price: 649900,
          mrp: 799900,
          image_urls: ['https://picsum.photos/seed/arm/800/800'],
          is_active: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      createdProdId = res.body.data.id;
    });

    it('should allow admin to create variant with initial inventory', async () => {
      const res = await request(app)
        .post('/api/admin/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: createdProdId,
          sku: `MON-ARM-BLK-${Date.now()}`,
          color: 'Matte Charcoal',
          size: 'Single Arm',
          price: 649900,
          mrp: 799900,
          quantity_on_hand: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(20);
      createdVariantId = res.body.data.id;
    });

    it('should allow admin to adjust inventory with an audit reason', async () => {
      const res = await request(app)
        .patch(`/api/admin/inventory/${createdVariantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adjustment: 15, // Add 15 units
          reason: 'Received shipment from factory warehouse',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity_on_hand).toBe(35); // 20 + 15
      expect(res.body.data.available).toBe(35);
      expect(res.body.data.adjustment_reason).toBe('Received shipment from factory warehouse');
    });

    it('should reject inventory adjustment when reason is missing', async () => {
      const res = await request(app)
        .patch(`/api/admin/inventory/${createdVariantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adjustment: 10,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should soft delete product and ensure it is immediately hidden from public catalog', async () => {
      // 1. Soft delete
      const delRes = await request(app)
        .delete(`/api/admin/products/${createdProdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // 2. Fetching deleted product publicly by slug must return 404
      const getRes = await request(app).get(`/api/products/${delRes.body.data?.slug || 'anything'}`);
      expect([404]).toContain(getRes.status);

      // 3. Deleted product must NOT appear in public catalog list
      const listRes = await request(app).get('/api/products?limit=100');
      const foundInList = listRes.body.data.items.some((p) => p.id === createdProdId);
      expect(foundInList).toBe(false);
    });
  });
});
