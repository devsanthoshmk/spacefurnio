# Architecture Gaps & Deviations Report

> **Purpose:** This document identifies every place where the current implementation **did not align**  
> with what was originally requested or with the security architecture described in  
> `docs/architecture/ARCHITECTURE_STRATEGY.md`.  
>
> Each gap is classified by **severity**, has a specific **explanation of what's wrong**,  
> and a **recommended fix**.
>
> **Last Audited:** 2026-02-26

---

## Gap Classification

| Label | Meaning |
|---|---|
| 🚨 **CRITICAL** | Active security vulnerability. Fix before production. |
| ⚠️ **IMPORTANT** | Not a direct exploit, but violates architecture intent or will cause bugs. |
| 📝 **MINOR** | Cosmetic, inconsistency, or technical debt. Safe to defer. |
| ✅ **INTENTIONAL** | A known deviation that was a deliberate, documented architectural decision. |

---

## Gap #1 — JWT Verification Uses Private Key Instead of Public Key (RESOLVED)

**Severity:** ✅ RESOLVED (2026-03-02)  
**Location:** `server-worker/src/middleware/auth.ts`

### Status: Fixed
The middleware was updated to use `loadPublicKey(env.RSA_PUBLIC_KEY_PEM)` instead of `loadPrivateKey`. RS256 verification now correctly uses the public key, aligning with asymmetric cryptographic standards and ensuring the private key is used only for signing.

---

## Gap #2 — Password Verification Is Not Implemented

**Severity:** 🚨 CRITICAL  
**Location:** `server-worker/src/routes/auth.ts` (lines 28–29), `server/routes/auth.js` (lines 31–32)

### What Was Asked For
The architecture specifies that account creation and authentication are **Sensitive Layer** operations routed through the Worker. Authentication implies that user-provided credentials are **validated against stored data**.

### What Is Wrong
Both the Worker and the old Express server have this placeholder:

```typescript
// (Password verification would go here!)
```

The current code **returns a JWT to anyone who sends a known email address**, regardless of whether their password is correct. This is an authentication bypass.

```typescript
// CURRENT (INCOMPLETE):
const user = result[0];
// Nothing here checks if the password is correct
const token = await generateToken(user, env.RSA_PRIVATE_KEY_PEM); // Issued for anyone
```

### The Fix

Install a password hashing library compatible with Workers:

```bash
# jose and bcryptjs work in Workers. argon2 requires native bindings — use bcryptjs.
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

Implement verification:

```typescript
import { compare } from 'bcryptjs';

// At registration (Worker route to be implemented):
const passwordHash = await hash(password, 12);
await db.insert(users).values({ email, passwordHash });

