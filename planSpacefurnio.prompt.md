# Spacefurnio Backend Implementation Plan

## 📋 Executive Summary

This document outlines a comprehensive backend implementation plan for the Spacefurnio furniture e-commerce platform. The architecture leverages **Neon PostgreSQL** with Row-Level Security (RLS) for cost-effective direct database access, **Cloudflare Workers** for authentication and complex operations, and integrates with the existing Vue.js 3 frontend deployed on Cloudflare Pages.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                       │
│                     (Vue.js 3 on Cloudflare Pages)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
          │  Direct Neon    │ │  Cloudflare │ │  Cloudflare     │
          │  (with RLS)     │ │  Workers    │ │  Workers (Auth) │
          │                 │ │  (Complex)  │ │                 │
          │  • Products     │ │  • Cart Ops │ │  • OAuth        │
          │  • Categories   │ │  • Checkout │ │  • Magic Link   │
          │  • Reviews(R)   │ │  • Orders   │ │  • Session Mgmt │
          └────────┬────────┘ └──────┬──────┘ └────────┬────────┘
                   │                 │                 │
                   └─────────────────┼─────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │        Neon PostgreSQL          │
                    │    (with Row-Level Security)    │
                    └─────────────────────────────────┘
                                     │
                    ┌─────────────────────────────────┐
                    │      GitHub Actions (Cron)      │
                    │  • Clean expired magic links    │
                    │  • Clean abandoned carts        │
                    └─────────────────────────────────┘
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.js              # Main worker entry point
│   ├── routes/
│   │   ├── auth.js           # OAuth & Magic Link routes
│   │   ├── cart.js           # Cart operations
│   │   ├── wishlist.js       # Wishlist operations
│   │   ├── orders.js         # Order management
│   │   └── reviews.js        # Review operations
│   ├── middleware/
│   │   ├── auth.js           # JWT validation middleware
│   │   └── cors.js           # CORS handling
│   ├── services/
│   │   ├── email.js          # Nodemailer service
│   │   ├── oauth.js          # OAuth providers
│   │   └── jwt.js            # JWT utilities
│   ├── db/
│   │   └── neon.js           # Neon connection helper
│   └── utils/
│       └── response.js       # Response helpers
├── wrangler.jsonc
├── package.json
└── .env

database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   └── 003_functions.sql
├── seeds/
│   └── initial_data.sql
└── .env

.github/
└── workflows/
    ├── cleanup-magic-links.yml
    └── cleanup-abandoned-carts.yml
```

---

## 🗄️ Database Schema

### Complete SQL Migration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'github'
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- ============================================
-- MAGIC LINKS TABLE
-- ============================================
CREATE TABLE magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_expires ON magic_links(expires_at) WHERE used_at IS NULL;

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),

    -- Inventory
    quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    low_stock_threshold INTEGER DEFAULT 5,

    -- Categorization
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),

    -- Attributes (stored as JSONB for flexibility)
    material VARCHAR(100),
    colors JSONB DEFAULT '[]',
    dimensions JSONB, -- {width, height, depth, unit}
    weight DECIMAL(10, 2),
    weight_unit VARCHAR(10) DEFAULT 'kg',

    -- Design attributes
    style VARCHAR(100), -- 'modern', 'traditional', 'minimalist', etc.
    room VARCHAR(100),  -- 'living', 'bedroom', 'dining', etc.
    space_type VARCHAR(100), -- For design-specific categorization
    design_type VARCHAR(100), -- 'brutalist', 'japandi', etc.

    -- Media
    images JSONB DEFAULT '[]', -- [{url, alt, sort_order}]
    model_3d_url TEXT,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Ratings (denormalized for performance)
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'archived'
    is_featured BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating_average DESC);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_room ON products(room);
CREATE INDEX idx_products_style ON products(style);
CREATE INDEX idx_products_brand ON products(brand);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, ''))
);

-- ============================================
-- PRODUCT VARIANTS TABLE (for different colors/sizes)
-- ============================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    price_modifier DECIMAL(10, 2) DEFAULT 0, -- Added to base price
    quantity INTEGER DEFAULT 0,
    color VARCHAR(50),
    size VARCHAR(50),
    attributes JSONB DEFAULT '{}',
    image_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- ============================================
-- CART TABLE
-- ============================================
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest carts
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'converted', 'abandoned'
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_total DECIMAL(12, 2) DEFAULT 0,
    tax_total DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    coupon_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',

    CONSTRAINT cart_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires ON carts(expires_at) WHERE status = 'active';

-- ============================================
-- CART ITEMS TABLE
-- ============================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    selected_color VARCHAR(50),
    selected_options JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cart_id, product_id, variant_id, selected_color)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Wishlist',
    is_default BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE UNIQUE INDEX idx_wishlists_default ON wishlists(user_id) WHERE is_default = TRUE;

-- ============================================
-- WISHLIST ITEMS TABLE
-- ============================================
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    selected_color VARCHAR(50),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(wishlist_id, product_id, variant_id)
);

CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product ON wishlist_items(product_id);

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'shipping', -- 'shipping', 'billing'
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
    phone VARCHAR(20),
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(30) DEFAULT 'pending',
    -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    payment_status VARCHAR(30) DEFAULT 'pending',
    -- 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
    fulfillment_status VARCHAR(30) DEFAULT 'unfulfilled',
    -- 'unfulfilled', 'partially_fulfilled', 'fulfilled'

    -- Pricing
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_total DECIMAL(12, 2) DEFAULT 0,
    shipping_total DECIMAL(12, 2) DEFAULT 0,
    tax_total DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,

    -- Coupon
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(12, 2) DEFAULT 0,

    -- Addresses (stored as JSONB for historical accuracy)
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,

    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Shipping
    shipping_method VARCHAR(100),
    shipping_carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

    -- Product snapshot (for historical accuracy)
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_image TEXT,
    selected_color VARCHAR(50),
    selected_options JSONB DEFAULT '{}',

    -- Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(12, 2) NOT NULL,

    -- Fulfillment
    fulfilled_quantity INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,

    -- Media
    images JSONB DEFAULT '[]', -- [{url, caption}]

    -- Verification
    verified_purchase BOOLEAN DEFAULT FALSE,

    -- Moderation
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderation_notes TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES users(id),

    -- Engagement
    helpful_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- ============================================
-- REVIEW HELPFUL VOTES TABLE
-- ============================================
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_votes_review ON review_votes(review_id);

-- ============================================
-- COUPONS TABLE
-- ============================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,

    -- Discount type
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
    discount_value DECIMAL(10, 2) NOT NULL,

    -- Constraints
    minimum_amount DECIMAL(10, 2),
    maximum_discount DECIMAL(10, 2),

    -- Limits
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1,

    -- Validity
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Restrictions
    applies_to JSONB DEFAULT '{}', -- {categories: [], products: [], exclude_sale: boolean}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active, starts_at, expires_at);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDER NUMBER GENERATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(3) := 'SF';
    date_part VARCHAR(8);
    sequence_part VARCHAR(6);
    new_number VARCHAR(50);
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');

    SELECT LPAD((COALESCE(MAX(CAST(SUBSTRING(order_number FROM 11) AS INTEGER)), 0) + 1)::TEXT, 6, '0')
    INTO sequence_part
    FROM orders
    WHERE order_number LIKE prefix || date_part || '%';

    new_number := prefix || date_part || sequence_part;
    NEW.order_number := new_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- UPDATE PRODUCT RATING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET
        rating_average = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND status = 'approved'
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND status = 'approved'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND status = 'approved'
            AND content IS NOT NULL
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- ============================================
-- UPDATE CART TOTALS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_cart_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE carts
    SET
        subtotal = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM cart_items
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ),
        total = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM cart_items
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ) - COALESCE(discount_total, 0) + COALESCE(tax_total, 0)
    WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_totals();
```

### Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE ROLES
-- ============================================
-- Anon role for public access
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END $$;

-- Authenticated role for logged-in users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END $$;

-- Service role for backend workers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Categories - Public read
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;
GRANT ALL ON categories TO service_role;

-- Products - Public read for active products
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON products TO service_role;

-- Product Variants - Public read
GRANT SELECT ON product_variants TO anon;
GRANT SELECT ON product_variants TO authenticated;
GRANT ALL ON product_variants TO service_role;

-- Reviews - Public read approved, authenticated can create
GRANT SELECT ON reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;
GRANT ALL ON reviews TO service_role;

