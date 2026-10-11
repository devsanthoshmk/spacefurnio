<template>
  <div>
    <Toast />

    <!-- Page Header -->
    <AdminPageHeader title="Coupons" :breadcrumbs="breadcrumbs">
      <template #actions>
        <button
          v-if="canManage"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openCreateModal"
        >
          <i class="pi pi-plus text-xs" aria-hidden="true" />
          <span>Create Coupon</span>
        </button>
      </template>
    </AdminPageHeader>

    <!-- Stats Strip -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <AdminStatsCard
        title="Total Coupons"
        :value="statsLoading ? '...' : stats.total_coupons"
        color="blue"
        icon="pi pi-ticket"
      />
      <AdminStatsCard
        title="Active"
        :value="statsLoading ? '...' : stats.active_coupons"
        color="emerald"
        icon="pi pi-check-circle"
      />
      <AdminStatsCard
        title="Inactive"
        :value="statsLoading ? '...' : stats.inactive_coupons"
        color="slate"
        icon="pi pi-pause-circle"
      />
      <AdminStatsCard
        title="Expired"
        :value="statsLoading ? '...' : stats.expired_coupons"
        color="red"
        icon="pi pi-clock"
      />
      <AdminStatsCard
        title="Total Redemptions"
        :value="statsLoading ? '...' : stats.total_redemptions"
        color="cyan"
        icon="pi pi-shopping-bag"
      />
      <AdminStatsCard
        title="Total Discount Given"
        :value="statsLoading ? '...' : formatCurrency(stats.total_discount_given * 100)"
        color="amber"
        icon="pi pi-tag"
      />
    </div>

    <!-- Search & Filters -->
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <AdminSearchBar
          v-model="searchQuery"
          placeholder="Search coupons by code or description..."
          class="w-full sm:max-w-xs"
        />
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            :class="[
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="sortFilter" aria-label="Sort coupons" :class="filterClass">
          <option value="newest">Sort: Recently Created</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="code_asc">Sort: Code A–Z</option>
          <option value="code_desc">Sort: Code Z–A</option>
          <option value="uses_desc">Sort: Most Redemptions</option>
          <option value="uses_asc">Sort: Fewest Redemptions</option>
          <option value="discount_desc">Sort: Highest Discount</option>
          <option value="discount_asc">Sort: Lowest Discount</option>
        </select>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="rounded-xl border border-admin-border bg-white p-8 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <p class="mt-3 font-medium text-admin-text">Failed to load coupons</p>
      <p class="mt-1 text-sm text-admin-text-secondary">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="fetchCoupons"
      >
        Retry
      </button>
    </div>

    <!-- Coupons Table -->
    <div v-else class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[950px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <th class="px-4 py-3 font-medium">Code</th>
              <th class="px-4 py-3 font-medium">Description</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Value</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Redemptions</th>
              <th class="px-4 py-3 font-medium">Total Discount</th>
              <th class="px-4 py-3 font-medium">Expiry</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr v-for="n in 6" :key="n" class="border-b border-slate-100">
              <td v-for="c in 9" :key="c" class="px-4 py-3">
                <div class="h-5 animate-pulse rounded bg-slate-100" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="coupons.length === 0">
            <tr>
              <td colspan="9" class="px-4 py-6">
                <AdminEmptyState
                  title="No coupons found"
                  description="No discount codes match your search criteria. Create one or adjust your filters."
                  icon="pi pi-ticket"
                >
                  <template #action>
                    <button
                      v-if="canManage"
                      type="button"
                      class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      @click="openCreateModal"
                    >
                      <i class="pi pi-plus mr-1.5 text-xs" aria-hidden="true" />
                      Create Coupon
                    </button>
                  </template>
                </AdminEmptyState>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr
              v-for="coupon in coupons"
              :key="coupon.id"
              class="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
            >
              <!-- Code -->
              <td class="px-4 py-3">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    class="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-blue-700 uppercase transition-colors hover:bg-blue-100 hover:border-blue-300"
                    title="View coupon details"
                    @click="openDetailModal(coupon)"
                  >
                    {{ coupon.code }}
                  </button>
                  <button
                    type="button"
                    class="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="Copy code to clipboard"
                    aria-label="Copy code"
                    @click.stop="copyCode(coupon.code)"
                  >
                    <i class="pi pi-copy text-xs" aria-hidden="true" />
                  </button>
                </div>
              </td>

              <!-- Description -->
              <td class="px-4 py-3">
                <p class="max-w-xs truncate text-sm text-slate-600" :title="coupon.description || undefined">
                  {{ coupon.description || '-' }}
                </p>
              </td>

              <!-- Type -->
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize',
                    coupon.discount_type === 'percentage'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-cyan-200 bg-cyan-50 text-cyan-700',
                  ]"
                >
                  {{ coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount' }}
                </span>
              </td>

              <!-- Value -->
              <td class="px-4 py-3 font-medium text-slate-900">
                {{ coupon.discount_formatted }}
              </td>

              <!-- Status -->
              <td class="px-4 py-3">
                <AdminStatusBadge :status="coupon.status" size="sm" />
              </td>

              <!-- Redemptions -->
              <td class="px-4 py-3 font-medium text-slate-800">
                {{ coupon.redemptions_count }}
              </td>

              <!-- Total Discount -->
              <td class="px-4 py-3 font-medium whitespace-nowrap text-slate-900">
                {{ formatCurrency(coupon.total_discount_applied * 100) }}
              </td>

              <!-- Expiry -->
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span :class="coupon.status === 'EXPIRED' ? 'font-medium text-red-600' : 'text-slate-600'">
                  {{ coupon.expires_at ? formatDate(coupon.expires_at) : 'No expiry' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <!-- Toggle Switch -->
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="coupon.is_active"
                    :disabled="coupon.status === 'EXPIRED' || togglingId === coupon.id || !canManage"
                    :title="
                      coupon.status === 'EXPIRED'
                        ? 'Expired coupon cannot be toggled'
                        : coupon.is_active
                          ? 'Click to deactivate'
                          : 'Click to activate'
                    "
                    :class="[
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40',
                      coupon.is_active && coupon.status !== 'EXPIRED' ? 'bg-emerald-500' : 'bg-slate-300',
                    ]"
                    @click.stop="toggleStatus(coupon)"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        coupon.is_active && coupon.status !== 'EXPIRED' ? 'translate-x-4' : 'translate-x-0',
                      ]"
                    />
                  </button>

                  <!-- View details -->
                  <button
                    type="button"
                    title="View redemption history"
                    aria-label="View coupon details"
                    class="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="openDetailModal(coupon)"
                  >
                    <i class="pi pi-eye text-xs" aria-hidden="true" />
                  </button>

                  <!-- Edit button -->
                  <button
                    v-if="canManage"
                    type="button"
                    title="Edit coupon"
                    aria-label="Edit coupon"
                    class="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="openEditModal(coupon)"
                  >
                    <i class="pi pi-pencil text-xs" aria-hidden="true" />
                  </button>

                  <!-- Delete button -->
                  <button
                    v-if="canManage"
                    type="button"
                    title="Delete coupon"
                    aria-label="Delete coupon"
                    class="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="askDelete(coupon)"
                  >
                    <i class="pi pi-trash text-xs" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && coupons.length > 0" class="px-4 pb-4">
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

    <!-- Create / Edit Coupon Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="formModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          :aria-label="formMode === 'create' ? 'Create New Coupon' : 'Edit Coupon'"
          @mousedown.self="closeFormModal"
        >
          <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 class="text-lg font-semibold text-slate-900">
                {{ formMode === 'create' ? 'Create New Coupon' : `Edit Coupon: ${form.code}` }}
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="closeFormModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Body -->
            <form @submit.prevent="submitForm">
              <div class="space-y-4 px-6 py-5">
                <!-- Form Error Banner -->
                <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-exclamation-circle text-red-500" aria-hidden="true" />
                    <span>{{ formError }}</span>
                  </div>
                </div>

                <!-- Coupon Code -->
                <div>
                  <label for="coupon-code-input" class="mb-1.5 block text-sm font-medium text-slate-700">
                    Coupon Code <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="coupon-code-input"
                    :value="form.code"
                    type="text"
                    required
                    placeholder="e.g. SUMMER2026"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @input="onCodeInput(($event.target as HTMLInputElement).value)"
                  />
                  <p v-if="fieldErrors.code" class="mt-1 text-xs text-red-600">
                    {{ fieldErrors.code }}
                  </p>
                  <p class="mt-1 text-xs text-slate-400">
                    Must be uppercase letters, numbers, and hyphens without spaces.
                  </p>
                </div>

                <!-- Description -->
                <div>
                  <label for="coupon-desc-input" class="mb-1.5 block text-sm font-medium text-slate-700">
                    Description <span class="text-xs text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="coupon-desc-input"
                    v-model="form.description"
                    rows="2"
                    placeholder="Campaign notes or customer-facing description..."
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- Discount Type & Value -->
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label for="coupon-type-select" class="mb-1.5 block text-sm font-medium text-slate-700">
                      Discount Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      id="coupon-type-select"
                      v-model="form.discount_type"
                      class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label for="coupon-value-input" class="mb-1.5 block text-sm font-medium text-slate-700">
                      Discount Value <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <span
                        v-if="form.discount_type === 'fixed_amount'"
                        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-slate-500"
                      >
                        ₹
                      </span>
                      <input
                        id="coupon-value-input"
                        v-model.number="form.discount_value"
                        type="number"
                        min="0.01"
                        :max="form.discount_type === 'percentage' ? 100 : undefined"
                        step="any"
                        required
                        :placeholder="form.discount_type === 'percentage' ? '15' : '500'"
                        :class="[
                          'w-full rounded-lg border border-slate-200 bg-white py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          form.discount_type === 'fixed_amount' ? 'pl-7 pr-3' : 'pl-3 pr-8',
                        ]"
                      />
                      <span
                        v-if="form.discount_type === 'percentage'"
                        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-slate-500"
                      >
                        %
                      </span>
                    </div>
                    <p v-if="fieldErrors.discount_value" class="mt-1 text-xs text-red-600">
                      {{ fieldErrors.discount_value }}
                    </p>
                  </div>
                </div>

                <!-- Expiry Date -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="coupon-expiry-input" class="block text-sm font-medium text-slate-700">
                      Expiry Date <span class="text-xs text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <button
                      v-if="form.expires_at"
                      type="button"
                      class="text-xs text-blue-600 hover:text-blue-800"
                      @click="form.expires_at = ''"
                    >
                      Clear date (no expiry)
                    </button>
                  </div>
                  <input
                    id="coupon-expiry-input"
                    v-model="form.expires_at"
                    type="date"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="mt-1 text-xs text-slate-400">
                    Coupon expires at the end of the selected day. Leave blank for no expiration.
                  </p>
                </div>

                <!-- Active Toggle -->
                <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p class="text-sm font-medium text-slate-900">Active Status</p>
                    <p class="text-xs text-slate-500">Allow customers to redeem this code immediately</p>
                  </div>
                  <input
                    id="coupon-active-checkbox"
                    v-model="form.is_active"
                    type="checkbox"
                    class="h-5 w-5 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-xl">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  :disabled="formSaving"
                  @click="closeFormModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  :disabled="formSaving"
                >
                  <i v-if="formSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true" />
                  <span>{{ formSaving ? 'Saving...' : formMode === 'create' ? 'Create Coupon' : 'Save Changes' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Coupon Detail & Redemptions Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="detailModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Coupon Details & Redemption History"
          @mousedown.self="closeDetailModal"
        >
          <div class="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-xl overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="rounded bg-blue-50 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-blue-700 border border-blue-200 uppercase">
                  {{ detailCoupon?.code }}
                </span>
                <AdminStatusBadge v-if="detailCoupon" :status="detailCoupon.status" size="sm" />
              </div>
              <button
                type="button"
                aria-label="Close details dialog"
                class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="closeDetailModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Content (Scrollable) -->
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <!-- Loading State -->
              <div v-if="detailLoading" class="py-12 text-center">
                <i class="pi pi-spin pi-spinner text-3xl text-blue-600" aria-hidden="true" />
                <p class="mt-2 text-sm text-slate-500">Loading coupon details...</p>
              </div>

              <!-- Error State -->
              <div v-else-if="detailError" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <i class="pi pi-exclamation-circle text-2xl text-red-500" aria-hidden="true" />
                <p class="mt-2 text-sm font-medium text-red-800">{{ detailError }}</p>
                <button
                  type="button"
                  class="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  @click="fetchCouponDetail(detailCoupon?.id || '')"
                >
                  Retry
                </button>
              </div>

              <!-- Detail Data -->
              <template v-else-if="detailData">
                <!-- Overview Info -->
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div class="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p class="text-xs text-slate-500">Discount</p>
                    <p class="mt-1 text-lg font-semibold text-slate-900">
                      {{ detailData.coupon.discount_formatted }}
                    </p>
                    <p class="text-xs text-slate-500 capitalize">
                      {{ detailData.coupon.discount_type === 'percentage' ? 'Percentage Off' : 'Fixed Amount Off' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p class="text-xs text-slate-500">Total Redemptions</p>
                    <p class="mt-1 text-lg font-semibold text-blue-600">
                      {{ detailData.stats.total_redemptions }}
                    </p>
                    <p class="text-xs text-slate-500">Uses across all orders</p>
                  </div>
                  <div class="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p class="text-xs text-slate-500">Total Discount Disbursed</p>
                    <p class="mt-1 text-lg font-semibold text-emerald-600">
                      {{ formatCurrency(detailData.stats.total_discount_given * 100) }}
                    </p>
                    <p class="text-xs text-slate-500">Cumulative savings granted</p>
                  </div>
                </div>

                <!-- Meta Details -->
                <div class="rounded-lg border border-slate-200 p-4 space-y-2 text-sm">
                  <div v-if="detailData.coupon.description" class="pb-2 border-b border-slate-100">
                    <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Description</span>
                    <p class="mt-0.5 text-slate-700">{{ detailData.coupon.description }}</p>
                  </div>
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                    <span>Created: <strong class="text-slate-700 font-medium">{{ formatDate(detailData.coupon.created_at) }}</strong></span>
                    <span>Expires: <strong class="text-slate-700 font-medium">{{ detailData.coupon.expires_at ? formatDate(detailData.coupon.expires_at) : 'Never' }}</strong></span>
                  </div>
                </div>

                <!-- Redemptions Table Section -->
                <div>
                  <h4 class="mb-2 text-sm font-semibold text-slate-900 flex items-center justify-between">
                    <span>Redemption History</span>
                    <span class="text-xs font-normal text-slate-500">
                      Showing {{ detailData.redemptions.length }} record(s)
                    </span>
                  </h4>

                  <div v-if="detailData.redemptions.length === 0" class="rounded-lg border border-slate-200 p-6 text-center">
                    <i class="pi pi-inbox text-2xl text-slate-300" aria-hidden="true" />
                    <p class="mt-2 text-sm font-medium text-slate-700">No redemptions yet</p>
                    <p class="text-xs text-slate-400">This coupon has not been used by any customer.</p>
                  </div>

                  <div v-else class="overflow-x-auto rounded-lg border border-slate-200">
                    <table class="w-full text-left text-xs">
                      <thead class="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th class="px-3 py-2.5 font-medium">User Email</th>
                          <th class="px-3 py-2.5 font-medium">Order ID</th>
                          <th class="px-3 py-2.5 font-medium">Discount Applied</th>
                          <th class="px-3 py-2.5 font-medium">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        <tr v-for="redemption in detailData.redemptions" :key="redemption.id" class="hover:bg-slate-50">
                          <td class="px-3 py-2 font-medium text-slate-800">
                            {{ redemption.user_email || 'Guest' }}
                          </td>
                          <td class="px-3 py-2 font-mono text-slate-500">
                            <router-link
                              v-if="redemption.order_id"
                              :to="`/admin/orders/${redemption.order_id}`"
                              class="text-blue-600 hover:underline"
                            >
                              {{ redemption.order_id.slice(0, 8) }}…
                            </router-link>
                            <span v-else>-</span>
                          </td>
                          <td class="px-3 py-2 font-semibold text-emerald-600 whitespace-nowrap">
                            {{ formatCurrency(redemption.discount_applied * 100) }}
                          </td>
                          <td class="px-3 py-2 text-slate-500 whitespace-nowrap">
                            {{ formatDateTime(redemption.created_at) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </template>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end border-t border-slate-200 px-6 py-3.5 bg-slate-50">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                @click="closeDetailModal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <AdminConfirmDialog
      v-model:visible="confirmVisible"
      title="Delete Coupon"
      :message="confirmMessage"
      confirm-label="Delete Coupon"
      :danger="true"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminPagination from '@/admin/components/shared/AdminPagination.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import { adminApi } from '@/admin/api/adminApi'
import { usePagination } from '@/admin/composables/usePagination'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import { formatCurrency, formatDate, formatDateTime } from '@/admin/utils/formatters'
import type {
  Coupon,
  CouponDetail,
  CouponListResponse,
  CouponStats,
  DiscountType,
  SuccessResponse,
} from '@/admin/types/admin'

const breadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Coupons' },
]

const filterClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto'

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
]

const toast = useToast()
const { hasPermission } = useAdminAuth()
const canManage = computed(() => hasPermission('marketing.coupons'))

// Pagination
const { page, limit, total, totalPages, setTotal, resetPage } = usePagination(25)

// List & Stats State
const coupons = ref<Coupon[]>([])
const stats = ref<CouponStats>({
  total_coupons: 0,
  active_coupons: 0,
  inactive_coupons: 0,
  expired_coupons: 0,
  total_redemptions: 0,
  total_discount_given: 0,
})

const loading = ref(false)
const statsLoading = ref(false)
const error = ref<string | null>(null)
const togglingId = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const statusFilter = ref('all')
const sortFilter = ref('newest')

// Create / Edit Form State
const formModalVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingCouponId = ref<string | null>(null)
const formSaving = ref(false)
const formError = ref<string | null>(null)

interface FormState {
  code: string
  description: string
  discount_type: DiscountType
  discount_value: number | ''
  is_active: boolean
  expires_at: string
}

const form = reactive<FormState>({
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  is_active: true,
  expires_at: '',
})

const fieldErrors = reactive({
  code: '',
  discount_value: '',
})

// Detail Modal State
const detailModalVisible = ref(false)
const detailCoupon = ref<Coupon | null>(null)
const detailData = ref<CouponDetail | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)

// Delete Dialog State
const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteCoupon = ref<Coupon | null>(null)

// Methods

function onLimitChange(value: number): void {
  limit.value = value
  if (page.value === 1) {
    fetchCoupons()
  } else {
    resetPage()
  }
}

async function fetchStats(): Promise<void> {
  statsLoading.value = true
  try {
    stats.value = await adminApi.get<CouponStats>('/api/admin/coupons/stats')
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Stats unavailable',
      detail: 'Coupon summary stats could not be loaded.',
      life: 3000,
    })
  } finally {
    statsLoading.value = false
  }
}

async function fetchCoupons(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: limit.value,
      sort: sortFilter.value,
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }

    const data = await adminApi.get<CouponListResponse>('/api/admin/coupons', params)
    coupons.value = data.coupons ?? []
    setTotal(data.pagination?.total ?? 0)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

async function copyCode(code: string): Promise<void> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: `Coupon code "${code}" copied to clipboard!`,
      life: 2000,
    })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Copy Failed',
      detail: 'Could not copy to clipboard.',
      life: 2000,
    })
  }
}

