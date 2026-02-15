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
        <svg 
          class="chevron" 
          :class="{ rotated: openSections.category }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <Transition name="accordion">
        <div v-if="openSections.category" class="filter-content">
          <label 
            v-for="cat in categories" 
            :key="cat.id" 
            class="checkbox-label"
          >
            <input 
              type="radio" 
              name="category"
              :value="cat.slug"
              :checked="localFilters.category === cat.slug"
              @change="updateFilter('category', cat.slug)"
              class="shop-checkbox"
            />
            <span class="checkbox-text">{{ cat.name }}</span>
            <span v-if="cat.count" class="checkbox-count">{{ cat.count }}</span>
          </label>
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
        <span class="filter-title">Price</span>
        <svg 
          class="chevron" 
          :class="{ rotated: openSections.price }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <Transition name="accordion">
        <div v-if="openSections.price" class="filter-content">
          <div class="price-inputs">
            <div class="price-input-group">
              <span class="currency-symbol">$</span>
              <input 
                type="number" 
                v-model.number="localFilters.minPrice"
                :placeholder="aggregations.priceRange?.min || 0"
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
                :placeholder="aggregations.priceRange?.max || 5000"
                min="0"
                class="price-input"
                @change="applyPriceFilter"
              />
            </div>
          </div>
          
          <!-- Price Range Slider -->
          <div class="price-slider">
            <input 
              type="range" 
              :min="aggregations.priceRange?.min || 0"
              :max="aggregations.priceRange?.max || 5000"
              :value="localFilters.maxPrice || aggregations.priceRange?.max || 5000"
              @input="handleSliderChange"
              class="shop-range-slider"
            />
          </div>
          
          <!-- Quick Price Options -->
          <div class="price-quick-options">
            <button 
              v-for="option in priceOptions" 
              :key="option.label"
              :class="['price-option', { active: isPriceOptionActive(option) }]"
              @click="selectPriceOption(option)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Brand Filter -->
    <div v-if="aggregations.brands?.length > 0" class="filter-group">
      <button 
        class="filter-header"
        @click="toggleSection('brand')"
        :aria-expanded="openSections.brand"
      >
        <span class="filter-title">Brand</span>
        <svg 
          class="chevron" 
          :class="{ rotated: openSections.brand }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <Transition name="accordion">
        <div v-if="openSections.brand" class="filter-content">
          <!-- Search Brands -->
          <div class="filter-search">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              v-model="brandSearch"
              placeholder="Search brands..."
              class="search-input"
            />
          </div>
          
          <div class="checkbox-list shop-scrollbar">
            <label 
              v-for="brand in filteredBrands" 
              :key="brand" 
              class="checkbox-label"
            >
              <input 
                type="radio" 
                name="brand"
                :value="brand"
                :checked="localFilters.brand === brand"
                @change="updateFilter('brand', brand)"
                class="shop-checkbox"
              />
              <span class="checkbox-text">{{ brand }}</span>
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

    <!-- Material Filter -->
    <div v-if="aggregations.materials?.length > 0" class="filter-group">
      <button 
        class="filter-header"
        @click="toggleSection('material')"
        :aria-expanded="openSections.material"
      >
        <span class="filter-title">Material</span>
        <svg 
          class="chevron" 
          :class="{ rotated: openSections.material }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <Transition name="accordion">
        <div v-if="openSections.material" class="filter-content">
          <div class="checkbox-list">
            <label 
              v-for="material in aggregations.materials" 
              :key="material" 
              class="checkbox-label"
            >
              <input 
                type="radio" 
                name="material"
                :value="material"
                :checked="localFilters.material === material"
                @change="updateFilter('material', material)"
                class="shop-checkbox"
              />
              <span class="checkbox-text">{{ material }}</span>
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
    <div v-if="aggregations.colors?.length > 0" class="filter-group">
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
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <Transition name="accordion">
        <div v-if="openSections.color" class="filter-content">
          <div class="color-grid">
            <button 
              v-for="color in aggregations.colors" 
              :key="color.name"
              :class="['color-swatch', { selected: localFilters.colors?.includes(color.name) }]"
              :style="{ '--swatch-color': color.hex }"
              :title="color.name"
              @click="toggleColor(color.name)"
            >
              <svg v-if="localFilters.colors?.includes(color.name)" class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
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

    <!-- Availability Filter -->
    <div class="filter-group">
      <button 
        class="filter-header"
        @click="toggleSection('availability')"
        :aria-expanded="openSections.availability"
      >
        <span class="filter-title">Availability</span>
        <svg 
          class="chevron" 
          :class="{ rotated: openSections.availability }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <Transition name="accordion">
        <div v-if="openSections.availability" class="filter-content">
          <label class="toggle-label">
            <span class="toggle-text">In Stock Only</span>
            <button 
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

// Local state
const localFilters = ref({ ...props.filters })
const brandSearch = ref('')

const openSections = ref({
  category: true,
  price: true,
  brand: true,
  material: false,
  color: true,
  availability: true,
})

// Categories (loaded from API)
const categories = ref([
  { id: 'all', name: 'All Products', slug: '', count: 0 },
])

const loadCategories = async () => {
  try {
    const response = await shopApi.getCategories()
    if (response.success && response.data) {
      categories.value = [
        { id: 'all', name: 'All Products', slug: '', count: response.data.reduce((sum, c) => sum + (c.productCount || 0), 0) },
        ...response.data.map(c => ({
          id: c.slug,
          name: c.name,
          slug: c.slug,
          count: c.productCount || 0,
        })),
      ]
    }
  } catch (err) {
    console.error('Error loading categories for filter sidebar:', err)
  }
}

