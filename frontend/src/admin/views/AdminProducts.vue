<template>
  <div>
    <Toast />
    <AdminPageHeader title="Products" :breadcrumbs="breadcrumbs">
      <template #actions>
        <router-link
          v-if="canWrite"
          to="/admin/products/new"
          class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <i class="pi pi-plus mr-2 text-xs" aria-hidden="true" />Add Product
        </router-link>
      </template>
    </AdminPageHeader>

    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <AdminSearchBar
        v-model="searchQuery"
        placeholder="Search products by name, slug, description..."
        class="w-full lg:max-w-sm"
      />
      <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-1 sm:items-center lg:justify-end">
        <select v-model="categoryFilter" aria-label="Filter by category" :class="filterClass">
          <option value="">All Categories</option>
          <option v-for="item in lookups?.categories ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
        <select v-model="brandFilter" aria-label="Filter by brand" :class="filterClass">
          <option value="">All Brands</option>
          <option v-for="item in lookups?.brands ?? []" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
        <select v-model="listingTypeFilter" aria-label="Filter by listing type" :class="filterClass">
          <option value="">All Types</option>
          <option value="category">Category</option>
          <option value="space">Space</option>
          <option value="style">Style</option>
        </select>
        <select v-model="sortFilter" aria-label="Sort products" :class="filterClass">
          <option value="">Sort: Default</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
          <option value="rating">Top Rated</option>
          <option value="popularity">Most Popular</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-admin-border bg-white p-8 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <p class="mt-3 font-medium text-admin-text">Failed to load products</p>
      <p class="mt-1 text-sm text-admin-text-secondary">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="fetchProducts"
      >
        Retry
      </button>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <th class="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate="isIndeterminate"
                  aria-label="Select all products on this page"
                  class="h-4 w-4 rounded accent-blue-600"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-4 py-3 font-medium">Product</th>
              <th class="px-4 py-3 font-medium">Brand</th>
              <th class="px-4 py-3 font-medium">Price</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Taxonomy</th>
              <th class="px-4 py-3 font-medium">Rating</th>
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
          <tbody v-else-if="products.length === 0">
            <tr>
              <td colspan="8" class="px-4 py-4">
                <AdminEmptyState
                  title="No products found"
                  description="Add your first product or adjust your filters"
                  icon="pi pi-box"
                >
                  <template #action>
                    <router-link
                      v-if="canWrite"
                      to="/admin/products/new"
                      class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <i class="pi pi-plus mr-2 text-xs" aria-hidden="true" />Add Product
                    </router-link>
                  </template>
                </AdminEmptyState>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr
              v-for="product in products"
              :key="product.id"
              class="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
            >
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  :checked="isSelected(product.id)"
                  :aria-label="`Select ${product.name}`"
                  class="h-4 w-4 rounded accent-blue-600"
                  @change="toggleSelect(product.id)"
                />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <img
                    v-if="product.primary_image?.src"
                    :src="product.primary_image.src"
                    :alt="product.primary_image.alt || product.name"
                    class="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <i class="pi pi-image text-slate-400" aria-hidden="true" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-medium text-slate-900">{{ product.name }}</p>
                    <p class="truncate font-mono text-xs text-slate-400">{{ product.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-700">{{ product.brand?.name ?? '-' }}</td>
              <td class="px-4 py-3 font-medium whitespace-nowrap text-slate-900">
                {{ formatCurrency(product.price_cents) }}
              </td>
              <td class="px-4 py-3">
                <AdminStatusBadge :status="product.listing_type" size="sm" />
              </td>
              <td class="px-4 py-3 text-slate-700">{{ taxonomyName(product) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-700">
                <i class="pi pi-star-fill mr-1 text-xs text-amber-400" aria-hidden="true" />
                {{ formatRating(product.rating) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <router-link
                    v-if="canWrite"
                    :to="`/admin/products/${product.id}/edit`"
                    class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <i class="pi pi-pencil mr-1 text-xs" aria-hidden="true" />Edit
                  </router-link>
                  <button
                    v-if="canDelete"
                    type="button"
                    aria-label="Delete product"
                    class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                    @click="askDelete(product)"
                  >
                    <i class="pi pi-trash text-sm" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && products.length > 0" class="px-4 pb-4">
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

    <div
      v-if="selectedIds.length > 0"
      class="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-white shadow-xl"
    >
      <span class="text-sm font-medium">{{ selectedIds.length }} item(s) selected</span>
      <button
        v-if="canBulk"
        type="button"
        :disabled="bulkDeleting"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        @click="askBulkDelete"
      >
        {{ bulkDeleting ? 'Deleting...' : 'Delete Selected' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
        @click="clearSelection"
      >
        Clear Selection
      </button>
    </div>

    <AdminConfirmDialog
      v-model:visible="confirmVisible"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-label="Delete"
      :danger="true"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import AdminPagination from '@/admin/components/shared/AdminPagination.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import { adminApi } from '@/admin/api/adminApi'
import { usePagination } from '@/admin/composables/usePagination'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import { formatCurrency } from '@/admin/utils/formatters'
import type {
  Product,
  ProductListResponse,
  ProductLookups,
  SuccessResponse,
} from '@/admin/types/admin'

const breadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Products' },
]

const filterClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary sm:w-auto'

const toast = useToast()
const { hasPermission } = useAdminAuth()
const canWrite = computed(() => hasPermission('products.write'))
const canDelete = computed(() => hasPermission('products.delete'))
const canBulk = computed(() => hasPermission('products.bulk'))

const { page, limit, total, totalPages, setTotal, resetPage } = usePagination(25)

const products = ref<Product[]>([])
const lookups = ref<ProductLookups | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const categoryFilter = ref<string | number>('')
const brandFilter = ref<string | number>('')
const listingTypeFilter = ref('')
const sortFilter = ref('')

const selectedIds = ref<number[]>([])

const confirmVisible = ref(false)
const confirmTitle = ref('Delete product')
const confirmMessage = ref('')
const pendingDeleteId = ref<number | null>(null)
const pendingBulk = ref(false)
const bulkDeleting = ref(false)

const allSelected = computed(
  () => products.value.length > 0 && products.value.every((p) => selectedIds.value.includes(p.id)),
)
const isIndeterminate = computed(
  () => !allSelected.value && products.value.some((p) => selectedIds.value.includes(p.id)),
)

function isSelected(id: number): boolean {
  return selectedIds.value.includes(id)
}

function toggleSelect(id: number): void {
  selectedIds.value = isSelected(id)
    ? selectedIds.value.filter((selected) => selected !== id)
    : [...selectedIds.value, id]
}

function toggleSelectAll(): void {
  selectedIds.value = allSelected.value ? [] : products.value.map((p) => p.id)
}

function clearSelection(): void {
  selectedIds.value = []
}

function taxonomyName(product: Product): string {
  if (product.listing_type === 'space') return product.space?.name ?? '-'
  if (product.listing_type === 'style') return product.style?.name ?? '-'
  return product.category?.name ?? '-'
}

function formatRating(rating: number | null | undefined): string {
  if (rating == null || isNaN(rating)) return '-'
  return String(rating)
}

function onLimitChange(value: number): void {
  limit.value = value
  if (page.value === 1) {
    fetchProducts()
  } else {
    resetPage()
  }
}

async function fetchLookups(): Promise<void> {
  try {
    lookups.value = await adminApi.get<ProductLookups>('/api/admin/products/lookups')
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Lookups unavailable',
      detail: 'Filter options could not be loaded.',
      life: 3000,
    })
  }
}

async function fetchProducts(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: limit.value,
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (categoryFilter.value !== '') params.category = categoryFilter.value
    if (brandFilter.value !== '') params.brand = brandFilter.value
    if (listingTypeFilter.value) params.listing_type = listingTypeFilter.value
    if (sortFilter.value) params.sort = sortFilter.value
    const data = await adminApi.get<ProductListResponse>('/api/admin/products', params)
    products.value = data.products ?? []
    setTotal(data.pagination?.total ?? 0)
    selectedIds.value = selectedIds.value.filter((id) => products.value.some((p) => p.id === id))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

function askDelete(product: Product): void {
  pendingDeleteId.value = product.id
  pendingBulk.value = false
  confirmTitle.value = 'Delete product'
  confirmMessage.value = `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
  confirmVisible.value = true
}

function askBulkDelete(): void {
  pendingDeleteId.value = null
  pendingBulk.value = true
  confirmTitle.value = 'Delete selected products'
  confirmMessage.value = `Are you sure you want to delete ${selectedIds.value.length} selected product(s)? This action cannot be undone.`
  confirmVisible.value = true
}

async function handleConfirmDelete(): Promise<void> {
  if (pendingBulk.value) {
    await deleteSelected()
  } else if (pendingDeleteId.value !== null) {
    await deleteSingle(pendingDeleteId.value)
  }
  pendingDeleteId.value = null
  pendingBulk.value = false
}

async function deleteSingle(id: number): Promise<void> {
  try {
    const data = await adminApi.delete<SuccessResponse>(`/api/admin/products/${id}`)
    toast.add({ severity: 'success', summary: 'Deleted', detail: data.message || 'Product deleted', life: 3000 })
    clearSelection()
    await fetchProducts()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Delete failed',
      detail: err instanceof Error ? err.message : 'Something went wrong',
      life: 4000,
    })
  }
}

async function deleteSelected(): Promise<void> {
  bulkDeleting.value = true
  try {
    const data = await adminApi.post<SuccessResponse>('/api/admin/products/bulk', {
      action: 'delete',
      product_ids: selectedIds.value,
    })
    toast.add({ severity: 'success', summary: 'Deleted', detail: data.message || 'Products deleted', life: 3000 })
    clearSelection()
    await fetchProducts()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Bulk delete failed',
      detail: err instanceof Error ? err.message : 'Something went wrong',
      life: 4000,
    })
  } finally {
    bulkDeleting.value = false
  }
}

watch([searchQuery, categoryFilter, brandFilter, listingTypeFilter, sortFilter], () => {
  if (page.value === 1) {
    fetchProducts()
  } else {
    resetPage()
  }
})

watch(page, fetchProducts)

onMounted(async () => {
  await fetchLookups()
  await fetchProducts()
})
</script>
