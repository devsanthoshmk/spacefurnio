<template>
  <div class="listing-page">
    <!-- Fixed Header Background -->
    <div class="listing-header-bg"></div>

    <!-- Mobile Filter Drawer -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="showMobileFilters" class="mobile-drawer-overlay" @click="showMobileFilters = false">
          <div class="mobile-drawer" @click.stop>
            <div class="drawer-header">
              <h3 class="drawer-title">Filters</h3>
              <button class="drawer-close" @click="showMobileFilters = false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="drawer-content shop-scrollbar">
              <!-- Filter Content (same as sidebar) -->
              <FilterSidebar
                :filters="filters"
                :aggregations="aggregations"
                :active-filter-count="activeFilterCount"
                @update:filters="updateFilters"
                @clear-all="clearAllFilters"
              />
            </div>
            <div class="drawer-footer">
              <button class="shop-btn shop-btn-secondary" @click="clearAllFilters">
                Clear All
              </button>
              <button class="shop-btn shop-btn-primary" @click="showMobileFilters = false">
                Show {{ totalProducts }} Results
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Header Section -->
    <header class="listing-header">
      <div class="listing-container">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li v-for="(crumb, index) in breadcrumbs" :key="index" class="breadcrumb-item">
              <router-link v-if="crumb.route" :to="crumb.route" class="breadcrumb-link">
                {{ crumb.name }}
              </router-link>
              <span v-else class="breadcrumb-current">{{ crumb.name }}</span>
              <svg v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </li>
          </ol>
        </nav>

        <!-- Title Row -->
        <div class="title-row">
          <div class="title-content">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <p class="results-count">
              <span class="count-number">{{ totalProducts }}</span> products
            </p>
          </div>

          <!-- Desktop Controls -->
          <div class="header-controls">
            <!-- Sort Dropdown -->
            <div class="sort-dropdown">
              <label class="sort-label">Sort by</label>
              <div class="select-wrapper">
                <select v-model="sortBy" class="shop-select">
                  <option value="popularity-desc">Most Popular</option>
                  <option value="rating-desc">Best Rating</option>
                  <option value="newest-desc">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            <!-- View Toggle -->
            <div class="view-toggle">
              <button 
                :class="['view-btn', { active: viewMode === 'grid' }]"
                @click="viewMode = 'grid'"
                aria-label="Grid view"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button 
                :class="['view-btn', { active: viewMode === 'list' }]"
                @click="viewMode = 'list'"
                aria-label="List view"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Sticky Controls -->
    <div class="mobile-controls">
      <button class="mobile-filter-btn" @click="showMobileFilters = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14h6M9 8h6M17 16h6"/>
        </svg>
        <span>Filters</span>
        <span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
      </button>
      
      <div class="mobile-sort">
        <select v-model="sortBy" class="mobile-sort-select">
          <option value="popularity-desc">Popular</option>
          <option value="rating-desc">Rating</option>
          <option value="newest-desc">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </div>
    </div>

    <!-- Main Content -->
    <main class="listing-main">
      <div class="listing-container">
        <div class="listing-layout">
          <!-- Desktop Sidebar -->
          <aside class="filter-sidebar">
            <div class="sidebar-header">
              <h2 class="sidebar-title">Filters</h2>
              <button 
                v-if="activeFilterCount > 0" 
                class="clear-all-btn"
                @click="clearAllFilters"
              >
                Clear all
              </button>
            </div>
            
            <!-- Active Filter Tags -->
            <div v-if="activeFilterCount > 0" class="active-filters">
              <div class="filter-tags">
                <button 
                  v-for="tag in activeFilterTags" 
                  :key="tag.key"
                  class="filter-tag"
                  @click="removeFilter(tag.key, tag.value)"
                >
                  {{ tag.label }}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <FilterSidebar
              :filters="filters"
              :aggregations="aggregations"
              :active-filter-count="activeFilterCount"
              @update:filters="updateFilters"
              @clear-all="clearAllFilters"
            />
          </aside>

          <!-- Products Grid -->
          <section class="products-section">
            <!-- Active Filters Bar (Mobile) -->
            <div v-if="activeFilterCount > 0" class="active-filters-bar">
              <div class="filter-tags-scroll shop-scrollbar">
                <button 
                  v-for="tag in activeFilterTags" 
                  :key="tag.key"
                  class="filter-tag-small"
                  @click="removeFilter(tag.key, tag.value)"
                >
                  {{ tag.label }}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" :class="['products-grid', `view-${viewMode}`]">
              <div 
                v-for="n in 12" 
                :key="n" 
                class="product-skeleton"
              >
                <div class="skeleton-image shop-skeleton"></div>
                <div class="skeleton-content">
                  <div class="skeleton-brand shop-skeleton"></div>
                  <div class="skeleton-name shop-skeleton"></div>
                  <div class="skeleton-price shop-skeleton"></div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="products.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <h3 class="empty-title">No products found</h3>
              <p class="empty-text">Try adjusting your filters or search criteria</p>
              <button class="shop-btn shop-btn-primary" @click="clearAllFilters">
                Clear All Filters
              </button>
            </div>

            <!-- Products Grid -->
            <div v-else :class="['products-grid', `view-${viewMode}`, 'shop-stagger']">
              <ProductCardNew
                v-for="product in products"
                :key="product.id"
                :product="product"
                :view-mode="viewMode"
                @toggle-wishlist="handleWishlist"
                @add-to-cart="handleAddToCart"
                @click="navigateToProduct(product)"
              />
            </div>

            <!-- Pagination -->
            <div v-if="!loading && totalPages > 1" class="pagination">
              <button 
                class="page-btn prev"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Previous
              </button>
              
              <div class="page-numbers">
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  :class="['page-num', { active: page === currentPage, ellipsis: page === '...' }]"
                  :disabled="page === '...'"
                  @click="page !== '...' && goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>

              <button 
                class="page-btn next"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <!-- Load More Button (Alternative to Pagination) -->
            <div v-if="!loading && hasMoreProducts && !usePagination" class="load-more-container">
              <button 
                class="shop-btn shop-btn-secondary load-more-btn"
                :disabled="loadingMore"
                @click="loadMoreProducts"
              >
                <span v-if="loadingMore" class="shop-loading-dots">
                  <span></span><span></span><span></span>
                </span>
                <span v-else>Load More</span>
              </button>
              <p class="showing-count">
                Showing {{ products.length }} of {{ totalProducts }} products
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import shopApi from '@/api/shopApi.js'
import FilterSidebar from '@/components/shop/FilterSidebar.vue'
import ProductCardNew from '@/components/shop/ProductCardNew.vue'

