import { AutoRouter, error } from 'itty-router';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getDb, getProductsDb } from '../utils/db';
import { Env } from '../types';

export const orderRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/orders' });

// Get all orders for authenticated user
orderRouter.get('/', authenticate, async (request, env) => {
  try {
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const orders = await sql`
      SELECT 
        o.id, o.status, o.total_amount, o.created_at,
        o.shipping_first_name, o.shipping_last_name, o.shipping_address,
        o.shipping_city, o.shipping_state, o.shipping_pincode, o.shipping_phone,
        p.method as payment_method, p.status as payment_status,
        s.status as shipment_status, s.tracking_number, s.carrier,
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        )) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id, p.method, p.status, s.status, s.tracking_number, s.carrier
      ORDER BY o.created_at DESC
    `;

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      total_amount: parseFloat(order.total_amount) || 0,
      created_at: order.created_at,
      order_items: order.order_items || [],
      shipping_first_name: order.shipping_first_name || '',
      shipping_last_name: order.shipping_last_name || '',
      shipping_address: order.shipping_address || '',
      shipping_city: order.shipping_city || '',
      shipping_state: order.shipping_state || '',
      shipping_pincode: order.shipping_pincode || '',
      shipping_phone: order.shipping_phone || '',
      payment_method: order.payment_method || '',
      payment_status: order.payment_status || '',
      shipment_status: order.shipment_status || null,
      tracking_number: order.tracking_number || null,
      carrier: order.carrier || null,
    }));
  } catch (e) {
    console.error('Failed to fetch orders:', e);
    return error(500, { message: 'Failed to fetch orders' });
  }
});

