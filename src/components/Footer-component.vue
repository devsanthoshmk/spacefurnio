<template>
  <footer class="bg-black text-gray-300 py-12 px-6 md:py-12 md:px-6 sm:py-8 sm:px-4">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        <!-- Navigation Column -->
        <div v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', once: false }">
          <nav aria-label="Footer Navigation">
            <h3 class="text-white text-lg font-semibold mb-4">Navigation</h3>
            <ul class="space-y-2">

        <li>
          <router-link to="/" class="text-gray-300 hover:text-white transition-colors duration-300">
            Home
          </router-link>
        </li>
        <li>
          <router-link to="/about" class="text-gray-300 hover:text-white transition-colors duration-300">
            About Us
          </router-link>
        </li>
        <li>
          <router-link to="/collabs" class="text-gray-300 hover:text-white transition-colors duration-300">
            SF x Collabs
          </router-link>
        </li>
        <li>
          <router-link to="/shopping" class="text-gray-300 hover:text-white transition-colors duration-300">
            Shopping
          </router-link>
        </li>
        <li>
          <router-link to="/portfolio" class="text-gray-300 hover:text-white transition-colors duration-300">
            Portfolio
          </router-link>
        </li>
        <li>
          <router-link to="/projects" class="text-gray-300 hover:text-white transition-colors duration-300">
            Ongoing Projects
          </router-link>
        </li>
      </ul>
    </nav>
  </div>

        <!-- Contact Column -->
        <div v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', once: false }">
          <h3 class="text-white text-lg font-semibold mb-4">Contact</h3>
          <div class="space-y-3">
            <address class="not-italic">
              <div class="text-gray-300">
                1234 Street Name<br>
                City, Country
              </div>
            </address>
            <div>
              <a href="tel:+00123456789" class="text-gray-300 hover:text-white transition-colors duration-300">
                (+00) 123-456-7890
              </a>
            </div>
            <div>
              <a href="mailto:info@example.com" class="text-gray-300 hover:text-white transition-colors duration-300">
                info@example.com
              </a>
            </div>
          </div>
        </div>

        <!-- Social Column -->
        <div v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', once: false }">
          <h3 class="text-white text-lg font-semibold mb-4">Follow Us</h3>
          <div class="flex space-x-3">
            <Button
              icon="pi pi-facebook"
              class="p-button-outlined p-button-secondary hover:bg-white hover:text-black transition-all duration-300"
              aria-label="Follow us on Facebook"
              @click="handleSocialClick('facebook')"
            />
            <Button
              icon="pi pi-twitter"
              class="p-button-outlined p-button-secondary hover:bg-white hover:text-black transition-all duration-300"
              aria-label="Follow us on Twitter"
              @click="handleSocialClick('twitter')"
            />
            <Button
              icon="pi pi-instagram"
              class="p-button-outlined p-button-secondary hover:bg-white hover:text-black transition-all duration-300"
              aria-label="Follow us on Instagram"
              @click="handleSocialClick('instagram')"
            />
            <Button
              icon="pi pi-linkedin"
              class="p-button-outlined p-button-secondary hover:bg-white hover:text-black transition-all duration-300"
              aria-label="Follow us on LinkedIn"
              @click="handleSocialClick('linkedin')"
            />
          </div>
        </div>


        <!-- Legal Column -->
        <div v-animateonscroll="{ enterClass: 'animate-fade-in-up', leaveClass: 'animate-fade-out-down', once: false }">
          <h3 class="text-white text-lg font-semibold mb-4">Legal</h3>
          <div class="text-gray-300">
            <p>© {{ currentYear }} <span class="phitagate-font bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent text-[2.5vw] p-2">spacefurnio</span> – All rights reserved.</p>
          </div>
        </div>

      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

// Compute current year
const currentYear = computed(() => new Date().getFullYear())

// Handle social media clicks (placeholder functionality)
const handleSocialClick = (platform) => {
  // Placeholder URLs - replace with actual social media URLs
  const socialUrls = {
    facebook: 'https://facebook.com/spacefurnio',
    twitter: 'https://twitter.com/spacefurnio',
    instagram: 'https://instagram.com/spacefurnio',
    linkedin: 'https://linkedin.com/company/spacefurnio'
  }

  // In a real app, you'd navigate to the URL
  console.log(`Navigate to ${platform}: ${socialUrls[platform]}`)
  // window.open(socialUrls[platform], '_blank')
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

/* Custom animations for AnimateOnScroll */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-fade-out-down {
  animation: fadeOutDown 0.6s ease-in forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(30px);
  }
}

/* Ensure PrimeVue buttons inherit the color scheme */
:deep(.p-button-outlined.p-button-secondary) {
  border-color: #6b7280;
  color: #6b7280;
}

:deep(.p-button-outlined.p-button-secondary:hover) {
  background-color: white;
  color: black;
  border-color: white;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .grid {
    gap: 1.5rem;
  }
}
</style>
