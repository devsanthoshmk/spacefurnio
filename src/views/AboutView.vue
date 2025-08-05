<template>
  <div class="about-us-container">
    <!-- Enhanced Hero Section with SpaceFurnio Background -->
    <section class="hero-section relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-gray-50 overflow-hidden">
      <!-- SpaceFurnio Themed Background Elements -->
      <div class="absolute inset-0 opacity-20">
        <!-- Furniture-inspired floating elements -->
        <div class="absolute top-1/4 left-1/4 w-4 h-4 bg-orange-400 rounded-lg animate-float-slow transform rotate-12"></div>
        <div class="absolute top-1/3 right-1/3 w-2 h-6 bg-orange-500 rounded-full animate-float-delayed"></div>
        <div class="absolute bottom-1/3 left-1/5 w-6 h-2 bg-orange-300 rounded-full animate-float-reverse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-3 h-3 bg-orange-400 rounded-sm animate-float-slow transform rotate-45"></div>
        <div class="absolute top-1/2 left-1/6 w-2 h-8 bg-orange-200 rounded-full animate-float-delayed transform rotate-12"></div>
        <div class="absolute top-3/4 right-1/5 w-5 h-5 bg-orange-300 rounded-lg animate-float-reverse transform -rotate-12"></div>
      </div>

      <!-- Subtle Geometric Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-32 h-32 border-2 border-orange-300 rounded-lg transform rotate-12"></div>
        <div class="absolute top-32 right-20 w-24 h-24 border border-orange-200 rounded-full"></div>
        <div class="absolute bottom-20 left-20 w-40 h-40 border border-orange-100 rounded-2xl transform -rotate-6"></div>
        <div class="absolute bottom-32 right-32 w-28 h-28 border-2 border-orange-200 rounded-lg transform rotate-45"></div>
      </div>

      <div class="relative z-10 text-center space-y-12 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Moved Up: Brand Name with Enhanced Animation -->
        <div class=" phitagate-font relative group pt-8 animate-fade-in-up">
          <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight capitalize relative cursor-default transform-gpu">
            <span class="relative inline-block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm animate-gradient-shift">
              spacefurnio
            </span>

            <!-- Enhanced Glow Effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-orange-500/20 to-orange-600/20 blur-2xl animate-pulse-gentle scale-110"></div>

            <!-- Animated Underline -->
            <div class="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out"></div>
          </h1>
        </div>

        <!-- Enhanced Tagline - Moved Up -->
        <div class=" phitagate-font relative group animate-fade-in-up animation-delay-300">
          <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-gray-700 font-light tracking-wide capitalize relative overflow-hidden leading-tight">
            <span class="inline-block bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 bg-clip-text text-transparent">
              creative meets living
            </span>

            <!-- Subtle shimmer effect -->
            <div class="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>

            <!-- Breathing glow -->
            <div class="absolute inset-0 bg-gradient-to-r from-gray-400/10 via-gray-500/10 to-gray-400/10 blur-lg animate-breathe"></div>
          </h2>
        </div>

        <!-- NEW: Mission Statement Section -->
        <div class="relative max-w-4xl mx-auto animate-fade-in-up animation-delay-600">
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-8 sm:p-10 lg:p-12 shadow-lg border border-orange-200/50 hover:shadow-xl transition-all duration-500">
            <div class="flex items-center justify-center mb-6">
              <div class="w-12 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
              <h3 class=" phitagate-font mx-4 text-lg font-medium text-orange-500 tracking-wider uppercase">Our Mission</h3>
              <div class="w-12 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
            </div>

            <p class="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed text-center font-light">
              To revolutionize modern living spaces by crafting innovative, sustainable furniture that seamlessly blends
              <span class="text-orange-500 font-medium">exceptional design</span> with
              <span class="text-orange-500 font-medium">functional elegance</span>,
              making beautiful, high-quality furniture accessible to everyone while preserving our planet for future generations.
            </p>

            <!-- Mission highlights -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              <div class="text-center group">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors duration-300">
                  <div class="w-6 h-6 bg-orange-500 rounded-sm"></div>
                </div>
                <p class="text-gray-600 font-medium">Design Excellence</p>
              </div>
              <div class="text-center group">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors duration-300">
                  <div class="w-6 h-6 bg-orange-500 rounded-full"></div>
                </div>
                <p class="text-gray-600 font-medium">Sustainability</p>
              </div>
              <div class="text-center group">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors duration-300">
                  <div class="w-6 h-6 bg-orange-500 rounded-lg"></div>
                </div>
                <p class="text-gray-600 font-medium">Accessibility</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
        <div class="w-6 h-10 border-2 border-orange-400/50 rounded-full flex justify-center relative hover:border-orange-500 transition-colors duration-300">
          <div class="w-1 h-3 bg-orange-500 rounded-full mt-2 animate-scroll-dot"></div>
        </div>
      </div>
    </section>

    <!-- Enhanced About Section -->
    <section class="about-section py-20 px-6 max-w-7xl mx-auto">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-16 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent animate-fade-in-up">
          About SpaceFurnio
        </h2>

        <div class="space-y-12">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div class="animate-fade-in-right">
              <p class="text-lg lg:text-xl text-gray-700 leading-relaxed mb-6">
                At SpaceFurnio, we believe that your living space should be a reflection of your unique personality and lifestyle.
                Founded with a passion for transformative design, we specialize in creating furniture that doesn't just occupy space—it elevates it.
              </p>
              <p class="text-lg lg:text-xl text-gray-700 leading-relaxed">
                Our journey began with a simple question: Why should exceptional design be a luxury? Today, we're proud to offer
                innovative, sustainable furniture solutions that make beautiful living accessible to all.
              </p>
            </div>
            <div class="relative animate-fade-in-left">
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-lg">
                <div class="text-center">
                  <div class="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div class="w-10 h-10 bg-white rounded-lg"></div>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-900 mb-2">10,000+</h3>
                  <p class="text-gray-600">Happy Homes Transformed</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Feature List -->
          <div class="animate-fade-in-up">
            <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">What Sets Us Apart</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors duration-300 group">
                <div class="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Innovative Design Solutions</h4>
                  <p class="text-gray-600">Transform living spaces with cutting-edge designs that blend form and function seamlessly.</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors duration-300 group">
                <div class="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Sustainable Materials</h4>
                  <p class="text-gray-600">Eco-friendly manufacturing processes and responsibly sourced materials for a better tomorrow.</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors duration-300 group">
                <div class="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Customizable Pieces</h4>
                  <p class="text-gray-600">Tailored furniture solutions that adapt to your individual needs and preferences.</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors duration-300 group">
                <div class="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Quality Craftsmanship</h4>
                  <p class="text-gray-600">Meticulous attention to detail and commitment to excellence in every piece we create.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Brand Manifesto -->
    <section class="manifesto-section py-20 px-6 bg-gradient-to-br from-orange-50/50 via-white to-gray-50">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-16 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent animate-fade-in-up">
          Our Philosophy
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Left Column - Values -->
          <div class="space-y-8">
            <div class="flex items-start space-x-4 group animate-fade-in-right">
              <div class="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Design for Everyone</h3>
                <p class="text-gray-700">Exceptional design should be accessible to everyone, not just the privileged few. We democratize beautiful living.</p>
              </div>
            </div>

            <div class="flex items-start space-x-4 group animate-fade-in-right animation-delay-200">
              <div class="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Sustainable Future</h3>
                <p class="text-gray-700">Our commitment to sustainability drives every decision, from material selection to production methods.</p>
              </div>
            </div>

            <div class="flex items-start space-x-4 group animate-fade-in-right animation-delay-300">
              <div class="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Innovation Beyond Technology</h3>
                <p class="text-gray-700">True innovation is about reimagining how people interact with and experience their living spaces.</p>
              </div>
            </div>
          </div>

          <!-- Right Column - Values -->
          <div class="space-y-8">
            <div class="flex items-start space-x-4 group animate-fade-in-left">
              <div class="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Quality Commitment</h3>
                <p class="text-gray-700">Quality is never an accident; it's the result of intelligent effort and meticulous attention to detail.</p>
              </div>
            </div>

            <div class="flex items-start space-x-4 group animate-fade-in-left animation-delay-200">
              <div class="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Stories & Connections</h3>
                <p class="text-gray-700">We create furniture that tells stories and builds meaningful connections between people and their environments.</p>
              </div>
            </div>

            <div class="flex items-start space-x-4 group animate-fade-in-left animation-delay-300">
              <div class="w-4 h-4 bg-orange-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-300"></div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Collaborative Spirit</h3>
                <p class="text-gray-700">We work closely with architects and interior designers to create harmonious, integrated living solutions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Team Section -->
    <section class="team-section py-20 px-6 bg-white">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-16 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent animate-fade-in-up">
          Meet Our Team
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group hover:scale-105 animate-fade-in-up">
            <div class="p-8 text-center space-y-4">
              <div class="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                <div class="w-12 h-12 bg-orange-500 rounded-full"></div>
              </div>
              <h3 class="text-xl font-semibold text-gray-900">Sarah Johnson</h3>
              <p class="text-orange-500 font-medium">Creative Director</p>
              <p class="text-gray-600 text-sm">Visionary leader with 15+ years in furniture design</p>
            </div>
          </div>

          <div class="bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group hover:scale-105 animate-fade-in-up animation-delay-200">
            <div class="p-8 text-center space-y-4">
              <div class="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                <div class="w-12 h-12 bg-orange-500 rounded-full"></div>
              </div>
              <h3 class="text-xl font-semibold text-gray-900">Michael Chen</h3>
              <p class="text-orange-500 font-medium">Lead Designer</p>
              <p class="text-gray-600 text-sm">Innovative designer specializing in sustainable materials</p>
            </div>
          </div>

          <div class="bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group hover:scale-105 animate-fade-in-up animation-delay-300">
            <div class="p-8 text-center space-y-4">
              <div class="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                <div class="w-12 h-12 bg-orange-500 rounded-full"></div>
              </div>
              <h3 class="text-xl font-semibold text-gray-900">Emma Rodriguez</h3>
              <p class="text-orange-500 font-medium">Product Manager</p>
              <p class="text-gray-600 text-sm">Strategic thinker ensuring quality and customer satisfaction</p>
            </div>
          </div>

          <div class="bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group hover:scale-105 animate-fade-in-up animation-delay-400">
            <div class="p-8 text-center space-y-4">
              <div class="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                <div class="w-12 h-12 bg-orange-500 rounded-full"></div>
              </div>
              <h3 class="text-xl font-semibold text-gray-900">David Kim</h3>
              <p class="text-orange-500 font-medium">Head of Engineering</p>
              <p class="text-gray-600 text-sm">Technical expert driving manufacturing excellence</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Back to Top Section -->
    <div class="flex justify-center py-12 bg-gradient-to-br from-orange-50/50 via-white to-gray-50">
      <button
        @click="scrollToTop"
        class="inline-flex items-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-500/25"
      >
        <span class="mr-2">↑</span>
        Back to Top
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Initialize animations on mount
onMounted(() => {
  // Trigger animations after component mounts
  const elements = document.querySelectorAll('.animate-fade-in-up, .animate-fade-in-left, .animate-fade-in-right')
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0) translateX(0)'
    }, index * 100)
  })
})
</script>

