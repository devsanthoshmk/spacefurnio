<template>
  <div class="mt-20 bg-white">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex justify-center items-center min-h-screen">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p class="text-gray-600">{{ error }}</p>
        <router-link to="/shop/category" class="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
          Back to Shop
        </router-link>
      </div>
    </div>

    <!-- Product Details -->
    <div v-else-if="product" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <div class="mb-8" data-aos="fade-down" data-aos-duration="600">
        <Breadcrumbs :items="breadcrumbs" />
      </div>

      <!-- Main Product Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <!-- Product Images & 3D Viewer -->
        <div class="space-y-4" data-aos="fade-right" data-aos-duration="800">
          <!-- View Toggle Buttons -->
          <div class="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              @click="viewMode = '2d'"
              :class="[
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                viewMode === '2d'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-orange-500'
              ]"
            >
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Photos
            </button>
            <button
              @click="viewMode = '3d'"
              :class="[
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                viewMode === '3d'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-orange-500'
              ]"
            >
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              3D View
            </button>
          </div>

          <!-- 2D Image View -->
          <div v-show="viewMode === '2d'" class="space-y-4">
            <div class="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative group">
              <img
                :src="selectedImage"
                :alt="product.imageAlt"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <!-- Thumbnail Images -->
            <div class="grid grid-cols-4 gap-4">
              <div
                v-for="(image, index) in productImages"
                :key="index"
                @click="selectedImage = image"
                :class="[
                  'aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
                  selectedImage === image
                    ? 'ring-2 ring-orange-500 ring-offset-2'
                    : 'hover:opacity-80'
                ]"
              >
                <img
                  :src="image"
                  :alt="`${product.name} view ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- 3D Viewer -->
          <div v-show="viewMode === '3d'" class="relative">
            <div class="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
              <div ref="threejsContainer" class="w-full h-full"></div>
              <!-- 3D Controls Overlay -->
              <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div class="text-xs text-gray-600 mb-2 font-medium">3D Controls</div>
                <div class="space-y-1 text-xs text-gray-500">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    Drag to rotate
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Scroll to zoom
                  </div>
                </div>
              </div>
              <!-- Loading indicator for 3D -->
              <div v-if="loading3D" class="absolute inset-0 flex items-center justify-center bg-white/80">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p class="text-sm text-gray-600">Loading 3D model...</p>
                </div>
              </div>
            </div>
            <!-- 3D View Reset Button -->
            <button
              @click="reset3DView"
              class="mt-3 w-full bg-orange-50 text-orange-600 py-2 px-4 rounded-lg hover:bg-orange-100 transition-colors duration-200 text-sm font-medium"
            >
              Reset View
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="space-y-6" data-aos="fade-left" data-aos-duration="800">
          <!-- Brand -->
          <p class="text-orange-500 font-medium text-lg">{{ product.brand }}</p>

          <!-- Product Name -->
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900">{{ product.name }}</h1>

          <!-- Rating and Reviews -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div class="flex">
                <svg v-for="i in 5" :key="i"
                     :class="i <= Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'"
                     class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <span class="ml-2 text-sm text-gray-600">{{ product.rating }} out of 5</span>
            </div>
            <span class="text-sm text-gray-500">({{ product.reviews }} reviews)</span>
          </div>

          <!-- Price -->
          <div class="text-3xl font-bold text-gray-900">
            ${{ product.price.toLocaleString() }}
          </div>

          <!-- Product Details -->
          <div class="space-y-4" data-aos="fade-up" data-aos-delay="200">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-3">
                <span class="text-sm font-medium text-gray-500">Style:</span>
                <p class="text-gray-900 capitalize font-semibold">{{ product.style }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <span class="text-sm font-medium text-gray-500">Room:</span>
                <p class="text-gray-900 font-semibold">{{ product.room }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <span class="text-sm font-medium text-gray-500">Material:</span>
                <p class="text-gray-900 font-semibold">{{ product.material }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <span class="text-sm font-medium text-gray-500">Popularity:</span>
                <p class="text-gray-900 font-semibold">{{ product.popularity }}%</p>
              </div>
            </div>
          </div>

          <!-- Color Options -->
          <div v-if="product.colors && product.colors.length > 0" data-aos="fade-up" data-aos-delay="300">
            <h3 class="text-sm font-medium text-gray-500 mb-3">Available Colors</h3>
            <div class="flex space-x-3">
              <button v-for="color in product.colors" :key="color"
                      @click="selectedColor = color"
                      :class="[
                        'w-10 h-10 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200',
                        selectedColor === color ? 'border-orange-500 scale-110' : 'border-gray-300 hover:border-orange-300'
                      ]"
                      :style="`background-color: ${getColorHexHelper(color)}`"
                      :title="color">
                <div v-if="selectedColor === color" class="w-full h-full rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Add to Cart Section -->
          <div class="space-y-4 pt-6 border-t border-gray-200" data-aos="fade-up" data-aos-delay="400">
            <div class="flex items-center space-x-4">
              <label for="quantity" class="text-sm font-medium text-gray-700">Quantity:</label>
              <select id="quantity" v-model="selectedQuantity"
                      class="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option v-for="i in 10" :key="i" :value="i">{{ i }}</option>
              </select>
            </div>

            <button
              @click="addToCart({product: product.value, quantity: selectedQuantity, color: selectedColor})"
              :disabled="isAddingToCart"
              class="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span v-if="!isAddingToCart">
                Add to Cart - ${{ (product.price * selectedQuantity).toLocaleString() }}
              </span>
              <span v-else class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </span>
            </button>

            <button
              @click="toggleWishlist(product.value)"
              :class="[
                'w-full py-3 px-6 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]',
                isInWishlist
                  ? 'bg-orange-100 text-orange-600 border border-orange-200'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >
              <svg class="w-5 h-5 inline mr-2" :class="isInWishlist ? 'fill-current' : 'fill-none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              {{ isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Product Specifications -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start" data-aos="fade-up" data-aos-duration="800">
        <div>
          <h2 class="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 mb-6">Product Specifications</h2>
          <p class="text-gray-600 mb-8 leading-relaxed">
            This {{ product.name.toLowerCase() }} combines superior craftsmanship with modern design sensibilities.
            Perfect for {{ product.room }} spaces, it features premium {{ product.material.toLowerCase() }}
            construction with attention to every detail.
          </p>

          <dl class="space-y-6">
            <div v-for="(spec, index) in specifications" :key="spec.name"
                 class="border-l-4 border-orange-500 pl-4 py-2 transform transition-all duration-300 hover:translate-x-2"
                 data-aos="fade-right"
                 :data-aos-delay="index * 100">
              <dt class="font-semibold text-gray-900 text-lg">{{ spec.name }}</dt>
              <dd class="mt-1 text-gray-600">{{ spec.description }}</dd>
            </div>
          </dl>
        </div>

        <!-- Product Images Grid -->
        <div class="grid grid-cols-2 gap-4" data-aos="fade-left" data-aos-duration="800" style="position: sticky;
    top: 50px;">
          <div v-for="(image, i) in productImages.slice(0, 4)" :key="i"
               class="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
               data-aos="zoom-in"
               :data-aos-delay="i * 150">
            <img :src="image"
                 :alt="`${product.name} detail view ${i + 1}`"
                 class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="mt-16 pt-16 border-t border-gray-200" data-aos="fade-up" data-aos-duration="800">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <!-- Rating Summary -->
          <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-lg" data-aos="fade-right" data-aos-delay="100">
            <div class="text-center">
              <div class="text-6xl font-bold text-gray-900 mb-2">{{ product.rating }}</div>
              <div class="flex justify-center mb-3">
                <svg v-for="i in 5" :key="i"
                     :class="i <= Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'"
                     class="w-7 h-7 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <p class="text-gray-700 font-medium">Based on {{ product.reviews }} reviews</p>
            </div>
            
            <!-- Rating Breakdown -->
            <div class="mt-6 space-y-2">
              <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
                <span class="text-sm text-gray-600 w-8">{{ star }}★</span>
                <div class="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    class="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-500"
                    :style="{ width: getRatingPercentage(star) + '%' }"
                  ></div>
                </div>
                <span class="text-sm text-gray-500 w-10 text-right">{{ getRatingPercentage(star) }}%</span>
              </div>
            </div>
          </div>
          
          <!-- Verified Reviews List -->
          <div class="lg:col-span-2 space-y-6">
            <div 
              v-for="(review, index) in customerReviews" 
              :key="index"
              class="bg-white border border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              data-aos="fade-up"
              :data-aos-delay="150 * (index + 1)"
            >
              <!-- Review Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {{ review.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-gray-900">{{ review.name }}</h4>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        Verified Buyer
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex">
                        <svg v-for="i in 5" :key="i"
                             :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                             class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                      <span class="text-sm text-gray-500">{{ review.date }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Review Title -->
              <h5 class="font-semibold text-gray-900 mb-2">{{ review.title }}</h5>
              
              <!-- Review Content -->
              <p class="text-gray-600 leading-relaxed mb-4">{{ review.content }}</p>
              
              <!-- Review Footer -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                <div class="flex items-center gap-4">
                  <button 
                    @click="markHelpful(index)"
                    class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                    </svg>
                    Helpful ({{ review.helpful }})
                  </button>
                </div>
                <span v-if="review.purchaseVerified" class="text-xs text-gray-400 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  Verified Purchase
                </span>
              </div>
            </div>
            
            <!-- View All Reviews Button -->
            <button 
              @click="showReviewsModal = true"
              class="w-full py-4 px-6 border-2 border-orange-200 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              View All {{ product.reviews }} Reviews
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reviews Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showReviewsModal" 
          class="z-[100000] fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          @click.self="showReviewsModal = false"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showReviewsModal = false"></div>
          
          <!-- Modal Content -->
          <div class="relative bg-white w-full sm:max-w-3xl max-h-[90vh] sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden transform transition-all">
            <!-- Modal Header -->
            <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Customer Reviews</h3>
                <p class="text-sm text-gray-500">{{ product.reviews }} verified reviews</p>
              </div>
              <button 
                @click="showReviewsModal = false"
                class="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <!-- Modal Body -->
            <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
              <!-- All Reviews -->
              <div 
                v-for="(review, index) in allReviews" 
                :key="index"
                class="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition-colors duration-200"
              >
                <!-- Review Header -->
                <div class="flex items-start gap-4 mb-3">
                  <div class="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                    {{ review.name.charAt(0) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-semibold text-gray-900">{{ review.name }}</h4>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        Verified Buyer
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex">
                        <svg v-for="i in 5" :key="i"
                             :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                             class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                      <span class="text-sm text-gray-500">{{ review.date }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Review Content -->
                <h5 class="font-semibold text-gray-900 mb-2">{{ review.title }}</h5>
                <p class="text-gray-600 leading-relaxed mb-3">{{ review.content }}</p>
                
                <!-- Review Footer -->
                <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                  <button 
                    @click="markHelpful(index)"
                    class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                    </svg>
                    Helpful ({{ review.helpful }})
                  </button>
                  <span v-if="review.purchaseVerified" class="text-xs text-gray-400 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    Verified Purchase
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as THREE from 'three'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Breadcrumbs from '@/components/Breadcrumbs-component.vue'
import { useCurrentShop, formatNameHelper, getColorHexHelper, toggleWishlist, addToCart, getShopTypeProducts} from '@/composables/productsUtills.js'

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedQuantity = ref(1)
const selectedColor = ref('')
const viewMode = ref('2d')
const selectedImage = ref('')
const threejsContainer = ref(null)
const loading3D = ref(false)
const isAddingToCart = ref(false)
const isInWishlist = ref(false)
const showReviewsModal = ref(false)

// 3D Scene variables
let scene, camera, renderer, furniture, controls
let animationId = null

// Customer Reviews Data
const customerReviews = ref([
  {
    name: 'Sarah Mitchell',
    rating: 5,
    date: 'December 28, 2025',
    title: 'Absolutely stunning quality!',
    content: 'This piece exceeded all my expectations. The craftsmanship is impeccable, and it fits perfectly in my living room. The color is exactly as shown in the photos. Delivery was fast and the packaging was excellent. Highly recommend!',
    helpful: 24,
    purchaseVerified: true
  },
  {
    name: 'James Anderson',
    rating: 5,
    date: 'December 15, 2025',
    title: 'Worth every penny',
    content: 'I was hesitant about ordering furniture online, but Space Furnio made it so easy. The quality is outstanding and the design is modern yet timeless. Assembly was straightforward with clear instructions. Will definitely shop here again!',
    helpful: 18,
    purchaseVerified: true
  },
  {
    name: 'Emma Roberts',
    rating: 4,
    date: 'December 3, 2025',
    title: 'Great design, minor issue with delivery',
    content: 'The product itself is beautiful and well-made. The only reason I\'m giving 4 stars is because delivery took a bit longer than expected. But the quality makes up for it. Really happy with my purchase overall.',
    helpful: 12,
    purchaseVerified: true
  }
])

// Rating distribution (simulated for demo)
const ratingDistribution = {
  5: 65,
  4: 22,
  3: 8,
  2: 3,
  1: 2
}

const getRatingPercentage = (star) => {
  return ratingDistribution[star] || 0
}

// Extended reviews for the modal
const allReviews = computed(() => [
  ...customerReviews.value,
  {
    name: 'Michael Chen',
    rating: 5,
    date: 'November 28, 2025',
    title: 'Perfect addition to my home office',
    content: 'I spent weeks researching before making this purchase, and I\'m so glad I chose Space Furnio. The build quality is exceptional, and the modern design complements my home office perfectly. Customer service was also top-notch!',
    helpful: 15,
    purchaseVerified: true
  },
  {
    name: 'Lisa Thompson',
    rating: 4,
    date: 'November 15, 2025',
    title: 'Beautiful piece with minor color variance',
    content: 'The furniture is gorgeous and well-crafted. The only reason for 4 stars is that the color appeared slightly different from the website photos under my lighting. Still very happy with the purchase!',
    helpful: 9,
    purchaseVerified: true
  },
  {
    name: 'David Wilson',
    rating: 5,
    date: 'November 3, 2025',
    title: 'Exceeded expectations!',
    content: 'My wife and I were looking for something unique and this was exactly it. The attention to detail is remarkable. We\'ve received so many compliments from guests. Worth every cent!',
    helpful: 21,
    purchaseVerified: true
  },
  {
    name: 'Amanda Garcia',
    rating: 5,
    date: 'October 20, 2025',
    title: 'Fast shipping and amazing quality',
    content: 'I was worried about ordering furniture online but Space Furnio made it seamless. The product arrived well-packaged and was easy to set up. Quality is outstanding for the price. Highly recommend!',
    helpful: 17,
    purchaseVerified: true
  }
])

const markHelpful = (index) => {
  if (index < customerReviews.value.length) {
    customerReviews.value[index].helpful++
  }
}

const productImages = computed(() => {
  if (!product.value) return []
  // Generate multiple views of the same product for demo
  return [
    product.value.imageSrc,
    product.value.imageSrc,
    product.value.imageSrc,
    product.value.imageSrc
  ]
})

const specifications = computed(() => {
  if (!product.value) return []

  const rawStyle = product.value.style || ''
  const styleFormatted = rawStyle
    ? rawStyle.charAt(0).toUpperCase() + rawStyle.slice(1)
    : 'Standard'

  return [
    { name: 'Brand', description: product.value.brand || '—' },
    { name: 'Material', description: product.value.material || '—' },
    { name: 'Style', description: styleFormatted },
    { name: 'Room Type', description: product.value.room || '—' },
    {
      name: 'Color Options',
      description: Array.isArray(product.value.colors) && product.value.colors.length
        ? product.value.colors.join(', ')
        : 'Standard'
    },
    {
      name: 'Care Instructions',
      description: product.value.material
        ? `Clean with appropriate materials for ${product.value.material.toLowerCase()}`
        : '—'
    },
    { name: 'Warranty', description: '2-year manufacturer warranty included' },
    { name: 'Shipping', description: 'Free shipping on orders over $500' }
  ]
})

const shopType = computed(() => useCurrentShop(route))
const breadcrumbs = computed(() =>  [
    { name: 'Home', route: '/' },
    { name: 'Shop', route: '/shop' },
    { name: shopType.value.breadcrumbName, route: shopType.value.route },
    { name: formatNameHelper(route.params.category || ''), route: shopType.value.route + '/' + (route.params.category || '') },
    { name: product.value.name, route: null }
])



const init3DScene = () => {
  if (!threejsContainer.value) return

  loading3D.value = true

  // Scene setup
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc)

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    threejsContainer.value.clientWidth / threejsContainer.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 10)

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(threejsContainer.value.clientWidth, threejsContainer.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  threejsContainer.value.appendChild(renderer.domElement)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  // Create furniture (simple chair for demo)
  createFurniture()

  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -2
  ground.receiveShadow = true
  scene.add(ground)

  // Controls
  addMouseControls()

  animate()

  setTimeout(() => {
    loading3D.value = false
  }, 1500)
}

const createFurniture = () => {
  const group = new THREE.Group()

  // Chair seat
  const seatGeometry = new THREE.BoxGeometry(3, 0.2, 3)
  const seatMaterial = new THREE.MeshPhongMaterial({
    color: selectedColor.value ? getColorHexHelper(selectedColor.value) : 0xD2691E
  })
  const seat = new THREE.Mesh(seatGeometry, seatMaterial)
  seat.position.y = 1
  seat.castShadow = true
  group.add(seat)

  // Chair back
  const backGeometry = new THREE.BoxGeometry(3, 2, 0.2)
  const backMaterial = new THREE.MeshPhongMaterial({
    color: selectedColor.value ? getColorHexHelper(selectedColor.value) : 0xD2691E
  })
  const back = new THREE.Mesh(backGeometry, backMaterial)
  back.position.y = 2
  back.position.z = -1.4
  back.castShadow = true
  group.add(back)

  // Chair legs
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2)
  const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 })

  const legPositions = [
    [-1.2, 0, -1.2],
    [1.2, 0, -1.2],
    [-1.2, 0, 1.2],
    [1.2, 0, 1.2]
  ]

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial)
    leg.position.set(pos[0], pos[1], pos[2])
    leg.castShadow = true
    group.add(leg)
  })

  furniture = group
  scene.add(furniture)
}

