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

    // Admin routes
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('@/admin/views/AdminLogin.vue'),
      meta: { title: 'Admin Login - SpaceFurnio', isAdmin: true, requiresAuth: false },
    },
    {
      path: '/admin/setup',
      name: 'AdminSetup',
      component: () => import('@/admin/views/AdminSetup.vue'),
      meta: { title: 'Admin Setup - SpaceFurnio', isAdmin: true, requiresAuth: false },
    },
    {
      path: '/admin',
      component: () => import('@/admin/components/layout/AdminLayout.vue'),
      meta: { isAdmin: true, requiresAuth: true },
      children: [
        { path: '', name: 'AdminDashboard', component: () => import('@/admin/views/AdminDashboard.vue'), meta: { title: 'Dashboard - SpaceFurnio Admin' } },
        { path: 'products', name: 'AdminProducts', component: () => import('@/admin/views/AdminProducts.vue'), meta: { title: 'Products - SpaceFurnio Admin' } },
        { path: 'products/new', name: 'AdminProductCreate', component: () => import('@/admin/views/AdminProductForm.vue'), meta: { title: 'New Product - SpaceFurnio Admin' } },
        { path: 'products/:id/edit', name: 'AdminProductEdit', component: () => import('@/admin/views/AdminProductForm.vue'), meta: { title: 'Edit Product - SpaceFurnio Admin' } },
        { path: 'orders', name: 'AdminOrders', component: () => import('@/admin/views/AdminOrders.vue'), meta: { title: 'Orders - SpaceFurnio Admin' } },
        { path: 'orders/:id', name: 'AdminOrderDetail', component: () => import('@/admin/views/AdminOrderDetail.vue'), meta: { title: 'Order Detail - SpaceFurnio Admin' } },
        { path: 'customers', name: 'AdminCustomers', component: () => import('@/admin/views/AdminCustomers.vue'), meta: { title: 'Customers - SpaceFurnio Admin' } },
        { path: 'customers/:id', name: 'AdminCustomerDetail', component: () => import('@/admin/views/AdminCustomerDetail.vue'), meta: { title: 'Customer Detail - SpaceFurnio Admin' } },
        { path: 'coupons', name: 'AdminCoupons', component: () => import('@/admin/views/AdminCoupons.vue'), meta: { title: 'Coupons - SpaceFurnio Admin' } },
        { path: 'reviews', name: 'AdminReviews', component: () => import('@/admin/views/AdminReviews.vue'), meta: { title: 'Reviews - SpaceFurnio Admin' } },
        { path: 'images', alias: 'media', name: 'AdminImages', component: () => import('@/admin/views/AdminImages.vue'), meta: { title: 'Media - SpaceFurnio Admin' } },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const { title } = to.meta
  if (title) {
    document.title = typeof title === 'function' ? title(to) : title
  }

  if (to.meta.isAdmin && to.meta.requiresAuth !== false) {
    const token = localStorage.getItem('spacefurnio_token')
    if (!token) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
      return
    }
  }

  if (to.name === 'AdminLogin') {
    const token = localStorage.getItem('spacefurnio_token')
    if (token) {
      next({ name: 'AdminDashboard' })
      return
    }
  }

  next()
})

export default router