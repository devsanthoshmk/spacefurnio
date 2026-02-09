# Spacefurnio Backend API Documentation

## Overview

The Spacefurnio backend is built on **Cloudflare Workers** with **Neon PostgreSQL** database using Row-Level Security (RLS) for secure, cost-effective direct database access.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vue.js 3       │────▶│  Cloudflare     │────▶│  Neon           │
│  Frontend       │     │  Workers API    │     │  PostgreSQL     │
│  (Pages)        │     │  (Edge)         │     │  (Serverless)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      ▼
         │              ┌─────────────────┐
         │              │  Cloudflare KV  │
         │              │  - Rate Limits  │
         │              │  - Session      │
         │              │    Revocation   │
         │              └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Razorpay       │
│  (Payments)     │
└─────────────────┘
```

## Tech Stack

| Component       | Technology                   |
| --------------- | ---------------------------- |
| Backend Runtime | Cloudflare Workers           |
| Database        | Neon PostgreSQL (Serverless) |
| ORM/Driver      | @neondatabase/serverless     |
| Router          | itty-router v4.x             |
| Auth            | JWT (jose library)           |
| OAuth           | Google OAuth 2.0             |
| Magic Links     | MailChannels                 |
| Payments        | Razorpay                     |
| Rate Limiting   | Cloudflare KV                |
| Session Revoke  | Cloudflare KV (EXPIRED_SESSIONS) |
| Frontend        | Vue.js 3 + Pinia             |

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main entry, router setup
│   ├── middleware/
│   │   ├── auth.js           # JWT verification, auth middlewares
│   │   ├── cors.js           # CORS handling
│   │   ├── database.js       # Neon DB client with RLS
│   │   └── rateLimit.js      # KV-based rate limiting
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── products.js       # Product catalog
│   │   ├── cart.js           # Shopping cart
│   │   ├── wishlist.js       # Wishlist management
│   │   ├── reviews.js        # Product reviews
│   │   ├── orders.js         # Order management
│   │   ├── addresses.js      # User addresses
│   │   ├── admin/
│   │   │   └── index.js      # Admin dashboard API
│   │   └── webhooks.js       # Razorpay webhooks
│   └── services/
│       └── email.js          # MailChannels email service
├── wrangler.jsonc            # Cloudflare config
└── package.json

database/
└── migrations/
    ├── 001_initial_schema.sql    # Core tables
    ├── 002_rls_policies.sql      # Row-Level Security
    └── 003_functions_triggers.sql # Stored procedures

frontend/
└── src/
    ├── api/
    │   └── index.js          # API client
    └── stores/
        ├── auth.js           # Auth state (Pinia)
        ├── cart.js           # Cart state (Pinia)
        └── wishlist.js       # Wishlist state (Pinia)
```

## Additional Documentation

| Document | Description |
|----------|-------------|
| [Admin Content Panel](./docs/ADMIN_CONTENT_PANEL.md) | Walkthrough for setting up and using the admin content management panel |

## Migration Guide: Cookie-Based Authentication

### For Existing Frontends

The API now supports **dual authentication** (header + cookie), ensuring **backwards compatibility**:

✅ **Existing implementations continue to work** - Authorization header is still supported  
✅ **Gradual migration** - Frontends can adopt cookies at their own pace  
✅ **Enhanced security** - New implementations benefit from httpOnly cookies

#### Recommended Migration Steps

1. **Update fetch calls to include credentials**:
   ```javascript
   // Before
   fetch('/api/v1/cart', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   
   // After (recommended)
   fetch('/api/v1/cart', {
     credentials: 'include',  // Sends cookies + allows header
     headers: { 'Authorization': `Bearer ${token}` }  // Optional
   });
   ```

2. **Remove localStorage token management** (optional, for enhanced security):
   - The `sf_token` cookie is set automatically on login
   - Remove manual token storage if using cookie-only approach
   - Keep Authorization header for custom scenarios (mobile apps, etc.)

3. **Handle authentication responses**:
   ```javascript
   // The token is still returned in response body
   // But it's ALSO set as httpOnly cookie automatically
   const { user, token } = await loginUser();
   // No need to manually store token if using cookies
   ```

#### Cookie Configuration

Cookies are configured with:
- **HttpOnly**: JavaScript cannot access (XSS protection)
- **SameSite=Lax**: CSRF protection
- **Secure** (production): HTTPS-only
- **Max-Age**: Matches JWT expiry (7 days default)

## Environment Variables

### Cloudflare Worker Secrets (wrangler secret put)

