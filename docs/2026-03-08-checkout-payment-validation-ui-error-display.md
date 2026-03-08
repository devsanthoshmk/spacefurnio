# Checkout Payment Validation UI Error Display (2026-03-08)

## Change
Checkout UI now shows backend payment validation details directly to users.

## Implementation
### 1) API Client Error Parsing
Updated `frontend/src/lib/api.js` in `checkout(orderData)`:

- Parses non-2xx response JSON
- Uses backend `message` as error text
- Extracts `allowed_methods` and attaches as `err.allowedMethods`

### 2) Checkout Modal Error Rendering
Updated `frontend/src/components/CheckoutModal.vue` in `placeOrder()` catch block:

- If `err.allowedMethods` exists, renders:
  - `<message> Allowed: card, upi, ...`
- Otherwise shows existing generic error fallback.

## Result
When backend rejects an invalid payment method (400), users now see a clear actionable error in checkout UI instead of only a generic failure message.
