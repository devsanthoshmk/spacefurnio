/**
 * ===========================================
 * WISHLIST STORE
 * ===========================================
 * Manages wishlist state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api as wishlistApi } from '@/lib/api';
import { useCartStore } from './cart'; // For moving to cart

export const useWishlistStore = defineStore('wishlist', () => {
  // ===========================================
  // STATE
  // ===========================================

  const items = ref([]);
  const isPublic = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  // Product IDs set for quick lookup
  const productIds = computed(() => new Set(items.value.map((i) => i.productId)));

  // ===========================================
  // GETTERS
  // ===========================================

  const itemCount = computed(() => items.value.length);
  const isEmpty = computed(() => items.value.length === 0);

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Fetch wishlist from server.
   *
   * NOTE: products table was dropped from the main DB (migration 0001_big_dormammu).
   * Products live in a separate Neon project (icy-union-81751721), so PostgREST
   * cannot do embedded resource joins like products(*).
   * We fetch flat wishlist_items rows and store product_id for lookup.
   * Product enrichment (name, price, image) is done lazily by the UI
   * using shopApi.getProduct() from the catalog DB.
   */
  async function fetchWishlist() {
    try {
      isLoading.value = true;
      error.value = null;

      const data = await wishlistApi.getWishlist();

      if (Array.isArray(data)) {
        items.value = data.map(wi => ({
          id: wi.id,
          productId: wi.product_id,
          createdAt: wi.created_at,
          // Product details are NOT available from the main DB.
          // UI components should enrich from shopApi/catalog if needed.
          product: {
            name: null,
            price: null,
            primaryImage: null,
            slug: null
          },
          variant: ''
        }));
      } else {
        items.value = [];
      }
    } catch (err) {
      if (err.message && err.message.includes('Unauthorized')) {
        items.value = [];
        return;
      }
      error.value = err.message;
      console.error('Fetch wishlist error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Add item to wishlist
   */
  async function addItem(productId, variantId = null) {
    try {
      isLoading.value = true;
      error.value = null;

      if (!productIds.value.has(productId)) {
        await wishlistApi.addWishlistItem({ product_id: productId });
        await fetchWishlist(); // sync
      }
      return true;
    } catch (err) {
      if (err.message && err.message.includes('Item already exists')) {
        await fetchWishlist();
      } else {
        error.value = err.message;
        throw err;
      }
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove item from wishlist
   */
  async function removeItem(itemId) {
    const removedIndex = items.value.findIndex((i) => i.id === itemId);
    const removedItem = items.value[removedIndex];

    if (removedIndex >= 0) {
      items.value.splice(removedIndex, 1);
    }

    try {
      isLoading.value = true;
      error.value = null;
      await wishlistApi.removeWishlistItem(itemId);
    } catch (err) {
      if (removedItem && removedIndex >= 0) {
        items.value.splice(removedIndex, 0, removedItem);
      }
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove item by product ID
   */
  async function removeByProductId(productId) {
    const item = items.value.find((i) => i.productId === productId);
    if (!item) return;

    const removedIndex = items.value.findIndex((i) => i.productId === productId);
    items.value.splice(removedIndex, 1);

    try {
      isLoading.value = true;
      error.value = null;
      await wishlistApi.removeWishlistItemByProductId(productId);
    } catch (err) {
      items.value.splice(removedIndex, 0, item);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Toggle wishlist item
   */
  async function toggleItem(productId, productData = null, variantId = null) {
    const inWishlist = isInWishlist(productId);

    if (inWishlist) {
      await removeByProductId(productId);
      return false;
    } else {
      await addItem(productId, variantId);
      return true;
    }
  }

  /**
   * Move item to cart
   */
  async function moveToCart(itemId, quantity = 1) {
    try {
      isLoading.value = true;
      error.value = null;

      const itemToMove = items.value.find(i => i.id === itemId);
      if (!itemToMove) return;

      const cartStore = useCartStore();
      await cartStore.addItem(itemToMove.productId, quantity);

      await wishlistApi.removeWishlistItem(itemId);
      items.value = items.value.filter((i) => i.id !== itemId);

      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update wishlist visibility (stub)
   */
  async function setVisibility(isPublicValue) {
    isPublic.value = isPublicValue;
  }

  /**
   * Get wishlist count only
   */
  async function fetchCount() {
    await fetchWishlist();
    return itemCount.value;
  }

  /**
   * Check if product is in wishlist
   */
  function isInWishlist(productId) {
    return productIds.value.has(productId);
  }

  /**
   * Get wishlist item by product ID
   */
  function getItemByProductId(productId) {
    return items.value.find((i) => i.productId === productId);
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Reset store (on logout)
   */
  function $reset() {
    items.value = [];
    isPublic.value = false;
    isLoading.value = false;
    error.value = null;
  }

  return {
    items,
    isPublic,
    isLoading,
    error,
    itemCount,
    isEmpty,
    productIds,

    fetchWishlist,
    addItem,
    removeItem,
    removeByProductId,
    toggleItem,
    moveToCart,
    setVisibility,
    fetchCount,
    isInWishlist,
    getItemByProductId,
    clearError,
    $reset,
  };
});
