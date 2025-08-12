<template>
  <section ref="productsSection" class="products-section">
    <!-- Updated with new font classes -->
    <div id="text-1" class="floating-text text-golden phitigate-font" :class="textClasses">Where lines meet light</div>
    <div id="text-2" class="floating-text text-golden phitigate-font" :class="textClasses">And functions meet soul</div>
    <div id="text-3" class="floating-text text-golden phitigate-font" :class="textClasses" :style="{ opacity: isHidden ? 0 : 1 }">You'll find us</div>

    <div ref="productsGrid" id="products-grid" class="products-grid">
      <div class="bg-layer current" id="bg-layer-1"></div>
      <div class="bg-layer next" id="bg-layer-2"></div>
      <div class="fade-overlay" id="fade-overlay"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import ScrollAnimationController from '@/utils/ScrollAnimationController.js'

// Reactive references
const productsSection = ref(null)
const productsGrid = ref(null)
const isHidden = ref(false)

// Controller instance
let controller = null

// Computed classes for better performance
const textClasses = computed(() => ({
  'entering': true
}))

// Optimized visibility checker with throttling
let visibilityCheckTimeout = null
const checkVisibility = () => {
  if (visibilityCheckTimeout) return

  visibilityCheckTimeout = setTimeout(() => {
    if (productsGrid.value) {
      const rect = productsGrid.value.getBoundingClientRect()
      isHidden.value = rect.top < -150
    }
    visibilityCheckTimeout = null
  }, 16) // ~60fps throttling
}

// Error handler for scroll controller
const handleControllerError = (error) => {
  console.error('ScrollAnimationController error:', error)
  // Fallback behavior or user notification
}

// Initialize scroll controller
const initializeController = async () => {
  try {
    await nextTick() // Ensure DOM is ready

    if (productsSection.value) {
      controller = new ScrollAnimationController(productsSection.value)
      console.log('ScrollAnimationController initialized successfully')
    }
  } catch (error) {
    handleControllerError(error)
  }
}

// Cleanup function
const cleanup = () => {
  // Clear timeouts
  if (visibilityCheckTimeout) {
    clearTimeout(visibilityCheckTimeout)
    visibilityCheckTimeout = null
  }

  // Destroy controller
  if (controller) {
    try {
      controller.destroy()
    } catch (error) {
      console.error('Error destroying controller:', error)
    }
    controller = null
  }

  // Remove event listeners
  window.removeEventListener('scroll', checkVisibility, { passive: true })
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Add scroll listener for visibility checking
    window.addEventListener('scroll', checkVisibility, { passive: true })

    // Initial visibility check
    checkVisibility()

    // Initialize the scroll animation controller
    await initializeController()
  } catch (error) {
    handleControllerError(error)
  }
})

onUnmounted(() => {
  cleanup()
})

// Expose cleanup for potential manual cleanup
defineExpose({
  cleanup,
  reinitialize: initializeController
})
</script>

<style scoped>
.products-section {
  position: relative;
  min-height: 600vh;
  background: linear-gradient(135deg, #fffdf6 0%, #f8f6f0 100%);
  isolation: isolate;
}

.products-grid {
  position: sticky;
  top: 0;
  height: 100vh;
  margin: 0 auto;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  border-radius: 0.75rem;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
}

/* Dual layer system */
.bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: opacity, filter, transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
}

.bg-layer.current {
  opacity: 1;
  filter: blur(0px);
  transform: translate3d(0, 0, 0) scale(1);
}

.bg-layer.blurred {
  filter: blur(15px) brightness(0.7);
  transform: translate3d(0, 0, 0) scale(1.05);
}

.bg-layer.next {
  opacity: 0;
  filter: blur(0px);
  transform: translate3d(0, 0, 0) scale(1.1);
}

.bg-layer.transitioning-in {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0px);
}

/* GOLDEN TEXT STYLES */
.text-golden {
  /* Elegant gold gradient */
  background: linear-gradient(
    135deg,
    #f9f295 0%,
    #e0aa3e 25%,
    #f9f295 50%,
    #b88a44 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: textShine 8s ease infinite;
}

@keyframes textShine {
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}

.floating-text {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
  z-index: 100;
  /* Updated to elegant serif font */
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: clamp(2.5rem, 8vw, 6rem);
  font-weight: 600;
  text-align: center;
  opacity: 0;
  transition: all 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  letter-spacing: -0.02em;
  line-height: 1.1;
  will-change: opacity, transform, filter;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);

  /* Subtle text shadow for depth */
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.floating-text.appear {
  opacity: 1;
  transform: translate3d(-50%, -50%, 0) translateY(0) scale(1);
  filter: blur(0px);
}

.floating-text.entering {
  opacity: 0;
  transform: translate3d(-50%, -50%, 0) translateY(60px) scale(0.8);
  filter: blur(3px);
}

.floating-text.leaving {
  opacity: 0;
  transform: translate3d(-50%, -50%, 0) translateY(-60px) scale(1.1);
  filter: blur(5px);
}

/* Elegant fade overlay */
.fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(44, 62, 80, 0.1) 0%, rgba(230, 126, 34, 0.1) 100%);
  opacity: 0;
  transition: opacity 1.2s ease;
  z-index: 5;
  will-change: opacity;
}

.fade-overlay.active {
  opacity: 1;
}

/* Breathing animation */
@keyframes breathe {
  0%, 100% { transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { transform: translate3d(-50%, -50%, 0) scale(1.02); }
}

.floating-text.breathing {
  animation: breathe 4s ease-in-out infinite;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .floating-text,
  .bg-layer,
  .fade-overlay {
    transition: none;
    animation: none;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .floating-text {
    font-size: clamp(2rem, 10vw, 4rem);
    padding: 0 1rem;
  }

  .products-section {
    min-height: 400vh;
  }
}

/* High DPI display optimizations */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .products-grid {
    background-image: image-set(
      url('image.jpg') 1x,
      url('image@2x.jpg') 2x
    );
  }
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  .products-section {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  }
}

/* Focus management for accessibility */
.products-section:focus-within .floating-text {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 4px;
}

/* Print styles */
@media print {
  .products-section {
    min-height: auto;
    page-break-inside: avoid;
  }

  .floating-text {
    position: static;
    transform: none;
    color: #000;
    text-shadow: none;
  }

  .products-grid {
    position: static;
    height: auto;
  }
}</style>
