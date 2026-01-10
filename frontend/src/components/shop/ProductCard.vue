<template>
  <div
    class="group relative flex flex-col bg-white rounded-2xl p-3 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100"
  >
    <!-- Product Image Carousel -->
    <div
      class="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100"
      @touchstart="handleTouchStart($event)"
      @touchend="handleTouchEnd($event)"
    >
      <!-- Swipe Tutorial Overlay -->
      <div
        v-if="showSwipeHint"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl pointer-events-none transition-opacity duration-500"
      >
         <div class="bg-white/20 p-3 rounded-full mb-2 animate-pulse">
           <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 17h8M5 12h14" />
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
           </svg>
         </div>
         <p class="text-white font-medium text-sm drop-shadow-md">Swipe to view photos</p>
      </div>

      <!-- Image Slider -->
      <div
        class="absolute inset-0 w-full h-full flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
      >
        <div
          v-for="(img, idx) in product.images"
          :key="idx"
          class="w-full h-full flex-shrink-0"
        >
          <img
            :src="img"
            :alt="product.name"
            class="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        </div>
      </div>

      <!-- Overlay Gradient -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <!-- Quick Actions (Top Right) -->
      <div class="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <button
          @click.prevent="$emit('toggle-wishlist', product)"
          class="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm hover:bg-white hover:text-red-500 transition-colors"
          title="Add to Wishlist"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
        <button
          @click.prevent="$emit('add-to-cart', product)"
          class="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm hover:bg-white hover:text-brand transition-colors"
          title="Quick Add"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </button>
      </div>

      <!-- Navigation Arrows (Always Visible) -->
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-10">
        <button
          v-if="product.images.length > 1"
          @click.prevent="prevImage"
          class="pointer-events-auto p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 shadow-sm hover:bg-white hover:scale-110 transition-all focus:outline-none"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          v-if="product.images.length > 1"
          @click.prevent="nextImage"
          class="pointer-events-auto p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 shadow-sm hover:bg-white hover:scale-110 transition-all focus:outline-none"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <!-- Improved Dots Indicator -->
      <div v-if="product.images.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
        <div class="flex gap-1.5 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
          <button
            v-for="(_, idx) in product.images"
            :key="idx"
            @click.prevent="setImage(idx)"
            class="pointer-events-auto h-1.5 rounded-full transition-all duration-300 shadow-sm"
            :class="currentImageIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'"
          ></button>
        </div>
      </div>

      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
        <span v-if="isNew" class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-brand shadow-lg rounded-full">New</span>
        <span v-if="product.discount" class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-rose-500 shadow-lg rounded-full">-{{ product.discount }}%</span>
      </div>
    </div>

    <!-- Product Info -->
    <div class="mt-4 flex flex-col flex-1 px-1">
      <div class="flex justify-between items-start mb-1">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">{{ product.brand }}</p>
        <div v-if="product.rating" class="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md">
          <svg class="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span class="text-xs font-semibold text-gray-700">{{ product.rating }}</span>
        </div>
      </div>

      <h3 class="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-brand transition-colors">
        <a :href="productUrl">
          <span aria-hidden="true" class="absolute inset-0"></span>
          {{ product.name }}
        </a>
      </h3>

      <div class="mt-auto pt-3 flex items-end justify-between">
        <div class="flex flex-col">
          <p class="text-lg font-bold text-gray-900">${{ product.price }}</p>
          <p v-if="product.originalPrice" class="text-xs text-gray-400 line-through">${{ product.originalPrice }}</p>
        </div>

        <!-- Color Preview Dots -->
        <div v-if="product.colors && product.colors.length" class="flex -space-x-1.5 overflow-hidden pl-2 pb-1">
           <div
             v-for="color in product.colors.slice(0, 3)"
             :key="color"
             class="inline-block h-5 w-5 rounded-full ring-2 ring-white shadow-sm"
             :style="{ backgroundColor: getColorHexHelper(color) }"
             :title="color"
           ></div>
           <div v-if="product.colors.length > 3" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white text-[9px] font-bold text-gray-500">
             +{{ product.colors.length - 3 }}
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ProductCard.vue
 *
 * A reusable product card component for displaying individual products
 * in the product listing grid.
 *
 * Features:
 * - Image Carousel with Swipe Support
 * - Quick Actions (Wishlist, Add to Cart)
 * - Product Badges (New, Discount)
 * - Responsive Design
 */

import { ref, computed } from 'vue'
import { getColorHexHelper } from '@/composables/productsUtills.js'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  category: {
    type: String,
    default: ''
  },
  showSwipeHint: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-wishlist', 'add-to-cart'])

// Image Carousel State
const currentImageIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

// Computed
const productUrl = computed(() => `./${props.category}/${props.product.id}`)

// Image Carousel Methods
const nextImage = () => {
  if (!props.product.images || props.product.images.length <= 1) return
  currentImageIndex.value = (currentImageIndex.value + 1) % props.product.images.length
}

const prevImage = () => {
  if (!props.product.images || props.product.images.length <= 1) return
  currentImageIndex.value = (currentImageIndex.value - 1 + props.product.images.length) % props.product.images.length
}

const setImage = (index) => {
  currentImageIndex.value = index
}

// Swipe Handlers
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX
  handleSwipe()
}

const handleSwipe = () => {
  const threshold = 50 // min distance to be considered a swipe
  if (touchEndX.value < touchStartX.value - threshold) {
    nextImage() // Swipe Left -> Next
  }
  if (touchEndX.value > touchStartX.value + threshold) {
    prevImage() // Swipe Right -> Prev
  }
}
</script>
