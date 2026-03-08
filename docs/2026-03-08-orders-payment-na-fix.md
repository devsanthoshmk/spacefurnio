# Orders Modal Payment N/A Fix (2026-03-08)

## Issue
Orders in `OrdersModal` were showing `Payment: N/A` even when payment method existed in API data.

## Root Cause
In `fetchOrders()` (`frontend/src/components/OrdersModal.vue`), payment mapping always recomputed from `order.payments` and ignored existing top-level fields such as `payment_method`.

## Fix Applied
Updated payment extraction logic to:

1. Prefer top-level `order.payment_method` / `order.paymentMethod`
2. Fallback to nested `order.payments` (array or object)
3. Support keys: `method`, `payment_method`, `paymentMethod`
4. Use `N/A` only when all sources are empty

## Result
Payment method now renders correctly in Orders modal when present in API payload.
