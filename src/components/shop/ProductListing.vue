<template>
  <div class="bg-white">
    <!-- Filter Section -->
    <div class="bg-gray-50 border-b border-gray-200">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Main Category Filters -->
          <div class="flex flex-wrap gap-3">
            <select
              v-model="selectedBrand"
              class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Brands</option>
              <option v-for="brand in availableBrands" :key="brand" :value="brand">{{ brand }}</option>
            </select>

            <select
              v-model="selectedColor"
              class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Colors</option>
              <option v-for="color in availableColors" :key="color" :value="color">{{ color }}</option>
            </select>

            <select
              v-model="selectedPriceRange"
              class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Price Range</option>
              <option value="0-100">$0 - $100</option>
              <option value="100-500">$100 - $500</option>
              <option value="500-1000">$500 - $1000</option>
              <option value="1000+">$1000+</option>
            </select>

            <!-- Category specific filters -->
            <select
              v-if="currentShopType === 'category'"
              v-model="selectedMaterial"
              class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Material</option>
              <option v-for="material in availableMaterials" :key="material" :value="material">{{ material }}</option>
            </select>

            <!-- Design specific filters -->
            <select
              v-if="currentShopType === 'design'"
              v-model="selectedRoom"
              class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Room Type</option>
              <option v-for="room in availableRooms" :key="room" :value="room">{{ room }}</option>
            </select>
          </div>

          <!-- Sort By -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              v-model="sortBy"
              class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Best Rating</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap gap-2">
          <span class="text-sm font-medium text-gray-700">Active filters:</span>
          <button
            v-if="selectedBrand"
            @click="selectedBrand = ''"
            class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800 hover:bg-indigo-200"
          >
            {{ selectedBrand }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            v-if="selectedColor"
            @click="selectedColor = ''"
            class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800 hover:bg-indigo-200"
          >
            {{ selectedColor }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            v-if="selectedPriceRange"
            @click="selectedPriceRange = ''"
            class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800 hover:bg-indigo-200"
          >
            ${{ selectedPriceRange }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            @click="clearAllFilters"
            class="text-sm text-indigo-600 hover:text-indigo-800 underline"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div class="mb-8">
        <h1 v-if="currentShopType === 'category'" class="text-3xl font-bold tracking-tight text-gray-900">
          {{ getCurrentCategoryName() }}
        </h1>
        <h1 v-else-if="currentShopType === 'design'" class="text-3xl font-bold tracking-tight text-gray-900">
          {{ getCurrentDesignName() }}
        </h1>
        <p class="mt-2 text-lg text-gray-600">{{ filteredProducts.length }} products found</p>
      </div>

      <div v-if="filteredProducts.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg">No products found matching your filters.</p>
        <button
          @click="clearAllFilters"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Clear Filters
        </button>
      </div>

      <div v-else class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        <div v-for="product in filteredProducts" :key="product.id" class="group">
          <div class="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 group-hover:opacity-75">
            <img
              :src="product.imageSrc"
              :alt="product.imageAlt"
              class="h-full w-full object-cover object-center"
            />
          </div>
          <div class="mt-4 flex justify-between">
            <div>
              <h3 class="text-sm text-gray-700">
                <a :href="product.href" class="hover:text-gray-900">
                  {{ product.name }}
                </a>
              </h3>
              <p class="mt-1 text-sm text-gray-500">{{ product.brand }}</p>
              <div v-if="product.rating" class="mt-1 flex items-center">
                <div class="flex items-center">
                  <svg v-for="star in 5" :key="star"
                       :class="star <= product.rating ? 'text-yellow-400' : 'text-gray-300'"
                       class="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span class="ml-1 text-sm text-gray-500">({{ product.reviews }})</span>
              </div>
            </div>
            <p class="text-lg font-medium text-gray-900">${{ product.price }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Reactive data
const selectedBrand = ref('')
const selectedColor = ref('')
const selectedPriceRange = ref('')
const selectedMaterial = ref('')
const selectedRoom = ref('')
const sortBy = ref('popular')
const products = ref([])

// Computed properties
const currentShopType = computed(() => {
  return route.path.includes('/shop/design') ? 'design' : 'category'
})

const currentCategory = computed(() => {
  return route.params.category || route.query.category || 'all'
})

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

const hasActiveFilters = computed(() => {
  return selectedBrand.value || selectedColor.value || selectedPriceRange.value ||
         selectedMaterial.value || selectedRoom.value
})

const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // Apply filters
  if (selectedBrand.value) {
    filtered = filtered.filter(p => p.brand === selectedBrand.value)
  }

  if (selectedColor.value) {
    filtered = filtered.filter(p => p.colors && p.colors.includes(selectedColor.value))
  }

  if (selectedPriceRange.value) {
    const [min, max] = selectedPriceRange.value.split('-').map(v => v.replace('+', ''))
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price)
      if (max) {
        return price >= parseFloat(min) && price <= parseFloat(max)
      } else {
        return price >= parseFloat(min)
      }
    })
  }

  if (selectedMaterial.value) {
    filtered = filtered.filter(p => p.material === selectedMaterial.value)
  }

  if (selectedRoom.value) {
    filtered = filtered.filter(p => p.room === selectedRoom.value)
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'rating':
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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
      break
  }

  return filtered
})

