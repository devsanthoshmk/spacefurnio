<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import scrollAnimation from '@/components/home/Scroll-animation.vue';
import ProductSection from '@/components/home/Product-section.vue';
import HeroSection from '@/components/home/HeroSection.vue';
import FooterComponent from '@/components/Footer-component.vue'
import { scroller } from '@/utills/customScroll.js';
import { inject } from 'vue';

const { showNav,showFoo } = inject('navShowUtils');

const wrapper = ref(null)
const navDotsContainer = ref(null)

onMounted(() => {
  showFoo.value = false;
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
    showFoo.value = true;
  });
})

</script>

<template>
  <div id="scroll-container" class="overflow-hidden">
    <div id="scroll-wrapper" ref="wrapper">
      <section class="scroll-section">
        <HeroSection />
      </section>

      <section class="scroll-section">
        <scrollAnimation />
      </section>

      <section class="scroll-section">
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
  height: 100dvh;
  position: relative;
}

/* :global(html, body) {
  overflow: hidden !important;
} */

.section {
  width: 100%;
  height: 100dvh;
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
