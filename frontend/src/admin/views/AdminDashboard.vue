<template>
  <div>
    <AdminPageHeader title="Dashboard">
      <template #actions>
        <Dropdown
          v-model="selectedPeriod"
          :options="periodOptions"
          option-label="label"
          option-value="value"
          class="w-40"
          aria-label="Select period"
        />
      </template>
    </AdminPageHeader>

    <DashboardSkeleton v-if="loading" />

    <div
      v-else-if="error"
      class="rounded-xl border border-admin-border bg-white p-8 text-center shadow-sm"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
      <p class="mt-3 font-medium text-admin-text">Failed to load dashboard</p>
      <p class="mt-1 text-sm text-admin-text-secondary">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="fetchDashboard"
      >
        Retry
      </button>
    </div>

    <div
      v-else-if="!canView"
      class="rounded-xl border border-admin-border bg-white p-8 shadow-sm"
    >
      <AdminEmptyState
        title="Access Restricted"
        description="You don't have permission to view the dashboard."
        icon="pi pi-lock"
      />
    </div>

    <div v-else-if="data" class="space-y-6">
      <DashboardKpiStrip :kpis="data.kpis" />
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardRevenueChart :data="data.trends" class="lg:col-span-2" />
        <DashboardCustomerSplit :data="data.customer_acquisition" />
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardTopProducts :products="data.top_products" />
        <DashboardRecentOrders :orders="data.recent_orders.slice(0, 8)" />
      </div>
      <DashboardOperations :operations="data.operations_queue" :catalog="data.catalog" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import DashboardKpiStrip from '@/admin/components/dashboard/DashboardKpiStrip.vue'
import DashboardRevenueChart from '@/admin/components/dashboard/DashboardRevenueChart.vue'
import DashboardCustomerSplit from '@/admin/components/dashboard/DashboardCustomerSplit.vue'
import DashboardTopProducts from '@/admin/components/dashboard/DashboardTopProducts.vue'
import DashboardRecentOrders from '@/admin/components/dashboard/DashboardRecentOrders.vue'
import DashboardOperations from '@/admin/components/dashboard/DashboardOperations.vue'
import DashboardSkeleton from '@/admin/components/dashboard/DashboardSkeleton.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import type { DashboardData } from '@/admin/types/admin'

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
]

const selectedPeriod = ref('week')
const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<DashboardData | null>(null)

const { hasPermission } = useAdminAuth()
const canView = computed(() => hasPermission('analytics.view'))

async function fetchDashboard(): Promise<void> {
  if (!canView.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    data.value = await adminApi.get<DashboardData>('/api/admin/dashboard', {
      period: selectedPeriod.value,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
watch(selectedPeriod, fetchDashboard)
</script>
