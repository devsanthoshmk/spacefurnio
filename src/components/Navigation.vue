<template>
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
             :ref="addel"
             class="text-white hover:text-orange-500 px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 relative group">
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

const navels = ref([])

const addel = (el)=>{
  if (el  && !navels.value.includes(el)) navels.value.push(el)
}

defineExpose({
  navels
})

</script>
