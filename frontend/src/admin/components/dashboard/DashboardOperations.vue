<template>
  <div class="rounded-xl border border-admin-border bg-white p-5 shadow-sm">
    <h2 class="mb-4 text-base font-semibold text-admin-text">Operations Overview</h2>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border border-admin-border bg-slate-50 p-4"
      >
        <div class="flex items-center gap-2">
          <span :class="['flex h-8 w-8 items-center justify-center rounded-lg', stat.iconBg]">
            <i :class="[stat.icon, 'text-sm']" />
          </span>
        </div>
        <p class="mt-3 text-xl font-semibold text-admin-text">{{ stat.value }}</p>
        <p class="mt-0.5 text-xs text-admin-text-secondary">{{ stat.label }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/admin/utils/formatters'
import type { CatalogStats, OperationsQueue } from '@/admin/types/admin'

const props = defineProps<{
  operations: OperationsQueue
  catalog: CatalogStats
}>()

interface OpsStat {
  label: string
  value: string | number
  icon: string
  iconBg: string
}

const stats = computed<OpsStat[]>(() => [
  {
    label: 'Awaiting Fulfillment',
    value: props.operations.awaiting_fulfillment,
    icon: 'pi pi-box',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    label: 'Active Carts',
    value: props.operations.active_carts,
    icon: 'pi pi-shopping-cart',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Total Reviews',
    value: props.operations.total_reviews,
    icon: 'pi pi-star',
    iconBg: 'bg-cyan-100 text-cyan-600',
  },
  {
    label: 'Store Rating',
    value: props.operations.store_rating.toFixed(1),
    icon: 'pi pi-thumbs-up',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Total Products',
    value: props.catalog.total_products,
    icon: 'pi pi-th-large',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Inventory Value',
    value: formatCurrency(props.catalog.inventory_value),
    icon: 'pi pi-wallet',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
])
</script>
