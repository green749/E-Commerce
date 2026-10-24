import { authService } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';

export const userController = {
  /**
   * GET /api/me - Retrieve current authenticated user profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return successResponse(res, user, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/me - Update profile fields (name, phone)
   */
  async updateProfile(req, res, next) {
    try {
      const updated = await authService.updateProfile(req.user.id, req.body);
      return successResponse(res, updated, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/me/password - Change password
   */
  async changePassword(req, res, next) {
    try {
      const result = await authService.changePassword(req.user.id, req.body);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};
