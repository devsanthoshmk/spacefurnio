<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import scrollAnimation from '@/components/home/Scroll-animation.vue';
import NavComponent from '@/components/Nav-component.vue';
import ProductSection from '@/components/home/Product-section.vue';
import Button from 'primevue/button';
import FooterComponent from '@/components/Footer-component.vue'
import { scroller } from '@/utills/customScroll.js';
import { inject } from 'vue';
import homePageText from '@/assets/contents/homePage.json';

const { showNav } = inject('navShowUtils');

const heroRef = ref(null);
const newArrivalsRef = ref(null);
const taglineRef = ref(null);
const ctaRef = ref(null);

const wrapper = ref(null)
const navDotsContainer = ref(null)



const newArrivalImages = [
  {
    src: "https://plus.unsplash.com/premium_photo-1681400063959-81efdde1814c?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: homePageText.new_arrival_alt_1,
    altKey: "new_arrival_alt_1"
  },
  {
    src: "https://images.unsplash.com/photo-1604580040660-f0a7f9abaea6?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: homePageText.new_arrival_alt_2,
    altKey: "new_arrival_alt_2"
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1664300702916-49bb4eeb5373?q=80&w=2012&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: homePageText.new_arrival_alt_3,
    altKey: "new_arrival_alt_3"
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1681400063959-81efdde1814c?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: homePageText.new_arrival_alt_4,
    altKey: "new_arrival_alt_4"
  }
];

// const handleGrabNow = () => {
//   // Handle button click
//   console.log('Grab now clicked!');
// };

onMounted(() => {
  const cleanup = scroller(wrapper, 'scroll-section', navDotsContainer)
  wrapper.value.addEventListener('sectionChange', (e) => {
    console.log('Scroll started', e.detail);
    if (e.detail.currentIndex === 0) {
      showNav.value = false;
      console.log('Hiding nav');
    } else {
      setTimeout(() => {
        (showNav.value = true);
      }, 100);
    }
  });
  showNav.value = false;
  onBeforeUnmount(() => {
    cleanup();
    showNav.value = true;
  });
})

</script>

