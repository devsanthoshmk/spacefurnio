import os
import json


def create_vue_project():
    # Create directory structure
    os.makedirs("src/components", exist_ok=True)
    os.makedirs("src/composables", exist_ok=True)

    # package.json
    package_json = {
        "name": "spacefurnio",
        "private": True,
        "version": "0.0.0",
        "type": "module",
        "scripts": {"dev": "vite", "build": "vite build", "preview": "vite preview"},
        "dependencies": {
            "vue": "^3.4.0",
            "primevue": "^3.50.0",
            "primeicons": "^6.0.1",
            "aos": "^2.3.4",
        },
        "devDependencies": {
            "@vitejs/plugin-vue": "^5.0.0",
            "autoprefixer": "^10.4.16",
            "postcss": "^8.4.32",
            "tailwindcss": "^3.4.0",
            "vite": "^5.0.0",
        },
    }
    with open("package.json", "w") as f:
        json.dump(package_json, f, indent=2)

    # vite.config.js
    vite_config = """import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
"""
    with open("vite.config.js", "w") as f:
        f.write(vite_config)

    # tailwind.config.js
    tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm-orange': '#FF8025',
        'charcoal': '#39853',
        'pure-white': '#FFFFFF',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 1s ease-in-out',
        'slide-up': 'slideUp 1s ease-out',
        'gradient-x': 'gradient-x 15s ease infinite',
        'particle-float': 'particle-float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'particle-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(120deg)' },
          '66%': { transform: 'translateY(10px) rotate(240deg)' },
        },
      },
    },
  },
  plugins: [],
}
"""
    with open("tailwind.config.js", "w") as f:
        f.write(tailwind_config)

    # postcss.config.js
    postcss_config = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
    with open("postcss.config.js", "w") as f:
        f.write(postcss_config)

    # index.html
    index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SpaceFurnio - Creative Meetings</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://unpkg.com/primevue@3.50.0/resources/themes/lara-light-indigo/theme.css" rel="stylesheet">
    <link href="https://unpkg.com/primevue@3.50.0/resources/primevue.min.css" rel="stylesheet">
    <link href="https://unpkg.com/primeicons@6.0.1/primeicons.css" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.4/dist/aos.css" rel="stylesheet">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
"""
    with open("index.html", "w") as f:
        f.write(index_html)

    # src/main.js
    main_js = """import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './style.css'

const app = createApp(App)

app.use(PrimeVue)
app.mount('#app')

// Initialize AOS
AOS.init({
  duration: 1200,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100,
})
"""
    with open("src/main.js", "w") as f:
        f.write(main_js)

    # src/style.css
    style_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --warm-orange: #FF8025;
  --charcoal: #39853;
  --pure-white: #FFFFFF;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Poppins', sans-serif;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.gradient-text {
  background: linear-gradient(135deg, var(--warm-orange), #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-effect {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.scroll-container {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
"""
    with open("src/style.css", "w") as f:
        f.write(style_css)

    # src/App.vue
    app_vue = """<template>
  <div id="app" class="font-poppins">
    <Navigation />
    <BrandingSection />
    <NewArrivalsSection />
    <TaglinesSection />
    <ProjectHighlights />
    <FooterSection />
  </div>
</template>

<script setup>
import Navigation from './components/Navigation.vue'
import BrandingSection from './components/BrandingSection.vue'
import NewArrivalsSection from './components/NewArrivalsSection.vue'
import TaglinesSection from './components/TaglinesSection.vue'
import ProjectHighlights from './components/ProjectHighlights.vue'
import FooterSection from './components/FooterSection.vue'
</script>
"""
    with open("src/App.vue", "w") as f:
        f.write(app_vue)

    # Component files
    components = {
        "Navigation.vue": """<template>
  <nav class="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <i class="pi pi-home text-white text-xl"></i>
          </div>
          <span class="text-3xl font-bold gradient-text">SpaceFurnio</span>
        </div>
        
        <div class="hidden lg:flex items-center space-x-8">
          <a v-for="item in navItems" 
             :key="item"
             :href="`#${item.toLowerCase().replace(' ', '-')}`"
             class="text-gray-700 hover:text-orange-500 px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 relative group">
            {{ item }}
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
        </div>
        
        <button @click="toggleMobileMenu" class="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
          <i class="pi pi-bars text-2xl text-gray-700"></i>
        </button>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" 
         class="lg:hidden bg-white/95 backdrop-blur-xl border-t border-white/20"
         data-aos="fade-down">
      <div class="px-4 py-6 space-y-4">
        <a v-for="item in navItems" 
           :key="item"
           :href="`#${item.toLowerCase().replace(' ', '-')}`"
           @click="closeMobileMenu"
           class="block text-gray-700 hover:text-orange-500 py-3 text-lg font-medium transition-colors border-b border-gray-100 last:border-b-0">
          {{ item }}
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)

