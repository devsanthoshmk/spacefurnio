<template>
  <div
    class="product-card group relative flex flex-col bg-white rounded-2xl p-3 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-stone-200/80 hover:border-stone-300 cursor-pointer select-none"
    @click="handleCardClick"
  >
    <!-- Product Image & Carousel Area -->
    <div
      class="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-stone-100"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <!-- Swipe Tutorial Overlay (if enabled) -->
      <div
        v-if="showSwipeHint"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl pointer-events-none transition-opacity duration-500"
      >
        <div class="bg-white/20 p-3 rounded-full mb-2 animate-pulse">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7h8M8 17h8M5 12h14"
            />
          </svg>
        </div>
        <p class="text-white font-medium text-xs drop-shadow-md">Swipe to view photos</p>
      </div>

      <!-- Image Slider / Fallback Image -->
      <div
        class="absolute inset-0 w-full h-full flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
      >
        <div
          v-for="(img, idx) in productImages"
          :key="idx"
          class="w-full h-full flex-shrink-0 relative overflow-hidden bg-stone-100"
        >
          <img
            :src="img"
            :alt="`${product.name || 'Product'} image ${idx + 1}`"
            class="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
            @error="handleImageError"
          />
        </div>
      </div>

      <!-- Subtle Gradient Overlay on Hover -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      ></div>

      <!-- Top-Right Quick Action Buttons -->
      <div class="absolute top-2.5 right-2.5 flex flex-col gap-2 z-10">
        <!-- Wishlist Button -->
        <button
          @click.stop="handleToggleWishlist"
          class="p-2 rounded-full bg-white/90 backdrop-blur-md text-stone-700 shadow-md hover:bg-white hover:scale-110 active:scale-90 transition-all duration-200 focus:outline-none"
          :class="{ 'text-rose-500 hover:text-rose-600': isWishlisted }"
          :title="isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'"
          aria-label="Toggle wishlist"
        >
          <svg
            class="w-4 h-4 transition-transform duration-300"
            :class="{ 'scale-110 fill-rose-500 text-rose-500 heart-beat': isWishlisted }"
            :fill="isWishlisted ? 'currentColor' : 'none'"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        <!-- Quick Add to Cart Button -->
        <button
          @click.stop="handleAddToCart"
          :disabled="isAddingToCart || product.inStock === false"
          class="p-2 rounded-full bg-white/90 backdrop-blur-md text-stone-700 shadow-md hover:bg-stone-900 hover:text-white hover:scale-110 active:scale-90 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          :title="product.inStock === false ? 'Out of Stock' : isAddedToCart ? 'Added to Cart!' : 'Quick Add to Cart'"
          aria-label="Add to cart"
        >
          <!-- Loading Spinner -->
          <svg
            v-if="isAddingToCart"
            class="w-4 h-4 animate-spin text-stone-900"
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
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation Arrows for multiple images -->
      <div
        v-if="productImages.length > 1"
        class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-10"
      >
        <button
          @click.stop="prevImage"
          class="pointer-events-auto p-1.5 rounded-full bg-white/85 backdrop-blur-sm text-stone-800 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 active:scale-95 transition-all focus:outline-none"
          aria-label="Previous image"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click.stop="nextImage"
          class="pointer-events-auto p-1.5 rounded-full bg-white/85 backdrop-blur-sm text-stone-800 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 active:scale-95 transition-all focus:outline-none"
          aria-label="Next image"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Image Dots Indicator -->
      <div
        v-if="productImages.length > 1"
        class="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10"
      >
        <div class="flex gap-1 bg-black/25 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <button
            v-for="(_, idx) in productImages.slice(0, 5)"
            :key="idx"
            @click.stop="setImage(idx)"
            class="pointer-events-auto h-1.5 rounded-full transition-all duration-300"
            :class="currentImageIndex === idx ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'"
            :aria-label="`Slide to image ${idx + 1}`"
          ></button>
        </div>
      </div>

      <!-- Product Badges (Top Left) -->
      <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-10">
        <span
          v-if="product.isNew || isNew"
          class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-stone-900 shadow-md rounded-full"
        >
          New
        </span>
        <span
          v-if="product.discount"
          class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-rose-600 shadow-md rounded-full"
        >
          -{{ product.discount }}%
        </span>
        <span
          v-if="product.isBestSeller"
          class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-900 bg-white/95 shadow-md rounded-full"
        >
          Bestseller
        </span>
      </div>

      <!-- Out of stock badge -->
      <div
        v-if="product.inStock === false"
        class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10"
      >
        <span class="px-3 py-1 bg-white text-stone-900 font-semibold text-xs tracking-wider uppercase rounded-full shadow">
          Out of Stock
        </span>
      </div>
    </div>

    <!-- Product Info Section -->
    <div class="mt-3 flex flex-col flex-1 px-1">
      <!-- Brand & Rating Row -->
      <div class="flex justify-between items-center mb-1">
        <p class="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
          {{ product.brand || product.brandName || 'SpaceFurnio' }}
        </p>
        <div
          v-if="product.rating"
          class="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md text-amber-700 text-[11px] font-semibold"
        >
          <svg class="h-3 w-3 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <span>{{ Number(product.rating).toFixed(1) }}</span>
          <span v-if="product.reviews || product.review_count" class="text-stone-400 font-normal">
            ({{ product.reviews || product.review_count }})
          </span>
        </div>
      </div>

      <!-- Title -->
      <h3
        class="text-sm font-semibold text-stone-800 line-clamp-1 group-hover:text-stone-900 transition-colors"
        :title="product.name"
      >
        {{ product.name }}
      </h3>

      <!-- Price & Color Dots Footer -->
      <div class="mt-auto pt-2.5 flex items-baseline justify-between">
        <div class="flex items-baseline gap-1.5">
          <p class="text-base font-bold text-stone-900">
            ${{ formattedPrice }}
          </p>
          <p
            v-if="product.originalPrice"
            class="text-xs text-stone-400 line-through"
          >
            ${{ formatNumber(product.originalPrice) }}
          </p>
        </div>

        <!-- Color Preview Dots -->
        <div
          v-if="colorItems.length > 0"
          class="flex -space-x-1 overflow-hidden pl-2"
        >
          <div
            v-for="(color, cIdx) in colorItems.slice(0, 3)"
            :key="cIdx"
            class="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-white shadow-xs"
            :style="{ backgroundColor: color.hex || getColorHexHelper(color.name || color) }"
            :title="color.name || color"
          ></div>
          <div
            v-if="colorItems.length > 3"
            class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-stone-100 ring-1 ring-white text-[8px] font-bold text-stone-500"
          >
            +{{ colorItems.length - 3 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '@/stores/wishlist'
import { useCartStore } from '@/stores/cart'
import { getColorHexHelper } from '@/composables/productsUtills.js'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  category: {
    type: String,
    default: '',
  },
  showSwipeHint: {
    type: Boolean,
    default: false,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-wishlist', 'add-to-cart', 'click'])

const router = useRouter()
const wishlistStore = useWishlistStore()
const cartStore = useCartStore()

const currentImageIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)
const isAddingToCart = ref(false)
const isAddedToCart = ref(false)

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80'

// Wishlist state directly connected to store
const isWishlisted = computed(() => {
  return wishlistStore.isInWishlist(props.product.id)
})

// Images Array computation
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

// Formatted price computation ($899.00)
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

// Image Carousel Methods
const nextImage = () => {
  if (productImages.value.length <= 1) return
  currentImageIndex.value = (currentImageIndex.value + 1) % productImages.value.length
}

const prevImage = () => {
  if (productImages.value.length <= 1) return
  currentImageIndex.value =
    (currentImageIndex.value - 1 + productImages.value.length) % productImages.value.length
}

const setImage = (index) => {
  currentImageIndex.value = index
}

const handleImageError = (e) => {
  e.target.src = FALLBACK_IMAGE
}

// Touch / Swipe
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX
  const threshold = 40
  if (touchEndX.value < touchStartX.value - threshold) {
    nextImage()
  } else if (touchEndX.value > touchStartX.value + threshold) {
    prevImage()
  }
}

// Navigation & Actions
const handleCardClick = () => {
  emit('click', props.product)
  const idOrSlug = props.product.slug || props.product.id
  router.push(`/shop/product/${idOrSlug}`)
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
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.25);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1.1);
  }
}

.heart-beat {
  animation: heartbeat 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