async function toggleStatus(coupon: Coupon): Promise<void> {
  if (!canManage.value || coupon.status === 'EXPIRED') return

  togglingId.value = coupon.id
  try {
    const res = await adminApi.patch<{ success: boolean; is_active: boolean; message: string; coupon: Coupon }>(
      `/api/admin/coupons/${coupon.id}/toggle`,
    )
    coupon.is_active = res.is_active
    coupon.status = res.is_active ? 'ACTIVE' : 'INACTIVE'
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: res.message || 'Coupon status toggled successfully.',
      life: 3000,
    })
    fetchStats()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Toggle Failed',
      detail: err instanceof Error ? err.message : 'Failed to toggle coupon status.',
      life: 4000,
    })
  } finally {
    togglingId.value = null
  }
}

function openCreateModal(): void {
  formMode.value = 'create'
  editingCouponId.value = null
  form.code = ''
  form.description = ''
  form.discount_type = 'percentage'
  form.discount_value = ''
  form.is_active = true
  form.expires_at = ''
  formError.value = null
  fieldErrors.code = ''
  fieldErrors.discount_value = ''
  formModalVisible.value = true
}

function openEditModal(coupon: Coupon): void {
  formMode.value = 'edit'
  editingCouponId.value = coupon.id
  form.code = coupon.code
  form.description = coupon.description || ''
  form.discount_type = coupon.discount_type
  form.discount_value = coupon.discount_value
  form.is_active = coupon.is_active
  form.expires_at = coupon.expires_at ? coupon.expires_at.slice(0, 10) : ''
  formError.value = null
  fieldErrors.code = ''
  fieldErrors.discount_value = ''
  formModalVisible.value = true
}

