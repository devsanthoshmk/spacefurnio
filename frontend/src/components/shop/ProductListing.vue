<template>
  <div class="bg-white min-h-screen font-sans pt-24">
    <!-- Fixed background for navbar area -->
    <div class="fixed inset-x-0 top-0 h-20 bg-white/90 backdrop-blur-md z-20"></div>

    <!-- Mobile Filter Dialog Overlay -->
    <div
      v-if="showMobileFilters"
      class="fixed inset-0 z-[100000] flex lg:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div class="fixed inset-0 bg-black/5 transition-opacity" @click="showMobileFilters = false"></div>

      <div class="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl transition-all transform duration-300 ease-in-out">
        <div class="flex items-center justify-between px-4">
          <h2 class="text-lg font-medium text-gray-900">Filters</h2>
          <button
            type="button"
            class="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
            @click="showMobileFilters = false"
          >
            <span class="sr-only">Close menu</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mobile Filters Form -->
        <div class="mt-4 border-t border-gray-200 px-4 py-4 space-y-6">
          <div class="space-y-4">
            <label class="block text-sm font-medium text-gray-900">Brand</label>
            <select v-model="selectedBrand" class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
              <option value="">All Brands</option>
              <option v-for="brand in availableBrands" :key="brand" :value="brand">{{ brand }}</option>
            </select>
          </div>

          <div class="space-y-4">
            <label class="block text-sm font-medium text-gray-900">Color</label>
            <select v-model="selectedColor" class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
              <option value="">All Colors</option>
              <option v-for="color in availableColors" :key="color" :value="color">{{ color }}</option>
            </select>
          </div>

          <div class="space-y-4">
            <label class="block text-sm font-medium text-gray-900">Price Range</label>
            <select v-model="selectedPriceRange" class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
              <option value="">Any Price</option>
              <option value="0-100">$0 - $100</option>
              <option value="100-500">$100 - $500</option>
              <option value="500-1000">$500 - $1000</option>
              <option value="1000+">$1000+</option>
            </select>
          </div>

          <div v-if="currentShop.type === 'category'" class="space-y-4">
            <label class="block text-sm font-medium text-gray-900">Material</label>
            <select v-model="selectedMaterial" class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
              <option value="">All Materials</option>
              <option v-for="material in availableMaterials" :key="material" :value="material">{{ material }}</option>
            </select>
          </div>

          <div v-else class="space-y-4">
            <label class="block text-sm font-medium text-gray-900">Room</label>
            <select v-model="selectedRoom" class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
              <option value="">All Rooms</option>
              <option v-for="room in availableRooms" :key="room" :value="room">{{ room }}</option>
            </select>
          </div>

          <button
            @click="clearAllFilters"
            class="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative lg:sticky lg:top-20 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4">
          <!-- Header Row -->
          <div class="flex flex-col gap-2">
            <!-- Breadcrumbs -->
            <Breadcrumbs :items="breadcrumbs" />

            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2">
              <div>
                <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl font-serif">
                  {{ currentShop.type === 'category' ? getCurrentCategoryName() : getCurrentDesignName() }}
                </h1>
                <p class="text-sm text-gray-500 mt-2 max-w-2xl">
                  <span class="font-medium text-indigo-600 ml-1">{{ filteredProducts.length }} items found</span>
                </p>
              </div>

            <div class="hidden lg:flex items-center gap-3 self-end sm:self-auto">
              <!-- Sort Dropdown -->
              <div class="relative inline-block text-left">
                <select
                  v-model="sortBy"
                  class="cursor-pointer appearance-none rounded-lg border-0 bg-gray-50 py-2.5 pl-4 pr-10 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 hover:bg-gray-100 transition-colors"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Best Rating</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Mobile Filter Button -->
              <button
                @click="showMobileFilters = true"
                class="lg:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span class="mr-2">Filters</span>
                <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
                </svg>
                <span v-if="activeFilterCount > 0" class="ml-1.5 inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                  {{ activeFilterCount }}
                </span>
              </button>
            </div>
          </div>
          </div>

          <!-- Desktop Filters Bar -->
          <div class="hidden lg:flex flex-wrap items-center gap-3">
            <div class="relative group">
              <select v-model="selectedBrand" class="appearance-none block w-full rounded-full border-0 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 hover:bg-gray-50 hover:ring-gray-300 transition-all cursor-pointer">
                <option value="">All Brands</option>
                <option v-for="brand in availableBrands" :key="brand" :value="brand">{{ brand }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div class="relative group">
              <select v-model="selectedColor" class="appearance-none block w-full rounded-full border-0 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 hover:bg-gray-50 hover:ring-gray-300 transition-all cursor-pointer">
                <option value="">All Colors</option>
                <option v-for="color in availableColors" :key="color" :value="color">{{ color }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div class="relative group">
              <select v-model="selectedPriceRange" class="appearance-none block w-full rounded-full border-0 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 hover:bg-gray-50 hover:ring-gray-300 transition-all cursor-pointer">
                <option value="">Price Range</option>
                <option value="0-100">$0 - $100</option>
                <option value="100-500">$100 - $500</option>
                <option value="500-1000">$500 - $1000</option>
                <option value="1000+">$1000+</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div v-if="currentShop.type === 'category'" class="relative group">
              <select v-model="selectedMaterial" class="appearance-none block w-full rounded-full border-0 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 hover:bg-gray-50 hover:ring-gray-300 transition-all cursor-pointer">
                <option value="">Material</option>
                <option v-for="material in availableMaterials" :key="material" :value="material">{{ material }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div v-else class="relative group">
              <select v-model="selectedRoom" class="appearance-none block w-full rounded-full border-0 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 hover:bg-gray-50 hover:ring-gray-300 transition-all cursor-pointer">
                <option value="">Room Type</option>
                <option v-for="room in availableRooms" :key="room" :value="room">{{ room }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div class="ml-auto" v-if="hasActiveFilters">
              <button
                @click="clearAllFilters"
                class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
              >
                <span>Clear All</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Active Filter Tags -->
          <div v-if="hasActiveFilters" class="flex flex-wrap gap-2">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider self-center mr-1">Active:</span>
            <button v-if="selectedBrand" @click="selectedBrand = ''" class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 hover:bg-indigo-100 transition-colors">
              {{ selectedBrand }} <span class="ml-1 text-indigo-400 hover:text-indigo-600">&times;</span>
            </button>
            <button v-if="selectedColor" @click="selectedColor = ''" class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 hover:bg-indigo-100 transition-colors">
              {{ selectedColor }} <span class="ml-1 text-indigo-400 hover:text-indigo-600">&times;</span>
            </button>
            <button v-if="selectedPriceRange" @click="selectedPriceRange = ''" class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 hover:bg-indigo-100 transition-colors">
              ${{ selectedPriceRange }} <span class="ml-1 text-indigo-400 hover:text-indigo-600">&times;</span>
            </button>
            <button v-if="selectedMaterial" @click="selectedMaterial = ''" class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 hover:bg-indigo-100 transition-colors">
              {{ selectedMaterial }} <span class="ml-1 text-indigo-400 hover:text-indigo-600">&times;</span>
            </button>
            <button v-if="selectedRoom" @click="selectedRoom = ''" class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 hover:bg-indigo-100 transition-colors">
              {{ selectedRoom }} <span class="ml-1 text-indigo-400 hover:text-indigo-600">&times;</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Sticky Controls -->
    <div class="sticky top-19 py-7 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 lg:hidden flex justify-between items-center gap-4 transition-all duration-300">
      <p class="text-sm text-gray-500 font-medium">{{ filteredProducts.length }} items found</p>
      <div class="flex items-center gap-3">
        <!-- Sort Dropdown -->
        <div class="relative inline-block text-left">
          <select
            v-model="sortBy"
            class="cursor-pointer appearance-none rounded-lg border-0 bg-gray-50 py-2 pl-3 pr-8 text-xs font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 hover:bg-gray-100 transition-colors"
          >
            <option value="popular">Popular</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low</option>
            <option value="price-high">Price: High</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Mobile Filter Button -->
        <button
          @click="showMobileFilters = true"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span class="mr-1.5">Filters</span>
          <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
          </svg>
          <span v-if="activeFilterCount > 0" class="ml-1 inline-flex items-center justify-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800">
            {{ activeFilterCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        <div v-for="n in 8" :key="n" class="animate-pulse bg-white p-3 rounded-2xl border border-gray-100">
          <div class="aspect-[4/5] w-full rounded-xl bg-gray-200 mb-4"></div>
          <div class="flex justify-between mb-2">
             <div class="h-3 bg-gray-200 rounded w-1/4"></div>
             <div class="h-3 bg-gray-200 rounded w-1/6"></div>
          </div>
          <div class="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div class="flex justify-between items-end">
             <div class="h-6 bg-gray-200 rounded w-1/3"></div>
             <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="text-center py-32">
        <div class="mx-auto h-32 w-32 text-gray-200 mb-6">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <h3 class="mt-2 text-xl font-semibold text-gray-900">No products found</h3>
        <p class="mt-2 text-gray-500 max-w-sm mx-auto">We couldn't find any products matching your current filters. Try adjusting your search criteria.</p>
        <button
          @click="clearAllFilters"
          class="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          Clear all filters
        </button>
      </div>

      <!-- Product Grid -->
      <div v-else class="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        <div
          v-for="(product, index) in filteredProducts"
          :key="product.id"
          class="group relative flex flex-col bg-white rounded-2xl p-3 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100"
        >
          <!-- Product Image Carousel -->
          <div
            class="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100"
            @touchstart="handleTouchStart($event, product.id)"
            @touchend="handleTouchEnd($event, product.id)"
          >
            <!-- Swipe Tutorial Overlay -->
            <div
              v-if="index === 0 && showSwipeHint"
              class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl pointer-events-none transition-opacity duration-500"
            >
               <div class="bg-white/20 p-3 rounded-full mb-2 animate-pulse">
                 <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 17h8M5 12h14" />
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                 </svg>
               </div>
               <p class="text-white font-medium text-sm drop-shadow-md">Swipe to view photos</p>
            </div>

            <!-- Image Slider -->
            <div
              class="absolute inset-0 w-full h-full flex transition-transform duration-500 ease-out"
              :style="{ transform: `translateX(-${(imageStates[product.id] || 0) * 100}%)` }"
            >
              <div
                v-for="(img, idx) in product.images"
                :key="idx"
                class="w-full h-full flex-shrink-0"
              >
                <img
                  :src="img"
                  :alt="product.name"
                  class="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </div>

            <!-- Overlay Gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            <!-- Quick Actions (Top Right) -->
            <div class="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <button
                @click.prevent="toggleWishlist(product)"
                class="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm hover:bg-white hover:text-red-500 transition-colors"
                title="Add to Wishlist"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
              <button
                @click.prevent="addToCart(product)"
                class="p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm hover:bg-white hover:text-indigo-600 transition-colors"
                title="Quick Add"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </button>
            </div>

            <!-- Navigation Arrows (Always Visible) -->
            <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-10">
              <button
                v-if="product.images.length > 1"
                @click.prevent="prevImage(product.id)"
                class="pointer-events-auto p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 shadow-sm hover:bg-white hover:scale-110 transition-all focus:outline-none"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                v-if="product.images.length > 1"
                @click.prevent="nextImage(product.id)"
                class="pointer-events-auto p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 shadow-sm hover:bg-white hover:scale-110 transition-all focus:outline-none"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <!-- Improved Dots Indicator -->
            <div v-if="product.images.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
              <div class="flex gap-1.5 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <button
                  v-for="(_, idx) in product.images"
                  :key="idx"
                  @click.prevent="setImage(product.id, idx)"
                  class="pointer-events-auto h-1.5 rounded-full transition-all duration-300 shadow-sm"
                  :class="(imageStates[product.id] || 0) === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'"
                ></button>
              </div>
            </div>

            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
              <span v-if="isNewProduct(product.createdAt)" class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-indigo-600 shadow-lg rounded-full">New</span>
              <span v-if="product.discount" class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-rose-500 shadow-lg rounded-full">-{{ product.discount }}%</span>
            </div>
          </div>

          <!-- Product Info -->
          <div class="mt-4 flex flex-col flex-1 px-1">
            <div class="flex justify-between items-start mb-1">
              <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">{{ product.brand }}</p>
              <div v-if="product.rating" class="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md">
                <svg class="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="text-xs font-semibold text-gray-700">{{ product.rating }}</span>
              </div>
            </div>

            <h3 class="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              <a :href="`./${route.params.category}/${product.id}`">
                <span aria-hidden="true" class="absolute inset-0"></span>
                {{ product.name }}
              </a>
            </h3>

            <div class="mt-auto pt-3 flex items-end justify-between">
              <div class="flex flex-col">
                <p class="text-lg font-bold text-gray-900">${{ product.price }}</p>
                <p v-if="product.originalPrice" class="text-xs text-gray-400 line-through">${{ product.originalPrice }}</p>
              </div>

              <!-- Color Preview Dots -->
              <div v-if="product.colors && product.colors.length" class="flex -space-x-1.5 overflow-hidden pl-2 pb-1">
                 <div
                   v-for="color in product.colors.slice(0, 3)"
                   :key="color"
                   class="inline-block h-5 w-5 rounded-full ring-2 ring-white shadow-sm"
                   :style="{ backgroundColor: getColorHexHelper(color) }"
                   :title="color"
                 ></div>
                 <div v-if="product.colors.length > 3" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white text-[9px] font-bold text-gray-500">
                   +{{ product.colors.length - 3 }}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ProductListing.vue
 *
 * A feature-rich, responsive product listing component for a furniture e-commerce site.
 *
 * Features:
 * - Responsive Grid Layout
 * - Advanced Filtering (Brand, Color, Price, Material, Room)
 * - Sorting (Popularity, Rating, Newest, Price)
 * - Product Image Carousel with Swipe Support
 * - Mobile-optimized Filter Drawer
 * - Professional UI with Tailwind CSS
 */

import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumbs from '@/components/Breadcrumbs-component.vue'
import { getColorHexHelper,formatNameHelper, addToCart, toggleWishlist, useCurrentShop, getShopTypeProducts} from '@/composables/productsUtills.js'

const route = useRoute()
const products = ref([])
const loading = ref(true)
const showMobileFilters = ref(false)
const showSwipeHint = ref(false)

// Filters & sort state
const selectedBrand      = ref('')
const selectedColor      = ref('')
const selectedPriceRange = ref('')
const selectedMaterial   = ref('')
const selectedRoom       = ref('')
const sortBy             = ref('popular')

// Image Carousel State
// Map of productId -> currentImageIndex
const imageStates = reactive({})
const touchStartX = ref(0)
const touchEndX = ref(0)

// Derive shop type & category/design from the URL and returns everything needed for each category type
const currentShop = computed(() => useCurrentShop(route))
const currentCategory = computed(() =>
  route.params.category || route.query.category || 'all'
)

// --- Computed Properties for Filters ---

const availableBrands = computed(() => {
  const brands = [...new Set(products.value.map(p => p.brand))].filter(Boolean)
  return brands.sort()
})

const availableColors = computed(() => {
  const colors = [...new Set(products.value.flatMap(p => p.colors || []))].filter(Boolean)
  return colors.sort()
})

const availableMaterials = computed(() => {
  const materials = [...new Set(products.value.map(p => p.material))].filter(Boolean)
  return materials.sort()
})

const availableRooms = computed(() => {
  const rooms = [...new Set(products.value.map(p => p.room))].filter(Boolean)
  return rooms.sort()
})

const hasActiveFilters = computed(() =>
  selectedBrand.value ||
  selectedColor.value ||
  selectedPriceRange.value ||
  selectedMaterial.value ||
  selectedRoom.value
)

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedBrand.value) count++
  if (selectedColor.value) count++
  if (selectedPriceRange.value) count++
  if (selectedMaterial.value) count++
  if (selectedRoom.value) count++
  return count
})


// --- Filter & Sort Pipeline ---

const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // 1. Apply Filters
  if (selectedBrand.value) {
    filtered = filtered.filter(p => p.brand === selectedBrand.value)
  }
  if (selectedColor.value) {
    filtered = filtered.filter(p => p.colors?.includes(selectedColor.value))
  }
  if (selectedPriceRange.value) {
    const [min, max] = selectedPriceRange.value.split('-').map(v => v.replace('+', ''))
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price)
      return max
        ? price >= parseFloat(min) && price <= parseFloat(max)
        : price >= parseFloat(min)
    })
  }
  if (selectedMaterial.value) {
    filtered = filtered.filter(p => p.material === selectedMaterial.value)
  }
  if (selectedRoom.value) {
    filtered = filtered.filter(p => p.room === selectedRoom.value)
  }

  // 2. Apply Sorting
  switch (sortBy.value) {
    case 'rating':
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case 'newest':
      filtered.sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      break
    case 'price-low':
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      break
    case 'price-high':
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      break
    case 'popular':
    default:
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }

  return filtered
})

