<template>
  <section class="team-section bg-[#f4f2ed] min-h-screen" aria-label="Meet the Team">

    <!-- Desktop/Large Screen Layout (lg and up) -->
    <div
      v-for="person in team"
      :key="person.id"
      class="scroll-section team-member-block min-h-screen hidden lg:flex items-center justify-center"
    >
      <div class="team-content-wrapper w-full mx-auto relative">

        <div class="team-grid items-center">

          <div class="image-column relative flex flex-col">

            <div class="relative w-full">
              <!-- HELLO text positioned half inside/half outside at top -->
              <h2
                class="hello-text z-10 font-serif text-black bg-clip-text leading-none absolute select-none"
                aria-hidden="true"
              >
                HELLO,
              </h2>

              <div class="photo-frame inline-block w-full overflow-hidden bg-white border border-gray-200 shadow-lg">
                <img
                  :src="person.image || defaultImage(person.id)"
                  :alt="person.name"
                  class="team-photo w-full h-auto object-cover object-center filter transition-all duration-700 ease-in-out"
                  loading="lazy"
                />
              </div>

              <!-- Name and role positioned at bottom-right: name half in/out, role below image -->
              <div class="name-block absolute z-10 text-right">
                <h1 class="name-title font-serif leading-none mb-2 whitespace-nowrap">
                  <span class="text-black">I'M</span> <span>{{ person.nickname.toUpperCase() || firstName(person.name) }}</span>
                </h1>
                <div class="role-text font-bold tracking-[0.2em] text-black uppercase flex flex-col space-y-1 items-end">
                  <span>{{ person.name }}</span>
                  <span v-for="(rolePart, i) in splitRole(person.role)" :key="i">
                    {{ rolePart }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="content-column flex flex-col justify-center h-full">
            <div class="bio-text prose max-w-none text-black font-light leading-relaxed">
              <p class="whitespace-pre-line">{{ person.detailedBio }}</p>
            </div>

            <div v-if="person.Architectural_Perspective" class="perspective-section">
              <h4 class="perspective-title font-bold font-serif tracking-wide text-black">Architectural Perspective:</h4>
              <p class="perspective-quote text-black-900 italic border-l-2 border-orange-300 leading-relaxed font-light">
                "{{ person.Architectural_Perspective }}"
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Mobile/Tablet Layout (below lg) -->
   <div v-if="false">
      <div
        v-for="person in team"
        :key="'mobile-' + person.id"
        class="team-member-block-mobile lg:hidden min-h-screen flex flex-col"
      >
        <!-- Full viewport card layout for mobile -->
        <div class="flex-1 flex flex-col">
          <!-- Image section - takes up about 45% of viewport -->
          <div class="relative h-[45vh] overflow-hidden">
            <img
              :src="person.image || defaultImage(person.id)"
              :alt="person.name"
              class="w-full h-full object-cover object-[center_20%]"
              loading="lazy"
            />
            <!-- Name overlay on image -->
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 sm:p-6">
              <h2 class="font-serif text-3xl sm:text-4xl text-white leading-tight">
                I'M {{ person.nickname.toUpperCase() || firstName(person.name) }}
              </h2>
              <p class="text-white/90 text-sm sm:text-base font-bold tracking-wider uppercase mt-2">
                {{ person.name }}
              </p>
            </div>
          </div>

          <!-- Content section - fills remaining space -->
          <div class="flex-1 p-5 sm:p-8 overflow-y-auto bg-white">
            <!-- Role badges -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="(rolePart, i) in splitRole(person.role)"
                :key="i"
                class="text-xs font-semibold tracking-wide uppercase bg-[#f4f2ed] text-gray-700 px-3 py-1.5 rounded-full"
              >
                {{ rolePart }}
              </span>
            </div>

            <!-- Bio -->
            <p class="text-gray-700 text-sm sm:text-base leading-relaxed mb-5">
              {{ person.detailedBio }}
            </p>

            <!-- Architectural Perspective -->
            <div v-if="person.Architectural_Perspective">
              <h4 class="font-bold text-sm sm:text-base font-serif tracking-wide text-black mb-2">Architectural Perspective:</h4>
              <p class="text-gray-600 text-sm sm:text-base italic pl-4 border-l-2 border-orange-300 leading-relaxed">
                "{{ person.Architectural_Perspective }}"
              </p>
            </div>
          </div>
        </div>
      </div>
   </div>

  </section>
</template>

<script setup>
import { ref } from 'vue'

const teamMembers =[
  {
    id: 1,
    name: "Ar. Thaini Jentra",
    nickname: "Jeni",
    role: "Founder & Managing Partner",
    description: "Architect with 3 years of experience in this field",
    detailedBio: `I'm an architect with 3 years of experience in this field, and I genuinely enjoy the hands-on side of design, especially bringing ideas to life through thoughtful execution. I'm a naturally curious person, always exploring new tools, materials, and ways to improve what I do. I love turning creative concepts into practical, buildable solutions that are both smart and meaningful.`,
    Architectural_Perspective: `For me, architecture is all about creating smart, simple spaces that work well and feel good to live in. I’m drawn to designs that are minimalist, budget-friendly, and kind to the environment. I believe that with the right ideas and materials, we can build spaces that are both beautiful and practical, without overcomplicating things. Sometimes, the simplest designs speak the loudest—when they’re made with care and purpose.`,
    image: "/images/aboutus/team-main/jentra.png"
  },
  {
    id: 2,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for driving business growth through strategic financial planning",
    detailedBio: `I’m an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we’re on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.`,
    Architectural_Perspective: `I don’t come from an architecture background, but I’ve always been fascinated by the way spaces make us feel. To me, architecture isn’t just about buildings or blueprints—it’s about stories. Every wall, every window, every curve has a purpose, even if you don’t see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It’s like listening to a song in a language you don’t speak—you may not know every word, but you feel its meaning.`,
    image: "/images/aboutus/team-main/jenita.png"
  },
  {
    id: 3,
    name: "Peter Cintra R",
    nickname: "Cintra",
    role: "Co-Founder & HR Executive",
    description: "CA Finalist with a passion for supporting growing businesses through strategic guidance",
    detailedBio: `I’m a CA Finalist with a passion for supporting growing businesses through strategic guidance by bringing a blend of analytical thinking and real-world experience. My journey blends people, purpose, and strategy. At Spacefurnio, I wear many hats — from keeping the team motivated and connected, to shaping how the world sees us. As the HR head, I’m all about creating a positive, driven work culture and helping bring our brand’s voice to life.`,
    Architectural_Perspective: `As an outsider in the field of architecture, I see architecture as the art of creating meaningful spaces within real-world limits. It's not just about aesthetics — it’s about smart, sustainable choices that balance beauty, function, and budget. Great architecture, to me, is where creativity meets constraint, and still manages to feel effortless.`,
    image: "/images/aboutus/team-main/cintra.png"
  },
  {
    id: 4,
    name: "Ar. Srimonisha",
    nickname: "Monisha",
    role: "Co-Founder & Design Lead",
    description: "Architect and the Design Lead at Spacefurnio, shaping products with a balance of function and aesthetics",
    detailedBio: `I’m an architect and the Design Lead at Spacefurnio, where I shape every product with a balance of function and aesthetics. My journey began with sketches in the margins of my notebooks and has grown into creating purposeful spaces that fulfill both design intent and functional needs. From the first line I draw, my focus is clear — to capture every requirement with precision and embed it into our work, ensuring the foundation of every project is laid right from the very beginning.`,
    Architectural_Perspective: `To me, architecture is more than design — it is the art of translating dreams into spaces that tell stories and serve a purpose. It begins with listening — to people, to place, and to intent. I see it as a soulful practice where emotion, function, and aesthetics come together in harmony. True architecture is not just admired; it is felt, lived in, and cherished — evolving with the lives it touches.`,
    image: "/images/aboutus/team-main/monisha.png"
  }
]

const team = ref(teamMembers)

function defaultImage(id) {
  // Using a professional, slightly desaturated placeholder style
  return `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1000&q=80&ixlib=rb-4.0.3&sig=${id}`
}

function firstName(full) {
  return full?.split(' ')[0] ?? full
}

// Helper to split roles into separate lines for stacking
function splitRole(roleString) {
  if (!roleString) return []
  // Splits by ' & ' or similar delimiters. Adjust regex as needed for your data.
  return roleString.split(/\s+&\s+|\s+,\s+/).map(s => s.trim())
}
</script>

<style scoped>
/* IMPORTANT: For this design to work correctly, you must have a serif font
  like 'Playfair Display' or 'Merriweather' imported in your main index.html file.
  Example:
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
*/

.font-serif {
  font-family: 'Playfair Display', serif; /* Fallback to any available serif */
}

/* Ensure smooth font rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* =====================================================
   RESPONSIVE SCALING SYSTEM
   Reference viewport: 1920px x 927px
   All values are calculated as proportions of 1920px
   ===================================================== */

/* Base scale factor - everything scales relative to 1920px */
:root {
  --base-width: 1920;
  --scale: calc(100vw / var(--base-width));
}

/* Content wrapper - scales max-width proportionally */
.team-content-wrapper {
  max-width: calc(1400 * var(--scale));
  padding-left: calc(117 * var(--scale)); /* 6.1vw at 1920 = ~117px */
  padding-right: calc(117 * var(--scale));
}

/* Grid layout */
.team-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(64 * var(--scale)); /* lg:gap-x-16 = 64px */
}

