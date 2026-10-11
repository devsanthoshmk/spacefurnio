<template>
  <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div v-for="n in 2" :key="n" class="h-36 animate-pulse rounded-xl border border-admin-border bg-white p-5" />
  </div>

  <div v-else-if="!addresses || addresses.length === 0" class="rounded-xl border border-admin-border bg-white p-8">
    <AdminEmptyState
      title="No saved addresses"
      description="This customer does not have any saved delivery addresses."
      icon="pi pi-map-marker"
    />
  </div>

  <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      v-for="address in addresses"
      :key="address.id"
      class="relative flex flex-col justify-between rounded-xl border border-admin-border bg-white p-5 shadow-sm transition-all hover:border-slate-300"
    >
      <div>
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <i class="pi pi-map-marker text-sm" aria-hidden="true" />
            </div>
            <span class="font-medium text-admin-text">Delivery Address</span>
          </div>

          <span
            v-if="address.is_default"
            class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
          >
            <i class="pi pi-check text-[10px]" aria-hidden="true" />
            Default Address
          </span>
        </div>

        <div class="space-y-1 text-sm text-admin-text-secondary">
          <p class="font-medium text-admin-text">{{ address.address_line_1 }}</p>
          <p v-if="address.address_line_2">{{ address.address_line_2 }}</p>
          <p>{{ address.city }}, {{ address.state }} {{ address.postal_code }}</p>
          <p class="text-xs text-admin-text-muted">{{ address.country }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import type { CustomerAddress } from '@/admin/types/admin'

withDefaults(
  defineProps<{
    addresses: CustomerAddress[]
    loading?: boolean
  }>(),
  { loading: false },
)
</script>