// Methods
const clearAllFilters = () => {
  selectedBrand.value = ''
  selectedColor.value = ''
  selectedPriceRange.value = ''
  selectedMaterial.value = ''
  selectedRoom.value = ''
}

const getCurrentCategoryName = () => {
  const categoryMap = {
    'furniture': 'Furniture',
    'wall-art': 'Wall Art',
    'decor': 'Decor',
    'lights': 'Lights'
  }
  return categoryMap[currentCategory.value] || 'All Products'
}

const getCurrentDesignName = () => {
  const designMap = {
    'foyer': 'Foyer Design',
    'living': 'Living Room Design',
    'dining': 'Dining Room Design',
    'kitchen': 'Kitchen Design',
    'home-office': 'Home Office Design',
    'bedroom': 'Bedroom Design',
    'bathroom': 'Bathroom Design',
    'balcony': 'Balcony Design',
    'lounge': 'Lounge Design',
    'poolside': 'Poolside Design',
    'brutalist': 'Brutalist Style',
    'minimalist': 'Minimalist Style',
    'sustainable': 'Sustainable Style',
    'parametric': 'Parametric Style',
    'wabi-sabi': 'Wabi Sabi Style',
    'traditional': 'Traditional Style',
    'vintage-retro': 'Vintage/Retro Style',
    'victorian': 'Victorian Style',
    'japandi': 'Japandi Style',
    'moroccan': 'Moroccan Style'
  }
  return designMap[currentCategory.value] || 'Design Collection'
}

const loadProducts = async () => {
  try {
    let dataFile = ''

    if (currentShopType.value === 'category') {
      dataFile = '/data/category-products.json'
    } else if (currentShopType.value === 'design') {
      // Check if it's a space-specific or style-specific design
      const spaceSpecific = ['foyer', 'living', 'dining', 'kitchen', 'home-office', 'bedroom', 'bathroom', 'balcony', 'lounge', 'poolside']
      if (spaceSpecific.includes(currentCategory.value)) {
        dataFile = '/data/design-space-products.json'
      } else {
        dataFile = '/data/design-style-products.json'
      }
    }

    if (dataFile) {
      const response = await fetch(dataFile)
      const data = await response.json()

      // Filter products by current category if specified
      if (currentCategory.value && currentCategory.value !== 'all') {
        products.value = data.filter(p =>
          p.category === currentCategory.value ||
          p.space === currentCategory.value ||
          p.style === currentCategory.value
        )
      } else {
        products.value = data
      }
    }
  } catch (error) {
    console.error('Error loading products:', error)
    // Fallback to sample data
    products.value = [
      {
        id: 1,
        name: 'Modern Oak Dining Table',
        price: 899,
        brand: 'Nordic Home',
        category: 'furniture',
        material: 'Oak Wood',
        colors: ['Natural', 'Dark Brown'],
        rating: 4.5,
        reviews: 128,
        popularity: 95,
        createdAt: '2024-01-15',
        imageSrc: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        imageAlt: 'Modern oak dining table',
        href: '#'
      }
    ]
  }
}

onMounted(() => {
  loadProducts()
})
</script>
