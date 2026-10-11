<template>
  <section class="rounded-xl border border-admin-border bg-white p-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-admin-text">Color Variants</h2>
      <span class="text-xs text-admin-text-secondary">{{ modelValue.length }} color(s)</span>
    </div>

    <div v-if="modelValue.length === 0" class="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <i class="pi pi-palette text-3xl text-admin-text-muted" aria-hidden="true" />
      <p class="mt-2 text-sm text-admin-text-secondary">No color variants added yet.</p>
    </div>

    <div v-else class="mt-4 space-y-3">
      <div
        v-for="(entry, index) in modelValue"
        :key="index"
        class="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-end"
      >
        <div class="flex flex-1 items-end gap-3">
          <span
            class="mb-1 h-10 w-10 shrink-0 rounded-full border border-slate-300"
            :style="{ backgroundColor: swatchFor(entry.color_id) }"
            aria-hidden="true"
          />
          <div class="flex-1">
            <label :for="`color-select-${index}`" class="mb-1.5 block text-sm font-medium text-slate-700">
              Color
            </label>
            <select
              :id="`color-select-${index}`"
              :value="entry.color_id"
              :class="inputClass"
              @change="updateColor(index, { color_id: Number(($event.target as HTMLSelectElement).value) })"
            >
              <option v-if="colors.length === 0" :value="0" disabled>No colors available</option>
              <option v-for="color in colors" :key="color.id" :value="color.id">
                {{ color.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="w-full sm:w-28">
          <label :for="`color-order-${index}`" class="mb-1.5 block text-sm font-medium text-slate-700">
            Sort Order
          </label>
          <input
            :id="`color-order-${index}`"
            :value="entry.sort_order"
            type="number"
            min="0"
            :class="inputClass"
            @input="updateColor(index, { sort_order: Number(($event.target as HTMLInputElement).value) || 0 })"
          />
        </div>

        <button
          type="button"
          aria-label="Remove color"
          class="shrink-0 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
          @click="removeColor(index)"
        >
          <i class="pi pi-times text-sm" aria-hidden="true" />
        </button>
      </div>
    </div>

    <button
      type="button"
      :disabled="colors.length === 0"
      class="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      @click="addColor"
    >
      <i class="pi pi-plus mr-2 text-xs" aria-hidden="true" />Add Color
    </button>
  </section>
</template>

<script setup lang="ts">
import type { ColorLookup, ProductColor } from '@/admin/types/admin'

const props = defineProps<{
  modelValue: ProductColor[]
  colors: ColorLookup[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProductColor[]): void
}>()

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary'

function swatchFor(colorId: number): string {
  return props.colors.find((color) => color.id === colorId)?.hex_code ?? '#e2e8f0'
}

function addColor(): void {
  if (props.colors.length === 0) return
  const firstId = props.colors[0]?.id ?? 0
  emit('update:modelValue', [
    ...props.modelValue,
    { color_id: firstId, sort_order: props.modelValue.length },
  ])
}

function removeColor(index: number): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  )
}

function updateColor(index: number, partial: Partial<ProductColor>): void {
  emit(
    'update:modelValue',
    props.modelValue.map((entry, i) => (i === index ? { ...entry, ...partial } : entry)),
  )
}
</script>
