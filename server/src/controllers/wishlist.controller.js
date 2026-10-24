import { wishlistService } from '../services/wishlist.service.js';
import { successResponse } from '../utils/response.js';

export const wishlistController = {
  /**
   * GET /api/wishlist
   * List all wishlist items for authenticated user
   */
  async getWishlist(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await wishlistService.getWishlist(userId);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/wishlist
   * Add a product to the user's wishlist
   */
  async addItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { product_id } = req.body;
      const result = await wishlistService.addItem(userId, product_id);
      return successResponse(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/wishlist/:id or DELETE /api/wishlist
   * Remove a product or item from user's wishlist
   */
  async removeItem(req, res, next) {
    try {
      const userId = req.user.id;
      const identifier =
        req.params.id ||
        req.params.productId ||
        req.body?.product_id ||
        req.query?.productId ||
        req.query?.product_id;

      const result = await wishlistService.removeItem(userId, identifier);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};
