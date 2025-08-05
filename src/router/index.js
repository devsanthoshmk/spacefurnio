import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    {
      path: '/shop',
      redirect: '/shop/category',
    },
    {
      path: '/shop/category',
      name: 'ShopCategory',
      component: () => import('@/views/ShopView.vue'),
      meta: {
        title: 'Shop by Category - Space Furnio',
      },
    },
    {
      path: '/shop/design',
      name: 'ShopDesign',
      component: () => import('@/views/ShopView.vue'),
      meta: {
        title: 'Shop by Design - Space Furnio',
      },
    },

    // Category-specific product listing
    {
      path: '/shop/category/:category',
      name: 'CategoryProducts',
      component: () => import('@/components/shop/ProductListing.vue'),
      meta: {
        title: (route) => `${route.params.category} - Shop by Category - Space Furnio`,
      },
    },

    // Design-specific listings (space and style first, then generic fallback)
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
