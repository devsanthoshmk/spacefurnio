<template>
  <div class="overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
    <div :class="['h-1', accentClass]" />
    <div class="p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-sm text-admin-text-secondary">{{ title }}</p>
          <p class="mt-1 text-2xl font-semibold text-admin-text">{{ value }}</p>
          <span
            v-if="delta !== undefined"
            :class="[
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              deltaBadgeClass,
            ]"
          >
            <i :class="deltaIcon" aria-hidden="true" />
            {{ Math.abs(delta) }}%
          </span>
        </div>
        <div
          v-if="icon"
          :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBgClass]"
        >
          <i :class="[icon, 'text-lg']" aria-hidden="true" />
        </div>
      </div>
      <div v-if="sparklineData && sparklineData.length > 1" class="mt-3 flex justify-end">
        <AdminSparkline :data="sparklineData" :color="sparklineColor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AdminSparkline from '@/admin/components/shared/AdminSparkline.vue'

type StatsColor = 'blue' | 'emerald' | 'amber' | 'red' | 'cyan' | 'purple' | 'slate'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    delta?: number
    deltaType?: 'up' | 'down' | 'neutral'
    color?: StatsColor
    icon?: string
    sparklineData?: number[]
  }>(),
  { color: 'blue', delta: undefined, deltaType: undefined, icon: undefined, sparklineData: undefined },
)

const accentMap: Record<StatsColor, string> = {
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-600',
  slate: 'bg-slate-500',
}

const iconBgMap: Record<StatsColor, string> = {
  blue: 'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  purple: 'bg-purple-100 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
}

const sparklineColorMap: Record<StatsColor, string> = {
  blue: '#2563eb',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  purple: '#9333ea',
  slate: '#64748b',
}

const accentClass = computed(() => accentMap[props.color])
const iconBgClass = computed(() => iconBgMap[props.color])
const sparklineColor = computed(() => sparklineColorMap[props.color])

const resolvedDeltaType = computed(() => {
  if (props.deltaType) return props.deltaType
  if (props.delta === undefined) return 'neutral'
  if (props.delta > 0) return 'up'
  if (props.delta < 0) return 'down'
  return 'neutral'
})

const deltaBadgeClass = computed(() => {
  if (resolvedDeltaType.value === 'up') return 'bg-emerald-100 text-emerald-700'
  if (resolvedDeltaType.value === 'down') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-600'
})

const deltaIcon = computed(() => {
  if (resolvedDeltaType.value === 'up') return 'pi pi-arrow-up text-[10px]'
  if (resolvedDeltaType.value === 'down') return 'pi pi-arrow-down text-[10px]'
  return 'pi pi-minus text-[10px]'
})
</script>
