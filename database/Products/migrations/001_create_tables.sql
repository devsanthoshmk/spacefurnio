-- ============================================================
-- SpaceFurnio E-Commerce Products Database
-- Migration 001: Create Tables (Empty Schema)
-- ============================================================
-- Run with: psql -U <user> -d <database> -f 001_create_tables.sql
-- ============================================================

BEGIN;

-- -----------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------
-- 2. ENUM types for fixed taxonomy values
-- -----------------------------------------------------------
CREATE TYPE product_listing_type AS ENUM (
    'category',      -- listed by product category (furniture, wall-art, etc.)
    'design-space',  -- listed by room/space (foyer, kitchen, bedroom, etc.)
    'design-style'   -- listed by design style (brutalist, minimalist, etc.)
);

-- -----------------------------------------------------------
-- 3. Lookup / dimension tables
-- -----------------------------------------------------------

-- Brands
CREATE TABLE brands (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Categories (furniture, wall-art, decor, lights)
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Design Spaces (foyer, dining, kitchen, home-office, …)
CREATE TABLE spaces (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Design Styles (brutalist, minimalist, sustainable, …)
CREATE TABLE styles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Rooms (Living Room, Bedroom, Kitchen, …)
CREATE TABLE rooms (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Colors (reusable across products)
CREATE TABLE colors (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    hex_code    VARCHAR(7),           -- optional hex value, e.g. #FF5733
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Materials (reusable across products)
CREATE TABLE materials (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 4. Core products table
-- -----------------------------------------------------------
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(280) NOT NULL UNIQUE,
    description     TEXT,

    -- Price (stored as integer cents to avoid floating-point issues)
    price_cents     INTEGER      NOT NULL CHECK (price_cents >= 0),

    -- Foreign keys to lookup tables
    brand_id        INTEGER      NOT NULL REFERENCES brands(id)     ON DELETE RESTRICT,
    category_id     INTEGER               REFERENCES categories(id) ON DELETE SET NULL,
    space_id        INTEGER               REFERENCES spaces(id)     ON DELETE SET NULL,
    style_id        INTEGER               REFERENCES styles(id)     ON DELETE SET NULL,
    room_id         INTEGER               REFERENCES rooms(id)      ON DELETE SET NULL,
    material_id     INTEGER               REFERENCES materials(id)  ON DELETE SET NULL,

    -- Which listing type(s) this product belongs to
    listing_type    product_listing_type NOT NULL,

    -- Ratings & popularity
    rating          NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count    INTEGER      NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    popularity      SMALLINT     NOT NULL DEFAULT 0 CHECK (popularity >= 0 AND popularity <= 100),

    -- SEO / display
    href            VARCHAR(512),

    -- Timestamps
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 5. Product ↔ Color junction table (M:N)
-- -----------------------------------------------------------
CREATE TABLE product_colors (
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id    INTEGER NOT NULL REFERENCES colors(id)   ON DELETE CASCADE,
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, color_id)
);

-- -----------------------------------------------------------
-- 6. Product images table (one-to-many)
-- -----------------------------------------------------------
CREATE TABLE product_images (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    src         TEXT         NOT NULL,
    alt         VARCHAR(500) NOT NULL DEFAULT '',
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    is_primary  BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 7. Indexes for common e-commerce query patterns
-- -----------------------------------------------------------

-- Products: filter by category, space, style, brand
CREATE INDEX idx_products_category   ON products (category_id)  WHERE category_id IS NOT NULL;
CREATE INDEX idx_products_space      ON products (space_id)     WHERE space_id    IS NOT NULL;
CREATE INDEX idx_products_style      ON products (style_id)     WHERE style_id    IS NOT NULL;
CREATE INDEX idx_products_brand      ON products (brand_id);
CREATE INDEX idx_products_room       ON products (room_id)      WHERE room_id     IS NOT NULL;
CREATE INDEX idx_products_listing    ON products (listing_type);

-- Products: sorting & range queries
CREATE INDEX idx_products_price      ON products (price_cents);
CREATE INDEX idx_products_rating     ON products (rating DESC);
CREATE INDEX idx_products_popularity ON products (popularity DESC);
CREATE INDEX idx_products_created    ON products (created_at DESC);

-- Composite index: most common frontend filter+sort (category + popularity)
CREATE INDEX idx_products_cat_pop    ON products (category_id, popularity DESC)  WHERE category_id IS NOT NULL;
CREATE INDEX idx_products_space_pop  ON products (space_id, popularity DESC)     WHERE space_id    IS NOT NULL;
CREATE INDEX idx_products_style_pop  ON products (style_id, popularity DESC)     WHERE style_id    IS NOT NULL;

-- Full-text search on product name (GIN for trigram or tsvector)
CREATE INDEX idx_products_name_trgm  ON products USING gin (name gin_trgm_ops);

-- Product images: lookup by product
CREATE INDEX idx_product_images_pid  ON product_images (product_id, sort_order);

-- Product colors: reverse lookup
CREATE INDEX idx_product_colors_cid  ON product_colors (color_id);

-- -----------------------------------------------------------
-- 8. Trigger: auto-update updated_at on products
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();



COMMIT;
