<template>
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
