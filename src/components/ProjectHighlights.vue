<template>
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <!-- Animated Background -->
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,128,37,0.1)_0%,_transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent,_rgba(255,128,37,0.1),_transparent)]"></div>
    </div>
    
    <!-- Floating Particles -->
    <div class="absolute inset-0 overflow-hidden">
      <div v-for="i in 25" 
           :key="i"
           :class="`absolute w-1 h-1 bg-orange-400/40 rounded-full animate-pulse`"
           :style="{
             left: Math.random() * 100 + '%',
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 3 + 's',
             animationDuration: (Math.random() * 2 + 2) + 's'
           }">
      </div>
    </div>
    
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-20" data-aos="fade-up">
        <h2 class="text-5xl lg:text-7xl font-bold text-white mb-6">
          Project <span class="gradient-text">Highlights</span>
        </h2>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Explore our portfolio of exceptional furniture projects that showcase our commitment to design excellence and craftsmanship
        </p>
      </div>
      
      <!-- Projects Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div v-for="(project, index) in projects" 
             :key="index"
             class="group relative"
             :data-aos="index % 2 === 0 ? 'fade-right' : 'fade-left'"
             :data-aos-delay="index * 200">
          
          <div class="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 transform group-hover:scale-105 transition-all duration-700 hover:shadow-2xl">
            
            <!-- Project Image -->
            <div class="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-orange-400/20 to-purple-400/20 flex items-center justify-center">
              <div class="text-center">
                <i class="pi pi-image text-6xl text-white/40 mb-4"></i>
                <div class="w-32 h-32 bg-gradient-to-br from-orange-400/30 to-purple-400/30 rounded-2xl mx-auto"></div>
              </div>
            </div>
            
            <!-- Project Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Project Info -->
            <div class="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 class="text-2xl font-bold text-white mb-2">{{ project.title }}</h3>
              <p class="text-gray-300 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                {{ project.description }}
              </p>
              <div class="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300">
                <span class="text-orange-400 font-semibold">{{ project.category }}</span>
                <button class="bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-full text-sm hover:bg-white/30 transition-colors">
                  View Project
                </button>
              </div>
            </div>
            
            <!-- Animated Border -->
            <div class="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-orange-400 via-purple-400 to-orange-400 bg-clip-border opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div class="absolute inset-0.5 rounded-3xl bg-gradient-to-br from-gray-900/90 to-purple-900/90"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- View All Button -->
      <div class="text-center mt-20" data-aos="fade-up" data-aos-delay="800">
        <button class="bg-gradient-to-r from-orange-500 to-purple-500 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:from-orange-600 hover:to-purple-600">
          View All Projects
          <i class="pi pi-external-link ml-3"></i>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const projects = ref([
  {
    title: 'Luxury Penthouse Suite',
    description: 'Complete interior transformation with custom furniture and lighting solutions',
    category: 'Residential'
  },
  {
    title: 'Corporate Headquarters',
    description: 'Modern office design focusing on productivity and employee wellness',
    category: 'Commercial'
  },
  {
    title: 'Boutique Hotel Lounge',
    description: 'Elegant hospitality furniture creating memorable guest experiences',
    category: 'Hospitality'
  },
  {
    title: 'Art Gallery Exhibition',
    description: 'Minimalist furniture design complementing contemporary art displays',
    category: 'Cultural'
  },
  {
    title: 'Restaurant Interior',
    description: 'Custom dining furniture enhancing culinary experiences',
    category: 'F&B'
  },
  {
    title: 'Wellness Center',
    description: 'Therapeutic furniture design promoting relaxation and healing',
    category: 'Healthcare'
  }
])
</script>
