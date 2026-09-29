import { AutoRouter, error } from 'itty-router';
import { getDb, getProductsDb } from '../utils/db';
import { Env } from '../types';
import { getUserFromRequest } from '../middleware/auth';

export const cartRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api/cart' });

// Get user cart with full product enrichment
cartRouter.get('/', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  let carts = await sql`SELECT id, user_id, created_at, updated_at FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    // Auto-create cart if missing
    carts = await sql`INSERT INTO carts (user_id) VALUES (${user.id}) RETURNING id, user_id, created_at, updated_at`;
  }

  const cart = carts[0];
  const items = await sql`
    SELECT id, cart_id, product_id, quantity, price_snapshot, created_at 
    FROM cart_items 
    WHERE cart_id = ${cart.id}
    ORDER BY created_at ASC
  `;

  if (items.length === 0) {
    return {
      cart,
      items: [],
      item_count: 0,
      subtotal: 0,
    };
  }

  // Enrich with product details from products DB
  const productIds = items.map(i => i.product_id);
  let productsMap = new Map<number, any>();

  try {
    const { sql: prodSql } = getProductsDb(env);
    const productsData = await prodSql`
      SELECT 
        p.id, p.name, p.slug, p.price_cents,
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
    console.error('Failed to enrich cart products:', e);
  }

  let subtotal = 0;
  let itemCount = 0;

  const enrichedItems = items.map(item => {
    const prod = productsMap.get(item.product_id);
    const unitPrice = parseFloat(item.price_snapshot || '0') || (prod ? prod.price_cents / 100 : 0);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    itemCount += item.quantity;

    return {
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal,
      product: prod ? {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        brandName: prod.brand_name,
        image: prod.image_src ? { src: prod.image_src, alt: prod.image_alt } : null,
      } : null,
      createdAt: item.created_at,
    };
  });

  return {
    cart,
    items: enrichedItems,
    item_count: itemCount,
    subtotal: Math.round(subtotal * 100) / 100,
  };
});

// Add item to cart (or increment quantity if already present)
cartRouter.post('/items', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const body = await request.json() as any;
  const { product_id, quantity = 1, price_snapshot } = body;

  if (!product_id || quantity <= 0) {
    return error(400, { message: 'Invalid product_id or quantity' });
  }

  const { sql } = getDb(env);

  let carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    carts = await sql`INSERT INTO carts (user_id) VALUES (${user.id}) RETURNING id`;
  }

  const cartId = carts[0].id;

  // Resolve price snapshot if not passed
  let price = price_snapshot;
  if (price === undefined || price === null) {
    try {
      const { sql: prodSql } = getProductsDb(env);
      const [prod] = await prodSql`SELECT price_cents FROM products WHERE id = ${Number(product_id)} LIMIT 1`;
      if (prod) {
        price = (prod.price_cents / 100).toFixed(2);
      }
    } catch (e) {
      console.error('Failed to lookup product price:', e);
    }
  }

  const finalPrice = price || '0.00';

  // Check if item exists in cart
  const existing = await sql`
    SELECT id, quantity FROM cart_items WHERE cart_id = ${cartId} AND product_id = ${product_id} LIMIT 1
  `;

  if (existing.length > 0) {
    const newQty = existing[0].quantity + Number(quantity);
    const updated = await sql`
      UPDATE cart_items 
      SET quantity = ${newQty}, price_snapshot = ${finalPrice}
      WHERE id = ${existing[0].id}
      RETURNING id, cart_id, product_id, quantity, price_snapshot, created_at
    `;
    return { success: true, item: updated[0] };
  }

  const result = await sql`
    INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
    VALUES (${cartId}, ${product_id}, ${quantity}, ${finalPrice})
    RETURNING id, cart_id, product_id, quantity, price_snapshot, created_at
  `;

  return { success: true, item: result[0] };
});

// Update item quantity
cartRouter.patch('/items/:id', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id } = request.params;
  const body = await request.json() as any;
  const { quantity } = body;

  if (quantity === undefined || quantity < 0) {
    return error(400, { message: 'Valid quantity is required' });
  }

  const { sql } = getDb(env);

  const carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length === 0) {
    return error(400, { message: 'Cart not found' });
  }

  if (quantity === 0) {
    await sql`DELETE FROM cart_items WHERE id = ${id} AND cart_id = ${carts[0].id}`;
    return { success: true, message: 'Item removed from cart' };
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

// Remove item from cart
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

  await sql`DELETE FROM cart_items WHERE id = ${id} AND cart_id = ${carts[0].id}`;
  return { success: true, message: 'Item deleted from cart' };
});

// Clear entire cart
cartRouter.delete('/clear', async (request, env) => {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return error(401, { message: 'Unauthorized' });
  }

  const { sql } = getDb(env);

  const carts = await sql`SELECT id FROM carts WHERE user_id = ${user.id}`;
  if (carts.length > 0) {
    await sql`DELETE FROM cart_items WHERE cart_id = ${carts[0].id}`;
  }

  return { success: true, message: 'Cart cleared' };
});
