import apiClient from './axios.js';

export const adminApi = {
  // Operational Summary
  getSummary: async () => {
    return apiClient.get('/admin/summary');
  },

  // Customers
  getCustomers: async (params = {}) => {
    return apiClient.get('/admin/customers', { params });
  },

  getCustomerById: async (id) => {
    return apiClient.get(`/admin/customers/${id}`);
  },

  // Inventory
  getLowStock: async (params = {}) => {
    return apiClient.get('/admin/inventory/low-stock', { params });
  },

  getInventory: async (params = {}) => {
    return apiClient.get('/admin/inventory', { params });
  },

  adjustInventory: async (variantId, data) => {
    return apiClient.patch(`/admin/inventory/${variantId}`, data);
  },

  // Products
  getProducts: async (params = {}) => {
    return apiClient.get('/admin/products', { params });
  },

  createProduct: async (data) => {
    return apiClient.post('/admin/products', data);
  },

  updateProduct: async (id, data) => {
    return apiClient.patch(`/admin/products/${id}`, data);
  },

  deleteProduct: async (id) => {
    return apiClient.delete(`/admin/products/${id}`);
  },

  createVariant: async (data) => {
    return apiClient.post('/admin/variants', data);
  },

  updateVariant: async (id, data) => {
    return apiClient.patch(`/admin/variants/${id}`, data);
  },

  deleteVariant: async (id) => {
    return apiClient.delete(`/admin/variants/${id}`);
  },

  // Categories
  getCategories: async () => {
    return apiClient.get('/categories');
  },

  // Orders
  getOrders: async (params = {}) => {
    return apiClient.get('/admin/orders', { params });
  },

  updateOrderStatus: async (id, data) => {
    return apiClient.patch(`/admin/orders/${id}/status`, data);
  },

  // Returns
  getReturns: async (params = {}) => {
    return apiClient.get('/admin/returns', { params });
  },

  handleReturn: async (id, data) => {
    return apiClient.patch(`/admin/returns/${id}`, data);
  },

  // Coupons
  getCoupons: async (params = {}) => {
    return apiClient.get('/admin/coupons', { params });
  },

  createCoupon: async (data) => {
    return apiClient.post('/admin/coupons', data);
  },

  updateCoupon: async (id, data) => {
    return apiClient.patch(`/admin/coupons/${id}`, data);
  },

  deleteCoupon: async (id) => {
    return apiClient.delete(`/admin/coupons/${id}`);
  },
};

export default adminApi;
