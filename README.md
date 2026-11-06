# Spacefurnio

## Purpose

Spacefurnio is an open-source furniture catalog web app and minimalist eCommerce storefront for modern interior design collections. The application provides a Vue TypeScript interior catalog with real-time attribute filtering, persistent shopping carts, guest wishlists, and order processing. The platform combines a customer store, an administrative management dashboard, and serverless edge APIs.

- **Interactive catalog browsing.** Customers filter items by space, room, category, color, material, and price range.
- **Cart and wishlist synchronization.** The store persists cart items in browser storage for guests and syncs items to database tables upon user login.
- **Direct database queries.** The client reads public catalog data directly from Neon PostgreSQL through the Neon Data API over HTTP.
- **Admin operations suite.** Store managers oversee orders, update inventory items, create promotional coupon codes, and review customer records from the `/admin` portal.
- **Pre-rendering and media delivery.** Playwright pre-renders static HTML for critical store routes at build time, and Sharp converts product imagery into WebP format.
- **Role-based security.** PostgreSQL Row-Level Security policies restrict user data access, while Cloudflare Workers handle checkout and administration actions using RS256 JSON Web Tokens.

## Architecture

Spacefurnio uses a decoupled monorepo architecture divided into frontend applications, edge worker services, and dual relational databases.

### Frontend

The frontend application in `frontend/` runs on Vue 3 and Vite 7.
- **UI library and styling.** Tailwind CSS v4 provides utility styling alongside PrimeVue 4 components and custom CSS in `src/assets/`.
- **State stores.** Pinia stores in `src/stores/` manage authentication, shopping carts, and wishlist collections.
- **Routing.** Vue Router manages customer routes, legacy URL redirects, and protected admin routes under `/admin`.
- **Viewport scrolling.** The home view applies snap scrolling through `src/utills/customScroll.js` without external scrolling dependencies.
- **Static generation.** `scripts/prerender.js` uses Playwright to generate static HTML snapshots for customer routes during production builds.

### Backend worker

The API service in `backend/ecommerce-backend/server-worker/` runs on Cloudflare Workers.
- **Router.** Itty-router dispatches incoming HTTP requests to domain route handlers.
- **Authentication.** The worker verifies and signs RS256 JSON Web Tokens using `jose`. It stores access tokens in local storage and refresh tokens in secure cookies.
- **Sensitive transactions.** Order placement, checkout calculations, status transitions, and coupon validations execute inside the worker.
- **Transactional emails.** Resend sends transactional order and notification emails.

### Database

Data storage runs on two independent Neon PostgreSQL databases.
- **Catalog database.** Holds products, categories, brands, styles, rooms, and materials. The frontend queries this database directly through the Neon serverless driver.
- **Main database.** Holds user profiles, addresses, carts, wishlists, and orders. PostgreSQL Row-Level Security policies isolate records by user ID.
- **ORM and migrations.** Drizzle ORM manages table schemas and migration files in `backend/ecommerce-backend/db/`.

## Setup

### Prerequisites

Install Node.js 20 or higher and pnpm 9 or higher on your local system.

### Installation

Clone the repository and install dependencies in the root, frontend, and backend directories:

```bash
git clone https://github.com/devsanthoshmk/spacefurnio.git
cd spacefurnio

# Install root dependencies
pnpm install

# Install frontend dependencies
cd frontend
pnpm install
cd ..

# Install backend dependencies
cd backend/ecommerce-backend
pnpm install
cd server-worker
pnpm install
cd ../../..
```

## Usage

Run commands with pnpm from the repository root or within specific workspace folders.

### Frontend development

Start the Vite development server on local port 5173:

```bash
cd frontend
pnpm dev
```

Build the frontend for production with static pre-rendering:

```bash
cd frontend
pnpm build
```

Run code formatting and ESLint checks:

```bash
cd frontend
pnpm lint
pnpm format
```

Optimize product images to WebP format:

```bash
cd frontend
pnpm optimize:images
```

### Backend worker development

Start the local Cloudflare Worker development environment:

```bash
cd backend/ecommerce-backend/server-worker
pnpm dev
```

Run the worker test suite with Vitest:

```bash
cd backend/ecommerce-backend/server-worker
pnpm test
```

Deploy the worker to Cloudflare:

```bash
cd backend/ecommerce-backend/server-worker
pnpm deploy
```

### Database management

Generate and apply database migrations with Drizzle:

```bash
cd backend/ecommerce-backend

# Generate migrations from schema files
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Open Drizzle Studio database viewer
pnpm db:studio
```

## Configuration

### Frontend environment variables

Create a `.env` file inside `frontend/` with the following variables:

```env
VITE_WORKER_URL="https://backend.spacefurnio.workers.dev"
VITE_PRODUCTS_DB_URL="postgresql://user:password@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
VITE_GUEST_JWT="your_guest_jwt_token_here"
VITE_NEON_URL="https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1"
VITE_CATALOG_URL="https://ep-flat-brook-a1h1dgii.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1"
```

The `VITE_GUEST_JWT` token is optional. When provided, it must match the project associated with `VITE_PRODUCTS_DB_URL`.

### Backend worker environment variables

Configure Cloudflare Worker secrets in `backend/ecommerce-backend/server-worker/` with Wrangler:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put PRODUCTS_DATABASE_URL
npx wrangler secret put RSA_PRIVATE_KEY_PEM
npx wrangler secret put RSA_PUBLIC_KEY_PEM
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
```

| Variable | Description |
| --- | --- |
| DATABASE_URL | Neon PostgreSQL connection string for user and order data |
| PRODUCTS_DATABASE_URL | Neon PostgreSQL connection string for catalog products |
| RSA_PRIVATE_KEY_PEM | RSA private key used to sign RS256 JWT tokens |
| RSA_PUBLIC_KEY_PEM | RSA public key used to verify user tokens |
| JWT_SECRET | Symmetric secret for internal worker session signing |
| RESEND_API_KEY | API key for the Resend transactional email service |