const route = useRoute()
const router = useRouter()

// Determine if we're using design routes (style/space) or category routes
const isDesignRoute = computed(() => route.path.includes('/shop/design'))

// State
const loading = ref(true)
const loadingMore = ref(false)
const products = ref([])
const totalProducts = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const hasMoreProducts = ref(false)
const showMobileFilters = ref(false)
const viewMode = ref('grid')
const sortBy = ref('popularity-desc')
const usePagination = ref(true)

// Filter state
const filters = ref({
  category: '',
  brand: '',
  colors: [],
  material: '',
  minPrice: null,
  maxPrice: null,
  inStock: false,
  onSale: false,
  isNew: false,
  search: '',
})

// Aggregations from API
const aggregations = ref({
  brands: [],
  materials: [],
  colors: [],
  priceRange: { min: 0, max: 5000 },
})

// Computed
const pageTitle = computed(() => {
  const category = route.params.category
  if (!category) return 'All Products'
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
})

const breadcrumbs = computed(() => {
  const crumbs = [
    { name: 'Home', route: '/' },
    { name: 'Shop', route: '/shop' },
  ]
  
  if (route.params.category) {
    crumbs.push({
      name: pageTitle.value,
      route: null,
    })
  }
  
  return crumbs
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.brand) count++
  if (filters.value.colors.length > 0) count += filters.value.colors.length
  if (filters.value.material) count++
  if (filters.value.minPrice !== null || filters.value.maxPrice !== null) count++
  if (filters.value.inStock) count++
  if (filters.value.onSale) count++
  if (filters.value.isNew) count++
  return count
})

