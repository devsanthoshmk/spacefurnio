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
