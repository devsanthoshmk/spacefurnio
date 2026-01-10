<template>
<section class="pt-32 scroll-section h-screen">
      <h2 class="phitagate-font bold italicfont-phitagate text-[5rem] font-normal not-italic text-center
            text-black [text-fill-color:white] [-webkit-text-stroke:2px_black]" data-key="product_section_heading">{{ homePageText.product_section_heading }}</h2>
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
          @scroll="handleScroll"
        >
          <div
            v-for="(product, index) in formattedProducts"
            :key="product.id"
            class="product-card-wrapper group"
            v-animateonscroll="{
              enterClass: 'animate__fadeInUp',
              delay: index * 100
            }"
          >
            <!-- ProductCard with grayscale effect -->
            <!-- :is-new="index < 2" add is new in product card latter -->
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
                  <i class="pi pi-clock text-xl text-orange-400 mb-2 animate-pulse"></i>
                  <span class="coming-soon-text" data-key="coming_soon">{{ homePageText.coming_soon }}</span>
                  <div class="sparkle-line"></div>
                </div>
              </div>
            </div>

            <!-- Coming Soon badge -->
            <div class="disabled-badge">
              <i class="pi pi-hourglass text-xs"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- Scroll Indicator -->
      <!-- <div class="scroll-indicator">
        <div
          class="scroll-progress"
          :style="{ width: scrollProgress + '%' }"
        ></div>
      </div> -->
    </div>
</section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Button from 'primevue/button'
import ProductCard from '@/components/shop/ProductCard.vue'
import homePageText from '@/assets/contents/homePage.json'


// Reactive references
const productsGrid = ref(null)
const scrollPosition = ref(0)
const maxScrollLeft = ref(0)

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

// Format products for ProductCard component
const formattedProducts = computed(() => products.value)

// Computed properties
const isAtStart = computed(() => scrollPosition.value <= 0)
const isAtEnd = computed(() => scrollPosition.value >= maxScrollLeft.value)
// not using now will use later
// const scrollProgress = computed(() =>
//   maxScrollLeft.value > 0 ? (scrollPosition.value / maxScrollLeft.value) * 100 : 0
// )

// Methods
const scrollLeft = () => {
  const container = productsGrid.value
  if (container) {
    container.scrollBy({
      left: -300,
      behavior: 'smooth'
    })
  }
}

const scrollRight = () => {
  const container = productsGrid.value
  if (container) {
    container.scrollBy({
      left: 300,
      behavior: 'smooth'
    })
  }
}

const handleScroll = () => {
  const container = productsGrid.value
  if (container) {
    scrollPosition.value = container.scrollLeft
    maxScrollLeft.value = container.scrollWidth - container.clientWidth
  }
}

// not using now will use later
// const selectProduct = (product) => {
//   // Products are disabled - coming soon
//   console.log(`Product coming soon: ${product.name}`)
// }

// Lifecycle hooks
onMounted(() => {
  if (productsGrid.value) {
    maxScrollLeft.value = productsGrid.value.scrollWidth - productsGrid.value.clientWidth
  }

  // Add resize listener to update scroll calculations
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleScroll)
})
</script>

<style scoped>
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif !important;
}
.product-gallery-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.scroll-controls {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
  padding: 0 1rem;
}

.scroll-btn {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.scroll-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.scroll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.products-section {
  position: sticky;
  top: 0;
  height: fit-content;
  padding: 2rem 0;
}

.products-grid {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 2rem;
  padding: 0 2rem;
  margin: 0 auto;
  max-width: 100%;
  transition: filter 0.8s ease;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overflow-y: visible;
}

.products-grid::-webkit-scrollbar {
  display: none;
}

/* Product Card Wrapper - Contains the overlay */
.product-card-wrapper {
  scroll-snap-align: center;
  flex: 0 0 280px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s ease;
  z-index: 1;
}

.product-card-wrapper:hover {
  transform: translateY(-8px);
}

.product-card-inner {
  width: 100%;
  height: 100%;
}

/* Coming Soon Overlay */
.coming-soon-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(0px);
  pointer-events: none;
  border-radius: 16px;
  z-index: 10;
}

.product-card-wrapper:hover .coming-soon-overlay {
  opacity: 1;
  backdrop-filter: blur(6px);
}

.coming-soon-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animated pulse rings */
.pulse-ring {
  position: absolute;
  width: 100px;
  height: 100px;
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

/* Glass card */
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
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

/* Coming Soon Text */
.coming-soon-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Sparkle line animation */
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
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Disabled badge */
.disabled-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
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
}

.product-card-wrapper:hover .disabled-badge {
  opacity: 1;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 1) 100%);
  transform: rotate(15deg) scale(1.15);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

/* Legacy product-card styles (kept for reference) */
.product-card {
  scroll-snap-align: center;
  flex: 0 0 280px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image {
  transform: scale(1.1);
}

.product-overlay {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.favorite-btn,
.cart-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.product-info {
  padding: 1.5rem;
}

.product-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.product-rating {
  margin-bottom: 0.75rem;
}

.custom-rating {
  gap: 2px;
}

.custom-rating .p-rating-icon {
  color: #ffd700;
  font-size: 0.9rem;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e67e22;
  background: linear-gradient(45deg, #e67e22, #f39c12);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.scroll-indicator {
  position: relative;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 1rem 2rem 0;
  overflow: hidden;
}

.scroll-progress {
  height: 100%;
  background: linear-gradient(90deg, #e67e22, #f39c12);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Animate.css integration */
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

/* Responsive Design */
@media (max-width: 768px) {
  .products-grid {
    gap: 1rem;
    padding: 0 1rem;
  }

  .product-card {
    flex: 0 0 240px;
  }

  .scroll-controls {
    padding: 0 0.5rem;
  }

  .scroll-indicator {
    margin: 1rem 1rem 0;
  }
}

@media (max-width: 480px) {
  .product-card {
    flex: 0 0 200px;
  }

  .product-info {
    padding: 1rem;
  }

  .product-title {
    font-size: 1.1rem;
  }

  .product-price {
    font-size: 1.25rem;
  }
}
</style>