const navItems = ref([
  'Home',
  'About Us',
  'SFX Collabs', 
  'Shopping',
  'Portfolio',
  'Ongoing Projects',
  'Contact'
])

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>
""",
        "BrandingSection.vue": """<template>
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">
    <!-- Animated Background Particles -->
    <div class="absolute inset-0 overflow-hidden">
      <div v-for="i in 20" 
           :key="i" 
           :class="`particle animate-particle-float w-2 h-2 bg-orange-300/30 absolute`"
           :style="{
             left: Math.random() * 100 + '%',
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 8 + 's',
             animationDuration: (Math.random() * 4 + 6) + 's'
           }">
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <div class="text-center">
        <!-- Logo and Brand -->
        <div data-aos="fade-up" data-aos-delay="100">
          <div class="flex items-center justify-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl mr-6 transform hover:rotate-12 transition-transform duration-500">
              <i class="pi pi-home text-white text-3xl"></i>
            </div>
            <h1 class="text-6xl lg:text-8xl font-bold gradient-text">
              SpaceFurnio
            </h1>
          </div>
        </div>
        
        <!-- Tagline -->
        <div data-aos="fade-up" data-aos-delay="300">
          <p class="text-2xl lg:text-4xl text-gray-600 font-light mb-12 tracking-wide">
            Creative Meetings
          </p>
        </div>
        
        <!-- CTA Button -->
        <div data-aos="fade-up" data-aos-delay="500">
          <button class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:from-orange-600 hover:to-orange-700">
            Explore Collections
            <i class="pi pi-arrow-right ml-3"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2" 
         data-aos="fade-up" data-aos-delay="800">
      <div class="animate-bounce">
        <i class="pi pi-chevron-down text-2xl text-orange-500"></i>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Add any component-specific initialization here
})
</script>
""",
        "NewArrivalsSection.vue": """<template>
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
    <!-- Animated Background -->
    <div class="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-transparent to-orange-900/20 animate-gradient-x"></div>
    
    <!-- Floating Geometric Shapes -->
    <div class="absolute inset-0 overflow-hidden">
      <div v-for="i in 15" 
           :key="i"
           :class="`absolute w-4 h-4 border border-orange-400/30 transform rotate-45 animate-float`"
           :style="{
             left: Math.random() * 100 + '%',
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 6 + 's',
             animationDuration: (Math.random() * 3 + 4) + 's'
           }">
      </div>
    </div>
    
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Title -->
      <div class="text-center mb-16" data-aos="fade-up">
        <h2 class="text-5xl lg:text-7xl font-bold text-white mb-6">
          New <span class="gradient-text">Arrivals</span>
        </h2>
        <p class="text-xl text-gray-300 max-w-2xl mx-auto">
          Discover our latest collection of premium furniture pieces designed to transform your space
        </p>
      </div>
      
      <!-- Products Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="(product, index) in newArrivals" 
             :key="index"
             class="group relative"
             :data-aos="'fade-up'"
             :data-aos-delay="index * 150">
          
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 h-80 flex flex-col justify-between transform group-hover:scale-105 transition-all duration-500 hover:shadow-2xl">
            
            <!-- Product Image Placeholder -->
            <div class="flex-1 bg-gradient-to-br from-orange-200/20 to-orange-400/20 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <i class="pi pi-image text-4xl text-orange-400/60"></i>
            </div>
            
            <!-- Product Info -->
            <div class="text-center">
              <h3 class="text-xl font-semibold text-white mb-2">{{ product.name }}</h3>
              <p class="text-2xl font-bold gradient-text">${{ product.price }}</p>
            </div>
            
            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-orange-600/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end justify-center pb-8">
              <button class="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- View All Button -->
      <div class="text-center mt-16" data-aos="fade-up" data-aos-delay="600">
        <button class="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105">
          View All Products
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const newArrivals = ref([
  { name: 'Luxe Velvet Sofa', price: 2499 },
  { name: 'Oak Executive Desk', price: 1899 },
  { name: 'Ergonomic Lounge Chair', price: 899 },
  { name: 'Glass Conference Table', price: 1599 },
  { name: 'Modular Bookshelf', price: 699 },
  { name: 'Designer Coffee Table', price: 799 }
])
</script>
""",
        "TaglinesSection.vue": """<template>
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-orange-50 to-orange-100">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-30">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-200/40 via-transparent to-transparent"></div>
    </div>
    
    <!-- Floating Elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div v-for="i in 12" 
           :key="i"
           :class="`absolute w-6 h-6 bg-orange-300/20 rounded-full animate-float`"
           :style="{
             left: Math.random() * 100 + '%',
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 8 + 's',
             animationDuration: (Math.random() * 4 + 6) + 's'
           }">
      </div>
    </div>
    
    <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="space-y-16">
        <div v-for="(tagline, index) in taglines" 
             :key="index"
             class="relative"
             :data-aos="'fade-up'"
             :data-aos-delay="index * 400"
             :data-aos-duration="1000">
          
          <!-- Tagline Text -->
          <div class="relative inline-block">
            <h2 class="text-4xl lg:text-6xl xl:text-7xl font-light text-gray-800 leading-tight tracking-wide">
              {{ tagline.text }}
            </h2>
            
            <!-- Decorative Line -->
            <div v-if="index < taglines.length - 1" 
                 class="w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-8 rounded-full"
                 :data-aos="'scale-x'"
                 :data-aos-delay="index * 400 + 200">
            </div>
          </div>
          
          <!-- Background Accent -->
          <div class="absolute -inset-4 bg-gradient-to-r from-orange-100/30 via-transparent to-orange-100/30 rounded-3xl -z-10 transform rotate-1 scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        
        <!-- Final CTA -->
        <div class="pt-16" data-aos="fade-up" data-aos-delay="1200">
          <div class="inline-flex items-center space-x-4 bg-white/60 backdrop-blur-xl rounded-full px-8 py-4 shadow-xl">
            <span class="text-xl text-gray-700">Ready to transform your space?</span>
            <button class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const taglines = ref([
  { text: 'Where lines meet light' },
  { text: 'And function meets soul' },
  { text: "You'll find us" }
])
</script>
""",
        "ProjectHighlights.vue": """<template>
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
""",
        "FooterSection.vue": """<template>
  <footer class="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-400 via-transparent to-transparent"></div>
    </div>
    
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        <!-- Brand Section -->
        <div class="lg:col-span-2" data-aos="fade-up">
          <div class="flex items-center mb-6">
            <div class="w-14 h-14 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <i class="pi pi-home text-white text-2xl"></i>
            </div>
            <span class="text-3xl font-bold gradient-text">SpaceFurnio</span>
          </div>
          <p class="text-gray-300 mb-4 text-lg">Creative Meetings</p>
          <p class="text-gray-400 leading-relaxed max-w-md">
            Transforming spaces with innovative furniture solutions that blend functionality with aesthetic appeal. Where design meets purpose, and dreams take shape.
          </p>
          
          <!-- Social Media -->
          <div class="flex space-x-4 mt-8">
            <a v-for="social in socialLinks" 
               :key="social.name"
               href="#"
               class="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-orange-500/20 hover:scale-110 transition-all duration-300 border border-white/20">
              <i :class="social.icon" class="text-lg"></i>
            </a>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div data-aos="fade-up" data-aos-delay="200">
          <h3 class="text-xl font-semibold mb-6 gradient-text">Quick Links</h3>
          <ul class="space-y-3">
            <li v-for="item in navItems" :key="item">
              <a :href="`#${item.toLowerCase().replace(' ', '-')}`" 
                 class="text-gray-400 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                <i class="pi pi-angle-right text-xs mr-2 transform group-hover:translate-x-1 transition-transform duration-300"></i>
                {{ item }}
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Contact Info -->
        <div data-aos="fade-up" data-aos-delay="400">
          <h3 class="text-xl font-semibold mb-6 gradient-text">Get in Touch</h3>
          <div class="space-y-4">
            <div class="flex items-start">
              <i class="pi pi-map-marker text-orange-400 mt-1 mr-3"></i>
              <div>
                <p class="text-gray-300">123 Design Street</p>
                <p class="text-gray-400">Creative District, CD 12345</p>
              </div>
            </div>
            <div class="flex items-center">
              <i class="pi pi-phone text-orange-400 mr-3"></i>
              <p class="text-gray-300">+1 (555) 123-4567</p>
            </div>
            <div class="flex items-center">
              <i class="pi pi-envelope text-orange-400 mr-3"></i>
              <p class="text-gray-300">hello@spacefurnio.com</p>
            </div>
          </div>
          
          <!-- Newsletter Signup -->
          <div class="mt-8">
            <h4 class="text-lg font-medium mb-4 text-white">Stay Updated</h4>
            <div class="flex">
              <input type="email" 
                     placeholder="Your email address"
                     class="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-l-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors">
              <button class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 rounded-r-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105">
                <i class="pi pi-send text-white"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Bar -->
      <div class="border-t border-gray-700/50 mt-16 pt-8" data-aos="fade-up" data-aos-delay="600">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 SpaceFurnio. All rights reserved. Crafted with passion for exceptional design.
          </p>
          <div class="flex space-x-6 text-sm">
            <a href="#" class="text-gray-400 hover:text-orange-400 transition-colors">Privacy Policy</a>
            <a href="#" class="text-gray-400 hover:text-orange-400 transition-colors">Terms of Service</a>
            <a href="#" class="text-gray-400 hover:text-orange-400 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'

