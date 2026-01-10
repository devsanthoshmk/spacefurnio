/**
 * ===========================================
 * CART STORE
 * ===========================================
 * Manages shopping cart state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { cart as cartApi } from '@/api';

export const useCartStore = defineStore('cart', () => {
  // ===========================================
  // STATE
  // ===========================================

  // Sample items for demo/testing (remove in production)
  const items = ref()
  // seed data
  //   [
  //   {
  //     id: 'demo-1',
  //     productId: 'prod-001',
  //     name: 'Modern Velvet Sofa',
  //     variant: 'Navy Blue',
  //     image: '/images/products/sofa-navy.jpg',
  //     unitPrice: 1299,
  //     quantity: 1,
  //   },
  //   {
  //     id: 'demo-2',
  //     productId: 'prod-002',
  //     name: 'Scandinavian Oak Coffee Table',
  //     variant: 'Natural Oak',
  //     image: '/images/products/coffee-table.jpg',
  //     unitPrice: 449,
  //     quantity: 2,
  //   },
  // ]);
  const subtotal = ref(2197); // 1299 + (449 * 2)
  const discountCode = ref(null);
  const discountAmount = ref(0);
  const isLoading = ref(false);
  const error = ref(null);

  // ===========================================
  // GETTERS
  // ===========================================

  const itemCount = computed(() => {
    // console.info('itemCount', items.value);
    return items.value?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  });

  const total = computed(() => {
    return subtotal.value - discountAmount.value;
  });

  const isEmpty = computed(() => items.value.length === 0);

  const hasDiscount = computed(() => !!discountCode.value);

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Fetch cart from server
   */
  async function fetchCart() {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await cartApi.get();

      items.value = response.items || [];
      subtotal.value = response.subtotal || 0;
      discountCode.value = response.discountCode || null;
      discountAmount.value = response.discountAmount || 0;

    } catch (err) {
      error.value = err.message;
      console.error('Fetch cart error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Add item to cart
   */
  async function addItem(productId, quantity = 1, variantId = null) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await cartApi.addItem(productId, quantity, variantId);

      // Update local state with server response
      items.value = response.items || items.value;
      subtotal.value = response.subtotal || subtotal.value;

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update item quantity
   */
  async function updateItemQuantity(itemId, quantity) {
    // Optimistic update
    const itemIndex = items.value.findIndex(i => i.id === itemId);
    const previousQuantity = itemIndex >= 0 ? items.value[itemIndex].quantity : 0;

    if (itemIndex >= 0) {
      items.value[itemIndex].quantity = quantity;
      // Recalculate subtotal
      subtotal.value = items.value.reduce(
        (sum, item) => sum + (item.unitPrice * item.quantity), 0
      );
    }

    try {
      isLoading.value = true;
      error.value = null;

      const response = await cartApi.updateItem(itemId, quantity);

      // Update with server response
      items.value = response.items || items.value;
      subtotal.value = response.subtotal || subtotal.value;

      return response;
    } catch (err) {
      // Revert optimistic update
      if (itemIndex >= 0) {
        items.value[itemIndex].quantity = previousQuantity;
        subtotal.value = items.value.reduce(
          (sum, item) => sum + (item.unitPrice * item.quantity), 0
        );
      }

      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove item from cart
   */
  async function removeItem(itemId) {
    // Optimistic update
    const removedItem = items.value.find(i => i.id === itemId);
    items.value = items.value.filter(i => i.id !== itemId);
    subtotal.value = items.value.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity), 0
    );

    try {
      isLoading.value = true;
      error.value = null;

      await cartApi.removeItem(itemId);

    } catch (err) {
      // Revert optimistic update
      if (removedItem) {
        items.value.push(removedItem);
        subtotal.value = items.value.reduce(
          (sum, item) => sum + (item.unitPrice * item.quantity), 0
        );
      }

      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clear entire cart
   */
  async function clearCart() {
    try {
      isLoading.value = true;
      error.value = null;

      await cartApi.clear();

      items.value = [];
      subtotal.value = 0;
      discountCode.value = null;
      discountAmount.value = 0;

    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Apply coupon code
   */
  async function applyCoupon(code) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await cartApi.applyCoupon(code);

      discountCode.value = response.discountCode;
      discountAmount.value = response.discountAmount;

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove coupon
   */
  async function removeCoupon() {
    try {
      isLoading.value = true;
      error.value = null;

      await cartApi.removeCoupon();

      discountCode.value = null;
      discountAmount.value = 0;

    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get cart count only
   */
  async function fetchCount() {
    try {
      const response = await cartApi.getCount();
      return response.count;
    } catch (err) {
      console.error('Fetch cart count error:', err);
      return 0;
    }
  }

  /**
   * Check if product is in cart
   */
  function isInCart(productId, variantId = null) {
    return items.value.some(item =>
      item.productId === productId &&
      (variantId ? item.variantId === variantId : true)
    );
  }

  /**
   * Get item quantity in cart
   */
  function getItemQuantity(productId, variantId = null) {
    const item = items.value.find(i =>
      i.productId === productId &&
      (variantId ? i.variantId === variantId : true)
    );
    return item?.quantity || 0;
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
    subtotal.value = 0;
    discountCode.value = null;
    discountAmount.value = 0;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    items,
    subtotal,
    discountCode,
    discountAmount,
    isLoading,
    error,

    // Getters
    itemCount,
    total,
    isEmpty,
    hasDiscount,

    // Actions
    fetchCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    fetchCount,
    isInCart,
    getItemQuantity,
    clearError,
    $reset,
  };
});
