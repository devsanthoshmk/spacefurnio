# Data Access & Architecture Strategy

> **Status:** Production  
> **Updated:** 2026-02-27  
> **Tech Stack:** Cloudflare Workers, Neon Serverless Postgres, Drizzle ORM, @neondatabase/serverless, Neon Data API

---

## 1. Core Architectural Principle: The Split-Access Model

Our database architecture deliberately splits data access into two completely distinct channels based on the sensitivity of the data and operations. 

We do **not** route all traffic through our Cloudflare Worker APIs. Instead, we leverage the power of **PostgreSQL Row Level Security (RLS)** and **Neon Auth (JWTs)** to allow the frontend to talk directly to the database for low-risk operations, saving worker compute costs and reducing latency.

### 🔴 The Sensitive Layer (Backend-Routed)
**How it's accessed:** Client → Cloudflare Worker REST API (Production) OR Express (Legacy / Dev) → Neon Database (via `@neondatabase/serverless` using the `neondb_owner` role).

**What qualifies as Sensitive?**
- **Order placement:** Writing to `orders`, `order_items`. This requires complex transaction management, inventory deduction, and payment verification that cannot be trusted to the client.
- **Order updates/history:** Writing to `order_status_history`, `shipments`, `returns`.
- **Payments:** Writing to `payments`, `refunds`.
- **Authentication:** Account reading, creation, and updating (modifying `users`, `user_roles`).
- **Product Management:** Creating or modifying the product catalog (managed entirely in a **separate Neon project `icy-union-81751721`** — no `products` table exists in this project).
- **Cart checkout/conversion:** The act of converting a `cart` into a finalized `order`.

**Why route through the Worker?**
The Worker acts as the trusted authority. It uses the `neondb_owner` connection string, which bypasses RLS and has full schema privileges. It runs Drizzle transactions, third-party API calls (Stripe/PayPal), and enforces strict business logic before committing inserts/updates.

---

### 🟢 The Non-Sensitive Layer (Direct-to-Database)
**How it's accessed:** Client (Browser/App) → Neon Data API (PostgREST) → Neon Database (via the `authenticator` role + JWT RLS).

**What qualifies as Non-Sensitive?**
- **Cart Management:** Reading, adding, updating, and deleting `carts` and `cart_items`.
- **Wishlist Management:** Reading, adding, updating, and deleting `wishlists` and `wishlist_items`.
- **Read-Only Contexts:** 
  - Reading products from the catalog project (`icy-union-81751721`) via its own Data API.
  - Reading the user's *own* `orders` and `order_items` history.
  - Reading the user's *own* `user_addresses`.

**Why Direct-to-Database?**
These operations involve simple CRUD on rows that mathematically belong to exactly one user. By attaching the user's JWT to the Neon Data API request, Postgres automatically filters out everyone else's data at the database engine level. This requires **zero backend code** to scale.

---

## 2. Using Drizzle ORM vs. Neon Data API

You have two ways to interact with the database. You must choose the right tool for the layer.

### Scenario A: Cloudflare Worker (Sensitive Ops)
When writing a route inside your Cloudflare Worker (e.g., `/api/orders/checkout`), you **MUST** use Drizzle ORM.

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { orders, orderItems } from '../db/schema';

// Inside the worker route:
const sql = neon(env.DATABASE_URL); // Uses neondb_owner secret
const db = drizzle(sql);

await db.transaction(async (tx) => {
  // Complex validation & logic here
  const [newOrder] = await tx.insert(orders).values({...}).returning();
  await tx.insert(orderItems).values([...]);
});
```

### Scenario B: Frontend / Third-Party Apps (Non-Sensitive Ops)
When interacting with the database from the browser (e.g., adding an item to the cart), you **MUST** use the Neon Data API (PostgREST). You **do not** use Drizzle here.

```javascript
// Browser JS
const response = await fetch('https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/cart_items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userJwtToken}`, // The token from /auth/login
    'neon-connection-string': 'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    cart_id: "33333333-3333...",
    product_id: "22222222-2222...",
    quantity: 1
  })
});
```

---

## 3. Discrepancies From Initial Requests & Explanations

During implementation, some of the requested access patterns were architecturally unsafe or incompatible with standard industry security models. Here is what was deviated from and why:

### ❌ Reading "User Account Info" directly via RLS
- **Request:** Allow the client to read/write `users` profile info via the direct Neon Data API.
- **Why it was denied:** The `users` table contains extreme sensitive data by default (password hashes, role assignments, phone numbers). Exposing the `users` table to the Data API, even with RLS, risks leaking password hashes if the RLS policy is misconfigured (e.g., filtering fails, or a JOIN accidentally sweeps it up). 
- **The Modern Standard:** Auth/Account info reading and updating must **always** go through the Backend Worker where fields like `password_hash` can be explicitly stripped before serialization.

### ❌ Writing "Orders" directly via the Data API
- **Request:** Allow JWT holders to write to `orders` using the Data API.
- **Why it was denied:** If users can directly `POST` to `/rest/v1/orders`, they can insert an order where `total_amount = 0` or change their `status = paid` without actually paying Stripe. RLS cannot validate third-party payment gateways.
- **The Modern Standard:** Orders and Order Items have been locked down with `FOR SELECT USING(...)` RLS policies. The client can *read* their orders via the Data API to populate the UI, but *writes* will instantly face a `403 Forbidden`. The frontend must POST to the Cloudflare Worker `/api/orders/checkout` to create an order.

### ❌ Using `neon()` client side with `authToken`
- **Request:** The initial API_DOCS.md specified using `@neondatabase/serverless` with `authToken: token` in the browser to run raw SQL (`sql'SELECT * FROM cart_items'`).
- **Why it was denied:** Exposing raw SQL execution to the browser, even if RLS-protected, allows malicious actors to run expensive queries (e.g., `SELECT pg_sleep(10)`) causing Denial of Service, or discovering database typologies.
- **The Modern Standard:** The `neon()` SQL driver is strictly for the Cloudflare Worker inside a trusted environment. The Browser **MUST** use the Neon Data API PostgREST REST endpoints (`GET /rest/v1/carts`), which enforces safe, predictable execution plans and prevents arbitrary SQL injection entirely.
