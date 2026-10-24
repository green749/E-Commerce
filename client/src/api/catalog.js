import apiClient from './axios.js';

export const catalogApi = {
  /**
   * Fetch products with filtering, sorting, pagination, and full-text search
   * @param {Object} params
   * @returns {Promise<{ items: Array, pagination: Object }>}
   */
  getProducts: async (params = {}) => {
    return apiClient.get('/products', { params });
  },

  /**
   * Fetch a single product by slug with variants, computed inventory & 4 related products
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  getProductBySlug: async (slug) => {
    return apiClient.get(`/products/${slug}`);
  },

  /**
   * Fetch hierarchical category tree
   * @returns {Promise<Array>}
   */
  getCategories: async () => {
    return apiClient.get('/categories');
  },

  /**
   * Fetch quick search suggestions
   * @param {string} q
   * @returns {Promise<Array>}
   */
  getSuggestions: async (q) => {
    if (!q || !q.trim()) return [];
    return apiClient.get('/search/suggestions', { params: { q: q.trim() } });
  },
};

export default catalogApi;
