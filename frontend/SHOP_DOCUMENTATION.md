# Space Furnio - Shop Module Documentation

## Overview

This documentation covers the shop pages for Space Furnio, a furniture e-commerce platform. The design follows a warm, beige minimalist aesthetic inspired by high-end furniture retailers. The shop is now powered by a production NeonDB (PostgreSQL) database with direct client-side queries.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [Production Database API](#production-database-api)
4. [Features Overview](#features-overview)
5. [Database Schema](#database-schema)
6. [Styling System](#styling-system)
7. [Responsive Design](#responsive-design)
8. [Performance Optimizations](#performance-optimizations)
9. [Known Limitations](#known-limitations)

---

## Project Structure

```
frontend/src/
├── api/
│   └── shopApi.js            # Production NeonDB API service
├── assets/
│   ├── main.css              # Global styles
│   └── shop.css              # Shop design system tokens
├── components/
│   └── shop/
│       ├── FilterSidebar.vue     # Filter panel component
│       ├── ProductCardNew.vue    # Product card with carousel
│       └── ProductListing.vue    # Product listing page
├── views/
│   ├── ShopView.vue          # Shop root page
│   └── ProductDetailView.vue # Product details page
└── router/
    └── index.js              # Route definitions
```

---

## Component Architecture

### ShopView.vue (Root Shop Page)

The main entry point for the shop section. Features:

- **Special Offers Banner**: Promotional cards with hover effects
- **Category/Design Toggle**: Smooth animated tab switching
- **Category Grid**: Icon-based navigation cards (dynamically loaded from database)
- **Space-specific Section**: Room-based filtering (9 spaces: Foyer, Dining Room, Kitchen, etc.)
- **Style-specific Section**: Design aesthetic filtering (10 styles: Minimalist, Japandi, etc.)
- **Featured Products**: Popular items showcase (from database)
- **Contact CTA**: Customer service section

### ProductListing.vue

Full product listing page with unified data source:

- **Sticky Header**: Breadcrumbs, title, sort controls
- **Filter Sidebar**: Desktop filter panel (260px width)
- **Mobile Filter Drawer**: Slide-in filter panel
- **Product Grid**: Responsive 1-4 column layout
- **Pagination**: Full pagination or "Load More" option
- **Skeleton Loading**: Animated loading placeholders
- **Route Support**: Handles category, space, and style routes with single `shopApi.getProducts()` call

### FilterSidebar.vue

Comprehensive filtering system with dynamic data:

- **Category Filter**: Radio button selection (loaded from database)
- **Price Range**: Input fields + slider + quick options
- **Brand Filter**: Searchable radio list (dynamic from database)
- **Material Filter**: Collapsible radio list (dynamic from database)
- **Color Filter**: Visual color swatch grid (with hex code mapping)
- **Availability**: Toggle switches (In Stock, On Sale, New)

### ProductCardNew.vue

Feature-rich product card:

- **Image Carousel**: Touch/swipe and arrow navigation
- **Quick Actions**: Wishlist heart, cart button
- **Badges**: New, Sale, Bestseller
- **Color Options**: Visual color dots with hex codes
- **Grid/List Views**: Adapts layout based on view mode

### ProductDetailView.vue

Detailed product page:

- **Image Gallery**: Main image with thumbnails
- **Product Information**: Brand, name, rating, price
- **Color Selection**: Visual color swatches
- **Quantity Selector**: +/- controls
- **Add to Cart**: Primary action button
- **Features List**: Product highlights
- **Dimensions**: Width, height, depth display
- **Related Products**: Recommendations from same category/space/style

---

## Production Database API

### Location: `src/api/shopApi.js`

The shop now connects directly to NeonDB using `@neondatabase/serverless` HTTP driver. All queries run client-side via fetch API to Neon's HTTP SQL endpoint.

### Database Connection

```javascript
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = import.meta.env.VITE_PRODUCTS_DB_URL
const sql = neon(DATABASE_URL)
```

### Available Functions

```javascript
// Get all product categories (with counts)
await shopApi.getCategories()
// Returns: { success: true, data: [{ id, name, slug, icon, productCount }], meta: { total } }

// Get room/space options
await shopApi.getSpaces()
// Returns: { success: true, data: [{ id, name, slug, icon }], meta: { total } }

// Get design styles
await shopApi.getStyles()
// Returns: { success: true, data: [{ id, name, slug, image, description }], meta: { total } }

// Get products with filtering (supports category, space, OR style)
await shopApi.getProducts({
  category: 'furniture',     // OR
  space: 'bedroom',          // OR
  style: 'minimalist',       // (mutually exclusive - route determines which)
  brand: 'Nordic Home',
  colors: ['Natural', 'White'],
  material: 'Oak Wood',
  minPrice: 100,
  maxPrice: 1000,
  inStock: true,
  onSale: false,
  isNew: false,
  search: 'sofa',
  sort: 'price',
  order: 'asc',
  page: 1,
  limit: 12,
})
// Returns: { success, data, meta, aggregations }

// Get single product (by ID or slug)
await shopApi.getProduct('3')
await shopApi.getProduct('modern-oak-dining-table')
// Returns: { success, data: { ...product, relatedProducts: [...] } }

// Get featured products
await shopApi.getFeaturedProducts()
// Returns: { success, data: { featured, newArrivals, bestSellers, onSale } }

// Get filter options (scoped by category, space, or style)
await shopApi.getFilterOptions('furniture')
// Returns: { success, data: { brands, materials, colors, priceRange } }

// Search products
await shopApi.searchProducts('dining table', 10)
// Returns: { success, data: [...], meta: { query, total } }

// Get special offers
await shopApi.getSpecialOffers()
// Returns: { success, data: [{ id, title, subtitle, image, link, badge }] }
```

### Response Format

```javascript
{
  success: true,
  data: [...],           // Array or object
  meta: {
    total: 48,
    page: 1,
    limit: 12,
    totalPages: 4,
    hasNextPage: true,
    hasPrevPage: false,
  },
  aggregations: {        // For filtering (scoped to current route filter)
    brands: ['Nordic Home', 'Urban Steel', ...],
    materials: ['Oak Wood', 'Velvet', ...],
    colors: [
      { name: 'Natural', hex: '#E5D3B3' },
      { name: 'Charcoal', hex: '#4A4641' },
      ...
    ],
    priceRange: { min: 79, max: 2999 },
  },
}
```

### Data Transformation

The `transformProduct()` function bridges the gap between database schema and frontend requirements:

```javascript
{
  // Database provides these directly
  id: 3,
  name: 'Modern Oak Dining Table',
  slug: 'modern-oak-dining-table',
  price: 899,  // Converted from price_cents
  brand: 'Nordic Home',
  category: 'furniture',
  material: 'Oak Wood',
  rating: 4.5,
  reviews: 127,

  // Database provides as arrays
  images: ['url1', 'url2', ...],
  colors: ['Natural', 'Dark Brown'],
  colorData: [
    { name: 'Natural', hex: '#E5D3B3' },    // hex from COLOR_HEX_MAP if DB is null
    { name: 'Dark Brown', hex: '#4A3728' },
  ],

  // Derived/hardcoded (DB doesn't have these yet)
  inStock: true,        // Hardcoded
  stockCount: 10,       // Hardcoded
  isNew: false,         // Hardcoded
  isBestSeller: true,   // Derived from popularity >= 90
  isFeatured: true,     // Derived from popularity >= 85
  
  // Generated if missing
  description: 'Default description...',  // Generated from product name/material
  features: ['Premium Oak Wood construction', ...],
}
```

### Caching Strategy

```javascript
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}
```

---

## Features Overview

### 1. Product Filtering

| Filter Type | Implementation | Notes |
|-------------|---------------|-------|
| Category | Radio buttons | Single selection, 4 categories |
| Space | Route parameter | 9 room types (Foyer, Dining, Kitchen, etc.) |
| Style | Route parameter | 10 design styles (Minimalist, Japandi, etc.) |
| Price | Range inputs + slider | Quick options available |
| Brand | Searchable radio list | Dynamic from database |
| Material | Radio list | Dynamic from database |
| Color | Visual swatches | Multi-select with hex codes |
| Availability | Toggle switches | In Stock, On Sale, New |

### 2. Sorting Options

- Most Popular (default) - `sort=popularity&order=desc`
- Best Rating - `sort=rating&order=desc`
- Newest First - `sort=newest&order=desc`
- Price: Low to High - `sort=price&order=asc`
- Price: High to Low - `sort=price&order=desc`

### 3. View Modes

- **Grid View**: 2-4 columns based on screen size
- **List View**: Single column with full product details

### 4. Image Gallery

- Touch/swipe navigation on mobile
- Arrow buttons on desktop hover
- Dot indicators for position
- Auto-advance on hover (shows second image)
- Multiple images per product from `product_images` table

### 5. Loading States

All components include skeleton loading states that match the warm beige theme:
- Shimmer animation effect
- Proper aspect ratios
- Content-aware placeholders

---

## Database Schema

### Current Implementation

**NeonDB Project**: `icy-union-81751721`  
**Database**: `neondb`  
**Total Products**: 49

### Core Tables

#### products
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price_cents INTEGER NOT NULL,           -- Stored in cents
  listing_type VARCHAR(50),
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 50,          -- Used for bestseller calculation
  description TEXT,
  href VARCHAR(500),
  brand_id INTEGER REFERENCES brands(id),
  category_id INTEGER REFERENCES categories(id),
  space_id INTEGER REFERENCES spaces(id),
  style_id INTEGER REFERENCES styles(id),
  material_id INTEGER REFERENCES materials(id),
  room_id INTEGER REFERENCES rooms(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### categories (4 entries)
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);
-- Data: Furniture, Wall Art, Decor, Lights
```

#### spaces (9 entries)
```sql
CREATE TABLE spaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);
-- Data: Foyer, Dining Room, Kitchen, Home Office, Bedroom, Bathroom, Balcony, Lounge, Poolside
```

#### styles (10 entries)
```sql
CREATE TABLE styles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);
-- Data: Brutalist, Minimalist, Sustainable, Parametric, Wabi-Sabi, Traditional, Vintage Retro, Victorian, Japandi, Moroccan
```

#### brands
```sql
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);
```

#### materials
```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);
```

#### colors
```sql
CREATE TABLE colors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  hex_code VARCHAR(7)  -- Many are NULL, fallback to COLOR_HEX_MAP
);
```

#### product_colors (many-to-many)
```sql
CREATE TABLE product_colors (
  product_id INTEGER REFERENCES products(id),
  color_id INTEGER REFERENCES colors(id),
  PRIMARY KEY (product_id, color_id)
);
```

#### product_images
```sql
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  src VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);
```

### Query Patterns

#### Base Product Query
```sql
SELECT
  p.id, p.name, p.slug, p.price_cents, p.rating, p.review_count, p.popularity,
  b.name AS brand_name,
  c.name AS category_name, c.slug AS category_slug,
  s.name AS space_name, s.slug AS space_slug,
  st.name AS style_name, st.slug AS style_slug,
  m.name AS material_name,
  (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS thumbnail,
  (SELECT json_agg(pi2.src ORDER BY pi2.sort_order) FROM product_images pi2 WHERE pi2.product_id = p.id) AS images,
  (SELECT json_agg(json_build_object('name', cl.name, 'hex', cl.hex_code))
   FROM product_colors pc JOIN colors cl ON cl.id = pc.color_id
   WHERE pc.product_id = p.id) AS colors
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN spaces s ON s.id = p.space_id
LEFT JOIN styles st ON st.id = p.style_id
LEFT JOIN materials m ON m.id = p.material_id
```

#### Dynamic Filtering
```sql
-- Example: Get bedroom products
WHERE s.slug = 'bedroom'

-- Example: Get minimalist style products
WHERE st.slug = 'minimalist'

-- Example: Multiple filters
WHERE c.slug = 'furniture'
  AND b.name = 'Nordic Home'
  AND p.price_cents >= 10000
  AND p.price_cents <= 100000
  AND EXISTS (
    SELECT 1 FROM product_colors pc2
    JOIN colors cl2 ON cl2.id = pc2.color_id
    WHERE pc2.product_id = p.id AND cl2.name = ANY($1)
  )
```

---

## Styling System

### Design Tokens (shop.css)

```css
:root {
  /* Warm Beige Palette */
  --shop-cream: #FAF8F5;
  --shop-cream-dark: #F5F2ED;
  --shop-beige: #E8E3DC;
  --shop-beige-dark: #D4CFC6;
  --shop-tan: #C4B8A9;
  --shop-brown: #A89B8C;
  --shop-brown-dark: #8B7D6D;
  --shop-charcoal: #3D3A36;
  --shop-black: #1A1816;
  
  /* Accent Colors */
  --shop-accent: #B8956C;
  --shop-accent-light: #D4B896;
  --shop-accent-dark: #8C6D4D;
  
  /* Functional Colors */
  --shop-success: #7D9B76;
  --shop-warning: #D4A84B;
  --shop-error: #C47575;
}
```

### Typography

- Display: Playfair Display (serif)
- Body: Inter (sans-serif)
- Labels: 11px, uppercase, 0.1em letter-spacing

### Component Classes

| Class | Purpose |
|-------|---------|
| `.shop-btn` | Base button style |
| `.shop-btn-primary` | Dark charcoal button |
| `.shop-btn-secondary` | White outlined button |
| `.shop-card` | Card container |
| `.shop-skeleton` | Loading placeholder |
| `.shop-tag` | Filter tag pill |
| `.shop-badge` | Product badge |

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | < 640px | 2 |
| Tablet | 640px - 1023px | 2-3 |
| Desktop | 1024px - 1279px | 3 |
| Large | ≥ 1280px | 4 |

### Mobile Optimizations

1. **Filter Drawer**: Slide-in panel instead of sidebar
2. **Sticky Controls**: Fixed filter/sort bar
3. **Touch Gestures**: Swipe for image carousel
4. **Simplified UI**: Condensed sort options

---

## Performance Optimizations

### Direct NeonDB Connection

- Uses `@neondatabase/serverless` HTTP driver
- Queries run over fetch API (no WebSocket needed)
- Works in browser environments (Vite dev server, static hosting)

### Image Loading

- Lazy loading with `loading="lazy"`
- Proper aspect ratios to prevent layout shift
- Placeholder backgrounds during load

### Query Optimization

- Uses SQL `json_agg()` for colors and images (single query per product)
- Parallel execution with `Promise.all()` for count, products, and aggregations
- Indexed columns: category_id, brand_id, price_cents, popularity, created_at

### Caching

- In-memory cache with 5-minute TTL
- Caches categories, spaces, styles, and featured products
- Cache key based on query parameters

### Code Splitting

- Dynamic imports for route components
- Async component loading

---

## Known Limitations

### Missing Database Columns

The following fields are not in the database and are currently hardcoded or derived:

| Field | Current Implementation | Recommended Fix |
|-------|----------------------|-----------------|
| `in_stock` | Hardcoded to `true` | Add `in_stock BOOLEAN` column |
| `stock_count` | Hardcoded to `10` | Add `stock_count INTEGER` column |
| `is_new` | Hardcoded to `false` | Add `is_new BOOLEAN` column or derive from `created_at` |
| `is_best_seller` | Derived from `popularity >= 90` | Current approach is acceptable |
| `is_featured` | Derived from `popularity >= 85` | Current approach is acceptable |
| `original_price` | Not available (no discounts) | Add `original_price_cents INTEGER` column |
| `discount` | Always `0` | Derive from `(original_price - price) / original_price * 100` |

### Color Hex Codes

Many color entries in the `colors` table have `NULL` hex_code values. The `COLOR_HEX_MAP` constant in `shopApi.js` provides fallback hex codes for common colors:

```javascript
const COLOR_HEX_MAP = {
  'Natural': '#E5D3B3',
  'Dark Brown': '#4A3728',
  'Navy Blue': '#1F3A5F',
  // ... 20+ more colors
}
```

**Recommended**: Update the database to populate hex_code values.

### Product Associations

Not all products have `space_id` and `style_id` associations. This is expected — products primarily belong to categories. Space and style are optional design filters.

### Special Offers

The `getSpecialOffers()` function returns static data. There is no database table for promotional banners.

**Recommended**: Create a `special_offers` table with fields: id, title, subtitle, image, link, badge, active, display_order.

---

## Environment Variables

```bash
# frontend/.env
VITE_API_URL="http://localhost:8787/backend"  # Existing backend API
VITE_PRODUCTS_DB_URL="postgresql://neondb_owner:npg_tnCUizvkR76D@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

---

## Testing Checklist

- [x] Page loads without errors
- [x] Category routes work (`/shop/category/furniture`)
- [x] Space routes work (`/shop/design/space/bedroom`)
- [x] Style routes work (`/shop/design/style/minimalist`)
- [x] Filters apply correctly
- [x] Mobile filter drawer opens/closes
- [x] Sort changes product order
- [x] Pagination works
- [x] Product cards show correct data
- [x] Image carousel swipe works on mobile
- [x] Skeleton loading shows during data fetch
- [x] Breadcrumbs navigate correctly
- [x] Responsive layout at all breakpoints
- [x] Product detail page loads with related products
- [x] Color swatches display with hex codes
- [x] Dynamic categories load in filter sidebar

---

## Future Enhancements

### Database Schema

1. **Add missing columns**: `in_stock`, `stock_count`, `is_new`, `original_price_cents`
2. **Populate color hex codes**: Fill NULL values in `colors.hex_code`
3. **Create special offers table**: For dynamic promotional banners
4. **Add product dimensions table**: Separate table for width, height, depth, weight

### Features

1. **Search Functionality**: Full-text search with autocomplete
2. **Recently Viewed**: Track and display viewed products
3. **Compare Products**: Side-by-side comparison
4. **Saved Filters**: Save filter presets
5. **Price Alerts**: Notify on price drops
6. **AR Preview**: 3D/AR product visualization
7. **Inventory Sync**: Real-time stock updates
8. **Analytics**: Track user behavior

### Performance

1. **Database indexes**: Add composite indexes for common filter combinations
2. **CDN for images**: Serve product images from CDN
3. **Server-side rendering**: Consider SSR for SEO
4. **Service Worker**: Cache API responses offline

---

## API Migration Notes

### Previous Architecture (Mock API)

The shop was previously built with a mock API that simulated backend responses with static data and delays. This has been completely replaced.

### Current Architecture (Direct NeonDB)

- **No backend API layer**: Frontend connects directly to NeonDB via HTTP
- **Client-side queries**: All SQL queries run in the browser using `@neondatabase/serverless`
- **Connection pooling**: Handled automatically by Neon's HTTP endpoint
- **No WebSockets needed**: Pure HTTP/fetch based

### Security Considerations

**Public read access**: The products database uses Row-Level Security (RLS) with a public read policy. This is acceptable for read-only product browsing. Write operations (cart, orders, users) should use separate authenticated APIs.

---

## Support

For questions or issues, refer to:
- Codebase comments in `src/api/shopApi.js`
- Database migration files in `database/Products/migrations/`
- `database/products_db_docs.md` for schema documentation

**Last Updated**: February 11, 2026  
**Version**: 3.0.0 (Production with NeonDB)
