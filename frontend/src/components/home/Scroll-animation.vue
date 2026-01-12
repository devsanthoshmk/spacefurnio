<script setup>
import homePageText from '@/assets/contents/homePage.js'
</script>

<template>
  <section>
    <!-- Panel 1 -->
    <div class="scroll-section h-[100dvh]">
      <div
        class="panel h-[100dvh] w-full flex items-center justify-center bg-[url('/images/linemeetslight.png')] bg-cover bg-center rounded-xl relative">
        <div
          id="text-1"
          class="floating-text italic absolute inset-0 flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center px-4 opacity-0 transition-opacity duration-700"
          data-key="scroll_text_1">
          {{ homePageText.scroll_text_1.text }}
        </div>
      </div>
    </div>

    <!-- Panel 2 -->
    <div class="scroll-section h-[100dvh]">
      <div
        class="panel h-[100dvh] w-full flex items-center justify-center bg-[url('/images/functionmeetsoul.png')] bg-cover bg-center rounded-xl relative">
        <div
          id="text-2"
          class="floating-text italic absolute inset-0 flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center px-4 opacity-0 transition-opacity duration-700 z-1"
          data-key="scroll_text_2">
          {{ homePageText.scroll_text_2.text }}
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.panel {
  transition: filter 0.6s ease-in-out;
  position: relative;
}

.panel.active {
  animation: blurIn 2s ease forwards;
}

/* floating text animation when active */
.scroll-section.active .floating-text {
  opacity: 1;
  animation: fadeInUp 1s ease forwards, blurIn 1.2s ease forwards;
}

@keyframes blurOut {
  0% {
    filter: blur(6px);
  }

  25% {
    filter: blur(4px);
  }

  50% {
    filter: blur(2px);
  }

  75% {
    filter: blur(1px);
  }

  100% {
    filter: blur(0);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(200px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
