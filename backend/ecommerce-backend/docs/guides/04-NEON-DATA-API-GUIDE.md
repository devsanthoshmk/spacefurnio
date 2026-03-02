# Guide 04 — Neon Data API (PostgREST): Frontend Direct Database Access

> **Data API Type:** Neon-managed PostgREST  
> **Access Model:** Browser → HTTPS → Neon Data API → PostgreSQL (RLS-filtered)  
> **Authentication:** RS256 JWT Bearer Token (issued by Cloudflare Worker)  
> **Base URL:** `https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/`

---

## Table of Contents

1. [What Is the Neon Data API?](#1-what-is-the-neon-data-api)
2. [When to Use the Data API (Non-Sensitive Layer)](#2-when-to-use-the-data-api-non-sensitive-layer)
3. [Authentication Flow](#3-authentication-flow)
4. [Request Structure](#4-request-structure)
5. [Reading Data: Cart & Wishlist](#5-reading-data-cart--wishlist)
6. [Writing Data: Add to Cart](#6-writing-data-add-to-cart)
7. [Reading Orders (Read-Only)](#7-reading-orders-read-only)
8. [Reading User Addresses](#8-reading-user-addresses)
9. [Reading Products (Public Catalog)](#9-reading-products-public-catalog)
10. [Reading Reviews](#10-reading-reviews)
11. [Filtering, Sorting & Pagination](#11-filtering-sorting--pagination)
12. [Error Handling](#12-error-handling)
13. [Security Boundaries — What's Blocked](#13-security-boundaries--whats-blocked)
14. [Building a JavaScript Client](#14-building-a-javascript-client)

---

## 1. What Is the Neon Data API?

The Neon Data API is a **PostgREST-compatible REST API** that Neon automatically generates from your PostgreSQL schema. It exposes every table you've granted access to as RESTful HTTP endpoints.

```
Table: carts
→ Endpoint: GET /rest/v1/carts
→ Endpoint: POST /rest/v1/carts
→ Endpoint: PATCH /rest/v1/carts?id=eq.<uuid>
→ Endpoint: DELETE /rest/v1/carts?id=eq.<uuid>
```

The key differentiator vs a traditional REST API: **there is no application code.** The API is generated directly from your schema + RLS policies. The JWT from your Worker login is the only thing needed to authenticate.

---

## 2. When to Use the Data API (Non-Sensitive Layer)

Use the Neon Data API from the **browser** for these operations:

| Operation | Table | Method | Notes |
|---|---|---|---|
| Get user's cart | `carts`, `cart_items` | `GET` | RLS filters to own cart automatically |
| Add item to cart | `cart_items` | `POST` | |
| Update cart item quantity | `cart_items` | `PATCH` | |
| Remove item from cart | `cart_items` | `DELETE` | |
| View wishlist | `wishlists`, `wishlist_items` | `GET` | |
| Add to wishlist | `wishlist_items` | `POST` | |
| Remove from wishlist | `wishlist_items` | `DELETE` | |
| View own orders | `orders`, `order_items` | `GET` | Read-only; RLS blocks writes |
| View user addresses | `user_addresses` | `GET` | |
| Add/update address | `user_addresses` | `POST`, `PATCH` | |
| Browse products | [Separate Project] | `GET` | Catalog project: `icy-union-81751721` |
| Read product reviews | [Separate Project] | `GET` | Catalog project: `icy-union-81751721` |
| Submit a review | [Separate Project] | `POST` | Catalog project: `icy-union-81751721` |

**Never use the Data API for:**
- `POST /orders` — Creating orders (use `/api/orders/checkout` on the Worker)
- Any write to `payments`, `refunds`, `shipments` 
- Any write to `users` (use Worker auth routes)
- Any access to `audit_logs`, `user_sessions`, `user_roles`

---

## 3. Authentication Flow

```
1. Browser: POST /auth/login → { email, password }
           ↓
2. Worker: Validates credentials, generates RS256 JWT
           ↓
3. Browser: Receives JWT { token: "eyJ..." }
           ↓
4. Browser: Stores JWT (sessionStorage or memory — NOT localStorage)
           ↓
5. Browser: Makes Data API request with Authorization: Bearer <token>
           ↓
6. Neon: Validates JWT against JWKS URL → extracts sub (user UUID)
          ↓
7. PostgreSQL: Sets current_setting('request.jwt.claim.sub') = user.id
               ↓
8. PostgreSQL: Evaluates RLS policies → returns only rows where user_id = sub
```

### Getting a Token

```javascript
// Step 1: Login via the Worker to get a JWT
const loginResponse = await fetch('https://<worker-url>/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

const { token } = await loginResponse.json();
// token = "eyJhbGciOiJSUzI1NiIsImtpZCI6Im5lb24..."
```

---

## 4. Request Structure

### Standard Headers (Required for Every Data API Request)

```javascript
const NEON_DATA_API_BASE = 'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1';
const NEON_CONNECTION_STRING = 'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const apiHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'neon-connection-string': NEON_CONNECTION_STRING,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',  // Makes POST/PATCH return the affected row
});
```

> **`neon-connection-string` header:** This tells the Neon Data API which role and database to use. We specify the `authenticator` role here — never the `neondb_owner` connection string. This is what enforces RLS.

---

## 5. Reading Data: Cart & Wishlist

### Get User's Cart

```javascript
// The RLS policy automatically filters to the logged-in user's cart
const response = await fetch(`${NEON_DATA_API_BASE}/carts`, {
    headers: apiHeaders(token),
});
const [cart] = await response.json(); // Returns array; user has one cart
```

### Get Cart Items With Product Info (Select & Join)

```javascript
// PostgREST supports embedded resources (foreign key joins)
const response = await fetch(`${NEON_DATA_API_BASE}/cart_items?select=id,quantity,price_snapshot,products(id,name,price,slug)`, {
    headers: apiHeaders(token),
});
const cartItems = await response.json();
```

> `products(id,name,price,slug)` is PostgREST syntax for an embedded JOIN on the foreign key `product_id → products.id`.

### Get Wishlist Items

```javascript
const response = await fetch(
    `${NEON_DATA_API_BASE}/wishlist_items?select=id,created_at,products(id,name,price,slug)`,
    { headers: apiHeaders(token) }
);
const items = await response.json();
```

---

## 6. Writing Data: Add to Cart

### Add Item to Cart

```javascript
// You must know the cart_id for the user. 
// Typically: fetch /carts first, then use the returned id.
const response = await fetch(`${NEON_DATA_API_BASE}/cart_items`, {
    method: 'POST',
    headers: apiHeaders(token),
    body: JSON.stringify({
        cart_id: '33333333-3333-3333-3333-333333333333',
        product_id: '22222222-2222-2222-2222-222222222222',
        quantity: 2,
        price_snapshot: '29.99',
    }),
});
const newItem = await response.json(); // Returned because of Prefer: return=representation
```

### Update Cart Item Quantity

```javascript
const response = await fetch(`${NEON_DATA_API_BASE}/cart_items?id=eq.${cartItemId}`, {
    method: 'PATCH',
    headers: apiHeaders(token),
    body: JSON.stringify({ quantity: 3 }),
});
```

> The `?id=eq.<uuid>` is PostgREST filter syntax. `eq` = equals. See [Section 11](#11-filtering-sorting--pagination) for more operators.

### Remove Item from Cart

```javascript
const response = await fetch(`${NEON_DATA_API_BASE}/cart_items?id=eq.${cartItemId}`, {
    method: 'DELETE',
    headers: apiHeaders(token),
});
// Returns 204 No Content on success
```

### Add to Wishlist

```javascript
const response = await fetch(`${NEON_DATA_API_BASE}/wishlist_items`, {
    method: 'POST',
    headers: apiHeaders(token),
    body: JSON.stringify({
        wishlist_id: userWishlistId,
        product_id: productId,
    }),
});
```

---

## 7. Reading Orders (Read-Only)

The RLS policy on `orders` only allows `SELECT` where `user_id = jwt.sub`. Attempts to `POST`, `PATCH`, or `DELETE` will return `403 Forbidden`.

### Get User's Orders

```javascript
const response = await fetch(
    `${NEON_DATA_API_BASE}/orders?select=id,status,total_amount,created_at,order_items(id,quantity,unit_price,product_id)&order=created_at.desc`,
    { headers: apiHeaders(token) }
);
const orders = await response.json();
```

### Get Single Order with Full Details

```javascript
const response = await fetch(
    `${NEON_DATA_API_BASE}/orders?id=eq.${orderId}&select=*,order_items(*,products(name,slug))`,
    { headers: apiHeaders(token) }
);
const [order] = await response.json();
```

> `*` selects all columns from the primary table. The embedded join `order_items(*,products(name,slug))` fetches all order item fields plus the linked product name and slug.

---

## 8. Reading User Addresses

```javascript
// Get all addresses for the user
const response = await fetch(`${NEON_DATA_API_BASE}/user_addresses`, {
    headers: apiHeaders(token),
});
const addresses = await response.json();

// Add a new address
const addResponse = await fetch(`${NEON_DATA_API_BASE}/user_addresses`, {
    method: 'POST',
    headers: apiHeaders(token),
    body: JSON.stringify({
        user_id: userId,  // Must match jwt.sub — RLS validates this
        address_line_1: '123 Main St',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600001',
        country: 'IN',
        is_default: true,
    }),
});
```

---

## 9. Reading Products & Reviews (Cross-Project Access)

As of **2026-02-27**, the Authoritative Product Catalog and Reviews system have been moved to a dedicated Neon project. 

| Item | Catalog Project Endpoint |
|---|---|
| **Project Name** | `icy-union-81751721` |
| **Data API Base** | `https://icy-union-81751721.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/` |
| **Connection String** | `postgresql://authenticator@icy-union-81751721-pooler.c-4.us-east-1.aws.neon.tech/neondb...` |

### How to Query Products from the Frontend

You should point your `fetch` requests to the **Catalog Project's** Data API. Your existing RS256 JWT will still work IF the Catalog project is configured to trust the same JWKS URL (this is a best practice for microservices).

```javascript
const CATALOG_API_BASE = 'https://icy-union-81751721.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1';

// Get products from the CATALOG project
const response = await fetch(`${CATALOG_API_BASE}/products?is_active=eq.true`, {
    headers: {
        'neon-connection-string': 'postgresql://authenticator@icy-union-81751721-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
        // 'Authorization': `Bearer ${token}` // Optional for public reads
    }
});
```

> **Important:** This backend (`ecommerce-backend`) no longer contains a `products` table. Sections 9 and 10 of previous guides are now consolidated into this cross-project reference.


---

## 11. Filtering, Sorting & Pagination

PostgREST uses URL query parameters for all filtering. These work the same across all endpoints.

### Operators

| Operator | SQL Equivalent | Example |
|---|---|---|
| `eq` | `= value` | `?status=eq.pending` |
| `neq` | `!= value` | `?status=neq.cancelled` |
| `gt` | `> value` | `?total_amount=gt.100` |
| `gte` | `>= value` | `?created_at=gte.2024-01-01` |
| `lt` | `< value` | `?quantity=lt.5` |
| `lte` | `<= value` | |
| `like` | `LIKE 'value'` | `?name=like.*shirt*` (use `*` for `%`) |
| `ilike` | `ILIKE 'value'` | `?name=ilike.*shirt*` |
| `in` | `IN (a,b,c)` | `?status=in.(pending,paid)` |
| `is` | `IS NULL` / `IS NOT NULL` | `?address_id=is.null` |

### Sorting

```
?order=created_at.desc          → ORDER BY created_at DESC
?order=total_amount.asc         → ORDER BY total_amount ASC
?order=created_at.desc,price.asc → Multiple sort columns
```

### Pagination

```
?limit=20&offset=0              → First page (20 items)
?limit=20&offset=20             → Second page
```

### Column Selection

```
?select=id,name,email                       → Specific columns
?select=*                                   → All columns
?select=id,cart_items(id,quantity,products(name))  → With embedded joins
```

---

## 12. Error Handling

The Data API returns standard HTTP status codes:

| Code | Meaning | How to Handle |
|---|---|---|
| `200 OK` | Success (GET, PATCH) | Parse JSON body |
| `201 Created` | Success (POST) | Parse JSON body for returned row |
| `204 No Content` | Success (DELETE) | No body |
| `400 Bad Request` | Invalid PostgREST filter or body | Check column names & operator syntax |
| `401 Unauthorized` | Missing/invalid JWT | Re-authenticate; redirect to login |
| `403 Forbidden` | RLS policy blocked the operation | The user is trying to access another user's data, or a write-blocked endpoint |
| `404 Not Found` | Resource not found | Expected — check IDs |
| `409 Conflict` | Unique constraint violation | e.g., duplicate cart item (same product in cart) |
| `500 Internal Server Error` | DB error | Log and report; check Neon monitoring |

### JavaScript Error Handler Pattern

```javascript
async function neonFetch(url, options) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        switch (response.status) {
            case 401:
                // Token expired — redirect to login
                window.location.href = '/login';
                break;
            case 403:
                throw new Error('Access denied. This operation is not permitted.');
            case 409:
                throw new Error('Item already exists (duplicate).');
            default:
                throw new Error(error.message || `Request failed with status ${response.status}`);
        }
    }

    if (response.status === 204) return null;
    return response.json();
}
```

---

## 13. Security Boundaries — What's Blocked

These operations will return `403 Forbidden` regardless of who you are when using the Data API:

```javascript
// ❌ Attempting to create an order directly
await fetch(`${NEON_DATA_API_BASE}/orders`, {
    method: 'POST',   // BLOCKED — RLS: orders only have SELECT policy
    headers: apiHeaders(token),
    body: JSON.stringify({ total_amount: 0, status: 'paid' }) // Fraud attempt
});
// → 403 Forbidden

// ❌ Attempting to access another user's cart
// Even if you change the filter, RLS has already filtered it server-side
await fetch(`${NEON_DATA_API_BASE}/carts?user_id=eq.another-user-uuid`, {
    headers: apiHeaders(token), // Your JWT = your sub = your user_id only
});
// → Returns empty array (not 403) — you simply see no rows

// ❌ Attempting to access users table
await fetch(`${NEON_DATA_API_BASE}/users`, {
    headers: apiHeaders(token),
});
// → 403 Forbidden — authenticator role has no GRANT on users table

// ❌ Attempting to access payments
await fetch(`${NEON_DATA_API_BASE}/payments`, {
    headers: apiHeaders(token),
});
// → 403 Forbidden — authenticator role has no GRANT on payments table
```

---

## 14. Building a JavaScript Client

A production-ready client encapsulating all Data API calls:

```javascript
// frontend/src/lib/neonClient.js

const BASE_URL = 'https://ep-ancient-frog-aimehta7/rest/v1';
const CATALOG_URL = 'https://icy-union-81751721/rest/v1';
const CONNECTION_STRING = 'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const CATALOG_CONNECTION = 'postgresql://authenticator@icy-union-81751721-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

class NeonClient {
    #token = null;

    setToken(token) { this.#token = token; }
    clearToken() { this.#token = null; }

    getHeaders(isCatalog = false) {
        return {
            'neon-connection-string': isCatalog ? CATALOG_CONNECTION : CONNECTION_STRING,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...(this.#token ? { 'Authorization': `Bearer ${this.#token}` } : {}),
        };
    }

    async #fetch(path, options = {}, isCatalog = false) {
        const url = isCatalog ? CATALOG_URL : BASE_URL;
        const response = await fetch(`${url}${path}`, {
            ...options,
            headers: { ...this.getHeaders(isCatalog), ...options.headers },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw Object.assign(new Error(err.message || 'Data API error'), {
                status: response.status
            });
        }

        return response.status === 204 ? null : response.json();
    }

    // Cart
    getCart()          { return this.#fetch('/carts'); }
    getCartItems()     { return this.#fetch('/cart_items'); } // Join removed; fetch products separately
    addCartItem(data)  { return this.#fetch('/cart_items', { method: 'POST', body: JSON.stringify(data) }); }
    updateCartItem(id, qty) { return this.#fetch(`/cart_items?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) }); }
    removeCartItem(id) { return this.#fetch(`/cart_items?id=eq.${id}`, { method: 'DELETE' }); }

    // Wishlist
    getWishlistItems()     { return this.#fetch('/wishlist_items'); }
    addWishlistItem(data)  { return this.#fetch('/wishlist_items', { method: 'POST', body: JSON.stringify(data) }); }
    removeWishlistItem(id) { return this.#fetch(`/wishlist_items?id=eq.${id}`, { method: 'DELETE' }); }

    // Orders (read-only)
    getOrders()      { return this.#fetch('/orders?select=*,order_items(*)&order=created_at.desc'); }
    getOrder(id)     { return this.#fetch(`/orders?id=eq.${id}&select=*,order_items(*)`).then(r => r?.[0]); }

    // Addresses
    getAddresses()        { return this.#fetch('/user_addresses'); }
    addAddress(data)      { return this.#fetch('/user_addresses', { method: 'POST', body: JSON.stringify(data) }); }
    updateAddress(id, d)  { return this.#fetch(`/user_addresses?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
    deleteAddress(id)     { return this.#fetch(`/user_addresses?id=eq.${id}`, { method: 'DELETE' }); }

    // Products (Catalog Project)
    getProducts(filters = '')  { return this.#fetch(`/products?is_active=eq.true${filters}`, {}, true); }
    getProduct(id)             { return this.#fetch(`/products?id=eq.${id}`, {}, true).then(r => r?.[0]); }

    // Reviews (Catalog Project)
    getReviews(productId)     { return this.#fetch(`/reviews?product_id=eq.${productId}&is_moderated=eq.true`, {}, true); }
    submitReview(data)        { return this.#fetch('/reviews', { method: 'POST', body: JSON.stringify(data) }, true); }
}

export const db = new NeonClient();
```

**Usage:**

```javascript
import { db } from './lib/neonClient.js';

// After login:
db.setToken(loginToken);

// Add item to cart
const cartItem = await db.addCartItem({
    cart_id: userCartId,
    product_id: selectedProduct.id,
    quantity: 1,
    price_snapshot: selectedProduct.price,
});

// View orders
const orders = await db.getOrders();
```
