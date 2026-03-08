require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function check() {
  console.log('Checking existing product_id values...');

  const cartItems = await sql`SELECT product_id FROM cart_items LIMIT 5`;
  const wishlistItems = await sql`SELECT product_id FROM wishlist_items LIMIT 5`;

  console.log('cart_items sample:', cartItems);
  console.log('wishlist_items sample:', wishlistItems);
}

check();