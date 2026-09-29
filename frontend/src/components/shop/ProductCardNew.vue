<template>
  <article
    :class="['product-card', `view-${viewMode}`, 'group']"
    @click="handleCardClick"
  >
    <!-- Product Image Container -->
    <div class="product-image-container">
      <div
        class="product-image"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Image Slider -->
        <div
          class="image-slider"
          :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
        >
          <img
            v-for="(image, index) in productImages"
            :key="index"
            :src="optimizeImageUrl(image, { width: 600, quality: 82 })"
            :alt="`${product.name || 'Product'} - Image ${index + 1}`"
            loading="lazy"
            decoding="async"
            class="product-img group-hover:scale-105 transition-transform duration-700 ease-out"
            @error="handleImageError"
          />
        </div>

        <!-- Badges -->
        <div class="product-badges">
          <span v-if="product.isNew" class="badge badge-new">New</span>
          <span v-if="product.discount" class="badge badge-sale">-{{ product.discount }}%</span>
          <span v-if="product.isBestSeller" class="badge badge-best">Bestseller</span>
        </div>

        <!-- Quick Actions Overlay (Grid View) -->
        <div class="quick-actions">
          <!-- Wishlist Heart Button -->
          <button
            class="action-btn wishlist"
            :class="{ active: isWishlisted }"
            @click.stop="handleToggleWishlist"
            :title="isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'"
            aria-label="Toggle wishlist"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              :class="{ 'fill-rose-500 text-rose-500 heart-beat': isWishlisted }"
              :fill="isWishlisted ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </button>

          <!-- Quick Add to Cart Button -->
          <button
            class="action-btn cart"
            :disabled="isAddingToCart || product.inStock === false"
            @click.stop="handleAddToCart"
            :title="product.inStock === false ? 'Out of Stock' : isAddedToCart ? 'Added!' : 'Quick Add to Cart'"
            aria-label="Add to cart"
          >
            <!-- Loading Spinner -->
            <svg
              v-if="isAddingToCart"
              class="w-4 h-4 animate-spin text-stone-800"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <!-- Success Checkmark -->
            <svg
              v-else-if="isAddedToCart"
              class="w-4 h-4 text-emerald-600 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <!-- Cart Icon -->
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"
              />
            </svg>
          </button>
        </div>

        <!-- Image Dots -->
        <div v-if="productImages.length > 1" class="image-dots">
          <button
            v-for="(_, index) in productImages.slice(0, 5)"
            :key="index"
            :class="['dot', { active: currentImageIndex === index }]"
            @click.stop="currentImageIndex = index"
            :aria-label="`View image ${index + 1}`"
          />
        </div>

        <!-- Navigation Arrows (visible on hover) -->
        <button
          v-if="productImages.length > 1"
          class="nav-arrow prev"
          @click.stop="prevImage"
          aria-label="Previous image"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          v-if="productImages.length > 1"
          class="nav-arrow next"
          @click.stop="nextImage"
          aria-label="Next image"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <!-- Out of Stock Indicator -->
        <div v-if="product.inStock === false" class="out-of-stock">
          <span>Out of Stock</span>
        </div>
      </div>
    </div>

    <!-- Product Info Section -->
    <div class="product-info">
      <!-- Brand Tag -->
      <span class="product-brand">{{ product.brand || product.brandName || 'SpaceFurnio' }}</span>

      <!-- Name / Title -->
      <h3 class="product-name" :title="product.name">{{ product.name }}</h3>

      <!-- Rating (List view) -->
      <div v-if="viewMode === 'list' && product.rating" class="product-rating-full">
        <div class="stars">
          <svg
            v-for="n in 5"
            :key="n"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            :fill="n <= Math.round(Number(product.rating)) ? '#F59E0B' : 'none'"
            :stroke="n <= Math.round(Number(product.rating)) ? '#F59E0B' : '#D4CFC6'"
            stroke-width="2"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
        <span class="rating-text">
          {{ Number(product.rating).toFixed(1) }}
          <span v-if="product.reviews || product.review_count">({{ product.reviews || product.review_count }} reviews)</span>
        </span>
      </div>

      <!-- Description (List view) -->
      <p v-if="viewMode === 'list'" class="product-description">
        {{ product.description }}
      </p>

      <!-- Meta Row (Price & Rating for Grid) -->
      <div class="product-meta">
        <!-- Price Display -->
        <div class="price-wrapper">
          <span class="product-price">${{ formattedPrice }}</span>
          <span v-if="product.originalPrice" class="original-price">
            ${{ formatNumber(product.originalPrice) }}
          </span>
        </div>

        <!-- Rating (Grid view) -->
        <div v-if="viewMode === 'grid' && product.rating" class="product-rating">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
          <span>{{ Number(product.rating).toFixed(1) }}</span>
        </div>
      </div>

      <!-- Color Options -->
      <div v-if="colorItems.length > 0" class="color-options">
        <button
          v-for="(color, cIndex) in colorItems.slice(0, 4)"
          :key="cIndex"
          class="color-dot"
          :style="{ backgroundColor: color.hex || getColorHexHelper(color.name || color) }"
          :title="color.name || color"
          @click.stop
        />
        <span v-if="colorItems.length > 4" class="more-colors">
          +{{ colorItems.length - 4 }}
        </span>
      </div>

      <!-- Add to Cart Button (List view) -->
      <button
        v-if="viewMode === 'list'"
        class="add-to-cart-btn"
        :disabled="isAddingToCart || product.inStock === false"
        @click.stop="handleAddToCart"
      >
        <svg
          v-if="isAddingToCart"
          class="w-4 h-4 animate-spin mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg
          v-else-if="isAddedToCart"
          class="w-4 h-4 text-emerald-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="mr-2"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span>
          {{ product.inStock === false ? 'Out of Stock' : isAddedToCart ? 'Added to Cart' : 'Add to Cart' }}
        </span>
      </button>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '@/stores/wishlist'
