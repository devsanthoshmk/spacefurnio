<template>
  <div class="filter-sidebar-content">
    <!-- Category Filter -->
    <div class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('category')"
        :aria-expanded="openSections.category"
      >
        <span class="filter-title">Category</span>
        <span v-if="localFilters.categories?.length > 0" class="filter-count">
          {{ localFilters.categories.length }}
        </span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.category }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.category" class="filter-content">
          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="cat in categories"
              :key="cat.id"
              class="checkbox-label group"
            >
              <input
                type="checkbox"
                name="category"
                :value="cat.slug"
                :checked="localFilters.categories.includes(cat.slug)"
                @change="toggleCategory(cat.slug)"
                class="shop-checkbox"
              />
              <span class="checkbox-text group-hover:text-stone-900">{{ cat.name }}</span>
              <span v-if="cat.count" class="checkbox-count">{{ cat.count }}</span>
            </label>
          </div>
          <button
            v-if="localFilters.categories?.length > 0"
            class="clear-filter-btn"
            @click="clearCategories"
          >
            Clear categories
          </button>
        </div>
      </Transition>
    </div>

    <!-- Design by Space Dropdown / Section -->
    <div class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('space')"
        :aria-expanded="openSections.space"
      >
        <span class="filter-title-with-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-stone-500">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          Space / Room
        </span>
        <span v-if="localFilters.spaces?.length > 0" class="filter-count">
          {{ localFilters.spaces.length }}
        </span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.space }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.space" class="filter-content">
          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="space in spaces"
              :key="space.id"
              class="checkbox-label group"
            >
              <input
                type="checkbox"
                name="design-space"
                :value="space.slug"
                :checked="localFilters.spaces.includes(space.slug)"
                @change="toggleSpace(space.slug)"
                class="shop-checkbox"
              />
              <span class="checkbox-text group-hover:text-stone-900">{{ space.name }}</span>
            </label>
          </div>
          <button
            v-if="localFilters.spaces?.length > 0"
            class="clear-filter-btn"
            @click="clearSpaces"
          >
            Clear spaces
          </button>
        </div>
      </Transition>
    </div>

    <!-- Design by Style Dropdown / Section -->
    <div class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('style')"
        :aria-expanded="openSections.style"
      >
        <span class="filter-title-with-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-stone-500">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            <path d="M2 12h20"/>
          </svg>
          Style Aesthetic
        </span>
        <span v-if="localFilters.styles?.length > 0" class="filter-count">
          {{ localFilters.styles.length }}
        </span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.style }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.style" class="filter-content">
          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="style in styles"
              :key="style.id"
              class="checkbox-label group"
            >
              <input
                type="checkbox"
                name="design-style"
                :value="style.slug"
                :checked="localFilters.styles.includes(style.slug)"
                @change="toggleStyle(style.slug)"
                class="shop-checkbox"
              />
              <span class="checkbox-text group-hover:text-stone-900">{{ style.name }}</span>
            </label>
          </div>
          <button
            v-if="localFilters.styles?.length > 0"
            class="clear-filter-btn"
            @click="clearStyles"
          >
            Clear styles
          </button>
        </div>
      </Transition>
    </div>

    <!-- Rooms / Room Types Filter (if available) -->
    <div v-if="availableRooms.length > 0" class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('room')"
        :aria-expanded="openSections.room"
      >
        <span class="filter-title">Rooms</span>
        <span v-if="localFilters.room" class="filter-count">1</span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.room }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.room" class="filter-content">
          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="room in availableRooms"
              :key="room"
              class="checkbox-label group"
            >
              <input
                type="radio"
                name="room"
                :value="room"
                :checked="localFilters.room === room"
                @change="updateFilter('room', room)"
                class="shop-checkbox"
              />
              <span class="checkbox-text group-hover:text-stone-900">{{ room }}</span>
            </label>
          </div>
          <button
            v-if="localFilters.room"
            class="clear-filter-btn"
            @click="updateFilter('room', '')"
          >
            Clear room
          </button>
        </div>
      </Transition>
    </div>

    <!-- Price Range Filter -->
    <div class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('price')"
        :aria-expanded="openSections.price"
      >
        <span class="filter-title">Price Range</span>
        <span v-if="isPriceActive" class="filter-count">1</span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.price }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.price" class="filter-content">
          <!-- Price Inputs -->
          <div class="price-inputs">
            <div class="price-input-group">
              <span class="currency-symbol">$</span>
              <input
                type="number"
                v-model.number="localFilters.minPrice"
                :placeholder="priceRangeMin.toString()"
                min="0"
                class="price-input"
                @change="applyPriceFilter"
              />
            </div>
            <span class="price-separator">—</span>
            <div class="price-input-group">
              <span class="currency-symbol">$</span>
              <input
                type="number"
                v-model.number="localFilters.maxPrice"
                :placeholder="priceRangeMax.toString()"
                min="0"
                class="price-input"
                @change="applyPriceFilter"
              />
            </div>
          </div>

          <!-- Price Slider -->
          <div class="price-slider">
            <div class="flex justify-between text-[11px] text-stone-400 font-medium mb-1.5">
              <span>${{ priceRangeMin }}</span>
              <span class="font-semibold text-stone-700">${{ localFilters.maxPrice || priceRangeMax }}</span>
              <span>${{ priceRangeMax }}</span>
            </div>
            <input
              type="range"
              :min="priceRangeMin"
              :max="priceRangeMax"
              :value="localFilters.maxPrice || priceRangeMax"
              @input="handleSliderChange"
              class="shop-range-slider w-full cursor-pointer accent-stone-800"
            />
          </div>

          <!-- Quick Price Option Pills -->
          <div class="price-quick-options">
            <button
              v-for="option in priceOptions"
              :key="option.label"
              type="button"
              :class="['price-option', { active: isPriceOptionActive(option) }]"
              @click="selectPriceOption(option)"
            >
              {{ option.label }}
            </button>
          </div>

          <button
            v-if="isPriceActive"
            class="clear-filter-btn"
            @click="clearPrice"
          >
            Reset price
          </button>
        </div>
      </Transition>
    </div>

    <!-- Brands Filter -->
    <div v-if="availableBrands.length > 0" class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('brand')"
        :aria-expanded="openSections.brand"
      >
        <span class="filter-title">Brand</span>
        <span v-if="localFilters.brand" class="filter-count">1</span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.brand }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.brand" class="filter-content">
          <!-- Search Brands -->
          <div class="filter-search" v-if="availableBrands.length > 5">
            <svg
              class="search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              v-model="brandSearch"
              placeholder="Filter brands..."
              class="search-input"
            />
          </div>

          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="brand in filteredBrands"
              :key="brand"
              class="checkbox-label group"
            >
              <input
                type="radio"
                name="brand"
                :value="brand"
                :checked="localFilters.brand === brand"
                @change="updateFilter('brand', brand)"
                class="shop-checkbox"
              />
              <span class="checkbox-text group-hover:text-stone-900">{{ brand }}</span>
            </label>
          </div>

          <button
            v-if="localFilters.brand"
            class="clear-filter-btn"
            @click="updateFilter('brand', '')"
          >
            Clear brand
          </button>
        </div>
      </Transition>
    </div>

    <!-- Materials Filter -->
    <div v-if="availableMaterials.length > 0" class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('material')"
        :aria-expanded="openSections.material"
      >
        <span class="filter-title">Material</span>
        <span v-if="localFilters.material" class="filter-count">1</span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.material }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.material" class="filter-content">
          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="material in availableMaterials"
              :key="material"
              class="checkbox-label group"
            >
              <input
                type="radio"
                name="material"
                :value="material"
                :checked="localFilters.material === material"
                @change="updateFilter('material', material)"
                class="shop-checkbox"
              />
              <span class="checkbox-text group-hover:text-stone-900">{{ material }}</span>
            </label>
          </div>

          <button
            v-if="localFilters.material"
            class="clear-filter-btn"
            @click="updateFilter('material', '')"
          >
            Clear material
          </button>
        </div>
      </Transition>
    </div>

    <!-- Color Filter -->
    <div v-if="availableColors.length > 0" class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('color')"
        :aria-expanded="openSections.color"
      >
        <span class="filter-title">Color</span>
        <span v-if="localFilters.colors?.length > 0" class="filter-count">
          {{ localFilters.colors.length }}
        </span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.color }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.color" class="filter-content">
          <!-- Search Colors -->
          <div class="filter-search" v-if="availableColors.length > 5">
            <svg
              class="search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              v-model="colorSearch"
              placeholder="Filter colors..."
              class="search-input"
            />
          </div>

          <div class="checkbox-list shop-scrollbar">
            <label
              v-for="color in filteredColors"
              :key="color.name"
              class="checkbox-label group"
            >
              <input
                type="checkbox"
                name="color"
                :value="color.name"
                :checked="localFilters.colors?.includes(color.name)"
                @change="toggleColor(color.name)"
                class="shop-checkbox"
              />
              <span
                class="color-indicator-swatch"
                :style="{ backgroundColor: color.hex }"
                :title="color.name"
              ></span>
              <span class="checkbox-text group-hover:text-stone-900">{{ color.name }}</span>
              <span v-if="color.count" class="checkbox-count">{{ color.count }}</span>
            </label>
            <p v-if="filteredColors.length === 0" class="no-results-text">
              No matching colors found
            </p>
          </div>

          <button
            v-if="localFilters.colors?.length > 0"
            class="clear-filter-btn"
            @click="clearColors"
          >
            Clear colors
          </button>
        </div>
      </Transition>
    </div>

    <!-- Availability / Quick Flags Filter -->
    <div class="filter-group">
      <button
        class="filter-header"
        @click="toggleSection('availability')"
        :aria-expanded="openSections.availability"
      >
        <span class="filter-title">Availability & Flags</span>
        <svg
          class="chevron"
          :class="{ rotated: openSections.availability }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Transition name="accordion">
        <div v-if="openSections.availability" class="filter-content">
          <label class="toggle-label">
            <span class="toggle-text">In Stock Only</span>
            <button
              type="button"
              :class="['toggle-switch', { active: localFilters.inStock }]"
              @click="updateFilter('inStock', !localFilters.inStock)"
              role="switch"
              :aria-checked="localFilters.inStock"
            >
              <span class="toggle-thumb"></span>
            </button>
          </label>

          <label class="toggle-label">
            <span class="toggle-text">On Sale</span>
            <button
              type="button"
              :class="['toggle-switch', { active: localFilters.onSale }]"
              @click="updateFilter('onSale', !localFilters.onSale)"
              role="switch"
              :aria-checked="localFilters.onSale"
            >
              <span class="toggle-thumb"></span>
            </button>
          </label>

          <label class="toggle-label">
            <span class="toggle-text">New Arrivals</span>
            <button
              type="button"
              :class="['toggle-switch', { active: localFilters.isNew }]"
              @click="updateFilter('isNew', !localFilters.isNew)"
              role="switch"
              :aria-checked="localFilters.isNew"
            >
              <span class="toggle-thumb"></span>
            </button>
          </label>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import shopApi from '@/api/shopApi.js'
