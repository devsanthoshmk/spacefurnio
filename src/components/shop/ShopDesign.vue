<template>
  <div>
    <!-- Space-specific Section -->
    <div class="mb-16">
      <h2 class="text-3xl font-bold text-charcoal mb-8 text-center">
        Space-specific
      </h2>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div
          v-for="n in 4"
          :key="n"
          class="bg-gray-100 rounded-2xl aspect-square animate-pulse"
        ></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <div class="text-warm-orange text-6xl mb-4">⚠️</div>
        <h3 class="text-2xl font-bold text-charcoal mb-2">Oops! Something went wrong</h3>
        <p class="text-gray-600">{{ error }}</p>
      </div>

      <!-- Space-specific Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div
          v-for="(item, index) in spaceItems"
          :key="item.id"
          class="group cursor-pointer"
          :style="{ animationDelay: `${index * 100}ms` }"
          @click="navigateToDesign(item.slug, 'space')"
        >
          <div class="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
            <!-- Media Container -->
            <div class="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-warm-orange group-hover:to-orange-400 transition-all duration-300">
              <!-- Shop Now Overlay -->
              <div class="absolute inset-0 bg-warm-orange bg-opacity-0 group-hover:bg-opacity-95 transition-all duration-300 flex items-center justify-center z-20">
                <div class="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                  <span class="text-white font-bold text-lg px-6 py-3 border-2 border-white rounded-full">
                    Shop Now
                  </span>
                </div>
              </div>

              <!-- Icon/Image -->
              <img
                :src="item.icon"
                :alt="item.name"
                class="absolute inset-0 w-full h-full object-contain p-12 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-0 z-10"
                loading="lazy"
              />
            </div>

            <!-- Name + Badge -->
            <div class="p-6 text-center relative z-30">
              <h3 class="text-xl font-bold text-charcoal group-hover:text-warm-orange transition-colors duration-300">
                {{ item.name }}
              </h3>
              <slot name="badge" :item="item"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Style-specific Section -->
    <div>
      <h2 class="text-3xl font-bold text-charcoal mb-8 text-center">
        Style-specific
      </h2>

      <!-- Style-specific Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div
          v-for="(item, index) in styleItems"
          :key="item.id"
          class="group cursor-pointer"
          :style="{ animationDelay: `${index * 100}ms` }"
          @click="navigateToDesign(item.slug, 'style')"
        >
          <div class="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
            <!-- Media Container -->
            <div class="relative aspect-square">
              <!-- Shop Now Overlay -->
              <div class="absolute inset-0 bg-warm-orange bg-opacity-0 group-hover:bg-opacity-95 transition-all duration-300 flex items-center justify-center z-20">
                <div class="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                  <span class="text-white font-bold text-lg px-6 py-3 border-2 border-white rounded-full">
                    Shop Now
                  </span>
                </div>
              </div>

              <!-- Image -->
              <img
                :src="item.image"
                :alt="item.name"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:opacity-0 z-10"
                loading="lazy"
                width="300"
                height="300"
              />
            </div>

            <!-- Name + Label -->
            <div class="p-6 text-center relative z-30">
              <h3 class="text-xl font-bold text-charcoal group-hover:text-warm-orange transition-colors duration-300">
                {{ item.name }}
              </h3>
              <slot name="label" :item="item"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const router = useRouter()

const spaceItems = computed(() => props.items.spaceSpecific)
const styleItems = computed(() => props.items.styleSpecific)

const navigateToDesign = (slug, type) => {
  router.push(`/shop/design/${type}/${slug}`)
}
</script>

<style scoped>
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

.grid > div {
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
}

/* Stagger up to 8 items */
.grid > div:nth-child(1) { animation-delay:   0ms; }
.grid > div:nth-child(2) { animation-delay: 100ms; }
.grid > div:nth-child(3) { animation-delay: 200ms; }
.grid > div:nth-child(4) { animation-delay: 300ms; }
.grid > div:nth-child(5) { animation-delay: 400ms; }
.grid > div:nth-child(6) { animation-delay: 500ms; }
.grid > div:nth-child(7) { animation-delay: 600ms; }
.grid > div:nth-child(8) { animation-delay: 700ms; }
</style>
