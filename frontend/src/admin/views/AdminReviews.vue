<template>
  <div>
    <Toast />

    <!-- Access Denied State -->
    <div v-if="!canRead" class="rounded-xl border border-admin-border bg-white p-8 text-center">
      <i class="pi pi-lock text-3xl text-slate-400" aria-hidden="true" />
      <h2 class="mt-3 text-lg font-semibold text-admin-text">Access Restricted</h2>
      <p class="mt-1 text-sm text-admin-text-secondary">
        You do not have permission to view customer reviews.
      </p>
    </div>

    <template v-else>
      <!-- Page Header -->
      <AdminPageHeader title="Reviews" :breadcrumbs="breadcrumbs">
        <template #actions>
          <button
            v-if="canWrite"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreateModal"
          >
            <i class="pi pi-plus text-xs" aria-hidden="true" />
            <span>Add Review</span>
          </button>
        </template>
      </AdminPageHeader>

      <!-- Stats Strip -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- 1. Total Reviews -->
        <AdminStatsCard
          title="Total Reviews"
          :value="loading && !statsLoaded ? '...' : stats.total_reviews"
          color="blue"
          icon="pi pi-star"
        />

        <!-- 2. Average Rating -->
        <AdminStatsCard
          title="Average Rating"
          :value="loading && !statsLoaded ? '...' : Number(stats.average_rating || 0).toFixed(1)"
          color="amber"
          icon="pi pi-star-fill"
        />

        <!-- 3. Verified Reviews -->
        <AdminStatsCard
          title="Verified Reviews"
          :value="loading && !statsLoaded ? '...' : verifiedDisplay"
          color="emerald"
          icon="pi pi-verified"
        />

        <!-- 4. Rating Breakdown Visualization Card -->
        <div class="flex flex-col justify-between overflow-hidden rounded-xl border border-admin-border bg-white p-4 shadow-sm">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">
              Rating Breakdown
            </span>
            <button
              v-if="ratingFilter !== 'all'"
              type="button"
              class="text-[11px] font-medium text-blue-600 transition-colors hover:text-blue-800"
              @click="ratingFilter = 'all'"
            >
              Reset filter
            </button>
            <span v-else class="text-[11px] text-slate-400">
              Click bar to filter
            </span>
          </div>

          <div class="space-y-1.5">
            <button
              v-for="star in [5, 4, 3, 2, 1]"
              :key="star"
              type="button"
              :class="[
                'flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs transition-colors',
                ratingFilter === String(star)
                  ? 'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-500'
                  : 'text-slate-700 hover:bg-slate-50',
              ]"
              :title="`Filter by ${star} star reviews (${stats.rating_breakdown?.[star] ?? 0} reviews)`"
              @click="toggleRatingFilter(star)"
            >
              <span class="flex w-7 shrink-0 items-center gap-1 font-medium text-slate-700">
                {{ star }} <i class="pi pi-star-fill text-[10px] text-amber-500" aria-hidden="true" />
              </span>

              <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  :class="[
                    'h-full rounded-full transition-all duration-300',
                    star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-red-500',
                  ]"
                  :style="{ width: `${getStarPercentage(star)}%` }"
                />
              </div>

              <span class="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
                {{ stats.rating_breakdown?.[star] ?? 0 }} ({{ getStarPercentage(star) }}%)
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Search & Filters Bar -->
      <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <AdminSearchBar
            v-model="searchQuery"
            placeholder="Search by author, title, comment, email..."
            class="w-full sm:max-w-xs"
          />

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Rating Dropdown -->
            <select
              v-model="ratingFilter"
              aria-label="Filter reviews by rating"
              :class="filterSelectClass"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <!-- Verified Only Toggle -->
            <button
              type="button"
              role="switch"
              :aria-checked="verifiedOnly"
              :class="[
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                verifiedOnly
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              ]"
              @click="toggleVerifiedOnly"
            >
              <i
                :class="[
                  'text-xs transition-colors',
                  verifiedOnly ? 'pi pi-check-circle text-emerald-600' : 'pi pi-circle text-slate-400',
                ]"
                aria-hidden="true"
              />
              <span>Verified Only</span>
            </button>

            <!-- Reset Filters Button -->
            <button
              v-if="hasActiveFilters"
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              @click="resetFilters"
            >
              <i class="pi pi-filter-slash mr-1 text-[10px]" aria-hidden="true" />
              Reset Filters
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Sort Dropdown -->
          <select
            v-model="sortFilter"
            aria-label="Sort reviews"
            :class="filterSelectClass"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="rating_desc">Sort: Highest Rating</option>
            <option value="rating_asc">Sort: Lowest Rating</option>
          </select>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="rounded-xl border border-admin-border bg-white p-8 text-center">
        <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
        <h2 class="mt-3 font-semibold text-admin-text">Failed to load reviews</h2>
        <p class="mt-1 text-sm text-admin-text-secondary">{{ error }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          @click="fetchReviews"
        >
          Retry
        </button>
      </div>

      <!-- Reviews Table -->
      <div v-else class="overflow-hidden rounded-xl border border-admin-border bg-white">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[950px] text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <th class="px-4 py-3 font-medium">Product</th>
                <th class="px-4 py-3 font-medium">Author</th>
                <th class="px-4 py-3 font-medium">Rating</th>
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium">Comment</th>
                <th class="px-4 py-3 text-center font-medium">Verified</th>
                <th class="px-4 py-3 font-medium">Date</th>
                <th class="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <!-- Skeleton Loader -->
            <tbody v-if="loading">
              <tr v-for="n in 6" :key="n" class="border-b border-slate-100">
                <td v-for="c in 8" :key="c" class="px-4 py-3">
                  <div class="h-5 animate-pulse rounded bg-slate-100" />
                </td>
              </tr>
            </tbody>

            <!-- Empty State -->
            <tbody v-else-if="reviews.length === 0">
              <tr>
                <td colspan="8" class="px-4 py-8">
                  <AdminEmptyState
                    title="No reviews found"
                    description="No customer reviews match your search or filter criteria. Adjust your filters or add a review."
                    icon="pi pi-star"
                  >
                    <template #action>
                      <button
                        v-if="canWrite"
                        type="button"
                        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        @click="openCreateModal"
                      >
                        <i class="pi pi-plus text-xs" aria-hidden="true" />
                        <span>Add Review</span>
                      </button>
                    </template>
                  </AdminEmptyState>
                </td>
              </tr>
            </tbody>

            <!-- Rows -->
            <tbody v-else>
              <tr
                v-for="review in reviews"
                :key="review.id"
                class="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
              >
                <!-- Product -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="review.product?.image"
                      :src="review.product.image"
                      :alt="review.product?.name ?? 'Product'"
                      class="h-8 w-8 shrink-0 rounded object-cover border border-slate-200"
                      loading="lazy"
                    />
                    <div
                      v-else
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 text-slate-400"
                    >
                      <i class="pi pi-image text-xs" aria-hidden="true" />
                    </div>

                    <div class="min-w-0 max-w-[200px]">
                      <a
                        v-if="review.product?.slug"
                        :href="`/products/${review.product.slug}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="truncate font-medium text-slate-900 transition-colors hover:text-blue-600 hover:underline block"
                        :title="review.product.name"
                      >
                        {{ review.product.name }}
                      </a>
                      <span
                        v-else
                        class="truncate font-medium text-slate-900 block"
                        :title="review.product?.name || `Product #${review.product_id}`"
                      >
                        {{ review.product?.name || `Product #${review.product_id}` }}
                      </span>
                      <span class="block text-xs text-slate-400 font-mono">
                        #{{ review.product_id }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Author -->
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900 truncate max-w-[140px]" :title="review.author_name">
                    {{ review.author_name }}
                  </p>
                  <p
                    v-if="review.user_email"
                    class="truncate text-xs text-slate-400 max-w-[140px]"
                    :title="review.user_email"
                  >
                    {{ review.user_email }}
                  </p>
                </td>

                <!-- Rating -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1" :title="`${review.rating} / 5 stars`">
                    <template v-for="star in 5" :key="star">
                      <i
                        :class="[
                          'text-xs',
                          star <= review.rating ? 'pi pi-star-fill text-amber-500' : 'pi pi-star text-slate-300',
                        ]"
                        aria-hidden="true"
                      />
                    </template>
                    <span class="ml-1 text-xs font-semibold text-slate-700">
                      {{ review.rating }}.0
                    </span>
                  </div>
                </td>

                <!-- Title -->
                <td class="px-4 py-3">
                  <p
                    v-if="review.title"
                    class="max-w-[170px] truncate text-slate-800 font-medium"
                    :title="review.title"
                  >
                    {{ review.title }}
                  </p>
                  <span v-else class="text-xs italic text-slate-400">
                    No title
                  </span>
                </td>

                <!-- Comment -->
                <td class="px-4 py-3">
                  <p
                    class="max-w-xs text-xs text-slate-600 line-clamp-2"
                    :title="review.comment"
                  >
                    {{ truncate(review.comment, 80) }}
                  </p>
                </td>

                <!-- Verified -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="review.is_verified_purchase"
                    class="inline-flex items-center text-emerald-600"
                    title="Verified Purchase"
                  >
                    <i class="pi pi-check-circle text-base" aria-hidden="true" />
                  </span>
                  <span v-else class="text-slate-400" title="Not verified">
                    -
                  </span>
                </td>

                <!-- Date -->
                <td class="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                  <span :title="formatDateTime(review.created_at)">
                    {{ formatRelativeTime(review.created_at) }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- View Detail Button -->
                    <button
                      type="button"
                      title="View review details"
                      aria-label="View review details"
                      class="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @click="openDetailModal(review)"
                    >
                      <i class="pi pi-eye text-xs" aria-hidden="true" />
                    </button>

                    <!-- Edit Button -->
                    <button
                      v-if="canWrite"
                      type="button"
                      title="Edit review"
                      aria-label="Edit review"
                      class="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @click="openEditModal(review)"
                    >
                      <i class="pi pi-pencil text-xs" aria-hidden="true" />
                    </button>

                    <!-- Delete Button -->
                    <button
                      v-if="canDelete"
                      type="button"
                      title="Delete review"
                      aria-label="Delete review"
                      class="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      @click="askDelete(review)"
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
        <div v-if="!loading && reviews.length > 0" class="px-4 pb-4">
          <AdminPagination
            :page="page"
            :total-pages="totalPages"
            :total="total"
            :limit="limit"
            @update:page="onPageChange"
            @update:limit="onLimitChange"
          />
        </div>
      </div>
    </template>

    <!-- Create / Edit Review Modal -->
    <Teleport to="body">
      <div
        v-if="formModalVisible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="formMode === 'create' ? 'Add Review' : 'Edit Review'"
        @mousedown.self="closeFormModal"
      >
        <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-slate-900">
              {{ formMode === 'create' ? 'Add Review' : 'Edit Review' }}
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
              <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div class="flex items-center gap-2">
                  <i class="pi pi-exclamation-circle text-red-500" aria-hidden="true" />
                  <span>{{ formError }}</span>
                </div>
              </div>

              <!-- Product ID (Create mode only) -->
              <div v-if="formMode === 'create'">
                <label for="review-product-id" class="mb-1.5 block text-sm font-medium text-slate-700">
                  Product ID <span class="text-red-500">*</span>
                </label>
                <input
                  id="review-product-id"
                  v-model.number="form.product_id"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 101"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p v-if="fieldErrors.product_id" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.product_id }}
                </p>
              </div>

              <!-- Star Rating Picker (Inline Interactive Star Rating) -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">
                  Rating <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center gap-1"
                    role="radiogroup"
                    aria-label="Select star rating"
                    @mouseleave="hoverRating = null"
                  >
                    <button
                      v-for="star in 5"
                      :key="star"
                      type="button"
                      :aria-label="`${star} star${star > 1 ? 's' : ''}`"
                      :aria-checked="form.rating === star"
                      role="radio"
                      class="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      @mouseenter="hoverRating = star"
                      @click="form.rating = star"
                    >
                      <i
                        :class="[
                          'text-2xl transition-colors',
                          star <= (hoverRating ?? form.rating)
                            ? 'pi pi-star-fill text-amber-500'
                            : 'pi pi-star text-slate-300',
                        ]"
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <span class="text-sm font-medium text-slate-700">
                    {{ hoverRating ?? form.rating }} / 5 stars
                  </span>
                </div>
              </div>

              <!-- Author Name -->
              <div>
                <label for="review-author-name" class="mb-1.5 block text-sm font-medium text-slate-700">
                  Author Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="review-author-name"
                  v-model="form.author_name"
                  type="text"
                  required
                  placeholder="e.g. Sarah Smith"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p v-if="fieldErrors.author_name" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.author_name }}
                </p>
              </div>

              <!-- Review Title -->
              <div>
                <label for="review-title" class="mb-1.5 block text-sm font-medium text-slate-700">
                  Review Title <span class="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  id="review-title"
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. Exceptional quality and comfort"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Review Comment -->
              <div>
                <label for="review-comment" class="mb-1.5 block text-sm font-medium text-slate-700">
                  Review Comment <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="review-comment"
                  v-model="form.comment"
                  rows="4"
                  required
                  placeholder="Provide detailed customer feedback..."
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p v-if="fieldErrors.comment" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.comment }}
                </p>
              </div>

              <!-- Verified Purchase Checkbox -->
              <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <label for="review-verified-toggle" class="cursor-pointer text-sm font-medium text-slate-900">
                    Verified Purchase
                  </label>
                  <p class="text-xs text-slate-500">
                    Mark as authentic purchase from a verified buyer
                  </p>
                </div>
                <input
                  id="review-verified-toggle"
                  v-model="form.is_verified_purchase"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4">
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
                <span>{{ formSaving ? 'Saving...' : formMode === 'create' ? 'Add Review' : 'Save Changes' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Review Detail Modal -->
    <Teleport to="body">
      <div
        v-if="detailModalVisible && detailReview"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Review Details"
        @mousedown.self="closeDetailModal"
      >
        <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 class="text-lg font-semibold text-slate-900">
              Review Details
            </h3>
            <button
              type="button"
              aria-label="Close dialog"
              class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              @click="closeDetailModal"
            >
              <i class="pi pi-times text-sm" aria-hidden="true" />
            </button>
          </div>

          <!-- Modal Content -->
          <div class="space-y-4 px-6 py-5">
            <!-- Linked Product Card -->
            <div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <img
                v-if="detailReview.product?.image"
                :src="detailReview.product.image"
                :alt="detailReview.product?.name ?? 'Product'"
                class="h-10 w-10 shrink-0 rounded object-cover border border-slate-200"
              />
              <div
                v-else
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-400"
              >
                <i class="pi pi-image text-sm" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">
                  {{ detailReview.product?.name || `Product #${detailReview.product_id}` }}
                </p>
                <p class="text-xs text-slate-500 font-mono">
                  Product ID: #{{ detailReview.product_id }}
                </p>
              </div>
            </div>

            <!-- Author & Verification Header -->
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ detailReview.author_name }}</p>
                <p v-if="detailReview.user_email" class="text-xs text-slate-500">{{ detailReview.user_email }}</p>
              </div>
              <div>
                <span
                  v-if="detailReview.is_verified_purchase"
                  class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                >
                  <i class="pi pi-check-circle text-xs" aria-hidden="true" />
                  Verified Purchase
                </span>
                <span
                  v-else
                  class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                >
                  Unverified
                </span>
              </div>
            </div>

            <!-- Star Rating Visualization -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1">
                <template v-for="star in 5" :key="star">
                  <i
                    :class="[
                      'text-base',
                      star <= detailReview.rating ? 'pi pi-star-fill text-amber-500' : 'pi pi-star text-slate-300',
                    ]"
                    aria-hidden="true"
                  />
                </template>
              </div>
              <span class="text-sm font-semibold text-slate-800">
                {{ detailReview.rating }}.0 out of 5 stars
              </span>
            </div>

            <!-- Full Title & Full Comment -->
            <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <h4 v-if="detailReview.title" class="mb-1 text-sm font-semibold text-slate-900">
                {{ detailReview.title }}
              </h4>
              <p class="whitespace-pre-wrap text-sm text-slate-700">
                {{ detailReview.comment }}
              </p>
            </div>

            <!-- Timestamps -->
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <span>Submitted: {{ formatDateTime(detailReview.created_at) }}</span>
              <span>Updated: {{ formatDateTime(detailReview.updated_at) }}</span>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5 rounded-b-xl">
            <div class="flex items-center gap-2">
              <button
                v-if="canWrite"
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                @click="editFromDetail"
              >
                <i class="pi pi-pencil mr-1 text-[10px]" aria-hidden="true" />
                Edit
              </button>
              <button
                v-if="canDelete"
                type="button"
                class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                @click="deleteFromDetail"
              >
                <i class="pi pi-trash mr-1 text-[10px]" aria-hidden="true" />
                Delete
              </button>
            </div>

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
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <AdminConfirmDialog
      v-model:visible="confirmVisible"
      title="Delete Review"
      :message="confirmMessage"
      confirm-label="Delete Review"
      :danger="true"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import AdminPagination from '@/admin/components/shared/AdminPagination.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import { adminApi } from '@/admin/api/adminApi'