const navItems = ref([
  'Home',
  'About Us',
  'SFX Collabs',
  'Shopping', 
  'Portfolio',
  'Ongoing Projects',
  'Contact'
])

const socialLinks = ref([
  { name: 'Facebook', icon: 'pi pi-facebook' },
  { name: 'Instagram', icon: 'pi pi-instagram' },
  { name: 'Twitter', icon: 'pi pi-twitter' },
  { name: 'LinkedIn', icon: 'pi pi-linkedin' }
])
</script>
""",
    }

    for filename, content in components.items():
        with open(f"src/components/{filename}", "w") as f:
            f.write(content)

    # Composables
    composables = {
        "useScrollAnimations.js": """import { onMounted, onUnmounted } from 'vue'

export function useScrollAnimations() {
  let observer = null

  const initScrollAnimations = () => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    // Observe all elements with data-aos attributes
    document.querySelectorAll('[data-aos]').forEach((el) => {
      observer.observe(el)
    })
  }

  const destroyScrollAnimations = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    // Initialize AOS with custom settings
    if (typeof AOS !== 'undefined') {
      AOS.refresh()
    }
    initScrollAnimations()
  })

  onUnmounted(() => {
    destroyScrollAnimations()
  })

  return {
    initScrollAnimations,
    destroyScrollAnimations
  }
}
""",
        "useParallax.js": """import { ref, onMounted, onUnmounted } from 'vue'

