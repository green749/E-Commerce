import { productRepository } from '../repositories/product.repository.js';
import { variantRepository } from '../repositories/variant.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const catalogService = {
  /**
   * Public: Browse catalog with pagination, sorting, filters, and full-text search
   * @param {Object} queryOptions
   * @returns {Promise<{ items: Array, pagination: Object }>}
   */
  async getProducts(queryOptions) {
    const page = Math.max(1, Number(queryOptions.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryOptions.limit) || 12));

    const { items, total } = await productRepository.findPublicWithFilters({
      ...queryOptions,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Public: Get single product by slug with variants, computed stock, and 4 related products
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  async getProductBySlug(slug) {
    const product = await productRepository.findPublicBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product not found or is currently unavailable');
    }

    // Fetch up to 4 related products from the same category or brand
    const related = await productRepository.findRelated(
      product.id,
      product.category_id,
      product.brand
    );

    return {
      ...product,
      related_products: related,
    };
  },

  /**
   * Public: Search suggestions (up to 6)
   * @param {string} q
   * @returns {Promise<Array>}
   */
  async getSearchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      return [];
    }
    return productRepository.getSuggestions(q.trim());
  },

  /**
   * Admin: Create product
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createProduct(data) {
    const existing = await productRepository.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError(`Product with slug "${data.slug}" already exists`);
    }

    if (data.mrp < data.base_price) {
      throw new BadRequestError('MRP cannot be less than base price');
    }

    return productRepository.create(data);
  },

  /**
   * Admin: Update product
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateProduct(id, data) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await productRepository.findBySlug(data.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError(`Product with slug "${data.slug}" already exists`);
      }
    }

    const basePrice = data.base_price !== undefined ? data.base_price : existing.base_price;
    const mrp = data.mrp !== undefined ? data.mrp : existing.mrp;
    if (mrp < basePrice) {
      throw new BadRequestError('MRP cannot be less than base price');
    }

    return productRepository.update(id, data);
  },

  /**
   * Admin: Soft delete product (never exposed publicly afterwards)
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteProduct(id) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    await productRepository.softDelete(id);
    return true;
  },

  /**
   * Admin: Create variant with inventory record
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createVariant(data) {
    const product = await productRepository.findById(data.product_id);
    if (!product) {
      throw new NotFoundError('Target product does not exist');
    }

    const existingSku = await variantRepository.findBySku(data.sku);
    if (existingSku) {
      throw new ConflictError(`Variant with SKU "${data.sku}" already exists`);
    }

    if (data.mrp < data.price) {
      throw new BadRequestError('Variant MRP cannot be less than variant price');
    }

    const variant = await variantRepository.create(data);

    // Initialize inventory record for the variant
    const initialQty =
      data.quantity_on_hand !== undefined ? Math.max(0, Number(data.quantity_on_hand)) : 10;
    const inv = await inventoryRepository.upsert({
      variant_id: variant.id,
      quantity_on_hand: initialQty,
      reorder_level: data.reorder_level || 5,
    });

    return {
      ...variant,
      quantity_on_hand: inv.quantity_on_hand,
      quantity_reserved: inv.quantity_reserved,
      available: inv.available,
    };
  },

  /**
   * Admin: Update variant
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateVariant(id, data) {
    const existing = await variantRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Variant not found');
    }

    if (data.sku && data.sku !== existing.sku) {
      const skuConflict = await variantRepository.findBySku(data.sku);
      if (skuConflict && skuConflict.id !== id) {
        throw new ConflictError(`Variant with SKU "${data.sku}" already exists`);
      }
    }

    const price = data.price !== undefined ? data.price : existing.price;
    const mrp = data.mrp !== undefined ? data.mrp : existing.mrp;
    if (mrp < price) {
      throw new BadRequestError('Variant MRP cannot be less than variant price');
    }

    const updated = await variantRepository.update(id, data);
    const inv = await inventoryRepository.findByVariantId(id);

    return {
      ...updated,
      quantity_on_hand: inv?.quantity_on_hand ?? 0,
      quantity_reserved: inv?.quantity_reserved ?? 0,
      available: inv?.available ?? 0,
    };
  },

  /**
   * Admin: Delete variant
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteVariant(id) {
    const existing = await variantRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Variant not found');
    }

    await variantRepository.delete(id);
    return true;
  },

  /**
   * Admin: Adjust inventory stock with a mandatory audit reason
   * @param {string} variantId
   * @param {Object} options
   * @param {number} [options.quantity_on_hand]
   * @param {number} [options.adjustment]
   * @param {string} options.reason
   * @returns {Promise<Object>}
   */
  async adjustInventory(variantId, { quantity_on_hand, adjustment, reason }) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('Adjustment reason is required');
    }

    const variant = await variantRepository.findById(variantId);
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }

    const prevInventory = await inventoryRepository.findByVariantId(variantId);
    const oldQty = prevInventory?.quantity_on_hand ?? 0;

    const updatedInv = await inventoryRepository.adjustStock(variantId, {
      quantity_on_hand,
      adjustment,
    });

    logger.info(
      {
        variantId,
        sku: variant.sku,
        oldQuantity: oldQty,
        newQuantity: updatedInv.quantity_on_hand,
        reason,
      },
      `Admin adjusted inventory for variant ${variant.sku}: reason="${reason}"`
    );

    return {
      ...updatedInv,
      sku: variant.sku,
      product_id: variant.product_id,
      adjustment_reason: reason,
    };
  },

  /**
   * Admin: Get products with full variant and inventory details
   * @param {Object} queryOptions
   * @returns {Promise<Object>}
   */
  async getAdminProducts(queryOptions) {
    const page = Math.max(1, Number(queryOptions.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryOptions.limit) || 20));

    return productRepository.findForAdmin({
      ...queryOptions,
      page,
      limit,
    });
  },
};