// Get single order details
orderRouter.get('/:orderId', authenticate, async (request, env) => {
  try {
    const { orderId } = request.params;
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const orders = await sql`
      SELECT 
        o.id, o.user_id, o.address_id, o.status, o.total_amount, o.created_at,
        o.shipping_first_name, o.shipping_last_name, o.shipping_address,
        o.shipping_city, o.shipping_state, o.shipping_pincode, o.shipping_phone,
        p.id as payment_id, p.method as payment_method, p.status as payment_status, p.amount as payment_amount,
        s.id as shipment_id, s.tracking_number, s.carrier, s.status as shipment_status
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.id = ${orderId} AND (o.user_id = ${userId} OR ${request.user.role === 'admin'})
      LIMIT 1
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];

    const [items, statusHistory] = await Promise.all([
      sql`
        SELECT id, product_id, quantity, unit_price 
        FROM order_items 
        WHERE order_id = ${orderId}
      `,
      sql`
        SELECT id, status, notes, created_at 
        FROM order_status_history 
        WHERE order_id = ${orderId} 
        ORDER BY created_at ASC
      `,
    ]);

    // Product details enrichment
    const productIds = items.map(i => i.product_id);
    let productsMap = new Map<number, any>();

    if (productIds.length > 0) {
      try {
        const { sql: prodSql } = getProductsDb(env);
        const prodRows = await prodSql`
          SELECT p.id, p.name, p.slug, img.src as image_src
          FROM products p
          LEFT JOIN LATERAL (
            SELECT src FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1
          ) img ON true
          WHERE p.id = ANY(${productIds})
        `;
        for (const p of prodRows) {
          productsMap.set(p.id, p);
        }
      } catch (e) {
        console.error('Failed to resolve products for order detail:', e);
      }
    }

    const enrichedItems = items.map(item => {
      const prod = productsMap.get(item.product_id);
      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || '0'),
        product: prod ? {
          name: prod.name,
          slug: prod.slug,
          image: prod.image_src,
        } : null,
      };
    });

    return {
      id: order.id,
      status: order.status,
      total_amount: parseFloat(order.total_amount) || 0,
      shipping: {
        firstName: order.shipping_first_name || '',
        lastName: order.shipping_last_name || '',
        address: order.shipping_address || '',
        city: order.shipping_city || '',
        state: order.shipping_state || '',
        pincode: order.shipping_pincode || '',
        phone: order.shipping_phone || '',
      },
      payment: {
        id: order.payment_id,
        method: order.payment_method,
        status: order.payment_status,
        amount: parseFloat(order.payment_amount || '0'),
      },
      shipment: order.shipment_id ? {
        id: order.shipment_id,
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        status: order.shipment_status,
      } : null,
      items: enrichedItems,
      statusHistory,
      created_at: order.created_at,
    };
  } catch (e) {
    console.error('Failed to get order details:', e);
    return error(500, { message: 'Failed to fetch order details' });
  }
});

// Checkout / Place order
orderRouter.post('/checkout', authenticate, async (request, env) => {
  try {
    const body = await request.json() as any;
    const { cartItems: passedItems, addressId, shippingAddress, couponCode } = body;
    const rawPaymentMethod = body?.paymentMethod ?? body?.payment_method ?? body?.payment?.method ?? 'card';
    const paymentMethod = String(rawPaymentMethod).trim().toLowerCase();
    const allowedPaymentMethods = ['card', 'upi', 'cod', 'razorpay', 'paypal', 'stripe'];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return error(400, {
        message: `Invalid payment method: ${paymentMethod}`,
        allowed_methods: allowedPaymentMethods,
      });
    }

    const userId = request.user.sub;
    const { sql } = getDb(env);

    let itemsToProcess = passedItems;

    // If cart items not explicitly passed, pull items from user's active cart in DB
    let isFromActiveCart = false;
    if (!itemsToProcess || !Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
      const userCarts = await sql`SELECT id FROM carts WHERE user_id = ${userId} LIMIT 1`;
      if (userCarts.length > 0) {
        const cartRows = await sql`
          SELECT product_id, quantity, price_snapshot 
          FROM cart_items 
          WHERE cart_id = ${userCarts[0].id}
        `;
        if (cartRows.length > 0) {
          itemsToProcess = cartRows.map(r => ({
            productId: r.product_id,
            quantity: r.quantity,
            unitPrice: parseFloat(r.price_snapshot || '0'),
          }));
          isFromActiveCart = true;
        }
      }
    }

    if (!itemsToProcess || !Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
      return error(400, { message: 'Cart is empty. Cannot place order.' });
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of itemsToProcess) {
      const qty = Number(item.quantity) || 1;
      const price = parseFloat(item.unitPrice || item.priceSnapshot || 0);
      subtotal += qty * price;
    }

    // Process coupon if provided
    let discountAmount = 0;
    let validatedCouponId: string | null = null;

    if (couponCode) {
      const coupons = await sql`
        SELECT id, code, discount_type, discount_value, is_active, expires_at
        FROM coupons
        WHERE UPPER(code) = ${String(couponCode).trim().toUpperCase()}
        LIMIT 1
      `;

      if (coupons.length > 0) {
        const cp = coupons[0];
        if (cp.is_active && (!cp.expires_at || new Date(cp.expires_at) > new Date())) {
          const discountVal = parseFloat(cp.discount_value);
          if (cp.discount_type === 'percentage') {
            discountAmount = Math.round((subtotal * (discountVal / 100)) * 100) / 100;
          } else {
            discountAmount = Math.min(subtotal, discountVal);
          }
          validatedCouponId = cp.id;
        }
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const orderId = crypto.randomUUID();

    // Resolve shipping address
    let shippingFirstName = '';
    let shippingLastName = '';
    let shippingAddressStr = '';
    let shippingCity = '';
    let shippingState = '';
    let shippingPincode = '';
    let shippingPhone = '';
    let dbAddressId = addressId || null;

    if (shippingAddress) {
      shippingFirstName = shippingAddress.firstName || shippingAddress.first_name || '';
      shippingLastName = shippingAddress.lastName || shippingAddress.last_name || '';
      shippingAddressStr = shippingAddress.address || shippingAddress.address_line_1 || '';
      shippingCity = shippingAddress.city || '';
      shippingState = shippingAddress.state || '';
      shippingPincode = shippingAddress.pincode || shippingAddress.postal_code || '';
      shippingPhone = shippingAddress.phone || shippingAddress.phone_number || '';
    } else if (addressId) {
      const addresses = await sql`
        SELECT address_line_1, address_line_2, city, state, postal_code
        FROM user_addresses WHERE id = ${addressId} AND user_id = ${userId}
      `;
      if (addresses.length > 0) {
        const addr = addresses[0];
        const nameParts = (addr.address_line_1 || '').split(' ');
        shippingFirstName = nameParts[0] || '';
        shippingLastName = nameParts.slice(1).join(' ') || '';
        shippingAddressStr = addr.address_line_2 ? `${addr.address_line_1}, ${addr.address_line_2}` : (addr.address_line_1 || '');
        shippingCity = addr.city || '';
        shippingState = addr.state || '';
        shippingPincode = addr.postal_code || '';
      }
    }

    // Insert order
    await sql`
      INSERT INTO orders (id, user_id, address_id, status, total_amount,
        shipping_first_name, shipping_last_name, shipping_address,
        shipping_city, shipping_state, shipping_pincode, shipping_phone)
      VALUES (${orderId}, ${userId}, ${dbAddressId}, 'paid', ${totalAmount.toFixed(2)},
        ${shippingFirstName}, ${shippingLastName}, ${shippingAddressStr},
        ${shippingCity}, ${shippingState}, ${shippingPincode}, ${shippingPhone})
    `;

    // Insert order items
    for (const item of itemsToProcess) {
      const qty = Number(item.quantity) || 1;
      const price = parseFloat(item.unitPrice || item.priceSnapshot || 0);
      await sql`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
        VALUES (${crypto.randomUUID()}, ${orderId}, ${item.productId || item.product_id}, ${qty}, ${price})
      `;
    }

    // Insert payment record
    const paymentId = crypto.randomUUID();
    await sql`
      INSERT INTO payments (id, order_id, amount, method, status)
      VALUES (${paymentId}, ${orderId}, ${totalAmount.toFixed(2)}, ${paymentMethod}, 'completed')
    `;

    // Record initial status in status history
    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes)
      VALUES (${crypto.randomUUID()}, ${orderId}, 'paid', 'Order successfully placed')
    `;

    // Record coupon redemption if applicable
    if (validatedCouponId) {
      await sql`
        INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_applied)
        VALUES (${crypto.randomUUID()}, ${validatedCouponId}, ${userId}, ${orderId}, ${discountAmount.toFixed(2)})
      `;
    }

    // Clear user cart if order was placed from cart or items match
    const userCarts = await sql`SELECT id FROM carts WHERE user_id = ${userId} LIMIT 1`;
    if (userCarts.length > 0) {
      await sql`DELETE FROM cart_items WHERE cart_id = ${userCarts[0].id}`;
    }

    return {
      success: true,
      orderId,
      subtotal,
      discount: discountAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_id: paymentId,
      message: 'Order created successfully',
    };
  } catch (e) {
    console.error('Checkout error:', e);
    return error(500, { message: 'Failed to process checkout' });
  }
});

