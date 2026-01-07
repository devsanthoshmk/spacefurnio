<template>
  <!--
    ================================================================
    CART OFF-CANVAS COMPONENT
    ================================================================
    Route-driven off-canvas cart panel using PrimeVue Drawer.
    
    ROUTE-BASED MODAL LOGIC:
    - Cart visibility is computed from route (route.meta.isCartOpen)
    - Opening cart: pushes /cart suffix to current path
    - Closing cart: calls router.back() to restore previous URL
    - Works from any route depth: /shop/category/item/cart
    - Browser back/forward correctly opens/closes cart
    - Direct navigation to /cart auto-opens cart
    
    STATE MANAGEMENT:
    - Cart data comes from existing cart.js Pinia store
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
    class="cart-drawer"
    :pt="{
      root: { class: 'w-full max-w-md' },
      mask: { class: 'cart-backdrop' }
    }"
    @hide="handleClose"
  >
    <!-- Cart Header -->
    <template #header>
      <div class="flex items-center justify-between w-full px-2 py-1">
        <div class="flex items-center gap-3">
          <i class="pi pi-shopping-cart text-xl text-orange-500"></i>
          <h2 class="text-xl font-bold text-gray-900">Your Cart</h2>
          <span 
            v-if="cart.itemCount > 0" 
            class="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
          >
            {{ cart.itemCount }}
          </span>
        </div>
        <button
          @click="closeCart"
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close cart"
        >
          <i class="pi pi-times text-gray-500"></i>
        </button>
      </div>
    </template>

    <!-- Cart Content -->
    <div class="flex flex-col h-full">
      <!-- Loading State -->
      <div v-if="cart.isLoading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-orange-500 mb-4"></i>
          <p class="text-gray-500">Loading cart...</p>
        </div>
      </div>

      <!-- Empty Cart State -->
      <div v-else-if="cart.isEmpty" class="flex-1 flex flex-col items-center justify-center px-6">
        <div class="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <i class="pi pi-shopping-cart text-4xl text-orange-300"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
        <p class="text-gray-500 text-center mb-6">
          Looks like you haven't added anything to your cart yet.
        </p>
        <button
          @click="closeCart"
          class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Continue Shopping
        </button>
      </div>

      <!-- Cart Items List -->
      <div v-else class="flex-1 overflow-y-auto">
        <div class="divide-y divide-gray-100">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex gap-4">
              <!-- Product Image -->
              <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <i class="pi pi-image text-gray-300 text-2xl"></i>
                </div>
              </div>

              <!-- Product Details -->
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 truncate">{{ item.name }}</h4>
                <p v-if="item.variant" class="text-sm text-gray-500">{{ item.variant }}</p>
                <p class="text-orange-500 font-semibold mt-1">
                  ${{ item.unitPrice?.toLocaleString() }}
                </p>

                <!-- Quantity Controls -->
                <div class="flex items-center gap-3 mt-2">
                  <div class="flex items-center border border-gray-200 rounded-lg">
                    <button
                      @click="decrementQuantity(item)"
                      :disabled="item.quantity <= 1"
                      class="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                      aria-label="Decrease quantity"
                    >
                      <i class="pi pi-minus text-xs text-gray-600"></i>
                    </button>
                    <span class="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                      {{ item.quantity }}
                    </span>
                    <button
                      @click="incrementQuantity(item)"
                      class="p-1.5 hover:bg-gray-100 transition-colors rounded-r-lg"
                      aria-label="Increase quantity"
                    >
                      <i class="pi pi-plus text-xs text-gray-600"></i>
                    </button>
                  </div>

                  <!-- Remove Button -->
                  <button
                    @click="removeItem(item.id)"
                    class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove item"
                  >
                    <i class="pi pi-trash text-sm"></i>
                  </button>
                </div>
              </div>

              <!-- Item Total -->
              <div class="text-right">
                <p class="font-semibold text-gray-900">
                  ${{ (item.unitPrice * item.quantity)?.toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Footer (shown when items exist) -->
      <div v-if="!cart.isEmpty && !cart.isLoading" class="border-t border-gray-200 p-4 bg-white">
        <!-- Subtotal -->
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${{ cart.subtotal?.toLocaleString() }}</span>
          </div>
          <div v-if="cart.hasDiscount" class="flex justify-between text-green-600">
            <span>Discount ({{ cart.discountCode }})</span>
            <span>-${{ cart.discountAmount?.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>${{ cart.total?.toLocaleString() }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <i class="pi pi-credit-card"></i>
            Proceed to Checkout
          </button>
          <button
            @click="closeCart"
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
 * CART OFF-CANVAS COMPONENT
 * ===========================================
 * Route-driven cart panel that slides from the right.
 * 
 * Key Design Decisions:
 * 1. Cart visibility = computed from route.meta.isCartOpen
 * 2. Close action = router.back() (preserves history)
 * 3. Uses existing cart.js Pinia store for all cart data
 * 4. PrimeVue Drawer for the off-canvas panel
 * 5. Body scroll locked when cart is open
 */

import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import Drawer from 'primevue/drawer'

// ===========================================
// ROUTE & STORE SETUP
// ===========================================

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

// ===========================================
// CART VISIBILITY (ROUTE-DRIVEN)
// ===========================================

/**
 * Cart open state is derived ONLY from the route.
 * If current path ends with /cart or has isCartOpen meta, cart is visible.
 */
const isCartOpen = computed(() => {
  return route.path.endsWith('/cart') || 
         route.matched.some(r => r.meta?.isCartOpen)
})

/**
 * Two-way binding for PrimeVue Drawer visibility
 * When Drawer closes (via backdrop/esc), we update the route
 */
const isVisible = computed({
  get: () => isCartOpen.value,
  set: (value) => {
    if (!value && isCartOpen.value) {
      // Drawer is closing, navigate back
      navigateBack()
    }
  }
})

// ===========================================
// NAVIGATION HELPERS
// ===========================================

/**
 * Navigate back to close cart, removing /cart from URL
 */
function navigateBack() {
  // Use router.back() to restore previous URL
  // This maintains proper browser history
  router.back()
}

/**
 * Close cart handler - called by close button and "Continue Shopping"
 */
function closeCart() {
  navigateBack()
}

/**
 * Handle Drawer hide event (backdrop click or ESC)
 * PrimeVue Drawer emits this when dismissing
 */
function handleClose() {
  // isVisible setter already handles this, but ensure navigation happens
  if (isCartOpen.value) {
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
  if (event.key === 'Escape' && isCartOpen.value) {
    closeCart()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
  // Fetch cart data on mount
  cart.fetchCart()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

// ===========================================
// CART ACTIONS
// ===========================================

/**
 * Increment item quantity
 */
function incrementQuantity(item) {
  cart.updateItemQuantity(item.id, item.quantity + 1)
}

/**
 * Decrement item quantity (minimum 1)
 */
function decrementQuantity(item) {
  if (item.quantity > 1) {
    cart.updateItemQuantity(item.id, item.quantity - 1)
  }
}

/**
 * Remove item from cart
 */
function removeItem(itemId) {
  cart.removeItem(itemId)
}
</script>

<style>
/*
 * ===========================================
 * CART DRAWER STYLES
 * ===========================================
 * Custom styling for the cart off-canvas panel
 */

/* Drawer root */
.cart-drawer {
  --p-drawer-width: 100%;
  max-width: 28rem; /* max-w-md */
}

/* Backdrop styling */
.cart-backdrop {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px);
}

/* Override PrimeVue drawer content padding */
.cart-drawer .p-drawer-content {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header styling */
.cart-drawer .p-drawer-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Smooth slide animation */
.cart-drawer {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Mobile responsiveness */
@media (max-width: 448px) {
  .cart-drawer {
    max-width: 100%;
  }
}
</style>
