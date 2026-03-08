import { AutoRouter, error } from 'itty-router';
import { getDb } from '../utils/db';
import { Env } from '../types';
import { getUserFromRequest } from '../middleware/auth';

export const cartRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api/cart' });

cartRouter.get('/', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  const carts = await sql`SELECT id, user_id, created_at, updated_at FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    return { cart: null, items: [] };
  }

  const cartId = carts[0].id;
  const items = await sql`
    SELECT id, cart_id, product_id, quantity, price_snapshot, created_at 
    FROM cart_items 
    WHERE cart_id = ${cartId}
  `;

  return {
    cart: carts[0],
    items: items.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: parseFloat(item.price_snapshot || '0'),
      createdAt: item.created_at
    }))
  };
});

cartRouter.post('/items', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const body = await request.json() as any;
  const { product_id, quantity, price_snapshot } = body;

  const { sql } = getDb(env);

  const carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    return error(400, { message: 'Cart not found' });
  }

  const cartId = carts[0].id;

  try {
    const result = await sql`
      INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
      VALUES (${cartId}, ${product_id}, ${quantity}, ${price_snapshot})
      RETURNING id, cart_id, product_id, quantity, price_snapshot, created_at
    `;

    return { success: true, item: result[0] };
  } catch (err: any) {
    if (err.code === '23505') {
      return error(409, { message: 'Item already exists in cart' });
    }
    throw err;
  }
});

cartRouter.patch('/items/:id', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id } = request.params;
  const body = await request.json() as any;
  const { quantity } = body;

  const { sql } = getDb(env);

  const carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    return error(400, { message: 'Cart not found' });
  }

  const result = await sql`
    UPDATE cart_items 
    SET quantity = ${quantity}
    WHERE id = ${id} AND cart_id = ${carts[0].id}
    RETURNING id, cart_id, product_id, quantity, price_snapshot, created_at
  `;

  if (result.length === 0) {
    return error(404, { message: 'Cart item not found' });
  }

  return { success: true, item: result[0] };
});

cartRouter.delete('/items/:id', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id } = request.params;

  const { sql } = getDb(env);

  const carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    return error(400, { message: 'Cart not found' });
  }

  await sql`
    DELETE FROM cart_items 
    WHERE id = ${id} AND cart_id = ${carts[0].id}
  `;

  return { success: true };
});

cartRouter.delete('/', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  const carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    return { success: true };
  }

  await sql`DELETE FROM cart_items WHERE cart_id = ${carts[0].id}`;

  return { success: true };
});