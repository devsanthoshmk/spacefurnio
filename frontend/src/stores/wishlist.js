/**
 * ===========================================
 * WISHLIST STORE
 * ===========================================
 * Manages wishlist state
 * Supports both localStorage (unauthenticated) and database (authenticated) modes
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api as wishlistApi } from '@/lib/api'
import { getProduct } from '@/api/shopApi'
import { useCartStore } from './cart'
import {
  getLocalWishlist,
  addToLocalWishlist as addToLocalWishlistFn,
  removeFromLocalWishlist as removeFromLocalWishlistFn,
  clearLocalWishlist,
  hasLocalWishlist
} from '@/lib/localCart'

export const useWishlistStore = defineStore('wishlist', () => {
// ===========================================
// STATE
// ===========================================

const items = ref([])
const enrichedItems = ref([])
const isPublic = ref(false)
const isLoading = ref(false)
const error = ref(null)
const isLocalMode = ref(false)
const isSyncing = ref(false)
const syncError = ref(null)

const productIds = computed(() => new Set(items.value.map((i) => i.productId)))

  // ===========================================
  // GETTERS
  // ===========================================

  const itemCount = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)

  const displayItems = computed(() => {
    return enrichedItems.value.length > 0 ? enrichedItems.value : items.value
  })

  // ===========================================
  // ACTIONS
  // ===========================================

/**
 * Set the wishlist mode (local or authenticated)
 */
function setMode(authenticated) {
  isLocalMode.value = !authenticated
}

/**
 * Fetch wishlist from server or localStorage and auto-enrich with product details.
 */
async function fetchWishlist() {
  try {
    isLoading.value = true
    error.value = null

    if (isLocalMode.value) {
      const localItems = getLocalWishlist()
      items.value = localItems.map((item) => ({
        id: `local_${item.productId}`,
        productId: item.productId,
        createdAt: item.addedAt,
        product: {
          name: null,
          price: null,
          primaryImage: null,
          slug: null,
        },
        variant: '',
      }))
      await enrichItems()
      return
    }

    const data = await wishlistApi.getWishlist()

    if (Array.isArray(data)) {
      items.value = data.map((wi) => ({
        id: wi.id,
        productId: wi.product_id,
        createdAt: wi.created_at,
        product: {
          name: null,
          price: null,
          primaryImage: null,
          slug: null,
        },
        variant: '',
      }))
    } else {
      items.value = []
    }

    await enrichItems()
  } catch (err) {
    if (err.message && err.message.includes('Unauthorized')) {
      items.value = []
      return
    }
    error.value = err.message
    console.error('Fetch wishlist error:', err)
  } finally {
    isLoading.value = false
  }
}

  /**
   * Enrich wishlist items with product details from catalog DB.
   * Since wishlist_items only stores product_id (products in separate Neon DB),
   * we fetch full product data to display name, price, image, etc.
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
            product: {
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.discount,
              primaryImage: product.thumbnail || product.images?.[0] || null,
              thumbnail: product.thumbnail,
              slug: product.slug,
              colors: product.colors,
              inStock: product.inStock,
            },
          }
        }
        return {
          ...item,
          product: {
            name: item.product?.name || 'Loading...',
            price: null,
            primaryImage: null,
            slug: null,
          },
        }
      })
    } catch (err) {
      console.error('Enrich wishlist items error:', err)
      enrichedItems.value = items.value.map((item) => ({
        ...item,
        product: {
          name: item.product?.name || 'Product',
          price: null,
          primaryImage: null,
          slug: null,
        },
      }))
    }
  }

/**
 * Add item to wishlist (supports both local and authenticated modes)
 */
