

<template>
  <!-- Hide header on admin routes -->
  <header v-show="!isAdminRoute">
    <NavComponent v-show="showNav"/>
  </header>

  <main>
    <RouterView />
  </main>

  <!-- Hide footer on admin routes -->
  <footer v-show="!isAdminRoute">
    <FooterComponent v-show="showFoo"/>
  </footer>

  <!-- Route-driven Cart Off-Canvas Overlay (hidden on admin) -->
  <CartOffCanvas v-if="!isAdminRoute" />

  <!-- Route-driven Wishlist Off-Canvas Overlay (hidden on admin) -->
  <WishlistOffCanvas v-if="!isAdminRoute" />

  <!-- Highlight overlay for admin preview -->
  <div v-if="highlightKey" class="highlight-indicator">
    <span>Previewing: {{ highlightKey }}</span>
  </div>
</template>


<script setup>
  import { RouterView, useRouter, useRoute } from 'vue-router'
  import { ref, computed, provide, watch, onMounted, nextTick } from 'vue'
  import NavComponent from './components/Nav-component.vue'
  import FooterComponent from './components/Footer-component.vue'
  import CartOffCanvas from './components/CartOffCanvas.vue'
  import WishlistOffCanvas from './components/WishlistOffCanvas.vue'
  import { useCartStore } from '@/stores/cart'
  import { useWishlistStore } from '@/stores/wishlist'

  // Nav visibility
  const showNav = ref(true)
  provide('navShowUtils', { showNav })
  // footer visibility
  const showFoo = ref(true)
  provide('navShowUtils', { showFoo, showNav })

  // Cart store and router for cart opening
  const router = useRouter()
  const route = useRoute()
  const cart = useCartStore()
  const wishlist = useWishlistStore()

  // Check if current route is admin
  const isAdminRoute = computed(() => route.path.startsWith('/admin-spacefurnio'))

  // Highlight key from URL query param
  const highlightKey = computed(() => route.query.highlight || '')

  // Cart item count for nav badge
  const cartItemCount = computed(() => cart.itemCount)

  // Wishlist item count for nav badge
  const wishlistItemCount = computed(() => wishlist.itemCount)

  /**
   * Open cart by appending /cart to current route
   * This triggers the CartOffCanvas component to show
   */
  function openCart() {
    if (!route.path.endsWith('/cart') && !route.path.endsWith('/wishlist')) {
      router.push(route.fullPath + '/cart')
    }
  }

  /**
   * Open wishlist by appending /wishlist to current route
   * This triggers the WishlistOffCanvas component to show
   */
  function openWishlist() {
    if (!route.path.endsWith('/wishlist') && !route.path.endsWith('/cart')) {
      router.push(route.fullPath + '/wishlist')
    }
  }

  // Provide cart utilities to child components (Nav, etc.)
  provide('cartUtils', { openCart, cartItemCount })

  // Provide wishlist utilities to child components (Nav, etc.)
  provide('wishlistUtils', { openWishlist, wishlistItemCount })

  /**
   * Highlight element with matching data-key attribute
   * Used for admin preview functionality
   */
  function highlightElement(key) {
    // Remove any existing highlights
    document.querySelectorAll('[data-admin-highlighted]').forEach(el => {
      el.removeAttribute('data-admin-highlighted')
      el.style.removeProperty('outline')
      el.style.removeProperty('outline-offset')
      el.style.removeProperty('animation')
    })

    if (!key) return

    // Find and highlight the element
    const element = document.querySelector(`[data-key="${key}"]`)
    if (element) {
      element.setAttribute('data-admin-highlighted', 'true')
      element.style.outline = '3px solid #f97316'
      element.style.outlineOffset = '4px'
      element.style.animation = 'admin-highlight-pulse 1.5s ease-in-out infinite'

      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Watch for highlight query param changes
  watch(highlightKey, async (newKey) => {
    await nextTick()
    // Small delay to ensure DOM is ready
    setTimeout(() => highlightElement(newKey), 500)
  }, { immediate: true })

  // Also highlight on mount if query param exists
  onMounted(() => {
    if (highlightKey.value) {
      setTimeout(() => highlightElement(highlightKey.value), 1000)
    }

    // Add highlight animation style
    const style = document.createElement('style')
    style.textContent = `
      @keyframes admin-highlight-pulse {
        0%, 100% { outline-color: #f97316; }
        50% { outline-color: #ea580c; }
      }
    `
    document.head.appendChild(style)
  })
</script>

<style>
.highlight-indicator {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);
  z-index: 9999;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>