-- Review Votes - Authenticated only
GRANT SELECT, INSERT, DELETE ON review_votes TO authenticated;
GRANT ALL ON review_votes TO service_role;

-- Users - Authenticated can read own
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Sessions - Service only
GRANT ALL ON sessions TO service_role;

-- Magic Links - Service only
GRANT ALL ON magic_links TO service_role;

-- Carts - Users can manage own carts
GRANT SELECT, INSERT, UPDATE, DELETE ON carts TO authenticated;
GRANT ALL ON carts TO service_role;

-- Cart Items - Users can manage own cart items
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
GRANT ALL ON cart_items TO service_role;

-- Wishlists - Users can manage own wishlists
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlists TO authenticated;
GRANT ALL ON wishlists TO service_role;

-- Wishlist Items - Users can manage own wishlist items
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlist_items TO authenticated;
GRANT ALL ON wishlist_items TO service_role;

-- Addresses - Users can manage own addresses
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO authenticated;
GRANT ALL ON addresses TO service_role;

-- Orders - Users can read own orders
GRANT SELECT ON orders TO authenticated;
GRANT ALL ON orders TO service_role;

-- Order Items - Users can read own order items
GRANT SELECT ON order_items TO authenticated;
GRANT ALL ON order_items TO service_role;

-- Coupons - Public read for active coupons
GRANT SELECT ON coupons TO anon;
GRANT SELECT ON coupons TO authenticated;
GRANT ALL ON coupons TO service_role;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Categories Policies
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Service role can manage categories"
    ON categories FOR ALL
    TO service_role
    USING (TRUE);

-- Products Policies
CREATE POLICY "Active products are viewable by everyone"
    ON products FOR SELECT
    USING (status = 'active');

CREATE POLICY "Service role can manage products"
    ON products FOR ALL
    TO service_role
    USING (TRUE);

-- Product Variants Policies
CREATE POLICY "Active variants are viewable by everyone"
    ON product_variants FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Service role can manage variants"
    ON product_variants FOR ALL
    TO service_role
    USING (TRUE);

-- Users Policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Service role can manage users"
    ON users FOR ALL
    TO service_role
    USING (TRUE);

-- Sessions Policies (Service role only)
CREATE POLICY "Service role can manage sessions"
    ON sessions FOR ALL
    TO service_role
    USING (TRUE);

-- Magic Links Policies (Service role only)
CREATE POLICY "Service role can manage magic links"
    ON magic_links FOR ALL
    TO service_role
    USING (TRUE);

-- Carts Policies
CREATE POLICY "Users can view own carts"
    ON carts FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create own carts"
    ON carts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own carts"
    ON carts FOR UPDATE
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can delete own carts"
    ON carts FOR DELETE
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Service role can manage carts"
    ON carts FOR ALL
    TO service_role
    USING (TRUE);

