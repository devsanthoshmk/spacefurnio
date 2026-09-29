import { AutoRouter, error } from 'itty-router';
import { getDb, getProductsDb } from '../utils/db';
import { Env } from '../types';
import { getUserFromRequest } from '../middleware/auth';

export const wishlistRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api/wishlist' });

// Get user wishlist with product enrichment
wishlistRouter.get('/', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  let wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length === 0) {
    wishlists = await sql`INSERT INTO wishlists (user_id) VALUES (${user.id}) RETURNING id`;
  }

  const wishlistId = wishlists[0].id;
  const items = await sql`
    SELECT id, wishlist_id, product_id, created_at 
    FROM wishlist_items 
    WHERE wishlist_id = ${wishlistId}
    ORDER BY created_at DESC
  `;

  if (items.length === 0) {
    return {
      items: [],
      item_count: 0,
    };
  }

  // Enrich with product details
  const productIds = items.map(i => i.product_id);
  let productsMap = new Map<number, any>();

  try {
    const { sql: prodSql } = getProductsDb(env);
    const productsData = await prodSql`
      SELECT 
        p.id, p.name, p.slug, p.price_cents, p.rating, p.review_count,
        b.name as brand_name,
        img.src as image_src, img.alt as image_alt
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN LATERAL (
        SELECT src, alt FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1
      ) img ON true
      WHERE p.id = ANY(${productIds})
    `;

    for (const p of productsData) {
      productsMap.set(p.id, p);
    }
  } catch (e) {
    console.error('Failed to enrich wishlist products:', e);
  }

  const enriched = items.map(item => {
    const prod = productsMap.get(item.product_id);
    return {
      id: item.id,
      productId: item.product_id,
      product: prod ? {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price_cents: prod.price_cents,
        price: prod.price_cents / 100,
        rating: Number(prod.rating || 0),
        review_count: prod.review_count,
        brandName: prod.brand_name,
        image: prod.image_src ? { src: prod.image_src, alt: prod.image_alt } : null,
      } : null,
      createdAt: item.created_at,
    };
  });

  return {
    items: enriched,
    item_count: enriched.length,
  };
});

// Add item to wishlist (idempotent)
wishlistRouter.post('/items', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const body = await request.json() as any;
  const { product_id } = body;

  if (!product_id) {
    return error(400, { message: 'product_id is required' });
  }

  const { sql } = getDb(env);

  let wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length === 0) {
    wishlists = await sql`INSERT INTO wishlists (user_id) VALUES (${user.id}) RETURNING id`;
  }

  const wishlistId = wishlists[0].id;

  const existing = await sql`
    SELECT id, wishlist_id, product_id, created_at 
    FROM wishlist_items 
    WHERE wishlist_id = ${wishlistId} AND product_id = ${product_id}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return { success: true, item: existing[0], message: 'Item already in wishlist' };
  }

  const result = await sql`
    INSERT INTO wishlist_items (wishlist_id, product_id)
    VALUES (${wishlistId}, ${product_id})
    RETURNING id, wishlist_id, product_id, created_at
  `;

  return { success: true, item: result[0] };
});

// Remove item by wishlist item ID
wishlistRouter.delete('/items/:id', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id } = request.params;
  const { sql } = getDb(env);

  const wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length === 0) {
    return error(400, { message: 'Wishlist not found' });
  }

  await sql`
    DELETE FROM wishlist_items 
    WHERE id = ${id} AND wishlist_id = ${wishlists[0].id}
  `;

  return { success: true, message: 'Item removed from wishlist' };
});

// Remove item by product ID
wishlistRouter.delete('/items/by-product/:productId', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { productId } = request.params;
  const { sql } = getDb(env);

  const wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length === 0) {
    return error(400, { message: 'Wishlist not found' });
  }

  await sql`
    DELETE FROM wishlist_items 
    WHERE product_id = ${Number(productId)} AND wishlist_id = ${wishlists[0].id}
  `;

  return { success: true, message: 'Item removed from wishlist' };
});

// Clear all items from wishlist
wishlistRouter.delete('/clear', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  const wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length > 0) {
    await sql`DELETE FROM wishlist_items WHERE wishlist_id = ${wishlists[0].id}`;
  }

  return { success: true, message: 'Wishlist cleared' };
});
