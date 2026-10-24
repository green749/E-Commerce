import { categoryService } from '../services/category.service.js';
import { successResponse } from '../utils/response.js';

export const categoryController = {
  /**
   * GET /api/categories - Public: Get cached hierarchical category tree
   */
  async getTree(req, res, next) {
    try {
      const tree = await categoryService.getCategoryTree();
      return successResponse(res, tree, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/categories - Admin: Create category
   */
  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return successResponse(res, category, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/categories/:id - Admin: Update category
   */
  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return successResponse(res, category, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/categories/:id - Admin: Delete category
   */
  async delete(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return successResponse(res, { message: 'Category deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  },
};
