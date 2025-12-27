<template>
<div id="scroll-container" class="overflow-hidden">
  <div id="scroll-wrapper" ref="wrapper">

<!-- hero section -->
    <section class="scroll-section">
      <!-- container -->
      <div class="h-[125vh]  w-full relative">

        <!-- top solid block -->
        <div class="top-0 left-0 w-full h-[calc(20%)] bg-[#fff4ec]"></div>

        <!-- background image block -->
        <div class="bg-[url('/images/aboutus/hero_main.webp')] bg-cover bg-bottom h-[80%]"></div>

        <!-- foreground text -->
        <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center text-center w-[90%] md:w-[70%] lg:w-[50%] z-10"
          style="top: 20%;">

          <h1 class="absolute top-0 w-full text-center text-5xl md:text-7xl text-black font-serif font-extrabold tracking-widest uppercase drop-shadow-md leading-none -translate-y-[55%]">
            About Us
          </h1>

          <p class="text-base md:text-xl text-black font-medium leading-relaxed w-full px-4 drop-shadow-sm mt-[7vh]">
            At <span class="font-bold">Spacefurnio</span>, we are passionate about shaping spaces that reflect purpose,
            personality, and precision. We offer an integrated approach to architecture,
            construction, interior design, and custom furniture, making us a one-stop
            destination for complete spatial solutions. From drawing board to delivery,
            <br class="hidden md:block">
            <span class="font-bold">we handle everything!</span>
          </p>
        </div>      </div>
    </section>

    <section class="scroll-section relative w-full h-screen overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 bg-no-repeat bg-center bg-cover bg-[url('/images/aboutus/2.png')]"></div>

      <!-- Overlay text (permanently placed inside curve) -->
      <div class="absolute text-center px-3 py-2 rounded-lg" :style="{
        left: '54.42%',
        top: '37.98%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgb(255, 244, 236)',
      }">
        <h2
          class="font-serif text-[clamp(0.8rem,1.6vw,1.3rem)] md:text-[clamp(1rem,2vw,1.6rem)] leading-snug text-gray-800">
          Where lines meet light,<br />
          and function meets soul,<br />
          you’ll find us –<br />
          blending vision with reality &<br />
          creativity with living.
        </h2>

        <p class="mt-2 text-[clamp(1rem,2vw,1.35rem)] text-gray-700 leading-snug">
          Every corner crafted.<br />
          Every piece with purpose.<br />
          Because your space deserves<br />
          more than structure,<br />
          <span class="font-script italic text-[clamp(0.8rem,1.6vw,1.3rem)] md:text-[clamp(1rem,2vw,1.6rem)] font-bold">it
            deserves a story.</span>
        </p>
      </div>


      <!-- Left side rotated label -->
      <div class="relative h-[calc(100vh+109.5px)] w-full">
        <div
          class="phitagate-font text-black font-semibold text-[19vh] absolute left-0 top-1/2 whitespace-nowrap origin-top-left"
          :style="{ transform: `rotate(-90deg) translateY(${brandManifestoTranslateY}) translateX(-44%)` }">
          Brand Manifesto
        </div>
      </div>


    </section>
    <section class="scroll-section relative w-full h-screen overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 bg-no-repeat bg-center bg-cover bg-[url('/images/aboutus/3.png')]"></div>

      <!-- Overlay text (permanently placed inside curve) -->
      <div class="absolute text-center px-3 py-2 rounded-lg" :style="{
        left: '45%',
        top: '67%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgb(255, 244, 236)',
      }">
        <h2
          class="font-serif text-[clamp(1rem,2vw,1.5rem)] md:text-[clamp(1.2rem,2.5vw,2rem)] leading-snug text-gray-800">
          At <span class="font-bold">Spacefurnio</span>,<br />
          we believe that great design is where<br />
          <span class="font-script italic">creativity meets living.</span>
        </h2>

        <p class="mt-3 text-[clamp(0.9rem,1.8vw,1.25rem)] text-gray-700 leading-snug">
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
      <div class="relative h-[calc(100vh)] w-full">
        <div class="phitagate-font text-black font-semibold absolute right-0 top-1/2 whitespace-nowrap origin-top-right"
          :style="{ transform: `rotate(90deg) translateY(${missionStatementTranslateY}) translateX(50%)`, fontSize: '17.5vh' }">
          Mission Statement
        </div>
      </div>
    </section>
    <div class="scroll-section h-screen w-full relative">

      <!-- top solid block -->
      <div class="top-0 left-0 w-full h-3/10 bg-[#e2e2e2]"></div>

      <!-- background image block -->
      <div class="!bg-[#fff4ec] h-7/10"></div>

      <!-- foreground text -->
      <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center text-center px-4"
        style="     top: calc(0.25 * 100%);">
        <h2 class="phitagate-font text-7xl font-bold mb-4 text-black">
          What we do?
        </h2>
        <div class="w-[75vw] mx-auto mt-7">
          <div class="flex flex-col md:flex-row justify-between items-start w-full gap-10">

            <!-- Left Side Image -->
            <div class="w-full md:w-1/2">
              <img src="https://placehold.co/500x350" alt="Dummy Image"
                class="w-full h-auto rounded-2xl shadow-lg object-cover" />
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
    <div class="team-section">

      <TeamMembers />

    </div>


  <section id="our-team" class="scroll-section our-team max-w-7xl mx-auto px-6 pt-28 md:pt-36 pb-16 scroll-mt-24 md:scroll-mt-36">
      <!-- Heading -->
      <div class="text-center mb-12">
        <h2 class="text-4xl md:text-5xl font-bold text-[#5A4A42] relative inline-block">
          Our Team
          <span class="block h-[2px] w-16 bg-[#5A4A42] mx-auto mt-4"></span>
        </h2>
      </div>

      <!-- Team list -->
      <ul class="grid grid-cols-2 md:grid-cols-3  gap-10">
        <li v-for="member in ourteam" :key="member.id" class="flex flex-col items-center text-center">
          <div v-if="member.image && !member.image.includes('placehold.co')" class="w-full h-40 md:h-44 lg:h-48 xl:h-52 rounded-lg shadow-lg overflow-hidden">
            <img :src="member.image" :alt="member.name" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-full h-40 md:h-44 lg:h-48 xl:h-52 bg-[#e8ddd4] rounded-lg shadow-lg flex items-center justify-center">
            <span class="text-4xl md:text-5xl font-bold text-[#5A4A42] font-serif">{{ getInitials(member.name) }}</span>
          </div>
          <div class="mt-4">
            <h3 class="text-lg font-medium text-gray-800">{{ member.name }}</h3>
            <p class="text-sm font-semibold text-[#5A4A42]">
              {{ member.role }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <section class="scroll-section max-w-6xl mx-auto px-6 py-16">
      <!-- Section Heading -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold text-[#5A4A42] relative inline-block">
          Our Clientele
          <span class="block h-[3px] w-20 bg-[#5A4A42] mx-auto mt-4"></span>
        </h2>
      </div>

      <!-- Clients Grid -->
      <div class="grid md:grid-cols-2 gap-16">
        <!-- Client 1 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-72 h-40 flex items-center justify-center bg-white shadow-lg rounded-xl">
            <img src="/images/aboutus/clients/zentrophy.png" alt="Zentropy Logo" class="max-h-28 object-contain" />
          </div>
          <!-- <p class="mt-6 text-lg text-gray-600">Mr. Shankar</p> -->
          <p class="text-xl font-semibold text-gray-900 mt-6">Zentropy Pvt. Ltd.</p>
        </div>

        <!-- Client 2 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-72 h-40 flex items-center justify-center bg-white shadow-lg rounded-xl">
            <img src="/images/aboutus/clients/gk.png" alt="Genius Kidz Logo" class="max-h-28 object-contain" />
          </div>
          <!-- <p class="mt-6 text-lg text-gray-600">Mr. Mohd Zaman</p> -->
          <p class="text-xl font-semibold text-gray-900 mt-6">Genius Kidz.ai</p>
        </div>
      </div>
    </section>
    <footer class="scroll-section ">
      <FooterComponent />
    </footer>
    </div>
  </div>


</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Dancing+Script:wght@500&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap");

.our-team {
  font-family: "Nunito Sans", sans-serif;
}

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

.font-playfair {
  font-family: 'Playfair Display', serif;
}

.font-inter {
  font-family: 'Inter', sans-serif;
}

/* Custom gradient for the background */
.gradient-bg {
  background: linear-gradient(180deg, #fff4ec 0%, #f5f1ed 50%, #e8ddd4 100%);
}

/* Text selection styling */
::selection {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>

<style scoped>
  #scroll-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
}
  body{
    overflow: hidden;
  }
</style>

<script setup>
import { ref,onMounted,onBeforeUnmount } from 'vue';
import { scroller } from './utills/customScroll';
import FooterComponent from '@/components/Footer-component.vue';
import TeamMembers from '@/components/about/TeamMembers.vue';

const wrapper = ref(null);

const brandManifestoTranslateY = ref('34.5%');
const missionStatementTranslateY = ref('26.6%');

const updateBrandManifestoPosition = () => {
  const width = window.innerWidth;
  // Brand Manifesto
  // Base: 1920px -> 34.5% (converted from 3.69vw)
  // Change: 40px -> 3.75% (converted from 0.4vw)
  const brandValue = 24 + (width - 1920) * (1.5 / 40);
  brandManifestoTranslateY.value = `${brandValue}%`;

  // Mission Statement
  // Base: 1920px -> 26.6%
  // Change: 40px -> 0.1%
  const missionValue = 26.6 + (width - 1920) * (1.2 / 40);
  missionStatementTranslateY.value = `${missionValue}%`;
};

onMounted(() => {
  const cleanup = scroller(wrapper, 'scroll-section')
  onBeforeUnmount(cleanup)

  updateBrandManifestoPosition();
  window.addEventListener('resize', updateBrandManifestoPosition);
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateBrandManifestoPosition);
})

const getInitials = (name) => {
  let cleanName = name.replace(/^(Ar\.|Mr\.|Ms\.|Mrs\.|Dr\.|Er\.)\s+/i, '');
  const parts = cleanName.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Team members data
const ourteam = [
  {
    id: 1,
    name: "Ar. Nagaraj",
    role: "Architect",
    image: "https://placehold.co/400x400",
  },
  {
    id: 2,
    name: "Mr. Gowtham",
    role: "Interior Designer",
    image: "https://placehold.co/400x400",
  },
  {
    id: 3,
    name: "Ms. Kaviya Arulthilagam",
    role: "Product Designer",
    image: "/images/aboutus/team-main/our-team/Kaviya.png",
  },
  {
    id: 4,
    name: "Rajkumar P",
    role: "Senior Civil Engineer",
    image: "https://placehold.co/400x400",
  },
  {
    id: 5,
    name: "Mr. Rajesh",
    role: "Fabrication Team Lead",
    image: "https://placehold.co/400x400",
  },
  {
    id: 6,
    name: "Mr. Madhan",
    role: "Structural Engineer",
    image: "https://placehold.co/400x400",
  },
];
</script>
