/**
 * ===========================================
 * ORDER ROUTES
 * ===========================================
 * Order management with Razorpay integration
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/orders' });

// ===========================================
// GET ALL ORDERS (USER)
// ===========================================
router.get('/', async (request) => {
  const { db, user } = request;
  const url = new URL(request.url);

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '10'), 50);
  const offset = (page - 1) * perPage;
  const status = url.searchParams.get('status');

  try {
    let orders;
    if (status) {
      orders = await db`
        SELECT *, COUNT(*) OVER() as total_count
        FROM orders
        WHERE user_id = ${user.id} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    } else {
      orders = await db`
        SELECT *, COUNT(*) OVER() as total_count
        FROM orders
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    }

    const total = orders.length > 0 ? orders[0].total_count : 0;

    // Get order items for each order
    const orderIds = orders.map(o => o.id);
    const items = orderIds.length > 0 ? await db`
      SELECT oi.*, p.name as product_name, p.slug as product_slug, p.images as product_images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ANY(${orderIds}::uuid[])
    ` : [];

    // Group items by order
    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    return json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        subtotal: parseFloat(order.subtotal),
        discountAmount: parseFloat(order.discount_amount),
        shippingAmount: parseFloat(order.shipping_amount),
        taxAmount: parseFloat(order.tax_amount),
        totalAmount: parseFloat(order.total_amount),
        itemsCount: itemsByOrder[order.id]?.length || 0,
        items: (itemsByOrder[order.id] || []).slice(0, 3).map(item => ({
          id: item.id,
          productName: item.product_name,
          productSlug: item.product_slug,
          productImage: item.product_images?.[0]?.url,
          variantName: item.variant_name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price)
        })),
        createdAt: order.created_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at
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

// ===========================================
// GET SINGLE ORDER
// ===========================================
router.get('/:orderId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    const orders = await db`
      SELECT * FROM orders
      WHERE id = ${params.orderId}::uuid AND user_id = ${user.id}
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const items = await db`
      SELECT oi.*, p.name as product_name, p.slug as product_slug, p.images as product_images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${order.id}
    `;

    // Get shipping address
    let shippingAddress = null;
    if (order.shipping_address_id) {
      const addresses = await db`
        SELECT * FROM addresses WHERE id = ${order.shipping_address_id}
      `;
      if (addresses.length > 0) {
        const addr = addresses[0];
        shippingAddress = {
          name: addr.name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postal_code,
          country: addr.country
        };
      }
    }

    // Get billing address
    let billingAddress = null;
    if (order.billing_address_id) {
      const addresses = await db`
        SELECT * FROM addresses WHERE id = ${order.billing_address_id}
      `;
      if (addresses.length > 0) {
        const addr = addresses[0];
        billingAddress = {
          name: addr.name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postal_code,
          country: addr.country
        };
      }
    }

    return json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        razorpayOrderId: order.razorpay_order_id,
        subtotal: parseFloat(order.subtotal),
        discountAmount: parseFloat(order.discount_amount),
        discountCode: order.discount_code,
        shippingAmount: parseFloat(order.shipping_amount),
        taxAmount: parseFloat(order.tax_amount),
        totalAmount: parseFloat(order.total_amount),
        notes: order.notes,
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productSlug: item.product_slug,
          productImage: item.product_images?.[0]?.url,
          variantId: item.variant_id,
          variantName: item.variant_name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          reviewed: item.reviewed
        })),
        shippingAddress,
        billingAddress,
        createdAt: order.created_at,
        confirmedAt: order.confirmed_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        cancelledAt: order.cancelled_at,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url
      }
    });

  } catch (err) {
    console.error('Get order error:', err);
    return error(500, { message: 'Failed to fetch order' });
  }
});

// ===========================================
// CREATE ORDER FROM CART
// ===========================================
router.post('/', async (request) => {
  const { db, user, env } = request;

  if (!user) {
    return error(401, { message: 'Authentication required to place an order' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { shippingAddressId, billingAddressId, paymentMethod, notes } = body;

  if (!shippingAddressId) {
    return error(400, { message: 'Shipping address is required' });
  }

  if (!paymentMethod || !['razorpay', 'cod'].includes(paymentMethod)) {
    return error(400, { message: 'Invalid payment method' });
  }

  try {
    // Get cart with items
    const carts = await db`SELECT * FROM carts WHERE user_id = ${user.id}`;

    if (carts.length === 0) {
      return error(400, { message: 'Cart is empty' });
    }

    const cart = carts[0];

    // Get cart items with product and variant info
    const items = await db`
      SELECT ci.*, p.name as product_name, p.price as product_price,
             p.stock_quantity as product_stock, p.is_active,
             pv.name as variant_name, pv.price as variant_price,
             pv.stock_quantity as variant_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = ${cart.id}
    `;

    if (items.length === 0) {
      return error(400, { message: 'Cart is empty' });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const item of items) {
      if (!item.is_active) {
        return error(400, { message: `${item.product_name} is no longer available` });
      }

      const stock = item.variant_id ? item.variant_stock : item.product_stock;
      if (stock < item.quantity) {
        return error(400, {
          message: `Insufficient stock for ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}`
        });
      }

      const unitPrice = item.variant_id ? item.variant_price : item.product_price;
      const totalPrice = parseFloat(unitPrice) * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: item.product_id,
        variantId: item.variant_id,
        variantName: item.variant_name,
        quantity: item.quantity,
        unitPrice: parseFloat(unitPrice),
        totalPrice
      });

      stockUpdates.push({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity
      });
    }

    // Apply discount if exists
    let discountAmount = 0;
    let discountCode = null;
    if (cart.discount_code) {
      discountAmount = parseFloat(cart.discount_amount || 0);
      discountCode = cart.discount_code;
    }

    // Calculate shipping (free over ₹5000)
    const shippingAmount = subtotal >= 5000 ? 0 : 500;

    // Calculate tax (18% GST)
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * 0.18;

    // Total
    const totalAmount = taxableAmount + shippingAmount + taxAmount;

    // Verify addresses exist and belong to user
    const addresses = await db`
      SELECT * FROM addresses
      WHERE id = ANY(${[shippingAddressId, billingAddressId || shippingAddressId]}::uuid[])
        AND user_id = ${user.id}
    `;

    if (!addresses.find(a => a.id === shippingAddressId)) {
      return error(400, { message: 'Invalid shipping address' });
    }

    // Generate order number
    const orderNumberResult = await db`SELECT generate_order_number() as order_number`;
    const orderNumber = orderNumberResult[0].order_number;

    // Create Razorpay order if not COD
    let razorpayOrderId = null;
    if (paymentMethod === 'razorpay') {
      const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          user_id: user.id,
          order_number: orderNumber
        }
      }, env);

      razorpayOrderId = razorpayOrder.id;
    }

    // Create order in database
    const orders = await db`
      INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method,
        razorpay_order_id, shipping_address_id, billing_address_id,
        subtotal, discount_amount, discount_code, shipping_amount, tax_amount, total_amount,
        notes
      ) VALUES (
        ${user.id},
        ${orderNumber},
        ${paymentMethod === 'cod' ? 'pending' : 'pending_payment'},
        ${paymentMethod === 'cod' ? 'pending' : 'pending'},
        ${paymentMethod},
        ${razorpayOrderId},
        ${shippingAddressId}::uuid,
        ${billingAddressId || shippingAddressId}::uuid,
        ${subtotal},
        ${discountAmount},
        ${discountCode},
        ${shippingAmount},
        ${taxAmount},
        ${totalAmount},
        ${notes || null}
      )
      RETURNING *
    `;

    const order = orders[0];

    // Create order items
    for (const item of orderItems) {
      await db`
        INSERT INTO order_items (
          order_id, product_id, variant_id, variant_name, quantity, unit_price, total_price
        ) VALUES (
          ${order.id},
          ${item.productId}::uuid,
          ${item.variantId}::uuid,
          ${item.variantName},
          ${item.quantity},
          ${item.unitPrice},
          ${item.totalPrice}
        )
      `;
    }

    // Update coupon usage if applicable
    if (discountCode) {
      const coupons = await db`
        SELECT id FROM coupons WHERE code = ${discountCode}
      `;
      if (coupons.length > 0) {
        await db`
          INSERT INTO coupon_usage (coupon_id, user_id, order_id)
          VALUES (${coupons[0].id}, ${user.id}, ${order.id})
        `;
      }
    }

    // For COD orders, reduce stock immediately
    if (paymentMethod === 'cod') {
      for (const update of stockUpdates) {
        if (update.variantId) {
          await db`
            UPDATE product_variants
            SET stock_quantity = stock_quantity - ${update.quantity}
            WHERE id = ${update.variantId}::uuid
          `;
        } else {
          await db`
            UPDATE products
            SET stock_quantity = stock_quantity - ${update.quantity}
            WHERE id = ${update.productId}::uuid
          `;
        }
      }

      // Clear cart
      await db`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;
      await db`DELETE FROM carts WHERE id = ${cart.id}`;
    }

    return json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        totalAmount: parseFloat(order.total_amount),
        razorpayOrderId: razorpayOrderId
      },
      razorpay: razorpayOrderId ? {
        orderId: razorpayOrderId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID
      } : null
    });

  } catch (err) {
    console.error('Create order error:', err);
    return error(500, { message: 'Failed to create order' });
  }
});

// ===========================================
// VERIFY PAYMENT (RAZORPAY)
// ===========================================
router.post('/:orderId/verify-payment', async (request) => {
  const { db, params, user, env } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { razorpayPaymentId, razorpaySignature } = body;

  if (!razorpayPaymentId || !razorpaySignature) {
    return error(400, { message: 'Payment verification details required' });
  }

  try {
    // Get order
    const orders = await db`
      SELECT * FROM orders
      WHERE id = ${params.orderId}::uuid AND user_id = ${user.id}
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];

    if (order.payment_status === 'paid') {
      return json({ success: true, message: 'Payment already verified' });
    }

    if (!order.razorpay_order_id) {
      return error(400, { message: 'Invalid order for payment verification' });
    }

    // Verify signature
    const isValid = await verifyRazorpaySignature({
      orderId: order.razorpay_order_id,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    }, env);

    if (!isValid) {
      return error(400, { message: 'Payment verification failed' });
    }

    // Update order
    await db`
      UPDATE orders
      SET
        payment_status = 'paid',
        status = 'pending',
        razorpay_payment_id = ${razorpayPaymentId},
        confirmed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${order.id}
    `;

    // Get cart and reduce stock
    const carts = await db`SELECT * FROM carts WHERE user_id = ${user.id}`;
    if (carts.length > 0) {
      const cart = carts[0];
      const items = await db`
        SELECT * FROM cart_items WHERE cart_id = ${cart.id}
      `;

      for (const item of items) {
        if (item.variant_id) {
          await db`
            UPDATE product_variants
            SET stock_quantity = stock_quantity - ${item.quantity}
            WHERE id = ${item.variant_id}
          `;
        } else {
          await db`
            UPDATE products
            SET stock_quantity = stock_quantity - ${item.quantity}
            WHERE id = ${item.product_id}
          `;
        }
      }

      // Clear cart
      await db`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;
      await db`DELETE FROM carts WHERE id = ${cart.id}`;
    }

    return json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (err) {
    console.error('Verify payment error:', err);
    return error(500, { message: 'Payment verification failed' });
  }
});

// ===========================================
// CANCEL ORDER
// ===========================================
router.post('/:orderId/cancel', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { reason } = body;

  try {
    const orders = await db`
      SELECT * FROM orders
      WHERE id = ${params.orderId}::uuid AND user_id = ${user.id}
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];

    // Can only cancel pending orders
    if (!['pending', 'pending_payment'].includes(order.status)) {
      return error(400, { message: 'Order cannot be cancelled at this stage' });
    }

    // Get order items to restore stock
    const items = await db`
      SELECT * FROM order_items WHERE order_id = ${order.id}
    `;

    // Restore stock if payment was made
    if (order.payment_status === 'paid' || order.payment_method === 'cod') {
      for (const item of items) {
        if (item.variant_id) {
          await db`
            UPDATE product_variants
            SET stock_quantity = stock_quantity + ${item.quantity}
            WHERE id = ${item.variant_id}
          `;
        } else {
          await db`
            UPDATE products
            SET stock_quantity = stock_quantity + ${item.quantity}
            WHERE id = ${item.product_id}
          `;
        }
      }
    }

    // Update order
    await db`
      UPDATE orders
      SET
        status = 'cancelled',
        payment_status = CASE
          WHEN payment_status = 'paid' THEN 'refund_pending'
          ELSE 'cancelled'
        END,
        cancellation_reason = ${reason || null},
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id = ${order.id}
    `;

    return json({
      success: true,
      message: order.payment_status === 'paid'
        ? 'Order cancelled. Refund will be processed within 5-7 business days.'
        : 'Order cancelled successfully'
    });

  } catch (err) {
    console.error('Cancel order error:', err);
    return error(500, { message: 'Failed to cancel order' });
  }
});

// ===========================================
// TRACK ORDER
// ===========================================
router.get('/:orderId/track', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    const orders = await db`
      SELECT * FROM orders
      WHERE id = ${params.orderId}::uuid AND user_id = ${user.id}
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];

    // Build tracking timeline
    const timeline = [
      {
        status: 'ordered',
        label: 'Order Placed',
        date: order.created_at,
        completed: true
      }
    ];

    if (order.payment_status === 'paid') {
      timeline.push({
        status: 'confirmed',
        label: 'Payment Confirmed',
        date: order.confirmed_at || order.created_at,
        completed: true
      });
    }

    if (['processing', 'shipped', 'out_for_delivery', 'delivered', 'completed'].includes(order.status)) {
      timeline.push({
        status: 'processing',
        label: 'Order Processing',
        date: order.confirmed_at,
        completed: true
      });
    }

    if (['shipped', 'out_for_delivery', 'delivered', 'completed'].includes(order.status)) {
      timeline.push({
        status: 'shipped',
        label: 'Shipped',
        date: order.shipped_at,
        completed: true
      });
    }

    if (['out_for_delivery', 'delivered', 'completed'].includes(order.status)) {
      timeline.push({
        status: 'out_for_delivery',
        label: 'Out for Delivery',
        date: order.shipped_at, // Update when we have actual out_for_delivery_at field
        completed: true
      });
    }

    if (['delivered', 'completed'].includes(order.status)) {
      timeline.push({
        status: 'delivered',
        label: 'Delivered',
        date: order.delivered_at,
        completed: true
      });
    }

    // Add upcoming steps
    const allSteps = ['ordered', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const currentStepIndex = allSteps.indexOf(order.status);

    for (let i = currentStepIndex + 1; i < allSteps.length; i++) {
      const step = allSteps[i];
      const stepLabels = {
        confirmed: 'Payment Confirmation',
        processing: 'Order Processing',
        shipped: 'Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered'
      };

      if (!timeline.find(t => t.status === step)) {
        timeline.push({
          status: step,
          label: stepLabels[step],
          date: null,
          completed: false
        });
      }
    }

    return json({
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      estimatedDelivery: order.estimated_delivery_date,
      timeline
    });

  } catch (err) {
    console.error('Track order error:', err);
    return error(500, { message: 'Failed to fetch tracking info' });
  }
});

// ===========================================
// HELPER: CREATE RAZORPAY ORDER
// ===========================================
async function createRazorpayOrder(options, env) {
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Razorpay order error:', errorData);
    throw new Error('Failed to create Razorpay order');
  }

  return response.json();
}

// ===========================================
// HELPER: VERIFY RAZORPAY SIGNATURE
// ===========================================
async function verifyRazorpaySignature({ orderId, paymentId, signature }, env) {
  const payload = `${orderId}|${paymentId}`;

  // Create HMAC SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.RAZORPAY_KEY_SECRET);
  const data = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === signature;
}

export default router;
