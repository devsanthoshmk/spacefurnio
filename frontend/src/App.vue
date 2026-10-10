<template>
  <header>
    <NavComponent v-show="showNav" />
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <FooterComponent v-show="showFoo" />
  </footer>

  <!-- State-driven Cart Off-Canvas Overlay -->
  <CartOffCanvas />

  <!-- State-driven Wishlist Off-Canvas Overlay -->
  <WishlistOffCanvas />

  <!-- State-driven Auth Modal -->
  <AuthModal />

  <!-- State-driven Orders Modal -->
  <OrdersModal />

  <!-- State-driven Checkout Modal -->
  <CheckoutModal />

  <!-- State-driven Settings Modal -->
  <SettingsModal />
</template>

<script setup>
import { RouterView } from 'vue-router'
import { ref, computed, provide, onMounted } from 'vue'
import NavComponent from './components/Nav-component.vue'
import FooterComponent from './components/Footer-component.vue'
import CartOffCanvas from './components/CartOffCanvas.vue'
import WishlistOffCanvas from './components/WishlistOffCanvas.vue'
import AuthModal from './components/AuthModal.vue'
import OrdersModal from './components/OrdersModal.vue'
import CheckoutModal from './components/CheckoutModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'

// Nav visibility
const showNav = ref(true)
provide('navShowUtils', { showNav })
// footer visibility
const showFoo = ref(true)
provide('navShowUtils', { showFoo, showNav })

// Cart store
const cart = useCartStore()
const wishlist = useWishlistStore()
const authStore = useAuthStore()

// Cart item count for nav badge
const cartItemCount = computed(() => cart.itemCount)

// Wishlist item count for nav badge
const wishlistItemCount = computed(() => wishlist.itemCount)

// ==========================================================
// MODAL STATE (State-based, NOT route-based)
// ==========================================================
// Each modal is controlled by a simple reactive boolean.
// The page stays intact behind the overlay — no routing issues.
// ==========================================================
const isCartOpen = ref(false)
const isWishlistOpen = ref(false)
const isLoginOpen = ref(false)
const isOrdersOpen = ref(false)
const isCheckoutOpen = ref(false)
const isSettingsOpen = ref(false)

/**
 * Helper: close any open overlay before opening a new one
 */
function closeAllModals() {
  isCartOpen.value = false
  isWishlistOpen.value = false
  isLoginOpen.value = false
  isOrdersOpen.value = false
  isCheckoutOpen.value = false
  isSettingsOpen.value = false
}

function openCart() {
  closeAllModals()
  isCartOpen.value = true
}
function closeCart() {
  isCartOpen.value = false
}

function openWishlist() {
  closeAllModals()
  isWishlistOpen.value = true
}
function closeWishlist() {
  isWishlistOpen.value = false
}

function openLogin() {
  closeAllModals()
  isLoginOpen.value = true
}
function closeLogin() {
  isLoginOpen.value = false
}

function openOrders() {
  closeAllModals()
  isOrdersOpen.value = true
}
function closeOrders() {
  isOrdersOpen.value = false
}

function openCheckout() {
  closeAllModals()
  isCheckoutOpen.value = true
}
function closeCheckout() {
  isCheckoutOpen.value = false
}

function openSettings() {
  closeAllModals()
  isSettingsOpen.value = true
}
function closeSettings() {
  isSettingsOpen.value = false
}

// Provide modal utilities to child components
provide('cartUtils', { openCart, closeCart, isCartOpen, cartItemCount })
provide('wishlistUtils', { openWishlist, closeWishlist, isWishlistOpen, wishlistItemCount })
provide('authUtils', { openLogin, closeLogin, isLoginOpen, authStore })
provide('ordersUtils', { openOrders, closeOrders, isOrdersOpen })
provide('checkoutUtils', { openCheckout, closeCheckout, isCheckoutOpen })
provide('settingsUtils', { openSettings, closeSettings, isSettingsOpen })

onMounted(() => {
  // Initialize auth state from localStorage
  authStore.initialize()
})
</script>
