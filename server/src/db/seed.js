import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initDatabase, query, closeDatabase } from './index.js';
import { runMigrations } from './migrate.js';
import { logger } from '../config/logger.js';

export async function runSeed() {
  await initDatabase();
  await runMigrations();

  logger.info('Beginning database seeding for pure origin clean botanical skincare...');

  // 1. Seed Users (1 Admin, 3 Customers)
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const customerPasswordHash = await bcrypt.hash('User@123', 10);

  const users = [
    {
      id: crypto.randomUUID(),
      name: 'Pure Origin Admin',
      email: 'admin@shoppe.com',
      phone: '+91 9876543210',
      password_hash: adminPasswordHash,
      role: 'admin',
    },
    {
      id: crypto.randomUUID(),
      name: 'Sarah Mitchell',
      email: 'alex@example.com',
      phone: '+91 9123456780',
      password_hash: customerPasswordHash,
      role: 'customer',
    },
    {
      id: crypto.randomUUID(),
      name: 'Jessica Lin',
      email: 'elena@example.com',
      phone: '+91 9123456781',
      password_hash: customerPasswordHash,
      role: 'customer',
    },
    {
      id: crypto.randomUUID(),
      name: 'Maya Reynolds',
      email: 'marcus@example.com',
      phone: '+91 9123456782',
      password_hash: customerPasswordHash,
      role: 'customer',
    },
  ];

  for (const user of users) {
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, role = EXCLUDED.role;`,
      [user.id, user.name, user.email, user.phone, user.password_hash, user.role]
    );
  }
  logger.info(`Seeded ${users.length} users.`);

  // Seed default address for customer
  const alexRes = await query(`SELECT id FROM users WHERE email = $1`, ['alex@example.com']);
  const alexId = alexRes.rows[0]?.id;
  if (alexId) {
    await query(
      `INSERT INTO addresses (id, user_id, full_name, phone, line1, line2, city, state, pincode, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT DO NOTHING;`,
      [
        crypto.randomUUID(),
        alexId,
        'Sarah Mitchell',
        '+91 9123456780',
        'Gardenia Grove, Villa 12',
        '80 Feet Road, Koramangala',
        'Bengaluru',
        'Karnataka',
        '560034',
        true,
      ]
    );
  }

  // 2. Seed 6 Botanical Categories matching screenshot
  const categories = [
    {
      id: crypto.randomUUID(),
      name: 'Cleansers',
      slug: 'cleansers',
      image_url: '/images/cat-cleansers.jpg',
    },
    {
      id: crypto.randomUUID(),
      name: 'Serums',
      slug: 'serums',
      image_url: '/images/cat-serums.jpg',
    },
    {
      id: crypto.randomUUID(),
      name: 'Moisturizers',
      slug: 'moisturizers',
      image_url: '/images/cat-moisturizers.jpg',
    },
    {
      id: crypto.randomUUID(),
      name: 'Masks',
      slug: 'masks',
      image_url: '/images/cat-masks.jpg',
    },
    {
      id: crypto.randomUUID(),
      name: 'Body Care',
      slug: 'body-care',
      image_url: '/images/cat-bodycare.jpg',
    },
    {
      id: crypto.randomUUID(),
      name: 'Refills & Starter Sets',
      slug: 'refills-sets',
      image_url: '/images/starter.jpg',
    },
  ];

  const categoryMap = new Map();
  for (const cat of categories) {
    const res = await query(
      `INSERT INTO categories (id, name, slug, image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name, image_url = EXCLUDED.image_url
       RETURNING id, slug;`,
      [cat.id, cat.name, cat.slug, cat.image_url]
    );
    categoryMap.set(res.rows[0].slug, res.rows[0].id);
  }
  logger.info(`Seeded ${categories.length} botanical categories.`);

  // 3. Seed Pure Origin Skincare Products
  const productDefinitions = [
    // Cleansers
    {
      cat: 'cleansers',
      name: 'Botanical Cleanser',
      slug: 'botanical-cleanser',
      brand: 'pure origin',
      description:
        'A gentle foaming gel cleanser infused with wild green tea, aloe vera, and chamomile. Purifies pores while preserving your natural skin barrier.',
      base_price: 185000, // ₹1,850
      mrp: 220000,
      image_urls: ['/images/cat-cleansers.jpg', '/images/hero.jpg'],
      variants: [
        { sku: 'PO-CLN-100', color: 'Emerald Glass', size: '100ml', price: 185000, mrp: 220000, qty: 65 },
        { sku: 'PO-CLN-200', color: 'Emerald Glass', size: '200ml', price: 285000, mrp: 340000, qty: 40 },
      ],
    },
    {
      cat: 'cleansers',
      name: 'Gentle Cloud Milk Cleanser',
      slug: 'gentle-cloud-milk-cleanser',
      brand: 'pure origin',
      description:
        'Creamy botanical milk cleanser formulated with oat extract, jojoba oil, and calendula for delicate, sensitive skin.',
      base_price: 165000,
      mrp: 195000,
      image_urls: ['/images/cat-cleansers.jpg', '/images/science.jpg'],
      variants: [
        { sku: 'PO-MCLN-120', color: 'Frosted Glass', size: '120ml', price: 165000, mrp: 195000, qty: 50 },
      ],
    },
    {
      cat: 'cleansers',
      name: 'Hydrating Rosewater Balancing Mist',
      slug: 'hydrating-rosewater-balancing-mist',
      brand: 'pure origin',
      description:
        'Pure steam-distilled Damask rosewater blended with witch hazel and hyaluronic acid for instant dewy hydration.',
      base_price: 145000,
      mrp: 175000,
      image_urls: ['/images/science.jpg', '/images/cat-cleansers.jpg'],
      variants: [
        { sku: 'PO-MIST-100', color: 'Rose Tinted', size: '100ml', price: 145000, mrp: 175000, qty: 80 },
      ],
    },

    // Serums
    {
      cat: 'serums',
      name: 'Vitamin C Brightening Serum',
      slug: 'vitamin-c-brightening-serum',
      brand: 'pure origin',
      description:
        'Potent 15% Vitamin C serum with organic blood orange, ferulic acid, and hyaluronic acid to visibly illuminate and protect.',
      base_price: 245000, // ₹2,450
      mrp: 295000,
      image_urls: ['/images/cat-serums.jpg', '/images/hero.jpg'],
      variants: [
        { sku: 'PO-VTC-30', color: 'Amber Glass', size: '30ml', price: 245000, mrp: 295000, qty: 55 },
        { sku: 'PO-VTC-50', color: 'Amber Glass', size: '50ml', price: 345000, mrp: 410000, qty: 35 },
      ],
    },
    {
      cat: 'serums',
      name: 'Glow Face Oil',
      slug: 'glow-face-oil',
      brand: 'pure origin',
      description:
        'Cold-pressed luxury elixir combining rosehip seed, jojoba, and sea buckthorn oils for an ethereal, non-greasy golden glow.',
      base_price: 265000, // ₹2,650
      mrp: 320000,
      image_urls: ['/images/hero.jpg', '/images/cat-serums.jpg'],
      variants: [
        { sku: 'PO-GLO-30', color: 'Amber Dropper', size: '30ml', price: 265000, mrp: 320000, qty: 70 },
      ],
    },
    {
      cat: 'serums',
      name: 'Antioxidant Dew Herbal Serum',
      slug: 'antioxidant-dew-herbal-serum',
      brand: 'pure origin',
      description:
        'Concentrated green tea and rosemary extract serum designed to calm redness and strengthen cellular resilience.',
      base_price: 225000,
      mrp: 275000,
      image_urls: ['/images/science.jpg', '/images/cat-serums.jpg'],
      variants: [
        { sku: 'PO-ADEW-30', color: 'Emerald Dropper', size: '30ml', price: 225000, mrp: 275000, qty: 45 },
      ],
    },
    {
      cat: 'serums',
      name: 'Restorative Night Botanical Elixir',
      slug: 'restorative-night-botanical-elixir',
      brand: 'pure origin',
      description:
        'Overnight rejuvenating lipid serum with evening primrose, bakuchiol (plant retinol), and blue tansy essential oil.',
      base_price: 295000,
      mrp: 360000,
      image_urls: ['/images/cat-serums.jpg', '/images/science.jpg'],
      variants: [
        { sku: 'PO-NGHT-30', color: 'Cobalt Blue', size: '30ml', price: 295000, mrp: 360000, qty: 40 },
      ],
    },

    // Moisturizers
    {
      cat: 'moisturizers',
      name: 'Radiance Glow Moisturizer',
      slug: 'radiance-glow-moisturizer',
      brand: 'pure origin',
      description:
        'Rich whipped cream housed in signature frosted green glass with sustainable bamboo lid. Infused with squalane, green tea, and tri-ceramides.',
      base_price: 225000, // ₹2,250
      mrp: 275000,
      image_urls: ['/images/cat-moisturizers.jpg', '/images/hero.jpg'],
      variants: [
        { sku: 'PO-RAD-50', color: 'Bamboo Lid Glass', size: '50ml', price: 225000, mrp: 275000, qty: 60 },
        { sku: 'PO-RAD-100', color: 'Bamboo Lid Glass', size: '100ml', price: 365000, mrp: 440000, qty: 30 },
      ],
    },
    {
      cat: 'moisturizers',
      name: 'Mineral Sunscreen SPF 50',
      slug: 'mineral-sunscreen-spf-50',
      brand: 'pure origin',
      description:
        '100% non-nano zinc oxide physical sunblock in an earthy terracotta tube. Non-comedogenic, zero white-cast, reef-friendly.',
      base_price: 195000, // ₹1,950
      mrp: 240000,
      image_urls: ['/images/hero.jpg', '/images/cat-moisturizers.jpg'],
      variants: [
        { sku: 'PO-SPF-75', color: 'Terracotta Tube', size: '75ml', price: 195000, mrp: 240000, qty: 85 },
      ],
    },
    {
      cat: 'moisturizers',
      name: 'Ceramide Barrier Restore Cream',
      slug: 'ceramide-barrier-restore-cream',
      brand: 'pure origin',
      description:
        'Intensive reparative cream for compromised or dry skin with 5 essential ceramides, shea butter, and oat beta-glucan.',
      base_price: 245000,
      mrp: 295000,
      image_urls: ['/images/cat-moisturizers.jpg', '/images/science.jpg'],
      variants: [
        { sku: 'PO-CBR-50', color: 'Dark Amber Jar', size: '50ml', price: 245000, mrp: 295000, qty: 45 },
      ],
    },
    {
      cat: 'moisturizers',
      name: 'Hydrating Bamboo Water Gel Cream',
      slug: 'hydrating-bamboo-water-gel-cream',
      brand: 'pure origin',
      description:
        'Ultra-lightweight oil-free water cream infused with 72% organic bamboo water for 24-hour weightless hydration.',
      base_price: 185000,
      mrp: 220000,
      image_urls: ['/images/cat-moisturizers.jpg', '/images/cat-cleansers.jpg'],
      variants: [
        { sku: 'PO-BAM-60', color: 'Clear Glass', size: '60ml', price: 185000, mrp: 220000, qty: 50 },
      ],
    },

    // Masks
    {
      cat: 'masks',
      name: 'Purifying French Green Clay Mask',
      slug: 'purifying-french-green-clay-mask',
      brand: 'pure origin',
      description:
        'Authentic French Montmorillonite clay combined with organic spirulina and peppermint. Detoxifies, tightens pores, and clarifies complexion.',
      base_price: 175000,
      mrp: 210000,
      image_urls: ['/images/cat-masks.jpg', '/images/hero.jpg'],
      variants: [
        { sku: 'PO-CLY-100', color: 'Stone Jar', size: '100g', price: 175000, mrp: 210000, qty: 50 },
      ],
    },
    {
      cat: 'masks',
      name: 'Calming Chamomile Gel Mask',
      slug: 'calming-chamomile-gel-mask',
      brand: 'pure origin',
      description:
        'Soothing botanical jelly infused with whole chamomile petals and centella asiatica to quickly relieve sun stress and redness.',
      base_price: 165000,
      mrp: 195000,
      image_urls: ['/images/cat-masks.jpg', '/images/science.jpg'],
      variants: [
        { sku: 'PO-CHAM-100', color: 'Frosted Jar', size: '100g', price: 165000, mrp: 195000, qty: 40 },
      ],
    },
    {
      cat: 'masks',
      name: 'Matcha Green Tea Detox Mask',
      slug: 'matcha-green-tea-detox-mask',
      brand: 'pure origin',
      description:
        'Antioxidant superfood treatment blending ceremonial-grade Japanese matcha with white kaolin clay and raw honey extracts.',
      base_price: 195000,
      mrp: 235000,
      image_urls: ['/images/cat-masks.jpg', '/images/cat-cleansers.jpg'],
      variants: [
        { sku: 'PO-MAT-80', color: 'Earthy Olive Jar', size: '80g', price: 195000, mrp: 235000, qty: 45 },
      ],
    },

    // Body Care
    {
      cat: 'body-care',
      name: 'Nourishing Botanical Body Oil',
      slug: 'nourishing-botanical-body-oil',
      brand: 'pure origin',
      description:
        'Silky botanical body elixir formulated with sweet almond, jojoba, bergamot, and rosehip. Absorbs rapidly leaving skin velvet-smooth.',
      base_price: 215000,
      mrp: 260000,
      image_urls: ['/images/cat-bodycare.jpg', '/images/hero.jpg'],
      variants: [
        { sku: 'PO-BDY-200', color: 'Amber Glass Pump', size: '200ml', price: 215000, mrp: 260000, qty: 60 },
      ],
    },
    {
      cat: 'body-care',
      name: 'Botanical Sea Salt Body Polish',
      slug: 'botanical-sea-salt-body-polish',
      brand: 'pure origin',
      description:
        'Mineral-rich Dead Sea salts infused with cold-pressed coconut oil, eucalyptus, and crushed rosemary for supple full-body glow.',
      base_price: 185000,
      mrp: 220000,
      image_urls: ['/images/cat-bodycare.jpg', '/images/cat-masks.jpg'],
      variants: [
        { sku: 'PO-POL-250', color: 'Eco Tub', size: '250g', price: 185000, mrp: 220000, qty: 50 },
      ],
    },
    {
      cat: 'body-care',
      name: 'Firming Rosehip Seed Body Oil',
      slug: 'firming-rosehip-seed-body-oil',
      brand: 'pure origin',
      description:
        'Deeply replenishing body nectar rich in Omega-3 and Omega-6 fatty acids to enhance elasticity and natural skin firmness.',
      base_price: 245000,
      mrp: 295000,
      image_urls: ['/images/cat-bodycare.jpg', '/images/cat-serums.jpg'],
      variants: [
        { sku: 'PO-RHP-200', color: 'Amber Glass Pump', size: '200ml', price: 245000, mrp: 295000, qty: 45 },
      ],
    },

    // Refills & Sets
    {
      cat: 'refills-sets',
      name: 'Clean Beauty Starter Travel Kit',
      slug: 'clean-beauty-starter-travel-kit',
      brand: 'pure origin',
      description:
        'Curated 4-piece botanical skincare ritual housed in an organic olive canvas zip pouch: Botanical Cleanser (30ml), Radiance Moisturizer (15ml), Glow Face Oil (10ml), and Mineral Sunscreen (25ml).',
      base_price: 345000, // ₹3,450
      mrp: 420000,
      image_urls: ['/images/starter.jpg', '/images/hero.jpg'],
      variants: [
        { sku: 'PO-KIT-CANVAS', color: 'Olive Canvas Pouch', size: '4-Piece Kit', price: 345000, mrp: 420000, qty: 75 },
      ],
    },
    {
      cat: 'refills-sets',
      name: 'Botanical Cleanser Eco-Refill Pouch',
      slug: 'botanical-cleanser-eco-refill-pouch',
      brand: 'pure origin',
      description:
        'Eco-conscious 500ml kraft paper refill pouch. Fills your Pure Origin glass bottle 2.5 times with 70% less packaging waste.',
      base_price: 295000,
      mrp: 360000,
      image_urls: ['/images/refill.jpg', '/images/cat-cleansers.jpg'],
      variants: [
        { sku: 'PO-RFL-CLN-500', color: 'Eco Kraft Pouch', size: '500ml', price: 295000, mrp: 360000, qty: 90 },
      ],
    },
    {
      cat: 'refills-sets',
      name: 'Radiance Moisturizer Eco-Refill Pod',
      slug: 'radiance-moisturizer-eco-refill-pod',
      brand: 'pure origin',
      description:
        'Snap-in 50ml biodegradable inner pod designed to pop directly into your existing Pure Origin frosted green moisturizer jar.',
      base_price: 175000,
      mrp: 210000,
      image_urls: ['/images/refill.jpg', '/images/cat-moisturizers.jpg'],
      variants: [
        { sku: 'PO-RFL-RAD-50', color: 'Recycled Pod', size: '50ml', price: 175000, mrp: 210000, qty: 100 },
      ],
    },
  ];

  for (const p of productDefinitions) {
    const categoryId = categoryMap.get(p.cat);
    if (!categoryId) {
      logger.warn({ cat: p.cat }, 'Missing category for product definition');
      continue;
    }

    const prodRes = await query(
      `INSERT INTO products (
        id, category_id, name, slug, brand, description,
        base_price, mrp, image_urls, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name,
          category_id = EXCLUDED.category_id,
          brand = EXCLUDED.brand,
          description = EXCLUDED.description,
          base_price = EXCLUDED.base_price,
          mrp = EXCLUDED.mrp,
          image_urls = EXCLUDED.image_urls
      RETURNING id;`,
      [
        crypto.randomUUID(),
        categoryId,
        p.name,
        p.slug,
        p.brand,
        p.description,
        p.base_price,
        p.mrp,
        JSON.stringify(p.image_urls),
      ]
    );

    const productId = prodRes.rows[0].id;

    for (const v of p.variants) {
      const varRes = await query(
        `INSERT INTO variants (
          id, product_id, sku, size, color, price, mrp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (sku) DO UPDATE
        SET price = EXCLUDED.price,
            mrp = EXCLUDED.mrp,
            size = EXCLUDED.size,
            color = EXCLUDED.color
        RETURNING id;`,
        [crypto.randomUUID(), productId, v.sku, v.size, v.color, v.price, v.mrp]
      );

      const variantId = varRes.rows[0].id;

      await query(
        `INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved, reorder_level)
         VALUES ($1, $2, 0, 10)
         ON CONFLICT (variant_id) DO UPDATE
         SET quantity_on_hand = EXCLUDED.quantity_on_hand;`,
        [variantId, v.qty]
      );
    }
  }

  logger.info(`Seeded ${productDefinitions.length} botanical products with variants and inventory.`);

  // 4. Seed Promotional Coupons
  const now = new Date();
  const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const coupons = [
    {
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      min_order_amount: 100000, // ₹1,000 min in paise
      max_discount: 50000, // ₹500 max cap in paise
      starts_at: now,
      ends_at: ninetyDaysLater,
      usage_limit: 1000,
    },
    {
      code: 'BOTANICAL20',
      type: 'percent',
      value: 20,
      min_order_amount: 300000, // ₹3,000 min in paise
      max_discount: 200000, // ₹2,000 max cap in paise
      starts_at: now,
      ends_at: ninetyDaysLater,
      usage_limit: 500,
    },
    {
      code: 'FLAT500',
      type: 'flat',
      value: 50000, // flat ₹500 in paise
      min_order_amount: 250000, // min ₹2,500 in paise
      max_discount: 50000,
      starts_at: now,
      ends_at: ninetyDaysLater,
      usage_limit: 200,
    },
    {
      code: 'FREESHIP',
      type: 'flat',
      value: 9900, // flat ₹99 shipping waiver
      min_order_amount: 50000, // min ₹500 in paise
      max_discount: 9900,
      starts_at: now,
      ends_at: ninetyDaysLater,
      usage_limit: 5000,
    },
  ];

  for (const c of coupons) {
    await query(
      `INSERT INTO coupons (
        id, code, type, value, min_order_amount, max_discount,
        starts_at, ends_at, usage_limit, used_count, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, true)
      ON CONFLICT (code) DO UPDATE
      SET value = EXCLUDED.value,
          min_order_amount = EXCLUDED.min_order_amount,
          max_discount = EXCLUDED.max_discount,
          ends_at = EXCLUDED.ends_at;`,
      [
        crypto.randomUUID(),
        c.code,
        c.type,
        c.value,
        c.min_order_amount,
        c.max_discount,
        c.starts_at,
        c.ends_at,
        c.usage_limit,
      ]
    );
  }
  logger.info(`Seeded ${coupons.length} promotional coupons.`);

  // 5. Seed Historical & Live Customer Orders
  const customerRows = (await query(`SELECT id, name, email FROM users WHERE role = 'customer' LIMIT 3;`)).rows;
  const variantRows = (
    await query(
      `SELECT v.id, v.sku, v.price, p.name AS product_name 
       FROM variants v 
       JOIN products p ON p.id = v.product_id 
       LIMIT 6;`
    )
  ).rows;

  if (customerRows.length > 0 && variantRows.length > 0) {
    const orderStatuses = [
      { status: 'delivered', payment_status: 'paid', daysAgo: 6, offset: 12000 },
      { status: 'delivered', payment_status: 'paid', daysAgo: 5, offset: 18500 },
      { status: 'delivered', payment_status: 'paid', daysAgo: 4, offset: 22000 },
      { status: 'delivered', payment_status: 'paid', daysAgo: 3, offset: 34000 },
      { status: 'shipped', payment_status: 'paid', daysAgo: 2, offset: 28500 },
      { status: 'shipped', payment_status: 'paid', daysAgo: 1, offset: 19000 },
      { status: 'packed', payment_status: 'paid', daysAgo: 0, offset: 14500 },
      { status: 'placed', payment_status: 'paid', daysAgo: 0, offset: 21000 },
      { status: 'pending_payment', payment_status: 'unpaid', daysAgo: 0, offset: 8900 },
    ];

    for (let i = 0; i < orderStatuses.length; i++) {
      const spec = orderStatuses[i];
      const customer = customerRows[i % customerRows.length];
      const v1 = variantRows[i % variantRows.length];
      const v2 = variantRows[(i + 1) % variantRows.length];

      const orderDate = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000 - i * 3600000);
      const orderId = crypto.randomUUID();
      const orderNumber = `ORD-202610${15 + spec.daysAgo}-${1000 + i}`;

      const item1Price = Number(v1.price);
      const item2Price = Number(v2.price);
      const subtotal = item1Price + item2Price;
      const tax = Math.round(subtotal * 0.18);
      const shippingFee = subtotal > 150000 ? 0 : 9900;
      const total = subtotal + tax + shippingFee;

      const address = {
        name: customer.name,
        line1: '42 Lotus Enclave, 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560034',
        country: 'India',
        phone: '+91 9876543210',
      };

      await query(
        `INSERT INTO orders (
          id, order_number, user_id, address_snapshot, subtotal, discount,
          shipping_fee, tax, total, status, payment_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
        ON CONFLICT (order_number) DO NOTHING;`,
        [
          orderId,
          orderNumber,
          customer.id,
          JSON.stringify(address),
          subtotal,
          0,
          shippingFee,
          tax,
          total,
          spec.status,
          spec.payment_status,
          orderDate,
        ]
      );

      // Order items
      const item1Id = crypto.randomUUID();
      await query(
        `INSERT INTO order_items (
          id, order_id, variant_id, product_name_snapshot, sku, unit_price, quantity, line_total, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;`,
        [item1Id, orderId, v1.id, v1.product_name, v1.sku, item1Price, 1, item1Price, orderDate]
      );

      await query(
        `INSERT INTO order_items (
          id, order_id, variant_id, product_name_snapshot, sku, unit_price, quantity, line_total, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;`,
        [crypto.randomUUID(), orderId, v2.id, v2.product_name, v2.sku, item2Price, 1, item2Price, orderDate]
      );

      // Payments
      if (spec.payment_status === 'paid') {
        await query(
          `INSERT INTO payments (
            id, order_id, gateway, gateway_payment_id, amount, status, created_at
          ) VALUES ($1, $2, 'razorpay', $3, $4, 'captured', $5)
          ON CONFLICT (gateway_payment_id) DO NOTHING;`,
          [crypto.randomUUID(), orderId, `pay_test_${10000 + i}`, total, orderDate]
        );
      }

      // 1 sample return ticket
      if (i === 0) {
        await query(
          `INSERT INTO returns (
            id, order_item_id, reason, status, refund_amount, created_at
          ) VALUES ($1, $2, 'Fragrance sensitivity, requested unopened bottle exchange.', 'requested', $3, $4)
          ON CONFLICT (id) DO NOTHING;`,
          [crypto.randomUUID(), item1Id, item1Price, orderDate]
        );
      }
    }
    logger.info(`Seeded ${orderStatuses.length} realistic historical and live orders.`);
  }

  logger.info('Database seeding completed successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(async () => {
      await closeDatabase();
      logger.info('Seed process finished.');
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ error: err.message, stack: err.stack }, 'Seeding failed');
      await closeDatabase();
      process.exit(1);
    });
}
