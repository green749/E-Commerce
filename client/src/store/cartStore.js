import { create } from 'zustand';
import { cartApi } from '../api/cart.js';
import { eventsApi } from '../api/events.js';

export const useCartStore = create((set, get) => ({
  count: 0,
  subtotal: 0,
  discount: 0,
  shipping_fee: 0,
  tax: 0,
  total: 0,
  free_shipping_threshold: 99900,
  coupon: null,
  warnings: [],
  items: [],
  isLoading: false,
  error: null,

  setCount: (count) => set({ count }),

  applyCartState: (data) => {
    if (!data) return;
    const lineItems = data.items || [];
    const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    set({
      count: totalCount,
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      shipping_fee: data.shipping_fee || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      free_shipping_threshold: data.free_shipping_threshold || 99900,
      coupon: data.coupon || null,
      warnings: data.warnings || [],
      items: lineItems,
      isLoading: false,
      error: null,
    });
  },

  fetchCart: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await cartApi.getCart();
      const lineItems = data?.items || [];
      const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      set({
        count: totalCount,
        subtotal: data?.subtotal || 0,
        discount: data?.discount || 0,
        shipping_fee: data?.shipping_fee || 0,
        tax: data?.tax || 0,
        total: data?.total || 0,
        free_shipping_threshold: data?.free_shipping_threshold || 99900,
        coupon: data?.coupon || null,
        warnings: data?.warnings || [],
        items: lineItems,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return null;
    }
  },

  addToCart: async (variantId, quantity = 1) => {
    try {
      set({ isLoading: true, error: null });
      const data = await cartApi.addItem(variantId, quantity);
      const lineItems = data?.items || [];
      const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      set({
        count: totalCount,
        subtotal: data?.subtotal || 0,
        discount: data?.discount || 0,
        shipping_fee: data?.shipping_fee || 0,
        tax: data?.tax || 0,
        total: data?.total || 0,
        free_shipping_threshold: data?.free_shipping_threshold || 99900,
        coupon: data?.coupon || null,
        warnings: data?.warnings || [],
        items: lineItems,
        isLoading: false,
      });
      return { success: true, cart: data };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      set({ isLoading: true, error: null });
      const data = await cartApi.updateItem(itemId, quantity);
      const lineItems = data?.items || [];
      const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      set({
        count: totalCount,
        subtotal: data?.subtotal || 0,
        discount: data?.discount || 0,
        shipping_fee: data?.shipping_fee || 0,
        tax: data?.tax || 0,
        total: data?.total || 0,
        free_shipping_threshold: data?.free_shipping_threshold || 99900,
        coupon: data?.coupon || null,
        warnings: data?.warnings || [],
        items: lineItems,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  removeItem: async (itemId) => {
    try {
      const currentItems = get().items || [];
      const itemToRemove = currentItems.find((i) => i.id === itemId);

      set({ isLoading: true, error: null });
      const data = await cartApi.removeItem(itemId);

      if (itemToRemove) {
        eventsApi.track('remove_from_cart', {
          itemId: itemToRemove.id,
          variantId: itemToRemove.variant_id,
          name: itemToRemove.product_name,
          sku: itemToRemove.sku,
          quantity: itemToRemove.quantity,
          price: itemToRemove.unit_price,
        });
      }

      const lineItems = data?.items || [];
      const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      set({
        count: totalCount,
        subtotal: data?.subtotal || 0,
        discount: data?.discount || 0,
        shipping_fee: data?.shipping_fee || 0,
        tax: data?.tax || 0,
        total: data?.total || 0,
        free_shipping_threshold: data?.free_shipping_threshold || 99900,
        coupon: data?.coupon || null,
        warnings: data?.warnings || [],
        items: lineItems,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  applyCoupon: async (code) => {
    try {
      set({ isLoading: true, error: null });
      const data = await cartApi.applyCoupon(code);
      const lineItems = data?.items || [];
      const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      set({
        count: totalCount,
        subtotal: data?.subtotal || 0,
        discount: data?.discount || 0,
        shipping_fee: data?.shipping_fee || 0,
        tax: data?.tax || 0,
        total: data?.total || 0,
        free_shipping_threshold: data?.free_shipping_threshold || 99900,
        coupon: data?.coupon || null,
        warnings: data?.warnings || [],
        items: lineItems,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  removeCoupon: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await cartApi.removeCoupon();
      const lineItems = data?.items || [];
      const totalCount = lineItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      set({
        count: totalCount,
        subtotal: data?.subtotal || 0,
        discount: data?.discount || 0,
        shipping_fee: data?.shipping_fee || 0,
        tax: data?.tax || 0,
        total: data?.total || 0,
        free_shipping_threshold: data?.free_shipping_threshold || 99900,
        coupon: null,
        warnings: data?.warnings || [],
        items: lineItems,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  clearCart: () =>
    set({
      count: 0,
      subtotal: 0,
      discount: 0,
      shipping_fee: 0,
      tax: 0,
      total: 0,
      coupon: null,
      warnings: [],
      items: [],
      error: null,
    }),
}));

export default useCartStore;
