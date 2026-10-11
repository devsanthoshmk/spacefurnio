<template>
  <div>
    <Toast />
    <AdminPageHeader title="Orders" :breadcrumbs="breadcrumbs" />

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatsCard title="Total Orders" :value="statsLoading ? '...' : stats.total_orders" color="blue" icon="pi pi-shopping-bag" />
      <AdminStatsCard title="Revenue" :value="statsLoading ? '...' : formatCurrency(stats.total_revenue * 100)" color="emerald" icon="pi pi-wallet" />
      <AdminStatsCard title="Pending" :value="statsLoading ? '...' : stats.pending_count" color="amber" icon="pi pi-clock" />
      <AdminStatsCard title="Shipped" :value="statsLoading ? '...' : stats.shipped_count" color="cyan" icon="pi pi-truck" />
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        type="button"
        :class="[
          'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          statusFilter === tab.value
            ? 'bg-blue-600 text-white'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        ]"
        @click="statusFilter = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <AdminSearchBar
        v-model="searchQuery"
        placeholder="Search orders by ID, customer, email..."
        class="w-full lg:max-w-sm"
      />
      <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-1 sm:items-center lg:justify-end">
        <select v-model="paymentStatusFilter" aria-label="Filter by payment status" :class="filterClass">
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="partially_refunded">Partially Refunded</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select v-model="paymentMethodFilter" aria-label="Filter by payment method" :class="filterClass">
          <option value="">All Payment Methods</option>
          <option value="cod">COD</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="netbanking">Net Banking</option>
          <option value="wallet">Wallet</option>
          <option value="razorpay">Razorpay</option>
        </select>
        <select v-model="sortFilter" aria-label="Sort orders" :class="filterClass">
          <option value="created_at_desc">Newest First</option>
          <option value="created_at_asc">Oldest First</option>
          <option value="total_desc">Total: High to Low</option>
          <option value="total_asc">Total: Low to High</option>
        </select>
        <input
          v-model="dateFrom"
          type="date"
          aria-label="Filter from date"
          :class="filterClass"
        />
        <input
          v-model="dateTo"
          type="date"
          aria-label="Filter to date"
          :class="filterClass"
        />
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-admin-border bg-white p-8 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <p class="mt-3 font-medium text-admin-text">Failed to load orders</p>
      <p class="mt-1 text-sm text-admin-text-secondary">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="fetchOrders"
      >
        Retry
      </button>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1024px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <th class="px-4 py-3 font-medium">Order ID</th>
              <th class="px-4 py-3 font-medium">Customer</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 text-right font-medium">Total</th>
              <th class="px-4 py-3 font-medium">Payment</th>
              <th class="px-4 py-3 font-medium">Shipment</th>
              <th class="px-4 py-3 font-medium">Date</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr v-for="n in 8" :key="n" class="border-b border-slate-100">
              <td v-for="c in 8" :key="c" class="px-4 py-3">
                <div class="h-5 animate-pulse rounded bg-slate-100" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="orders.length === 0">
            <tr>
              <td colspan="8" class="px-4 py-4">
                <AdminEmptyState
                  title="No orders found"
                  description="No orders match your current filters. Try adjusting your search."
                  icon="pi pi-shopping-bag"
                />
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr
              v-for="order in orders"
              :key="order.id"
              class="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
            >
              <td class="px-4 py-3 font-mono text-xs text-slate-900">{{ order.id.slice(0, 8) }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900">{{ order.customer?.name || order.customer?.email || 'Customer' }}</p>
                <p v-if="order.customer?.city" class="text-xs text-slate-400">{{ order.customer.city }}</p>
              </td>
              <td class="px-4 py-3">
                <AdminStatusBadge :status="order.status" size="sm" />
              </td>
              <td class="px-4 py-3 text-right font-medium whitespace-nowrap text-slate-900">
                {{ formatCurrency(order.total_amount * 100) }}
              </td>
              <td class="px-4 py-3">
                <p class="text-xs font-medium text-slate-700 uppercase">{{ order.payment?.method ?? '-' }}</p>
                <AdminStatusBadge v-if="order.payment" :status="order.payment.status" size="sm" class="mt-1" />
              </td>
              <td class="px-4 py-3">
                <p class="text-slate-700">{{ order.shipment?.status ?? '-' }}</p>
                <p v-if="order.shipment?.tracking_number" class="font-mono text-xs text-slate-400">
                  {{ order.shipment.tracking_number }}
                </p>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatRelativeTime(order.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <router-link
                  :to="`/admin/orders/${order.id}`"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <i class="pi pi-eye mr-1 text-xs" aria-hidden="true" />View
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && orders.length > 0" class="px-4 pb-4">
        <AdminPagination
          :page="page"
          :total-pages="totalPages"
          :total="total"
          :limit="limit"
          @update:page="page = $event"
          @update:limit="onLimitChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import AdminPagination from '@/admin/components/shared/AdminPagination.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import { adminApi } from '@/admin/api/adminApi'
import { usePagination } from '@/admin/composables/usePagination'
import { formatCurrency, formatRelativeTime } from '@/admin/utils/formatters'
import type { Order, OrderListResponse, OrderStats } from '@/admin/types/admin'

const breadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Orders' },
]

const filterClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary sm:w-auto'

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const toast = useToast()
const { page, limit, total, totalPages, setTotal, resetPage } = usePagination(25)

const orders = ref<Order[]>([])
const stats = ref<OrderStats>({
  total_orders: 0,
  total_revenue: 0,
  pending_count: 0,
  paid_count: 0,
  processing_count: 0,
  shipped_count: 0,
  delivered_count: 0,
  cancelled_count: 0,
  refunded_count: 0,
})
const loading = ref(false)
const statsLoading = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const statusFilter = ref('all')
const paymentStatusFilter = ref('')
const paymentMethodFilter = ref('')
const sortFilter = ref('created_at_desc')
const dateFrom = ref('')
const dateTo = ref('')

function onLimitChange(value: number): void {
  limit.value = value
  if (page.value === 1) {
    fetchOrders()
  } else {
    resetPage()
  }
}

async function fetchStats(): Promise<void> {
  statsLoading.value = true
  try {
    stats.value = await adminApi.get<OrderStats>('/api/admin/orders/stats')
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Stats unavailable',
      detail: 'Order summary stats could not be loaded.',
      life: 3000,
    })
  } finally {
    statsLoading.value = false
  }
}

async function fetchOrders(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: limit.value,
      sort: sortFilter.value,
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (paymentStatusFilter.value) params.payment_status = paymentStatusFilter.value
    if (paymentMethodFilter.value) params.payment_method = paymentMethodFilter.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    const data = await adminApi.get<OrderListResponse>('/api/admin/orders', params)
    orders.value = data.orders ?? []
    setTotal(data.pagination?.total ?? 0)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

watch(
  [searchQuery, statusFilter, paymentStatusFilter, paymentMethodFilter, sortFilter, dateFrom, dateTo],
  () => {
    if (page.value === 1) {
      fetchOrders()
    } else {
      resetPage()
    }
  },
)

watch(page, fetchOrders)

onMounted(async () => {
  await Promise.all([fetchStats(), fetchOrders()])
})
</script>
