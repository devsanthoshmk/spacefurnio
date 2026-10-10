# SpaceFurnio Complete Backend REST API Documentation

**Runtime:** Cloudflare Worker (`itty-router`, `jose`, `@neondatabase/serverless`, `drizzle-orm`)  
**Base URL (Local):** `http://localhost:8787` or `http://localhost:5173` (proxied)  
**Base URL (Production):** `https://backend.<subdomain>.workers.dev`  
**Authentication Standard:** RFC 7519 JSON Web Token (RS256 with Asymmetric RSA Keypair)

---

## 📑 Table of Contents

1. [Architecture & Security Standards](#1-architecture--security-standards)
2. [Role-Based Access Control (RBAC) & Permission Matrix](#2-role-based-access-control-rbac--permission-matrix)
3. [Authentication & Account Endpoints (`/auth`)](#3-authentication--account-endpoints-auth)
4. [Catalog & Products Storefront API (`/api/products`, `/api/categories`)](#4-catalog--products-storefront-api-apiproducts-apicategories)
5. [Shopping Cart API (`/api/cart`)](#5-shopping-cart-api-apicart)
6. [Customer Wishlist API (`/api/wishlist`)](#6-customer-wishlist-api-apiwishlist)
7. [Customer Saved Addresses API (`/api/addresses`)](#7-customer-saved-addresses-api-apiaddresses)
8. [Customer Orders & Checkout API (`/api/orders`)](#8-customer-orders--checkout-api-apiorders)
9. [Public Coupons & Validation API (`/api/coupons`)](#9-public-coupons--validation-api-apicoupons)
10. [Customer Reviews & Ratings API (`/api/reviews`)](#10-customer-reviews--ratings-api-apireviews)
11. [Payments & Transactions API (`/api/payments`)](#11-payments--transactions-api-apipayments)
12. [Engagement & Newsletter API (`/api`)](#12-engagement--newsletter-api-api)
13. [Admin Dashboard & Operational Telemetry (`/api/admin/dashboard`)](#13-admin-dashboard--operational-telemetry-apiadmindashboard)
14. [Admin Products & Bulk Upload Pipeline (`/api/admin/products`)](#14-admin-products--bulk-upload-pipeline-apiadminproducts)
15. [Admin Orders, Fulfillment & Refunds (`/api/admin/orders`)](#15-admin-orders-fulfillment--refunds-apiadminorders)
16. [Admin Customer Directory & Segmentation (`/api/admin/customers`)](#16-admin-customer-directory--segmentation-apiadmincustomers)
17. [Admin Reviews & Feedback Moderation (`/api/admin/reviews`)](#17-admin-reviews--feedback-moderation-apiadminreviews)
18. [Admin Coupons & Promotions Management (`/api/admin/coupons`)](#18-admin-coupons--promotions-management-apiadmincoupons)
19. [Admin Media & Image Asset Management (`/api/admin/images`)](#19-admin-media--image-asset-management-apiadminimages)
20. [Admin Team Management, Invitations & RBAC (`/api/admin/team`)](#20-admin-team-management-invitations--rbac-apiadminteam)

---

## 1. Architecture & Security Standards

### Dual Database Topology
- **Primary Database (`DATABASE_URL`)**: Stores user profiles, authentication sessions, customer addresses, orders, order items, status history, shipments, payments, refunds, cart items, wishlist items, reviews, notifications, and coupons.
- **Catalog Database (`PRODUCTS_DATABASE_URL`)**: Isolated high-performance database holding product entities, product images, color variants, brands, categories, spaces, styles, rooms, and materials.

### Cryptographic Authentication
- **Access Tokens**: Short-lived (7-day default) asymmetric RS256 JWTs returned in JSON payloads.
- **Refresh Tokens**: Long-lived (30-day default) cryptographic tokens stored as secure, `HttpOnly`, `SameSite=Strict`, `Path=/` cookies and indexed via `user_sessions`.
- **Public JWKS**: Public keys available at `GET /auth/.well-known/jwks.json` for edge token verification.

---

## 2. Role-Based Access Control (RBAC) & Permission Matrix

All administrative routes (`/api/admin/*`) enforce token signature validation and check granular permissions:

### Granular Permissions
| Domain | Permission Key | Description |
|---|---|---|
| **Orders** | `orders.read` | View orders, receipts, and fulfillment details |
| | `orders.write` | Update order status and shipping snapshots |
| | `orders.fulfill` | Dispatch shipments, assign carriers and tracking numbers |
| | `orders.cancel` | Cancel pending or processing orders |
| | `orders.refund` | Process partial or full refunds |
| **Catalog** | `products.read` | View complete catalog, tax details, and pricing |
| | `products.write` | Create and update products, images, and color variants |
| | `products.delete` | Delete catalog products and cascade relations |
| | `products.bulk` | Execute bulk actions and bulk product imports |
| | `inventory.manage`| Monitor stock and out-of-stock thresholds |
| | `categories.manage`| Manage categories, styles, rooms, spaces, and materials |
| **Customers**| `customers.read` | View customer directory, spending metrics, and order history |
| | `customers.write`| Update customer profiles and active/disabled status |
| | `customers.delete`| Cascading cleanup and purge of customer accounts |
| **Promotions**| `marketing.coupons`| Create, update, toggle, and delete promotional coupons |
| **Reviews** | `reviews.read` | View customer reviews and rating breakdowns |
| | `reviews.write` | Create or update customer reviews |
| | `reviews.delete` | Delete spam or abusive reviews |
| **Media** | `media.manage` | Upload, link, audit, and manage product media assets |
| **Analytics**| `analytics.view` | View dashboard KPIs, revenue sparklines, and reports |
| **Team** | `admins.manage` | Invite staff, assign roles, and revoke team access |
| **System** | `settings.manage` | Store configuration and global operational settings |

### Role Presets
- **`super_admin`**: Unrestricted access across all 22 permissions. Protected by self-demotion, self-deactivation, and last-admin security guards.
- **`store_manager`**: Full administrative access across catalog, orders, customers, reviews, coupons, analytics, and media (excluding staff management).
- **`sales_fulfillment`**: Focused access on orders, shipments, customer receipts, and sales telemetry.
- **`customer_support`**: Customer directory inspection, order history lookup, review moderation, and promotional coupon issuance.
- **`catalog_inventory`**: Full product lifecycle management, taxonomy lookups, bulk upload imports, and media asset management.
- **`custom`**: Explicitly assigned permission arrays.

---

## 3. Authentication & Account Endpoints (`/auth`)

### 3.1 Get JWKS Public Keys
* **`GET /auth/.well-known/jwks.json`**
* **Auth:** Public
* **Response (200 OK):** Standard RFC 7517 JWK Set containing RS256 public key parameters.

### 3.2 Register New Customer
* **`POST /auth/register`**
* **Auth:** Public
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Doe"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Registration successful",
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "authenticated"
    }
  }
  ```
* **Headers:** Sets `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`

### 3.3 Login
* **`POST /auth/login`**
* **Auth:** Public
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK):** Returns `access_token` and user profile object. Sets `refresh_token` cookie.

### 3.4 Token Refresh
* **`POST /auth/refresh`**
* **Auth:** Reads `refresh_token` from cookie or optional JSON body `{ "refresh_token": "..." }`.
* **Response (200 OK):** Returns fresh `access_token`.

### 3.5 Logout
* **`POST /auth/logout`**
* **Auth:** Public
* **Response (200 OK):** Deletes server-side session from `user_sessions` and clears `refresh_token` cookie.

### 3.6 Forgot Password
* **`POST /auth/forgot-password`**
* **Body:** `{ "email": "user@example.com" }`
* **Response (200 OK):** Generates 6-digit OTP code & link, sends email via Resend.

### 3.7 Reset Password
* **`POST /auth/reset-password`**
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "tokenOrCode": "123456",
    "newPassword": "NewSecurePassword123!"
  }
  ```

### 3.8 Get Authenticated User Profile
* **`GET /auth/me`**
* **Auth:** Bearer Token
* **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "phone_number": "+919876543210",
    "is_active": true,
    "role": "authenticated",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
  ```

### 3.9 Update Profile
* **`PUT /auth/profile`**
* **Auth:** Bearer Token
* **Body:** `{ "phone_number": "+919876543210" }`

### 3.10 Change Password
* **`PUT /auth/change-password`**
* **Auth:** Bearer Token
* **Body:**
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewPassword123!"
  }
  ```

### 3.11 Delete User Account
* **`DELETE /auth/account`** or **`DELETE /auth/me`**
* **Auth:** Bearer Token
* **Description:** Safely unlinks customer orders and deletes related sessions, addresses, carts, and wishlists.

---

## 4. Catalog & Products Storefront API (`/api/products`, `/api/categories`)

### 4.1 Get Filter Options & Taxonomies
* **`GET /api/products/filters`**
* **Auth:** Public
* **Response (200 OK):**
  ```json
  {
    "categories": [{ "id": 1, "name": "Sofas", "slug": "sofas" }],
    "spaces": [{ "id": 1, "name": "Living Room", "slug": "living-room" }],
    "styles": [{ "id": 1, "name": "Modern", "slug": "modern" }],
    "rooms": [{ "id": 1, "name": "Living Room", "slug": "living-room" }],
    "materials": [{ "id": 1, "name": "Teak Wood" }],
    "brands": [{ "id": 1, "name": "SpaceFurnio", "slug": "spacefurnio" }],
    "colors": [{ "id": 1, "name": "Walnut Brown", "hex_code": "#5c4033" }],
    "price_range": { "min": 2500, "max": 150000 },
    "total_products": 142
  }
  ```

### 4.2 List / Search / Filter Products
* **`GET /api/products`**
* **Query Parameters:** `page`, `limit`, `search`, `category`, `brand`, `space`, `style`, `room`, `material`, `listing_type`, `min_price`, `max_price`, `sort` (`popularity`, `price_asc`, `price_desc`, `rating`, `newest`).

### 4.3 Get Featured / Trending Products
* **`GET /api/products/featured?limit=8`**

### 4.4 Get Single Product by ID or Slug
* **`GET /api/products/:idOrSlug`**
* **Response (200 OK):** Enriched product entity including `images` array (with `is_primary` and `sort_order`) and `colors` variant array.

### 4.5 List Categories
* **`GET /api/categories`**

---

## 5. Shopping Cart API (`/api/cart`)

### 5.1 Get User Cart
* **`GET /api/cart`**
* **Auth:** Bearer Token
* **Response (200 OK):**
  ```json
  {
    "cart": { "id": "uuid", "user_id": "uuid" },
    "items": [
      {
        "id": "uuid",
        "productId": 12,
        "quantity": 2,
        "unitPrice": 499.00,
        "totalPrice": 998.00,
        "product": {
          "id": 12,
          "name": "Oak Dining Chair",
          "slug": "oak-dining-chair",
          "image": { "src": "https://...", "alt": "..." }
        }
      }
    ],
    "item_count": 2,
    "subtotal": 998.00
  }
  ```

### 5.2 Add Item to Cart
* **`POST /api/cart/items`**
* **Auth:** Bearer Token
* **Body:** `{ "product_id": 12, "quantity": 1 }`

### 5.3 Update Item Quantity
* **`PATCH /api/cart/items/:id`**
* **Body:** `{ "quantity": 3 }`

### 5.4 Remove Item from Cart
* **`DELETE /api/cart/items/:id`**

### 5.5 Clear Entire Cart
* **`DELETE /api/cart/clear`**

---

## 6. Customer Wishlist API (`/api/wishlist`)

* **`GET /api/wishlist`**: Get user wishlist items enriched with product images and pricing.
* **`POST /api/wishlist/items`**: `{ "product_id": 12 }` (Idempotent).
* **`DELETE /api/wishlist/items/:id`**: Remove by item UUID.
* **`DELETE /api/wishlist/items/by-product/:productId`**: Remove by numeric product ID.
* **`DELETE /api/wishlist/clear`**: Clear all wishlist items.

---

## 7. Customer Saved Addresses API (`/api/addresses`)

* **`GET /api/addresses`**: List customer saved shipping addresses.
* **`GET /api/addresses/default`**: Get default address.
* **`GET /api/addresses/:addressId`**: Get single address.
* **`POST /api/addresses`**: Create new address.
  ```json
  {
    "address_line_1": "Flat 302, Palm Heights",
    "address_line_2": "100ft Road, Indiranagar",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postal_code": "560038",
    "country": "India",
    "is_default": true
  }
  ```
* **`PATCH /api/addresses/:addressId`**: Partial address update.
* **`POST /api/addresses/:addressId/default`**: Set as default address.
* **`DELETE /api/addresses/:addressId`**: Delete address.

---

## 8. Customer Orders & Checkout API (`/api/orders`)

### 8.1 Place Order (Checkout)
* **`POST /api/orders/checkout`**
* **Auth:** Bearer Token
* **Body:**
  ```json
  {
    "addressId": "uuid",
    "paymentMethod": "card",
    "couponCode": "WELCOME10"
  }
  ```
* **Description:** Reads active cart items if not passed, validates coupon, snapshots address, inserts order items, creates payment record, and automatically clears the user's cart.

### 8.2 List User Orders
* **`GET /api/orders`**
* **Auth:** Bearer Token

### 8.3 Get Order Details
* **`GET /api/orders/:orderId`**
* **Auth:** Bearer Token (Order Owner or Admin)

### 8.4 Update Order Shipping Address
* **`PATCH /api/orders/:orderId/shipping`**
* **Auth:** Bearer Token (Allowed on `pending` or `paid` status prior to dispatch)

### 8.5 Cancel Order
* **`POST /api/orders/:orderId/cancel`**
* **Body:** `{ "reason": "Customer changed mind" }`

---

## 9. Public Coupons & Validation API (`/api/coupons`)

### 9.1 List Active Public Coupons
* **`GET /api/coupons/active`**
* **Auth:** Public

### 9.2 Validate Coupon Against Cart Subtotal
* **`POST /api/coupons/validate`**
* **Body:**
  ```json
  {
    "code": "FESTIVE15",
    "subtotal": 5000.00
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "valid": true,
    "coupon": {
      "id": "uuid",
      "code": "FESTIVE15",
      "description": "15% discount on all items",
      "discount_type": "percentage",
      "discount_value": 15
    },
    "subtotal": 5000.00,
    "discount_amount": 750.00,
    "final_amount": 4250.00
  }
  ```

---

## 10. Customer Reviews & Ratings API (`/api/reviews`)

### 10.1 Get Product Reviews & Average Rating
* **`GET /api/reviews/product/:productId?page=1&limit=10`**
* **Auth:** Public
* **Response (200 OK):**
  ```json
  {
    "productId": 12,
    "stats": {
      "total_reviews": 8,
      "average_rating": 4.8
    },
    "reviews": [
      {
        "id": "uuid",
        "author_name": "Santhosh",
        "rating": 5,
        "title": "Solid build",
        "comment": "Exceptional teak finish and sturdy frame.",
        "is_verified_purchase": true,
        "created_at": "2026-09-28T10:00:00.000Z"
      }
    ]
  }
  ```

### 10.2 Submit Product Review
* **`POST /api/reviews`**
* **Auth:** Bearer Token
* **Body:**
  ```json
  {
    "product_id": 12,
    "rating": 5,
    "title": "Great addition to our dining room",
    "comment": "Very comfortable and arrived in perfect condition.",
    "author_name": "Santhosh"
  }
  ```
* Automatically verifies user order history for `is_verified_purchase` badge and resynchronizes product `rating` and `review_count` in the catalog database.

---

## 11. Payments & Transactions API (`/api/payments`)

* **`POST /api/payments/create-order`**: Create payment order `{ "amount": 499.00, "currency": "INR" }`.
* **`POST /api/payments/verify`**: Verify transaction callback and mark order status as `paid`.

---

## 12. Engagement & Newsletter API (`/api`)

* **`POST /api/newsletter/subscribe`**: `{ "email": "shopper@example.com" }`
* **`POST /api/contact`**: `{ "name": "Jane", "email": "jane@example.com", "subject": "Inquiry", "message": "Custom dimensions question" }`

---

## 13. Admin Dashboard & Operational Telemetry (`/api/admin/dashboard`)

### 13.1 Get Comprehensive Admin Dashboard
* **`GET /api/admin/dashboard`**
* **Permission:** `analytics.view` (Super Admin, Store Manager, Sales & Fulfillment)
* **Query Parameters:**
  * `period`: `'today' | 'week' | 'month' | 'year' | 'all' | 'custom'` (Default: `'week'`)
  * `from`: ISO 8601 or `YYYY-MM-DD` start date (for custom ranges)
  * `to`: ISO 8601 or `YYYY-MM-DD` end date (for custom ranges)
* **Response (200 OK):**
  ```json
  {
    "period": "week",
    "from": "2026-09-27T00:00:00.000Z",
    "to": "2026-10-04T23:59:59.999Z",
    "kpis": {
      "revenue": {
        "value": 18500.00,
        "previous_value": 14200.00,
        "delta_pct": 30,
        "is_positive": true,
        "sparkline": [2100, 2400, 2800, 3100, 2600, 3200, 2300]
      },
      "orders": {
        "value": 38,
        "completed": 32,
        "pending": 4,
        "cancelled": 2,
        "previous_value": 29,
        "delta_pct": 31,
        "is_positive": true,
        "sparkline": [4, 5, 6, 7, 5, 7, 4]
      },
      "aov": {
        "value": 486.84,
        "previous_value": 489.65,
        "delta_pct": 1,
        "is_positive": false,
        "sparkline": [525, 480, 466, 442, 520, 457, 575]
      },
      "customers": {
        "value": 34,
        "total_registered": 1450,
        "previous_value": 26,
        "delta_pct": 31,
        "is_positive": true,
        "sparkline": [3, 5, 5, 6, 5, 6, 4]
      }
    },
    "trends": [
      { "date": "2026-09-27T00:00:00.000Z", "label": "Sun, Sep 27", "revenue": 2100.00, "orders": 4 }
    ],
    "top_products": [
      {
        "id": 12,
        "name": "Nordic Solid Oak Dining Table",
        "slug": "nordic-solid-oak-dining-table",
        "image": "https://images.unsplash.com/...",
        "units_sold": 14,
        "orders_count": 12,
        "revenue": 12460.00
      }
    ],
    "recent_orders": [
      {
        "id": "uuid",
        "status": "paid",
        "total_amount": 890.00,
        "customer_email": "jane@example.com",
        "customer_name": "Jane Doe",
        "city": "Bengaluru",
        "phone": "+919876543210",
        "payment_method": "card",
        "payment_status": "completed",
        "shipment_status": "pending",
        "tracking_number": null,
        "carrier": null,
        "items_count": 2,
        "created_at": "2026-09-30T14:00:00.000Z"
      }
    ],
    "catalog": {
      "total_products": 150,
      "active_products": 146,
      "inventory_value": 4850000,
      "out_of_stock": [],
      "low_stock": []
    },
    "operations_queue": {
      "awaiting_fulfillment": 6,
      "active_carts": 24,
      "total_reviews": 112,
      "store_rating": 4.8
    },
    "top_coupons": [
      { "id": "uuid", "code": "WELCOME10", "uses": 18, "total_discount": 450.00 }
    ],
    "customer_acquisition": {
      "new_customers": 24,
      "returning_customers": 10,
      "guest_orders": 4,
      "new_pct": 63,
      "returning_pct": 26,
      "guest_pct": 11
    }
  }
  ```

---

## 14. Admin Products & Bulk Upload Pipeline (`/api/admin/products`)

### 14.1 Get Catalog Taxonomies & Form Metadata
* **`GET /api/admin/products/lookups`**
* **Permission:** `products.read`
* **Response (200 OK):** Returns all available brands, categories, spaces, styles, rooms, materials, colors, and valid listing types.

### 14.2 List / Search / Filter Products (Admin Directory)
* **`GET /api/admin/products`**
* **Permission:** `products.read`
* **Query Parameters:** `page`, `limit`, `search`, `category`, `brand`, `space`, `style`, `room`, `material`, `listing_type`, `min_price`, `max_price`, `sort` (`newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`, `rating`, `popularity`).

### 14.3 Get Single Product Detail
* **`GET /api/admin/products/:id`** (by numeric ID or slug)
* **Permission:** `products.read`
* **Response (200 OK):** Detailed product record including brand, category, taxonomy mappings, images (with `is_primary` and `sort_order`), and color variants.

### 14.4 Create Product
* **`POST /api/admin/products`**
* **Permission:** `products.write`
* **Body:**
  ```json
  {
    "name": "Mid-Century Walnut Credenza",
    "slug": "mid-century-walnut-credenza",
    "description": "Handcrafted walnut storage credenza",
    "price_cents": 125000,
    "brand_id": 1,
    "category_id": 2,
    "space_id": 1,
    "style_id": 1,
    "room_id": 1,
    "material_id": 1,
    "listing_type": "category",
    "images": [
      { "src": "https://images.unsplash.com/photo-1.jpg", "alt": "Hero front", "is_primary": true, "sort_order": 0 },
      { "src": "https://images.unsplash.com/photo-2.jpg", "alt": "Interior shelving", "sort_order": 1 }
    ],
    "colors": [
      { "color_id": 1, "sort_order": 0 }
    ]
  }
  ```
* **Features:** Automatically resolves duplicate slug collisions (`credenza-1`, `credenza-2`), validates foreign keys, and inserts multi-image and color variant relations.

### 14.5 Update Product
* **`PUT /api/admin/products/:id`**
* **Permission:** `products.write`
* **Description:** Supports partial updates, setting relational foreign keys to `null`, updating slugs with collision prevention, and replacing image/color variant arrays.

### 14.6 Delete Product
* **`DELETE /api/admin/products/:id`**
* **Permission:** `products.delete`
* **Description:** Cascades deletion across `product_images`, `product_colors`, and `products`.

### 14.7 Bulk Product Actions
* **`POST /api/admin/products/bulk`**
* **Permission:** `products.bulk`
* **Actions Supported:**
  * `delete`: `{ "action": "delete", "product_ids": [101, 102] }`
  * `update_category`: `{ "action": "update_category", "product_ids": [101, 102], "category_id": 3 }`
  * `update_brand`: `{ "action": "update_brand", "product_ids": [101, 102], "brand_id": 2 }`
  * `update_space`: `{ "action": "update_space", "product_ids": [101, 102], "space_id": 1 }`
  * `update_style`: `{ "action": "update_style", "product_ids": [101, 102], "style_id": 2 }`

### 14.8 Bulk Product Upload & Import
* **`POST /api/admin/products/bulk-upload`**
* **Permission:** `products.bulk`
* **Body:**
  ```json
  {
    "dry_run": false,
    "auto_create_lookups": true,
    "items": [
      {
        "name": "Scandinavian Oak Dining Table",
        "description": "Seats 8 comfortably with oiled matte natural finish.",
        "price_cents": 89000,
        "brand": "Nordic Craft",
        "category": "Dining Tables",
        "space": "Dining Space",
        "style": "Minimalist Scandinavian",
        "room": "Dining Room",
        "material": "Solid Oak",
        "listing_type": "category",
        "images": [
          { "src": "https://images.unsplash.com/photo-table-1.jpg", "alt": "Table Hero", "is_primary": true }
        ],
        "colors": [
          { "color_id": 1, "sort_order": 0 }
        ]
      }
    ]
  }
  ```
* **Key Features:**
  * **On-the-Fly Lookups:** Resolves or auto-registers brands, categories, spaces, styles, rooms, materials, and colors by name.
  * **Price Normalization:** Accepts `price_cents` (cents integer), `price` (e.g. `890.00` $\to$ `89000`), or `mrp`.
  * **Dry-Run Mode (`dry_run: true`):** Performs pre-flight schema and constraint validation without writing database mutations.
  * **Fault-Tolerant Row Error Handling:** Continues processing valid rows even if individual rows fail, returning granular `errors: [{ row, name, error }]` reports.

---

## 15. Admin Orders, Fulfillment & Refunds (`/api/admin/orders`)

### 15.1 Get Order Summary Statistics
* **`GET /api/admin/orders/stats`**
* **Permission:** `orders.read`
* **Response (200 OK):**
  ```json
  {
    "total_orders": 142,
    "total_revenue": 184500.00,
    "pending_count": 8,
    "paid_count": 24,
    "processing_count": 18,
    "shipped_count": 36,
    "delivered_count": 52,
    "cancelled_count": 3,
    "refunded_count": 1
  }
  ```

### 15.2 List & Filter Orders
* **`GET /api/admin/orders`**
* **Permission:** `orders.read`
* **Query Parameters:** `page`, `limit`, `search` (ID, email, customer name, phone, city, tracking number), `status` (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`), `payment_status`, `payment_method`, `date_from`, `date_to`, `sort` (`created_at_desc`, `created_at_asc`, `total_desc`, `total_asc`).

### 15.3 Get Detailed Order Record
* **`GET /api/admin/orders/:id`**
* **Permission:** `orders.read`
* **Response (200 OK):** Detailed order view with customer info, item details enriched with product catalog thumbnails/slugs, timeline status history, shipment tracking, and refund history.

### 15.4 Update Order Status & Dispatch Shipment
* **`PUT /api/admin/orders/:id/status`**
* **Permission:** `orders.write`
* **Body:**
  ```json
  {
    "status": "shipped",
    "notes": "Dispatched via BlueDart Express",
    "tracking_number": "BD-12345678",
    "carrier": "BlueDart"
  }
  ```
* Updates order status, records timeline audit entry, and creates or updates tracking records in `shipments`.

### 15.5 Update Customer Shipping Snapshot
* **`PUT /api/admin/orders/:id/shipping`**
* **Permission:** `orders.write`
* **Body:**
  ```json
  {
    "shipping_first_name": "Jane",
    "shipping_last_name": "Doe",
    "shipping_address": "456 Residency Road",
    "shipping_city": "Bengaluru",
    "shipping_state": "Karnataka",
    "shipping_pincode": "560025",
    "shipping_phone": "+919876543210"
  }
  ```

### 15.6 Process Partial or Full Refund
* **`POST /api/admin/orders/:id/refund`**
* **Permission:** `orders.refund`
* **Body:**
  ```json
  {
    "amount": 450.00,
    "reason": "Customer returned 1 damaged chair"
  }
  ```
* **Business Logic:** Enforces cumulative refund bounds. Partial refunds set payment status to `partially_refunded`. Full refunds transition order and payment status to `refunded`. Blocks refunds on failed or unpaid orders.

### 15.7 Cancel Order
* **`POST /api/admin/orders/:id/cancel`**
* **Permission:** `orders.cancel`
* **Body:** `{ "reason": "Customer requested cancellation before dispatch" }`
* Rejects cancellation if order is already delivered, refunded, or cancelled.

---

## 16. Admin Customer Directory & Segmentation (`/api/admin/customers`)

### 16.1 List Customers with RFM Segmentation & Search
* **`GET /api/admin/customers`**
* **Permission:** `customers.read`
* **Query Parameters:**
  * `page` (default: 1)
  * `limit` (default: 25, max: 100)
  * `search` (matches email, name, phone with digit normalization, city, state, UUID)
  * `segment` (`all`, `high_value`, `returning`, `new`, `inactive`, `no_orders`)
  * `status` (`all`, `active`, `disabled`)
  * `sortBy` (`joined`, `total_spent`, `orders`, `name`, `last_order`)
  * `sortDir` (`asc`, `desc`)
* **Response (200 OK):**
  ```json
  {
    "metrics": {
      "total_customers": 480,
      "new_customers_30d": 42,
      "active_customers": 240,
      "returning_customers": 160,
      "high_value_customers": 32,
      "total_revenue": 184500.00,
      "average_order_value": 384.37
    },
    "customers": [
      {
        "id": "uuid",
        "email": "shopper@example.com",
        "name": "Jane Doe",
        "phone": "+919876543210",
        "status": "ACTIVE",
        "is_active": true,
        "role": "customer",
        "total_orders": 5,
        "total_spent": 2450.00,
        "average_order_value": 490.00,
        "last_order_date": "2026-09-29T10:00:00.000Z",
        "city": "Bengaluru",
        "state": "Karnataka",
        "segment": "Returning",
        "created_at": "2026-02-10T08:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 25, "total": 480, "total_pages": 20, "has_next_page": true, "has_prev_page": false }
  }
  ```

### 16.2 Get Single Customer Profile & Activity
* **`GET /api/admin/customers/:id`**
* **Permission:** `customers.read`
* **Response (200 OK):** Returns customer profile, stats summary, saved addresses, order history, reviews submitted, and live cart/wishlist item counts.

### 16.3 Update Customer Profile
* **`PUT /api/admin/customers/:id`**
* **Permission:** `customers.write`
* **Body:** `{ "phone_number": "+919876543210", "is_active": true }`

### 16.4 Toggle Customer Active / Disabled Status
* **`POST /api/admin/customers/:id/toggle-status`**
* **Permission:** `customers.write`

### 16.5 Delete Customer (Safe Cascading Dependency Cleanup)
* **`DELETE /api/admin/customers/:id`**
* **Permission:** `customers.delete`
* **Description:** Safely stages deletion across orders, address snapshots, return requests, refunds, coupons, reviews, carts, and wishlists to prevent foreign key constraint violations before purging user record.

---

## 17. Admin Reviews & Feedback Moderation (`/api/admin/reviews`)

### 17.1 List Reviews & Overall Rating Metrics
* **`GET /api/admin/reviews`**
* **Permission:** `reviews.read`
* **Query Parameters:** `page`, `limit`, `search`, `rating` (1–5), `product_id`, `verified_only` (true/false), `sort` (`newest`, `oldest`, `rating_desc`, `rating_asc`).
* **Response (200 OK):** Aggregates overall `total_reviews`, `average_rating`, `verified_count`, and star breakdown (1 to 5 stars), with catalog product enrichment.

### 17.2 Get Single Review
* **`GET /api/admin/reviews/:id`**
* **Permission:** `reviews.read`

### 17.3 Create / Import Review (Admin)
* **`POST /api/admin/reviews`**
* **Permission:** `reviews.write`
* **Body:**
  ```json
  {
    "product_id": 12,
    "rating": 5,
    "comment": "Exquisite dining table.",
    "title": "Solid wood perfection",
    "author_name": "Verified Buyer",
    "is_verified_purchase": true
  }
  ```
* Automatically recalculates and updates `rating` and `review_count` on the `products` table in the catalog database.

### 17.4 Update Review
* **`PUT /api/admin/reviews/:id`**
* **Permission:** `reviews.write`
* **Body:** `{ "rating": 4, "title": "Updated title", "comment": "Updated comment text" }`
* Recalculates product average rating automatically.

### 17.5 Delete Review
* **`DELETE /api/admin/reviews/:id`**
* **Permission:** `reviews.delete`
* **Description:** Deletes review and recalculates product average rating (resets to `0.0` rating and `0` review count if no reviews remain).

---

## 18. Admin Coupons & Promotions Management (`/api/admin/coupons`)

### 18.1 Get Coupon Statistics Summary
* **`GET /api/admin/coupons/stats`**
* **Permission:** `marketing.coupons`
* **Response (200 OK):**
  ```json
  {
    "total_coupons": 15,
    "active_coupons": 10,
    "inactive_coupons": 3,
    "expired_coupons": 2,
    "total_redemptions": 184,
    "total_discount_given": 36800.00
  }
  ```

### 18.2 List & Filter Coupons
* **`GET /api/admin/coupons`**
* **Permission:** `marketing.coupons`
* **Query Parameters:** `page`, `limit`, `search`, `status` (`all`, `active`, `inactive`, `expired`), `sort` (`newest`, `oldest`, `code_asc`, `code_desc`, `uses_desc`, `uses_asc`, `discount_desc`, `discount_asc`).

### 18.3 Get Single Coupon Detail & Redemption History
* **`GET /api/admin/coupons/:id`**
* **Permission:** `marketing.coupons`
* **Response (200 OK):** Returns coupon configuration, calculated status (`ACTIVE`, `INACTIVE`, `EXPIRED`), total redemptions metrics, and the latest 50 redemption records with user email and order total.

### 18.4 Create Coupon
* **`POST /api/admin/coupons`**
* **Permission:** `marketing.coupons`
* **Body:**
  ```json
  {
    "code": "SUMMER25",
    "description": "25% discount on summer collections",
    "discount_type": "percentage",
    "discount_value": 25,
    "is_active": true,
    "expires_at": "2026-12-31T23:59:59.000Z"
  }
  ```
* **Validation:** Uppercase normalization, percentage $\le 100\%$, positive discount values, duplicate code conflict prevention (`409 Conflict`).

### 18.5 Update Coupon
* **`PUT /api/admin/coupons/:id`**
* **Permission:** `marketing.coupons`
* **Description:** Partial updates with duplicate code rename collision checking.

### 18.6 Toggle Coupon Active Status
* **`PATCH /api/admin/coupons/:id/toggle`**
* **Permission:** `marketing.coupons`

### 18.7 Delete Coupon
* **`DELETE /api/admin/coupons/:id`**
* **Permission:** `marketing.coupons`
* **Description:** Safely deletes coupon record and cascades associated `coupon_redemptions` cleanup.

---

## 19. Admin Media & Image Asset Management (`/api/admin/images`)

### 19.1 Image Health Audit & Summary
* **`GET /api/admin/images/audit`**
* **Permission:** `media.manage`
* **Response (200 OK):**
  ```json
  {
    "summary": {
      "total_products": 45,
      "products_with_images": 42,
      "products_missing_images_count": 3,
      "total_images": 180,
      "primary_images": 42,
      "missing_alt_count": 4,
      "duplicate_url_count": 2
    },
    "missing_images": [
      { "id": 15, "name": "Minimalist Side Table", "slug": "minimalist-side-table", "brand": "SpaceFurnio" }
    ],
    "duplicates": [
      { "src": "https://images.unsplash.com/photo-example.jpg", "usage_count": 3, "product_ids": [12, 14, 19] }
    ],
    "recent_assets": [...]
  }
  ```

### 19.2 List & Search Product Images
* **`GET /api/admin/images`**
* **Permission:** `media.manage`
* **Query Parameters:** `page`, `limit`, `search` (matches `src`, `alt`, or product name), `product_id`, `primary_only` (true/false).

### 19.3 Upload / Import Media Asset
* **`POST /api/admin/images/upload`**
* **Permission:** `media.manage`
* **Content-Types:** `application/json` or `multipart/form-data`
* **JSON Body:**
  ```json
  {
    "src": "https://images.unsplash.com/photo-chair.jpg",
    "product_id": 12,
    "alt": "Dining Chair Studio Shot",
    "sort_order": 0,
    "is_primary": true
  }
  ```
* **Multipart Form Fields:** `file` (binary), `url` (string), `product_id` (number), `alt` (string), `is_primary` (boolean), `sort_order` (number).
* **Automatic Primary Election:**
  * Auto-sets `is_primary = true` if product has 0 existing images.
  * Setting `is_primary: true` automatically unsets prior primary images for that product.

### 19.4 Link Existing Image URL to Product
* **`POST /api/admin/images/link`**
* **Permission:** `media.manage`
* **Body:**
  ```json
  {
    "product_id": 12,
    "src": "https://images.unsplash.com/photo-linked.jpg",
    "alt": "Side Angle",
    "sort_order": 1,
    "is_primary": false
  }
  ```

### 19.5 Update Image Metadata
* **`PUT /api/admin/images/:id`**
* **Permission:** `media.manage`
* **Body:** `{ "alt": "Updated Alt Text", "sort_order": 0, "is_primary": true, "src": "https://..." }`

### 19.6 Delete Image with Auto-Primary Election
* **`DELETE /api/admin/images/:id`**
* **Permission:** `media.manage`
* **Description:** Deletes image record. If the deleted image was primary, automatically promotes the remaining image with the lowest sort order to `is_primary = true`.

---

## 20. Admin Team Management, Invitations & RBAC (`/api/admin/team`)

### 20.1 Get Role Presets & Granular Permissions
* **`GET /api/admin/team/roles`**
* **Permission:** `admins.manage` (Super Admin)

### 20.2 List Team Members & Pending Invitations
* **`GET /api/admin/team`**
* **Permission:** `admins.manage` (Super Admin)
* **Response (200 OK):**
  ```json
  {
    "team": [
      {
        "id": "uuid",
        "email": "admin@spacefurnio.in",
        "name": "admin",
        "phone_number": "+919876543210",
        "role": "super_admin",
        "is_active": true,
        "resolved_permissions": ["orders.read", "orders.write", "..."],
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-09-30T12:00:00.000Z"
      }
    ],
    "invitations": [
      {
        "id": "uuid",
        "email": "sarah@spacefurnio.in",
        "name": "Sarah Connor",
        "role": "catalog_inventory",
        "permissions": [],
        "invited_by": "admin@spacefurnio.in",
        "expires_at": "2026-10-01T12:00:00.000Z",
        "created_at": "2026-09-30T12:00:00.000Z"
      }
    ],
    "presets": { ... },
    "permissions": { ... }
  }
  ```

### 20.3 Invite Team Member
* **`POST /api/admin/team/invite`**
* **Permission:** `admins.manage` (Super Admin)
* **Body:**
  ```json
  {
    "email": "sarah@spacefurnio.in",
    "name": "Sarah Connor",
    "role": "catalog_inventory"
  }
  ```
* **Security Pipeline:** Generates high-entropy token, stores SHA-256 digest in `admin_invitations` with 24-hour expiration, sends email via Resend, and returns setup URL and raw token in response.

### 20.4 Accept Invitation & Set Password (Public)
* **`POST /api/admin/team/accept-invite`**
* **Auth:** Public
* **Body:**
  ```json
  {
    "token": "raw_invitation_token_value",
    "password": "SecurePassword123!"
  }
  ```
* **Description:** Verifies token expiration, enforces password strength ($\ge 6$ chars), hashes password with Web Crypto PBKDF2 (100,000 iterations), creates or activates user account, assigns the designated admin role in `user_roles`, initializes cart & wishlist records, and marks the invitation accepted.

### 20.5 Update Team Member Role & Status
* **`PUT /api/admin/team/:id`**
* **Permission:** `admins.manage` (Super Admin)
* **Body:** `{ "role": "store_manager", "is_active": true }`
* **Guards Enforced (`canModifyAdmin`):**
  * Super Admins cannot deactivate their own accounts (`403 Forbidden`).
  * Super Admins cannot demote their own Super Admin role (`403 Forbidden`).
  * Deactivating or demoting the last active Super Admin is strictly prevented (`403 Forbidden`).
  * Non-Super Admin accounts cannot modify Super Admin accounts (`403 Forbidden`).

### 20.6 Revoke Admin Member Privileges
* **`DELETE /api/admin/team/:id`**
* **Permission:** `admins.manage` (Super Admin)
* **Guards Enforced:**
  * Self-revocation is strictly blocked (`403 Forbidden`).
  * Revoking the last active Super Admin is strictly blocked (`403 Forbidden`).
  * Resets role in `user_roles` to `'customer'`.

### 20.7 Revoke Pending Invitation
* **`DELETE /api/admin/team/invite/:inviteId`**
* **Permission:** `admins.manage` (Super Admin)
* **Response (200 OK):** `{ "success": true, "message": "Invitation for sarah@spacefurnio.in revoked" }`

---

## 21. Standard HTTP Error Code Conventions

| Status Code | Reason | Meaning |
|---|---|---|
| **200 OK** | Success | Request succeeded and returned formatted payload. |
| **400 Bad Request** | Validation Error | Missing required fields, invalid parameters, negative pricing, or illegal transitions. |
| **401 Unauthorized** | Authentication Required | Missing, malformed, or expired Bearer token / refresh cookie. |
| **403 Forbidden** | Insufficient Privileges | Account lacks required granular RBAC permissions or action violated safety guards. |
| **404 Not Found** | Resource Missing | Non-existent or invalid UUID/product ID. |
| **409 Conflict** | Resource Duplicate | Duplicate coupon code, duplicate user email, or duplicate phone number. |
| **500 Internal Error** | Server Exception | Uncaught runtime error; logs captured in Cloudflare Workers Observability. |
