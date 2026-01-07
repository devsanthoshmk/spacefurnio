

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

</template>


<script setup>
  import { RouterView, useRouter, useRoute } from 'vue-router'
  import { ref, computed, provide } from 'vue'
  import NavComponent from './components/Nav-component.vue'
  import FooterComponent from './components/Footer-component.vue'
  import CartOffCanvas from './components/CartOffCanvas.vue'
  import { useCartStore } from '@/stores/cart'

  // Nav visibility
  const showNav = ref(true)
  provide('navShowUtils', { showNav })

  // Cart store and router for cart opening
  const router = useRouter()
  const route = useRoute()
  const cart = useCartStore()

  // Cart item count for nav badge
  const cartItemCount = computed(() => cart.itemCount)

  /**
   * Open cart by appending /cart to current route
   * This triggers the CartOffCanvas component to show
   */
  function openCart() {
    if (!route.path.endsWith('/cart')) {
      router.push(route.fullPath + '/cart')
    }
  }

  // Provide cart utilities to child components (Nav, etc.)
  provide('cartUtils', { openCart, cartItemCount })

</script>
