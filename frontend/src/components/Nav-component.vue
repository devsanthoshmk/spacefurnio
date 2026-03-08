<template>
<nav id="navbar" class="fixed top-0 w-full z-50 py-6 px-4" style="z-index: 100000">
  <div
    class="nav-pill bg-white/90 backdrop-blur-md border border-gray-100 rounded-full shadow-lg mx-auto max-w-5xl flex items-center justify-between px-8 py-3 h-16 transition-all duration-300"
  >
    <!-- Logo / Search Back Button -->
    <div class="nav-left flex items-center me-2">
      <button
        v-if="searchMode"
        @click="closeSearch"
        class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
        aria-label="Close search"
      >
        <i class="fas fa-arrow-left"></i>
      </button>
      <img
        v-else
        src="/images/Spacefurnio-Logo.png"
        alt="spacefurnio logo"
        class="h-9 w-7 object-contain"
      />
    </div>

    <!-- Search Mode -->
    <div
      v-if="searchMode"
      class="search-container flex-1 mx-6 relative"
    >
      <div class="relative group">
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-black transform origin-left scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"></div>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search furniture, styles, rooms..."
          class="w-full py-2 bg-transparent border-0 text-base outline-none transition-all duration-300"
          @keydown.enter="submitSearch"
          @keydown.escape="closeSearch"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-16 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200"
        >
          <i class="fas fa-times text-sm"></i>
        </button>
        <div
          v-if="searchQuery && searchLoading"
          class="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"
        ></div>
        <button
          @click="submitSearch"
          class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-900 transition-all duration-200"
        >
          <i class="fas fa-search text-sm"></i>
        </button>
      </div>

      <!-- Search Results Dropdown -->
      <div
        v-if="showResults && searchResults.length > 0"
        class="search-results absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[28rem] overflow-y-auto"
      >
        <div class="p-3">
          <div class="flex items-center justify-between px-3 py-2 mb-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Products
            </p>
            <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {{ searchResults.length }} found
            </span>
          </div>
          <button
            v-for="product in searchResults"
            :key="product.id"
            @click="goToProduct(product)"
            class="search-result-item w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200 text-left"
          >
            <img
              :src="product.images?.[0] || '/images/placeholder.png'"
              :alt="product.name"
              class="w-16 h-16 object-cover rounded-lg shadow-sm"
            />
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 mb-0.5 line-clamp-1">{{ product.name }}</h4>
              <p class="text-xs text-gray-500 mb-1.5 capitalize font-medium">{{ product.category }}</p>
              <p class="text-base font-semibold text-orange-600">
                ${{ product.price?.toFixed(2) }}
              </p>
            </div>
            <i class="fas fa-chevron-right text-gray-400 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"></i>
          </button>
          <div class="border-t border-gray-100 my-2"></div>
          <button
            @click="submitSearch"
            class="w-full p-3.5 text-center text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>View all results</span>
            <i class="fas fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- No Results -->
      <div
        v-else-if="showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading"
        class="search-results absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl p-8 text-center"
      >
        <div class="text-gray-400 mb-4">
          <i class="fas fa-search text-3xl opacity-50"></i>
        </div>
        <p class="text-gray-600 font-medium mb-1">No results found</p>
        <p class="text-sm text-gray-400">Try a different search term</p>
      </div>
    </div>

    <!-- Desktop Menu - Centered -->
    <ul
      v-else
      class="menu hidden md:flex items-center flex-1 justify-center text-sm font-medium tracking-wide"
    >
      <li>
        <router-link
          to="/"
          class="nav-link flex text-center relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Home
        </router-link>
      </li>
      <li>
        <router-link
          to="/about"
          class="nav-link flex text-center relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          About Us
        </router-link>
      </li>
      <li>
        <router-link
          to="/collabs"
          class="nav-link flex text-center relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          SF x Collabs
        </router-link>
      </li>
      <li>
        <router-link
          to="/shop"
          class="nav-link flex text-center relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Shop
        </router-link>
      </li>
      <li>
        <router-link
          to="/portfolio"
          class="nav-link flex text-center relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Portfolio
        </router-link>
      </li>
      <li>
        <router-link
          to="/contact"
          class="nav-link flex text-center relative py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Contact Us
        </router-link>
      </li>
    </ul>

    <!-- Small Screen Navigation -->
    <ul
      v-if="!searchMode"
      class="menu flex md:hidden items-center space-x-4 flex-1 justify-center text-xs font-medium"
    >
      <li>
        <router-link
          to="/"
          class="nav-link flex text-center py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Home
        </router-link>
      </li>
      <li>
        <router-link
          to="/shop"
          class="nav-link flex text-center py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Shop
        </router-link>
      </li>
      <li>
        <router-link
          v-if="!isShopPage"
          to="/portfolio"
          class="nav-link flex text-center py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
        >
          Work
        </router-link>
        <button
          v-else
          @click="openSearch"
          class="nav-link flex text-center py-2 px-3 rounded-full transition-all duration-300 hover:bg-gray-50"
          aria-label="Search"
        >
          Search
        </button>
      </li>
    </ul>

    <!-- Right Side Icons -->
    <div v-if="!searchMode" class="nav-right flex items-center space-x-4">
      <div class="icons hidden sm:flex items-center space-x-4 text-base">
        <button
          @click="openSearch"
          class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
          aria-label="Search"
        >
          <i class="fas fa-search"></i>
        </button>
        <button
          @click="handleUserClick"
          class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
          aria-label="User Account"
        >
          <i class="fas fa-user"></i>
        </button>
        <button
          @click="openWishlist"
          class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
          aria-label="Wishlist"
        >
          <i class="fas fa-heart"></i>
        </button>
        <button
          @click="openCart"
          class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100 relative"
          aria-label="Cart"
        >
          <i class="fas fa-shopping-cart"></i>
          <span
            v-if="cartItemCount > 0"
            class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
          >
            {{ cartItemCount > 99 ? '99+' : cartItemCount }}
          </span>
        </button>
      </div>

      <!-- Mobile Menu Toggle -->
      <button
        class="md:hidden mobile-menu-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
        aria-label="Toggle menu"
        @click="toggleMobileMenu"
      >
        <i :class="mobileMenuOpen ? 'fas fa-times text-sm' : 'fas fa-bars text-sm'"></i>
      </button>
    </div>
    <div v-else class="nav-right flex items-center space-x-2">
      <button
        @click="openWishlist"
        class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
        aria-label="Wishlist"
      >
        <i class="fas fa-heart text-sm"></i>
      </button>
      <button
        @click="openCart"
        class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-gray-100 relative"
        aria-label="Cart"
      >
        <i class="fas fa-shopping-cart text-sm"></i>
        <span
          v-if="cartItemCount > 0"
          class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full text-[10px]"
        >
          {{ cartItemCount > 99 ? '99+' : cartItemCount }}
        </span>
      </button>
    </div>
  </div>

    <!-- Mobile Menu Dropdown -->
    <div
      v-if="mobileMenuOpen"
      class="mobile-menu absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-4 px-5 z-40"
    >
      <div class="md:hidden">
        <ul class="space-y-1 text-sm font-medium">
          <li>
            <router-link
              to="/about"
              class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50 active:bg-gray-100"
              @click="closeMobileMenu"
            >
              About Us
            </router-link>
          </li>
          <li>
            <router-link
              to="/collabs"
              class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50 active:bg-gray-100"
              @click="closeMobileMenu"
            >
              SF x Collabs
            </router-link>
          </li>
          <li v-if="isShopPage">
            <router-link
              to="/portfolio"
              class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50 active:bg-gray-100"
              @click="closeMobileMenu"
            >
              Work
            </router-link>
          </li>
          <li>
            <router-link
              to="/contact"
              class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-gray-50 active:bg-gray-100"
              @click="closeMobileMenu"
            >
              Contact Us
            </router-link>
          </li>
        </ul>

