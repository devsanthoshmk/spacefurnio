<template>
  <footer
    class="w-full bg-black text-gray-300 py-12 sm:py-14 md:py-16 px-5 sm:px-8 lg:px-12 flex flex-col justify-center"
    role="contentinfo"
  >
    <div class="max-w-7xl mx-auto w-full">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 xl:gap-12">
        <!-- Navigation Column -->
        <div>
          <nav aria-label="Footer Navigation">
            <h3 class="text-white text-base sm:text-lg font-semibold tracking-wider uppercase mb-4 sm:mb-5">
              Navigation
            </h3>
            <ul class="space-y-2.5 sm:space-y-3">
              <li>
                <router-link
                  to="/"
                  class="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Home
                </router-link>
              </li>
              <li>
                <router-link
                  to="/about"
                  class="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  About Us
                </router-link>
              </li>
              <li>
                <router-link
                  to="/collabs"
                  class="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  SF x Collabs
                </router-link>
              </li>
              <li>
                <router-link
                  to="/shop"
                  class="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Shopping
                </router-link>
              </li>
              <li>
                <router-link
                  to="/portfolio"
                  class="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Portfolio
                </router-link>
              </li>
              <li>
                <router-link
                  to="/contact"
                  class="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Contact Us
                </router-link>
              </li>
            </ul>
          </nav>
        </div>

        <!-- Contact Column -->
        <div>
          <h3 class="text-white text-base sm:text-lg font-semibold tracking-wider uppercase mb-4 sm:mb-5">
            Contact
          </h3>
          <div class="space-y-3 sm:space-y-4 text-sm sm:text-base">
            <address class="not-italic text-gray-400 leading-relaxed">
              90/1, North Beach Road Tuticorin,<br />
              Chennai – 628001.
            </address>
            <div>
              <a
                href="tel:+919751112025"
                class="text-gray-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-2"
              >
                +91 9751112025
              </a>
            </div>
            <div>
              <a
                href="mailto:info.spacefurnio@gmail.com"
                class="text-gray-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-2 break-all sm:break-normal"
              >
                info.spacefurnio@gmail.com
              </a>
            </div>
          </div>
        </div>

        <!-- Follow Us Column -->
        <div>
          <h3 class="text-white text-base sm:text-lg font-semibold tracking-wider uppercase mb-4 sm:mb-5">
            Follow Us
          </h3>
          <div class="flex flex-wrap items-center gap-3">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
              class="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-600 text-gray-300 hover:text-black hover:bg-white hover:border-white transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <i :class="social.icon" class="text-base sm:text-lg"></i>
            </a>
          </div>
        </div>

        <!-- Legal Column -->
        <div>
          <h3 class="text-white text-base sm:text-lg font-semibold tracking-wider uppercase mb-4 sm:mb-5">
            Legal
          </h3>
          <div class="text-gray-400 text-sm sm:text-base leading-relaxed space-y-3">
            <p class="flex flex-wrap items-baseline gap-1.5">
              <span>© {{ currentYear }}</span>
              <span
                class="phitagate-font bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent text-lg sm:text-xl font-bold tracking-wide"
              >
                spacefurnio
              </span>
              <span>– All rights reserved.</span>
            </p>
            <p class="text-xs text-gray-500 leading-normal">
              Transforming spaces with bespoke craftsmanship and timeless architectural elegance.
            </p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())

const socialLinks = [
  {
    name: 'facebook',
    label: 'Follow us on Facebook',
    icon: 'pi pi-facebook',
    url: 'https://facebook.com/spacefurnio',
  },
  {
    name: 'twitter',
    label: 'Follow us on Twitter',
    icon: 'pi pi-twitter',
    url: 'https://twitter.com/spacefurnio',
  },
  {
    name: 'instagram',
    label: 'Follow us on Instagram',
    icon: 'pi pi-instagram',
    url: 'https://instagram.com/spacefurnio',
  },
  {
    name: 'linkedin',
    label: 'Follow us on LinkedIn',
    icon: 'pi pi-linkedin',
    url: 'https://linkedin.com/company/spacefurnio',
  },
]
</script>

<style scoped>
@font-face {
  font-family: 'Phitagate';
  src: url('/fonts/Phitagate.otf') format('opentype');
}

.phitagate-font {
  font-family: 'Phitagate', serif;
}
</style>