const activeFilterTags = computed(() => {
  const tags = []
  
  if (filters.value.brand) {
    tags.push({ key: 'brand', value: filters.value.brand, label: filters.value.brand })
  }
  
  filters.value.colors.forEach(color => {
    tags.push({ key: 'colors', value: color, label: color })
  })
  
  if (filters.value.material) {
    tags.push({ key: 'material', value: filters.value.material, label: filters.value.material })
  }
  
  if (filters.value.minPrice !== null || filters.value.maxPrice !== null) {
    const min = filters.value.minPrice || 0
    const max = filters.value.maxPrice || '∞'
    tags.push({ key: 'price', value: 'price', label: `$${min} - $${max}` })
  }
  
  if (filters.value.inStock) {
    tags.push({ key: 'inStock', value: true, label: 'In Stock' })
  }
  
  if (filters.value.onSale) {
    tags.push({ key: 'onSale', value: true, label: 'On Sale' })
  }
  
  if (filters.value.isNew) {
    tags.push({ key: 'isNew', value: true, label: 'New Arrivals' })
  }
  
  return tags
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    
    if (current > 3) pages.push('...')
    
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (current < total - 2) pages.push('...')
    
    pages.push(total)
  }
  
  return pages
})

// Methods
const loadProducts = async (append = false) => {
  if (!append) {
    loading.value = true
    products.value = []
  } else {
    loadingMore.value = true
  }
  
  try {
    const [sort, order] = sortBy.value.split('-')
    
    // Determine the filter parameters based on the route
    const apiParams = {
      brand: filters.value.brand || null,
      colors: filters.value.colors,
      material: filters.value.material || null,
      minPrice: filters.value.minPrice,
      maxPrice: filters.value.maxPrice,
      inStock: filters.value.inStock || null,
      onSale: filters.value.onSale || null,
      isNew: filters.value.isNew || null,
      search: filters.value.search || null,
      sort,
      order,
      page: currentPage.value,
      limit: 12,
    }

    // Set category/space/style based on route
    if (route.path.includes('/shop/design/space')) {
      apiParams.space = route.params.category || null
    } else if (route.path.includes('/shop/design/style')) {
      apiParams.style = route.params.category || null
    } else {
      apiParams.category = route.params.category || null
    }

    const response = await shopApi.getProducts(apiParams)
    
    if (response.success) {
      if (append) {
        products.value = [...products.value, ...response.data]
      } else {
        products.value = response.data
      }
      
      totalProducts.value = response.meta.total
      totalPages.value = response.meta.totalPages
      hasMoreProducts.value = response.meta.hasNextPage
      
      if (response.aggregations) {
        aggregations.value = response.aggregations
      }
    }
  } catch (error) {
    console.error('Error loading products:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadFilterOptions = async () => {
  try {
    const filterParam = route.params.category || null
    const response = await shopApi.getFilterOptions(filterParam)
    if (response.success) {
      aggregations.value = response.data
    }
  } catch (error) {
    console.error('Error loading filter options:', error)
  }
}

const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters }
  currentPage.value = 1
  loadProducts()
}

const removeFilter = (key, value) => {
  if (key === 'colors') {
    filters.value.colors = filters.value.colors.filter(c => c !== value)
  } else if (key === 'price') {
    filters.value.minPrice = null
    filters.value.maxPrice = null
  } else if (typeof filters.value[key] === 'boolean') {
    filters.value[key] = false
  } else {
    filters.value[key] = ''
  }
  currentPage.value = 1
  loadProducts()
}