.image-column {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* HELLO text - scales with viewport */
.hello-text {
  top: 0;
  left: calc(56 * var(--scale)); /* 3.5rem = 56px */
  transform: translateY(23.6%);
  font-size: calc(59.52 * var(--scale)); /* 3.1vw at 1920 = 59.52px */
}

/* Photo frame - padding scales proportionally */
.photo-frame {
  max-width: calc(512 * var(--scale)); /* lg:max-w-lg = 512px */
  padding: calc(45 * var(--scale)) calc(45 * var(--scale)) calc(137 * var(--scale));
}

/* Team photo */
.team-photo {
  max-height: calc(550 * var(--scale)); /* lg:max-h-[550px] */
}

/* Name block positioning - aligned to photo frame's right edge */
.name-block {
  bottom: 0;
  right: calc(45 * var(--scale)); /* Match photo-frame's right padding */
  transform: translateY(-13%);
}

/* Name title */
.name-title {
  font-size: calc(53.76 * var(--scale)); /* 2.8vw at 1920 = 53.76px */
}

/* Role text */
.role-text {
  font-size: calc(14 * var(--scale)); /* sm:text-sm = 14px */
}

/* Content column */
.content-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  gap: calc(32 * var(--scale)); /* space-y-8 = 32px */
}

/* Bio text */
.bio-text {
  font-size: calc(18 * var(--scale)); /* prose-lg base = 18px */
  line-height: 1.75;
}

