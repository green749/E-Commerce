import { wishlistRepository } from '../repositories/wishlist.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export const wishlistService = {
  /**
   * Get all wishlist items for user with product details
   * @param {string} userId
   * @returns {Promise<{ items: Array, count: number }>}
   */
  async getWishlist(userId) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const items = await wishlistRepository.findByUserId(userId);
    const formatted = items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      name: item.product_name,
      slug: item.product_slug,
      brand: item.brand,
      base_price: Number(item.base_price),
      mrp: Number(item.mrp),
      image_urls: item.image_urls || [],
      category: item.category_name ? { name: item.category_name, slug: item.category_slug } : null,
      in_stock: Number(item.total_available) > 0,
      total_available: Number(item.total_available),
      created_at: item.created_at,
    }));

    return {
      items: formatted,
      count: formatted.length,
    };
  },

  /**
   * Add a product to the user's wishlist
   * @param {string} userId
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async addItem(userId, productId) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }
    if (!productId) {
      throw new BadRequestError('Product ID is required');
    }

    const product = await productRepository.findById(productId);
    if (!product || !product.is_active || product.deleted_at) {
      throw new NotFoundError('Product not found');
    }

    const item = await wishlistRepository.addItem(userId, productId);
    return {
      message: 'Product added to wishlist',
      product_id: productId,
      id: item ? item.id : null,
    };
  },

  /**
   * Remove a product or item from user's wishlist
   * @param {string} userId
   * @param {string} identifier (productId or wishlist itemId)
   * @returns {Promise<Object>}
   */
  async removeItem(userId, identifier) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }
    if (!identifier) {
      throw new BadRequestError('Product or item ID is required');
    }

    await wishlistRepository.removeItem(userId, identifier);
    return {
      message: 'Item removed from wishlist',
      id: identifier,
    };
  },
};
