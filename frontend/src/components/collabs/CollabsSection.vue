<script setup>
import { ref, computed } from 'vue';

const featuredCollabs = ref([
  {
    id: 1,
    name: 'Puma',
    bgClass: 'bg-[#36393B]',
    textClass: 'text-white',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7nTLa00S3jc_0Xqul2qyFo6fxE-rYsiIBHeTI-vQ3kN47jezx2q7AqlExV29C8oO7IpFAnCiGpSPUhLqE-UBqLahycnNlasxbEPSU6MgkVr1juEULhPIlVmc7fYt9iBoswGAG8oz8NWlOJdDJ0bXgMekZvtMN8ukEB2fa4_o12VnYYG4m7Pb1j4dcufkoMNWIvoiUmHAiN8Xg1tg6z6BbR6GhM8d30D3JKeH3I-Ljse1FQtlkZzIqNcz4KacwtqoUO7eorAKccw',
    imgBlend: 'mix-blend-screen',
    buttonText: 'View Products'
  },
  {
    id: 2,
    name: 'New Balance',
    bgClass: 'bg-[#ACA596]',
    textClass: 'text-gray-900',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnYtqqjZDe6MKA-jR4S31i_w3oNTmHrDwfFMonGFafUsrNpe_bK9UBVpL2ftKUT5Ts6SwUI08oQwRNZLN4WBgn78AlL_N2ZvP6UWyJqwJ-CFR3dpQiKtn3TrtF8PPml2kRYQwJDhR3L4ZlTVFRZOrPiXYoNM-WlYDrBURN1hjtLtI4VrhHxGwF56gWj4wGBtBKPD40-G_SJWAU_q78Z3Fz0Xz1BAyLmzEX-ZD_1ZLspXyEfsgT2B6f4yJSvnKaNgfKSIlpelECnA',
    imgBlend: 'mix-blend-multiply',
    buttonText: 'View Products'
  },
  {
    id: 3,
    name: 'Vans',
    bgClass: 'bg-[#D6CEC2]',
    textClass: 'text-gray-900',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0VN2l5Zn7Zkd3d-FnES8tLTL-BQZGAjR1Gn7TnZijjhnMWcdvlTQ-30E9OWmvj2KltZ0jmRQLjTQTLRTW9DKzNMrJGUhAJvFhDelEuINWp1e9Ya1pXp2zfDgs2jgyA7TXFdxXsyvJ4wy_ecI3jORAXPRWktr9Z0mnxVKB4SC864dFNnhBYNahiIc0gfLo-uNZrtrD9RmCwv5elpQZS5M-sRkPQHMH40LABTcQ3HzQd7rgt7yGUGRh0or4If1e2vtr65HpAc-lpg',
    imgBlend: 'mix-blend-multiply',
    buttonText: 'View Products'
  },
  {
    id: 4,
    name: 'Nike',
    bgClass: 'bg-[#1a1a1a]',
    textClass: 'text-white',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzXcasJPb17NDR0BsH2TpE0vX59ulBzW6wgih51wMoqFmJ7IfoJKLvPTpDdOIU0UXyHiHmjkXIEmbiVxqCtLyqjRH1B3ZvCn1_ylu_od3nZFQF4mmprcNPOG9au6G6M3nzfmRUnVW5z_q6h_IdZ29BTT-iEwhmQS6syizXFwkagSkuZEo0BRwlIqtk8bRyB3GZp9BcDVKSmRyDJrNECD0TNOM1MGbxr_i8s5Oj6YVAcJcftCzHtc4A7loxzonmc6RQfsxhFEOs0A',
    imgBlend: 'mix-blend-screen',
    buttonText: 'View Products'
  },
  {
    id: 5,
    name: 'Adidas',
    bgClass: 'bg-[#f0ebe3]',
    textClass: 'text-gray-900',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHWkjPisX3GoEFw1CgzuodDa_BNiFqDjG23ej7Aa36wWaYNJqRveIAyNOKxRxd3JDPxiy-g--xpWF7mFxn6Y0nLNEQp4WZx0rshJiQxw41wngnplgComGU8LXerRR8toAZ8ugeLSLNFdjBeqtQHa_cECXMQ6XsEbaRltOJTG5opY7RrcagOC7zrQ5iAgtfH4FzdjmPvbYo8GLVnX2NRZr9jxJzZ152XjMupSm3HbaJCsHjlQ0saI5v0mq3kHkixJzRvytd-Dz7kA',
    imgBlend: 'mix-blend-multiply',
    buttonText: 'View Products'
  }
]);

const currentIndex = ref(0);
const isAnimating = ref(false);
const slideDirection = ref('next');