<!-- Mobile Icons -->
      <div class="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-100">
        <button
          v-if="!isShopPage"
          @click="openSearch"
          class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100"
          aria-label="Search"
        >
          <i class="fas fa-search text-sm"></i>
        </button>
        <button
  @click="handleUserClick(); closeMobileMenu()"
  class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100"
  aria-label="User Account"
>
            <i class="fas fa-user text-sm"></i>
          </button>
<button
  @click="openWishlist(); closeMobileMenu()"
  class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100"
  aria-label="Wishlist"
>
            <i class="fas fa-heart text-sm"></i>
          </button>
          <button
            @click="openCart"
            class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-gray-100 relative"
            aria-label="Cart"
          >
            <i class="fas fa-shopping-cart text-sm"></i>
            <span
              v-if="cartItemCount > 0"
              class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full text-[10px]"
            >
              {{ cartItemCount > 99 ? '99+' : cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchProducts } from '@/api/shopApi'

const route = useRoute()
const router = useRouter()

const isShopPage = computed(() => {
  const path = route.path
  return path === '/shop' || path.startsWith('/shop/') || path.startsWith('/shop?')
})

// Search functionality
const searchMode = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const showResults = ref(false)
const searchInputRef = ref(null)

let debounceTimer = null

function openSearch() {
  searchMode.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function closeSearch() {
  searchMode.value = false
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
  if (debounceTimer) clearTimeout(debounceTimer)
}

function submitSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/shop', query: { search: searchQuery.value.trim() } })
    closeSearch()
  }
}

