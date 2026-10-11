<template>
  <div>
    <Toast />

    <div class="sticky top-0 z-30 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-admin-bg/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
      <nav aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1 text-sm text-admin-text-secondary">
          <li><router-link to="/admin" class="transition-colors hover:text-admin-primary">Admin</router-link></li>
          <li><span class="text-admin-text-muted" aria-hidden="true">&gt;</span></li>
          <li><router-link to="/admin/products" class="transition-colors hover:text-admin-primary">Products</router-link></li>
          <li><span class="text-admin-text-muted" aria-hidden="true">&gt;</span></li>
          <li><span aria-current="page">{{ pageTitle }}</span></li>
        </ol>
      </nav>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          @click="goBack"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="saving || loadingProduct"
          class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="saveProduct"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <AdminPageHeader :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <div v-if="loadingProduct" class="space-y-4">
      <div v-for="n in 3" :key="n" class="rounded-xl border border-admin-border bg-white p-5">
        <div class="h-6 w-40 animate-pulse rounded bg-slate-100" />
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div class="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div class="h-10 animate-pulse rounded-lg bg-slate-100 md:col-span-2" />
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-admin-border bg-white p-8 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <p class="mt-3 font-medium text-admin-text">Failed to load product</p>
      <p class="mt-1 text-sm text-admin-text-secondary">{{ loadError }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="loadInitialData"
      >
        Retry
      </button>
    </div>

    <form v-else class="space-y-4" @submit.prevent="saveProduct">
      <ProductBasicInfo v-model="form" :lookups="lookups" :errors="errors" />

      <ProductImageEditor v-model="form.images" />

      <ProductColorEditor v-model="form.colors" :colors="lookups?.colors ?? []" />

      <section class="rounded-xl border border-admin-border bg-white p-5">
        <button
          type="button"
          class="flex w-full items-center justify-between"
          :aria-expanded="metadataOpen"
          @click="metadataOpen = !metadataOpen"
        >
          <h2 class="text-base font-semibold text-admin-text">Metadata</h2>
          <i
            :class="['pi text-sm text-slate-500 transition-transform', metadataOpen ? 'pi-chevron-up' : 'pi-chevron-down']"
            aria-hidden="true"
          />
        </button>

        <div v-if="metadataOpen" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label for="product-rating" class="mb-1.5 block text-sm font-medium text-slate-700">
              Rating (0-5)
            </label>
            <input
              id="product-rating"
              v-model.number="form.rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              :class="inputClass"
            />
          </div>
          <div>
            <label for="product-review-count" class="mb-1.5 block text-sm font-medium text-slate-700">
              Review Count
            </label>
            <input
              id="product-review-count"
              v-model.number="form.review_count"
              type="number"
              min="0"
              step="1"
              :class="inputClass"
            />
          </div>
          <div>
            <label for="product-popularity" class="mb-1.5 block text-sm font-medium text-slate-700">
              Popularity (0-100)
            </label>
            <input
              id="product-popularity"
              v-model.number="form.popularity"
              type="number"
              min="0"
              max="100"
              step="1"
              :class="inputClass"
            />
          </div>
          <div>
            <label for="product-href" class="mb-1.5 block text-sm font-medium text-slate-700">
              Href
            </label>
            <input
              id="product-href"
              v-model="form.href"
              type="text"
              placeholder="/shop/..."
              :class="inputClass"
            />
          </div>
        </div>
      </section>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import ProductBasicInfo from '@/admin/components/products/ProductBasicInfo.vue'
import ProductImageEditor from '@/admin/components/products/ProductImageEditor.vue'
import ProductColorEditor from '@/admin/components/products/ProductColorEditor.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import type {
  Product,
  ProductFormData,
  ProductLookups,
  SuccessResponse,
} from '@/admin/types/admin'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { hasPermission } = useAdminAuth()