-- Cart Items Policies
CREATE POLICY "Users can view own cart items"
    ON cart_items FOR SELECT
    TO authenticated
    USING (
        cart_id IN (
            SELECT id FROM carts
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY "Users can manage own cart items"
    ON cart_items FOR ALL
    TO authenticated
    USING (
        cart_id IN (
            SELECT id FROM carts
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY "Service role can manage cart items"
    ON cart_items FOR ALL
    TO service_role
    USING (TRUE);

-- Wishlists Policies
CREATE POLICY "Users can view own wishlists"
    ON wishlists FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Anyone can view public wishlists"
    ON wishlists FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Users can manage own wishlists"
    ON wishlists FOR ALL
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Service role can manage wishlists"
    ON wishlists FOR ALL
    TO service_role
    USING (TRUE);

-- Wishlist Items Policies
CREATE POLICY "Users can view own wishlist items"
    ON wishlist_items FOR SELECT
    TO authenticated
    USING (
        wishlist_id IN (
            SELECT id FROM wishlists
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY "Anyone can view public wishlist items"
    ON wishlist_items FOR SELECT
    USING (
        wishlist_id IN (
            SELECT id FROM wishlists
            WHERE is_public = TRUE
        )
    );

CREATE POLICY "Users can manage own wishlist items"
    ON wishlist_items FOR ALL
    TO authenticated
    USING (
        wishlist_id IN (
            SELECT id FROM wishlists
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY "Service role can manage wishlist items"
    ON wishlist_items FOR ALL
    TO service_role
    USING (TRUE);

-- Addresses Policies
CREATE POLICY "Users can view own addresses"
    ON addresses FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can manage own addresses"
    ON addresses FOR ALL
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Service role can manage addresses"
    ON addresses FOR ALL
    TO service_role
    USING (TRUE);

-- Orders Policies
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Service role can manage orders"
    ON orders FOR ALL
    TO service_role
    USING (TRUE);

-- Order Items Policies
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM orders
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY "Service role can manage order items"
    ON order_items FOR ALL
    TO service_role
    USING (TRUE);

-- Reviews Policies
CREATE POLICY "Approved reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Users can view own reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own pending reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (
        user_id = current_setting('app.current_user_id')::UUID
        AND status = 'pending'
    );

CREATE POLICY "Users can delete own pending reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (
        user_id = current_setting('app.current_user_id')::UUID
        AND status = 'pending'
    );

CREATE POLICY "Service role can manage reviews"
    ON reviews FOR ALL
    TO service_role
    USING (TRUE);

-- Review Votes Policies
CREATE POLICY "Users can vote on reviews"
    ON review_votes FOR ALL
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Service role can manage review votes"
    ON review_votes FOR ALL
    TO service_role
    USING (TRUE);

-- Coupons Policies
CREATE POLICY "Active coupons are viewable"
    ON coupons FOR SELECT
    USING (
        is_active = TRUE
        AND starts_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
    );

CREATE POLICY "Service role can manage coupons"
    ON coupons FOR ALL
    TO service_role
    USING (TRUE);
```

### Utility Functions

```sql
-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to set the current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get products with filtering and pagination
CREATE OR REPLACE FUNCTION get_products(
    p_category_slug VARCHAR DEFAULT NULL,
    p_room VARCHAR DEFAULT NULL,
    p_style VARCHAR DEFAULT NULL,
    p_brand VARCHAR DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_colors TEXT[] DEFAULT NULL,
    p_material VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_sort_by VARCHAR DEFAULT 'popular',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    price DECIMAL,
    compare_at_price DECIMAL,
    brand VARCHAR,
    images JSONB,
    rating_average DECIMAL,
    review_count INTEGER,
    room VARCHAR,
    style VARCHAR,
    material VARCHAR,
    colors JSONB,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_products AS (
        SELECT
            p.*,
            COUNT(*) OVER() as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
            AND (p_category_slug IS NULL OR c.slug = p_category_slug)
            AND (p_room IS NULL OR p.room = p_room)
            AND (p_style IS NULL OR p.style = p_style)
            AND (p_brand IS NULL OR p.brand = p_brand)
            AND (p_min_price IS NULL OR p.price >= p_min_price)
            AND (p_max_price IS NULL OR p.price <= p_max_price)
            AND (p_material IS NULL OR p.material = p_material)
            AND (p_colors IS NULL OR p.colors ?| p_colors)
            AND (
                p_search IS NULL OR
                to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.brand, ''))
                @@ plainto_tsquery('english', p_search)
            )
    )
    SELECT
        fp.id,
        fp.name,
        fp.slug,
        fp.price,
        fp.compare_at_price,
        fp.brand,
        fp.images,
        fp.rating_average,
        fp.review_count,
        fp.room,
        fp.style,
        fp.material,
        fp.colors,
        fp.total
    FROM filtered_products fp
    ORDER BY
        CASE WHEN p_sort_by = 'popular' THEN fp.review_count END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'rating' THEN fp.rating_average END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'price_asc' THEN fp.price END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN fp.price END DESC,
        CASE WHEN p_sort_by = 'newest' THEN fp.created_at END DESC,
        fp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get product details with reviews summary
CREATE OR REPLACE FUNCTION get_product_details(p_slug VARCHAR)
RETURNS TABLE (
    product JSONB,
    review_summary JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        row_to_json(p.*)::JSONB as product,
        (
            SELECT jsonb_build_object(
                'average_rating', COALESCE(AVG(r.rating), 0),
                'total_reviews', COUNT(*),
                'rating_distribution', jsonb_build_object(
                    '5', COUNT(*) FILTER (WHERE r.rating = 5),
                    '4', COUNT(*) FILTER (WHERE r.rating = 4),
                    '3', COUNT(*) FILTER (WHERE r.rating = 3),
                    '2', COUNT(*) FILTER (WHERE r.rating = 2),
                    '1', COUNT(*) FILTER (WHERE r.rating = 1)
                )
            )
            FROM reviews r
            WHERE r.product_id = p.id AND r.status = 'approved'
        ) as review_summary
    FROM products p
    WHERE p.slug = p_slug AND p.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get reviews with pagination
CREATE OR REPLACE FUNCTION get_product_reviews(
    p_product_id UUID,
    p_sort_by VARCHAR DEFAULT 'newest',
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_name VARCHAR,
    user_avatar TEXT,
    rating INTEGER,
    title VARCHAR,
    content TEXT,
    images JSONB,
    verified_purchase BOOLEAN,
    helpful_count INTEGER,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        r.rating,
        r.title,
        r.content,
        r.images,
        r.verified_purchase,
        r.helpful_count,
        r.created_at,
        COUNT(*) OVER() as total_count
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = p_product_id AND r.status = 'approved'
    ORDER BY
        CASE WHEN p_sort_by = 'newest' THEN r.created_at END DESC,
        CASE WHEN p_sort_by = 'oldest' THEN r.created_at END ASC,
        CASE WHEN p_sort_by = 'helpful' THEN r.helpful_count END DESC,
        CASE WHEN p_sort_by = 'highest' THEN r.rating END DESC,
        CASE WHEN p_sort_by = 'lowest' THEN r.rating END ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to clean up expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM magic_links
        WHERE expires_at < NOW() OR used_at IS NOT NULL
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM sessions
        WHERE expires_at < NOW()
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up abandoned carts
CREATE OR REPLACE FUNCTION cleanup_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM carts
        WHERE status = 'active' AND expires_at < NOW()
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to merge guest cart with user cart on login
CREATE OR REPLACE FUNCTION merge_carts(
    p_user_id UUID,
    p_session_id VARCHAR
)
RETURNS UUID AS $$
DECLARE
    user_cart_id UUID;
    guest_cart_id UUID;
BEGIN
    -- Get or create user cart
    SELECT id INTO user_cart_id
    FROM carts
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF user_cart_id IS NULL THEN
        INSERT INTO carts (user_id, status)
        VALUES (p_user_id, 'active')
        RETURNING id INTO user_cart_id;
    END IF;

    -- Get guest cart
    SELECT id INTO guest_cart_id
    FROM carts
    WHERE session_id = p_session_id AND status = 'active'
    LIMIT 1;

    -- Merge items if guest cart exists
    IF guest_cart_id IS NOT NULL THEN
        -- Insert or update cart items
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, total_price, selected_color, selected_options)
        SELECT
            user_cart_id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price,
            selected_color,
            selected_options
        FROM cart_items
        WHERE cart_id = guest_cart_id
        ON CONFLICT (cart_id, product_id, variant_id, selected_color)
        DO UPDATE SET
            quantity = cart_items.quantity + EXCLUDED.quantity,
            total_price = (cart_items.quantity + EXCLUDED.quantity) * EXCLUDED.unit_price;

        -- Delete guest cart
        DELETE FROM carts WHERE id = guest_cart_id;
    END IF;

    RETURN user_cart_id;
END;
$$ LANGUAGE plpgsql;
```

---

## ⚙️ Backend Implementation

### Package Configuration

```json
{
  "name": "spacefurnio-backend",
  "version": "1.0.0",
  "description": "Spacefurnio E-commerce Backend on Cloudflare Workers",
  "main": "src/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "jose": "^5.2.0",
    "itty-router": "^4.0.27"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.1.0",
    "vitest": "^1.2.0",
    "wrangler": "^3.22.0"
  }
}
```

### Wrangler Configuration

```jsonc
{
  "name": "spacefurnio-api",
  "main": "src/index.js",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],

  // Environment variables (set via dashboard or wrangler secret)
  "vars": {
    "ENVIRONMENT": "production",
    "FRONTEND_URL": "https://spacefurnio.pages.dev",
    "JWT_ISSUER": "spacefurnio",
    "JWT_AUDIENCE": "spacefurnio-api",
    "MAGIC_LINK_EXPIRY_MINUTES": "15",
    "SESSION_EXPIRY_DAYS": "30"
  },

  // KV namespaces for rate limiting and caching
  "kv_namespaces": [
    { "binding": "RATE_LIMIT", "id": "your-kv-id-here" },
    { "binding": "CACHE", "id": "your-cache-kv-id-here" }
  ],

  // Secrets (set via: wrangler secret put SECRET_NAME)
  // - DATABASE_URL: Neon connection string
  // - JWT_SECRET: Secret for signing JWTs
  // - GOOGLE_CLIENT_ID: Google OAuth client ID
  // - GOOGLE_CLIENT_SECRET: Google OAuth client secret
  // - EMAIL_USER: Gmail address for sending emails
  // - EMAIL_APP_PASSWORD: Gmail app password

  // Development settings
  "dev": {
    "port": 8787,
    "local_protocol": "http"
  }
}
```

### Main Worker Entry Point

```javascript
import { Router } from "itty-router";
import { corsMiddleware, handleOptions } from "./middleware/cors";
import { authMiddleware, optionalAuthMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rateLimit";

// Route handlers
import { authRoutes } from "./routes/auth";
import { productRoutes } from "./routes/products";
import { cartRoutes } from "./routes/cart";
import { wishlistRoutes } from "./routes/wishlist";
import { reviewRoutes } from "./routes/reviews";
import { orderRoutes } from "./routes/orders";
import { userRoutes } from "./routes/user";

// Initialize router
const router = Router();

// Global middleware
router.all("*", corsMiddleware);
router.options("*", handleOptions);

// Public routes (with rate limiting)
router.all("/api/auth/*", rateLimitMiddleware);
router.all("/api/auth/*", authRoutes.handle);

// Product routes (public read, some require auth)
router.get("/api/products*", optionalAuthMiddleware, productRoutes.handle);
router.get("/api/categories*", productRoutes.handle);

// Review routes (public read, authenticated write)
router.get("/api/reviews*", reviewRoutes.handle);
router.post("/api/reviews*", authMiddleware, reviewRoutes.handle);
router.put("/api/reviews*", authMiddleware, reviewRoutes.handle);
router.delete("/api/reviews*", authMiddleware, reviewRoutes.handle);

// Protected routes
router.all("/api/cart/*", authMiddleware, cartRoutes.handle);
router.all("/api/wishlist/*", authMiddleware, wishlistRoutes.handle);
router.all("/api/orders/*", authMiddleware, orderRoutes.handle);
router.all("/api/user/*", authMiddleware, userRoutes.handle);

// Health check
router.get("/api/health", () => {
  return new Response(
    JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});

// 404 handler
router.all("*", () => {
  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "The requested endpoint does not exist",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
});

// Error handler
const errorHandler = (error, request, env) => {
  console.error("Worker error:", error);

  const isDev = env.ENVIRONMENT === "development";

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: isDev ? error.message : "An unexpected error occurred",
      ...(isDev && { stack: error.stack }),
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export default {
  async fetch(request, env, ctx) {
    try {
      // Attach env to request for use in handlers
      request.env = env;
      request.ctx = ctx;

      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error, request, env);
    }
  },
};
```

### Database Connection Helper

```javascript
import { neon, neonConfig } from "@neondatabase/serverless";

// Configure Neon for Cloudflare Workers
neonConfig.fetchConnectionCache = true;

/**
 * Creates a Neon SQL client with the database URL from environment
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Function} SQL template tag function
 */
export function createDbClient(env) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(env.DATABASE_URL);
}

/**
 * Execute a query with user context for RLS
 * @param {Object} env - Cloudflare Worker environment
 * @param {string|null} userId - Current user ID (null for anonymous)
 * @param {Function} queryFn - Function that takes sql client and returns query
 */
export async function executeWithContext(env, userId, queryFn) {
  const sql = createDbClient(env);

  // Set user context for RLS if authenticated
  if (userId) {
    await sql`SELECT set_config('app.current_user_id', ${userId}, true)`;
  }

  return queryFn(sql);
}

/**
 * Transaction helper for Neon
 * Note: Neon serverless driver doesn't support traditional transactions
 * Use this for atomic operations that can be done in a single query
 */
export async function executeQuery(env, query) {
  const sql = createDbClient(env);
  return sql(query);
}
```

### CORS Middleware

```javascript
const ALLOWED_ORIGINS = [
  "https://spacefurnio.pages.dev",
  "https://spacefurnio.com",
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-ID",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

/**
 * Get CORS headers for the given origin
 */
function getCorsHeaders(origin) {
  const headers = { ...CORS_HEADERS };

  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".spacefurnio.pages.dev"))
  ) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0];
  }

  return headers;
}

/**
 * CORS middleware - adds CORS headers to all responses
 */
export async function corsMiddleware(request) {
  const origin = request.headers.get("Origin");
  request.corsHeaders = getCorsHeaders(origin);
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: request.corsHeaders,
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...request.corsHeaders,
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message, status = 400, request, details = null) {
  const body = { error: message };
  if (details) body.details = details;

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...request.corsHeaders,
    },
  });
}
```

### Authentication Middleware

```javascript
import * as jose from "jose";
import { createDbClient } from "../db/neon";
import { errorResponse } from "./cors";

