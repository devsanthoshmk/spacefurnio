<template>
  <div>
    <Toast />

    <!-- Page Header -->
    <AdminPageHeader title="Media" :breadcrumbs="breadcrumbs">
      <template #actions>
        <button
          v-if="canManage"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openLinkModal()"
        >
          <i class="pi pi-plus text-xs" aria-hidden="true" />
          <span>Link Image</span>
        </button>
      </template>
    </AdminPageHeader>

    <!-- Audit Summary Strip (6 Stat Cards) -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <AdminStatsCard
        title="Total Products"
        :value="auditLoading ? '...' : (auditData?.summary.total_products ?? 0)"
        color="blue"
        icon="pi pi-box"
      />
      <AdminStatsCard
        title="With Images"
        :value="auditLoading ? '...' : (auditData?.summary.products_with_images ?? 0)"
        color="emerald"
        icon="pi pi-check-circle"
      />
      <AdminStatsCard
        title="Missing Images"
        :value="auditLoading ? '...' : (auditData?.summary.products_missing_images_count ?? 0)"
        color="red"
        icon="pi pi-exclamation-triangle"
      />
      <AdminStatsCard
        title="Total Images"
        :value="auditLoading ? '...' : (auditData?.summary.total_images ?? 0)"
        color="cyan"
        icon="pi pi-images"
      />
      <AdminStatsCard
        title="Missing Alt Text"
        :value="auditLoading ? '...' : (auditData?.summary.missing_alt_count ?? 0)"
        color="amber"
        icon="pi pi-tag"
      />
      <AdminStatsCard
        title="Duplicate URLs"
        :value="auditLoading ? '...' : (auditData?.summary.duplicate_url_count ?? 0)"
        color="purple"
        icon="pi pi-copy"
      />
    </div>

    <!-- Tab Navigation (Pills) -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        :class="[
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'gallery'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        ]"
        @click="switchTab('gallery')"
      >
        <i class="pi pi-th-large text-xs" aria-hidden="true" />
        <span>Gallery</span>
        <span
          v-if="auditData?.summary"
          :class="[
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            activeTab === 'gallery' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600',
          ]"
        >
          {{ auditData.summary.total_images }}
        </span>
      </button>

      <button
        type="button"
        :class="[
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'audit'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        ]"
        @click="switchTab('audit')"
      >
        <i class="pi pi-shield text-xs" aria-hidden="true" />
        <span>Catalog Audit</span>
        <span
          v-if="auditIssuesCount > 0"
          :class="[
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            activeTab === 'audit' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800',
          ]"
        >
          {{ auditIssuesCount }}
        </span>
      </button>
    </div>

    <!-- TAB 1: Gallery -->
    <div v-show="activeTab === 'gallery'">
      <!-- Search & Controls -->
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <AdminSearchBar
            v-model="searchQuery"
            placeholder="Search by product name, URL, or alt text..."
            class="w-full sm:max-w-md"
          />

          <!-- Primary Only Filter -->
          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <input
              v-model="primaryOnly"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="font-medium">Primary Only</span>
          </label>
        </div>

        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span>{{ total }} image{{ total === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="imagesError" class="rounded-xl border border-admin-border bg-white p-8 text-center">
        <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
        <p class="mt-3 font-medium text-admin-text">Failed to load media assets</p>
        <p class="mt-1 text-sm text-admin-text-secondary">{{ imagesError }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          @click="fetchImages"
        >
          Retry
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div
        v-else-if="imagesLoading"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <div
          v-for="n in 12"
          :key="n"
          class="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div class="h-[200px] w-full animate-pulse rounded-lg bg-slate-100" />
          <div class="mt-3 space-y-2">
            <div class="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
            <div class="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div class="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="images.length === 0"
        class="rounded-xl border border-admin-border bg-white p-8"
      >
        <AdminEmptyState
          title="No images found"
          description="No media assets match your search or filter criteria. Try clearing filters or link a new image."
          icon="pi pi-images"
        >
          <template #action>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <button
                v-if="searchQuery || primaryOnly"
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                @click="clearFilters"
              >
                Clear Filters
              </button>
              <button
                v-if="canManage"
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                @click="openLinkModal()"
              >
                <i class="pi pi-plus mr-1.5 text-xs" aria-hidden="true" />
                Link Image
              </button>
            </div>
          </template>
        </AdminEmptyState>
      </div>

      <!-- Image Grid -->
      <div v-else>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div
            v-for="img in images"
            :key="img.id"
            class="group relative flex flex-col overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm transition hover:shadow-md"
          >
            <!-- Image Thumbnail Area -->
            <div class="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-slate-100">
              <img
                v-if="!brokenImages.has(img.id)"
                :src="img.src"
                :alt="img.alt || img.product_name || 'Product Image'"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                @error="handleImageError(img.id)"
              />
              <div
                v-else
                class="flex h-full w-full flex-col items-center justify-center p-3 text-center text-slate-400"
              >
                <i class="pi pi-image text-3xl text-slate-300" aria-hidden="true" />
                <span class="mt-1 text-xs font-medium">Image not found</span>
              </div>

              <!-- Primary Pill -->
              <span
                v-if="img.is_primary"
                class="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              >
                <i class="pi pi-star-fill text-[8px]" aria-hidden="true" />
                Primary
              </span>

              <!-- Sort Order Pill -->
              <span
                v-if="img.sort_order > 0"
                class="absolute top-2 right-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-xs"
              >
                #{{ img.sort_order }}
              </span>

              <!-- Hover Action Overlay -->
              <div
                v-if="canManage"
                class="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100"
              >
                <button
                  type="button"
                  title="Edit image"
                  aria-label="Edit image"
                  class="rounded-lg bg-white p-2 text-slate-700 shadow-md transition-transform hover:scale-110 hover:text-blue-600 focus:outline-none"
                  @click="openEditModal(img)"
                >
                  <i class="pi pi-pencil text-sm" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="Delete image"
                  aria-label="Delete image"
                  class="rounded-lg bg-white p-2 text-red-600 shadow-md transition-transform hover:scale-110 hover:text-red-700 focus:outline-none"
                  @click="askDeleteImage(img)"
                >
                  <i class="pi pi-trash text-sm" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Image Metadata Card Body -->
            <div class="flex flex-1 flex-col justify-between p-3">
              <div>
                <p
                  v-if="img.product_name"
                  class="truncate text-xs font-medium text-slate-900"
                  :title="img.product_name"
                >
                  {{ img.product_name }}
                </p>
                <p v-else class="text-xs text-slate-400">
                  Product #{{ img.product_id }}
                </p>

                <p
                  class="mt-1 truncate font-mono text-xs text-slate-500"
                  :title="img.src"
                >
                  {{ img.src }}
                </p>
              </div>

              <div class="mt-2 border-t border-slate-100 pt-2">
                <p
                  v-if="img.alt && img.alt.trim()"
                  class="truncate text-xs text-slate-600"
                  :title="img.alt"
                >
                  {{ img.alt }}
                </p>
                <p v-else class="text-xs italic text-slate-400">
                  No alt text
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <AdminPagination
          :page="page"
          :total-pages="totalPages"
          :total="total"
          :limit="limit"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </div>
    </div>

    <!-- TAB 2: Catalog Audit -->
    <div v-show="activeTab === 'audit'" class="space-y-6">
      <!-- Audit Error Banner -->
      <div v-if="auditError" class="rounded-xl border border-admin-border bg-white p-8 text-center">
        <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
        <p class="mt-3 font-medium text-admin-text">Failed to load catalog audit</p>
        <p class="mt-1 text-sm text-admin-text-secondary">{{ auditError }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          @click="fetchAudit"
        >
          Retry
        </button>
      </div>

      <!-- Loading State for Audit -->
      <div v-else-if="auditLoading" class="rounded-xl border border-admin-border bg-white p-8 text-center">
        <i class="pi pi-spin pi-spinner text-3xl text-blue-600" aria-hidden="true" />
        <p class="mt-3 text-sm text-slate-500">Analyzing catalog media assets...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Section A: Products Missing Images -->
        <div class="overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-slate-900">Products Missing Images</h3>
              <span
                :class="[
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  (auditData?.missing_images.length ?? 0) > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700',
                ]"
              >
                {{ auditData?.missing_images.length ?? 0 }}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Products in the catalog without any gallery or cover image
            </p>
          </div>

          <div v-if="!auditData?.missing_images || auditData.missing_images.length === 0" class="p-8 text-center">
            <i class="pi pi-check-circle text-3xl text-emerald-500" aria-hidden="true" />
            <p class="mt-2 text-sm font-medium text-slate-900">All products have images</p>
            <p class="mt-1 text-xs text-slate-500">No missing catalog images detected.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <th class="px-6 py-3">Product ID</th>
                  <th class="px-6 py-3">Product Name</th>
                  <th class="px-6 py-3">Brand</th>
                  <th class="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="prod in auditData.missing_images"
                  :key="prod.id"
                  class="transition-colors hover:bg-slate-50"
                >
                  <td class="px-6 py-3 font-mono text-xs font-semibold text-slate-700">
                    #{{ prod.id }}
                  </td>
                  <td class="px-6 py-3 font-medium text-slate-900">
                    {{ prod.name }}
                  </td>
                  <td class="px-6 py-3 text-slate-600">
                    <span
                      v-if="prod.brand"
                      class="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {{ prod.brand }}
                    </span>
                    <span v-else class="text-xs text-slate-400">-</span>
                  </td>
                  <td class="px-6 py-3 text-right">
                    <button
                      v-if="canManage"
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      @click="openLinkModal(prod.id)"
                    >
                      <i class="pi pi-plus text-[10px]" aria-hidden="true" />
                      Add Image
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section B: Duplicate Image URLs -->
        <div class="overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-slate-900">Duplicate Image URLs</h3>
              <span
                :class="[
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  (auditData?.duplicates.length ?? 0) > 0
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700',
                ]"
              >
                {{ auditData?.duplicates.length ?? 0 }}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Same image URL linked across multiple products
            </p>
          </div>

          <div v-if="!auditData?.duplicates || auditData.duplicates.length === 0" class="p-8 text-center">
            <i class="pi pi-check-circle text-3xl text-emerald-500" aria-hidden="true" />
            <p class="mt-2 text-sm font-medium text-slate-900">No duplicate URLs found</p>
            <p class="mt-1 text-xs text-slate-500">Every catalog image URL is uniquely associated.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <th class="px-6 py-3">Preview</th>
                  <th class="px-6 py-3">Image URL</th>
                  <th class="px-6 py-3">Usage Count</th>
                  <th class="px-6 py-3">Product IDs</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(dup, index) in auditData.duplicates"
                  :key="index"
                  class="transition-colors hover:bg-slate-50"
                >
                  <td class="px-6 py-3">
                    <img
                      :src="dup.src"
                      alt="Duplicate image preview"
                      loading="lazy"
                      class="h-10 w-10 rounded-lg border border-slate-200 object-cover bg-slate-100"
                      @error="handleDuplicateThumbError($event)"
                    />
                  </td>
                  <td class="max-w-xs px-6 py-3">
                    <span class="block truncate font-mono text-xs text-slate-600" :title="dup.src">
                      {{ dup.src }}
                    </span>
                  </td>
                  <td class="px-6 py-3">
                    <span class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                      {{ dup.usage_count }} products
                    </span>
                  </td>
                  <td class="px-6 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="pid in dup.product_ids"
                        :key="pid"
                        class="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
                      >
                        #{{ pid }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-3 text-right">
                    <button
                      type="button"
                      title="Copy URL"
                      class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      @click="copyUrl(dup.src)"
                    >
                      <i class="pi pi-copy text-xs" aria-hidden="true" />
                      Copy
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section C: Recent Assets -->
        <div class="overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm p-6">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-slate-900">Recent Assets</h3>
              <p class="text-xs text-slate-500">Most recently added image assets in the catalog</p>
            </div>
            <span
              v-if="auditData?.recent_assets"
              class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
            >
              {{ auditData.recent_assets.length }} assets
            </span>
          </div>

          <div
            v-if="!auditData?.recent_assets || auditData.recent_assets.length === 0"
            class="py-8 text-center text-sm text-slate-500"
          >
            No recent assets found.
          </div>

          <div
            v-else
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            <div
              v-for="asset in auditData.recent_assets"
              :key="asset.id || asset.src"
              class="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs"
            >
              <div class="relative h-28 w-full overflow-hidden bg-slate-100">
                <img
                  :src="asset.src"
                  :alt="asset.alt || 'Catalog asset'"
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform group-hover:scale-105"
                  @error="handleDuplicateThumbError($event)"
                />
                <span
                  v-if="asset.is_primary"
                  class="absolute top-1.5 left-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white"
                >
                  Primary
                </span>
              </div>
              <div class="p-2">
                <p class="truncate font-mono text-[11px] text-slate-500" :title="asset.src">
                  {{ asset.src }}
                </p>
                <p v-if="asset.alt" class="truncate text-[11px] text-slate-600" :title="asset.alt">
                  {{ asset.alt }}
                </p>
                <p v-else class="text-[11px] italic text-slate-400">
                  No alt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Link Image Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="linkModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Link Image to Product"
          @mousedown.self="closeLinkModal"
        >
          <div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 class="text-lg font-semibold text-slate-900">Link Image to Product</h3>
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                @click="closeLinkModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Body -->
            <form class="flex-1 overflow-y-auto px-6 py-5" @submit.prevent="submitLinkForm">
              <div class="space-y-4">
                <!-- Modal Error Banner -->
                <div
                  v-if="linkFormError"
                  class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <div class="flex items-center gap-2">
                    <i class="pi pi-exclamation-circle text-red-500" aria-hidden="true" />
                    <span>{{ linkFormError }}</span>
                  </div>
                </div>

                <!-- Product ID -->
                <div>
                  <label for="link-product-id" class="mb-1 block text-sm font-medium text-slate-700">
                    Product ID <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="link-product-id"
                    v-model.number="linkForm.productId"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 101"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p class="mt-1 text-xs text-slate-500">Numeric database ID of the target product.</p>
                </div>

                <!-- Image URL -->
                <div>
                  <label for="link-image-src" class="mb-1 block text-sm font-medium text-slate-700">
                    Image URL <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="link-image-src"
                    v-model="linkForm.src"
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    @input="onLinkUrlInput"
                  />
                </div>

                <!-- Live Preview -->
                <div v-if="linkForm.src.trim()">
                  <label class="mb-1 block text-xs font-medium text-slate-500">Live Preview</label>
                  <div class="flex h-44 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      v-if="!linkPreviewFailed"
                      :src="linkForm.src.trim()"
                      alt="Live preview"
                      class="h-full w-full object-contain"
                      @load="linkPreviewFailed = false"
                      @error="linkPreviewFailed = true"
                    />
                    <div
                      v-else
                      class="flex flex-col items-center justify-center p-3 text-center text-amber-700"
                    >
                      <i class="pi pi-exclamation-triangle text-2xl text-amber-500" aria-hidden="true" />
                      <span class="mt-1 text-xs font-medium">Unable to load image preview</span>
                      <span class="text-[11px] text-slate-400">Verify the URL is valid and accessible</span>
                    </div>
                  </div>
                </div>

                <!-- Alt Text -->
                <div>
                  <label for="link-alt-text" class="mb-1 block text-sm font-medium text-slate-700">
                    Alt Text (Accessibility & SEO)
                  </label>
                  <input
                    id="link-alt-text"
                    v-model="linkForm.alt"
                    type="text"
                    placeholder="e.g. Modern Navy Blue Velvet Accent Chair"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <!-- Sort Order & Primary Image Row -->
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label for="link-sort-order" class="mb-1 block text-sm font-medium text-slate-700">
                      Sort Order
                    </label>
                    <input
                      id="link-sort-order"
                      v-model.number="linkForm.sortOrder"
                      type="number"
                      min="0"
                      class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div class="flex items-center pt-6">
                    <label class="inline-flex cursor-pointer items-center gap-2">
                      <input
                        v-model="linkForm.isPrimary"
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span class="text-sm font-medium text-slate-700">Set as Primary Image</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  @click="closeLinkModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="linkSaving"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <i v-if="linkSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true" />
                  <span>{{ linkSaving ? 'Linking...' : 'Link Image' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Image Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="editModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Image"
          @mousedown.self="closeEditModal"
        >
          <div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 class="text-lg font-semibold text-slate-900">
                Edit Image #{{ editForm.id }}
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                @click="closeEditModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Body -->
            <form class="flex-1 overflow-y-auto px-6 py-5" @submit.prevent="submitEditForm">
              <div class="space-y-4">
                <!-- Modal Error Banner -->
                <div
                  v-if="editFormError"
                  class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <div class="flex items-center gap-2">
                    <i class="pi pi-exclamation-circle text-red-500" aria-hidden="true" />
                    <span>{{ editFormError }}</span>
                  </div>
                </div>

                <!-- Image URL -->
                <div>
                  <label for="edit-image-src" class="mb-1 block text-sm font-medium text-slate-700">
                    Image URL <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-image-src"
                    v-model="editForm.src"
                    type="url"
                    required
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    @input="onEditUrlInput"
                  />
                </div>

                <!-- Live Preview -->
                <div v-if="editForm.src.trim()">
                  <label class="mb-1 block text-xs font-medium text-slate-500">Preview</label>
                  <div class="flex h-44 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      v-if="!editPreviewFailed"
                      :src="editForm.src.trim()"
                      alt="Edit preview"
                      class="h-full w-full object-contain"
                      @load="editPreviewFailed = false"
                      @error="editPreviewFailed = true"
                    />
                    <div
                      v-else
                      class="flex flex-col items-center justify-center p-3 text-center text-amber-700"
                    >
                      <i class="pi pi-exclamation-triangle text-2xl text-amber-500" aria-hidden="true" />
                      <span class="mt-1 text-xs font-medium">Unable to load image preview</span>
                    </div>
                  </div>
                </div>

                <!-- Alt Text -->
                <div>
                  <label for="edit-alt-text" class="mb-1 block text-sm font-medium text-slate-700">
                    Alt Text
                  </label>
                  <input
                    id="edit-alt-text"
                    v-model="editForm.alt"
                    type="text"
                    placeholder="Descriptive alt text for SEO"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <!-- Sort Order & Primary Image Row -->
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label for="edit-sort-order" class="mb-1 block text-sm font-medium text-slate-700">
                      Sort Order
                    </label>
                    <input
                      id="edit-sort-order"
                      v-model.number="editForm.sortOrder"
                      type="number"
                      min="0"
                      class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div class="flex items-center pt-6">
                    <label class="inline-flex cursor-pointer items-center gap-2">
                      <input
                        v-model="editForm.isPrimary"
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span class="text-sm font-medium text-slate-700">Set as Primary Image</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  @click="closeEditModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="editSaving"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <i v-if="editSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true" />
                  <span>{{ editSaving ? 'Saving...' : 'Save Changes' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <AdminConfirmDialog
      :visible="deleteConfirmVisible"
      title="Delete Image"
      message="Are you sure you want to remove this image from the product gallery? If this was the primary image, another image will become primary automatically."
      confirm-label="Delete Image"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="deleteConfirmVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import AdminPagination from '@/admin/components/shared/AdminPagination.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import type {
  ImageAudit,
  ImageRecord,
  ImageListResponse,
} from '@/admin/types/admin'

const toast = useToast()
const { hasPermission } = useAdminAuth()
const canManage = computed(() => hasPermission('media.manage'))

const breadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Media' },
]

// Tab Navigation
type ActiveTab = 'gallery' | 'audit'
const activeTab = ref<ActiveTab>('gallery')

// Audit Data State
const auditData = ref<ImageAudit | null>(null)
const auditLoading = ref(false)
const auditError = ref<string | null>(null)

const auditIssuesCount = computed(() => {
  if (!auditData.value?.summary) return 0
  const s = auditData.value.summary
  return s.products_missing_images_count + s.duplicate_url_count + s.missing_alt_count
})

// Gallery Data State
const images = ref<ImageRecord[]>([])
const imagesLoading = ref(false)
const imagesError = ref<string | null>(null)

const page = ref(1)
const limit = ref(24)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

const searchQuery = ref('')
const primaryOnly = ref(false)

// Track images that failed to load
const brokenImages = ref<Set<number>>(new Set())

function handleImageError(id: number): void {
  brokenImages.value.add(id)
}

function handleDuplicateThumbError(event: Event): void {
  const target = event.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
  }
}

// Fetch Audit
async function fetchAudit(): Promise<void> {
  auditLoading.value = true
  auditError.value = null
  try {
    const data = await adminApi.get<ImageAudit>('/api/admin/images/audit')
    auditData.value = data
  } catch (err: unknown) {
    const errorObj = err as Error
    auditError.value = errorObj.message || 'Failed to load image audit'
  } finally {
    auditLoading.value = false
  }
}

// Fetch Images (Gallery)
async function fetchImages(): Promise<void> {
  imagesLoading.value = true
  imagesError.value = null
  try {
    const params: Record<string, string | number | boolean> = {
      page: page.value,
      limit: limit.value,
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (primaryOnly.value) {
      params.primary_only = true
    }

    const data = await adminApi.get<ImageListResponse>('/api/admin/images', params)
    images.value = data.images || []
    total.value = data.pagination?.total || 0
  } catch (err: unknown) {
    const errorObj = err as Error
    imagesError.value = errorObj.message || 'Failed to fetch gallery images'
  } finally {
    imagesLoading.value = false
  }
}

function switchTab(tab: ActiveTab): void {
  activeTab.value = tab
  if (tab === 'gallery') {
    fetchImages()
  } else {
    fetchAudit()
  }
}

// Watch filters to trigger gallery refetch
watch([searchQuery, primaryOnly], () => {
  page.value = 1
  if (activeTab.value === 'gallery') {
    fetchImages()
  }
})

function handlePageChange(newPage: number): void {
  page.value = newPage
  fetchImages()
}

function handleLimitChange(newLimit: number): void {
  limit.value = newLimit
  page.value = 1
  fetchImages()
}

function clearFilters(): void {
  searchQuery.value = ''
  primaryOnly.value = false
}

// Copy URL
async function copyUrl(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      severity: 'info',
      summary: 'Copied',
      detail: 'Image URL copied to clipboard',
      life: 2500,
    })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Copy Failed',
      detail: url,
      life: 4000,
    })
  }
}

