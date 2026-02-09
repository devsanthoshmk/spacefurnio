# Space Furnio - Shop Module Documentation

## Overview

This documentation covers the reimagined shop pages for Space Furnio, a furniture e-commerce platform. The design follows a warm, beige minimalist aesthetic inspired by high-end furniture retailers.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [Mock Backend API](#mock-backend-api)
4. [Features Overview](#features-overview)
5. [Migration to Real Database](#migration-to-real-database)
6. [Styling System](#styling-system)
7. [Responsive Design](#responsive-design)
8. [Performance Optimizations](#performance-optimizations)

---

## Project Structure

```
frontend/src/
├── api/
│   └── shopApi.js            # Mock backend API service
├── assets/
│   ├── main.css              # Global styles
│   └── shop.css              # Shop design system tokens
├── components/
│   └── shop/
│       ├── FilterSidebar.vue     # Filter panel component
│       ├── ProductCardNew.vue    # Product card with carousel
│       ├── ProductListing.vue    # Product listing page
│       ├── ShopCategory.vue      # Category grid (legacy)
│       └── ShopDesign.vue        # Design grid (legacy)
├── views/
│   └── ShopView.vue          # Shop root page
└── router/
    └── index.js              # Route definitions
```

---

## Component Architecture

### ShopView.vue (Root Shop Page)

The main entry point for the shop section. Features:

- **Special Offers Banner**: Promotional cards with hover effects
- **Category/Design Toggle**: Smooth animated tab switching
- **Category Grid**: Icon-based navigation cards
- **Space-specific Section**: Room-based filtering
- **Style-specific Section**: Design aesthetic filtering
- **Featured Products**: Popular items showcase
- **Contact CTA**: Customer service section

### ProductListing.vue

Full product listing page with:

- **Sticky Header**: Breadcrumbs, title, sort controls
- **Filter Sidebar**: Desktop filter panel (260px width)
- **Mobile Filter Drawer**: Slide-in filter panel
- **Product Grid**: Responsive 1-4 column layout
- **Pagination**: Full pagination or "Load More" option
- **Skeleton Loading**: Animated loading placeholders

### FilterSidebar.vue

Comprehensive filtering system:

- **Category Filter**: Radio button selection
- **Price Range**: Input fields + slider + quick options
- **Brand Filter**: Searchable radio list
- **Material Filter**: Collapsible checkbox list
- **Color Filter**: Visual color swatch grid
- **Availability**: Toggle switches (In Stock, On Sale, New)

### ProductCardNew.vue

Feature-rich product card:

- **Image Carousel**: Touch/swipe and arrow navigation
- **Quick Actions**: Wishlist heart, cart button
- **Badges**: New, Sale, Bestseller
- **Color Options**: Visual color dots
- **Grid/List Views**: Adapts layout based on view mode

---

## Mock Backend API

### Location: `src/api/shopApi.js`

The mock API simulates real backend responses with realistic data and delays.

### Available Functions

```javascript
// Get all product categories
await shopApi.getCategories()

// Get room/space options
await shopApi.getSpaces()

// Get design styles
await shopApi.getStyles()

// Get products with filtering
await shopApi.getProducts({
  category: 'furniture',
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

// Get single product
await shopApi.getProduct('product_id')

// Get featured products
await shopApi.getFeaturedProducts()

// Get filter options
await shopApi.getFilterOptions('furniture')

// Search products
await shopApi.searchProducts('dining table', 10)

// Get special offers
await shopApi.getSpecialOffers()
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
  aggregations: {        // For filtering
    brands: [...],
    materials: [...],
    colors: [...],
    priceRange: { min: 0, max: 5000 },
  },
}
```

---

## Features Overview

### 1. Product Filtering

| Filter Type | Implementation | Notes |
|-------------|---------------|-------|
| Category | Radio buttons | Single selection |
| Price | Range inputs + slider | Quick options available |
| Brand | Searchable radio list | With count indicators |
| Material | Radio list | Collapsible |
| Color | Visual swatches | Multi-select |
| Availability | Toggle switches | In Stock, On Sale, New |

### 2. Sorting Options

- Most Popular (default)
- Best Rating
- Newest First
- Price: Low to High
- Price: High to Low

### 3. View Modes

- **Grid View**: 2-4 columns based on screen size
- **List View**: Single column with full product details

### 4. Image Gallery

- Touch/swipe navigation on mobile
- Arrow buttons on desktop hover
- Dot indicators for position
- Auto-advance on hover (shows second image)

### 5. Loading States

All components include skeleton loading states that match the warm beige theme:
- Shimmer animation effect
- Proper aspect ratios
- Content-aware placeholders

---

## Migration to Real Database

### Overview

The mock API is designed for easy migration to NeonDB (PostgreSQL) with Row-Level Security (RLS) and Cloudflare Workers for backend logic.

### Step 1: Set Up NeonDB

```sql
-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount INTEGER DEFAULT 0,
  brand VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  material VARCHAR(100),
  colors JSONB DEFAULT '[]',
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 50,
  in_stock BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  thumbnail VARCHAR(500),
  description TEXT,
  features JSONB DEFAULT '[]',
  dimensions JSONB,
  weight DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  product_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0
);

-- Create spaces table (rooms)
CREATE TABLE spaces (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50)
);

-- Create styles table
CREATE TABLE styles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image VARCHAR(500),
  description TEXT
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Public read policy (no auth required for browsing)
CREATE POLICY "Allow public read" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON categories
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_popularity ON products(popularity DESC);
```

### Step 2: Create Cloudflare Worker

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (path === '/api/products') {
        return handleProducts(request, env, corsHeaders);
      }
      
      if (path === '/api/categories') {
        return handleCategories(env, corsHeaders);
      }

      if (path.match(/^\/api\/products\/[\w-]+$/)) {
        const id = path.split('/').pop();
        return handleProduct(id, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleProducts(request, env, corsHeaders) {
  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Build query
  let query = 'SELECT * FROM products WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  if (params.get('category')) {
    query += ` AND category = $${paramIndex++}`;
    values.push(params.get('category'));
  }

  if (params.get('brand')) {
    query += ` AND brand = $${paramIndex++}`;
    values.push(params.get('brand'));
  }

  if (params.get('minPrice')) {
    query += ` AND price >= $${paramIndex++}`;
    values.push(parseFloat(params.get('minPrice')));
  }

  if (params.get('maxPrice')) {
    query += ` AND price <= $${paramIndex++}`;
    values.push(parseFloat(params.get('maxPrice')));
  }

  // Sorting
  const sort = params.get('sort') || 'popularity';
  const order = params.get('order') || 'desc';
  const sortColumn = {
    price: 'price',
    rating: 'rating',
    newest: 'created_at',
    popularity: 'popularity',
  }[sort] || 'popularity';
  
  query += ` ORDER BY ${sortColumn} ${order.toUpperCase()}`;

  // Pagination
  const page = parseInt(params.get('page')) || 1;
  const limit = Math.min(parseInt(params.get('limit')) || 12, 50);
  const offset = (page - 1) * limit;
  
  query += ` LIMIT ${limit} OFFSET ${offset}`;

  // Execute query using Neon serverless driver
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(env.DATABASE_URL);
  
  const products = await sql(query, values);
  
  // Get total count
  const countResult = await sql`SELECT COUNT(*) FROM products`;
  const total = parseInt(countResult[0].count);

  return new Response(JSON.stringify({
    success: true,
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

### Step 3: Update API Service

Replace the mock API with real API calls:

```javascript
// src/api/shopApi.js

const API_BASE = 'https://your-worker.your-subdomain.workers.dev/api';

export async function getProducts(options = {}) {
  const params = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
  });

  const response = await fetch(`${API_BASE}/products?${params}`);
  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_BASE}/categories`);
  return response.json();
}

// ... similar updates for other functions
```

### Step 4: Environment Variables

```bash
# .env.local (Vite)
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev/api

# wrangler.toml (Cloudflare Worker)
[vars]
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"
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

### Image Loading

- Lazy loading with `loading="lazy"`
- Proper aspect ratios to prevent layout shift
- Placeholder backgrounds during load

### Code Splitting

- Dynamic imports for route components
- Async component loading

### Caching Strategy

```javascript
// In shopApi.js - simple in-memory cache
const cache = new Map();

export async function getProducts(options) {
  const cacheKey = JSON.stringify(options);
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 60000) { // 1 minute
      return cached.data;
    }
  }
  
  const data = await fetchProducts(options);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

---

## Testing Checklist

- [ ] Page loads without errors
- [ ] Category toggle animation works
- [ ] Filters apply correctly
- [ ] Filters persist on page navigation
- [ ] Mobile filter drawer opens/closes
- [ ] Sort changes product order
- [ ] Pagination/Load More works
- [ ] Product cards show correct data
- [ ] Image carousel swipe works on mobile
- [ ] Quick actions (wishlist, cart) trigger events
- [ ] Skeleton loading shows during data fetch
- [ ] Empty state displays when no products
- [ ] Breadcrumbs navigate correctly
- [ ] Responsive layout at all breakpoints

---

## Future Enhancements

1. **Search Functionality**: Full-text search with autocomplete
2. **Recently Viewed**: Track and display viewed products
3. **Compare Products**: Side-by-side comparison
4. **Saved Filters**: Save filter presets
5. **Price Alerts**: Notify on price drops
6. **AR Preview**: 3D/AR product visualization
7. **Inventory Sync**: Real-time stock updates
8. **Analytics**: Track user behavior

---

## Support

For questions or issues, refer to the codebase comments or contact the development team.

**Last Updated**: February 8, 2026  
**Version**: 2.0.0
