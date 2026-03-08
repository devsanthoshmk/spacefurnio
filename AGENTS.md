# AGENTS.md - Spacefurnio Development Guidelines

## General Rules

- **Always use pnpm** for package management (not npm or yarn)
- **Do not execute unilateral architectural changes without approval** - consult owner first
- **Strictly document everything** - update docs/ folder for every query solved
- **Refer to backend docs** at `backend/ecommerce-backend/docs` for API/auth patterns
- **Do not touch frontend scrolling** - the frontend uses custom scrolling
- **Update workflow rules** when you find things hard - make it easy for next time
- Always prefer relative paths from the project root instead of absolute paths.
  **Correct Example**:
  backend/ecommerce-backend/db/index.ts
  **Example to Avoid**:
  /home/user/.../backend/ecommerce-backend/db/index.ts

---

## Build, Lint & Test Commands

### Frontend (`/frontend`)

```bash
# Development
pnpm dev              # Start Vite dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# Linting & Formatting
pnpm lint             # Run ESLint with auto-fix (eslint . --fix)
pnpm format           # Format with Prettier (prettier --write src/)

# Example: Run lint on specific file
pnpm lint -- --no-fix src/stores/auth.js
```

### Backend - Cloudflare Worker (`/backend/ecommerce-backend/server-worker`)

```bash
# Development & Deployment
pnpm dev              # Local Wrangler dev server (wrangler dev)
pnpm start            # Alias for dev
pnpm deploy           # Deploy to Cloudflare (wrangler deploy)
pnpm cf-typegen       # Generate TypeScript types (wrangler types)

# Testing
pnpm test             # Run Vitest tests
pnpm test -- run      # Run tests once (no watch)
pnpm test -- run src/routes/auth.test.ts  # Run single test file

# TypeScript
pnpm exec tsc --noEmit  # Type check without emitting
```

### Backend - Root (`/backend/ecommerce-backend`)

```bash
# Database migrations (using Drizzle)
pnpm db:generate      # Generate migration from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio

# Note: No test script configured at root level
```

---

## Code Style Guidelines

### General Principles

1. **Concise responses** - Answer directly, avoid unnecessary preamble
2. **Fewer than 4 lines** unless user explicitly asks for detail
3. **One word answers** are best when sufficient
4. **No introductions/conclusions** unless requested
5. **No emoji** unless user explicitly requests it

### JavaScript/TypeScript Conventions

#### Imports

```javascript
// Vue/Vite - use @ alias (configured as src/)
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

// Relative imports for siblings
import { formatPrice } from "../utils/format";

// Backend worker imports
import { getDb } from "../utils/db";
import { generateToken } from "../utils/jwks";
```

#### File Naming

- **Vue components**: PascalCase (`AuthModal.vue`, `ProductCard.vue`)
- **JavaScript files**: camelCase (`api.js`, `authStore.js`, `shopApi.js`)
- **TypeScript files**: camelCase (`.ts` extension)
- **Directories**: lowercase (`/stores`, `/components/shop`)

#### Vue Component Structure

```vue
<template>
  <!-- Template first -->
  <div>...</div>
</template>

<script setup>
import { ref, computed } from 'vue'
// Props, emits
const props = defineProps({})
const emit = defineEmits(['event'])

// Composition API - refs at top
const isOpen = ref(false)
const items = ref([])

// Computed
const filteredItems = computed(() => ...)

// Functions
function handleClick() { ... }

// Lifecycle
onMounted(() => { ... })
</script>

<style scoped>
/* Scoped CSS using Tailwind preferred */
</style>
```

#### Pinia Store Structure

```javascript
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/lib/api";

export const useAuthStore = defineStore("auth", () => {
  // State - use ref()
  const user = ref(null);
  const isLoading = ref(false);

  // Getters - use computed()
  const isAuthenticated = computed(() => !!user.value);

  // Actions - functions
  async function login(credentials) {
    // ...
  }

  return { user, isLoading, isAuthenticated, login };
});
```

#### TypeScript Usage

- **Use explicit types** for function parameters and return types in worker code
- **Use `any` sparingly** - prefer specific types or interfaces
- **Run `pnpm cf-typegen`** after changing wrangler.jsonc bindings

```typescript
// Good
interface User {
  id: string
  email: string
  role: string
}

export async function getUser(id: string): Promise<User> { ... }

// Acceptable for quick prototypes
const data = request.json() as any
```

### Error Handling

```javascript
// Frontend - simple error handling
try {
  const response = await api.getCurrentUser()
  user.value = response.user
} catch (err) {
  console.error('Auth init error:', err)
  api.setToken(null)
}

// Backend Worker - proper error responses
import { error } from 'itty-router'

if (!user) {
  return error(401, { message: 'Invalid credentials' })
}

return { success: true, data: ... }
```

### Naming Conventions

| Type        | Convention       | Example                           |
| ----------- | ---------------- | --------------------------------- |
| Variables   | camelCase        | `isLoading`, `userId`             |
| Constants   | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`                 |
| Functions   | camelCase        | `formatPrice()`, `getUser()`      |
| Components  | PascalCase       | `AuthModal`, `ProductCard`        |
| CSS Classes | kebab-case       | `.product-card`, `.btn-primary`   |
| Files       | kebab-case       | `auth-modal.vue`, `api-client.js` |

### CSS/Tailwind

- **Prefer Tailwind** over custom CSS where possible
- **Use `scoped`** in Vue components for component-specific styles
- **Keep custom CSS minimal** - only when Tailwind can't handle it

---

## Architecture Notes

### Authentication Flow

- Access tokens stored in localStorage (`spacefurnio_token`)
- Refresh tokens in httpOnly cookies (sent automatically)
- JWT uses RS256 asymmetric signing (see `docs/guides/05-AUTH-AND-JWT-GUIDE.md`)
- User ID stored in JWT `sub` claim

### Database

- Neon PostgreSQL with Drizzle ORM
- Two databases: Main (users, orders) and Catalog (products)
- RLS policies use JWT `sub` claim for user isolation
- See `backend/ecommerce-backend/docs/` for schema and setup

### Cloudflare Workers

- Use `itty-router` for routing
- Use `jose` library for JWT operations
- All secrets stored as Worker secrets (not in code)
- Key files: `src/routes/auth.ts`, `src/utils/jwks.ts`, `src/middleware/auth.ts`

### Neon Data API

- **Always use Neon Data API** for cart/wishlist queries (not Worker proxy endpoints)
- To reconfigure Data API auth: use `neon_provision_neon_data_api` MCP tool with `authProvider: "external"` and `jwksUrl` pointing to Worker's JWKS endpoint
- **IMPORTANT:** RLS policies must use `auth.user_id()` function (NOT `current_setting`) to extract user ID from JWT
- Example RLS policy:
  ```sql
  CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());
  ```

---

## Important Notes

1. **Never commit secrets** - keys, tokens, credentials go in Worker secrets or .env
2. **Check existing docs** before implementing new features
3. **Run type checks** (`tsc --noEmit`) before committing worker code
4. **Run lint** before committing frontend code
