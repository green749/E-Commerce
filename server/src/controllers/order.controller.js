import { orderRepository } from '../repositories/order.repository.js';
import { orderService } from '../services/order.service.js';
import { successResponse } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

export const orderController = {
  /**
   * GET /api/orders
   * Customer lists their own orders with pagination
   */
  async getCustomerOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

      const result = await orderRepository.findByUserId({ userId, page, limit });
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/orders/:orderNumber
   * Customer or admin gets single order by order number or ID with timeline, address, and items
   */
  async getOrderByNumber(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const userId = req.user.role === 'admin' ? null : req.user.id;

      const order = await orderRepository.findWithDetails(orderNumber, userId);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      return successResponse(res, order, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/orders/:orderNumber/cancel
   * Customer cancels order before shipping, releasing stock and starting refund
   */
  async cancelOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      const result = await orderService.cancelOrder({
        orderNumber,
        userId,
        reason,
      });

      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/orders/:orderNumber/return
   * Customer requests a return for a delivered order within 7 days
   */
  async requestReturn(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const userId = req.user.id;
      const { order_item_id, reason } = req.body;

      const result = await orderService.requestReturn({
        orderNumber,
        userId,
        orderItemId: order_item_id,
        reason,
      });

      return successResponse(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  // ==========================================================================
  // ADMIN ORDER ENDPOINTS
  // ==========================================================================

  /**
   * GET /api/admin/orders
   * Admin lists all orders with status and search filters
   */
  async getAdminOrders(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { status, payment_status, search } = req.query;

      const result = await orderRepository.findForAdmin({
        status,
        payment_status,
        search,
        page,
        limit,
      });

      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/orders/:id/status
   * Admin updates status following valid transitions: placed -> packed -> shipped -> delivered
   */
  async updateAdminOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const adminUserId = req.user.id;

      const result = await orderService.updateOrderStatusByAdmin({
        orderId: id,
        status,
        adminUserId,
        note,
      });

      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/returns
   * Admin lists all return requests
   */
  async getAdminReturns(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { status } = req.query;

      const result = await orderRepository.findReturnsForAdmin({
        status,
        page,
        limit,
      });

      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/returns/:id
   * Admin handles return: approve, reject, or refund
   */
  async handleAdminReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const adminUserId = req.user.id;

      const result = await orderService.handleReturnAction({
        returnId: id,
        action,
        reason,
        adminUserId,
      });

      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};
