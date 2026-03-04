# Guide 01 — Neon Serverless Postgres: Setup & Configuration

> **Status:** Production  
> **Neon Project ID:** `proud-shadow-42759289`  
> **Neon Project Name:** `ecommerce-backend`  
> **Region:** `us-east-1` (AWS)

---

## Table of Contents

1. [What Is Neon?](#1-what-is-neon)
2. [Project Structure in Neon](#2-project-structure-in-neon)
3. [Database Roles & Access Levels](#3-database-roles--access-levels)
4. [Connection Methods](#4-connection-methods)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Setting Up the Neon Data API](#6-setting-up-the-neon-data-api)
7. [Neon Auth (JWKS Integration)](#7-neon-auth-jwks-integration)
8. [Branching Strategy](#8-branching-strategy)
9. [Local Development Setup](#9-local-development-setup)
10. [Monitoring & Observability](#10-monitoring--observability)

---

## 1. What Is Neon?

**Neon** is a serverless-first PostgreSQL platform that **separates compute from storage**. Key properties relevant to this project:

| Feature | What It Means for You |
|---|---|
| **Scale to Zero** | The database compute pauses when idle. Cold start ~500ms. |
| **Branching** | Create instant copy-on-write DB branches for dev/test — no data duplication cost |
| **Serverless Driver** | `@neondatabase/serverless` runs over HTTP/WebSocket, compatible with Cloudflare Workers (no raw TCP) |
| **Data API** | Built-in PostgREST endpoint — exposes your DB as a REST API with JWT authentication |
| **Neon Auth** | Configure a JWKS URL; Neon validates JWTs directly at the DB driver level |

> **Critical:** Neon's compute uses **connection pooling via PgBouncer** at the `*-pooler.*` hostname. Always use the **pooler connection string** in application code to avoid connection exhaustion.

---

## 2. Project Structure in Neon

```
Neon Account
└── Project: ecommerce-backend (proud-shadow-42759289)
    ├── Branch: main (production)
    │   └── Database: neondb
    │       ├── Role: neondb_owner    ← Full admin, bypasses RLS. Backend Worker ONLY.
    │       └── Role: authenticator   ← RLS-restricted. Used by Neon Data API + frontend.
    ├── Branch: dev-[feature-name]    ← Created per feature for safe schema iteration
    └── Branch: staging               ← (Recommended) pre-production validation
```

### Database Organization by Schema File

| Schema File | Tables |
|---|---|
| `db/schema/users.ts` | `roles`, `users`, `user_roles`, `user_addresses`, `user_sessions` |
| `db/schema/catalog.ts` | *(Empty — products moved to separate `icy-union-81751721` Neon project)* |
| `db/schema/shopping.ts` | `carts`, `cart_items`, `wishlists`, `wishlist_items` |
| `db/schema/orders.ts` | `orders`, `order_items`, `order_status_history`, `payments`, `payment_transactions`, `shipments`, `shipment_items`, `return_requests`, `return_items`, `refunds` |
| `db/schema/promotions.ts` | `coupons`, `coupon_redemptions` |
| `db/schema/system.ts` | `notifications`, `audit_logs`, `event_logs` |

---

## 3. Database Roles & Access Levels

This is the cornerstone of the security model. **Two roles, two trust levels.**

### `neondb_owner` — The Privileged Role

```
Connection String:
postgresql://neondb_owner:[PASSWORD]@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

- **RLS bypass:** This role is exempt from all Row Level Security policies.
- **Used by:** Cloudflare Worker exclusively (via `DATABASE_URL` secret).
- **Never expose** this connection string to the browser or client-side code.
- Has full `CREATE`, `ALTER`, `DROP`, `INSERT`, `UPDATE`, `DELETE` privileges.

### `authenticator` — The Restricted Role

```
Connection String (safe to embed in frontend config):
postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

- **RLS enforced:** Every query is filtered by active RLS policies.
- **Used by:** Neon Data API (browser → PostgREST endpoint).
- No password shipped to the browser — the JWT Bearer token is the authentication.
- Has only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on explicitly granted tables. **No DDL.**

### Setting Up the `authenticator` Role

Run this once in the Neon SQL editor or via `mcp-server-neon run_sql`:

```sql
-- Create the restricted role
CREATE ROLE authenticator NOINHERIT LOGIN;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticator;

-- Grant DML on non-sensitive tables ONLY
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE carts TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cart_items TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wishlists TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wishlist_items TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_addresses TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notifications TO authenticator;

-- READ-ONLY grants (UI display)
GRANT SELECT ON TABLE orders TO authenticator;
GRANT SELECT ON TABLE order_items TO authenticator;
GRANT SELECT ON TABLE products TO authenticator;
GRANT SELECT ON TABLE reviews TO authenticator;

-- NEVER grant to authenticator:
-- users, user_roles, user_sessions (sensitive auth tables)
-- payments, refunds, order_status_history (sensitive financial tables)
-- audit_logs, coupons (admin tables)
```

---

## 4. Connection Methods

### Method A: HTTP via `neon()` Tag (Worker Use)

Used inside the **Cloudflare Worker** for sensitive operations. Works over HTTP, no persistent connection.

```typescript
// server-worker/src/utils/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../../db/schema/index';

export const getDb = (env: { DATABASE_URL: string }) => {
    const sql = neon(env.DATABASE_URL);
    return { db: drizzle(sql, { schema }), sql };
};
```

> **Note:** `neon()` creates a tagged-template SQL function. `drizzle(sql)` wraps it for type-safe query building. The `schema` import enables Drizzle's relational query API.

### Method B: `postgres-js` (Migration Use Only)

Used exclusively in `db/migrate.ts` during schema migrations from a Node.js environment. This uses the standard TCP Postgres connection — **not** compatible with Workers.

```typescript
// db/migrate.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(migrationClient);
await migrate(db, { migrationsFolder: "db/migrations" });
await migrationClient.end(); // ALWAYS close the connection
```

> **Why not `neon-http` for migrations?** The `neon-http` transport has known issues with the `fetch` API in local Node.js environments (no native `fetch` with full TCP support). `postgres-js` uses a real TCP socket and works reliably for `drizzle-kit generate` + migration apply.

### Method C: Neon Data API (Frontend Use)

Used from the **browser**. No Node.js, no TCP sockets. Pure REST over HTTPS.

```
Base URL: https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/
```

See [Guide 04 — Neon Data API](./04-NEON-DATA-API-GUIDE.md) for complete usage.

---

## 5. Row Level Security (RLS)

RLS is what makes the split-access model safe. It enforces **per-row data isolation** at the PostgreSQL engine level — no application code can bypass it (when using the `authenticator` role).

### How It Works

1. The browser sends a request to the Neon Data API with a `Bearer <JWT>` header.
2. Neon validates the JWT signature against the JWKS URL.
3. If valid, Neon sets `request.jwt.claim.sub = <userId>` as a session variable.
4. PostgreSQL evaluates the `USING` clause of every active RLS policy before returning rows.

### Enabling RLS on a Table

```sql
-- STEP 1: Enable RLS (blocks all access by default)
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- STEP 2: Allow users to only see their own cart
CREATE POLICY "Users can manage only their own cart"
ON carts
FOR ALL
TO authenticator
USING (
    user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
)
WITH CHECK (
    user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
);
```

### RLS Policy Map (Current State)

| Table | RLS Enabled | Policy | Notes |
|---|---|---|---|
| `carts` | ✅ Yes | `user_id = jwt.sub` | Full CRUD for own cart |
| `cart_items` | ✅ Yes | cart's `user_id = jwt.sub` (via JOIN) | Users can only touch their own cart items |
| `wishlists` | ✅ Yes | `user_id = jwt.sub` | Full CRUD for own wishlist |
| `wishlist_items` | ✅ Yes | wishlist's `user_id = jwt.sub` (via JOIN) | Users can only touch their own items |
| `user_addresses` | ✅ Yes | `user_id = jwt.sub` | Full CRUD for own addresses |
| `orders` | ✅ Yes | `SELECT WHERE user_id = jwt.sub` | Read-only. Writes blocked (403) |
| `order_items` | ✅ Yes | order's `user_id = jwt.sub` | Read-only. Writes blocked (403) |
| `products` | ✅ Yes (separate project) | `anon read`, `admin full access`, `customer read` | In `icy-union-81751721` — roles: `admin`, `customer`, `anonymous` |
| `brands` | ✅ Yes (separate project) | Same as products | In `icy-union-81751721` |
| `categories` | ✅ Yes (separate project) | Same as products | In `icy-union-81751721` |
| `users` | 🚫 Not via Data API | Managed by Worker only | DO NOT expose to `authenticator` role |
| `payments` | 🚫 Not via Data API | Managed by Worker only | Financial data — backend only |
| `audit_logs` | 🚫 Not via Data API | Internal system table | No client access at all |

### RLS for `cart_items` (Indirect Ownership)

`cart_items` doesn't directly have a `user_id`. You must join through `carts`:

```sql
CREATE POLICY "Users can manage their own cart items"
ON cart_items
FOR ALL
TO authenticator
USING (
    cart_id IN (
        SELECT id FROM carts
        WHERE user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
)
WITH CHECK (
    cart_id IN (
        SELECT id FROM carts
        WHERE user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
);
```

---

## 6. Setting Up the Neon Data API

The Neon Data API exposes your database as a PostgREST-compatible REST API.

### Configuration Steps (Neon Console)

1. Go to **Neon Console** → Your Project → **Data API** tab
2. Click **Enable Data API**
3. Note your Data API base URL (format: `https://<endpoint>.apirest.<region>.aws.neon.tech/<dbname>/rest/v1/`)
4. Set up the JWKS URL (see Section 7)

### Authentication Configuration

The Data API must know where to fetch your public key to validate JWTs:

```
JWKS URL: https://<your-worker-url>/auth/.well-known/jwks.json
```

This URL is served by your Cloudflare Worker (see `server-worker/src/routes/auth.ts`).

---

## 7. Neon Auth (JWKS Integration)

Neon Auth is **not** a separate service — it's Neon's ability to validate JWTs against a JWKS endpoint before allowing a connection to proceed.

### How Our JWKS Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Worker                       │
│                                                             │
│  GET /auth/.well-known/jwks.json                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  RSA_PUBLIC_KEY_PEM (secret binding)                │    │
│  │  → importSPKI (jose)                                │    │
│  │  → exportJWK()                                      │    │
│  │  → returns { keys: [{ kty, n, e, kid, use, alg }] } │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

The RSA key pair is generated once and stored as Wrangler secrets:
- `RSA_PRIVATE_KEY_PEM` — signs tokens at `/auth/login`
- `RSA_PUBLIC_KEY_PEM` — exposed at `/.well-known/jwks.json`, consumed by Neon

### JWT Payload Structure

```json
{
  "sub": "uuid-of-user",         // Used by RLS: current_setting('request.jwt.claim.sub')
  "email": "user@example.com",
  "role": "customer",
  "iat": 1740000000,
  "exp": 1740604800              // 7 days from issuance
}
```

> ⚠️ The `sub` field is critical. It is what PostgreSQL RLS queries against. If it's missing or wrong, all RLS policies will fail.

---

## 8. Branching Strategy

Use Neon branches to safely develop schema changes without touching production.

### Recommended Workflow

```bash
# 1. Create a dev branch via MCP or Neon CLI
# (In Neon Console: Branches → Create Branch → from: main)

# 2. Point your local .env to the dev branch connection string
DATABASE_URL=postgresql://neondb_owner:[password]@[dev-branch-host]/neondb?sslmode=require

# 3. Develop and run migrations on the dev branch
npx drizzle-kit generate
npx tsx db/migrate.ts

# 4. Use compare_database_schema MCP tool to review diff vs main

# 5. Merge to main by applying the same migration to the production branch
```

### Branch Connection Strings

Each Neon branch has its own compute endpoint and unique hostname. The **database** and **roles** are shared as copy-on-write snapshots from the parent branch.

---

## 9. Local Development Setup

### Prerequisites

```bash
# Install dependencies in the root (Drizzle schema + migrations)
npm install

# Install dependencies in the Worker
cd server-worker && pnpm install
```

### Environment Variables

Create `ecommerce-backend/.env`:

```env
# Direct connection for migrations (postgres-js, NOT for Workers)
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Create `ecommerce-backend/server-worker/.dev.vars` (Wrangler local secrets):

```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
RSA_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
RSA_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

> **Note:** In `.dev.vars`, PEM keys must have literal `\n` (escaped newline) instead of actual newlines. The `jwks.ts` utility handles unescaping with `pem.replace(/\\n/g, '\n')`.

### Running Locally

```bash
# Terminal 1: Run the Cloudflare Worker locally
cd server-worker
pnpm run dev
# Worker available at: http://localhost:8787

# Terminal 2 (Optional): Expose via Cloudflare Tunnel
cloudflared tunnel --url http://localhost:8787
# This gives you a public HTTPS URL to plug into Neon Auth JWKS config
```

### Running Migrations

```bash
# From ecommerce-backend/ root:

# Step 1: Generate SQL migration files from schema changes
npx drizzle-kit generate

# Step 2: Apply the generated migrations to the DB
npx tsx db/migrate.ts
```

---

## 10. Monitoring & Observability

### Neon Console

- **Query performance:** Neon Console → Monitoring → Query Analysis
- **Active connections:** Monitoring → Connections
- **Compute usage:** Monitoring → Compute Hours

### Cloudflare Workers

Observability is enabled in `wrangler.jsonc`:

```jsonc
{
  "observability": {
    "enabled": true
  }
}
```

This enables:
- **Cloudflare Analytics** — request volume, error rates, CPU time, wall time
- **Tail Workers** (optional) — stream real-time logs for debugging

### Health Check Endpoint

```
GET https://<worker-url>/health
→ { "status": "ok" }
```
