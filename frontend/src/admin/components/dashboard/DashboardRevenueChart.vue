<template>
  <div class="rounded-xl border border-admin-border bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-semibold text-admin-text">Revenue Trend</h2>
      <span v-if="totalRevenue > 0" class="text-sm font-medium text-admin-text-secondary">
        {{ formatCurrency(totalRevenue * 100) }} total
      </span>
    </div>
    <div v-if="data.length === 0" class="flex h-64 items-center justify-center text-sm text-admin-text-muted">
      No trend data for this period
    </div>
    <div v-else class="relative">
      <svg viewBox="0 0 720 300" class="w-full" role="img" aria-label="Revenue trend bar chart">
        <g v-for="tick in yTicks" :key="tick">
          <line
            :x1="padLeft"
            :x2="chartWidth"
            :y1="yFor(tick)"
            :y2="yFor(tick)"
            class="stroke-slate-200"
            stroke-width="1"
          />
          <text
            :x="padLeft - 8"
            :y="yFor(tick) + 4"
            text-anchor="end"
            class="fill-slate-500"
            font-size="11"
          >
            {{ compactCurrency(tick) }}
          </text>
        </g>
        <g v-for="(point, index) in data" :key="point.date + index">
          <rect
            :x="barX(index)"
            :y="yFor(point.revenue)"
            :width="barWidth"
            :height="Math.max(barBottom - yFor(point.revenue), 2)"
            rx="4"
            :class="hoveredIndex === index ? 'fill-blue-700' : 'fill-blue-500'"
            class="cursor-pointer transition-colors"
            @mouseenter="hoveredIndex = index"
            @mouseleave="hoveredIndex = null"
          />
          <text
            :x="barCenter(index)"
            :y="barBottom + 18"
            text-anchor="middle"
            class="fill-slate-500"
            font-size="10"
          >
            {{ truncateLabel(point.label) }}
          </text>
        </g>
      </svg>
      <div
        v-if="hoveredIndex !== null && data[hoveredIndex]"
        class="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
        :style="{ left: tooltipLeft, top: '8px' }"
      >
        <p class="font-semibold">{{ formatCurrency(data[hoveredIndex].revenue * 100) }}</p>
        <p class="text-slate-300">{{ data[hoveredIndex].orders }} orders</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatCurrency } from '@/admin/utils/formatters'
import type { TrendPoint } from '@/admin/types/admin'

const props = defineProps<{
  data: TrendPoint[]
}>()

const hoveredIndex = ref<number | null>(null)

const svgWidth = 720
const svgHeight = 300
const padLeft = 56
const padRight = 12
const padTop = 16
const padBottom = 36
const chartWidth = svgWidth - padRight
const barBottom = svgHeight - padBottom

const maxRevenue = computed(() => Math.max(1, ...props.data.map((p) => p.revenue)))
const yMax = computed(() => {
  const raw = maxRevenue.value * 1.1
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  return Math.ceil(raw / magnitude) * magnitude
})

const yTicks = computed(() => [0, yMax.value / 4, yMax.value / 2, (yMax.value * 3) / 4, yMax.value])

function yFor(value: number): number {
  const usable = barBottom - padTop
  return barBottom - (value / yMax.value) * usable
}

const slotWidth = computed(() => (chartWidth - padLeft) / Math.max(props.data.length, 1))
const barWidth = computed(() => Math.max(slotWidth.value * 0.55, 8))

function barX(index: number): number {
  return padLeft + index * slotWidth.value + (slotWidth.value - barWidth.value) / 2
}

function barCenter(index: number): number {
  return barX(index) + barWidth.value / 2
}

const totalRevenue = computed(() => props.data.reduce((sum, p) => sum + p.revenue, 0))

const tooltipLeft = computed(() => {
  if (hoveredIndex.value === null) return '50%'
  return `${(barCenter(hoveredIndex.value) / svgWidth) * 100}%`
})

function truncateLabel(label: string): string {
  return label.length > 10 ? `${label.slice(0, 9)}…` : label
}

function compactCurrency(rupees: number): string {
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`
  return `₹${Math.round(rupees)}`
}
</script>
