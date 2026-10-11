<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    role="img"
    aria-label="Trend sparkline"
    class="overflow-visible"
  >
    <polyline
      :points="points"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    data: number[]
    color?: string
    width?: number
    height?: number
  }>(),
  { color: '#2563eb', width: 80, height: 32 },
)

const points = computed(() => {
  const values = props.data
  if (values.length === 0) return ''
  if (values.length === 1) {
    const y = (props.height / 2).toFixed(2)
    return `0,${y} ${props.width},${y}`
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padding = 2
  const usableHeight = props.height - padding * 2
  const stepX = props.width / (values.length - 1)
  return values
    .map((value, index) => {
      const x = (index * stepX).toFixed(2)
      const y = (props.height - padding - ((value - min) / range) * usableHeight).toFixed(2)
      return `${x},${y}`
    })
    .join(' ')
})
</script>
