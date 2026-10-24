import { create } from 'zustand';
import { wishlistApi } from '../api/wishlist.js';
import { useAuthStore } from './authStore.js';

export const useWishlistStore = create((set, get) => ({
  count: 0,
  items: [],
  itemIds: [],
  isLoading: false,
  error: null,

  setCount: (count) => set({ count }),

  isWishlisted: (productId) => {
    return get().itemIds.includes(productId);
  },

  fetchWishlist: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      return [];
    }

    try {
      set({ isLoading: true, error: null });
      const items = await wishlistApi.getWishlist();
      const list = Array.isArray(items) ? items : [];
      const ids = list.map((item) => item.product_id || item.id);
      set({
        items: list,
        itemIds: ids,
        count: list.length,
        isLoading: false,
      });
      return list;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return [];
    }
  },

  toggleWishlist: async (product) => {
    const { isAuthenticated } = useAuthStore.getState();
    const productId = product.id;
    const isCurrentlyWishlisted = get().isWishlisted(productId);

    if (!isAuthenticated) {
      // Local optimistic toggle for guests
      if (isCurrentlyWishlisted) {
        const nextIds = get().itemIds.filter((id) => id !== productId);
        const nextItems = get().items.filter((item) => item.id !== productId);
        set({ itemIds: nextIds, items: nextItems, count: nextIds.length });
        return { wishlisted: false, guest: true };
      } else {
        const nextIds = [...get().itemIds, productId];
        const nextItems = [...get().items, product];
        set({ itemIds: nextIds, items: nextItems, count: nextIds.length });
        return { wishlisted: true, guest: true };
      }
    }

    try {
      if (isCurrentlyWishlisted) {
        await wishlistApi.removeItem(productId);
        const nextIds = get().itemIds.filter((id) => id !== productId);
        const nextItems = get().items.filter((item) => item.id !== productId);
        set({ itemIds: nextIds, items: nextItems, count: nextIds.length });
        return { wishlisted: false };
      } else {
        await wishlistApi.addItem(productId);
        const nextIds = [...get().itemIds, productId];
        const nextItems = [...get().items, product];
        set({ itemIds: nextIds, items: nextItems, count: nextIds.length });
        return { wishlisted: true };
      }
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  clearWishlist: () => set({ count: 0, items: [], itemIds: [] }),
}));

export default useWishlistStore;
