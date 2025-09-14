<template>
  <!-- hero section -->
  <section class="">
  <!-- container -->
  <div class="h-screen w-full relative">

    <!-- top solid block -->
    <div class="top-0 left-0 w-full h-1/3 bg-[#fff4ec]"></div>

    <!-- background image block -->
    <div class="bg-[url('/images/aboutus/hero.png')] bg-cover bg-center h-2/3"></div>

    <!-- foreground text -->
    <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center text-center px-4" style="     top: calc(0.29 * 100%);">
      <h2 class="text-4xl md:text-5xl text-black font-bold mb-4 font-playfair">
        ABOUT US
      </h2>
      <p class="max-w-2xl text-sm md:text-base text-gray-800 leading-relaxed">
        At <span class="font-semibold">Spacefurnio</span>, we are passionate about shaping spaces that reflect purpose,
        personality, and precision. We offer an integrated approach to architecture,
        construction, interior design, and custom furniture, making us a one-stop
        destination for complete spatial solutions. From drawing board to delivery,
        <span class="font-bold">we handle everything!</span>
      </p>
    </div>

  </div>
</section>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');

        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        /* Custom gradient for the background */
        .gradient-bg {
            background: linear-gradient(180deg, #fff4ec 0%, #f5f1ed 50%, #e8ddd4 100%);
        }

        /* Text selection styling */
        ::selection {
            background-color: rgba(0, 0, 0, 0.1);
        }
</style>

<script setup>
</script>
