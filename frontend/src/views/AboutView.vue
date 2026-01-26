<template>
<div id="scroll-container" class="overflow-hidden">
  <div id="scroll-wrapper" ref="wrapper">

<!-- hero section -->
    <section class="scroll-section">
      <!-- container -->
      <div class="h-[100dvh] md:h-[125dvh] w-full relative">

        <!-- top solid block -->
        <div class="top-0 left-0 w-full h-[20%] bg-[#fff4ec]"></div>

        <!-- background image block -->
        <div class="h-[80%] w-full relative">
          <img src="/images/aboutus/hero/window.png" alt="" style="bottom:0; width:100%; height:100%; object-fit:cover; object-position:bottom;"/>
          <img src="/images/aboutus/hero/people.png" alt="" style="position: absolute; bottom: 0; inset-inline:0; margin:auto;"/>
        </div>

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
        </div>
      </div>
    </section>

      <section class="scroll-section relative w-full h-screen overflow-hidden">
        <div class="absolute inset-0 bg-no-repeat bg-center bg-cover bg-[url('/images/aboutus/2.png')]"></div>

        <!-- Overlay text (permanently placed inside curve) -->
        <div class="absolute text-center px-5 py-4 rounded-xl" :style="{
  left: '54.42%',
  top: '37.98%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'rgb(255, 244, 236)',
  width: 'max-content',
  maxWidth: '85%'
}">
  <h2
    class="font-serif leading-tight text-gray-900
    text-[clamp(1.1rem,3.5vw,1.5rem)]
    md:text-[clamp(1.4rem,2.5vw,2.2rem)]">
    Where lines meet light,<br />
    and function meets soul,<br />
    you’ll find us –<br />
    blending vision with reality &<br />
    creativity with living.
  </h2>

  <p class="mt-3 font-medium text-gray-800 leading-snug
    text-[clamp(0.95rem,2vw,1.3rem)]">
    Every corner crafted.<br />
    Every piece with purpose.<br />
    Because your space deserves<br />
    more than structure,<br />
    <span class="block mt-1 font-script italic font-extrabold text-gray-900
      text-[1.3em] leading-normal">
      it deserves a story.
    </span>
  </p>
</div>
        <div class="absolute top-[35%] left-1/2 "
              style="transform: translateX(calc(-35.41vw)); /* REPLACE -35.41 WITH YOUR MATH */"
            >
              <div class="phitagate-font text-black font-semibold text-[19vh] whitespace-nowrap origin-center brand-manifesto">
            Brand&#x20;Manifesto
          </div>
        </div>
    </section>

    <section class="scroll-section relative w-full h-screen overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 bg-no-repeat bg-center bg-cover bg-[url('/images/aboutus/3.png')]"></div>

      <div class="absolute text-center px-6 py-4 rounded-xl" :style="{
  left: '45%',
  top: '67%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'rgb(255, 244, 236)',
  width: 'max-content',
  maxWidth: '90%'
}">
  <h2
    class="font-serif leading-tight text-gray-900
    text-[clamp(1.1rem,4vw,1.6rem)]
    md:text-[clamp(1.5rem,2.5vw,2.5rem)]">
    At <span class="font-extrabold tracking-wide">Spacefurnio</span>,<br />
    we believe that great design is where<br />
    <span class="font-script italic font-bold text-[1.2em]">creativity meets living.</span>
  </h2>

  <p class="mt-4 font-medium text-gray-800 leading-snug
    text-[clamp(0.95rem,2vw,1.4rem)]">
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
      <div class="absolute top-[35%] right-1/2 " style="transform: translateX(calc(35.41vw)); /* REPLACE -35.41 WITH YOUR MATH */">
        <div class="phitagate-font text-black font-semibold text-[17vh] whitespace-nowrap origin-center mission-statement">
            Mission&#x20;Statement
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
  #scroll-container {
    /* YOUR EXACT DATA */
    --img-width: 3061;
    --img-height: 2168;
    --line-offset: -4; /* Taken from your "-4vw" code */

    /* AUTOMATIC CALCULATION */
    --img-ar: calc(var(--img-width) / var(--img-height));
  }

  /* DEFAULT: Screen is WIDER than image (Use VW) */
  .brand-manifesto {
    /* Matches your working code: translateX(calc(-50% - 4vw)) */
    transform: translateX(calc(-50% + (var(--line-offset) * 1vw))) rotate(-90deg);
  }

  /* MOBILE/NARROW: Screen is NARROWER than image (Switch to VH) */
  @media (max-aspect-ratio: 3061/2168) {
    .brand-manifesto {
      /* Calculates the width based on height to keep text pinned to the line */
      transform: translateX(calc(-50% + (var(--line-offset) * var(--img-ar) * 1vh))) rotate(-90deg);
    }
  }
  /* same calculations for mission-statement */
  .mission-statement {
    /* Matches your working code: translateX(calc(-50% - 4vw)) */
    transform: translateX(calc(0.5% - (-50% + (var(--line-offset) * 1vw)))) rotate(90deg);
  }

  /* MOBILE/NARROW: Screen is NARROWER than image (Switch to VH) */
  @media (max-aspect-ratio: 3061/2168) {
    .mission-statement {
      /* Calculates the width based on height to keep text pinned to the line */
      transform: translateX(calc(0.5% - (-50% + (var(--line-offset) * var(--img-ar) * 1vh)))) rotate(90deg);
    }
  }
  /* same calculations for mission-statement */

