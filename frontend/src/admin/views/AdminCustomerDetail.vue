<template>
  <div class="space-y-6">
    <Toast />

    <!-- Navigation & Header -->
    <div>
      <router-link
        to="/admin/customers"
        class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-admin-text-secondary transition-colors hover:text-admin-primary"
      >
        <i class="pi pi-arrow-left text-xs" aria-hidden="true" />
        Back to Customers
      </router-link>

      <AdminPageHeader
        :title="customerName ? `Customer: ${customerName}` : 'Customer Detail'"
        :breadcrumbs="breadcrumbs"
      />
    </div>

    <!-- Error State -->
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500" aria-hidden="true" />
      <h3 class="mt-3 text-lg font-semibold text-slate-900">Failed to load customer profile</h3>
      <p class="mt-1 text-sm text-slate-600">{{ error }}</p>
      <div class="mt-4 flex justify-center gap-3">
        <router-link
          to="/admin/customers"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Return to directory
        </router-link>
        <button
          type="button"
          class="rounded-lg bg-admin-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-admin-primary-hover"
          @click="fetchCustomerDetail"
        >
          Try again
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading && !detailData" class="space-y-6">
      <div class="h-32 animate-pulse rounded-xl border border-admin-border bg-white p-6" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="n in 6" :key="n" class="h-24 animate-pulse rounded-xl border border-admin-border bg-white p-4" />
      </div>
      <div class="h-64 animate-pulse rounded-xl border border-admin-border bg-white p-6" />
    </div>

    <!-- Detail View -->
    <div v-else-if="detailData" class="space-y-6">
      <!-- Profile Header -->
      <CustomerProfileHeader
        :customer="detailData.customer"
        :loading="loading"
        :toggling="togglingStatus"
        @toggle-status="openToggleConfirm"
        @edit-phone="showEditPhoneModal = true"
        @delete-customer="openDeleteConfirm"
      />

      <!-- Stats Cards -->
      <CustomerStatsCards
        :stats="detailData.stats"
        :loading="loading"
      />

      <!-- Tabs Navigation -->
      <div class="space-y-4">
        <div class="flex border-b border-admin-border">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="[
              'inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors focus:outline-none',
              activeTab === tab.id
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-admin-text-secondary hover:border-slate-300 hover:text-admin-text'
            ]"
            @click="activeTab = tab.id"
          >
            <i :class="[tab.icon, 'text-sm']" aria-hidden="true" />
            <span>{{ tab.label }}</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Tab Content -->
        <div>
          <!-- Orders Tab -->
          <div v-show="activeTab === 'orders'">
            <CustomerOrderHistory
              :orders="detailData.orders"
              :loading="loading"
            />
          </div>

          <!-- Addresses Tab -->
          <div v-show="activeTab === 'addresses'">
            <CustomerAddressList
              :addresses="detailData.addresses"
              :loading="loading"
            />
          </div>

          <!-- Reviews Tab -->
          <div v-show="activeTab === 'reviews'">
            <CustomerReviewList
              :reviews="detailData.reviews"
              :loading="loading"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modals & Confirmation Dialogs -->

    <!-- Edit Phone Modal -->
    <CustomerEditPhoneModal
      v-model:visible="showEditPhoneModal"
      :phone="detailData?.customer.phone_number || detailData?.customer.phone || ''"
      :saving="savingPhone"
      @save="handleSavePhone"
    />

    <!-- Status Toggle Confirm Dialog -->
    <AdminConfirmDialog
      v-model:visible="showStatusConfirm"
      :title="detailData?.customer.is_active ? 'Deactivate Customer' : 'Activate Customer'"
      :message="
        detailData?.customer.is_active
          ? 'Are you sure you want to deactivate this customer? The customer will no longer be able to log in or place orders.'
          : 'Are you sure you want to activate this customer account? The customer will regain full access to their account.'
      "
      :confirm-label="detailData?.customer.is_active ? 'Deactivate' : 'Activate'"
      :danger="detailData?.customer.is_active"
      @confirm="handleToggleStatus"
    />

    <!-- Delete Confirm Dialog -->
    <AdminConfirmDialog
      v-model:visible="showDeleteConfirm"
      title="Delete Customer Account"
      :message="`Are you sure you want to permanently delete customer ${detailData?.customer.email}? All associated addresses, reviews, and customer records will be permanently removed. This action cannot be undone.`"
      confirm-label="Delete Customer"
      :danger="true"
      @confirm="handleDeleteCustomer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import CustomerProfileHeader from '@/admin/components/customers/CustomerProfileHeader.vue'
import CustomerStatsCards from '@/admin/components/customers/CustomerStatsCards.vue'
import CustomerAddressList from '@/admin/components/customers/CustomerAddressList.vue'
import CustomerOrderHistory from '@/admin/components/customers/CustomerOrderHistory.vue'
import CustomerReviewList from '@/admin/components/customers/CustomerReviewList.vue'
import CustomerEditPhoneModal from '@/admin/components/customers/CustomerEditPhoneModal.vue'
import { adminApi } from '@/admin/api/adminApi'
import type { CustomerDetail } from '@/admin/types/admin'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const customerId = computed(() => route.params.id as string)

