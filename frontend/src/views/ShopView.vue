<template>
  <div class="shop-root">
    <!-- Hero Section with Special Offers -->
    <section class="shop-hero">
      <div class="shop-hero-content">
        <!-- Error State with Retry -->
        <div v-if="fetchError" class="hero-error-box mb-6">
          <p class="text-rose-600 font-medium text-sm mb-2">{{ fetchError }}</p>
          <button class="shop-btn shop-btn-primary" @click="loadData">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1.5">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
            Retry Loading
          </button>
        </div>

        <!-- Special Offers Banner -->
        <div class="special-offers" v-if="!loading">
          <div
            v-for="offer in specialOffers"
            :key="offer.id"
            class="offer-card group"
            @click="navigateToOffer(offer.link)"
          >
            <div class="offer-image-wrapper">
              <img
                :src="optimizeImageUrl(offer.image, { width: 600, quality: 82 })"
                :alt="offer.title"
                loading="lazy"
                decoding="async"
                class="group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div class="offer-overlay">
                <span class="offer-badge">{{ offer.badge }}</span>
              </div>
            </div>
            <div class="offer-content">
              <h3 class="offer-title">{{ offer.title }}</h3>
              <p class="offer-subtitle">{{ offer.subtitle }}</p>
              <span class="offer-link group-hover:gap-2.5 transition-all">
                See All
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <!-- Loading Skeleton for Offers -->
        <div v-else class="special-offers">
          <div v-for="n in 2" :key="n" class="offer-card skeleton-card">
            <div class="offer-image-wrapper shop-skeleton"></div>
            <div class="offer-content">
              <div class="shop-skeleton skeleton-title"></div>
              <div class="shop-skeleton skeleton-text"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Shop Section -->
    <section class="shop-main">
      <div class="shop-container">
        <!-- Section Header -->
        <header class="shop-header">
          <h1 class="shop-title">Shop All Collections</h1>

          <!-- Toggle Pills -->
          <div class="shop-toggle">
            <button
              :class="['toggle-btn', { active: activeTab === 'category' }]"
              @click="switchTab('category')"
            >
              Shop by Category
            </button>
            <button
              :class="['toggle-btn', { active: activeTab === 'design' }]"
              @click="switchTab('design')"
            >
              Shop by Design
            </button>
            <div
              class="toggle-indicator"
              :style="{ transform: `translateX(${activeTab === 'design' ? '100%' : '0'})` }"
            ></div>
          </div>
        </header>

        <!-- Category Tab Content -->
        <Transition name="shop-fade" mode="out-in">
          <div v-if="activeTab === 'category'" key="category" class="tab-content">
            <!-- Categories Grid -->
            <div class="categories-grid shop-stagger" v-if="!loading">
              <div
                v-for="category in categories"
                :key="category.id"
                class="category-card group"
                @click="navigateToCategory(category.slug)"
              >
                <div class="category-icon-wrapper group-hover:scale-110 group-hover:bg-stone-200 transition-all duration-300">
                  <div class="category-icon" v-html="category.icon"></div>
                </div>
                <span class="category-name group-hover:text-stone-900">{{ category.name }}</span>
                <span v-if="category.productCount" class="category-count text-xs text-stone-400">
                  {{ category.productCount }} {{ category.productCount === 1 ? 'product' : 'products' }}
                </span>
              </div>
            </div>

            <!-- Loading Skeleton -->
            <div v-else class="categories-grid">
              <div v-for="n in 4" :key="n" class="category-card skeleton-category">
                <div class="category-icon-wrapper shop-skeleton"></div>
                <div class="shop-skeleton skeleton-label"></div>
              </div>
            </div>
          </div>

          <div v-else key="design" class="tab-content">
            <!-- Space-specific Section -->
            <div class="design-section">
              <h2 class="section-title">Space-Specific</h2>
              <p class="section-subtitle">Furnishings thoughtfully designed for specific rooms</p>

              <div class="spaces-grid shop-stagger" v-if="!loading">
                <div
                  v-for="space in spaces"
                  :key="space.id"
                  class="space-card group"
                  @click="navigateToSpace(space.slug)"
                >
                  <div class="space-icon-wrapper group-hover:scale-110 group-hover:bg-stone-200 transition-all duration-300">
                    <component :is="getSpaceIcon(space.slug || space.icon)" class="space-icon" />
                  </div>
                  <span class="space-name group-hover:text-stone-900">{{ space.name }}</span>
                </div>
              </div>

              <!-- Loading Skeleton -->
              <div v-else class="spaces-grid">
                <div v-for="n in 5" :key="n" class="space-card skeleton-space">
                  <div class="space-icon-wrapper shop-skeleton"></div>
                  <div class="shop-skeleton skeleton-label"></div>
                </div>
              </div>
            </div>

            <div class="shop-divider">OR</div>

            <!-- Style-specific Section -->
            <div class="design-section">
              <h2 class="section-title">Style-Specific</h2>
              <p class="section-subtitle">Browse collections curated by distinct architectural aesthetics</p>

              <div class="styles-grid shop-stagger" v-if="!loading">
                <div
                  v-for="style in styles"
                  :key="style.id"
                  class="style-card group"
                  @click="navigateToStyle(style.slug)"
                >
                  <div class="style-image-wrapper shop-arch">
                    <img
                      :src="optimizeImageUrl(style.image, { width: 400, quality: 82 })"
                      :alt="style.name"
                      loading="lazy"
                      decoding="async"
                      class="group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div class="style-overlay group-hover:opacity-100 transition-opacity">
                      <span class="style-explore group-hover:translate-y-0 transition-transform">Explore</span>
                    </div>
                  </div>
                  <span class="style-name group-hover:text-stone-900">{{ style.name }}</span>
                </div>
              </div>

              <!-- Loading Skeleton -->
              <div v-else class="styles-grid">
                <div v-for="n in 6" :key="n" class="style-card skeleton-style">
                  <div class="style-image-wrapper shop-arch shop-skeleton"></div>
                  <div class="shop-skeleton skeleton-label"></div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="shop-featured" v-if="!loading && featuredProducts.length > 0">
      <div class="shop-container">
        <header class="featured-header">
          <div>
            <h2 class="featured-title">Popular Creations</h2>
            <p class="featured-subtitle">Curated picks loved by our discerning community</p>
          </div>
          <router-link to="/shop?sort=popularity-desc" class="see-all-link">
            See All Products
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </router-link>
        </header>

        <div class="featured-grid shop-stagger">
          <div
            v-for="product in featuredProducts.slice(0, 6)"
            :key="product.id"
            class="featured-product group"
            @click="navigateToProduct(product)"
          >
            <div class="featured-image shop-img-zoom relative">
              <img :src="getProductThumbnail(product)" :alt="product.name" loading="lazy" class="group-hover:scale-105 transition-transform duration-700 ease-out" />
              
              <!-- Product Badges -->
              <div class="product-badges">
                <span v-if="product.isNew" class="shop-badge shop-badge-new">New</span>
                <span v-if="product.discount" class="shop-badge shop-badge-sale">
                  -{{ product.discount }}%
                </span>
                <span v-if="product.isBestSeller" class="shop-badge bg-white text-stone-900 font-bold">
                  Bestseller
                </span>
              </div>

              <!-- Quick Wishlist Button -->
              <button
                class="quick-action wishlist-btn"
                :class="{ 'text-rose-500': wishlistStore.isInWishlist(product.id) }"
                @click.stop="toggleWishlist(product)"
                :title="wishlistStore.isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist'"
                aria-label="Wishlist"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  :fill="wishlistStore.isInWishlist(product.id) ? '#e11d48' : 'none'"
                  :stroke="wishlistStore.isInWishlist(product.id) ? '#e11d48' : 'currentColor'"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>

            <div class="featured-info">
              <span class="product-brand">{{ product.brand || 'SpaceFurnio' }}</span>
              <h3 class="product-name group-hover:text-stone-900 transition-colors">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="product-price">${{ formatPrice(product.price, product.price_cents) }}</span>
                <span v-if="product.originalPrice" class="product-original-price">
                  ${{ formatPrice(product.originalPrice) }}
                </span>
                <div v-if="product.rating" class="product-rating">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                  <span>{{ Number(product.rating).toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Design Consultation CTA -->
    <section class="shop-contact">
      <div class="contact-content">
        <h2 class="contact-title">Need Personalized Design Consultation?</h2>
        <p class="contact-text">
          Have questions about our collection or custom bespoke spatial arrangements? Our design consultants are here to help you craft your ideal sanctuary.
        </p>
        <router-link to="/contact" class="shop-btn shop-btn-primary">
          Let's Talk
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, h, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import shopApi from '@/api/shopApi.js'
import { useWishlistStore } from '@/stores/wishlist'
import { optimizeImageUrl } from '@/utils/imageOptimizer.js'

const router = useRouter()
const route = useRoute()
const wishlistStore = useWishlistStore()
const { openLogin } = inject('authUtils', { openLogin: () => {} })
const { openWishlist } = inject('wishlistUtils', { openWishlist: () => wishlistStore.toggleDrawer(true) })

// State
const activeTab = ref('category')
const loading = ref(true)
const fetchError = ref(null)
const categories = ref([])
const spaces = ref([])
const styles = ref([])
const specialOffers = ref([])
const featuredProducts = ref([])

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80'

// Initialize tab from route
const initializeTab = () => {
  activeTab.value = route.path.includes('/design') ? 'design' : 'category'
}

// Switch tabs
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
}

// Navigation helpers
const navigateToCategory = (slug) => {
  if (slug) {
    router.push(`/shop?categories=${slug}`)
  } else {
    router.push('/shop')
  }
}

const navigateToSpace = (slug) => {
  router.push(`/shop?spaces=${slug}`)
}

const navigateToStyle = (slug) => {
  router.push(`/shop?styles=${slug}`)
}

const navigateToOffer = (link) => {
  if (link.startsWith('/shop/category?filter=new')) {
    router.push('/shop?isNew=true')
  } else if (link.startsWith('/shop/category?filter=bestseller')) {
    router.push('/shop?sort=popularity-desc')
  } else {
    router.push(link)
  }
}

const navigateToProduct = (product) => {
  const idOrSlug = product.slug || product.id
  router.push(`/shop/product/${idOrSlug}`)
}

const getProductThumbnail = (product) => {
  const raw = product.thumbnail || product.primaryImage || product.images?.[0] || FALLBACK_IMAGE
  return optimizeImageUrl(raw, { width: 600, quality: 82 })
}

const formatPrice = (price, priceCents) => {
  if (priceCents !== undefined && priceCents !== null) {
    return (Number(priceCents) / 100).toFixed(2)
  }
  if (price !== undefined && price !== null) {
    return Number(price).toFixed(2)
  }
  return '0.00'
}

const toggleWishlist = async (product) => {
  try {
    const isAdded = await wishlistStore.toggleItem(product.id)
    if (isAdded) {
      openWishlist()
    }
  } catch (error) {
    console.error('[ShopView] Failed to toggle wishlist:', error)
    if (
      String(error).includes('401') ||
      String(error).toLowerCase().includes('unauthorized') ||
      String(error).includes('guest token')
    ) {
      openLogin()
    }
  }
}

// Space icons as functional components
const getSpaceIcon = (iconName) => {
  const icons = {
    sofa: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v2h2v-2h10v2h2v-2h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM6 7h12v3H6V7zm14 9H4v-4h2v2h12v-2h2v4z',
          }),
        ],
      ),
    living: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v2h2v-2h10v2h2v-2h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM6 7h12v3H6V7zm14 9H4v-4h2v2h12v-2h2v4z',
          }),
        ],
      ),
    bed: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M3 12h18v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5zM3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M7 12V9M17 12V9M3 17v2M21 17v2',
          }),
        ],
      ),
    bedroom: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M3 12h18v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5zM3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M7 12V9M17 12V9M3 17v2M21 17v2',
          }),
        ],
      ),
    utensils: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M3 2v7c0 1.1.9 2 2 2h3a2 2 0 002-2V2M8 2v20M18 2h1a3 3 0 013 3v1a3 3 0 01-3 3h-1v13',
          }),
        ],
      ),
    dining: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M3 2v7c0 1.1.9 2 2 2h3a2 2 0 002-2V2M8 2v20M18 2h1a3 3 0 013 3v1a3 3 0 01-3 3h-1v13',
          }),
        ],
      ),
    kitchen: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }),
          h('path', { d: 'M3 9h18M9 9v12M9 12h6M9 15h6M9 18h6' }),
        ],
      ),
    desk: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v4H4V5zM4 9v6M20 9v6M8 15h8M10 15v4M14 15v4',
          }),
        ],
      ),
    'home-office': () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v4H4V5zM4 9v6M20 9v6M8 15h8M10 15v4M14 15v4',
          }),
        ],
      ),
    bath: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M4 12h16a2 2 0 012 2v2a4 4 0 01-4 4H6a4 4 0 01-4-4v-2a2 2 0 012-2zM6 12V5a2 2 0 012-2h2a2 2 0 012 2v7M18 20v2M6 20v2',
          }),
        ],
      ),
    bathroom: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M4 12h16a2 2 0 012 2v2a4 4 0 01-4 4H6a4 4 0 01-4-4v-2a2 2 0 012-2zM6 12V5a2 2 0 012-2h2a2 2 0 012 2v7M18 20v2M6 20v2',
          }),
        ],
      ),
    tree: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [h('path', { d: 'M12 22v-7M12 15l-4 4M12 15l4 4M12 2L5 12h4l-2 5h10l-2-5h4L12 2z' })],
      ),
    balcony: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [h('path', { d: 'M12 22v-7M12 15l-4 4M12 15l4 4M12 2L5 12h4l-2 5h10l-2-5h4L12 2z' })],
      ),
    lounge: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v2h2v-2h10v2h2v-2h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM6 7h12v3H6V7zm14 9H4v-4h2v2h12v-2h2v4z',
          }),
        ],
      ),
  }
  return icons[iconName] || icons.sofa
}