import { usePagination } from '@/admin/composables/usePagination'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import { formatDateTime, formatRelativeTime, truncate } from '@/admin/utils/formatters'
import type {
  Review,
  ReviewListResponse,
  ReviewStats,
} from '@/admin/types/admin'

const breadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Reviews' },
]

const filterSelectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const toast = useToast()
const { hasPermission } = useAdminAuth()

const canRead = computed(() => hasPermission('reviews.read'))
const canWrite = computed(() => hasPermission('reviews.write'))
const canDelete = computed(() => hasPermission('reviews.delete'))

// Pagination
const { page, limit, total, totalPages, setTotal, resetPage } = usePagination(25)

// List & Stats State
const reviews = ref<Review[]>([])
const stats = ref<ReviewStats>({
  total_reviews: 0,
  average_rating: 0,
  verified_count: 0,
  rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
})

const loading = ref(false)
const statsLoaded = ref(false)
const error = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const ratingFilter = ref<string>('all')
const verifiedOnly = ref(false)
const sortFilter = ref<string>('newest')

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || ratingFilter.value !== 'all' || verifiedOnly.value
})

const verifiedDisplay = computed(() => {
  if (stats.value.total_reviews > 0) {
    const pct = Math.round((stats.value.verified_count / stats.value.total_reviews) * 100)
    return `${stats.value.verified_count} (${pct}%)`
  }
  return String(stats.value.verified_count)
})