/* ELEGANT DESIGN with curved trails for narrow/tall screens */
  @media (max-aspect-ratio: 1816/1280) {
    /* Hide the original rotated text labels */
    .brand-manifesto {
      display: none;
    }
    .mission-statement {
      display: none;
    }
    
    /* ========== BRAND MANIFESTO SECTION ========== */
    .scroll-section:has(.brand-manifesto) {
      background: #f8f4f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Hide original background image */
    .scroll-section:has(.brand-manifesto) > div:first-child {
      display: none;
    }
    
    /* Curved trail - Top right flowing wave */
    .scroll-section:has(.brand-manifesto)::before {
      content: '';
      position: absolute;
      top: -10%;
      right: -20%;
      width: 80%;
      height: 60%;
      background: #b8aba3;
      border-radius: 0 0 0 100%;
      transform: rotate(-15deg);
      z-index: 1;
    }
    
    /* Curved trail - Bottom left flowing wave */
    .scroll-section:has(.brand-manifesto)::after {
      content: '';
      position: absolute;
      bottom: -15%;
      left: -25%;
      width: 90%;
      height: 50%;
      background: #c4b8b0;
      border-radius: 0 100% 0 0;
      transform: rotate(10deg);
      z-index: 1;
    }
    
    /* Content card positioning with rotated heading outside */
    .scroll-section:has(.brand-manifesto) > div:nth-child(2) {
      position: relative !important;
      left: auto !important;
      top: auto !important;
      transform: none !important;
      background: #f8f4f0 !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      border-radius: 20px !important;
      padding: 2.5rem 2rem !important;
      max-width: 80% !important;
      width: auto !important;
      z-index: 5;
      margin-top: 5vh;
      margin-left: 5.5rem; /* Increased margin to fit larger label */
      min-height: 50vh; /* Ensure height for label */
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    /* Improved text readability */
    .scroll-section:has(.brand-manifesto) > div:nth-child(2) h2 {
      font-size: clamp(1.2rem, 4vw, 1.8rem) !important;
      line-height: 1.4 !important;
    }
    
    .scroll-section:has(.brand-manifesto) > div:nth-child(2) p {
      font-size: clamp(0.95rem, 3.5vw, 1.3rem) !important;
      line-height: 1.6 !important;
      margin-top: 1rem !important;
    }
    
    /* Rotated heading on left side - positioned outside container */
    .scroll-section:has(.brand-manifesto) > div:nth-child(2)::before {
      content: 'Brand Manifesto';
      position: absolute;
      left: -3.25rem; /* Adjusted for mobile fit */
      top: 50%;
      transform: translateX(-50%) translateY(-50%) rotate(-90deg);
      transform-origin: center center;
      font-family: 'Phitagate', serif;
      font-size: clamp(2.5rem, 10vw, 4rem); /* Significantly Increased size */
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 0.08em;
      white-space: nowrap;
      z-index: 10;
      text-decoration: underline;
      text-decoration-color: #8b7355;
      text-decoration-thickness: 4px;
      text-underline-offset: 12px;
      background: transparent; 
       text-shadow: none;
    }
    
    /* Hide the original heading container div */
    .scroll-section:has(.brand-manifesto) > div:nth-child(3) {
      display: none !important;
    }
    
    /* ========== MISSION STATEMENT SECTION ========== */
    .scroll-section:has(.mission-statement) {
      background: #f8f4f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Hide original background image */
    .scroll-section:has(.mission-statement) > div:first-child {
      display: none;
    }
    
    /* Curved trail - Top left flowing wave */
    .scroll-section:has(.mission-statement)::before {
      content: '';
      position: absolute;
      top: -15%;
      left: -20%;
      width: 85%;
      height: 55%;
      background: #c4b8b0;
      border-radius: 0 0 100% 0;
      transform: rotate(12deg);
      z-index: 1;
    }
    
    /* Curved trail - Bottom right flowing wave */
    .scroll-section:has(.mission-statement)::after {
      content: '';
      position: absolute;
      bottom: -20%;
      right: -25%;
      width: 95%;
      height: 55%;
      background: #b8aba3;
      border-radius: 100% 0 0 0;
      transform: rotate(-8deg);
      z-index: 1;
    }
    
    /* Content card positioning with rotated heading outside */
    .scroll-section:has(.mission-statement) > div:nth-child(2) {
      position: relative !important;
      left: auto !important;
      top: auto !important;
      transform: none !important;
      background: #f8f4f0 !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      border-radius: 20px !important;
      padding: 2.5rem 2rem !important;
      max-width: 80% !important;
      width: auto !important;
      z-index: 5;
      margin-top: 5vh;
      margin-left: 5.5rem; /* Increased margin */
      min-height: 50vh; /* Ensure height */
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    /* Improved text readability */
    .scroll-section:has(.mission-statement) > div:nth-child(2) h2 {
      font-size: clamp(1.2rem, 4vw, 1.8rem) !important;
      line-height: 1.4 !important;
    }
    
    .scroll-section:has(.mission-statement) > div:nth-child(2) p {
      font-size: clamp(0.95rem, 3.5vw, 1.3rem) !important;
      line-height: 1.6 !important;
      margin-top: 1rem !important;
    }
    
    /* Rotated heading on left side - positioned outside container */
    .scroll-section:has(.mission-statement) > div:nth-child(2)::before {
      content: 'Mission Statement';
      position: absolute;
      left: -3.25rem; /* Adjusted for mobile fit */
      top: 50%;
      transform: translateX(-50%) translateY(-50%) rotate(-90deg);
      transform-origin: center center;
      font-family: 'Phitagate', serif;
      font-size: clamp(2.5rem, 10vw, 4rem); /* Significantly Increased size */
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 0.08em;
      white-space: nowrap;
      z-index: 10;
      text-decoration: underline;
      text-decoration-color: #8b7355;
      text-decoration-thickness: 4px;
      text-underline-offset: 12px;
      /* Remove box styling for cleaner large text */
       background: transparent;
       text-shadow: none;
    }
    
    /* Hide the original heading container div */
    .scroll-section:has(.mission-statement) > div:nth-child(3) {
      display: none !important;
    }
  }
</style>

<style scoped>
  /* #scroll-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
}
body{
  overflow: hidden;
} */
</style>

<script setup>
import { ref,onMounted,onBeforeUnmount } from 'vue';
import { scroller } from '../utills/customScroll';
import FooterComponent from '@/components/Footer-component.vue';
import TeamMembers from '@/components/about/TeamMembers.vue';

const wrapper = ref(null);


// onMounted(() => {
//   const cleanup = scroller(wrapper, 'scroll-section')
//   onBeforeUnmount(cleanup)
// })

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
