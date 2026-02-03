<template>
  <section
    class="hero-section relative w-full h-[100dvh] overflow-hidden"
    aria-label="Portfolio Hero Section"
  >
    <!-- Background Image with Parallax Animation -->
    <div class="hero-background absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2670&auto=format&fit=crop"
        srcset="
          https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop 800w,
          https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1600&auto=format&fit=crop 1600w,
          https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2670&auto=format&fit=crop 2670w
        "
        sizes="100vw"
        alt="Cinematic modern sofa in elegant interior"
        loading="lazy"
        class="w-full h-full object-cover"
        :class="{ 'hero-background-animate': !prefersReducedMotion  }"
      />
      <!-- Cinematic Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
    </div>

    <!-- Content Container -->
    <div class="hero-content relative z-10 h-full flex items-center">
      <div class="container mx-auto px-6 md:px-12 lg:px-16">
        <div class="w-full mx-auto md:mx-0 text-center md:text-left">
          <!-- Main Heading with Typing Animation -->
          <h1
            class="hero-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif mb-6 text-white"
            :class="{ 'opacity-0': !headingVisible && !prefersReducedMotion }"
          >
            <span
              v-for="(lineGroup, groupIndex) in headingWords"
              :key="`group-${groupIndex}`"
              :class="'block'"
            >
              <span
                v-for="(word, wordIndex) in lineGroup.words"
                :key="`word-${groupIndex}-${wordIndex}`"
                class="inline-block whitespace-nowrap"
                style="margin-right: 0.3em"
              >
                <span
                  v-for="(char, charIndex) in word.chars"
                  :key="`char-${groupIndex}-${wordIndex}-${charIndex}`"
                  :class="[
                    'inline-block',
                    prefersReducedMotion ? 'opacity-100' : 'char-animate'
                  ]"
                  :style="prefersReducedMotion ? {} : { animationDelay: `${word.startIndex + charIndex * typeSpeed}ms` }"
                >
                  {{ char }}
                </span>
              </span>
            </span>
          </h1>

          <!-- Subheading with Fade In -->
          <p
            class="hero-subheading text-xl sm:text-2xl md:text-3xl font-sans text-gray-200 tracking-wide"
            :class="{
              'opacity-0': !subheadingVisible && !prefersReducedMotion,
              'subheading-fade-in': subheadingVisible && !prefersReducedMotion
            }"
          >
            {{ subheading }}
          </p>

          <!-- Optional Scroll Indicator (only shown when motion is reduced) -->
          <div
            v-if="prefersReducedMotion"
            class="mt-12 flex justify-center md:justify-start"
          >
            <div class="scroll-indicator text-white/60 text-sm uppercase tracking-widest">
              Scroll to explore
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ========================================
// Configuration Constants (No Props)
// ========================================
const headingLine1 = 'Welcome to SpaceFurnio'
const headingLine2 = 'Portfolio'
const subheading = 'Designing space through form and comfort'
const autoScroll = true
const autoScrollDelay = 1500 // ms after typing completes
const typeSpeed = 40 // ms per character
// const useGsap = false // Optional GSAP integration (not implemented)

// ========================================
// Reactive State
// ========================================
const headingVisible = ref(false)
const subheadingVisible = ref(false)
const prefersReducedMotion = ref(false)

// Split heading into line groups - first line should not break, second line can wrap naturally
const headingWords = computed(() => {
  // Group 1 & 2
  const lineGroups = [
    { text: headingLine1, noBreak: false },
    { text: headingLine2, noBreak: false }
  ]

  let charIndex = 0

  return lineGroups.map((group) => {
    const words = group.text.split(' ')
    const lineWords = words.map(word => {
      const wordData = {
        chars: word.split(''),
        startIndex: charIndex * typeSpeed
      }
      charIndex += word.length + 1 // +1 for the space
      return wordData
    })

    return {
      noBreak: group.noBreak,
      words: lineWords
    }
  })
})

// Calculate total animation duration based on total characters
const totalChars = headingLine1.length + headingLine2.length
const typingDuration = computed(() => totalChars * typeSpeed)

// ========================================
// Reduced Motion Detection
// ========================================
const checkReducedMotion = () => {
  // Check if user prefers reduced motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mediaQuery.matches

  // If reduced motion is preferred, show everything immediately
  if (prefersReducedMotion.value) {
    headingVisible.value = true
    subheadingVisible.value = true
  }
}

// ========================================
// Animation Sequence
// ========================================
const startAnimationSequence = () => {
  if (prefersReducedMotion.value) {
    // Skip animations if reduced motion is preferred
    return
  }

  // Show heading container immediately (characters will animate individually)
  headingVisible.value = true

  // Show subheading after typing animation completes
  setTimeout(() => {
    subheadingVisible.value = true

    // Auto-scroll after delay (if enabled)
    if (autoScroll) {
      setTimeout(() => {
        performAutoScroll()
      }, autoScrollDelay)
    }
  }, typingDuration.value)
}

// ========================================
// Auto-Scroll Functionality
// ========================================
const performAutoScroll = () => {
  if (prefersReducedMotion.value) {
    // Don't auto-scroll if user prefers reduced motion
    return
  }

  // Smooth scroll exactly one viewport height down
  window.scrollTo({
    top: window.innerHeight,
    behavior: 'smooth'
  })
}

// ========================================
// Lifecycle Hooks
// ========================================
onMounted(() => {
  // Check for reduced motion preference
  checkReducedMotion()

  // Start animation sequence
  startAnimationSequence()

  // Listen for changes to motion preference
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handleMotionChange = (e) => {
    prefersReducedMotion.value = e.matches
    if (e.matches) {
      headingVisible.value = true
      subheadingVisible.value = true
    }
  }

  mediaQuery.addEventListener('change', handleMotionChange)

  // Cleanup listener on unmount
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleMotionChange)
  })
})
</script>

<style scoped>
/* ========================================
   Typography - Editorial Style
   ======================================== */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap');

.hero-heading {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subheading {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  line-height: 1.5;
  letter-spacing: 0.05em;
}

/* ========================================
   Background Parallax Animation
   ======================================== */
@keyframes backgroundFloat {
  0%, 100% {
    transform: scale(1.05) translateY(0);
  }
  50% {
    transform: scale(1.08) translateY(-10px);
  }
}

.hero-background-animate img {
  animation: backgroundFloat 20s ease-in-out infinite;
  will-change: transform;
}

/* ========================================
   Character Typing Animation
   ======================================== */
@keyframes charFadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.char-animate {
  opacity: 0;
  animation: charFadeIn 0.4s ease-out forwards;
  will-change: opacity, transform;
}

/* ========================================
   Subheading Fade In Animation
   ======================================== */
@keyframes subheadingFade {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.subheading-fade-in {
  animation: subheadingFade 1s ease-out forwards;
  will-change: opacity, transform;
}

/* ========================================
   Scroll Indicator (Reduced Motion Only)
   ======================================== */
.scroll-indicator {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}

/* ========================================
   Reduced Motion Overrides
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .hero-background-animate img {
    animation: none !important;
  }

  .char-animate {
    animation: none !important;
    opacity: 1 !important;
  }

  .subheading-fade-in {
    animation: none !important;
    opacity: 1 !important;
  }
}

/* ========================================
   Performance Optimizations
   ======================================== */
.hero-section {
  /* Promote to own layer for better performance */
  will-change: auto;
}

.hero-background img {
  /* GPU acceleration for transforms */
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
