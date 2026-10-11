<template>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
    <div>
      <AdminStatsCard
        title="Revenue"
        :value="formatCurrency(kpis.revenue.value * 100)"
        :delta="kpis.revenue.delta_pct ?? undefined"
        :delta-type="kpis.revenue.delta_pct == null ? 'neutral' : kpis.revenue.is_positive ? 'up' : 'down'"
        color="blue"
        icon="pi pi-dollar"
        :sparkline-data="kpis.revenue.sparkline"
      />
    </div>
    <div>
      <AdminStatsCard
        title="Orders"
        :value="kpis.orders.value"
        :delta="kpis.orders.delta_pct ?? undefined"
        :delta-type="kpis.orders.delta_pct == null ? 'neutral' : kpis.orders.is_positive ? 'up' : 'down'"
        color="emerald"
        icon="pi pi-shopping-cart"
        :sparkline-data="kpis.orders.sparkline"
      />
      <p class="mt-1.5 text-xs text-admin-text-secondary">
        {{ kpis.orders.completed }} completed · {{ kpis.orders.pending }} pending
      </p>
    </div>
    <div>
      <AdminStatsCard
        title="Avg. Order Value"
        :value="formatCurrency(kpis.aov.value * 100)"
        :delta="kpis.aov.delta_pct ?? undefined"
        :delta-type="kpis.aov.delta_pct == null ? 'neutral' : kpis.aov.is_positive ? 'up' : 'down'"
        color="cyan"
        icon="pi pi-chart-line"
        :sparkline-data="kpis.aov.sparkline"
      />
    </div>
    <div>
      <AdminStatsCard
        title="Customers"
        :value="kpis.customers.value"
        :delta="kpis.customers.delta_pct ?? undefined"
        :delta-type="kpis.customers.delta_pct == null ? 'neutral' : kpis.customers.is_positive ? 'up' : 'down'"
        color="amber"
        icon="pi pi-users"
        :sparkline-data="kpis.customers.sparkline"
      />
      <p class="mt-1.5 text-xs text-admin-text-secondary">
        {{ kpis.customers.total_registered }} registered total
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import { formatCurrency } from '@/admin/utils/formatters'
import type { DashboardData } from '@/admin/types/admin'

defineProps<{
  kpis: DashboardData['kpis']
}>()
</script>
