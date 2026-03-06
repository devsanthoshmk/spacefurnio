# 🚀 Spacefurnio API Documentation

> **Complete API Reference for Frontend Implementation**
> This document consolidates both the **Worker API** (sensitive operations) and the **Neon Data API** (direct DB access) into a single, usable frontend implementation guide.

---

## 🌍 Base URLs

| Environment | Worker (Auth & Orders) | Neon Data API (Carts, Orders, etc.) | Catalog API (Products) |
|---|---|---|---|
| **Production** | `https://backend.spacefurnio.workers.dev` | `https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1` | `https://ep-flat-brook-a1h1dgii.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1` |
| **Local/Dev** | `http://localhost:8787` | `https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1` | `https://ep-flat-brook-a1h1dgii.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1` |

> [!TIP]
> **Currency Handling:** To avoid floating-point math errors, all prices (e.g., `price_cents`) are stored as **integers in cents**.
> *   **Display:** Divide by 100 (e.g., `1499` becomes `$14.99`).
> *   **Storage:** Multiply by 100 (e.g., `$29.50` becomes `2950`).

---

## 🔐 1. Authentication (Worker API)

### Login

Exchanges email/password for an RS256 JWT token. Passwords are securely verified using PBKDF2 with SHA-256.

* **Endpoint:** `POST {WORKER_URL}/auth/login`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIsImtpZCI...",
    "user": {
      "id": "49364355-5bcb-4645-aa99-619bd373878c",
      "email": "user@example.com",
      "role": "authenticated"
    }
  }
  ```

### Register

Creates a new user account. Passwords are automatically hashed using PBKDF2 before storage.

* **Endpoint:** `POST {WORKER_URL}/auth/register`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Registration successful",
    "token": "eyJhbGciOiJSUzI1NiIsImtpZCI...",
    "user": {
      "id": "11111111-...",
      "email": "user@example.com",
      "role": "customer"
    }
  }
  ```

> **Frontend Implementation:** Store the `token` in `sessionStorage` or an in-memory store (zustand/redux).

---

## 🛒 2. Non-Sensitive Operations (Neon Data API)

All user-scoped CRUD operations interact directly with Neon Postgres using PostgREST. 

### Required Headers
Every request to the Neon Data API **MUST** include:
```javascript
{
  "Authorization": "Bearer <YOUR_JWT_TOKEN>",
  "neon-connection-string": "postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",
  "Content-Type": "application/json",
  "Prefer": "return=representation" // Returns the affected row on POST/PATCH
}
```

### 🛍️ Cart API

**Get User's Cart (with items & products)**
* **Endpoint:** `GET {NEON_URL}/carts?select=*,cart_items(*)`
> ⚠️ **Note:** `products(*)` joins are NOT available here because the `products` table was moved to a separate Neon project (`icy-union-81751721`). Product enrichment (name, image, price) must be done client-side using the Catalog API.

**Add Item to Cart**
* **Endpoint:** `POST {NEON_URL}/cart_items`
* **Body:**
  ```json
  {
    "cart_id": "<USER_CART_ID>",
    "product_id": "<PRODUCT_ID>",
    "quantity": 1,
    "price_snapshot": 149.50
  }
  ```
  *(Note: If adding an existing item, this currently returns 409 Conflict based on unique constraints. Ensure the frontend PATCHes instead or handles the error).*

**Update Cart Item Quantity**
* **Endpoint:** `PATCH {NEON_URL}/cart_items?id=eq.<CART_ITEM_ID>`
* **Body:** `{"quantity": 2}`

**Remove from Cart**
* **Endpoint:** `DELETE {NEON_URL}/cart_items?id=eq.<CART_ITEM_ID>`

---

### ❤️ Wishlist API

**Get User's Wishlist**
* **Endpoint:** `GET {NEON_URL}/wishlist_items?select=id,created_at,product_id`
> ⚠️ **Note:** `products(*)` joins are NOT available here — see Cart note above.

**Add to Wishlist**
* **Endpoint:** `POST {NEON_URL}/wishlist_items`
* **Body:**
  ```json
  {
    "wishlist_id": "<USER_WISHLIST_ID>",
    "product_id": "<PRODUCT_ID>"
  }
  ```

**Remove from Wishlist**
* **Endpoint:** `DELETE {NEON_URL}/wishlist_items?id=eq.<WISHLIST_ITEM_ID>`

---

### 📦 Orders (Read-Only)

**Get User's Order History**
* **Endpoint:** `GET {NEON_URL}/orders?select=*,order_items(*)&order=created_at.desc`
* *(RLS automatically returns only orders belonging to the logged-in user).*

---

### 📖 Catalog API (Products)

The Catalog relies on the separate `icy-union-81751721` Neon project (endpoint: `ep-flat-brook-a1h1dgii`, region: `ap-southeast-1`).

