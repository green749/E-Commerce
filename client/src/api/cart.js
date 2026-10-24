import apiClient from './axios.js';

export const cartApi = {
  /**
   * Get current cart with line items, calculations, and stock warnings
   * @returns {Promise<Object>}
   */
  getCart: async () => {
    return apiClient.get('/cart');
  },

  /**
   * Add a variant item to cart
   * @param {string} variantId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  addItem: async (variantId, quantity = 1) => {
    return apiClient.post('/cart/items', {
      variant_id: variantId,
      quantity,
    });
  },

  /**
   * Update quantity of a cart item
   * @param {string} itemId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  updateItem: async (itemId, quantity) => {
    return apiClient.patch(`/cart/items/${itemId}`, { quantity });
  },

  /**
   * Remove a line item from cart
   * @param {string} itemId
   * @returns {Promise<Object>}
   */
  removeItem: async (itemId) => {
    return apiClient.delete(`/cart/items/${itemId}`);
  },

  /**
   * Clear all items and applied coupon from cart
   * @returns {Promise<Object>}
   */
  clearCart: async () => {
    return apiClient.delete('/cart');
  },

  /**
   * Apply coupon code
   * @param {string} code
   * @returns {Promise<Object>}
   */
  applyCoupon: async (code) => {
    return apiClient.post('/cart/coupon', { code });
  },

  /**
   * Remove coupon
   * @returns {Promise<Object>}
   */
  removeCoupon: async () => {
    return apiClient.delete('/cart/coupon');
  },
};

export default cartApi;