/**
 * Verify JWT token and attach user to request
 */
export async function authMiddleware(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(
      "Missing or invalid authorization header",
      401,
      request
    );
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER || "spacefurnio",
      audience: env.JWT_AUDIENCE || "spacefurnio-api",
    });

    // Check if session is still valid
    const sql = createDbClient(env);
    const tokenHash = await hashToken(token);

    const [session] = await sql`
      SELECT s.*, u.id as user_id, u.email, u.name, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.is_active = true
    `;

    if (!session) {
      return errorResponse("Session expired or invalid", 401, request);
    }

    // Update last used timestamp
    await sql`
      UPDATE sessions 
      SET last_used_at = NOW() 
      WHERE id = ${session.id}
    `;

    // Attach user info to request
    request.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      avatarUrl: session.avatar_url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Auth error:", error);

    if (error.code === "ERR_JWT_EXPIRED") {
      return errorResponse("Token expired", 401, request);
    }

    return errorResponse("Invalid token", 401, request);
  }
}

/**
 * Optional auth - attaches user if valid token present, but doesn't require it
 */
export async function optionalAuthMiddleware(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    request.user = null;
    return;
  }

  // Try to validate, but don't fail if invalid
  try {
    await authMiddleware(request, env);
  } catch (error) {
    request.user = null;
  }
}

/**
 * Hash token for secure storage
 */
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export { hashToken };
```

### JWT Service

```javascript
import * as jose from "jose";
import { hashToken } from "../middleware/auth";
import { createDbClient } from "../db/neon";

/**
 * Generate JWT token and create session
 */
export async function generateTokenAndSession(env, user, request) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const expiryDays = parseInt(env.SESSION_EXPIRY_DAYS || "30");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  // Generate JWT
  const token = await new jose.SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER || "spacefurnio")
    .setAudience(env.JWT_AUDIENCE || "spacefurnio-api")
    .setExpirationTime(`${expiryDays}d`)
    .sign(secret);

  // Store session
  const sql = createDbClient(env);
  const tokenHash = await hashToken(token);
  const ipAddress = request.headers.get("CF-Connecting-IP") || null;
  const userAgent = request.headers.get("User-Agent") || null;

  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (${
      user.id
    }, ${tokenHash}, ${expiresAt.toISOString()}, ${ipAddress}, ${userAgent})
  `;

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
    },
  };
}

/**
 * Revoke a session (logout)
 */
export async function revokeSession(env, sessionId) {
  const sql = createDbClient(env);
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllSessions(env, userId, exceptSessionId = null) {
  const sql = createDbClient(env);

  if (exceptSessionId) {
    await sql`
      DELETE FROM sessions 
      WHERE user_id = ${userId} AND id != ${exceptSessionId}
    `;
  } else {
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  }
}
```

### Email Service (Nodemailer for Magic Links)

```javascript
/**
 * Send email using Gmail SMTP via fetch (Cloudflare Workers compatible)
 * Uses Mailchannels or similar service as nodemailer isn't available in Workers
 */
export async function sendMagicLinkEmail(env, email, magicLink, name = null) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in to Spacefurnio</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">Spacefurnio</h1>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">${greeting},</p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Click the button below to sign in to your Spacefurnio account. This link will expire in 15 minutes.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}" 
               style="display: inline-block; background-color: #1a1a1a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500;">
              Sign in to Spacefurnio
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you didn't request this email, you can safely ignore it.
          </p>
          
          <p style="color: #999; font-size: 12px; line-height: 1.6; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
            Can't click the button? Copy and paste this link into your browser:<br>
            <a href="${magicLink}" style="color: #666; word-break: break-all;">${magicLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Spacefurnio. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Using MailChannels (free for Cloudflare Workers)
  // Alternative: Use Resend, SendGrid, or other email API
  const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email, name: name || email }],
        },
      ],
      from: {
        email: env.EMAIL_FROM || "noreply@spacefurnio.com",
        name: "Spacefurnio",
      },
      subject: "Sign in to Spacefurnio",
      content: [
        {
          type: "text/html",
          value: htmlContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Email send failed:", error);
    throw new Error("Failed to send email");
  }

  return true;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(env, order, items) {
  // Similar structure to magic link email
  // Implementation details omitted for brevity
}
```

### OAuth Service (Google)

```javascript
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(env, state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${
      env.API_URL || "https://spacefurnio-api.workers.dev"
    }/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCode(env, code) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${
        env.API_URL || "https://spacefurnio-api.workers.dev"
      }/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Google token exchange failed:", error);
    throw new Error("Failed to exchange authorization code");
  }

  return response.json();
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }

  return response.json();
}
```

### Auth Routes

