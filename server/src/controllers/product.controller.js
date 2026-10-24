import { catalogService } from '../services/catalog.service.js';
import { successResponse } from '../utils/response.js';

export const productController = {
  /**
   * GET /api/products - Public: Browse products with pagination, sorting, filters, and full-text search
   */
  async getProducts(req, res, next) {
    try {
      const result = await catalogService.getProducts(req.query);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/products/:slug - Public: Get single product by slug with variants, stock, and 4 related products
   */
  async getBySlug(req, res, next) {
    try {
      const product = await catalogService.getProductBySlug(req.params.slug);
      return successResponse(res, product, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/search/suggestions?q= - Public: Quick search suggestions (up to 6)
   */
  async getSuggestions(req, res, next) {
    try {
      const suggestions = await catalogService.getSearchSuggestions(req.query.q);
      return successResponse(res, suggestions, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/products - Admin: Create product
   */
  async createProduct(req, res, next) {
    try {
      const product = await catalogService.createProduct(req.body);
      return successResponse(res, product, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/products/:id - Admin: Update product
   */
  async updateProduct(req, res, next) {
    try {
      const product = await catalogService.updateProduct(req.params.id, req.body);
      return successResponse(res, product, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/products/:id - Admin: Soft delete product
   */
  async deleteProduct(req, res, next) {
    try {
      await catalogService.deleteProduct(req.params.id);
      return successResponse(res, { message: 'Product successfully deleted' }, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/variants - Admin: Create variant
   */
  async createVariant(req, res, next) {
    try {
      const variant = await catalogService.createVariant(req.body);
      return successResponse(res, variant, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/variants/:id - Admin: Update variant
   */
  async updateVariant(req, res, next) {
    try {
      const variant = await catalogService.updateVariant(req.params.id, req.body);
      return successResponse(res, variant, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/variants/:id - Admin: Delete variant
   */
  async deleteVariant(req, res, next) {
    try {
      await catalogService.deleteVariant(req.params.id);
      return successResponse(res, { message: 'Variant successfully deleted' }, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/inventory/:variantId - Admin: Adjust stock with reason
   */
  async adjustInventory(req, res, next) {
    try {
      const result = await catalogService.adjustInventory(req.params.variantId, req.body);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/products - Admin: List products with search, pagination, and variants
   */
  async getAdminProducts(req, res, next) {
    try {
      const result = await catalogService.getAdminProducts(req.query);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};
