<template>
  <div>
    <AdminPageHeader
      title="Customers"
      :breadcrumbs="[{ label: 'Admin', to: '/admin' }, { label: 'Customers' }]"
    />

    <!-- Metrics Strip -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
      <AdminStatsCard
        title="Total Customers"
        :value="loading && !metrics ? '...' : (metrics?.total_customers ?? 0)"
        color="blue"
        icon="pi pi-users"
      />
      <AdminStatsCard
        title="New (30d)"
        :value="loading && !metrics ? '...' : (metrics?.new_customers_30d ?? 0)"
        color="emerald"
        icon="pi pi-user-plus"
      />
      <AdminStatsCard
        title="Active"
        :value="loading && !metrics ? '...' : (metrics?.active_customers ?? 0)"
        color="cyan"
        icon="pi pi-check-circle"
      />
      <AdminStatsCard
        title="Returning"
        :value="loading && !metrics ? '...' : (metrics?.returning_customers ?? 0)"
        color="amber"
        icon="pi pi-sync"
      />
      <AdminStatsCard
        title="High Value"
        :value="loading && !metrics ? '...' : (metrics?.high_value_customers ?? 0)"
        color="purple"
        icon="pi pi-star"
      />
      <AdminStatsCard
        title="Total Revenue"
        :value="loading && !metrics ? '...' : formatCurrency((metrics?.total_revenue ?? 0) * 100)"
        color="emerald"
        icon="pi pi-wallet"
      />
      <AdminStatsCard
        title="Avg Order Value"
        :value="loading && !metrics ? '...' : formatCurrency((metrics?.average_order_value ?? 0) * 100)"
        color="blue"
        icon="pi pi-chart-line"
      />
    </div>

    <!-- Search & Filters -->
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <AdminSearchBar
        v-model="searchQuery"
        placeholder="Search customers by name, email, phone..."
        class="w-full lg:max-w-xs"
      />

      <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-1 sm:items-center sm:flex-wrap lg:justify-end">
        <select
          v-model="segmentFilter"
          aria-label="Filter by customer segment"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-admin-text focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
        >
          <option value="all">All Segments</option>
          <option value="high_value">High Value (VIP)</option>
          <option value="returning">Returning</option>
          <option value="new">New (&lt; 30d)</option>
          <option value="inactive">Inactive</option>
          <option value="no_orders">No Orders</option>
        </select>

        <select
          v-model="statusFilter"
          aria-label="Filter by account status"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-admin-text focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>

        <select
          v-model="sortBy"
          aria-label="Sort customers by field"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-admin-text focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
        >
          <option value="joined">Joined Date</option>
          <option value="total_spent">Total Spent</option>
          <option value="orders">Orders Count</option>
          <option value="name">Customer Name</option>
          <option value="last_order">Last Order Date</option>
        </select>

        <select
          v-model="sortDir"
          aria-label="Sort direction"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-admin-text focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
        >
          <option value="desc">Newest / Highest First</option>
          <option value="asc">Oldest / Lowest First</option>
        </select>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-admin-primary"
          @click="resetFilters"
        >
          <i class="pi pi-filter-slash text-xs" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="mb-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <h3 class="mt-2 text-base font-semibold text-slate-900">Failed to load customers</h3>
      <p class="mt-1 text-sm text-slate-600">{{ error }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-admin-primary-hover focus:outline-none focus:ring-2 focus:ring-admin-primary"
        @click="fetchCustomers"
      >
        <i class="pi pi-refresh text-xs" aria-hidden="true" />
        Retry
      </button>
    </div>

    <!-- Customers Table -->
    <div v-else class="overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th class="px-5 py-3.5">Customer</th>
              <th class="px-5 py-3.5">Phone</th>
              <th class="px-5 py-3.5 text-center">Orders</th>
              <th class="px-5 py-3.5 text-right">Total Spent</th>
              <th class="px-5 py-3.5">Segment</th>
              <th class="px-5 py-3.5">Last Order</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr v-for="n in 8" :key="n" class="border-b border-slate-100">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 animate-pulse rounded-full bg-slate-100 shrink-0" />
                  <div class="space-y-1.5">
                    <div class="h-4 w-28 animate-pulse rounded bg-slate-100" />
                    <div class="h-3 w-36 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </td>
              <td v-for="c in 7" :key="c" class="px-5 py-4">
                <div class="h-4 animate-pulse rounded bg-slate-100" />
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="customers.length === 0">
            <tr>
              <td colspan="8" class="px-5 py-12">
                <AdminEmptyState
                  title="No customers found"
                  description="No customers match your search or filter criteria. Try adjusting your filters."
                  icon="pi pi-users"
                />
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y divide-slate-100">
            <tr v-for="customer in customers" :key="customer.id" class="transition-colors hover:bg-slate-50">
              <!-- Customer Info -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-primary text-sm font-semibold text-white"
                  >
                    {{ getInitials(customer.name, customer.email) }}
                  </div>
                  <div class="min-w-0">
                    <router-link
                      :to="`/admin/customers/${customer.id}`"
                      class="block truncate font-semibold text-admin-text hover:text-admin-primary transition-colors"
                    >
                      {{ customer.name || customer.email }}
                    </router-link>
                    <span class="block truncate text-xs text-admin-text-secondary">
                      {{ customer.email }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Phone -->
              <td class="px-5 py-4 text-admin-text-secondary">
                {{ formatPhone(customer.phone) }}
              </td>

              <!-- Orders -->
              <td class="px-5 py-4 text-center font-medium text-admin-text">
                {{ customer.total_orders }}
              </td>

              <!-- Total Spent -->
              <td class="px-5 py-4 text-right font-medium text-admin-text">
                {{ formatCurrency(customer.total_spent * 100) }}
              </td>

              <!-- Segment -->
              <td class="px-5 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                    getSegmentClass(customer.segment)
                  ]"
                >
                  {{ customer.segment || 'Returning' }}
                </span>
              </td>

              <!-- Last Order -->
              <td class="px-5 py-4 text-admin-text-secondary">
                {{ formatRelativeTime(customer.last_order_date) }}
              </td>

              <!-- Status -->
              <td class="px-5 py-4">
                <AdminStatusBadge :status="customer.status" size="sm" />
              </td>

              <!-- Actions -->
              <td class="px-5 py-4 text-right">
                <router-link
                  :to="`/admin/customers/${customer.id}`"
                  class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-admin-primary"
                >
                  View
                  <i class="pi pi-arrow-right text-[10px]" aria-hidden="true" />
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > 0" class="px-5 pb-4">
        <AdminPagination
          :page="pagination.page"
          :total-pages="pagination.total_pages"
          :total="pagination.total"
          :limit="pagination.limit"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminPagination from '@/admin/components/shared/AdminPagination.vue'
import { adminApi } from '@/admin/api/adminApi'
import { formatCurrency, formatPhone, formatRelativeTime } from '@/admin/utils/formatters'
import type { Customer, CustomerListResponse, CustomerMetrics, Pagination } from '@/admin/types/admin'

const loading = ref(false)
const error = ref<string | null>(null)

const customers = ref<Customer[]>([])
const metrics = ref<CustomerMetrics | null>(null)
const pagination = ref<Pagination>({
  page: 1,
  limit: 25,
  total: 0,
  total_pages: 1,
  has_next_page: false,
  has_prev_page: false,
})

const searchQuery = ref('')
const segmentFilter = ref('all')
const statusFilter = ref('all')
const sortBy = ref('joined')
const sortDir = ref('desc')

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value !== '' ||
    segmentFilter.value !== 'all' ||
    statusFilter.value !== 'all' ||
    sortBy.value !== 'joined' ||
    sortDir.value !== 'desc'
  )
})

