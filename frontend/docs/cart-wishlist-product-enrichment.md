# Cart & Wishlist Product Enrichment

## Problem Statement

The Spacefurnio frontend has a **multi-database architecture** where:

1. **Main Database (Users/Orders)**: Contains `cart_items` and `wishlist_items` tables
2. **Catalog Database (Neon)**: Contains `products` table with full product details

### The Issue

Both `cart_items` and `wishlist_items` in the main database only store:
- `product_id` (integer) - foreign key to products
- `price_snapshot` - price at time of adding to cart
- `quantity` - for cart items

They **do NOT store** product details like:
- Product name
- Product image
- Product price (current)
- Product slug
- Colors, etc.

### Why This Happened

During migration `0001_big_dormammu`, the `products` table was dropped from the main DB because products live in a separate Neon project (`icy-union-81751721`). PostgREST cannot perform cross-database joins, so we cannot embed product data when fetching cart/wishlist items.

### Orders Have Same Issue

Order items (`order_items` table) also only store `product_id`, `quantity`, and `unit_price`. They need enrichment for product names and images in the Orders view.

## Solution: Centralized Auto-Enrichment

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ UI Components                                              │
│ (CartOffCanvas, WishlistOffCanvas, CheckoutModal,          │
│  OrdersModal)                                               │
│                                                             │
│ v-for="item in cart.displayItems"                          │
│ v-for="item in wishlist.displayItems"                      │
└─────────────────────────────────────────────────────────────┘
│
▼ (automatic - no manual enrichment needed)
┌─────────────────────────────────────────────────────────────┐
│ Pinia Stores                                               │
│ ┌─────────────────────┐ ┌─────────────────────────────┐    │
│ │ useCartStore        │ │ useWishlistStore            │    │
│ │                     │ │                             │    │
│ │ - items: []         │ │ - items: []                 │    │
│ │ - enrichedItems: [] │ │ - enrichedItems: []         │    │
│ │ - displayItems ─────┼─►(computed - auto enriched)  │    │
│ │                     │ │                             │    │
│ │ - fetchCart() ──────┼──► auto-enriches after fetch  │    │
│ │ - enrichItems()     │ │ - fetchWishlist() ──────────┼───►│
│ └─────────────────────┘ └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
│
▼ (automatic via enrichItems())
┌─────────────────────────────────────────────────────────────┐
│ shopApi (Catalog DB)                                       │
│                                                             │
│ getProduct(id) ──► Returns full product details:           │
│ - name, price, thumbnail, images, slug, colors, etc.       │
└─────────────────────────────────────────────────────────────┘
│
┌─────────────────────────────────────────────────────────────┐
│ Main Database (Users/Orders)                               │
│                                                             │
│ cart_items (product_id, price_snapshot, quantity)          │
│ wishlist_items (product_id, created_at)                    │
│ order_items (product_id, quantity, unit_price)             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Store Changes (`stores/cart.js`, `stores/wishlist.js`)

Both stores now have:

```javascript
// State
const enrichedItems = ref([])

// Computed - returns enriched items if available, fallback to raw items
const displayItems = computed(() => {
  return enrichedItems.value.length > 0 ? enrichedItems.value : items.value
})

// fetchCart/fetchWishlist now auto-enriches after fetching
async function fetchCart() {
  // ... fetch raw items from API ...
  
  await enrichItems()  // Auto-enrich
  items.value = enrichedItems.value  // Use enriched data
}

async function enrichItems() {
  if (items.value.length === 0) {
    enrichedItems.value = []
    return
  }

  const productIds = items.value.map((item) => item.productId)
  const results = await Promise.all(
    productIds.map((id) => getProduct(id))
  )

  enrichedItems.value = items.value.map((item, index) => {
    const productResult = results[index]
    if (productResult.success && productResult.data) {
      const product = productResult.data
      return {
        ...item,
        name: product.name,
        image: product.thumbnail,
        primaryImage: product.thumbnail,
        slug: product.slug,
        originalPrice: product.originalPrice,
        discount: product.discount,
        colors: product.colors,
      }
    }
    return { ...item, name: 'Loading...', image: null }
  })
}
```

#### 2. Component Changes

**All components now use `displayItems`:**

```vue
<!-- CartOffCanvas.vue -->
<div v-for="item in cart.displayItems" :key="item.id">

<!-- WishlistOffCanvas.vue -->
<div v-for="item in wishlist.displayItems" :key="item.id">

<!-- CheckoutModal.vue -->
<div v-for="item in cart.displayItems" :key="item.id">
```