<style scoped>
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif;
}

.about-us-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Animation Classes */
.animate-fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.animate-fade-in-left {
  opacity: 0;
  transform: translateX(-30px);
  transition: all 0.8s ease-out;
}

.animate-fade-in-right {
  opacity: 0;
  transform: translateX(30px);
  transition: all 0.8s ease-out;
}

.animation-delay-200 {
  transition-delay: 200ms;
}

.animation-delay-300 {
  transition-delay: 300ms;
}

.animation-delay-400 {
  transition-delay: 400ms;
}

.animation-delay-600 {
  transition-delay: 600ms;
}

/* Custom Keyframe Animations */
@keyframes float-slow {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(180deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-10px) scale(1.2); }
}

@keyframes float-reverse {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(10px) rotate(-180deg); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse-gentle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(200%) skewX(-12deg); }
}

@keyframes breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes scroll-dot {
  0% { transform: translateY(0px); opacity: 1; }
  50% { transform: translateY(10px); opacity: 0.5; }
  100% { transform: translateY(0px); opacity: 1; }
}

/* Apply Custom Animations */
.animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 4s ease-in-out infinite 2s; }
.animate-float-reverse { animation: float-reverse 5s ease-in-out infinite 1s; }
.animate-gradient-shift {
  background-size: 200% 200%;
  animation: gradient-shift 4s ease-in-out infinite;
}
.animate-pulse-gentle { animation: pulse-gentle 3s ease-in-out infinite; }
.animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
.animate-breathe { animation: breathe 4s ease-in-out infinite; }
.animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
.animate-scroll-dot { animation: scroll-dot 2s ease-in-out infinite; }

/* Smooth Transitions */
* {
  transition-timing-function: cubic-bezier(0.23, 1, 0.320, 1);
}

/* Hardware Acceleration */
.transform-gpu {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Responsive Typography */
html {
  scroll-behavior: smooth;
}

/* Enhanced hover effects */
.group:hover .group-hover\:scale-125 {
  transform: scale(1.25);
}

.group:hover .group-hover\:from-orange-200 {
  --tw-gradient-from: #fed7aa;
}

.group:hover .group-hover\:to-orange-300 {
  --tw-gradient-to: #fdba74;
}

/* Focus states */
button:focus {
  outline: none;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #f97316;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #ea580c;
}
</style>