const clearAllFilters = () => {
  filters.value = {
    category: '',
    brand: '',
    colors: [],
    material: '',
    minPrice: null,
    maxPrice: null,
    inStock: false,
    onSale: false,
    isNew: false,
    search: '',
  }
  currentPage.value = 1
  loadProducts()
}

const goToPage = (page) => {
  currentPage.value = page
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loadMoreProducts = () => {
  currentPage.value++
  loadProducts(true)
}

const handleWishlist = (product) => {
  console.log('Toggle wishlist:', product.id)
}

const handleAddToCart = (product) => {
  console.log('Add to cart:', product.id)
}

const navigateToProduct = (product) => {
  if (isDesignRoute.value) {
    if (route.path.includes('/shop/design/style')) {
      const categorySlug = route.params.category || ''
      router.push(`/shop/design/style/${categorySlug}/${product.id}`)
    } else {
      const categorySlug = route.params.category || ''
      router.push(`/shop/design/space/${categorySlug}/${product.id}`)
    }
  } else {
    router.push(`/shop/category/${product.category || route.params.category}/${product.id}`)
  }
}

// Watchers
watch(sortBy, () => {
  currentPage.value = 1
  loadProducts()
})

watch(() => route.params.category, () => {
  currentPage.value = 1
  loadProducts()
  loadFilterOptions()
})

// Lifecycle
onMounted(() => {
  loadProducts()
  loadFilterOptions()
})
</script>

<style scoped>
@import '@/assets/shop.css';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap');

/* ============================================
   PRODUCT LISTING PAGE STYLES
   ============================================ */

.listing-page {
  min-height: 100vh;
  background: var(--shop-cream, #FAF8F5);
  padding-top: 5rem;
}

.listing-header-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 5rem;
  background: rgba(250, 248, 245, 0.95);
  backdrop-filter: blur(8px);
  z-index: 40;
}

.listing-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Header */
.listing-header {
  position: sticky;
  top: 5rem;
  z-index: 30;
  background: rgba(250, 248, 245, 0.98);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
  padding: 1.5rem 0;
}

/* Breadcrumbs */
.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  font-size: 0.8125rem;
  color: var(--shop-brown, #A89B8C);
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--shop-charcoal, #3D3A36);
}

.breadcrumb-current {
  font-size: 0.8125rem;
  color: var(--shop-charcoal, #3D3A36);
  font-weight: 500;
}

.breadcrumb-separator {
  color: var(--shop-tan, #C4B8A9);
}

/* Title Row */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  letter-spacing: -0.02em;
  margin: 0;
}

.results-count {
  font-size: 0.875rem;
  color: var(--shop-brown, #A89B8C);
  margin: 0.5rem 0 0 0;
}

.count-number {
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
}

/* Header Controls */
.header-controls {
  display: none;
  align-items: center;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .header-controls {
    display: flex;
  }
}

.sort-dropdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-label {
  font-size: 0.8125rem;
  color: var(--shop-brown, #A89B8C);
  white-space: nowrap;
}

.select-wrapper {
  position: relative;
}

.view-toggle {
  display: flex;
  background: white;
  border-radius: 0.5rem;
  padding: 0.25rem;
  gap: 0.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  color: var(--shop-tan, #C4B8A9);
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  color: var(--shop-brown, #A89B8C);
}

.view-btn.active {
  background: var(--shop-cream-dark, #F5F2ED);
  color: var(--shop-charcoal, #3D3A36);
}

/* Mobile Controls */
.mobile-controls {
  display: flex;
  position: sticky;
  top: 5rem;
  z-index: 25;
  background: rgba(250, 248, 245, 0.98);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1.5rem;
  gap: 0.75rem;
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
}

@media (min-width: 1024px) {
  .mobile-controls {
    display: none;
  }
}

.mobile-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-filter-btn:hover {
  border-color: var(--shop-tan, #C4B8A9);
}

.filter-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--shop-charcoal, #3D3A36);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 9999px;
}

.mobile-sort {
  flex: 1;
}

.mobile-sort-select {
  width: 100%;
  padding: 0.625rem 2rem 0.625rem 1rem;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B7D6D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  appearance: none;
  cursor: pointer;
}

/* Main Layout */
.listing-main {
  padding: 2rem 0 4rem;
}

.listing-layout {
  display: flex;
  gap: 2.5rem;
}

/* Sidebar */
.filter-sidebar {
  display: none;
  width: 260px;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .filter-sidebar {
    display: block;
  }
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0;
}

.clear-all-btn {
  font-size: 0.8125rem;
  color: var(--shop-accent, #B8956C);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;
}

.clear-all-btn:hover {
  color: var(--shop-accent-dark, #8C6D4D);
}

/* Active Filters */
.active-filters {
  margin-bottom: 1.5rem;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--shop-cream-dark, #F5F2ED);
  border: 1px solid var(--shop-beige, #E8E3DC);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tag:hover {
  background: var(--shop-beige, #E8E3DC);
}

/* Products Section */
.products-section {
  flex: 1;
  min-width: 0;
}

/* Active Filters Bar (Mobile) */
.active-filters-bar {
  display: block;
  margin-bottom: 1rem;
}

@media (min-width: 1024px) {
  .active-filters-bar {
    display: none;
  }
}

.filter-tags-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.filter-tag-small {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  white-space: nowrap;
  cursor: pointer;
}

/* Products Grid */
.products-grid {
  display: grid;
  gap: 1.5rem;
}

.products-grid.view-grid {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 640px) {
  .products-grid.view-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .products-grid.view-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .products-grid.view-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.products-grid.view-list {
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Skeleton */
.product-skeleton {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
}

.skeleton-image {
  aspect-ratio: 1;
  background: var(--shop-beige, #E8E3DC);
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-brand {
  width: 40%;
  height: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}

.skeleton-name {
  width: 80%;
  height: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 0.25rem;
}

.skeleton-price {
  width: 30%;
  height: 1.25rem;
  border-radius: 0.25rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  color: var(--shop-tan, #C4B8A9);
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0 0 0.5rem 0;
}

.empty-text {
  font-size: 0.9375rem;
  color: var(--shop-brown, #A89B8C);
  margin: 0 0 1.5rem 0;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  flex-wrap: wrap;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--shop-tan, #C4B8A9);
  background: var(--shop-cream-dark, #F5F2ED);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-num {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--shop-brown, #A89B8C);
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-num:hover:not(.active):not(.ellipsis) {
  background: var(--shop-cream-dark, #F5F2ED);
  color: var(--shop-charcoal, #3D3A36);
}

.page-num.active {
  background: var(--shop-charcoal, #3D3A36);
  color: white;
}

.page-num.ellipsis {
  cursor: default;
}

/* Load More */
.load-more-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 3rem;
}

.load-more-btn {
  min-width: 180px;
}

.showing-count {
  font-size: 0.8125rem;
  color: var(--shop-brown, #A89B8C);
}

/* Mobile Drawer */
.mobile-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}

.mobile-drawer {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  max-width: 320px;
  background: var(--shop-cream, #FAF8F5);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
}

.drawer-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  color: var(--shop-brown, #A89B8C);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.drawer-close:hover {
  background: var(--shop-beige, #E8E3DC);
  color: var(--shop-charcoal, #3D3A36);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.drawer-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--shop-beige, #E8E3DC);
  background: white;
}

.drawer-footer .shop-btn {
  flex: 1;
}

/* Drawer Transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .mobile-drawer,
.drawer-leave-active .mobile-drawer {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .mobile-drawer,
.drawer-leave-to .mobile-drawer {
  transform: translateX(100%);
}
</style>
