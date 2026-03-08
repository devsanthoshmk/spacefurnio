import { createRouter, createWebHistory } from 'vue-router'
const comingSoon = () => import('@/components/Coming-Soon.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Static pages
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },

    // Shop - single route with query param filtering
    {
      path: '/shop',
      name: 'Shop',
      component: () => import('@/components/shop/ProductListing.vue'),
      meta: { title: 'Shop - Space Furnio' },
    },

    // Shop overview (redirects to /shop with query)
    { path: '/shop/category', redirect: '/shop' },
    { path: '/shop/design', redirect: '/shop' },

    // Product detail (single route, category from query)
    {
      path: '/shop/product/:id',
      name: 'ProductDetail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: { title: 'Product Details - Space Furnio' },
    },

    // Legacy product routes redirect
    { path: '/shop/category/:category/:id', redirect: (to) => `/shop/product/${to.params.id}` },
    { path: '/shop/design/space/:category/:id', redirect: (to) => `/shop/product/${to.params.id}` },
    { path: '/shop/design/style/:category/:id', redirect: (to) => `/shop/product/${to.params.id}` },
    { path: '/shop/design/:category/:id', redirect: (to) => `/shop/product/${to.params.id}` },

    // Legacy listing routes redirect to /shop with query
    {
      path: '/shop/category/:category',
      redirect: (to) => `/shop?categories=${to.params.category}`
    },
    {
      path: '/shop/design/space/:category',
      redirect: (to) => `/shop?spaces=${to.params.category}`
    },
    {
      path: '/shop/design/style/:category',
      redirect: (to) => `/shop?styles=${to.params.category}`
    },
    { path: '/shop/design/:category', redirect: '/shop' },

    // Other pages
    { path: '/collabs', name: 'collabs', component: () => import('@/views/sfCollabs.vue'), meta: { title: 'SF Collabs - Spacefurnio' } },
    { path: '/portfolio', name: 'Portfolio', component: () => import('@/views/PortfolioView.vue'), meta: { title: 'Portfolio - Spacefurnio' } },
    { path: '/shop/products', redirect: '/shop' },
    { path: '/shopping', name: 'shopping', component: comingSoon },
    { path: '/contact', name: 'contact', component: () => import('@/views/ContactView.vue'), meta: { title: 'Contact Us - Spacefurnio' } },

    // Admin Panel
    {
      path: '/admin-spacefurnio',
      name: 'Admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { title: 'Admin Panel - Spacefurnio', hideNav: true, hideFooter: true },
      children: [
        { path: '', redirect: '/admin-spacefurnio/contents' },
        { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/AdminContentsPage.vue'), meta: { title: 'Dashboard' } },
        { path: 'contents', name: 'AdminContents', component: () => import('@/views/admin/AdminContentsPage.vue'), meta: { title: 'Content Management' } },
        { path: 'products', name: 'AdminProducts', component: () => import('@/views/admin/AdminContentsPage.vue'), meta: { title: 'Products' } },
        { path: 'orders', name: 'AdminOrders', component: () => import('@/views/admin/AdminContentsPage.vue'), meta: { title: 'Orders' } },
        { path: 'reviews', name: 'AdminReviews', component: () => import('@/views/admin/AdminContentsPage.vue'), meta: { title: 'Reviews' } },
        { path: 'settings', name: 'AdminSettings', component: () => import('@/views/admin/AdminContentsPage.vue'), meta: { title: 'Settings' } },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const { title } = to.meta
  if (title) {
    document.title = typeof title === 'function' ? title(to) : title
  }
  next()
})

export default router