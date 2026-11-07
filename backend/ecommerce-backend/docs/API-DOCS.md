# 🚀 Spacefurnio E-Commerce API Documentation

> **Complete Storefront Backend API Reference**
> This document details all available RESTful endpoints for the Spacefurnio E-Commerce backend Worker and Database.

---

## 🌍 Base URLs

| Environment | Base URL | Description |
|---|---|---|
| **Local / Dev** | `http://localhost:8787` | Cloudflare Worker local runtime (`wrangler dev`) |
| **Production** | `https://backend.spacefurnio.workers.dev` | Cloudflare Workers Edge API |

> [!TIP]
> **Currency Handling:** To avoid floating-point math errors, product catalog prices are stored as **integers in cents** (`price_cents`).
> * **Display:** Divide by 100 (e.g., `89900` cents = `$899.00`).
> * Cart/Order responses provide calculated subtotals, discounts, and totals in standard currency units.

---

## 🔐 1. Authentication (`/auth`)

### Register
* **Endpoint:** `POST /auth/register`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
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

### Login
* **Endpoint:** `POST /auth/login`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "authenticated"
    }
  }
  ```

### Get Current User Profile
* **Endpoint:** `GET /auth/me`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "phone_number": "+919876543210",
    "is_active": true,
    "role": "authenticated",
    "created_at": "2026-09-29T17:00:00.000Z"
  }
  ```

### Update Profile
* **Endpoint:** `PUT /auth/profile`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:**
  ```json
  {
    "phone_number": "+919876543210"
  }
  ```

### Change Password
* **Endpoint:** `PUT /auth/change-password`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:**
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456!"
  }
  ```

### Forgot Password
* **Endpoint:** `POST /auth/forgot-password`
* **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Reset Password
* **Endpoint:** `POST /auth/reset-password`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "tokenOrCode": "reset_token_or_code",
    "newPassword": "NewPassword789!"
  }
  ```

### Refresh Token
* **Endpoint:** `POST /auth/refresh`
* **Body (Optional):** `{ "refresh_token": "..." }` or sent automatically via `httpOnly` cookie.

### Logout
* **Endpoint:** `POST /auth/logout`

---

## 🪑 2. Catalog & Products (`/api/products` & `/api/categories`)

### Get Filter Metadata
* **Endpoint:** `GET /api/products/filters`
* **Response (200 OK):**
  ```json
  {
    "categories": [{ "id": 1, "name": "Living Room", "slug": "living-room" }],
    "spaces": [{ "id": 1, "name": "Indoor", "slug": "indoor" }],
    "styles": [{ "id": 1, "name": "Modern", "slug": "modern" }],
    "rooms": [{ "id": 1, "name": "Dining Room", "slug": "dining-room" }],
    "materials": [{ "id": 1, "name": "Solid Oak" }],
    "brands": [{ "id": 1, "name": "SpaceFurnio Originals", "slug": "spacefurnio" }],
    "colors": [{ "id": 1, "name": "Natural Wood", "hex_code": "#C19A6B" }],
    "price_range": { "min": 4900, "max": 229900 },
    "total_products": 49
  }
  ```

### List / Search Products
* **Endpoint:** `GET /api/products`
* **Query Parameters:**
  - `search`: Case-insensitive text search (e.g. `?search=table`)
  - `category`: Category slug or id (e.g. `?category=living-room`)
  - `space`: Space slug (e.g. `?space=outdoor`)
  - `style`: Style slug (e.g. `?style=modern`)
  - `room`: Room slug (e.g. `?room=bedroom`)
  - `material`: Material name or id
  - `brand`: Brand slug
  - `min_price` / `max_price`: Filter by `price_cents`
  - `sort`: `popularity`, `rating`, `newest`, `price_asc`, `price_desc`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
* **Response (200 OK):**
  ```json
  {
    "products": [
      {
        "id": 3,
        "name": "Modern Oak Dining Table",
        "slug": "modern-oak-dining-table",
        "description": "Solid oak dining table...",
        "price_cents": 89900,
        "listing_type": "category",
        "rating": 4.8,
        "review_count": 12,
        "popularity": 85,
        "brand": { "id": 1, "name": "SpaceFurnio", "slug": "spacefurnio" },
        "category": { "id": 2, "name": "Dining", "slug": "dining" },
        "primary_image": { "src": "https://images.unsplash.com/...", "alt": "Modern oak dining table" }
      }
    ],
    "pagination": {
      "total": 49,
      "page": 1,
      "limit": 20,
      "total_pages": 3,
      "has_next_page": true,
      "has_prev_page": false
    }
  }
  ```

### Get Single Product by ID or Slug
* **Endpoint:** `GET /api/products/:idOrSlug`
* **Response (200 OK):** Full product model including `images` array and `colors` array.

### Get Featured Products
* **Endpoint:** `GET /api/products/featured?limit=8`

### List Categories
* **Endpoint:** `GET /api/categories`
* **Response (200 OK):** List of categories with `product_count`.

### Get Category Details
* **Endpoint:** `GET /api/categories/:slugOrId`

---

## 🛒 3. Cart (`/api/cart`)

### Get User Cart (Enriched)
* **Endpoint:** `GET /api/cart`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response (200 OK):**
  ```json
  {
    "cart": { "id": "uuid", "user_id": "uuid" },
    "items": [
      {
        "id": "uuid",
        "productId": 3,
        "quantity": 2,
        "unitPrice": 899.00,
        "totalPrice": 1798.00,
        "product": {
          "id": 3,
          "name": "Modern Oak Dining Table",
          "slug": "modern-oak-dining-table",
          "brandName": "SpaceFurnio",
          "image": { "src": "...", "alt": "..." }
        }
      }
    ],
    "item_count": 2,
    "subtotal": 1798.00
  }
  ```

### Add Item to Cart
* **Endpoint:** `POST /api/cart/items`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:**
  ```json
  {
    "product_id": 3,
    "quantity": 1
  }
  ```
*(Automatically increments quantity if item is already in cart).*

### Update Cart Item Quantity
* **Endpoint:** `PATCH /api/cart/items/:id`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:** `{ "quantity": 3 }`

### Remove Item from Cart
* **Endpoint:** `DELETE /api/cart/items/:id`

### Clear Cart
* **Endpoint:** `DELETE /api/cart/clear`

---

## ❤️ 4. Wishlist (`/api/wishlist`)

### Get User Wishlist (Enriched)
* **Endpoint:** `GET /api/wishlist`
* **Headers:** `Authorization: Bearer <access_token>`

### Add Item to Wishlist
* **Endpoint:** `POST /api/wishlist/items`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:** `{ "product_id": 3 }`
*(Idempotent: will not duplicate if already present).*

### Remove Item from Wishlist
* **Endpoint:** `DELETE /api/wishlist/items/:id` or `DELETE /api/wishlist/items/by-product/:productId`

### Clear Wishlist
* **Endpoint:** `DELETE /api/wishlist/clear`

---

## 📍 5. Addresses (`/api/addresses`)

* `GET /api/addresses`: List all user addresses.
* `GET /api/addresses/default`: Get user's default shipping address.
* `GET /api/addresses/:addressId`: Get single address.
* `POST /api/addresses`: Create new address.
  ```json
  {
    "address_line_1": "123 MG Road",
    "address_line_2": "Apt 4B",
    "city": "Bangalore",
    "state": "Karnataka",
    "postal_code": "560001",
    "country": "India",
    "is_default": true
  }
  ```