/* Perspective section */
.perspective-section {
  padding-top: calc(16 * var(--scale)); /* pt-4 = 16px */
}

.perspective-title {
  font-size: calc(18 * var(--scale)); /* text-lg = 18px */
  margin-bottom: calc(12 * var(--scale)); /* mb-3 = 12px */
}

.perspective-quote {
  padding-left: calc(24 * var(--scale)); /* pl-6 = 24px */
  font-size: calc(16 * var(--scale));
}

/* =====================================================
   BREAKPOINT ADJUSTMENTS
   Ensure minimum readability at smaller large screens
   ===================================================== */

/* For screens between 1024px and 1440px - slight adjustments */
@media (min-width: 1024px) and (max-width: 1440px) {
  .team-content-wrapper {
    max-width: 95%;
    padding-left: 4vw;
    padding-right: 4vw;
  }

  .team-grid {
    gap: 3vw;
  }

  .hello-text {
    font-size: 3.1vw;
    left: 3vw;
  }

  .photo-frame {
    max-width: 100%;
    padding: 2.5vw 2.5vw 7vw;
  }

  .team-photo {
    max-height: 30vw;
  }

  .name-block {
    right: 2.5vw; /* Match photo-frame's right padding */
    transform: translateY(-13%);
  }

  .name-title {
    font-size: 3vw;
  }

  .role-text {
    font-size: 0.75vw;
  }

  .bio-text {
    font-size: 1vw;
  }

  .perspective-title {
    font-size: 1vw;
  }

  .perspective-quote {
    font-size: 0.9vw;
    padding-left: 1.25vw;
  }

  .content-column {
    gap: 1.5vw;
  }

  .perspective-section {
    padding-top: 0.8vw;
  }
}

