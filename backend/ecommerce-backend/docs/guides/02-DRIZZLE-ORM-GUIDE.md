# Guide 02 — Drizzle ORM: Schema, Migrations & Queries

> **Drizzle ORM Version:** `^0.45.1`  
> **Drizzle Kit Version:** `^0.31.9`  
> **Dialect:** PostgreSQL  
> **Schema Location:** `ecommerce-backend/db/schema/`  
> **Migrations Location:** `ecommerce-backend/db/migrations/`

---

## Table of Contents

1. [Why Drizzle ORM?](#1-why-drizzle-orm)
2. [Project Setup & Config](#2-project-setup--config)
3. [Schema Design Patterns](#3-schema-design-patterns)
4. [Creating a New Table (Step-by-Step)](#4-creating-a-new-table-step-by-step)
5. [Running Migrations](#5-running-migrations)
6. [Querying With Drizzle (Worker Context)](#6-querying-with-drizzle-worker-context)
7. [Drizzle Transactions](#7-drizzle-transactions)
8. [Relational Queries](#8-relational-queries)
9. [Without Drizzle: Raw SQL via `neon()`](#9-without-drizzle-raw-sql-via-neon)
10. [Common Drizzle Pitfalls](#10-common-drizzle-pitfalls)

---

## 1. Why Drizzle ORM?

Drizzle is chosen because it:

- **Compiles to edge-safe SQL:** No Node.js runtime dependencies. Runs in Cloudflare Workers.
- **Type-safe schema definitions in TypeScript:** Your DB schema is your source of truth for TypeScript types.
- **Lightweight:** ~35KB bundle size — critical for Worker cold start performance.
- **`drizzle-kit`:** A companion CLI to generate migrations from schema diffing — you never write raw DDL.
- **Transaction support:** Full `BEGIN/COMMIT/ROLLBACK` support for complex order workflows.

> **Drizzle vs Prisma vs raw SQL in this project:**
> - Drizzle = schema type safety + migrations + Worker compatibility ✅
> - Prisma = too heavy for Workers, no edge support ❌  
> - Raw SQL = no type safety, fragile ❌

---

## 2. Project Setup & Config

### `drizzle.config.ts` (Root Level)

```typescript
// ecommerce-backend/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    schema: "./db/schema/index.ts",   // Entry point: exports ALL core tables
    out: "./db/migrations",            // Where core .sql migration files are saved
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!, // core neondb_owner connection string
    },
});
```

### `drizzle.products.config.ts` (For External Catalog DB)

Since the `products` table was permanently relocated to the external `icy-union-81751721` Neon database to follow strict decoupling guidelines, all schema and migrations exist separately.

```typescript
// ecommerce-backend/drizzle.products.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    schema: "./db/products-schema/index.ts",
    out: "./db/products-migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.PRODUCTS_DATABASE_URL || "postgresql://authenticator@ep-icy-union-81751721... (User Override)", 
    },
});
```
> **Migrating Products:** Run `npx drizzle-kit generate --config=drizzle.products.config.ts` to generate these isolated migrations.

### `db/schema/index.ts` — The Schema Barrel


ALL schema files MUST be re-exported here. `drizzle-kit` reads only this file.

```typescript
// db/schema/index.ts
export * from './users';
// catalog.ts no longer exports tables — products/inventory/reviews moved to separate Neon project
export * from './shopping';
export * from './orders';
export * from './promotions';
export * from './system';
```

> ⚠️ **If you add a new schema file**, you MUST add it to `index.ts`. Otherwise `drizzle-kit generate` will not see it and your migrations will be incomplete.

---

## 3. Schema Design Patterns

All tables in this project follow consistent patterns. Learn these before writing any new schema.

### Pattern 1: UUIDs as Primary Keys

```typescript
import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
    // ✅ Correct: auto-generate UUID via defaultRandom()
    id: uuid('id').primaryKey().defaultRandom(),
});
```

> Why UUIDs? They are globally unique, making distributed insert merges safe and preventing enumeration attacks on IDs.

### Pattern 2: Timestamps

```typescript
import { timestamp } from 'drizzle-orm/pg-core';

// ✅ Always include both on mutable records
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull(),
```

> `updatedAt` must be updated manually in application code or via a DB trigger. Drizzle does not auto-update it on `UPDATE`.

### Pattern 3: Foreign Keys with Cascade

```typescript
import { uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// ✅ Reference with explicit cascade behavior
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
```

> Use `cascade` for child records that have no meaning without the parent (e.g., `cart_items` without a `cart`). Use `set null` or `restrict` when the child record may be retained independently.

### Pattern 4: Indexes

```typescript
import { index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    email: text('email').unique().notNull(),
}, (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
}));
```

> The second argument to `pgTable` is the index/constraint builder. Always index columns you `WHERE` or `JOIN` on frequently.

### Pattern 5: Drizzle Relations (for Relational Queries)

Relations are Drizzle-level declarations — they produce NO SQL. They enable the `db.query.*` relational API.

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
    addresses: many(userAddresses),
    sessions: many(userSessions),
}));
```

---

## 4. Creating a New Table (Step-by-Step)

**Example: Adding a `subscriptions` table**

### Step 1: Create or edit the domain schema file

```typescript
// db/schema/subscriptions.ts
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull().default('free'),       // 'free', 'pro', 'enterprise'
    status: text('status').notNull().default('active'), // 'active', 'cancelled', 'expired'
    startedAt: timestamp('started_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
}));
```

### Step 2: Register in `db/schema/index.ts`

```typescript
export * from './subscriptions'; // ADD THIS LINE
```

### Step 3: Generate the migration

```bash
# From ecommerce-backend/ root
npx drizzle-kit generate
```

This creates a new `.sql` file in `db/migrations/` with `CREATE TABLE subscriptions ...`.

### Step 4: Review the generated SQL

```bash
cat db/migrations/<timestamp>_<auto_name>.sql
```

Always verify the SQL looks correct before applying.

### Step 5: Apply the migration

```bash
npx tsx db/migrate.ts
```

Console output on success:
```
Starting migrations via postgres-js...
Migrations applied successfully!
```

### Step 6: Apply RLS (if the table is Non-Sensitive)

If `subscriptions` should be accessible via the Data API:

```sql
-- Run via mcp-server-neon or Neon console
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access only their own subscriptions"
ON subscriptions
FOR ALL
TO authenticator
USING (
    user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
)
WITH CHECK (
    user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
);

GRANT SELECT, INSERT, UPDATE ON TABLE subscriptions TO authenticator;
```

If `subscriptions` is **sensitive** (backend-only), skip the grant and RLS policy — just leave RLS disabled or add a restrictive deny-all policy.

---

## 5. Running Migrations

### Standard Migration Flow

```bash
# 1. Make schema changes in db/schema/*.ts

# 2. Generate migration SQL
npx drizzle-kit generate

# 3. (Optional) Inspect what will be run
cat db/migrations/<latest>.sql

# 4. Apply migration
npx tsx db/migrate.ts
```

### Why `postgres-js` for Migrations (Not `neon-http`)?

The `neon-http` transport uses the **Fetch API** under the hood. In local Node.js environments, `fetch` does not support the full TCP-level connection options that the Postgres wire protocol requires. The `postgres-js` package uses a native TCP socket — reliable in all environments.

```typescript
// db/migrate.ts — This is the ONLY place postgres-js is used
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
```

> `max: 1` = single connection. Migrations should NEVER be run with a pool. One connection serializes all migrations correctly.

### Drizzle Kit Commands Reference

```bash
npx drizzle-kit generate         # Diff schema → generate .sql migration file
npx drizzle-kit migrate          # Apply migrations (requires drizzle.config)
npx drizzle-kit studio           # Open Drizzle Studio (browser-based DB viewer)
npx drizzle-kit introspect       # Generate schema from existing DB (reverse engineering)
npx drizzle-kit check            # Validate schema for drift without generating
```

> **This project uses `npx tsx db/migrate.ts`** (not `drizzle-kit migrate`) due to the `postgres-js` compatibility requirement.

---

## 6. Querying With Drizzle (Worker Context)

All database operations in the Worker go through `getDb(env)` (core tables) or `getProductsDb(env)` (catalog tables):

```typescript
// server-worker/src/utils/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../../db/schema/index';
import * as productSchema from '../../../db/products-schema/index';

// Core database (ep-ancient-frog-aimehta7)
export const getDb = (env: { DATABASE_URL: string }) => {
    const sql = neon(env.DATABASE_URL);
    return { db: drizzle(sql, { schema }), sql };
};

// Products database (icy-union-81751721 / ep-flat-brook-a1h1dgii)
export const getProductsDb = (env: { PRODUCTS_DATABASE_URL: string }) => {
    if (!env.PRODUCTS_DATABASE_URL) throw new Error("PRODUCTS_DATABASE_URL missing");
    const sql = neon(env.PRODUCTS_DATABASE_URL);
    return { db: drizzle(sql, { schema: productSchema }), sql };
};
```

> **Important:** The `PRODUCTS_DATABASE_URL` env var must be set as a Wrangler secret (`wrangler secret put PRODUCTS_DATABASE_URL`) and in `.dev.vars` for local development.

### SELECT Queries

```typescript
import { eq, and } from 'drizzle-orm';
import { users } from '../../../db/schema/users';

// Single record by primary key
const { db } = getDb(env);
const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

// Multiple records with condition
const activeUsers = await db
    .select({
        id: users.id,
        email: users.email,   // Selective columns
    })
    .from(users)
    .where(and(
        eq(users.isActive, true),
    ));
```

### INSERT Queries

```typescript
import { orders } from '../../../db/schema/orders';

const [newOrder] = await db
    .insert(orders)
    .values({
        userId: userId,
        addressId: shippingAddressId,
        totalAmount: calculatedTotal,
        status: 'pending',
    })
    .returning(); // Returns the inserted row with generated id, timestamps, etc.
```

### UPDATE Queries

```typescript
import { eq } from 'drizzle-orm';

await db
    .update(orders)
    .set({
        status: 'shipped',
        // updatedAt: new Date() // Manually update if needed
    })
    .where(eq(orders.id, orderId));
```

### DELETE Queries

```typescript
await db
    .delete(cartItems)
    .where(eq(cartItems.cartId, cartId));
```

---

## 7. Drizzle Transactions

Transactions are essential for **the Sensitive Layer** — any operation that writes to multiple tables atomically.

### Checkout Transaction Pattern

```typescript
import { orders, orderItems, payments, orderStatusHistory } from '../../../db/schema/orders';

const { db } = getDb(env);

const result = await db.transaction(async (tx) => {
    // Step 1: Create the order record
    const [newOrder] = await tx
        .insert(orders)
        .values({
            userId: userId,
            addressId: shippingAddressId,
            totalAmount: calculatedTotal.toString(),
            status: 'pending',
        })
        .returning();

    // Step 2: Insert all order line items
    await tx.insert(orderItems).values(
        cartItems.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.priceSnapshot,
        }))
    );

    // Step 3: Create payment record
    await tx.insert(payments).values({
        orderId: newOrder.id,
        amount: calculatedTotal.toString(),
        method: paymentMethod,
        status: 'pending',
    });

    // Step 4: Record initial status
    await tx.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        status: 'pending',
        notes: 'Order placed by customer',
    });

    // If ANY insert fails above, the entire transaction rolls back atomically
    return newOrder;
});
```

> ⚠️ **Never** handle payments across tables without a transaction. A failed payment insert with a committed order row = an order with no payment record = booking fraud risk.

---

## 8. Relational Queries

Drizzle's relational query API uses the `relations()` declarations in your schema files.

```typescript
// Fetch a cart with all its items
const { db } = getDb(env);