export function useParallax() {
  const parallaxElements = ref([])

  const handleScroll = () => {
    const scrolled = window.pageYOffset
    const rate = scrolled * -0.5

    parallaxElements.value.forEach((element) => {
      if (element) {
        element.style.transform = `translateY(${rate}px)`
      }
    })
  }

  const addParallaxElement = (element) => {
    if (element) {
      parallaxElements.value.push(element)
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    addParallaxElement,
    handleScroll
  }
}
""",
    }

    for filename, content in composables.items():
        with open(f"src/composables/{filename}", "w") as f:
            f.write(content)

    # README.md
    readme = """# SpaceFurnio - Modern Furniture E-commerce

A professional Vue 3 application built with Vite, featuring elegant full-screen sections with scroll animations using AOS (Animate On Scroll).

## 🚀 Features

- **Modern Tech Stack**: Vue 3 Composition API + Vite + Tailwind CSS
- **Component Architecture**: Modular, reusable components
- **Scroll Animations**: AOS integration with custom animations
- **Responsive Design**: Mobile-first approach
- **Professional UI**: PrimeVue components with custom styling
- **Performance Optimized**: Lazy loading and efficient animations

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **PrimeVue** - Rich UI component library
- **AOS** - Animate On Scroll library
- **Poppins Font** - Modern typography

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd spacefurnio

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Navigation.vue          # Fixed navigation bar
│   ├── BrandingSection.vue     # Hero section with brand
│   ├── NewArrivalsSection.vue  # Product showcase
│   ├── TaglinesSection.vue     # Animated taglines
│   ├── ProjectHighlights.vue   # Portfolio showcase
│   └── FooterSection.vue       # Footer with links
├── composables/
│   ├── useScrollAnimations.js  # Custom scroll animations
│   └── useParallax.js          # Parallax effects
├── App.vue                     # Main app component
├── main.js                     # App initialization
└── style.css                   # Global styles
```

## 🎨 Design Features

### Full-Screen Sections
Each section takes up the entire viewport height with:
- Elegant gradient backgrounds
- Animated particles and floating elements
- Professional typography with Poppins font
- Responsive design for all devices

### Scroll Animations
- **AOS Integration**: Smooth fade, slide, and scale animations
- **Custom Timing**: Staggered animations for visual hierarchy
- **Performance Optimized**: GPU-accelerated transforms

### Interactive Elements
- **Hover Effects**: 3D transforms and color transitions
- **Glass Morphism**: Backdrop blur effects
- **Gradient Animations**: Dynamic color transitions
- **Particle Systems**: Floating background elements

## 🌟 Key Components

### BrandingSection
- Full-screen hero with animated particles
- 3D logo with hover effects
- Gradient text and call-to-action buttons

### NewArrivalsSection
- Dark theme with floating geometric shapes
- Product grid with hover overlays
- Animated borders and glass morphism

### TaglinesSection
- Staggered text animations
- Floating particle background
- Interactive call-to-action

### ProjectHighlights
- Portfolio grid with hover effects
- Animated borders and overlays
- Professional project showcase

## 🎯 Performance Optimizations

- **Vite**: Fast development and optimized builds
- **CSS Transforms**: Hardware acceleration
- **Intersection Observer**: Efficient scroll detection
- **Lazy Loading**: On-demand resource loading
- **Tree Shaking**: Optimized bundle size

## 🎨 Customization

### Colors
The color palette is defined in `tailwind.config.js`:
```javascript
colors: {
  'warm-orange': '#FF8025',
  'charcoal': '#39853',
  'pure-white': '#FFFFFF',
}
```

### Animations
Custom animations are defined in the Tailwind config:
- `animate-float`: Floating elements
- `animate-gradient-x`: Gradient animations
- `animate-particle-float`: Particle movements

### Typography
Using Poppins font family with weights from 300-800 for professional typography hierarchy.

## 🚀 Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Deploy to your preferred hosting service
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Vue 3 and modern web technologies
"""
    with open("README.md", "w") as f:
        f.write(readme)

    print("Project files created successfully!")
    print("Run the following commands to start:")
    print("npm install")
    print("npm run dev")


if __name__ == "__main__":
    create_vue_project()