* `PATCH /api/addresses/:addressId`: Update address.
* `POST /api/addresses/:addressId/default`: Set as default address.
* `DELETE /api/addresses/:addressId`: Delete address.

---

## 🎟️ 6. Coupons & Discounts (`/api/coupons`)

### List Active Coupons
* **Endpoint:** `GET /api/coupons/active`

### Validate Coupon Code
* **Endpoint:** `POST /api/coupons/validate`
* **Body:**
  ```json
  {
    "code": "WELCOME10",
    "subtotal": 1499.00
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "valid": true,
    "coupon": {
      "id": "uuid",
      "code": "WELCOME10",
      "description": "10% off on your first order",
      "discount_type": "percentage",
      "discount_value": 10
    },
    "subtotal": 1499.00,
    "discount_amount": 149.90,
    "final_amount": 1349.10
  }
  ```

---

## 📦 7. Orders & Checkout (`/api/orders`)

### Place Order (Checkout)
* **Endpoint:** `POST /api/orders/checkout`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:**
  ```json
  {
    "addressId": "uuid-of-address",
    "paymentMethod": "card",
    "couponCode": "WELCOME10"
  }
  ```
*(Pulls items from user's active cart if `cartItems` not explicitly passed, applies coupon discount, creates order, creates payment record, and automatically clears the user's cart).*

### List User Orders
* **Endpoint:** `GET /api/orders`
* **Headers:** `Authorization: Bearer <access_token>`

### Get Single Order Details
* **Endpoint:** `GET /api/orders/:orderId`
* **Headers:** `Authorization: Bearer <access_token>`

### Update Shipping Address
* **Endpoint:** `PATCH /api/orders/:orderId/shipping`
* **Headers:** `Authorization: Bearer <access_token>`

### Cancel Order
* **Endpoint:** `POST /api/orders/:orderId/cancel`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:** `{ "reason": "Customer request" }`

---

## ⭐ 8. Reviews (`/api/reviews`)

### Get Product Reviews & Rating Summary
* **Endpoint:** `GET /api/reviews/product/:productId`
* **Response (200 OK):**
  ```json
  {
    "productId": 3,
    "stats": {
      "total_reviews": 12,
      "average_rating": 4.8
    },
    "reviews": [
      {
        "id": "uuid",
        "author_name": "Santhosh M.",
        "rating": 5,
        "title": "Exceptional quality!",
        "comment": "Solid wood construction and arrived promptly.",
        "is_verified_purchase": true,
        "created_at": "2026-09-29T17:00:00.000Z"
      }
    ]
  }
  ```

### Submit Review
* **Endpoint:** `POST /api/reviews`
* **Headers:** `Authorization: Bearer <access_token>`
* **Body:**
  ```json
  {
    "product_id": 3,
    "rating": 5,
    "title": "Exceptional quality!",
    "comment": "Solid wood construction and arrived promptly.",
    "author_name": "Santhosh M."
  }
  ```
*(Automatically checks order history for `is_verified_purchase` badge and updates product aggregate rating).*

---

## 💳 9. Payments (`/api/payments`)

* `POST /api/payments/create-order`: Create payment order with amount and currency.
* `POST /api/payments/verify`: Verify payment transaction and update order to `paid`.

---

## ✉️ 10. Engagement (`/api`)

* `POST /api/newsletter/subscribe`: `{ "email": "customer@example.com" }`
* `POST /api/contact`: `{ "name": "John Doe", "email": "john@example.com", "subject": "Inquiry", "message": "..." }`

---

## 📦 11. Admin Orders Management (`/api/admin/orders`)

All endpoints require an Admin/Staff token with corresponding RBAC permissions.

### 11.1 Get Orders Summary Stats
* **Endpoint:** `GET /api/admin/orders/stats`
* **Permission:** `orders.read`
* **Response (200 OK):**
  ```json
  {
    "total_orders": 128,
    "total_revenue": 142500.00,
    "pending_count": 12,
    "paid_count": 25,
    "processing_count": 18,
    "shipped_count": 30,
    "delivered_count": 38,
    "cancelled_count": 3,
    "refunded_count": 2
  }
  ```

