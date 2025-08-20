<template>
  <section class="scroll-section">
    <div id="main-container" class="main-container relative">
      <!-- Panel 1 -->
      <div
        class="panel h-screen w-full sticky top-0 flex items-center justify-center bg-[url('/images/linemeetslight.png')] bg-cover bg-center rounded-xl">
      </div>
      <div id="text-1"
        class="floating-text italic  h-screen w-full text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center px-4">
        Where lines meet light
      </div>

      <!-- Panel 2 -->
      <div
        class="panel h-screen w-full sticky top-0 flex items-center justify-center bg-[url('/images/functionmeetsoul.png')] bg-cover bg-center rounded-xl">
      </div>
      <div id="text-2"
        class="floating-text italic  h-screen w-full text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center px-4">
        And functions meet soul
      </div>

      <!-- Panel 3 -->
      <div
        class="panel h-screen w-full sticky top-0 flex items-center justify-center bg-[url('/images/taglinebg.png')] bg-cover bg-center rounded-xl">
      </div>
      <!-- <div id="text-3"
        class="floating-text italic  h-screen w-full text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center px-4">
        You'll find us
      </div> -->
    </div>
  </section>
</template>

<style scoped>
.panel {
  transition: filter 0.6s ease-in-out;
}

.panel.blur {
  filter: blur(6px) brightness(0.8);
}

.floating-text {
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 1.2s ease forwards;
}


@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<script setup>

</script>
