/**
 * ===========================================
 * CART STORE
 * ===========================================
 * Manages shopping cart state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api as cartApi } from '@/lib/api'
import { getProduct } from '@/api/shopApi'

export const useCartStore = defineStore('cart', () => {
  // ===========================================
  // STATE
  // ===========================================

  const cartId = ref(null)
  const items = ref([])
  const enrichedItems = ref([])
  const subtotal = ref(0)
  const discountCode = ref(null)
  const discountAmount = ref(0)
  const isLoading = ref(false)
  const error = ref(null)

  // ===========================================
  // GETTERS
  // ===========================================

  const itemCount = computed(() => {
    return items.value?.reduce((sum, item) => sum + item.quantity, 0) || 0
  })

  const total = computed(() => {
    return subtotal.value - discountAmount.value
  })

  const isEmpty = computed(() => items.value.length === 0)

  const hasDiscount = computed(() => !!discountCode.value)

  const displayItems = computed(() => {
    return enrichedItems.value.length > 0 ? enrichedItems.value : items.value
  })

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Fetch cart from server and auto-enrich with product details.
   *
   * NOTE: products table was dropped from the main DB (migration 0001_big_dormammu).
   * Products live in a separate Neon project, so PostgREST cannot join products(*).
   * We use price_snapshot from cart_items (price at time of add) which is the
   * correct ecommerce pattern anyway. This function automatically enriches items
   * with product data so all components get full details automatically.
   */
  async function fetchCart() {
    try {
      isLoading.value = true
      error.value = null

      const cartData = await cartApi.getCart()

      if (cartData) {
        cartId.value = cartData.id
        const newItems = (cartData.cart_items || []).map((ci) => ({
          id: ci.id,
          productId: ci.product_id,
          name: null,
          image: null,
          unitPrice: parseFloat(ci.price_snapshot || 0),
          quantity: ci.quantity,
        }))
        items.value = newItems
        subtotal.value = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      } else {
        cartId.value = null
        items.value = []
        subtotal.value = 0
      }

      await enrichItems()
      items.value = enrichedItems.value
    } catch (err) {
      error.value = err.message
      console.error('Fetch cart error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Enrich cart items with product details from catalog DB.
   * Since cart_items only stores product_id (products in separate Neon DB),
   * we fetch full product data to display name, image, etc.
   */
  async function enrichItems() {
    if (items.value.length === 0) {
      enrichedItems.value = []
      return
    }

    try {
      const productIds = items.value.map((item) => item.productId)
      const results = await Promise.all(productIds.map((id) => getProduct(id)))

      enrichedItems.value = items.value.map((item, index) => {
        const productResult = results[index]
        if (productResult.success && productResult.data) {
          const product = productResult.data
          return {
            ...item,
            name: product.name,
            image: product.thumbnail || product.images?.[0] || null,
            primaryImage: product.thumbnail,
            slug: product.slug,
            originalPrice: product.originalPrice,
            discount: product.discount,
            colors: product.colors,
          }
        }
        return {
          ...item,
          name: item.name || 'Loading...',
          image: null,
          primaryImage: null,
          slug: null,
        }
      })
    } catch (err) {
      console.error('Enrich cart items error:', err)
      enrichedItems.value = items.value.map((item) => ({
        ...item,
        name: item.name || 'Product',
        image: null,
      }))
    }
  }

  /**
   * Add item to cart
   */
  async function addItem(productId, quantity = 1, variantId = null) {
    if (!cartId.value) {
      await fetchCart()
      if (!cartId.value) {
        try {
          await cartApi.createCart()
          await fetchCart()
        } catch (e) {
          error.value = 'Failed to create cart. Please login again.'
          return
        }
      }
    }

    try {
      isLoading.value = true
      error.value = null

      const existingItem = items.value.find((i) => i.productId === productId)
      if (existingItem) {
        existingItem.quantity += quantity
        await cartApi.updateCartItem(existingItem.id, existingItem.quantity)
      } else {
        const productResult = await getProduct(productId)
        const price = productResult.success ? productResult.data.price : 0
        await cartApi.addCartItem({
          cart_id: cartId.value,
          product_id: productId,
          quantity: quantity,
          price_snapshot: price,
        })
      }

      await fetchCart()
      return true
    } catch (err) {
      if (err.message && err.message.includes('Item already exists.')) {
        await fetchCart()
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update item quantity
   */
  async function updateItemQuantity(itemId, quantity) {
    const itemIndex = items.value.findIndex((i) => i.id === itemId)
    const previousQuantity = itemIndex >= 0 ? items.value[itemIndex].quantity : 0

    if (itemIndex >= 0) {
      items.value[itemIndex].quantity = quantity
      subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    }

    try {
      isLoading.value = true
      error.value = null
      await cartApi.updateCartItem(itemId, quantity)
      return true
    } catch (err) {
      if (itemIndex >= 0) {
        items.value[itemIndex].quantity = previousQuantity
        subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      }
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

/**
 * Remove item from cart
 */
async function removeItem(itemId) {
  const removedItem = items.value.find((i) => i.id === itemId)
  const removedEnrichedItem = enrichedItems.value.find((i) => i.id === itemId)
  items.value = items.value.filter((i) => i.id !== itemId)
  enrichedItems.value = enrichedItems.value.filter((i) => i.id !== itemId)
  subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  try {
    isLoading.value = true
    error.value = null
    await cartApi.removeCartItem(itemId)
  } catch (err) {
    if (removedItem) {
      items.value.push(removedItem)
    }
    if (removedEnrichedItem) {
      enrichedItems.value.push(removedEnrichedItem)
    }
    subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    error.value = err.message
    throw err
  } finally {
    isLoading.value = false
  }
}

  /**
   * Clear entire cart
   */
  async function clearCart() {
    if (!cartId.value) return
    try {
      isLoading.value = true
      error.value = null
      await cartApi.clearCart(cartId.value)
      items.value = []
      subtotal.value = 0
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove coupon (stub)
   */
  async function removeCoupon() {
    discountCode.value = null
    discountAmount.value = 0
  }

  /**
   * Apply coupon code (stub)
   */
  async function applyCoupon(code) {
    discountCode.value = code
    discountAmount.value = 0
  }

  /**
   * Get cart count only
   */
  async function fetchCount() {
    await fetchCart()
    return itemCount.value
  }

  /**
   * Check if product is in cart
   */
  function isInCart(productId, variantId = null) {
    return items.value.some((item) => item.productId === productId)
  }

  /**
   * Get item quantity in cart
   */
  function getItemQuantity(productId, variantId = null) {
    const item = items.value.find((i) => i.productId === productId)
    return item?.quantity || 0
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null
  }

  /**
   * Reset store (on logout)
   */
  function $reset() {
    cartId.value = null
    items.value = []
    enrichedItems.value = []
    subtotal.value = 0
    discountCode.value = null
    discountAmount.value = 0
    isLoading.value = false
    error.value = null
  }

  return {
    items,
    enrichedItems,
    displayItems,
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
    enrichItems,
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
  }
})
