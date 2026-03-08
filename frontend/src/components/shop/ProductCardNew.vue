<template>
  <article :class="['product-card', `view-${viewMode}`]" @click="$emit('click')">
    <!-- Product Image -->
    <div class="product-image-container">
      <div
        class="product-image"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Image Carousel -->
        <div
          class="image-slider"
          :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
        >
          <img
            v-for="(image, index) in productImages"
            :key="index"
            :src="image"
            :alt="`${product.name} - Image ${index + 1}`"
            loading="lazy"
            class="product-img"
          />
        </div>

        <!-- Badges -->
        <div class="product-badges">
          <span v-if="product.isNew" class="badge badge-new">New</span>
          <span v-if="product.discount" class="badge badge-sale">-{{ product.discount }}%</span>
          <span v-if="product.isBestSeller" class="badge badge-best">Bestseller</span>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button
            class="action-btn wishlist"
            :class="{ active: isWishlisted }"
            @click.stop="handleWishlist"
            aria-label="Add to wishlist"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              :fill="isWishlisted ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </button>
          <button class="action-btn cart" @click.stop="handleAddToCart" aria-label="Add to cart">
            <svg
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
            v-for="(_, index) in productImages.slice(0, 4)"
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

        <!-- Stock Indicator -->
        <div v-if="!product.inStock" class="out-of-stock">
          <span>Out of Stock</span>
        </div>
      </div>
    </div>

    <!-- Product Info -->
    <div class="product-info">
      <!-- Brand -->
      <span class="product-brand">{{ product.brand }}</span>

      <!-- Name -->
      <h3 class="product-name">{{ product.name }}</h3>

      <!-- Rating (List view) -->
      <div v-if="viewMode === 'list' && product.rating" class="product-rating-full">
        <div class="stars">
          <svg
            v-for="n in 5"
            :key="n"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            :fill="n <= Math.round(product.rating) ? '#F59E0B' : 'none'"
            :stroke="n <= Math.round(product.rating) ? '#F59E0B' : '#D4CFC6'"
            stroke-width="2"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
        <span class="rating-text">{{ product.rating }} ({{ product.reviews }} reviews)</span>
      </div>

      <!-- Description (List view) -->
      <p v-if="viewMode === 'list'" class="product-description">
        {{ product.description }}
      </p>

      <!-- Meta Row -->
      <div class="product-meta">
        <!-- Price -->
        <div class="price-wrapper">
          <span class="product-price">${{ formatPrice(product.price) }}</span>
          <span v-if="product.originalPrice" class="original-price">
            ${{ formatPrice(product.originalPrice) }}
          </span>
        </div>

        <!-- Rating (Grid view) -->
        <div v-if="viewMode === 'grid' && product.rating" class="product-rating">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
          <span>{{ product.rating }}</span>
        </div>
      </div>

      <!-- Color Options -->
      <div v-if="product.colorData && product.colorData.length > 0" class="color-options">
        <button
          v-for="color in product.colorData.slice(0, 4)"
          :key="color.name"
          class="color-dot"
          :style="{ backgroundColor: color.hex }"
          :title="color.name"
          @click.stop
        />
        <span v-if="product.colorData.length > 4" class="more-colors">
          +{{ product.colorData.length - 4 }}
        </span>
      </div>

      <!-- Add to Cart Button (List view) -->
      <button
        v-if="viewMode === 'list'"
        class="add-to-cart-btn"
        :disabled="!product.inStock"
        @click.stop="handleAddToCart"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
        </svg>
        {{ product.inStock ? 'Add to Cart' : 'Notify Me' }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'

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

// State
const currentImageIndex = ref(0)
const isWishlisted = ref(false)
const touchStartX = ref(0)

// Computed
const productImages = computed(() => {
  if (props.product.images && props.product.images.length > 0) {
    return props.product.images
  }
  return [props.product.thumbnail || props.product.imageSrc || 'https://via.placeholder.com/400']
})

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % productImages.value.length
}

const prevImage = () => {
  currentImageIndex.value =
    (currentImageIndex.value - 1 + productImages.value.length) % productImages.value.length
}

const handleMouseEnter = () => {
  // Auto-advance to second image on hover
  if (productImages.value.length > 1 && currentImageIndex.value === 0) {
    currentImageIndex.value = 1
  }
}

const handleMouseLeave = () => {
  // Return to first image
  currentImageIndex.value = 0
}

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX.value - touchEndX

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
}

const handleWishlist = () => {
  isWishlisted.value = !isWishlisted.value
  emit('toggle-wishlist', props.product)
}

const handleAddToCart = () => {
  emit('add-to-cart', props.product)
}
</script>

<style scoped>
/* ============================================
   PRODUCT CARD - GRID VIEW
   ============================================ */

.product-card {
  position: relative;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 8px 24px rgba(61, 58, 54, 0.1);
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
  transition: transform 0.4s ease;
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
}

.badge-new {
  background: var(--shop-charcoal, #3d3a36);
  color: white;
}

.badge-sale {
  background: var(--shop-accent, #b8956c);
  color: white;
}

.badge-best {
  background: white;
  color: var(--shop-charcoal, #3d3a36);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  transition: all 0.3s ease;
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
  background: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: var(--shop-brown-dark, #8b7d6d);
}

.action-btn:hover {
  transform: scale(1.1);
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
  background: rgba(0, 0, 0, 0.2);
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
  width: 16px;
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
  background: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 5;
  opacity: 0;
  transition: all 0.3s ease;
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
}

/* Out of Stock Overlay */
.out-of-stock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.out-of-stock span {
  padding: 0.5rem 1rem;
  background: white;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--shop-charcoal, #3d3a36);
  border-radius: 9999px;
}

/* Product Info */
.product-info {
  padding: 0.875rem 1rem 1rem;
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
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Product Meta */
.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.price-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.product-price {
  font-size: 1rem;
  font-weight: 600;
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
  font-weight: 500;
  color: var(--shop-brown, #a89b8c);
}

/* Color Options */
.color-options {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.color-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-dot:hover {
  transform: scale(1.2);
}

.more-colors {
  font-size: 0.6875rem;
  color: var(--shop-brown, #a89b8c);
  font-weight: 500;
}

/* ============================================
   PRODUCT CARD - LIST VIEW
   ============================================ */

.product-card.view-list {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--shop-beige, #e8e3dc);
}

.product-card.view-list .product-image-container {
  width: 200px;
  flex-shrink: 0;
}

.product-card.view-list .product-image {
  border-radius: 0.5rem;
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

.product-card.view-list .product-meta {
  margin-top: auto;
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
  color: var(--shop-brown, #a89b8c);
}

/* Description (List view) */
.product-description {
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8b7d6d);
  line-height: 1.5;
  margin: 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Add to Cart Button (List view) */
.add-to-cart-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  margin-top: 1rem;
  background: var(--shop-charcoal, #3d3a36);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: var(--shop-black, #1a1816);
  transform: translateY(-1px);
}

.add-to-cart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
