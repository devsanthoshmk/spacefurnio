# Neon Data API — Complete Setup & Operations Guide

> **Project:** `ecommerce-backend` | **Neon Project ID:** `proud-shadow-42759289`  
> **Written:** 2026-02-26 | **Author:** Antigravity AI Agent

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [How the Neon Data API Works](#2-how-the-neon-data-api-works)
3. [The PostgREST Role Model (Critical)](#3-the-postgrest-role-model-critical)
4. [What We Fixed — Full Incident Log](#4-what-we-fixed--full-incident-log)
5. [JWT Claims Mapping — The Root Cause & Fix](#5-jwt-claims-mapping--the-root-cause--fix)
6. [Row Level Security (RLS) Guide](#6-row-level-security-rls-guide)
7. [How to Access the Neon Data API (Full Reference)](#7-how-to-access-the-neon-data-api-full-reference)
8. [Adding RLS for Future Tables — Step-by-Step](#8-adding-rls-for-future-tables--step-by-step)
9. [Current Role & Permission Map](#9-current-role--permission-map)
10. [Complete Bruno / curl Test Commands](#10-complete-bruno--curl-test-commands)
11. [Troubleshooting Cheat Sheet](#11-troubleshooting-cheat-sheet)

---

## 1. Architecture Overview

This project uses a **dual-access architecture**, separating sensitive and non-sensitive operations:

```
                        ┌─────────────────────────────┐
                        │       Frontend (Browser)     │
                        └─────────────┬───────────────┘
                                      │
               ┌──────────────────────┼──────────────────────┐
               │                      │                      │
               ▼                      ▼                      ▼
   Neon Data API (PostgREST)   CF Worker (Production)   Express (Legacy / Dev)
   Non-Sensitive Operations     /auth/login            /auth/login
   (carts, wishlists, etc.)     /api/orders/*          /api/orders/*
               │                      │                      │
               ▼                      ▼                      ▼
     postgresql://authenticator  postgresql://neondb_owner  postgresql://neondb_owner
     (JWT-gated, RLS-protected)  (Full elevated access)    (Full elevated access)
               │
               └──────► Neon Serverless Postgres
```

**Key principle:**
- **Non-sensitive data** (carts, wishlists, user addresses) → accessed directly from the browser via the **Neon Data API** with JWT authentication + RLS.
- **Sensitive data** (orders, payments, refunds) → only written by the backend using the privileged `neondb_owner` role. Never exposed directly to the browser.

---

## 2. How the Neon Data API Works

The Neon Data API is a **PostgREST-compatible HTTP REST API** that sits in front of your Postgres database. Once provisioned, it exposes every table and function in your schema as a REST endpoint.

### Key Endpoints

| Resource | URL Pattern |
|---|---|
| Base URL | `https://ep-ancient-frog-aimehta7/rest/v1/` |
| List rows | `GET /rest/v1/{table}` |
| Filter rows | `GET /rest/v1/{table}?column=eq.value` |
| Insert rows | `POST /rest/v1/{table}` |
| Update rows | `PATCH /rest/v1/{table}?column=eq.value` |
| Delete rows | `DELETE /rest/v1/{table}?column=eq.value` |
| Nested join | `GET /rest/v1/{table}?select=*,related_table(*)` |
| RPC function | `POST /rest/v1/rpc/{function_name}` |
| **Catalog** (Ext) | `https://icy-union-81751721/rest/v1/` | (Separate Project) |

### Required HTTP Headers

Every request **must** include all three headers:

```
Authorization: Bearer <your_jwt_token>
neon-connection-string: postgresql://authenticator@<host>/neondb?sslmode=require
Content-Type: application/json   (for POST/PATCH)
```

> **Important:** The `authenticator` in the connection string is a special database role managed by Neon — it is the "gateway" role never changed directly.

---

## 3. The PostgREST Role Model (Critical)

This is the **most misunderstood part** of Neon Data API. Understanding this correctly is essential for all future database work.

### The 3-Role Chain

```
HTTP Request (with JWT)
        │
        ▼
  ┌─────────────┐
  │ authenticator│  ← Receives every request. Has LOGIN privilege.
  └──────┬──────┘    Managed by Neon; do not modify it.
         │
         │  Reads JWT payload → finds "role" claim
         │  Runs: SET ROLE <role_from_jwt_claim>
         │
         ▼
  ┌─────────────┐
  │    admin    │  ← The role named in your JWT (e.g., "role": "admin")
  │ (or "authenticated") │  Must exist as a database ROLE.
  └──────┬──────┘    authenticator must have GRANT <role> TO authenticator.
         │
         │  Now executes your SQL query as this role
         │  Subject to GRANT permissions + RLS policies
         ▼
  ┌─────────────┐
  │  Your Table │  ← RLS policies run here using current_setting('request.jwt.claims')
  └─────────────┘
```

### Why `authenticator` Cannot Be Skipped

If you PUT `authenticated` or `admin` directly in the `neon-connection-string` header, Neon's authentication gateway will return:
```json
{"message":"missing authentication credentials: required password"}
```
Because those roles do NOT have login credentials — only `authenticator` does. You must always connect as `authenticator` and let the JWT dictate the role switch.

---

## 4. What We Fixed — Full Incident Log

### Issue 1: `"missing authentication credentials: required password"`
**Root Cause:** The `neon-connection-string` header was set to `postgresql://authenticated@...` instead of `postgresql://authenticator@...`.

**Fix:** Always use `authenticator` as the username in the connection string:
```
neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Issue 2: `"role \"admin\" does not exist"`
**Root Cause:** The JWT payload contained `"role": "admin"`, but the Postgres database had no database role named `admin`. PostgREST tried to run `SET ROLE admin` and failed.

**Fix:** Created the role and granted `authenticator` permission to switch to it:
```sql
CREATE ROLE admin NOLOGIN;
GRANT admin TO authenticator;
```

### Issue 3: `"permission denied to set role \"admin\""`
**Root Cause:** The `admin` role existed, but the `authenticator` role had not been granted the ability to switch to it.

**Fix:** `GRANT admin TO authenticator;` (same as above — this one command addresses both Issues 2 and 3).

### Issue 4: `"permission denied for table carts"`
**Root Cause:** The `admin` role existed and `authenticator` could switch to it, but `admin` had zero privileges on your tables.

**Fix:** Granted full table privileges:
```sql
GRANT USAGE ON SCHEMA public TO admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin;
```

### Issue 5: Carts returned `[]` even after all permissions were fixed
**Root Cause:** The RLS (Row Level Security) policy on `carts` used the wrong method to read the JWT subject. See Section 5 for full details.

**Fix:** Altered the policy to use `request.jwt.claims` (jsonb) instead of `request.jwt.claim.sub` (scalar string).

### Issue 6: `cart_items` table had RLS enabled but NO policy
**Root Cause:** Drizzle schema enabled RLS on `cart_items` but never created an actual policy, so RLS blocked all access (default-deny when RLS is on and no policy exists).

**Fix:** Created a policy linking cart items back to the current user via the carts table.

---

## 5. JWT Claims Mapping — The Root Cause & Fix

This is the subtlest bug in the whole setup. Understanding it will save you hours in the future.

### How Neon Data API Exposes JWT Claims

When you send a request with a Bearer JWT, PostgREST (Neon Data API) cryptographically validates the token and loads the entire payload into **two different Postgres session settings**:

| Setting | Type | Value Example |
|---|---|---|
| `request.jwt.claims` | `text` (raw JSON) | `{"sub":"49364355...","email":"admin@store.com","role":"admin","exp":...}` |
| `request.jwt.claim.sub` | `text` (scalar) | `49364355-5bcb-4645-aa99-619bd373878c` |

### The Bug: Why `request.jwt.claim.sub` Returned Empty

The Drizzle-generated RLS policy (from a prior session) was:
```sql
-- BROKEN ❌
(user_id)::text = current_setting('request.jwt.claim.sub', true)
```

The **singular** `request.jwt.claim.sub` (with dot-notation access) is the **older/legacy** PostgREST v9 approach. In the Neon-hosted PostgREST version, this scalar accessor returns an empty string `''`, causing the WHERE clause to evaluate as `false` for every row — hence the empty `[]` result despite data existing.

### The Fix: Parse the Full Claims JSON

```sql
-- CORRECT ✅
(user_id)::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
```

This reads the entire `request.jwt.claims` setting as JSON and then extracts the `sub` field using the `->>` operator (returns text). This works reliably in all PostgREST versions.

### Applied to Your Database

```sql
-- Fixed the carts policy
ALTER POLICY "Users can manage own cart" ON carts USING (
    (user_id)::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
);

-- Fixed the cart_items policy (also created from scratch)
CREATE POLICY "Users can manage own cart items" ON cart_items FOR ALL USING (
    cart_id IN (
        SELECT id FROM carts
        WHERE user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
);
```

> **Rule for all future RLS policies:** Always use `current_setting('request.jwt.claims', true)::jsonb ->> 'field_name'` syntax.

---

## 6. Row Level Security (RLS) Guide

### How RLS Works in This Project

RLS policies are Postgres-native row-level filters that automatically apply to every query against a secured table. When a user with role `admin` runs `SELECT * FROM carts`, they only ever receive rows where `user_id = their_sub_from_jwt`, even though they technically have `SELECT` privileges on the full table.

### Checking Current RLS Status

```sql
-- View all policies in the database
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
ORDER BY tablename;

-- Check if RLS is enabled on a specific table
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'your_table_name';
```

### Current Policies in This Project

| `carts` | "Users can manage own cart" | ALL | `user_id = jwt.sub` |
| `cart_items` | "Users can manage own cart items" | ALL | `cart_id` belongs to a cart owned by `jwt.sub` |
| `products` | **REMOVED** | N/A | Moved to `icy-union-81751721` |
| `reviews` | **REMOVED** | N/A | Moved to `icy-union-81751721` |

---

## 7. How to Access the Neon Data API (Full Reference)

### Authentication Flow

```
1. Frontend calls POST /auth/login → gets JWT token
2. Decode JWT to find user's sub (UUID) and role
3. Attach token to all Neon Data API calls
4. Neon validates JWT → switches DB role → applies RLS
```

### GET — Fetch Your Cart (with items and products)

```bash
curl -s -X GET \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/carts?select=*,cart_items(*,products(*))'
```

**Response:**
```json
[
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "user_id": "49364355-5bcb-4645-aa99-619bd373878c",
    "created_at": "2026-02-26T03:30:08.452744",
    "updated_at": "2026-02-26T03:30:08.452744",
    "cart_items": [
      {
        "id": "44444444-4444-4444-4444-444444444444",
        "product_id": "11111111-1111-1111-1111-111111111111",
        "quantity": 2,
        "price_snapshot": 99.99,
        "products": {
          "id": "11111111-1111-1111-1111-111111111111",
          "name": "Test Product 1",
          "price": 99.99,
          "slug": "test-product-1",
          "is_active": true
        }
      }
    ]
  }
]
```

### GET — Fetch Only Cart Items

```bash
curl -s -X GET \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/cart_items?select=*,products(*)'
```

### POST — Add Item to Cart

```bash
curl -s -X POST \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"cart_id": "33333333-3333-3333-3333-333333333333", "product_id": "22222222-2222-2222-2222-222222222222", "quantity": 1, "price_snapshot": 149.50}' \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/cart_items'
```

### PATCH — Update Cart Item Quantity

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"quantity": 5}' \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/cart_items?id=eq.44444444-4444-4444-4444-444444444444'
```

### DELETE — Remove Cart Item

```bash
curl -s -X DELETE \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/cart_items?id=eq.44444444-4444-4444-4444-444444444444'
```

### PostgREST Filtering Reference

| Operator | URL Syntax | Meaning |
|---|---|---|
| Equals | `?col=eq.value` | `col = value` |
| Not equals | `?col=neq.value` | `col != value` |
| Greater than | `?col=gt.value` | `col > value` |
| IN list | `?col=in.(a,b,c)` | `col IN (a, b, c)` |
| ILIKE | `?col=ilike.*text*` | `col ILIKE '%text%'` |
| Nested select | `?select=*,rel(*)` | LEFT JOIN to related table |
| Limit | `?limit=10` | LIMIT 10 |
| Offset | `?offset=20` | OFFSET 20 |
| Order | `?order=col.desc` | ORDER BY col DESC |

---

## 8. Adding RLS for Future Tables — Step-by-Step

Whenever you add a **new non-sensitive table** to the Drizzle schema that should be browser-accessible, follow this checklist:

### Step 1 — Define the Table in Drizzle Schema

In your relevant schema file under `/db/schema/`, add a `userId` foreign key column linking it to the `users` table. This is the anchor for RLS.

### Step 2 — Enable RLS on the Table

In your Drizzle schema migration or raw SQL, enable RLS:

```sql
ALTER TABLE "your_new_table" ENABLE ROW LEVEL SECURITY;
```

Or add it directly in Drizzle using `.enableRLS()` if it\'s supported in your version.

### Step 3 — Create the RLS Policy

**For user-owned data (user can only see their own rows):**
```sql
CREATE POLICY "Users can manage own <resource>" 
ON your_new_table 
FOR ALL 
USING (
    (user_id)::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
);
```

**For data owned through a parent relationship (e.g., wishlist_items → wishlists):**
```sql
CREATE POLICY "Users can manage own wishlist items"
ON wishlist_items
FOR ALL
USING (
    wishlist_id IN (
        SELECT id FROM wishlists
        WHERE user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
);
```

**For public read-only data (e.g., products catalog):**
```sql
CREATE POLICY "Anyone can view <resource>"
ON your_table
FOR SELECT
USING (true);
```

**For admin-only writes:**
```sql
CREATE POLICY "Only admins can write <resource>"
ON your_table
FOR INSERT
WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
);
```

### Step 4 — Grant Permissions to the Roles

For data accessible by any logged-in user:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON your_new_table TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

For data also accessible to admins:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON your_new_table TO admin;
```

For public catalog data:
```sql
GRANT SELECT ON your_new_table TO anon;  -- or just rely on the USING(true) policy + authenticated grant
```

### Step 5 — Run Drizzle Migration

```bash
# From /ecommerce-backend:
npx drizzle-kit generate
npx tsx db/migrate.ts
```

### Step 6 — Test Your Policy

Test as `neondb_owner` that data exists:
```bash
node -e "const {Client}=require('pg'); const c=new Client('postgresql://neondb_owner:npg_Ym5wOHFU9NfB@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'); c.connect().then(()=>c.query('SELECT * FROM your_table LIMIT 5')).then(r=>{console.log(r.rows);c.end()}).catch(e=>{console.error(e);c.end()})"
```

Then test via the Data API with a JWT:
```bash
curl -s -H "Authorization: Bearer <JWT>" \
  -H "neon-connection-string: postgresql://authenticator@...neon.tech/neondb?sslmode=require" \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/your_table'
```

---

## 9. Current Role & Permission Map

```
Database: neondb
┌──────────────────────┬────────────┬────────┬─────────────────────────────┐
│ Role                 │ LOGIN      │ Tables │ Notes                       │
├──────────────────────┼────────────┼────────┼─────────────────────────────┤
│ neondb_owner         │ YES (pwd)  │ ALL    │ Admin. Use only from server. │
│ authenticator        │ YES (JWT)  │ bridge │ PostgREST gateway role.      │
│ authenticated        │ NO         │ partial│ Standard logged-in users.   │
│ admin                │ NO         │ ALL    │ Admin JWT role. Granted to  │
│                      │            │        │ authenticator.              │
│ anonymous            │ NO         │ none   │ Reserved for unauth access. │
└──────────────────────┴────────────┴────────┴─────────────────────────────┘

Grant Chain for JWT role="admin":
  authenticator → (SET ROLE) → admin → (applies) → RLS policies

Grant Chain for JWT role="authenticated":
  authenticator → (SET ROLE) → authenticated → (applies) → RLS policies
```

---

## 10. Complete Bruno / curl Test Commands

### 1. Login (via Cloudflare Worker)

```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@store.com", "password": "supersecurepassword123"}'
```

**Expected response:**
```json
{
  "token": "<JWT>",
  "user": { "id": "...", "email": "admin@store.com", "role": "admin" }
}
```

### 2. JWKS Endpoint (verify your public key)

```bash
curl http://localhost:8787/auth/.well-known/jwks.json
```

### 3. Get My Cart (Data API)

```bash
TOKEN="<PASTE_YOUR_JWT_HERE>"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/carts?select=*,cart_items(*,products(*))'
```

### 4. List All Products (public endpoint)

```bash
TOKEN="<PASTE_YOUR_JWT_HERE>"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/products'
```

### 5. Place an Order (via Cloudflare Worker — sensitive)

```bash
TOKEN="<PASTE_YOUR_JWT_HERE>"
curl -X POST http://localhost:8787/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [...], "shippingAddressId": "...", "paymentMethod": "card"}'
```

---

## 11. Troubleshooting Cheat Sheet

| Error | Cause | Fix |
|---|---|---|
| `"missing authentication credentials: required password"` | Used `authenticated` or `admin` as the username in the connection string | Always use `authenticator` as the username |
| `"role \"X\" does not exist"` | JWT `role` claim contains a role name not in the database | `CREATE ROLE X NOLOGIN; GRANT X TO authenticator;` |
| `"permission denied to set role \"X\""` | `authenticator` was not granted permission to switch to role `X` | `GRANT X TO authenticator;` |
| `"permission denied for table Y"` | The role `X` has no SELECT/INSERT grants on table `Y` | `GRANT SELECT, INSERT ON Y TO X;` |
| Returns `[]` even though data exists | RLS policy uses the wrong JWT claims accessor | Replace `current_setting('request.jwt.claim.sub', true)` with `(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')` |
| RLS blocks everything after enabling | RLS enabled but no policy created (default-deny) | Create a `POLICY` for the table |
| `"jwk not found"` | JWT was signed with an ephemeral in-memory key (server restart) | Restart the Worker so the JWT is re-signed with the current key, or use persistent keys stored in Wrangler secrets |
| JWKS URL doesn't work in jwt.io | jwt.io expects a single JWK object not a `{keys: [...]}` set | Paste only the inner key object without the `keys` wrapper |

---

## Appendix: Key URLs & Identifiers

| Resource | Value |
|---|---|
| Neon Project ID | `proud-shadow-42759289` |
| Neon DB Name | `neondb` |
| Pooled Connection | `ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech` |
| Direct Connection | `ep-ancient-frog-aimehta7.c-4.us-east-1.aws.neon.tech` |
| Data API Base URL | `https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/` |
| JWKS Endpoint (local) | `http://localhost:8787/auth/.well-known/jwks.json` |
| Worker Dev Port | `localhost:8787` |
| Express Dev Port | `localhost:5000` |
| Seed Admin User | `admin@store.com` / `supersecurepassword123` |
| Seed Admin User ID | `49364355-5bcb-4645-aa99-619bd373878c` |
| Seed Cart ID | `33333333-3333-3333-3333-333333333333` |
| Seed Product 1 ID | `11111111-1111-1111-1111-111111111111` |
| Seed Product 2 ID | `22222222-2222-2222-2222-222222222222` |
