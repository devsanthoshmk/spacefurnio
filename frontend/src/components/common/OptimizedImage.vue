<template>
  <div class="optimized-image-wrapper" :class="{ 'is-loaded': isLoaded, 'has-error': hasError }">
    <img
      :src="optimizedSrc"
      :srcset="computedSrcSet"
      :sizes="sizes"
      :alt="alt || 'Image'"
      :loading="lazy ? 'lazy' : 'eager'"
      :decoding="decoding"
      :fetchpriority="fetchpriority"
      :class="['optimized-img', imgClass]"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { optimizeImageUrl, getImageSrcSet } from '@/utils/imageOptimizer.js'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  width: {
    type: [Number, String],
    default: null,
  },
  height: {
    type: [Number, String],
    default: null,
  },
  quality: {
    type: Number,
    default: 82,
  },
  fit: {
    type: String,
    default: 'crop',
  },
  lazy: {
    type: Boolean,
    default: true,
  },
  decoding: {
    type: String,
    default: 'async',
  },
  fetchpriority: {
    type: String,
    default: 'auto',
  },
  sizes: {
    type: String,
    default: null,
  },
  responsive: {
    type: Boolean,
    default: false,
  },
  imgClass: {
    type: String,
    default: '',
  },
  fallbackSrc: {
    type: String,
    default: '/images/placeholder.png',
  },
})

const emit = defineEmits(['load', 'error'])

const isLoaded = ref(false)
const hasError = ref(false)

const targetWidth = computed(() => (props.width ? Number(props.width) : null))
const targetHeight = computed(() => (props.height ? Number(props.height) : null))

const optimizedSrc = computed(() => {
  if (hasError.value) return props.fallbackSrc
  return optimizeImageUrl(props.src, {
    width: targetWidth.value,
    height: targetHeight.value,
    quality: props.quality,
    fit: props.fit,
  })
})

const computedSrcSet = computed(() => {
  if (!props.responsive || hasError.value) return undefined
  return getImageSrcSet(props.src, [320, 640, 960, 1200, 1600], {
    quality: props.quality,
    fit: props.fit,
  })
})

function handleLoad(event) {
  isLoaded.value = true
  emit('load', event)
}

function handleError(event) {
  if (!hasError.value) {
    hasError.value = true
    emit('error', event)
  }
}
</script>

<style scoped>
.optimized-image-wrapper {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.optimized-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease-in-out;
}
</style>
