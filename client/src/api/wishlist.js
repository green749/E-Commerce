import apiClient from './axios.js';

export const wishlistApi = {
  /**
   * Get all wishlist items for authenticated user
   * @returns {Promise<Array>}
   */
  getWishlist: async () => {
    return apiClient.get('/wishlist');
  },

  /**
   * Add product to wishlist
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  addItem: async (productId) => {
    return apiClient.post('/wishlist', { product_id: productId });
  },

  /**
   * Remove item from wishlist by wishlist item ID or product ID
   * @param {string} idOrProductId
   * @returns {Promise<Object>}
   */
  removeItem: async (idOrProductId) => {
    return apiClient.delete(`/wishlist/${idOrProductId}`);
  },
};

export default wishlistApi;