// ─── LINK IMAGE MODAL ────────────────────────────────────────────────────────
const linkModalVisible = ref(false)
const linkSaving = ref(false)
const linkFormError = ref<string | null>(null)
const linkPreviewFailed = ref(false)

const linkForm = reactive({
  productId: 1,
  src: '',
  alt: '',
  sortOrder: 0,
  isPrimary: false,
})

function openLinkModal(prefilledProductId?: number): void {
  linkFormError.value = null
  linkPreviewFailed.value = false
  linkForm.productId = prefilledProductId && prefilledProductId > 0 ? prefilledProductId : 1
  linkForm.src = ''
  linkForm.alt = ''
  linkForm.sortOrder = 0
  linkForm.isPrimary = false
  linkModalVisible.value = true
}

function closeLinkModal(): void {
  linkModalVisible.value = false
}

function onLinkUrlInput(): void {
  linkPreviewFailed.value = false
}

async function submitLinkForm(): Promise<void> {
  if (!linkForm.productId || linkForm.productId <= 0) {
    linkFormError.value = 'Please enter a valid product ID'
    return
  }
  if (!linkForm.src.trim()) {
    linkFormError.value = 'Please provide an image source URL'
    return
  }

  linkSaving.value = true
  linkFormError.value = null

  try {
    await adminApi.post('/api/admin/images/link', {
      product_id: linkForm.productId,
      src: linkForm.src.trim(),
      alt: linkForm.alt.trim(),
      sort_order: linkForm.sortOrder,
      is_primary: linkForm.isPrimary,
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Image linked to product successfully',
      life: 3000,
    })

    closeLinkModal()
    fetchAudit()
    fetchImages()
  } catch (err: unknown) {
    const errorObj = err as Error
    linkFormError.value = errorObj.message || 'Failed to link image'
  } finally {
    linkSaving.value = false
  }
}