import { getColorHexHelper } from '@/composables/productsUtills.js'

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  aggregations: {
    type: Object,
    default: () => ({
      brands: [],
      materials: [],
      rooms: [],
      colors: [],
      priceRange: { min: 0, max: 5000 },
    }),
  },
  activeFilterCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:filters', 'clear-all'])

// Local copy of filters
const localFilters = ref({
  categories: [],
  spaces: [],
  styles: [],
  room: '',
  brand: '',
  material: '',
  colors: [],
  minPrice: null,
  maxPrice: null,
  inStock: false,
  onSale: false,
  isNew: false,
  ...props.filters,
})

const brandSearch = ref('')
const colorSearch = ref('')

const openSections = ref({
  category: true,
  space: true,
  style: true,
  room: false,
  price: true,
  brand: true,
  material: false,
  color: true,
  availability: true,
})

const spaces = ref([])
const styles = ref([])
const categories = ref([])

// Dynamic price options
const priceOptions = [
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 - $500', min: 100, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: 'Over $1,000', min: 1000, max: null },
]

// Computed aggregations
const priceRangeMin = computed(() => props.aggregations.priceRange?.min ?? 0)
const priceRangeMax = computed(() => props.aggregations.priceRange?.max ?? 5000)

const availableBrands = computed(() => props.aggregations.brands || [])
const availableMaterials = computed(() => props.aggregations.materials || [])
const availableRooms = computed(() => props.aggregations.rooms || [])
const availableColors = computed(() => {
  const raw = props.aggregations.colors || []
  return raw.map((c) => {
    if (typeof c === 'string') {
      return { name: c, hex: getColorHexHelper(c) }
    }
    return {
      name: c.name,
      hex: c.hex || getColorHexHelper(c.name),
      count: c.count,
    }
  })
})