// --- Actions ---

const clearAllFilters = () => {
  selectedBrand.value = ''
  selectedColor.value = ''
  selectedPriceRange.value = ''
  selectedMaterial.value = ''
  selectedRoom.value = ''
}

// --- Image Carousel Logic ---

const nextImage = (productId) => {
  const product = products.value.find(p => p.id === productId)
  if (!product || !product.images || product.images.length <= 1) return

  const current = imageStates[productId] || 0
  imageStates[productId] = (current + 1) % product.images.length
}

const prevImage = (productId) => {
  const product = products.value.find(p => p.id === productId)
  if (!product || !product.images || product.images.length <= 1) return

  const current = imageStates[productId] || 0
  imageStates[productId] = (current - 1 + product.images.length) % product.images.length
}

const setImage = (productId, index) => {
  imageStates[productId] = index
}

// Swipe Handlers
const handleTouchStart = (e, ) => { //productId
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e, productId) => {
  touchEndX.value = e.changedTouches[0].clientX
  handleSwipe(productId)
}

const handleSwipe = (productId) => {
  const threshold = 50 // min distance to be considered a swipe
  if (touchEndX.value < touchStartX.value - threshold) {
    nextImage(productId) // Swipe Left -> Next
  }
  if (touchEndX.value > touchStartX.value + threshold) {
    prevImage(productId) // Swipe Right -> Prev
  }
}