```javascript
import { Router } from "itty-router";
import { createDbClient } from "../db/neon";
import { jsonResponse, errorResponse } from "../middleware/cors";
import {
  generateTokenAndSession,
  revokeSession,
  revokeAllSessions,
} from "../services/jwt";
import { sendMagicLinkEmail } from "../services/email";
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUserInfo,
} from "../services/oauth";

export const authRoutes = Router({ base: "/api/auth" });

/**
 * POST /api/auth/magic-link
 * Request a magic link for email login
 */
authRoutes.post("/magic-link", async (request, env) => {
  try {
    const { email } = await request.json();

    if (!email || !isValidEmail(email)) {
      return errorResponse("Valid email is required", 400, request);
    }

    const sql = createDbClient(env);

    // Generate secure token
    const token = generateSecureToken();
    const expiryMinutes = parseInt(env.MAGIC_LINK_EXPIRY_MINUTES || "15");
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Check if user exists
    const [existingUser] = await sql`
      SELECT id, name FROM users WHERE email = ${email.toLowerCase()}
    `;

    // Store magic link
    const ipAddress = request.headers.get("CF-Connecting-IP");
    const userAgent = request.headers.get("User-Agent");

    await sql`
      INSERT INTO magic_links (email, token, expires_at, ip_address, user_agent)
      VALUES (${email.toLowerCase()}, ${token}, ${expiresAt.toISOString()}, ${ipAddress}, ${userAgent})
    `;

    // Generate magic link URL
    const magicLink = `${env.FRONTEND_URL}/auth/verify?token=${token}`;

    // Send email
    await sendMagicLinkEmail(env, email, magicLink, existingUser?.name);

    return jsonResponse(
      {
        success: true,
        message: "Magic link sent to your email",
      },
      200,
      request
    );
  } catch (error) {
    console.error("Magic link error:", error);
    return errorResponse("Failed to send magic link", 500, request);
  }
});

/**
 * POST /api/auth/verify-magic-link
 * Verify magic link token and create session
 */
authRoutes.post("/verify-magic-link", async (request, env) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return errorResponse("Token is required", 400, request);
    }

    const sql = createDbClient(env);

    // Find valid magic link
    const [magicLink] = await sql`
      SELECT * FROM magic_links
      WHERE token = ${token}
        AND expires_at > NOW()
        AND used_at IS NULL
    `;

    if (!magicLink) {
      return errorResponse("Invalid or expired magic link", 400, request);
    }

    // Mark as used
    await sql`
      UPDATE magic_links 
      SET used_at = NOW() 
      WHERE id = ${magicLink.id}
    `;

    // Find or create user
    let [user] = await sql`
      SELECT * FROM users WHERE email = ${magicLink.email}
    `;

    if (!user) {
      // Create new user
      [user] = await sql`
        INSERT INTO users (email, email_verified, provider)
        VALUES (${magicLink.email}, true, 'email')
        RETURNING *
      `;

      // Create default wishlist
      await sql`
        INSERT INTO wishlists (user_id, name, is_default)
        VALUES (${user.id}, 'My Wishlist', true)
      `;
    } else {
      // Update existing user
      await sql`
        UPDATE users 
        SET email_verified = true, last_login_at = NOW()
        WHERE id = ${user.id}
      `;
    }

    // Generate session
    const session = await generateTokenAndSession(env, user, request);

    // Merge guest cart if session ID provided
    const sessionId = request.headers.get("X-Session-ID");
    if (sessionId) {
      await sql`SELECT merge_carts(${user.id}, ${sessionId})`;
    }

    return jsonResponse(session, 200, request);
  } catch (error) {
    console.error("Verify magic link error:", error);
    return errorResponse("Verification failed", 500, request);
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
authRoutes.get("/google", async (request, env) => {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") || "/";

  // Generate state token with redirect info
  const state = btoa(
    JSON.stringify({
      redirect: redirectTo,
      nonce: generateSecureToken(16),
    })
  );

  // Store state in KV for validation
  await env.RATE_LIMIT.put(`oauth_state:${state}`, "valid", {
    expirationTtl: 600,
  });

  const authUrl = getGoogleAuthUrl(env, state);

  return Response.redirect(authUrl, 302);
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
authRoutes.get("/google/callback", async (request, env) => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return Response.redirect(
        `${env.FRONTEND_URL}/auth/error?error=${error}`,
        302
      );
    }

    if (!code || !state) {
      return Response.redirect(
        `${env.FRONTEND_URL}/auth/error?error=missing_params`,
        302
      );
    }

    // Validate state
    const storedState = await env.RATE_LIMIT.get(`oauth_state:${state}`);
    if (!storedState) {
      return Response.redirect(
        `${env.FRONTEND_URL}/auth/error?error=invalid_state`,
        302
      );
    }
    await env.RATE_LIMIT.delete(`oauth_state:${state}`);

    // Parse state for redirect
    let redirectTo = "/";
    try {
      const stateData = JSON.parse(atob(state));
      redirectTo = stateData.redirect || "/";
    } catch (e) {}

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(env, code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    const sql = createDbClient(env);

    // Find or create user
    let [user] = await sql`
      SELECT * FROM users 
      WHERE email = ${googleUser.email} 
         OR (provider = 'google' AND provider_id = ${googleUser.id})
    `;

    if (!user) {
      // Create new user
      [user] = await sql`
        INSERT INTO users (email, name, avatar_url, provider, provider_id, email_verified)
        VALUES (${googleUser.email}, ${googleUser.name}, ${googleUser.picture}, 'google', ${googleUser.id}, true)
        RETURNING *
      `;

      // Create default wishlist
      await sql`
        INSERT INTO wishlists (user_id, name, is_default)
        VALUES (${user.id}, 'My Wishlist', true)
      `;
    } else {
      // Update existing user
      await sql`
        UPDATE users 
        SET 
          name = COALESCE(name, ${googleUser.name}),
          avatar_url = COALESCE(avatar_url, ${googleUser.picture}),
          last_login_at = NOW()
        WHERE id = ${user.id}
      `;
    }

    // Generate session
    const session = await generateTokenAndSession(env, user, request);

    // Redirect with token (frontend will store it)
    const callbackUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
    callbackUrl.searchParams.set("token", session.token);
    callbackUrl.searchParams.set("redirect", redirectTo);

    return Response.redirect(callbackUrl.toString(), 302);
  } catch (error) {
    console.error("Google callback error:", error);
    return Response.redirect(
      `${env.FRONTEND_URL}/auth/error?error=auth_failed`,
      302
    );
  }
});

/**
 * POST /api/auth/logout
 * Logout current session
 */
authRoutes.post("/logout", async (request, env) => {
  if (!request.user) {
    return jsonResponse({ success: true }, 200, request);
  }

  try {
    await revokeSession(env, request.user.sessionId);
    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Logout failed", 500, request);
  }
});

/**
 * POST /api/auth/logout-all
 * Logout all sessions except current
 */
authRoutes.post("/logout-all", async (request, env) => {
  if (!request.user) {
    return errorResponse("Unauthorized", 401, request);
  }

  try {
    await revokeAllSessions(env, request.user.id, request.user.sessionId);
    return jsonResponse(
      { success: true, message: "All other sessions logged out" },
      200,
      request
    );
  } catch (error) {
    console.error("Logout all error:", error);
    return errorResponse("Failed to logout all sessions", 500, request);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
authRoutes.get("/me", async (request, env) => {
  if (!request.user) {
    return errorResponse("Unauthorized", 401, request);
  }

  return jsonResponse(
    {
      user: request.user,
    },
    200,
    request
  );
});

// Helper functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
```

### Cart Routes

