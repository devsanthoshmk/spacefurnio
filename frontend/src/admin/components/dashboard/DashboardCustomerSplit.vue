<template>
  <div class="rounded-xl border border-admin-border bg-white p-5 shadow-sm">
    <h2 class="mb-4 text-base font-semibold text-admin-text">Customer Acquisition</h2>
    <div class="flex flex-col items-center">
      <svg viewBox="0 0 180 180" class="h-44 w-44" role="img" aria-label="Customer acquisition donut chart">
        <circle cx="90" cy="90" r="64" fill="none" class="stroke-slate-100" stroke-width="24" />
        <circle
          v-for="segment in segments"
          :key="segment.key"
          cx="90"
          cy="90"
          r="64"
          fill="none"
          :stroke="segment.color"
          stroke-width="24"
          :stroke-dasharray="`${segment.length} ${circumference}`"
          :stroke-dashoffset="-segment.offset"
          stroke-linecap="butt"
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="86" text-anchor="middle" class="fill-slate-900" font-size="24" font-weight="600">
          {{ total }}
        </text>
        <text x="90" y="106" text-anchor="middle" class="fill-slate-500" font-size="12">
          orders
        </text>
      </svg>
      <ul class="mt-4 w-full space-y-2.5">
        <li v-for="segment in segments" :key="segment.key" class="flex items-center gap-2 text-sm">
          <span :style="{ backgroundColor: segment.color }" class="h-2.5 w-2.5 shrink-0 rounded-full" />
          <span class="text-admin-text-secondary">{{ segment.label }}</span>
          <span class="ml-auto font-medium text-admin-text">{{ segment.count }} · {{ segment.pct }}%</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CustomerAcquisition } from '@/admin/types/admin'

const props = defineProps<{
  data: CustomerAcquisition
}>()

const radius = 64
const circumference = 2 * Math.PI * radius

const total = computed(
  () => props.data.new_customers + props.data.returning_customers + props.data.guest_orders,
)

const segments = computed(() => {
  const defs = [
    { key: 'new', label: 'New', count: props.data.new_customers, color: '#2563eb' },
    { key: 'returning', label: 'Returning', count: props.data.returning_customers, color: '#10b981' },
    { key: 'guest', label: 'Guest', count: props.data.guest_orders, color: '#f59e0b' },
  ]
  const whole = Math.max(total.value, 1)
  let offset = 0
  return defs.map((def) => {
    const fraction = total.value === 0 ? 0 : def.count / whole
    const length = fraction * circumference
    const pct = total.value === 0 ? 0 : Math.round(fraction * 100)
    const segment = { ...def, length, offset, pct }
    offset += length
    return segment
  })
})
</script>
