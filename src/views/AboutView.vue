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

  <section class="relative w-full h-screen overflow-hidden">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-no-repeat bg-center bg-cover bg-[url('/images/aboutus/2.png')]"
    ></div>

    <!-- Overlay text (permanently placed inside curve) -->
<div
  class="absolute text-center px-3 py-2 rounded-lg"
  :style="{
    left: '54.42%',
  top: '37.98%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgb(255, 244, 236)',
  }"
>
  <h2
    class="font-serif text-[clamp(1rem,2vw,1.5rem)] md:text-[clamp(1.2rem,2.5vw,2rem)] leading-snug text-gray-800"
  >
    Where lines meet light,<br />
    and function meets soul,<br />
    you’ll find us –<br />
    blending vision with reality &<br />
    creativity with living.
  </h2>

  <p
    class="mt-2 text-[clamp(0.9rem,1.8vw,1.25rem)] text-gray-700 leading-snug"
  >
    Every corner crafted.<br />
    Every piece with purpose.<br />
    Because your space deserves<br />
    more than structure,<br />
    <span class="font-script italic">it deserves a story.</span>
  </p>
</div>


    <!-- Left side rotated label -->
    <div
      class="phitagate-font absolute left-0 -translate-y-1/2 -rotate-90 origin-top-left text-black font-semibold text-8xl top-full px-4 py-6"
    >
      Brand Manifesto
    </div>
  </section>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Dancing+Script:wght@500&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&display=swap");
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif;
}
.font-serif {
  font-family: "Playfair Display", serif;
}

.font-script {
  font-family: "Dancing Script", cursive;
}
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