```javascript
import { Router } from "itty-router";
import { createDbClient, executeWithContext } from "../db/neon";
import { jsonResponse, errorResponse } from "../middleware/cors";

export const cartRoutes = Router({ base: "/api/cart" });

/**
 * GET /api/cart
 * Get current user's cart
 */
cartRoutes.get("/", async (request, env) => {
  const sql = createDbClient(env);

  // Get or create cart
  let [cart] = await sql`
    SELECT * FROM carts 
    WHERE user_id = ${request.user.id} AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!cart) {
    [cart] = await sql`
      INSERT INTO carts (user_id, status)
      VALUES (${request.user.id}, 'active')
      RETURNING *
    `;
  }

  // Get cart items with product details
  const items = await sql`
    SELECT 
      ci.*,
      p.name as product_name,
      p.slug as product_slug,
      p.images as product_images,
      p.price as current_price,
      p.quantity as available_quantity,
      pv.name as variant_name,
      pv.price_modifier
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ${cart.id}
    ORDER BY ci.created_at DESC
  `;

  return jsonResponse(
    {
      cart: {
        id: cart.id,
        subtotal: cart.subtotal,
        discountTotal: cart.discount_total,
        taxTotal: cart.tax_total,
        total: cart.total,
        couponCode: cart.coupon_code,
        itemCount: items.length,
      },
      items: items.map(formatCartItem),
    },
    200,
    request
  );
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
cartRoutes.post("/items", async (request, env) => {
  try {
    const {
      productId,
      variantId,
      quantity = 1,
      selectedColor,
      selectedOptions,
    } = await request.json();

    if (!productId) {
      return errorResponse("Product ID is required", 400, request);
    }

    if (quantity < 1 || quantity > 99) {
      return errorResponse("Quantity must be between 1 and 99", 400, request);
    }

    const sql = createDbClient(env);

    // Verify product exists and is available
    const [product] = await sql`
      SELECT * FROM products 
      WHERE id = ${productId} AND status = 'active'
    `;

    if (!product) {
      return errorResponse("Product not found", 404, request);
    }

    // Check inventory
    if (
      product.track_inventory &&
      product.quantity < quantity &&
      !product.allow_backorder
    ) {
      return errorResponse("Insufficient stock", 400, request);
    }

    // Get or create cart
    let [cart] = await sql`
      SELECT * FROM carts 
      WHERE user_id = ${request.user.id} AND status = 'active'
      LIMIT 1
    `;

    if (!cart) {
      [cart] = await sql`
        INSERT INTO carts (user_id, status)
        VALUES (${request.user.id}, 'active')
        RETURNING *
      `;
    }

    // Calculate price
    let unitPrice = parseFloat(product.price);
    if (variantId) {
      const [variant] = await sql`
        SELECT * FROM product_variants WHERE id = ${variantId}
      `;
      if (variant) {
        unitPrice += parseFloat(variant.price_modifier || 0);
      }
    }

    const totalPrice = unitPrice * quantity;

    // Add or update cart item
    const [item] = await sql`
      INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, total_price, selected_color, selected_options)
      VALUES (${
        cart.id
      }, ${productId}, ${variantId}, ${quantity}, ${unitPrice}, ${totalPrice}, ${selectedColor}, ${JSON.stringify(
      selectedOptions || {}
    )})
      ON CONFLICT (cart_id, product_id, variant_id, selected_color)
      DO UPDATE SET 
        quantity = cart_items.quantity + ${quantity},
        total_price = (cart_items.quantity + ${quantity}) * cart_items.unit_price,
        updated_at = NOW()
      RETURNING *
    `;

    return jsonResponse(
      {
        success: true,
        item: item,
      },
      201,
      request
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return errorResponse("Failed to add item to cart", 500, request);
  }
});

/**
 * PUT /api/cart/items/:itemId
 * Update cart item quantity
 */
cartRoutes.put("/items/:itemId", async (request, env) => {
  try {
    const { itemId } = request.params;
    const { quantity } = await request.json();

    if (quantity < 1 || quantity > 99) {
      return errorResponse("Quantity must be between 1 and 99", 400, request);
    }

    const sql = createDbClient(env);

    // Verify item belongs to user's cart
    const [item] = await sql`
      SELECT ci.*, c.user_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ${itemId} AND c.user_id = ${request.user.id}
    `;

    if (!item) {
      return errorResponse("Cart item not found", 404, request);
    }

    // Update quantity
    const totalPrice = parseFloat(item.unit_price) * quantity;

    const [updated] = await sql`
      UPDATE cart_items
      SET quantity = ${quantity}, total_price = ${totalPrice}, updated_at = NOW()
      WHERE id = ${itemId}
      RETURNING *
    `;

    return jsonResponse(
      {
        success: true,
        item: updated,
      },
      200,
      request
    );
  } catch (error) {
    console.error("Update cart item error:", error);
    return errorResponse("Failed to update cart item", 500, request);
  }
});

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 */
cartRoutes.delete("/items/:itemId", async (request, env) => {
  try {
    const { itemId } = request.params;
    const sql = createDbClient(env);

    // Verify and delete
    const result = await sql`
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.id = ${itemId} 
        AND ci.cart_id = c.id 
        AND c.user_id = ${request.user.id}
      RETURNING ci.id
    `;

    if (result.length === 0) {
      return errorResponse("Cart item not found", 404, request);
    }

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Delete cart item error:", error);
    return errorResponse("Failed to remove item", 500, request);
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
cartRoutes.delete("/", async (request, env) => {
  try {
    const sql = createDbClient(env);

    await sql`
      DELETE FROM cart_items
      WHERE cart_id IN (
        SELECT id FROM carts 
        WHERE user_id = ${request.user.id} AND status = 'active'
      )
    `;

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Clear cart error:", error);
    return errorResponse("Failed to clear cart", 500, request);
  }
});

/**
 * POST /api/cart/coupon
 * Apply coupon to cart
 */
cartRoutes.post("/coupon", async (request, env) => {
  try {
    const { code } = await request.json();

    if (!code) {
      return errorResponse("Coupon code is required", 400, request);
    }

    const sql = createDbClient(env);

    // Find valid coupon
    const [coupon] = await sql`
      SELECT * FROM coupons
      WHERE code = ${code.toUpperCase()}
        AND is_active = true
        AND starts_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `;

    if (!coupon) {
      return errorResponse("Invalid or expired coupon code", 400, request);
    }

    // Get user's cart
    const [cart] = await sql`
      SELECT * FROM carts 
      WHERE user_id = ${request.user.id} AND status = 'active'
    `;

    if (!cart) {
      return errorResponse("Cart not found", 404, request);
    }

    // Check minimum amount
    if (
      coupon.minimum_amount &&
      parseFloat(cart.subtotal) < parseFloat(coupon.minimum_amount)
    ) {
      return errorResponse(
        `Minimum order amount is $${coupon.minimum_amount}`,
        400,
        request
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount =
        parseFloat(cart.subtotal) * (parseFloat(coupon.discount_value) / 100);
    } else if (coupon.discount_type === "fixed_amount") {
      discountAmount = parseFloat(coupon.discount_value);
    }

    // Apply maximum discount cap
    if (
      coupon.maximum_discount &&
      discountAmount > parseFloat(coupon.maximum_discount)
    ) {
      discountAmount = parseFloat(coupon.maximum_discount);
    }

    // Update cart
    await sql`
      UPDATE carts
      SET 
        coupon_code = ${code.toUpperCase()},
        discount_total = ${discountAmount},
        total = subtotal - ${discountAmount} + COALESCE(tax_total, 0)
      WHERE id = ${cart.id}
    `;

    return jsonResponse(
      {
        success: true,
        discount: discountAmount,
        message: `Coupon applied! You saved $${discountAmount.toFixed(2)}`,
      },
      200,
      request
    );
  } catch (error) {
    console.error("Apply coupon error:", error);
    return errorResponse("Failed to apply coupon", 500, request);
  }
});

// Helper function
function formatCartItem(item) {
  return {
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    productName: item.product_name,
    productSlug: item.product_slug,
    productImage: item.product_images?.[0]?.url || null,
    variantName: item.variant_name,
    selectedColor: item.selected_color,
    selectedOptions: item.selected_options,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unit_price),
    totalPrice: parseFloat(item.total_price),
    availableQuantity: item.available_quantity,
  };
}
```

### Wishlist Routes

```javascript
import { Router } from "itty-router";
import { createDbClient } from "../db/neon";
import { jsonResponse, errorResponse } from "../middleware/cors";

export const wishlistRoutes = Router({ base: "/api/wishlist" });

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
wishlistRoutes.get("/", async (request, env) => {
  const sql = createDbClient(env);

  // Get or create default wishlist
  let [wishlist] = await sql`
    SELECT * FROM wishlists 
    WHERE user_id = ${request.user.id} AND is_default = true
  `;

  if (!wishlist) {
    [wishlist] = await sql`
      INSERT INTO wishlists (user_id, name, is_default)
      VALUES (${request.user.id}, 'My Wishlist', true)
      RETURNING *
    `;
  }

  // Get wishlist items with product details
  const items = await sql`
    SELECT 
      wi.*,
      p.name,
      p.slug,
      p.price,
      p.compare_at_price,
      p.images,
      p.rating_average,
      p.status,
      p.quantity as available_quantity
    FROM wishlist_items wi
    JOIN products p ON wi.product_id = p.id
    WHERE wi.wishlist_id = ${wishlist.id}
    ORDER BY wi.added_at DESC
  `;

  return jsonResponse(
    {
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        itemCount: items.length,
      },
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.name,
        productSlug: item.slug,
        price: parseFloat(item.price),
        compareAtPrice: item.compare_at_price
          ? parseFloat(item.compare_at_price)
          : null,
        image: item.images?.[0]?.url || null,
        rating: parseFloat(item.rating_average) || 0,
        selectedColor: item.selected_color,
        inStock: item.status === "active" && item.available_quantity > 0,
        addedAt: item.added_at,
      })),
    },
    200,
    request
  );
});

/**
 * POST /api/wishlist/items
 * Add item to wishlist
 */
wishlistRoutes.post("/items", async (request, env) => {
  try {
    const { productId, variantId, selectedColor } = await request.json();

    if (!productId) {
      return errorResponse("Product ID is required", 400, request);
    }

    const sql = createDbClient(env);

    // Verify product exists
    const [product] = await sql`
      SELECT id FROM products WHERE id = ${productId} AND status = 'active'
    `;

    if (!product) {
      return errorResponse("Product not found", 404, request);
    }

    // Get default wishlist
    let [wishlist] = await sql`
      SELECT id FROM wishlists 
      WHERE user_id = ${request.user.id} AND is_default = true
    `;

    if (!wishlist) {
      [wishlist] = await sql`
        INSERT INTO wishlists (user_id, name, is_default)
        VALUES (${request.user.id}, 'My Wishlist', true)
        RETURNING id
      `;
    }

    // Add to wishlist (ignore if already exists)
    const [item] = await sql`
      INSERT INTO wishlist_items (wishlist_id, product_id, variant_id, selected_color)
      VALUES (${wishlist.id}, ${productId}, ${variantId}, ${selectedColor})
      ON CONFLICT (wishlist_id, product_id, variant_id) DO NOTHING
      RETURNING *
    `;

    return jsonResponse(
      {
        success: true,
        added: !!item,
      },
      201,
      request
    );
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return errorResponse("Failed to add to wishlist", 500, request);
  }
});

/**
 * DELETE /api/wishlist/items/:productId
 * Remove item from wishlist
 */