```bash
# Database
wrangler secret put DATABASE_URL
# Format: postgres://user:password@host/database?sslmode=require

# JWT
wrangler secret put JWT_SECRET
# Generate: openssl rand -base64 32

# Google OAuth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# Razorpay
wrangler secret put RAZORPAY_KEY_SECRET

# Admin Security Code
wrangler secret put ADMIN_SECURITY_CODE
```

### Wrangler Config Variables

```jsonc
// wrangler.jsonc
{
	"vars": {
		"ENVIRONMENT": "production",
		"FRONTEND_URL": "https://spacefurnio.in",
		"JWT_ISSUER": "spacefurnio",
		"JWT_AUDIENCE": "spacefurnio-api",
		"JWT_EXPIRY_HOURS": "168", // 7 days
		"MAGIC_LINK_EXPIRY_MINS": "15",
		"RAZORPAY_KEY_ID": "rzp_live_xxxxx"
	}
}
```

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint             | Auth | Description                  |
| ------ | -------------------- | ---- | ---------------------------- |
| GET    | `/google`            | ❌   | Get Google OAuth URL         |
| POST   | `/google/callback`   | ❌   | Handle Google OAuth callback |
| POST   | `/magic-link`        | ❌   | Request magic link email     |
| POST   | `/magic-link/verify` | ❌   | Verify magic link token      |
| POST   | `/signup`            | ❌   | Register with email/password |
| POST   | `/login`             | ❌   | Login with email/password    |
| GET    | `/me`                | ✅   | Get current user             |
| PATCH  | `/me`                | ✅   | Update user profile          |
| POST   | `/logout`            | ✅   | Logout current session       |
| POST   | `/logout-all`        | ✅   | Logout current session (same as /logout with stateless JWT) |

#### Authentication Methods

The API supports **dual authentication**:
1. **Bearer Token (Header)**: `Authorization: Bearer <token>`
2. **HttpOnly Cookie**: `sf_token` cookie (auto-set on login)

**Priority**: Authorization header is checked first, then falls back to cookie if header is missing/invalid.

#### User Profile Fields

User objects include:
- `id` - User UUID
- `email` - Email address
- `name` - Display name
- `avatar_url` - Profile picture URL
- `phone` - Phone number (E.164 format)
- `is_admin` - Admin status (boolean)
- `email_verified` - Email verification status (boolean)
- `provider` - Auth provider (`google`, `email`)

#### Authentication Response Format

All successful authentication endpoints (`/google/callback`, `/magic-link/verify`) return:

```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "isAdmin": false,
    "email_verified": true
  },
  "token": "eyJhbGc...",
  "isNewUser": false  // Only for new registrations
}
```

**Headers**: Response includes `Set-Cookie` header with httpOnly `sf_token` cookie.

#### Update User Profile (PATCH /me)

Supports updating:
- `name` - Display name
- `phone` - Phone number (validated)
- `avatar_url` - Profile picture URL
- `email` - Email address (triggers re-verification)

**Note**: Updating email sets `email_verified=false` and `provider='email'`.

### Products (`/api/v1/products`)

| Method | Endpoint           | Auth | Description                           |
| ------ | ------------------ | ---- | ------------------------------------- |
| GET    | `/`                | ❌   | List products (paginated, filterable) |
| GET    | `/featured`        | ❌   | Get featured products                 |
| GET    | `/new-arrivals`    | ❌   | Get new arrivals                      |
| GET    | `/room/:room`      | ❌   | Get products by room type             |
| GET    | `/style/:style`    | ❌   | Get products by design style          |
| GET    | `/:slug`           | ❌   | Get single product                    |
| GET    | `/categories/all`  | ❌   | Get all categories                    |
| GET    | `/filters/options` | ❌   | Get filter options                    |

### Cart (`/api/v1/cart`)

| Method | Endpoint     | Auth     | Description                       |
| ------ | ------------ | -------- | --------------------------------- |
| GET    | `/`          | Optional | Get cart (guest via X-Session-ID) |
| POST   | `/items`     | Optional | Add item to cart                  |
| PATCH  | `/items/:id` | Optional | Update item quantity              |
| DELETE | `/items/:id` | Optional | Remove item                       |
| DELETE | `/`          | Optional | Clear cart                        |
| POST   | `/coupon`    | Optional | Apply coupon code                 |
| DELETE | `/coupon`    | Optional | Remove coupon                     |
| GET    | `/count`     | Optional | Get cart item count               |

### Wishlist (`/api/v1/wishlist`)

