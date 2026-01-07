

<template>
  <header>
    <NavComponent v-show="showNav"/>
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <FooterComponent/>
  </footer>

  <!-- Route-driven Cart Off-Canvas Overlay -->
  <CartOffCanvas />

  <!-- Route-driven Wishlist Off-Canvas Overlay -->
  <WishlistOffCanvas />

</template>


<script setup>
  import { RouterView, useRouter, useRoute } from 'vue-router'
  import { ref, computed, provide } from 'vue'
  import NavComponent from './components/Nav-component.vue'
  import FooterComponent from './components/Footer-component.vue'
  import CartOffCanvas from './components/CartOffCanvas.vue'
  import WishlistOffCanvas from './components/WishlistOffCanvas.vue'
  import { useCartStore } from '@/stores/cart'
  import { useWishlistStore } from '@/stores/wishlist'

  // Nav visibility
  const showNav = ref(true)
  provide('navShowUtils', { showNav })

  // Cart store and router for cart opening
  const router = useRouter()
  const route = useRoute()
  const cart = useCartStore()
  const wishlist = useWishlistStore()

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

</script>