// ─── EDIT IMAGE MODAL ────────────────────────────────────────────────────────
const editModalVisible = ref(false)
const editSaving = ref(false)
const editFormError = ref<string | null>(null)
const editPreviewFailed = ref(false)

const editForm = reactive({
  id: 0,
  productId: 0,
  src: '',
  alt: '',
  sortOrder: 0,
  isPrimary: false,
})

function openEditModal(image: ImageRecord): void {
  editFormError.value = null
  editPreviewFailed.value = false
  editForm.id = image.id
  editForm.productId = image.product_id
  editForm.src = image.src
  editForm.alt = image.alt || ''
  editForm.sortOrder = image.sort_order
  editForm.isPrimary = image.is_primary
  editModalVisible.value = true
}

function closeEditModal(): void {
  editModalVisible.value = false
}

function onEditUrlInput(): void {
  editPreviewFailed.value = false
}

async function submitEditForm(): Promise<void> {
  if (!editForm.src.trim()) {
    editFormError.value = 'Image source URL is required'
    return
  }

  editSaving.value = true
  editFormError.value = null

  try {
    await adminApi.put(`/api/admin/images/${editForm.id}`, {
      src: editForm.src.trim(),
      alt: editForm.alt.trim(),
      sort_order: editForm.sortOrder,
      is_primary: editForm.isPrimary,
    })

    toast.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Image updated successfully',
      life: 3000,
    })

    closeEditModal()
    fetchAudit()
    fetchImages()
  } catch (err: unknown) {
    const errorObj = err as Error
    editFormError.value = errorObj.message || 'Failed to update image'
  } finally {
    editSaving.value = false
  }
}