// Cancel order (if eligible)
orderRouter.post('/:orderId/cancel', authenticate, async (request, env) => {
  try {
    const { orderId } = request.params;
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const body = await request.json().catch(() => ({})) as any;
    const reason = body.reason || 'Cancelled by customer';

    const orders = await sql`
      SELECT id, status FROM orders 
      WHERE id = ${orderId} AND user_id = ${userId}
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const currentStatus = orders[0].status;
    if (['shipped', 'delivered', 'cancelled'].includes(currentStatus)) {
      return error(400, { message: `Cannot cancel an order with status: ${currentStatus}` });
    }

    await sql`UPDATE orders SET status = 'cancelled' WHERE id = ${orderId}`;
    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes)
      VALUES (${crypto.randomUUID()}, ${orderId}, 'cancelled', ${reason})
    `;

    return { success: true, message: 'Order cancelled successfully' };
  } catch (e) {
    console.error('Failed to cancel order:', e);
    return error(500, { message: 'Failed to cancel order' });
  }
});

// Update shipping address on eligible order
orderRouter.patch('/:orderId/shipping', authenticate, async (request, env) => {
  try {
    const { orderId } = request.params;
    const userId = request.user.sub;
    const body = await request.json() as any;

    const {
      shipping_first_name = '',
      shipping_last_name = '',
      shipping_address = '',
      shipping_city = '',
      shipping_state = '',
      shipping_pincode = '',
      shipping_phone = '',
    } = body || {};

    const { sql } = getDb(env);

    const updated = await sql`
      UPDATE orders
      SET shipping_first_name = ${shipping_first_name},
          shipping_last_name = ${shipping_last_name},
          shipping_address = ${shipping_address},
          shipping_city = ${shipping_city},
          shipping_state = ${shipping_state},
          shipping_pincode = ${shipping_pincode},
          shipping_phone = ${shipping_phone}
      WHERE id = ${orderId}
        AND user_id = ${userId}
        AND status IN ('pending', 'paid', 'processing')
      RETURNING id, shipping_first_name, shipping_last_name, shipping_address,
                shipping_city, shipping_state, shipping_pincode, shipping_phone
    `;

    if (!updated.length) {
      return error(404, { message: 'Order not found or shipping cannot be updated for current status' });
    }

    return { success: true, order: updated[0] };
  } catch (e) {
    console.error('Failed to update shipping:', e);
    return error(500, { message: 'Failed to update shipping address' });
  }
});

// Admin status update
orderRouter.put('/:orderId/status', authenticate, requireRole('admin'), async (request, env) => {
  try {
    const body = await request.json() as any;
    const { status, notes, tracking_number, carrier } = body;
    const { orderId } = request.params;
    const { sql } = getDb(env);

    if (!status) {
      return error(400, { message: 'Status is required' });
    }

    const updated = await sql`
      UPDATE orders 
      SET status = ${status} 
      WHERE id = ${orderId} 
      RETURNING id, status
    `;

    if (updated.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes)
      VALUES (${crypto.randomUUID()}, ${orderId}, ${status}, ${notes || `Status updated to ${status}`})
    `;

    if (tracking_number || carrier) {
      const existingShipment = await sql`SELECT id FROM shipments WHERE order_id = ${orderId} LIMIT 1`;
      if (existingShipment.length > 0) {
        await sql`
          UPDATE shipments 
          SET tracking_number = COALESCE(${tracking_number ?? null}, tracking_number),
              carrier = COALESCE(${carrier ?? null}, carrier),
              status = ${status === 'delivered' ? 'delivered' : 'shipped'},
              updated_at = NOW()
          WHERE order_id = ${orderId}
        `;
      } else {
        await sql`
          INSERT INTO shipments (id, order_id, tracking_number, carrier, status)
          VALUES (${crypto.randomUUID()}, ${orderId}, ${tracking_number || null}, ${carrier || null}, ${status === 'delivered' ? 'delivered' : 'shipped'})
        `;
      }
    }

    return { success: true, message: `Order ${orderId} status updated to ${status}` };
  } catch (e) {
    console.error('Failed to update order status:', e);
    return error(500, { message: 'Failed to update order status' });
  }
});
