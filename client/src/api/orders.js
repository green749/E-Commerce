import apiClient from './axios.js';

export const ordersApi = {
  getMyOrders: async () => {
    return apiClient.get('/orders');
  },

  getOrderByNumber: async (orderNumber) => {
    return apiClient.get(`/orders/${orderNumber}`);
  },

  cancelOrder: async (orderNumber, reason) => {
    return apiClient.post(`/orders/${orderNumber}/cancel`, { reason });
  },

  requestReturn: async (orderNumber, orderItemId, reason) => {
    return apiClient.post(`/orders/${orderNumber}/return`, {
      order_item_id: orderItemId,
      reason,
    });
  },
};

export default ordersApi;