| Method | Endpoint                  | Auth | Description                  |
| ------ | ------------------------- | ---- | ---------------------------- |
| GET    | `/`                       | ✅   | Get wishlist                 |
| POST   | `/items`                  | ✅   | Add item                     |
| DELETE | `/items/:id`              | ✅   | Remove item                  |
| DELETE | `/product/:id`            | ✅   | Remove by product ID         |
| GET    | `/check/:productId`       | ✅   | Check if product in wishlist |
| POST   | `/items/:id/move-to-cart` | ✅   | Move to cart                 |
| GET    | `/count`                  | ✅   | Get wishlist count           |
| PATCH  | `/visibility`             | ✅   | Set public/private           |

### Reviews (`/api/v1/reviews`)

| Method | Endpoint              | Auth | Description             |
| ------ | --------------------- | ---- | ----------------------- |
| GET    | `/product/:productId` | ❌   | Get reviews for product |
| POST   | `/product/:productId` | ✅   | Create review           |
| PATCH  | `/:reviewId`          | ✅   | Update review           |
| DELETE | `/:reviewId`          | ✅   | Delete review           |
| POST   | `/:reviewId/vote`     | ✅   | Vote helpful/not        |
| DELETE | `/:reviewId/vote`     | ✅   | Remove vote             |
| GET    | `/my-reviews`         | ✅   | Get user's reviews      |
| GET    | `/products-to-review` | ✅   | Get eligible products   |

### Orders (`/api/v1/orders`)

| Method | Endpoint                   | Auth | Description             |
| ------ | -------------------------- | ---- | ----------------------- |
| GET    | `/`                        | ✅   | List orders             |
| GET    | `/:orderId`                | ✅   | Get order details       |
| POST   | `/`                        | ✅   | Create order from cart  |
| POST   | `/:orderId/verify-payment` | ✅   | Verify Razorpay payment |
| POST   | `/:orderId/cancel`         | ✅   | Cancel order            |
| GET    | `/:orderId/track`          | ✅   | Track order             |

### Addresses (`/api/v1/addresses`)

| Method | Endpoint              | Auth | Description         |
| ------ | --------------------- | ---- | ------------------- |
| GET    | `/`                   | ✅   | List addresses      |
| GET    | `/:addressId`         | ✅   | Get address         |
| POST   | `/`                   | ✅   | Create address      |
| PATCH  | `/:addressId`         | ✅   | Update address      |
| DELETE | `/:addressId`         | ✅   | Delete address      |
| POST   | `/:addressId/default` | ✅   | Set default         |
| GET    | `/default`            | ✅   | Get default address |
| GET    | `/meta/states`        | ❌   | Get Indian states   |

### Admin (`/api/v1/admin`)

| Method | Endpoint          | Auth | Description                         |
| ------ | ----------------- | ---- | ----------------------------------- |
| POST   | `/request-access` | ✅   | Request admin (needs security code) |
| GET    | `/status`         | ✅   | Check admin status                  |
| GET    | `/dashboard`      | 🔐   | Dashboard stats                     |
| GET    | `/products`       | 🔐   | List all products                   |
| POST   | `/products`       | 🔐   | Create product                      |
| PATCH  | `/products/:id`   | 🔐   | Update product                      |
| DELETE | `/products/:id`   | 🔐   | Delete product                      |
| GET    | `/orders`         | 🔐   | List all orders                     |
| GET    | `/orders/:id`     | 🔐   | Get order details                   |
| PATCH  | `/orders/:id`     | 🔐   | Update order status                 |
| GET    | `/reviews`        | 🔐   | List reviews (pending)              |
| PATCH  | `/reviews/:id`    | 🔐   | Approve/reject review               |
| GET    | `/users`          | 🔐   | List users                          |
| GET    | `/categories`     | 🔐   | List categories                     |
| POST   | `/categories`     | 🔐   | Create category                     |
| GET    | `/coupons`        | 🔐   | List coupons                        |
| POST   | `/coupons`        | 🔐   | Create coupon                       |
| GET    | `/settings`       | 🔐   | Get site settings                   |
| PATCH  | `/settings`       | 🔐   | Update settings                     |
| GET    | `/activity`       | 🔐   | Activity logs                       |

Legend: ❌ No auth | ✅ Auth required | 🔐 Admin required

### Webhooks (`/api/v1/webhooks`)

| Method | Endpoint    | Description              |
| ------ | ----------- | ------------------------ |
| POST   | `/razorpay` | Razorpay webhook handler |

## Authentication Flow

### Google OAuth

```
1. Frontend calls GET /api/v1/auth/google
2. Backend returns Google OAuth URL with state token
3. Frontend redirects to Google
4. User authenticates with Google
5. Google redirects to frontend callback URL with code
6. Frontend calls POST /api/v1/auth/google/callback with code
7. Backend exchanges code for tokens, creates/updates user
8. Backend returns JWT token + sets httpOnly sf_token cookie
9. Frontend stores token (optional), redirects to app
```