**Get All Products**
* **Endpoint:** `GET {CATALOG_URL}/products`
* **Headers:** 
  ```javascript
  {
    "neon-connection-string": "postgresql://authenticator@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    "Authorization": "Bearer <TOKEN>"  // JWT from /auth/login — role maps to admin/customer in products DB
  }
  ```

**Get Single Product**
* **Endpoint:** `GET {CATALOG_URL}/products?id=eq.<PRODUCT_ID>`

**Get Products with Brands (Join)**
* **Endpoint:** `GET {CATALOG_URL}/products?select=*,brands(*),categories(*)`

---

## 💳 3. Sensitive Operations (Worker API)

These operations execute backend business logic (payment verification, multi-table transactions).

### Place Order (Checkout)
Replaces the cart contents with an actionable order.

* **Endpoint:** `POST {WORKER_URL}/api/orders/checkout`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Body:**
  ```json
  {
    "cartItems": [
      { "productId": "...", "quantity": 1, "price": 99.99 }
    ],
    "shippingAddressId": "...",
    "paymentMethod": "card"
  }
  ```

### Update Order Status (Admin Only)
* **Endpoint:** `PATCH {WORKER_URL}/api/orders/<ORDER_ID>/status`
* **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
* **Body:**
  ```json
  { "status": "shipped" }
  ```

### Verify Payment (Razorpay)
* **Endpoint:** `POST {WORKER_URL}/api/payments/verify`
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Body:**
  ```json
  {
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }
  ```

### Manage Products (Admin Only)
* **Endpoint:** `POST {WORKER_URL}/api/products` (Create)
* **Endpoint:** `PUT {WORKER_URL}/api/products/<PRODUCT_ID>` (Update)
* **Endpoint:** `DELETE {WORKER_URL}/api/products/<PRODUCT_ID>` (Delete)
* **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

### System Health
* **Endpoint:** `GET {WORKER_URL}/api/health`
* **Response:** `{ "status": "ok", "timestamp": "..." }`

---

## 🛠️ Complete Frontend Implementation (Copy & Paste)

You can use this unified `api.js` client to handle all backend communication gracefully:

```javascript
// frontend/src/lib/api.js

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://backend.spacefurnio.workers.dev';
const NEON_URL = import.meta.env.VITE_NEON_URL || 'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1';
const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || 'https://ep-flat-brook-a1h1dgii.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1';

const NEON_CONN = import.meta.env.VITE_NEON_CONN || 'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const CATALOG_CONN = import.meta.env.VITE_CATALOG_CONN || 'postgresql://authenticator@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

class ApiClient {
    constructor() {
        this.token = null;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('spacefurnio_token');
        }
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('spacefurnio_token', token);
        } else {
            localStorage.removeItem('spacefurnio_token');
        }
    }

    // --- AUTH ---
    async login(email, password) {
        const res = await fetch(`${WORKER_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        this.setToken(data.token);
        return data;
    }

    async register(userData) {
        const res = await fetch(`${WORKER_URL}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) throw new Error('Registration failed');
        const data = await res.json();
        if (data.token) this.setToken(data.token);
        return data;
    }

    // --- NEON HTTP HELPER ---
    async _neonFetch(path, options = {}, isCatalog = false) {
        const url = isCatalog ? CATALOG_URL : NEON_URL;
        const res = await fetch(`${url}${path}`, {
            ...options,
            headers: {
                'neon-connection-string': isCatalog ? CATALOG_CONN : NEON_CONN,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
                ...options.headers
            }
        });
        if (!res.ok) {
            if (res.status === 409) throw new Error('Item already exists.');
            throw new Error(`Data API error: ${res.status}`);
        }
        return res.status === 204 ? null : res.json();
    }

    // --- CARTS & WISHLISTS ---
    getCart() { return this._neonFetch('/carts?select=*,cart_items(*)'); }
    addCartItem(data) { return this._neonFetch('/cart_items', { method: 'POST', body: JSON.stringify(data) }); }
    updateCartItem(id, qty) { return this._neonFetch(`/cart_items?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) }); }
    removeCartItem(id) { return this._neonFetch(`/cart_items?id=eq.${id}`, { method: 'DELETE' }); }
    
    getWishlist() { return this._neonFetch('/wishlist_items?select=id,product_id'); }
    addWishlistItem(data) { return this._neonFetch('/wishlist_items', { method: 'POST', body: JSON.stringify(data) }); }
    removeWishlistItem(id) { return this._neonFetch(`/wishlist_items?id=eq.${id}`, { method: 'DELETE' }); }

    // --- ORDERS (Read via Neon, Write via Worker) ---
    getOrders() { return this._neonFetch('/orders?select=*,order_items(*)&order=created_at.desc'); }
    
    async checkout(orderData) {
        const res = await fetch(`${WORKER_URL}/api/orders/checkout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) throw new Error('Checkout failed');
        return res.json();
    }

    // --- CATALOG ---
    getProducts() { return this._neonFetch(`/products?is_active=eq.true`, {}, true); }
}

export const api = new ApiClient();
```
