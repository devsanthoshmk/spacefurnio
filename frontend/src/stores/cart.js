/**
 * ===========================================
 * CART STORE
 * ===========================================
 * Manages shopping cart state
 * Pinia setup store using ref() and computed()
 * Supports local guest mode and Worker API for authenticated users
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { getProduct } from '@/api/shopApi'
import {
  getLocalCart,
  addToLocalCart as addToLocalCartFn,
  updateLocalCartItem,
  removeFromLocalCart as removeFromLocalCartFn,
  clearLocalCart,
} from '@/lib/localCart'

export const useCartStore = defineStore('cart', () => {
  // ===========================================
  // STATE
  // ===========================================

  const items = ref([])
  const enrichedItems = ref([])
  const subtotal = ref(0)
  const discountCode = ref(null)
  const discountAmount = ref(0)
  const coupon = ref(null)
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const error = ref(null)
  const isDrawerOpen = ref(false)

  const cartId = ref(null)
  const isLocalMode = ref(false)
  const isSyncing = ref(false)
  const syncError = ref(null)

  // ===========================================
  // GETTERS (COMPUTED)
  // ===========================================

  const itemCount = computed(() => {
    return items.value?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0
  })

  const total = computed(() => {
    return Math.max(0, Math.round((subtotal.value - discountAmount.value) * 100) / 100)
  })

  const isEmpty = computed(() => items.value.length === 0)

  const hasDiscount = computed(() => !!discountCode.value && discountAmount.value > 0)

  const displayItems = computed(() => {
    return enrichedItems.value.length > 0 ? enrichedItems.value : items.value
  })

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Set cart operating mode (local vs authenticated)
   */
  function setMode(authenticated) {
    isLocalMode.value = !authenticated
  }

  /**
   * Toggle or set cart drawer visibility
   */
  function toggleDrawer(open) {
    if (typeof open === 'boolean') {
      isDrawerOpen.value = open
    } else {
      isDrawerOpen.value = !isDrawerOpen.value
    }
  }

  /**
   * Clear active error state
   */
  function clearError() {
    error.value = null
  }

  /**
   * Enrich cart items with product details from catalog DB
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
        if (productResult && productResult.success && productResult.data) {
          const product = productResult.data
          return {
            ...item,
            name: product.name,
            image: product.thumbnail || product.images?.[0] || null,
            primaryImage: product.thumbnail || product.images?.[0] || null,
            slug: product.slug,
            originalPrice: product.originalPrice,
            discount: product.discount,
            colors: product.colors,
            product,
          }
        }
        return {
          ...item,
          name: item.name || item.product?.name || 'Product',
          image: item.image || item.product?.image?.src || null,
          primaryImage: item.primaryImage || item.product?.image?.src || null,
          slug: item.slug || item.product?.slug || null,
        }
      })
    } catch (err) {
      console.warn('Enrich cart items warning:', err)
      enrichedItems.value = items.value.map((item) => ({
        ...item,
        name: item.name || item.product?.name || 'Product',
        image: item.image || item.product?.image?.src || null,
      }))
    }
  }

  /**
   * Recalculate subtotal from items list
   */
  function calculateSubtotal() {
    const sum = items.value.reduce((acc, item) => {
      const unit = parseFloat(item.unitPrice || item.price_snapshot || 0)
      const qty = Number(item.quantity) || 0
      return acc + unit * qty
    }, 0)
    subtotal.value = Math.round(sum * 100) / 100
  }

  /**
   * Fetch cart from Worker API or localStorage
   */
  async function fetchCart() {
    try {
      isLoading.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        const localItems = getLocalCart()
        items.value = localItems.map((item) => ({
          id: `local_${item.productId}`,
          productId: item.productId,
          name: null,
          image: null,
          unitPrice: parseFloat(item.priceSnapshot || 0),
          quantity: item.quantity,
          createdAt: item.addedAt,
        }))
        calculateSubtotal()
        await enrichItems()
        items.value = enrichedItems.value
        return
      }

      const cartData = await api.getCart()

      if (cartData) {
        cartId.value = cartData.cart?.id || cartData.id || null
        const rawItems = cartData.items || cartData.cart_items || []

        items.value = rawItems.map((ci) => {
          const unitPrice = parseFloat(ci.unitPrice || ci.price_snapshot || 0)
          const prodObj = ci.product || null
          return {
            id: ci.id,
            productId: ci.productId || ci.product_id,
            name: prodObj?.name || null,
            image: prodObj?.image?.src || null,
            primaryImage: prodObj?.image?.src || null,
            slug: prodObj?.slug || null,
            unitPrice,
            quantity: ci.quantity,
            totalPrice: ci.totalPrice || unitPrice * ci.quantity,
            product: prodObj,
            createdAt: ci.createdAt || ci.created_at,
          }
        })

        if (cartData.subtotal !== undefined) {
          subtotal.value = parseFloat(cartData.subtotal) || 0
        } else {
          calculateSubtotal()
        }
      } else {
        cartId.value = null
        items.value = []
        subtotal.value = 0
      }

      await enrichItems()
      items.value = enrichedItems.value

      // Revalidate active coupon if present
      if (discountCode.value) {
        await applyCoupon(discountCode.value).catch(() => {
          removeCoupon()
        })
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch cart'
      console.warn('Fetch cart warning:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add item to cart
   */
  async function addItem(productId, quantity = 1, priceSnapshot = null) {
    try {
      isUpdating.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        let price = priceSnapshot
        if (price === null || price === undefined) {
          const productResult = await getProduct(productId)
          price = productResult.success ? productResult.data.price : 0
        }
        addToLocalCartFn(productId, quantity, price)
        await fetchCart()
        return true
      }

      // Authenticated via Worker API
      let resolvedPrice = priceSnapshot
      if (resolvedPrice === null || resolvedPrice === undefined) {
        const productResult = await getProduct(productId)
        resolvedPrice = productResult.success ? productResult.data.price : 0
      }

      await api.addToCart({
        product_id: productId,
        quantity,
        price_snapshot: resolvedPrice,
      })

      await fetchCart()
      return true
    } catch (err) {
      error.value = err.message || 'Failed to add item to cart'
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Update item quantity in cart
   */
  async function updateQuantity(itemId, quantity) {
    const itemIndex = items.value.findIndex((i) => i.id === itemId)
    const prevQuantity = itemIndex >= 0 ? items.value[itemIndex].quantity : 0
    const productId = itemIndex >= 0 ? items.value[itemIndex].productId : null

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        items.value.splice(itemIndex, 1)
        enrichedItems.value = enrichedItems.value.filter((i) => i.id !== itemId)
      } else {
        items.value[itemIndex].quantity = quantity
        if (enrichedItems.value[itemIndex]) {
          enrichedItems.value[itemIndex].quantity = quantity
        }
      }
      calculateSubtotal()
    }

    try {
      isUpdating.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        if (productId) {
          updateLocalCartItem(productId, quantity)
        }
        return true
      }

      if (quantity <= 0) {
        await api.removeCartItem(itemId)
      } else {
        await api.updateCartItem(itemId, quantity)
      }

      await fetchCart()
      return true
    } catch (err) {
      // Revert on error
      if (itemIndex >= 0 && prevQuantity > 0) {
        items.value[itemIndex].quantity = prevQuantity
        calculateSubtotal()
      }
      error.value = err.message || 'Failed to update quantity'
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Alias for updateQuantity
   */
  async function updateItemQuantity(itemId, quantity) {
    return updateQuantity(itemId, quantity)
  }

  /**
   * Remove item from cart
   */
  async function removeItem(itemId) {
    const removedItem = items.value.find((i) => i.id === itemId)
    const removedEnrichedItem = enrichedItems.value.find((i) => i.id === itemId)
    const productId = removedItem?.productId

    items.value = items.value.filter((i) => i.id !== itemId)
    enrichedItems.value = enrichedItems.value.filter((i) => i.id !== itemId)
    calculateSubtotal()

    try {
      isUpdating.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        if (productId) {
          removeFromLocalCartFn(productId)
        }
        return true
      }

      await api.removeCartItem(itemId)
      await fetchCart()
      return true
    } catch (err) {
      if (removedItem) items.value.push(removedItem)
      if (removedEnrichedItem) enrichedItems.value.push(removedEnrichedItem)
      calculateSubtotal()
      error.value = err.message || 'Failed to remove item'
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Clear entire cart
   */
  async function clearCart() {
    try {
      isLoading.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        clearLocalCart()
        items.value = []
        enrichedItems.value = []
        subtotal.value = 0
        removeCoupon()
        return true
      }

      await api.clearCart()
      items.value = []
      enrichedItems.value = []
      subtotal.value = 0
      removeCoupon()
      return true
    } catch (err) {
      error.value = err.message || 'Failed to clear cart'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Apply discount coupon code
   */
  async function applyCoupon(code) {
    if (!code || typeof code !== 'string') {
      removeCoupon()
      return null
    }

    try {
      error.value = null
      const res = await api.validateCoupon(code.trim(), subtotal.value)

      if (res && res.valid) {
        coupon.value = res.coupon
        discountCode.value = res.coupon?.code || code.trim().toUpperCase()
        discountAmount.value = parseFloat(res.discount_amount || 0)
        return res
      } else {
        removeCoupon()
        throw new Error(res?.message || 'Invalid coupon code')
      }
    } catch (err) {
      removeCoupon()
      error.value = err.message || 'Failed to apply coupon'
      throw err
    }
  }

  /**
   * Remove active coupon
   */
  function removeCoupon() {
    coupon.value = null
    discountCode.value = null
    discountAmount.value = 0
  }

  /**
   * Check if a product is in cart
   */
  function isInCart(productId) {
    return items.value.some((item) => String(item.productId) === String(productId))
  }

  /**
   * Get product quantity currently in cart
   */
  function getItemQuantity(productId) {
    const item = items.value.find((i) => String(i.productId) === String(productId))
    return item ? item.quantity : 0
  }

  /**
   * Sync local guest cart items to backend Worker
   */
  async function syncToDatabase() {
    if (isSyncing.value) return false
    const localItems = getLocalCart()
    if (localItems.length === 0) return true

    try {
      isSyncing.value = true
      syncError.value = null

      for (const localItem of localItems) {
        try {
          const productResult = await getProduct(localItem.productId)
          const price = productResult.success ? productResult.data.price : localItem.priceSnapshot || 0

          await api.addToCart({
            product_id: localItem.productId,
            quantity: localItem.quantity,
            price_snapshot: price,
          })
        } catch (itemErr) {
          console.warn('Failed to sync item to cart:', localItem.productId, itemErr)
        }
      }

      clearLocalCart()
      isLocalMode.value = false
      await fetchCart()
      return true
    } catch (err) {
      console.error('Cart sync error:', err)
      syncError.value = err.message || 'Failed to sync cart'
      throw err
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * Reset store state on logout
   */
  function $reset() {
    items.value = []
    enrichedItems.value = []
    subtotal.value = 0
    discountCode.value = null
    discountAmount.value = 0
    coupon.value = null
    isLoading.value = false
    isUpdating.value = false
    error.value = null
    cartId.value = null
    isLocalMode.value = false
    isSyncing.value = false
    syncError.value = null
  }

  return {
    // State
    items,
    enrichedItems,
    subtotal,
    discountCode,
    discountAmount,
    coupon,
    isLoading,
    isUpdating,
    error,
    isDrawerOpen,
    cartId,
    isLocalMode,
    isSyncing,
    syncError,

    // Getters
    itemCount,
    total,
    isEmpty,
    hasDiscount,
    displayItems,

    // Actions
    fetchCart,
    enrichItems,
    addItem,
    updateQuantity,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    toggleDrawer,
    isInCart,
    getItemQuantity,
    clearError,
    setMode,
    syncToDatabase,
    $reset,
  }
})