// Get visible items (3 at a time: left, center, right)
const visibleCollabs = computed(() => {
  const total = featuredCollabs.value.length;
  const prevIndex = (currentIndex.value - 1 + total) % total;
  const nextIndex = (currentIndex.value + 1) % total;
  
  return {
    left: featuredCollabs.value[prevIndex],
    center: featuredCollabs.value[currentIndex.value],
    right: featuredCollabs.value[nextIndex]
  };
});

const navigate = (direction) => {
  if (isAnimating.value) return;
  isAnimating.value = true;
  slideDirection.value = direction;
  
  const total = featuredCollabs.value.length;
  if (direction === 'next') {
    currentIndex.value = (currentIndex.value + 1) % total;
  } else {
    currentIndex.value = (currentIndex.value - 1 + total) % total;
  }
  
  setTimeout(() => {
    isAnimating.value = false;
  }, 500);
};
</script>

<template>
  <div class="collabs-section font-sans">

    <main
      class="collabs-main w-full max-w-7xl rounded-[2rem] overflow-hidden relative border border-white/20 shadow-soft-xl bg-radial-gradient"
    >
      <div class="section-inner px-4 py-6 md:px-8 md:py-10 lg:py-12 flex flex-col items-center h-full">

        <!-- Header with Logo and X -->
        <header class="header-section flex flex-col items-center text-center w-full max-w-3xl mx-auto" data-aos="fade-down" data-aos-duration="1000">
          <!-- Bigger Logo - Using img tag for reliability -->
          <div class="mb-3 md:mb-5 lg:mb-6 logo-container">
            <img 
              src="/images/Spacefurnio-Logo.png" 
              alt="Spacefurnio Logo" 
              class="logo-image w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain select-none animate-logo-pulse"
            />
          </div>

          <!-- Animated X with phitagate-font - Much bigger -->
          <h1 class="phitagate-font text-gray-800 tracking-tight text-6xl md:text-7xl lg:text-8xl animated-x font-light">
            ×
          </h1>
        </header>

        <!-- Spacer between header and carousel -->
        <div class="header-carousel-gap flex-shrink-0 h-10 md:h-14 lg:h-20"></div>

        <!-- Carousel Container -->
        <div class="carousel-wrapper w-full relative flex-1 flex flex-col justify-center">
          
          <!-- Navigation Buttons -->
          <button 
            @click="navigate('prev')"
            class="nav-button nav-button-left"
            :disabled="isAnimating"
            aria-label="Previous brand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            @click="navigate('next')"
            class="nav-button nav-button-right"
            :disabled="isAnimating"
            aria-label="Next brand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Cards Container with Transitions -->
          <div class="carousel-container">
            <div class="cards-track">
              
              <!-- Left Card (Previous) -->
              <div class="card-slot">
                <Transition :name="slideDirection === 'next' ? 'card-slide-left' : 'card-slide-right'">
                  <article
                    :key="visibleCollabs.left.id"
                    :class="[visibleCollabs.left.bgClass, visibleCollabs.left.textClass]"
                    class="side-card side-card-left"
                    @click="navigate('prev')"
                  >
                    <img
                      :src="visibleCollabs.left.imgSrc"
                      :alt="visibleCollabs.left.name"
                      class="card-img side-img"
                      :class="visibleCollabs.left.imgBlend"
                    />
                    <h3 class="card-title side-title">{{ visibleCollabs.left.name }}</h3>
                  </article>
                </Transition>
              </div>

              <!-- Center Card (Main Focus) -->
              <div class="card-slot card-slot-center">
                <Transition :name="slideDirection === 'next' ? 'card-slide-left' : 'card-slide-right'">
                  <article
                    :key="visibleCollabs.center.id"
                    :class="[visibleCollabs.center.bgClass, visibleCollabs.center.textClass]"
                    class="center-card"
                  >
                    <img
                      :src="visibleCollabs.center.imgSrc"
                      :alt="visibleCollabs.center.name"
                      class="card-img center-img"
                      :class="visibleCollabs.center.imgBlend"
                    />
                    <h2 class="card-title center-title">{{ visibleCollabs.center.name }}</h2>
                    <button class="cta-button">
                      {{ visibleCollabs.center.buttonText }}
                    </button>
                  </article>
                </Transition>
              </div>

              <!-- Right Card (Next) -->
              <div class="card-slot">
                <Transition :name="slideDirection === 'next' ? 'card-slide-left' : 'card-slide-right'">
                  <article
                    :key="visibleCollabs.right.id"
                    :class="[visibleCollabs.right.bgClass, visibleCollabs.right.textClass]"
                    class="side-card side-card-right"
                    @click="navigate('next')"
                  >
                    <img
                      :src="visibleCollabs.right.imgSrc"
                      :alt="visibleCollabs.right.name"
                      class="card-img side-img"
                      :class="visibleCollabs.right.imgBlend"
                    />
                    <h3 class="card-title side-title">{{ visibleCollabs.right.name }}</h3>
                  </article>
                </Transition>
              </div>

            </div>
          </div>

          <!-- Dots Indicator -->
          <div class="flex items-center justify-center gap-2 mt-4">
            <button
              v-for="(collab, index) in featuredCollabs"
              :key="collab.id"
              @click="() => { if (!isAnimating) { currentIndex = index; } }"
              :class="[
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentIndex 
                  ? 'bg-gray-800 w-6' 
                  : 'bg-gray-400 hover:bg-gray-600'
              ]"
              :aria-label="`Go to ${collab.name}`"
            ></button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');

