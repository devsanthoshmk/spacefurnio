<template>
<section class="product-section pt-28">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-decoration header-decoration--left"></div>
      <h2 class="section-title phitagate-font" data-key="product_section_heading">
        {{ homePageText.product_section_heading.text }}
      </h2>
      <div class="header-decoration header-decoration--right"></div>
    </div>

    <!-- Subtitle ADD IF REQUIRED-->
    <!-- <p class="section-subtitle">Discover our handcrafted collection of premium furniture</p> -->

    <div class="product-gallery-container">
      <!-- Navigation Controls -->
      <div class="scroll-controls">
        <Button
          @click="scrollLeft"
          icon="pi pi-chevron-left"
          class="scroll-btn scroll-btn-left"
          severity="secondary"
          outlined
          :disabled="isAtStart"
        />
        <Button
          @click="scrollRight"
          icon="pi pi-chevron-right"
          class="scroll-btn scroll-btn-right"
          severity="secondary"
          outlined
          :disabled="isAtEnd"
        />
      </div>

      <!-- Products Grid Section -->
      <section class="products-section" v-animateonscroll="{ enterClass: 'animate__fadeInUp' }">
        <div
          ref="productsGrid"
          class="products-grid"
        >
          <div
            v-for="(product, index) in formattedProducts"
            :key="product.id"
            class="product-card-wrapper group"
            v-animateonscroll="{
              enterClass: 'animate__fadeInUp',
              delay: index * 50
            }"
          >
            <!-- ProductCard with grayscale effect -->
            <div class="product-card-inner">
              <ProductCard
                :product="product"
                class="pointer-events-none grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
              />
            </div>

            <!-- Coming Soon Overlay -->
            <div class="coming-soon-overlay">
              <div class="coming-soon-content">
                <!-- Animated pulse ring -->
                <div class="pulse-ring"></div>
                <div class="pulse-ring delay-1"></div>

                <!-- Glass card -->
                <div class="glass-card">
                  <i class="pi pi-clock coming-soon-icon"></i>
                  <span class="coming-soon-text" data-key="coming_soon">{{ homePageText.coming_soon.text }}</span>
                  <div class="sparkle-line"></div>
                </div>
              </div>
            </div>

            <!-- Coming Soon badge -->
            <div class="disabled-badge">
              <i class="pi pi-hourglass"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- Page Indicator -->
      <div class="page-indicator-container">
        <div class="page-dots">
          <span
            v-for="(_, idx) in totalPages"
            :key="idx"
            class="page-dot"
            :class="{ 'active': idx === currentPage }"
            @click="goToPage(idx)"
          ></span>
        </div>
      </div>
    </div>
</section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Button from 'primevue/button'
import ProductCard from '@/components/shop/ProductCard.vue'
import homePageText from '@/assets/contents/homePage.js'

// Reactive references
const productsGrid = ref(null)
const currentPage = ref(0)
const itemsPerPage = ref(4) // Default for desktop

// Products data (raw format)
const products = ref([
  {
    id: 1,
    name: 'Luxurious Modern Sofa',
    brand: 'Spacefurnio',
    price: 899,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 2,
    name: 'Minimalist Dining Chair',
    brand: 'Spacefurnio',
    price: 249,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 3,
    name: 'Scandinavian Coffee Table',
    brand: 'Spacefurnio',
    price: 449,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1549497538-303791108f95?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 4,
    name: 'Designer Floor Lamp',
    brand: 'Spacefurnio',
    price: 199,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 5,
    name: 'Modern Bookshelf',
    brand: 'Spacefurnio',
    price: 329,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 6,
    name: 'Elegant Side Table',
    brand: 'Spacefurnio',
    price: 179,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1549497538-303791108f95?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 7,
    name: 'Luxury Accent Chair',
    brand: 'Spacefurnio',
    price: 599,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop']
  },
  {
    id: 8,
    name: 'Contemporary Ottoman',
    brand: 'Spacefurnio',
    price: 149,
    rating: 5,
    images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1000&auto=format&fit=crop']
  }
])