function onCodeInput(val: string): void {
  form.code = val.toUpperCase().replace(/\s+/g, '')
  if (fieldErrors.code) fieldErrors.code = ''
}

function closeFormModal(): void {
  formModalVisible.value = false
  formError.value = null
}

function validateForm(): boolean {
  let valid = true
  fieldErrors.code = ''
  fieldErrors.discount_value = ''
  formError.value = null

  if (!form.code.trim()) {
    fieldErrors.code = 'Coupon code is required'
    valid = false
  }

  if (form.discount_value === '' || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) {
    fieldErrors.discount_value = 'Discount value must be greater than 0'
    valid = false
  } else if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
    fieldErrors.discount_value = 'Percentage discount cannot exceed 100%'
    valid = false
  }

  return valid
}

async function submitForm(): Promise<void> {
  if (!validateForm() || !canManage.value) return

  formSaving.value = true
  formError.value = null

  const payload = {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim() || '',
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value),
    is_active: form.is_active,
    expires_at: form.expires_at ? `${form.expires_at}T23:59:59.000Z` : null,
  }

  try {
    if (formMode.value === 'create') {
      const res = await adminApi.post<{ success: boolean; message: string; coupon: Coupon }>(
        '/api/admin/coupons',
        payload,
      )
      toast.add({
        severity: 'success',
        summary: 'Created',
        detail: res.message || 'Coupon created successfully.',
        life: 3000,
      })
    } else if (editingCouponId.value) {
      const res = await adminApi.put<{ success: boolean; message: string; coupon: Coupon }>(
        `/api/admin/coupons/${editingCouponId.value}`,
        payload,
      )
      toast.add({
        severity: 'success',
        summary: 'Saved',
        detail: res.message || 'Coupon updated successfully.',
        life: 3000,
      })
    }
    closeFormModal()
    await Promise.all([fetchStats(), fetchCoupons()])
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Failed to save coupon'
  } finally {
    formSaving.value = false
  }
}

