# Strict Checkout Payment Method Validation (2026-03-08)

## Change
Checkout now enforces strict payment method validation in the worker route.

## Updated Behavior
In `backend/ecommerce-backend/server-worker/src/routes/orders.ts` (`POST /api/orders/checkout`):

- Reads payment method from:
  - `paymentMethod`
  - `payment_method`
  - `payment.method`
- Normalizes to lowercase.
- Returns `400` if missing:
  - `message: "paymentMethod is required"`
- Returns `400` if invalid:
  - `message: "Invalid payment method: <value>"`
  - `allowed_methods: ["card", "upi", "cod", "razorpay", "paypal", "stripe"]`
- Continues order creation only for allowed values.

## Why
Prevents silent fallback to a default payment method and guarantees payment data integrity.
