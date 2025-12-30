/**
 * ===========================================
 * WEBHOOK ROUTES
 * ===========================================
 * Handle external webhooks (Razorpay)
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/webhooks' });

// ===========================================
// RAZORPAY WEBHOOK
// ===========================================
router.post('/razorpay', async (request) => {
  const { db, env } = request;

  // Get raw body for signature verification
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  // Verify webhook signature
  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    console.error('Missing Razorpay signature');
    return error(401, { message: 'Missing signature' });
  }

  const isValid = await verifyWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET);
  if (!isValid) {
    console.error('Invalid Razorpay signature');
    return error(401, { message: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return error(400, { message: 'Invalid JSON' });
  }

  const event = payload.event;
  const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;

  console.log(`Razorpay webhook: ${event}`, entity?.id);

  try {
    switch (event) {
      // ===========================================
      // PAYMENT EVENTS
      // ===========================================

      case 'payment.captured':
        await handlePaymentCaptured(db, entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(db, entity);
        break;

      case 'payment.authorized':
        // Payment authorized but not captured yet
        console.log('Payment authorized:', entity.id);
        break;

      // ===========================================
      // REFUND EVENTS
      // ===========================================

      case 'refund.created':
        await handleRefundCreated(db, entity);
        break;

      case 'refund.processed':
        await handleRefundProcessed(db, entity);
        break;

      case 'refund.failed':
        await handleRefundFailed(db, entity);
        break;

      // ===========================================
      // ORDER EVENTS
      // ===========================================

      case 'order.paid':
        await handleOrderPaid(db, payload.payload?.order?.entity);
        break;

      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    return json({ status: 'ok' });

  } catch (err) {
    console.error('Webhook processing error:', err);
    // Return 200 to prevent Razorpay from retrying
    return json({ status: 'error', message: err.message });
  }
});

// ===========================================
// PAYMENT CAPTURED HANDLER
// ===========================================
async function handlePaymentCaptured(db, payment) {
  const orderId = payment.notes?.order_number || payment.order_id;

  if (!orderId) {
    console.error('No order ID in payment:', payment.id);
    return;
  }

  // Find order by razorpay_order_id
  const orders = await db`
    SELECT * FROM orders WHERE razorpay_order_id = ${payment.order_id}
  `;

  if (orders.length === 0) {
    console.error('Order not found for payment:', payment.id);
    return;
  }

  const order = orders[0];

  // Update order status
  await db`
    UPDATE orders
    SET
      payment_status = 'paid',
      status = CASE WHEN status = 'pending_payment' THEN 'pending' ELSE status END,
      razorpay_payment_id = ${payment.id},
      confirmed_at = COALESCE(confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = ${order.id}
  `;

  // Reduce stock
  const items = await db`
    SELECT * FROM order_items WHERE order_id = ${order.id}
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
  const carts = await db`SELECT * FROM carts WHERE user_id = ${order.user_id}`;
  if (carts.length > 0) {
    await db`DELETE FROM cart_items WHERE cart_id = ${carts[0].id}`;
    await db`DELETE FROM carts WHERE id = ${carts[0].id}`;
  }

  // Log activity
  await db`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      ${order.user_id},
      'payment_captured',
      'order',
      ${order.id},
      ${JSON.stringify({ paymentId: payment.id, amount: payment.amount / 100 })}
    )
  `;

  console.log(`Payment captured for order ${order.order_number}`);
}

// ===========================================
// PAYMENT FAILED HANDLER
// ===========================================
async function handlePaymentFailed(db, payment) {
  const orders = await db`
    SELECT * FROM orders WHERE razorpay_order_id = ${payment.order_id}
  `;

  if (orders.length === 0) {
    console.error('Order not found for failed payment:', payment.id);
    return;
  }

  const order = orders[0];

  // Update order status
  await db`
    UPDATE orders
    SET
      payment_status = 'failed',
      updated_at = NOW()
    WHERE id = ${order.id}
  `;

  // Log activity
  await db`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      ${order.user_id},
      'payment_failed',
      'order',
      ${order.id},
      ${JSON.stringify({
        paymentId: payment.id,
        reason: payment.error_description || 'Unknown error'
      })}
    )
  `;

  console.log(`Payment failed for order ${order.order_number}`);
}

// ===========================================
// ORDER PAID HANDLER (ALTERNATIVE)
// ===========================================
async function handleOrderPaid(db, razorpayOrder) {
  if (!razorpayOrder) return;

  const orders = await db`
    SELECT * FROM orders WHERE razorpay_order_id = ${razorpayOrder.id}
  `;

  if (orders.length === 0) {
    console.error('Order not found:', razorpayOrder.id);
    return;
  }

  const order = orders[0];

  // Only update if not already paid
  if (order.payment_status !== 'paid') {
    await db`
      UPDATE orders
      SET
        payment_status = 'paid',
        status = CASE WHEN status = 'pending_payment' THEN 'pending' ELSE status END,
        confirmed_at = COALESCE(confirmed_at, NOW()),
        updated_at = NOW()
      WHERE id = ${order.id}
    `;

    console.log(`Order paid: ${order.order_number}`);
  }
}

// ===========================================
// REFUND CREATED HANDLER
// ===========================================
async function handleRefundCreated(db, refund) {
  const payment = refund.payment_id;

  const orders = await db`
    SELECT * FROM orders WHERE razorpay_payment_id = ${payment}
  `;

  if (orders.length === 0) {
    console.error('Order not found for refund:', refund.id);
    return;
  }

  const order = orders[0];

  await db`
    UPDATE orders
    SET
      payment_status = 'refund_initiated',
      refund_id = ${refund.id},
      updated_at = NOW()
    WHERE id = ${order.id}
  `;

  // Log activity
  await db`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      ${order.user_id},
      'refund_initiated',
      'order',
      ${order.id},
      ${JSON.stringify({ refundId: refund.id, amount: refund.amount / 100 })}
    )
  `;

  console.log(`Refund initiated for order ${order.order_number}`);
}

// ===========================================
// REFUND PROCESSED HANDLER
// ===========================================
async function handleRefundProcessed(db, refund) {
  const orders = await db`
    SELECT * FROM orders WHERE refund_id = ${refund.id}
  `;

  if (orders.length === 0) {
    console.error('Order not found for processed refund:', refund.id);
    return;
  }

  const order = orders[0];

  await db`
    UPDATE orders
    SET
      payment_status = 'refunded',
      updated_at = NOW()
    WHERE id = ${order.id}
  `;

  // Restore stock
  const items = await db`
    SELECT * FROM order_items WHERE order_id = ${order.id}
  `;

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

  // Log activity
  await db`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      ${order.user_id},
      'refund_processed',
      'order',
      ${order.id},
      ${JSON.stringify({ refundId: refund.id, amount: refund.amount / 100 })}
    )
  `;

  console.log(`Refund processed for order ${order.order_number}`);
}

// ===========================================
// REFUND FAILED HANDLER
// ===========================================
async function handleRefundFailed(db, refund) {
  const orders = await db`
    SELECT * FROM orders WHERE refund_id = ${refund.id}
  `;

  if (orders.length === 0) {
    console.error('Order not found for failed refund:', refund.id);
    return;
  }

  const order = orders[0];

  await db`
    UPDATE orders
    SET
      payment_status = 'refund_failed',
      updated_at = NOW()
    WHERE id = ${order.id}
  `;

  // Log activity
  await db`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      ${order.user_id},
      'refund_failed',
      'order',
      ${order.id},
      ${JSON.stringify({ refundId: refund.id })}
    )
  `;

  console.log(`Refund failed for order ${order.order_number}`);
}

// ===========================================
// VERIFY WEBHOOK SIGNATURE
// ===========================================
async function verifyWebhookSignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(body);

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