### 11.2 List & Filter Orders
* **Endpoint:** `GET /api/admin/orders`
* **Permission:** `orders.read`
* **Query Parameters:**
  * `page`: integer (default: 1)
  * `limit`: integer (default: 25, max: 100)
  * `search`: text (searches ID, email, name, phone, city, tracking number)
  * `status`: order status (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`, or `all`)
  * `payment_status`: payment status (`pending`, `completed`, `partially_refunded`, `refunded`, `failed`, or `all`)
  * `payment_method`: method (`card`, `upi`, `cod`, `razorpay`, `stripe`, etc.)
  * `date_from`: ISO string or `YYYY-MM-DD`
  * `date_to`: ISO string or `YYYY-MM-DD`
  * `sort`: `created_at_desc` (default), `created_at_asc`, `total_desc`, `total_asc`

### 11.3 Get Single Order Detail
* **Endpoint:** `GET /api/admin/orders/:id`
* **Permission:** `orders.read`
* **Response (200 OK):** Detailed order record including customer info, item details enriched with product catalog data (name, slug, image), status history timeline, shipment tracking info, and refund history.

### 11.4 Update Order Status & Shipment
* **Endpoint:** `PUT /api/admin/orders/:id/status`
* **Permission:** `orders.write`
* **Body:**
  ```json
  {
    "status": "shipped",
    "notes": "Dispatched via BlueDart",
    "tracking_number": "BD-98765432",
    "carrier": "BlueDart"
  }
  ```

### 11.5 Update Shipping Details Snapshot
* **Endpoint:** `PUT /api/admin/orders/:id/shipping`
* **Permission:** `orders.write`
* **Body:**
  ```json
  {
    "shipping_first_name": "Jane",
    "shipping_last_name": "Doe",
    "shipping_address": "456 Park Avenue",
    "shipping_city": "Mumbai",
    "shipping_state": "Maharashtra",
    "shipping_pincode": "400001",
    "shipping_phone": "+919876543210"
  }
  ```

### 11.6 Process Partial or Full Refund
* **Endpoint:** `POST /api/admin/orders/:id/refund`
* **Permission:** `orders.refund`
* **Body:**
  ```json
  {
    "amount": 500.00,
    "reason": "Customer returned item due to color discrepancy"
  }
  ```
* Validates against total payable and previous refunds. If total cumulative refunds equal order amount, sets status to `refunded`; for partial refunds sets payment status to `partially_refunded` without prematurely closing order status.

### 11.7 Cancel Order
* **Endpoint:** `POST /api/admin/orders/:id/cancel`
* **Permission:** `orders.cancel`
* **Body:**
  ```json
  {
    "reason": "Customer requested order cancellation prior to dispatch"
  }
  ```
* Rejects cancellation if order is already cancelled, refunded, or delivered.

---

## 📊 12. Admin Dashboard & Analytics (`/api/admin/dashboard`)

### 12.1 Get Sales & Operational Dashboard Metrics
* **Endpoint:** `GET /api/admin/dashboard`
* **Permission:** `analytics.view` (Super Admin, Store Manager, Sales & Fulfillment)
* **Query Parameters:**
  * `period` *(optional)*: `'today' | 'week' | 'month' | 'year' | 'all' | 'custom'` (Default: `'week'`)
  * `from` *(optional)*: Start date for custom ranges (`YYYY-MM-DD` or ISO 8601 string)
  * `to` *(optional)*: End date for custom ranges (`YYYY-MM-DD` or ISO 8601 string)
* **Response (200 OK):**
  ```json
  {
    "period": "week",
    "from": "2026-09-27T00:00:00.000Z",
    "to": "2026-10-04T23:59:59.999Z",
    "kpis": {
      "revenue": {
        "value": 12450.00,
        "previous_value": 9800.00,
        "delta_pct": 27,
        "is_positive": true,
        "sparkline": [1200, 1500, 1800, 2100, 1950, 2300, 1600]
      },
      "orders": {
        "value": 42,
        "completed": 35,
        "pending": 5,
        "cancelled": 2,
        "previous_value": 32,
        "delta_pct": 31,
        "is_positive": true,
        "sparkline": [4, 6, 8, 7, 5, 8, 4]
      },
      "aov": {
        "value": 296.43,
        "previous_value": 306.25,
        "delta_pct": 3,
        "is_positive": false,
        "sparkline": [300, 250, 225, 300, 390, 287.5, 400]
      },
      "customers": {
        "value": 38,
        "total_registered": 1420,
        "previous_value": 30,
        "delta_pct": 27,
        "is_positive": true,
        "sparkline": [4, 6, 7, 6, 5, 7, 3]
      }
    },
    "trends": [
      { "date": "2026-09-27T00:00:00.000Z", "label": "Sun, Sep 27", "revenue": 1200, "orders": 4 }
    ],
    "top_products": [
      {
        "id": 12,
        "name": "Mid-Century Modern Velvet Armchair",
        "slug": "mid-century-modern-velvet-armchair",
        "image": "https://images.unsplash.com/photo-...",
        "units_sold": 18,
        "orders_count": 14,
        "revenue": 5382.00
      }
    ],
    "recent_orders": [
      {
        "id": "uuid",
        "status": "paid",
        "total_amount": 899.00,
        "customer_email": "john@example.com",
        "customer_name": "John Doe",
        "city": "Seattle",
        "phone": "+1234567890",
        "payment_method": "stripe",
        "payment_status": "completed",
        "shipment_status": "pending",
        "tracking_number": null,
        "carrier": null,
        "items_count": 2,
        "created_at": "2026-09-30T14:20:00.000Z"
      }
    ],
    "catalog": {
      "total_products": 150,
      "active_products": 142,
      "inventory_value": 4500000,
      "out_of_stock": [],
      "low_stock": []
    },
    "operations_queue": {
      "awaiting_fulfillment": 8,
      "active_carts": 19,
      "total_reviews": 84,
      "store_rating": 4.8
    },
    "top_coupons": [
      { "id": "uuid", "code": "WELCOME10", "uses": 12, "total_discount": 240.00 }
    ],
    "customer_acquisition": {
      "new_customers": 28,
      "returning_customers": 10,
      "guest_orders": 4,
      "new_pct": 67,
      "returning_pct": 24,
      "guest_pct": 10
    }
  }
  ```

---

## 👥 13. Admin Customers Directory & Profile Management (`/api/admin/customers`)

### 13.1 List Customers with Segmentation, Search & Metrics
* **Endpoint:** `GET /api/admin/customers`
* **Permission:** `customers.read`
* **Query Parameters:**
  * `page` *(optional)*: Page number (Default: `1`)
  * `limit` *(optional)*: Items per page (Default: `25`, Max: `100`)
  * `search` *(optional)*: Match email, name, phone (with fuzzy formatting support), city, state, or user UUID
  * `segment` *(optional)*: `'all' | 'high_value' | 'returning' | 'new' | 'inactive' | 'no_orders'`
  * `status` *(optional)*: `'all' | 'active' | 'disabled'`
  * `sortBy` *(optional)*: `'joined' | 'total_spent' | 'orders' | 'name' | 'last_order'`
  * `sortDir` *(optional)*: `'asc' | 'desc'`
* **Response (200 OK):**
  ```json
  {
    "metrics": {
      "total_customers": 450,
      "new_customers_30d": 38,
      "active_customers": 210,
      "returning_customers": 140,
      "high_value_customers": 25,
      "total_revenue": 145200.00,
      "average_order_value": 320.50
    },
    "customers": [
      {
        "id": "uuid",
        "email": "customer@example.com",
        "name": "Jane Doe",
        "first_name": "Jane",
        "last_name": "Doe",
        "phone": "+1234567890",
        "status": "ACTIVE",
        "is_active": true,
        "role": "customer",
        "total_orders": 4,
        "total_spent": 1280.00,
        "average_order_value": 320.00,
        "last_order_date": "2026-09-28T12:00:00.000Z",
        "city": "San Francisco",
        "state": "CA",
        "segment": "Returning",
        "created_at": "2026-01-15T09:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 450,
      "total_pages": 18,
      "has_next_page": true,
      "has_prev_page": false
    }
  }
  ```

### 13.2 Get Customer Profile & Detailed History
* **Endpoint:** `GET /api/admin/customers/:id`
* **Permission:** `customers.read`
* **Response (200 OK):**
  ```json
  {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "name": "Jane Doe",
      "first_name": "Jane",
      "last_name": "Doe",
      "phone_number": "+1234567890",
      "phone": "+1234567890",
      "status": "ACTIVE",
      "is_active": true,
      "role": "customer",
      "segment": "Returning",
      "created_at": "2026-01-15T09:30:00.000Z",
      "updated_at": "2026-09-28T12:00:00.000Z"
    },
    "stats": {
      "total_orders": 4,
      "total_spent": 1280.00,
      "average_order_value": 320.00,
      "cart_items_count": 2,
      "wishlist_items_count": 5,
      "reviews_count": 2
    },
    "addresses": [
      {
        "id": "uuid",
        "address_line_1": "123 Main St",
        "address_line_2": "Apt 4B",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "USA",
        "is_default": true,
        "created_at": "2026-01-15T09:35:00.000Z"
      }
    ],
    "orders": [
      {
        "id": "uuid",
        "status": "delivered",
        "total_amount": 320.00,
        "city": "San Francisco",
        "state": "CA",
        "created_at": "2026-09-28T12:00:00.000Z"
      }
    ],
    "reviews": []
  }
  ```

### 13.3 Update Customer Profile
* **Endpoint:** `PUT /api/admin/customers/:id`
* **Permission:** `customers.write`
* **Body:**
  ```json
  {
    "phone_number": "+19876543210",
    "is_active": true
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Customer updated successfully",
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "phone_number": "+19876543210",
      "is_active": true,
      "status": "ACTIVE",
      "updated_at": "2026-09-30T15:00:00.000Z"
    }
  }
  ```

### 13.4 Toggle Customer Active Status
* **Endpoint:** `POST /api/admin/customers/:id/toggle-status`
* **Permission:** `customers.write`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "is_active": false,
    "message": "Customer account disabled successfully",
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "phone_number": "+19876543210",
      "is_active": false,
      "status": "DISABLED",
      "updated_at": "2026-09-30T15:05:00.000Z"
    }
  }
  ```

