<template>

  <div
    ref="containerRef"
    class="relative w-full h-[100dvh] pt-20 bg-stone-100 overflow-hidden outline-none flex flex-col"
    tabindex="0"
    @keydown.stop="handleKeydown"
    @wheel.prevent.stop="handleWheel"
    @touchstart.stop="handleTouchStart"
    @touchmove.prevent.stop="handleTouchMove"
    @touchend.stop="handleTouchEnd"
  >
    <!-- Background -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0 opacity-[0.02] pattern-grid"></div>
    </div>

    <!-- Main Content Flex Wrapper: Centered content with constant gap -->
    <!-- Replaced Grid with Flex to ensure Text and Image move together during size changes -->
    <div class="relative z-10 w-full max-w-[1800px] mx-auto px-6 md:px-12 lg:px-20 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 flex-grow h-full">

      <!-- Text Block (Fixed width to prevent reflow, moves smoothly) -->
      <div class="order-2 md:order-1 w-full md:w-[480px] flex-shrink-0 flex flex-col items-start text-left">
        <Transition name="text-fade" mode="out-in">
          <span :key="`label-${currentIndex}`" class="collection-label">
            {{ currentSection.collectionLabel }}
          </span>
        </Transition>

        <Transition name="text-fade" mode="out-in">
          <h2 :key="`title-${currentIndex}`" class="section-title">
            {{ currentSection.title }}
          </h2>
        </Transition>

        <Transition name="text-fade" mode="out-in">
          <h2 :key="`subtitle-${currentIndex}`" class="section-subtitle">
            {{ currentSection.subtitle }}
          </h2>
        </Transition>

        <Transition name="text-fade" mode="out-in">
          <p :key="`desc-${currentIndex}`" class="section-description">
            {{ currentSection.description }}
          </p>
        </Transition>

        <Transition name="text-fade" mode="out-in">
          <a :key="`cta-${currentIndex}`" href="#" class="section-cta">
            <span class="cta-text">{{ currentSection.ctaText }}</span>
            <svg class="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </Transition>
      </div>

      <!-- Image Block (Moves smoothly towards center) -->
      <div class="order-1 md:order-2 flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform">
        <!-- Wrapper morphs aspect ratio via CSS transition -->
        <div
          class="image-wrapper sticker-card"
          :class="getAspectRatioClass(currentSection.orientation)"
        >
          <!-- TRUE CROSSFADE: Both images exist, positioned absolutely -->
          <TransitionGroup name="image-crossfade" tag="div" class="image-stack">
            <img
              v-for="(section, index) in sections"
              v-show="index === currentIndex"
              :key="`img-${index}`"
              :src="section.imageUrl"
              :alt="section.title"
              class="image-actual"
            />
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- Section Indicator Dots -->
    <div class="indicator-dots">
      <button
        v-for="(section, index) in sections"
        :key="`dot-${index}`"
        :class="['dot', { 'dot-active': currentIndex === index }]"
        :aria-label="`Go to section ${index + 1}`"
        @click="goToSection(index)"
      />
    </div>

    <!-- Navigation Hint -->
    <Transition name="fade">
      <div v-if="currentIndex === 0 && showHint" class="nav-hint">
        Use ↑ ↓ to navigate
      </div>
    </Transition>
  </div>
</template>

<script setup>
/**
 * MainSection.vue - Smooth Simultaneous Transitions
 *
 * - Text: Immediate crossfade via Vue Transition
 * - Image: True crossfade with TransitionGroup (both images overlap during transition)
 * - Wrapper: CSS transition morphs aspect ratio simultaneously
 */

import { ref, computed, onMounted, onUnmounted, defineProps } from 'vue'

const props=defineProps({
  simulateKey: Function,
  innerCustomScollEl: HTMLElement
})

