/**
 * ===========================================
 * WISHLIST STORE
 * ===========================================
 * Manages wishlist state
 * Pinia setup store using ref() and computed()
 * Supports local guest mode and Worker API for authenticated users
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { getProduct } from '@/api/shopApi'
import { useCartStore } from './cart'
import {
  getLocalWishlist,
  addToLocalWishlist as addToLocalWishlistFn,
  removeFromLocalWishlist as removeFromLocalWishlistFn,
  clearLocalWishlist,
} from '@/lib/localCart'

export const useWishlistStore = defineStore('wishlist', () => {
  // ===========================================
  // STATE
  // ===========================================

  const items = ref([])
  const enrichedItems = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const isDrawerOpen = ref(false)

  const isLocalMode = ref(false)
  const isSyncing = ref(false)
  const syncError = ref(null)

  // ===========================================
  // GETTERS (COMPUTED)
  // ===========================================

  const itemCount = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)
  const productIds = computed(() => new Set(items.value.map((i) => String(i.productId))))

  const displayItems = computed(() => {
    return enrichedItems.value.length > 0 ? enrichedItems.value : items.value
  })

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Check if a product ID is in the wishlist
   */
  function hasItem(productId) {
    if (!productId) return false
    return productIds.value.has(String(productId))
  }

  /**
   * Alias for hasItem
   */
  function isInWishlist(productId) {
    return hasItem(productId)
  }

  /**
   * Set wishlist operating mode (local vs authenticated)
   */
  function setMode(authenticated) {
    isLocalMode.value = !authenticated
  }

  /**
   * Toggle or set wishlist drawer visibility
   */
  function toggleDrawer(open) {
    if (typeof open === 'boolean') {
      isDrawerOpen.value = open
    } else {
      isDrawerOpen.value = !isDrawerOpen.value
    }
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  /**
   * Enrich wishlist items with product details from catalog DB
   */
  async function enrichItems() {
    if (items.value.length === 0) {
      enrichedItems.value = []
      return
    }

    try {
      const pIds = items.value.map((item) => item.productId)
      const results = await Promise.all(pIds.map((id) => getProduct(id)))

      enrichedItems.value = items.value.map((item, index) => {
        const productResult = results[index]
        if (productResult && productResult.success && productResult.data) {
          const product = productResult.data
          return {
            ...item,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.discount,
              primaryImage: product.thumbnail || product.images?.[0] || null,
              thumbnail: product.thumbnail,
              slug: product.slug,
              colors: product.colors,
              inStock: product.inStock,
              rating: product.rating,
              review_count: product.reviews,
            },
          }
        }
        return {
          ...item,
          product: {
            id: item.productId,
            name: item.product?.name || 'Product',
            price: item.product?.price || null,
            primaryImage: item.product?.image?.src || item.product?.primaryImage || null,
            thumbnail: item.product?.image?.src || item.product?.primaryImage || null,
            slug: item.product?.slug || null,
          },
        }
      })
    } catch (err) {
      console.warn('Enrich wishlist items warning:', err)
      enrichedItems.value = items.value.map((item) => ({
        ...item,
        product: {
          id: item.productId,
          name: item.product?.name || 'Product',
          price: item.product?.price || null,
          primaryImage: item.product?.image?.src || null,
          thumbnail: item.product?.image?.src || null,
          slug: item.product?.slug || null,
        },
      }))
    }
  }

  /**
   * Fetch wishlist from Worker API or localStorage
   */
  async function fetchWishlist() {
    try {
      isLoading.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        const localItems = getLocalWishlist()
        items.value = localItems.map((item) => ({
          id: `local_${item.productId}`,
          productId: item.productId,
          createdAt: item.addedAt,
          product: null,
        }))
        await enrichItems()
        items.value = enrichedItems.value
        return
      }

      const res = await api.getWishlist()
      const rawItems = res?.items || (Array.isArray(res) ? res : [])

      items.value = rawItems.map((wi) => ({
        id: wi.id,
        productId: wi.productId || wi.product_id,
        createdAt: wi.createdAt || wi.created_at,
        product: wi.product
          ? {
              id: wi.product.id,
              name: wi.product.name,
              slug: wi.product.slug,
              price: wi.product.price || (wi.product.price_cents ? wi.product.price_cents / 100 : 0),
              rating: wi.product.rating,
              review_count: wi.product.review_count,
              brandName: wi.product.brandName,
              primaryImage: wi.product.image?.src || null,
              thumbnail: wi.product.image?.src || null,
            }
          : null,
      }))

      await enrichItems()
      items.value = enrichedItems.value
    } catch (err) {
      error.value = err.message || 'Failed to fetch wishlist'
      console.warn('Fetch wishlist warning:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add item to wishlist
   */
  async function addItem(productId) {
    if (!productId) return false

    try {
      isLoading.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        addToLocalWishlistFn(productId)
        await fetchWishlist()
        return true
      }

      await api.addToWishlist(productId)
      await fetchWishlist()
      return true
    } catch (err) {
      error.value = err.message || 'Failed to add to wishlist'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove item from wishlist by item ID
   */
  async function removeItem(itemId) {
    const removedItem = items.value.find((i) => i.id === itemId)
    const productId = removedItem?.productId

    items.value = items.value.filter((i) => i.id !== itemId)
    enrichedItems.value = enrichedItems.value.filter((i) => i.id !== itemId)

    try {
      isLoading.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        if (productId) {
          removeFromLocalWishlistFn(productId)
        }
        return true
      }

      await api.removeFromWishlist(itemId)
      return true
    } catch (err) {
      if (removedItem) {
        items.value.push(removedItem)
      }
      error.value = err.message || 'Failed to remove from wishlist'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove item by product ID
   */
  async function removeByProductId(productId) {
    const item = items.value.find((i) => String(i.productId) === String(productId))
    if (item) {
      return removeItem(item.id)
    }

    const token = api.getToken()
    if (isLocalMode.value || !token) {
      removeFromLocalWishlistFn(productId)
      items.value = items.value.filter((i) => String(i.productId) !== String(productId))
      enrichedItems.value = enrichedItems.value.filter((i) => String(i.productId) !== String(productId))
      return true
    }

    try {
      isLoading.value = true
      await api.removeWishlistItemByProductId(productId)
      items.value = items.value.filter((i) => String(i.productId) !== String(productId))
      enrichedItems.value = enrichedItems.value.filter((i) => String(i.productId) !== String(productId))
      return true
    } catch (err) {
      error.value = err.message || 'Failed to remove item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Toggle item in wishlist
   */
  async function toggleItem(productId) {
    if (hasItem(productId)) {
      await removeByProductId(productId)
      return false
    } else {
      await addItem(productId)
      return true
    }
  }

  /**
   * Move wishlist item to cart
   */
  async function moveToCart(itemOrId, quantity = 1) {
    try {
      isLoading.value = true
      error.value = null

      const itemId = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId.id : itemOrId
      const targetItem = items.value.find((i) => i.id === itemId) || (typeof itemOrId === 'object' ? itemOrId : null)

      if (!targetItem) {
        throw new Error('Wishlist item not found')
      }

      const cartStore = useCartStore()
      await cartStore.addItem(targetItem.productId, quantity)

      await removeItem(itemId)
      return true
    } catch (err) {
      error.value = err.message || 'Failed to move item to cart'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear entire wishlist
   */
  async function clearWishlist() {
    try {
      isLoading.value = true
      error.value = null

      const token = api.getToken()
      if (isLocalMode.value || !token) {
        clearLocalWishlist()
        items.value = []
        enrichedItems.value = []
        return true
      }

      await api.clearWishlist()
      items.value = []
      enrichedItems.value = []
      return true
    } catch (err) {
      error.value = err.message || 'Failed to clear wishlist'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sync local guest wishlist to backend Worker
   */
  async function syncToDatabase() {
    if (isSyncing.value) return false
    const localItems = getLocalWishlist()
    if (localItems.length === 0) return true

    try {
      isSyncing.value = true
      syncError.value = null

      for (const localItem of localItems) {
        try {
          await api.addToWishlist(localItem.productId)
        } catch (itemErr) {
          console.warn('Failed to sync item to wishlist:', localItem.productId, itemErr)
        }
      }

      clearLocalWishlist()
      isLocalMode.value = false
      await fetchWishlist()
      return true
    } catch (err) {
      console.error('Wishlist sync error:', err)
      syncError.value = err.message || 'Failed to sync wishlist'
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
    isLoading.value = false
    error.value = null
    isLocalMode.value = false
    isSyncing.value = false
    syncError.value = null
  }

  return {
    // State
    items,
    enrichedItems,
    isLoading,
    error,
    isDrawerOpen,
    isLocalMode,
    isSyncing,
    syncError,

    // Getters
    itemCount,
    isEmpty,
    productIds,
    displayItems,
    hasItem,
    isInWishlist,

    // Actions
    fetchWishlist,
    enrichItems,
    addItem,
    removeItem,
    removeByProductId,
    toggleItem,
    moveToCart,
    clearWishlist,
    toggleDrawer,
    clearError,
    setMode,
    syncToDatabase,
    $reset,
  }
})