// Computed properties
const totalPages = computed(() => Math.ceil(products.value.length / itemsPerPage.value))

const formattedProducts = computed(() => {
  const start = currentPage.value * itemsPerPage.value
  const end = start + itemsPerPage.value
  return products.value.slice(start, end)
})

const isAtStart = computed(() => currentPage.value === 0)
const isAtEnd = computed(() => currentPage.value >= totalPages.value - 1)

// Scroll progress for indicator (now page-based) NOT NEEDED NOW
// const scrollProgress = computed(() =>
//   totalPages.value > 1 ? ((currentPage.value + 1) / totalPages.value) * 100 : 100
// )

// Methods
const scrollLeft = () => {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

const scrollRight = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
  }
}

const goToPage = (pageIndex) => {
  currentPage.value = pageIndex
}

// Calculate items per page based on screen width
const updateItemsPerPage = () => {
  // Always show 4 products per page on all screens
  itemsPerPage.value = 4
  // Reset to first page if current page is out of bounds
  if (currentPage.value >= totalPages.value) {
    currentPage.value = Math.max(0, totalPages.value - 1)
  }
}

// Lifecycle hooks
onMounted(() => {
  updateItemsPerPage()
  window.addEventListener('resize', updateItemsPerPage)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateItemsPerPage)
})
</script>

<style scoped>
/* ========================================
   FONTS
======================================== */
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif !important;
}

/* ========================================
   MAIN SECTION - Strict 100dvh Container
======================================== */
.product-section {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1rem, 3vh, 2rem) 0;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(249, 250, 251, 0.5) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

/* ========================================
   SECTION HEADER
======================================== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 1.5vw, 1.5rem);
  margin-bottom: 0.25rem;
  padding: 0 1rem;
}

.header-decoration {
  flex: 1;
  max-width: 120px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    rgba(230, 126, 34, 0.5),
    rgba(230, 126, 34, 0.8)
  );
  border-radius: 1px;
}

.header-decoration--left {
  background: linear-gradient(90deg,
    transparent,
    rgba(230, 126, 34, 0.5),
    rgba(230, 126, 34, 0.8)
  );
}

.header-decoration--right {
  background: linear-gradient(270deg,
    transparent,
    rgba(230, 126, 34, 0.5),
    rgba(230, 126, 34, 0.8)
  );
}

.section-title {
  font-size: clamp(2rem, 6vw, 4.5rem);
  font-weight: 400;
  text-align: center;
  color: transparent;
  -webkit-text-stroke: 1.5px #1a1a1a;
  text-stroke: 1.5px #1a1a1a;
  letter-spacing: 0.02em;
  line-height: 1.1;
  white-space: nowrap;
}

.section-subtitle {
  text-align: center;
  font-size: clamp(0.7rem, 1.2vw, 0.9rem);
  color: #6b7280;
  font-weight: 400;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding: 0 1rem;
}

/* ========================================
   GALLERY CONTAINER
======================================== */
.product-gallery-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* ========================================
   NAVIGATION CONTROLS
======================================== */
.scroll-controls {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
  padding: 0 0.25rem;
}

.scroll-btn {
  pointer-events: auto;
  width: clamp(36px, 5vw, 48px) !important;
  height: clamp(36px, 5vw, 48px) !important;
  min-width: 36px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border-radius: 50% !important;
}

