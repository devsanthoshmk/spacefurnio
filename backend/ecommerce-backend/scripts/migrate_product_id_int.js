require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Running migration: change product_id from UUID to INTEGER...');

  try {
    // Clear existing data (these are test UUIDs, not real product references)
    console.log('Clearing test data...');
    await sql`DELETE FROM cart_items`;
    await sql`DELETE FROM wishlist_items`;
    await sql`DELETE FROM order_items`;

    // Drop constraints
    console.log('Dropping constraints...');
    await sql`ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey`;
    await sql`ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_product_id_fkey`;
    await sql`ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey`;
    await sql`ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key`;
    await sql`ALTER TABLE wishlist_items DROP CONSTRAINT IF EXISTS wishlist_items_wishlist_id_product_id_key`;

    // Drop and recreate columns as INTEGER
    console.log('Altering column types...');
    await sql`ALTER TABLE cart_items DROP COLUMN product_id`;
    await sql`ALTER TABLE cart_items ADD COLUMN product_id INTEGER NOT NULL DEFAULT 0`;

    await sql`ALTER TABLE wishlist_items DROP COLUMN product_id`;
    await sql`ALTER TABLE wishlist_items ADD COLUMN product_id INTEGER NOT NULL DEFAULT 0`;

    await sql`ALTER TABLE order_items DROP COLUMN product_id`;
    await sql`ALTER TABLE order_items ADD COLUMN product_id INTEGER NOT NULL DEFAULT 0`;

    // Recreate unique constraints
    console.log('Recreating constraints...');
    await sql`ALTER TABLE cart_items ADD CONSTRAINT cart_items_cart_id_product_id_key UNIQUE (cart_id, product_id)`;
    await sql`ALTER TABLE wishlist_items ADD CONSTRAINT wishlist_items_wishlist_id_product_id_key UNIQUE (wishlist_id, product_id)`;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();