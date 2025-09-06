<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden w-full h-full">
      <!-- Background Image -->
      <div class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="background-image: url('images/11zon_compressed/f6_2_11zon.png')" data-aos="zoom-in"
        data-aos-duration="1200"></div>

      <!-- Gradient Overlay for better readability -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>

      <!-- Content -->
      <div class="relative z-10 max-w-4xl px-6 sm:px-8 lg:px-12 text-center flex flex-col justify-center min-h-screen">
        <!-- Heading -->
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-wide
      bg-gradient-to-r from-gray-200 via-gray-300 to-gray-100 bg-clip-text text-transparent
      drop-shadow-[0_2px_6px_rgba(26,29,43,0.7)]" data-aos="fade-up" data-aos-duration="1000">
          ABOUT US
        </h1>

        <!-- Paragraph with frosted-text effect -->
        <p class="relative text-lg sm:text-xl md:text-2xl leading-relaxed font-medium font-inter
      text-gray-200 drop-shadow-[0_1px_4px_rgba(26,29,43,0.6)]" data-aos="fade-up" data-aos-duration="1200"
          data-aos-delay="200">
          <span class="relative z-10">
            At Spacefurnio, we are passionate about shaping spaces that reflect purpose, personality, and precision.
            We offer an integrated approach to architecture, construction, interior design, and custom furniture,
            making us a one-stop destination for complete spatial solutions. From drawing board to delivery,
            <span class="font-bold">we handle everything!</span>
          </span>

          <!-- Blurred aura behind the text -->
          <span class="absolute inset-0 blur-md opacity-30 text-white" aria-hidden="true">
            At Spacefurnio, we are passionate about shaping spaces that reflect purpose, personality, and precision.
            We offer an integrated approach to architecture, construction, interior design, and custom furniture,
            making us a one-stop destination for complete spatial solutions. From drawing board to delivery,
            we handle everything!
          </span>
        </p>
      </div>

      <!-- Mobile bottom gradient -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent sm:hidden"></div>
    </section>

    <section class="py-4 px-4 bg-[rgba(253,243,232,255)]"></section>

    <!-- Our Story Section -->
    <section class="bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
      <img src="/images/aboutus/image-2.jpg" alt="Our Story" class="w-full h-full object-cover object-center"
        data-aos="zoom-in" data-aos-duration="1200" />
    </section>

    <!-- Brand Manifesto Section -->
    <section class="py-4 px-4 bg-[rgba(253,243,232,255)]">

    </section>
    <!-- Mission & Values Section -->
    <section class="bg-white">
      <img src="/images/aboutus/image-3.jpg" alt="Mission & Values" class="w-full h-full object-cover object-center"
        data-aos="zoom-in" data-aos-duration="1200" />
    </section>


    <!-- Team Section -->
    <section class="py-20 px-6 bg-gradient-to-br from-orange-50 to-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Meet Our Experts</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-3 tracking-tight">
            <span
              class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              Our Team
            </span>
          </h2>
          <div class="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-6 rounded-full"></div>
          <p class="text-lg text-gray-600 mt-6 max-w-2xl mx-auto">
            The talented individuals behind our innovative designs and exceptional craftsmanship.
          </p>
        </div>

        <!-- Team Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="(member, index) in teamMembers"
     :key="index"
     data-aos="fade-up"
     :data-aos-delay="100 * index">

            <div class="team-card-wrapper relative" @mouseenter="handleMouseEnter(member.id)"
              @mouseleave="handleMouseLeave">
              <!-- Card -->
              <div
                class="group relative bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl">
                <!-- Card Top with Pattern -->
                <div class="h-32 bg-gradient-to-r from-orange-400 to-orange-500 relative overflow-hidden">
                  <div class="absolute inset-0 opacity-10">
                    <div class="absolute top-0 left-0 w-full h-full bg-repeat"
                      style="background-image: url('data:image/svg+xml;base64,PHN2ZyB...'); background-size: 20px 20px;">
                    </div>
                  </div>
                </div>

                <!-- Profile Image -->
                <div class="flex justify-center -mt-12 relative z-10">
                  <div class="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                    <div
                      class="w-full h-full rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                      <div class="w-12 h-12 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                <!-- Card Content -->
                <div class="p-6 pt-4 text-center">
                  <h3 class="text-xl font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                    {{ member.name }}
                  </h3>
                  <p class="text-orange-500 font-medium text-sm uppercase tracking-wider mb-3">
                    {{ member.role }}
                  </p>
                  <p class="text-gray-600 text-sm leading-relaxed">
                    {{ member.description }}
                  </p>

                  <!-- Social Links -->
                  <div
                    class="flex justify-center space-x-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <!-- socials -->
                  </div>
                </div>
              </div>

              <!-- Detailed Tooltip -->
              <div v-show="hoveredMember === member.id"
                class="absolute z-50 w-[500px] bg-white rounded-xl shadow-2xl border border-orange-100 overflow-hidden"
                :class="getTooltipPosition(member.id)" data-aos="fade-up">
                <div class="flex flex-col md:flex-row h-full">
                  <!-- Left side -->
                  <div
                    class="w-full md:w-1/3 bg-gradient-to-br from-orange-100 to-orange-200 flex flex-col items-center justify-center p-6">
                    <div class="mb-4 text-center">
                      <div class="w-32 h-32 rounded-full bg-white p-2 shadow-lg mx-auto mb-4">
                        <div
                          class="w-full h-full rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center">
                          <span class="text-white text-3xl font-bold">{{ getInitials(member.name) }}</span>
                        </div>
                      </div>
                      <h3 class="text-lg font-bold text-gray-900">{{ member.name }}</h3>
                      <p class="text-orange-600 font-medium text-sm uppercase tracking-wider">{{ member.role }}</p>
                    </div>
                  </div>

                  <!-- Right side -->
                  <div class="w-full md:w-2/3 p-6 overflow-y-auto max-h-[400px] custom-scrollbar">
                    <div class="prose prose-sm max-w-none">
                      <div class="whitespace-pre-line text-gray-700 leading-relaxed"
                        v-html="formatBio(member.detailedBio)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="py-20 px-4 bg-gradient-to-r from-orange-500 to-orange-600">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-light text-white mb-6" data-aos="fade-up">
          Ready to Transform Your Space?
        </h2>
        <p class="text-xl text-orange-100 mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          Discover our collection and find the perfect pieces that reflect your style and personality.
        </p>
        <div class="flex flex-col sm:flex-row justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
          <button
            class="px-8 py-3 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors duration-300 shadow-md"
            @click="() => window.location.href = '/shop'">
            Explore Our Collection
          </button>
          <button
            class="px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-300"
            @click="() => window.location.href = '/shop'">
            Contact Our Team
          </button>
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import AOS from 'aos'
import 'aos/dist/aos.css'