/* For screens 1441px to 1919px */
@media (min-width: 1441px) and (max-width: 1919px) {
  .team-content-wrapper {
    max-width: calc(1400px * (100vw / 1920px));
    padding-left: 6.1vw;
    padding-right: 6.1vw;
  }

  .hello-text {
    font-size: 3.1vw;
    left: 3.5rem;
  }

  .photo-frame {
    max-width: calc(512px * (100vw / 1920px));
    padding: calc(45px * (100vw / 1920px)) calc(45px * (100vw / 1920px)) calc(137px * (100vw / 1920px));
  }

  .team-photo {
    max-height: calc(550px * (100vw / 1920px));
  }

  .name-title {
    font-size: 2.8vw;
  }

  .role-text {
    font-size: calc(14px * (100vw / 1920px));
  }

  .bio-text {
    font-size: calc(18px * (100vw / 1920px));
  }

  .perspective-title {
    font-size: calc(18px * (100vw / 1920px));
  }

  .perspective-quote {
    font-size: calc(16px * (100vw / 1920px));
  }
}

/* For screens 1920px and above - use exact pixel values */
@media (min-width: 1920px) {
  .team-content-wrapper {
    max-width: 1400px;
    padding-left: 117px;
    padding-right: 117px;
  }

  .team-grid {
    gap: 64px;
  }

  .hello-text {
    font-size: 59.52px;
    left: 56px;
  }

  .photo-frame {
    /* max-width: 512px; */
    padding: 45px 45px 137px;
  }

  .team-photo {
    max-height: 550px;
  }

  .name-block {
    right: 45px; /* Match photo-frame's right padding */
    transform: translateY(-13%);
  }

  .name-title {
    font-size: 53.76px;
  }

  .role-text {
    font-size: 14px;
  }

  .content-column {
    gap: 32px;
  }

  .bio-text {
    font-size: 18px;
  }

  .perspective-section {
    padding-top: 16px;
  }

  .perspective-title {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .perspective-quote {
    padding-left: 24px;
    font-size: 16px;
  }
}

/* For very large screens (2K, 4K) - scale up proportionally */
@media (min-width: 2560px) {
  .team-content-wrapper {
    max-width: calc(1400px * (100vw / 1920px));
    padding-left: calc(117px * (100vw / 1920px));
    padding-right: calc(117px * (100vw / 1920px));
  }

  .team-grid {
    gap: calc(64px * (100vw / 1920px));
  }

  .hello-text {
    font-size: calc(59.52px * (100vw / 1920px));
    left: calc(56px * (100vw / 1920px));
  }

  .photo-frame {
    max-width: calc(512px * (100vw / 1920px));
    padding: calc(45px * (100vw / 1920px)) calc(45px * (100vw / 1920px)) calc(137px * (100vw / 1920px));
  }

  .team-photo {
    max-height: calc(550px * (100vw / 1920px));
  }

  .name-block {
    right: calc(45px * (100vw / 1920px)); /* Match photo-frame's right padding */
    transform: translateY(-13%);
  }

  .name-title {
    font-size: calc(53.76px * (100vw / 1920px));
  }

  .role-text {
    font-size: calc(14px * (100vw / 1920px));
  }

  .content-column {
    gap: calc(32px * (100vw / 1920px));
  }

  .bio-text {
    font-size: calc(18px * (100vw / 1920px));
  }

  .perspective-section {
    padding-top: calc(16px * (100vw / 1920px));
  }

  .perspective-title {
    font-size: calc(18px * (100vw / 1920px));
    margin-bottom: calc(12px * (100vw / 1920px));
  }

  .perspective-quote {
    padding-left: calc(24px * (100vw / 1920px));
    font-size: calc(16px * (100vw / 1920px));
  }
}

/* Mobile card styling */
.team-member-block-mobile {
  min-height: auto;
}
</style>
