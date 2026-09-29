<template>
  <div class="product-detail-page">
    <!-- Back & Sticky Navigation Bar -->
    <nav class="detail-nav">
      <div class="nav-container">
        <div class="flex items-center gap-3">
          <button
            class="back-btn group"
            @click="goBack"
            aria-label="Go back to previous page"
          >
            <svg
              class="w-4 h-4 text-stone-600 group-hover:-translate-x-0.5 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span class="font-medium text-xs sm:text-sm text-stone-800">Back</span>
          </button>

          <!-- Breadcrumbs -->
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            <ol class="breadcrumb-list">
              <li class="breadcrumb-item">
                <router-link to="/" class="breadcrumb-link">Home</router-link>
                <svg
                  class="breadcrumb-sep"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </li>
              <li class="breadcrumb-item">
                <router-link to="/shop" class="breadcrumb-link">Shop</router-link>
                <svg
                  class="breadcrumb-sep"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </li>
              <li v-if="product?.category" class="breadcrumb-item">
                <router-link
                  :to="`/shop?categories=${product.category}`"
                  class="breadcrumb-link capitalize"
                >
                  {{ formatCategory(product.category) }}
                </router-link>
                <svg
                  class="breadcrumb-sep"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </li>
              <li class="breadcrumb-item">
                <span class="breadcrumb-current">{{ product?.name || 'Product Details' }}</span>
              </li>
            </ol>
          </nav>
        </div>

        <!-- Quick Top Bar Actions -->
        <div class="flex items-center gap-2">
          <!-- Share Link Button -->
          <button
            @click="copyProductLink"
            class="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all text-xs flex items-center gap-1.5 shadow-xs"
            :title="isLinkCopied ? 'Link Copied!' : 'Share Product'"
          >
            <svg
              v-if="!isLinkCopied"
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <svg
              v-else
              class="w-3.5 h-3.5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="hidden sm:inline font-medium text-xs">{{ isLinkCopied ? 'Copied' : 'Share' }}</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Container -->
    <main class="detail-main">
      <div class="detail-container">
        <!-- 1. LOADING SKELETON STATE -->
        <div v-if="loading" class="detail-layout animate-pulse">
          <!-- Gallery Skeleton -->
          <div class="space-y-4">
            <div class="aspect-square w-full rounded-2xl bg-stone-200/80 shadow-inner"></div>
            <div class="flex gap-3">
              <div v-for="n in 4" :key="n" class="w-20 h-20 rounded-xl bg-stone-200/80 shrink-0"></div>
            </div>
          </div>

          <!-- Product Details Skeleton -->
          <div class="space-y-6 pt-2">
            <div class="space-y-3">
              <div class="h-4 w-28 bg-stone-200 rounded-full"></div>
              <div class="h-8 w-3/4 bg-stone-200 rounded-lg"></div>
              <div class="h-4 w-40 bg-stone-200 rounded-md"></div>
            </div>

            <div class="h-10 w-36 bg-stone-200 rounded-lg"></div>
            <div class="space-y-2">
              <div class="h-3.5 w-full bg-stone-200 rounded"></div>
              <div class="h-3.5 w-5/6 bg-stone-200 rounded"></div>
              <div class="h-3.5 w-4/6 bg-stone-200 rounded"></div>
            </div>

            <!-- Color Swatches Skeleton -->
            <div class="space-y-2 pt-2">
              <div class="h-4 w-24 bg-stone-200 rounded"></div>
              <div class="flex gap-3">
                <div v-for="n in 4" :key="n" class="w-10 h-10 rounded-full bg-stone-200"></div>
              </div>
            </div>

            <!-- Action Buttons Skeleton -->
            <div class="flex gap-4 pt-4">
              <div class="h-13 flex-1 bg-stone-200 rounded-full"></div>
              <div class="h-13 w-13 bg-stone-200 rounded-full"></div>
            </div>

            <!-- Specs Grid Skeleton -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div v-for="n in 4" :key="n" class="h-16 bg-stone-200 rounded-xl"></div>
            </div>
          </div>
        </div>

        <!-- 2. ERROR / 404 STATE -->
        <div
          v-else-if="fetchError || !product"
          class="max-w-xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-stone-200/80 shadow-lg"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-serif text-stone-900 mb-2">Product Not Found</h2>
          <p class="text-stone-600 text-sm mb-6 leading-relaxed">
            The furniture piece you are looking for may have been moved, updated, or is currently unavailable.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              @click="loadProduct"
              class="w-full sm:w-auto px-6 py-3 rounded-full bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Retry</span>
            </button>
            <router-link
              to="/shop"
              class="w-full sm:w-auto px-6 py-3 rounded-full bg-stone-100 text-stone-800 font-medium text-sm hover:bg-stone-200 transition-all flex items-center justify-center"
            >
              Browse Shop Catalog
            </router-link>
          </div>
        </div>

        <!-- 3. MAIN PRODUCT PRESENTATION -->
        <div v-else class="detail-layout">
          <!-- ==========================================
               LEFT COLUMN: INTERACTIVE IMAGE GALLERY
               ========================================== -->
          <section class="gallery-section">
            <!-- Large Primary Preview with Zoom Lens on Hover -->
            <div
              class="main-image-wrapper group relative"
              @mouseenter="isZoomed = true"
              @mouseleave="handleMouseLeaveZoom"
              @mousemove="handleMouseMoveZoom"
            >
              <!-- Primary Image -->
              <img
                :src="optimizeImageUrl(currentImage, { width: 1200, quality: 85 })"
                :alt="product.name"
                class="main-image transition-transform duration-200 ease-out"
                :style="zoomStyle"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />

              <!-- Floating Image Badges (Top-Left) -->
              <div class="image-badges">
                <span v-if="product.isNew" class="badge badge-new">New Arrival</span>
                <span v-if="product.discount" class="badge badge-sale">
                  -{{ product.discount }}% OFF
                </span>
                <span v-if="product.isBestSeller" class="badge badge-bestseller">
                  Bestseller
                </span>
              </div>

              <!-- Top-Right Actions: Lightbox & Zoom Indicator -->
              <div class="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                  @click="openLightbox"
                  class="p-2.5 rounded-full bg-white/90 backdrop-blur-md text-stone-700 shadow-md hover:bg-white hover:text-stone-900 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none"
                  title="Expand to Fullscreen Lightbox"
                  aria-label="Open fullscreen image view"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
              </div>

              <!-- Gallery Navigation Arrows (if multiple images) -->
              <div v-if="galleryImages.length > 1">
                <button
                  class="gallery-nav prev"
                  @click.stop="prevImage"
                  aria-label="Previous image"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  class="gallery-nav next"
                  @click.stop="nextImage"
                  aria-label="Next image"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              <!-- Zoom Hint Overlay (Bottom Left) -->
              <div
                class="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white/90 text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none transition-opacity duration-300 flex items-center gap-1.5"
                :class="{ 'opacity-0': isZoomed }"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
                <span>Hover to zoom</span>
              </div>

              <!-- Image Index Indicator (Bottom Right) -->
              <div
                v-if="galleryImages.length > 1"
                class="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none"
              >
                {{ currentImageIndex + 1 }} / {{ galleryImages.length }}
              </div>
            </div>

            <!-- Thumbnail Carousel Strip with Active Indicator -->
            <div v-if="galleryImages.length > 1" class="thumbnails-container">
              <div class="thumbnails">
                <button
                  v-for="(img, index) in galleryImages"
                  :key="index"
                  :class="['thumb', { active: currentImageIndex === index }]"
                  @click="currentImageIndex = index"
                  :aria-label="`Select image ${index + 1}`"
                >
                  <img
                    :src="optimizeImageUrl(img, { width: 240, quality: 80 })"
                    :alt="`${product.name} - Thumbnail ${index + 1}`"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-if="currentImageIndex === index" class="thumb-active-dot"></span>
                </button>
              </div>
            </div>

            <!-- High-Conversion Trust Guarantee Badges (Desktop Side) -->
            <div class="hidden lg:grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-200/80">
              <div class="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-xs font-semibold text-stone-900">Free Delivery</h4>
                  <p class="text-[11px] text-stone-500">On all furniture orders</p>
                </div>
              </div>

              <div class="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-xs font-semibold text-stone-900">5-Yr Warranty</h4>
                  <p class="text-[11px] text-stone-500">Full manufacturer coverage</p>
                </div>
              </div>

              <div class="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-xs font-semibold text-stone-900">30-Day Trial</h4>
                  <p class="text-[11px] text-stone-500">Hassle-free return policy</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ==========================================
               RIGHT COLUMN: PRODUCT DETAILS & PURCHASE
               ========================================== -->
          <section class="info-section">
            <!-- Header: Brand & Title & Rating -->
            <div class="product-header">
              <!-- Clickable Brand Pill -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <router-link
                  v-if="product.brand"
                  :to="`/shop?brand=${encodeURIComponent(product.brand)}`"
                  class="brand-badge group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200/90 text-stone-800 text-xs font-semibold tracking-wide uppercase transition-colors"
                  title="Filter products by this brand"
                >
                  <span>{{ product.brand }}</span>
                  <svg
                    class="w-3 h-3 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </router-link>
                <span v-else class="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  SpaceFurnio Exclusive
                </span>

                <!-- In-Stock Status Badge -->
                <div
                  class="stock-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  :class="stockBadgeClasses"
                >
                  <span class="w-2 h-2 rounded-full" :class="stockDotClasses"></span>
                  <span>{{ stockStatusText }}</span>
                </div>
              </div>

              <!-- Product Name -->
              <h1 class="product-name font-serif">{{ product.name }}</h1>

              <!-- Ratings Breakdown & Jump Link -->
              <div class="rating-row">
                <div class="stars">
                  <svg
                    v-for="n in 5"
                    :key="n"
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    :fill="n <= Math.round(productRating) ? '#F59E0B' : 'none'"
                    :stroke="n <= Math.round(productRating) ? '#F59E0B' : '#D4CFC6'"
                    stroke-width="1.8"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                </div>
                <span class="font-semibold text-stone-800 text-sm">{{ productRating.toFixed(1) }}</span>
                <span class="text-stone-400 text-sm">•</span>
                <button
                  @click="scrollToReviews"
                  class="text-xs sm:text-sm text-stone-600 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-800 transition-colors"
                >
                  {{ totalReviewsCount }} customer reviews
                </button>
              </div>
            </div>

            <!-- Price & Savings Section -->
            <div class="price-section">
              <div class="flex items-baseline gap-3">
                <span class="current-price font-serif">${{ formattedPrice }}</span>
                <span v-if="product.originalPrice" class="original-price font-serif">
                  ${{ formatPriceNumber(product.originalPrice) }}
                </span>
              </div>
              <div v-if="product.discount" class="discount-badge">
                Save ${{ savingsAmount }} ({{ product.discount }}% Off)
              </div>
            </div>

            <!-- Description -->
            <p class="product-description">{{ product.description }}</p>

            <!-- Color Variant Swatches -->
            <div v-if="availableColors.length > 0" class="option-group">
              <div class="flex items-center justify-between mb-2">
                <label class="option-label mb-0">
                  Color: <strong class="text-stone-900">{{ currentColorName }}</strong>
                </label>
                <span class="text-xs text-stone-400 font-mono">{{ activeColorHex }}</span>
              </div>

              <div class="color-options">
                <button
                  v-for="color in availableColors"
                  :key="color.name"
                  :class="[
                    'color-swatch-btn group relative',
                    { selected: selectedColor === color.name },
                  ]"
                  @click="selectColor(color)"
                  :title="`${color.name} (${color.hex})`"
                  :aria-label="`Select ${color.name} color`"
                >
                  <span
                    class="swatch-color"
                    :style="{ backgroundColor: color.hex }"
                  ></span>
                  <!-- Checkmark indicator when selected -->
                  <svg
                    v-if="selectedColor === color.name"
                    class="swatch-check"
                    :class="isLightColor(color.hex) ? 'text-stone-900' : 'text-white'"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <!-- Tooltip -->
                  <span class="swatch-tooltip">
                    {{ color.name }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Quantity Selector & Max Stock Bounds -->
            <div class="option-group">
              <div class="flex items-center justify-between mb-2">
                <label class="option-label mb-0">Quantity</label>
                <span v-if="maxAvailableStock <= 5 && maxAvailableStock > 0" class="text-xs text-amber-700 font-medium">
                  Only {{ maxAvailableStock }} left in stock
                </span>
              </div>

              <div class="flex items-center gap-4">
                <div class="quantity-selector">
                  <button
                    class="qty-btn"
                    :disabled="quantity <= 1 || !isProductInStock"
                    @click="decrementQuantity"
                    aria-label="Decrease quantity"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    v-model.number="quantity"
                    :min="1"
                    :max="maxAvailableStock"
                    @change="sanitizeQuantity"
                    class="qty-input"
                    :disabled="!isProductInStock"
                    aria-label="Product quantity"
                  />
                  <button
                    class="qty-btn"
                    :disabled="quantity >= maxAvailableStock || !isProductInStock"
                    @click="incrementQuantity"
                    aria-label="Increase quantity"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <span class="text-xs text-stone-500">
                  Total: <strong class="text-stone-800 font-semibold">${{ calculateSubtotal }}</strong>
                </span>
              </div>
            </div>

            <!-- Primary Action Buttons: Add to Cart & Wishlist -->
            <div class="action-buttons">
              <!-- Add to Cart Button -->
              <button
                class="btn-add-cart group relative overflow-hidden"
                :disabled="!isProductInStock || isAddingToCart"
                :class="{ 'btn-success': addedToCartSuccess }"
                @click="addToCart"
              >
                <!-- Loading Spinner -->
                <svg
                  v-if="isAddingToCart"
                  class="w-5 h-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>

                <!-- Success Checkmark State -->
                <template v-else-if="addedToCartSuccess">
                  <svg class="w-5 h-5 text-emerald-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added to Cart!</span>
                </template>

                <!-- Default State -->
                <template v-else>
                  <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span>{{ isProductInStock ? 'Add to Cart' : 'Out of Stock' }}</span>
                </template>
              </button>

              <!-- Wishlist Heart Button -->
              <button
                :class="['btn-wishlist group', { active: isWishlisted }]"
                @click="toggleWishlist"
                :title="isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'"
                aria-label="Toggle product in wishlist"
              >
                <svg
                  class="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                  :class="{ 'heart-beat fill-rose-500 text-rose-500': isWishlisted }"
                  :fill="isWishlisted ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>

            <!-- Material & Dimensions Specifications Breakdown -->
            <div class="specs-card rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs mb-6 space-y-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500">
                Specifications & Craftsmanship
              </h3>

              <!-- Specification Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="spec-item">
                  <span class="spec-label">Material</span>
                  <span class="spec-value">{{ product.material || 'Solid Hardwood' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Room / Space</span>
                  <span class="spec-value capitalize">{{ product.room || product.space || 'Living Room' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Design Style</span>
                  <span class="spec-value capitalize">{{ product.style || 'Contemporary' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Weight</span>
                  <span class="spec-value">{{ product.weight ? `${product.weight} kg` : '42 kg' }}</span>
                </div>
              </div>

              <!-- Dimensions Breakdown -->
              <div class="pt-3 border-t border-stone-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-stone-700">Dimensions</span>
                  <span class="text-[11px] text-stone-400">Width × Height × Depth</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span class="block text-[10px] uppercase text-stone-400 font-semibold">Width</span>
                    <span class="text-xs font-bold text-stone-800">{{ displayDimensions.width }} {{ displayDimensions.unit }}</span>
                  </div>
                  <div class="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span class="block text-[10px] uppercase text-stone-400 font-semibold">Height</span>
                    <span class="text-xs font-bold text-stone-800">{{ displayDimensions.height }} {{ displayDimensions.unit }}</span>
                  </div>
                  <div class="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span class="block text-[10px] uppercase text-stone-400 font-semibold">Depth</span>
                    <span class="text-xs font-bold text-stone-800">{{ displayDimensions.depth }} {{ displayDimensions.unit }}</span>
                  </div>
                </div>
              </div>

              <!-- Key Features List -->
              <div v-if="productFeatures.length > 0" class="pt-3 border-t border-stone-100">
                <span class="block text-xs font-semibold text-stone-700 mb-2">Key Highlights</span>
                <ul class="space-y-1.5">
                  <li
                    v-for="(feature, idx) in productFeatures"
                    :key="idx"
                    class="text-xs text-stone-600 flex items-start gap-2"
                  >
                    <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ feature }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Mobile Trust Guarantee Badges (Shown below specs on small screens) -->
            <div class="grid grid-cols-3 gap-2 lg:hidden mb-6">
              <div class="p-3 rounded-xl bg-white border border-stone-200 text-center">
                <span class="block text-base mb-0.5">🚚</span>
                <span class="block text-[11px] font-bold text-stone-800">Free Shipping</span>
              </div>
              <div class="p-3 rounded-xl bg-white border border-stone-200 text-center">
                <span class="block text-base mb-0.5">🛡️</span>
                <span class="block text-[11px] font-bold text-stone-800">5-Yr Warranty</span>
              </div>
              <div class="p-3 rounded-xl bg-white border border-stone-200 text-center">
                <span class="block text-base mb-0.5">🔄</span>
                <span class="block text-[11px] font-bold text-stone-800">30-Day Trial</span>
              </div>
            </div>
          </section>
        </div>

        <!-- ==========================================
             RELATED PRODUCTS CAROUSEL / GRID
             ========================================== -->
        <section v-if="relatedProductsList.length > 0" class="related-section mt-16 pt-12 border-t border-stone-200">
          <div class="flex items-end justify-between mb-8">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-amber-800">Curated Pairing</span>
              <h2 class="text-2xl sm:text-3xl font-serif text-stone-900 mt-1">More Like This</h2>
            </div>
            <div class="flex items-center gap-3">
              <button
                v-if="relatedProductsList.length > 3"
                @click="scrollRelated('left')"
                class="w-9 h-9 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="Previous products"
                title="Previous products"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                v-if="relatedProductsList.length > 3"
                @click="scrollRelated('right')"
                class="w-9 h-9 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="Next products"
                title="Next products"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <router-link
                :to="`/shop?categories=${product?.category || ''}`"
                class="hidden sm:inline-flex items-center ml-2 text-xs font-semibold text-stone-700 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
              >
                Explore Collection →
              </router-link>
            </div>
          </div>

          <div
            ref="relatedScrollContainer"
            class="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 shop-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            <div
              v-for="item in relatedProductsList"
              :key="item.id"
              class="related-card flex-none w-[220px] sm:w-[250px] md:w-[270px] snap-start group flex flex-col bg-white rounded-2xl p-3 border border-stone-200/80 hover:border-stone-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
              @click="navigateToProduct(item)"
            >
              <!-- Product Image with Quick Add Button -->
              <div class="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 mb-3">
                <img
                  :src="optimizeImageUrl(item.thumbnail || item.images?.[0], { width: 480, quality: 80 })"
                  :alt="item.name"
                  loading="lazy"
                  decoding="async"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <!-- Quick Add to Cart Button -->
                <button
                  @click.stop="quickAddToCart(item)"
                  :disabled="quickAddingId === item.id"
                  class="absolute bottom-2.5 right-2.5 p-2 rounded-full bg-white/95 backdrop-blur-sm text-stone-800 shadow-md hover:bg-stone-900 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none"
                  :title="`Quick add ${item.name} to cart`"
                  aria-label="Quick Add to Cart"
                >
                  <svg
                    v-if="quickAddingId === item.id"
                    class="w-4 h-4 animate-spin text-stone-900"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <svg
                    v-else-if="quickAddedId === item.id"
                    class="w-4 h-4 text-emerald-600 animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <!-- Product Info -->
              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <span class="block text-[11px] font-bold tracking-wider uppercase text-amber-800 mb-0.5">
                    {{ item.brand || 'Nordic Studio' }}
                  </span>
                  <h3 class="text-xs sm:text-sm font-medium text-stone-900 line-clamp-1 group-hover:text-amber-900 transition-colors">
                    {{ item.name }}
                  </h3>
                </div>
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                  <span class="text-xs sm:text-sm font-bold text-stone-900">${{ formatPriceNumber(item.price) }}</span>
                  <div v-if="item.rating" class="flex items-center gap-1 text-xs text-stone-500">
                    <svg class="w-3 h-3 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{{ Number(item.rating).toFixed(1) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ==========================================
             CUSTOMER REVIEWS & WRITE A REVIEW SECTION
             ========================================== -->
        <section id="reviews-section" class="reviews-section mt-16 pt-12 border-t border-stone-200">
          <div class="reviews-header flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-amber-800">Verified Feedback</span>
              <h2 class="text-2xl sm:text-3xl font-serif text-stone-900 mt-1">Customer Reviews</h2>
            </div>

            <!-- "Write a Review" CTA Button -->
            <button
              @click="openReviewModal"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 active:scale-95 transition-all shadow-sm self-start md:self-auto"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Write a Review</span>
            </button>
          </div>

          <!-- Rating Breakdown Summary Card -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/80 shadow-xs mb-10">
            <!-- Overall Score -->
            <div class="flex flex-col items-center justify-center text-center p-4 lg:border-r lg:border-stone-100">
              <span class="text-5xl font-serif font-bold text-stone-900 mb-2">
                {{ productRating.toFixed(1) }}
              </span>
              <div class="flex gap-1 mb-2">
                <svg
                  v-for="n in 5"
                  :key="n"
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  :fill="n <= Math.round(productRating) ? '#F59E0B' : 'none'"
                  :stroke="n <= Math.round(productRating) ? '#F59E0B' : '#D4CFC6'"
                  stroke-width="1.8"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </div>
              <p class="text-xs text-stone-500">Based on {{ totalReviewsCount }} verified customer reviews</p>
              <div class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>96% Recommend this product</span>
              </div>
            </div>

            <!-- Star Distribution Bars -->
            <div class="lg:col-span-2 flex flex-col justify-center space-y-2.5">
              <div
                v-for="star in [5, 4, 3, 2, 1]"
                :key="star"
                class="flex items-center gap-3 text-xs"
              >
                <div class="flex items-center gap-1 w-12 shrink-0 font-medium text-stone-700">
                  <span>{{ star }}</span>
                  <svg class="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div class="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-400 rounded-full transition-all duration-500"
                    :style="{ width: `${getStarPercentage(star)}%` }"
                  ></div>
                </div>
                <span class="w-10 text-right text-stone-400 font-mono text-[11px]">
                  {{ getStarCount(star) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Reviews List -->
          <div v-if="reviewsList.length > 0" class="space-y-4">
            <div
              v-for="rev in reviewsList"
              :key="rev.id || rev._tempId"
              class="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs transition-all hover:border-stone-300"
            >
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex items-center gap-3">
                  <!-- Avatar initials -->
                  <div class="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-sm">
                    {{ getInitials(rev.author_name || rev.authorName || 'Guest') }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-stone-900">{{ rev.author_name || rev.authorName || 'Anonymous Buyer' }}</span>
                      <span
                        v-if="rev.is_verified_purchase !== false"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Verified Buyer</span>
                      </span>
                    </div>
                    <span class="text-xs text-stone-400">{{ formatDate(rev.created_at || rev.date) }}</span>
                  </div>
                </div>

                <!-- Review Star Rating -->
                <div class="flex gap-0.5">
                  <svg
                    v-for="n in 5"
                    :key="n"
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    :fill="n <= Number(rev.rating) ? '#F59E0B' : 'none'"
                    :stroke="n <= Number(rev.rating) ? '#F59E0B' : '#D4CFC6'"
                    stroke-width="1.8"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                </div>
              </div>

              <!-- Review Title & Comment -->
              <h4 v-if="rev.title" class="font-semibold text-stone-900 text-sm mb-1.5">{{ rev.title }}</h4>
              <p class="text-stone-700 text-sm leading-relaxed mb-4">{{ rev.comment || rev.text }}</p>

              <!-- Helpful Button -->
              <div class="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
                <span>Was this review helpful?</span>
                <button
                  @click="toggleHelpful(rev)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 hover:bg-stone-50 transition-colors text-stone-700"
                  :class="{ 'bg-stone-100 font-semibold text-stone-900 border-stone-300': rev._isHelpful }"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span>Yes ({{ (rev.helpfulCount || 0) + (rev._isHelpful ? 1 : 0) }})</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty Reviews State -->
          <div v-else class="text-center py-10 bg-white rounded-2xl border border-stone-200 p-8">
            <p class="text-stone-600 text-sm mb-3">No reviews yet for this product. Be the first to share your experience!</p>
            <button
              @click="openReviewModal"
              class="px-5 py-2.5 rounded-full bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors"
            >
              Write First Review
            </button>
          </div>
        </section>
      </div>
    </main>

    <!-- ==========================================
         FULLSCREEN LIGHTBOX MODAL
         ========================================== -->
    <Teleport to="body">
      <div
        v-if="isLightboxOpen"
        class="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md text-white select-none animate-fadeIn"
        @keydown.esc="closeLightbox"
        tabindex="0"
        ref="lightboxRef"
      >
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <span class="font-medium text-sm text-stone-200">{{ product?.name }}</span>
            <span class="text-xs text-stone-400">({{ currentImageIndex + 1 }} of {{ galleryImages.length }})</span>
          </div>
          <button
            @click="closeLightbox"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all focus:outline-none"
            aria-label="Close Lightbox"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Center High-Res Image Area -->
        <div class="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
          <img
            :src="optimizeImageUrl(galleryImages[currentImageIndex], { width: 1920, quality: 90 })"
            :alt="`${product?.name} High-Res View`"
            decoding="async"
            class="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all duration-300"
          />

          <!-- Modal Navigation Arrows -->
          <button
            v-if="galleryImages.length > 1"
            class="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all focus:outline-none"
            @click="prevImage"
            aria-label="Previous Image"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            v-if="galleryImages.length > 1"
            class="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all focus:outline-none"
            @click="nextImage"
            aria-label="Next Image"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Modal Bottom Thumbnail Carousel -->
        <div v-if="galleryImages.length > 1" class="flex justify-center gap-2 p-4 border-t border-white/10 overflow-x-auto">
          <button
            v-for="(img, idx) in galleryImages"
            :key="idx"
            class="w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0"
            :class="currentImageIndex === idx ? 'border-amber-400 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'"
            @click="currentImageIndex = idx"
          >
            <img
              :src="optimizeImageUrl(img, { width: 160, quality: 80 })"
              class="w-full h-full object-cover"
              alt="Thumb"
              loading="lazy"
              decoding="async"
            />
          </button>
        </div>
      </div>
    </Teleport>

    <!-- ==========================================
         WRITE A REVIEW MODAL
         ========================================== -->
    <Teleport to="body">
      <div
        v-if="isReviewModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      >
        <div class="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 animate-slideUp">
          <!-- Close Button -->
          <button
            @click="closeReviewModal"
            class="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Close review modal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 class="text-xl font-serif font-bold text-stone-900 mb-1">Write a Review</h3>
          <p class="text-xs text-stone-500 mb-6">Share your authentic experience with <span class="font-semibold text-stone-800">{{ product?.name }}</span></p>

          <form @submit.prevent="submitReviewForm" class="space-y-4">
            <!-- 1 to 5 Star Interactive Rating Picker -->
            <div>
              <label class="block text-xs font-semibold text-stone-800 mb-1.5">Overall Rating *</label>
              <div class="flex items-center gap-2">
                <div class="flex gap-1.5">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="p-1 text-stone-300 hover:scale-115 transition-transform focus:outline-none"
                    @mouseenter="hoverStar = star"
                    @mouseleave="hoverStar = 0"
                    @click="newReview.rating = star"
                  >
                    <svg
                      class="w-7 h-7 transition-colors"
                      viewBox="0 0 24 24"
                      :fill="star <= (hoverStar || newReview.rating) ? '#F59E0B' : 'none'"
                      :stroke="star <= (hoverStar || newReview.rating) ? '#F59E0B' : '#D4CFC6'"
                      stroke-width="1.8"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                </div>
                <span class="text-xs font-semibold text-amber-700 ml-2">
                  {{ getStarDescription(hoverStar || newReview.rating) }}
                </span>
              </div>
            </div>

            <!-- Author Name -->
            <div>
              <label class="block text-xs font-semibold text-stone-800 mb-1">Your Name *</label>
              <input
                type="text"
                v-model="newReview.author_name"
                placeholder="e.g. Eleanor Vance"
                required
                class="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
              />
            </div>

            <!-- Review Title -->
            <div>
              <label class="block text-xs font-semibold text-stone-800 mb-1">Review Title</label>
              <input
                type="text"
                v-model="newReview.title"
                placeholder="e.g. Stunning craftsmanship and incredible comfort"
                class="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
              />
            </div>

            <!-- Review Comment -->
            <div>
              <label class="block text-xs font-semibold text-stone-800 mb-1">Your Review *</label>
              <textarea
                v-model="newReview.comment"
                rows="4"
                placeholder="What did you love about this piece? How was the delivery and assembly?"
                required
                class="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>

            <!-- Submission Feedback -->
            <div v-if="reviewSubmitError" class="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
              {{ reviewSubmitError }}
            </div>
            <div v-if="reviewSubmitSuccess" class="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Thank you! Your review has been submitted successfully.</span>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                @click="closeReviewModal"
                class="px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 font-medium text-xs hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmittingReview || reviewSubmitSuccess"
                class="px-6 py-2.5 rounded-full bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs"
              >
                <svg
                  v-if="isSubmittingReview"
                  class="w-3.5 h-3.5 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>{{ isSubmittingReview ? 'Submitting...' : 'Post Review' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getFeaturedProducts } from '@/api/shopApi.js'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import { optimizeImageUrl } from '@/utils/imageOptimizer.js'

// Route & Stores
const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authStore = useAuthStore()

// Modal Injections
const { openLogin } = inject('authUtils', { openLogin: () => {} })
const { openCart } = inject('cartUtils', { openCart: () => {} })
const { openWishlist } = inject('wishlistUtils', { openWishlist: () => {} })

// State
const loading = ref(true)
const fetchError = ref(null)
const currentImageIndex = ref(0)
const selectedColor = ref('')
const quantity = ref(1)
const isAddingToCart = ref(false)
const addedToCartSuccess = ref(false)
const quickAddingId = ref(null)
const quickAddedId = ref(null)
const isLinkCopied = ref(false)

// Zoom lens state
const isZoomed = ref(false)
const zoomOrigin = ref('center center')

// Lightbox & Review Modals
const isLightboxOpen = ref(false)
const lightboxRef = ref(null)
const isReviewModalOpen = ref(false)
const isSubmittingReview = ref(false)
const reviewSubmitSuccess = ref(false)
const reviewSubmitError = ref(null)
const hoverStar = ref(0)
const newReview = ref({
  rating: 5,
  author_name: '',
  title: '',
  comment: '',
})

// Main Product Data
const product = ref(null)
const relatedProductsList = ref([])
const relatedScrollContainer = ref(null)
const reviewsList = ref([])

// Preset fallback furniture product
const presetProduct = {
  id: 'preset-1',
  name: 'Modern Comfort Lounge Sofa',
  slug: 'modern-comfort-lounge-sofa',
  price: 1299,
  originalPrice: 1599,
  discount: 19,
  brand: 'Nordic Home',
  category: 'furniture',
  categoryName: 'Furniture',
  space: 'living-room',
  spaceName: 'Living Room',
  style: 'scandinavian',
  material: 'Solid Oak Wood & Bouclé',
  room: 'Living Room',
  colors: ['Natural Oak', 'Charcoal Grey', 'Warm Beige', 'Desert Ochre'],
  colorData: [
    { name: 'Natural Oak', hex: '#E5D3B3' },
    { name: 'Charcoal Grey', hex: '#3B3835' },
    { name: 'Warm Beige', hex: '#D4C8B8' },
    { name: 'Desert Ochre', hex: '#C28B59' },
  ],
  rating: 4.8,
  reviews: 127,
  popularity: 95,
  inStock: true,
  stockCount: 12,
  isNew: true,
  isBestSeller: true,
  isFeatured: true,
  images: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1000&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&h=1000&fit=crop',
  ],
  thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
  description:
    'Elevate your living space with this meticulously crafted architectural lounge sofa. Constructed with sustainably harvested solid Oak and upholstered in premium high-resilience bouclé fabric, it offers unmatched comfort and enduring Nordic elegance.',
  features: [
    'Kiln-dried solid Oak interior frame for lifelong structural stability',
    'High-density foam cushions with duck down topper for cloud-like support',
    'Stain-resistant, OEKO-TEX® certified tailored bouclé upholstery',
    'Precision hand-joined timber with water-based non-toxic lacquer finish',
    'Backed by our comprehensive 5-year structural warranty',
  ],
  dimensions: {
    width: 220,
    height: 85,
    depth: 95,
    unit: 'cm',
  },
  weight: 45,
}

// Preset Fallback Reviews
const defaultPresetReviews = [
  {
    id: 'rev-1',
    author_name: 'Charlotte Sterling',
    rating: 5,
    title: 'Exceeded every single expectation',
    comment:
      'The wood grain and upholstery texture are stunning in person. Delivery team was extremely professional, brought it straight to our living room and assembled within 15 minutes. Absolutely worth every penny!',
    is_verified_purchase: true,
    created_at: '2026-03-12T14:32:00Z',
    helpfulCount: 14,
  },
  {
    id: 'rev-2',
    author_name: 'Marcus Vance',
    rating: 5,
    title: 'Flawless Nordic minimalist design',
    comment:
      'Incredible build quality and deep comfortable seating. The cushions have the ideal balance of plush sink-in comfort and ergonomic firmness. Highly recommend!',
    is_verified_purchase: true,
    created_at: '2026-02-28T09:15:00Z',
    helpfulCount: 9,
  },
  {
    id: 'rev-3',
    author_name: 'Elena Rostova',
    rating: 4,
    title: 'Beautiful piece, very sturdy',
    comment:
      'The color matches the swatch perfectly and the wood finish is smooth as silk. It is slightly firmer than our previous sofa, but has softened nicely over the past month.',
    is_verified_purchase: true,
    created_at: '2026-02-10T18:45:00Z',
    helpfulCount: 5,
  },
]

// ===========================================
// COMPUTED PROPERTIES
// ===========================================

const galleryImages = computed(() => {
  if (!product.value) return []
  if (Array.isArray(product.value.images) && product.value.images.length > 0) {
    return product.value.images
  }
  if (product.value.thumbnail) {
    return [product.value.thumbnail]
  }
  return [presetProduct.thumbnail]
})

const currentImage = computed(() => {
  return galleryImages.value[currentImageIndex.value] || galleryImages.value[0] || ''
})

const zoomStyle = computed(() => {
  if (!isZoomed.value) {
    return {
      transformOrigin: 'center center',
      transform: 'scale(1)',
    }
  }
  return {
    transformOrigin: zoomOrigin.value,
    transform: 'scale(2.2)',
  }
})

const formattedPrice = computed(() => {
  if (!product.value) return '0.00'
  const val = Number(product.value.price) || 0
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const savingsAmount = computed(() => {
  if (!product.value?.originalPrice || !product.value?.price) return '0.00'
  const saved = Math.max(0, Number(product.value.originalPrice) - Number(product.value.price))
  return saved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const calculateSubtotal = computed(() => {
  const p = Number(product.value?.price) || 0
  const q = Number(quantity.value) || 1
  return (p * q).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const isWishlisted = computed(() => {
  return !!product.value?.id && wishlistStore.isInWishlist(product.value.id)
})

const isProductInStock = computed(() => {
  if (!product.value) return false
  return product.value.inStock !== false && (product.value.stockCount === undefined || product.value.stockCount > 0)
})

const maxAvailableStock = computed(() => {
  if (!product.value) return 10
  if (typeof product.value.stockCount === 'number') {
    return Math.max(1, product.value.stockCount)
  }
  return 10
})

const stockStatusText = computed(() => {
  if (!isProductInStock.value) return 'Out of Stock'
  if (maxAvailableStock.value <= 5) return `Low Stock (Only ${maxAvailableStock.value} left!)`
  return `In Stock (${maxAvailableStock.value} available)`
})

const stockBadgeClasses = computed(() => {
  if (!isProductInStock.value) return 'bg-rose-50 text-rose-700 border border-rose-200'
  if (maxAvailableStock.value <= 5) return 'bg-amber-50 text-amber-800 border border-amber-200'
  return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
})

const stockDotClasses = computed(() => {
  if (!isProductInStock.value) return 'bg-rose-500'
  if (maxAvailableStock.value <= 5) return 'bg-amber-500 animate-pulse'
  return 'bg-emerald-500 animate-pulse'
})

const availableColors = computed(() => {
  if (product.value?.colorData && product.value.colorData.length > 0) {
    return product.value.colorData
  }
  if (product.value?.colors && Array.isArray(product.value.colors)) {
    return product.value.colors.map((c) => ({
      name: typeof c === 'string' ? c : c.name || 'Default',
      hex: typeof c === 'object' ? c.hex : getColorHex(c),
    }))
  }
  return [
    { name: 'Natural Oak', hex: '#E5D3B3' },
    { name: 'Charcoal Grey', hex: '#3B3835' },
    { name: 'Warm Beige', hex: '#D4C8B8' },
  ]
})

const currentColorName = computed(() => {
  if (selectedColor.value) return selectedColor.value
  return availableColors.value[0]?.name || 'Standard'
})

const activeColorHex = computed(() => {
  const match = availableColors.value.find((c) => c.name === currentColorName.value)
  return match?.hex || '#333333'
})

const productRating = computed(() => {
  if (!product.value) return 4.8
  return Number(product.value.rating) || 4.8
})

const totalReviewsCount = computed(() => {
  return Math.max(reviewsList.value.length, product.value?.reviews || 0)
})

const displayDimensions = computed(() => {
  if (product.value?.dimensions) {
    return {
      width: product.value.dimensions.width || 200,
      height: product.value.dimensions.height || 85,
      depth: product.value.dimensions.depth || 90,
      unit: product.value.dimensions.unit || 'cm',
    }
  }
  return { width: 220, height: 85, depth: 95, unit: 'cm' }
})

const productFeatures = computed(() => {
  if (product.value?.features && Array.isArray(product.value.features) && product.value.features.length > 0) {
    return product.value.features
  }
  return presetProduct.features
})

// ===========================================
// METHODS
// ===========================================

function getColorHex(colorName) {
  const name = String(colorName).toLowerCase()
  const map = {
    oak: '#D7C4A5',
    natural: '#E5D3B3',
    charcoal: '#3B3835',
    black: '#1A1816',
    white: '#FAF8F5',
    beige: '#D4C8B8',
    brown: '#8B5A2B',
    walnut: '#5D4037',
    grey: '#8A8680',
    gray: '#8A8680',
    ochre: '#C28B59',
    amber: '#D97706',
    terracotta: '#C15C3D',
    sand: '#E3DAC9',
    green: '#4A6B53',
    olive: '#556B2F',
    navy: '#1B263B',
    blue: '#3A5A78',
  }
  for (const [k, v] of Object.entries(map)) {
    if (name.includes(k)) return v
  }
  return '#8A8680'
}

function isLightColor(hex) {
  if (!hex || !hex.startsWith('#')) return false
  const c = hex.substring(1)
  const rgb = parseInt(c, 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma > 180
}

function formatPriceNumber(price) {
  const val = Number(price) || 0
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCategory(cat) {
  if (!cat) return 'Furniture'
  return String(cat)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function getInitials(name) {
  if (!name) return 'SF'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/shop')
  }
}

function prevImage() {
  const len = galleryImages.value.length
  if (len <= 1) return
  currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
}

function nextImage() {
  const len = galleryImages.value.length
  if (len <= 1) return
  currentImageIndex.value = (currentImageIndex.value + 1) % len
}

function handleMouseMoveZoom(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
  zoomOrigin.value = `${x}% ${y}%`
}

function handleMouseLeaveZoom() {
  isZoomed.value = false
  zoomOrigin.value = 'center center'
}

function openLightbox() {
  isLightboxOpen.value = true
  nextTick(() => {
    lightboxRef.value?.focus()
  })
}

function closeLightbox() {
  isLightboxOpen.value = false
}

function selectColor(color) {
  selectedColor.value = color.name
}

function incrementQuantity() {
  if (quantity.value < maxAvailableStock.value) {
    quantity.value++
  }
}

function decrementQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function sanitizeQuantity() {
  let val = parseInt(quantity.value, 10)
  if (isNaN(val) || val < 1) val = 1
  if (val > maxAvailableStock.value) val = maxAvailableStock.value
  quantity.value = val
}

async function copyProductLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    isLinkCopied.value = true
    setTimeout(() => {
      isLinkCopied.value = false
    }, 2500)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

function scrollToReviews() {
  const el = document.getElementById('reviews-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function addToCart() {
  if (!isProductInStock.value || isAddingToCart.value) return
  try {
    isAddingToCart.value = true
    const variant = currentColorName.value
    const priceVal = product.value.price || 0
    await cartStore.addItem(product.value.id, quantity.value, priceVal, variant)

    addedToCartSuccess.value = true
    setTimeout(() => {
      addedToCartSuccess.value = false
    }, 2500)
    openCart()
  } catch (err) {
    console.error('Failed to add to cart:', err)
    if (
      String(err).includes('401') ||
      String(err).toLowerCase().includes('unauthorized') ||
      String(err).includes('guest token')
    ) {
      openLogin()
    }
  } finally {
    isAddingToCart.value = false
  }
}

async function toggleWishlist() {
  if (!product.value?.id) return
  try {
    const isAdded = await wishlistStore.toggleItem(product.value.id)
    if (isAdded) {
      openWishlist()
    }
  } catch (err) {
    console.error('Failed to toggle wishlist:', err)
    if (
      String(err).includes('401') ||
      String(err).toLowerCase().includes('unauthorized') ||
      String(err).includes('guest token')
    ) {
      openLogin()
    }
  }
}

async function quickAddToCart(item) {
  try {
    quickAddingId.value = item.id
    await cartStore.addItem(item.id, 1, item.price)
    quickAddedId.value = item.id
    setTimeout(() => {
      quickAddedId.value = null
    }, 2000)
    openCart()
  } catch (err) {
    console.error('Quick add failed:', err)
    if (
      String(err).includes('401') ||
      String(err).toLowerCase().includes('unauthorized') ||
      String(err).includes('guest token')
    ) {
      openLogin()
    }
  } finally {
    quickAddingId.value = null
  }
}

function navigateToProduct(item) {
  router.push(`/shop/product/${item.id}`)
}

function scrollRelated(direction) {
  if (!relatedScrollContainer.value) return
  const scrollAmount = Math.max(300, relatedScrollContainer.value.clientWidth * 0.75)
  relatedScrollContainer.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}

// Review helpers
function getStarPercentage(star) {
  const total = reviewsList.value.length
  if (total === 0) return star >= 4 ? 40 : 10
  const count = reviewsList.value.filter((r) => Math.round(Number(r.rating)) === star).length
  return Math.round((count / total) * 100)
}

function getStarCount(star) {
  return reviewsList.value.filter((r) => Math.round(Number(r.rating)) === star).length
}

function getStarDescription(rating) {
  const desc = ['Select Rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Exceptional']
  return desc[rating] || 'Very Good'
}

function toggleHelpful(rev) {
  rev._isHelpful = !rev._isHelpful
}

function openReviewModal() {
  reviewSubmitSuccess.value = false
  reviewSubmitError.value = null
  newReview.value = {
    rating: 5,
    author_name: authStore.userName !== 'Guest' ? authStore.userName : '',
    title: '',
    comment: '',
  }
  isReviewModalOpen.value = true
}

function closeReviewModal() {
  isReviewModalOpen.value = false
}

async function submitReviewForm() {
  if (!product.value?.id) return
  if (!newReview.value.rating || !newReview.value.comment) {
    reviewSubmitError.value = 'Please provide a star rating and comment.'
    return
  }

  isSubmittingReview.value = true
  reviewSubmitError.value = null

  try {
    const payload = {
      product_id: product.value.id,
      rating: newReview.value.rating,
      title: newReview.value.title || undefined,
      comment: newReview.value.comment,
      author_name: newReview.value.author_name || authStore.userName || 'Verified Buyer',
    }

    // Try submitting through backend review endpoint
    try {
      await api.submitReview(payload)
    } catch (apiErr) {
      console.warn('API review submission fallback to local:', apiErr)
    }

    // Optimistic local update
    const createdRev = {
      _tempId: 'local-' + Date.now(),
      author_name: payload.author_name,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
      is_verified_purchase: true,
      created_at: new Date().toISOString(),
      helpfulCount: 0,
    }

    reviewsList.value.unshift(createdRev)

    // Store in localStorage for persistence
    try {
      const storageKey = `sf_reviews_${product.value.id}`
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
      existing.unshift(createdRev)
      localStorage.setItem(storageKey, JSON.stringify(existing))
    } catch (e) {
      console.error('Storage error:', e)
    }

    reviewSubmitSuccess.value = true
    setTimeout(() => {
      closeReviewModal()
    }, 1500)
  } catch (err) {
    reviewSubmitError.value = err.message || 'Failed to submit review. Please try again.'
  } finally {
    isSubmittingReview.value = false
  }
}

// Load Product & Related Items
async function loadProduct() {
  const productId = route.params.id
  loading.value = true
  fetchError.value = null

  try {
    if (!productId || productId === 'preset-1') {
      product.value = presetProduct
      reviewsList.value = [...defaultPresetReviews]
      loadRelatedProducts(presetProduct)
      return
    }

    const response = await getProduct(productId)

    if (response.success && response.data) {
      product.value = response.data
      selectedColor.value = response.data.colorData?.[0]?.name || response.data.colors?.[0] || ''

      // Fetch reviews
      await loadReviews(response.data.id)

      // Related products (ensure at least 6-8 items for smooth carousel scrolling)
      if (response.data.relatedProducts && response.data.relatedProducts.length >= 6) {
        relatedProductsList.value = response.data.relatedProducts
      } else {
        await loadRelatedProducts(response.data, response.data.relatedProducts || [])
      }
    } else {
      fetchError.value = response.error || 'Product not found'
    }
  } catch (err) {
    console.error('Error loading product:', err)
    fetchError.value = err.message || 'Failed to load product details'
  } finally {
    loading.value = false
  }
}

async function loadReviews(productId) {
  try {
    const res = await api.getProductReviews(productId)
    if (res && res.reviews && Array.isArray(res.reviews) && res.reviews.length > 0) {
      reviewsList.value = res.reviews
    } else {
      reviewsList.value = [...defaultPresetReviews]
    }
  } catch (e) {
    console.warn('Using default reviews for product:', e)
    reviewsList.value = [...defaultPresetReviews]
  }

  // Merge any local user reviews
  try {
    const storageKey = `sf_reviews_${productId}`
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
    if (Array.isArray(stored) && stored.length > 0) {
      reviewsList.value = [...stored, ...reviewsList.value]
    }
  } catch (e) {
    console.error('Storage parse error:', e)
  }
}

async function loadRelatedProducts(prod, initialList = []) {
  try {
    const list = [...initialList]
    const currentId = String(prod?.id || '')
    const existingIds = new Set([currentId, ...list.map((p) => String(p.id))])

    const featuredRes = await getFeaturedProducts()
    if (featuredRes && featuredRes.success && featuredRes.data) {
      const candidates = [
        ...(Array.isArray(featuredRes.data) ? featuredRes.data : []),
        ...(featuredRes.data.featured || []),
        ...(featuredRes.data.bestSellers || []),
        ...(featuredRes.data.newArrivals || []),
      ]

      for (const item of candidates) {
        if (item && item.id && !existingIds.has(String(item.id))) {
          existingIds.add(String(item.id))
          list.push(item)
          if (list.length >= 8) break
        }
      }
    }

    relatedProductsList.value = list
  } catch (e) {
    console.warn('Failed to load related products:', e)
    relatedProductsList.value = initialList
  }
}

// Watch route changes
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      currentImageIndex.value = 0
      selectedColor.value = ''
      quantity.value = 1
      loadProduct()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
)

// Keyboard listener for lightbox
function handleKeyDown(e) {
  if (!isLightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  loadProduct()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
@import '@/assets/shop.css';

/* ============================================
   SPACEFURNIO PRODUCT DETAIL STYLES
   ============================================ */

.product-detail-page {
  min-height: 100vh;
  background: var(--shop-cream, #faf8f5);
  padding-top: 5rem;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  color: #2c2926;
}

/* Navigation */
.detail-nav {
  position: relative;
  background: rgba(250, 248, 245, 0.96);
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
  padding: 0.875rem 0;
}

.nav-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.back-btn:hover {
  border-color: #a89b8c;
  background: #fbf9f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* Breadcrumbs */
.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: nowrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.breadcrumb-link {
  font-size: 0.8125rem;
  color: #8b7d6d;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #1a1816;
}

.breadcrumb-current {
  font-size: 0.8125rem;
  color: #1a1816;
  font-weight: 600;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-sep {
  margin: 0 0.5rem;
  color: #c4b8a9;
}

/* Main Layout */
.detail-main {
  padding: 2rem 0 5rem;
}

.detail-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 1024px) {
  .detail-layout {
    grid-template-columns: 1.08fr 1fr;
    gap: 4rem;
  }
}

/* Gallery Section */
.gallery-section {
  position: relative;
  align-self: start;
}

.main-image-wrapper {
  position: relative;
  aspect-ratio: 1;
  border-radius: 1.25rem;
  overflow: hidden;
  background: white;
  border: 1px solid var(--shop-beige, #e8e3dc);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  cursor: crosshair;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-badges {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  z-index: 10;
}

.badge {
  padding: 0.35rem 0.8rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.badge-new {
  background: #1a1816;
  color: #fff;
}

.badge-sale {
  background: #b8956c;
  color: #fff;
}

.badge-bestseller {
  background: #d97706;
  color: #fff;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  color: #3d3a36;
  transition: all 0.2s ease;
  z-index: 10;
}

.gallery-nav:hover {
  background: white;
  transform: translateY(-50%) scale(1.08);
  color: #111;
}

.gallery-nav.prev {
  left: 1rem;
}

.gallery-nav.next {
  right: 1rem;
}

/* Thumbnails */
.thumbnails-container {
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.thumbnails {
  display: flex;
  gap: 0.75rem;
}

.thumb {
  position: relative;
  width: 76px;
  height: 76px;
  flex-shrink: 0;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  padding: 0;
  opacity: 0.65;
}

.thumb:hover {
  opacity: 1;
  border-color: #c4b8a9;
  transform: translateY(-2px);
}

.thumb.active {
  opacity: 1;
  border-color: #1a1816;
  box-shadow: 0 0 0 2px rgba(26, 24, 22, 0.15);
  transform: translateY(-2px);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-active-dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #1a1816;
}

/* Info Section */
.info-section {
  padding-top: 0.5rem;
}

.product-header {
  margin-bottom: 1.5rem;
}

.product-name {
  font-size: clamp(1.75rem, 3.5vw, 2.35rem);
  font-weight: 500;
  color: #1a1816;
  margin: 0 0 0.875rem 0;
  line-height: 1.2;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.125rem;
}

/* Price Section */
.price-section {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
}

.current-price {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1816;
}

.original-price {
  font-size: 1.25rem;
  color: #a89b8c;
  text-decoration: line-through;
}

.discount-badge {
  padding: 0.3rem 0.8rem;
  background: #fdf6ec;
  border: 1px solid #f9d8a7;
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 9999px;
}

/* Description */
.product-description {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #63584c;
  margin: 0 0 1.5rem 0;
}

/* Option Groups */
.option-group {
  margin-bottom: 1.5rem;
}

.option-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #3d3a36;
}

/* Color Options */
.color-options {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.color-swatch-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  border: 2px solid transparent;
  background: white;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 2px;
}

.swatch-color {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: block;
}

.swatch-check {
  position: absolute;
  width: 1rem;
  height: 1rem;
}

.color-swatch-btn:hover {
  transform: scale(1.1);
}

.color-swatch-btn.selected {
  border-color: #1a1816;
  box-shadow: 0 0 0 2px rgba(26, 24, 22, 0.2);
  transform: scale(1.08);
}

.swatch-tooltip {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: #1a1816;
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 20;
}

.color-swatch-btn:hover .swatch-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Quantity Selector */
.quantity-selector {
  display: inline-flex;
  align-items: center;
  background: white;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 0.625rem;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  background: transparent;
  border: none;
  color: #63584c;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #f5f2ed;
  color: #1a1816;
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-input {
  width: 3.25rem;
  height: 2.6rem;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  border-left: 1px solid var(--shop-beige, #e8e3dc);
  border-right: 1px solid var(--shop-beige, #e8e3dc);
  color: #1a1816;
}

.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-input:focus {
  outline: none;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.875rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
}

.btn-add-cart {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1rem 2rem;
  background: #1a1816;
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(26, 24, 22, 0.2);
}

.btn-add-cart:hover:not(:disabled) {
  background: #000;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 24, 22, 0.3);
}

.btn-add-cart:active:not(:disabled) {
  transform: translateY(0);
}

.btn-add-cart.btn-success {
  background: #065f46;
}

.btn-add-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-wishlist {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  background: white;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 50%;
  color: #8b7d6d;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.btn-wishlist:hover {
  border-color: #ef4444;
  color: #ef4444;
  transform: scale(1.06);
}

.btn-wishlist.active {
  color: #ef4444;
  border-color: #fecdd3;
  background: #fff1f2;
}

/* Specs Items */
.spec-item {
  padding: 0.625rem 0.75rem;
  background: #faf8f5;
  border: 1px solid #eee8e0;
  border-radius: 0.625rem;
}

.spec-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b7d6d;
  margin-bottom: 0.2rem;
}

.spec-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1816;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animations */
@keyframes heartBeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.28); }
  28% { transform: scale(1); }
  42% { transform: scale(1.2); }
  70% { transform: scale(1); }
}

.heart-beat {
  animation: heartBeat 0.7s cubic-bezier(0.215, 0.61, 0.355, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .breadcrumbs {
    display: none;
  }
}
</style>
