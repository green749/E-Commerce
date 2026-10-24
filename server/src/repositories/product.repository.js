import { query } from '../db/index.js';

export const productRepository = {
  /**
   * Search and filter products for public catalog using a single query with joins
   * Computes available = quantity_on_hand - quantity_reserved
   * Never exposes inactive or deleted products
   * @param {Object} options
   * @returns {Promise<{ items: Array, total: number }>}
   */
  async findPublicWithFilters({
    page = 1,
    limit = 12,
    sort = 'newest',
    q = null,
    category = null,
    min_price = null,
    max_price = null,
    brand = null,
    size = null,
    color = null,
    in_stock = null,
    on_sale = null,
  }) {
    const conditions = ['p.is_active = true', 'p.deleted_at IS NULL', "p.brand = 'pure origin'"];
    const values = [];
    let idx = 1;

    // Full-text search with tsvector
    let rankSelect = '0 as search_rank';
    if (q && q.trim().length > 0) {
      values.push(q.trim());
      conditions.push(`p.search_vector @@ plainto_tsquery('english', $${idx})`);
      rankSelect = `ts_rank_cd(p.search_vector, plainto_tsquery('english', $${idx})) as search_rank`;
      idx++;
    }

    // Category filter (includes parent and child subcategories)
    if (category) {
      values.push(category.trim());
      conditions.push(`
        p.category_id IN (
          SELECT id FROM categories
          WHERE slug = $${idx}
             OR parent_id IN (SELECT id FROM categories WHERE slug = $${idx})
        )
      `);
      idx++;
    }

    // Price range
    if (min_price !== null && min_price !== undefined) {
      values.push(Number(min_price));
      conditions.push(`p.base_price >= $${idx++}`);
    }
    if (max_price !== null && max_price !== undefined) {
      values.push(Number(max_price));
      conditions.push(`p.base_price <= $${idx++}`);
    }

    // Brand filter
    if (brand) {
      values.push(brand.trim());
      conditions.push(`p.brand ILIKE $${idx++}`);
    }

    // Size filter on variants
    if (size) {
      values.push(size.trim());
      conditions.push(`
        p.id IN (
          SELECT product_id FROM variants WHERE size ILIKE $${idx++}
        )
      `);
    }

    // Color filter on variants
    if (color) {
      values.push(color.trim());
      conditions.push(`
        p.id IN (
          SELECT product_id FROM variants WHERE color ILIKE $${idx++}
        )
      `);
    }

    // On sale filter (mrp > base_price)
    if (on_sale === true || on_sale === 'true') {
      conditions.push(`p.mrp > p.base_price`);
    }

    // In stock filter (available = quantity_on_hand - quantity_reserved > 0)
    if (in_stock === true || in_stock === 'true') {
      conditions.push(`
        p.id IN (
          SELECT v.product_id
          FROM variants v
          JOIN inventory inv ON inv.variant_id = v.id
          WHERE (inv.quantity_on_hand - inv.quantity_reserved) > 0
        )
      `);
    }

    // Sorting
    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'p.base_price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'p.base_price DESC';
    } else if (sort === 'popularity') {
      orderBy = q ? 'search_rank DESC, p.created_at DESC' : 'p.created_at DESC';
    } else if (q) {
      orderBy = 'search_rank DESC, p.created_at DESC';
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Number(page) - 1) * Number(limit);

    // Single query joining categories, variants, and inventory with COUNT(*) OVER()
    const sql = `
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.slug,
        p.description,
        p.brand,
        p.base_price,
        p.mrp,
        p.image_urls,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.slug as category_slug,
        ${rankSelect},
        COUNT(*) OVER()::int as total_count,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', v.id,
              'sku', v.sku,
              'size', v.size,
              'color', v.color,
              'price', v.price,
              'mrp', v.mrp,
              'quantity_on_hand', COALESCE(inv.quantity_on_hand, 0),
              'quantity_reserved', COALESCE(inv.quantity_reserved, 0),
              'available', GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0))
            ) ORDER BY v.price ASC
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'::jsonb
        ) as variants,
        COALESCE(SUM(GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0))), 0)::int as total_available
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN variants v ON v.product_id = p.id
      LEFT JOIN inventory inv ON inv.variant_id = v.id
      WHERE ${whereClause}
      GROUP BY p.id, c.name, c.slug
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx};
    `;

    values.push(Number(limit), offset);
    const res = await query(sql, values);

    const total = res.rows[0]?.total_count || 0;
    const items = res.rows.map((row) => {
      // Remove total_count and search_rank from individual object
      const { total_count: _, search_rank: __, ...item } = row;
      return item;
    });

    return { items, total };
  },

  /**
   * Find product by slug for public detail page with variants & stock availability
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  async findPublicBySlug(slug) {
    const sql = `
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.slug,
        p.description,
        p.brand,
        p.base_price,
        p.mrp,
        p.image_urls,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', v.id,
              'sku', v.sku,
              'size', v.size,
              'color', v.color,
              'price', v.price,
              'mrp', v.mrp,
              'quantity_on_hand', COALESCE(inv.quantity_on_hand, 0),
              'quantity_reserved', COALESCE(inv.quantity_reserved, 0),
              'available', GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0))
            ) ORDER BY v.price ASC
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'::jsonb
        ) as variants,
        COALESCE(SUM(GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0))), 0)::int as total_available
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN variants v ON v.product_id = p.id
      LEFT JOIN inventory inv ON inv.variant_id = v.id
      WHERE p.slug = $1 AND p.is_active = true AND p.deleted_at IS NULL
      GROUP BY p.id, c.name, c.slug;
    `;

    const res = await query(sql, [slug]);
    return res.rows[0] || null;
  },

  /**
   * Get 4 related products for a product (same category or brand)
   * @param {string} productId
   * @param {string} categoryId
   * @param {string} brand
   * @returns {Promise<Array>}
   */
  async findRelated(productId, categoryId, brand) {
    const sql = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.brand,
        p.base_price,
        p.mrp,
        p.image_urls,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id != $1
        AND p.is_active = true
        AND p.deleted_at IS NULL
        AND (p.category_id = $2 OR p.brand = $3)
      ORDER BY (p.category_id = $2) DESC, p.created_at DESC
      LIMIT 4;
    `;

    const res = await query(sql, [productId, categoryId || null, brand || null]);
    return res.rows;
  },

  /**
   * Get quick search suggestions (up to 6)
   * @param {string} searchStr
   * @returns {Promise<Array>}
   */
  async getSuggestions(searchStr) {
    if (!searchStr || searchStr.trim().length === 0) {
      return [];
    }

    const term = searchStr.trim();
    const sql = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.brand,
        p.base_price,
        p.mrp,
        p.image_urls->0 as thumbnail,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = true
        AND p.deleted_at IS NULL
        AND (
          p.name ILIKE $1
          OR p.brand ILIKE $1
          OR p.search_vector @@ plainto_tsquery('english', $2)
        )
      ORDER BY
        (p.name ILIKE $1) DESC,
        p.created_at DESC
      LIMIT 6;
    `;

    const res = await query(sql, [`%${term}%`, term]);
    return res.rows;
  },

  /**
   * Find product by ID (for admin operations)
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Find product by slug (including inactive/deleted for conflict checks)
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug) {
    const res = await query(`SELECT * FROM products WHERE slug = $1;`, [slug]);
    return res.rows[0] || null;
  },

  /**
   * Create a new product (admin)
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const sql = `
      INSERT INTO products (
        category_id, name, slug, description, brand,
        base_price, mrp, image_urls, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, category_id, name, slug, description, brand,
                base_price, mrp, image_urls, is_active, created_at, updated_at;
    `;

    const res = await query(sql, [
      data.category_id || null,
      data.name.trim(),
      data.slug.trim(),
      data.description.trim(),
      data.brand.trim(),
      data.base_price,
      data.mrp,
      JSON.stringify(data.image_urls || []),
      data.is_active ?? true,
    ]);
    return res.rows[0];
  },

  /**
   * Update product (admin)
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      'category_id',
      'name',
      'slug',
      'description',
      'brand',
      'base_price',
      'mrp',
      'is_active',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (data.image_urls !== undefined) {
      fields.push(`image_urls = $${idx++}`);
      values.push(JSON.stringify(data.image_urls));
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, category_id, name, slug, description, brand,
                base_price, mrp, image_urls, is_active, deleted_at, created_at, updated_at;
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Soft delete product (admin)
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    const res = await query(
      `UPDATE products
       SET deleted_at = CURRENT_TIMESTAMP, is_active = false
       WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    );
    return res.rowCount > 0;
  },

  /**
   * Find products for admin with search, pagination, and full variant/stock details
   * @param {Object} options
   * @returns {Promise<{ items: Array, total: number, page: number, totalPages: number }>}
   */
  async findForAdmin({ search = '', category = '', is_active = null, page = 1, limit = 20 }) {
    const conditions = ['p.deleted_at IS NULL'];
    const values = [];
    let idx = 1;

    if (search && search.trim()) {
      conditions.push(`(p.name ILIKE $${idx} OR p.brand ILIKE $${idx} OR p.slug ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (category && category.trim()) {
      conditions.push(`c.slug = $${idx++}`);
      values.push(category.trim());
    }

    if (is_active !== null && is_active !== undefined && is_active !== '') {
      conditions.push(`p.is_active = $${idx++}`);
      values.push(is_active === 'true' || is_active === true);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int as count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${where};
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.count || 0;

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const sql = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COUNT(v.id)::int as variants_count,
        COALESCE(SUM(inv.quantity_on_hand), 0)::int as total_stock,
        COALESCE(SUM(GREATEST(0, inv.quantity_on_hand - inv.quantity_reserved)), 0)::int as total_available,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', v.id,
              'sku', v.sku,
              'size', v.size,
              'color', v.color,
              'price', v.price,
              'mrp', v.mrp,
              'quantity_on_hand', COALESCE(inv.quantity_on_hand, 0),
              'quantity_reserved', COALESCE(inv.quantity_reserved, 0),
              'available', GREATEST(0, COALESCE(inv.quantity_on_hand, 0) - COALESCE(inv.quantity_reserved, 0))
            ) ORDER BY v.created_at ASC
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'::jsonb
        ) as variants
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN variants v ON v.product_id = p.id
      LEFT JOIN inventory inv ON inv.variant_id = v.id
      ${where}
      GROUP BY p.id, c.name, c.slug
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const res = await query(sql, values);

    return {
      items: res.rows.map((p) => ({
        ...p,
        base_price: Number(p.base_price),
        mrp: Number(p.mrp),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },
};
