<template>
  <div class="rounded-xl border border-admin-border bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-semibold text-admin-text">Recent Orders</h2>
      <router-link to="/admin/orders" class="text-sm font-medium text-admin-primary hover:underline">
        View all
      </router-link>
    </div>
    <div v-if="orders.length === 0" class="flex h-40 items-center justify-center text-sm text-admin-text-muted">
      No recent orders
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-admin-text-secondary">
            <th class="pb-3 pr-3 font-medium">Order</th>
            <th class="pb-3 pr-3 font-medium">Customer</th>
            <th class="pb-3 pr-3 font-medium">Status</th>
            <th class="pb-3 pr-3 text-right font-medium">Amount</th>
            <th class="pb-3 text-right font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="cursor-pointer border-t border-admin-border transition-colors hover:bg-slate-50"
            @click="goToOrder(order.id)"
          >
            <td class="py-3 pr-3 font-mono text-xs text-admin-primary">
              {{ order.id.slice(0, 8) }}
            </td>
            <td class="max-w-40 truncate py-3 pr-3 text-admin-text">
              {{ order.customer_name !== 'Customer' ? order.customer_name : order.customer_email }}
            </td>
            <td class="py-3 pr-3">
              <AdminStatusBadge :status="order.status" size="sm" />
            </td>
            <td class="py-3 pr-3 text-right font-medium text-admin-text">
              {{ formatCurrency(order.total_amount * 100) }}
            </td>
            <td class="whitespace-nowrap py-3 text-right text-admin-text-secondary">
              {{ formatRelativeTime(order.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import { formatCurrency, formatRelativeTime } from '@/admin/utils/formatters'
import type { RecentOrder } from '@/admin/types/admin'

defineProps<{
  orders: RecentOrder[]
}>()

const router = useRouter()

function goToOrder(id: string): void {
  router.push(`/admin/orders/${id}`)
}
</script>