// Team members data
const teamMembers = ref([
  {
    id: 1,
    name: "Ar. Thaini Jentra",
    nickname: "Jeni",
    role: "Managing Partner & Founder",
    description: "Architect with 3 years of experience in design",
    detailedBio: `Hello, I'm Jeni

I'm an architect with 3 years of experience in this field, and I genuinely enjoy the hands-on side of design, especially bringing ideas to life through thoughtful execution. I'm a naturally curious person, always exploring new tools, materials, and ways to improve what I do. I love turning creative concepts into practical, buildable solutions that are both smart and meaningful.

Architectural Perspective:
For me, architecture is all about creating smart, simple spaces that work well and feel good to live in. I'm drawn to designs that are minimalist, budget-friendly, and kind to the environment. I believe that with the right ideas and materials, we can build spaces that are both beautiful and practical, without overcomplicating things. Sometimes, the simplest designs speak the loudest—when they're made with care and purpose.`
  },
  {
    id: 2,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `Hello, I'm Jeffy

I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.

Architectural Perspective:
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  },
    {
    id: 3,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `Hello, I'm Jeffy

I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.

Architectural Perspective:
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  },
    {
    id: 4,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `Hello, I'm Jeffy

I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.

Architectural Perspective:
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  },
    {
    id: 5,
    name: "J. Jeffrina",
    nickname: "Jeffy",
    role: "Co-Founder & Financial Manager",
    description: "MBA graduate with a passion for business growth",
    detailedBio: `Hello, I'm Jeffy

I'm an MBA graduate with a passion for driving business growth through strategic financial planning. As the Co-Founder of our startup, I oversee financial operations, manage investments, and ensure we're on a path to sustainable success. My journey combines academic excellence with hands-on experience, allowing me to turn numbers into actionable insights that shape our future.

Architectural Perspective:
I don't come from an architecture background, but I've always been fascinated by the way spaces make us feel. To me, architecture isn't just about buildings or blueprints—it's about stories. Every wall, every window, every curve has a purpose, even if you don't see it at first. I approach it with the eyes of an outsider, which I think is my strength. Technical rules do not bind me; I see the beauty, the emotion, and the human experience behind the structures. It's like listening to a song in a language you don't speak—you may not know every word, but you feel its meaning.`
  }
])

// State for tooltip
const hoveredMember = ref(null)
const tooltipTimeout = ref(null)

