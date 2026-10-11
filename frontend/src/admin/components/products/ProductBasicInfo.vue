<template>
  <section class="rounded-xl border border-admin-border bg-white p-5">
    <h2 class="text-base font-semibold text-admin-text">Basic Information</h2>
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="md:col-span-1">
        <label for="product-name" class="mb-1.5 block text-sm font-medium text-slate-700">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          id="product-name"
          :value="modelValue.name"
          type="text"
          placeholder="Product name"
          :class="inputClass"
          @input="onNameInput(($event.target as HTMLInputElement).value)"
        />
        <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
      </div>

      <div class="md:col-span-1">
        <label for="product-slug" class="mb-1.5 block text-sm font-medium text-slate-700">
          Slug
        </label>
        <input
          id="product-slug"
          :value="modelValue.slug"
          type="text"
          placeholder="product-slug"
          :class="[inputClass, 'font-mono']"
          @input="patch({ slug: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="md:col-span-2">
        <label for="product-description" class="mb-1.5 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="product-description"
          :value="modelValue.description"
          rows="4"
          placeholder="Product description"
          :class="inputClass"
          @input="patch({ description: ($event.target as HTMLTextAreaElement).value })"
        />
      </div>

      <div>
        <label for="product-price" class="mb-1.5 block text-sm font-medium text-slate-700">
          Price (₹) <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">₹</span>
          <input
            id="product-price"
            v-model.number="priceRupees"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            :class="[inputClass, 'pl-8']"
          />
        </div>
        <p v-if="errors.price_cents" class="mt-1 text-xs text-red-600">{{ errors.price_cents }}</p>
      </div>

      <div>
        <label for="product-listing-type" class="mb-1.5 block text-sm font-medium text-slate-700">
          Listing Type
        </label>
        <select id="product-listing-type" v-model="listingTypeProxy" :class="inputClass">
          <option v-for="type in listingTypeOptions" :key="type" :value="type">
            {{ capitalize(type) }}
          </option>
        </select>
      </div>

      <div>
        <label for="product-brand" class="mb-1.5 block text-sm font-medium text-slate-700">
          Brand <span class="text-red-500">*</span>
        </label>
        <select id="product-brand" v-model="brandProxy" :class="inputClass">
          <option :value="null">-- Select --</option>
          <option v-for="brand in lookups?.brands ?? []" :key="brand.id" :value="brand.id">
            {{ brand.name }}
          </option>
        </select>
        <p v-if="errors.brand_id" class="mt-1 text-xs text-red-600">{{ errors.brand_id }}</p>
      </div>

      <div>
        <label for="product-category" class="mb-1.5 block text-sm font-medium text-slate-700">
          Category
        </label>
        <select id="product-category" v-model="categoryProxy" :class="inputClass">
          <option :value="null">-- Select --</option>
          <option v-for="item in lookups?.categories ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="product-space" class="mb-1.5 block text-sm font-medium text-slate-700">
          Space
        </label>
        <select id="product-space" v-model="spaceProxy" :class="inputClass">
          <option :value="null">-- Select --</option>
          <option v-for="item in lookups?.spaces ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="product-style" class="mb-1.5 block text-sm font-medium text-slate-700">
          Style
        </label>
        <select id="product-style" v-model="styleProxy" :class="inputClass">
          <option :value="null">-- Select --</option>
          <option v-for="item in lookups?.styles ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="product-room" class="mb-1.5 block text-sm font-medium text-slate-700">
          Room
        </label>
        <select id="product-room" v-model="roomProxy" :class="inputClass">
          <option :value="null">-- Select --</option>
          <option v-for="item in lookups?.rooms ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="product-material" class="mb-1.5 block text-sm font-medium text-slate-700">
          Material
        </label>
        <select id="product-material" v-model="materialProxy" :class="inputClass">
          <option :value="null">-- Select --</option>
          <option v-for="item in lookups?.materials ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProductFormData, ProductLookups } from '@/admin/types/admin'

const props = withDefaults(
  defineProps<{
    modelValue: ProductFormData
    lookups: ProductLookups | null
    errors?: Record<string, string>
  }>(),
  { errors: () => ({}) },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProductFormData): void
}>()

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary'

const listingTypeOptions = computed<string[]>(() => {
  const fromLookups = props.lookups?.listing_types ?? []
  return fromLookups.length > 0 ? fromLookups : ['category', 'space', 'style']
})

function patch(partial: Partial<ProductFormData>): void {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function onNameInput(value: string): void {
  patch({ name: value, slug: slugify(value) })
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const priceRupees = computed<number>({
  get: () => props.modelValue.price_cents / 100,
  set: (value: number) => patch({ price_cents: Math.round((Number(value) || 0) * 100) }),
})

function fieldProxy<K extends keyof ProductFormData>(key: K) {
  return computed<ProductFormData[K]>({
    get: () => props.modelValue[key],
    set: (value: ProductFormData[K]) => patch({ [key]: value } as Partial<ProductFormData>),
  })
}

const listingTypeProxy = fieldProxy('listing_type')
const brandProxy = fieldProxy('brand_id')
const categoryProxy = fieldProxy('category_id')
const spaceProxy = fieldProxy('space_id')
const styleProxy = fieldProxy('style_id')
const roomProxy = fieldProxy('room_id')
const materialProxy = fieldProxy('material_id')
</script>