async function fetchCustomers(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const params: Record<string, string | number> = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (segmentFilter.value !== 'all') {
      params.segment = segmentFilter.value
    }

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }

    const res = await adminApi.get<CustomerListResponse>('/api/admin/customers', params)
    customers.value = res.customers || []
    metrics.value = res.metrics || null
    pagination.value = res.pagination || pagination.value
  } catch (err) {
    console.error('Failed to fetch customers:', err)
    error.value = (err as Error).message || 'Something went wrong while fetching customers.'
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage: number): void {
  pagination.value.page = newPage
  fetchCustomers()
}

function handleLimitChange(newLimit: number): void {
  pagination.value.limit = newLimit
  pagination.value.page = 1
  fetchCustomers()
}

function resetFilters(): void {
  searchQuery.value = ''
  segmentFilter.value = 'all'
  statusFilter.value = 'all'
  sortBy.value = 'joined'
  sortDir.value = 'desc'
  pagination.value.page = 1
  fetchCustomers()
}

function getInitials(name: string | null | undefined, email: string): string {
  const target = (name && name.trim()) || email
  const parts = target.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return target.slice(0, 2).toUpperCase()
}

function getSegmentClass(segment: string | null | undefined): string {
  const s = (segment || '').toLowerCase()
  if (s.includes('high') || s === 'high_value') {
    return 'bg-purple-100 text-purple-700 border-purple-200'
  }
  if (s.includes('return') || s === 'returning') {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (s.includes('new') || s === 'new') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  if (s.includes('no') || s === 'no_orders') {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

watch([searchQuery, segmentFilter, statusFilter, sortBy, sortDir], () => {
  pagination.value.page = 1
  fetchCustomers()
})

onMounted(() => {
  fetchCustomers()
})
</script>