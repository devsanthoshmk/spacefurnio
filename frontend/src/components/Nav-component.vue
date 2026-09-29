<template>
  <nav id="navbar" class="fixed top-0 w-full z-50 py-4 sm:py-6 px-4" style="z-index: 100000">
    <div
      class="nav-pill bg-white/90 backdrop-blur-md border border-gray-100 rounded-full shadow-lg mx-auto max-w-5xl flex items-center justify-between px-5 sm:px-8 py-2.5 sm:py-3 h-16 transition-all duration-300"
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
        <router-link v-else to="/" class="flex items-center">
          <img
            src="/images/Spacefurnio-Logo.png"
            alt="SpaceFurnio"
            class="h-9 w-7 object-contain"
          />
        </router-link>
      </div>

      <!-- ─── Search Input Mode ─── -->
      <div
        v-if="searchMode"
        class="search-container flex-1 mx-3 sm:mx-6 relative"
      >
        <div class="relative group flex items-center">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search furniture, sofas, chairs, collections..."
            class="w-full py-2 pl-2 pr-20 bg-transparent border-0 text-sm sm:text-base outline-none transition-all duration-300 placeholder:text-gray-400"
            @keydown.enter="submitSearch"
            @keydown.escape="closeSearch"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-12 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
          <div
            v-if="searchQuery && searchLoading"
            class="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin"
          ></div>
          <button
            @click="submitSearch"
            class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-stone-600 hover:text-stone-900 transition-all duration-200"
            aria-label="Submit search"
          >
            <i class="fas fa-search text-sm"></i>
          </button>
        </div>

        <!-- Instant Search Results Dropdown -->
        <div
          v-if="showResults && searchResults.length > 0"
          class="search-results absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[26rem] overflow-y-auto"
        >
          <div class="p-3">
            <div class="flex items-center justify-between px-3 py-1.5 mb-1">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Products
              </p>
              <span class="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
                {{ searchResults.length }} results
              </span>
            </div>
            <button
              v-for="product in searchResults"
              :key="product.id"
              @click="goToProduct(product)"
              class="search-result-item w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-stone-50 transition-all duration-200 text-left"
            >
              <img
                :src="product.images?.[0] || product.thumbnail || '/images/placeholder.png'"
                :alt="product.name"
                class="w-14 h-14 object-cover rounded-lg shadow-sm bg-stone-100 flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-stone-900 mb-0.5 line-clamp-1">{{ product.name }}</h4>
                <p class="text-xs text-stone-500 capitalize">{{ product.category || 'Furniture' }}</p>
                <p class="text-sm font-semibold text-amber-800">
                  ${{ formatPrice(product.price) }}
                </p>
              </div>
              <i class="fas fa-chevron-right text-stone-300 text-xs"></i>
            </button>
            <div class="border-t border-gray-100 my-2"></div>
            <button
              @click="submitSearch"
              class="w-full p-2.5 text-center text-xs font-semibold text-amber-800 hover:bg-amber-50 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <span>View all results for "{{ searchQuery }}"</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- No Results -->
        <div
          v-else-if="showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading"
          class="search-results absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl p-6 text-center"
        >
          <div class="text-stone-300 mb-2">
            <i class="fas fa-search text-2xl"></i>
          </div>
          <p class="text-stone-700 font-medium text-sm mb-0.5">No products found</p>
          <p class="text-xs text-stone-400">Try checking your spelling or using different keywords</p>
        </div>
      </div>

      <!-- ─── Desktop Nav Menu ─── -->
      <ul
        v-else
        class="menu hidden md:flex items-center flex-1 justify-center space-x-1 text-sm font-medium tracking-wide"
      >
        <li>
          <router-link
            to="/"
            class="nav-link relative py-2 px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            Home
          </router-link>
        </li>
        <li>
          <router-link
            to="/about"
            class="nav-link relative py-2 px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            About Us
          </router-link>
        </li>
        <li>
          <router-link
            to="/collabs"
            class="nav-link relative py-2 px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            SF x Collabs
          </router-link>
        </li>
        <li>
          <router-link
            to="/shop"
            class="nav-link relative py-2 px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            Shop
          </router-link>
        </li>
        <li>
          <router-link
            to="/portfolio"
            class="nav-link relative py-2 px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            Portfolio
          </router-link>
        </li>
        <li>
          <router-link
            to="/contact"
            class="nav-link relative py-2 px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            Contact Us
          </router-link>
        </li>
      </ul>

      <!-- Small Screen Navigation Links -->
      <ul
        v-if="!searchMode"
        class="menu flex md:hidden items-center space-x-2 flex-1 justify-center text-xs font-medium"
      >
        <li>
          <router-link
            to="/"
            class="nav-link py-1.5 px-2.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            Home
          </router-link>
        </li>
        <li>
          <router-link
            to="/shop"
            class="nav-link py-1.5 px-2.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700"
          >
            Shop
          </router-link>
        </li>
      </ul>

      <!-- ─── Right Side Icons & User Avatar Dropdown ─── -->
      <div v-if="!searchMode" class="nav-right flex items-center space-x-2 sm:space-x-3">
        <div class="icons flex items-center space-x-2 sm:space-x-3 text-base">
          <!-- Search Button -->
          <button
            @click="openSearch"
            class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-stone-100"
            aria-label="Search catalog"
            title="Search products"
          >
            <i class="fas fa-search text-sm sm:text-base"></i>
          </button>

          <!-- User Button / Avatar Dropdown -->
          <div class="relative user-dropdown-container">
            <!-- Guest: simple user icon button opening AuthModal -->
            <button
              v-if="!authStore.isAuthenticated"
              @click="handleGuestAuthClick"
              class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-stone-100"
              aria-label="Account Login"
              title="Sign in / Register"
            >
              <i class="fas fa-user text-sm sm:text-base"></i>
            </button>

            <!-- Authenticated: Initials avatar button toggling dropdown -->
            <button
              v-else
              @click="toggleUserDropdown"
              class="sf-avatar-btn"
              :aria-expanded="userDropdownOpen"
              aria-label="User Account Menu"
              title="User Account"
            >
              <img
                v-if="authStore.userAvatar"
                :src="authStore.userAvatar"
                :alt="authStore.userName"
                class="w-full h-full object-cover rounded-full"
              />
              <span v-else class="sf-avatar-text">{{ userInitials }}</span>
            </button>

            <!-- User Menu Dropdown -->
            <Transition name="dropdown-fade">
              <div
                v-if="userDropdownOpen && authStore.isAuthenticated"
                class="sf-user-menu"
              >
                <!-- User Info Banner -->
                <div class="sf-user-info-banner">
                  <div class="sf-user-menu-avatar">
                    {{ userInitials }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="sf-user-menu-name">{{ authStore.userName }}</p>
                    <p class="sf-user-menu-email">{{ authStore.userEmail }}</p>
                  </div>
                </div>

                <div class="sf-user-menu-divider"></div>

                <!-- Menu Items -->
                <div class="py-1">
                  <button
                    @click="handleMenuOrders"
                    class="sf-user-menu-item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                    <span>My Orders</span>
                  </button>

                  <button
                    @click="handleMenuWishlist"
                    class="sf-user-menu-item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>My Wishlist</span>
                    <span v-if="wishlistCount > 0" class="ml-auto sf-pill-badge">{{ wishlistCount }}</span>
                  </button>
                </div>

                <div class="sf-user-menu-divider"></div>

                <div class="py-1">
                  <button
                    @click="handleMenuLogout"
                    class="sf-user-menu-item text-rose-600 hover:bg-rose-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Wishlist Button with Badge -->
          <button
            @click="handleWishlistClick"
            class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-stone-100 relative"
            aria-label="Wishlist"
            title="Wishlist"
          >
            <i class="fas fa-heart text-sm sm:text-base"></i>
            <Transition name="badge-pop">
              <span
                v-if="wishlistCount > 0"
                class="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm"
              >
                {{ wishlistCount > 99 ? '99+' : wishlistCount }}
              </span>
            </Transition>
          </button>

          <!-- Cart Button with Badge -->
          <button
            @click="handleCartClick"
            class="icon-btn p-2 rounded-full transition-all duration-300 hover:bg-stone-100 relative"
            aria-label="Shopping Cart"
            title="Cart"
          >
            <i class="fas fa-shopping-cart text-sm sm:text-base"></i>
            <Transition name="badge-pop">
              <span
                v-if="cartCount > 0"
                class="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm"
              >
                {{ cartCount > 99 ? '99+' : cartCount }}
              </span>
            </Transition>
          </button>
        </div>

        <!-- Mobile Menu Toggle Button -->
        <button
          class="md:hidden mobile-menu-btn p-2 rounded-full transition-all duration-300 hover:bg-stone-100 text-stone-700"
          aria-label="Toggle navigation menu"
          @click="toggleMobileMenu"
        >
          <i :class="mobileMenuOpen ? 'fas fa-times text-sm' : 'fas fa-bars text-sm'"></i>
        </button>
      </div>
    </div>

    <!-- ─── Mobile Menu Dropdown ─── -->
    <Transition name="mobile-menu-anim">
      <div
        v-if="mobileMenuOpen"
        class="mobile-menu absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl py-4 px-5 z-40"
      >
        <div class="md:hidden">
          <ul class="space-y-1 text-sm font-medium">
            <li>
              <router-link
                to="/"
                class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                Home
              </router-link>
            </li>
            <li>
              <router-link
                to="/about"
                class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                About Us
              </router-link>
            </li>
            <li>
              <router-link
                to="/collabs"
                class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                SF x Collabs
              </router-link>
            </li>
            <li>
              <router-link
                to="/shop"
                class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                Shop Catalog
              </router-link>
            </li>
            <li>
              <router-link
                to="/portfolio"
                class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                Portfolio
              </router-link>
            </li>
            <li>
              <router-link
                to="/contact"
                class="block py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                Contact Us
              </router-link>
            </li>
          </ul>

          <!-- Mobile Actions Footer -->
          <div class="flex items-center justify-around mt-4 pt-4 border-t border-gray-100">
            <button
              @click="openSearch(); closeMobileMenu()"
              class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-stone-100"
              aria-label="Search"
            >
              <i class="fas fa-search text-sm"></i>
            </button>

            <button
              @click="handleGuestAuthClick(); closeMobileMenu()"
              class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-stone-100"
              aria-label="Account"
            >
              <i class="fas fa-user text-sm"></i>
            </button>

            <button
              @click="handleWishlistClick(); closeMobileMenu()"
              class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-stone-100 relative"
              aria-label="Wishlist"
            >
              <i class="fas fa-heart text-sm"></i>
              <span
                v-if="wishlistCount > 0"
                class="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
              >
                {{ wishlistCount }}
              </span>
            </button>

            <button
              @click="handleCartClick(); closeMobileMenu()"
              class="icon-btn p-3 rounded-full transition-all duration-300 hover:bg-stone-100 relative"
              aria-label="Cart"
            >
              <i class="fas fa-shopping-cart text-sm"></i>
              <span
                v-if="cartCount > 0"
                class="absolute top-1 right-1 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
              >
                {{ cartCount }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { searchProducts } from '@/api/shopApi'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authStore = useAuthStore()

// ─── Live Count Badges ───
const cartCount = computed(() => cartStore.itemCount)
const wishlistCount = computed(() => wishlistStore.itemCount)

// ─── Modal Injections ───
const { openCart } = inject('cartUtils')
const { openWishlist } = inject('wishlistUtils')
const { openLogin } = inject('authUtils')
const { openOrders } = inject('ordersUtils')

// ─── User Avatar & Dropdown ───
const userDropdownOpen = ref(false)

const userInitials = computed(() => {
  const name = (authStore.userName || 'User').trim()
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

function toggleUserDropdown() {
  userDropdownOpen.value = !userDropdownOpen.value
}

function closeUserDropdown() {
  userDropdownOpen.value = false
}

function handleGuestAuthClick() {
  if (authStore.isAuthenticated) {
    toggleUserDropdown()
  } else {
    openLogin()
  }
}

function handleMenuOrders() {
  closeUserDropdown()
  openOrders()
}

function handleMenuWishlist() {
  closeUserDropdown()
  openWishlist()
}

async function handleMenuLogout() {
  closeUserDropdown()
  await authStore.logout()
}

function handleCartClick() {
  closeUserDropdown()
  openCart()
}

function handleWishlistClick() {
  closeUserDropdown()
  openWishlist()
}

// ─── Instant Search Functionality ───
const searchMode = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const showResults = ref(false)
const searchInputRef = ref(null)

let debounceTimer = null

function openSearch() {
  searchMode.value = true
  closeUserDropdown()
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

  if (!newVal || newVal.trim().length < 2) {
    searchResults.value = []
    showResults.value = false
    searchLoading.value = false
    return
  }

  showResults.value = true
  searchLoading.value = true

  debounceTimer = setTimeout(async () => {
    try {
      const result = await searchProducts(newVal.trim(), 8)
      if (result.success) {
        searchResults.value = result.data || []
      }
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 250)
})

// ─── Mobile Menu ───
const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    closeUserDropdown()
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function handleClickOutside(e) {
  const navbar = document.getElementById('navbar')
  if (navbar && !navbar.contains(e.target)) {
    closeMobileMenu()
    closeUserDropdown()
    showResults.value = false
  }
}

function formatPrice(val) {
  return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
/* Glass morphism effect */
.nav-pill {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.nav-pill:hover {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.08),
    0 10px 10px -5px rgba(0, 0, 0, 0.03);
}

/* Icon Buttons */
.icon-btn {
  color: #57534e;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.icon-btn:hover {
  color: #1c1917;
  background-color: rgba(245, 245, 244, 0.8);
}

/* User Avatar Button */
.sf-avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e7e5e4;
  background: #2c2723;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}
.sf-avatar-btn:hover {
  border-color: #b8956c;
  transform: scale(1.05);
}
.sf-avatar-text {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* User Dropdown Menu */
.sf-user-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 220px;
  background: white;
  border: 1px solid #f0ebe4;
  border-radius: 1rem;
  box-shadow: 0 16px 36px rgba(44, 38, 32, 0.14);
  padding: 0.5rem;
  z-index: 100;
}
.sf-user-info-banner {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.5rem;
}
.sf-user-menu-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2c2723;
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sf-user-menu-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2723;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.sf-user-menu-email {
  font-size: 0.6875rem;
  color: #8c7d6e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-user-menu-divider {
  height: 1px;
  background: #f0ebe4;
  margin: 0.25rem 0;
}
.sf-user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #57534e;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.sf-user-menu-item:hover {
  background: #faf8f5;
  color: #2c2723;
}
.sf-pill-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  background: #f43f5e;
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

/* Badge Pop Animation */
.badge-pop-enter-active {
  animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badgePop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Nav Links hover indicator */
.nav-link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: url('/images/nav-img.png') no-repeat center/contain;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.nav-link:hover::after {
  opacity: 1;
}
.router-link-active {
  color: #1c1917;
  font-weight: 600;
}

/* Search container */
.search-container {
  animation: searchIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes searchIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.search-results {
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mobile menu */
.mobile-menu-anim-enter-active {
  animation: slideDownMobile 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.mobile-menu-anim-leave-active {
  animation: slideDownMobile 0.25s cubic-bezier(0.7, 0, 0.84, 0) reverse;
}
@keyframes slideDownMobile {
  from { opacity: 0; transform: translateY(-16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
