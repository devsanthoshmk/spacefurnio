<template>
  <div>
    <Toast />
    <AdminPageHeader :title="pageTitle" :breadcrumbs="breadcrumbs">
      <template v-if="order" #actions>
        <AdminStatusBadge :status="order.status" />
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="space-y-6">
      <div class="animate-pulse rounded-xl border border-admin-border bg-white p-5">
        <div class="h-6 w-48 rounded bg-slate-100" />
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="n in 6" :key="n" class="h-10 rounded bg-slate-100" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="animate-pulse rounded-xl border border-admin-border bg-white p-5 lg:col-span-2">
          <div class="h-6 w-40 rounded bg-slate-100" />
          <div class="mt-4 space-y-3">
            <div v-for="n in 3" :key="n" class="h-14 rounded bg-slate-100" />
          </div>
        </div>
        <div class="space-y-6">
          <div class="animate-pulse rounded-xl border border-admin-border bg-white p-5">
            <div class="h-6 w-32 rounded bg-slate-100" />
            <div class="mt-4 h-20 rounded bg-slate-100" />
          </div>
          <div class="animate-pulse rounded-xl border border-admin-border bg-white p-5">
            <div class="h-6 w-32 rounded bg-slate-100" />
            <div class="mt-4 h-20 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="rounded-xl border border-admin-border bg-white p-8 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <p class="mt-3 font-medium text-admin-text">Failed to load order</p>
      <p class="mt-1 text-sm text-admin-text-secondary">{{ error }}</p>
      <div class="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          @click="fetchOrder"
        >
          Retry
        </button>
        <router-link
          to="/admin/orders"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Back to Orders
        </router-link>
      </div>
    </div>

    <div v-else-if="order" class="space-y-6">
      <div class="rounded-xl border border-admin-border bg-white p-5">
        <h2 class="font-semibold text-slate-900">Order Summary</h2>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Order ID</p>
            <p class="mt-1 font-mono text-xs break-all text-slate-900">{{ order.id }}</p>
          </div>
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Created</p>
            <p class="mt-1 text-sm font-medium text-slate-900">{{ formatDateTime(order.created_at) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Customer Email</p>
            <p class="mt-1 text-sm font-medium break-all text-slate-900">{{ order.customer?.email || 'Guest' }}</p>
          </div>
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Total Amount</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">{{ formatCurrency((order.total_amount || 0) * 100) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Payment</p>
            <p v-if="order.payment" class="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
              <span class="uppercase">{{ order.payment.method }}</span>
              <AdminStatusBadge :status="order.payment.status" size="sm" />
            </p>
            <p v-else class="mt-1 text-sm text-admin-text-muted">-</p>
          </div>
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Shipment</p>
            <p v-if="order.shipment" class="mt-1 text-sm font-medium text-slate-900">
              {{ order.shipment.status }}
              <span v-if="order.shipment.tracking_number" class="font-mono text-xs text-slate-500">
                ({{ order.shipment.tracking_number }})
              </span>
            </p>
            <p v-else class="mt-1 text-sm text-admin-text-muted">-</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-admin-border bg-white p-5">
        <h2 class="mb-4 font-semibold text-slate-900">Status Timeline</h2>
        <OrderStatusTimeline :history="order.statusHistory || []" />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="rounded-xl border border-admin-border bg-white p-5 lg:col-span-2">
          <h2 class="mb-4 font-semibold text-slate-900">Order Items ({{ (order.items || []).length }})</h2>
          <OrderItemsTable :items="order.items || []" />
        </div>

        <div class="space-y-6">
          <div class="rounded-xl border border-admin-border bg-white p-5">
            <OrderShippingCard
              :shipping="order.shipping"
              :editable="canWriteShipping"
              :saving="savingShipping"
              @save="handleShippingSave"
            />
          </div>
          <div class="rounded-xl border border-admin-border bg-white p-5">
            <h3 class="mb-4 font-semibold text-slate-900">Payment Info</h3>
            <dl v-if="order.payment" class="space-y-2.5 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Method</dt>
                <dd class="font-medium uppercase text-slate-900">{{ order.payment.method }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Status</dt>
                <dd><AdminStatusBadge :status="order.payment.status" size="sm" /></dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Amount</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency((order.total_amount || 0) * 100) }}</dd>
              </div>
            </dl>
            <p v-else class="text-sm text-admin-text-muted">No payment information available</p>
          </div>
        </div>
      </div>

      <OrderActionsPanel
        :order="order"
        @status-updated="fetchOrder"
        @refund-issued="fetchOrder"
        @order-cancelled="fetchOrder"
      />

      <div v-if="(order.refunds || []).length > 0" class="rounded-xl border border-admin-border bg-white p-5">
        <h2 class="mb-4 font-semibold text-slate-900">Refunds ({{ (order.refunds || []).length }})</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <th class="px-4 py-3 font-medium">Refund ID</th>
                <th class="px-4 py-3 text-right font-medium">Amount</th>
                <th class="px-4 py-3 font-medium">Reason</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="refund in (order.refunds || [])"
                :key="refund.id"
                class="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-mono text-xs text-slate-900">{{ refund.id.slice(0, 8) }}</td>
                <td class="px-4 py-3 text-right font-medium whitespace-nowrap text-slate-900">
                  {{ formatCurrency(refund.amount * 100) }}
                </td>
                <td class="px-4 py-3 text-slate-700">{{ refund.reason ?? '-' }}</td>
                <td class="px-4 py-3">
                  <AdminStatusBadge :status="refund.status" size="sm" />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatDateTime(refund.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import OrderStatusTimeline from '@/admin/components/orders/OrderStatusTimeline.vue'
import OrderItemsTable from '@/admin/components/orders/OrderItemsTable.vue'
import OrderShippingCard, { type ShippingFormData } from '@/admin/components/orders/OrderShippingCard.vue'
import OrderActionsPanel from '@/admin/components/orders/OrderActionsPanel.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import { formatCurrency, formatDateTime } from '@/admin/utils/formatters'
import type { OrderDetail, SuccessResponse } from '@/admin/types/admin'

const route = useRoute()
const toast = useToast()
const { hasPermission } = useAdminAuth()

const orderId = computed(() => route.params.id as string)
const shortId = computed(() => (orderId.value ? orderId.value.slice(0, 8) : ''))

const pageTitle = computed(() => (order.value ? `Order #${order.value.id.slice(0, 8)}` : 'Order Detail'))
const breadcrumbs = computed(() => [
  { label: 'Admin', to: '/admin' },
  { label: 'Orders', to: '/admin/orders' },
  { label: shortId.value ? `#${shortId.value}` : 'Detail' },
])

const canWriteShipping = computed(() => hasPermission('orders.write'))

const order = ref<OrderDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const savingShipping = ref(false)

async function fetchOrder(): Promise<void> {
  if (!orderId.value) {
    error.value = 'Missing order ID'
    return
  }
  loading.value = true
  error.value = null
  try {
    const data = await adminApi.get<OrderDetail | { order: OrderDetail }>(`/api/admin/orders/${orderId.value}`)
    order.value = (data as { order?: OrderDetail }).order ?? (data as OrderDetail)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

async function handleShippingSave(payload: ShippingFormData): Promise<void> {
  if (!order.value) return
  savingShipping.value = true
  try {
    const data = await adminApi.put<SuccessResponse>(`/api/admin/orders/${order.value.id}/shipping`, payload)
    toast.add({ severity: 'success', summary: 'Saved', detail: data.message || 'Shipping info updated', life: 3000 })
    await fetchOrder()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: err instanceof Error ? err.message : 'Something went wrong',
      life: 4000,
    })
  } finally {
    savingShipping.value = false
  }
}

watch(orderId, fetchOrder)

onMounted(fetchOrder)
</script>
