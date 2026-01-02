<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import scrollAnimation from '@/components/home/Scroll-animation.vue';
import NavComponent from '@/components/Nav-component.vue';
import ProductSection from '@/components/home/Product-section.vue';
import Button from 'primevue/button';
import FooterComponent from '@/components/Footer-component.vue'
import { scroller } from '@/utills/customScroll.js';
import { inject } from 'vue';

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
    alt: "Modern Chair Collection"
  },
  {
    src: "https://images.unsplash.com/photo-1604580040660-f0a7f9abaea6?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Elegant Sofa Design"
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1664300702916-49bb4eeb5373?q=80&w=2012&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Contemporary Table"
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1681400063959-81efdde1814c?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Minimalist Furniture"
  }
];

const handleGrabNow = () => {
  // Handle button click
  console.log('Grab now clicked!');
};

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
      <section class="scroll-section h-screen p-2">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-2 min-h-[97vh]">
          <!-- Hero Section -->
          <div ref="heroRef" class="lg:col-span-4 relative rounded-xl overflow-hidden h-[98vh]" :style="{
            backgroundImage: `url('/images/taglinebg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }" v-animateonscroll="{ enterClass: 'animate-fadein', leaveClass: 'animate-fadeout' }">
            <!-- Dark overlay -->
            <div class="absolute inset-0 bg-black/20 z-10"></div> <!-- lighter overlay -->


            <NavComponent class="!absolute z-20" />

            <div class="relative z-20 w-full h-full flex items-center justify-center p-4">
              <div ref="taglineRef" class="text-center lg:mb-55"
                v-animateonscroll="{ enterClass: 'animate-zoomin', leaveClass: 'animate-zoomout', delay: 600 }">
                <h1 class="phitagate-font text-[clamp(2.5rem,14vw,7rem)] font-bold text-white mb-4 lg:mb-1 drop-shadow-2xl">
                  Spacefurnio
                </h1>
                <p class="phitagate-font text-[clamp(1.25rem,3vw,2rem)] text-white italic drop-shadow-xl">
                  "Creative Meets Living"
                </p>
                <div class="w-20 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-6 rounded-full"></div>
              </div>
            </div>
          </div>

          <!-- New Arrivals Section -->
          <div ref="newArrivalsRef" class="lg:col-span-1 bg-gray-50 rounded-xl p-4"
            v-animateonscroll="{ enterClass: 'animate-fadeinleft', leaveClass: 'animate-fadeoutright' }">
            <h2 class="text-gray-800 font-bold text-xl lg:text-2xl text-center mb-6 font-['Montserrat']">
              New Arrivals
            </h2>

            <!-- Flex container for better layout control -->
            <div class="flex flex-col h-[60%]">
              <!-- Images Gallery -->
              <div class="flex-1 mb-6">
                <!-- Mobile: Horizontal layout -->
                <div class="flex lg:hidden gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <div v-for="(image, index) in newArrivalImages" :key="index" class="flex-shrink-0 group relative">
                    <div class="w-40 h-28 rounded-lg overflow-hidden shadow-md bg-gray-200">
                      <img :src="image.src" :alt="image.alt"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        @error="handleImageError" loading="lazy" />
                      <div
                        class="absolute inset-0 bg-black/20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <i
                          class="pi pi-eye text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Desktop: Vertical layout -->
                <div class="hidden lg:flex lg:flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  <div v-for="(image, index) in newArrivalImages" :key="index" class="group relative">
                    <div class="w-full h-32 rounded-lg overflow-hidden shadow-md bg-gray-200">
                      <img :src="image.src" :alt="image.alt"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        @error="handleImageError" loading="lazy" />
                      <div
                        class="absolute inset-0 bg-black/20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <i
                          class="pi pi-eye text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Section - Always at bottom -->
              <div ref="ctaRef" class="text-center mt-auto"
                v-animateonscroll="{ enterClass: 'animate-fadeup', leaveClass: 'animate-fadedown', delay: 1000 }">
                <p class="text-lg lg:text-xl font-semibold text-gray-800 mb-4 font-['Montserrat'] leading-tight">
                  Design this good<br />
                  <span class="text-orange-500">doesn't wait</span>
                </p>

                <!-- Elegant Button -->
                <div class="relative inline-block">
                  <Button
                    class="grab-now-button bg-gradient-to-r from-orange-500 to-orange-600 border-none text-white px-6 py-3 rounded-full font-medium text-sm lg:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    @click="handleGrabNow">
                    <span class="relative z-10 flex items-center gap-2">
                      <i class="pi pi-bolt text-sm"></i>
                      Grab it now!
                      <i class="pi pi-arrow-right text-sm transition-transform duration-300 group-hover:translate-x-1"></i>
                    </span>
                    <div
                      class="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    </div>
                  </Button>

                  <!-- Animated ring effect -->
                  <div
                    class="absolute inset-0 rounded-full border-2 border-orange-400 opacity-0 animate-ping hover:opacity-100">
                  </div>
                </div>
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
