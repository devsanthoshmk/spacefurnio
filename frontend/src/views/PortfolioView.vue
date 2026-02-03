<template>
  <div class="bg-space-bg-light dark:bg-space-bg-dark text-space-text-light dark:text-space-text-dark font-space-display transition-colors duration-300 min-h-screen">

    <!-- Hero Section -->
    <HeroSection />

    <MainSection />

    <section class="w-full px-6 md:px-12 py-12 mb-8 md:mb-16">
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
    </section>

  </div>
</template>

<script setup>
import HeroSection from '@/components/portfolio/HeroSection.vue'
import MainSection from '@/components/portfolio/MainSection.vue'

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
