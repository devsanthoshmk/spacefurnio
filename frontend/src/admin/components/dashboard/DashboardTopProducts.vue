<template>
  <div class="rounded-xl border border-admin-border bg-white p-5 shadow-sm">
    <h2 class="mb-4 text-base font-semibold text-admin-text">Top Products</h2>
    <div v-if="products.length === 0" class="flex h-40 items-center justify-center text-sm text-admin-text-muted">
      No product sales in this period
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-admin-text-secondary">
            <th class="pb-3 pr-3 font-medium">#</th>
            <th class="pb-3 pr-3 font-medium">Product</th>
            <th class="pb-3 pr-3 text-right font-medium">Units</th>
            <th class="pb-3 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(product, index) in products"
            :key="product.id"
            class="border-t border-admin-border transition-colors last:border-b-0 hover:bg-slate-50"
          >
            <td class="py-3 pr-3 text-admin-text-muted">{{ index + 1 }}</td>
            <td class="py-3 pr-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.name"
                  class="h-8 w-8 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
                <span
                  v-else
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100"
                >
                  <i class="pi pi-box text-sm text-slate-400" />
                </span>
                <span class="font-medium text-admin-text">{{ truncate(product.name, 40) }}</span>
              </div>
            </td>
            <td class="py-3 pr-3 text-right text-admin-text-secondary">{{ product.units_sold }}</td>
            <td class="py-3 text-right font-medium text-admin-text">
              {{ formatCurrency(product.revenue * 100) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, truncate } from '@/admin/utils/formatters'
import type { TopProduct } from '@/admin/types/admin'

defineProps<{
  products: TopProduct[]
}>()
</script>
