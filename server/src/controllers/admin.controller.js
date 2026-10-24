import { adminService } from '../services/admin.service.js';
import { successResponse } from '../utils/response.js';

export const adminController = {
  /**
   * GET /api/admin/summary
   * Operational metrics: today's orders, today's revenue, pending orders, low-stock count, pending returns
   */
  async getSummary(req, res, next) {
    try {
      const summary = await adminService.getOperationalSummary();
      return successResponse(res, summary, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/customers
   * Search and list customers with pagination and order statistics
   */
  async getCustomers(req, res, next) {
    try {
      const { search, q, page, limit } = req.query;
      const result = await adminService.getCustomers({ search, q, page, limit });
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/customers/:id
   * Customer details with addresses and order history
   */
  async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await adminService.getCustomerById(id);
      return successResponse(res, customer, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory/low-stock
   * List variants below or at reorder level
   */
  async getLowStock(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await adminService.getLowStockInventory({ page, limit });
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/inventory
   * List all inventory with optional low_stock filter and search
   */
  async getInventory(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { search, low_stock } = req.query;

      const result = await adminService.getInventory({ search, low_stock, page, limit });
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};
