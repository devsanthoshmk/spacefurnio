# Frontend API Integration

## Overview
This document outlines the architectural updates to the frontend's API layer. The primary goal was to connect the `shopApi` and functional stores (`cart`, `wishlist`, `auth`) directly to the Neon Data API and Worker backend, establishing a robust, production-ready ecommerce architecture.

## API URL Structure

The frontend uses two API sources:

| Source | Environment Variable | Default |
|--------|---------------------|---------|
| **Worker Backend** | `VITE_WORKER_URL` | `https://backend.spacefurnio.workers.dev` |
| **Neon Data API (Main)** | `VITE_NEON_URL` | Main DB (users, carts, orders) |
| **Neon Data API (Catalog)** | `VITE_CATALOG_URL` | Catalog DB (products) |

### Worker Backend Routes

The Worker backend exposes routes under `/api/` (no versioning):

- `GET /api/orders` - Fetch user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/checkout` - Create order from cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/:productId` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/products` - List products (catalog DB)
- `GET /api/products/:slug` - Get product details

### API Client Configuration

In `src/api/index.js`:
- `API_BASE_URL` - Points to the custom domain or worker URL
- `API_VERSION` - Set to empty string since backend doesn't use `/v1` prefix
- Requests are constructed as: `${API_BASE_URL}/api${API_VERSION}${endpoint}` (e.g., `/api/orders`)

### Response Format Convention

The Worker backend uses **snake_case** for JSON response keys (e.g., `total_amount`, `created_at`, `order_items`). Frontend components expect this format.

### Orders API

The orders endpoint returns:
```json
{
  "id": "uuid",
  "status": "placed|processing|shipped|delivered|cancelled",
  "total_amount": 1234.56,
  "created_at": "2024-01-15T10:30:00Z",
  "order_items": [
    { "id": "uuid", "product_id": "uuid", "quantity": 2, "unit_price": 500.00 }
  ],
  "shipping_first_name": "John",
  "shipping_last_name": "Doe",
  "shipping_address": "123 Main St",
  "shipping_city": "Mumbai",
  "shipping_state": "Maharashtra",
  "shipping_pincode": "400001",
  "shipping_phone": "+91 9876543210",
  "payment_method": "razorpay"
}
```

Frontend components (e.g., `OrdersModal.vue`) use `enrichOrderItems()` from `shopApi` to fetch product details (name, image, slug) from the catalog DB and merge them with order items.

### Order Shipping Edit

Users can edit shipping address for orders with status `placed` or `processing`:
- Edit button appears only for these statuses
- Users can select from saved addresses or enter new address
- Updates go directly to Neon Data API with RLS enforcement
- RLS policy: `user_id = auth.user_id() AND status IN ('placed', 'processing')`

## ⚠️ Cross-Database Architecture

**Critical design constraint:** The product catalog and the user/shopping data live in **separate Neon projects**:

| Data | Neon Project | Endpoint |
|---|---|---|
| **Users, Carts, Wishlists, Orders** | Main DB (`ep-ancient-frog-aimehta7`) | `NEON_URL` |
| **Products, Categories, Brands** | Catalog DB (`ep-flat-brook-a1h1dgii` / `icy-union-81751721`) | `CATALOG_URL` |

Because of this separation:
- **PostgREST embedded resource joins like `products(*)` are NOT possible** on cart_items or wishlist_items endpoints. There is no `products` table in the main DB (dropped in migration `0001_big_dormammu.sql`).
- Product enrichment (name, image, price) must be done **client-side** using `shopApi` from the catalog DB.
- Cart items use `price_snapshot` (price captured at time of add) for pricing, which is the correct ecommerce pattern anyway.

### Key Changes
   - **Environment Variable Driven**: Uses `import.meta.env` for `WORKER_URL`, `NEON_URL`, and `CATALOG_URL` for flexible deployment.
   - Standardized error handling, detecting `401 Unauthorized` states globally to prompt user login.
   - **Removed `products(*)` joins** from `getCart()` and `getWishlist()` queries since products live in a separate Neon project.

2. **Routing & Special Views**:
   - **All Products View**: Added `/shop/products` route which hooks into `ProductListing.vue` without a category filter, enabling users to browse the entire catalog.
   - **Shop Navigation**: Updated "See All" links in `ShopView.vue` to point to `/shop/products` instead of the broken `/shop/category` redirect.

3. **Pinia Store Overrides**:

2. **Pinia Store Overrides**:
   - `auth.js`: Overhauled to securely persist `spacefurnio_token`, decode JWTs, and handle user state exclusively through the new `ApiClient`.
   - `cart.js`: Upgraded actions to `addCartItem`, `updateCartItem`, and `removeCartItem` against Neon endpoints. Uses `price_snapshot` for pricing since cross-DB joins are not possible.
   - `wishlist.js`: Fetches flat `wishlist_items` (id, product_id, created_at) without embedded product data. Product enrichment is done lazily by UI components.

3. **Vue Components Connectivity**:
   - `ShopView.vue` and `ProductDetailView.vue` had their "Add to Cart" and Wishlist Heart toggles strictly tethered to the Pinia stores.
   - Empty/Unauthenticated clicks on protected actions trigger `openLogin()` auto-injected from app context, mitigating bad 401s dynamically.
   - Reconfigured `AuthModal.vue` to fetch/store the live JWT.
   - Hooked up `CheckoutModal.vue` securely to the backend `POST /api/orders/checkout` endpoint via worker routes.

## Deployment Status
Testing through `pnpm run build` confirmed zero compilation anomalies across dependencies or strict Typescript layers. Production optimization yields functional and tightly coupled Data APIs directly bridging Neon database limits cleanly without DB connection pooling risks on the edge.

## Future Recommendations
- Implement client-side product enrichment: after fetching cart/wishlist items, batch-fetch product details from the catalog DB using `shopApi.getProduct()`.
- Adopt reactive optimistic updates within the cart arrays when offline caching gets finalized for Edge usage.
- Implement JWT rotation and robust decode checks natively using JOSE within the `api.js` client if manual expirations are necessary.
