<template>
  <div class="product-detail-page">
    <!-- Back Navigation -->
    <nav class="detail-nav">
      <div class="nav-container">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item">
              <router-link to="/" class="breadcrumb-link">Home</router-link>
              <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </li>
            <li class="breadcrumb-item">
              <router-link to="/shop/category" class="breadcrumb-link">Shop</router-link>
              <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </li>
            <li class="breadcrumb-item">
              <router-link :to="`/shop/category/${product.category}`" class="breadcrumb-link">
                {{ formatCategory(product.category) }}
              </router-link>
              <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </li>
            <li class="breadcrumb-item">
              <span class="breadcrumb-current">{{ product.name }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="detail-main">
      <div class="detail-container">
        <div class="detail-layout">
          <!-- Image Gallery -->
          <section class="gallery-section">
            <!-- Main Image -->
            <div class="main-image-wrapper">
              <img 
                :src="currentImage" 
                :alt="product.name"
                class="main-image"
              />
              
              <!-- Badges -->
              <div class="image-badges">
                <span v-if="product.isNew" class="badge badge-new">New</span>
                <span v-if="product.discount" class="badge badge-sale">-{{ product.discount }}%</span>
              </div>
              
              <!-- Navigation Arrows -->
              <button 
                v-if="product.images.length > 1"
                class="gallery-nav prev"
                @click="prevImage"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button 
                v-if="product.images.length > 1"
                class="gallery-nav next"
                @click="nextImage"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
            
            <!-- Thumbnail Strip -->
            <div v-if="product.images.length > 1" class="thumbnails">
              <button 
                v-for="(img, index) in product.images" 
                :key="index"
                :class="['thumb', { active: currentImageIndex === index }]"
                @click="currentImageIndex = index"
              >
                <img :src="img" :alt="`${product.name} - Image ${index + 1}`" />
              </button>
            </div>
          </section>

          <!-- Product Info -->
          <section class="info-section">
            <!-- Brand & Name -->
            <div class="product-header">
              <span class="product-brand">{{ product.brand }}</span>
              <h1 class="product-name">{{ product.name }}</h1>
              
              <!-- Rating -->
              <div class="rating-row">
                <div class="stars">
                  <svg 
                    v-for="n in 5" 
                    :key="n" 
                    width="16" height="16" 
                    viewBox="0 0 24 24" 
                    :fill="n <= Math.round(product.rating) ? '#F59E0B' : 'none'" 
                    :stroke="n <= Math.round(product.rating) ? '#F59E0B' : '#D4CFC6'" 
                    stroke-width="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span class="rating-text">{{ product.rating }} ({{ product.reviews }} reviews)</span>
              </div>
            </div>

            <!-- Price -->
            <div class="price-section">
              <span class="current-price">${{ formatPrice(product.price) }}</span>
              <span v-if="product.originalPrice" class="original-price">
                ${{ formatPrice(product.originalPrice) }}
              </span>
              <span v-if="product.discount" class="discount-badge">
                Save {{ product.discount }}%
              </span>
            </div>

            <!-- Description -->
            <p class="product-description">{{ product.description }}</p>

            <!-- Color Selection -->
            <div v-if="product.colorData && product.colorData.length > 0" class="option-group">
              <label class="option-label">
                Color: <strong>{{ selectedColor || product.colorData[0].name }}</strong>
              </label>
              <div class="color-options">
                <button 
                  v-for="color in product.colorData" 
                  :key="color.name"
                  :class="['color-swatch', { selected: selectedColor === color.name || (!selectedColor && color === product.colorData[0]) }]"
                  :style="{ backgroundColor: color.hex }"
                  :title="color.name"
                  @click="selectedColor = color.name"
                />
              </div>
            </div>

            <!-- Quantity -->
            <div class="option-group">
              <label class="option-label">Quantity</label>
              <div class="quantity-selector">
                <button class="qty-btn" @click="quantity > 1 && quantity--">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14"/>
                  </svg>
                </button>
                <input 
                  type="number" 
                  v-model.number="quantity" 
                  min="1" 
                  :max="product.stockCount || 10"
                  class="qty-input"
                />
                <button class="qty-btn" @click="quantity < (product.stockCount || 10) && quantity++">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Stock Status -->
            <div class="stock-status" :class="{ 'in-stock': product.inStock, 'out-of-stock': !product.inStock }">
              <span v-if="product.inStock" class="status-dot"></span>
              <span v-if="product.inStock">In Stock ({{ product.stockCount }} available)</span>
              <span v-else>Out of Stock</span>
            </div>

            <!-- Add to Cart Buttons -->
            <div class="action-buttons">
              <button 
                class="btn-add-cart"
                :disabled="!product.inStock"
                @click="addToCart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                </svg>
                Add to Cart
              </button>
              <button 
                :class="['btn-wishlist', { active: isWishlisted }]"
                @click="toggleWishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" :fill="isWishlisted ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            <!-- Features -->
            <div v-if="product.features && product.features.length > 0" class="features-section">
              <h3 class="section-title">Features</h3>
              <ul class="features-list">
                <li v-for="feature in product.features" :key="feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Dimensions -->
            <div v-if="product.dimensions" class="dimensions-section">
              <h3 class="section-title">Dimensions</h3>
              <div class="dimensions-grid">
                <div class="dimension-item">
                  <span class="dim-label">Width</span>
                  <span class="dim-value">{{ product.dimensions.width }} {{ product.dimensions.unit }}</span>
                </div>
                <div class="dimension-item">
                  <span class="dim-label">Height</span>
                  <span class="dim-value">{{ product.dimensions.height }} {{ product.dimensions.unit }}</span>
                </div>
                <div class="dimension-item">
                  <span class="dim-label">Depth</span>
                  <span class="dim-value">{{ product.dimensions.depth }} {{ product.dimensions.unit }}</span>
                </div>
                <div class="dimension-item">
                  <span class="dim-label">Weight</span>
                  <span class="dim-value">{{ product.weight }} kg</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Related Products -->
        <section v-if="relatedProducts.length > 0" class="related-section">
          <h2 class="related-title">You May Also Like</h2>
          <div class="related-grid">
            <div 
              v-for="item in relatedProducts" 
              :key="item.id"
              class="related-product"
              @click="navigateToProduct(item)"
            >
              <div class="related-image">
                <img :src="item.thumbnail" :alt="item.name" loading="lazy" />
              </div>
              <div class="related-info">
                <span class="related-brand">{{ item.brand }}</span>
                <h3 class="related-name">{{ item.name }}</h3>
                <span class="related-price">${{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import shopApi from '@/api/shopApi.js'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const currentImageIndex = ref(0)
const selectedColor = ref('')
const quantity = ref(1)
const isWishlisted = ref(false)
const relatedProducts = ref([])

// Preset product data for immediate display
const product = ref({
  id: 'preset-1',
  name: 'Modern Comfort Lounge Sofa',
  slug: 'modern-comfort-lounge-sofa',
  price: 1299,
  originalPrice: 1599,
  discount: 19,
  brand: 'Nordic Home',
  category: 'furniture',
  material: 'Oak Wood',
  colors: ['Natural', 'Charcoal', 'Beige'],
  colorData: [
    { name: 'Natural', hex: '#E5D3B3' },
    { name: 'Charcoal', hex: '#4A4641' },
    { name: 'Beige', hex: '#D4C8B8' },
    { name: 'Warm Grey', hex: '#A8A095' },
  ],
  rating: 4.8,
  reviews: 127,
  popularity: 95,
  inStock: true,
  stockCount: 12,
  isNew: true,
  isBestSeller: true,
  isFeatured: true,
  images: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop',
  ],
  thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
  description: 'Elevate your living space with this beautifully crafted modern sofa. Made with premium Oak Wood, this piece combines timeless design with exceptional quality. The clean lines and warm neutrals create a sophisticated yet inviting atmosphere.',
  features: [
    'Premium Oak Wood construction',
    'Handcrafted with attention to detail',
    'Sustainably sourced materials',
    'Easy assembly with included tools',
    '5-year manufacturer warranty',
  ],
  dimensions: {
    width: 220,
    height: 85,
    depth: 95,
    unit: 'cm',
  },
  weight: 45,
})

// Preset related products
const presetRelatedProducts = [
  {
    id: 'related-1',
    name: 'Accent Armchair',
    brand: 'Nordic Home',
    price: 599,
    category: 'furniture',
    thumbnail: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
  },
  {
    id: 'related-2',
    name: 'Modern Coffee Table',
    brand: 'Urban Studio',
    price: 449,
    category: 'furniture',
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=400&fit=crop',
  },
  {
    id: 'related-3',
    name: 'Floor Lamp',
    brand: 'Pure Design',
    price: 189,
    category: 'lights',
    thumbnail: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=400&fit=crop',
  },
  {
    id: 'related-4',
    name: 'Decorative Vase Set',
    brand: 'Artisan Works',
    price: 79,
    category: 'decor',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
  },
]

// Computed
const currentImage = computed(() => {
  return product.value.images[currentImageIndex.value] || product.value.thumbnail
})

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

const formatCategory = (cat) => {
  if (!cat) return 'Shop'
  return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/shop/category')
  }
}

const prevImage = () => {
  currentImageIndex.value = (currentImageIndex.value - 1 + product.value.images.length) % product.value.images.length
}

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % product.value.images.length
}

