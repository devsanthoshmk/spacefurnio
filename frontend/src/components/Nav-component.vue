<template>
  <nav ref="navRef" id="navbar" class="fixed top-0 w-full z-50 py-3 sm:py-4 xl:py-5 px-3 sm:px-4 lg:px-6" style="z-index: 100000">
    <div
      class="nav-pill bg-white/90 backdrop-blur-md border border-gray-100 rounded-full shadow-lg mx-auto w-full max-w-5xl flex items-center justify-between px-3.5 sm:px-5 lg:px-6 xl:px-8 py-2 sm:py-2.5 h-14 sm:h-15 xl:h-16 transition-all duration-300"
    >
      <!-- Logo / Search Back Button -->
      <div class="nav-left flex items-center me-1.5 sm:me-2 lg:me-3 shrink-0">
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
            src="/images/Spacefurnio-Logo.webp"
            alt="SpaceFurnio"
            class="h-8 w-6 sm:h-9 sm:w-7 object-contain"
            decoding="async"
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
                :src="optimizeImageUrl(product.images?.[0] || product.thumbnail, { width: 120, quality: 80 })"
                :alt="product.name"
                loading="lazy"
                decoding="async"
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
        class="menu hidden md:flex items-center flex-1 justify-center space-x-0.5 lg:space-x-1 xl:space-x-1.5 text-xs lg:text-[13px] xl:text-sm font-medium tracking-wide"
      >
        <li>
          <router-link
            to="/"
            class="nav-link relative py-1.5 px-2 md:px-2.5 lg:px-3 xl:px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
          >
            Home
          </router-link>
        </li>
        <li>
          <router-link
            to="/about"
            class="nav-link relative py-1.5 px-2 md:px-2.5 lg:px-3 xl:px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
          >
            About Us
          </router-link>
        </li>
        <li>
          <router-link
            to="/collabs"
            class="nav-link relative py-1.5 px-2 md:px-2.5 lg:px-3 xl:px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
          >
            SF x Collabs
          </router-link>
        </li>
        <li>
          <router-link
            to="/shop"
            class="nav-link relative py-1.5 px-2 md:px-2.5 lg:px-3 xl:px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
          >
            Shop
          </router-link>
        </li>
        <li>
          <router-link
            to="/portfolio"
            class="nav-link relative py-1.5 px-2 md:px-2.5 lg:px-3 xl:px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
          >
            Portfolio
          </router-link>
        </li>
        <li>
          <router-link
            to="/contact"
            class="nav-link relative py-1.5 px-2 md:px-2.5 lg:px-3 xl:px-3.5 rounded-full transition-all duration-300 hover:bg-stone-50 text-stone-700 whitespace-nowrap"
          >
            Contact Us
          </router-link>
        </li>
      </ul>

      <!-- ─── Right Side Icons & User Avatar Dropdown ─── -->
      <div v-if="!searchMode" class="nav-right flex items-center space-x-1 sm:space-x-1.5 lg:space-x-2 xl:space-x-3 shrink-0">
        <div class="icons flex items-center space-x-0.5 sm:space-x-1 lg:space-x-1.5 xl:space-x-2 text-sm sm:text-base">
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
          <div ref="userDropdownRef" class="relative user-dropdown-container">
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

            <!-- Authenticated: Luxury initials avatar button toggling dropdown -->
            <button
              v-else
              @click.stop="toggleUserDropdown"
              class="sf-avatar-btn"
              :class="{ 'sf-avatar-active': userDropdownOpen }"
              :aria-expanded="userDropdownOpen"
              :aria-label="`User Account Menu for ${authStore.userName}`"
              :title="authStore.userName"
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
                @click.stop
              >
                <!-- User Info Banner -->
                <div class="sf-user-info-banner">
                  <div class="sf-user-menu-avatar">
                    <img
                      v-if="authStore.userAvatar"
                      :src="authStore.userAvatar"
                      :alt="authStore.userName"
                      class="w-full h-full object-cover rounded-full"
                    />
                    <span v-else>{{ userInitials }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="sf-user-menu-name">{{ authStore.userName }}</p>
                    <p class="sf-user-menu-email">{{ authStore.userEmail }}</p>
                  </div>
                </div>

                <div class="sf-user-menu-divider"></div>

                <!-- Menu Items -->
                <div class="sf-user-menu-list">
                  <button
                    @click="handleMenuOrders"
                    class="sf-user-menu-item"
                  >
                    <div class="sf-menu-icon-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                    </div>
                    <div class="flex-1 text-left">
                      <span class="sf-item-title">My Orders</span>
                      <span class="sf-item-desc">Track &amp; view history</span>
                    </div>
                    <i class="fas fa-chevron-right sf-chevron-icon"></i>
                  </button>

                  <button
                    @click="handleMenuSettings"
                    class="sf-user-menu-item"
                  >
                    <div class="sf-menu-icon-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </div>
                    <div class="flex-1 text-left">
                      <span class="sf-item-title">Settings</span>
                      <span class="sf-item-desc">Saved addresses &amp; account</span>
                    </div>
                    <i class="fas fa-chevron-right sf-chevron-icon"></i>
                  </button>
                </div>

                <div class="sf-user-menu-divider"></div>

                <div class="sf-user-menu-list">
                  <button
                    @click="handleMenuLogout"
                    class="sf-user-menu-item sf-logout-item"
                  >
                    <div class="sf-menu-icon-wrap sf-logout-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </div>
                    <span class="sf-item-title flex-1 text-left">Sign Out</span>
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
          class="md:hidden mobile-menu-btn p-2 rounded-full transition-all duration-300 hover:bg-stone-100 text-stone-700 flex items-center justify-center cursor-pointer"
          aria-label="Toggle navigation menu"
          @click.stop="toggleMobileMenu"
        >
          <i :class="mobileMenuOpen ? 'fas fa-times text-sm' : 'fas fa-bars text-sm'"></i>
        </button>
      </div>
    </div>

    <!-- ─── Mobile Menu Dropdown ─── -->
    <Transition name="mobile-menu-anim">
      <div
        v-if="mobileMenuOpen"
        class="mobile-menu absolute top-full left-3 right-3 sm:left-4 sm:right-4 mt-2 bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-2xl shadow-2xl py-4 px-4 sm:px-5 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto"
      >
        <div class="md:hidden">
          <!-- Mobile Logged-in User Card -->
          <div
            v-if="authStore.isAuthenticated"
            class="sf-mobile-user-card mb-3 p-3 rounded-2xl bg-gradient-to-r from-stone-50 to-amber-50/40 border border-stone-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="sf-user-menu-avatar">
                <img
                  v-if="authStore.userAvatar"
                  :src="authStore.userAvatar"
                  :alt="authStore.userName"
                  class="w-full h-full object-cover rounded-full"
                />
                <span v-else>{{ userInitials }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-stone-900 truncate">{{ authStore.userName }}</p>
                <p class="text-xs text-stone-500 truncate">{{ authStore.userEmail }}</p>
              </div>
            </div>
            <button
              @click="handleMobileLogout"
              class="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <!-- Mobile Guest Login Prompt -->
          <div
            v-else
            class="sf-mobile-guest-card mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50/60 to-stone-50 border border-amber-100/80 flex items-center justify-between"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-semibold">
                <i class="fas fa-user"></i>
              </div>
              <div>
                <p class="text-xs font-semibold text-stone-900">Welcome to Spacefurnio</p>
                <p class="text-[11px] text-stone-500">Sign in to track orders</p>
              </div>
            </div>
            <button
              @click="handleGuestAuthClick(); closeMobileMenu()"
              class="text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <ul class="space-y-1 text-sm font-medium">
            <li>
              <router-link
                to="/"
                class="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                <span>Home</span>
                <i class="fas fa-chevron-right text-[10px] text-stone-300"></i>
              </router-link>
            </li>
            <li>
              <router-link
                to="/about"
                class="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                <span>About Us</span>
                <i class="fas fa-chevron-right text-[10px] text-stone-300"></i>
              </router-link>
            </li>
            <li>
              <router-link
                to="/collabs"
                class="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                <span>SF x Collabs</span>
                <i class="fas fa-chevron-right text-[10px] text-stone-300"></i>
              </router-link>
            </li>
            <li>
              <router-link
                to="/shop"
                class="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                <span>Shop Catalog</span>
                <i class="fas fa-chevron-right text-[10px] text-stone-300"></i>
              </router-link>
            </li>
            <li>
              <router-link
                to="/portfolio"
                class="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                <span>Portfolio</span>
                <i class="fas fa-chevron-right text-[10px] text-stone-300"></i>
              </router-link>
            </li>
            <li>
              <router-link
                to="/contact"
                class="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800"
                @click="closeMobileMenu"
              >
                <span>Contact Us</span>
                <i class="fas fa-chevron-right text-[10px] text-stone-300"></i>
              </router-link>
            </li>

            <!-- Mobile Logged-in Orders Option -->
            <li v-if="authStore.isAuthenticated">
              <button
                @click="openOrders(); closeMobileMenu()"
                class="w-full text-left flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800 cursor-pointer"
              >
                <span class="flex items-center gap-2.5 font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-800">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                  <span>My Orders</span>
                </span>
                <i class="fas fa-chevron-right text-[10px] text-stone-400"></i>
              </button>
            </li>

            <!-- Mobile Logged-in Settings Option -->
            <li v-if="authStore.isAuthenticated">
              <button
                @click="openSettings(); closeMobileMenu()"
                class="w-full text-left flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800 cursor-pointer"
              >
                <span class="flex items-center gap-2.5 font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-800">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Settings</span>
                </span>
                <i class="fas fa-chevron-right text-[10px] text-stone-400"></i>
              </button>
            </li>
          </ul>

          <!-- Mobile Actions Footer -->
          <div class="flex items-center justify-around mt-4 pt-3.5 border-t border-gray-100">
            <button
              @click="openSearch(); closeMobileMenu()"
              class="icon-btn p-2.5 rounded-full transition-all duration-300 hover:bg-stone-100 cursor-pointer"
              aria-label="Search"
            >
              <i class="fas fa-search text-stone-700 text-sm"></i>
            </button>

            <!-- Mobile Auth button -->
            <button
              v-if="!authStore.isAuthenticated"
              @click="handleGuestAuthClick(); closeMobileMenu()"
              class="icon-btn p-2.5 rounded-full transition-all duration-300 hover:bg-stone-100 cursor-pointer"
              aria-label="Account Login"
            >
              <i class="fas fa-user text-stone-700 text-sm"></i>
            </button>
            <button
              v-else
              @click="openOrders(); closeMobileMenu()"
              class="sf-avatar-btn cursor-pointer"
              aria-label="My Account"
            >
              <img
                v-if="authStore.userAvatar"
                :src="authStore.userAvatar"
                :alt="authStore.userName"
                class="w-full h-full object-cover rounded-full"
              />
              <span v-else class="sf-avatar-text">{{ userInitials }}</span>
            </button>

            <button
              @click="handleWishlistClick(); closeMobileMenu()"
              class="icon-btn p-2.5 rounded-full transition-all duration-300 hover:bg-stone-100 relative cursor-pointer"
              aria-label="Wishlist"
            >
              <i class="fas fa-heart text-stone-700 text-sm"></i>
              <span
                v-if="wishlistCount > 0"
                class="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
              >
                {{ wishlistCount }}
              </span>
            </button>

            <button
              @click="handleCartClick(); closeMobileMenu()"
              class="icon-btn p-2.5 rounded-full transition-all duration-300 hover:bg-stone-100 relative cursor-pointer"
              aria-label="Cart"
            >
              <i class="fas fa-shopping-cart text-stone-700 text-sm"></i>
              <span
                v-if="cartCount > 0"
                class="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
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
import { optimizeImageUrl } from '@/utils/imageOptimizer.js'

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
const { openSettings } = inject('settingsUtils', { openSettings: () => {} })

// ─── User Avatar & Dropdown ───
const userDropdownOpen = ref(false)
const userDropdownRef = ref(null)

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
    closeUserDropdown()
    openLogin()
  }
}

