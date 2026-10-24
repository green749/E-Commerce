import { adminRepository } from '../repositories/admin.repository.js';
import { NotFoundError } from '../utils/errors.js';

export const adminService = {
  /**
   * Get operational summary for admin dashboard:
   * today's orders, today's revenue, pending orders, low-stock count, pending returns
   * @returns {Promise<Object>}
   */
  async getOperationalSummary() {
    return adminRepository.getOperationalSummary();
  },

  /**
   * List customers with search, pagination, and order statistics
   * @param {Object} params
   * @param {string} [params.search]
   * @param {string} [params.q]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @returns {Promise<Object>}
   */
  async getCustomers({ search, q, page = 1, limit = 20 }) {
    const searchTerm = (search || q || '').trim();
    return adminRepository.findCustomers({ search: searchTerm, page, limit });
  },

  /**
   * Get customer details by ID with their addresses and order history
   * @param {string} id - customer UUID
   * @returns {Promise<Object>}
   */
  async getCustomerById(id) {
    const customer = await adminRepository.findCustomerById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return customer;
  },

  /**
   * Get list of variants where available stock is below or equal to reorder level
   * @param {Object} params
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @returns {Promise<Object>}
   */
  async getLowStockInventory({ page = 1, limit = 50 }) {
    return adminRepository.getLowStockInventory({ page, limit });
  },

  /**
   * Get paginated inventory items with optional low stock and search filtering
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async getInventory({ search, low_stock, page = 1, limit = 20 }) {
    return adminRepository.findInventory({
      search: (search || '').trim(),
      low_stock_only: low_stock === 'true' || low_stock === true,
      page,
      limit,
    });
  },
};