function goToProduct(product) {
  router.push(`/shop/product/${product.id}`)
  closeSearch()
}

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  if (newVal.length < 2) {
    searchResults.value = []
    showResults.value = false
    return
  }

  showResults.value = true
  searchLoading.value = true

  debounceTimer = setTimeout(async () => {
    try {
      const result = await searchProducts(newVal, 8)
      if (result.success) {
        searchResults.value = result.data || []
      }
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 300)
})

// ===========================================
// CART UTILITIES (from App.vue)
// ===========================================
const { openCart, cartItemCount } = inject('cartUtils')

// ===========================================
// WISHLIST UTILITIES (from App.vue)
// ===========================================
const { openWishlist } = inject('wishlistUtils')

// ===========================================
// AUTH & ORDERS UTILITIES (from App.vue)
// ===========================================
const { openLogin, authStore } = inject('authUtils')
const { openOrders } = inject('ordersUtils')

/**
 * Handle user icon click:
 * - If logged in → open orders
 * - If guest → open login/signup modal
 */
function handleUserClick() {
  if (authStore.isAuthenticated) {
    openOrders()
  } else {
    openLogin()
  }
}

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
    showResults.value = false
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
.nav-link flex text-center {
  color: #374151;
  text-decoration: none;
  position: relative;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.nav-link flex text-center :hover {
  color: #1f2937;
  background-color: rgba(243, 244, 246, 0.6);
}

.nav-link flex text-center .router-link-active {
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
      padding: 0.6rem 1rem;
      max-width: calc(100% - 1.5rem);
    }

    .mobile-menu {
      left: 0.75rem;
      right: 0.75rem;
      margin-top: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .nav-pill {
      padding: 0.5rem 0.75rem;
    }

    .mobile-menu {
      left: 0.5rem;
      right: 0.5rem;
      margin-top: 0.375rem;
    }
  }

  /* Mobile menu link improvements */
  .mobile-menu .router-link-active {
    color: #f97316;
    background-color: rgba(249, 115, 22, 0.1);
  }

  .mobile-menu-btn {
    transition: transform 0.3s ease;
  }

  .mobile-menu-btn:active {
    transform: scale(0.95);
  }

/* Subtle animations */
.nav-pill {
  transition: all 0.3s ease;
}

.nav-pill:hover {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* the little hover‑image */
.nav-link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -8px; /* tweak up/down as needed */
  transform: translateX(-50%);
  width: 10px; /* your icon’s width */
  height: 10px; /* your icon’s height */
  background: url('/images/nav-img.png') no-repeat center/contain;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none; /* so it never steals your hover */
}

/* fade it in on hover */
.nav-link:hover::after {
  opacity: 1;
}

/* Remove default focus outline and add custom */
/* button:focus, .nav-link flex text-center :focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
} */

/* Search styles */
.search-container {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 1;
  transform: translateX(0);
}

.search-results {
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-result-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.search-result-item:active {
  background-color: rgba(0, 0, 0, 0.06);
  transform: scale(0.98);
}

input::placeholder {
  color: #9ca3af;
  transition: color 0.2s ease;
}

input:focus::placeholder {
  color: #d1d5db;
}
</style>