// Handle mouse enter with immediate show
const handleMouseEnter = (memberId) => {
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
    tooltipTimeout.value = null
  }
  hoveredMember.value = memberId
}

// Handle mouse leave with delay
const handleMouseLeave = () => {
  tooltipTimeout.value = setTimeout(() => {
    hoveredMember.value = null
  }, 300) // 300ms delay before hiding
}

watch(hoveredMember, (newVal) => {
  console.log("hoveredMember changed:", newVal);
});

// Format bio text for better display
const formatBio = (bio) => {
  return bio.replace(/\n\n/g, '</p><p class="mt-4">')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p>Architectural Perspective:<\/p>/g, '<h4 class="font-semibold text-orange-600 mt-6 mb-2">Architectural Perspective:</h4>')
}

// Get initials from name
const getInitials = (name) => {
  return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2)
}

// Get tooltip position based on member ID
const getTooltipPosition = (id) => {
  // Position tooltips in different locations to avoid screen edge issues
  switch (id) {
    case 1:
      return 'left-full top-0 ml-4' // Right side
    case 2:
      return 'right-full top-0 mr-4' // Left side
    default:
      return 'left-full top-0 ml-4' // Default right side
  }
}



onMounted(() => {
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 100,
    disable: 'phone'
  })
})
</script>

<style scoped>
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

.font-playfair {
  font-family: 'Playfair Display', serif;
}

.font-inter {
  font-family: 'Inter', sans-serif;
}

.stroke {
  -webkit-text-stroke: 1px #ffffff;
  color: #e67e2200;
}

/* Font Face Definition */
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
  font-display: swap;
}

.phitagate-font {
  font-family: 'Phitagate', serif;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* Base Typography */
* {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar Styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #ea580c;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #f97316;
}

/* Smooth Transitions */
* {
  transition-property: transform, opacity, background-color, border-color, color, box-shadow;
  transition-duration: 300ms;
  transition-timing-function: ease-out;
}

/* Custom Animations */
@keyframes pulse-slow {

  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) translateX(0);
  }

  25% {
    transform: translateY(-10px) translateX(5px);
  }

  50% {
    transform: translateY(0) translateX(10px);
  }

  75% {
    transform: translateY(10px) translateX(5px);
  }
}

@keyframes float-reverse {

  0%,
  100% {
    transform: translateY(0) translateX(0);
  }

  25% {
    transform: translateY(10px) translateX(-5px);
  }

  50% {
    transform: translateY(0) translateX(-10px);
  }

  75% {
    transform: translateY(-10px) translateX(-5px);
  }
}

/* Animation Classes */
.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-float {
  animation: float 12s ease-in-out infinite;
}

.animate-float-reverse {
  animation: float-reverse 14s ease-in-out infinite;
}

/* Interactive Elements Styling */
button {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
}

button:focus {
  outline: 2px solid #f97316;
  outline-offset: 2px;
}

/* Card Hover Effects */
.group {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.group:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.group:hover .flex-shrink-0 {
  transform: scale(1.25);
}

/* Tooltip Styles */
@media (min-width: 1024px) {
  .team-card-wrapper .absolute.z-50 {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    pointer-events: none;
  }

  .team-card-wrapper:hover .absolute.z-50 {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

/* Mobile Tooltip Adjustments */
@media (max-width: 1023px) {
  .team-card-wrapper .absolute.z-50 {
    display: none !important;
  }
}

/* Custom scrollbar for tooltip content */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ea580c;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #f97316;
}

/* Ensure tooltip stays within viewport and is accessible */
@media (min-width: 1024px) {

  /* For right-side tooltips */
  .team-card-wrapper .absolute.z-50.left-full {
    left: 100%;
    right: auto;
  }

  /* For left-side tooltips */
  .team-card-wrapper .absolute.z-50.right-full {
    right: 100%;
    left: auto;
  }

  /* Add a slight delay before hiding to allow mouse movement to tooltip */
  .team-card-wrapper {
    transition: none;
  }

  .team-card-wrapper:hover {
    transition: none;
  }

  /* Make tooltip content easier to interact with */
  .team-card-wrapper .absolute.z-50 .prose {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .team-card-wrapper .absolute.z-50 .prose p {
    margin-bottom: 0.75rem;
  }

  .team-card-wrapper .absolute.z-50 .prose h4 {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }
}

/* Tooltip content styling */
.prose h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #ea580c;
}

.prose p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

/* Responsive Adjustments */
@media (max-width: 768px) {

  .animate-float,
  .animate-float-reverse {
    animation-duration: 20s;
  }
}
</style>
