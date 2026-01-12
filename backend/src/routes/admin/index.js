/**
 * ===========================================
 * ADMIN ROUTES
 * ===========================================
 * Admin dashboard API with security code verification
 *
 * Security: All admin routes require:
 * 1. Valid JWT token
 * 2. User must have admin_access record
 * 3. Initial admin setup requires ADMIN_SECURITY_CODE
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/backend/api/v1/admin' });

// ===========================================
// VERIFY ADMIN ACCESS MIDDLEWARE
// ===========================================
async function requireAdmin(request) {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  // Check admin access
  const adminAccess = await db`
    SELECT * FROM admin_access WHERE user_id = ${user.id}
  `;

  if (adminAccess.length === 0) {
    return error(403, { message: 'Admin access required' });
  }

  // Attach admin info to request
  request.admin = adminAccess[0];

  // Update last access
  await db`
    UPDATE admin_access SET last_access_at = NOW() WHERE user_id = ${user.id}
  `;
}

// ===========================================
// REQUEST ADMIN ACCESS
// ===========================================
router.post('/request-access', async (request) => {
  const { db, user, env } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { securityCode } = body;

  if (!securityCode) {
    return error(400, { message: 'Security code is required' });
  }

  // Verify security code
  if (securityCode !== env.ADMIN_SECURITY_CODE) {
    // Log failed attempt
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, details, ip_address)
      VALUES (
        ${user.id},
        'admin_access_denied',
        'admin_access',
        ${JSON.stringify({ reason: 'invalid_security_code' })},
        ${request.headers.get('CF-Connecting-IP') || 'unknown'}
      )
    `;

    return error(403, { message: 'Invalid security code' });
  }

  try {
    // Check if already admin
    const existing = await db`
      SELECT * FROM admin_access WHERE user_id = ${user.id}
    `;

    if (existing.length > 0) {
      return json({
        success: true,
        message: 'Already have admin access',
        role: existing[0].role
      });
    }

    // Grant admin access
    const adminAccess = await db`
      INSERT INTO admin_access (user_id, role, granted_by, permissions)
      VALUES (
        ${user.id},
        'admin',
        ${user.id},
        ${JSON.stringify(['all'])}
      )
      RETURNING *
    `;

    // Log successful access
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (
        ${user.id},
        'admin_access_granted',
        'admin_access',
        ${adminAccess[0].id},
        ${JSON.stringify({ role: 'admin', method: 'security_code' })},
        ${request.headers.get('CF-Connecting-IP') || 'unknown'}
      )
    `;

    return json({
      success: true,
      message: 'Admin access granted',
      role: 'admin'
    });

  } catch (err) {
    console.error('Request admin access error:', err);
    return error(500, { message: 'Failed to grant admin access' });
  }
});

// ===========================================
// CHECK ADMIN STATUS
// ===========================================
router.get('/status', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    const adminAccess = await db`
      SELECT * FROM admin_access WHERE user_id = ${user.id}
    `;

    return json({
      isAdmin: adminAccess.length > 0,
      role: adminAccess[0]?.role || null,
      permissions: adminAccess[0]?.permissions || []
    });

  } catch (err) {
    console.error('Check admin status error:', err);
    return error(500, { message: 'Failed to check admin status' });
  }
});

// ===========================================
// DASHBOARD STATS
// ===========================================
router.get('/dashboard', requireAdmin, async (request) => {
  const { db } = request;

  try {
    // Get dashboard stats using stored function
    const stats = await db`SELECT * FROM get_dashboard_stats()`;

    // Get recent orders
    const recentOrders = await db`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    // Get low stock products
    const lowStock = await db`
      SELECT id, name, slug, stock_quantity, images
      FROM products
      WHERE stock_quantity <= 10 AND stock_quantity > 0 AND is_active = true
      ORDER BY stock_quantity ASC
      LIMIT 10
    `;

    // Get pending reviews
    const pendingReviews = await db`
      SELECT r.*, p.name as product_name, u.name as user_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
      LIMIT 5
    `;

    return json({
      stats: stats[0] || {},
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        paymentStatus: o.payment_status,
        totalAmount: parseFloat(o.total_amount),
        userName: o.user_name,
        userEmail: o.user_email,
        createdAt: o.created_at
      })),
      lowStock: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        stockQuantity: p.stock_quantity,
        image: p.images?.[0]?.url
      })),
      pendingReviews: pendingReviews.map(r => ({
        id: r.id,
        productName: r.product_name,
        userName: r.user_name,
        rating: r.rating,
        content: r.content?.substring(0, 100),
        createdAt: r.created_at
      }))
    });

  } catch (err) {
    console.error('Get dashboard error:', err);
    return error(500, { message: 'Failed to fetch dashboard data' });
  }
});

// ===========================================
// PRODUCTS MANAGEMENT
// ===========================================

// List products
router.get('/products', requireAdmin, async (request) => {
  const { db } = request;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;
  const search = url.searchParams.get('search');
  const categoryId = url.searchParams.get('category');
  const status = url.searchParams.get('status');

  try {
    let products;

    // Build query based on filters
    if (search) {
      products = await db`
        SELECT p.*, c.name as category_name, COUNT(*) OVER() as total_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name ILIKE ${`%${search}%`} OR p.sku ILIKE ${`%${search}%`})
          ${categoryId ? db`AND p.category_id = ${categoryId}::uuid` : db``}
          ${status === 'active' ? db`AND p.is_active = true` : db``}
          ${status === 'inactive' ? db`AND p.is_active = false` : db``}
        ORDER BY p.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    } else {
      products = await db`
        SELECT p.*, c.name as category_name, COUNT(*) OVER() as total_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
          ${categoryId ? db`AND p.category_id = ${categoryId}::uuid` : db``}
          ${status === 'active' ? db`AND p.is_active = true` : db``}
          ${status === 'inactive' ? db`AND p.is_active = false` : db``}
        ORDER BY p.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    }

    const total = products.length > 0 ? products[0].total_count : 0;

    return json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: parseFloat(p.price),
        compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
        stockQuantity: p.stock_quantity,
        categoryName: p.category_name,
        image: p.images?.[0]?.url,
        isActive: p.is_active,
        isFeatured: p.is_featured,
        avgRating: p.avg_rating ? parseFloat(p.avg_rating) : null,
        reviewCount: p.review_count,
        createdAt: p.created_at
      })),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get products error:', err);
    return error(500, { message: 'Failed to fetch products' });
  }
});

// Create product
router.post('/products', requireAdmin, async (request) => {
  const { db, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const {
    name, slug, sku, description, shortDescription, price, compareAtPrice,
    categoryId, images, specifications, dimensions, materials, careInstructions,
    stockQuantity, lowStockThreshold, isActive, isFeatured, isNewArrival,
    metaTitle, metaDescription, tags, roomType, designStyle
  } = body;

  if (!name || !price) {
    return error(400, { message: 'Name and price are required' });
  }

  try {
    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Generate SKU if not provided
    const finalSku = sku || `SF-${Date.now().toString(36).toUpperCase()}`;

    const products = await db`
      INSERT INTO products (
        name, slug, sku, description, short_description, price, compare_at_price,
        category_id, images, specifications, dimensions, materials, care_instructions,
        stock_quantity, low_stock_threshold, is_active, is_featured, is_new_arrival,
        meta_title, meta_description, tags, room_type, design_style
      ) VALUES (
        ${name},
        ${finalSlug},
        ${finalSku},
        ${description || null},
        ${shortDescription || null},
        ${price},
        ${compareAtPrice || null},
        ${categoryId || null}::uuid,
        ${JSON.stringify(images || [])},
        ${specifications ? JSON.stringify(specifications) : null},
        ${dimensions ? JSON.stringify(dimensions) : null},
        ${materials || null},
        ${careInstructions || null},
        ${stockQuantity || 0},
        ${lowStockThreshold || 10},
        ${isActive !== false},
        ${isFeatured || false},
        ${isNewArrival || false},
        ${metaTitle || null},
        ${metaDescription || null},
        ${tags || null},
        ${roomType || null},
        ${designStyle || null}
      )
      RETURNING *
    `;

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        ${user.id},
        'create',
        'product',
        ${products[0].id},
        ${JSON.stringify({ name })}
      )
    `;

    return json({
      success: true,
      product: products[0]
    });

  } catch (err) {
    console.error('Create product error:', err);
    if (err.code === '23505') {
      return error(400, { message: 'Product with this slug or SKU already exists' });
    }
    return error(500, { message: 'Failed to create product' });
  }
});

// Update product
router.patch('/products/:productId', requireAdmin, async (request) => {
  const { db, params, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  try {
    // Check if product exists
    const existing = await db`
      SELECT * FROM products WHERE id = ${params.productId}::uuid
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    const updates = {};
    const allowedFields = [
      'name', 'slug', 'sku', 'description', 'short_description', 'price',
      'compare_at_price', 'category_id', 'images', 'specifications', 'dimensions',
      'materials', 'care_instructions', 'stock_quantity', 'low_stock_threshold',
      'is_active', 'is_featured', 'is_new_arrival', 'meta_title', 'meta_description',
      'tags', 'room_type', 'design_style'
    ];

    for (const [key, value] of Object.entries(body)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updates[snakeKey] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return error(400, { message: 'No valid fields to update' });
    }

    // Handle JSON fields
    if (updates.images) updates.images = JSON.stringify(updates.images);
    if (updates.specifications) updates.specifications = JSON.stringify(updates.specifications);
    if (updates.dimensions) updates.dimensions = JSON.stringify(updates.dimensions);

    // Build update query dynamically
    const setClauses = Object.entries(updates)
      .map(([key]) => `${key} = COALESCE($${key}, ${key})`)
      .join(', ');

    const products = await db`
      UPDATE products
      SET ${db(updates)}, updated_at = NOW()
      WHERE id = ${params.productId}::uuid
      RETURNING *
    `;

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        ${user.id},
        'update',
        'product',
        ${params.productId}::uuid,
        ${JSON.stringify({ fields: Object.keys(body) })}
      )
    `;

    return json({
      success: true,
      product: products[0]
    });

  } catch (err) {
    console.error('Update product error:', err);
    return error(500, { message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:productId', requireAdmin, async (request) => {
  const { db, params, user } = request;

  try {
    // Soft delete
    await db`
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = ${params.productId}::uuid
    `;

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
      VALUES (${user.id}, 'delete', 'product', ${params.productId}::uuid)
    `;

    return json({ success: true });

  } catch (err) {
    console.error('Delete product error:', err);
    return error(500, { message: 'Failed to delete product' });
  }
});

// ===========================================
// ORDERS MANAGEMENT
// ===========================================

// List orders
router.get('/orders', requireAdmin, async (request) => {
  const { db } = request;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;
  const status = url.searchParams.get('status');
  const paymentStatus = url.searchParams.get('payment_status');
  const search = url.searchParams.get('search');

  try {
    let orders;

    if (search) {
      orders = await db`
        SELECT o.*, u.name as user_name, u.email as user_email, COUNT(*) OVER() as total_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE (o.order_number ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})
          ${status ? db`AND o.status = ${status}` : db``}
          ${paymentStatus ? db`AND o.payment_status = ${paymentStatus}` : db``}
        ORDER BY o.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    } else {
      orders = await db`
        SELECT o.*, u.name as user_name, u.email as user_email, COUNT(*) OVER() as total_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE 1=1
          ${status ? db`AND o.status = ${status}` : db``}
          ${paymentStatus ? db`AND o.payment_status = ${paymentStatus}` : db``}
        ORDER BY o.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    }

    const total = orders.length > 0 ? orders[0].total_count : 0;

    return json({
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        totalAmount: parseFloat(o.total_amount),
        userName: o.user_name,
        userEmail: o.user_email,
        createdAt: o.created_at,
        shippedAt: o.shipped_at,
        deliveredAt: o.delivered_at
      })),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get orders error:', err);
    return error(500, { message: 'Failed to fetch orders' });
  }
});

// Get order details
router.get('/orders/:orderId', requireAdmin, async (request) => {
  const { db, params } = request;

  try {
    const orders = await db`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ${params.orderId}::uuid
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const items = await db`
      SELECT oi.*, p.name as product_name, p.slug, p.images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${order.id}
    `;

    // Get addresses
    const shippingAddr = order.shipping_address_id ? await db`
      SELECT * FROM addresses WHERE id = ${order.shipping_address_id}
    ` : [];

    const billingAddr = order.billing_address_id ? await db`
      SELECT * FROM addresses WHERE id = ${order.billing_address_id}
    ` : [];

    return json({
      order: {
        ...order,
        items: items.map(i => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          productSlug: i.slug,
          productImage: i.images?.[0]?.url,
          variantName: i.variant_name,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unit_price),
          totalPrice: parseFloat(i.total_price)
        })),
        shippingAddress: shippingAddr[0] || null,
        billingAddress: billingAddr[0] || null
      }
    });

  } catch (err) {
    console.error('Get order error:', err);
    return error(500, { message: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/orders/:orderId', requireAdmin, async (request) => {
  const { db, params, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { status, trackingNumber, trackingUrl, notes } = body;

  try {
    const existing = await db`SELECT * FROM orders WHERE id = ${params.orderId}::uuid`;

    if (existing.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const updates = { updated_at: new Date() };

    if (status) {
      updates.status = status;

      if (status === 'shipped' && !existing[0].shipped_at) {
        updates.shipped_at = new Date();
      }
      if (status === 'delivered' && !existing[0].delivered_at) {
        updates.delivered_at = new Date();
      }
      if (status === 'cancelled' && !existing[0].cancelled_at) {
        updates.cancelled_at = new Date();
      }
    }

    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
    if (trackingUrl !== undefined) updates.tracking_url = trackingUrl;
    if (notes !== undefined) updates.notes = notes;

    const orders = await db`
      UPDATE orders
      SET ${db(updates)}
      WHERE id = ${params.orderId}::uuid
      RETURNING *
    `;

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        ${user.id},
        'update',
        'order',
        ${params.orderId}::uuid,
        ${JSON.stringify({ previousStatus: existing[0].status, newStatus: status })}
      )
    `;

    return json({
      success: true,
      order: orders[0]
    });

  } catch (err) {
    console.error('Update order error:', err);
    return error(500, { message: 'Failed to update order' });
  }
});

// ===========================================
// REVIEWS MANAGEMENT
// ===========================================

// List reviews
router.get('/reviews', requireAdmin, async (request) => {
  const { db } = request;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;
  const status = url.searchParams.get('status') || 'pending';

  try {
    const reviews = await db`
      SELECT r.*, p.name as product_name, u.name as user_name, u.email as user_email,
             COUNT(*) OVER() as total_count
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const total = reviews.length > 0 ? reviews[0].total_count : 0;

    return json({
      reviews: reviews.map(r => ({
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        userName: r.user_name,
        userEmail: r.user_email,
        rating: r.rating,
        title: r.title,
        content: r.content,
        images: r.images,
        verifiedPurchase: r.verified_purchase,
        status: r.status,
        createdAt: r.created_at
      })),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get reviews error:', err);
    return error(500, { message: 'Failed to fetch reviews' });
  }
});

// Approve/reject review
router.patch('/reviews/:reviewId', requireAdmin, async (request) => {
  const { db, params, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { status } = body;

  if (!['approved', 'rejected'].includes(status)) {
    return error(400, { message: 'Invalid status' });
  }

  try {
    const reviews = await db`
      UPDATE reviews
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${params.reviewId}::uuid
      RETURNING *
    `;

    if (reviews.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        ${user.id},
        ${status === 'approved' ? 'approve' : 'reject'},
        'review',
        ${params.reviewId}::uuid,
        ${JSON.stringify({ productId: reviews[0].product_id })}
      )
    `;

    return json({ success: true, review: reviews[0] });

  } catch (err) {
    console.error('Update review error:', err);
    return error(500, { message: 'Failed to update review' });
  }
});

// ===========================================
// USERS MANAGEMENT
// ===========================================

router.get('/users', requireAdmin, async (request) => {
  const { db } = request;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;
  const search = url.searchParams.get('search');

  try {
    let users;

    if (search) {
      users = await db`
        SELECT u.*,
               (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
               (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') as total_spent,
               COUNT(*) OVER() as total_count
        FROM users u
        WHERE u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`}
        ORDER BY u.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    } else {
      users = await db`
        SELECT u.*,
               (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
               (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') as total_spent,
               COUNT(*) OVER() as total_count
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    }

    const total = users.length > 0 ? users[0].total_count : 0;

    return json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatar_url,
        authProvider: u.auth_provider,
        emailVerified: u.email_verified,
        orderCount: parseInt(u.order_count),
        totalSpent: parseFloat(u.total_spent),
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at
      })),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get users error:', err);
    return error(500, { message: 'Failed to fetch users' });
  }
});

// ===========================================
// CATEGORIES MANAGEMENT
// ===========================================

router.get('/categories', requireAdmin, async (request) => {
  const { db } = request;

  try {
    const categories = await db`
      SELECT c.*,
             (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    return json({ categories });

  } catch (err) {
    console.error('Get categories error:', err);
    return error(500, { message: 'Failed to fetch categories' });
  }
});

router.post('/categories', requireAdmin, async (request) => {
  const { db, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { name, slug, description, parentId, image, sortOrder, isActive } = body;

  if (!name) {
    return error(400, { message: 'Name is required' });
  }

  try {
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const categories = await db`
      INSERT INTO categories (name, slug, description, parent_id, image, sort_order, is_active)
      VALUES (
        ${name},
        ${finalSlug},
        ${description || null},
        ${parentId || null}::uuid,
        ${image || null},
        ${sortOrder || 0},
        ${isActive !== false}
      )
      RETURNING *
    `;

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (${user.id}, 'create', 'category', ${categories[0].id}, ${JSON.stringify({ name })})
    `;

    return json({ success: true, category: categories[0] });

  } catch (err) {
    console.error('Create category error:', err);
    return error(500, { message: 'Failed to create category' });
  }
});

// ===========================================
// COUPONS MANAGEMENT
// ===========================================

router.get('/coupons', requireAdmin, async (request) => {
  const { db } = request;

  try {
    const coupons = await db`
      SELECT c.*,
             (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = c.id) as usage_count
      FROM coupons c
      ORDER BY c.created_at DESC
    `;

    return json({
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: parseFloat(c.value),
        minOrderAmount: c.min_order_amount ? parseFloat(c.min_order_amount) : null,
        maxDiscountAmount: c.max_discount_amount ? parseFloat(c.max_discount_amount) : null,
        usageLimit: c.usage_limit,
        usageCount: parseInt(c.usage_count),
        usagePerUser: c.usage_per_user,
        startsAt: c.starts_at,
        expiresAt: c.expires_at,
        isActive: c.is_active,
        createdAt: c.created_at
      }))
    });

  } catch (err) {
    console.error('Get coupons error:', err);
    return error(500, { message: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', requireAdmin, async (request) => {
  const { db, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const {
    code, type, value, minOrderAmount, maxDiscountAmount,
    usageLimit, usagePerUser, startsAt, expiresAt, isActive
  } = body;

  if (!code || !type || !value) {
    return error(400, { message: 'Code, type, and value are required' });
  }

  try {
    const coupons = await db`
      INSERT INTO coupons (
        code, type, value, min_order_amount, max_discount_amount,
        usage_limit, usage_per_user, starts_at, expires_at, is_active
      ) VALUES (
        ${code.toUpperCase()},
        ${type},
        ${value},
        ${minOrderAmount || null},
        ${maxDiscountAmount || null},
        ${usageLimit || null},
        ${usagePerUser || 1},
        ${startsAt || null},
        ${expiresAt || null},
        ${isActive !== false}
      )
      RETURNING *
    `;

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (${user.id}, 'create', 'coupon', ${coupons[0].id}, ${JSON.stringify({ code })})
    `;

    return json({ success: true, coupon: coupons[0] });

  } catch (err) {
    console.error('Create coupon error:', err);
    if (err.code === '23505') {
      return error(400, { message: 'Coupon code already exists' });
    }
    return error(500, { message: 'Failed to create coupon' });
  }
});

// ===========================================
// SITE SETTINGS
// ===========================================

router.get('/settings', requireAdmin, async (request) => {
  const { db } = request;

  try {
    const settings = await db`SELECT * FROM site_settings`;

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return json({ settings: settingsMap });

  } catch (err) {
    console.error('Get settings error:', err);
    return error(500, { message: 'Failed to fetch settings' });
  }
});

router.patch('/settings', requireAdmin, async (request) => {
  const { db, user } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  try {
    for (const [key, value] of Object.entries(body)) {
      await db`
        INSERT INTO site_settings (key, value, updated_by)
        VALUES (${key}, ${JSON.stringify(value)}, ${user.id})
        ON CONFLICT (key)
        DO UPDATE SET value = ${JSON.stringify(value)}, updated_by = ${user.id}, updated_at = NOW()
      `;
    }

    // Log activity
    await db`
      INSERT INTO activity_logs (user_id, action, entity_type, details)
      VALUES (${user.id}, 'update', 'settings', ${JSON.stringify({ keys: Object.keys(body) })})
    `;

    return json({ success: true });

  } catch (err) {
    console.error('Update settings error:', err);
    return error(500, { message: 'Failed to update settings' });
  }
});

// ===========================================
// ACTIVITY LOGS
// ===========================================

router.get('/activity', requireAdmin, async (request) => {
  const { db } = request;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
  const offset = (page - 1) * perPage;

  try {
    const logs = await db`
      SELECT a.*, u.name as user_name, u.email as user_email, COUNT(*) OVER() as total_count
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const total = logs.length > 0 ? logs[0].total_count : 0;

    return json({
      logs: logs.map(l => ({
        id: l.id,
        userId: l.user_id,
        userName: l.user_name,
        userEmail: l.user_email,
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        details: l.details,
        ipAddress: l.ip_address,
        createdAt: l.created_at
      })),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get activity logs error:', err);
    return error(500, { message: 'Failed to fetch activity logs' });
  }
});

export default router;
