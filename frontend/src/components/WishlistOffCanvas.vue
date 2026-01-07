<template>
  <!--
    ================================================================
    WISHLIST OFF-CANVAS COMPONENT
    ================================================================
    Route-driven off-canvas wishlist panel using PrimeVue Drawer.
    
    ROUTE-BASED MODAL LOGIC:
    - Wishlist visibility is computed from route (route.meta.isWishlistOpen)
    - Opening wishlist: pushes /wishlist suffix to current path
    - Closing wishlist: calls router.back() to restore previous URL
    - Works from any route depth: /shop/category/item/wishlist
    - Browser back/forward correctly opens/closes wishlist
    - Direct navigation to /wishlist auto-opens wishlist
    
    STATE MANAGEMENT:
    - Wishlist data comes from existing wishlist.js Pinia store
    - No duplicated open/close state - derived from route only
    ================================================================
  -->
  <Drawer
    v-model:visible="isVisible"
    position="right"
    :modal="true"
    :dismissable="true"
    :showCloseIcon="false"
    :blockScroll="true"
    class="wishlist-drawer"
    :pt="{
      root: { class: 'w-full max-w-md' },
      mask: { class: 'wishlist-backdrop' }
    }"
    @hide="handleClose"
  >
    <!-- Wishlist Header -->
    <template #header>
      <div class="flex items-center justify-between w-full px-2 py-1">
        <div class="flex items-center gap-3">
          <i class="pi pi-heart-fill text-xl text-pink-500"></i>
          <h2 class="text-xl font-bold text-gray-900">Your Wishlist</h2>
          <span 
            v-if="wishlist.itemCount > 0" 
            class="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
          >
            {{ wishlist.itemCount }}
          </span>
        </div>
        <button
          @click="closeWishlist"
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close wishlist"
        >
          <i class="pi pi-times text-gray-500"></i>
        </button>
      </div>
    </template>

    <!-- Wishlist Content -->
    <div class="flex flex-col h-full">
      <!-- Loading State -->
      <div v-if="wishlist.isLoading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-pink-500 mb-4"></i>
          <p class="text-gray-500">Loading wishlist...</p>
        </div>
      </div>

      <!-- Empty Wishlist State -->
      <div v-else-if="wishlist.isEmpty" class="flex-1 flex flex-col items-center justify-center px-6">
        <div class="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6">
          <i class="pi pi-heart text-4xl text-pink-300"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
        <p class="text-gray-500 text-center mb-6">
          Save items you love by clicking the heart icon on products.
        </p>
        <button
          @click="closeWishlist"
          class="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Continue Shopping
        </button>
      </div>

      <!-- Wishlist Items List -->
      <div v-else class="flex-1 overflow-y-auto">
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in wishlist.items"
            :key="item.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex gap-4">
              <!-- Product Image -->
              <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  v-if="item.product?.primaryImage"
                  :src="item.product.primaryImage"
                  :alt="item.product?.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <i class="pi pi-image text-gray-300 text-2xl"></i>
                </div>
              </div>

              <!-- Product Details -->
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 truncate">{{ item.product?.name }}</h4>
                <p v-if="item.variant" class="text-sm text-gray-500">{{ item.variant }}</p>
                <p class="text-pink-500 font-semibold mt-1">
                  ${{ item.product?.price?.toLocaleString() }}
                </p>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 mt-3">
                  <button
                    @click="moveToCart(item.id)"
                    class="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <i class="pi pi-shopping-cart text-xs"></i>
                    Add to Cart
                  </button>
                  <button
                    @click="removeItem(item.id)"
                    class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <i class="pi pi-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wishlist Footer (shown when items exist) -->
      <div v-if="!wishlist.isEmpty && !wishlist.isLoading" class="border-t border-gray-200 p-4 bg-white">
        <div class="space-y-3">
          <button
            @click="closeWishlist"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
/**
 * ===========================================
 * WISHLIST OFF-CANVAS COMPONENT
 * ===========================================
 * Route-driven wishlist panel that slides from the right.
 * 
 * Key Design Decisions:
 * 1. Wishlist visibility = computed from route.meta.isWishlistOpen
 * 2. Close action = router.back() (preserves history)
 * 3. Uses existing wishlist.js Pinia store for all wishlist data
 * 4. PrimeVue Drawer for the off-canvas panel
 * 5. Body scroll locked when wishlist is open
 */

import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWishlistStore } from '@/stores/wishlist'
import Drawer from 'primevue/drawer'

// ===========================================
// ROUTE & STORE SETUP
// ===========================================

const route = useRoute()
const router = useRouter()
const wishlist = useWishlistStore()

// ===========================================
// WISHLIST VISIBILITY (ROUTE-DRIVEN)
// ===========================================

/**
 * Wishlist open state is derived ONLY from the route.
 * If current path ends with /wishlist or has isWishlistOpen meta, wishlist is visible.
 */
const isWishlistOpen = computed(() => {
  return route.path.endsWith('/wishlist') || 
         route.matched.some(r => r.meta?.isWishlistOpen)
})

/**
 * Two-way binding for PrimeVue Drawer visibility
 * When Drawer closes (via backdrop/esc), we update the route
 */
const isVisible = computed({
  get: () => isWishlistOpen.value,
  set: (value) => {
    if (!value && isWishlistOpen.value) {
      // Drawer is closing, navigate back
      navigateBack()
    }
  }
})

// ===========================================
// NAVIGATION HELPERS
// ===========================================

/**
 * Navigate back to close wishlist, removing /wishlist from URL
 */
function navigateBack() {
  // Use router.back() to restore previous URL
  // This maintains proper browser history
  router.back()
}

/**
 * Close wishlist handler - called by close button and "Continue Shopping"
 */
function closeWishlist() {
  navigateBack()
}

/**
 * Handle Drawer hide event (backdrop click or ESC)
 * PrimeVue Drawer emits this when dismissing
 */
function handleClose() {
  // isVisible setter already handles this, but ensure navigation happens
  if (isWishlistOpen.value) {
    navigateBack()
  }
}

// ===========================================
// KEYBOARD HANDLER
// ===========================================

/**
 * ESC key handler for accessibility
 * PrimeVue Drawer handles this, but we ensure route is updated
 */
function handleEscKey(event) {
  if (event.key === 'Escape' && isWishlistOpen.value) {
    closeWishlist()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
  // Fetch wishlist data on mount
  wishlist.fetchWishlist()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

// ===========================================
// WISHLIST ACTIONS
// ===========================================

/**
 * Move item to cart
 */
async function moveToCart(itemId) {
  try {
    await wishlist.moveToCart(itemId)
  } catch (error) {
    console.error('Failed to move item to cart:', error)
  }
}

/**
 * Remove item from wishlist
 */
async function removeItem(itemId) {
  try {
    await wishlist.removeItem(itemId)
  } catch (error) {
    console.error('Failed to remove item:', error)
  }
}
</script>

<style>
/*
 * ===========================================
 * WISHLIST DRAWER STYLES
 * ===========================================
 * Custom styling for the wishlist off-canvas panel
 */

/* Drawer root */
.wishlist-drawer {
  --p-drawer-width: 100%;
  max-width: 28rem; /* max-w-md */
}

/* Backdrop styling */
.wishlist-backdrop {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px);
}

/* Override PrimeVue drawer content padding */
.wishlist-drawer .p-drawer-content {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header styling */
.wishlist-drawer .p-drawer-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Smooth slide animation */
.wishlist-drawer {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Mobile responsiveness */
@media (max-width: 448px) {
  .wishlist-drawer {
    max-width: 100%;
  }
}
</style>