const filteredBrands = computed(() => {
  if (!availableBrands.value.length) return []
  const search = brandSearch.value.trim().toLowerCase()
  if (!search) return availableBrands.value
  return availableBrands.value.filter((b) => b.toLowerCase().includes(search))
})

const filteredColors = computed(() => {
  if (!availableColors.value.length) return []
  const search = colorSearch.value.trim().toLowerCase()
  if (!search) return availableColors.value
  return availableColors.value.filter((c) => c.name.toLowerCase().includes(search))
})

const isPriceActive = computed(() => {
  return localFilters.value.minPrice !== null || localFilters.value.maxPrice !== null
})

// Load Taxonomy lists
const loadData = async () => {
  try {
    const [catRes, spaceRes, styleRes] = await Promise.all([
      shopApi.getCategories(),
      shopApi.getSpaces(),
      shopApi.getStyles(),
    ])

    if (catRes.success && catRes.data) {
      categories.value = catRes.data.map((c) => ({
        id: c.slug || c.id,
        name: c.name,
        slug: c.slug,
        count: c.productCount || 0,
      }))
    }
    if (spaceRes.success && spaceRes.data) {
      spaces.value = spaceRes.data
    }
    if (styleRes.success && styleRes.data) {
      styles.value = styleRes.data
    }
  } catch (err) {
    console.error('FilterSidebar loadData error:', err)
  }
}

