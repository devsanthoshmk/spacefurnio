/**
 * ===========================================
 * WISHLIST STORE
 * ===========================================
 * Manages wishlist state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { wishlist as wishlistApi } from '@/api';

export const useWishlistStore = defineStore('wishlist', () => {
  // ===========================================
  // STATE
  // ===========================================

  // Sample data for UI demonstration
  const items = ref([
    {
      id: 'sample-1',
      productId: 'prod-001',
      product: {
        name: 'Modern Velvet Sofa',
        price: 1299,
        primaryImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'
      },
      variant: '3-Seater, Navy Blue'
    },
    {
      id: 'sample-2',
      productId: 'prod-002',
      product: {
        name: 'Minimalist Coffee Table',
        price: 449,
        primaryImage: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400'
      },
      variant: 'Walnut Wood'
    }
  ]);
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
   * Fetch wishlist from server
   */
  async function fetchWishlist() {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await wishlistApi.get();

      items.value = response.items || [];
      isPublic.value = response.isPublic || false;
    } catch (err) {
      // Not logged in - clear wishlist silently
      if (err.status === 401) {
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

      const response = await wishlistApi.addItem(productId, variantId);

      // Add to local state
      if (response.item && !productIds.value.has(productId)) {
        items.value.push(response.item);
      }

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove item from wishlist
   */
  async function removeItem(itemId) {
    // Optimistic update
    const removedIndex = items.value.findIndex((i) => i.id === itemId);
    const removedItem = items.value[removedIndex];

    if (removedIndex >= 0) {
      items.value.splice(removedIndex, 1);
    }

    try {
      isLoading.value = true;
      error.value = null;

      await wishlistApi.removeItem(itemId);
    } catch (err) {
      // Revert optimistic update
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

    // Optimistic update
    const removedIndex = items.value.findIndex((i) => i.productId === productId);
    items.value.splice(removedIndex, 1);

    try {
      isLoading.value = true;
      error.value = null;

      await wishlistApi.removeByProductId(productId);
    } catch (err) {
      // Revert optimistic update
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

      const response = await wishlistApi.moveToCart(itemId, quantity);

      // Remove from local wishlist
      items.value = items.value.filter((i) => i.id !== itemId);

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update wishlist visibility
   */
  async function setVisibility(isPublicValue) {
    try {
      isLoading.value = true;
      error.value = null;

      await wishlistApi.setVisibility(isPublicValue);
      isPublic.value = isPublicValue;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get wishlist count only
   */
  async function fetchCount() {
    try {
      const response = await wishlistApi.getCount();
      return response.count;
    } catch (err) {
      console.error('Fetch wishlist count error:', err);
      return 0;
    }
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
    // State
    items,
    isPublic,
    isLoading,
    error,

    // Getters
    itemCount,
    isEmpty,
    productIds,

    // Actions
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