function handleMenuOrders() {
  closeUserDropdown()
  openOrders()
}

function handleMenuSettings() {
  closeUserDropdown()
  openSettings()
}

async function handleMenuLogout() {
  closeUserDropdown()
  await authStore.logout()
}

async function handleMobileLogout() {
  closeMobileMenu()
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

// ─── DOM References ───
const navRef = ref(null)

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
  if (navRef.value && !navRef.value.contains(e.target)) {
    closeMobileMenu()
    closeUserDropdown()
    showResults.value = false
  } else if (userDropdownRef.value && !userDropdownRef.value.contains(e.target)) {
    closeUserDropdown()
  }
}

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    closeMobileMenu()
    closeUserDropdown()
    closeSearch()
  }
)

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
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
}
@media (min-width: 640px) {
  .icon-btn {
    width: 34px;
    height: 34px;
  }
}
@media (min-width: 1280px) {
  .icon-btn {
    width: 36px;
    height: 36px;
  }
}
.icon-btn:hover {
  color: #1c1917;
  background-color: rgba(245, 245, 244, 0.8);
}

/* User Avatar Button */
.sf-avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1.5px solid rgba(184, 149, 108, 0.4);
  background: linear-gradient(135deg, #2a2421 0%, #1c1917 50%, #3d2314 100%);
  color: #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(44, 38, 32, 0.12);
  padding: 0;
  position: relative;
  flex-shrink: 0;
}
@media (min-width: 640px) {
  .sf-avatar-btn {
    width: 34px;
    height: 34px;
  }
}
@media (min-width: 1280px) {
  .sf-avatar-btn {
    width: 36px;
    height: 36px;
  }
}
.sf-avatar-btn:hover {
  border-color: #d97706;
  box-shadow: 0 0 14px rgba(217, 119, 6, 0.28), 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px) scale(1.04);
}
.sf-avatar-btn:active {
  transform: scale(0.96);
}
.sf-avatar-active {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2), 0 4px 12px rgba(44, 38, 32, 0.15);
}
.sf-avatar-text {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  line-height: 1;
  text-transform: uppercase;
  color: #fde68a;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* User Dropdown Menu */
.sf-user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 240px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid #ede8e1;
  border-radius: 1.125rem;
  box-shadow:
    0 20px 40px -8px rgba(44, 38, 32, 0.16),
    0 10px 16px -6px rgba(44, 38, 32, 0.08);
  padding: 0.5rem;
  z-index: 10000;
  transform-origin: top right;
}