### Magic Link

```
1. User enters email
2. Frontend calls POST /api/v1/auth/magic-link
3. Backend creates magic link token, sends email
4. User clicks link in email
5. Frontend extracts token from URL
6. Frontend calls POST /api/v1/auth/magic-link/verify
7. Backend verifies token, creates session
8. Backend returns JWT token + sets httpOnly sf_token cookie
9. Frontend stores token (optional), redirects to app
```

### Logout

Both `/logout` and `/logout-all` endpoints:
1. **Verify JWT using JWT_SECRET**
2. **Mark token as revoked in `EXPIRED_SESSIONS` KV** with TTL matching JWT expiration
3. Clear the `sf_token` cookie (Max-Age=0)
4. Return success response

> **Note:** With stateless JWT authentication, `/logout-all` only revokes the current token. True "logout all sessions" would require server-side session tracking.

**Session Revocation Flow:**
```
1. User calls POST /api/v1/auth/logout
2. Backend verifies JWT using JWT_SECRET
3. Backend calculates TTL = JWT expiration - current time
4. Backend stores token hash in EXPIRED_SESSIONS KV with TTL
5. Backend clears sf_token cookie
6. Any subsequent requests with the revoked token will be rejected
```

**Why Stateless JWT + KV Revocation?**
- **No database session table**: Sessions are not stored in database, reducing writes
- **Fast validation**: JWT verified locally, KV checked for revocation only
- **Automatic cleanup**: KV entries auto-expire when JWT would have expired
- **Distributed**: Works across all edge locations instantly
- **Scalable**: No session table queries for auth checks

## Database Schema

### Core Tables

- `users` - User accounts
- `magic_links` - Magic link tokens
- `admin_access` - Admin permissions

### Product Tables

- `categories` - Product categories (hierarchical)
- `products` - Product catalog
- `product_variants` - Size/color variants

### E-commerce Tables

- `carts` - Shopping carts
- `cart_items` - Cart line items
- `wishlists` - User wishlists
- `wishlist_items` - Wishlist items
- `addresses` - Shipping/billing addresses
- `orders` - Orders
- `order_items` - Order line items
- `reviews` - Product reviews
- `review_votes` - Review helpfulness votes
- `coupons` - Discount coupons
- `coupon_usage` - Coupon usage tracking

### System Tables

- `site_settings` - Key-value settings
- `activity_logs` - Admin activity audit

## Row-Level Security (RLS)

The database uses RLS to enforce access control at the database level:

### Roles

1. **anon** - Unauthenticated users (read-only on public data)
2. **authenticated** - Logged-in users (own data only)
3. **service_role** - Backend service (full access)

### Context Setting

```sql
-- Set user context before queries
SELECT set_config('app.current_user_id', 'user-uuid', true);
SELECT set_config('app.is_admin', 'true', true);
SELECT set_config('app.current_session_id', 'session-id', true);
```

## Rate Limiting

Rate limits are enforced using Cloudflare KV:

| Endpoint            | Limit       |
| ------------------- | ----------- |
| Default             | 100 req/min |
| Auth endpoints      | 10 req/min  |
| Login attempts      | 5 req/5 min |
| Magic link requests | 3 req/5 min |

## Payment Integration (Razorpay)

### Checkout Flow

```
1. User clicks checkout
2. Frontend calls POST /api/v1/orders with address, payment method
3. Backend creates Razorpay order, returns razorpay_order_id
4. Frontend initializes Razorpay checkout with order details
5. User completes payment on Razorpay
6. Frontend receives payment success callback
7. Frontend calls POST /api/v1/orders/:id/verify-payment
8. Backend verifies signature, updates order status
9. Razorpay sends webhook for additional verification
```

### Webhook Events

- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `refund.created` - Refund initiated
- `refund.processed` - Refund completed
- `order.paid` - Order paid

## Deployment

### Prerequisites

1. Cloudflare account with Workers enabled
2. Neon PostgreSQL database
3. Google Cloud project for OAuth
4. Razorpay account

### Setup Steps

```bash
# 1. Install dependencies
cd backend
pnpm install

# 2. Create KV namespaces
wrangler kv:namespace create RATE_LIMIT
wrangler kv:namespace create EXPIRED_SESSIONS

# 3. Set secrets
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put ADMIN_SECURITY_CODE

# 4. Run migrations on Neon
# Copy contents of database/migrations/*.sql to Neon SQL editor

# 5. Deploy
wrangler deploy

# 6. Set up custom domain (optional)
wrangler domains add api.spacefurnio.in
```