// ============================================
// SECTION DATA
// ============================================
const sections = ref([
  {
    collectionLabel: 'Collection 01',
    title: 'Light &',
    subtitle: 'Structure',
    description: 'Spacefurnio and Lumina are collaborating to redefine how light interacts with solid oak surfaces. A study in contrast and clarity.',
    ctaText: 'Explore Chapter',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    orientation: 'landscape'
  },
  {
    collectionLabel: 'Collection 02',
    title: 'Earth &',
    subtitle: 'Form',
    description: 'Spacefurnio and TERRA are collaborating on a limited series of ceramic-inlaid coffee tables. Hand-thrown pottery meets precision joinery.',
    ctaText: 'Explore Chapter',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    orientation: 'portrait'
  },
  {
    collectionLabel: 'Collection 03',
    title: 'Soft',
    subtitle: 'Resilience',
    description: 'Spacefurnio and Velvet & Co are collaborating to bring tactile warmth to industrial steel frames. Comfort redefined.',
    ctaText: 'Know More',
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
    orientation: 'square'
  },
  {
    collectionLabel: 'Collection 04',
    title: 'Nordic',
    subtitle: 'Essence',
    description: 'A collection inspired by Scandinavian minimalism. Clean lines, natural materials, and timeless design philosophy.',
    ctaText: 'Discover',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    orientation: 'landscape'
  }
])

// ============================================
// STATE
// ============================================
const containerRef = ref(null)
const currentIndex = ref(0)
const isTransitioning = ref(false)
const showHint = ref(true)

const currentSection = computed(() => sections.value[currentIndex.value])

// ============================================
// NAVIGATION
// ============================================
function handleKeydown(event) {
  if (['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown'].includes(event.code)) {
    event.preventDefault()
  }

  if (isTransitioning.value) return

  if (event.code === 'ArrowDown' || event.code === 'PageDown') {
    navigateNext()
  } else if (event.code === 'ArrowUp' || event.code === 'PageUp') {
    navigatePrev()
  }
}

function navigateNext() {
  if (currentIndex.value < sections.value.length - 1) {
    triggerTransition(currentIndex.value + 1)
  } else {
    scroll100(1);
    containerRef.value.style.pointerEvents = 'none';
  }
}

function navigatePrev() {
  if (currentIndex.value > 0) {
    triggerTransition(currentIndex.value - 1)
  } else {
    scroll100(-1);
    containerRef.value.style.pointerEvents = 'none';
  }
}

function goToSection(index) {
  if (index === currentIndex.value || isTransitioning.value) return
  triggerTransition(index)
}

function triggerTransition(newIndex) {
  isTransitioning.value = true
  showHint.value = false
  currentIndex.value = newIndex

  // Reset after transition completes
  setTimeout(() => {
    isTransitioning.value = false
  }, 700)
}

// ============================================
// HELPERS
// ============================================
function getAspectRatioClass(orientation) {
  switch (orientation) {
    case 'portrait': return 'aspect-portrait'
    case 'square': return 'aspect-square-custom'
    default: return 'aspect-landscape'
  }
}

function scroll100(up) {
  /** up is -1 or +1 whih desides to go up or down */
  if (up > 0) {
    props.simulateKey('ArrowDown');
  } else {
    props.simulateKey('ArrowUp');
  }
}

// ============================================
// SCROLL HANDLING (Container-level only)
// ============================================
// const isInsideContainer = ref(false)

function handleWheel(event) {
  // Prevent default scroll and use for navigation
  event.preventDefault()

  if (isTransitioning.value) return

  if (event.deltaY > 0) {
    navigateNext()
  } else if (event.deltaY < 0) {
    navigatePrev()
  }
}

function handleTouchStart(event) {
  // Store initial touch position for swipe detection
  containerRef.value._touchStartY = event.touches[0].clientY
}

function handleTouchMove(event) {
  event.preventDefault()
}

function handleTouchEnd(event) {
  if (isTransitioning.value) return

  const touchEndY = event.changedTouches[0].clientY
  const touchStartY = containerRef.value._touchStartY || touchEndY
  const diff = touchStartY - touchEndY

  // Swipe threshold of 50px
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      navigateNext()
    } else {
      navigatePrev()
    }
  }
}

// enabling auto focus for custom scroll to work properly
// using custom scroll event to handle scroll
function handlecustomScroll(e) {
  console.warn("called",e.detail.currentSection , props.innerCustomScollEl,e.detail.currentSection === props.innerCustomScollEl)
  if (e.detail.currentSection === props.innerCustomScollEl) {
    containerRef.value.style.pointerEvents = 'auto';
    containerRef.value?.focus({ preventScroll: true });
    containerRef.value?.children[0].click() //aditinal ensurance for click verification
  }
}


// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  window.addEventListener('sectionChange', handlecustomScroll);
})

onUnmounted(() => {
  // Cleanup if needed
  window.removeEventListener('sectionChange', handlecustomScroll);

})
</script>

<style scoped>
/* ============================================
   BACKGROUND PATTERN
   ============================================ */
