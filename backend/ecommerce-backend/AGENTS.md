# Backend & Database Agent Guidelines

Rules and protocols for backend services, database migrations, and CMS lifecycle management in `backend/ecommerce-backend/`.

## Context Pointers

- **CMS Architecture & Lifecycle**: Read `docs/CMS-ARCHITECTURE.md` for dual-database rationale, versioning mechanics, and SSG staging flow.
- **API Endpoint Reference**: Read `docs/API-DOCS.md` for request/response payloads, authentication scopes, and error standards.
- **Database Schema Reference**: Read `docs/reference/SCHEMA-REFERENCE.md` and `db/schema/` for table declarations.

## CMS Database Isolation

Isolate CMS persistence strictly within the Primary Operational Database.

- **Primary Database Scope**: Maintain all CMS tables (`cms_pages`, `cms_sections`, `cms_policies`, `cms_versions`, `cms_build_events`) exclusively in `DATABASE_URL`.
- **Catalog Database Boundary**: Keep `PRODUCTS_DATABASE_URL` dedicated to product catalog records, taxonomies, variants, and inventory. Never create CMS content or audit tables in the Catalog Database.
- **Relational Integrity**: Anchor CMS audit logs (`cms_versions.author_id`, `cms_build_events.triggered_by`) to foreign keys on the `users` table in `DATABASE_URL`.

## New Page Schema Protocol

When adding a new content page, register initial schema entries in `db/seed-cms.ts` using idempotent operations:

1. **Page Registration**: Add page entry to `PAGES` array (`slug`, `title`, `seoMetadata`).
2. **Section Definitions**: Add section entries to `SECTIONS` array (`id`, `pageSlug`, `sectionKey`, `sortOrder`, `data`) with identical `draft_data` and `published_data` defaults.
3. **Policy Documents**: For legal, compliance, or terms pages, add a markdown entry to `POLICIES` array (`slug`, `title`, `content`).
4. **Idempotent Upsert**: Ensure every insert specifies `.onConflictDoUpdate(...)` targeting unique constraints (`cmsPages.slug`, `cmsSections.id`, `cmsPolicies.slug`).

## Staging & Deploy Hook Invariants

Enforce draft staging isolation and controlled production build triggers.

- **Draft Mutation Flag**: Set `has_unpublished_changes = true` on `cms_pages` whenever modifying `cms_sections.draft_data`. Never mutate `published_data` during draft edits.
- **Atomic Publication**: Promote `draft_data` to `published_data` exclusively through `POST /api/admin/cms/publish-and-build`. Publication atomically clears dirty flags (`has_unpublished_changes = false`) and writes a snapshot to `cms_versions`.
- **Deploy Hook Scheduling**: Dispatch storefront rebuilds exclusively via `ctx.waitUntil(fetch(webhookUrl))` using background execution in the Worker runtime.
- **Cooldown Enforcement**: Enforce a strict 60-second cooldown window between deploy hook dispatches via `cms_build_events` timestamp queries. Return HTTP 429 when a build is requested within the active cooldown period.

## Completion Checklist for Backend CMS Changes

Before completing CMS-related backend or database modifications:

1. **Schema Check**: Verify migrations in `db/schema/cms.ts` and generate migrations via `pnpm db:generate`.
2. **Idempotent Seeding**: Verify `pnpm exec tsx db/seed-cms.ts` executes idempotently without duplicate key errors.
3. **Endpoint Permissions**: Verify Worker routes enforce administrative scopes (`cms.read`, `cms.write`, `cms.publish`) defined in `src/utils/permissions.ts`.
4. **Type Check**: Execute `pnpm exec tsc --noEmit` inside `server-worker/` with zero type errors.
