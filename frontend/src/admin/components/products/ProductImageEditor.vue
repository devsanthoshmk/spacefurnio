<template>
  <section class="rounded-xl border border-admin-border bg-white p-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-admin-text">Product Images</h2>
      <span class="text-xs text-admin-text-secondary">{{ modelValue.length }} image(s)</span>
    </div>

    <div v-if="modelValue.length === 0" class="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <i class="pi pi-image text-3xl text-admin-text-muted" aria-hidden="true" />
      <p class="mt-2 text-sm text-admin-text-secondary">No images added yet.</p>
    </div>

    <div v-else class="mt-4 space-y-3">
      <div
        v-for="(image, index) in modelValue"
        :key="index"
        class="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start"
      >
        <div class="flex shrink-0 items-center gap-3">
          <img
            v-if="isUrl(image.src)"
            :src="image.src"
            :alt="image.alt || 'Product image'"
            class="h-20 w-20 rounded-lg object-cover"
          />
          <div v-else class="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100">
            <i class="pi pi-image text-xl text-slate-400" aria-hidden="true" />
          </div>
          <label class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600">
            <input
              type="radio"
              name="primary-image"
              :checked="image.is_primary"
              class="h-4 w-4 accent-blue-600"
              @change="setPrimary(index)"
            />
            Primary
          </label>
        </div>

        <div class="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <div class="md:col-span-2">
            <label :for="`image-src-${index}`" class="mb-1.5 block text-sm font-medium text-slate-700">
              Image URL
            </label>
            <input
              :id="`image-src-${index}`"
              :value="image.src"
              type="text"
              placeholder="https://..."
              :class="inputClass"
              @input="updateImage(index, { src: ($event.target as HTMLInputElement).value })"
            />
          </div>
          <div>
            <label :for="`image-alt-${index}`" class="mb-1.5 block text-sm font-medium text-slate-700">
              Alt Text
            </label>
            <input
              :id="`image-alt-${index}`"
              :value="image.alt ?? ''"
              type="text"
              placeholder="Alt text"
              :class="inputClass"
              @input="updateImage(index, { alt: ($event.target as HTMLInputElement).value })"
            />
          </div>
          <div>
            <label :for="`image-order-${index}`" class="mb-1.5 block text-sm font-medium text-slate-700">
              Sort Order
            </label>
            <input
              :id="`image-order-${index}`"
              :value="image.sort_order"
              type="number"
              min="0"
              :class="inputClass"
              @input="updateImage(index, { sort_order: Number(($event.target as HTMLInputElement).value) || 0 })"
            />
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1 sm:flex-col">
          <button
            type="button"
            :disabled="index === 0"
            aria-label="Move image up"
            class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            @click="moveImage(index, -1)"
          >
            <i class="pi pi-chevron-up text-sm" aria-hidden="true" />
          </button>
          <button
            type="button"
            :disabled="index === modelValue.length - 1"
            aria-label="Move image down"
            class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            @click="moveImage(index, 1)"
          >
            <i class="pi pi-chevron-down text-sm" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Remove image"
            class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
            @click="removeImage(index)"
          >
            <i class="pi pi-times text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      @click="addImage"
    >
      <i class="pi pi-plus mr-2 text-xs" aria-hidden="true" />Add Image
    </button>
  </section>
</template>

<script setup lang="ts">
import type { ProductImage } from '@/admin/types/admin'

const props = defineProps<{
  modelValue: ProductImage[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProductImage[]): void
}>()

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary'

function isUrl(value: string | null | undefined): boolean {
  return !!value && /^https?:\/\//.test(value)
}

function addImage(): void {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      src: '',
      alt: '',
      sort_order: props.modelValue.length,
      is_primary: props.modelValue.length === 0,
    },
  ])
}

function removeImage(index: number): void {
  const removed = props.modelValue[index]
  const next = props.modelValue.filter((_, i) => i !== index)
  if (removed?.is_primary && next.length > 0) {
    next[0] = { ...next[0], is_primary: true }
  }
  emit('update:modelValue', next)
}

function updateImage(index: number, partial: Partial<ProductImage>): void {
  emit(
    'update:modelValue',
    props.modelValue.map((image, i) => (i === index ? { ...image, ...partial } : image)),
  )
}

function setPrimary(index: number): void {
  emit(
    'update:modelValue',
    props.modelValue.map((image, i) => ({ ...image, is_primary: i === index })),
  )
}

function moveImage(index: number, direction: -1 | 1): void {
  const target = index + direction
  if (target < 0 || target >= props.modelValue.length) return
  const next = [...props.modelValue]
  const [moved] = next.splice(index, 1)
  if (moved) next.splice(target, 0, moved)
  emit('update:modelValue', next)
}
</script>
