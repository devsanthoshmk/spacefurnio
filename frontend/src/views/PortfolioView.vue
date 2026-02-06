<template>
  <div id="scroll-container" class="overflow-hidden">
    <div id="scroll-wrapper" ref="wrapper">
      <div class="bg-space-bg-light dark:bg-space-bg-dark text-space-text-light dark:text-space-text-dark font-space-display transition-colors duration-300 min-h-screen">

          <!-- Hero Section -->
          <div class="scroll-section">
            <HeroSection :simulateKey="simulateKey" />
          </div>

          <div class="scroll-section" ref="innerCustomScollEl">
            <MainSection :simulateKey="simulateKey" :innerCustomScollEl="innerCustomScollEl" />
          </div>

          <div class="scroll-section w-full px-6 md:px-12 py-12 mb-8 md:mb-16">
            <div class="max-w-[1600px] mx-auto border-t border-b border-gray-300 dark:border-gray-700 py-12 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div class="max-w-2xl">
                <h2 class="text-2xl md:text-4xl font-space-serif italic text-space-text-light dark:text-space-text-dark mb-4">
                  Discover Our Latest Collection
                </h2>
                <p class="text-sm md:text-base text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-lg">
                  Explore a curated selection of minimalist designs that bring harmony and functionality to your living spaces.
                </p>
              </div>
              <div class="flex-shrink-0">
                <a class="inline-block border border-space-text-light dark:border-space-text-dark px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-space-primary hover:border-space-primary hover:text-white transition-all duration-300" href="#">
                  Shop Now
                </a>
              </div>
            </div>
          </div>

          <div class="scroll-section">
            <FooterComponent/>
          </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import HeroSection from '@/components/portfolio/HeroSection.vue'
import MainSection from '@/components/portfolio/MainSection.vue'
import FooterComponent from '@/components/Footer-component.vue'
import { scroller } from '@/utills/customScroll.js';
import { ref, onMounted, onBeforeUnmount, inject } from 'vue';

const { showNav,showFoo } = inject('navShowUtils');
const wrapper = ref(null)
const innerCustomScollEl = ref(null)

onMounted(() => {
  showFoo.value = false;
  const cleanup = scroller(wrapper, 'scroll-section',null,{emmitSectionChangeEvent:true})
  onBeforeUnmount(() => {
    cleanup();
    showNav.value = true;
    showFoo.value = true;
  });
  wrapper.value.addEventListener('sectionChange', (e) => {
  console.error(e.detail.currentIndex);
  console.error(e.detail.currentSection);
});

})

function simulateKey(key) {
  const down = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });

  const up = new KeyboardEvent('keyup', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });

  document.dispatchEvent(down);
  document.dispatchEvent(up);
}
// const toggleDarkMode = () => {
//   document.documentElement.classList.toggle('dark');
// };
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
