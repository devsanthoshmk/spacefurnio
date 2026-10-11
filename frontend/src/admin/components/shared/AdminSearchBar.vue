<template>
  <div class="relative">
    <i class="pi pi-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-admin-text-muted" aria-hidden="true" />
    <input
      :value="modelValue"
      type="text"
      role="searchbox"
      :placeholder="placeholder"
      :aria-label="placeholder"
      class="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-9 pl-9 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      type="button"
      aria-label="Clear search"
      class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-admin-text-muted transition-colors hover:bg-slate-100 hover:text-slate-600 focus:ring-2 focus:ring-admin-primary focus:outline-none"
      @click="clear"
    >
      <i class="pi pi-times text-xs" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  { placeholder: 'Search...' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function onInput(value: string): void {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  debounceTimer.value = setTimeout(() => {
    emit('update:modelValue', value)
  }, 300)
}

function clear(): void {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = null
  }
  emit('update:modelValue', '')
}

onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
})
</script>
