<template>
  <div class="space-y-6">
    <div v-if="canWrite && nextStatuses.length > 0" class="rounded-xl border border-admin-border bg-white p-5">
      <h3 class="font-semibold text-slate-900">Update Status</h3>
      <p class="mt-1 text-sm text-admin-text-secondary">
        Current status: <span class="font-medium capitalize text-slate-900">{{ order.status }}</span>
      </p>
      <form class="mt-4 space-y-3" @submit.prevent="handleStatusUpdate">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-new-status">New Status</label>
          <select id="order-new-status" v-model="statusForm.status" :class="inputClass">
            <option value="" disabled>Select new status</option>
            <option v-for="s in nextStatuses" :key="s" :value="s" class="capitalize">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-status-notes">Notes (optional)</label>
          <textarea
            id="order-status-notes"
            v-model="statusForm.notes"
            rows="2"
            placeholder="Add a note for this status change..."
            :class="inputClass"
          />
        </div>
        <div v-if="statusForm.status === 'shipped'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-tracking">Tracking Number</label>
            <input
              id="order-tracking"
              v-model="statusForm.tracking_number"
              type="text"
              placeholder="e.g. TRK123456"
              :class="inputClass"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-carrier">Carrier</label>
            <input
              id="order-carrier"
              v-model="statusForm.carrier"
              type="text"
              placeholder="e.g. Delhivery"
              :class="inputClass"
            />
          </div>
        </div>
        <p v-if="statusError" class="text-sm text-red-600">{{ statusError }}</p>
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="updatingStatus || !statusForm.status"
            class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {{ updatingStatus ? 'Updating...' : 'Update Status' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="canRefund && showRefund" class="rounded-xl border border-admin-border bg-white p-5">
      <h3 class="font-semibold text-slate-900">Issue Refund</h3>
      <p class="mt-1 text-sm text-admin-text-secondary">
        Max refundable: <span class="font-medium text-slate-900">{{ formatCurrency(maxRefundable * 100) }}</span>
      </p>
      <form class="mt-4 space-y-3" @submit.prevent="askRefund">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-refund-amount">Amount (₹)</label>
          <input
            id="order-refund-amount"
            v-model.number="refundForm.amount"
            type="number"
            min="1"
            :max="maxRefundable"
            step="0.01"
            placeholder="Enter refund amount"
            :class="inputClass"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-refund-reason">Reason</label>
          <textarea
            id="order-refund-reason"
            v-model="refundForm.reason"
            rows="2"
            placeholder="Reason for refund..."
            :class="inputClass"
          />
        </div>
        <p v-if="refundError" class="text-sm text-red-600">{{ refundError }}</p>
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="issuingRefund"
            class="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {{ issuingRefund ? 'Processing...' : 'Issue Refund' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="canCancel && isCancellable" class="rounded-xl border border-red-200 bg-white p-5">
      <h3 class="font-semibold text-slate-900">Cancel Order</h3>
      <p class="mt-1 text-sm text-admin-text-secondary">Cancelling this order cannot be undone.</p>
      <form class="mt-4 space-y-3" @submit.prevent="askCancel">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="order-cancel-reason">Reason</label>
          <textarea
            id="order-cancel-reason"
            v-model="cancelReason"
            rows="2"
            placeholder="Reason for cancellation..."
            :class="inputClass"
          />
        </div>
        <p v-if="cancelError" class="text-sm text-red-600">{{ cancelError }}</p>
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="cancelling"
            class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {{ cancelling ? 'Cancelling...' : 'Cancel Order' }}
          </button>
        </div>
      </form>
    </div>

    <AdminConfirmDialog
      v-model:visible="refundConfirmVisible"
      title="Issue refund"
      :message="`Are you sure you want to refund ${formatCurrency((refundForm.amount || 0) * 100)} for this order?`"
      confirm-label="Issue Refund"
      :danger="true"
      @confirm="handleRefund"
    />
    <AdminConfirmDialog
      v-model:visible="cancelConfirmVisible"
      title="Cancel order"
      message="Are you sure you want to cancel this order? This action cannot be undone."
      confirm-label="Cancel Order"
      :danger="true"
      @confirm="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import { NEXT_STATUS_MAP } from '@/admin/utils/orderTransitions'
import { formatCurrency } from '@/admin/utils/formatters'
import type { OrderDetail, OrderStatus, SuccessResponse } from '@/admin/types/admin'

const props = defineProps<{
  order: OrderDetail
}>()

const emit = defineEmits<{
  (e: 'statusUpdated'): void
  (e: 'refundIssued'): void
  (e: 'orderCancelled'): void
}>()

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary'

const toast = useToast()
const { hasPermission } = useAdminAuth()

const canWrite = computed(() => hasPermission('orders.write'))
const canRefund = computed(() => hasPermission('orders.refund'))
const canCancel = computed(() => hasPermission('orders.cancel'))

const nextStatuses = computed<OrderStatus[]>(() => NEXT_STATUS_MAP[props.order.status] ?? [])

const showRefund = computed(
  () => props.order.payment?.status === 'completed' || props.order.payment?.status === 'partially_refunded',
)

const isCancellable = computed(
  () => !['delivered', 'cancelled', 'refunded'].includes(props.order.status),
)

const maxRefundable = computed(() => {
  const refunded = (props.order.refunds || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  return Math.max(0, (props.order.total_amount || 0) - refunded)
})

const statusForm = reactive({
  status: '' as '' | OrderStatus,
  notes: '',
  tracking_number: '',
  carrier: '',
})
const updatingStatus = ref(false)
const statusError = ref<string | null>(null)

const refundForm = reactive({
  amount: null as number | null,
  reason: '',
})
const issuingRefund = ref(false)
const refundError = ref<string | null>(null)
const refundConfirmVisible = ref(false)

const cancelReason = ref('')
const cancelling = ref(false)
const cancelError = ref<string | null>(null)
const cancelConfirmVisible = ref(false)

function resetStatusForm(): void {
  statusForm.status = ''
  statusForm.notes = ''
  statusForm.tracking_number = ''
  statusForm.carrier = ''
}

async function handleStatusUpdate(): Promise<void> {
  if (!statusForm.status) return
  updatingStatus.value = true
  statusError.value = null
  try {
    const body: Record<string, string> = { status: statusForm.status }
    if (statusForm.notes.trim()) body.notes = statusForm.notes.trim()
    if (statusForm.status === 'shipped') {
      if (statusForm.tracking_number.trim()) body.tracking_number = statusForm.tracking_number.trim()
      if (statusForm.carrier.trim()) body.carrier = statusForm.carrier.trim()
    }
    const data = await adminApi.put<SuccessResponse>(`/api/admin/orders/${props.order.id}/status`, body)
    toast.add({ severity: 'success', summary: 'Status updated', detail: data.message || 'Order status updated', life: 3000 })
    resetStatusForm()
    emit('statusUpdated')
  } catch (err) {
    statusError.value = err instanceof Error ? err.message : 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

function askRefund(): void {
  refundError.value = null
  if (refundForm.amount == null || isNaN(refundForm.amount) || refundForm.amount <= 0) {
    refundError.value = 'Enter a valid refund amount greater than zero.'
    return
  }
  if (refundForm.amount > maxRefundable.value) {
    refundError.value = `Amount cannot exceed ${formatCurrency(maxRefundable.value * 100)}.`
    return
  }
  if (!refundForm.reason.trim()) {
    refundError.value = 'A reason is required to issue a refund.'
    return
  }
  refundConfirmVisible.value = true
}

async function handleRefund(): Promise<void> {
  if (refundForm.amount == null) return
  issuingRefund.value = true
  refundError.value = null
  try {
    const data = await adminApi.post<SuccessResponse>(`/api/admin/orders/${props.order.id}/refund`, {
      amount: refundForm.amount,
      reason: refundForm.reason.trim(),
    })
    toast.add({ severity: 'success', summary: 'Refund issued', detail: data.message || 'Refund processed', life: 3000 })
    refundForm.amount = null
    refundForm.reason = ''
    emit('refundIssued')
  } catch (err) {
    refundError.value = err instanceof Error ? err.message : 'Failed to issue refund'
  } finally {
    issuingRefund.value = false
  }
}

function askCancel(): void {
  cancelError.value = null
  if (!cancelReason.value.trim()) {
    cancelError.value = 'A reason is required to cancel the order.'
    return
  }
  cancelConfirmVisible.value = true
}

async function handleCancel(): Promise<void> {
  cancelling.value = true
  cancelError.value = null
  try {
    const data = await adminApi.post<SuccessResponse>(`/api/admin/orders/${props.order.id}/cancel`, {
      reason: cancelReason.value.trim(),
    })
    toast.add({ severity: 'success', summary: 'Order cancelled', detail: data.message || 'Order cancelled', life: 3000 })
    cancelReason.value = ''
    emit('orderCancelled')
  } catch (err) {
    cancelError.value = err instanceof Error ? err.message : 'Failed to cancel order'
  } finally {
    cancelling.value = false
  }
}
</script>
