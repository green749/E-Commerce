import { addressRepository } from '../repositories/address.repository.js';
import { NotFoundError } from '../utils/errors.js';

export const addressService = {
  /**
   * List all addresses for user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async listAddresses(userId) {
    return addressRepository.findByUserId(userId);
  },

  /**
   * Get single address by ID
   * @param {string} userId
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getAddress(userId, id) {
    const address = await addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    return address;
  },

  /**
   * Create address with default address management
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createAddress(userId, data) {
    const existingCount = await addressRepository.countByUserId(userId);

    // If first address or explicitly marked as default, make it default and unset previous
    const shouldBeDefault = Boolean(data.is_default) || existingCount === 0;

    if (shouldBeDefault) {
      await addressRepository.unsetDefaults(userId);
    }

    return addressRepository.create(userId, {
      ...data,
      is_default: shouldBeDefault,
    });
  },

  /**
   * Update address with default management
   * @param {string} userId
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateAddress(userId, id, data) {
    const existing = await addressRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    if (data.is_default === true) {
      await addressRepository.unsetDefaults(userId);
    }

    return addressRepository.update(id, userId, data);
  },

  /**
   * Delete address and ensure default fallback
   * @param {string} userId
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteAddress(userId, id) {
    const existing = await addressRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    await addressRepository.delete(id, userId);

    // If the deleted address was default, promote the newest remaining address to default
    if (existing.is_default) {
      const remaining = await addressRepository.findByUserId(userId);
      if (remaining.length > 0) {
        await addressRepository.update(remaining[0].id, userId, { is_default: true });
      }
    }

    return true;
  },
};