### 13.5 Delete Customer (Safe Cascading Cleanup)
* **Endpoint:** `DELETE /api/admin/customers/:id`
* **Permission:** `customers.delete`
* **Description:** Safely unlinks and cleans up child foreign key references across orders, payments, shipments, return requests, refunds, coupons, reviews, carts, and wishlists before deleting the user account.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Customer customer@example.com deleted successfully"
  }
  ```

---

## 🛡️ 14. Admin Team & Role-Based Access Control (RBAC) (`/api/admin/team`)

### 14.1 Get Role Presets & Granular Permissions Dictionary
* **Endpoint:** `GET /api/admin/team/roles`
* **Permission:** `admins.manage` (Super Admin)
* **Response (200 OK):**
  ```json
  {
    "presets": {
      "super_admin": {
        "id": "super_admin",
        "name": "Super Admin",
        "description": "Unrestricted full access across all store operations, financials, staff, and settings.",
        "badgeColor": "bg-rose-50 text-rose-700 border-rose-200",
        "permissions": ["orders.read", "orders.write", "orders.fulfill", "orders.cancel", "orders.refund", "products.read", "products.write", "products.delete", "products.bulk", "inventory.manage", "categories.manage", "customers.read", "customers.write", "customers.delete", "marketing.coupons", "reviews.read", "reviews.write", "reviews.delete", "media.manage", "analytics.view", "admins.manage", "settings.manage"]
      },
      "store_manager": { ... },
      "sales_fulfillment": { ... },
      "customer_support": { ... },
      "catalog_inventory": { ... },
      "custom": { ... }
    },
    "permissions": {
      "orders.read": "View customer orders, details, status history and receipts",
      "orders.write": "Update order status and customer shipping details",
      "orders.fulfill": "Manage shipments, carrier assignments, and tracking info",
      "orders.cancel": "Cancel pending or processing orders",
      "orders.refund": "Issue order refunds and manage return requests",
      "products.read": "View full catalog products, taxonomy, and pricing",
      "products.write": "Create and update products, images, and color variants",
      "products.delete": "Delete or archive catalog products",
      "products.bulk": "Perform bulk operations on catalog products",
      "inventory.manage": "Monitor stock levels and out of stock warnings",
      "categories.manage": "Manage categories, spaces, styles, rooms, and materials",
      "customers.read": "View customer directory, spending metrics, and order history",
      "customers.write": "Edit customer accounts and toggle active/disabled status",
      "customers.delete": "Delete or permanently purge customer data",
      "marketing.coupons": "Create, edit, toggle, and delete coupon codes",
      "reviews.read": "View customer ratings and product reviews",
      "reviews.write": "Create, edit, and moderate reviews",
      "reviews.delete": "Delete spam or inappropriate reviews",
      "media.manage": "Upload, manage, link, and audit product images and assets",
      "analytics.view": "View sales dashboard KPIs, revenue trends, and operational summaries",
      "admins.manage": "Invite admin team members, assign roles, and configure permissions",
      "settings.manage": "Configure store settings and operational policies"
    }
  }
  ```

### 14.2 List Team Members & Pending Invitations
* **Endpoint:** `GET /api/admin/team`
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
        "email": "staff@spacefurnio.in",
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

### 14.3 Invite Team Member
* **Endpoint:** `POST /api/admin/team/invite`
* **Permission:** `admins.manage` (Super Admin)
* **Body:**
  ```json
  {
    "email": "sarah@spacefurnio.in",
    "name": "Sarah Connor",
    "role": "catalog_inventory"
  }
  ```
* Generates a 24-hour cryptographic token, hashes and records it in `admin_invitations`, dispatches an invitation email via Resend (if configured), and returns the setup URL.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Invitation generated for sarah@spacefurnio.in",
    "invitation": {
      "id": "uuid",
      "email": "sarah@spacefurnio.in",
      "name": "Sarah Connor",
      "role": "catalog_inventory",
      "expires_at": "2026-10-01T12:00:00.000Z"
    },
    "setup_url": "https://spacefurnio.in/admin/setup?token=...&email=sarah%40spacefurnio.in",
    "raw_token": "..."
  }
  ```

### 14.4 Accept Invitation & Set Password (Public)
* **Endpoint:** `POST /api/admin/team/accept-invite`
* **Authentication:** Public (Token-based)
* **Body:**
  ```json
  {
    "token": "raw_invitation_token",
    "password": "SecurePassword123!"
  }
  ```
* Hashes password with PBKDF2 (100,000 iterations), creates or activates user account, assigns the specified admin role in `user_roles`, initializes cart & wishlist records, and marks the invitation as accepted.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Account set up successfully! You can now log in.",
    "user": {
      "id": "uuid",
      "email": "sarah@spacefurnio.in",
      "role": "catalog_inventory"
    }
  }
  ```

### 14.5 Update Team Member Role & Status
* **Endpoint:** `PUT /api/admin/team/:id`
* **Permission:** `admins.manage` (Super Admin)
* **Body:**
  ```json
  {
    "role": "store_manager",
    "is_active": true
  }
  ```
* **Security Policies Enforced (`canModifyAdmin`):**
  * Super Admins cannot deactivate their own accounts (`403 Forbidden`).
  * Super Admins cannot demote their own Super Admin role (`403 Forbidden`).
  * Last active Super Admin cannot be deactivated or demoted (`403 Forbidden`).
  * Non-Super Admins cannot modify Super Admin accounts (`403 Forbidden`).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Team member updated successfully"
  }
  ```

### 14.6 Revoke Admin Member Privileges
* **Endpoint:** `DELETE /api/admin/team/:id`
* **Permission:** `admins.manage` (Super Admin)
* **Security Policies Enforced:**
  * Self-revocation is strictly blocked (`403 Forbidden`).
  * Revoking the last active Super Admin is strictly blocked (`403 Forbidden`).
  * Only Super Admins can revoke other Super Admin accounts.
  * Resets role in `user_roles` to `'customer'`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Admin privileges revoked for sarah@spacefurnio.in"
  }
  ```

### 14.7 Revoke Pending Invitation
* **Endpoint:** `DELETE /api/admin/team/invite/:inviteId`
* **Permission:** `admins.manage` (Super Admin)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Invitation for sarah@spacefurnio.in revoked"
  }
  ```

---

## ⭐ 15. Admin Reviews & Feedback Moderation (`/api/admin/reviews`)

### 15.1 List Reviews with Overall Metrics, Filters, Sorting & Pagination
* **Endpoint:** `GET /api/admin/reviews`
* **Permission:** `reviews.read`
* **Query Parameters:**
  * `page` *(optional)*: Page number (Default: `1`)
  * `limit` *(optional)*: Items per page (Default: `25`, Max: `100`)
  * `search` *(optional)*: Match comment, title, author name, or user email
  * `rating` *(optional)*: Filter by exact star rating (`1` to `5`)
  * `product_id` *(optional)*: Filter by numeric product ID
  * `verified_only` *(optional)*: `true` to return verified buyer reviews only
  * `sort` *(optional)*: `'newest' | 'oldest' | 'rating_desc' | 'rating_asc'` (Default: `'newest'`)
