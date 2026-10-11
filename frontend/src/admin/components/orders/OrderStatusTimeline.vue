<template>
  <div v-if="sortedHistory.length === 0" class="py-4 text-center text-sm text-admin-text-muted">
    No status history available
  </div>
  <div v-else class="relative pl-7">
    <div class="absolute top-2 bottom-2 left-[9px] w-0.5 bg-slate-200" aria-hidden="true" />
    <div class="space-y-6">
      <div v-for="entry in sortedHistory" :key="entry.id" class="relative">
        <span
          :class="['absolute top-1 -left-7 h-5 w-5 rounded-full border-2 border-white shadow', dotClass(entry.status)]"
          aria-hidden="true"
        />
        <p class="text-sm font-semibold text-slate-900 capitalize">{{ entry.status }}</p>
        <p v-if="entry.notes" class="mt-0.5 text-sm text-slate-600">{{ entry.notes }}</p>
        <p class="mt-0.5 text-xs text-admin-text-muted">{{ formatDateTime(entry.created_at) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/admin/utils/formatters'
import type { OrderStatusEntry } from '@/admin/types/admin'

const props = defineProps<{
  history: OrderStatusEntry[]
}>()

const DOT_MAP: Record<string, string> = {
  pending: 'bg-amber-500',
  paid: 'bg-emerald-500',
  processing: 'bg-blue-500',
  shipped: 'bg-cyan-500',
  delivered: 'bg-emerald-600',
  cancelled: 'bg-red-500',
  refunded: 'bg-purple-500',
}

const sortedHistory = computed(() =>
  [...(props.history || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
)

function dotClass(status: string): string {
  return DOT_MAP[status.toLowerCase()] ?? 'bg-slate-400'
}
</script>
