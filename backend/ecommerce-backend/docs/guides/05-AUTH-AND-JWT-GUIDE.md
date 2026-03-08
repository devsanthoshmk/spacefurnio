# Guide 05 — Authentication & JWT: JWKS, Key Management & Token Lifecycle

> **JWT Algorithm:** RS256 (RSA + SHA-256 asymmetric signing)
> **JWT Library:** `jose` v6 (`jose` is the IETF standard Web Crypto implementation)
> **Key Storage:** Cloudflare Worker Secrets (`RSA_PRIVATE_KEY_PEM`, `RSA_PUBLIC_KEY_PEM`)
> **Access Token:** 7 days, stored in localStorage
> **Refresh Token:** 30 days, stored in httpOnly cookie (Secure, SameSite=Strict)
> **JWKS Endpoint:** `GET /auth/.well-known/jwks.json`

---

## Table of Contents

1. [Why RS256 JWT Over HS256 or Sessions?](#1-why-rs256-jwt-over-hs256-or-sessions)
2. [RSA Key Generation](#2-rsa-key-generation)
3. [Key Storage Strategy](#3-key-storage-strategy)
4. [Token Generation (`/auth/login`)](#4-token-generation-authlogin)
5. [JWKS Endpoint (`/.well-known/jwks.json`)](#5-jwks-endpoint-well-knownjwksjson)
6. [Token Verification (Worker Middleware)](#6-token-verification-worker-middleware)
7. [Token Verification (Neon Data API)](#7-token-verification-neon-data-api)
8. [The Complete Auth Lifecycle](#8-the-complete-auth-lifecycle)
9. [Refresh Token Implementation](#9-refresh-token-implementation)
10. [Security Best Practices](#10-security-best-practices)

---

## 1. Why RS256 JWT Over HS256 or Sessions?

This architecture has a unique requirement: the **same token** must be verifiable by:
1. The **Cloudflare Worker** (to authenticate sensitive routes)
2. **Neon's Data API** (to enforce RLS policies)

This rules out both HS256 and sessions:

| Auth Method | Why Not Used |
|---|---|
| **HS256 JWT** | Requires sharing the secret key with Neon to verify tokens. That secret would need to be stored in Neon's infra — violating separation of trust |
| **Database Sessions** | Stateful. Doesn't work with serverless Workers (no persistent memory). Also can't be validated by Neon's PostgREST layer |
| **RS256 JWT** ✅ | Private key stays in the Worker (signs tokens). Public key is freely published at `/.well-known/jwks.json`. Both the Worker and Neon can independently verify without sharing secrets |

> **RS256 = asymmetric.** Sign with private key. Verify with public key. The private key NEVER leaves the Worker. The public key is published openly. This is the same model used by Google, GitHub, and all major OAuth providers.

---

## 2. RSA Key Generation

Generate a **2048-bit RSA key pair** (minimum) for production use:

```bash
# Generate private key (PKCS#8 format, required by `jose`)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem

# Extract public key from the private key
openssl rsa -pubout -in private.pem -out public.pem

# Verify keys were generated correctly
openssl rsa -in private.pem -check
```

### Formatting for Wrangler Secrets

Wrangler secrets don't support multiline values directly. Convert the PEM to a single-line escaped format:

```bash
# For Private Key:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem
# Output: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----

# For Public Key:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem
# Output: -----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----
```

Paste these **single-line escaped** values when running `wrangler secret put`.

---

## 3. Key Storage Strategy

### Development (`.dev.vars`)

```env
RSA_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----"
RSA_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\nMIIBIjAN...\n-----END PUBLIC KEY-----"
```

> The values use `\n` (escaped) not literal newlines. The `jwks.ts` utility handles unescape:

```typescript
const unescapedPem = pem.replace(/\\n/g, '\n');
```

### Production (Wrangler Secrets)

```bash
wrangler secret put RSA_PRIVATE_KEY_PEM
# Paste the single-line escaped PEM when prompted

wrangler secret put RSA_PUBLIC_KEY_PEM
# Paste the single-line escaped PEM when prompted
```

Secrets are **encrypted at rest** by Cloudflare and only decrypted within the Worker runtime. They are never visible in Wrangler logs or the dashboard.

### Key Caching in `jwks.ts`

```typescript
// module-scope cache for the isolate lifetime
let cachedPrivateKey: any = null;
let cachedPublicKey: any = null;
let cachedJwk: any = null;

export const loadPrivateKey = async (pem: string) => {
    if (cachedPrivateKey) return cachedPrivateKey; // Hit: skip PEM parse
    const unescapedPem = pem.replace(/\\n/g, '\n');
    cachedPrivateKey = await importPKCS8(unescapedPem, 'RS256');
    return cachedPrivateKey;
};
```

> Parsing a PEM key from a string to a `CryptoKey` object is done via `importPKCS8` (private) and `importSPKI` (public). These are async operations. Caching them avoids re-parsing on every request. The cache is valid for the **isolate lifetime** — if the Worker scales to new isolates, each will warm up its own cache on the first request.

---

## 4. Token Generation (`/auth/login`)

```typescript
// src/utils/jwks.ts
export const generateToken = async (user: any, privateKeyPem: string) => {
    const privateKey = await loadPrivateKey(privateKeyPem);

    const payload = {
        sub: user.id,       // ← CRITICAL: This is what RLS reads
        email: user.email,
        role: user.role,
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: 'neon-ecommerce-key-1' })
        .setExpirationTime('7d')
        .sign(privateKey);

    return token; // eyJhbGciOiJSUzI1NiIsImtpZCI6Im5lb24uZWNvbW1lcmNlLWtleS0xIn0...
};
```

### Decoded JWT Structure

**Header:**
```json
{
  "alg": "RS256",
  "kid": "neon-ecommerce-key-1"  // Key ID — must match the kid in JWKS
}
```

**Payload:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User UUID
  "email": "user@example.com",
  "role": "customer",
  "iat": 1740600000,    // Issued at (Unix timestamp)
  "exp": 1741118400     // Expires at (iat + 7 days)
}
```

**Signature:** RS256 signature (base64url encoded)

> The `kid` field in the JWT header tells the verifier which key in the JWKS to use. This is how **key rotation** works: you can add a new key to the JWKS with a new `kid`, issue new tokens with it, and old tokens with the old `kid` continue to work until they expire.

---

## 5. JWKS Endpoint (`/.well-known/jwks.json`)

```typescript
// src/routes/auth.ts
authRouter.get('/.well-known/jwks.json', async (request, env) => {
    const jwks = await getJwks(env.RSA_PUBLIC_KEY_PEM);
    return jwks;
});
```

```typescript
// src/utils/jwks.ts
export const getJwks = async (publicKeyPem: string) => {
    if (cachedJwk) return { keys: [cachedJwk] };

    const pubKey = await loadPublicKey(publicKeyPem);
    const fullJwk = await exportJWK(pubKey);

    cachedJwk = {
        kty: fullJwk.kty,   // "RSA"
        n: fullJwk.n,        // RSA modulus (base64url)
        e: fullJwk.e,        // RSA exponent (base64url)
        kid: 'neon-ecommerce-key-1',
        use: 'sig',          // Key purpose: signature
        alg: 'RS256',
    };

    return { keys: [cachedJwk] };
};
```

### Live JWKS Response

```
GET https://<worker-url>/auth/.well-known/jwks.json

Response:
{
  "keys": [
    {
      "kty": "RSA",
      "n": "z3M5...(long base64url string)...",
      "e": "AQAB",
      "kid": "neon-ecommerce-key-1",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}
```

---

## 6. Token Verification (Worker Middleware)

```typescript
// src/middleware/auth.ts
import { jwtVerify } from 'jose';
import { loadPrivateKey } from '../utils/jwks';

export const authenticate = async (request: AuthRequest, env: any) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return error(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
        const key = await loadPublicKey(env.RSA_PUBLIC_KEY_PEM);
        const { payload } = await jwtVerify(token, key, { algorithms: ['RS256'] });
        request.user = payload;
    } catch (e) {
        return error(401, 'Invalid or expired token');
    }
};
```

> ⚠️ **Current Bug:** The middleware uses `loadPrivateKey` for verification, which works because `jose`'s `jwtVerify` is flexible, but it is architecturally incorrect. RS256 verification should use the **public key**. This is a known deviation documented in `compliance/ARCHITECTURE-GAPS.md`.

---

## 7. Token Verification (Neon Data API)

Neon validates JWTs automatically before any Data API request is processed:

1. Neon reads the `Authorization: Bearer <token>` header.
2. Neon fetches the JWKS from the configured URL: `https://<worker-url>/auth/.well-known/jwks.json`.
3. Neon finds the key with matching `kid`.
4. Neon verifies the token's RS256 signature.
5. If valid, Neon calls `SET request.jwt.claim.sub = 'user-uuid'` on the PostgreSQL session.
6. PostgreSQL RLS policies that reference `current_setting('request.jwt.claim.sub', true)` now have access to the user's identity.

**This requires no code on your part.** It's entirely managed by Neon's Data API layer — as long as the JWKS URL is configured in the Neon Console.

### JWKS URL Configuration

```
Neon Console → Your Project → Auth tab
→ "Add JWKS URL" → https://<worker-url>/auth/.well-known/jwks.json
```

---

## 8. The Complete Auth Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE AUTH LIFECYCLE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

STEP 1: User registers or logs in
Browser → POST /auth/login { email, password }
Worker reads users table (raw sql, neondb_owner)
Worker verifies password hash [TODO: implement]
Worker generates RS256 JWT (signed with PRIVATE key)
Response → { token: "eyJ..." }

STEP 2: Browser stores the token
sessionStorage.setItem('auth_token', token)
            ↑
  NOT localStorage (XSS risk on long-session sites)

STEP 3: Sensitive operation (checkout)
Browser → POST /api/orders/checkout
         Authorization: Bearer eyJ...
         ↓
Worker middleware decodes token → extracts user.sub
Worker runs Drizzle transaction (neondb_owner)
Response → { orderId: "..." }

STEP 4: Non-sensitive operation (view cart)
Browser → GET /rest/v1/cart_items
         Authorization: Bearer eyJ...
         neon-connection-string: postgresql://authenticator@...
         ↓
Neon Data API validates JWT via JWKS URL
PostgreSQL session: request.jwt.claim.sub = user.id
RLS policies: WHERE user_id = current_setting('request.jwt.claim.sub')
Response → [{ id, quantity, product_id, ... }]

STEP 5: Token expires (after 7 days)
Browser detects 401, attempts refresh using stored refresh_token
Browser → POST /auth/refresh { refresh_token: "eyJ..." }
Worker validates refresh_token against user_sessions table
Worker issues new access_token
Response → { access_token: "eyJ..." }
Browser retries original request
```

---

## 9. Refresh Token Implementation

The system implements a **dual-token** pattern with access tokens (7 days) and refresh tokens (30 days).

### Token Types

| Token | Expiry | Purpose | Storage |
|-------|--------|---------|---------|
| **access_token** | 7 days | API authentication | localStorage (`spacefurnio_token`) |
| **refresh_token** | 30 days | Get new access tokens | httpOnly cookie (sent automatically) |

### Token Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
├─────────────────────────────────────────────────────────────────┤
│  localStorage:                                                  │
│    └── spacefurnio_token (JWT access_token)                    │
│         ↓ decoded → { sub: user.id, email, role }              │
│                                                                 │
│  httpOnly Cookie:                                               │
│    └── refresh_token (JWT, HttpOnly, Secure, SameSite=Strict)  │
│         ↓ automatically sent with every request                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE WORKER                           │
├─────────────────────────────────────────────────────────────────┤
│  /auth/login    → returns access_token + sets refresh cookie   │
│  /auth/refresh  → reads cookie, returns new access_token       │
│  /auth/logout   → deletes refresh cookie + clears DB session   │
└─────────────────────────────────────────────────────────────────┘
```

### Login Response

The refresh token is set as an httpOnly cookie, not returned in the body:

```json
// Response Body:
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "role": "customer"
    }
}

// Response Headers:
Set-Cookie: refresh_token=eyJhbGciOiJSUzI1NiIs...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
```

### Refresh Endpoint

The refresh endpoint reads the refresh token from the httpOnly cookie automatically:

```typescript
// POST /auth/refresh
// Cookie: refresh_token=eyJ... (automatically sent)
// Response: { "access_token": "eyJ..." }

authRouter.post('/refresh', async (request, env) => {
    // Read refresh token from cookie (automatically sent)
    const cookieHeader = request.headers.get('Cookie');
    let refreshToken = null;
    
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        for (const cookie of cookies) {
            if (cookie.startsWith('refresh_token=')) {
                refreshToken = cookie.substring('refresh_token='.length);
                break;
            }
        }
    }

    // Verify token and check database
    const payload = await verifyRefreshToken(refreshToken, env.RSA_PUBLIC_KEY_PEM);
    const sessionResult = await sql`
        SELECT * FROM user_sessions 
        WHERE refresh_token = ${refreshToken} AND expires_at > NOW()
    `;

    // Generate new access token
    const accessToken = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

    // Return new access token, refresh cookie is automatically refreshed
    return new Response(JSON.stringify({ access_token: accessToken }), {
        headers: {
            'Set-Cookie': `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
        }
    });
});
```

### Frontend Auto-Refresh

The frontend automatically handles token refresh:

1. On initialization, checks for stored access token in localStorage
2. If access_token expired, calls refresh endpoint (cookie is sent automatically)
3. On 401 response from API, attempts refresh before failing

```javascript
// frontend/src/lib/api.js

async refresh() {
    // Refresh token is sent automatically via httpOnly cookie
    const res = await fetch(`${WORKER_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
}
```

### Logout

```typescript
// POST /auth/logout
// Cookie: refresh_token=eyJ... (automatically sent)
// Response: { "message": "Logged out successfully" }
// Header: Set-Cookie: refresh_token=; Max-Age=0 (clears cookie)

authRouter.post('/logout', async (request, env) => {
    // Read refresh token from cookie
    const cookieHeader = request.headers.get('Cookie');
    let refreshToken = null;
    
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        for (const cookie of cookies) {
            if (cookie.startsWith('refresh_token=')) {
                refreshToken = cookie.substring('refresh_token='.length);
                break;
            }
        }
    }

    // Delete from database
    if (refreshToken) {
        await sql`DELETE FROM user_sessions WHERE refresh_token = ${refreshToken}`;
    }

    // Clear cookie
    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        headers: {
            'Set-Cookie': 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
        }
    });
});
```

### Database Schema

The `user_sessions` table stores refresh tokens:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `refresh_token` | TEXT | The JWT refresh token (unique) |
| `expires_at` | TIMESTAMP | When token expires |
| `created_at` | TIMESTAMP | When session created |

### Token Rotation (Optional)

Token rotation is available but disabled by default. To enable, uncomment the rotation code in `/auth/refresh`:

```typescript
// Generate new refresh token on each use
const newRefreshToken = await generateRefreshToken(user.id, env.RSA_PRIVATE_KEY_PEM);
await sql`
    UPDATE user_sessions
    SET refresh_token = ${newRefreshToken}, expires_at = ${newExpiresAt}
    WHERE refresh_token = ${refresh_token}
`;
return { access_token: accessToken, refresh_token: newRefreshToken };
```

---

## 10. Security Best Practices

| Practice | Status | Notes |
|---|---|---|
| **RS256 asymmetric signing** | ✅ Implemented | Private key never shared |
| **Private key stored as Worker secret** | ✅ Implemented | Encrypted by Cloudflare |
| **JWKS endpoint publicly served** | ✅ Implemented | Required for Neon verification |
| **JWT expiry set** | ✅ Implemented | 7-day access token expiry |
| **Password hashing** | ✅ Implemented | PBKDF2 via crypto.ts |
| **`kid` in JWT header** | ✅ Implemented | Supports future key rotation |
| **Correct key for verification** | ✅ Implemented | Uses public key in middleware |
| **Access + Refresh token pair** | ✅ Implemented | 7d access + 30d refresh |
| **Access token in localStorage** | ✅ Implemented | For API authentication |
| **Refresh token in httpOnly cookie** | ✅ Implemented | Secure, XSS resistant |
| **Refresh token stored in DB** | ✅ Implemented | user_sessions table |
| **HTTPS only** | ✅ Cloudflare enforces this | All traffic is TLS 1.3 |
| **SameSite=Strict cookies** | ✅ Implemented | CSRF protection |
| **CORS scope** | ⚠️ Needs production lock-down | Currently `origin: '*'` |
| **Token rotation** | ⚠️ Optional | Disabled by default |