async function openDetailModal(coupon: Coupon): Promise<void> {
  detailCoupon.value = coupon
  detailModalVisible.value = true
  await fetchCouponDetail(coupon.id)
}

async function fetchCouponDetail(id: string): Promise<void> {
  detailLoading.value = true
  detailError.value = null
  try {
    detailData.value = await adminApi.get<CouponDetail>(`/api/admin/coupons/${id}`)
  } catch (err) {
    detailError.value = err instanceof Error ? err.message : 'Failed to load coupon details'
  } finally {
    detailLoading.value = false
  }
}

function closeDetailModal(): void {
  detailModalVisible.value = false
  detailCoupon.value = null
  detailData.value = null
}

function askDelete(coupon: Coupon): void {
  if (!canManage.value) return
  pendingDeleteCoupon.value = coupon
  confirmMessage.value = `Are you sure you want to delete coupon "${coupon.code}"? Existing orders with this coupon will retain their discounts, but new redemptions will be blocked.`
  confirmVisible.value = true
}

async function handleConfirmDelete(): Promise<void> {
  if (!pendingDeleteCoupon.value) return
  const id = pendingDeleteCoupon.value.id
  const code = pendingDeleteCoupon.value.code

  try {
    const res = await adminApi.delete<SuccessResponse>(`/api/admin/coupons/${id}`)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: res.message || `Coupon "${code}" deleted successfully.`,
      life: 3000,
    })
    await Promise.all([fetchStats(), fetchCoupons()])
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: err instanceof Error ? err.message : 'Failed to delete coupon.',
      life: 4000,
    })
  } finally {
    pendingDeleteCoupon.value = null
  }
}

// Global Escape Key Listener for Modals
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    if (formModalVisible.value) closeFormModal()
    if (detailModalVisible.value) closeDetailModal()
  }
}

watch([searchQuery, statusFilter, sortFilter], () => {
  if (page.value === 1) {
    fetchCoupons()
  } else {
    resetPage()
  }
})

watch(page, fetchCoupons)

watch(
  () => formModalVisible.value || detailModalVisible.value,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onMounted(async () => {
  await Promise.all([fetchStats(), fetchCoupons()])
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