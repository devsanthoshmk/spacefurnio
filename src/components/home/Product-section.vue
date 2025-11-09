<template>
<section class="scroll-section h-screen">
      <h2 class="phitagate-font bold italicfont-phitagate text-[5rem] font-normal not-italic text-center
            text-black [text-fill-color:white] [-webkit-text-stroke:2px_black]">You'll find us</h2>
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
            v-for="(product, index) in products"
            :key="product.id"
            class="product-card"
            @click="selectProduct(product)"
            v-animateonscroll="{
              enterClass: 'animate__fadeInUp',
              delay: index * 100
            }"
          >
            <div class="product-image-container">
              <img
                :src="product.image"
                :alt="product.title"
                class="product-image"
              />
              <div class="product-overlay">
                <Button
                  icon="pi pi-heart"
                  class="favorite-btn"
                  severity="secondary"
                  outlined
                  rounded
                />
                <Button
                  icon="pi pi-shopping-cart"
                  class="cart-btn !text-black hover:!text-white"
                  severity="success"
                  rounded
                />
              </div>
            </div>

            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <div class="product-rating">
                <Rating
                  v-model="product.rating"
                  readonly
                  :stars="5"
                  class="custom-rating"
                />
              </div>
              <div class="product-price">${{ product.price }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Scroll Indicator -->
      <div class="scroll-indicator">
        <div
          class="scroll-progress"
          :style="{ width: scrollProgress + '%' }"
        ></div>
      </div>
    </div>
</section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Button from 'primevue/button'
import Rating from 'primevue/rating'


// Reactive references
const productsGrid = ref(null)
const scrollPosition = ref(0)
const maxScrollLeft = ref(0)

// Products data
const products = ref([
  {
    id: 1,
    title: 'Luxurious Modern Sofa',
    price: 899,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Minimalist Dining Chair',
    price: 249,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'Scandinavian Coffee Table',
    price: 449,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1549497538-303791108f95?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 4,
    title: 'Designer Floor Lamp',
    price: 199,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 5,
    title: 'Modern Bookshelf',
    price: 329,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 6,
    title: 'Elegant Side Table',
    price: 179,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1549497538-303791108f95?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 7,
    title: 'Luxury Accent Chair',
    price: 599,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 8,
    title: 'Contemporary Ottoman',
    price: 149,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1000&auto=format&fit=crop'
  }
])

// Computed properties
const isAtStart = computed(() => scrollPosition.value <= 0)
const isAtEnd = computed(() => scrollPosition.value >= maxScrollLeft.value)
const scrollProgress = computed(() =>
  maxScrollLeft.value > 0 ? (scrollPosition.value / maxScrollLeft.value) * 100 : 0
)

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

const selectProduct = (product) => {
  console.log(`Selected product: ${product.title}`)
  window.location.href = `/shop`
  // Add your product selection logic here
}

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
}

.products-grid::-webkit-scrollbar {
  display: none;
}

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
