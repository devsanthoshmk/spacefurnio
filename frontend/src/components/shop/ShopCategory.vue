<template>
  <div class="shop-category">
    <!-- Loading State -->
    <div v-if="loading" class="categories-grid">
      <div v-for="n in 4" :key="n" class="category-card skeleton">
        <div class="category-icon-wrapper shop-skeleton"></div>
        <div class="shop-skeleton skeleton-label"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <h3 class="error-title">Something went wrong</h3>
      <p class="error-text">{{ error }}</p>
      <button class="shop-btn shop-btn-secondary" @click="$emit('retry')">
        Try Again
      </button>
    </div>

    <!-- Categories Grid -->
    <div v-else class="categories-grid shop-stagger">
      <div
        v-for="item in items"
        :key="item.id"
        class="category-card"
        @click="navigateToCategory(item.slug)"
      >
        <div class="category-icon-wrapper">
          <!-- Icon or Image -->
          <div v-if="item.icon" class="category-icon" v-html="item.icon"></div>
          <img 
            v-else-if="item.image" 
            :src="item.image" 
            :alt="item.name"
            class="category-image"
            loading="lazy"
          />
          <div v-else class="category-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        </div>
        
        <div class="category-info">
          <span class="category-name">{{ item.name }}</span>
          <span v-if="item.productCount" class="category-count">
            {{ item.productCount }} items
          </span>
        </div>
        
        <!-- Hover Arrow -->
        <div class="category-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['retry'])

const router = useRouter()

const navigateToCategory = (slug) => {
  router.push(`/shop/category/${slug}`)
}
</script>

<style scoped>
@import '@/assets/shop.css';

.shop-category {
  width: 100%;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .categories-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
}

/* Category Card */
.category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1rem;
  background: white;
  border: 1px solid var(--shop-beige, #E8E3DC);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.category-card:hover {
  border-color: var(--shop-tan, #C4B8A9);
  box-shadow: 0 8px 24px rgba(61, 58, 54, 0.1);
  transform: translateY(-4px);
}

.category-card.skeleton {
  pointer-events: none;
}

/* Icon Wrapper */
.category-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-cream-dark, #F5F2ED);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.category-card:hover .category-icon-wrapper {
  background: var(--shop-beige, #E8E3DC);
  transform: scale(1.05);
}

.category-icon {
  width: 32px;
  height: 32px;
  color: var(--shop-charcoal, #3D3A36);
}

.category-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.category-placeholder {
  color: var(--shop-tan, #C4B8A9);
}

/* Category Info */
.category-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.category-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  transition: color 0.2s ease;
}

.category-card:hover .category-name {
  color: var(--shop-accent, #B8956C);
}

.category-count {
  font-size: 0.75rem;
  color: var(--shop-brown, #A89B8C);
}

/* Hover Arrow */
.category-arrow {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  opacity: 0;
  transform: translateX(-8px);
  color: var(--shop-accent, #B8956C);
  transition: all 0.3s ease;
}

.category-card:hover .category-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Skeleton */
.skeleton .category-icon-wrapper {
  background: var(--shop-beige, #E8E3DC);
}

.skeleton-label {
  width: 60%;
  height: 1rem;
  border-radius: 0.25rem;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.error-icon {
  color: var(--shop-accent, #B8956C);
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  margin: 0 0 0.5rem 0;
}

.error-text {
  font-size: 0.875rem;
  color: var(--shop-brown, #A89B8C);
  margin: 0 0 1.5rem 0;
}
</style>
