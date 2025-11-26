<template>
  <section class="team-section bg-[#f4f2ed] min-h-screen" aria-label="Meet the Team">

    <div
      v-for="(person, index) in team"
      :key="person.id"
      class="scroll-section team-member-block min-h-screen flex items-center "
    >
    <div class="max-w-[1400px] mx-auto px-6 sm:px-12 relative">

        <!-- Page heading displayed once below the navbar -->
        <!-- <div v-if="index === 0" class="pb-10 sm:pt-6 sm:pb-12">
                  <div class="text-center mb-12">
                    <h2 class="text-4xl md:text-5xl font-bold text-[#5A4A42] relative inline-block">
                      Our Team
                      <span class="block h-[2px] w-16 bg-[#5A4A42] mx-auto mt-4"></span>
                    </h2>
                  </div>
        </div> -->

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-16 items-start">

          <div :class="['lg:col-span-6 relative flex flex-col', index % 2 === 1 ? 'lg:order-2' : 'lg:order-1']">

            <div class="relative w-full">
              <!-- HELLO text positioned half inside/half outside at top -->
              <h2
                class="z-10 font-serif text-6xl sm:text-8xl text-gray-800 leading-none absolute select-none"
                style="top: 0px;
                left: -5.3rem;
                transform: translateY(-53%);"
                aria-hidden="true"
              >
                HELLO.
              </h2>

              <div class="w-full max-w-md lg:max-w-lg overflow-hidden bg-gray-300">
                <img
                  :src="person.image || defaultImage(person.id)"
                  :alt="person.name"
                  class="w-full h-auto max-h-[500px] lg:max-h-[550px] object-cover object-center filter transition-all duration-700 ease-in-out"
                  loading="lazy"
                />
              </div>

              <!-- Name and role positioned at bottom-right: name half in/out, role below image -->
              <div class="mt-8 lg:mt-0 text-left lg:text-right lg:absolute z-10" style="bottom: 0; right: 1rem;" :style="{ transform: index===0?'translateY(70%) translateX(-10px)':'translateY(75%) translateX(-10px)' }">
                <h1 class="font-serif text-4xl sm:text-5xl md:text-6xl text-gray-900 leading-none mb-2 whitespace-nowrap">
                  I'M <span class="text-gray-800">{{ person.nickname || firstName(person.name) }}</span>
                </h1>
                <div class="text-xs sm:text-sm font-bold tracking-[0.2em] text-gray-600 uppercase flex flex-col items-start lg:items-end space-y-1">
                  <span >
                    {{ person.name }}
                  </span>
                  <span v-for="(rolePart, i) in splitRole(person.role)" :key="i">
                    {{ rolePart }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div :class="['lg:col-span-5 flex flex-col justify-center h-full space-y-8', index % 2 === 1 ? 'lg:order-1' : 'lg:order-2']">

  <div class="prose prose-lg max-w-none text-gray-700 font-light leading-relaxed">
    <p class="whitespace-pre-line">{{ person.detailedBio }}</p>
  </div>

  <div v-if="person.Architectural_Perspective" class="pt-4">
    <h4 class="font-bold text-gray-900 text-lg mb-3 font-serif tracking-wide">Architectural Perspective:</h4>
    <p class="text-gray-700 italic pl-6 border-l-2 border-gray-400 leading-relaxed font-light">
      "{{ person.Architectural_Perspective }}"
    </p>
  </div>

  <!-- <div class="flex gap-6 pt-6">
    <a href="#" class="text-gray-400 hover:text-gray-900 transition-colors duration-300">
      <span class="sr-only">Facebook</span>
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"/>
      </svg>
    </a>
    <a href="#" class="text-gray-400 hover:text-gray-900 transition-colors duration-300">
      <span class="sr-only">Instagram</span>
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.48 2h.165zm-1.92 6.29A2.32 2.32 0 119.3 9.38a2.32 2.32 0 011.095-1.09z" clip-rule="evenodd"/>
      </svg>
    </a>
  </div> -->

</div>

        </div>
        <div v-if="index < team.length - 1" class="absolute bottom-0 left-6 right-6 h-px bg-gray-300 lg:hidden"></div>
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
</style>
