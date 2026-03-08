-- Change product_id from UUID to INTEGER
-- Products are in separate Neon project (icy-union-81751721) with INT IDs
-- This migration clears test data and recreates columns

-- Clear test data (these were UUID test values, not real product references)
DELETE FROM cart_items;
DELETE FROM wishlist_items;
DELETE FROM order_items;

-- Drop constraints
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_product_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key;
ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlist_id_product_id_key;

-- Drop and recreate columns as INTEGER
ALTER TABLE cart_items DROP COLUMN product_id;
ALTER TABLE cart_items ADD COLUMN product_id INTEGER NOT NULL DEFAULT 0;

ALTER TABLE wishlist_items DROP COLUMN product_id;
ALTER TABLE wishlist_items ADD COLUMN product_id INTEGER NOT NULL DEFAULT 0;

ALTER TABLE order_items DROP COLUMN product_id;
ALTER TABLE order_items ADD COLUMN product_id INTEGER NOT NULL DEFAULT 0;

-- Recreate unique constraints
ALTER TABLE cart_items ADD CONSTRAINT cart_items_cart_id_product_id_key UNIQUE (cart_id, product_id);
ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_wishlist_id_product_id_key UNIQUE (wishlist_id, product_id);