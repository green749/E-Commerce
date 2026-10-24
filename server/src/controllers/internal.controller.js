import { internalService } from '../services/internal.service.js';

export const internalController = {
  /**
   * POST /api/internal/products/:id/pause
   * Body: { request_id }
   */
  async pauseProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { request_id } = req.body || {};
      const result = await internalService.pauseProduct({ id, requestId: request_id });

      if (result.duplicate) {
        return res.status(409).json({
          success: true,
          data: { id: result.originalRecordId },
        });
      }

      return res.status(200).json({
        success: true,
        data: { id: result.id },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/internal/products/:id/resume
   * Body: { request_id }
   */
  async resumeProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { request_id } = req.body || {};
      const result = await internalService.resumeProduct({ id, requestId: request_id });

      if (result.duplicate) {
        return res.status(409).json({
          success: true,
          data: { id: result.originalRecordId },
        });
      }

      return res.status(200).json({
        success: true,
        data: { id: result.id },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/internal/orders/:orderNumber/hold
   * Body: { request_id, reason }
   */
  async holdOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const { request_id, reason } = req.body || {};
      const result = await internalService.holdOrder({
        orderNumber,
        requestId: request_id,
        reason,
      });

      if (result.duplicate) {
        return res.status(409).json({
          success: true,
          data: { id: result.originalRecordId },
        });
      }

      return res.status(200).json({
        success: true,
        data: { id: result.id },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/internal/orders/:orderNumber/release
   * Body: { request_id }
   */
  async releaseOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const { request_id } = req.body || {};
      const result = await internalService.releaseOrder({
        orderNumber,
        requestId: request_id,
      });

      if (result.duplicate) {
        return res.status(409).json({
          success: true,
          data: { id: result.originalRecordId },
        });
      }

      return res.status(200).json({
        success: true,
        data: { id: result.id },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/internal/purchase-requests
   * Body: { request_id, sku, quantity, supplier, requested_by }
   */
  async createPurchaseRequest(req, res, next) {
    try {
      const { request_id, sku, quantity, supplier, requested_by } = req.body || {};
      const result = await internalService.createPurchaseRequest({
        requestId: request_id,
        sku,
        quantity,
        supplier,
        requestedBy: requested_by,
      });

      if (result.duplicate) {
        return res.status(409).json({
          success: true,
          data: { id: result.originalRecordId },
        });
      }

      return res.status(200).json({
        success: true,
        data: { id: result.id },
      });
    } catch (err) {
      next(err);
    }
  },
};