wishlistRoutes.delete("/items/:productId", async (request, env) => {
  try {
    const { productId } = request.params;
    const sql = createDbClient(env);

    await sql`
      DELETE FROM wishlist_items wi
      USING wishlists w
      WHERE wi.product_id = ${productId}
        AND wi.wishlist_id = w.id
        AND w.user_id = ${request.user.id}
    `;

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return errorResponse("Failed to remove from wishlist", 500, request);
  }
});

/**
 * POST /api/wishlist/items/:productId/move-to-cart
 * Move item from wishlist to cart
 */
wishlistRoutes.post("/items/:productId/move-to-cart", async (request, env) => {
  try {
    const { productId } = request.params;
    const sql = createDbClient(env);

    // Get product details
    const [product] = await sql`
      SELECT * FROM products WHERE id = ${productId} AND status = 'active'
    `;

    if (!product) {
      return errorResponse("Product not found or unavailable", 404, request);
    }

    // Get or create cart
    let [cart] = await sql`
      SELECT id FROM carts 
      WHERE user_id = ${request.user.id} AND status = 'active'
      LIMIT 1
    `;

    if (!cart) {
      [cart] = await sql`
        INSERT INTO carts (user_id, status)
        VALUES (${request.user.id}, 'active')
        RETURNING id
      `;
    }

    // Add to cart
    await sql`
      INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, total_price)
      VALUES (${cart.id}, ${productId}, 1, ${product.price}, ${product.price})
      ON CONFLICT (cart_id, product_id, variant_id, selected_color)
      DO UPDATE SET quantity = cart_items.quantity + 1,
                    total_price = (cart_items.quantity + 1) * cart_items.unit_price
    `;

    // Remove from wishlist
    await sql`
      DELETE FROM wishlist_items wi
      USING wishlists w
      WHERE wi.product_id = ${productId}
        AND wi.wishlist_id = w.id
        AND w.user_id = ${request.user.id}
    `;

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Move to cart error:", error);
    return errorResponse("Failed to move item to cart", 500, request);
  }
});
```

### Review Routes

```javascript
import { Router } from "itty-router";
import { createDbClient } from "../db/neon";
import { jsonResponse, errorResponse } from "../middleware/cors";

export const reviewRoutes = Router({ base: "/api/reviews" });

/**
 * GET /api/reviews/product/:productId
 * Get reviews for a product
 */