const addToCart = () => {
  console.log('Adding to cart:', {
    product: product.value,
    color: selectedColor.value || product.value.colorData?.[0]?.name,
    quantity: quantity.value,
  })
  // TODO: Integrate with cart store
}

const toggleWishlist = () => {
  isWishlisted.value = !isWishlisted.value
  console.log('Wishlist toggled:', product.value.id)
}

const navigateToProduct = (item) => {
  router.push(`/shop/category/${item.category}/${item.id}`)
}

// Load product data
const loadProduct = async () => {
  const productId = route.params.id
  if (!productId || productId === 'preset-1') {
    // Use preset data
    relatedProducts.value = presetRelatedProducts
    return
  }
  
  loading.value = true
  
  try {
    const response = await shopApi.getProduct(productId)
    
    if (response.success && response.data) {
      product.value = response.data
      relatedProducts.value = response.data.relatedProducts || presetRelatedProducts
    }
  } catch (error) {
    console.error('Error loading product:', error)
    // Keep preset data on error
    relatedProducts.value = presetRelatedProducts
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => route.params.id, () => {
  currentImageIndex.value = 0
  selectedColor.value = ''
  quantity.value = 1
  loadProduct()
})

// Lifecycle
onMounted(() => {
  relatedProducts.value = presetRelatedProducts
  loadProduct()
})
</script>

<style scoped>
@import '@/assets/shop.css';

/* ============================================
   PRODUCT DETAIL PAGE STYLES
   ============================================ */

.product-detail-page {
  min-height: 100vh;
  background: var(--shop-cream, #FAF8F5);
  padding-top: 5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Navigation */
.detail-nav {
  position: sticky;
  top: 5rem;
  z-index: 30;
  background: rgba(250, 248, 245, 0.98);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
  padding: 1rem 0;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: var(--shop-tan, #C4B8A9);
  background: var(--shop-cream-dark, #F5F2ED);
}

/* Breadcrumbs */
.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
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
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-sep {
  margin: 0 0.5rem;
  color: var(--shop-tan, #C4B8A9);
}

/* Main Content */
.detail-main {
  padding: 2rem 0 4rem;
}

.detail-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
}

@media (min-width: 1024px) {
  .detail-layout {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
}

/* Gallery Section */
.gallery-section {
  position: sticky;
  top: 9rem;
  align-self: start;
}

@media (max-width: 1023px) {
  .gallery-section {
    position: relative;
    top: 0;
  }
}

.main-image-wrapper {
  position: relative;
  aspect-ratio: 1;
  border-radius: 1rem;
  overflow: hidden;
  background: white;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-badges {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.badge {
  padding: 0.375rem 0.875rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 9999px;
}

.badge-new {
  background: var(--shop-charcoal, #3D3A36);
  color: white;
}

.badge-sale {
  background: var(--shop-accent, #B8956C);
  color: white;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: var(--shop-charcoal, #3D3A36);
  transition: all 0.2s ease;
}

.gallery-nav:hover {
  transform: translateY(-50%) scale(1.1);
}

.gallery-nav.prev { left: 1rem; }
.gallery-nav.next { right: 1rem; }

.thumbnails {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.thumb {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
  padding: 0;
}

.thumb.active {
  border-color: var(--shop-charcoal, #3D3A36);
}

.thumb:hover {
  border-color: var(--shop-tan, #C4B8A9);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Info Section */
.info-section {
  padding-top: 1rem;
}

.product-header {
  margin-bottom: 1.5rem;
}

.product-brand {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--shop-accent, #B8956C);
  margin-bottom: 0.5rem;
}

.product-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stars {
  display: flex;
  gap: 0.125rem;
}

.rating-text {
  font-size: 0.875rem;
  color: var(--shop-brown, #A89B8C);
}

/* Price Section */
.price-section {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
}

.current-price {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
}

.original-price {
  font-size: 1.125rem;
  color: var(--shop-tan, #C4B8A9);
  text-decoration: line-through;
}

.discount-badge {
  padding: 0.25rem 0.75rem;
  background: var(--shop-accent-light, #D4B896);
  color: var(--shop-accent-dark, #8C6D4D);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
}

/* Description */
.product-description {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--shop-brown-dark, #8B7D6D);
  margin: 0 0 1.5rem 0;
}

/* Option Groups */
.option-group {
  margin-bottom: 1.5rem;
}

.option-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  margin-bottom: 0.75rem;
}

.option-label strong {
  font-weight: 600;
}

/* Color Options */
.color-options {
  display: flex;
  gap: 0.75rem;
}

.color-swatch {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: var(--shop-charcoal, #3D3A36);
  box-shadow: 0 0 0 2px var(--shop-cream, #FAF8F5);
}

/* Quantity Selector */
.quantity-selector {
  display: inline-flex;
  align-items: center;
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 0.5rem;
  overflow: hidden;
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  color: var(--shop-brown, #A89B8C);
  cursor: pointer;
  transition: all 0.2s ease;
}

.qty-btn:hover {
  background: var(--shop-cream-dark, #F5F2ED);
  color: var(--shop-charcoal, #3D3A36);
}

.qty-input {
  width: 3rem;
  height: 2.5rem;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 500;
  border: none;
  border-left: 1px solid var(--shop-beige, #E8E3DC);
  border-right: 1px solid var(--shop-beige, #E8E3DC);
  color: var(--shop-charcoal, #3D3A36);
}

.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-input:focus {
  outline: none;
}

/* Stock Status */
.stock-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.stock-status.in-stock {
  color: var(--shop-success, #7D9B76);
}

.stock-status.out-of-stock {
  color: var(--shop-error, #C47575);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--shop-success, #7D9B76);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
}

.btn-add-cart {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1rem 2rem;
  background: var(--shop-charcoal, #3D3A36);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-cart:hover:not(:disabled) {
  background: var(--shop-black, #1A1816);
  transform: translateY(-1px);
}

.btn-add-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-wishlist {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 50%;
  color: var(--shop-brown, #A89B8C);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-wishlist:hover {
  border-color: var(--shop-tan, #C4B8A9);
  color: #EF4444;
}

.btn-wishlist.active {
  color: #EF4444;
  border-color: #EF4444;
}

/* Features Section */
.features-section,
.dimensions-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0 0 1rem 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8B7D6D);
  padding: 0.5rem 0;
}

.features-list li svg {
  flex-shrink: 0;
  color: var(--shop-success, #7D9B76);
  margin-top: 0.125rem;
}

/* Dimensions Grid */
.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .dimensions-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.dimension-item {
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--shop-beige, #E8E3DC);
  border-radius: 0.5rem;
  text-align: center;
}

.dim-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--shop-brown, #A89B8C);
  margin-bottom: 0.25rem;
}

.dim-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
}

/* Related Products Section */
.related-section {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--shop-beige, #E8E3DC);
}

.related-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0 0 2rem 0;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .related-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .related-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1400px) {
  .related-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.related-product {
  cursor: pointer;
}

.related-image {
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
  margin-bottom: 0.75rem;
}

.related-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.related-product:hover .related-image img {
  transform: scale(1.05);
}

.related-info {
  padding: 0 0.25rem;
}

.related-brand {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--shop-brown, #A89B8C);
}

.related-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0.25rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-price {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
}

/* Mobile Adjustments */
@media (max-width: 1023px) {
  .breadcrumbs {
    display: none;
  }
}
</style>
