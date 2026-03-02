# Environment Variables & Secrets Reference

> This document is the **single source of truth** for all environment variables and secrets  
> used across the `ecommerce-backend` project.  
> ⚠️ **Never commit secrets to Git.** All secret values should be in `.gitignore`d files or Wrangler secrets.

---

## Variable Inventory

### Root `ecommerce-backend/.env`

Used by: `db/migrate.ts`, `drizzle.config.ts` (Node.js local tools only)

| Variable | Value Type | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | **Full privileged connection** using `neondb_owner`. Used ONLY for running migrations via `npx tsx db/migrate.ts`. Use the **pooler** endpoint. |

**Example `.env`:**
```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

> **Note:** Never use `neon-http` connection strings in `.env`. Migrations require TCP via `postgres-js`. Use the `-pooler.` hostname.

---

### Worker `server-worker/.dev.vars`

Used by: Cloudflare Worker during `wrangler dev` (local development)  
Production equivalent: Wrangler secrets (encrypted)

| Variable | Value Type | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | Same `neondb_owner` string. In Workers, this is the HTTP-compatible endpoint. Use the **pooler** endpoint. |
| `RSA_PRIVATE_KEY_PEM` | PEM string (escaped) | ✅ Yes | RSA-2048 private key for signing JWTs at `/auth/login`. Stays in Worker. NEVER expose. |
| `RSA_PUBLIC_KEY_PEM` | PEM string (escaped) | ✅ Yes | RSA-2048 public key. Exposed at `/.well-known/jwks.json` for Neon + frontend to verify tokens. |

**Example `.dev.vars`:**
```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
RSA_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w...TRUNCATED...\n-----END PRIVATE KEY-----"
RSA_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQ...TRUNCATED...\n-----END PUBLIC KEY-----"
```

> ⚠️ **PEM Key Format:** Keys must use `\n` (escaped backslash-n) between lines — NOT literal newlines. The `jwks.ts` utility strips them with `pem.replace(/\\n/g, '\n')`.

---

### Production Secrets (Wrangler)

Set via:
```bash
wrangler secret put DATABASE_URL
wrangler secret put RSA_PRIVATE_KEY_PEM
wrangler secret put RSA_PUBLIC_KEY_PEM
```

These are NOT stored in any file — they are encrypted by Cloudflare and injected into the Worker runtime as `env.*`.

**Accessing in Worker code:**
```typescript
// ✅ Correct — via env argument
const { db } = getDb(env);           // env.DATABASE_URL
const token = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

// ❌ Wrong — process.env doesn't exist in Workers
const url = process.env.DATABASE_URL; // undefined in Workers
```

---

## Frontend Configuration (Not Secrets)

These values can be safely embedded in client-side JavaScript:

| Value | Description |
|---|---|
| `NEON_DATA_API_BASE` | `https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1` |
| `NEON_CONNECTION_STRING` | `postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `WORKER_BASE_URL` | `https://<worker-url>` or `https://<cloudflared-tunnel-url>` during dev |

> These are NOT secrets. `authenticator` has no password — only the JWT Bearer token authenticates the request. The connection string tells Neon which **role** to use, not how to authenticate.

---

## `.gitignore` Enforcement

Verify these files are gitignored:

```gitignore
# Root
.env
*.pem
private.pem
public.pem

# Worker
server-worker/.dev.vars
```

---

## Quick Reference: Variable Origins

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Component            │ Variable              │ Source                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  db/migrate.ts        │ DATABASE_URL          │ .env                        │
│  drizzle.config.ts    │ DATABASE_URL          │ .env                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Worker: getDb()      │ env.DATABASE_URL      │ .dev.vars / wrangler secret │
│  Worker: jwks.ts      │ env.RSA_PRIVATE_KEY_P │ .dev.vars / wrangler secret │
│  Worker: jwks.ts      │ env.RSA_PUBLIC_KEY_PE │ .dev.vars / wrangler secret │
├─────────────────────────────────────────────────────────────────────────────┤
│  Browser: Data API    │ NEON_CONNECTION_STRING│ Hardcoded in client config  │
│  Browser: Data API    │ NEON_DATA_API_BASE    │ Hardcoded in client config  │
│  Browser: Auth        │ JWT Bearer Token      │ Received from /auth/login   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Rotating Secrets

### Rotating RSA Keys (Recommended every 12 months)

1. **Generate new key pair** (see `docs/guides/05-AUTH-AND-JWT-GUIDE.md` — Section 2)
2. **Add new key to JWKS** (keep the old one during transition):
   ```typescript
   // In getJwks(), support multiple keys during rotation:
   return { keys: [oldCachedJwk, newCachedJwk] };
   ```
3. **Update production secrets:**
   ```bash
   wrangler secret put RSA_PRIVATE_KEY_PEM  # New private key
   wrangler secret put RSA_PUBLIC_KEY_PEM   # New public key
   ```
4. **Wait for old tokens to expire** (7 days with current config)
5. **Remove old key from JWKS**

### Rotating DATABASE_URL (e.g., after credential reset in Neon)

1. Reset credentials in Neon Console → Project Settings → Database
2. Update local `.env` and `server-worker/.dev.vars`
3. Update production secret: `wrangler secret put DATABASE_URL`
4. Redeploy worker: `pnpm run deploy`
