import { AutoRouter, error } from 'itty-router';
import { getDb } from '../utils/db';
import { Env } from '../types';
import { getUserFromRequest } from '../middleware/auth';

export const wishlistRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api/wishlist' });

wishlistRouter.get('/', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  const wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length === 0) {
    return [];
  }

  const wishlistId = wishlists[0].id;
  const items = await sql`
    SELECT id, wishlist_id, product_id, created_at 
    FROM wishlist_items 
    WHERE wishlist_id = ${wishlistId}
  `;

  return items.map(item => ({
    id: item.id,
    productId: item.product_id,
    createdAt: item.created_at
  }));
});

wishlistRouter.post('/items', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const body = await request.json() as any;
  const { product_id } = body;

  const { sql } = getDb(env);

  const wishlists = await sql`SELECT id FROM wishlists WHERE user_id = ${user.id}`;
  if (wishlists.length === 0) {
    return error(400, { message: 'Wishlist not found' });
  }

  const wishlistId = wishlists[0].id;

  try {
    const result = await sql`
      INSERT INTO wishlist_items (wishlist_id, product_id)
      VALUES (${wishlistId}, ${product_id})
      RETURNING id, wishlist_id, product_id, created_at
    `;

    return { success: true, item: result[0] };
  } catch (err: any) {
    if (err.code === '23505') {
      return error(409, { message: 'Item already exists in wishlist' });
    }
    throw err;
  }
});

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

  return { success: true };
});

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
    WHERE wishlist_id = ${wishlists[0].id} AND product_id = ${productId}
  `;

  return { success: true };
});