<template>
  <div class="about-us-container">
  <section class="hero-section relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
    <!-- Subtle Animated Background Elements -->
    <div class="absolute inset-0 opacity-30">
      <!-- Floating Orbs -->
      <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-400 rounded-full animate-float-slow"></div>
      <div class="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-500 rounded-full animate-float-delayed"></div>
      <div class="absolute bottom-1/3 left-1/5 w-3 h-3 bg-orange-300 rounded-full animate-float-reverse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-orange-400 rounded-full animate-float-slow"></div>
    </div>

    <!-- Subtle Grid Pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="grid grid-cols-20 gap-px h-full">
        <div v-for="i in 400" :key="i" class="border border-gray-400 animate-pulse" :style="{ animationDelay: `${i * 0.01}s` }"></div>
      </div>
    </div>

    <div class="relative z-10 text-center space-y-8 phitagate-font w-full max-w-4xl mx-auto px-4">
      <!-- Brand Name with Complex Layered Animation -->
      <div class="relative group">
        <h1
          v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down' }"
          class="text-6xl md:text-8xl font-bold tracking-tight capitalize relative cursor-default transform-gpu"
        >
          <!-- Main Text with Enhanced Gradient -->
          <span class="relative inline-block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm animate-gradient-shift w-[100%]">
            spacefurnio
          </span>

          <!-- Subtle Glow Effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-orange-500/20 to-orange-600/20 blur-2xl animate-pulse-gentle scale-110"></div>

          <!-- Animated Underline -->
          <div class="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out"></div>

          <!-- Floating Letters Effect on Hover -->
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <span class="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent animate-float-letters">
              spacefurnio
            </span>
          </div>
        </h1>
      </div>

      <!-- Tagline with Elegant Reveal Animation -->
      <div class="relative group">
        <div
          v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 200 }"
          class="text-xl md:text-2xl text-gray-600 font-light tracking-wide capitalize relative overflow-hidden"
        >
          <!-- Letter-by-letter reveal effect -->
          <span class="inline-block animate-type-writer">
            <span class="animate-letter-1">c</span><span class="animate-letter-2">r</span><span class="animate-letter-3">e</span><span class="animate-letter-4">a</span><span class="animate-letter-5">t</span><span class="animate-letter-6">i</span><span class="animate-letter-7">v</span><span class="animate-letter-8">e</span>
            <span class="animate-letter-9 ms-2">m</span><span class="animate-letter-10">e</span><span class="animate-letter-11">e</span><span class="animate-letter-12">t</span><span class="animate-letter-13">s</span>
            <span class="animate-letter-14 ms-2">l</span><span class="animate-letter-15">i</span><span class="animate-letter-16">v</span><span class="animate-letter-17">i</span><span class="animate-letter-18">n</span><span class="animate-letter-19">g</span>
          </span>

          <!-- Subtle shimmer effect -->
          <div class="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>

          <!-- Breathing glow -->
          <div class="absolute inset-0 bg-gradient-to-r from-gray-400/10 via-gray-500/10 to-gray-400/10 blur-lg animate-breathe"></div>
        </div>
      </div>
    </div>

    <!-- Elegant Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
      <div class="w-6 h-10 border-2 border-gray-400/30 rounded-full flex justify-center relative">
        <div class="w-1 h-3 bg-orange-400/60 rounded-full mt-2 animate-scroll-dot"></div>
      </div>
    </div>
  </section>

    <!-- About Section -->
    <section class="about-section py-20 px-6 max-w-4xl mx-auto">
      <h2
        v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down' }"
        class="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
      >
        About Us
      </h2>

      <div class="space-y-8">
        <p
          v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 100 }"
          class="text-lg text-gray-700 leading-relaxed"
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>

        <ul
          v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 200 }"
          class="space-y-4 text-gray-700"
        >
          <li class="flex items-start space-x-3">
            <span class="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Innovative design solutions that transform living spaces</span>
          </li>
          <li class="flex items-start space-x-3">
            <span class="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Sustainable materials and eco-friendly manufacturing processes</span>
          </li>
          <li class="flex items-start space-x-3">
            <span class="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Customizable furniture pieces tailored to individual needs</span>
          </li>
          <li class="flex items-start space-x-3">
            <span class="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Collaborative approach with architects and interior designers</span>
          </li>
          <li class="flex items-start space-x-3">
            <span class="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Commitment to quality craftsmanship and attention to detail</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Brand Manifesto -->
    <section class="manifesto-section py-20 px-6 bg-gray-50">
      <div class="max-w-4xl mx-auto">
        <h2
          v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down' }"
          class="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
        >
          Brand Manifesto
        </h2>

        <ul class="space-y-6 text-lg text-gray-700">
          <li
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 100 }"
            class="flex items-start space-x-4"
          >
            <span class="w-3 h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>We believe that exceptional design should be accessible to everyone, not just the privileged few.</span>
          </li>
          <li
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 200 }"
            class="flex items-start space-x-4"
          >
            <span class="w-3 h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Our commitment to sustainability drives every decision we make, from material selection to production methods.</span>
          </li>
          <li
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 300 }"
            class="flex items-start space-x-4"
          >
            <span class="w-3 h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Innovation is not just about technology; it's about reimagining how people interact with their spaces.</span>
          </li>
          <li
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 400 }"
            class="flex items-start space-x-4"
          >
            <span class="w-3 h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>Quality is never an accident; it's the result of intelligent effort and meticulous attention to detail.</span>
          </li>
          <li
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 500 }"
            class="flex items-start space-x-4"
          >
            <span class="w-3 h-3 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
            <span>We create furniture that tells stories and builds connections between people and their environments.</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Our Team -->
    <section class="team-section py-20 px-6">
      <div class="max-w-6xl mx-auto">
        <h2
          v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down' }"
          class="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
        >
          Our Team
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
          <Card
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 100 }"
            class="text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <template #content>
              <div class="p-6 space-y-4">
                <div class="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                  <i class="pi pi-user text-3xl text-gray-600"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Sarah Johnson</h3>
                <p class="text-gray-600">Creative Director</p>
              </div>
            </template>
          </Card>

          <Card
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 200 }"
            class="text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <template #content>
              <div class="p-6 space-y-4">
                <div class="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                  <i class="pi pi-user text-3xl text-gray-600"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Michael Chen</h3>
                <p class="text-gray-600">Lead Designer</p>
              </div>
            </template>
          </Card>

          <Card
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 300 }"
            class="text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <template #content>
              <div class="p-6 space-y-4">
                <div class="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                  <i class="pi pi-user text-3xl text-gray-600"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">Emma Rodriguez</h3>
                <p class="text-gray-600">Product Manager</p>
              </div>
            </template>
          </Card>

          <Card
            v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', delay: 400 }"
            class="text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <template #content>
              <div class="p-6 space-y-4">
                <div class="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                  <i class="pi pi-user text-3xl text-gray-600"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">David Kim</h3>
                <p class="text-gray-600">Head of Engineering</p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section>

    <!-- Back to Top Button -->
    <div class="flex justify-center py-12 bg-gray-50">
      <Button
        @click="scrollToTop"
        icon="pi pi-arrow-up"
        label="Back to Top"
        class="p-button-outlined p-button-secondary"
        size="large"
      />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import Card from 'primevue/card'

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif;
}