import { useCartStore } from '@/stores/cart'
import { getColorHexHelper } from '@/composables/productsUtills.js'
import { optimizeImageUrl } from '@/utils/imageOptimizer.js'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  viewMode: {
    type: String,
    default: 'grid',
    validator: (v) => ['grid', 'list'].includes(v),
  },
})

const emit = defineEmits(['toggle-wishlist', 'add-to-cart', 'click'])

const router = useRouter()
const wishlistStore = useWishlistStore()
const cartStore = useCartStore()

const currentImageIndex = ref(0)
const touchStartX = ref(0)
const isAddingToCart = ref(false)
const isAddedToCart = ref(false)

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80'

// Wishlist state directly connected to store
const isWishlisted = computed(() => {
  return wishlistStore.isInWishlist(props.product.id)
})

// Images Array
const productImages = computed(() => {
  if (Array.isArray(props.product.images) && props.product.images.length > 0) {
    return props.product.images.filter(Boolean)
  }
  const single =
    props.product.thumbnail ||
    props.product.primaryImage ||
    props.product.imageSrc ||
    props.product.image?.src
  if (single) return [single]
  return [FALLBACK_IMAGE]
})

// Formatted Price ($899.00)
const formattedPrice = computed(() => {
  if (props.product.price_cents !== undefined && props.product.price_cents !== null) {
    return (Number(props.product.price_cents) / 100).toFixed(2)
  }
  if (props.product.price !== undefined && props.product.price !== null) {
    return Number(props.product.price).toFixed(2)
  }
  return '0.00'
})