.scroll-btn:hover:not(:disabled) {
  background: #fff !important;
  transform: scale(1.1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.scroll-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: scale(0.95);
}

/* ========================================
   PRODUCTS SECTION
======================================== */
.products-section {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 0;
  padding: clamp(0.5rem, 2vh, 1rem) 0;
}

.products-grid {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  padding: 0 clamp(2.5rem, 5vw, 4rem) 10px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.product-card-wrapper {
  /* Dynamic sizing - fills available space equally */
  flex: 1 1 0;
  max-width: clamp(200px, 22vw, 280px);
  height: clamp(300px, 55vh, 420px);
  position: relative;
  border-radius: clamp(12px, 1.5vw, 16px);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.product-card-wrapper:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

.product-card-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card-inner :deep(.relative) {
  height: 100%;
}

.product-card-inner :deep(.aspect-\[4\/5\]) {
  aspect-ratio: auto;
  height: 65%;
}

.product-card-inner :deep(.mt-4) {
  margin-top: auto;
  height: 35%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(0.5rem, 1.5vh, 1rem) !important;
}

/* ========================================
   COMING SOON OVERLAY
======================================== */
.coming-soon-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(0px);
  pointer-events: none;
  border-radius: inherit;
  z-index: 10;
}

.product-card-wrapper:hover .coming-soon-overlay {
  opacity: 1;
  backdrop-filter: blur(4px);
}

.coming-soon-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Pulse Rings */
.pulse-ring {
  position: absolute;
  width: clamp(60px, 8vw, 100px);
  height: clamp(60px, 8vw, 100px);
  border: 2px solid rgba(249, 115, 22, 0.5);
  border-radius: 50%;
  animation: pulseRing 2s ease-out infinite;
  opacity: 0;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
}

.product-card-wrapper:hover .pulse-ring {
  opacity: 1;
}

@keyframes pulseRing {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: clamp(10px, 1.5vw, 16px);
  padding: clamp(12px, 2vw, 20px) clamp(20px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(4px, 0.5vh, 8px);
  transform: scale(0.8) translateY(20px);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.product-card-wrapper:hover .glass-card {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.coming-soon-icon {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #f97316;
  margin-bottom: clamp(4px, 0.5vh, 8px);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.coming-soon-text {
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(10px, 1.2vw, 13px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: clamp(1.5px, 0.3vw, 3px);
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Sparkle Line */
.sparkle-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(249, 115, 22, 0.9) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: none;
}

.product-card-wrapper:hover .sparkle-line {
  animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes sparkle {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Disabled Badge */
.disabled-badge {
  position: absolute;
  top: clamp(8px, 1.5vw, 12px);
  right: clamp(8px, 1.5vw, 12px);
  width: clamp(22px, 3vw, 28px);
  height: clamp(22px, 3vw, 28px);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0.8;
  transition: all 0.3s ease;
  z-index: 15;
  font-size: clamp(10px, 1.2vw, 12px);
}

.product-card-wrapper:hover .disabled-badge {
  opacity: 1;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 1) 100%);
  transform: rotate(15deg) scale(1.15);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

/* ========================================
   PAGE INDICATOR
======================================== */
.page-indicator-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(4px, 1vh, 8px);
  padding: clamp(0.75rem, 2vh, 1.5rem) 1rem 0;
}

.page-dots {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-dot:hover {
  background: rgba(230, 126, 34, 0.5);
  transform: scale(1.2);
}

.page-dot.active {
  width: 28px;
  border-radius: 5px;
  background: linear-gradient(90deg, #e67e22, #f39c12);
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.4);
}

/* ========================================
   ANIMATIONS
======================================== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate__fadeInUp {
  animation: fadeInUp 0.6s ease-out;
}

/* ========================================
   RESPONSIVE - Mobile Small (< 360px)
======================================== */
@media (max-width: 359px) {
  .product-section {
    padding-top: 6.5rem;
  }

  .section-header {
    margin-bottom: 0.5rem;
  }

  .section-title {
    -webkit-text-stroke: 1.2px #1a1a1a;
    font-size: 2rem;
  }

  .section-subtitle {
    font-size: 0.7rem;
    margin-bottom: 0.15rem;
  }

  .products-section {
    padding: 0.25rem 0;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.25rem 2rem;
    height: 100%;
    width: 100%;
  }

  .product-card-wrapper {
    flex: none;
    max-width: none;
    width: 100%;
    height: 100%;
    min-height: 0;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .product-card-inner :deep(.aspect-\[4\/5\]) {
    height: 68%;
  }

  .product-card-inner :deep(.mt-4) {
    height: 32%;
    margin-top: 0 !important;
    padding: 0.35rem 0.4rem !important;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0;
  }

  /* Brand and rating row */
  .product-card-inner :deep(.flex.justify-between.items-start) {
    margin-bottom: 0.15rem;
  }

  /* Product name */
  .product-card-inner :deep(.text-base) {
    font-size: 0.72rem;
    line-height: 1.25;
    margin-bottom: 0.1rem;
  }

  /* Brand text */
  .product-card-inner :deep(.text-xs) {
    font-size: 0.55rem;
  }

  /* Price section */
  .product-card-inner :deep(.mt-auto) {
    margin-top: 0.15rem !important;
    padding-top: 0.15rem !important;
  }

  .product-card-inner :deep(.text-lg) {
    font-size: 0.85rem;
    font-weight: 700;
  }

  .scroll-controls {
    padding: 0 0.15rem;
  }

  .scroll-btn {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
  }

  .header-decoration {
    display: none;
  }

  .page-dot {
    width: 6px;
    height: 6px;
  }

  .page-dot.active {
    width: 16px;
  }

  .page-indicator-container {
    padding: 0.35rem 0.5rem 0;
  }

  .page-dots {
    gap: 6px;
  }

  /* Hide some overlay elements on very small screens */
  .coming-soon-overlay .pulse-ring {
    display: none;
  }

  .glass-card {
    padding: 8px 12px;
  }

  .coming-soon-icon {
    font-size: 0.75rem;
    margin-bottom: 2px;
  }

  .coming-soon-text {
    font-size: 8px;
    letter-spacing: 1px;
  }

  .disabled-badge {
    width: 18px;
    height: 18px;
    top: 5px;
    right: 5px;
    font-size: 8px;
  }
}

/* ========================================
   RESPONSIVE - Mobile (360px - 767px)
======================================== */
@media (min-width: 360px) and (max-width: 767px) {
  .product-section {
    padding-top: 7rem;
  }

  .section-header {
    margin-bottom: 0.6rem;
  }

  .section-title {
    font-size: 2.4rem;
    -webkit-text-stroke: 1.3px #1a1a1a;
  }

  .section-subtitle {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }

  .products-section {
    padding: 0.35rem 0;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0.6rem;
    padding: 0.25rem 1.75rem;
    height: 100%;
    width: 100%;
  }

  .product-card-wrapper {
    flex: none;
    max-width: none;
    width: 100%;
    height: 100%;
    min-height: 0;
    border-radius: 12px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.07);
  }

  .product-card-inner :deep(.aspect-\[4\/5\]) {
    height: 68%;
  }

  .product-card-inner :deep(.mt-4) {
    height: 32%;
    margin-top: 0 !important;
    padding: 0.4rem 0.5rem !important;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0;
  }

  /* Brand and rating row */
  .product-card-inner :deep(.flex.justify-between.items-start) {
    margin-bottom: 0.2rem;
  }

  /* Product name */
  .product-card-inner :deep(.text-base) {
    font-size: 0.82rem;
    line-height: 1.25;
    margin-bottom: 0.1rem;
  }

  /* Brand text */
  .product-card-inner :deep(.text-xs) {
    font-size: 0.6rem;
  }

  /* Price section */
  .product-card-inner :deep(.mt-auto) {
    margin-top: 0.2rem !important;
    padding-top: 0.2rem !important;
  }

  .product-card-inner :deep(.text-lg) {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .scroll-controls {
    padding: 0 0.25rem;
  }

  .scroll-btn {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
  }

  .header-decoration {
    max-width: 40px;
  }

  .page-indicator-container {
    padding: 0.4rem 0.5rem 0;
  }

  .page-dots {
    gap: 8px;
  }

  .page-dot {
    width: 7px;
    height: 7px;
  }

  .page-dot.active {
    width: 20px;
  }

  /* Adjust overlay for mobile */
  .coming-soon-overlay .pulse-ring {
    width: 55px;
    height: 55px;
  }

  .glass-card {
    padding: 12px 18px;
  }

  .coming-soon-icon {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }

  .coming-soon-text {
    font-size: 10px;
    letter-spacing: 1.5px;
  }

  .disabled-badge {
    width: 20px;
    height: 20px;
    top: 6px;
    right: 6px;
    font-size: 10px;
  }
}

/* ========================================
   RESPONSIVE - Tablet (768px - 1023px)
======================================== */
@media (min-width: 768px) and (max-width: 1023px) {
  .product-section {
    padding-top: 6.5rem;
  }

  .products-grid {
    gap: 0.75rem;
    padding: 0 2.5rem;
  }

  .product-card-wrapper {
    flex: 1 1 0;
    max-width: 180px;
    height: clamp(280px, 48vh, 350px);
  }

  .scroll-controls {
    padding: 0 0.25rem;
  }

  .scroll-btn {
    width: 36px !important;
    height: 36px !important;
  }

  .header-decoration {
    max-width: 80px;
  }
}

/* ========================================
   RESPONSIVE - Desktop (1024px - 1399px)
======================================== */
@media (min-width: 1024px) and (max-width: 1399px) {
  .product-section {
    padding-top: 7rem;
  }

  .products-grid {
    gap: 1rem;
    padding: 0 3rem;
  }

  .product-card-wrapper {
    flex: 1 1 0;
    max-width: 240px;
    height: clamp(300px, 50vh, 380px);
  }

  .scroll-controls {
    padding: 0 0.35rem;
  }

  .scroll-btn {
    width: 40px !important;
    height: 40px !important;
  }
}

/* ========================================
   RESPONSIVE - Large Desktop (1400px+)
======================================== */
@media (min-width: 1400px) {
  .product-section {
    padding-top: 7rem;
  }

  .section-title {
    -webkit-text-stroke: 2px #1a1a1a;
  }

  .products-grid {
    gap: 1.25rem;
    padding: 0 3.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .product-card-wrapper {
    flex: 1 1 0;
    max-width: 280px;
    height: min(400px, 52vh);
  }

  .scroll-controls {
    padding: 0 0.5rem;
  }

  .scroll-btn {
    width: 44px !important;
    height: 44px !important;
  }

  .header-decoration {
    max-width: 120px;
  }
}

/* ========================================
   RESPONSIVE - Ultra Wide (1800px+)
======================================== */
@media (min-width: 1800px) {
  .products-grid {
    max-width: 1600px;
    gap: 1.5rem;
    padding: 0 4rem;
  }

  .product-card-wrapper {
    max-width: 320px;
    height: min(420px, 52vh);
  }

  .scroll-controls {
    padding: 0 1rem;
  }
}

/* ========================================
   LANDSCAPE MODE ADJUSTMENTS
======================================== */
@media (max-height: 500px) and (orientation: landscape) {
  .product-section {
    padding-top: 4rem;
  }

  .section-header {
    margin-bottom: 0.25rem;
  }

  .section-subtitle {
    display: none;
  }

  .product-card-wrapper {
    height: 65vh;
    min-height: 180px;
  }

  .products-section {
    padding: 0.25rem 0;
  }

  .page-indicator-container {
    padding-top: 0.25rem;
  }
}

/* ========================================
   REDUCED MOTION
======================================== */
@media (prefers-reduced-motion: reduce) {
  .product-card-wrapper {
    transition: none;
  }

  .pulse-ring {
    animation: none;
  }

  .sparkle-line {
    animation: none;
  }

  .coming-soon-icon {
    animation: none;
  }

  .animate__fadeInUp {
    animation: none;
  }
}
</style>