### Frontend Environment

Create `.env` file:

```env
VITE_API_URL=https://api.spacefurnio.in
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

## Frontend Integration

### API Client Usage

```javascript
import api from '@/api';

// Auth - Tokens automatically managed via httpOnly cookies
const { url } = await api.auth.getGoogleAuthUrl();
const { token, user } = await api.auth.verifyMagicLink(token);
// Token stored in cookie automatically, localStorage optional

// Products
const { products } = await api.products.getAll({ category: 'sofas' });
const { product } = await api.products.getBySlug('modern-sofa');

// Cart - Works with cookie authentication
await api.cart.addItem(productId, 2);
const { items, subtotal } = await api.cart.get();

// Orders
const { order, razorpay } = await api.orders.create({
	shippingAddressId: 'uuid',
	paymentMethod: 'razorpay',
});
```

### Authentication Requests

The API client should handle authentication in one of two ways:

```javascript
// Option 1: Authorization Header (if token in localStorage)
fetch('/api/v1/cart', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  credentials: 'include' // Important: sends cookies
});

// Option 2: Cookie Only (recommended - more secure)
fetch('/api/v1/cart', {
  credentials: 'include' // Sends sf_token cookie automatically
});
```

**Note**: Always include `credentials: 'include'` to ensure cookies are sent with requests.

### Pinia Store Usage

```javascript
import { useAuthStore, useCartStore } from '@/stores';

const authStore = useAuthStore();
const cartStore = useCartStore();

// Auth - token handled automatically via cookie
await authStore.initialize();
if (authStore.isAuthenticated) {
	console.log(authStore.userName);
}

// Cart
await cartStore.addItem(productId, 1);
console.log(cartStore.itemCount, cartStore.total);
```

## Security Considerations

1. **Dual Authentication**
   - Supports both Authorization header and httpOnly cookies
   - Authorization header takes priority if present and valid
   - Falls back to `sf_token` cookie if header is missing/invalid
   - Validates tokens - ignores "undefined", "null", or empty values

2. **Cookie Security**
   - `HttpOnly` - Prevents JavaScript access to tokens
   - `SameSite=Lax` - CSRF protection
   - `Secure` flag in production (HTTPS only)
   - Automatic expiry matching JWT token lifespan (7 days default)
   - Path limited to `/` for scope control

3. **JWT Tokens**
   - Verified using `JWT_SECRET` environment variable (HS256 algorithm)
   - 7-day expiry (configurable via `JWT_EXPIRY_HOURS`)
   - Contains minimal claims: user ID (`sub`) and admin status
   - Email removed from JWT payload (fetch from DB when needed)
   - Stored in both cookie (httpOnly) and optionally localStorage
   - **Integrity verified on every request** using jose library

4. **Stateless Session Management & Revocation**
   - **No database session storage** - Sessions are purely JWT-based
   - **Revoked tokens stored in `EXPIRED_SESSIONS` Cloudflare KV**
   - Token validation checks:
     1. JWT signature and claims verified with `JWT_SECRET`
     2. Token hash checked against `EXPIRED_SESSIONS` KV (if present = revoked)
     3. User existence/active status verified in PostgreSQL users table
   - KV entries auto-expire when JWT would naturally expire (TTL-based)
   - Logout revokes current token only (stateless = no multi-session tracking)
   - `/logout-all` is equivalent to `/logout` in stateless architecture

5. **User Profile Updates**
   - Email changes require re-verification (`email_verified` reset to false)
   - Provider switches to 'email' when email is updated
   - Phone number validation (E.164 format)
   - Avatar URL validation

6. **Additional Security Layers**
   - **CORS** - Strict origin validation
   - **Rate Limiting** - Prevents abuse
   - **RLS** - Database-level access control
   - **Admin Access** - Requires security code
   - **Webhook Signatures** - HMAC verification
   - **Input Validation** - All inputs sanitized
   - **SQL Injection** - Parameterized queries via postgres.js

## Error Handling

All errors return consistent JSON:

```json
{
	"error": "Error Type",
	"message": "Human readable message",
	"errors": {
		"field": "Field-specific error"
	}
}
```

HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## Monitoring

Use Cloudflare dashboard for:

- Request analytics
- Error tracking
- Performance metrics
- CPU/Memory usage

Use Neon dashboard for:

- Query performance
- Connection stats
- Database metrics

## Support

For issues or questions:

- GitHub Issues: [repository-url]
- Email: support@spacefurnio.in
