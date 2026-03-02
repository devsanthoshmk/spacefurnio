DROP TABLE IF EXISTS "inventory" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "inventory_movements" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "products" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "reviews" CASCADE;--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "wishlist_items" DROP CONSTRAINT IF EXISTS "wishlist_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_product_id_products_id_fk";