* **Response (200 OK):**
  ```json
  {
    "stats": {
      "total_reviews": 84,
      "average_rating": 4.8,
      "verified_count": 72,
      "rating_breakdown": {
        "5": 65,
        "4": 12,
        "3": 5,
        "2": 1,
        "1": 1
      }
    },
    "reviews": [
      {
        "id": "uuid",
        "product_id": 12,
        "product": {
          "name": "Mid-Century Modern Velvet Armchair",
          "slug": "mid-century-modern-velvet-armchair",
          "image": "https://images.unsplash.com/photo-..."
        },
        "user_id": "uuid",
        "user_email": "jane@example.com",
        "author_name": "Jane Doe",
        "rating": 5,
        "title": "Outstanding quality!",
        "comment": "The craftsmanship on this piece is breathtaking.",
        "is_verified_purchase": true,
        "created_at": "2026-09-30T14:20:00.000Z",
        "updated_at": "2026-09-30T14:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 84,
      "total_pages": 4,
      "has_next_page": true,
      "has_prev_page": false
    }
  }
  ```

### 15.2 Get Single Review by ID
* **Endpoint:** `GET /api/admin/reviews/:id`
* **Permission:** `reviews.read`
* **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "product_id": 12,
    "user_id": "uuid",
    "user_email": "jane@example.com",
    "author_name": "Jane Doe",
    "rating": 5,
    "title": "Outstanding quality!",
    "comment": "The craftsmanship on this piece is breathtaking.",
    "is_verified_purchase": true,
    "created_at": "2026-09-30T14:20:00.000Z",
    "updated_at": "2026-09-30T14:20:00.000Z",
    "product": {
      "id": 12,
      "name": "Mid-Century Modern Velvet Armchair",
      "slug": "mid-century-modern-velvet-armchair",
      "image_src": "https://images.unsplash.com/photo-..."
    }
  }
  ```

### 15.3 Create / Import Review (Admin)
* **Endpoint:** `POST /api/admin/reviews`
* **Permission:** `reviews.write`
* **Body:**
  ```json
  {
    "product_id": 12,
    "rating": 5,
    "comment": "Exceptional build quality.",
    "title": "Great purchase",
    "author_name": "Jane Reviewer",
    "is_verified_purchase": true,
    "user_id": null
  }
  ```
* Automatically recalculates and updates `rating` and `review_count` on the `products` table in the catalog database.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Review created successfully",
    "review": {
      "id": "uuid",
      "product_id": 12,
      "rating": 5,
      "comment": "Exceptional build quality.",
      "title": "Great purchase",
      "author_name": "Jane Reviewer",
      "is_verified_purchase": true,
      "created_at": "2026-09-30T14:20:00.000Z",
      "updated_at": "2026-09-30T14:20:00.000Z"
    }
  }
  ```

### 15.4 Update Review
* **Endpoint:** `PUT /api/admin/reviews/:id`
* **Permission:** `reviews.write`
* **Body:**
  ```json
  {
    "rating": 4,
    "title": "Updated Review Title",
    "comment": "Updated review comment body.",
    "author_name": "Jane D.",
    "is_verified_purchase": true
  }
  ```
* Automatically recalculates and syncs the product's `rating` in the catalog database.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Review updated successfully",
    "review": { ... }
  }
  ```

### 15.5 Delete Review
* **Endpoint:** `DELETE /api/admin/reviews/:id`
* **Permission:** `reviews.delete`
* **Description:** Deletes the specified review record, recalculates the product's average rating and review count, and updates the products catalog database. If no reviews remain for the product, resets `rating` to `0.0` and `review_count` to `0`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Review deleted successfully"
  }
  ```

---

## 🎟️ 16. Admin Coupons & Promotions Management (`/api/admin/coupons`)

### 16.1 Get Coupon Summary Stats
* **Endpoint:** `GET /api/admin/coupons/stats`
* **Permission:** `marketing.coupons`
* **Description:** Aggregates overall coupon metrics including total count, active, inactive, expired, total redemptions count, and sum of total discounts granted.
* **Response (200 OK):**
  ```json
  {
    "total_coupons": 12,
    "active_coupons": 8,
    "inactive_coupons": 2,
    "expired_coupons": 2,
    "total_redemptions": 145,
    "total_discount_given": 24500.50
  }
  ```

### 16.2 List & Filter Coupons
* **Endpoint:** `GET /api/admin/coupons`
* **Permission:** `marketing.coupons`
* **Query Parameters:**
  * `page` *(optional)*: Page number (Default: `1`)
  * `limit` *(optional)*: Items per page (Default: `25`, Max: `100`)
  * `search` *(optional)*: Matches code or description (case-insensitive)
  * `status` *(optional)*: `'all' | 'active' | 'inactive' | 'expired'` (Default: `'all'`)
  * `sort` *(optional)*: `'newest' | 'oldest' | 'code_asc' | 'code_desc' | 'uses_desc' | 'uses_asc' | 'discount_desc' | 'discount_asc'` (Default: `'newest'`)
* **Response (200 OK):**
  ```json
  {
    "coupons": [
      {
        "id": "uuid",
        "code": "PROMO20",
        "description": "20% off festival discount",
        "discount_type": "percentage",
        "discount_value": 20,
        "discount_formatted": "20%",
        "is_active": true,
        "status": "ACTIVE",
        "expires_at": "2026-12-31T23:59:59.000Z",
        "redemptions_count": 42,
        "total_discount_applied": 8400.00,
        "created_at": "2026-09-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 12,
      "total_pages": 1,
      "has_next_page": false,
      "has_prev_page": false
    }
  }
  ```

### 16.3 Get Single Coupon Detail & Redemption History
* **Endpoint:** `GET /api/admin/coupons/:id`
* **Permission:** `marketing.coupons`
* **Description:** Retrieves full configuration of a coupon, computed status, overall redemption metrics, and the latest 50 redemption history records with user and order details.
* **Response (200 OK):**
  ```json
  {
    "coupon": {
      "id": "uuid",
      "code": "PROMO20",
      "description": "20% off festival discount",
      "discount_type": "percentage",
      "discount_value": 20,
      "discount_formatted": "20%",
      "is_active": true,
      "status": "ACTIVE",
      "expires_at": "2026-12-31T23:59:59.000Z",
      "created_at": "2026-09-30T10:00:00.000Z"
    },
    "stats": {
      "total_redemptions": 42,
      "total_discount_given": 8400.00
    },
    "redemptions": [
      {
        "id": "uuid",
        "order_id": "uuid",
        "user_id": "uuid",
        "user_email": "customer@example.com",
        "discount_applied": 200.00,
        "order_total": 1000.00,
        "order_status": "completed",
        "created_at": "2026-09-30T12:00:00.000Z"
      }
    ]
  }
  ```

### 16.4 Create Coupon
* **Endpoint:** `POST /api/admin/coupons`
* **Permission:** `marketing.coupons`
* **Body:**
  ```json
  {
    "code": "FESTIVE500",
    "description": "Flat ₹500 off on orders",
    "discount_type": "fixed_amount",
    "discount_value": 500,
    "is_active": true,
    "expires_at": "2026-12-31T23:59:59.000Z"
  }
  ```
