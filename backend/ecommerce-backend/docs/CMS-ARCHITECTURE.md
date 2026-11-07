# Spacefurnio CMS Architecture & SSG Staging Reference

This document provides the technical architecture, data model, permission matrix, build orchestration, and operational procedures for the Spacefurnio Content Management System (CMS).

---

## 1. Architectural Model

The Spacefurnio CMS implements a Static Site Generation (SSG) Staging pattern. This architecture decouples content drafting from production storefront delivery, ensuring high availability, zero latency penalty for storefront visitors, and total control over publication timing.

```
+---------------------------------------------------------------------------------------------------+
|                                       CONTENT EDITING FLOW                                        |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [Admin UI / API Client]                                                                          |
|            |                                                                                      |
|            | 1. PUT /api/admin/cms/pages/:slug/sections/:id                                       |
|            |    PUT /api/admin/cms/policies/:slug                                                 |
|            v                                                                                      |
|  +---------------------------------------+      +----------------------------------------------+  |
|  | Draft Storage                         |      | Version Snapshotting                         |  |
|  | - cms_sections.draft_data             | ---> | - cms_versions table                         |  |
|  | - cms_policies.draft_content          |      | - 30-second deduplication window             |  |
|  | - has_unpublished_changes = true      |      | - Full state capture for rollbacks           |  |
|  +---------------------------------------+      +----------------------------------------------+  |
|            |                                                                                      |
|            | 2. POST /api/admin/cms/publish-and-build ("Update Site" Action)                      |
|            v                                                                                      |
|  +---------------------------------------------------------------------------------------------+  |
|  | Atomic Publication                                                                          |  |
|  | - UPDATE cms_sections SET published_data = draft_data                                       |  |
|  | - UPDATE cms_policies SET published_content = draft_content, version_num = version_num + 1   |  |
|  | - UPDATE cms_pages SET status = 'published', has_unpublished_changes = false                |  |
|  | - INSERT publication baseline record into cms_versions                                      |  |
|  +---------------------------------------------------------------------------------------------+  |
|            |                                                                                      |
|            | 3. Dispatch Build Hook (60-second cooldown check)                                    |
|            v                                                                                      |
|  +---------------------------------------+      +----------------------------------------------+  |
|  | Cloudflare Worker Runtime             |      | SSG Prerender Pipeline                       |  |
|  | - Record cms_build_events row         | ---> | - frontend/scripts/prerender.js              |  |
|  | - Mask secret webhook URL             |      | - GET /api/cms/bundle                        |  |
|  | - ctx.waitUntil(fetch(webhookUrl))    |      | - Headless Chromium renders marketing routes |  |
|  +---------------------------------------+      +----------------------------------------------+  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

### 1.1 Draft vs. Published Separation
Content editors require the ability to refine layouts, copy, and legal policies iteratively without impacting live storefront visitors. The data model enforces physical column-level separation:
- `draft_data` and `draft_content`: Active editing working tree. Modifying draft data does not affect live traffic.
- `published_data` and `published_content`: Immutable live snapshot served to storefront visitors and consumed by the prerendering pipeline.
- `has_unpublished_changes`: Dirty state flag on `cms_pages` and `cms_policies`. Indicates when working drafts differ from live published assets.

### 1.2 "Update Site" Composite Trigger
The "Update Site" button in the admin interface calls `POST /api/admin/cms/publish-and-build`. This executes two operations:
1. **Atomic Promotion:** Copies all `draft_data` into `published_data` for sections and `draft_content` into `published_content` for policies, resetting dirty state flags.
2. **Build Webhook Dispatch:** Triggers the Cloudflare Pages deploy hook in the background via `ctx.waitUntil`, generating a new static build.

---

## 2. Dual-Database Separation

Spacefurnio maintains strict separation between its Catalog Database and Operational/Primary Database.

```
+---------------------------------------+        +-----------------------------------------------+
|         Catalog Database              |        |         Operational / Primary Database        |
|      (PRODUCTS_DATABASE_URL)          |        |                 (DATABASE_URL)                |
+---------------------------------------+        +-----------------------------------------------+
| - products                            |        | - users & user_roles                          |
| - categories                          |        | - admin_invitations                           |
| - brands, spaces, styles, rooms       |        | - password_resets                             |
| - materials, colors                   |        | - orders & order_items                        |
| - product_images                      |        | - order_shipments & order_payments            |
| - product_colors                      |        | - customer_addresses                          |
|                                       |        | - reviews & coupons                           |
| High-concurrency read queries via     |        | - contact_messages & subscribers              |
| Neon Data API & Worker catalog routes |        | - cms_pages                                   |
|                                       |        | - cms_sections                                |
|                                       |        | - cms_policies                                |
|                                       |        | - cms_versions                                |
|                                       |        | - cms_build_events                            |
+---------------------------------------+        +-----------------------------------------------+
```

### 2.1 Catalog Database (`PRODUCTS_DATABASE_URL`)
- **Scope:** Furniture catalog records, taxonomies, variant relationships, and image assets.
- **Access Pattern:** Read-optimized. Storefront views consume catalog data directly via the Neon Data API with client-side JWTs or via cached Worker read endpoints.
- **Isolation:** Changes to product attributes do not trigger static site rebuilds; storefront product pages (`/shop`, `/shop/product/*`) render dynamically via Client-Side Rendering (CSR).

### 2.2 Operational / Primary Database (`DATABASE_URL`)
- **Scope:** Sensitive transactional data and CMS management tables.
- **Why CMS Resides Here:**
  1. **Audit Trails & User Isolation:** Version history (`cms_versions.author_id`) and build triggers (`cms_build_events.triggered_by`) enforce relational foreign keys referencing `users.id`.
  2. **Strict Transactional Consistency:** Publishing site content requires atomic multi-table updates across pages, sections, and policies.
  3. **Schema Isolation:** Decoupled from catalog taxonomy refactoring and product migration scripts.
  4. **Access Control:** CMS editing endpoints require administrative JWT verification (`cms.read`, `cms.write`, `cms.publish`) handled through the Cloudflare Worker backend.

---

## 3. Database Schema Reference

The CMS architecture consists of five core tables defined in `db/schema/cms.ts` and managed via Drizzle ORM.

### 3.1 `cms_pages`
Represents high-level marketing page containers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | Unique page identifier |
| `slug` | `text` | NOT NULL, UNIQUE | URL path identifier (`home`, `about`, `collabs`, `portfolio`, `contact`, `footer`) |
| `title` | `text` | NOT NULL | Human-readable page title |
| `seo_metadata` | `jsonb` | NOT NULL, `DEFAULT '{}'` | Metadata object containing meta titles, descriptions, and OpenGraph properties |
| `status` | `text` | NOT NULL, `DEFAULT 'draft'` | Current publication status (`draft`, `published`) |
| `has_unpublished_changes` | `boolean` | NOT NULL, `DEFAULT false` | Dirty flag set to true when child section drafts are updated |
| `published_at` | `timestamptz` | Nullable | Timestamp of most recent publication |
| `created_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Row creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Row last update timestamp |

### 3.2 `cms_sections`
Modular content blocks linked to specific pages.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `text` | PK | Unique section identifier (e.g., `home-hero`, `about-vision`, `footer-main`) |
| `page_slug` | `text` | NOT NULL, FK -> `cms_pages(slug)` ON DELETE CASCADE | Parent page reference |
| `section_key` | `text` | NOT NULL | Discriminator key for component mapping (`hero`, `features`, `story`, `banner`) |
| `sort_order` | `integer` | NOT NULL, `DEFAULT 0` | Rendering sequence index within the page |
| `enabled` | `boolean` | NOT NULL, `DEFAULT true` | Visibility toggle for storefront display |
| `draft_data` | `jsonb` | NOT NULL, `DEFAULT '{}'` | Working JSON payload containing uncommitted copy, assets, and settings |
| `published_data` | `jsonb` | NOT NULL, `DEFAULT '{}'` | Live JSON payload consumed by public APIs and SSG prerender pipeline |
| `updated_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Timestamp of last draft or publication change |

**Indexes:**
- `cms_sections_page_slug_sort_order_idx` on `(page_slug, sort_order)`

### 3.3 `cms_policies`
Storefront legal and compliance documentation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | Unique policy identifier |
| `slug` | `text` | NOT NULL, UNIQUE | Route slug (`privacy-policy`, `terms`, `shipping-policy`, `returns`) |
| `title` | `text` | NOT NULL | Policy title |
| `draft_content` | `text` | NOT NULL, `DEFAULT ''` | Uncommitted Markdown content |
| `published_content` | `text` | NOT NULL, `DEFAULT ''` | Live Markdown content displayed on storefront |
| `version_num` | `integer` | NOT NULL, `DEFAULT 1` | Monotonically increasing revision counter incremented on publish |
| `has_unpublished_changes` | `boolean` | NOT NULL, `DEFAULT false` | Dirty flag set to true when draft content differs from published content |
| `published_at` | `timestamptz` | Nullable | Timestamp when current published content was activated |
| `updated_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Last update timestamp |

### 3.4 `cms_versions`
Audit snapshots and point-in-time recovery points for content.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `serial` | PK | Auto-incrementing version sequence |
| `scope` | `text` | NOT NULL | Grouping scope (page slug, `policies`, or `publish`) |
| `entity_id` | `text` | NOT NULL | Associated section ID, policy slug, or `all` for baseline snapshots |
| `version_num` | `integer` | NOT NULL | Sequential version number for this entity |
| `snapshot` | `jsonb` | NOT NULL | JSON snapshot of data (`draftData`, `enabled`, `title`, `draftContent`) |
| `change_summary` | `text` | NOT NULL, `DEFAULT ''` | Editor note or system description of the modification |
| `field_path` | `text` | Nullable | Specific JSON path or attribute modified |
| `author_id` | `uuid` | FK -> `users(id)` ON DELETE SET NULL | User who initiated the edit |
| `created_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Timestamp when snapshot was taken |

**Indexes:**
- `cms_versions_scope_created_at_idx` on `(scope, created_at)`

**Deduplication Window:**
When successive edits to the same section or policy occur within 30 seconds of an existing version, the backend updates the current version record rather than appending a redundant row, reducing database bloat.

### 3.5 `cms_build_events`
Audit log and dispatch tracking for storefront rebuild triggers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | Unique build event identifier |
| `trigger_type` | `text` | NOT NULL, `DEFAULT 'publish'` | Trigger method (`manual`, `publish`) |
| `status` | `text` | NOT NULL, `DEFAULT 'pending'` | Dispatch state (`pending`, `triggered`, `success`, `failed`, `skipped_local`) |
| `triggered_by` | `uuid` | FK -> `users(id)` ON DELETE SET NULL | Admin user ID who initiated the build |
| `webhook_url_masked` | `text` | Nullable | Masked destination URL for security auditing |
| `response_code` | `integer` | Nullable | HTTP status code received from deploy webhook |
| `response_body` | `text` | Nullable | Response body returned by deploy webhook (truncated to 1000 characters) |
| `error_message` | `text` | Nullable | System error text if webhook execution failed |
| `started_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Timestamp when build was initiated |
| `completed_at` | `timestamptz` | Nullable | Timestamp when webhook response was recorded |

---

## 4. Permissions & Role-Based Access Control (RBAC)

The CMS enforces fine-grained permissions via the `requirePermission` middleware.

### 4.1 Permission Definitions
- `cms.read`: View site content drafts, published pages, section configurations, and revision history.
- `cms.write`: Edit draft content for storefront pages, sections, and policies. Reorder sections and execute rollbacks.
- `cms.publish`: Publish draft content to the live site and trigger storefront deploy hooks.

### 4.2 Role Matrix

| Role | cms.read | cms.write | cms.publish | Capabilities |
|---|:---:|:---:|:---:|---|
| `super_admin` | Yes | Yes | Yes | Full unrestricted access to read, write, rollback, and publish |
| `store_manager` | Yes | Yes | Yes | Complete management of CMS drafts, policies, and build deployment |
| `catalog_inventory` | Yes | Yes | No | Can edit section drafts and policy copy; cannot publish live or trigger builds |
| `customer_support` | Yes | No | No | Read-only inspection of draft and published content for customer inquiries |
| `sales_fulfillment` | No | No | No | Access blocked (returns 403 Forbidden on all CMS endpoints) |
| `custom` | * | * | * | Assigned explicitly based on granular role settings |

### 4.3 Guard Rule Implementation
Requests to `/api/admin/cms/*` undergo JWT authentication against the RSA-256 public key (`RSA_PUBLIC_KEY_PEM`), verified against the `users` table to confirm the account is active. The `requirePermission` guard checks:
1. If user role is `super_admin`, access is granted unconditionally.
2. Otherwise, user role permissions are checked against the required permission key. Missing permissions result in an immediate `403 Forbidden` response.

---

## 5. Deploy Hook & Build Trigger Pipeline

Storefront regeneration is executed through an asynchronous webhook mechanism designed for Cloudflare Pages.

### 5.1 Configuration
The build hook destination is resolved from Worker environment bindings in the following order:
1. `env.CLOUDFLARE_PAGES_DEPLOY_HOOK`
2. `env.BUILD_WEBHOOK_URL`

### 5.2 Webhook Masking
To prevent secret token leakage in logs and admin inspection views, deploy hook URLs are masked before being written to `cms_build_events`:
- Path components longer than 8 characters are masked to retain only the first and last four characters (e.g., `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abcd...wxyz`).
- Query parameters are stripped completely.

### 5.3 60-Second Cooldown Enforcement
To avoid build queue exhaustion and denial-of-service on build pipelines, the dispatcher verifies recent build history:
- Queries `cms_build_events` for builds where `started_at > NOW() - INTERVAL '60 seconds'` and `status IN ('pending', 'triggered')`.
- If a build exists, the request is rejected with `HTTP 429 Too Many Requests` and a JSON payload detailing `cooldownRemainingSeconds`.

### 5.4 Non-Blocking Background Execution (`ctx.waitUntil`)
Deploy webhook dispatch occurs without delaying HTTP response delivery:
- An initial `cms_build_events` record is inserted with `status = 'pending'`.
- The HTTP response (200 OK) returns immediately to the client.
- The actual HTTP POST to the deploy hook executes asynchronously within Cloudflare's `ctx.waitUntil(doFetch())` lifecycle.
- When the webhook returns, `cms_build_events` is updated with `response_code`, `response_body` (truncated to 1000 characters), and status (`triggered` on HTTP 2xx, `failed` on non-2xx or network errors).

### 5.5 Local / Development Fallback
When running locally or in environments where no webhook URL is configured:
- The build dispatcher records a `cms_build_events` entry with `status = 'skipped_local'`.
- Returns `HTTP 200 OK` with `success: true` and an informational message.
- Prevents development workflows from failing due to missing Cloudflare Pages credentials.

---

## 6. Prerendering SSG Integration

Spacefurnio separates marketing content from dynamic e-commerce functionality through its prerendering pipeline.

```
+---------------------------------------------------------------------------------------------------+
|                                     PRERENDER SSG PIPELINE                                        |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  1. vite build                                                                                    |
|     Outputs standard client SPA bundle to frontend/dist/                                          |
|                                                                                                   |
|  2. node scripts/prerender.js                                                                     |
|     + Launches internal static HTTP server pointing to frontend/dist/                             |
|     + Spawns headless Chromium worker pool (concurrency = min(routes, 6))                         |
|                                                                                                   |
|  3. Worker Route Processing                                                                       |
|     + Navigates to marketing routes: /, /about, /portfolio, /collabs, /contact, /shopping         |
|     + In-browser Vue app fetches live published snapshot from GET /api/cms/bundle                 |
|     + Waits for networkidle and #app DOM hydration                                                |
|     + Extracts fully rendered HTML snapshot                                                       |
|     + Writes static file: dist/<route>/index.html                                                 |
|                                                                                                   |
|  4. Storefront Routes Excluded                                                                    |
|     + /shop and /shop/product/* remain pure dynamic Client-Side Rendered (CSR) routes             |
|     + Ensures dynamic inventory, real-time pricing, and search stay current without rebuilds     |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

### 6.1 Bundle Consumption (`/api/cms/bundle`)
The prerender script and storefront clients retrieve all published content in a single network request:
- Aggregates all `cms_pages`, active `cms_sections`, and active `cms_policies`.
- Strips all draft data, exposing only `publishedData` and `publishedContent`.
- Responses include HTTP caching headers:
  `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400`

---

## 7. Public API Endpoints (`/api/cms/*`)

Public endpoints require no authorization headers. They expose published data only.

### 7.1 Health Check
* **Endpoint:** `GET /api/cms/health`
* **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "module": "cms"
  }
  ```

### 7.2 Full Snapshot Bundle
* **Endpoint:** `GET /api/cms/bundle`
* **Headers:** `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400`
* **Response (200 OK):**
  ```json
  {
    "generatedAt": "2026-11-06T14:30:00.000Z",
    "pages": [
      {
        "id": "e8e60408-724f-4a0b-a320-c75c8be0343a",
        "slug": "home",
        "title": "Home Page",
        "seoMetadata": {
          "title": "Spacefurnio | Modern Furniture",
          "description": "Artisanal furniture crafted for elegant living."
        },
        "status": "published",
        "publishedAt": "2026-11-06T14:00:00.000Z",
        "updatedAt": "2026-11-06T14:00:00.000Z",
        "sections": [
          {
            "id": "home-hero",
            "sectionKey": "hero",
            "sortOrder": 0,
            "data": {
              "headline": "Crafted For Modern Sanctuaries",
              "subheadline": "Architectural furniture made with sustainable timber."
            },
            "publishedData": {
              "headline": "Crafted For Modern Sanctuaries",
              "subheadline": "Architectural furniture made with sustainable timber."
            },
            "updatedAt": "2026-11-06T14:00:00.000Z"
          }
        ]
      }
    ],
    "policies": [
      {
        "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
        "slug": "privacy-policy",
        "title": "Privacy Policy",
        "content": "# Privacy Policy\n\nYour privacy is paramount...",
        "publishedContent": "# Privacy Policy\n\nYour privacy is paramount...",
        "versionNum": 2,
        "publishedAt": "2026-11-06T14:00:00.000Z",
        "updatedAt": "2026-11-06T14:00:00.000Z"
      }
    ]
  }
  ```

### 7.3 Single Published Page
* **Endpoint:** `GET /api/cms/pages/:slug`
* **Response (200 OK):**
  ```json
  {
    "id": "e8e60408-724f-4a0b-a320-c75c8be0343a",
    "slug": "home",
    "title": "Home Page",
    "seoMetadata": {
      "title": "Spacefurnio | Modern Furniture"
    },
    "status": "published",
    "publishedAt": "2026-11-06T14:00:00.000Z",
    "updatedAt": "2026-11-06T14:00:00.000Z",
    "sections": [
      {
        "id": "home-hero",
        "sectionKey": "hero",
        "sortOrder": 0,
        "data": {
          "headline": "Crafted For Modern Sanctuaries"
        },
        "publishedData": {
          "headline": "Crafted For Modern Sanctuaries"
        },
        "updatedAt": "2026-11-06T14:00:00.000Z"
      }
    ]
  }
  ```
* **Error Response (404 Not Found):**
  ```json
  {
    "message": "Page not found"
  }
  ```

### 7.4 List Published Policies
* **Endpoint:** `GET /api/cms/policies`
* **Response (200 OK):**
  ```json
  [
    {
      "slug": "privacy-policy",
      "title": "Privacy Policy",
      "versionNum": 2,
      "publishedAt": "2026-11-06T14:00:00.000Z"
    },
    {
      "slug": "terms",
      "title": "Terms and Conditions",
      "versionNum": 1,
      "publishedAt": "2026-11-06T14:00:00.000Z"
    }
  ]
  ```

### 7.5 Single Published Policy Content
* **Endpoint:** `GET /api/cms/policies/:slug`
* **Response (200 OK):**
  ```json
  {
    "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "content": "# Privacy Policy\n\nYour privacy is paramount...",
    "publishedContent": "# Privacy Policy\n\nYour privacy is paramount...",
    "versionNum": 2,
    "publishedAt": "2026-11-06T14:00:00.000Z",
    "updatedAt": "2026-11-06T14:00:00.000Z"
  }
  ```
* **Error Response (404 Not Found):**
  ```json
  {
    "message": "Policy not found"
  }
  ```

---

## 8. Admin API Endpoints (`/api/admin/cms/*`)

All admin endpoints require an administrative Bearer JWT token in the `Authorization` header.

### 8.1 Summary Overview
* **Endpoint:** `GET /api/admin/cms/summary`
* **Permission:** `cms.read`
* **Response (200 OK):**
  ```json
  {
    "dirtyPagesCount": 1,
    "dirtyPoliciesCount": 0,
    "lastPublishedAt": "2026-11-06T14:00:00.000Z",
    "latestBuild": {
      "id": "c1f7b0b6-7b83-424a-b50a-bc61aa52de44",
      "triggerType": "publish",
      "status": "triggered",
      "triggeredBy": "8cf9a9cb-b286-4e5a-939e-d3a95c91b1d1",
      "webhookUrlMasked": "https://api.cloudflare.com/.../abcd...wxyz",
      "responseCode": 200,
      "responseBody": "{\"success\":true}",
      "errorMessage": null,
      "startedAt": "2026-11-06T14:00:05.000Z",
      "completedAt": "2026-11-06T14:00:08.000Z",
      "triggeredByEmail": "admin@spacefurnio.com"
    }
  }
  ```

### 8.2 List Pages
* **Endpoint:** `GET /api/admin/cms/pages`
* **Permission:** `cms.read`
* **Response (200 OK):**
  ```json
  [
    {
      "id": "e8e60408-724f-4a0b-a320-c75c8be0343a",
      "slug": "home",
      "title": "Home Page",
      "seoMetadata": {},
      "status": "published",
      "hasUnpublishedChanges": true,
      "publishedAt": "2026-11-06T14:00:00.000Z",
      "updatedAt": "2026-11-06T14:15:00.000Z",
      "createdAt": "2026-11-01T10:00:00.000Z",
      "sectionCount": 3,
      "sections": [
        {
          "id": "home-hero",
          "sectionKey": "hero",
          "sortOrder": 0,
          "enabled": true,
          "updatedAt": "2026-11-06T14:15:00.000Z"
        }
      ]
    }
  ]
  ```

### 8.3 Get Full Page Detail
* **Endpoint:** `GET /api/admin/cms/pages/:slug`
* **Permission:** `cms.read`
* **Response (200 OK):**
  ```json
  {
    "id": "e8e60408-724f-4a0b-a320-c75c8be0343a",
    "slug": "home",
    "title": "Home Page",
    "seoMetadata": {},
    "status": "published",
    "hasUnpublishedChanges": true,
    "publishedAt": "2026-11-06T14:00:00.000Z",
    "updatedAt": "2026-11-06T14:15:00.000Z",
    "createdAt": "2026-11-01T10:00:00.000Z",
    "sections": [
      {
        "id": "home-hero",
        "pageSlug": "home",
        "sectionKey": "hero",
        "sortOrder": 0,
        "enabled": true,
        "draftData": {
          "headline": "Draft Hero Headline (Unpublished)"
        },
        "publishedData": {
          "headline": "Published Hero Headline"
        },
        "updatedAt": "2026-11-06T14:15:00.000Z"
      }
    ]
  }
  ```

### 8.4 Update Section Draft
* **Endpoint:** `PUT /api/admin/cms/pages/:slug/sections/:id`
* **Permission:** `cms.write`
* **Body:**
  ```json
  {
    "draftData": {
      "headline": "Updated New Collection Headline",
      "ctaText": "Explore Catalog"
    },
    "enabled": true,
    "changeSummary": "Updated hero banner CTA"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "section": {
      "id": "home-hero",
      "pageSlug": "home",
      "sectionKey": "hero",
      "sortOrder": 0,
      "enabled": true,
      "draftData": {
        "headline": "Updated New Collection Headline",
        "ctaText": "Explore Catalog"
      },
      "publishedData": {
        "headline": "Published Hero Headline"
      },
      "updatedAt": "2026-11-06T14:20:00.000Z"
    }
  }
  ```

### 8.5 Reorder Sections
* **Endpoint:** `POST /api/admin/cms/pages/:slug/sections/reorder`
* **Permission:** `cms.write`
* **Body:**
  ```json
  {
    "orders": [
      { "id": "home-features", "sortOrder": 0 },
      { "id": "home-hero", "sortOrder": 1 }
    ]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Sections reordered successfully"
  }
  ```

### 8.6 List Policies (Admin)
* **Endpoint:** `GET /api/admin/cms/policies`
* **Permission:** `cms.read`
* **Response (200 OK):**
  ```json
  [
    {
      "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
      "slug": "privacy-policy",
      "title": "Privacy Policy",
      "draftContent": "# Privacy Policy\n\nDraft revisions...",
      "publishedContent": "# Privacy Policy\n\nLive content...",
      "versionNum": 2,
      "hasUnpublishedChanges": true,
      "publishedAt": "2026-11-06T14:00:00.000Z",
      "updatedAt": "2026-11-06T14:25:00.000Z"
    }
  ]
  ```

### 8.7 Get Single Policy (Admin)
* **Endpoint:** `GET /api/admin/cms/policies/:slug`
* **Permission:** `cms.read`
* **Response (200 OK):**
  ```json
  {
    "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "draftContent": "# Privacy Policy\n\nDraft revisions...",
    "publishedContent": "# Privacy Policy\n\nLive content...",
    "versionNum": 2,
    "hasUnpublishedChanges": true,
    "publishedAt": "2026-11-06T14:00:00.000Z",
    "updatedAt": "2026-11-06T14:25:00.000Z"
  }
  ```

### 8.8 Create Policy
* **Endpoint:** `POST /api/admin/cms/policies`
* **Permission:** `cms.write`
* **Body:**
  ```json
  {
    "slug": "warranty-policy",
    "title": "Limited Lifetime Warranty",
    "draftContent": "# Warranty Policy\n\nSpacefurnio covers structural frame defects for 10 years."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "policy": {
      "id": "97e64432-8df7-463e-a1d2-0fb3db092289",
      "slug": "warranty-policy",
      "title": "Limited Lifetime Warranty",
      "draftContent": "# Warranty Policy\n\nSpacefurnio covers structural frame defects for 10 years.",
      "publishedContent": "",
      "versionNum": 1,
      "hasUnpublishedChanges": true,
      "publishedAt": null,
      "updatedAt": "2026-11-06T14:30:00.000Z"
    }
  }
  ```

### 8.9 Update Policy Draft
* **Endpoint:** `PUT /api/admin/cms/policies/:slug`
* **Permission:** `cms.write`
* **Body:**
  ```json
  {
    "title": "Updated Warranty Terms",
    "draftContent": "# Warranty Policy\n\nUpdated coverage terms.",
    "changeSummary": "Updated frame coverage definitions"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "policy": {
      "id": "97e64432-8df7-463e-a1d2-0fb3db092289",
      "slug": "warranty-policy",
      "title": "Updated Warranty Terms",
      "draftContent": "# Warranty Policy\n\nUpdated coverage terms.",
      "publishedContent": "",
      "versionNum": 1,
      "hasUnpublishedChanges": true,
      "publishedAt": null,
      "updatedAt": "2026-11-06T14:32:00.000Z"
    }
  }
  ```

### 8.10 Delete Policy
* **Endpoint:** `DELETE /api/admin/cms/policies/:slug`
* **Permission:** `cms.write`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Policy deleted successfully"
  }
  ```

### 8.11 Get Version Snapshots
* **Endpoint:** `GET /api/admin/cms/versions?scope=home&entityId=home-hero`
* **Permission:** `cms.read`
* **Query Parameters:** `scope` (optional), `entityId` (optional). Limit capped at 50 records.
* **Response (200 OK):**
  ```json
  [
    {
      "id": 142,
      "scope": "home",
      "entityId": "home-hero",
      "versionNum": 4,
      "snapshot": {
        "draftData": { "headline": "Previous Headline Draft" },
        "enabled": true,
        "sectionKey": "hero",
        "sortOrder": 0
      },
      "changeSummary": "Updated hero banner CTA",
      "fieldPath": null,
      "authorId": "8cf9a9cb-b286-4e5a-939e-d3a95c91b1d1",
      "authorEmail": "admin@spacefurnio.com",
      "createdAt": "2026-11-06T14:20:00.000Z"
    }
  ]
  ```

### 8.12 Rollback Version
* **Endpoint:** `POST /api/admin/cms/versions/:id/rollback`
* **Permission:** `cms.write`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Section rolled back to version #4",
    "section": {
      "id": "home-hero",
      "pageSlug": "home",
      "sectionKey": "hero",
      "sortOrder": 0,
      "enabled": true,
      "draftData": {
        "headline": "Previous Headline Draft"
      },
      "publishedData": {
        "headline": "Published Hero Headline"
      },
      "updatedAt": "2026-11-06T14:35:00.000Z"
    }
  }
  ```

### 8.13 Publish All Drafts
* **Endpoint:** `POST /api/admin/cms/publish`
* **Permission:** `cms.publish`
* **Description:** Atomically copies `draft_data` to `published_data` for all sections, and `draft_content` to `published_content` for all policies. Clears `has_unpublished_changes` across all pages and policies.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "publishedAt": "2026-11-06T14:40:00.000Z",
    "message": "All storefront content published successfully"
  }
  ```

### 8.14 Trigger Storefront Build
* **Endpoint:** `POST /api/admin/cms/build`
* **Permission:** `cms.publish`
* **Description:** Dispatches deploy hook request with 60-second cooldown enforcement.
* **Response (200 OK - Production Hook):**
  ```json
  {
    "success": true,
    "status": "pending",
    "message": "Storefront build deploy hook triggered successfully",
    "buildEvent": {
      "id": "2dafb51a-7b3c-41c3-8f08-b80c10b1062b",
      "triggerType": "manual",
      "status": "pending",
      "webhookUrlMasked": "https://api.cloudflare.com/.../abcd...wxyz",
      "startedAt": "2026-11-06T14:41:00.000Z"
    }
  }
  ```
* **Response (200 OK - Local Fallback):**
  ```json
  {
    "success": true,
    "status": "skipped_local",
    "message": "No deploy hook configured in environment. Build dispatch skipped in local/dev environment.",
    "buildEvent": {
      "id": "2dafb51a-7b3c-41c3-8f08-b80c10b1062b",
      "triggerType": "manual",
      "status": "skipped_local",
      "webhookUrlMasked": null,
      "startedAt": "2026-11-06T14:41:00.000Z",
      "completedAt": "2026-11-06T14:41:00.000Z",
      "errorMessage": "No deploy hook configured in environment bindings (CLOUDFLARE_PAGES_DEPLOY_HOOK or BUILD_WEBHOOK_URL)"
    }
  }
  ```
* **Error Response (429 Too Many Requests):**
  ```json
  {
    "message": "A storefront build was triggered less than 60 seconds ago. Please wait before triggering another build.",
    "cooldownRemainingSeconds": 42
  }
  ```

### 8.15 Publish and Build ("Update Site")
* **Endpoint:** `POST /api/admin/cms/publish-and-build`
* **Permission:** `cms.publish`
* **Description:** Composite action combining atomic publication of all drafts followed immediately by deploy hook dispatch.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "published": true,
    "publishedAt": "2026-11-06T14:45:00.000Z",
    "build": {
      "success": true,
      "status": "pending",
      "message": "Storefront build deploy hook triggered successfully",
      "buildEvent": {
        "id": "8bb38054-ca7d-4185-9989-1306c5905d54",
        "triggerType": "publish",
        "status": "pending",
        "webhookUrlMasked": "https://api.cloudflare.com/.../abcd...wxyz",
        "startedAt": "2026-11-06T14:45:00.000Z"
      }
    }
  }
  ```

### 8.16 List Build Events
* **Endpoint:** `GET /api/admin/cms/build-events`
* **Permission:** `cms.read`
* **Description:** Returns the 20 most recent build events with initiator information.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "8bb38054-ca7d-4185-9989-1306c5905d54",
      "triggerType": "publish",
      "status": "triggered",
      "triggeredBy": "8cf9a9cb-b286-4e5a-939e-d3a95c91b1d1",
      "webhookUrlMasked": "https://api.cloudflare.com/.../abcd...wxyz",
      "responseCode": 200,
      "responseBody": "{\"job_id\":\"pages-build-12345\"}",
      "errorMessage": null,
      "startedAt": "2026-11-06T14:45:00.000Z",
      "completedAt": "2026-11-06T14:45:03.000Z",
      "triggeredByEmail": "admin@spacefurnio.com"
    }
  ]
  ```

---

## 9. Seeding & Migration Guide

### 9.1 Database Migrations
CMS schema tables are generated using Drizzle Kit and executed against the primary database.

```bash
# Directory: backend/ecommerce-backend/

# 1. Generate new migration files after modifying db/schema/cms.ts
pnpm db:generate

# 2. Apply pending migrations using the privileged migration runner
pnpm db:migrate

# 3. Direct schema push for isolated development branches
pnpm db:push
```

### 9.2 Initial Seeding Script
A turnkey TypeScript seeding script is provided in `db/seed-cms.ts` to populate all baseline marketing pages, default sections, and published policies.

```bash
# Execute CMS database seeding via Drizzle ORM
cd backend/ecommerce-backend
pnpm db:seed:cms
```

Alternatively, to seed baseline pages, default sections, and standard policy documents directly via SQL:

```sql
-- 1. Insert Standard CMS Pages
INSERT INTO cms_pages (slug, title, seo_metadata, status, has_unpublished_changes)
VALUES
  ('home', 'Home', '{"title": "Spacefurnio | Artisanal Modern Furniture"}'::jsonb, 'published', false),
  ('about', 'About Us', '{"title": "Our Story | Spacefurnio"}'::jsonb, 'published', false),
  ('collabs', 'Collaborations', '{"title": "Designer Collabs | Spacefurnio"}'::jsonb, 'published', false),
  ('portfolio', 'Portfolio', '{"title": "Interior Projects | Spacefurnio"}'::jsonb, 'published', false),
  ('contact', 'Contact Us', '{"title": "Get in Touch | Spacefurnio"}'::jsonb, 'published', false),
  ('footer', 'Site Footer', '{}'::jsonb, 'published', false)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Baseline Sections
INSERT INTO cms_sections (id, page_slug, section_key, sort_order, enabled, draft_data, published_data)
VALUES
  ('home-hero', 'home', 'hero', 0, true, 
   '{"headline": "Handcrafted for Timeless Spaces", "cta": "Discover Collection"}'::jsonb,
   '{"headline": "Handcrafted for Timeless Spaces", "cta": "Discover Collection"}'::jsonb),
  ('home-featured', 'home', 'featured', 1, true,
   '{"title": "Curated Essentials", "subtitle": "Our most celebrated architectural furniture pieces."}'::jsonb,
   '{"title": "Curated Essentials", "subtitle": "Our most celebrated architectural furniture pieces."}'::jsonb),
  ('about-story', 'about', 'story', 0, true,
   '{"heading": "Our Heritage", "body": "Born out of an obsession with timeless joinery and ethical sourcing."}'::jsonb,
   '{"heading": "Our Heritage", "body": "Born out of an obsession with timeless joinery and ethical sourcing."}'::jsonb),
  ('footer-main', 'footer', 'main', 0, true,
   '{"copyright": "2026 Spacefurnio Studio Inc. All rights reserved.", "contactEmail": "concierge@spacefurnio.com"}'::jsonb,
   '{"copyright": "2026 Spacefurnio Studio Inc. All rights reserved.", "contactEmail": "concierge@spacefurnio.com"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Standard Policies
INSERT INTO cms_policies (slug, title, draft_content, published_content, version_num, has_unpublished_changes, published_at)
VALUES
  ('privacy-policy', 'Privacy Policy', 
   '# Privacy Policy\n\nSpacefurnio respects your privacy and is committed to protecting your personal data.', 
   '# Privacy Policy\n\nSpacefurnio respects your privacy and is committed to protecting your personal data.', 
   1, false, NOW()),
  ('terms', 'Terms and Conditions', 
   '# Terms of Service\n\nWelcome to Spacefurnio. By accessing our services, you agree to these terms.', 
   '# Terms of Service\n\nWelcome to Spacefurnio. By accessing our services, you agree to these terms.', 
   1, false, NOW()),
  ('shipping-policy', 'Shipping and Delivery Policy', 
   '# White-Glove Shipping\n\nWe provide nationwide white-glove delivery, in-room placement, and packaging removal.', 
   '# White-Glove Shipping\n\nWe provide nationwide white-glove delivery, in-room placement, and packaging removal.', 
   1, false, NOW()),
  ('returns', 'Returns and Exchanges', 
   '# 30-Day In-Home Trial\n\nExperience our furniture in your space for 30 days. Contact concierge for return pickups.', 
   '# 30-Day In-Home Trial\n\nExperience our furniture in your space for 30 days. Contact concierge for return pickups.', 
   1, false, NOW())
ON CONFLICT (slug) DO NOTHING;
```

### 9.3 Environment Variables & Secret Configuration
Configure the following environment variables in `.dev.vars` (for local development) and Cloudflare Worker secrets (for production):

| Variable | Scope | Secret | Description |
|---|---|---|---|
| `DATABASE_URL` | Worker Runtime | Yes | PostgreSQL connection string for primary database (`neondb_owner` role) |
| `CLOUDFLARE_PAGES_DEPLOY_HOOK` | Worker Runtime | Yes | Webhook URL provided by Cloudflare Pages to trigger site rebuilds |
| `BUILD_WEBHOOK_URL` | Worker Runtime | Yes | Optional fallback webhook URL for external CI/CD pipelines |
| `RSA_PUBLIC_KEY_PEM` | Worker Runtime | No | Public RSA-256 certificate for verifying admin JWT tokens |

```bash
# Upload production secrets via Wrangler CLI
cd backend/ecommerce-backend/server-worker
pnpx wrangler secret put DATABASE_URL
pnpx wrangler secret put CLOUDFLARE_PAGES_DEPLOY_HOOK
```