// Load data
const loadData = async () => {
  loading.value = true
  fetchError.value = null

  try {
    const [categoriesRes, spacesRes, stylesRes, offersRes, featuredRes] = await Promise.all([
      shopApi.getCategories(),
      shopApi.getSpaces(),
      shopApi.getStyles(),
      shopApi.getSpecialOffers(),
      shopApi.getFeaturedProducts(),
    ])

    if (categoriesRes.success) categories.value = categoriesRes.data
    if (spacesRes.success) spaces.value = spacesRes.data
    if (stylesRes.success) styles.value = stylesRes.data
    if (offersRes.success) specialOffers.value = offersRes.data
    if (featuredRes.success) featuredProducts.value = featuredRes.data.bestSellers || []
  } catch (error) {
    console.error('Error loading shop data:', error)
    fetchError.value = 'Failed to load shop collections. Please retry.'
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => route.path, initializeTab)

// Lifecycle
onMounted(() => {
  initializeTab()
  loadData()
})
</script>

<style scoped>
@import '@/assets/shop.css';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap');

/* ============================================
   SHOP ROOT PAGE STYLES
   ============================================ */

.shop-root {
  min-height: 100vh;
  background: var(--shop-cream, #faf8f5);
  padding-top: 6rem;
}

/* Hero Section */
.shop-hero {
  padding: 1.5rem 2rem 3rem;
  max-width: 1800px;
  margin: 0 auto;
}

.hero-error-box {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
}

.special-offers {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .special-offers {
    grid-template-columns: repeat(2, 1fr);
  }
}

.offer-card {
  background: white;
  border-radius: 1.25rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba(61, 58, 54, 0.06);
  border: 1px solid var(--shop-beige, #e8e3dc);
}

.offer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(61, 58, 54, 0.12);
  border-color: var(--shop-tan, #c4b8a9);
}

.offer-image-wrapper {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.offer-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.offer-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, transparent 60%);
  display: flex;
  align-items: flex-end;
  padding: 1.5rem;
}

.offer-badge {
  background: white;
  color: var(--shop-charcoal, #3d3a36);
  padding: 0.375rem 0.875rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.offer-content {
  padding: 1.5rem 1.75rem;
}

.offer-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 0.25rem;
}

.offer-subtitle {
  font-size: 0.875rem;
  color: var(--shop-brown, #a89b8c);
  margin-bottom: 0.875rem;
  line-height: 1.5;
}

.offer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  transition: gap 0.2s ease;
}

/* Skeleton styles */
.skeleton-card {
  pointer-events: none;
}

.skeleton-card .offer-image-wrapper {
  background: var(--shop-beige, #e8e3dc);
}

.skeleton-title {
  width: 60%;
  height: 1.75rem;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.skeleton-text {
  width: 80%;
  height: 1rem;
  border-radius: 0.25rem;
}

/* Main Shop Section */
.shop-main {
  padding: 0 2rem 4rem;
}

.shop-container {
  max-width: 1600px;
  margin: 0 auto;
}

/* Shop Header */
.shop-header {
  text-align: center;
  margin-bottom: 3rem;
}

.shop-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 1.75rem;
  letter-spacing: -0.02em;
}

/* Toggle Pills */
.shop-toggle {
  display: inline-flex;
  position: relative;
  background: white;
  padding: 0.375rem;
  border-radius: 9999px;
  box-shadow: 0 2px 10px rgba(61, 58, 54, 0.08);
  border: 1px solid var(--shop-beige, #e8e3dc);
}

.toggle-btn {
  position: relative;
  z-index: 1;
  padding: 0.75rem 1.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shop-brown, #a89b8c);
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.toggle-btn.active {
  color: var(--shop-charcoal, #3d3a36);
}

.toggle-indicator {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  width: calc(50% - 0.375rem);
  height: calc(100% - 0.75rem);
  background: var(--shop-cream-dark, #f5f2ed);
  border-radius: 9999px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.4s ease;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  max-width: 1000px;
  margin: 0 auto;
  justify-content: center;
}

@media (min-width: 640px) {
  .categories-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  padding: 1.75rem 1rem;
  background: white;
  border: 1px solid var(--shop-beige, #e8e3dc);
  border-radius: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-card:hover {
  border-color: var(--shop-tan, #c4b8a9);
  box-shadow: 0 10px 24px rgba(61, 58, 54, 0.1);
  transform: translateY(-3px);
}

.category-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-cream-dark, #f5f2ed);
  border-radius: 50%;
}

.category-icon {
  width: 32px;
  height: 32px;
  color: var(--shop-charcoal, #3d3a36);
}

.category-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.category-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  text-align: center;
}

.skeleton-category .category-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.skeleton-label {
  width: 60%;
  height: 1rem;
  border-radius: 0.25rem;
}

/* Design Section */
.design-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  text-align: center;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--shop-brown, #a89b8c);
  text-align: center;
  margin-bottom: 2rem;
}

.shop-divider {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 3rem auto;
  max-width: 500px;
  color: var(--shop-tan, #c4b8a9);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.shop-divider::before,
.shop-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--shop-beige, #e8e3dc);
}

/* Spaces Grid */
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .spaces-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .spaces-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.space-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  background: white;
  border: 1px solid var(--shop-beige, #e8e3dc);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.space-card:hover {
  border-color: var(--shop-tan, #c4b8a9);
  box-shadow: 0 6px 18px rgba(61, 58, 54, 0.08);
  transform: translateY(-2px);
}

.space-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-cream-dark, #f5f2ed);
  border-radius: 0.75rem;
}

.space-icon {
  width: 24px;
  height: 24px;
  color: var(--shop-charcoal, #3d3a36);
}

.space-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  text-align: center;
}

.skeleton-space .space-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
}

/* Styles Grid */
.styles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .styles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .styles-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  cursor: pointer;
}

.style-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background: var(--shop-beige, #e8e3dc);
}

.style-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.style-overlay {
  position: absolute;
  inset: 0;
  background: rgba(61, 58, 54, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.style-explore {
  transform: translateY(10px);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: white;
  padding: 0.4rem 0.875rem;
  border: 1.5px solid white;
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.style-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
}

.skeleton-style .style-image-wrapper {
  background: var(--shop-beige, #e8e3dc);
}

/* Featured Section */
.shop-featured {
  background: white;
  padding: 4.5rem 2rem;
  margin-top: 2rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}

.featured-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.featured-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 0.25rem;
}

.featured-subtitle {
  font-size: 0.875rem;
  color: var(--shop-brown, #a89b8c);
}

.see-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  text-decoration: none;
  transition: gap 0.2s ease;
}

.see-all-link:hover {
  gap: 0.625rem;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .featured-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .featured-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.featured-product {
  cursor: pointer;
}

.featured-image {
  aspect-ratio: 1;
  border-radius: 0.875rem;
  overflow: hidden;
  background: var(--shop-cream, #faf8f5);
  margin-bottom: 0.75rem;
  border: 1px solid var(--shop-beige, #e8e3dc);
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badges {
  position: absolute;
  top: 0.625rem;
  left: 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  z-index: 2;
}

.shop-badge {
  padding: 0.1875rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.shop-badge-new {
  background: var(--shop-charcoal, #3d3a36);
  color: white;
}

.shop-badge-sale {
  background: #e11d48;
  color: white;
}

.quick-action {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.85);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: var(--shop-brown-dark, #8b7d6d);
}

.featured-product:hover .quick-action {
  opacity: 1;
  transform: scale(1);
}

.quick-action:hover {
  transform: scale(1.1);
  background: white;
}

.featured-info {
  padding: 0 0.25rem;
}

.product-brand {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--shop-brown, #a89b8c);
}

.product-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  margin: 0.25rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.product-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
}

.product-original-price {
  font-size: 0.8125rem;
  color: var(--shop-tan, #c4b8a9);
  text-decoration: line-through;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--shop-brown, #a89b8c);
}

/* Contact Section */
.shop-contact {
  background: var(--shop-beige, #e8e3dc);
  padding: 4.5rem 1.5rem;
  margin-top: 2rem;
}

.contact-content {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.contact-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 0.75rem;
}

.contact-text {
  font-size: 0.9375rem;
  color: var(--shop-brown-dark, #8b7d6d);
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

/* Transitions */
.shop-fade-enter-active,
.shop-fade-leave-active {
  transition: all 0.3s ease;
}

.shop-fade-enter-from,
.shop-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