* **Validation Rules:**
  * `code`: Required, trimmed, automatically converted to uppercase.
  * `discount_type`: Must be `'percentage'` or `'fixed_amount'`.
  * `discount_value`: Positive number required. Percentage cannot exceed `100%`.
  * Duplicate code returns `409 Conflict`.
  * Invalid date formats return `400 Bad Request`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Coupon created successfully",
    "coupon": { ... }
  }
  ```

### 16.5 Update Coupon
* **Endpoint:** `PUT /api/admin/coupons/:id`
* **Permission:** `marketing.coupons`
* **Body:**
  ```json
  {
    "code": "FESTIVE600",
    "description": "Updated promo",
    "discount_value": 600,
    "is_active": true,
    "expires_at": null
  }
  ```
* **Validation Rules:**
  * Validates UUID (returns `404 Not Found` for invalid/non-existent UUID).
  * Validates percentage cap `100%` and positive values.
  * Prevents collision with existing coupon codes (`409 Conflict`).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Coupon updated successfully",
    "coupon": { ... }
  }
  ```

### 16.6 Quick Toggle Active Status
* **Endpoint:** `PATCH /api/admin/coupons/:id/toggle`
* **Permission:** `marketing.coupons`
* **Description:** Toggles coupon active status between `true` and `false`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "is_active": false,
    "message": "Coupon \"FESTIVE600\" deactivated successfully",
    "coupon": { ... }
  }
  ```

### 16.7 Safe Delete Coupon
* **Endpoint:** `DELETE /api/admin/coupons/:id`
* **Permission:** `marketing.coupons`
* **Description:** Safely deletes the coupon and cleans up all associated `coupon_redemptions` records to maintain referential integrity.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Coupon \"FESTIVE600\" deleted successfully"
  }
  ```

---

## 🖼️ 17. Admin Media & Image Asset Management (`/api/admin/images`)

### 17.1 Image Audit & Health Summary
* **Endpoint:** `GET /api/admin/images/audit`
* **Permission:** `media.manage`
* **Description:** Provides catalog-wide image health metrics including total products, products with images, products missing images count, missing alt text counts, duplicate image URLs across products, and the latest 100 media assets.
* **Response (200 OK):**
  ```json
  {
    "summary": {
      "total_products": 45,
      "products_with_images": 42,
      "products_missing_images_count": 3,
      "total_images": 180,
      "primary_images": 42,
      "missing_alt_count": 5,
      "duplicate_url_count": 2
    },
    "missing_images": [
      {
        "id": 15,
        "name": "Minimalist Teak Side Table",
        "slug": "minimalist-teak-side-table",
        "brand": "SpaceFurnio Originals"
      }
    ],
    "duplicates": [
      {
        "src": "https://images.unsplash.com/photo-example.jpg",
        "usage_count": 3,
        "product_ids": [12, 14, 19]
      }
    ],
    "recent_assets": [
      {
        "id": 101,
        "product_id": 12,
        "src": "https://images.unsplash.com/photo-example.jpg",
        "alt": "Teak Wood Chair Front View",
        "sort_order": 0,
        "is_primary": true,
        "created_at": "2026-09-30T10:00:00.000Z"
      }
    ]
  }
  ```

### 17.2 List & Search Product Images
* **Endpoint:** `GET /api/admin/images`
* **Permission:** `media.manage`
* **Query Parameters:**
  * `page` *(optional)*: Page number (Default: `1`)
  * `limit` *(optional)*: Items per page (Default: `25`, Max: `100`)
  * `search` *(optional)*: Search query matching `src`, `alt`, or product name
  * `product_id` *(optional)*: Filter images belonging to a specific product
  * `primary_only` *(optional)*: `true` to filter only primary images
* **Response (200 OK):**
  ```json
  {
    "images": [
      {
        "id": 101,
        "product_id": 12,
        "product_name": "Mid-Century Oak Desk",
        "product_slug": "mid-century-oak-desk",
        "src": "https://images.unsplash.com/photo-desk.jpg",
        "alt": "Oak Desk Studio Shot",
        "sort_order": 0,
        "is_primary": true,
        "created_at": "2026-09-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 180,
      "total_pages": 8,
      "has_next_page": true,
      "has_prev_page": false
    }
  }
  ```

### 17.3 Upload / Import Image
* **Endpoint:** `POST /api/admin/images/upload`
* **Permission:** `media.manage`
* **Content-Types Supported:** `application/json` and `multipart/form-data`
* **JSON Body:**
  ```json
  {
    "src": "https://images.unsplash.com/photo-new.jpg",
    "product_id": 12,
    "alt": "Desk Side Profile",
    "sort_order": 1,
    "is_primary": false
  }
  ```
* **Multipart Form Fields:** `file` (binary), `url` (optional string), `product_id` (optional number), `alt` (optional string), `is_primary` (optional boolean string), `sort_order` (optional number)
* **Automatic Primary Election:**
  * If `product_id` is specified and the product has 0 existing images, the uploaded image is automatically elected as `is_primary = true`.
  * If `is_primary: true` is explicitly provided, any prior primary image for the product is automatically demoted to `is_primary = false`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Image uploaded successfully",
    "url": "https://images.unsplash.com/photo-new.jpg",
    "record": {
      "id": 102,
      "product_id": 12,
      "src": "https://images.unsplash.com/photo-new.jpg",
      "alt": "Desk Side Profile",
      "sort_order": 1,
      "is_primary": false,
      "created_at": "2026-09-30T12:00:00.000Z"
    }
  }
  ```

### 17.4 Link Existing Image URL to Product
* **Endpoint:** `POST /api/admin/images/link`
* **Permission:** `media.manage`
* **Body:**
  ```json
  {
    "product_id": 12,
    "src": "https://images.unsplash.com/photo-linked.jpg",
    "alt": "Desk Detail Shot",
    "sort_order": 2,
    "is_primary": false
  }
  ```
* **Validation & Primary Handling:**
  * Validates numeric `product_id` and non-empty `src`.
  * Automatically sets `is_primary = true` if the product has no images yet.
  * If `is_primary: true`, demotes other images for this product.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Image linked to product successfully",
    "image": {
      "id": 103,
      "product_id": 12,
      "src": "https://images.unsplash.com/photo-linked.jpg",
      "alt": "Desk Detail Shot",
      "sort_order": 2,
      "is_primary": false,
      "created_at": "2026-09-30T12:05:00.000Z"
    }
  }
  ```

### 17.5 Update Image Metadata
* **Endpoint:** `PUT /api/admin/images/:id`
* **Permission:** `media.manage`
* **Body:**
  ```json
  {
    "alt": "Updated High Res Alt Description",
    "sort_order": 0,
    "is_primary": true,
    "src": "https://images.unsplash.com/photo-updated.jpg"
  }
  ```
