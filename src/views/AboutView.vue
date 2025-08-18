<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center px-8 py-20 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0">
        <div class="absolute top-20 left-10 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-orange-50/40 rounded-full blur-3xl"></div>
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto text-center z-10 space-y-8 w-full">
        <!-- Brand Name -->
        <div data-aos="fade-up" data-aos-duration="800" class="w-full">
          <h1 class="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-4 break-words">
            <span
              class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent inline-block">
              Spacefurnio
            </span>
          </h1>

          <!-- Tagline -->
          <p class="text-2xl md:text-3xl text-gray-400 font-light tracking-wide">
            "When creative meets living"
          </p>
        </div>

        <!-- Mission Card -->
        <div class="max-w-2xl mx-auto mt-16 w-full" data-aos="fade-up" data-aos-delay="300">
          <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100/50">
            <h2 class="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">Our Mission</h2>
            <div class="grid gap-4 text-left">
              <div v-for="(item, index) in missionItems" :key="index" class="flex items-start space-x-4 group">
                <div
                  class="w-2 h-2 bg-orange-500 rounded-full mt-3 flex-shrink-0 group-hover:scale-125 transition-transform">
                </div>
                <span class="text-gray-700 text-lg leading-relaxed">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2" data-aos="fade-up" data-aos-delay="600">
        <div class="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
          <div class="w-1 h-3 bg-orange-500 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>

    <!-- Manifesto Section -->
    <section class="py-32 px-6 bg-gradient-to-b from-gray-50/50 to-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-20" data-aos="fade-up">
          <div class="inline-block">
            <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Core Beliefs</span>
            <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-2 tracking-tight">
              Brand Manifesto
            </h2>
            <div class="w-24 h-1 bg-orange-500 mx-auto mt-6 rounded-full"></div>
          </div>
        </div>

        <!-- Manifesto Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="(item, index) in manifesto" :key="index"
            class="group bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-orange-200"
            :data-aos="'fade-up'" :data-aos-delay="index * 100">
            <div
              class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 class="font-semibold text-xl mb-4 text-gray-900 tracking-tight">{{ item.title }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="py-32 px-6 bg-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-20" data-aos="fade-up">
          <span class="text-orange-500 font-medium text-sm uppercase tracking-wider">Our Experts</span>
          <h2 class="text-4xl md:text-5xl font-light text-gray-900 mt-2 tracking-tight">
            Our Team
          </h2>
          <div class="w-24 h-1 bg-orange-500 mx-auto mt-6 rounded-full"></div>
        </div>

        <!-- Netflix-style Cards Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="netflix-card relative group cursor-pointer transition-all duration-300 ease-out"
            :class="{
              'z-50 scale-110': hoveredCard === member.id,
              'z-10 scale-95': hoveredCard && hoveredCard !== member.id,
              'scale-100 z-20': !hoveredCard
            }"
            @mouseenter="hoveredCard = member.id"
            @mouseleave="hoveredCard = null"
          >
            <!-- Card -->
            <div
              class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300">
              <!-- Avatar Circle -->
              <div class="h-40 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                <div class="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                  <div class="w-10 h-10 bg-white rounded-full"></div>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4 text-center space-y-2">
                <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors duration-300">
                  {{ member.name }}
                </h3>
                <p class="text-orange-400 text-xs uppercase font-medium tracking-wider">
                  {{ member.role }}
                </p>
                <p class="text-gray-300 text-sm">{{ member.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AOS from 'aos'
import 'aos/dist/aos.css'

const missionItems = ref([
  'Deliver innovative solutions that exceed expectations',
  'Empower businesses through cutting-edge technology',
  'Foster sustainable growth for our clients and community',
  'Create meaningful connections through our products'
])

const manifesto = ref([
  { title: 'Innovation First', description: 'We constantly push boundaries...' },
  { title: 'Client-Centric', description: 'Our success is measured...' },
  { title: 'Radical Transparency', description: 'Honest communication builds...' },
  { title: 'Sustainable Growth', description: 'We design solutions that scale...' },
  { title: 'Collaborative Excellence', description: 'Great minds achieve more together...' },
  { title: 'Future-Ready', description: 'We anticipate trends and emerging...' }
])

const hoveredCard = ref(null)

const teamMembers = ref([
  { id: 1, name: "Sarah Johnson", role: "Creative Director", description: "Visionary leader with 15+ years in furniture design" },
  { id: 2, name: "Michael Chen", role: "Lead Designer", description: "Innovative designer specializing in sustainable materials" },
  { id: 3, name: "Emma Rodriguez", role: "Product Manager", description: "Strategic thinker ensuring quality and customer satisfaction" },
  { id: 4, name: "David Kim", role: "Head of Engineering", description: "Technical expert driving manufacturing excellence" }
])

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
/* Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
  font-display: swap;
}

.phitagate-font {
  font-family: 'Phitagate', serif;
}

/* Smooth text */
* {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: all 0.3s ease-out;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #ea580c; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #f97316; }

/* Netflix-style card animations */
.netflix-card { transform: translateZ(0); will-change: transform; }
.netflix-card:hover { transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25),
              0 0 0 1px rgba(255,255,255,0.05);
}

@keyframes netflix-glow {
  0%, 100% { opacity: 0.5; transform: scale(1.05); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.netflix-card:hover .blur-xl {
  animation: netflix-glow 2s ease-in-out infinite;
}

button:focus { outline: 2px solid #f97316; outline-offset: 2px; }

@media (max-width: 768px) {
  .netflix-card:hover { transform: scale(1.05) !important; }
}
</style>