.font-serif {
  font-family: 'Playfair Display', serif;
}
.font-sans {
  font-family: 'Inter', sans-serif;
}

/* ========================================
   SECTION LAYOUT - Exactly 100dvh
   ======================================== */
.collabs-section {
  height: 100dvh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem 2rem 1rem; /* More top padding for navbar */
  box-sizing: border-box;
  background: linear-gradient(
    165deg,
    #f8f6f3 0%,
    #ece8e3 25%,
    #e4dfd8 50%,
    #d9d3ca 75%,
    #cfc8be 100%
  );
  overflow: hidden;
  position: relative;
}

/* Elegant background overlay */
.collabs-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 60% at 50% 30%,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 70%
  );
  pointer-events: none;
}

/* ========================================
   MAIN CONTAINER
   ======================================== */
.collabs-main {
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* Background gradient for main card */
.bg-radial-gradient {
  background: radial-gradient(
    ellipse 100% 80% at 50% 20%,
    #faf8f6 0%,
    #f5f2ee 30%,
    #e8e4de 70%,
    #ddd8d0 100%
  );
}

/* Custom Shadow Utility */
.shadow-soft-xl {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.08),
    0 12px 24px -8px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

/* ========================================
   HEADER SECTION (Logo + X)
   ======================================== */
.header-section {
  flex-shrink: 0;
}

/* Logo Animation */
.logo-container {
  position: relative;
}

.logo-image {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes logoPulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.12));
  }
  50% {
    transform: scale(1.03);
    filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.18));
  }
}

.animate-logo-pulse {
  animation: logoPulse 4s ease-in-out infinite;
}

/* Animated X */
.animated-x {
  position: relative;
  display: inline-block;
  animation: floatX 4s ease-in-out infinite;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-weight: 300;
  opacity: 0.85;
}

@keyframes floatX {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.85;
  }
  25% {
    transform: translateY(-6px) rotate(4deg);
    opacity: 1;
  }
  50% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.85;
  }
  75% {
    transform: translateY(-6px) rotate(-4deg);
    opacity: 1;
  }
}

/* phitagate font */
.phitagate-font {
  font-family: 'Phitagate', 'Playfair Display', serif;
  font-weight: 300;
}

/* ========================================
   CAROUSEL SECTION
   ======================================== */
.carousel-wrapper {
  min-height: 0;
}

/* Carousel Container */
.carousel-container {
  perspective: 1200px;
  position: relative;
}

/* Cards Track - Flex container */
.cards-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  position: relative;
}

@media (min-width: 768px) {
  .cards-track {
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .cards-track {
    gap: 1.5rem;
  }
}

/* Card Image Styles */
.card-img {
  object-fit: contain;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.side-img {
  width: 5rem;
  height: auto;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}

.center-img {
  width: 8rem;
  height: auto;
  margin-bottom: 1.25rem;
  opacity: 0.9;
}

@media (min-width: 768px) {
  .side-img {
    width: 7rem;
  }
  .center-img {
    width: 12rem;
    margin-bottom: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .side-img {
    width: 8rem;
  }
  .center-img {
    width: 14rem;
  }
}

/* Card Title Styles */
.card-title {
  font-family: 'Playfair Display', serif;
  letter-spacing: 0.05em;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.side-title {
  font-size: 1rem;
  opacity: 0.8;
}

.center-title {
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 768px) {
  .side-title {
    font-size: 1.125rem;
  }
  .center-title {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .side-title {
    font-size: 1.25rem;
  }
  .center-title {
    font-size: 2.25rem;
  }
}

/* ========================================
   CARD SLOT - Container for transitions
   ======================================== */
.card-slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========================================
   SLIDE TRANSITIONS (simultaneous crossfade)
   ======================================== */

/* Slide Left - used when navigating NEXT */
.card-slide-left-enter-active {
  transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.card-slide-left-leave-active {
  transition: all 0.35s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  position: absolute;
}

.card-slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.92);
}

.card-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.92);
}

/* Slide Right - used when navigating PREV */
.card-slide-right-enter-active {
  transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.card-slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  position: absolute;
}

.card-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.92);
}

