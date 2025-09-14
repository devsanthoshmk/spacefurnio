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
      <h2 class="text-4xl md:text-5xl text-black font-bold mb-4 font-serif">
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
  <section class="relative w-full h-screen overflow-hidden">
  <!-- Background -->
  <div
    class="absolute inset-0 bg-no-repeat bg-center bg-cover bg-[url('/images/aboutus/3.png')]"
  ></div>

  <!-- Overlay text (permanently placed inside curve) -->
  <div
  class="absolute text-center px-3 py-2 rounded-lg"
  :style="{
    left: '45%',
    top: '67%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgb(255, 244, 236)',
  }"
>
  <h2
    class="font-serif text-[clamp(1rem,2vw,1.5rem)] md:text-[clamp(1.2rem,2.5vw,2rem)] leading-snug text-gray-800"
  >
    At <span class="font-bold">Spacefurnio</span>,<br />
    we believe that great design is where<br />
    <span class="font-script italic">creativity meets living.</span>
  </h2>

  <p
    class="mt-3 text-[clamp(0.9rem,1.8vw,1.25rem)] text-gray-700 leading-snug"
  >
    We exist to transform everyday spaces into<br />
    thoughtful experiences by fusing imaginative<br />
    design, precision craftsmanship, and<br />
    sustainable practices. From architecture<br />
    and interiors to product design and<br />
    furniture manufacturing, we bring<br />
    creative ideas to life so people can<br />
    live beautifully, functionally,<br />
    and meaningfully.
  </p>
</div>


  <!-- Right side rotated label -->
  <div
    class="phitagate-font absolute right-0 -translate-y-1/2 rotate-90 origin-top-right text-black font-semibold text-8xl top-full px-4 py-6"
  >
    Mission Statement
  </div>
</section>
  <div class="h-screen w-full relative">

    <!-- top solid block -->
    <div class="top-0 left-0 w-full h-3/10 bg-[#e2e2e2]"></div>

    <!-- background image block -->
    <div class="!bg-[#fff4ec] h-7/10"></div>

    <!-- foreground text -->
    <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center text-center px-4" style="     top: calc(0.25 * 100%);">
      <h2 class="phitagate-font text-7xl font-bold mb-4 text-[#e67e22]">
        What we do?
      </h2>
<div class="w-[75vw] mx-auto mt-7">
  <div class="flex flex-col md:flex-row justify-between items-start w-full gap-10">

    <!-- Left Side Image -->
    <div class="w-full md:w-1/2">
      <img
        src="https://placehold.co/500x350"
        alt="Dummy Image"
        class="w-full h-auto rounded-2xl shadow-lg object-cover"
      />
    </div>

    <!-- Right Side Bullet Points -->
    <div class="w-full md:w-1/2 flex flex-col items-center text-center self-stretch">
      <h3 class="text-2xl font-semibold text-gray-800 mb-4">
        Key Highlights
      </h3>

      <ul class="mt-6 space-y-3 text-left text-[clamp(0.9rem,1.8vw,1.25rem)] text-gray-800">
        <li class="flex items-center gap-3">
          <span class="w-2 h-2 bg-gray-800 rounded-full"></span>
          Architecture &amp; Planning
        </li>
        <li class="flex items-center gap-3">
          <span class="w-2 h-2 bg-gray-800 rounded-full"></span>
          Construction &amp; Project Execution
        </li>
        <li class="flex items-center gap-3">
          <span class="w-2 h-2 bg-gray-800 rounded-full"></span>
          Interior Design &amp; Styling
        </li>
        <li class="flex items-center gap-3">
          <span class="w-2 h-2 bg-gray-800 rounded-full"></span>
          Custom Furniture Design &amp; Manufacturing
        </li>
        <li class="flex items-center gap-3">
          <span class="w-2 h-2 bg-gray-800 rounded-full"></span>
          Turnkey Décor Solutions
        </li>
      </ul>
    </div>

  </div>
</div>





    </div>

  </div>
<section class="max-w-7xl mx-auto px-6 py-16 team-section">

<section class="max-w-7xl mx-auto px-6 py-16 team-section">
  <div
    v-for="(member, index) in teamMembers"
    :key="member.id"
    class="teammem grid md:grid-cols-2 gap-12 items-center my-4"
  >
    <!-- Image -->
    <div
      class="relative w-full"
      :class="[ index % 2 === 1 ? 'md:order-2' : 'md:order-1' ]"
    >
      <img
        src="https://placehold.co/600x600"
        alt="Profile Image"
        class="w-full h-auto rounded-2xl shadow-xl object-cover"
      />

      <div class="absolute bottom-4 bg-gray-900/90 text-white px-5 py-3 rounded-lg shadow-lg" :class="index % 2 === 1 ? 'left-4' : 'right-4' ">
        <h3 class="text-lg font-semibold">{{ member.name }}</h3>
        <p class="text-sm">{{ member.role }}</p>
      </div>
    </div>

    <!-- Text -->
    <div
      class="text-gray-700 space-y-6"
      :class="[ index % 2 === 1 ? 'md:order-1' : 'md:order-2' ]"
    >
      <h1 class="text-3xl font-bold text-gray-900">Hello, I'm {{ member.nickname }}</h1>
      <p class="leading-relaxed">{{ member.detailedBio }}</p>

      <div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Architectural Perspective</h2>
        <p class="leading-relaxed">{{ member.Architectural_Perspective }}</p>
      </div>
    </div>
  </div>
</section>





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
import { ref } from 'vue'

// Team members data
const teamMembers = ref([
  {
    id: 1,
    name: "Ar. Thaini Jentra",
    nickname: "Jeni",
    role: "Managing Partner & Founder",
    description: "Architect with 3 years of experience in design",
    detailedBio: `I'm an architect with 3 years of experience in this field, and I genuinely enjoy the hands-on side of design, especially bringing ideas to life through thoughtful execution. I'm a naturally curious person, always exploring new tools, materials, and ways to improve what I do. I love turning creative concepts into practical, buildable solutions that are both smart and meaningful.`,
Architectural_Perspective:`
For me, architecture is all about creating smart, simple spaces that work well and feel good to live in. I'm drawn to designs that are minimalist, budget-friendly, and kind to the environment. I believe that with the right ideas and materials, we can build spaces that are both beautiful and practical, without overcomplicating things. Sometimes, the simplest designs speak the loudest—when they're made with care and purpose.`
  },
  {
    id: 2,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.`,
Architectural_Perspective:`
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  },
    {
    id: 3,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.`,
Architectural_Perspective:`
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  },
    {
    id: 4,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.`,
Architectural_Perspective:`
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  },
    {
    id: 5,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.`,
Architectural_Perspective:`
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  }
])
</script>