function getStarPercentage(star: number): number {
  if (stats.value.total_reviews <= 0) return 0
  const count = stats.value.rating_breakdown?.[star] ?? 0
  return Math.round((count / stats.value.total_reviews) * 100)
}

function toggleRatingFilter(star: number): void {
  if (ratingFilter.value === String(star)) {
    ratingFilter.value = 'all'
  } else {
    ratingFilter.value = String(star)
  }
}

function toggleVerifiedOnly(): void {
  verifiedOnly.value = !verifiedOnly.value
}

function resetFilters(): void {
  searchQuery.value = ''
  ratingFilter.value = 'all'
  verifiedOnly.value = false
}

// Modal Form State
const formModalVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingReviewId = ref<string | null>(null)
const formSaving = ref(false)
const formError = ref<string | null>(null)
const hoverRating = ref<number | null>(null)

interface FormState {
  product_id: number | ''
  rating: number
  author_name: string
  title: string
  comment: string
  is_verified_purchase: boolean
}

const form = reactive<FormState>({
  product_id: '',
  rating: 5,
  author_name: '',
  title: '',
  comment: '',
  is_verified_purchase: true,
})

const fieldErrors = reactive({
  product_id: '',
  author_name: '',
  comment: '',
})

// Detail Modal State
const detailModalVisible = ref(false)
const detailReview = ref<Review | null>(null)

