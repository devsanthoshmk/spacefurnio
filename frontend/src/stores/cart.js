/**
 * ===========================================
 * CART STORE
 * ===========================================
 * Manages shopping cart state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api as cartApi } from '@/lib/api';

export const useCartStore = defineStore('cart', () => {
  // ===========================================
  // STATE
  // ===========================================

  const cartId = ref(null);
  const items = ref([]);
  const subtotal = ref(0);
  const discountCode = ref(null);
  const discountAmount = ref(0);
  const isLoading = ref(false);
  const error = ref(null);

  // ===========================================
  // GETTERS
  // ===========================================

  const itemCount = computed(() => {
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
   * Fetch cart from server.
   *
   * NOTE: products table was dropped from the main DB (migration 0001_big_dormammu).
   * Products live in a separate Neon project, so PostgREST cannot join products(*).
   * We use price_snapshot from cart_items (price at time of add) which is the
   * correct ecommerce pattern anyway. Product enrichment (name, image) can be
   * done lazily by the UI using shopApi.
   */
  async function fetchCart() {
    try {
      isLoading.value = true;
      error.value = null;

      const cartData = await cartApi.getCart();

      if (cartData) {
        cartId.value = cartData.id;
        // Transform PostgREST response — no products(*) join available
        const newItems = (cartData.cart_items || []).map(ci => ({
          id: ci.id,
          productId: ci.product_id,
          // Product details are NOT available from the main DB.
          // UI components should enrich from shopApi/catalog if needed.
          name: null,
          image: null,
          unitPrice: parseFloat(ci.price_snapshot || 0),
          quantity: ci.quantity
        }));
        items.value = newItems;
        subtotal.value = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      } else {
        cartId.value = null;
        items.value = [];
        subtotal.value = 0;
      }
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
    if (!cartId.value) {
      // Logic expects a cart ID if it's the Neon Data API.
      // Usually the backend creates a cart or we fetch it first.
      await fetchCart();
      if (!cartId.value) {
        error.value = 'Cart not initialized for user. Please check backend Auth.';
        return;
      }
    }

    try {
      isLoading.value = true;
      error.value = null;

      // Ensure price is grabbed from the product API or let DB trigger do it if possible
      // Assuming addCartItem uses PostgREST POST
      const existingItem = items.value.find(i => i.productId === productId);
      if (existingItem) {
        // If already exists, we should PATCH instead or add to quantity
        existingItem.quantity += quantity;
        await cartApi.updateCartItem(existingItem.id, existingItem.quantity);
      } else {
        await cartApi.addCartItem({
          cart_id: cartId.value,
          product_id: productId,
          quantity: quantity,
          // price_snapshot: (get this from the product store in reality)
        });
      }

      // Re-fetch cart to get synced data and joined products
      await fetchCart();
      return true;
    } catch (err) {
      // If adding fails because of unique constraint, fallback to fetch+patch
      if (err.message && err.message.includes('Item already exists.')) {
        await fetchCart();
      } else {
        error.value = err.message;
        throw err;
      }
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update item quantity
   */
  async function updateItemQuantity(itemId, quantity) {
    const itemIndex = items.value.findIndex(i => i.id === itemId);
    const previousQuantity = itemIndex >= 0 ? items.value[itemIndex].quantity : 0;

    if (itemIndex >= 0) {
      items.value[itemIndex].quantity = quantity;
      subtotal.value = items.value.reduce(
        (sum, item) => sum + (item.unitPrice * item.quantity), 0
      );
    }

    try {
      isLoading.value = true;
      error.value = null;
      await cartApi.updateCartItem(itemId, quantity);
      return true;
    } catch (err) {
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
    const removedItem = items.value.find(i => i.id === itemId);
    items.value = items.value.filter(i => i.id !== itemId);
    subtotal.value = items.value.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity), 0
    );

    try {
      isLoading.value = true;
      error.value = null;
      await cartApi.removeCartItem(itemId);
    } catch (err) {
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
    if (!cartId.value) return;
    try {
      isLoading.value = true;
      error.value = null;
      await cartApi.clearCart(cartId.value);
      items.value = [];
      subtotal.value = 0;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove coupon (stub)
   */
  async function removeCoupon() {
    discountCode.value = null;
    discountAmount.value = 0;
  }

  /**
   * Apply coupon code (stub)
   */
  async function applyCoupon(code) {
    discountCode.value = code;
    discountAmount.value = 0; // Stub logic
  }

  /**
   * Get cart count only
   */
  async function fetchCount() {
    await fetchCart();
    return itemCount.value;
  }

  /**
   * Check if product is in cart
   */
  function isInCart(productId, variantId = null) {
    return items.value.some(item => item.productId === productId);
  }

  /**
   * Get item quantity in cart
   */
  function getItemQuantity(productId, variantId = null) {
    const item = items.value.find(i => i.productId === productId);
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
    cartId.value = null;
    items.value = [];
    subtotal.value = 0;
    discountCode.value = null;
    discountAmount.value = 0;
    isLoading.value = false;
    error.value = null;
  }

  return {
    items,
    subtotal,
    discountCode,
    discountAmount,
    isLoading,
    error,
    cartId,

    itemCount,
    total,
    isEmpty,
    hasDiscount,

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