/* Custom animations for AOS */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-out-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(30px);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

.animate-fade-out-down {
  animation: fade-out-down 0.8s ease-out forwards;
}

/* Smooth scrolling for the entire page */
html {
  scroll-behavior: smooth;
}

/* Additional styling for better visual hierarchy */
.hero-section h1 {
  letter-spacing: -0.02em;
}

.about-us-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Responsive typography adjustments */
@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 3rem;
  }

  .hero-section p {
    font-size: 1.125rem;
  }
}

/* Card hover effects */
.p-card:hover {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

/* Button styling */
.p-button {
  border-radius: 8px;
  font-weight: 500;
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

@keyframes float-letters {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
}

/* Keyframe to fade and scale letters in */
@keyframes letter-reveal {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-letter-1 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.1s; }
.animate-letter-2 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.2s; }
.animate-letter-3 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.3s; }
.animate-letter-4 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.4s; }
.animate-letter-5 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.5s; }
.animate-letter-6 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.6s; }
.animate-letter-7 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.7s; }
.animate-letter-8 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.8s; }
.animate-letter-9 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 0.9s; }
.animate-letter-10 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1s; }
.animate-letter-11 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.1s; }
.animate-letter-12 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.2s; }
.animate-letter-13 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.3s; }
.animate-letter-14 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.4s; }
.animate-letter-15 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.5s; }
.animate-letter-16 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.6s; }
.animate-letter-17 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.7s; }
.animate-letter-18 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.8s; }
.animate-letter-19 { animation: letter-reveal 0.3s ease-out forwards; animation-delay: 1.9s; }

/*
@keyframes letter-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
} */

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
.animate-float-letters { animation: float-letters 3s ease-in-out infinite; }

/* Enhanced Gradient Background */
.bg-gradient-to-br {
  background-image: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Smooth Transitions */
* {
  transition-timing-function: cubic-bezier(0.23, 1, 0.320, 1);
}

/* Hardware Acceleration */
.transform-gpu {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Grid Columns for Background */
.grid-cols-20 {
  grid-template-columns: repeat(20, minmax(0, 1fr));
}
</style>
