# SpaceFurnio SSG / Prerender Pipeline

## Overview
To provide instant First Contentful Paint (FCP) and full SEO indexing without breaking browser APIs, custom scroll logic, Three.js canvases, or client-side Pinia state stores, an automated post-build prerendering engine has been established.

## Architecture

1. **Build Step (`pnpm run build`)**:
   - Executes standard Vite bundling (`vite build`) producing minified production assets in `dist/`.
   - Executes `frontend/scripts/prerender.js`.
2. **Prerender Engine (`frontend/scripts/prerender.js`)**:
   - Launches a lightweight ephemeral Node HTTP server serving `dist/`.
   - Connects to the Neon Serverless PostgreSQL database to dynamically discover all active product detail paths (`/shop/product/:id`).
   - Discovers all public static marketing routes (`/`, `/about`, `/portfolio`, `/collabs`, `/contact`, `/shop`, `/shopping`).
   - Launches headless Chromium (via Playwright) with a worker pool (concurrency = 6).
   - Navigates to each route, waits for network idle and Vue DOM hydration/settling.
   - Extracts complete rendered HTML and outputs `dist/<route>/index.html`.
   - Excludes authenticated and administrative views (`/admin-spacefurnio/*`).

## Verification & Commands

```bash
# Frontend directory: frontend/
pnpm build        # Full production build + SSG prerendering
pnpm build:spa    # Standard SPA-only build without prerendering
pnpm prerender    # Run prerenderer standalone against existing dist/
pnpm lint         # Run ESLint validation
```
