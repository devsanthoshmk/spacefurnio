# Schema Reference — All Tables, Columns, Constraints & RLS Policies

> **Source of Truth:** `ecommerce-backend/db/schema/`  
> **ORM:** Drizzle ORM (TypeScript)
> **Last Generated:** 2026-02-27

---

## Sensitivity Classification

Every table is classified as either **Sensitive** (Worker-only write access) or **Non-Sensitive** (Data API accessible). This determines how the client interacts with it.

| 🔴 Sensitive — Worker Only | 🟢 Non-Sensitive — Data API OK |
|---|---|
| `users`, `user_roles`, `user_sessions` | `carts`, `cart_items` |
| `orders`, `order_items` (write) | `wishlists`, `wishlist_items` |
| `order_status_history` | `user_addresses` |
| `payments`, `payment_transactions` | `orders`, `order_items` (read-only) |
| `shipments`, `shipment_items` | `notifications` (own only) |
| `return_requests`, `return_items`, `refunds` | |
| `coupons`, `coupon_redemptions` | |
| `audit_logs`, `event_logs` | |
| `roles` | |

> **Note:** `products`, `inventory`, `inventory_movements`, and `reviews` tables have been **removed** from this project as of 2026-02-27. The authoritative product catalog now lives in a separate Neon project (`icy-union-81751721`). `product_id` columns in `cart_items`, `wishlist_items`, and `order_items` remain as plain UUIDs without FK constraints.

---

## 📁 `db/schema/users.ts`

### `roles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `text` | `PRIMARY KEY` | Values: `'admin'`, `'customer'`, `'support'` |
| `description` | `text` | nullable | Human-readable label |

**Sensitivity:** 🔴 Sensitive — Admin-managed  
**RLS:** Not required (no user data)

---

### `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `email` | `text` | `UNIQUE`, `NOT NULL` | |
| `password_hash` | `text` | nullable | Nullable for OAuth-only accounts |
| `phone_number` | `text` | `UNIQUE`, nullable | |
| `is_active` | `boolean` | `NOT NULL`, `DEFAULT true` | Soft disable |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |
| `updated_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Indexes:** `users_email_idx (email)`, `users_phone_idx (phone_number)`  
**Sensitivity:** 🔴 Sensitive — Contains `password_hash`. Worker reads only. Never exposed via Data API.  
**RLS:** Enable RLS but grant NO DATA API access. All writes via Worker.

---

### `user_roles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` (cascade) | |
| `role_id` | `text` | `NOT NULL`, FK → `roles.id` (cascade) | |
| *(pk)* | composite | `PRIMARY KEY (user_id, role_id)` | |

**Sensitivity:** 🔴 Sensitive — Role assignment must never be user-writable.

---

### `user_addresses`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` (cascade) | |
| `address_line_1` | `text` | `NOT NULL` | |
| `address_line_2` | `text` | nullable | |
| `city` | `text` | `NOT NULL` | |
| `state` | `text` | `NOT NULL` | |
| `postal_code` | `text` | `NOT NULL` | |
| `country` | `text` | `NOT NULL` | |
| `is_default` | `boolean` | `NOT NULL`, `DEFAULT false` | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🟢 Non-Sensitive  
**RLS:**
```sql
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses"
ON user_addresses FOR ALL TO authenticator
USING (user_id = (current_setting('request.jwt.claim.sub', true))::uuid)
WITH CHECK (user_id = (current_setting('request.jwt.claim.sub', true))::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON user_addresses TO authenticator;
```

---

### `user_sessions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` (cascade) | |
| `refresh_token` | `text` | `UNIQUE`, `NOT NULL` | |
| `expires_at` | `timestamp` | `NOT NULL` | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Refresh token table. Backend only.

---

## 📁 `db/schema/catalog.ts` *(Emptied — 2026-02-27)*