// Delete Dialog State
const confirmVisible = ref(false)
const confirmMessage = ref('')
const pendingDeleteReview = ref<Review | null>(null)

// Fetch Reviews
async function fetchReviews(): Promise<void> {
  if (!canRead.value) return

  loading.value = true
  error.value = null

  try {
    const params: Record<string, string | number | boolean> = {
      page: page.value,
      limit: limit.value,
      sort: sortFilter.value,
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (ratingFilter.value !== 'all') {
      params.rating = Number(ratingFilter.value)
    }

    if (verifiedOnly.value) {
      params.verified_only = true
    }

    const data = await adminApi.get<ReviewListResponse>('/api/admin/reviews', params)
    reviews.value = data.reviews ?? []
    setTotal(data.pagination?.total ?? 0)

    if (data.stats) {
      stats.value = data.stats
      statsLoaded.value = true
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong fetching reviews'
  } finally {
    loading.value = false
  }
}

function onPageChange(newPage: number): void {
  page.value = newPage
  fetchReviews()
}

function onLimitChange(newLimit: number): void {
  limit.value = newLimit
  if (page.value === 1) {
    fetchReviews()
  } else {
    resetPage()
    fetchReviews()
  }
}

// Watch filters to reset page and refetch
watch([searchQuery, ratingFilter, verifiedOnly, sortFilter], () => {
  if (page.value === 1) {
    fetchReviews()
  } else {
    resetPage()
    fetchReviews()
  }
})

// Create / Edit Form handlers
function openCreateModal(): void {
  formMode.value = 'create'
  editingReviewId.value = null
  form.product_id = ''
  form.rating = 5
  form.author_name = ''
  form.title = ''
  form.comment = ''
  form.is_verified_purchase = true
  formError.value = null
  fieldErrors.product_id = ''
  fieldErrors.author_name = ''
  fieldErrors.comment = ''
  hoverRating.value = null
  formModalVisible.value = true
}

function openEditModal(review: Review): void {
  formMode.value = 'edit'
  editingReviewId.value = review.id
  form.product_id = review.product_id
  form.rating = review.rating
  form.author_name = review.author_name
  form.title = review.title ?? ''
  form.comment = review.comment
  form.is_verified_purchase = review.is_verified_purchase
  formError.value = null
  fieldErrors.product_id = ''
  fieldErrors.author_name = ''
  fieldErrors.comment = ''
  hoverRating.value = null
  formModalVisible.value = true
}

function closeFormModal(): void {
  formModalVisible.value = false
  formError.value = null
  hoverRating.value = null
}

async function submitForm(): Promise<void> {
  fieldErrors.product_id = ''
  fieldErrors.author_name = ''
  fieldErrors.comment = ''
  formError.value = null

  if (formMode.value === 'create') {
    if (!form.product_id || Number(form.product_id) <= 0 || !Number.isInteger(Number(form.product_id))) {
      fieldErrors.product_id = 'A valid positive product ID is required'
      return
    }
  }

  if (!form.author_name.trim()) {
    fieldErrors.author_name = 'Author name cannot be empty'
    return
  }

  if (!form.comment.trim()) {
    fieldErrors.comment = 'Review comment cannot be empty'
    return
  }

  if (form.rating < 1 || form.rating > 5 || !Number.isInteger(form.rating)) {
    formError.value = 'Rating must be an integer between 1 and 5'
    return
  }

  formSaving.value = true

  try {
    if (formMode.value === 'create') {
      const payload = {
        product_id: Number(form.product_id),
        rating: form.rating,
        title: form.title.trim() ? form.title.trim() : null,
        author_name: form.author_name.trim(),
        comment: form.comment.trim(),
        is_verified_purchase: form.is_verified_purchase,
      }

      await adminApi.post('/api/admin/reviews', payload)

      toast.add({
        severity: 'success',
        summary: 'Review Added',
        detail: 'Review created successfully',
        life: 3000,
      })
    } else {
      if (!editingReviewId.value) return

      const payload = {
        rating: form.rating,
        title: form.title.trim() ? form.title.trim() : null,
        author_name: form.author_name.trim(),
        comment: form.comment.trim(),
        is_verified_purchase: form.is_verified_purchase,
      }

      await adminApi.put(`/api/admin/reviews/${editingReviewId.value}`, payload)

      toast.add({
        severity: 'success',
        summary: 'Review Updated',
        detail: 'Review updated successfully',
        life: 3000,
      })
    }

    closeFormModal()
    fetchReviews()
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Operation failed'
  } finally {
    formSaving.value = false
  }
}

// Detail Modal handlers
function openDetailModal(review: Review): void {
  detailReview.value = review
  detailModalVisible.value = true
}

function closeDetailModal(): void {
  detailModalVisible.value = false
  detailReview.value = null
}

function editFromDetail(): void {
  if (!detailReview.value) return
  const rev = detailReview.value
  closeDetailModal()
  openEditModal(rev)
}

function deleteFromDetail(): void {
  if (!detailReview.value) return
  const rev = detailReview.value
  closeDetailModal()
  askDelete(rev)
}

// Delete handlers
function askDelete(review: Review): void {
  pendingDeleteReview.value = review
  confirmMessage.value = `Are you sure you want to delete the review by "${review.author_name}" for product #${review.product_id}? This will update the product's average rating calculation.`
  confirmVisible.value = true
}

async function handleConfirmDelete(): Promise<void> {
  if (!pendingDeleteReview.value) return

  try {
    await adminApi.delete(`/api/admin/reviews/${pendingDeleteReview.value.id}`)

    toast.add({
      severity: 'success',
      summary: 'Review Deleted',
      detail: 'Review deleted successfully',
      life: 3000,
    })

    confirmVisible.value = false
    pendingDeleteReview.value = null
    fetchReviews()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: err instanceof Error ? err.message : 'Failed to delete review',
      life: 4000,
    })
  }
}

// Escape key listener for modals
function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    if (formModalVisible.value) {
      closeFormModal()
    } else if (detailModalVisible.value) {
      closeDetailModal()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  fetchReviews()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
</style>
