import { addressService } from '../services/address.service.js';
import { successResponse } from '../utils/response.js';

export const addressController = {
  /**
   * GET /api/me/addresses - List all addresses for user
   */
  async list(req, res, next) {
    try {
      const addresses = await addressService.listAddresses(req.user.id);
      return successResponse(res, addresses, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/me/addresses/:id - Get single address
   */
  async getById(req, res, next) {
    try {
      const address = await addressService.getAddress(req.user.id, req.params.id);
      return successResponse(res, address, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/me/addresses - Create address
   */
  async create(req, res, next) {
    try {
      const address = await addressService.createAddress(req.user.id, req.body);
      return successResponse(res, address, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/me/addresses/:id - Update address
   */
  async update(req, res, next) {
    try {
      const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
      return successResponse(res, address, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/me/addresses/:id - Delete address
   */
  async delete(req, res, next) {
    try {
      await addressService.deleteAddress(req.user.id, req.params.id);
      return successResponse(res, { message: 'Address deleted successfully' }, 200);
    } catch (err) {
      next(err);
    }
  },
};
