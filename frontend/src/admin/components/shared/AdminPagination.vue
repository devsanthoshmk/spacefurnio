<template>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-admin-border pt-4">
    <p class="text-sm text-admin-text-secondary">
      Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }} results
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <select
        :value="limit"
        aria-label="Results per page"
        class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
        @change="onLimitChange(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="option in limitOptions" :key="option" :value="option">
          {{ option }} / page
        </option>
      </select>
      <button
        type="button"
        :disabled="page <= 1"
        aria-label="Previous page"
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="emit('update:page', page - 1)"
      >
        <i class="pi pi-chevron-left text-xs" aria-hidden="true" />
      </button>
      <button
        v-for="(pageNumber, index) in visiblePages"
        :key="pageNumber === ELLIPSIS ? `gap-${index}` : `page-${pageNumber}`"
        type="button"
        :disabled="pageNumber === ELLIPSIS"
        :aria-label="pageNumber === ELLIPSIS ? undefined : `Page ${pageNumber}`"
        :aria-current="pageNumber === page ? 'page' : undefined"
        :class="[
          'min-w-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
          pageNumber === page
            ? 'border-admin-primary bg-admin-primary text-white'
            : pageNumber === ELLIPSIS
              ? 'cursor-default border-transparent text-slate-400'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        ]"
        @click="goToPage(pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button
        type="button"
        :disabled="page >= totalPages"
        aria-label="Next page"
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="emit('update:page', page + 1)"
      >
        <i class="pi pi-chevron-right text-xs" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const ELLIPSIS = '…'

const props = defineProps<{
  page: number
  totalPages: number
  total: number
  limit: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:limit', value: number): void
}>()

const limitOptions = [10, 20, 50, 100]

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const rangeEnd = computed(() => Math.min(props.page * props.limit, props.total))

const visiblePages = computed<(number | string)[]>(() => {
  const total = Math.max(props.totalPages, 1)
  const current = Math.min(Math.max(props.page, 1), total)
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | string)[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push(ELLIPSIS)
    }
    result.push(sorted[i])
  }
  return result
})

function goToPage(pageNumber: number | string): void {
  if (typeof pageNumber === 'number' && pageNumber !== props.page) {
    emit('update:page', pageNumber)
  }
}

function onLimitChange(value: string): void {
  emit('update:limit', Number(value))
}
</script>