.card-slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.92);
}

/* Navigation Buttons */
.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #374151;
}

.nav-button:hover:not(:disabled) {
  background: #1f2937;
  color: white;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.nav-button:active:not(:disabled) {
  transform: translateY(-50%) scale(0.95);
}

.nav-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-button-left {
  left: 0.5rem;
}

.nav-button-right {
  right: 0.5rem;
}

@media (min-width: 768px) {
  .nav-button {
    width: 52px;
    height: 52px;
  }
  .nav-button-left {
    left: 1.5rem;
  }
  .nav-button-right {
    right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .nav-button {
    width: 56px;
    height: 56px;
  }
  .nav-button-left {
    left: 2rem;
  }
  .nav-button-right {
    right: 2rem;
  }
}

/* ========================================
   CARDS STYLING
   ======================================== */

/* Side Cards (Left & Right) */
.side-card {
  width: 120px;
  height: 140px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
  filter: blur(1px);
  transform: scale(0.85);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.side-card:hover {
  opacity: 0.7;
  filter: blur(0);
  transform: scale(0.9);
}

.side-card-left {
  transform-origin: right center;
}

.side-card-right {
  transform-origin: left center;
}

@media (min-width: 640px) {
  .side-card {
    width: 140px;
    height: 160px;
    padding: 1rem;
  }
}

@media (min-width: 768px) {
  .side-card {
    width: 160px;
    height: 180px;
    padding: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .side-card {
    width: 180px;
    height: 210px;
  }
}

/* Center Card (Main Focus) */
.center-card {
  width: 200px;
  height: 250px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 30;
  box-shadow: 
    0 25px 60px rgba(0, 0, 0, 0.15),
    0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: centerCardEnter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes centerCardEnter {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.center-card:hover {
  transform: translateY(-6px);
  box-shadow: 
    0 35px 70px rgba(0, 0, 0, 0.18),
    0 15px 40px rgba(0, 0, 0, 0.12);
}

@media (min-width: 640px) {
  .center-card {
    width: 240px;
    height: 290px;
    padding: 1.5rem;
  }
}

@media (min-width: 768px) {
  .center-card {
    width: 280px;
    height: 320px;
    padding: 1.75rem;
  }
}

@media (min-width: 1024px) {
  .center-card {
    width: 320px;
    height: 360px;
    padding: 2rem;
  }
}

/* ========================================
   CTA BUTTON
   ======================================== */
.cta-button {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.cta-button:hover {
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.cta-button:active {
  transform: translateY(0) scale(0.98);
}

@media (min-width: 768px) {
  .cta-button {
    font-size: 0.75rem;
    padding: 0.875rem 2rem;
  }
}

/* ========================================
   RESPONSIVE HEIGHT ADJUSTMENTS
   ======================================== */

/* Short screens */
@media (max-height: 700px) {
  .collabs-section {
    padding: 1.5rem 1rem;
  }
  
  .logo-image {
    width: 60px !important;
    height: 60px !important;
  }
  
  .header-carousel-gap {
    height: 1rem !important;
  }
  
  .center-card {
    width: 180px !important;
    height: 220px !important;
    padding: 1rem !important;
  }
  
  .side-card {
    width: 110px !important;
    height: 130px !important;
    padding: 0.5rem !important;
  }
}

@media (max-height: 600px) {
  .logo-image {
    width: 50px !important;
    height: 50px !important;
  }
  
  .animated-x {
    font-size: 1.75rem !important;
  }
  
  .header-carousel-gap {
    height: 0.5rem !important;
  }
  
  .center-card {
    width: 160px !important;
    height: 190px !important;
  }
  
  .side-card {
    width: 100px !important;
    height: 120px !important;
  }
}

/* Very short screens */
@media (max-height: 550px) {
  .collabs-section {
    padding: 1rem 0.5rem;
  }
  
  .section-inner {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }
  
  .logo-image {
    width: 40px !important;
    height: 40px !important;
  }
  
  .animated-x {
    font-size: 1.5rem !important;
  }
  
  .header-carousel-gap {
    height: 0.25rem !important;
  }
}

/* Large screens - maximize elegance */
@media (min-height: 900px) and (min-width: 1024px) {
  .logo-image {
    width: 140px !important;
    height: 140px !important;
  }
  
  .animated-x {
    font-size: 4.5rem !important;
  }
  
  .header-carousel-gap {
    height: 3rem !important;
  }
  
  .center-card {
    width: 360px !important;
    height: 400px !important;
  }
  
  .side-card {
    width: 200px !important;
    height: 240px !important;
  }
}
</style>