async function addItem(productId, variantId = null) {
  if (isLocalMode.value) {
    try {
      addToLocalWishlistFn(productId)
      await fetchWishlist()
      return true
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  try {
    isLoading.value = true
    error.value = null

    if (!productIds.value.has(productId)) {
      let wishlistId = await wishlistApi.getWishlistId()
      if (!wishlistId) {
        try {
          await wishlistApi.createWishlist()
          wishlistId = await wishlistApi.getWishlistId()
        } catch {
          error.value = 'Failed to create wishlist. Please login again.'
          return false
        }
      }
      if (!wishlistId) {
        error.value = 'Wishlist not found. Please login again.'
        return false
      }
      await wishlistApi.addWishlistItem({ wishlist_id: wishlistId, product_id: productId })
      await fetchWishlist()
    }
    return true
  } catch (err) {
    if (err.message && err.message.includes('Item already exists')) {
      await fetchWishlist()
    } else {
      error.value = err.message
      throw err
    }
  } finally {
    isLoading.value = false
  }
}

/**
 * Remove item from wishlist (supports both local and authenticated modes)
 */
async function removeItem(itemId) {
  const removedIndex = items.value.findIndex((i) => i.id === itemId)
  const removedItem = items.value[removedIndex]
  const removedEnrichedIndex = enrichedItems.value.findIndex((i) => i.id === itemId)
  const removedEnrichedItem = enrichedItems.value[removedEnrichedIndex]
  const productId = removedItem?.productId

  if (removedIndex >= 0) {
    items.value.splice(removedIndex, 1)
  }
  if (removedEnrichedIndex >= 0) {
    enrichedItems.value.splice(removedEnrichedIndex, 1)
  }

  if (isLocalMode.value && productId) {
    try {
      removeFromLocalWishlistFn(productId)
      return true
    } catch (err) {
      if (removedItem && removedIndex >= 0) {
        items.value.splice(removedIndex, 0, removedItem)
      }
      if (removedEnrichedItem && removedEnrichedIndex >= 0) {
        enrichedItems.value.splice(removedEnrichedIndex, 0, removedEnrichedItem)
      }
      error.value = err.message
      throw err
    }
  }

  try {
    isLoading.value = true
    error.value = null
    await wishlistApi.removeWishlistItem(itemId)
  } catch (err) {
    if (removedItem && removedIndex >= 0) {
      items.value.splice(removedIndex, 0, removedItem)
    }
    if (removedEnrichedItem && removedEnrichedIndex >= 0) {
      enrichedItems.value.splice(removedEnrichedIndex, 0, removedEnrichedItem)
    }
    error.value = err.message
    throw err
  } finally {
    isLoading.value = false
  }
}

/**
 * Remove item by product ID (supports both local and authenticated modes)
 */
async function removeByProductId(productId) {
  const item = items.value.find((i) => i.productId === productId)
  const enrichedItem = enrichedItems.value.find((i) => i.productId === productId)
  if (!item) return

  const removedIndex = items.value.findIndex((i) => i.productId === productId)
  const removedEnrichedIndex = enrichedItems.value.findIndex((i) => i.productId === productId)
  items.value.splice(removedIndex, 1)
  if (removedEnrichedIndex >= 0) {
    enrichedItems.value.splice(removedEnrichedIndex, 1)
  }

  if (isLocalMode.value) {
    try {
      removeFromLocalWishlistFn(productId)
      return true
    } catch (err) {
      items.value.splice(removedIndex, 0, item)
      if (enrichedItem && removedEnrichedIndex >= 0) {
        enrichedItems.value.splice(removedEnrichedIndex, 0, enrichedItem)
      }
      error.value = err.message
      throw err
    }
  }

  try {
    isLoading.value = true
    error.value = null
    await wishlistApi.removeWishlistItemByProductId(productId)
  } catch (err) {
    items.value.splice(removedIndex, 0, item)
    if (enrichedItem && removedEnrichedIndex >= 0) {
      enrichedItems.value.splice(removedEnrichedIndex, 0, enrichedItem)
    }
    error.value = err.message
    throw err
  } finally {
    isLoading.value = false
  }
}

/**
 * Toggle wishlist item
 */
async function toggleItem(productId, productData = null, variantId = null) {
  console.log('[Wishlist] toggleItem called, productId:', productId, 'inWishlist:', isInWishlist(productId))
  const inWishlist = isInWishlist(productId)

  if (inWishlist) {
    console.log('[Wishlist] Removing from wishlist')
    await removeByProductId(productId)
    return false
  } else {
console.log('[Wishlist] Adding to wishlist')
      const result = await addItem(productId)
    console.log('[Wishlist] Add result:', result, 'isInWishlist now:', isInWishlist(productId))
    return result
  }
}

/**
 * Move item to cart (supports both local and authenticated modes)
 */
async function moveToCart(itemId, quantity = 1) {
  try {
    isLoading.value = true
    error.value = null

    const itemToMove = items.value.find((i) => i.id === itemId)
    if (!itemToMove) return

    const cartStore = useCartStore()
    await cartStore.addItem(itemToMove.productId, quantity)

    if (isLocalMode.value) {
      removeFromLocalWishlistFn(itemToMove.productId)
    } else {
      await wishlistApi.removeWishlistItem(itemId)
    }

    items.value = items.value.filter((i) => i.id !== itemId)
    enrichedItems.value = enrichedItems.value.filter((i) => i.id !== itemId)

    return true
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    isLoading.value = false
  }
}

  /**
   * Update wishlist visibility (stub)
   */
  async function setVisibility(isPublicValue) {
    isPublic.value = isPublicValue
  }

  /**
   * Get wishlist count only
   */
  async function fetchCount() {
    await fetchWishlist()
    return itemCount.value
  }

/**
 * Check if product is in wishlist (checks both local and DB items)
 */
function isInWishlist(productId) {
  if (isLocalMode.value) {
    const localItems = getLocalWishlist()
    return localItems.some(item => item.productId === productId)
  }
  return productIds.value.has(productId)
}

/**
 * Get wishlist item by product ID
 */
function getItemByProductId(productId) {
  return items.value.find((i) => i.productId === productId)
}

/**
 * Clear error
 */
function clearError() {
  error.value = null
}

/**
 * Sync local wishlist items to database
 * Called when user logs in or registers
 */
async function syncToDatabase() {
  if (!isLocalMode.value) return false
  if (isSyncing.value) return false

  const localItems = getLocalWishlist()
  if (localItems.length === 0) return true

  try {
    isSyncing.value = true
    syncError.value = null

    let wishlistId = await wishlistApi.getWishlistId()
    if (!wishlistId) {
      await wishlistApi.createWishlist()
      wishlistId = await wishlistApi.getWishlistId()
    }

    if (!wishlistId) {
      throw new Error('Failed to get or create wishlist')
    }

    const existingData = await wishlistApi.getWishlist()
    const existingProductIds = new Set((existingData || []).map(item => item.product_id))
    const failedItems = []

    for (const localItem of localItems) {
      try {
        const productResult = await getProduct(localItem.productId)
        if (!productResult.success) {
          failedItems.push({ productId: localItem.productId, reason: 'Product not found' })
          continue
        }

        if (!existingProductIds.has(localItem.productId)) {
          await wishlistApi.addWishlistItem({
            wishlist_id: wishlistId,
            product_id: localItem.productId
          })
        }
      } catch (itemErr) {
        console.error('Failed to sync wishlist item:', localItem.productId, itemErr)
        failedItems.push({ productId: localItem.productId, reason: itemErr.message })
      }
    }

    clearLocalWishlist()
    isLocalMode.value = false
    await fetchWishlist()

    if (failedItems.length > 0) {
      console.warn('Some wishlist items failed to sync:', failedItems)
      syncError.value = `${failedItems.length} item(s) could not be synced`
    }

    return true
  } catch (err) {
    console.error('Wishlist sync failed:', err)
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

  if (wasLocal && doSync && hasLocalWishlist()) {
    await syncToDatabase()
  } else if (!wasLocal) {
    await fetchWishlist()
  }
}

/**
 * Reset store (on logout)
 */
function $reset() {
  items.value = []
  enrichedItems.value = []
  isPublic.value = false
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
  isPublic,
  isLoading,
  error,
  itemCount,
  isEmpty,
  productIds,
  isLocalMode,
  isSyncing,
  syncError,

  fetchWishlist,
  enrichItems,
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
  setMode,
  syncToDatabase,
  setAuthenticatedMode,
  $reset,
}
})
