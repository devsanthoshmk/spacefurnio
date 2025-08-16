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
            <span class="phitagate-font bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent inline-block">
              Spacefurnio
            </span>
          </h1>

          <!-- Tagline -->
          <p class="text-2xl md:text-3xl text-gray-400 font-light tracking-wide">
            "When creative meets living"
          </p>
        </div>

        <!-- Mission Card -->
        <div
          class="max-w-2xl mx-auto mt-16 w-full"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100/50">
            <h2 class="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">Our Mission</h2>
            <div class="grid gap-4 text-left">
              <div
                v-for="(item, index) in missionItems"
                :key="index"
                class="flex items-start space-x-4 group"
              >
                <div class="w-2 h-2 bg-orange-500 rounded-full mt-3 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                <span class="text-gray-700 text-lg leading-relaxed">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div
        class="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        data-aos="fade-up"
        data-aos-delay="600"
      >
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
          <div
            v-for="(item, index) in manifesto"
            :key="index"
            class="group bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-orange-200"
            :data-aos="'fade-up'"
            :data-aos-delay="index * 100"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
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
            The Dream Team
          </h2>
          <div class="w-24 h-1 bg-orange-500 mx-auto mt-6 rounded-full"></div>
        </div>

        <!-- Team Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          <div
            v-for="(member, index) in team"
            :key="member.name"
            class="group text-center"
            :data-aos="'fade-up'"
            :data-aos-delay="index * 100"
          >
            <!-- Avatar -->
            <div class="relative mb-6">
              <div class="w-32 h-32 mx-auto bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <div class="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold text-2xl">{{ member.initials }}</span>
                </div>
              </div>
            </div>

            <!-- Member Info -->
            <h3 class="text-xl font-semibold text-gray-900 mb-2 tracking-tight">{{ member.name }}</h3>
            <p class="text-orange-500 font-medium mb-3">{{ member.position }}</p>
            <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ member.description }}</p>

            <!-- Social Links -->
            <div class="flex justify-center space-x-3">
              <button class="w-8 h-8 bg-gray-100 hover:bg-orange-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button class="w-8 h-8 bg-gray-100 hover:bg-orange-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button class="w-8 h-8 bg-gray-100 hover:bg-orange-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </button>
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
  {
    title: 'Innovation First',
    description: 'We constantly push boundaries to create breakthrough solutions that redefine industry standards and drive meaningful change.'
  },
  {
    title: 'Client-Centric',
    description: 'Our success is measured by our clients\' achievements. Every decision we make puts your goals and satisfaction at the forefront.'
  },
  {
    title: 'Radical Transparency',
    description: 'Honest communication builds lasting partnerships. We believe in open dialogue and clear expectations at every step.'
  },
  {
    title: 'Sustainable Growth',
    description: 'We design solutions that scale responsibly, ensuring long-term value for your business and positive impact on society.'
  },
  {
    title: 'Collaborative Excellence',
    description: 'Great minds achieve more together. We foster an environment where diverse perspectives create innovative solutions.'
  },
  {
    title: 'Future-Ready',
    description: 'We anticipate trends and emerging technologies to keep you ahead of the curve in an ever-evolving digital landscape.'
  }
])

const team = ref([
  {
    name: 'Alex Johnson',
    position: 'CEO & Founder',
    description: 'Passionate innovator with expertise in strategic leadership and market disruption.',
    initials: 'AJ'
  },
  {
    name: 'Sarah Williams',
    position: 'Creative Director',
    description: 'Visionary designer focused on creating exceptional user experiences and brand identity.',
    initials: 'SW'
  },
  {
    name: 'Michael Chen',
    position: 'CTO',
    description: 'Technology architect specializing in scalable systems and emerging tech solutions.',
    initials: 'MC'
  },
  {
    name: 'Emma Rodriguez',
    position: 'Growth Strategist',
    description: 'Data-driven growth expert with deep insights into market expansion and optimization.',
    initials: 'ER'
  },
  {
    name: 'David Kim',
    position: 'Lead Developer',
    description: 'Full-stack developer with expertise in modern frameworks and security protocols.',
    initials: 'DK'
  }
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
  font-display: swap;
}

.phitagate-font {
  font-family: 'Phitagate', serif;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

* {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
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

/* Smooth transitions */
* {
  transition-property: transform, opacity, background-color, border-color, color, box-shadow;
  transition-duration: 300ms;
  transition-timing-function: ease-out;
}
</style>