onMounted(loadCategories)

// Price options
const priceOptions = [
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 - $500', min: 100, max: 500 },
  { label: '$500 - $1000', min: 500, max: 1000 },
  { label: 'Over $1000', min: 1000, max: null },
]

// Computed
const filteredBrands = computed(() => {
  if (!props.aggregations.brands) return []
  
  const search = brandSearch.value.toLowerCase()
  if (!search) return props.aggregations.brands
  
  return props.aggregations.brands.filter(brand => 
    brand.toLowerCase().includes(search)
  )
})

// Methods
const toggleSection = (section) => {
  openSections.value[section] = !openSections.value[section]
}

const updateFilter = (key, value) => {
  localFilters.value[key] = value
  emit('update:filters', { [key]: value })
}

const applyPriceFilter = () => {
  emit('update:filters', { 
    minPrice: localFilters.value.minPrice || null,
    maxPrice: localFilters.value.maxPrice || null,
  })
}

const handleSliderChange = (event) => {
  localFilters.value.maxPrice = parseInt(event.target.value)
  applyPriceFilter()
}

const isPriceOptionActive = (option) => {
  return localFilters.value.minPrice === option.min && 
         localFilters.value.maxPrice === option.max
}

const selectPriceOption = (option) => {
  localFilters.value.minPrice = option.min
  localFilters.value.maxPrice = option.max
  applyPriceFilter()
}

const toggleColor = (colorName) => {
  const colors = localFilters.value.colors || []
  const index = colors.indexOf(colorName)
  
  if (index > -1) {
    colors.splice(index, 1)
  } else {
    colors.push(colorName)
  }
  
  localFilters.value.colors = [...colors]
  emit('update:filters', { colors: localFilters.value.colors })
}

const clearColors = () => {
  localFilters.value.colors = []
  emit('update:filters', { colors: [] })
}

// Watchers
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>

<style scoped>
/* Filter Sidebar */
.filter-sidebar-content {
  display: flex;
  flex-direction: column;
}

/* Filter Group */
.filter-group {
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
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
  color: var(--shop-charcoal, #3D3A36);
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: var(--shop-charcoal, #3D3A36);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 9999px;
  margin-left: auto;
  margin-right: 0.5rem;
}

.chevron {
  color: var(--shop-tan, #C4B8A9);
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
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  cursor: pointer;
}

.checkbox-label:hover .checkbox-text {
  color: var(--shop-charcoal, #3D3A36);
}

.checkbox-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8B7D6D);
  transition: color 0.2s ease;
}

.checkbox-count {
  font-size: 0.75rem;
  color: var(--shop-tan, #C4B8A9);
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
  color: var(--shop-tan, #C4B8A9);
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.25rem;
  font-size: 0.8125rem;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 0.5rem;
  background: white;
  color: var(--shop-charcoal, #3D3A36);
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--shop-accent, #B8956C);
}

.search-input::placeholder {
  color: var(--shop-tan, #C4B8A9);
}

/* Price Inputs */
.price-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.price-input-group {
  position: relative;
  flex: 1;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8125rem;
  color: var(--shop-tan, #C4B8A9);
}

.price-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 1.5rem;
  font-size: 0.8125rem;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 0.5rem;
  background: white;
  color: var(--shop-charcoal, #3D3A36);
}

.price-input:focus {
  outline: none;
  border-color: var(--shop-accent, #B8956C);
}

.price-separator {
  color: var(--shop-tan, #C4B8A9);
  font-size: 0.875rem;
}

/* Price Slider */
.price-slider {
  margin-bottom: 1rem;
}

/* Price Quick Options */
.price-quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.price-option {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--shop-brown-dark, #8B7D6D);
  background: var(--shop-cream-dark, #F5F2ED);
  border: 1px solid var(--shop-beige, #E8E3DC);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.price-option:hover {
  border-color: var(--shop-tan, #C4B8A9);
}

.price-option.active {
  background: var(--shop-charcoal, #3D3A36);
  color: white;
  border-color: var(--shop-charcoal, #3D3A36);
}

/* Color Grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.color-swatch {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: var(--swatch-color);
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: var(--shop-charcoal, #3D3A36);
  box-shadow: 0 0 0 2px var(--shop-cream, #FAF8F5);
}

.check-icon {
  color: var(--shop-charcoal, #3D3A36);
}

/* Light colors need dark check icon */
.color-swatch:has(.check-icon) {
  filter: contrast(0.9);
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0;
}

.toggle-text {
  font-size: 0.875rem;
  color: var(--shop-brown-dark, #8B7D6D);
}

.toggle-switch {
  position: relative;
  width: 2.5rem;
  height: 1.5rem;
  background: var(--shop-beige-dark, #D4CFC6);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-switch.active {
  background: var(--shop-charcoal, #3D3A36);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(1.5rem - 4px);
  height: calc(1.5rem - 4px);
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(1rem);
}

/* Clear Filter Button */
.clear-filter-btn {
  margin-top: 0.5rem;
  padding: 0;
  font-size: 0.75rem;
  color: var(--shop-accent, #B8956C);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;
}

.clear-filter-btn:hover {
  color: var(--shop-accent-dark, #8C6D4D);
}

/* Accordion Transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
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
  max-height: 500px;
}
</style>
