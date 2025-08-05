<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <div class="text-center py-12">
      <h1 class="text-5xl font-bold text-charcoal mb-8" style="font-family: 'Phitagate', sans-serif;">
        Shop All Products
      </h1>

      <!-- Toggle Pills -->
      <div class="relative inline-flex bg-gray-100 rounded-full p-1 mb-12">
        <div
          class="absolute top-1 bottom-1 bg-warm-orange rounded-full transition-all duration-300 ease-in-out"
          :style="{
            left: activeTab === 'category' ? '4px' : '50%',
            width: 'calc(50% - 4px)',
            transform: activeTab === 'design' ? 'translateX(4px)' : 'translateX(0)'
          }"
        ></div>

        <button
          @click="switchTab('category')"
          :class="[
            'relative z-10 px-8 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out transform',
            activeTab === 'category'
              ? 'text-[#e67e22] shadow-sm scale-105'
              : 'text-charcoal hover:scale-102'
          ]"

        >
          Shop by Category
        </button>

        <button
          @click="switchTab('design')"
          :class="[
            'relative z-10 px-8 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out transform',
            activeTab === 'design'
              ? 'text-[#e67e22] shadow-sm scale-105'
              : 'text-charcoal hover:scale-102'
          ]"

        >
          Shop by Design
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <Transition
        name="fade"
        mode="out-in"
        @enter="onEnter"
        @leave="onLeave"
      >
        <ShopCategory
          v-if="activeTab === 'category'"
          key="category"
          :items="categoryItems"
          :loading="loading"
          :error="error"
        />
        <ShopDesign
          v-else
          key="design"
          :items="designItems"
          :loading="loading"
          :error="error"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ShopCategory from '@/components/shop/ShopCategory.vue'
import ShopDesign from '@/components/shop/ShopDesign.vue'

const router = useRouter()
const route = useRoute()

// Reactive state
const activeTab = ref('category')
const categoryItems = ref([])
const designItems = ref([])
const loading = ref(false)
const error = ref('')

// Initialize active tab from route
const initializeTab = () => {
  if (route.path.includes('/design')) {
    activeTab.value = 'design'
  } else {
    activeTab.value = 'category'
  }
}

// Switch between tabs
const switchTab = (tab) => {
  if (activeTab.value === tab) return

  activeTab.value = tab
  const newPath = `/shop/${tab}`
  router.push(newPath)
}

// Load data
const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
       // Dynamically import JSON files at runtime
    const [categoryModule, designModule] = await Promise.all([
      import('@/data/shop-categories.json'),
      import('@/data/shop-designs.json')
    ])

    // Access the default export from modules
    categoryItems.value = categoryModule.default
    designItems.value = designModule.default

  } catch (err) {
    error.value = err.message
    console.error('Error loading shop data:', err, categoryItems.value, designItems.value)
  } finally {
    loading.value = false
  }
}

// Animation handlers
const onEnter = (el) => {
  el.style.opacity = '0'
  el.style.transform = 'translateY(20px)'

  requestAnimationFrame(() => {
    el.style.transition = 'all 0.4s ease-out'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })
}

const onLeave = (el) => {
  el.style.transition = 'all 0.3s ease-in'
  el.style.opacity = '0'
  el.style.transform = 'translateY(-10px)'
}

// Watch route changes
watch(() => route.path, () => {
  initializeTab()
})

// Initialize on mount
onMounted(() => {
  initializeTab()
  loadData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');

/* Custom colors */
:root {
  --color-charcoal: #393853;
  --color-warm-orange: #FF6025;
}

.text-charcoal {
  color: var(--color-charcoal);
}

.bg-warm-orange {
  background-color: var(--color-warm-orange);
}

.border-charcoal {
  border-color: var(--color-charcoal);
}

/* Animation classes */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Hover effects */
.hover\:scale-102:hover {
  transform: scale(1.02);
}

/* Typography */
body {
  font-family: 'Open Sans', sans-serif;
}


</style>
