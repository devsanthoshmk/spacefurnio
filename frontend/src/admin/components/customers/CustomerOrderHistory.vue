<template>
  <div class="overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th class="px-5 py-3.5">Order ID</th>
            <th class="px-5 py-3.5">Date</th>
            <th class="px-5 py-3.5">Status</th>
            <th class="px-5 py-3.5">Location</th>
            <th class="px-5 py-3.5 text-right">Total</th>
            <th class="px-5 py-3.5 text-right">Action</th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in 3" :key="n" class="border-b border-slate-100">
            <td v-for="c in 6" :key="c" class="px-5 py-4">
              <div class="h-4 animate-pulse rounded bg-slate-100" />
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="!orders || orders.length === 0">
          <tr>
            <td colspan="6" class="px-5 py-12">
              <AdminEmptyState
                title="No orders found"
                description="This customer has not placed any orders yet."
                icon="pi pi-shopping-bag"
              />
            </td>
          </tr>
        </tbody>

        <tbody v-else class="divide-y divide-slate-100">
          <tr v-for="order in orders" :key="order.id" class="transition-colors hover:bg-slate-50">
            <td class="px-5 py-4">
              <router-link
                :to="`/admin/orders/${order.id}`"
                class="font-mono text-xs font-medium text-admin-primary hover:underline"
              >
                #{{ order.id.slice(0, 8) }}
              </router-link>
            </td>

            <td class="px-5 py-4 text-admin-text-secondary">
              {{ formatDate(order.created_at) }}
            </td>

            <td class="px-5 py-4">
              <AdminStatusBadge :status="order.status" size="sm" />
            </td>

            <td class="px-5 py-4 text-admin-text-secondary">
              {{ getLocation(order) }}
            </td>

            <td class="px-5 py-4 text-right font-medium text-admin-text">
              {{ formatCurrency(order.total_amount * 100) }}
            </td>

            <td class="px-5 py-4 text-right">
              <router-link
                :to="`/admin/orders/${order.id}`"
                class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-admin-primary"
              >
                View
                <i class="pi pi-arrow-right text-[10px]" aria-hidden="true" />
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import { formatCurrency, formatDate } from '@/admin/utils/formatters'
import type { Order } from '@/admin/types/admin'

export interface CustomerOrderSummaryItem {
  id: string
  status: string
  total_amount: number
  created_at: string
  city?: string | null
  state?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  customer?: {
    city?: string | null
    state?: string | null
  } | null
  shipping?: {
    shipping_city?: string | null
    shipping_state?: string | null
  } | null
}

withDefaults(
  defineProps<{
    orders: (Order | CustomerOrderSummaryItem)[]
    loading?: boolean
  }>(),
  { loading: false },
)

function getLocation(order: Order | CustomerOrderSummaryItem): string {
  const o = order as CustomerOrderSummaryItem
  const city = o.city || o.shipping_city || o.customer?.city || o.shipping?.shipping_city
  const state = o.state || o.shipping_state || o.customer?.state || o.shipping?.shipping_state
  const parts = [city, state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}
</script>