const loading = ref(false)
const error = ref<string | null>(null)
const detailData = ref<CustomerDetail | null>(null)

const activeTab = ref<'orders' | 'addresses' | 'reviews'>('orders')

const showEditPhoneModal = ref(false)
const savingPhone = ref(false)

const showStatusConfirm = ref(false)
const togglingStatus = ref(false)

const showDeleteConfirm = ref(false)
const deletingCustomer = ref(false)

const customerName = computed(() => {
  if (!detailData.value) return ''
  const c = detailData.value.customer
  if (c.name && c.name.trim()) return c.name
  if (c.first_name || c.last_name) {
    return [c.first_name, c.last_name].filter(Boolean).join(' ')
  }
  return c.email
})

const breadcrumbs = computed(() => [
  { label: 'Admin', to: '/admin' },
  { label: 'Customers', to: '/admin/customers' },
  { label: customerName.value || 'Customer Detail' },
])

const tabs = computed(() => [
  {
    id: 'orders' as const,
    label: 'Orders',
    icon: 'pi pi-shopping-bag',
    count: detailData.value?.orders?.length ?? 0,
  },
  {
    id: 'addresses' as const,
    label: 'Addresses',
    icon: 'pi pi-map-marker',
    count: detailData.value?.addresses?.length ?? 0,
  },
  {
    id: 'reviews' as const,
    label: 'Reviews',
    icon: 'pi pi-star',
    count: detailData.value?.reviews?.length ?? 0,
  },
])

async function fetchCustomerDetail(): Promise<void> {
  if (!customerId.value) return

  loading.value = true
  error.value = null

  try {
    const data = await adminApi.get<CustomerDetail>(`/api/admin/customers/${customerId.value}`)
    detailData.value = data
  } catch (err) {
    console.error('Failed to load customer profile:', err)
    error.value = (err as Error).message || 'Customer could not be found or failed to load.'
  } finally {
    loading.value = false
  }
}

function openToggleConfirm(): void {
  showStatusConfirm.value = true
}

async function handleToggleStatus(): Promise<void> {
  if (!customerId.value || togglingStatus.value) return

  togglingStatus.value = true
  try {
    const res = await adminApi.post<{
      success: boolean
      is_active: boolean
      message: string
      customer: CustomerDetail['customer']
    }>(`/api/admin/customers/${customerId.value}/toggle-status`)

    if (detailData.value) {
      detailData.value.customer.is_active = res.is_active
      detailData.value.customer.status = res.is_active ? 'ACTIVE' : 'DISABLED'
    }

    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: res.message || `Customer account has been ${res.is_active ? 'activated' : 'deactivated'}.`,
      life: 3000,
    })
  } catch (err) {
    console.error('Failed to toggle customer status:', err)
    toast.add({
      severity: 'error',
      summary: 'Action Failed',
      detail: (err as Error).message || 'Failed to update customer status.',
      life: 4000,
    })
  } finally {
    togglingStatus.value = false
  }
}

async function handleSavePhone(newPhone: string): Promise<void> {
  if (!customerId.value || savingPhone.value) return

  savingPhone.value = true
  try {
    const res = await adminApi.put<{
      success: boolean
      message: string
      customer: CustomerDetail['customer']
    }>(`/api/admin/customers/${customerId.value}`, {
      phone_number: newPhone || null,
    })

    if (detailData.value) {
      detailData.value.customer.phone_number = newPhone || null
      detailData.value.customer.phone = newPhone || null
    }

    showEditPhoneModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Phone Saved',
      detail: res.message || 'Phone number updated successfully.',
      life: 3000,
    })
  } catch (err) {
    console.error('Failed to update phone number:', err)
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: (err as Error).message || 'Failed to update phone number.',
      life: 4000,
    })
  } finally {
    savingPhone.value = false
  }
}

function openDeleteConfirm(): void {
  showDeleteConfirm.value = true
}

async function handleDeleteCustomer(): Promise<void> {
  if (!customerId.value || deletingCustomer.value) return

  deletingCustomer.value = true
  try {
    const res = await adminApi.delete<{
      success: boolean
      message: string
    }>(`/api/admin/customers/${customerId.value}`)

    toast.add({
      severity: 'success',
      summary: 'Customer Deleted',
      detail: res.message || 'Customer account was deleted.',
      life: 3000,
    })

    router.push('/admin/customers')
  } catch (err) {
    console.error('Failed to delete customer:', err)
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: (err as Error).message || 'Failed to delete customer account.',
      life: 4000,
    })
  } finally {
    deletingCustomer.value = false
  }
}

onMounted(() => {
  fetchCustomerDetail()
})
</script>