* **Primary Uniqueness Handling:** Setting `is_primary: true` automatically unsets `is_primary` on all other images belonging to the same product.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Image updated successfully",
    "image": {
      "id": 103,
      "product_id": 12,
      "src": "https://images.unsplash.com/photo-updated.jpg",
      "alt": "Updated High Res Alt Description",
      "sort_order": 0,
      "is_primary": true,
      "created_at": "2026-09-30T12:05:00.000Z"
    }
  }
  ```

---

## 🛋️ 18. Admin Products Catalog Management (`/api/admin/products`)

### 18.1 Get Catalog Lookups & Taxonomies
* **Endpoint:** `GET /api/admin/products/lookups`
* **Permission:** `products.read`
* **Response (200 OK):** Returns all available `categories`, `spaces`, `styles`, `rooms`, `materials`, `brands`, `colors`, and `listing_types` for administrative form builders and filters.

### 18.2 List & Filter Catalog Products
* **Endpoint:** `GET /api/admin/products`
* **Permission:** `products.read`
* **Query Parameters:** `page`, `limit`, `search`, `category`, `brand`, `space`, `style`, `room`, `material`, `listing_type`, `min_price`, `max_price`, `sort` (`newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`, `rating`, `popularity`).

### 18.3 Get Single Product Detail
* **Endpoint:** `GET /api/admin/products/:id` (by numeric ID or unique slug)
* **Permission:** `products.read`
* **Response (200 OK):** Product record enriched with brand, category, spaces, styles, rooms, materials, full multi-image array with primary image flags, and color variant mappings.

### 18.4 Create Product
* **Endpoint:** `POST /api/admin/products`
* **Permission:** `products.write`
* **Body:**
  ```json
  {
    "name": "Mid-Century Walnut Credenza",
    "slug": "mid-century-walnut-credenza",
    "description": "Hand-finished walnut storage credenza",
    "price_cents": 125000,
    "brand_id": 1,
    "category_id": 2,
    "space_id": 1,
    "style_id": 1,
    "room_id": 1,
    "material_id": 1,
    "listing_type": "category",
    "images": [
      { "src": "https://images.unsplash.com/photo-1", "alt": "Front View", "is_primary": true, "sort_order": 0 }
    ],
    "colors": [
      { "color_id": 1, "sort_order": 0 }
    ]
  }
  ```

### 18.5 Update Product
* **Endpoint:** `PUT /api/admin/products/:id`
* **Permission:** `products.write`
* **Description:** Supports partial updates, slug uniqueness checking with collision avoidance, setting optional foreign keys to `null`, and replacing relational images/colors.

### 18.6 Delete Product
* **Endpoint:** `DELETE /api/admin/products/:id`
* **Permission:** `products.delete`
* **Description:** Cascades deletion across `product_images`, `product_colors`, and `products`.

### 18.7 Bulk Operations
* **Endpoint:** `POST /api/admin/products/bulk`
* **Permission:** `products.bulk`
* **Body Actions:**
  * `delete`: `{ "action": "delete", "product_ids": [1, 2, 3] }`
  * `update_category`: `{ "action": "update_category", "product_ids": [1, 2], "category_id": 4 }`
  * `update_brand`: `{ "action": "update_brand", "product_ids": [1, 2], "brand_id": 2 }`
  * `update_space`: `{ "action": "update_space", "product_ids": [1, 2], "space_id": 1 }`
  * `update_style`: `{ "action": "update_style", "product_ids": [1, 2], "style_id": 2 }`

### 18.8 Bulk Product Upload & Import
* **Endpoint:** `POST /api/admin/products/bulk-upload`
* **Permission:** `products.bulk`
* **Description:** Imports arrays of product records. Automatically resolves or on-the-fly registers new brands, categories, spaces, styles, rooms, materials, and colors by name. Supports `dry_run: true` pre-flight validation and provides row-by-row error reporting.
* **Body:**
  ```json
  {
    "dry_run": false,
    "auto_create_lookups": true,
    "items": [
      {
        "name": "Nordic Solid Oak Dining Table",
        "description": "Seats up to 8 people with oiled matte finish.",
        "price_cents": 89000,
        "brand": "Nordic Craft",
        "category": "Dining Tables",
        "space": "Dining Space",
        "style": "Scandinavian Modern",
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
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "dry_run": false,
    "total": 1,
    "imported_count": 1,
    "failed_count": 0,
    "imported_products": [
      {
        "id": 105,
        "name": "Nordic Solid Oak Dining Table",
        "slug": "nordic-solid-oak-dining-table",
        "price_cents": 89000
      }
    ],
    "message": "Successfully imported 1 of 1 products"
  }
  ```

---

## 19. Content Management System (CMS) Endpoints

The CMS provides a Static Site Generation (SSG) staging workflow where content changes are authored in draft mode and atomically published to trigger storefront rebuilds.

### Public CMS Endpoints (`/api/cms`)

Public endpoints require no authentication and return only published content.

#### 19.1 Health Check
* **Endpoint:** `GET /api/cms/health`
* **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "module": "cms"
  }
  ```

#### 19.2 SSG Content Bundle
* **Endpoint:** `GET /api/cms/bundle`
* **Headers:** `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400`
* **Description:** Returns the aggregated published snapshot of all pages, active sections, and active policies for SSG prerendering and client-side hydration.
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
          "title": "Spacefurnio | Artisanal Modern Furniture",
          "description": "Architectural furniture made with sustainable timber."
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
              "cta": "Explore Catalog"
            },
            "publishedData": {
              "headline": "Crafted For Modern Sanctuaries",
              "cta": "Explore Catalog"
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
        "content": "# Privacy Policy\n\nSpacefurnio respects your privacy...",
        "publishedContent": "# Privacy Policy\n\nSpacefurnio respects your privacy...",
        "versionNum": 2,
        "publishedAt": "2026-11-06T14:00:00.000Z",
        "updatedAt": "2026-11-06T14:00:00.000Z"
      }
    ]
  }
  ```

#### 19.3 Get Single Published Page
* **Endpoint:** `GET /api/cms/pages/:slug`
* **Description:** Retrieves metadata and all active published sections for the specified page slug.
* **Response (200 OK):**
  ```json
  {
    "id": "e8e60408-724f-4a0b-a320-c75c8be0343a",
    "slug": "home",
    "title": "Home Page",
    "seoMetadata": {
      "title": "Spacefurnio | Artisanal Modern Furniture"
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
* **Response (404 Not Found):**
  ```json
  {
    "message": "Page not found"
  }
  ```

#### 19.4 List Published Policies
* **Endpoint:** `GET /api/cms/policies`
* **Description:** Returns an index of published policy documents with current version numbers.
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

#### 19.5 Get Single Published Policy Content
* **Endpoint:** `GET /api/cms/policies/:slug`
* **Description:** Retrieves full published Markdown content for a single policy by slug.
* **Response (200 OK):**
  ```json
  {
    "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "content": "# Privacy Policy\n\nSpacefurnio respects your privacy...",
    "publishedContent": "# Privacy Policy\n\nSpacefurnio respects your privacy...",
    "versionNum": 2,
    "publishedAt": "2026-11-06T14:00:00.000Z",
    "updatedAt": "2026-11-06T14:00:00.000Z"
  }
  ```
* **Response (404 Not Found):**
  ```json
  {
    "message": "Policy not found"
  }
  ```

---

### Admin CMS Endpoints (`/api/admin/cms`)

All admin endpoints require an administrative Bearer JWT token in the `Authorization` header.

#### 19.6 CMS Summary & Overview
* **Endpoint:** `GET /api/admin/cms/summary`
* **Permission:** `cms.read`
* **Description:** Returns dirty page and policy counts, last publish timestamp, and the latest storefront build dispatch status.
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
      "responseBody": "{\"job_id\":\"pages-build-12345\"}",
      "errorMessage": null,
      "startedAt": "2026-11-06T14:00:05.000Z",
      "completedAt": "2026-11-06T14:00:08.000Z",
      "triggeredByEmail": "admin@spacefurnio.com"
    }
  }
  ```

#### 19.7 List All Pages
* **Endpoint:** `GET /api/admin/cms/pages`
* **Permission:** `cms.read`
* **Description:** Lists all CMS pages with unpublished change status and summary section counts.
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
      "sectionCount": 2,
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

#### 19.8 Get Page Details with Sections
* **Endpoint:** `GET /api/admin/cms/pages/:slug`
* **Permission:** `cms.read`
* **Description:** Retrieves full page configuration including both draft and published data for all sections.
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

#### 19.9 Update Section Draft Content
* **Endpoint:** `PUT /api/admin/cms/pages/:slug/sections/:id`
* **Permission:** `cms.write`
* **Description:** Updates `draft_data` and visibility for a section, marks the parent page dirty (`has_unpublished_changes = true`), and records a snapshot in `cms_versions` (with 30-second deduplication).
* **Body:**
  ```json
  {
    "draftData": {
      "headline": "Brand New Draft Headline",
      "subtitle": "Curated for Modern Living"
    },
    "enabled": true,
    "changeSummary": "Updated hero banner headline and subtitle"
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
        "headline": "Brand New Draft Headline",
        "subtitle": "Curated for Modern Living"
      },
      "publishedData": {
        "headline": "Published Hero Headline"
      },
      "updatedAt": "2026-11-06T14:20:00.000Z"
    }
  }
  ```

#### 19.10 Reorder Sections
* **Endpoint:** `POST /api/admin/cms/pages/:slug/sections/reorder`
* **Permission:** `cms.write`
* **Description:** Updates `sort_order` sequence for child sections of a page and marks the page dirty.
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

#### 19.11 List Policies (Admin)
* **Endpoint:** `GET /api/admin/cms/policies`
* **Permission:** `cms.read`
* **Description:** Lists all policy documents with draft and published content, version numbers, and unpublished dirty flags.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
      "slug": "privacy-policy",
      "title": "Privacy Policy",
      "draftContent": "# Privacy Policy\n\nDraft content revisions...",
      "publishedContent": "# Privacy Policy\n\nLive published content...",
      "versionNum": 2,
      "hasUnpublishedChanges": true,
      "publishedAt": "2026-11-06T14:00:00.000Z",
      "updatedAt": "2026-11-06T14:25:00.000Z"
    }
  ]
  ```

