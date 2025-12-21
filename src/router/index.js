import { createRouter, createWebHistory } from 'vue-router'
const comingSoon = () => import('@/components/Coming-Soon.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

    // // Shop redirects
    // {
    //   path: '/shop',
    //   redirect: '/shop/category',
    // },

    // // Shop overview views
    // {
    //   path: '/shop/category',
    //   name: 'ShopCategory',
    //   component: () => import('@/views/ShopView.vue'),
    //   meta: { title: 'Shop by Category - Space Furnio' },
    // },
    // {
    //   path: '/shop/design',
    //   name: 'ShopDesign',
    //   component: () => import('@/views/ShopView.vue'),
    //   meta: { title: 'Shop by Design - Space Furnio' },
    // },

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
    { path: '/projects', name: 'projects', component: comingSoon },
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