reviewRoutes.get("/product/:productId", async (request, env) => {
  const { productId } = request.params;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
  const sortBy = url.searchParams.get("sort") || "newest";
  const offset = (page - 1) * limit;

  const sql = createDbClient(env);

  // Get reviews using the database function
  const reviews = await sql`
    SELECT * FROM get_product_reviews(
      ${productId}::UUID,
      ${sortBy},
      ${limit},
      ${offset}
    )
  `;

  // Get review summary
  const [summary] = await sql`
    SELECT 
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(*) as total_reviews,
      COUNT(*) FILTER (WHERE rating = 5) as five_star,
      COUNT(*) FILTER (WHERE rating = 4) as four_star,
      COUNT(*) FILTER (WHERE rating = 3) as three_star,
      COUNT(*) FILTER (WHERE rating = 2) as two_star,
      COUNT(*) FILTER (WHERE rating = 1) as one_star
    FROM reviews
    WHERE product_id = ${productId} AND status = 'approved'
  `;

  const totalCount = reviews.length > 0 ? parseInt(reviews[0].total_count) : 0;

  return jsonResponse(
    {
      reviews: reviews.map((r) => ({
        id: r.id,
        userName: r.user_name,
        userAvatar: r.user_avatar,
        rating: r.rating,
        title: r.title,
        content: r.content,
        images: r.images,
        verifiedPurchase: r.verified_purchase,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
      })),
      summary: {
        averageRating: parseFloat(summary.average_rating) || 0,
        totalReviews: parseInt(summary.total_reviews),
        distribution: {
          5: parseInt(summary.five_star),
          4: parseInt(summary.four_star),
          3: parseInt(summary.three_star),
          2: parseInt(summary.two_star),
          1: parseInt(summary.one_star),
        },
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    },
    200,
    request
  );
});

/**
 * POST /api/reviews
 * Create a new review (authenticated)
 */
reviewRoutes.post("/", async (request, env) => {
  try {
    const { productId, orderId, rating, title, content, images } =
      await request.json();

    if (!productId || !rating) {
      return errorResponse("Product ID and rating are required", 400, request);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse("Rating must be between 1 and 5", 400, request);
    }

    const sql = createDbClient(env);

    // Check if user already reviewed this product
    const [existing] = await sql`
      SELECT id FROM reviews
      WHERE product_id = ${productId} AND user_id = ${request.user.id}
    `;

    if (existing) {
      return errorResponse(
        "You have already reviewed this product",
        400,
        request
      );
    }

    // Check for verified purchase
    let verifiedPurchase = false;
    if (orderId) {
      const [order] = await sql`
        SELECT id FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = ${orderId} 
          AND o.user_id = ${request.user.id}
          AND oi.product_id = ${productId}
          AND o.status IN ('delivered', 'completed')
      `;
      verifiedPurchase = !!order;
    }

    // Create review
    const [review] = await sql`
      INSERT INTO reviews (product_id, user_id, order_id, rating, title, content, images, verified_purchase, status)
      VALUES (${productId}, ${
      request.user.id
    }, ${orderId}, ${rating}, ${title}, ${content}, ${JSON.stringify(
      images || []
    )}, ${verifiedPurchase}, 'pending')
      RETURNING *
    `;

    return jsonResponse(
      {
        success: true,
        review: {
          id: review.id,
          status: review.status,
          message: "Your review has been submitted and is pending approval",
        },
      },
      201,
      request
    );
  } catch (error) {
    console.error("Create review error:", error);
    return errorResponse("Failed to submit review", 500, request);
  }
});

/**
 * PUT /api/reviews/:reviewId
 * Update own pending review
 */
reviewRoutes.put("/:reviewId", async (request, env) => {
  try {
    const { reviewId } = request.params;
    const { rating, title, content, images } = await request.json();

    const sql = createDbClient(env);

    // Verify ownership and pending status
    const [review] = await sql`
      SELECT * FROM reviews
      WHERE id = ${reviewId} 
        AND user_id = ${request.user.id}
        AND status = 'pending'
    `;

    if (!review) {
      return errorResponse(
        "Review not found or cannot be edited",
        404,
        request
      );
    }

    // Update review
    const [updated] = await sql`
      UPDATE reviews
      SET 
        rating = COALESCE(${rating}, rating),
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        images = COALESCE(${images ? JSON.stringify(images) : null}, images),
        updated_at = NOW()
      WHERE id = ${reviewId}
      RETURNING *
    `;

    return jsonResponse({ success: true, review: updated }, 200, request);
  } catch (error) {
    console.error("Update review error:", error);
    return errorResponse("Failed to update review", 500, request);
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * Delete own pending review
 */
reviewRoutes.delete("/:reviewId", async (request, env) => {
  try {
    const { reviewId } = request.params;
    const sql = createDbClient(env);

    const result = await sql`
      DELETE FROM reviews
      WHERE id = ${reviewId} 
        AND user_id = ${request.user.id}
        AND status = 'pending'
      RETURNING id
    `;

    if (result.length === 0) {
      return errorResponse(
        "Review not found or cannot be deleted",
        404,
        request
      );
    }

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Delete review error:", error);
    return errorResponse("Failed to delete review", 500, request);
  }
});

/**
 * POST /api/reviews/:reviewId/vote
 * Vote on a review (helpful/not helpful)
 */
reviewRoutes.post("/:reviewId/vote", async (request, env) => {
  try {
    const { reviewId } = request.params;
    const { isHelpful } = await request.json();

    if (typeof isHelpful !== "boolean") {
      return errorResponse("isHelpful must be a boolean", 400, request);
    }

    const sql = createDbClient(env);

    // Upsert vote
    await sql`
      INSERT INTO review_votes (review_id, user_id, is_helpful)
      VALUES (${reviewId}, ${request.user.id}, ${isHelpful})
      ON CONFLICT (review_id, user_id)
      DO UPDATE SET is_helpful = ${isHelpful}
    `;

    // Update helpful count
    await sql`
      UPDATE reviews
      SET helpful_count = (
        SELECT COUNT(*) FROM review_votes
        WHERE review_id = ${reviewId} AND is_helpful = true
      )
      WHERE id = ${reviewId}
    `;

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error("Vote on review error:", error);
    return errorResponse("Failed to vote", 500, request);
  }
});
```

---

## 🔄 GitHub Actions (Cron Jobs)

### Cleanup Magic Links

```yaml
name: Cleanup Expired Magic Links

on:
  schedule:
    # Run every hour
    - cron: "0 * * * *"
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest

    steps:
      - name: Cleanup expired magic links and sessions
        run: |
          # Install psql
          sudo apt-get update && sudo apt-get install -y postgresql-client

          # Run cleanup functions
          PGPASSWORD="${{ secrets.NEON_PASSWORD }}" psql \
            -h "${{ secrets.NEON_HOST }}" \
            -U "${{ secrets.NEON_USER }}" \
            -d "${{ secrets.NEON_DATABASE }}" \
            -c "SELECT cleanup_expired_magic_links() as deleted_magic_links, cleanup_expired_sessions() as deleted_sessions;"

      - name: Report results
        run: echo "Cleanup completed successfully"
```

### Cleanup Abandoned Carts

```yaml
name: Cleanup Abandoned Carts

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: "0 2 * * *"
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest

    steps:
      - name: Cleanup abandoned carts
        run: |
          sudo apt-get update && sudo apt-get install -y postgresql-client

          PGPASSWORD="${{ secrets.NEON_PASSWORD }}" psql \
            -h "${{ secrets.NEON_HOST }}" \
            -U "${{ secrets.NEON_USER }}" \
            -d "${{ secrets.NEON_DATABASE }}" \
            -c "SELECT cleanup_abandoned_carts() as deleted_carts;"
```

---

## 📚 API Documentation

### Authentication Endpoints

| Endpoint                      | Method | Auth | Description              |
| ----------------------------- | ------ | ---- | ------------------------ |
| `/api/auth/magic-link`        | POST   | No   | Request magic link email |
| `/api/auth/verify-magic-link` | POST   | No   | Verify magic link token  |
| `/api/auth/google`            | GET    | No   | Initiate Google OAuth    |
| `/api/auth/google/callback`   | GET    | No   | Google OAuth callback    |
| `/api/auth/me`                | GET    | Yes  | Get current user         |
| `/api/auth/logout`            | POST   | Yes  | Logout current session   |
| `/api/auth/logout-all`        | POST   | Yes  | Logout all sessions      |

### Product Endpoints

| Endpoint                | Method | Auth | Description                  |
| ----------------------- | ------ | ---- | ---------------------------- |
| `/api/products`         | GET    | No   | List products (with filters) |
| `/api/products/:slug`   | GET    | No   | Get product details          |
| `/api/categories`       | GET    | No   | List categories              |
| `/api/categories/:slug` | GET    | No   | Get category with products   |

### Cart Endpoints

| Endpoint              | Method | Auth | Description      |
| --------------------- | ------ | ---- | ---------------- |
| `/api/cart`           | GET    | Yes  | Get user's cart  |
| `/api/cart/items`     | POST   | Yes  | Add item to cart |
| `/api/cart/items/:id` | PUT    | Yes  | Update cart item |
| `/api/cart/items/:id` | DELETE | Yes  | Remove cart item |
| `/api/cart`           | DELETE | Yes  | Clear cart       |
| `/api/cart/coupon`    | POST   | Yes  | Apply coupon     |

### Wishlist Endpoints

| Endpoint                                      | Method | Auth | Description          |
| --------------------------------------------- | ------ | ---- | -------------------- |
| `/api/wishlist`                               | GET    | Yes  | Get wishlist         |
| `/api/wishlist/items`                         | POST   | Yes  | Add to wishlist      |
| `/api/wishlist/items/:productId`              | DELETE | Yes  | Remove from wishlist |
| `/api/wishlist/items/:productId/move-to-cart` | POST   | Yes  | Move to cart         |

### Review Endpoints

| Endpoint                          | Method | Auth | Description         |
| --------------------------------- | ------ | ---- | ------------------- |
| `/api/reviews/product/:productId` | GET    | No   | Get product reviews |
| `/api/reviews`                    | POST   | Yes  | Create review       |
| `/api/reviews/:id`                | PUT    | Yes  | Update own review   |
| `/api/reviews/:id`                | DELETE | Yes  | Delete own review   |
| `/api/reviews/:id/vote`           | POST   | Yes  | Vote on review      |

---

## 🔧 Frontend Integration Guide

### 1. Install HTTP Client

```bash
cd frontend
pnpm add axios
```

### 2. Create API Client

```javascript
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://spacefurnio-api.workers.dev";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add session ID for guest cart merging
  const sessionId = localStorage.getItem("session_id");
  if (sessionId) {
    config.headers["X-Session-ID"] = sessionId;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. Create Auth Store (Pinia)

```javascript
import { defineStore } from "pinia";
import apiClient from "@/api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("auth_token"),
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
  },

  actions: {
    async sendMagicLink(email) {
      const { data } = await apiClient.post("/api/auth/magic-link", { email });
      return data;
    },

    async verifyMagicLink(token) {
      const { data } = await apiClient.post("/api/auth/verify-magic-link", {
        token,
      });
      this.setSession(data);
      return data;
    },

    async fetchUser() {
      if (!this.token) return;
      try {
        const { data } = await apiClient.get("/api/auth/me");
        this.user = data.user;
      } catch (error) {
        this.logout();
      }
    },

    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem("auth_token", token);
    },

    async logout() {
      try {
        await apiClient.post("/api/auth/logout");
      } finally {
        this.token = null;
        this.user = null;
        localStorage.removeItem("auth_token");
      }
    },
  },
});
```

### 4. Create Cart Store

```javascript
import { defineStore } from "pinia";
import apiClient from "@/api/client";

export const useCartStore = defineStore("cart", {
  state: () => ({
    cart: null,
    items: [],
    loading: false,
  }),

  getters: {
    itemCount: (state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: (state) => state.cart?.subtotal || 0,
    total: (state) => state.cart?.total || 0,
  },

  actions: {
    async fetchCart() {
      this.loading = true;
      try {
        const { data } = await apiClient.get("/api/cart");
        this.cart = data.cart;
        this.items = data.items;
      } finally {
        this.loading = false;
      }
    },

    async addItem(productId, options = {}) {
      const { data } = await apiClient.post("/api/cart/items", {
        productId,
        quantity: options.quantity || 1,
        variantId: options.variantId,
        selectedColor: options.selectedColor,
      });
      await this.fetchCart();
      return data;
    },

    async updateItem(itemId, quantity) {
      await apiClient.put(`/api/cart/items/${itemId}`, { quantity });
      await this.fetchCart();
    },

    async removeItem(itemId) {
      await apiClient.delete(`/api/cart/items/${itemId}`);
      await this.fetchCart();
    },

    async applyCoupon(code) {
      const { data } = await apiClient.post("/api/cart/coupon", { code });
      await this.fetchCart();
      return data;
    },
  },
});
```

---

## 📋 Implementation Steps

### Steps

1. **Set up Neon database** — Create database, run migrations from database/migrations/ folder (use nodejs for running migrations or neon cli if needed), configure connection pooling.
2. **Configure Cloudflare Worker** — Set secrets (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET), deploy with `wrangler deploy`.
3. **Set up Google OAuth** — Create credentials in Google Cloud Console, configure callback URL to `https://your-api.workers.dev/api/auth/google/callback`.
4. **Configure email service** — Set up MailChannels (free with Workers) for magic link emails.
5. **Create GitHub Actions secrets** — Add NEON_HOST, NEON_USER, NEON_PASSWORD, NEON_DATABASE for cron cleanup jobs.
6. **Integrate frontend** — Add Pinia stores, API client, update Vue components to use the new API endpoints.

### Further Considerations

1. **Payment Integration** — i need to integrate razorpay payment gateway for checkout process. This would involve creating new endpoints under `/api/checkout` to handle payment initiation, verification, and webhook processing for payment status updates. refer official razorpay docs for api details.
2. **Image Uploads** — use public folder in my frontend to store images and retrive them with pages url which is spacefurnio.in/images/<product_images>/<img_name>.
3. **Admin Dashboard** — Need admin routes for product/order management add `service_role` protected endpoints in neon. only a persont with a security code should be able to access those routes. they can change products, delete user reviews, manage orders etc. the ui should be clean and well documentated like uisng info btn for every field and all. make frontend using vue3 and tailwindcss. so you need to make complete admin dashboard for managing the ecommerce along with everything.
