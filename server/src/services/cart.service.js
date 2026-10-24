import crypto from 'crypto';
import { cartRepository } from '../repositories/cart.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { variantRepository } from '../repositories/variant.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

// Configuration constants for e-commerce pricing (all in integer paise)
export const FREE_SHIPPING_THRESHOLD = 99900; // Free shipping above ₹999
export const STANDARD_SHIPPING_FEE = 9900; // Flat ₹99 shipping fee
export const TAX_RATE = 0.18; // 18% GST
export const MAX_ITEM_QUANTITY = 10;

export const cartService = {
  /**
   * Resolve active cart for user or guest session, auto-merging if applicable
   * @param {Object} params
   * @param {string|null} params.userId
   * @param {string|null} params.sessionId
   * @returns {Promise<Object>}
   */
  async getOrCreateCart({ userId = null, sessionId = null }) {
    if (userId) {
      let userCart = await cartRepository.findActiveByUserId(userId);
      if (!userCart) {
        userCart = await cartRepository.create({ userId, sessionId });
      }

      // If guest session has items, merge into user cart
      if (sessionId) {
        const guestCart = await cartRepository.findActiveBySessionId(sessionId);
        if (guestCart && guestCart.id !== userCart.id) {
          await cartRepository.mergeGuestCart(guestCart.id, userCart.id);
        }
      }

      return userCart;
    }

    // Guest Cart
    const activeSessionId = sessionId || crypto.randomUUID();
    let guestCart = await cartRepository.findActiveBySessionId(activeSessionId);
    if (!guestCart) {
      guestCart = await cartRepository.create({ sessionId: activeSessionId });
    }

    return guestCart;
  },

  /**
   * Format full cart response with line items, current prices, stock checks, and warnings
   * @param {Object} cart
   * @returns {Promise<Object>}
   */
  async formatCartResponse(cart) {
    const rawItems = await cartRepository.getItems(cart.id);
    const warnings = [];
    const validItems = [];
    let subtotal = 0;

    for (const item of rawItems) {
      // 1. Check if product was soft deleted or inactivated
      if (!item.is_active || item.deleted_at) {
        await cartRepository.removeItem(item.item_id);
        warnings.push(
          `"${item.product_name}" is no longer available and was removed from your cart.`
        );
        continue;
      }

      // 2. Check stock availability against requested quantity
      if (item.available < item.quantity) {
        if (item.available <= 0) {
          await cartRepository.removeItem(item.item_id);
          warnings.push(
            `"${item.product_name} (${item.sku})" is currently out of stock and was removed.`
          );
          continue;
        } else {
          await cartRepository.updateItemQuantity(item.item_id, item.available);
          warnings.push(
            `Stock for "${item.product_name} (${item.sku})" dropped to ${item.available}. Cart quantity was adjusted to available stock.`
          );
          item.quantity = item.available;
        }
      }

      const itemTotal = Number(item.price) * item.quantity;
      subtotal += itemTotal;

      validItems.push({
        id: item.item_id,
        variant_id: item.variant_id,
        product_id: item.product_id,
        sku: item.sku,
        name: item.product_name,
        slug: item.product_slug,
        brand: item.brand,
        size: item.size,
        color: item.color,
        price: Number(item.price),
        mrp: Number(item.mrp),
        quantity: item.quantity,
        available: item.available,
        line_total: itemTotal,
        image_url: item.image_urls?.[0] || null,
        on_sale: Number(item.mrp) > Number(item.price),
      });
    }

    // 3. Process Coupon Discount & Validation
    let discount = 0;
    let appliedCoupon = null;

    if (cart.coupon_id) {
      const coupon = await couponRepository.findById(cart.coupon_id);
      const now = new Date();

      if (!coupon || !coupon.is_active) {
        await cartRepository.updateCoupon(cart.id, null);
        warnings.push(`Coupon "${coupon?.code || 'APPLIED'}" is no longer active and was removed.`);
      } else if (now < new Date(coupon.starts_at) || now > new Date(coupon.ends_at)) {
        await cartRepository.updateCoupon(cart.id, null);
        warnings.push(`Coupon "${coupon.code}" has expired and was removed.`);
      } else if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        await cartRepository.updateCoupon(cart.id, null);
        warnings.push(`Coupon "${coupon.code}" usage limit has been reached.`);
      } else if (subtotal < Number(coupon.min_order_amount)) {
        await cartRepository.updateCoupon(cart.id, null);
        const minRupees = Number(coupon.min_order_amount) / 100;
        warnings.push(
          `Cart subtotal ₹${subtotal / 100} is below the minimum order amount ₹${minRupees} for coupon "${coupon.code}".`
        );
      } else {
        // Calculate discount
        if (coupon.type === 'percent') {
          const rawDiscount = Math.round((subtotal * Number(coupon.value)) / 100);
          discount = coupon.max_discount
            ? Math.min(Number(coupon.max_discount), rawDiscount)
            : rawDiscount;
        } else {
          // Flat discount
          discount = Math.min(subtotal, Number(coupon.value));
        }

        appliedCoupon = {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
          discount,
        };
      }
    }

    // 4. Shipping Calculation (Free above ₹999 or empty cart)
    const taxableBase = Math.max(0, subtotal - discount);
    let shipping_fee = 0;
    if (subtotal > 0) {
      if (appliedCoupon?.code === 'FREESHIP') {
        shipping_fee = 0;
      } else if (taxableBase >= FREE_SHIPPING_THRESHOLD) {
        shipping_fee = 0;
      } else {
        shipping_fee = STANDARD_SHIPPING_FEE;
      }
    }

    // 5. Tax Calculation (18% GST)
    const tax = subtotal > 0 ? Math.round(taxableBase * TAX_RATE) : 0;

    // 6. Total Calculation
    const total = subtotal > 0 ? taxableBase + shipping_fee + tax : 0;
    const itemCount = validItems.reduce((acc, curr) => acc + curr.quantity, 0);

    return {
      id: cart.id,
      user_id: cart.user_id,
      session_id: cart.session_id,
      items: validItems,
      item_count: itemCount,
      subtotal,
      discount,
      shipping_fee,
      tax,
      total,
      free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
      coupon: appliedCoupon,
      warnings,
    };
  },

  /**
   * Get active cart
   */
  async getCart({ userId = null, sessionId = null }) {
    const cart = await this.getOrCreateCart({ userId, sessionId });
    return this.formatCartResponse(cart);
  },

  /**
   * Add variant item to cart with stock and max quantity (10) validation
   */
  async addItem({ userId = null, sessionId = null, variantId, quantity = 1 }) {
    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }
    if (quantity > MAX_ITEM_QUANTITY) {
      throw new BadRequestError(`Cannot add more than ${MAX_ITEM_QUANTITY} units of an item`);
    }

    const variant = await variantRepository.findById(variantId);
    if (!variant) {
      throw new NotFoundError('Product variant not found');
    }

    const available = Number(variant.available) || 0;
    if (available <= 0) {
      throw new BadRequestError(`Variant "${variant.sku}" is out of stock`);
    }

    const cart = await this.getOrCreateCart({ userId, sessionId });
    const existing = await cartRepository.getItemByCartAndVariant(cart.id, variantId);

    const currentQty = existing ? existing.quantity : 0;
    const requestedTotal = currentQty + quantity;

    if (requestedTotal > MAX_ITEM_QUANTITY) {
      throw new BadRequestError(
        `Total quantity in cart would exceed the maximum limit of ${MAX_ITEM_QUANTITY} units (current: ${currentQty})`
      );
    }

    if (requestedTotal > available) {
      throw new BadRequestError(
        `Only ${available} unit(s) available in stock. Cannot add ${quantity} more to your existing ${currentQty}.`
      );
    }

    await cartRepository.addItem(cart.id, variantId, quantity);

    // Record add_to_cart event in events table
    await eventRepository.record({
      userId,
      sessionId: cart.session_id,
      eventType: 'add_to_cart',
      properties: {
        cart_id: cart.id,
        variant_id: variantId,
        product_id: variant.product_id,
        sku: variant.sku,
        quantity_added: quantity,
        price: Number(variant.price),
      },
    });

    return this.formatCartResponse(cart);
  },

  /**
   * Update item quantity in cart
   */
  async updateItem({ userId = null, sessionId = null, itemId, quantity }) {
    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }
    if (quantity > MAX_ITEM_QUANTITY) {
      throw new BadRequestError(`Quantity cannot exceed ${MAX_ITEM_QUANTITY} units per item`);
    }

    const cart = await this.getOrCreateCart({ userId, sessionId });
    const item = await cartRepository.getItemById(itemId);
    if (!item || item.cart_id !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }

    const variant = await variantRepository.findById(item.variant_id);
    const available = Number(variant?.available) || 0;

    if (quantity > available) {
      throw new BadRequestError(`Only ${available} unit(s) available in stock`);
    }

    await cartRepository.updateItemQuantity(itemId, quantity);
    return this.formatCartResponse(cart);
  },

  /**
   * Remove item from cart
   */
  async removeItem({ userId = null, sessionId = null, itemId }) {
    const cart = await this.getOrCreateCart({ userId, sessionId });
    const item = await cartRepository.getItemById(itemId);
    if (!item || item.cart_id !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }

    await cartRepository.removeItem(itemId);

    // Record remove_from_cart event in events table
    await eventRepository.record({
      userId,
      sessionId: cart.session_id,
      eventType: 'remove_from_cart',
      properties: {
        cart_id: cart.id,
        cart_item_id: itemId,
        variant_id: item.variant_id,
        sku: item.sku,
        quantity_removed: item.quantity,
      },
    });

    return this.formatCartResponse(cart);
  },

  /**
   * Clear all items and coupon from cart
   */
  async clearCart({ userId = null, sessionId = null }) {
    const cart = await this.getOrCreateCart({ userId, sessionId });
    await cartRepository.clearItems(cart.id);
    await cartRepository.updateCoupon(cart.id, null);
    return this.formatCartResponse(cart);
  },

  /**
   * Apply promotional coupon with detailed rule validation
   */
  async applyCoupon({ userId = null, sessionId = null, code }) {
    if (!code || code.trim().length === 0) {
      throw new BadRequestError('Coupon code is required');
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await couponRepository.findByCode(normalizedCode);

    if (!coupon) {
      throw new NotFoundError(`Coupon code "${normalizedCode}" does not exist`);
    }

    if (!coupon.is_active) {
      throw new BadRequestError(`Coupon "${normalizedCode}" is inactive or disabled`);
    }

    const now = new Date();
    if (now < new Date(coupon.starts_at)) {
      throw new BadRequestError(`Coupon "${normalizedCode}" promotion has not started yet`);
    }

    if (now > new Date(coupon.ends_at)) {
      throw new BadRequestError(
        `Coupon "${normalizedCode}" has expired on ${new Date(coupon.ends_at).toLocaleDateString()}`
      );
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestError(`Coupon "${normalizedCode}" usage limit has been reached`);
    }

    const cart = await this.getOrCreateCart({ userId, sessionId });
    const rawItems = await cartRepository.getItems(cart.id);

    if (rawItems.length === 0) {
      throw new BadRequestError('Cannot apply coupon to an empty cart');
    }

    const currentSubtotal = rawItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const minRequired = Number(coupon.min_order_amount);

    if (currentSubtotal < minRequired) {
      throw new BadRequestError(
        `Cart subtotal of ₹${currentSubtotal / 100} is below the required minimum order amount of ₹${minRequired / 100} for coupon "${normalizedCode}"`
      );
    }

    await cartRepository.updateCoupon(cart.id, coupon.id);
    cart.coupon_id = coupon.id;

    return this.formatCartResponse(cart);
  },

  /**
   * Remove applied coupon from cart
   */
  async removeCoupon({ userId = null, sessionId = null }) {
    const cart = await this.getOrCreateCart({ userId, sessionId });
    await cartRepository.updateCoupon(cart.id, null);
    cart.coupon_id = null;
    return this.formatCartResponse(cart);
  },

  /**
   * Merge guest cart into user cart upon login
   */
  async mergeGuestCartOnLogin(userId, sessionId) {
    if (!userId || !sessionId) return;
    const guestCart = await cartRepository.findActiveBySessionId(sessionId);
    if (!guestCart) return;

    let userCart = await cartRepository.findActiveByUserId(userId);
    if (!userCart) {
      userCart = await cartRepository.create({ userId, sessionId });
    }

    await cartRepository.mergeGuestCart(guestCart.id, userCart.id);
  },
};