// At login:
const isValid = await compare(password, user.password_hash);
if (!isValid) return error(401, { message: 'Invalid credentials' });
```

> ⚠️ **Also note:** There is NO user registration route currently. Only login exists. Registration is a critical missing feature.

---

## Gap #3 — No User Registration Route

**Severity:** ⚠️ IMPORTANT  
**Location:** `server-worker/src/routes/` — Missing

### What Was Asked For
Authentication → account creation is explicitly listed as a **Sensitive Layer** operation (`ARCHITECTURE_STRATEGY.md`, line 22):
> "Authentication: Account reading, creation, and updating (modifying users, user_roles)."

### What Is Wrong
There is no `POST /auth/register` route in the Worker. Only `POST /auth/login` exists. New accounts cannot be created through the proper Sensitive Layer — they must be created manually via the DB, which is not a production-ready setup.

### The Fix

Add to `server-worker/src/routes/auth.ts`:

```typescript
authRouter.post('/register', async (request, env) => {
    const { email, password, phoneNumber } = await request.json() as any;
    const { db } = getDb(env);

    // 1. Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) return error(409, { message: 'Email already in use' });

    // 2. Hash password
    const passwordHash = await hash(password, 12);

    // 3. Create user + assign default role in a transaction
    const [newUser] = await db.transaction(async (tx) => {
        const [user] = await tx.insert(users)
            .values({ email, passwordHash, phoneNumber })
            .returning();

        await tx.insert(userRoles).values({ userId: user.id, roleId: 'customer' });
        return [user];
    });

    // 4. Issue JWT immediately (login on register)
    newUser.role = 'customer';
    const token = await generateToken(newUser, env.RSA_PRIVATE_KEY_PEM);

    return Response.json(
        { token, user: { id: newUser.id, email: newUser.email, role: 'customer' } },
        { status: 201 }
    );
});
```

---

## Gap #4 — No Refresh Token Implementation

**Severity:** ✅ FIXED  
**Location:** `server-worker/src/routes/auth.ts`;  `db/schema/users.ts` (`user_sessions` table)

### What Was Asked For
The `user_sessions` table was defined in the schema, strongly implying a refresh token lifecycle was expected.

### What Was Wrong
The current architecture issues a **single 7-day JWT** with no `POST /auth/refresh` endpoint. The `user_sessions` table (`refresh_token` column) is entirely unused.

**Impact:**
- A stolen JWT is valid for 7 full days with no revocation mechanism.
- Users cannot log out in a meaningful way (since the token is stateless).
- There's no session management.

### The Fix ✅ IMPLEMENTED

The refresh token system has been fully implemented with secure httpOnly cookies:

1. **Dual-token issued at login/register:**
   - `access_token` (7 days) - stored in localStorage, for API authentication
   - `refresh_token` (30 days) - stored in httpOnly cookie, for token refresh

2. **Security features:**
   - Refresh token stored in httpOnly, Secure, SameSite=Strict cookie
   - Cookie automatically sent with requests (no JavaScript needed)
   - XSS resistant (JavaScript cannot read refresh token)
   - CSRF protected via SameSite=Strict
   - Refresh token stored in `user_sessions` table with expiry tracking

3. **New endpoints added:**
   - `POST /auth/refresh` - reads cookie automatically, returns new access token
   - `POST /auth/logout` - invalidates refresh token in DB, clears cookie

4. **Frontend handles auto-refresh:**
   - `authStore.initialize()` called on app mount
   - Auto-refresh on initialization if access token expired
   - Access token decoded to get user ID (no separate storage needed)

See `docs/guides/05-AUTH-AND-JWT-GUIDE.md` — Section 9 for full implementation details.

---

## Gap #5 — Checkout Route Is a Stub (Pseudocode Only)

**Severity:** ⚠️ IMPORTANT  
**Location:** `server-worker/src/routes/orders.ts`

### What Was Asked For
The architecture places order placement explicitly in the Sensitive Layer with: "Writing to orders, order_items. This requires complex transaction management, inventory deduction, and payment verification."

### What Is Wrong
The checkout route exists but contains only comments:

```typescript
// Pseudocode database operations:
// 1. Calculate total server-side
// 2. Wrap via Database Transaction:
//    - Insert into `orders`
//    - Insert into `order_items`
//    - Insert into `payments`
//    - Insert into `order_status_history`
return { message: 'Order created securely via backend' };
```

No actual DB writes happen. No transaction. No payment processing. Calling this endpoint always returns a success message regardless.

### The Fix
Implement the full transaction as documented in `docs/guides/02-DRIZZLE-ORM-GUIDE.md` — Section 7.  
Key missing pieces:
- ✅ Server-side total calculation (never trust client-provided prices)
- ✅ Drizzle transaction with rollback on failure
- ✅ Inventory deduction (`inventory_movements` insert)
- ✅ Payment gateway integration (Stripe/Razorpay API call)
- ✅ Clear cart after successful checkout

---

## Gap #6 — CORS `origin: '*'` in Production

**Severity:** ⚠️ IMPORTANT  
**Location:** `server-worker/src/index.ts`

### What Was Asked For
A production-grade Worker with proper security controls.

### What Is Wrong
```typescript
const { preflight, corsify } = cors({
    origin: '*',  // ← Allows any origin
});
```

`origin: '*'` means any website on the internet can call your Worker endpoints, including from untrusted domains. While the JWT bearer token still provides authentication, this:
1. Weakens CSRF defenses for cookie-based flows (if ever added).
2. Allows your Worker to be used as a proxy by malicious sites.
3. Is not production-safe per standard security policy.

### The Fix
```typescript
const { preflight, corsify } = cors({
    origin: ['https://yourfrontend.com', 'https://app.yourfrontend.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
});
```

---

## Gap #7 — `is_read` on `notifications` is `text` Instead of `boolean` (RESOLVED)

**Severity:** ✅ RESOLVED (2026-03-02)  
**Location:** `db/schema/system.ts`

### Status: Fixed
The `notifications` table schema was updated to use `boolean('is_read')`. This allows native boolean handling in PostgreSQL and correct type inference in TypeScript.

---

## Gap #8 — The Express.js Server (`/server/`) Is Obsolete

**Severity:** 📝 MINOR / ⚠️ IMPORTANT (if left in production)  
**Location:** `ecommerce-backend/server/`

### What Was Asked For
The architecture uses a Cloudflare Worker (`server-worker/`) as the Sensitive Layer backend. This is the **production backend**.

### What Is Wrong
The project contains a legacy Express.js server (`server/index.js`, `server/routes/auth.js`, `server/routes/orders.js`) that was the original development iteration. It has now been superseded by the Worker. However:
- It still exists in the codebase.
- It uses `jsonwebtoken` (Node.js-only) instead of `jose`.
- It uses different auth middleware (`jwks.js` vs `jwks.ts`).
- Running both would create a confusing dual-backend situation.

### The Fix
Either:
1. **Delete** the `/server` directory if the Worker fully replaces it (recommended), **or**
2. **Archive** it with a `DEPRECATED.md` note explaining it was the predecessor to the Worker.

---

## Gap #9 — No Input Validation on Any Route

**Severity:** ⚠️ IMPORTANT  
**Location:** All `server-worker/src/routes/*.ts` files

### What Is Wrong
No route currently validates the shape or types of the request body:

```typescript
const { email, password } = await request.json() as any; // ← Blindly cast to `any`
```

If `email` or `password` is not provided, the route may:
- Throw a runtime error
- Execute a SQL query with `undefined` as a parameter
- Return an opaque 500 error to the client

### The Fix
Use a validation library like `zod` (compatible with Workers):

```bash
pnpm add zod
```

```typescript
import { z } from 'zod';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

authRouter.post('/login', async (request, env) => {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return error(400, { errors: parsed.error.flatten() });

    const { email, password } = parsed.data;
    // ... rest of handler
});
```

---

## Gap #10 — `wrangler.jsonc` Has No `vars` or Secrets Declared

**Severity:** 📝 MINOR  
**Location:** `server-worker/wrangler.jsonc`

### What Is Wrong
The `wrangler.jsonc` file has all variable/secret declarations commented out. This means:
1. `wrangler types` (`cf-typegen`) cannot auto-generate the correct `Env` interface.
2. New developers won't know which secrets are required to deploy.

### The Fix
Declare the secrets (with empty values — wrangler treats these as required):

```jsonc
// wrangler.jsonc
{
    "name": "server-worker",
    "main": "src/index.ts",
    "compatibility_date": "2026-02-26",
    "compatibility_flags": ["nodejs_compat"],
    "observability": { "enabled": true },
    "placement": { "mode": "smart" },
    // Declare that these secrets exist (values managed by wrangler secret put)
    // No values here — just telling wrangler the names
    "secrets": ["DATABASE_URL", "RSA_PRIVATE_KEY_PEM", "RSA_PUBLIC_KEY_PEM"]
}
```

---

## Summary Table

| # | Gap | Severity | Status |
|---|---|---|---|
| 1 | JWT verification uses private key instead of public key | 🚨 CRITICAL | ✅ FIXED |
| 2 | Password verification not implemented | 🚨 CRITICAL | ❌ Open |
| 3 | No user registration endpoint | ⚠️ IMPORTANT | ❌ Open |
| 4 | No refresh token / logout system | ⚠️ IMPORTANT | ❌ Open |
| 5 | Checkout route is pseudocode (no actual writes) | ⚠️ IMPORTANT | ❌ Open |
| 6 | CORS `origin: '*'` for production | ⚠️ IMPORTANT | ❌ Open |
| 7 | `notifications.is_read` stored as text instead of boolean | 📝 MINOR | ✅ FIXED |
| 8 | Legacy Express server exists alongside Worker | 📝 MINOR | ❌ Open (Deferred) |
| 9 | No input validation on any route | ⚠️ IMPORTANT | ❌ Open |
| 10 | `wrangler.jsonc` has no declared secrets | 📝 MINOR | ❌ Open |

---

## ✅ Intentional Deviations (Documented in `ARCHITECTURE_STRATEGY.md`)

These were originally requested but **deliberately re-routed** for security reasons:

| Request | Deviation | Why |
|---|---|---|
| Allow clients to read `users` profile info directly via Data API | All user reads/writes go through Worker | `users` table contains `password_hash`. Even with RLS, a misconfigured JOIN or policy could leak hashes. |
| Allow JWT holders to write to `orders` via Data API | `orders` writes are Worker-only | Client could set `total_amount: 0` or `status: 'paid'` without payment. RLS cannot validate Stripe/Razorpay. |
| Use `neon()` client-side with `authToken` to run raw SQL | Browser uses PostgREST only | Raw SQL from browser allows DoS attacks via expensive queries (`pg_sleep(10)`). PostgREST enforces safe execution plans. |
