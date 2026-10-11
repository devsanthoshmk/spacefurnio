<template>
  <div class="rounded-xl border border-admin-border bg-white p-6 shadow-sm">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Avatar Circle -->
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-admin-primary text-xl font-bold text-white shadow-sm"
          :aria-label="displayName"
        >
          {{ initials }}
        </div>

        <!-- Details -->
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-2xl font-bold text-admin-text">{{ displayName }}</h2>
            <AdminStatusBadge :status="customer.status || (customer.is_active ? 'ACTIVE' : 'DISABLED')" size="sm" />
            <span
              v-if="customer.segment"
              :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', segmentBadgeClass]"
            >
              {{ customer.segment }}
            </span>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-admin-text-secondary">
            <span class="inline-flex items-center gap-1.5">
              <i class="pi pi-envelope text-xs text-admin-text-muted" aria-hidden="true" />
              <a :href="`mailto:${customer.email}`" class="hover:text-admin-primary transition-colors">
                {{ customer.email }}
              </a>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <i class="pi pi-phone text-xs text-admin-text-muted" aria-hidden="true" />
              <span>{{ formattedPhone }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <i class="pi pi-calendar text-xs text-admin-text-muted" aria-hidden="true" />
              <span>Joined {{ formatDate(customer.created_at) }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          v-if="hasPermission('customers.write')"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-admin-primary"
          @click="emit('editPhone')"
        >
          <i class="pi pi-phone text-xs" aria-hidden="true" />
          Edit Phone
        </button>

        <button
          v-if="hasPermission('customers.write')"
          type="button"
          :disabled="toggling"
          :class="[
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            customer.is_active
              ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-400'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-400'
          ]"
          @click="emit('toggleStatus')"
        >
          <i :class="[toggling ? 'pi pi-spin pi-spinner' : (customer.is_active ? 'pi pi-ban' : 'pi pi-check-circle'), 'text-xs']" aria-hidden="true" />
          {{ customer.is_active ? 'Deactivate Account' : 'Activate Account' }}
        </button>

        <button
          v-if="hasPermission('customers.delete')"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="emit('deleteCustomer')"
        >
          <i class="pi pi-trash text-xs" aria-hidden="true" />
          Delete Customer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import { formatDate, formatPhone } from '@/admin/utils/formatters'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import type { Customer, CustomerDetail } from '@/admin/types/admin'

const props = withDefaults(
  defineProps<{
    customer: CustomerDetail['customer'] | Customer
    loading?: boolean
    toggling?: boolean
  }>(),
  { loading: false, toggling: false },
)

const emit = defineEmits<{
  (e: 'toggleStatus'): void
  (e: 'editPhone'): void
  (e: 'deleteCustomer'): void
}>()

const { hasPermission } = useAdminAuth()

const displayName = computed(() => {
  if (props.customer.name && props.customer.name.trim()) return props.customer.name
  if (props.customer.first_name || props.customer.last_name) {
    return [props.customer.first_name, props.customer.last_name].filter(Boolean).join(' ')
  }
  return props.customer.email.split('@')[0]
})

const initials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const formattedPhone = computed(() => {
  const phone = 'phone_number' in props.customer && props.customer.phone_number ? props.customer.phone_number : props.customer.phone
  return phone ? formatPhone(phone) : 'No phone provided'
})

const segmentBadgeClass = computed(() => {
  const segment = (props.customer.segment || '').toLowerCase()
  if (segment.includes('high') || segment === 'high_value') {
    return 'bg-purple-100 text-purple-700 border-purple-200'
  }
  if (segment.includes('return') || segment === 'returning') {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (segment.includes('new') || segment === 'new') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  if (segment.includes('no') || segment === 'no_orders') {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }
  return 'bg-slate-100 text-slate-600 border-slate-200'
})
</script>