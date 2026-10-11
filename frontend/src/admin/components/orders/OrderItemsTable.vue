<template>
  <div v-if="!items || items.length === 0" class="py-8 text-center text-sm text-admin-text-muted">
    No items in this order
  </div>
  <div v-else class="overflow-x-auto">
    <table class="w-full min-w-[560px] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <th class="px-4 py-3 font-medium">Product</th>
          <th class="px-4 py-3 text-center font-medium">Qty</th>
          <th class="px-4 py-3 text-right font-medium">Unit Price</th>
          <th class="px-4 py-3 text-right font-medium">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
        >
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <img
                v-if="item.product?.image"
                :src="item.product.image"
                :alt="item.product?.name || `Product #${item.productId}`"
                class="h-12 w-12 shrink-0 rounded-lg border border-slate-100 object-cover"
              />
              <div
                v-else
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100"
              >
                <i class="pi pi-image text-slate-400" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="font-medium text-slate-900 truncate">
                  {{ item.product?.name || `Product #${item.productId}` }}
                </p>
                <p v-if="!item.product" class="text-xs text-slate-400">
                  Product details unavailable
                </p>
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-center text-slate-700">{{ item.quantity }}</td>
          <td class="px-4 py-3 text-right whitespace-nowrap text-slate-700">
            {{ formatCurrency((item.unitPrice || 0) * 100) }}
          </td>
          <td class="px-4 py-3 text-right font-medium whitespace-nowrap text-slate-900">
            {{ formatCurrency((item.subtotal ?? ((item.quantity || 0) * (item.unitPrice || 0))) * 100) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t border-slate-200 bg-slate-50/60">
          <td colspan="3" class="px-4 py-3 text-right text-sm font-semibold text-slate-900">Total</td>
          <td class="px-4 py-3 text-right font-semibold whitespace-nowrap text-slate-900">
            {{ formatCurrency(orderTotal * 100) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/admin/utils/formatters'
import type { OrderItem } from '@/admin/types/admin'

const props = defineProps<{
  items: OrderItem[]
}>()

const orderTotal = computed(() =>
  (props.items || []).reduce(
    (sum, item) => sum + (item.subtotal ?? ((item.quantity || 0) * (item.unitPrice || 0))),
    0,
  ),
)
</script>
