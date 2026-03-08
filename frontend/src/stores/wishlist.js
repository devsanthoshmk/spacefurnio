/**
 * ===========================================
 * WISHLIST STORE
 * ===========================================
 * Manages wishlist state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api as wishlistApi } from '@/lib/api'
import { getProduct } from '@/api/shopApi'
import { useCartStore } from './cart'

export const useWishlistStore = defineStore('wishlist', () => {
  // ===========================================
  // STATE
  // ===========================================

  const items = ref([])
  const enrichedItems = ref([])
  const isPublic = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

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
   * Fetch wishlist from server and auto-enrich with product details.
   *
   * NOTE: products table was dropped from the main DB (migration 0001_big_dormammu).
   * Products live in a separate Neon project (icy-union-81751721), so PostgREST
   * cannot do embedded resource joins like products(*).
   * We fetch flat wishlist_items rows and store product_id for lookup.
   * This function automatically enriches items with product data so all
   * components get full details automatically.
   */
  async function fetchWishlist() {
    try {
      isLoading.value = true
      error.value = null

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
 * Add item to wishlist
 */
async function addItem(productId, variantId = null) {
  console.log('[Wishlist] addItem called with productId:', productId)
  try {
    isLoading.value = true
    error.value = null

    if (!productIds.value.has(productId)) {
      console.log('[Wishlist] Product not in wishlist, proceeding to add')
      let wishlistId = await wishlistApi.getWishlistId()
      console.log('[Wishlist] Got wishlistId:', wishlistId)
      if (!wishlistId) {
        console.log('[Wishlist] No wishlist found, creating new one')
        try {
          await wishlistApi.createWishlist()
          wishlistId = await wishlistApi.getWishlistId()
          console.log('[Wishlist] Created wishlist, new wishlistId:', wishlistId)
        } catch (e) {
          console.error('[Wishlist] Failed to create wishlist:', e)
          error.value = 'Failed to create wishlist. Please login again.'
          return false
        }
      }
      if (!wishlistId) {
        console.error('[Wishlist] Still no wishlistId after creation')
        error.value = 'Wishlist not found. Please login again.'
        return false
      }
      console.log('[Wishlist] Adding item to wishlist, productId:', productId, 'wishlistId:', wishlistId)
      await wishlistApi.addWishlistItem({ wishlist_id: wishlistId, product_id: productId })
      console.log('[Wishlist] Item added successfully, fetching updated wishlist')
      await fetchWishlist()
      console.log('[Wishlist] Wishlist fetched, items now:', items.value.length)
    } else {
      console.log('[Wishlist] Product already in wishlist')
    }
    return true
  } catch (err) {
    console.error('[Wishlist] Error in addItem:', err)
    if (err.message && err.message.includes('Item already exists')) {
      console.log('[Wishlist] Item already exists, fetching wishlist')
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
 * Remove item from wishlist
 */
async function removeItem(itemId) {
  const removedIndex = items.value.findIndex((i) => i.id === itemId)
  const removedItem = items.value[removedIndex]
  const removedEnrichedIndex = enrichedItems.value.findIndex((i) => i.id === itemId)
  const removedEnrichedItem = enrichedItems.value[removedEnrichedIndex]

  if (removedIndex >= 0) {
    items.value.splice(removedIndex, 1)
  }
  if (removedEnrichedIndex >= 0) {
    enrichedItems.value.splice(removedEnrichedIndex, 1)
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
 * Remove item by product ID
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
    const result = await addItem(productId, variantId)
    console.log('[Wishlist] Add result:', result, 'isInWishlist now:', isInWishlist(productId))
    return result
  }
}

/**
 * Move item to cart
 */
async function moveToCart(itemId, quantity = 1) {
  try {
    isLoading.value = true
    error.value = null

    const itemToMove = items.value.find((i) => i.id === itemId)
    if (!itemToMove) return

    const cartStore = useCartStore()
    await cartStore.addItem(itemToMove.productId, quantity)

    await wishlistApi.removeWishlistItem(itemId)
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
   * Check if product is in wishlist
   */
  function isInWishlist(productId) {
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
   * Reset store (on logout)
   */
  function $reset() {
    items.value = []
    enrichedItems.value = []
    isPublic.value = false
    isLoading.value = false
    error.value = null
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
    $reset,
  }
})