const formatNumber = (val) => {
  const num = Number(val)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

// Color items
const colorItems = computed(() => {
  if (Array.isArray(props.product.colorData) && props.product.colorData.length > 0) {
    return props.product.colorData
  }
  if (Array.isArray(props.product.colors) && props.product.colors.length > 0) {
    return props.product.colors.map((c) => (typeof c === 'string' ? { name: c } : c))
  }
  return []
})

// Navigation & Actions
const handleCardClick = () => {
  emit('click', props.product)
  const idOrSlug = props.product.slug || props.product.id
  router.push(`/shop/product/${idOrSlug}`)
}

const handleImageError = (e) => {
  e.target.src = FALLBACK_IMAGE
}

const nextImage = () => {
  if (productImages.value.length <= 1) return
  currentImageIndex.value = (currentImageIndex.value + 1) % productImages.value.length
}

const prevImage = () => {
  if (productImages.value.length <= 1) return
  currentImageIndex.value =
    (currentImageIndex.value - 1 + productImages.value.length) % productImages.value.length
}

const handleMouseEnter = () => {
  if (productImages.value.length > 1 && currentImageIndex.value === 0) {
    currentImageIndex.value = 1
  }
}

const handleMouseLeave = () => {
  currentImageIndex.value = 0
}

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX.value - touchEndX
  if (Math.abs(diff) > 40) {
    if (diff > 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
}

const handleToggleWishlist = async () => {
  try {
    await wishlistStore.toggleItem(props.product.id)
    emit('toggle-wishlist', props.product)
  } catch (err) {
    console.error('Wishlist toggle error:', err)
  }
}

const handleAddToCart = async () => {
  if (isAddingToCart.value) return
  isAddingToCart.value = true
  try {
    const price =
      props.product.price ||
      (props.product.price_cents ? props.product.price_cents / 100 : 0)
    await cartStore.addItem(props.product.id, 1, price)
    emit('add-to-cart', props.product)
    isAddedToCart.value = true
    setTimeout(() => {
      isAddedToCart.value = false
    }, 1800)
  } catch (err) {
    console.error('Add to cart error:', err)
  } finally {
    isAddingToCart.value = false
  }
}
</script>

<style scoped>
/* ============================================
   PRODUCT CARD - GRID VIEW
   ============================================ */

.product-card {
  position: relative;
  background: white;
  border-radius: 0.875rem;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(232, 227, 220, 0.8);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(61, 58, 54, 0.12);
  border-color: #d4cfc6;
}

/* Image Container */
.product-image-container {
  position: relative;
}

.product-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--shop-cream-dark, #f5f2ed);
}

.image-slider {
  display: flex;
  height: 100%;
  transition: transform 0.4s ease-out;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
}

/* Badges */
.product-badges {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  z-index: 5;
}

.badge {
  padding: 0.25rem 0.625rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.badge-new {
  background: var(--shop-charcoal, #3d3a36);
  color: white;
}

.badge-sale {
  background: #e11d48;
  color: white;
}

.badge-best {
  background: white;
  color: var(--shop-charcoal, #3d3a36);
}

/* Quick Actions */
.quick-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 5;
  opacity: 0;
  transform: translateX(8px);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .quick-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  color: var(--shop-brown-dark, #8b7d6d);
}

.action-btn:hover {
  transform: scale(1.1);
  background: white;
}

.action-btn:active {
  transform: scale(0.92);
}

.action-btn.wishlist:hover,
.action-btn.wishlist.active {
  color: #ef4444;
}

.action-btn.cart:hover {
  background: var(--shop-charcoal, #3d3a36);
  color: white;
}

/* Image Dots */
.image-dots {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.375rem;
  z-index: 5;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 9999px;
  backdrop-filter: blur(4px);
}

.dot {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.dot.active {
  background: white;
  width: 14px;
  border-radius: 3px;
}

/* Navigation Arrows */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 5;
  opacity: 0;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: var(--shop-charcoal, #3d3a36);
}

.nav-arrow.prev {
  left: 0.75rem;
}
.nav-arrow.next {
  right: 0.75rem;
}

.product-card:hover .nav-arrow {
  opacity: 1;
}

.nav-arrow:hover {
  transform: translateY(-50%) scale(1.1);
  background: white;
}

.nav-arrow:active {
  transform: translateY(-50%) scale(0.95);
}

/* Out of Stock Overlay */
.out-of-stock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(1px);
  z-index: 10;
}

.out-of-stock span {
  padding: 0.5rem 1rem;
  background: white;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--shop-charcoal, #3d3a36);
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Product Info */
.product-info {
  padding: 0.875rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-brand {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--shop-brown, #a89b8c);
  margin-bottom: 0.25rem;
}

.product-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  margin: 0 0 0.5rem 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Product Meta */
.product-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
}

.price-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.product-price {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
}

.original-price {
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
  color: #b45309;
  background: #fef3c7;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
}

/* Color Options */
.color-options {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.625rem;
}

.color-dot {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-dot:hover {
  transform: scale(1.25);
}

.more-colors {
  font-size: 0.6875rem;
  color: var(--shop-brown, #a89b8c);
  font-weight: 600;
}

/* ============================================
   PRODUCT CARD - LIST VIEW
   ============================================ */

.product-card.view-list {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  padding: 1.25rem;
  border: 1px solid var(--shop-beige, #e8e3dc);
}

.product-card.view-list .product-image-container {
  width: 220px;
  flex-shrink: 0;
}

.product-card.view-list .product-image {
  border-radius: 0.625rem;
}

.product-card.view-list .product-info {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.product-card.view-list .product-name {
  font-size: 1.125rem;
  -webkit-line-clamp: 1;
}

/* Rating Full (List view) */
.product-rating-full {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.125rem;
}

.rating-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shop-brown-dark, #8b7d6d);
}

/* Description (List view) */
.product-description {
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8b7d6d);
  line-height: 1.5;
  margin: 0.375rem 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Add to Cart Button (List view) */
.add-to-cart-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.5rem;
  margin-top: 1rem;
  background: var(--shop-charcoal, #3d3a36);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  align-self: flex-start;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #1c1917;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.add-to-cart-btn:active:not(:disabled) {
  transform: translateY(0);
}

.add-to-cart-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(0.9);
  }
  75% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

.heart-beat {
  animation: heartbeat 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Responsive */
@media (max-width: 640px) {
  .product-card.view-list {
    flex-direction: column;
    gap: 1rem;
  }

  .product-card.view-list .product-image-container {
    width: 100%;
  }
}
</style>
