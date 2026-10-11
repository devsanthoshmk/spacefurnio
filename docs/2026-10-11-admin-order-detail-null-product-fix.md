# Admin Order Detail - Null Product and Schema Resilience Fix

**Date:** 2026-10-11  
**Category:** Bug Fix  
**Scope:** Admin Orders Detail & Orders List (`frontend/src/admin/`)

## Issue Summary
When navigating to the Admin Order Detail page (`/admin/orders/:id`), the page crashed with:
```
Uncaught (in promise) TypeError: can't access property "image", item.product is null
  OrderItemsTable.vue:24
```
This occurred because `item.product` can be `null` when:
1. An ordered product is missing or removed from the catalog database.
2. The product enrichment query returns `null` for a product ID.
3. Database records have orphaned items without corresponding catalog items.

Because `OrderItemsTable.vue` directly accessed `item.product.image` and `item.product.name` without optional chaining or null checks, Vue threw an unhandled runtime exception during component rendering, leaving the order details view blank.

## Changes Made

1. **`OrderItemsTable.vue`**:
   - Added optional chaining (`item.product?.image`, `item.product?.name`).
   - Added fallback product title (`item.product?.name || 'Product #' + item.productId`).
   - Added fallback placeholder subtitle (`Product details unavailable`) when `item.product` is null.
   - Guarded subtotal and order total calculations against missing numbers or null items.

2. **`types/admin.ts`**:
   - Updated `OrderItem['product']` to `{ name: string; slug: string; image: string | null } | null`.
   - Updated `OrderDetail['shipping']` interface to support both camelCase and snake_case address field structures.

3. **`OrderShippingCard.vue`**:
   - Added dual-format support for camelCase (`firstName`, `address`, etc.) and snake_case (`shipping_first_name`, etc.) fields returned by the order endpoint.
   - Added null guards and fallbacks for all shipping fields.

4. **`OrderStatusTimeline.vue` & `OrderActionsPanel.vue`**:
   - Guarded `history` and `refunds` arrays to safely handle null or undefined collections without crashing.

5. **`AdminOrderDetail.vue` & `AdminOrders.vue`**:
   - Guarded `order.customer?.name`, `order.customer?.email`, and `order.customer?.city` against null/undefined customer values.

## Verification
- `pnpm lint` in `frontend/` passed with 0 errors.
- `pnpm build` in `frontend/` built successfully with Vite and SSG prerender.
- `pnpm exec tsc --noEmit` in `backend/ecommerce-backend/server-worker/` passed with 0 errors.