#### 19.12 Get Single Policy (Admin)
* **Endpoint:** `GET /api/admin/cms/policies/:slug`
* **Permission:** `cms.read`
* **Response (200 OK):**
  ```json
  {
    "id": "5963f457-3f36-4d04-8cb9-bc1dfab2b304",
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "draftContent": "# Privacy Policy\n\nDraft content revisions...",
    "publishedContent": "# Privacy Policy\n\nLive published content...",
    "versionNum": 2,
    "hasUnpublishedChanges": true,
    "publishedAt": "2026-11-06T14:00:00.000Z",
    "updatedAt": "2026-11-06T14:25:00.000Z"
  }
  ```

#### 19.13 Create Policy
* **Endpoint:** `POST /api/admin/cms/policies`
* **Permission:** `cms.write`
* **Body:**
  ```json
  {
    "slug": "warranty-policy",
    "title": "Limited Lifetime Warranty",
    "draftContent": "# Warranty Policy\n\nCoverage details..."
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
      "draftContent": "# Warranty Policy\n\nCoverage details...",
      "publishedContent": "",
      "versionNum": 1,
      "hasUnpublishedChanges": true,
      "publishedAt": null,
      "updatedAt": "2026-11-06T14:30:00.000Z"
    }
  }
  ```

#### 19.14 Update Policy Draft
* **Endpoint:** `PUT /api/admin/cms/policies/:slug`
* **Permission:** `cms.write`
* **Body:**
  ```json
  {
    "title": "Updated Warranty Policy",
    "draftContent": "# Updated Policy Content",
    "changeSummary": "Updated frame warranty clauses"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "policy": {
      "id": "97e64432-8df7-463e-a1d2-0fb3db092289",
      "slug": "warranty-policy",
      "title": "Updated Warranty Policy",
      "draftContent": "# Updated Policy Content",
      "publishedContent": "",
      "versionNum": 1,
      "hasUnpublishedChanges": true,
      "publishedAt": null,
      "updatedAt": "2026-11-06T14:32:00.000Z"
    }
  }
  ```

#### 19.15 Delete Policy
* **Endpoint:** `DELETE /api/admin/cms/policies/:slug`
* **Permission:** `cms.write`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Policy deleted successfully"
  }
  ```

#### 19.16 Get Version Snapshots
* **Endpoint:** `GET /api/admin/cms/versions`
* **Permission:** `cms.read`
* **Query Parameters:**
  * `scope` (optional): Filter by scope (e.g., `home`, `policies`, `publish`).
  * `entityId` (optional): Filter by entity identifier (e.g., `home-hero`, `privacy-policy`).
* **Description:** Retrieves the latest 50 snapshot records with author details.
* **Response (200 OK):**
  ```json
  [
    {
      "id": 142,
      "scope": "home",
      "entityId": "home-hero",
      "versionNum": 4,
      "snapshot": {
        "draftData": { "headline": "Brand New Draft Headline" },
        "enabled": true,
        "sectionKey": "hero",
        "sortOrder": 0
      },
      "changeSummary": "Updated hero banner headline and subtitle",
      "fieldPath": null,
      "authorId": "8cf9a9cb-b286-4e5a-939e-d3a95c91b1d1",
      "authorEmail": "admin@spacefurnio.com",
      "createdAt": "2026-11-06T14:20:00.000Z"
    }
  ]
  ```

#### 19.17 Rollback Version
* **Endpoint:** `POST /api/admin/cms/versions/:id/rollback`
* **Permission:** `cms.write`
* **Description:** Restores a section draft or policy content to the specified snapshot version and records a new rollback audit entry.
* **Response (200 OK - Section Rollback):**
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
        "headline": "Brand New Draft Headline"
      },
      "publishedData": {
        "headline": "Published Hero Headline"
      },
      "updatedAt": "2026-11-06T14:35:00.000Z"
    }
  }
  ```

#### 19.18 Publish All Content
* **Endpoint:** `POST /api/admin/cms/publish`
* **Permission:** `cms.publish`
* **Description:** Promotes all draft content across sections and policies into published state, resets unpublished change flags, increments policy versions, and inserts a baseline record in `cms_versions`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "publishedAt": "2026-11-06T14:40:00.000Z",
    "message": "All storefront content published successfully"
  }
  ```

#### 19.19 Trigger Storefront Build
* **Endpoint:** `POST /api/admin/cms/build`
* **Permission:** `cms.publish`
* **Description:** Asynchronously dispatches the Cloudflare Pages deploy hook using `ctx.waitUntil` while enforcing a 60-second cooldown period.
* **Response (200 OK - Webhook Triggered):**
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
* **Response (429 Too Many Requests):**
  ```json
  {
    "message": "A storefront build was triggered less than 60 seconds ago. Please wait before triggering another build.",
    "cooldownRemainingSeconds": 45
  }
  ```

#### 19.20 Publish and Build ("Update Site")
* **Endpoint:** `POST /api/admin/cms/publish-and-build`
* **Permission:** `cms.publish`
* **Description:** Composite action that atomically publishes all pending draft content and triggers the storefront build deploy hook.
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

#### 19.21 List Build Events
* **Endpoint:** `GET /api/admin/cms/build-events`
* **Permission:** `cms.read`
* **Description:** Returns the 20 most recent deploy events with initiator details, masked webhook URLs, and HTTP response codes.
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

