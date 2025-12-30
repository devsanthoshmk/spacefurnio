/**
 * ===========================================
 * WISHLIST ROUTES
 * ===========================================
 * User wishlist management (requires authentication)
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/wishlist' });

// ===========================================
// GET WISHLIST
// ===========================================
router.get('/', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Get user's default wishlist
    const wishlists = await db`
      SELECT * FROM wishlists
      WHERE user_id = ${user.id} AND is_default = TRUE
      LIMIT 1
    `;

    let wishlist = wishlists[0];

    // Create default wishlist if doesn't exist
    if (!wishlist) {
      const newWishlists = await db`
        INSERT INTO wishlists (user_id, name, is_default)
        VALUES (${user.id}, 'My Wishlist', TRUE)
        RETURNING *
      `;
      wishlist = newWishlists[0];
    }

    // Get wishlist items with product details
    const items = await db`
      SELECT wi.*,
             p.name, p.slug, p.price, p.compare_at_price, p.images,
             p.rating_average, p.quantity as stock, p.status,
             c.name as category_name
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE wi.wishlist_id = ${wishlist.id}
      ORDER BY wi.added_at DESC
    `;

    return json({
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        isPublic: wishlist.is_public,
        itemCount: items.length
      },
      items: items.map(formatWishlistItem)
    });

  } catch (err) {
    console.error('Get wishlist error:', err);
    return error(500, { message: 'Failed to fetch wishlist' });
  }
});

// ===========================================
// ADD ITEM TO WISHLIST
// ===========================================
router.post('/items', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { productId, variantId, selectedColor, notes } = body;

  if (!productId) {
    return error(400, { message: 'Product ID required' });
  }

  try {
    // Verify product exists
    const products = await db`
      SELECT * FROM products WHERE id = ${productId}::uuid
    `;

    if (products.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    // Get user's default wishlist
    const wishlists = await db`
      SELECT * FROM wishlists
      WHERE user_id = ${user.id} AND is_default = TRUE
      LIMIT 1
    `;

    let wishlist = wishlists[0];

    if (!wishlist) {
      const newWishlists = await db`
        INSERT INTO wishlists (user_id, name, is_default)
        VALUES (${user.id}, 'My Wishlist', TRUE)
        RETURNING *
      `;
      wishlist = newWishlists[0];
    }

    // Check if already in wishlist
    const existing = await db`
      SELECT * FROM wishlist_items
      WHERE wishlist_id = ${wishlist.id}
        AND product_id = ${productId}::uuid
        AND COALESCE(variant_id, '00000000-0000-0000-0000-000000000000') = COALESCE(${variantId}::uuid, '00000000-0000-0000-0000-000000000000')
    `;

    if (existing.length > 0) {
      return json({
        success: true,
        message: 'Item already in wishlist',
        itemId: existing[0].id
      });
    }

    // Add item
    const newItems = await db`
      INSERT INTO wishlist_items (wishlist_id, product_id, variant_id, selected_color, notes)
      VALUES (${wishlist.id}, ${productId}::uuid, ${variantId}::uuid, ${selectedColor}, ${notes})
      RETURNING *
    `;

    const item = newItems[0];

    // Get item count
    const countResult = await db`
      SELECT COUNT(*) as count FROM wishlist_items WHERE wishlist_id = ${wishlist.id}
    `;

    return json({
      success: true,
      item: {
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        addedAt: item.added_at
      },
      itemCount: parseInt(countResult[0].count)
    });

  } catch (err) {
    console.error('Add to wishlist error:', err);
    return error(500, { message: 'Failed to add to wishlist' });
  }
});

// ===========================================
// REMOVE ITEM FROM WISHLIST
// ===========================================
router.delete('/items/:itemId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Verify ownership
    const items = await db`
      SELECT wi.* FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE wi.id = ${params.itemId}::uuid AND w.user_id = ${user.id}
    `;

    if (items.length === 0) {
      return error(404, { message: 'Wishlist item not found' });
    }

    // Delete item
    await db`DELETE FROM wishlist_items WHERE id = ${params.itemId}::uuid`;

    // Get updated count
    const countResult = await db`
      SELECT COUNT(*) as count FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ${user.id} AND w.is_default = TRUE
    `;

    return json({
      success: true,
      itemCount: parseInt(countResult[0].count)
    });

  } catch (err) {
    console.error('Remove from wishlist error:', err);
    return error(500, { message: 'Failed to remove from wishlist' });
  }
});

// ===========================================
// REMOVE BY PRODUCT ID (convenience endpoint)
// ===========================================
router.delete('/product/:productId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Delete by product ID
    await db`
      DELETE FROM wishlist_items wi
      USING wishlists w
      WHERE wi.wishlist_id = w.id
        AND w.user_id = ${user.id}
        AND wi.product_id = ${params.productId}::uuid
    `;

    // Get updated count
    const countResult = await db`
      SELECT COUNT(*) as count FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ${user.id} AND w.is_default = TRUE
    `;

    return json({
      success: true,
      itemCount: parseInt(countResult[0].count)
    });

  } catch (err) {
    console.error('Remove from wishlist error:', err);
    return error(500, { message: 'Failed to remove from wishlist' });
  }
});

// ===========================================
// CHECK IF PRODUCT IN WISHLIST
// ===========================================
router.get('/check/:productId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return json({ inWishlist: false });
  }

  try {
    const items = await db`
      SELECT wi.id FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ${user.id}
        AND wi.product_id = ${params.productId}::uuid
      LIMIT 1
    `;

    return json({
      inWishlist: items.length > 0,
      itemId: items[0]?.id || null
    });

  } catch (err) {
    console.error('Check wishlist error:', err);
    return json({ inWishlist: false });
  }
});

// ===========================================
// MOVE ITEM TO CART
// ===========================================
router.post('/items/:itemId/move-to-cart', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Get wishlist item
    const items = await db`
      SELECT wi.*, p.price, p.quantity as stock, p.status
      FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      JOIN products p ON wi.product_id = p.id
      WHERE wi.id = ${params.itemId}::uuid AND w.user_id = ${user.id}
    `;

    if (items.length === 0) {
      return error(404, { message: 'Wishlist item not found' });
    }

    const item = items[0];

    // Check if product is still available
    if (item.status !== 'active') {
      return error(400, { message: 'Product is no longer available' });
    }

    if (item.stock < 1) {
      return error(400, { message: 'Product is out of stock' });
    }

    // Get or create cart
    let cart;
    const carts = await db`
      SELECT * FROM carts WHERE user_id = ${user.id} AND status = 'active' LIMIT 1
    `;

    if (carts.length === 0) {
      const newCarts = await db`
        INSERT INTO carts (user_id, status) VALUES (${user.id}, 'active') RETURNING *
      `;
      cart = newCarts[0];
    } else {
      cart = carts[0];
    }

    // Check if already in cart
    const existingCartItems = await db`
      SELECT * FROM cart_items
      WHERE cart_id = ${cart.id}
        AND product_id = ${item.product_id}::uuid
        AND COALESCE(variant_id, '00000000-0000-0000-0000-000000000000') = COALESCE(${item.variant_id}::uuid, '00000000-0000-0000-0000-000000000000')
    `;

    if (existingCartItems.length > 0) {
      // Update quantity
      await db`
        UPDATE cart_items
        SET quantity = quantity + 1,
            total_price = unit_price * (quantity + 1),
            updated_at = NOW()
        WHERE id = ${existingCartItems[0].id}
      `;
    } else {
      // Add to cart
      await db`
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, total_price, selected_color)
        VALUES (${cart.id}, ${item.product_id}, ${item.variant_id}, 1, ${item.price}, ${item.price}, ${item.selected_color})
      `;
    }

    // Remove from wishlist
    await db`DELETE FROM wishlist_items WHERE id = ${params.itemId}::uuid`;

    return json({
      success: true,
      message: 'Item moved to cart'
    });

  } catch (err) {
    console.error('Move to cart error:', err);
    return error(500, { message: 'Failed to move item to cart' });
  }
});

// ===========================================
// GET WISHLIST COUNT (for header badge)
// ===========================================
router.get('/count', async (request) => {
  const { db, user } = request;

  if (!user) {
    return json({ count: 0 });
  }

  try {
    const result = await db`
      SELECT COUNT(*) as count FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ${user.id} AND w.is_default = TRUE
    `;

    return json({ count: parseInt(result[0]?.count || 0) });

  } catch (err) {
    console.error('Get wishlist count error:', err);
    return json({ count: 0 });
  }
});

// ===========================================
// TOGGLE WISHLIST VISIBILITY
// ===========================================
router.patch('/visibility', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { isPublic } = body;

  try {
    await db`
      UPDATE wishlists
      SET is_public = ${isPublic}, updated_at = NOW()
      WHERE user_id = ${user.id} AND is_default = TRUE
    `;

    return json({
      success: true,
      isPublic
    });

  } catch (err) {
    console.error('Update visibility error:', err);
    return error(500, { message: 'Failed to update wishlist visibility' });
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatWishlistItem(item) {
  return {
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    name: item.name,
    slug: item.slug,
    price: parseFloat(item.price),
    compareAtPrice: item.compare_at_price ? parseFloat(item.compare_at_price) : null,
    image: item.images?.[0]?.url || null,
    ratingAverage: parseFloat(item.rating_average || 0),
    stock: item.stock,
    isAvailable: item.status === 'active' && item.stock > 0,
    categoryName: item.category_name,
    selectedColor: item.selected_color,
    notes: item.notes,
    addedAt: item.added_at
  };
}

export default router;
