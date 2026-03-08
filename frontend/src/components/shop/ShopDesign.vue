<template>
  <div class="shop-design">
    <!-- Space-specific Section -->
    <section class="design-section">
      <header class="section-header">
        <h2 class="section-title">Space-specific</h2>
        <p class="section-subtitle">Shop furniture designed for specific rooms</p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="spaces-grid">
        <div v-for="n in 4" :key="n" class="space-card skeleton">
          <div class="space-icon-wrapper shop-skeleton"></div>
          <div class="shop-skeleton skeleton-label"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">{{ error }}</p>
      </div>

      <!-- Spaces Grid -->
      <div v-else class="spaces-grid shop-stagger">
        <div
          v-for="item in spaceItems"
          :key="item.id"
          class="space-card"
          @click="navigateToDesign(item.slug, 'space')"
        >
          <div class="space-icon-wrapper">
            <component :is="getSpaceIcon(item.slug)" class="space-icon" />
          </div>
          <span class="space-name">{{ item.name }}</span>
        </div>
      </div>
    </section>

    <!-- Divider -->
    <div class="design-divider">
      <span>OR</span>
    </div>

    <!-- Style-specific Section -->
    <section class="design-section">
      <header class="section-header">
        <h2 class="section-title">Style-specific</h2>
        <p class="section-subtitle">Browse collections curated by design aesthetic</p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="styles-grid">
        <div v-for="n in 4" :key="n" class="style-card skeleton">
          <div class="style-image-wrapper shop-skeleton"></div>
          <div class="shop-skeleton skeleton-label"></div>
        </div>
      </div>

      <!-- Styles Grid -->
      <div v-else class="styles-grid shop-stagger">
        <div
          v-for="item in styleItems"
          :key="item.id"
          class="style-card"
          @click="navigateToDesign(item.slug, 'style')"
        >
          <div class="style-image-wrapper">
            <img :src="item.image || getStyleFallback(item.slug)" :alt="item.name" loading="lazy" />
            <div class="style-overlay">
              <span class="style-explore">Explore</span>
            </div>
          </div>
          <span class="style-name">{{ item.name }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  items: {
    type: Object,
    default: () => ({ spaceSpecific: [], styleSpecific: [] }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const router = useRouter()

const spaceItems = computed(() => props.items?.spaceSpecific || [])
const styleItems = computed(() => props.items?.styleSpecific || [])

const navigateToDesign = (slug, type) => {
  router.push(`/shop/design/${type}/${slug}`)
}

// Space icons as functional components
const getSpaceIcon = (slug) => {
  const icons = {
    living: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v2h2v-2h10v2h2v-2h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z',
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
          h('path', { d: 'M3 9h18M9 9v12' }),
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
    balcony: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [h('path', { d: 'M3 12h18M3 12v8M21 12v8M6 12v8M18 12v8M12 12v8M3 7l9-5 9 5' })],
      ),
    lounge: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M5 11V7a4 4 0 014-4h6a4 4 0 014 4v4M3 11a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4zM5 17v3M19 17v3',
          }),
        ],
      ),
    poolside: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [
          h('path', {
            d: 'M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 2v6M8 4l4 4 4-4',
          }),
        ],
      ),
    foyer: () =>
      h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
        [h('path', { d: 'M3 21V9l9-6 9 6v12a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z' })],
      ),
  }
  return icons[slug] || icons.living
}

const getStyleFallback = (slug) => {
  const fallbacks = {
    minimalist: 'https://images.unsplash.com/photo-1598928506311-c55efa66a84d?w=400&h=400&fit=crop',
    japandi: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?w=400&h=400&fit=crop',
    brutalist: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop',
    'wabi-sabi':
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=400&fit=crop',
    scandinavian:
      'https://images.unsplash.com/photo-1598928506311-c55efa66a84d?w=400&h=400&fit=crop',
    'vintage-retro':
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop',
    traditional: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop',
    victorian: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=400&fit=crop',
    moroccan: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=400&h=400&fit=crop',
    parametric: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop',
    sustainable:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&h=400&fit=crop',
  }
  return (
    fallbacks[slug] ||
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'
  )
}
</script>

<style scoped>
@import '@/assets/shop.css';

.shop-design {
  width: 100%;
}

/* Section */
.design-section {
  margin-bottom: 2.5rem;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--shop-brown, #a89b8c);
  margin: 0;
}

/* Divider */
.design-divider {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 2.5rem 0;
  color: var(--shop-tan, #c4b8a9);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.design-divider::before,
.design-divider::after {
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
  max-width: 600px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .spaces-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
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
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.space-card:hover {
  border-color: var(--shop-tan, #c4b8a9);
  box-shadow: 0 6px 16px rgba(61, 58, 54, 0.08);
  transform: translateY(-2px);
}

.space-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-cream-dark, #f5f2ed);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.space-card:hover .space-icon-wrapper {
  background: var(--shop-beige, #e8e3dc);
}

.space-icon {
  width: 24px;
  height: 24px;
  color: var(--shop-charcoal, #3d3a36);
}

.space-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
}

/* Styles Grid */
.styles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .styles-grid {
    grid-template-columns: repeat(4, 1fr);
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
  transition: transform 0.5s ease;
}

.style-card:hover .style-image-wrapper img {
  transform: scale(1.1);
}

.style-overlay {
  position: absolute;
  inset: 0;
  background: rgba(61, 58, 54, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.style-card:hover .style-overlay {
  background: rgba(61, 58, 54, 0.4);
}

.style-explore {
  opacity: 0;
  transform: translateY(10px);
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  padding: 0.5rem 1rem;
  border: 1px solid white;
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.style-card:hover .style-explore {
  opacity: 1;
  transform: translateY(0);
}

.style-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
}

/* Skeleton */
.skeleton {
  pointer-events: none;
}

.skeleton .space-icon-wrapper,
.skeleton .style-image-wrapper {
  background: var(--shop-beige, #e8e3dc);
}

.skeleton-label {
  width: 60%;
  height: 1rem;
  border-radius: 0.25rem;
}

/* Error */
.error-state {
  padding: 2rem;
  text-align: center;
}

.error-text {
  color: var(--shop-brown, #a89b8c);
  font-size: 0.875rem;
}
</style>