const addMouseControls = () => {
  let isDragging = false
  let previousMousePosition = { x: 0, y: 0 }

  const onMouseDown = (event) => {
    isDragging = true
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    }
  }

  const onMouseMove = (event) => {
    if (isDragging && furniture) {
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      }

      const deltaRotationQuaternion = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
          deltaMove.y * 0.01,
          deltaMove.x * 0.01,
          0,
          'XYZ'
        ))

      furniture.quaternion.multiplyQuaternions(deltaRotationQuaternion, furniture.quaternion)

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      }
    }
  }

  const onMouseUp = () => {
    isDragging = false
  }

  const onWheel = (event) => {
    const zoomSpeed = 0.1
    const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
    camera.position.multiplyScalar(zoom)
    camera.position.clampLength(5, 50)
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('wheel', onWheel)

  controls = { onMouseDown, onMouseMove, onMouseUp, onWheel }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (furniture && !controls) {
    furniture.rotation.y += 0.005
  }

  renderer.render(scene, camera)
}

const reset3DView = () => {
  if (camera && furniture) {
    camera.position.set(0, 5, 10)
    furniture.rotation.set(0, 0, 0)
    furniture.quaternion.set(0, 0, 0, 1)
  }
}

const cleanup3D = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (renderer && threejsContainer.value) {
    threejsContainer.value.removeChild(renderer.domElement)
    renderer.dispose()
  }

  if (controls) {
    const canvas = renderer?.domElement
    if (canvas) {
      canvas.removeEventListener('mousedown', controls.onMouseDown)
      canvas.removeEventListener('mousemove', controls.onMouseMove)
      canvas.removeEventListener('mouseup', controls.onMouseUp)
      canvas.removeEventListener('wheel', controls.onWheel)
    }
  }

  scene = null
  camera = null
  renderer = null
  furniture = null
  controls = null
}

