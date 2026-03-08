# Neon Data API Documentation

## Overview

The Spacefurnio platform uses Neon's Data API (PostgREST-style REST interface) for managing user-specific data like carts and wishlists. Products are stored in a separate database and accessed via the Neon serverless driver.

## Architecture

### Two Databases

| Database | Project ID | Purpose |
|----------|-----------|---------|
| Main (ecommerce-db) | `proud-shadow-42759289` | Users, carts, wishlists, orders |
| Catalog (products) | `icy-union-81751721` | Products, categories, brands |

### Authentication

- **Main DB**: Uses custom RS256 JWTs from Cloudflare Worker
- **Catalog DB**: Uses guest JWT for public product data

## Data API Endpoints

### Base URL

```
https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1
```

### Required Headers

```http
neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
Authorization: Bearer <jwt_token>
Content-Type: application/json
Prefer: return=representation
```

## Tables

### carts

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users.id |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**RLS Policy:** Users can only access their own cart

```sql
CREATE POLICY "Users can manage own cart" ON carts
FOR ALL TO authenticated
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());
```

### cart_items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| cart_id | uuid | Foreign key to carts.id |
| product_id | integer | Product ID (from catalog DB - uses INT IDs from icy-union project) |
| quantity | integer | Item quantity |
| price_snapshot | numeric | Price at time of add |

**RLS Policy:** Users can only access items in their own cart

### wishlists

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users.id |
| created_at | timestamptz | Creation timestamp |

### wishlist_items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| wishlist_id | uuid | Foreign key to wishlists.id |
| product_id | integer | Product ID (from catalog DB - uses INT IDs from icy-union project) |
| created_at | timestamptz | Creation timestamp |

### orders

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users.id |
| status | text | Order status |
| total_amount | numeric | Order total |
| created_at | timestamptz | Creation timestamp |

### order_items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | Foreign key to orders.id |
| product_id | integer | Product ID |
| quantity | integer | Item quantity |
| unit_price | numeric | Price at time of order |

## API Reference

### Fetch Cart

```http
GET /carts?select=id,user_id,created_at,updated_at
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "created_at": "2026-03-06T21:11:52.255677",
    "updated_at": "2026-03-06T21:11:52.255677"
  }
]
```

### Fetch Cart Items

```http
GET /cart_items?cart_id=eq.<cart_id>&select=id,cart_id,product_id,quantity,price_snapshot,created_at
```

### Add Cart Item

```http
POST /cart_items
Content-Type: application/json

{
  "cart_id": "uuid",
  "product_id": 12,
  "quantity": 1,
  "price_snapshot": 99.99
}
```

### Update Cart Item Quantity

```http
PATCH /cart_items?id=eq.<item_id>
Content-Type: application/json

{
  "quantity": 2
}
```

### Remove Cart Item

```http
DELETE /cart_items?id=eq.<item_id>
```

### Clear Cart

```http
DELETE /cart_items?cart_id=eq.<cart_id>
```

### Fetch Wishlist

```http
GET /wishlists?select=id
```

### Fetch Wishlist Items

```http
GET /wishlist_items?wishlist_id=eq.<wishlist_id>&select=id,wishlist_id,product_id,created_at
```

### Add Wishlist Item

```http
POST /wishlist_items
Content-Type: application/json

{
  "wishlist_id": "uuid",
  "product_id": 12
}
```

### Remove Wishlist Item

```http
DELETE /wishlist_items?id=eq.<item_id>
```

### Remove Wishlist Item by Product ID

```http
DELETE /wishlist_items?product_id=eq.<product_id>
```

## PostgREST Features

### Filtering

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `id=eq.123` |
| `neq` | Not equals | `id=neq.123` |
| `gt` | Greater than | `price=gt.100` |
| `gte` | Greater or equal | `price=gte.100` |
| `lt` | Less than | `price=lt.100` |
| `lte` | Less or equal | `price=lte.100` |
| `like` | Pattern match | `name=like.*chair*` |
| `ilike` | Case-insensitive match | `name=ilike.*chair*` |
| `in` | In array | `id=in.(1,2,3)` |
| `is` | Is null/true/false | `active=is.true` |

### Selecting Columns

```http
GET /carts?select=id,created_at
```

### Ordering

```http
GET /products?order=created_at.desc
GET /products?order=price.asc,created_at.desc
```

### Pagination

```http
GET /products?limit=10&offset=0
```

### Embedded Resources

```http
GET /orders?select=*,order_items(*)
```

## Error Handling

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | - | Invalid request syntax |
| 401 | - | Missing or invalid JWT |
| 404 | - | Resource not found |
| 409 | - | Unique constraint violation |

### Error Response Format

```json
{
  "code": "22P02",
  "details": null,
  "hint": null,
  "message": "invalid input syntax for type uuid"
}
```

## Frontend Implementation

### API Client Setup

See `frontend/src/lib/api.js` for the complete implementation.

```javascript
const NEON_URL = 'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1'
const NEON_CONN = 'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

async _neonFetch(path, options = {}, isCatalog = false) {
  const url = isCatalog ? CATALOG_URL : NEON_URL
  const headers = {
    'neon-connection-string': isCatalog ? CATALOG_CONN : NEON_CONN,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
  }
  
  const res = await fetch(`${url}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`Data API error: ${res.status}`)
  return res.json()
}
```

### Pinia Stores

- **Cart Store**: `frontend/src/stores/cart.js`
- **Wishlist Store**: `frontend/src/stores/wishlist.js`

## Configuration

### Re-provisioning Data API

To reconfigure Data API authentication:

```bash
# Using MCP tool
neon_provision_neon_data_api --projectId proud-shadow-42759289 --authProvider external --jwksUrl https://backend.spacefurnio.workers.dev/auth/.well-known/jwks.json
```

### RLS Policy Pattern

Always use `auth.user_id()` function for RLS policies:

```sql
-- Correct (uses auth.user_id())
CREATE POLICY "policy_name" ON table_name
FOR ALL TO authenticated
USING (user_column = auth.user_id())
WITH CHECK (user_column = auth.user_id());

-- Incorrect (won't work with external JWKS)
CREATE POLICY "policy_name" ON table_name
FOR ALL TO authenticated
USING (user_column = current_setting('request.jwt.claim.sub', true)::uuid);
```

## Troubleshooting

### 400 Errors on Cart/Wishlist

1. Check that Data API is provisioned with external JWKS
2. Verify RLS policies use `auth.user_id()` not `current_setting()`
3. Ensure user has a cart/wishlist record in the database

### JWT Validation Failed

1. Verify JWKS URL is correct and accessible
2. Check JWT has correct `sub` claim (user ID)
3. Ensure JWT is not expired

### Products Not Loading

1. Check catalog database connection string
2. Verify guest JWT is valid
3. Check products table exists in catalog DB