import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

// In-memory cache for category tree (5 minutes TTL = 300,000 ms)
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedTree = null;
let cacheExpiresAt = 0;

export const categoryService = {
  /**
   * Invalidate the in-memory category cache
   */
  invalidateCache() {
    cachedTree = null;
    cacheExpiresAt = 0;
  },

  /**
   * Build hierarchical category tree from flat database list
   * @param {Array} categories
   * @returns {Array}
   */
  buildTree(categories) {
    const categoryMap = new Map();
    const tree = [];

    // Initialize all categories with an empty children array
    for (const cat of categories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    // Connect children to parents
    for (const cat of categories) {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).children.push(node);
      } else {
        tree.push(node);
      }
    }

    return tree;
  },

  /**
   * Get cached category tree (5-minute TTL)
   * @returns {Promise<Array>}
   */
  async getCategoryTree() {
    const now = Date.now();
    if (cachedTree && now < cacheExpiresAt) {
      return cachedTree;
    }

    const categories = await categoryRepository.findAll();
    cachedTree = this.buildTree(categories);
    cacheExpiresAt = now + CATEGORY_CACHE_TTL_MS;

    return cachedTree;
  },

  /**
   * Admin: Create category
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createCategory(data) {
    const existing = await categoryRepository.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError(`Category with slug "${data.slug}" already exists`);
    }

    const category = await categoryRepository.create(data);
    this.invalidateCache();
    return category;
  },

  /**
   * Admin: Update category
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateCategory(id, data) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await categoryRepository.findBySlug(data.slug);
      if (slugConflict) {
        throw new ConflictError(`Category with slug "${data.slug}" already exists`);
      }
    }

    const updated = await categoryRepository.update(id, data);
    this.invalidateCache();
    return updated;
  },

  /**
   * Admin: Delete category
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteCategory(id) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    await categoryRepository.delete(id);
    this.invalidateCache();
    return true;
  },
};
