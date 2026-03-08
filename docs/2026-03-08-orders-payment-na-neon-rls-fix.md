# Orders Payment N/A Fix via Neon RLS Policy (2026-03-08)

## Issue
Orders modal showed `Payment: N/A` even when `payments.method` had values like `upi`.

## Live Verification (Neon)
- `payments` table had data (`method = upi`).
- `orders` and `order_items` had SELECT policies.
- `payments` had **no SELECT RLS policy**, so embedded `payments(method,status)` in Neon Data API orders query could not return rows.

## Root Cause
Neon Data API embedded relation reads are still subject to child-table RLS. Missing `payments` policy caused empty embedded `payments` arrays, leading UI fallback to `N/A`.

## Fix Applied
### 1) Live DB policy fix (applied)
Created `users_can_read_own_payments` policy on `payments`:

- `FOR SELECT TO public`
- `USING EXISTS (...)` join to `orders`
- ownership check via JWT claim:
  - `(o.user_id)::text = ((current_setting('request.jwt.claims', true))::jsonb ->> 'sub')`

### 2) Migration hardening
Updated `backend/ecommerce-backend/db/migrations/0007_orders_data_api_rls_fix.sql`:

- Keeps grants and RLS enablement for `payments`
- Uses direct `current_setting('request.jwt.claims', true)` checks in all policies
- Makes optional `auth.user_id()` function creation privilege-safe (non-blocking)

### 3) Docs/schema sync
- Updated payment method comment in `db/schema/orders.ts`
- Updated `docs/reference/SCHEMA-REFERENCE.md` payment method list and Data API read note

## Important Constraint
Per request, the Orders frontend continues to read from Neon Data API (`/orders?...payments(...)`) and was not switched to Worker reads.

## Expected Result
Orders modal now receives embedded `payments.method` for owned orders and displays `UPI`/other method values instead of `N/A`.