const cartWithItems = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    with: {
        items: true,
        // NOTE: product relation removed — products are in a separate Neon project (icy-union-81751721)
        // To get product details, query the products project via its own connection/Data API
    }
});
```

> **Requires:** The `schema` option passed to `drizzle(sql, { schema })` — this is done in `getDb()`.

---

## 9. Without Drizzle: Raw SQL via `neon()`

Sometimes you need raw SQL — complex aggregations, Postgres-specific functions, or schema validation queries.

The `sql` object from `getDb(env)` is a tagged-template literal:

```typescript
const { sql } = getDb(env);

// ✅ SAFE: Parameters are sanitized (parameterized query)
const result = await sql`
    SELECT u.id, u.email, ur.role_id
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.email = ${email}
    LIMIT 1
`;

// ❌ NEVER DO THIS: String concatenation = SQL injection
const unsafe = await sql`SELECT * FROM users WHERE email = '${email}'`; // WRONG
```

> Raw `sql` tagged literals are automatically parameterized. Drizzle/Neon passes the values as bind parameters, not string-concatenated. This is safe.

---

## 10. Common Drizzle Pitfalls

| Pitfall | Cause | Fix |
|---|---|---|
| Migration doesn't pick up new table | New schema file not exported in `index.ts` | Add `export * from './new-file'` to `index.ts` |
| `fetch failed` / `ETIMEDOUT` during `tsx db/migrate.ts` | Using wrong connection string (maybe HTTP endpoint instead of TCP) | Use the **pooler** connection string (the `-pooler.` hostname) |
| `returning()` returns empty array | Drizzle's `.returning()` requires at least one column to exist | Verify the table has the columns you're selecting |
| `updatedAt` not updating on `UPDATE` | Drizzle doesn't auto-update `updatedAt` | Add `.set({ updatedAt: new Date() })` manually, or add a DB trigger |
| TypeScript errors on relational queries | Schema not passed to `drizzle()` | Use `drizzle(sql, { schema })` — see `getDb()` |
| `drizzle-kit generate` produces empty migration | No schema changes detected | Ensure your schema file is exported from `index.ts` |
| Double `\n` in PEM keys in Worker | `.dev.vars` stores literal `\\n` | `jwks.ts` handles this with `.replace(/\\n/g, '\n')` — don't change it |
