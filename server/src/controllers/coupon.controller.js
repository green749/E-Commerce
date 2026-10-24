import { couponRepository } from '../repositories/coupon.repository.js';
import { successResponse } from '../utils/response.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const couponController = {
  /**
   * GET /api/admin/coupons
   * List promotional coupons with search and pagination
   */
  async list(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { search, is_active } = req.query;

      const result = await couponRepository.findAll({ search, is_active, page, limit });
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/coupons
   * Create new coupon
   */
  async create(req, res, next) {
    try {
      const existing = await couponRepository.findByCode(req.body.code);
      if (existing) {
        throw new ConflictError(`Coupon code "${req.body.code.toUpperCase()}" already exists`);
      }

      const coupon = await couponRepository.create(req.body);
      return successResponse(res, coupon, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/coupons/:id
   * Update coupon fields
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await couponRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Coupon not found');
      }

      if (req.body.code && req.body.code.toUpperCase() !== existing.code) {
        const codeConflict = await couponRepository.findByCode(req.body.code);
        if (codeConflict && codeConflict.id !== id) {
          throw new ConflictError(`Coupon code "${req.body.code.toUpperCase()}" already exists`);
        }
      }

      const updated = await couponRepository.update(id, req.body);
      return successResponse(res, updated, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/coupons/:id
   * Soft-disable coupon
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await couponRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Coupon not found');
      }

      await couponRepository.delete(id);
      return successResponse(res, { message: 'Coupon successfully disabled' }, 200);
    } catch (err) {
      next(err);
    }
  },
};