const productId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!productId.value)
const pageTitle = computed(() => (isEdit.value ? 'Edit Product' : 'New Product'))
const breadcrumbs = computed(() => [
  { label: 'Admin', to: '/admin' },
  { label: 'Products', to: '/admin/products' },
  { label: pageTitle.value },
])

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary'

function emptyForm(): ProductFormData {
  return {
    name: '',
    slug: '',
    description: '',
    price_cents: 0,
    brand_id: null,
    category_id: null,
    space_id: null,
    style_id: null,
    room_id: null,
    material_id: null,
    listing_type: 'category',
    rating: 0,
    review_count: 0,
    popularity: 0,
    href: '',
    images: [],
    colors: [],
  }
}

const form = ref<ProductFormData>(emptyForm())
const lookups = ref<ProductLookups | null>(null)
const errors = ref<Record<string, string>>({})
const loadingProduct = ref(false)
const loadError = ref<string | null>(null)
const saving = ref(false)
const metadataOpen = ref(false)

function fillFromProduct(product: Product): void {
  form.value = {
    name: product.name ?? '',
    slug: product.slug ?? '',
    description: product.description ?? '',
    price_cents: product.price_cents ?? 0,
    brand_id: product.brand_id ?? null,
    category_id: product.category_id ?? null,
    space_id: product.space_id ?? null,
    style_id: product.style_id ?? null,
    room_id: product.room_id ?? null,
    material_id: product.material_id ?? null,
    listing_type: product.listing_type ?? 'category',
    rating: product.rating ?? 0,
    review_count: product.review_count ?? 0,
    popularity: product.popularity ?? 0,
    href: product.href ?? '',
    images: (product.images ?? []).map((image) => ({
      id: image.id,
      src: image.src ?? '',
      alt: image.alt ?? '',
      sort_order: image.sort_order ?? 0,
      is_primary: !!image.is_primary,
    })),
    colors: (product.colors ?? []).map((color) => ({
      color_id: color.color_id,
      sort_order: color.sort_order ?? 0,
    })),
  }
}

async function loadInitialData(): Promise<void> {
  loadingProduct.value = true
  loadError.value = null
  try {
    lookups.value = await adminApi.get<ProductLookups>('/api/admin/products/lookups')
    if (isEdit.value && productId.value) {
      const product = await adminApi.get<Product>(`/api/admin/products/${productId.value}`)
      fillFromProduct(product)
    } else {
      form.value = emptyForm()
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loadingProduct.value = false
  }
}

function validate(): boolean {
  const next: Record<string, string> = {}
  if (!form.value.name.trim()) {
    next.name = 'Product name is required.'
  }
  if (form.value.brand_id == null) {
    next.brand_id = 'Brand is required.'
  }
  if (!(form.value.price_cents > 0)) {
    next.price_cents = 'Price must be greater than zero.'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function goBack(): void {
  router.push('/admin/products')
}

async function saveProduct(): Promise<void> {
  if (!hasPermission('products.write')) {
    toast.add({
      severity: 'error',
      summary: 'Not allowed',
      detail: 'You do not have permission to save products.',
      life: 4000,
    })
    return
  }
  if (!validate()) {
    toast.add({
      severity: 'warn',
      summary: 'Validation failed',
      detail: 'Please fix the highlighted fields.',
      life: 3000,
    })
    return
  }
  saving.value = true
  try {
    const payload = { ...form.value }
    let response: SuccessResponse
    if (isEdit.value && productId.value) {
      response = await adminApi.put<SuccessResponse>(`/api/admin/products/${productId.value}`, payload)
    } else {
      response = await adminApi.post<SuccessResponse>('/api/admin/products', payload)
    }
    toast.add({
      severity: 'success',
      summary: 'Saved',
      detail: response.message || (isEdit.value ? 'Product updated' : 'Product created'),
      life: 3000,
    })
    router.push('/admin/products')
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: err instanceof Error ? err.message : 'Something went wrong',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

onMounted(loadInitialData)
</script>
