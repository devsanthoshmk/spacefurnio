## General Rules

- Use `pnpm` only.
- Don't make architectural changes without approval.
- Update `docs/` for completed work when applicable.
- Check `backend/ecommerce-backend/docs/` before backend changes.
- Don't modify frontend scrolling unless you understand the custom implementation.
- If a recurring issue appears, improve `workflow-rules/AGENTS.md`.

---

## Commands

### Frontend
```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
```

### Worker
```bash
pnpm dev
pnpm deploy
pnpm test
pnpm exec tsc --noEmit
pnpm cf-typegen   # after wrangler.jsonc binding changes
```

### Database
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
```

---

## Code Style

- Be concise.
- No emojis unless requested.
- Use `@/` imports when available.
- Vue: `<template>` → `<script setup>` → `<style scoped>`.
- Prefer Tailwind over custom CSS.
- Pinia (setup stores): use `ref()` for state, `computed()` for derived state, and functions for actions.- Prefer explicit TypeScript types; avoid `any`.
- Frontend: use `try/catch`.
- Backend: return proper HTTP errors.
- Naming:
  - camelCase: variables/functions/files
  - PascalCase: Vue components
  - UPPER_SNAKE_CASE: constants
  - kebab-case: CSS

---

## Project Rules

- Auth: access token in `localStorage`, refresh token in httpOnly cookie.
- Cloudflare Workers use `itty-router` and `jose`.
- Use Neon Data API directly for cart/wishlist.
- RLS policies **must** use `auth.user_id()`.

---

## Before Commit

- Run frontend lint.
- Run `pnpm exec tsc --noEmit` for worker changes.
- Never commit secrets.