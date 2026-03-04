# ❓ Frequently Asked Questions (FAQ)

This file is automatically updated with resolutions and answers to queries regarding the backend workspace.

## Q: What is my JWKS URL?

Your JSON Web Key Set (JWKS) URL is exposed by the Cloudflare Worker via the `auth` route. Based on the routing defined in `src/index.ts` and `src/routes/auth.ts`, the path for the JWKS endpoint is `/.well-known/jwks.json` on the `/auth` base route.

**The full URLs are:**
- **Local Development:** `http://localhost:8787/auth/.well-known/jwks.json`
- **Production (Cloudflare):** `https://<your-worker-subdomain>.workers.dev/auth/.well-known/jwks.json` (Replace `<your-worker-subdomain>.workers.dev` with your actual worker URL or custom domain).

**Configuration Notes:**
- You can find the local test base URL configuration in the `new-backend-test/environments/Local.bru` file, which is set to `http://localhost:8787`.
- The exact same URL is used to verify the payloads of JWTs across services like Neon DB and your Frontend. Ensure it is accessible.

## Q: Why am I getting `{ "status": 500, "error": "Failed to load public key: Cannot read properties of undefined (reading 'replace')" }` in production for the JWKS endpoint?

This 500 error occurs in production because the secret keys (like `RSA_PUBLIC_KEY_PEM`) are `undefined`. While local development (`wrangler dev`) automatically loads environment variables from your `.dev.vars` file, **production environments on Cloudflare require secrets to be explicitly uploaded.**

**Resolution:**
To fix this, upload your `DATABASE_URL`, `RSA_PRIVATE_KEY_PEM`, `RSA_PUBLIC_KEY_PEM`, and `JWT_SECRET` as Cloudflare secrets directly from your terminal:

```bash
npx wrangler secret put RSA_PUBLIC_KEY_PEM
```

*(You will be prompted to paste the secret value. Repeat this process for all the keys present in your `.dev.vars` file).*