onMounted(() => {
  loadData()
})

// Accordion
const toggleSection = (section) => {
  openSections.value[section] = !openSections.value[section]
}

// Filter updater
const updateFilter = (key, value) => {
  localFilters.value[key] = value
  emit('update:filters', { [key]: value })
}

// Category toggles
const toggleCategory = (slug) => {
  const cats = [...(localFilters.value.categories || [])]
  const idx = cats.indexOf(slug)
  if (idx > -1) {
    cats.splice(idx, 1)
  } else {
    cats.push(slug)
  }
  localFilters.value.categories = cats
  emit('update:filters', { categories: cats })
}

const clearCategories = () => {
  localFilters.value.categories = []
  emit('update:filters', { categories: [] })
}

// Space toggles
const toggleSpace = (slug) => {
  const sps = [...(localFilters.value.spaces || [])]
  const idx = sps.indexOf(slug)
  if (idx > -1) {
    sps.splice(idx, 1)
  } else {
    sps.push(slug)
  }
  localFilters.value.spaces = sps
  emit('update:filters', { spaces: sps })
}

const clearSpaces = () => {
  localFilters.value.spaces = []
  emit('update:filters', { spaces: [] })
}

// Style toggles
const toggleStyle = (slug) => {
  const stys = [...(localFilters.value.styles || [])]
  const idx = stys.indexOf(slug)
  if (idx > -1) {
    stys.splice(idx, 1)
  } else {
    stys.push(slug)
  }
  localFilters.value.styles = stys
  emit('update:filters', { styles: stys })
}

const clearStyles = () => {
  localFilters.value.styles = []
  emit('update:filters', { styles: [] })
}

// Color toggles
const toggleColor = (colorName) => {
  const cols = [...(localFilters.value.colors || [])]
  const idx = cols.indexOf(colorName)
  if (idx > -1) {
    cols.splice(idx, 1)
  } else {
    cols.push(colorName)
  }
  localFilters.value.colors = cols
  emit('update:filters', { colors: cols })
}

const clearColors = () => {
  localFilters.value.colors = []
  emit('update:filters', { colors: [] })
}

// Price filters
const applyPriceFilter = () => {
  emit('update:filters', {
    minPrice: localFilters.value.minPrice !== null && localFilters.value.minPrice !== '' ? Number(localFilters.value.minPrice) : null,
    maxPrice: localFilters.value.maxPrice !== null && localFilters.value.maxPrice !== '' ? Number(localFilters.value.maxPrice) : null,
  })
}

const handleSliderChange = (event) => {
  localFilters.value.maxPrice = parseInt(event.target.value, 10)
  applyPriceFilter()
}

