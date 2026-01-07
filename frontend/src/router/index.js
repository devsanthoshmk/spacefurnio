import { createRouter, createWebHistory } from 'vue-router'
const comingSoon = () => import('@/components/Coming-Soon.vue')

/**
 * ===========================================
 * CART ROUTE CONFIGURATION
 * ===========================================
 * The cart is implemented as a route-driven modal overlay.
 * 
 * How it works:
 * 1. Opening cart appends /cart to current URL
 *    Example: /shop/category/sofas → /shop/category/sofas/cart
 * 
 * 2. Cart route uses a wildcard to match any path + /cart
 *    Pattern: /:pathMatch(.*)/cart
 * 
 * 3. The CartOffCanvas component checks route.meta.isCartOpen
 *    to determine visibility
 * 
 * 4. Closing cart uses router.back() to restore previous URL
 *    Browser back/forward works correctly
 * 
 * 5. Direct navigation to /any/path/cart auto-opens cart
 * ===========================================
 */

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ===========================================
    // CART MODAL ROUTE (Wildcard - matches any path)
    // ===========================================
    // This route pattern allows /cart to be appended to ANY existing route
    // It does NOT render a component - CartOffCanvas is always mounted in App.vue
    // and uses route.meta.isCartOpen to control visibility
    {
      path: '/:pathMatch(.*)/cart',
      name: 'cart',
      meta: { isCartOpen: true },
      // No component - parent route's view remains visible
      // Cart overlay is handled by CartOffCanvas in App.vue
      component: null,
    },
    // Also handle root /cart route
    {
      path: '/cart',
      name: 'cartRoot',
      meta: { isCartOpen: true },
      component: null,
    },

    // ===========================================
    // WISHLIST MODAL ROUTE (Wildcard - matches any path)
    // ===========================================
    // Same pattern as cart - /wishlist can be appended to ANY existing route
    // WishlistOffCanvas uses route.meta.isWishlistOpen to control visibility
    {
      path: '/:pathMatch(.*)/wishlist',
      name: 'wishlist',
      meta: { isWishlistOpen: true },
      component: null,
    },
    // Also handle root /wishlist route
    {
      path: '/wishlist',
      name: 'wishlistRoot',
      meta: { isWishlistOpen: true },
      component: null,
    },


    // ===========================================
    // STATIC PAGES
    // ===========================================
    // Static pages
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },

    // Shop redirects
    {
      path: '/shop',
      redirect: '/shop/category',
    },

    // Shop overview views
    {
      path: '/shop/category',
      name: 'ShopCategory',
      component: () => import('@/views/ShopView.vue'),
      meta: { title: 'Shop by Category - Space Furnio' },
    },
    {
      path: '/shop/design',
      name: 'ShopDesign',
      component: () => import('@/views/ShopView.vue'),
      meta: { title: 'Shop by Design - Space Furnio' },
    },

    // // Product detail views — placed first to avoid collision with listing routes
    {
      path: '/shop/category/:category/:id',
      name: 'CategoryProductDetail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: {
        title: (route) => `Product Details - ${route.params.category} - Space Furnio`,
      },
    },
    {
      path: '/shop/design/space/:category/:id',
      name: 'DesignSpaceProductDetail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: {
        title: (route) => `Product Details - ${route.params.category} Space Design - Space Furnio`,
      },
    },
    {
      path: '/shop/design/style/:category/:id',
      name: 'DesignStyleProductDetail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: {
        title: (route) => `Product Details - ${route.params.category} Style Design - Space Furnio`,
      },
    },
    {
      path: '/shop/design/:category/:id',
      name: 'DesignProductDetail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: {
        title: (route) => `Product Details - ${route.params.category} Design - Space Furnio`,
      },
    },

    // Product listing views
    {
      path: '/shop/category/:category',
      name: 'CategoryProducts',
      component: () => import('@/components/shop/ProductListing.vue'),
      meta: {
        title: (route) => `${route.params.category} - Shop by Category - Space Furnio`,
      },
    },
    {
      path: '/shop/design/space/:category',
      name: 'DesignSpaceProducts',
      component: () => import('@/components/shop/ProductListing.vue'),
      meta: {
        title: (route) => `${route.params.category} Design - Shop by Design - Space Furnio`,
      },
    },
    {
      path: '/shop/design/style/:category',
      name: 'DesignStyleProducts',
      component: () => import('@/components/shop/ProductListing.vue'),
      meta: {
        title: (route) => `${route.params.category} Style - Shop by Design - Space Furnio`,
      },
    },
    {
      path: '/shop/design/:category',
      name: 'DesignProducts',
      component: () => import('@/components/shop/ProductListing.vue'),
      meta: {
        title: (route) => `${route.params.category} - Shop by Design - Space Furnio`,
      },
    },
    {
      path: '/collabs',
      name: 'collabs',
      component: () => import('@/views/sfCollabs.vue'),
      meta: {
        title: 'SF Collabs - Spacefurnio',
      },
    },
    {
      path: '/portfolio',
      name: 'Portfolio',
      component: () => import('@/views/PortfolioView.vue'),
      meta: {
        title: 'Portfolio - Spacefurnio',
      },
    },
    { path: '/shop', name: 'shop', component: comingSoon },
    { path: '/shopping', name: 'shopping', component: comingSoon },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
      meta: { title: 'Contact Us - Spacefurnio' }
    },
  ],
})

// Navigation guard for dynamic page titles
router.beforeEach((to, from, next) => {
  const { title } = to.meta
  if (title) {
    document.title = typeof title === 'function' ? title(to) : title
  }
  next()
})

export default router
