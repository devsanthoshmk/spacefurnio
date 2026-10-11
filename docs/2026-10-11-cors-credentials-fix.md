# CORS Credentials & Origin Fix

## Problem
When logging into the admin dashboard (`/admin/login`), browser requests to the Cloudflare Worker backend (`/auth/login`) failed with the following CORS error:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at 'http://localhost:8787/auth/login'. (Reason: Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*').
```

## Root Cause
1. In `backend/ecommerce-backend/server-worker/src/index.ts`, `itty-router`'s `cors()` middleware was initialized with `origin: '*'` without `credentials: true`.
2. The frontend auth client (`adminApi.ts`) sends requests with `credentials: 'include'` (required for handling `Set-Cookie` / session cookies).
3. The W3C Fetch / CORS specification forbids the wildcard `*` for `Access-Control-Allow-Origin` when `credentials` mode is `include`. In addition, `Access-Control-Allow-Credentials: true` is required.

## Resolution
1. **Worker CORS Configuration (`backend/ecommerce-backend/server-worker/src/index.ts`)**:
   - Set `origin: (origin) => origin || '*'` to dynamically reflect the requesting client origin (e.g. `http://localhost:5173`, production domains) for credentialed requests.
   - Set `credentials: true` to return `Access-Control-Allow-Credentials: true`.
   - Added standard request headers to `allowHeaders`: `['Content-Type', 'Authorization', 'x-session-id', 'X-Session-ID', 'Cookie', 'Accept']`.
   - Set `maxAge: 86400` for preflight response caching.

2. **Automated Vitest Suite (`backend/ecommerce-backend/server-worker/test/index.spec.ts`)**:
   - Added tests for `OPTIONS` preflight and `POST /auth/login` requests verifying that `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true` are correctly returned.

## Verification
- Vitest suite: 9/9 test suites passed (208/208 tests passing).
- TypeScript check: `pnpm exec tsc --noEmit` passed with 0 errors.
- ESLint: `pnpm lint` in `frontend/` passed cleanly.