<template>
  <div id="scroll-container" class="overflow-hidden">
    <div id="scroll-wrapper" ref="wrapper">
      <section class="scroll-section hero-section">
        <div class="hero-grid">
          <!-- Hero Section - Full viewport on mobile, left side on desktop -->
          <div ref="heroRef" class="hero-image-container" :style="{
            backgroundImage: `url('/images/taglinebg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }" v-animateonscroll="{ enterClass: 'animate-fadein', leaveClass: 'animate-fadeout' }">
            <!-- Dark overlay -->
            <div class="absolute inset-0 bg-black/20 z-10"></div>

            <NavComponent class="!absolute z-20" />

            <div class="relative z-20 w-full h-full flex items-center justify-center p-4">
              <div ref="taglineRef" class="text-center lg:mb-32"
                v-animateonscroll="{ enterClass: 'animate-zoomin', leaveClass: 'animate-zoomout', delay: 600 }">
                <h1 class="phitagate-font text-[clamp(2.5rem,12vw,6rem)] font-bold text-white mb-4 lg:mb-1 drop-shadow-2xl" data-key="hero_brand_name">
                  {{ homePageText.hero_brand_name }}
                </h1>
                <p class="phitagate-font text-[clamp(1.25rem,3vw,1.75rem)] text-white italic drop-shadow-xl" data-key="hero_tagline">
                  {{ homePageText.hero_tagline }}
                </p>
                <div class="w-20 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-6 rounded-full"></div>
              </div>
            </div>
          </div>

          <!-- New Arrivals Section - Hidden on mobile, right side on desktop -->
          <div ref="newArrivalsRef" class="new-arrivals-container hidden lg:flex flex-col"
            v-animateonscroll="{ enterClass: 'animate-fadeinleft', leaveClass: 'animate-fadeoutright' }">

            <!-- Header -->
            <div class="new-arrivals-header">
              <h2 class="text-gray-800 font-bold text-base xl:text-lg text-center font-['Montserrat']" data-key="new_arrivals_heading">
                {{ homePageText.new_arrivals_heading }}
              </h2>
            </div>

            <!-- Images Gallery - Vertical layout with fixed aspect ratio -->
            <div class="new-arrivals-gallery">
              <div
                v-for="(image, index) in newArrivalImages"
                :key="index"
                class="new-arrival-item group timer-cursor"
              >
                <div class="new-arrival-image-wrapper">
                  <img
                    :src="image.src"
                    :alt="image.alt"
                    :data-key="image.altKey"
                    class="new-arrival-image grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                  />
                  <!-- Coming Soon Overlay -->
                  <div class="coming-soon-overlay">
                    <div class="coming-soon-content">
                      <!-- Animated pulse ring -->
                      <div class="pulse-ring"></div>
                      <div class="pulse-ring delay-1"></div>

                      <!-- Glass card -->
                      <div class="glass-card">
                        <i class="pi pi-clock text-lg text-orange-400 mb-1 animate-pulse"></i>
                        <span class="coming-soon-text" data-key="coming_soon">{{ homePageText.coming_soon }}</span>
                        <div class="sparkle-line"></div>
                      </div>
                    </div>
                  </div>
                  <!-- Coming Soon badge -->
                  <div class="disabled-badge">
                    <i class="pi pi-hourglass text-[10px]"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA Section -->
            <div ref="ctaRef" class="cta-section"
              v-animateonscroll="{ enterClass: 'animate-fadeup', leaveClass: 'animate-fadedown', delay: 1000 }">
              <p class="text-xs xl:text-sm font-semibold text-gray-800 mb-2 font-['Montserrat'] leading-tight text-center">
                <span data-key="cta_line_1">{{ homePageText.cta_line_1 }}</span><br />
                <span class="text-orange-500" data-key="cta_line_2">{{ homePageText.cta_line_2 }}</span>
              </p>

              <!-- Elegant Button -->
              <div class="flex justify-center">
                <router-link to="/shopping">
                  <Button
                    class="grab-now-button bg-gradient-to-r from-orange-500 to-orange-600 border-none text-white px-4 py-1.5 xl:px-5 xl:py-2 rounded-full font-medium text-xs shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <span class="relative z-10 flex items-center gap-2">
                      <i class="pi pi-bolt text-xs"></i>
                      <span data-key="grab_now_button">{{ homePageText.grab_now_button }}</span>
                      <i class="pi pi-arrow-right text-xs transition-transform duration-300 group-hover:translate-x-1"></i>
                    </span>
                  </Button>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <scrollAnimation />
      </section>

      <section>
        <ProductSection />
      </section>

      <section class="scroll-section">
        <FooterComponent />
      </section>

    </div>
  </div>

  <div class="nav-dots" id="nav-dots" ref="navDotsContainer"></div>
</template>

<style scoped>
  #scroll-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
}
  body{
    overflow: hidden;
  }

.section {
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* Hero Section Styles */
.hero-section {
  height: 100vh;
  max-height: 100vh;
  padding: 0.5rem;
  overflow: hidden;
  box-sizing: border-box;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  height: calc(100vh - 1rem);
  max-height: calc(100vh - 1rem);
}

@media (min-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr 280px;
  }
}

@media (min-width: 1280px) {
  .hero-grid {
    grid-template-columns: 1fr 320px;
  }
}

.hero-image-container {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  height: calc(100vh - 1rem);
  max-height: calc(100vh - 1rem);
}

@media (min-width: 1024px) {
  .hero-image-container {
    height: 100%;
    max-height: 100%;
  }
}

/* New Arrivals Container */
.new-arrivals-container {
  background-color: #f9fafb;
  border-radius: 0.75rem;
  padding: 0.5rem;
  height: 100%;
  max-height: calc(100vh - 1rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* New Arrivals Header */
.new-arrivals-header {
  flex-shrink: 0;
  padding-bottom: 0.375rem;
}

/* New Arrivals Gallery */
.new-arrivals-gallery {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Timer emoji cursor not using rn doesnt looking good */
/* .timer-cursor {
  cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><text y='24' font-size='24'>⏱️</text></svg>") 16 16, wait;
} */

.new-arrival-item {
  flex: 1;
  min-height: 0;
  display: block;
  max-height: calc((100vh - 10rem) / 4);
}

.new-arrival-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: #e5e7eb;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.new-arrival-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.new-arrival-item:hover .new-arrival-image {
  transform: scale(1.05);
}

/* Coming Soon Overlay */
.coming-soon-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(0px);
}

.new-arrival-item:hover .coming-soon-overlay {
  opacity: 1;
  backdrop-filter: blur(4px);
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
  width: 80px;
  height: 80px;
  border: 2px solid rgba(249, 115, 22, 0.4);
  border-radius: 50%;
  animation: pulseRing 2s ease-out infinite;
  opacity: 0;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
}

.new-arrival-item:hover .pulse-ring {
  opacity: 1;
}

@keyframes pulseRing {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* Glass card */
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transform: scale(0.8) translateY(10px);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.new-arrival-item:hover .glass-card {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* Coming Soon Text */
.coming-soon-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Sparkle line animation */
.sparkle-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(249, 115, 22, 0.8) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: none;
}

.new-arrival-item:hover .sparkle-line {
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
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.new-arrival-item:hover .disabled-badge {
  opacity: 1;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.8) 0%, rgba(234, 88, 12, 0.9) 100%);
  transform: rotate(15deg) scale(1.1);
}

/* CTA Section */
.cta-section {
  flex-shrink: 0;
  padding-top: 0.5rem;
  background-color: #f9fafb;
}

.nav-dots {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 100;
}

.dot {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border: 1px solid #fff;
  cursor: pointer;
  transition: background 0.3s;
}

.dot.active {
  background: #fff;
}

</style>

<style scoped>
/* Custom scrollbar for desktop */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #f97316, #ea580c);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ea580c, #dc2626);
}

/* Hide scrollbar for mobile horizontal scroll */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Button hover effects */
.grab-now-button {
  position: relative;
  overflow: hidden;
}

.grab-now-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.grab-now-button:hover::before {
  left: 100%;
}

/* PrimeVue v4 Animation Classes */
.animate-fadein {
  animation: fadeIn 0.8s ease-out;
}

.animate-fadeout {
  animation: fadeOut 0.8s ease-out;
}

.animate-fadeinleft {
  animation: fadeInLeft 0.8s ease-out;
}

.animate-fadeoutright {
  animation: fadeOutRight 0.8s ease-out;
}

.animate-zoomin {
  animation: zoomIn 0.6s ease-out;
}

.animate-zoomout {
  animation: zoomOut 0.6s ease-out;
}

.animate-fadeup {
  animation: fadeUp 0.6s ease-out;
}

.animate-fadedown {
  animation: fadeDown 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(30px);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes zoomOut {
  from {
    opacity: 1;
    transform: scale(1);
  }

  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

</style>
