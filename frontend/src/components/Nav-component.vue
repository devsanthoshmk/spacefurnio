<template>
  <nav id="navbar" class="fixed top-0 w-full z-50 py-6 px-4" style="z-index: 100000;">
    <div class="nav-pill bg-white/90 backdrop-blur-md border border-gray-100 rounded-full shadow-lg mx-auto max-w-5xl px-8 py-3 flex items-center justify-between">

      <div class="nav-left flex items-center me-2">
        <img src="/images/Spacefurnio-Logo.png" alt="spacefurnio logo" class="h-9 w-7 object-contain">
      </div>

      <!-- Desktop Menu - Centered -->
      <ul class="menu hidden md:flex items-center flex-1 justify-center text-sm font-medium tracking-wide">
        <li>
          <router-link to="/" class="nav-link flex text-center
 relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Home
          </router-link>
        </li>
        <li>
          <router-link to="/about" class="nav-link flex text-center
 relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            About Us
          </router-link>
        </li>
        <li>
          <router-link to="/collabs" class="nav-link flex text-center
 relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            SF x Collabs
          </router-link>
        </li>
        <li>
          <router-link to="/shop" class="nav-link flex text-center
 relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Shopping
          </router-link>
        </li>
        <li>
          <router-link to="/portfolio" class="nav-link flex text-center
 relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Portfolio
          </router-link>
        </li>
        <li>
          <router-link to="/projects" class="nav-link flex text-center
 relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Contact Us
          </router-link>
        </li>
      </ul>

      <!-- Small Screen Navigation -->
      <ul class="menu flex md:hidden items-center space-x-4 flex-1 justify-center text-xs font-medium">
        <li>
          <router-link to="/" class="nav-link flex text-center
 py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Home
          </router-link>
        </li>
        <li>
          <router-link to="/shopping" class="nav-link flex text-center
 py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Shop
          </router-link>
        </li>
        <li>
          <router-link to="/portfolio" class="nav-link flex text-center
 py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50">
            Work
          </router-link>
        </li>
      </ul>

      <!-- Right Side Icons -->
      <div class="nav-right flex items-center space-x-4">
        <div class="icons hidden sm:flex items-center space-x-4 text-base">
          <button class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="Search">
            <i class="fas fa-search"></i>
          </button>
          <button class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="User Account">
            <i class="fas fa-user"></i>
          </button>
          <button class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="Wishlist">
            <i class="fas fa-heart"></i>
          </button>
          <button class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="Cart">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          class="md:hidden mobile-menu-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
          aria-label="Toggle menu"
          @click="toggleMobileMenu"
        >
          <i class="fas fa-bars text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div
      v-if="mobileMenuOpen"
      class="mobile-menu absolute top-full left-4 right-4 mt-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-6 px-6 z-40"
    >
      <div class="md:hidden">
        <ul class="space-y-4 text-xs font-medium">
          <li>
            <router-link
              to="/about"
              class="block py-3 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50"
              @click="closeMobileMenu"
            >
              About Us
            </router-link>
          </li>
          <li>
            <router-link
              to="/collabs"
              class="block py-3 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50"
              @click="closeMobileMenu"
            >
              SF x Collabs
            </router-link>
          </li>
          <li>
            <router-link
              to="/projects"
              class="block py-3 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50"
              @click="closeMobileMenu"
            >
              Contact Us
            </router-link>
          </li>
        </ul>

        <!-- Mobile Icons -->
        <div class="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-100">
          <button class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="Search">
            <i class="fas fa-search text-sm"></i>
          </button>
          <button class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="User Account">
            <i class="fas fa-user text-sm"></i>
          </button>
          <button class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="Wishlist">
            <i class="fas fa-heart text-sm"></i>
          </button>
          <button class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100" aria-label="Cart">
            <i class="fas fa-shopping-cart text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function handleClickOutside(e) {
  const navbar = document.getElementById('navbar')
  if (navbar && !navbar.contains(e.target)) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Glass morphism effect */
.nav-pill {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Navigation links */
.nav-link flex text-center
 {
  color: #374151;
  text-decoration: none;
  position: relative;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.nav-link flex text-center
:hover {
  color: #1f2937;
  background-color: rgba(243, 244, 246, 0.6);
}

.nav-link flex text-center
.router-link-active {
  color: #1f2937;
  background-color: rgba(243, 244, 246, 0.8);
}

/* Icon buttons */
.icon-btn {
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.icon-btn:hover {
  color: #374151;
  background-color: rgba(243, 244, 246, 0.6);
}

/* Mobile menu */
.mobile-menu {
  animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .nav-pill {
    padding: 0.75rem 1.5rem;
    max-width: calc(100% - 2rem);
  }

  .mobile-menu {
    left: 1rem;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .nav-pill {
    padding: 0.75rem 1rem;
  }

  .mobile-menu {
    left: 0.75rem;
    right: 0.75rem;
  }
}

/* Subtle animations */
.nav-pill {
  transition: all 0.3s ease;
}

.nav-pill:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* the little hover‑image */
.nav-link::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -8px;              /* tweak up/down as needed */
  transform: translateX(-50%);
  width: 10px;                /* your icon’s width */
  height: 10px;               /* your icon’s height */
  background: url('@/assets/images/nav-img.png') no-repeat center/contain;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;       /* so it never steals your hover */
}

/* fade it in on hover */
.nav-link:hover::after {
  opacity: 1;
}



/* Remove default focus outline and add custom */
/* button:focus,
.nav-link flex text-center
:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
} */
</style>
