# Guide 03 — Cloudflare Workers: Routing, Auth & Deployment

> **Worker Name:** `server-worker`  
> **Framework:** `itty-router` v5 (`AutoRouter`)  
> **JWT Library:** `jose` v6  
> **DB Driver:** `@neondatabase/serverless` + `drizzle-orm/neon-http`  
> **Worker URL (local):** `http://localhost:8787`  
> **Worker Entry:** `server-worker/src/index.ts`

---

## Table of Contents

1. [Why Cloudflare Workers?](#1-why-cloudflare-workers)
2. [Worker Architecture Overview](#2-worker-architecture-overview)
3. [Router Setup (itty-router)](#3-router-setup-itty-router)
4. [Sensitive Route: POST `/auth/login`](#4-sensitive-route-post-authlogin)
5. [Sensitive Route: POST `/api/orders/checkout`](#5-sensitive-route-post-apiordercheckout)
6. [Authentication Middleware](#6-authentication-middleware)
7. [JWKS Endpoint](#7-jwks-endpoint)
8. [Connecting to Neon from a Worker](#8-connecting-to-neon-from-a-worker)
9. [Adding a New Sensitive Route](#9-adding-a-new-sensitive-route)
10. [Environment Variables & Secrets](#10-environment-variables--secrets)
11. [Deployment](#11-deployment)
12. [CORS Configuration](#12-cors-configuration)
13. [Worker Limitations & Best Practices](#13-worker-limitations--best-practices)

---

## 1. Why Cloudflare Workers?

Workers are the **Sensitive Layer** of this architecture for several reasons:

| Reason | Detail |
|---|---|
| **Edge-native** | Runs in 300+ Cloudflare PoPs globally. Sub-5ms overhead vs traditional Node.js |
| **No cold start penalty** (for paid plans) | Isolate-based runtime — faster than Lambda or GCP Functions |
| **Secrets management** | `wrangler secret put` encrypts and distributes secrets to Workers — no `.env` files in production |
| **No raw TCP** | Workers don't support native TCP sockets (no `pg` driver). Neon's `@neondatabase/serverless` was designed specifically for this |
| **Trust boundary** | The Worker holds the `neondb_owner` connection string and RSA private key. These NEVER leave the Worker runtime |

---

## 2. Worker Architecture Overview

```
server-worker/
├── src/
│   ├── index.ts              ← Main router, CORS, route mounting
│   ├── types.ts              ← Env interface (typed bindings)
│   ├── routes/
│   │   ├── auth.ts           ← POST /auth/login, GET /auth/.well-known/jwks.json
│   │   └── orders.ts         ← POST /api/orders/checkout, PUT /api/orders/:id/status
│   ├── middleware/
│   │   └── auth.ts           ← authenticate(), requireRole() middleware
│   └── utils/
│       ├── db.ts             ← getDb(env) — initializes Drizzle + neon sql
│       └── jwks.ts           ← loadPrivateKey(), loadPublicKey(), getJwks(), generateToken()
├── wrangler.jsonc            ← Worker config (name, compatibility, secrets, observability)
├── .dev.vars                 ← Local secrets (DO NOT COMMIT)
└── package.json
```

---

## 3. Router Setup (itty-router)

The entry point mounts sub-routers and handles CORS globally.

```typescript
// src/index.ts
import { AutoRouter, cors } from 'itty-router';
import { authRouter } from './routes/auth';
import { orderRouter } from './routes/orders';
import { Env } from './types';

const { preflight, corsify } = cors({
    origin: '*',                    // 🔧 Lock this down in production to your domain
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
});

const router = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({
    before: [preflight],   // Handles OPTIONS preflight requests
    finally: [corsify],    // Adds CORS headers to all responses
});

// Route mounting: all /auth/* requests → authRouter
router.all('/auth/*', authRouter.fetch);
// Route mounting: all /api/orders/* requests → orderRouter
router.all('/api/orders/*', orderRouter.fetch);

// Health check (public)
router.get('/health', () => ({ status: 'ok' }));

export default router;
```

### `Env` Type Definition (`src/types.ts`)

```typescript
export interface Env {
    DATABASE_URL: string;           // neondb_owner connection string
    RSA_PRIVATE_KEY_PEM: string;    // PEM-formatted RSA-2048 private key
    RSA_PUBLIC_KEY_PEM: string;     // PEM-formatted RSA-2048 public key
}
```

> These are **Worker Secrets** in production (configured by `wrangler secret put`), and **`.dev.vars`** entries during local development. They are accessed via `env.DATABASE_URL` etc., NOT `process.env`.

---

## 4. Sensitive Route: POST `/auth/login`

```typescript
// src/routes/auth.ts
authRouter.post('/login', async (request, env) => {
    const { email, password } = await request.json() as any;
    const { sql } = getDb(env);

    // 1. Look up user (RAW SQL — Drizzle query tables from schema)
    const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (result.length === 0) return error(401, { message: 'Invalid credentials' });

    const user = result[0] as any;

    // 2. ⚠️ TODO: Verify password hash (bcrypt/argon2)
    // const isValid = await bcrypt.compare(password, user.password_hash);
    // if (!isValid) return error(401, { message: 'Invalid credentials' });

    // 3. Fetch role
    const rolesResult = await sql`SELECT * FROM user_roles WHERE user_id = ${user.id} LIMIT 1`;
    user.role = rolesResult.length > 0 ? rolesResult[0].role_id : 'customer';

    // 4. Generate signed RS256 JWT
    const token = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

    return { token, user: { id: user.id, email: user.email, role: user.role } };
});
```

### Response Shape

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Im5lb24...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

> ⚠️ **Missing:** Password hashing/verification. The current code skips this step. Before going to production, implement `bcrypt.compare` or `argon2.verify` against `user.password_hash`.

---

## 5. Sensitive Route: POST `/api/orders/checkout`

```typescript
// src/routes/orders.ts
orderRouter.post('/checkout', authenticate, async (request, env) => {
    const { cartItems, shippingAddressId, paymentMethod } = await request.json() as any;
    const userId = request.user.sub; // Extracted from verified JWT by authenticate()
    const { db, sql } = getDb(env);

    // Full implementation pattern:
    const result = await db.transaction(async (tx) => {
        const calculatedTotal = cartItems.reduce(
            (sum: number, item: any) => sum + item.quantity * parseFloat(item.unitPrice),
            0
        );

        const [newOrder] = await tx
            .insert(orders)
            .values({ userId, addressId: shippingAddressId, totalAmount: calculatedTotal.toString(), status: 'pending' })
            .returning();

        await tx.insert(orderItems).values(
            cartItems.map((item: any) => ({
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            }))
        );

        await tx.insert(payments).values({
            orderId: newOrder.id,
            amount: calculatedTotal.toString(),
            method: paymentMethod,
            status: 'pending',
        });

        return newOrder;
    });

    return { success: true, orderId: result.id };
});
```

> ⚠️ **Current state:** The checkout route is scaffolded (pseudocode comments). The transaction logic above is the intended production implementation pattern.

---

## 6. Authentication Middleware

All protected routes use `authenticate` before handler execution.

```typescript
// src/middleware/auth.ts
import { jwtVerify } from 'jose';
import { loadPublicKey } from '../utils/jwks';

export const authenticate = async (request: AuthRequest, env: any) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return error(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
        const publicKey = await loadPublicKey(env.RSA_PUBLIC_KEY_PEM);
        const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
        request.user = payload; // Attach user to request for downstream routes
    } catch (e) {
        return error(401, 'Invalid or expired token');
    }
};

// Role-Based Access Control
export const requireRole = (role: string) => {
    return (request: AuthRequest) => {
        if (!request.user) return error(401, 'Unauthorized');
        // Admins inherit all roles
        if (request.user.role !== role && request.user.role !== 'admin') {
            return error(403, 'Forbidden: Insufficient privileges');
        }
    };
};
```

### Middleware Usage in Routes

```typescript
// Authenticated user required
orderRouter.post('/checkout', authenticate, async (request, env) => { ... });

// Admin role required
orderRouter.put('/:orderId/status', authenticate, requireRole('admin'), async (request, env) => { ... });
```

> **Security Note:** RS256 verification uses the **public key**. The private key remains exclusively in the Worker's `RSA_PRIVATE_KEY_PEM` secret and is only used to *sign* tokens. Both the Worker and Neon (via JWKS) use the public key for verification.

---

## 7. JWKS Endpoint

```typescript
// src/routes/auth.ts
authRouter.get('/.well-known/jwks.json', async (request, env) => {
    const jwks = await getJwks(env.RSA_PUBLIC_KEY_PEM);
    return jwks;
});
```

**Returns:**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "...",
      "e": "AQAB",
      "kid": "neon-ecommerce-key-1",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}
```

### Key Caching in `jwks.ts`

The private/public keys are cached in module-level variables:

```typescript
let cachedPrivateKey: any = null;
let cachedPublicKey: any = null;
let cachedJwk: any = null;
```

> This cache is **per-Worker isolate**. It persists for the lifetime of the same isolate instance. On a cold start or new isolate, keys are re-parsed from the PEM secret. This is expected and safe.

---

## 8. Connecting to Neon from a Worker

Workers have no native TCP support. Neon's `@neondatabase/serverless` bridges this via HTTP:

```typescript
// src/utils/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export const getDb = (env: { DATABASE_URL: string }) => {
    const sql = neon(env.DATABASE_URL);  // HTTP-based SQL function
    return {
        db: drizzle(sql, { schema }),    // Type-safe query builder
        sql                              // Raw SQL tagged template
    };
};
```

> **Call `getDb(env)` inside the request handler**, not at the module level. Workers may be reused across requests but `env` is only available during request handling.

---

## 9. Adding a New Sensitive Route

**Example: POST `/api/payments/:orderId/refund` (Admin Only)**

### Step 1: Add to the order router (or create a new payments router)

```typescript
// In src/routes/orders.ts (or a new src/routes/payments.ts)
import { refunds } from '../../../db/schema/orders';

orderRouter.post('/:orderId/refund', authenticate, requireRole('admin'), async (request, env) => {
    const { orderId } = request.params;
    const { amount, reason } = await request.json() as any;
    const { db } = getDb(env);

    // Look up payment linked to the order
    const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

    if (!payment) return error(404, { message: 'Payment not found for this order' });

    // Insert refund record
    const [newRefund] = await db
        .insert(refunds)
        .values({
            paymentId: payment.id,
            amount: amount.toString(),
            reason,
            status: 'pending',
        })
        .returning();

    // TODO: Call Stripe/PayPal refund API here

    return { success: true, refundId: newRefund.id };
});
```

### Step 2: Mount the new router in `src/index.ts` (if it's a new file)

```typescript
import { paymentsRouter } from './routes/payments';
router.all('/api/payments/*', paymentsRouter.fetch);
```

### Step 3: Update `Env` type if new secrets are needed

```typescript
// src/types.ts
export interface Env {
    DATABASE_URL: string;
    RSA_PRIVATE_KEY_PEM: string;
    RSA_PUBLIC_KEY_PEM: string;
    STRIPE_SECRET_KEY: string; // New secret
}
```

---

## 10. Environment Variables & Secrets

### Local Development (`.dev.vars`)

```env
# server-worker/.dev.vars (DO NOT COMMIT — in .gitignore)
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
RSA_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n[base64]\n-----END PRIVATE KEY-----"
RSA_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n[base64]\n-----END PUBLIC KEY-----"
```

> PEM keys: Use `\n` (escaped) between lines — NOT actual newlines. The `jwks.ts` utility handles un-escaping.

### Production Secrets (Wrangler)

```bash
# Set each secret individually via wrangler CLI
wrangler secret put DATABASE_URL
wrangler secret put RSA_PRIVATE_KEY_PEM
wrangler secret put RSA_PUBLIC_KEY_PEM

# List all secrets for the worker
wrangler secret list

# Delete a secret
wrangler secret delete DATABASE_URL
```

---

## 11. Deployment

### Development

```bash
# From server-worker/
pnpm run dev
# Runs via wrangler dev on http://localhost:8787
```

### Production Deploy

```bash
# Ensure all secrets are set first (see Section 10)
pnpm run deploy
# Output: Deployed to: https://server-worker.<your-account>.workers.dev
```

### `wrangler.jsonc` Key Config

```jsonc
{
    "name": "server-worker",
    "main": "src/index.ts",
    "compatibility_date": "2026-02-26",
    "compatibility_flags": ["nodejs_compat"],  // Required for jose crypto APIs
    "observability": { "enabled": true }
    // 🔧 TODO for production: Add "placement": { "mode": "smart" }
    // Smart placement routes requests to the PoP geographically closest to the DB
}
```

> `nodejs_compat` flag is **required** — `jose`'s RSA crypto operations use Node.js `crypto` module APIs. Without this flag, key import will fail silently.

---

## 12. CORS Configuration

Current CORS allows all origins (`*`). This is acceptable for development. For production:

```typescript
// src/index.ts — Production CORS
const { preflight, corsify } = cors({
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Cache preflight for 24 hours
});
```

---

## 13. Worker Limitations & Best Practices

| Limitation | Impact | Mitigation |
|---|---|---|
| **No Node.js TCP** | Can't use `pg` or `postgres-js` | Use `@neondatabase/serverless` (HTTP transport) ✅ |
| **CPU time limit** | 10ms on free tier, 30s on paid plans | Keep route handlers fast; offload heavy work via Queues |
| **Memory: 128MB** | Large schema imports increase bundle size | Import only required schema files, not the full star import in routes |
| **No persistent state** | Can't store state in module globals across requests on different isolates | Use Neon for all state, KV for session data |
| **Cold start on scale-to-zero** | ~100–200ms delay on first request after idle | Acceptable with Neon's pooler warm-up |
| **Secrets not in `process.env`** | `process.env.VAR` is undefined in Workers | ALWAYS use `env.VAR` passed via handler arguments |
