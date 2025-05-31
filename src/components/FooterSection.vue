<template>
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
