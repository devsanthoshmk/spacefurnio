# Frontend API Integration

## Overview
This document outlines the architectural updates to the frontend's API layer. The primary goal was to connect the `shopApi` and functional stores (`cart`, `wishlist`, `auth`) directly to the Neon Data API and Worker backend, establishing a robust, production-ready ecommerce architecture.

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
