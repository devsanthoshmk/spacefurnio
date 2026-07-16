/**
 * ===========================================
 * CART STORE
 * ===========================================
 * Manages shopping cart state
 * Supports both localStorage (unauthenticated) and database (authenticated) modes
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api as cartApi } from '@/lib/api'
import { getProduct } from '@/api/shopApi'
import {
  getLocalCart,
  addToLocalCart as addToLocalCartFn,
  updateLocalCartItem,
  removeFromLocalCart as removeFromLocalCartFn,
  clearLocalCart,
  hasLocalCart
} from '@/lib/localCart'

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
const isLocalMode = ref(false)
const isSyncing = ref(false)
const syncError = ref(null)

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
 * Set the cart mode (local or authenticated)
 */
function setMode(authenticated) {
  isLocalMode.value = !authenticated
}

/**
 * Fetch cart from server or localStorage and auto-enrich with product details.
 */
async function fetchCart() {
  try {
    isLoading.value = true
    error.value = null

    if (isLocalMode.value) {
      const localItems = getLocalCart()
      items.value = localItems.map(item => ({
        id: `local_${item.productId}`,
        productId: item.productId,
        name: null,
        image: null,
        unitPrice: parseFloat(item.priceSnapshot || 0),
        quantity: item.quantity,
      }))
      subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      await enrichItems()
      items.value = enrichedItems.value
      return
    }

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
 * Add item to cart (supports both local and authenticated modes)
 */
async function addItem(productId, quantity = 1, variantId = null) {
  if (isLocalMode.value) {
    try {
      const productResult = await getProduct(productId)
      const price = productResult.success ? productResult.data.price : 0
      addToLocalCartFn(productId, quantity, price)
      await fetchCart()
      return true
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  if (!cartId.value) {
    await fetchCart()
    if (!cartId.value) {
      try {
        await cartApi.createCart()
        await fetchCart()
      } catch {
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
 * Update item quantity (supports both local and authenticated modes)
 */
async function updateItemQuantity(itemId, quantity) {
  const itemIndex = items.value.findIndex((i) => i.id === itemId)
  const previousQuantity = itemIndex >= 0 ? items.value[itemIndex].quantity : 0
  const productId = itemIndex >= 0 ? items.value[itemIndex].productId : null

  if (itemIndex >= 0) {
    items.value[itemIndex].quantity = quantity
    subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }

  if (isLocalMode.value && productId) {
    try {
      updateLocalCartItem(productId, quantity)
      return true
    } catch (err) {
      if (itemIndex >= 0) {
        items.value[itemIndex].quantity = previousQuantity
        subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      }
      error.value = err.message
      throw err
    }
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
 * Remove item from cart (supports both local and authenticated modes)
 */
async function removeItem(itemId) {
  const removedItem = items.value.find((i) => i.id === itemId)
  const removedEnrichedItem = enrichedItems.value.find((i) => i.id === itemId)
  const productId = removedItem?.productId

  items.value = items.value.filter((i) => i.id !== itemId)
  enrichedItems.value = enrichedItems.value.filter((i) => i.id !== itemId)
  subtotal.value = items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  if (isLocalMode.value && productId) {
    try {
      removeFromLocalCartFn(productId)
      return true
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
    }
  }

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
 * Clear entire cart (supports both local and authenticated modes)
 */
async function clearCart() {
  if (isLocalMode.value) {
    try {
      clearLocalCart()
      items.value = []
      enrichedItems.value = []
      subtotal.value = 0
      return true
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  if (!cartId.value) return
  try {
    isLoading.value = true
    error.value = null
    await cartApi.clearCart(cartId.value)
    items.value = []
    enrichedItems.value = []
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
 * Check if product is in cart (checks both local and DB items)
 */
function isInCart(productId, variantId = null) {
  if (isLocalMode.value) {
    const localItems = getLocalCart()
    return localItems.some(item => item.productId === productId)
  }
  return items.value.some((item) => item.productId === productId)
}

/**
 * Get item quantity in cart (checks both local and DB items)
 */
function getItemQuantity(productId, variantId = null) {
  if (isLocalMode.value) {
    const localItems = getLocalCart()
    const item = localItems.find(i => i.productId === productId)
    return item?.quantity || 0
  }
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
 * Sync local cart items to database
 * Called when user logs in or registers
 */
async function syncToDatabase() {
  if (!isLocalMode.value) return false
  if (isSyncing.value) return false

  const localItems = getLocalCart()
  if (localItems.length === 0) return true

  try {
    isSyncing.value = true
    syncError.value = null

    let cartData = await cartApi.getCart()
    if (!cartData) {
      await cartApi.createCart()
      cartData = await cartApi.getCart()
    }

    if (!cartData || !cartData.id) {
      throw new Error('Failed to get or create cart')
    }

    cartId.value = cartData.id
    const existingItems = cartData.cart_items || []
    const failedItems = []

    for (const localItem of localItems) {
      try {
        const productResult = await getProduct(localItem.productId)
        if (!productResult.success) {
          failedItems.push({ productId: localItem.productId, reason: 'Product not found' })
          continue
        }

        const currentPrice = productResult.data.price
        const existingItem = existingItems.find(
          ei => ei.product_id === localItem.productId
        )

        if (existingItem) {
          const newQuantity = existingItem.quantity + localItem.quantity
          await cartApi.updateCartItem(existingItem.id, newQuantity)
        } else {
          await cartApi.addCartItem({
            cart_id: cartId.value,
            product_id: localItem.productId,
            quantity: localItem.quantity,
            price_snapshot: currentPrice,
          })
        }
      } catch (itemErr) {
        console.error('Failed to sync item:', localItem.productId, itemErr)
        failedItems.push({ productId: localItem.productId, reason: itemErr.message })
      }
    }

    clearLocalCart()
    isLocalMode.value = false
    await fetchCart()

    if (failedItems.length > 0) {
      console.warn('Some items failed to sync:', failedItems)
      syncError.value = `${failedItems.length} item(s) could not be synced`
    }

    return true
  } catch (err) {
    console.error('Cart sync failed:', err)
    syncError.value = err.message
    throw err
  } finally {
    isSyncing.value = false
  }
}

/**
 * Set mode and optionally sync
 */
async function setAuthenticatedMode(doSync = true) {
  const wasLocal = isLocalMode.value
  isLocalMode.value = false

  if (wasLocal && doSync && hasLocalCart()) {
    await syncToDatabase()
  } else if (!wasLocal) {
    await fetchCart()
  }
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
  isLocalMode.value = false
  isSyncing.value = false
  syncError.value = null
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
  isLocalMode,
  isSyncing,
  syncError,

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
  setMode,
  syncToDatabase,
  setAuthenticatedMode,
  $reset,
}
})