> ⚠️ **All catalog tables (`products`, `inventory`, `inventory_movements`, `reviews`) have been removed from this project.**
>
> The authoritative product catalog now lives in a separate Neon project: **`icy-union-81751721`**.
>
> `product_id` columns in `cart_items`, `wishlist_items`, and `order_items` remain as plain `uuid` columns **without FK constraints** (cross-project references cannot use PostgreSQL foreign keys).
>
> If you need to look up product details from this backend, query the products project via its own connection string or Data API.

---

## 📁 `db/schema/shopping.ts`

### `carts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `user_id` | `uuid` | `UNIQUE`, `NOT NULL`, FK → `users.id` (cascade) | One cart per user |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |
| `updated_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🟢 Non-Sensitive  
**RLS:**
```sql
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart"
ON carts FOR ALL TO authenticator
USING (user_id = (current_setting('request.jwt.claim.sub', true))::uuid)
WITH CHECK (user_id = (current_setting('request.jwt.claim.sub', true))::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON carts TO authenticator;
```

---

### `cart_items`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `cart_id` | `uuid` | `NOT NULL`, FK → `carts.id` (cascade) | |
| `product_id` | `uuid` | `NOT NULL` | Cross-project ref → `icy-union-81751721` products |
| `quantity` | `integer` | `NOT NULL`, `DEFAULT 1` | |
| `price_snapshot` | `decimal(10,2)` | `NOT NULL` | Price at time of adding to cart |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |
| *(unique)* | composite | `UNIQUE (cart_id, product_id)` | No duplicate products per cart |

**Sensitivity:** 🟢 Non-Sensitive  
**RLS (indirect ownership via carts):**
```sql
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart items"
ON cart_items FOR ALL TO authenticator
USING (
    cart_id IN (
        SELECT id FROM carts
        WHERE user_id = (current_setting('request.jwt.claim.sub', true))::uuid
    )
)
WITH CHECK (
    cart_id IN (
        SELECT id FROM carts
        WHERE user_id = (current_setting('request.jwt.claim.sub', true))::uuid
    )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticator;
```

---

### `wishlists`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `user_id` | `uuid` | `UNIQUE`, `NOT NULL`, FK → `users.id` (cascade) | One wishlist per user |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🟢 Non-Sensitive  
**RLS:** Same pattern as `carts` — replace table name.

---

### `wishlist_items`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `wishlist_id` | `uuid` | `NOT NULL`, FK → `wishlists.id` (cascade) | |
| `product_id` | `uuid` | `NOT NULL` | Cross-project ref → `icy-union-81751721` products |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |
| *(unique)* | composite | `UNIQUE (wishlist_id, product_id)` | No duplicate products |

**Sensitivity:** 🟢 Non-Sensitive  
**RLS:** Same pattern as `cart_items` — join through `wishlists`.

---

## 📁 `db/schema/orders.ts`

### `orders`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` (cascade) | |
| `address_id` | `uuid` | nullable, FK → `user_addresses.id` | Snapshot at order time |
| `status` | `text` | `NOT NULL`, `DEFAULT 'pending'` | `pending`, `paid`, `shipped`, `delivered`, `cancelled` |
| `total_amount` | `decimal(10,2)` | `NOT NULL` | Server-calculated only |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive (writes). 🟢 Read-only (via Data API).  
**RLS:**
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- Read-only: users see only their own orders
CREATE POLICY "Users read own orders"
ON orders FOR SELECT TO authenticator
USING (user_id = (current_setting('request.jwt.claim.sub', true))::uuid);
-- NO INSERT/UPDATE/DELETE policies → these return 403
GRANT SELECT ON orders TO authenticator;
```

---

### `order_items`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `order_id` | `uuid` | `NOT NULL`, FK → `orders.id` (cascade) | |
| `product_id` | `uuid` | `NOT NULL` | Cross-project ref → `icy-union-81751721` products |
| `quantity` | `integer` | `NOT NULL` | |
| `unit_price` | `decimal(10,2)` | `NOT NULL` | Price at time of order |

**Sensitivity:** 🔴 Sensitive (writes). 🟢 Read-only.

---

### `order_status_history`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `order_id` | `uuid` | `NOT NULL`, FK → `orders.id` (cascade) | |
| `status` | `text` | `NOT NULL` | |
| `notes` | `text` | nullable | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Append-only audit trail.

---

### `payments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `order_id` | `uuid` | `UNIQUE`, `NOT NULL`, FK → `orders.id` (cascade) | 1-to-1 with order |
| `amount` | `decimal(10,2)` | `NOT NULL` | |
| `method` | `text` | `NOT NULL` | `'stripe'`, `'paypal'` |
| `status` | `text` | `NOT NULL`, `DEFAULT 'pending'` | `pending`, `completed`, `failed`, `refunded` |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Financial data. Never expose to Data API.

---

### `payment_transactions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `payment_id` | `uuid` | `NOT NULL`, FK → `payments.id` (cascade) | |
| `gateway_status` | `text` | nullable | Raw status from Stripe/PayPal |
| `gateway_reference` | `text` | nullable | External payment ID |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Raw gateway data.

---

### `shipments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `order_id` | `uuid` | `NOT NULL`, FK → `orders.id` (cascade) | |
| `tracking_number` | `text` | nullable | |
| `carrier` | `text` | nullable | |
| `status` | `text` | `NOT NULL`, `DEFAULT 'pending'` | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |
| `updated_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Written by admin only.

---

### `shipment_items`, `return_requests`, `return_items`, `refunds`

All follow the same 🔴 **Sensitive** classification. All writes go through the Worker. No Data API access.

See `db/schema/orders.ts` for full column definitions.

---

## 📁 `db/schema/promotions.ts`

### `coupons`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `code` | `text` | `UNIQUE`, `NOT NULL` | Coupon code string |
| `description` | `text` | nullable | |
| `discount_type` | `text` | `NOT NULL` | `'percentage'`, `'fixed_amount'` |
| `discount_value` | `decimal(10,2)` | `NOT NULL` | |
| `is_active` | `boolean` | `NOT NULL`, `DEFAULT true` | |
| `expires_at` | `timestamp` | nullable | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Coupons must be validated server-side to prevent manipulation.

---

### `coupon_redemptions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `coupon_id` | `uuid` | `NOT NULL`, FK → `coupons.id` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` | |
| `order_id` | `uuid` | `NOT NULL`, FK → `orders.id` | |
| `discount_applied` | `decimal(10,2)` | `NOT NULL` | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Must be atomic part of checkout transaction.

---

## 📁 `db/schema/system.ts`

### `notifications`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `users.id` (cascade) | |
| `title` | `text` | `NOT NULL` | |
| `message` | `text` | `NOT NULL` | |
| `is_read` | `boolean` | `NOT NULL`, `DEFAULT false` | |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🟢 Non-Sensitive (own notifications only)  
**RLS:** Same pattern as `carts`.

---

### `audit_logs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `actor_id` | `uuid` | nullable | Admin or system performing the action |
| `action` | `text` | `NOT NULL` | e.g., `'create_refund'`, `'update_inventory'` |
| `entity_type` | `text` | `NOT NULL` | Table name: `'orders'`, `'inventory'`, etc. |
| `entity_id` | `text` | `NOT NULL` | UUID stored as text for flexibility |
| `details` | `text` | nullable | JSON payload of changes |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Internal admin audit trail only.

---

### `event_logs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY` | |
| `user_id` | `uuid` | nullable | Optional (anonymous events) |
| `event_type` | `text` | `NOT NULL` | e.g., `'add_to_cart'`, `'checkout_started'` |
| `event_data` | `text` | nullable | JSON payload |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT NOW()` | |

**Sensitivity:** 🔴 Sensitive — Analytics/event tracking. Managed by Worker only.
