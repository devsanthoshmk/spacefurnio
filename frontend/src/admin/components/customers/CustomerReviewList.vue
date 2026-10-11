<template>
  <div v-if="loading" class="space-y-4">
    <div v-for="n in 2" :key="n" class="h-28 animate-pulse rounded-xl border border-admin-border bg-white p-5" />
  </div>

  <div v-else-if="!reviews || reviews.length === 0" class="rounded-xl border border-admin-border bg-white p-8">
    <AdminEmptyState
      title="No reviews yet"
      description="This customer has not submitted any product reviews."
      icon="pi pi-star"
    />
  </div>

  <div v-else class="space-y-4">
    <div
      v-for="review in reviews"
      :key="review.id"
      class="rounded-xl border border-admin-border bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1.5">
          <!-- Rating Stars & Verified Badge -->
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center text-amber-400">
              <i
                v-for="star in 5"
                :key="star"
                :class="[
                  star <= review.rating ? 'pi pi-star-fill' : 'pi pi-star text-slate-200',
                  'text-sm'
                ]"
                aria-hidden="true"
              />
            </div>

            <span
              v-if="review.is_verified_purchase"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
            >
              <i class="pi pi-check-circle text-[10px]" aria-hidden="true" />
              Verified Purchase
            </span>
          </div>

          <!-- Title -->
          <h4 v-if="review.title" class="font-semibold text-admin-text">
            {{ review.title }}
          </h4>

          <!-- Comment -->
          <p class="text-sm text-admin-text-secondary leading-relaxed">
            {{ review.comment }}
          </p>

          <!-- Product info -->
          <div v-if="review.product || review.product_id" class="pt-1 text-xs text-admin-text-muted">
            <span>Product: </span>
            <router-link
              v-if="review.product?.slug"
              :to="`/admin/products`"
              class="font-medium text-admin-primary hover:underline"
            >
              {{ review.product.name }}
            </router-link>
            <span v-else class="font-medium text-slate-700">Product #{{ review.product_id }}</span>
          </div>
        </div>

        <!-- Date -->
        <span class="shrink-0 text-xs text-admin-text-muted">
          {{ formatDate(review.created_at) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import { formatDate } from '@/admin/utils/formatters'
import type { Review } from '@/admin/types/admin'

export interface CustomerReviewItem {
  id: string
  product_id: number
  rating: number
  title: string | null
  comment: string
  is_verified_purchase: boolean
  created_at: string
  product?: {
    name: string
    slug: string
    image?: string | null
  }
}

withDefaults(
  defineProps<{
    reviews: (Review | CustomerReviewItem)[]
    loading?: boolean
  }>(),
  { loading: false },
)
</script>