**No manual enrichment calls needed** - components just call `fetchCart()` or `fetchWishlist()` and `displayItems` automatically has the enriched data.

#### 3. Centralized Utilities (`api/shopApi.js`)

Added reusable enrichment functions:

```javascript
/**
 * Generic product enrichment for any items array
 */
export async function enrichItemsWithProducts(items, transformFn = null) {
  if (!items || items.length === 0) return []

  const productIds = items.map((item) => item.productId).filter(Boolean)
  if (productIds.length === 0) return items

  const results = await Promise.all(productIds.map((id) => getProduct(id)))

  return items.map((item, index) => {
    const productResult = results[index]
    if (productResult.success && productResult.data) {
      const product = productResult.data
      if (transformFn) {
        return transformFn(item, product)
      }
      return {
        ...item,
        name: product.name,
        image: product.thumbnail || (product.images?.[0] || null),
        // ... other fields
      }
    }
    return { ...item, name: item.name || 'Product', image: null }
  })
}

/**
 * Special handler for order items (different field names)
 */
export async function enrichOrderItems(orderItems) {
  if (!orderItems || orderItems.length === 0) return []

  return enrichItemsWithProducts(
    orderItems.map((item) => ({ productId: item.product_id, ...item })),
    (item, product) => ({
      ...item,
      product_name: product.name,
      product_image: product.thumbnail || (product.images?.[0] || null),
      product_slug: product.slug,
    })
  )
}
```

#### 4. Orders Enrichment (`components/OrdersModal.vue`)

```javascript
import { enrichOrderItems } from '@/api/shopApi'

async function fetchOrders() {
  const res = await ordersApi.getAll()
  const orders = res.orders || res || []

  const enrichedOrders = await Promise.all(
    orders.map(async (order) => ({
      ...order,
      order_items: await enrichOrderItems(order.order_items || []),
    }))
  )
  ordersList.value = enrichedOrders
}
```

## Usage Guide

### For Developers

1. **Always use `displayItems`** in templates, not `items` or `enrichedItems` directly:
   ```vue
   <div v-for="item in cart.displayItems">
   ```

2. **No need to call `enrichItems()` manually** - it's automatically called by `fetchCart()` and `fetchWishlist()`.

3. **For new components** - just use `cart.displayItems` or `wishlist.displayItems` and it will work.

4. **For order items** - use `enrichOrderItems(orderItems)` in the fetch function.

### Data Structure

**Cart/Wishlist Display Item:**
```javascript
{
  id: 'uuid',
  productId: 123,
  name: 'Product Name',        // from enrichment
  image: 'https://...',        // from enrichment
  primaryImage: 'https://...', // from enrichment
  slug: 'product-slug',        // from enrichment
  unitPrice: 99.00,            // from price_snapshot
  quantity: 2,
  // ... cart-specific fields
}
```

**Order Item (after enrichment):**
```javascript
{
  id: 'uuid',
  product_id: 123,
  quantity: 1,
  unit_price: '99.00',
  product_name: 'Product Name',   // from enrichment
  product_image: 'https://...',   // from enrichment
  product_slug: 'product-slug',   // from enrichment
}
```

## Important Notes

1. **Price Snapshot**: Cart items use `price_snapshot` (price at time of add) for display, which is correct e-commerce behavior.

2. **Auto-Enrichment**: Components don't need to manually call enrichment - it's built into the store's fetch functions.

3. **Backward Compatibility**: The `displayItems` computed automatically falls back to raw items if enrichment hasn't happened yet.

4. **Loading States**: When enrichment is in progress, items show placeholder data (`'Loading...'` for name, null for image).

5. **Error Handling**: If product fetch fails, items fall back to basic data from the main DB.

6. **Performance**: All product details are fetched in parallel using `Promise.all()` to minimize latency.

7. **Cache**: The `shopApi` has a 5-minute in-memory cache for product data, so repeated opens won't hit the database unnecessarily.

## Future Improvements

1. **Batch API Endpoint**: Create a backend endpoint that accepts multiple product IDs and returns all product details in one request (reduces N+1 query problem).

2. **Server-Side Enrichment**: If using a different backend architecture, consider enriching cart/wishlist data at the API level.

3. **Real-Time Updates**: Consider using webhooks to invalidate cache when product details change in the catalog.