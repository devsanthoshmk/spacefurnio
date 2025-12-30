/**
 * ===========================================
 * CART ROUTES
 * ===========================================
 * Shopping cart management for authenticated and guest users
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/cart' });

// ===========================================
// GET CURRENT CART
// ===========================================
router.get('/', async (request) => {
  const { db, user, guestSessionId } = request;

  try {
    let cart;

    if (user) {
      // Get user's cart
      const carts = await db`
        SELECT * FROM carts
        WHERE user_id = ${user.id} AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      cart = carts[0];
    } else if (guestSessionId) {
      // Get guest cart
      const carts = await db`
        SELECT * FROM carts
        WHERE session_id = ${guestSessionId} AND user_id IS NULL AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      cart = carts[0];
    }

    if (!cart) {
      return json({
        cart: null,
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0
        }
      });
    }

    // Get cart items with product details
    const items = await db`
      SELECT ci.*,
             p.name, p.slug, p.images, p.price as current_price, p.quantity as stock,
             pv.name as variant_name, pv.color as variant_color
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = ${cart.id}
      ORDER BY ci.created_at ASC
    `;

    return json({
      cart: {
        id: cart.id,
        couponCode: cart.coupon_code,
        notes: cart.notes
      },
      items: items.map(formatCartItem),
      totals: {
        subtotal: parseFloat(cart.subtotal || 0),
        discount: parseFloat(cart.discount_total || 0),
        tax: parseFloat(cart.tax_total || 0),
        total: parseFloat(cart.total || 0)
      }
    });

  } catch (err) {
    console.error('Get cart error:', err);
    return error(500, { message: 'Failed to fetch cart' });
  }
});

// ===========================================
// ADD ITEM TO CART
// ===========================================
router.post('/items', async (request) => {
  const { db, user, guestSessionId } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { productId, variantId, quantity = 1, selectedColor, selectedOptions } = body;

  if (!productId) {
    return error(400, { message: 'Product ID required' });
  }

  if (quantity < 1 || quantity > 100) {
    return error(400, { message: 'Quantity must be between 1 and 100' });
  }

  try {
    // Get product details
    const products = await db`
      SELECT * FROM products WHERE id = ${productId}::uuid AND status = 'active'
    `;

    if (products.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    const product = products[0];

    // Check inventory
    if (product.track_inventory && product.quantity < quantity && !product.allow_backorder) {
      return error(400, {
        message: 'Insufficient stock',
        availableQuantity: product.quantity
      });
    }

    // Get or create cart
    let cart;

    if (user) {
      const carts = await db`
        SELECT * FROM carts
        WHERE user_id = ${user.id} AND status = 'active'
        LIMIT 1
      `;

      if (carts.length === 0) {
        const newCarts = await db`
          INSERT INTO carts (user_id, status)
          VALUES (${user.id}, 'active')
          RETURNING *
        `;
        cart = newCarts[0];
      } else {
        cart = carts[0];
      }
    } else {
      // Guest cart
      const sessionId = guestSessionId || crypto.randomUUID();

      const carts = await db`
        SELECT * FROM carts
        WHERE session_id = ${sessionId} AND user_id IS NULL AND status = 'active'
        LIMIT 1
      `;

      if (carts.length === 0) {
        const newCarts = await db`
          INSERT INTO carts (session_id, status)
          VALUES (${sessionId}, 'active')
          RETURNING *
        `;
        cart = newCarts[0];
      } else {
        cart = carts[0];
      }
    }

    // Calculate price
    let unitPrice = parseFloat(product.price);

    if (variantId) {
      const variants = await db`
        SELECT * FROM product_variants WHERE id = ${variantId}::uuid AND product_id = ${productId}::uuid
      `;

      if (variants.length > 0) {
        unitPrice += parseFloat(variants[0].price_modifier || 0);
      }
    }

    const totalPrice = unitPrice * quantity;

    // Check if item already exists in cart
    const existingItems = await db`
      SELECT * FROM cart_items
      WHERE cart_id = ${cart.id}
        AND product_id = ${productId}::uuid
        AND COALESCE(variant_id, '00000000-0000-0000-0000-000000000000') = COALESCE(${variantId}::uuid, '00000000-0000-0000-0000-000000000000')
        AND COALESCE(selected_color, '') = COALESCE(${selectedColor}, '')
    `;

    let cartItem;

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;

      // Check stock for combined quantity
      if (product.track_inventory && product.quantity < newQuantity && !product.allow_backorder) {
        return error(400, {
          message: 'Insufficient stock for requested quantity',
          availableQuantity: product.quantity,
          currentInCart: existingItems[0].quantity
        });
      }

      const updatedItems = await db`
        UPDATE cart_items
        SET quantity = ${newQuantity},
            total_price = ${unitPrice * newQuantity},
            updated_at = NOW()
        WHERE id = ${existingItems[0].id}
        RETURNING *
      `;
      cartItem = updatedItems[0];
    } else {
      // Add new item
      const newItems = await db`
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, total_price, selected_color, selected_options)
        VALUES (${cart.id}, ${productId}::uuid, ${variantId}::uuid, ${quantity}, ${unitPrice}, ${totalPrice}, ${selectedColor}, ${selectedOptions || {}})
        RETURNING *
      `;
      cartItem = newItems[0];
    }

    // Cart totals are automatically recalculated by trigger
    // Fetch updated cart
    const updatedCarts = await db`SELECT * FROM carts WHERE id = ${cart.id}`;
    const updatedCart = updatedCarts[0];

    // Get all items
    const items = await db`
      SELECT ci.*,
             p.name, p.slug, p.images, p.price as current_price, p.quantity as stock,
             pv.name as variant_name, pv.color as variant_color
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = ${cart.id}
    `;

    return json({
      success: true,
      cart: {
        id: updatedCart.id,
        couponCode: updatedCart.coupon_code
      },
      items: items.map(formatCartItem),
      totals: {
        subtotal: parseFloat(updatedCart.subtotal || 0),
        discount: parseFloat(updatedCart.discount_total || 0),
        tax: parseFloat(updatedCart.tax_total || 0),
        total: parseFloat(updatedCart.total || 0)
      },
      sessionId: !user ? cart.session_id : undefined
    });

  } catch (err) {
    console.error('Add to cart error:', err);
    return error(500, { message: 'Failed to add item to cart' });
  }
});

// ===========================================
// UPDATE CART ITEM QUANTITY
// ===========================================
router.patch('/items/:itemId', async (request) => {
  const { db, params, user, guestSessionId } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { quantity } = body;

  if (quantity < 1 || quantity > 100) {
    return error(400, { message: 'Quantity must be between 1 and 100' });
  }

  try {
    // Get cart item with ownership check
    let cartItem;

    if (user) {
      const items = await db`
        SELECT ci.*, c.user_id
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ${params.itemId}::uuid
          AND c.user_id = ${user.id}
          AND c.status = 'active'
      `;
      cartItem = items[0];
    } else if (guestSessionId) {
      const items = await db`
        SELECT ci.*, c.session_id
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ${params.itemId}::uuid
          AND c.session_id = ${guestSessionId}
          AND c.user_id IS NULL
          AND c.status = 'active'
      `;
      cartItem = items[0];
    }

    if (!cartItem) {
      return error(404, { message: 'Cart item not found' });
    }

    // Check product stock
    const products = await db`
      SELECT * FROM products WHERE id = ${cartItem.product_id}
    `;
    const product = products[0];

    if (product.track_inventory && product.quantity < quantity && !product.allow_backorder) {
      return error(400, {
        message: 'Insufficient stock',
        availableQuantity: product.quantity
      });
    }

    // Update quantity
    const totalPrice = cartItem.unit_price * quantity;

    await db`
      UPDATE cart_items
      SET quantity = ${quantity},
          total_price = ${totalPrice},
          updated_at = NOW()
      WHERE id = ${params.itemId}::uuid
    `;

    // Fetch updated cart
    return await getCartResponse(db, cartItem.cart_id);

  } catch (err) {
    console.error('Update cart item error:', err);
    return error(500, { message: 'Failed to update cart item' });
  }
});

// ===========================================
// REMOVE ITEM FROM CART
// ===========================================
router.delete('/items/:itemId', async (request) => {
  const { db, params, user, guestSessionId } = request;

  try {
    // Get cart item with ownership check
    let cartId;

    if (user) {
      const items = await db`
        SELECT ci.cart_id
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ${params.itemId}::uuid
          AND c.user_id = ${user.id}
          AND c.status = 'active'
      `;
      cartId = items[0]?.cart_id;
    } else if (guestSessionId) {
      const items = await db`
        SELECT ci.cart_id
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = ${params.itemId}::uuid
          AND c.session_id = ${guestSessionId}
          AND c.user_id IS NULL
          AND c.status = 'active'
      `;
      cartId = items[0]?.cart_id;
    }

    if (!cartId) {
      return error(404, { message: 'Cart item not found' });
    }

    // Delete item
    await db`DELETE FROM cart_items WHERE id = ${params.itemId}::uuid`;

    // Return updated cart
    return await getCartResponse(db, cartId);

  } catch (err) {
    console.error('Remove cart item error:', err);
    return error(500, { message: 'Failed to remove cart item' });
  }
});

// ===========================================
// CLEAR CART
// ===========================================
router.delete('/', async (request) => {
  const { db, user, guestSessionId } = request;

  try {
    let cart;

    if (user) {
      const carts = await db`
        SELECT * FROM carts
        WHERE user_id = ${user.id} AND status = 'active'
        LIMIT 1
      `;
      cart = carts[0];
    } else if (guestSessionId) {
      const carts = await db`
        SELECT * FROM carts
        WHERE session_id = ${guestSessionId} AND user_id IS NULL AND status = 'active'
        LIMIT 1
      `;
      cart = carts[0];
    }

    if (cart) {
      // Delete all items
      await db`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;

      // Reset cart totals
      await db`
        UPDATE carts
        SET subtotal = 0, discount_total = 0, tax_total = 0, total = 0,
            coupon_code = NULL, updated_at = NOW()
        WHERE id = ${cart.id}
      `;
    }

    return json({
      success: true,
      cart: null,
      items: [],
      totals: {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0
      }
    });

  } catch (err) {
    console.error('Clear cart error:', err);
    return error(500, { message: 'Failed to clear cart' });
  }
});

// ===========================================
// APPLY COUPON
// ===========================================
router.post('/coupon', async (request) => {
  const { db, user, guestSessionId } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { code } = body;

  if (!code) {
    return error(400, { message: 'Coupon code required' });
  }

  try {
    // Get cart
    let cart;

    if (user) {
      const carts = await db`
        SELECT * FROM carts WHERE user_id = ${user.id} AND status = 'active' LIMIT 1
      `;
      cart = carts[0];
    } else if (guestSessionId) {
      const carts = await db`
        SELECT * FROM carts WHERE session_id = ${guestSessionId} AND user_id IS NULL AND status = 'active' LIMIT 1
      `;
      cart = carts[0];
    }

    if (!cart) {
      return error(400, { message: 'Cart is empty' });
    }

    // Validate coupon using database function
    const validation = await db`
      SELECT * FROM validate_coupon(
        ${code.toUpperCase()},
        ${user?.id || null}::uuid,
        ${cart.subtotal}
      )
    `;

    const result = validation[0];

    if (!result.is_valid) {
      return error(400, { message: result.error_message });
    }

    // Apply coupon
    await db`
      UPDATE carts
      SET coupon_code = ${code.toUpperCase()},
          updated_at = NOW()
      WHERE id = ${cart.id}
    `;

    // Recalculate totals
    await db`SELECT calculate_cart_totals(${cart.id}::uuid)`;

    // Return updated cart
    return await getCartResponse(db, cart.id);

  } catch (err) {
    console.error('Apply coupon error:', err);
    return error(500, { message: 'Failed to apply coupon' });
  }
});

// ===========================================
// REMOVE COUPON
// ===========================================
router.delete('/coupon', async (request) => {
  const { db, user, guestSessionId } = request;

  try {
    let cartId;

    if (user) {
      const carts = await db`
        SELECT id FROM carts WHERE user_id = ${user.id} AND status = 'active' LIMIT 1
      `;
      cartId = carts[0]?.id;
    } else if (guestSessionId) {
      const carts = await db`
        SELECT id FROM carts WHERE session_id = ${guestSessionId} AND user_id IS NULL AND status = 'active' LIMIT 1
      `;
      cartId = carts[0]?.id;
    }

    if (!cartId) {
      return error(404, { message: 'Cart not found' });
    }

    // Remove coupon
    await db`
      UPDATE carts
      SET coupon_code = NULL, updated_at = NOW()
      WHERE id = ${cartId}
    `;

    // Recalculate totals
    await db`SELECT calculate_cart_totals(${cartId}::uuid)`;

    return await getCartResponse(db, cartId);

  } catch (err) {
    console.error('Remove coupon error:', err);
    return error(500, { message: 'Failed to remove coupon' });
  }
});

// ===========================================
// GET CART COUNT (for header badge)
// ===========================================
router.get('/count', async (request) => {
  const { db, user, guestSessionId } = request;

  try {
    let count = 0;

    if (user) {
      const result = await db`
        SELECT COALESCE(SUM(ci.quantity), 0) as count
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.user_id = ${user.id} AND c.status = 'active'
      `;
      count = parseInt(result[0]?.count || 0);
    } else if (guestSessionId) {
      const result = await db`
        SELECT COALESCE(SUM(ci.quantity), 0) as count
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.session_id = ${guestSessionId} AND c.user_id IS NULL AND c.status = 'active'
      `;
      count = parseInt(result[0]?.count || 0);
    }

    return json({ count });

  } catch (err) {
    console.error('Get cart count error:', err);
    return json({ count: 0 });
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function getCartResponse(db, cartId) {
  const carts = await db`SELECT * FROM carts WHERE id = ${cartId}`;
  const cart = carts[0];

  const items = await db`
    SELECT ci.*,
           p.name, p.slug, p.images, p.price as current_price, p.quantity as stock,
           pv.name as variant_name, pv.color as variant_color
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ${cartId}
    ORDER BY ci.created_at ASC
  `;

  return json({
    success: true,
    cart: {
      id: cart.id,
      couponCode: cart.coupon_code
    },
    items: items.map(formatCartItem),
    totals: {
      subtotal: parseFloat(cart.subtotal || 0),
      discount: parseFloat(cart.discount_total || 0),
      tax: parseFloat(cart.tax_total || 0),
      total: parseFloat(cart.total || 0)
    }
  });
}

function formatCartItem(item) {
  return {
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    name: item.name,
    slug: item.slug,
    image: item.images?.[0]?.url || null,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unit_price),
    totalPrice: parseFloat(item.total_price),
    currentPrice: parseFloat(item.current_price),
    stock: item.stock,
    selectedColor: item.selected_color,
    selectedOptions: item.selected_options,
    variantName: item.variant_name,
    variantColor: item.variant_color
  };
}

export default router;