.pattern-grid {
  background-image:
    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ============================================
   TEXT TYPOGRAPHY & CTA
   ============================================ */
.collection-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #a1a1aa;
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-family: 'Playfair Display', 'Georgia', serif;
  font-weight: 400;
  color: #27272a;
  line-height: 1.1;
  margin: 0;
}

.section-subtitle {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-family: 'Playfair Display', 'Georgia', serif;
  font-weight: 300;
  font-style: italic;
  color: #71717a;
  line-height: 1.1;
  margin: 0 0 1.5rem 0;
}

.section-description {
  font-size: 0.9rem;
  line-height: 1.75;
  color: #71717a;
  font-weight: 300;
  max-width: 380px; /* Slightly wider for layout balance */
  margin-bottom: 2rem;
}

.section-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #27272a;
}

.cta-text {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-bottom: 1px solid #27272a;
  padding-bottom: 2px;
  transition: border-color 0.3s ease;
}

.section-cta:hover .cta-text {
  border-color: transparent;
}

.cta-arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 0.3s ease;
}

.section-cta:hover .cta-arrow {
  transform: translateX(6px);
}

/* ============================================
   TEXT TRANSITIONS (PRESERVED)
   ============================================ */
.text-fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.text-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.text-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.text-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ============================================
   IMAGE CONTENT & STICKER
   ============================================ */
.image-wrapper {
  position: relative;
  background-color: #fafaf9;
  overflow: hidden;
  border-radius: 2px;
  /* Smooth simultaneous morph preserved */
  transition:
    width 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    aspect-ratio 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Sticker / Pasted visual treatment - soft, diffuse outer shadow */
.sticker-card {
  box-shadow:
    0 30px 60px -12px rgba(0, 0, 0, 0.12),
    0 18px 36px -18px rgba(0, 0, 0, 0.08); /* Softened interaction */
}

/* Significantly larger image sizes for dominant visual with EXPLICIT widths for Flexbox stability */
/* We use width-based sizing for all to ensure smooth transitions (avoiding height: auto) */

.aspect-landscape {
  width: 55vw;          /* Wide relative to screen */
  max-width: 1100px;    /* Cap max size */
  aspect-ratio: 4 / 3;
}

.aspect-portrait {
  /* Height target ~75vh.  Width = 75vh * (3/4) = 56.25vh */
  width: 56.25vh;
  max-width: 650px;
  aspect-ratio: 3 / 4;
}

.aspect-square-custom {
  /* Height target ~70vh. Width = 70vh */
  width: 70vh;
  max-width: 800px;
  aspect-ratio: 1 / 1;
}

/* Image stack for true crossfade */
.image-stack {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-actual {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ============================================
   IMAGE CROSSFADE TRANSITION (PRESERVED)
   ============================================ */
.image-crossfade-enter-active {
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.image-crossfade-leave-active {
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.image-crossfade-enter-from {
  opacity: 0;
}

.image-crossfade-leave-to {
  opacity: 0;
}

/* ============================================
   INDICATOR DOTS
   ============================================ */
.indicator-dots {
  position: absolute;
  bottom: 0.8rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  gap: 0.75rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d1d5db;
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dot:hover {
  background-color: #9ca3af;
  transform: scale(1.15);
}

.dot-active {
  background-color: #27272a;
  transform: scale(1.4);
}

/* ============================================
   NAVIGATION HINT
   ============================================ */
.nav-hint {
  position: absolute;
  bottom: 4.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  font-size: 0.65rem;
  color: #9ca3af;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================
   RESPONSIVE TUNING
   ============================================ */
@media (max-width: 1024px) {
  /* Tablet: reduced scale but still width-driven */
  .aspect-landscape { width: 65vw; max-width: 800px; }
  .aspect-portrait { width: 50vh; max-width: 500px; }
  .aspect-square-custom { width: 50vh; max-width: 500px; }
}

@media (max-width: 768px) {
  /* Mobile: Fill width mostly */
  .aspect-landscape,
  .aspect-portrait,
  .aspect-square-custom {
    width: 85vw;
    max-width: 450px;
    height: auto;
    /* Max-height caps can be removed or kept loose */
    max-height: 60vh;
  }

  .section-title {
    font-size: clamp(1.75rem, 6vw, 2.5rem);
  }

  .section-subtitle {
    font-size: clamp(1.75rem, 6vw, 2.5rem);
    margin-bottom: 1rem;
  }
}
</style>
