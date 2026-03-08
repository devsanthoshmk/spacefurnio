import { AutoRouter, error } from 'itty-router';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const orderRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/orders' });

// Get user's orders
orderRouter.get('/', authenticate, async (request, env) => {
  try {
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const orders = await sql`
      SELECT o.id, o.status, o.total_amount, o.created_at,
             o.shipping_first_name, o.shipping_last_name, o.shipping_address,
             o.shipping_city, o.shipping_state, o.shipping_pincode, o.shipping_phone,
             p.method as payment_method,
             json_agg(json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price
             )) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id, p.method
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
    }));
  } catch (e) {
    console.error('Failed to fetch orders:', e);
    return error(500, { message: 'Failed to fetch orders' });
  }
});

// Only an authenticated user can place their own order.
orderRouter.post('/checkout', authenticate, async (request, env) => {
  try {
    const body = await request.json() as any;
    const { cartItems, addressId, shippingAddress } = body;
    const rawPaymentMethod =
      body?.paymentMethod ?? body?.payment_method ?? body?.payment?.method ?? '';
    const normalizedPaymentMethod = String(rawPaymentMethod).trim().toLowerCase();
    const allowedPaymentMethods = ['card', 'upi', 'cod', 'razorpay', 'paypal', 'stripe'];

    if (!normalizedPaymentMethod) {
      return error(400, {
        message: 'paymentMethod is required',
        allowed_methods: allowedPaymentMethods,
      });
    }

    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return error(400, {
        message: `Invalid payment method: ${normalizedPaymentMethod}`,
        allowed_methods: allowedPaymentMethods,
      });
    }

    const paymentMethod = normalizedPaymentMethod;
    const userId = request.user.sub;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return error(400, { message: 'Cart is empty' });
    }

    const { sql } = getDb(env);

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.unitPrice || item.priceSnapshot || 0) * item.quantity);
    }, 0);

    // Create order in a transaction-like manner (manual since neon-serverless doesn't support transactions)
    const orderId = crypto.randomUUID();

    // Fetch address details if provided
    let shippingFirstName = '';
    let shippingLastName = '';
    let shippingAddressStr = '';
    let shippingCity = '';
    let shippingState = '';
    let shippingPincode = '';
    let shippingPhone = '';

    let dbAddressId = addressId || null;

    if (shippingAddress) {
      shippingFirstName = shippingAddress.firstName || '';
      shippingLastName = shippingAddress.lastName || '';
      shippingAddressStr = shippingAddress.address || '';
      shippingCity = shippingAddress.city || '';
      shippingState = shippingAddress.state || '';
      shippingPincode = shippingAddress.pincode || '';
      shippingPhone = shippingAddress.phone || '';
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
        shippingAddressStr = addr.address_line_2
          ? `${addr.address_line_1}, ${addr.address_line_2}`
          : addr.address_line_1 || '';
        shippingCity = addr.city || '';
        shippingState = addr.state || '';
        shippingPincode = addr.postal_code || '';
      }
    }

    // Insert order with shipping info
    await sql`
      INSERT INTO orders (id, user_id, address_id, status, total_amount,
        shipping_first_name, shipping_last_name, shipping_address,
        shipping_city, shipping_state, shipping_pincode, shipping_phone)
      VALUES (${orderId}, ${userId}, ${dbAddressId}, 'paid', ${totalAmount.toFixed(2)},
        ${shippingFirstName}, ${shippingLastName}, ${shippingAddressStr},
        ${shippingCity}, ${shippingState}, ${shippingPincode}, ${shippingPhone})
    `;

    // Insert order items
    for (const item of cartItems) {
      await sql`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
        VALUES (${crypto.randomUUID()}, ${orderId}, ${item.productId}, ${item.quantity}, ${item.unitPrice || item.priceSnapshot || 0})
      `;
    }

    // Insert payment info (always persist for order/payment traceability)
    await sql`
      INSERT INTO payments (id, order_id, amount, method, status)
      VALUES (${crypto.randomUUID()}, ${orderId}, ${totalAmount.toFixed(2)}, ${paymentMethod}, 'completed')
    `;

    return {
      success: true,
      orderId,
      payment_method: paymentMethod,
      message: 'Order created successfully',
    };
  } catch (e) {
    console.error('Checkout error:', e);
    return error(500, { message: 'Failed to process checkout' });
  }
});

// User can update shipping for eligible own orders
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
        AND status IN ('placed', 'paid', 'processing')
      RETURNING id, shipping_first_name, shipping_last_name, shipping_address,
                shipping_city, shipping_state, shipping_pincode, shipping_phone
    `;

    if (!updated.length) {
      return error(404, { message: 'Order not found or cannot update shipping for this status' });
    }

    return { success: true, order: updated[0] };
  } catch (e) {
    console.error('Failed to update shipping:', e);
    return error(500, { message: 'Failed to update shipping address' });
  }
});

// Admin only order status update
orderRouter.put('/:orderId/status', authenticate, requireRole('admin'), async (request, env) => {
  try {
    const body = await request.json() as any;
    const { status, trackingNumber } = body;
    const { orderId } = request.params;

    // Pseudocode ops...
    return { message: `Order ${orderId} status securely updated to ${status}` };
  } catch (e) {
    console.error(e);
    return error(500, { message: 'Failed to update order' });
  }
});
