<template>
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900">
    <!-- Animated Background Particles -->
    <div class="absolute inset-0 overflow-hidden">
      <div v-for="i in 20" 
           :key="i" 
           :class="`particle animate-particle-float w-2 h-2 bg-blue-300/30 absolute`"
           :style="{
             left: Math.random() * 100 + '%',
             top: Math.random() * 100 + '%',
             animationDelay: Math.random() * 8 + 's',
             animationDuration: (Math.random() * 4 + 6) + 's'
           }">
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 w-full">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
        
        <!-- Left Side - Brand Section -->
        <div class="text-left">
          <!-- Logo and Brand -->
          <div data-aos="fade-right" data-aos-delay="100">
            <div class="flex items-center mb-8">
              <div class="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl mr-6 transform hover:rotate-12 transition-transform duration-500">
                <i class="pi pi-home text-white text-3xl"></i>
              </div>
              <div>
                <h1 class="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  SpaceFurnio
                </h1>
              </div>
            </div>
          </div>
          
          <!-- Tagline -->
          <div data-aos="fade-right" data-aos-delay="300">
            <p class="text-2xl lg:text-3xl text-gray-300 font-light mb-8 tracking-wide">
              Creative Meetings
            </p>
            <p class="text-lg text-gray-400 mb-12 leading-relaxed max-w-lg">
              Transform your workspace with innovative furniture solutions that blend functionality with aesthetic appeal. Where design meets purpose.
            </p>
          </div>
          
          <!-- CTA Buttons -->
          <div data-aos="fade-right" data-aos-delay="500">
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-purple-700">
                Explore Collections
                <i class="pi pi-arrow-right ml-3"></i>
              </button>
              <button class="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                Watch Demo
                <i class="pi pi-play ml-3"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Right Side - New Arrivals Scrollable Container -->
        <div class="relative" data-aos="fade-left" data-aos-delay="200">
          <div class="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            <!-- Header -->
            <div class="mb-6">
              <h3 class="text-3xl font-bold text-white mb-2">New Arrivals</h3>
              <p class="text-gray-300">Latest premium furniture pieces</p>
            </div>
            
            <!-- Scrollable Products Container -->
            <div class="h-[39vh] overflow-y-auto scroll-container pr-2 space-y-4">
              <div v-for="(product, index) in newArrivals" 
                   :key="index"
                   class="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 hover:bg-white/10">
                
                <div class="flex items-center space-x-4">
                  <!-- Product Image Placeholder -->
                  <div class="w-16 h-16 bg-gradient-to-br from-blue-200/20 to-purple-400/20 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <i class="pi pi-image text-2xl text-blue-400/60"></i>
                  </div>
                  
                  <!-- Product Info -->
                  <div class="flex-1">
                    <h4 class="text-lg font-semibold text-white mb-1">{{ product.name }}</h4>
                    <p class="text-sm text-gray-400 mb-2">{{ product.category }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        ${{ product.price }}
                      </span>
                      <button class="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1 rounded-full text-sm transition-colors duration-300">
                        View
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Hover Effect Line -->
                <div class="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
              </div>
            </div>
            
            <!-- View All Button -->
            <div class="mt-6 text-center">
              <button class="w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-400 hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 py-3 rounded-xl font-semibold transition-all duration-300">
                View All Products
                <i class="pi pi-external-link ml-2"></i>
              </button>
            </div>
          </div>
          
          <!-- Floating Badge -->
          <div class="absolute -top-4 -right-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce">
            🆕 Latest
          </div>
        </div>
      </div>
    </div>
    
    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2" 
         data-aos="fade-up" data-aos-delay="800">
      <div class="animate-bounce">
        <i class="pi pi-chevron-down text-2xl text-blue-400"></i>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const newArrivals = ref([
  { name: 'Luxe Velvet Sofa', category: 'Living Room', price: 2499 },
  { name: 'Oak Executive Desk', category: 'Office', price: 1899 },
  { name: 'Ergonomic Lounge Chair', category: 'Seating', price: 899 },
  { name: 'Glass Conference Table', category: 'Office', price: 1599 },
  { name: 'Modular Bookshelf', category: 'Storage', price: 699 },
  { name: 'Designer Coffee Table', category: 'Living Room', price: 799 },
  { name: 'Scandinavian Dining Set', category: 'Dining', price: 1299 },
  { name: 'Floating Nightstand', category: 'Bedroom', price: 449 },
  { name: 'Industrial Bar Stool', category: 'Seating', price: 299 },
  { name: 'Vintage Accent Chair', category: 'Seating', price: 649 },
  { name: 'Modern Storage Ottoman', category: 'Storage', price: 399 },
  { name: 'Marble Side Table', category: 'Living Room', price: 549 }
])

onMounted(() => {
  // Add any component-specific initialization here
})
</script>

<style scoped>
.scroll-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(59, 130, 246, 0.5) transparent;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.7);
}
</style>