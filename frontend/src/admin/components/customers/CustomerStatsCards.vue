<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    <AdminStatsCard
      title="Total Orders"
      :value="loading ? '...' : (stats?.total_orders ?? 0)"
      color="blue"
      icon="pi pi-shopping-bag"
    />
    <AdminStatsCard
      title="Total Spent"
      :value="loading ? '...' : formatCurrency((stats?.total_spent ?? 0) * 100)"
      color="emerald"
      icon="pi pi-wallet"
    />
    <AdminStatsCard
      title="Avg Order Value"
      :value="loading ? '...' : formatCurrency((stats?.average_order_value ?? 0) * 100)"
      color="cyan"
      icon="pi pi-chart-line"
    />
    <AdminStatsCard
      title="Cart Items"
      :value="loading ? '...' : (stats?.cart_items_count ?? 0)"
      color="amber"
      icon="pi pi-shopping-cart"
    />
    <AdminStatsCard
      title="Wishlist Items"
      :value="loading ? '...' : (stats?.wishlist_items_count ?? 0)"
      color="purple"
      icon="pi pi-heart"
    />
    <AdminStatsCard
      title="Reviews Given"
      :value="loading ? '...' : (stats?.reviews_count ?? 0)"
      color="blue"
      icon="pi pi-star"
    />
  </div>
</template>

<script setup lang="ts">
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import { formatCurrency } from '@/admin/utils/formatters'
import type { CustomerDetail } from '@/admin/types/admin'

withDefaults(
  defineProps<{
    stats: CustomerDetail['stats'] | null
    loading?: boolean
  }>(),
  { loading: false },
)
</script>