const handleResize = () => {
  if (camera && renderer && threejsContainer.value) {
    camera.aspect = threejsContainer.value.clientWidth / threejsContainer.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(threejsContainer.value.clientWidth, threejsContainer.value.clientHeight)
  }
}

async function fetchProductData() {
  loading.value = true
  error.value = null

  try {
    const allProducts = await getShopTypeProducts(route) // Ensure products are loaded

    const productId = parseInt(route.params.id, 10)
    const found = allProducts.find(p => p.id === productId)

    if (!found) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    product.value = found
    selectedImage.value = found.imageSrc
    selectedColor.value = found.colors?.[0] || ''
    document.title = `${found.name} – Space Furnio`
  }
  catch (err) {
    console.error(err)
    error.value = err.message
  }
  finally {
    loading.value = false
  }
}

// Watch for view mode changes to initialize/cleanup 3D
watch(viewMode, async (newMode) => {
  if (newMode === '3d') {
    await nextTick()
    init3DScene()
  } else if (newMode === '2d') {
    cleanup3D()
  }
})

// Watch for color changes to update 3D model
watch(selectedColor, (newColor) => {
  if (furniture && newColor) {
    const seatMesh = furniture.children.find(child => child.geometry?.type === 'BoxGeometry')
    const backMesh = furniture.children.find(child =>
      child.geometry?.type === 'BoxGeometry' && child.position.z < 0
    )

    if (seatMesh) seatMesh.material.color.setHex(parseInt(getColorHexHelper(newColor).replace('#', '0x')))
    if (backMesh) backMesh.material.color.setHex(parseInt(getColorHexHelper(newColor).replace('#', '0x')))
  }
})

onMounted(async () => {
  // Initialize AOS
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
  })

  await fetchProductData()

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanup3D()
  window.removeEventListener('resize', handleResize)
  AOS.refresh()
})
</script>

<style scoped>
/* @import 'aos/dist/aos.css'; */

.aspect-square {
  aspect-ratio: 1 / 1;
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #f97316;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #ea580c;
}

/* Smooth transitions for interactive elements */
button, .cursor-pointer {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced focus states */
button:focus-visible {
  outline: 2px solid #f97316;
  outline-offset: 2px;
}

/* Loading animation enhancement */
@keyframes pulse-orange {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse-orange {
  animation: pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: translateY(100%) scale(0.95);
}

@media (min-width: 640px) {
  .modal-enter-from > div:last-child,
  .modal-leave-to > div:last-child {
    transform: translateY(20px) scale(0.95);
  }
}
</style>