// ─── DELETE ACTION ───────────────────────────────────────────────────────────
const deleteConfirmVisible = ref(false)
const imagePendingDelete = ref<ImageRecord | null>(null)

function askDeleteImage(image: ImageRecord): void {
  imagePendingDelete.value = image
  deleteConfirmVisible.value = true
}

async function confirmDelete(): Promise<void> {
  if (!imagePendingDelete.value) return

  const targetId = imagePendingDelete.value.id
  deleteConfirmVisible.value = false

  try {
    await adminApi.delete(`/api/admin/images/${targetId}`)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Image removed successfully',
      life: 3000,
    })
    fetchAudit()
    fetchImages()
  } catch (err: unknown) {
    const errorObj = err as Error
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorObj.message || 'Failed to delete image',
      life: 4000,
    })
  } finally {
    imagePendingDelete.value = null
  }
}

// ─── KEYBOARD SHORTCUTS ──────────────────────────────────────────────────────
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (linkModalVisible.value) closeLinkModal()
    if (editModalVisible.value) closeEditModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  fetchAudit()
  fetchImages()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.admin-dialog-enter-active,
.admin-dialog-leave-active {
  transition: opacity 200ms ease;
}

.admin-dialog-enter-active > div,
.admin-dialog-leave-active > div {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.admin-dialog-enter-from,
.admin-dialog-leave-to {
  opacity: 0;
}

.admin-dialog-enter-from > div,
.admin-dialog-leave-to > div {
  opacity: 0;
  transform: translateY(12px);
}
</style>