.sf-user-info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: linear-gradient(135deg, #faf7f4 0%, #f5efe6 100%);
  border: 1px solid #ede4d8;
  border-radius: 0.875rem;
}

.sf-user-menu-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2a2421 0%, #1c1917 50%, #3d2314 100%);
  color: #fde68a;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(217, 119, 6, 0.3);
  overflow: hidden;
}

.sf-user-menu-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #292524;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.sf-user-menu-email {
  font-size: 0.6875rem;
  color: #78716c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.sf-user-menu-divider {
  height: 1px;
  background: #f0ebe4;
  margin: 0.375rem 0.25rem;
}

.sf-user-menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sf-user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  color: #44403c;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.sf-user-menu-item:hover {
  background: #f7f4ef;
  color: #1c1917;
}

.sf-menu-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 0.5rem;
  background: #f5f0e8;
  color: #92400e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.sf-user-menu-item:hover .sf-menu-icon-wrap {
  background: #fde68a;
  color: #78350f;
}

.sf-item-title {
  font-size: 0.8125rem;
  font-weight: 600;
  display: block;
  line-height: 1.2;
}

.sf-item-desc {
  font-size: 0.6875rem;
  color: #a8a29e;
  display: block;
  line-height: 1.2;
}

.sf-chevron-icon {
  font-size: 0.625rem;
  color: #d6d3d1;
  transition: transform 0.15s ease, color 0.15s ease;
}

.sf-user-menu-item:hover .sf-chevron-icon {
  color: #78716c;
  transform: translateX(2px);
}

.sf-logout-item:hover {
  background: #fef2f2;
  color: #e11d48;
}

.sf-logout-icon {
  background: #fee2e2;
  color: #e11d48;
}

.sf-logout-item:hover .sf-logout-icon {
  background: #fecdd3;
  color: #be123c;
}

.sf-pill-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  background: #e11d48;
  padding: 0.125rem 0.4375rem;
  border-radius: 9999px;
  line-height: 1.2;
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
  background: url('/images/nav-img.webp') no-repeat center/contain;
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
