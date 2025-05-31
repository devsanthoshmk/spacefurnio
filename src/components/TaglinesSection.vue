<template>
  <section ref="whitebg" class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-orange-50 to-orange-100">
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
import { ref, onMounted } from 'vue'

const taglines = ref([
  { text: 'Where lines meet light' },
  { text: 'And function meets soul' },
  { text: "You'll find us" }
]);

const whitebg = ref(null) // Ref for the section element

defineExpose({
  whitebg
})

</script>