const isPriceOptionActive = (option) => {
  return localFilters.value.minPrice === option.min && localFilters.value.maxPrice === option.max
}

const selectPriceOption = (option) => {
  if (isPriceOptionActive(option)) {
    clearPrice()
    return
  }
  localFilters.value.minPrice = option.min
  localFilters.value.maxPrice = option.max
  applyPriceFilter()
}

const clearPrice = () => {
  localFilters.value.minPrice = null
  localFilters.value.maxPrice = null
  emit('update:filters', { minPrice: null, maxPrice: null })
}

// Sync external prop changes into local state
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = {
      categories: [],
      spaces: [],
      styles: [],
      room: '',
      brand: '',
      material: '',
      colors: [],
      minPrice: null,
      maxPrice: null,
      inStock: false,
      onSale: false,
      isNew: false,
      ...newFilters,
    }
  },
  { deep: true },
)
</script>

<style scoped>
/* Filter Sidebar */
.filter-sidebar-content {
  display: flex;
  flex-direction: column;
}

/* Filter Group */
.filter-group {
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.filter-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.filter-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
}

.filter-title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--shop-charcoal, #3d3a36);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 9999px;
  margin-left: auto;
  margin-right: 0.5rem;
}

.chevron {
  color: var(--shop-tan, #c4b8a9);
  transition: transform 0.3s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* Filter Content */
.filter-content {
  padding-top: 0.75rem;
}

/* Checkbox Styles */
.checkbox-list {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  cursor: pointer;
}

.checkbox-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8b7d6d);
  transition: color 0.2s ease;
}

.checkbox-count {
  font-size: 0.75rem;
  color: var(--shop-tan, #c4b8a9);
  font-weight: 500;
}

/* Search Input */
.filter-search {
  position: relative;
  margin-bottom: 0.75rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--shop-tan, #c4b8a9);
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  font-size: 0.8125rem;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 0.5rem;
  background: white;
  color: var(--shop-charcoal, #3d3a36);
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--shop-accent, #b8956c);
}

.search-input::placeholder {
  color: var(--shop-tan, #c4b8a9);
}

/* Price Inputs */
.price-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.price-input-group {
  position: relative;
  flex: 1;
}

.currency-symbol {
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8125rem;
  color: var(--shop-tan, #c4b8a9);
}

.price-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 1.35rem;
  font-size: 0.8125rem;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 0.5rem;
  background: white;
  color: var(--shop-charcoal, #3d3a36);
}

.price-input:focus {
  outline: none;
  border-color: var(--shop-accent, #b8956c);
}

.price-separator {
  color: var(--shop-tan, #c4b8a9);
  font-size: 0.875rem;
}

.price-slider {
  margin-bottom: 1rem;
}

.price-quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.price-option {
  padding: 0.3125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--shop-brown-dark, #8b7d6d);
  background: var(--shop-cream-dark, #f5f2ed);
  border: 1px solid var(--shop-beige, #e8e3dc);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.price-option:hover {
  border-color: var(--shop-tan, #c4b8a9);
}

.price-option.active {
  background: var(--shop-charcoal, #3d3a36);
  color: white;
  border-color: var(--shop-charcoal, #3d3a36);
}

/* Color Indicator Swatch */
.color-indicator-swatch {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  display: inline-block;
  transition: transform 0.15s ease;
}

.checkbox-label:hover .color-indicator-swatch {
  transform: scale(1.1);
}

.no-results-text {
  font-size: 0.75rem;
  color: var(--shop-tan, #c4b8a9);
  padding: 0.5rem 0;
  font-style: italic;
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.toggle-text {
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8b7d6d);
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  width: 2.25rem;
  height: 1.35rem;
  background: var(--shop-beige-dark, #d4cfc6);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-switch.active {
  background: var(--shop-charcoal, #3d3a36);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(1.35rem - 4px);
  height: calc(1.35rem - 4px);
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(0.9rem);
}

/* Clear Filter Button */
.clear-filter-btn {
  margin-top: 0.5rem;
  padding: 0;
  font-size: 0.75rem;
  color: var(--shop-accent, #b8956c);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s ease;
}

.clear-filter-btn:hover {
  color: var(--shop-accent-dark, #8c6d4d);
  text-decoration: underline;
}

/* Accordion Transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease-out;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
