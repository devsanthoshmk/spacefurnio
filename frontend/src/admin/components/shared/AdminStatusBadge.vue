<template>
  <span :class="['inline-flex items-center rounded-full font-medium capitalize', sizeClass, colorClass]">
    <span v-if="showDot" :class="['mr-1.5 h-1.5 w-1.5 rounded-full', dotClass]" aria-hidden="true" />
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status: string
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const sizeClass = computed(() =>
  props.size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
)

const normalized = computed(() => props.status.toLowerCase().replace(/[_\s]+/g, ''))

const colorClass = computed(() => {
  const s = normalized.value
  if (['paid', 'active', 'completed', 'delivered'].includes(s)) {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (s === 'processing') return 'bg-blue-100 text-blue-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'shipped') return 'bg-cyan-100 text-cyan-700'
  if (['cancelled', 'canceled', 'failed'].includes(s)) return 'bg-red-100 text-red-700'
  if (s === 'refunded') return 'bg-purple-100 text-purple-700'
  if (['inactive', 'disabled', 'draft', 'expired'].includes(s)) return 'bg-slate-100 text-slate-600'
  return 'bg-slate-100 text-slate-600'
})

const dotClass = computed(() => {
  const s = normalized.value
  if (['paid', 'active', 'completed', 'delivered'].includes(s)) return 'bg-emerald-500'
  if (s === 'processing') return 'bg-blue-500'
  if (s === 'pending') return 'bg-amber-500'
  if (s === 'shipped') return 'bg-cyan-500'
  if (['cancelled', 'canceled', 'failed'].includes(s)) return 'bg-red-500'
  if (s === 'refunded') return 'bg-purple-500'
  return 'bg-slate-400'
})

const showDot = computed(() => props.size === 'md')
</script>
