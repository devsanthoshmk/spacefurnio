# Checkout Payment Persistence + Orders Display Fix (2026-03-08)

## Problem
`Payment: N/A` appeared in Orders modal, and payment records were not reliably present in `payments` for new checkouts.

## Root Cause
Payment persistence depended on a single request key (`paymentMethod`) and conditional insertion (`if (paymentMethod)`). Any mismatch/empty value skipped payment insert.

## Flow Updated
1. Checkout UI sends selected payment method in both keys:
   - `paymentMethod`
   - `payment_method`
2. Worker checkout route accepts all supported shapes:
   - `paymentMethod`
   - `payment_method`
   - `payment.method`
3. Worker normalizes to lowercase and validates against allowed methods (`card`, `upi`, `cod`, `razorpay`, `paypal`, `stripe`).
4. Worker always inserts a row into `payments` with normalized method.
5. Orders modal formats stored method for display (`Cash on Delivery`, `UPI`, `Card`, etc.).

## Files Changed
- `backend/ecommerce-backend/server-worker/src/routes/orders.ts`
- `frontend/src/components/CheckoutModal.vue`
- `frontend/src/components/OrdersModal.vue`

## Result
New checkouts now persist payment method reliably in `payments`, and Orders modal uses that value consistently instead of showing `N/A` for valid data.
