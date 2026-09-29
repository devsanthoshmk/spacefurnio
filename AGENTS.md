# SpaceFurnio Agent Guidelines

## General Rules

- Use `pnpm` exclusively across all workspaces.
- Do not make architectural changes without prior approval.
- Always update `docs/` when completing features, schema changes, or bug fixes.
- Consult documentation in `backend/ecommerce-backend/docs/` before making backend or database changes.
- Do not touch or modify the custom frontend scrolling logic under any circumstances.
- Keep agent instructions up to date in `AGENTS.md` whenever workflows or standards evolve.

---

## Workspace Structure & Commands

### Frontend (`/frontend`)
```bash
# Directory: frontend/
pnpm dev        # Start Vite dev server
pnpm build      # Production build
pnpm lint       # Run ESLint with auto-fix
pnpm format     # Run Prettier on src/
```

### Worker API (`/backend/ecommerce-backend/server-worker`)
```bash
# Directory: backend/ecommerce-backend/server-worker/
pnpm dev        # Run local worker via Wrangler
pnpm deploy     # Deploy worker to Cloudflare
pnpm test       # Run Vitest suite
pnpm exec tsc --noEmit # Type-check worker TypeScript
pnpm cf-typegen # Regenerate types after wrangler.jsonc binding changes
```

### Database & Migrations (`/backend/ecommerce-backend`)
```bash
# Directory: backend/ecommerce-backend/
pnpm db:generate # Generate Drizzle migrations
pnpm db:migrate  # Run migration runner (db/migrate.ts)
pnpm db:push     # Push schema directly to database
pnpm db:studio   # Open Drizzle Studio UI
```

---

## Architecture & Project Rules

- **Authentication**: Access token is stored in `localStorage`; refresh token is stored in an `httpOnly` cookie.
- **Worker Framework**: Cloudflare Workers use `itty-router` for routing and `jose` for cryptographic JWT signing/verification.
- **Neon Data API**: Cart, wishlist, and user-scoped non-sensitive reads interact directly with Neon Data API from the frontend using backend-issued RS256 JWTs.
- **Row Level Security (RLS)**: PostgreSQL RLS policies **must** strictly enforce user isolation using `auth.user_id()` or `current_setting('request.jwt.claim.sub', true)`.
- **Sensitive Operations**: Orders, status updates, payments, and administrative actions must be processed via the backend Worker with elevated credentials and transactions.

---

## Code Style & Conventions

- **Conciseness**: Write clean, maintainable code without conversational fluff or unnecessary comments.
- **Formatting**: No emojis in source code or commit messages unless explicitly requested.
- **Imports**: Use `@/` path aliases where configured.
- **Vue 3**: Enforce `<template>` → `<script setup lang="ts">` → `<style scoped>` ordering.
- **Styling**: Prefer Tailwind CSS utility classes over custom CSS stylesheets.
- **State Management**: Pinia setup stores must use `ref()` for state, `computed()` for derived state, and functions for actions. Use explicit TypeScript typing (avoid `any`).
- **Error Handling**:
  - Frontend: Wrap async operations in `try/catch` with user-friendly error state handling.
  - Backend/Worker: Return consistent JSON error responses with appropriate HTTP status codes.
- **Naming Conventions**:
  - `camelCase`: variables, functions, and standard file names
  - `PascalCase`: Vue components and TypeScript types/interfaces
  - `UPPER_SNAKE_CASE`: constants and environment variables
  - `kebab-case`: CSS classes and route URLs

---

## Pre-Commit Verification

Before committing changes, ensure:
1. Frontend lint passes: `pnpm --filter frontend lint` (or `pnpm lint` in `frontend/`).
2. Worker type-checking passes: `pnpm exec tsc --noEmit` in `backend/ecommerce-backend/server-worker/`.
3. No secrets, credentials, or `.env` tokens are committed.