// --- Helpers ---

const getCurrentCategoryName = () => {
  if (currentCategory.value === 'all') return 'All Products'
  return formatNameHelper(currentCategory.value)
}

const getCurrentDesignName = () => {
  if (currentCategory.value === 'all') return 'Design Collection'
  return formatNameHelper(currentCategory.value)
}

const breadcrumbs = computed(() => [
  { name: 'Home', route: '/' },
  { name: 'Shop', route: '/shop' },
  {
    name: currentShop.value.breadcrumbName,
    route: currentShop.value.route
  },
  {
    name: currentShop.value.tyle === 'category' ? getCurrentCategoryName() : getCurrentDesignName(),
    route: null
  }
])

const isNewProduct = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays < 60 // Considered new if less than 60 days old
}

// --- Data Loading ---

async function loadProducts() {
  loading.value = true
  try {

    // import products based on shop type
    let data = await getShopTypeProducts(route)


    if (currentCategory.value !== 'all') {
      data = data.filter(p =>
        p.category === currentCategory.value ||
        p.space    === currentCategory.value ||
        p.style    === currentCategory.value
      )
    }

    data.forEach(p => {

      p.isNew = isNewProduct(p.createdAt)

      return p
    })
    products.value = data

  } catch (err) {
    console.error('Error loading products:', err)
    products.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()

  // Check for swipe hint
  const hasSeenHint = sessionStorage.getItem('hasSeenSwipeHint')
  if (!hasSeenHint && (window.matchMedia('(max-width: 1024px)').matches || 'ontouchstart' in window)) {
    showSwipeHint.value = true
    setTimeout(() => {
      showSwipeHint.value = false
      sessionStorage.setItem('hasSeenSwipeHint', 'true')
    }, 4000)
  }
})
</script>



