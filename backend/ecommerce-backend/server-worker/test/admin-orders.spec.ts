import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateToken } from '../src/utils/jwks';
import { getDb } from '../src/utils/db';

describe('Admin Orders API Endpoints & Edge Cases', () => {
  let adminToken: string;
  let supportToken: string;
  let customerToken: string;
  let testUserId: string;
  let testAdminId: string;
  let testSupportId: string;
  let testOrderId: string;
  let testPaymentId: string;

  beforeAll(async () => {
    // Generate valid tokens using the private key in env
    testAdminId = crypto.randomUUID();
    testSupportId = crypto.randomUUID();
    testUserId = crypto.randomUUID();

    const { sql } = getDb(env);

    // Ensure roles exist in roles table
    await sql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Administrator'),
        ('customer_support', 'Customer Support'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    const adminEmail = `admin_ord_${testAdminId.slice(0, 8)}@spacefurnio.com`;
    const supportEmail = `support_ord_${testSupportId.slice(0, 8)}@spacefurnio.com`;
    const customerEmail = `customer_ord_${testUserId.slice(0, 8)}@spacefurnio.com`;

    // Insert test users and roles
    await sql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${testAdminId}, ${adminEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testSupportId}, ${supportEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testUserId}, ${customerEmail}, 'dummy_hash', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${testAdminId}, 'super_admin'),
        (${testSupportId}, 'customer_support'),
        (${testUserId}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    adminToken = await generateToken({ id: testAdminId, email: adminEmail, role: 'super_admin' }, env.RSA_PRIVATE_KEY_PEM);
    supportToken = await generateToken({ id: testSupportId, email: supportEmail, role: 'customer_support' }, env.RSA_PRIVATE_KEY_PEM);
    customerToken = await generateToken({ id: testUserId, email: customerEmail, role: 'customer' }, env.RSA_PRIVATE_KEY_PEM);

    // Create a test order
    testOrderId = crypto.randomUUID();
    testPaymentId = crypto.randomUUID();

    await sql`
      INSERT INTO orders (
        id, user_id, status, total_amount, 
        shipping_first_name, shipping_last_name, shipping_address, 
        shipping_city, shipping_state, shipping_pincode, shipping_phone,
        created_at
      )
      VALUES (
        ${testOrderId}, ${testUserId}, 'pending', 1500.00,
        'Test', 'User', '123 Main Street',
        'Bangalore', 'Karnataka', '560001', '9876543210',
        NOW()
      )
    `;

    await sql`
      INSERT INTO payments (
        id, order_id, amount, method, status, created_at
      )
      VALUES (
        ${testPaymentId}, ${testOrderId}, 1500.00, 'card', 'completed', NOW()
      )
    `;

    await sql`
      INSERT INTO order_items (
        id, order_id, product_id, quantity, unit_price
      )
      VALUES (
        ${crypto.randomUUID()}, ${testOrderId}, 1, 2, 750.00
      )
    `;
  });

  afterAll(async () => {
    const { sql } = getDb(env);
    // Cleanup test data
    try {
      await sql`DELETE FROM refunds WHERE payment_id = ${testPaymentId}`;
      await sql`DELETE FROM shipments WHERE order_id = ${testOrderId}`;
      await sql`DELETE FROM order_status_history WHERE order_id = ${testOrderId}`;
      await sql`DELETE FROM order_items WHERE order_id = ${testOrderId}`;
      await sql`DELETE FROM payments WHERE order_id = ${testOrderId}`;
      await sql`DELETE FROM orders WHERE id = ${testOrderId}`;
      await sql`DELETE FROM user_roles WHERE user_id IN (${testAdminId}, ${testSupportId}, ${testUserId})`;
      await sql`DELETE FROM users WHERE id IN (${testAdminId}, ${testSupportId}, ${testUserId})`;
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  it('1. GET /api/admin/orders/stats - returns order statistics', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/orders/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('total_orders');
    expect(body).toHaveProperty('total_revenue');
    expect(body).toHaveProperty('pending_count');
    expect(typeof body.total_orders).toBe('number');
    expect(typeof body.total_revenue).toBe('number');
  });

  it('2. GET /api/admin/orders - lists orders with pagination & filters', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/orders?search=${testOrderId}&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.orders.length).toBeGreaterThanOrEqual(1);
    expect(body.orders[0].id).toBe(testOrderId);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('3. GET /api/admin/orders/:id - gets order details with items and payment', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.id).toBe(testOrderId);
    expect(body.customer.name).toBe('Test User');
    expect(body.total_amount).toBe(1500);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(1);
    expect(body.items[0].unitPrice).toBe(750);
    expect(body.payment.id).toBe(testPaymentId);
    expect(body.payment.status).toBe('completed');
  });

  it('4. PUT /api/admin/orders/:id/status - updates status and creates shipment', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'shipped',
        notes: 'Dispatched via BlueDart',
        tracking_number: 'BD-12345678',
        carrier: 'BlueDart',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.order.status).toBe('shipped');

    // Verify detail endpoint now includes shipment
    const detailRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detail = await detailRes.json() as any;
    expect(detail.status).toBe('shipped');
    expect(detail.shipment).not.toBeNull();
    expect(detail.shipment.trackingNumber).toBe('BD-12345678');
    expect(detail.shipment.carrier).toBe('BlueDart');
    expect(detail.shipment.status).toBe('shipped');
  });

  it('5. PUT /api/admin/orders/:id/shipping - updates shipping address details', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/shipping`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        shipping_city: 'Mysore',
        shipping_pincode: '570001',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.shipping.shipping_city).toBe('Mysore');
    expect(body.shipping.shipping_pincode).toBe('570001');
    expect(body.shipping.shipping_first_name).toBe('Test'); // unedited field preserved
  });

  it('6. POST /api/admin/orders/:id/refund - handles partial refund', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount: 500,
        reason: 'Customer returned 1 item',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.amount).toBe(500);
    expect(body.is_full_refund).toBe(false);
    expect(body.remaining_refundable).toBe(1000);

    // Verify detail reflects refund and payment status
    const detailRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detail = await detailRes.json() as any;
    expect(detail.refunds.length).toBe(1);
    expect(detail.refunds[0].amount).toBe(500);
    expect(detail.payment.status).toBe('partially_refunded');
  });

  it('7. POST /api/admin/orders/:id/refund - handles full refund and caps remaining amount', async () => {
    // Attempting to refund more than remaining (1000) should fail
    const overRefundRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount: 1500,
        reason: 'Exceeding refund',
      }),
    });
    expect(overRefundRes.status).toBe(400);

    // Refund remaining 1000
    const fullRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount: 1000,
        reason: 'Full refund completion',
      }),
    });
    expect(fullRes.status).toBe(200);
    const body = await fullRes.json() as any;
    expect(body.is_full_refund).toBe(true);
    expect(body.remaining_refundable).toBe(0);

    // Attempting further refund should fail with already fully refunded
    const excessRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount: 50,
      }),
    });
    expect(excessRes.status).toBe(400);
  });

  it('8. POST /api/admin/orders/:id/cancel - cancels order', async () => {
    // Create a new order to test cancellation
    const cancelOrderId = crypto.randomUUID();
    const { sql } = getDb(env);

    await sql`
      INSERT INTO orders (id, user_id, status, total_amount, shipping_first_name, created_at)
      VALUES (${cancelOrderId}, ${testUserId}, 'pending', 800.00, 'CancelTest', NOW())
    `;

    const cancelRes = await SELF.fetch(`https://example.com/api/admin/orders/${cancelOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Customer requested cancellation' }),
    });
    expect(cancelRes.status).toBe(200);
    const body = await cancelRes.json() as any;
    expect(body.success).toBe(true);

    // Cancelling again should return 400
    const reCancelRes = await SELF.fetch(`https://example.com/api/admin/orders/${cancelOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    expect(reCancelRes.status).toBe(400);

    // Cleanup cancelOrderId
    await sql`DELETE FROM order_status_history WHERE order_id = ${cancelOrderId}`;
    await sql`DELETE FROM orders WHERE id = ${cancelOrderId}`;
  });

  it('9. Edge case: Invalid UUIDs return 404', async () => {
    const endpoints = [
      { url: 'https://example.com/api/admin/orders/invalid-uuid-123', method: 'GET' },
      { url: 'https://example.com/api/admin/orders/invalid-uuid-123/status', method: 'PUT', body: { status: 'shipped' } },
      { url: 'https://example.com/api/admin/orders/invalid-uuid-123/shipping', method: 'PUT', body: { shipping_city: 'Pune' } },
      { url: 'https://example.com/api/admin/orders/invalid-uuid-123/refund', method: 'POST', body: { amount: 100 } },
      { url: 'https://example.com/api/admin/orders/invalid-uuid-123/cancel', method: 'POST', body: {} },
    ];

    for (const ep of endpoints) {
      const res = await SELF.fetch(ep.url, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      expect(res.status).toBe(404);
    }
  });

  it('10. Edge case: Negative / Zero / Invalid refund amounts return 400', async () => {
    const invalidAmounts = [-100, 0, 'invalid'];

    for (const amt of invalidAmounts) {
      const res = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ amount: amt }),
      });
      expect(res.status).toBe(400);
    }
  });

  it('11. Edge case: Date filtering with invalid date format returns 400', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/orders?date_from=invalid-date', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(400);

    const res2 = await SELF.fetch('https://example.com/api/admin/orders?date_to=invalid-date', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res2.status).toBe(400);
  });

  it('12. Edge case: Invalid status value returns 400', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'invalid_status_value' }),
    });
    expect(res.status).toBe(400);
  });

  it('13. Permissions: Customer Support role cannot cancel or refund orders', async () => {
    // customer_support has 'orders.read' but not 'orders.cancel' or 'orders.refund'
    const readRes = await SELF.fetch('https://example.com/api/admin/orders', {
      headers: { Authorization: `Bearer ${supportToken}` },
    });
    expect(readRes.status).toBe(200);

    const cancelRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supportToken}`,
      },
    });
    expect(cancelRes.status).toBe(403);

    const refundRes = await SELF.fetch(`https://example.com/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supportToken}`,
      },
      body: JSON.stringify({ amount: 10 }),
    });
    expect(refundRes.status).toBe(403);
  });

  it('14. Permissions: Customer role receives 403 on admin orders', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('15. Permissions: Missing / Invalid token receives 401', async () => {
    const noAuth = await SELF.fetch('https://example.com/api/admin/orders');
    expect(noAuth.status).toBe(401);

    const badAuth = await SELF.fetch('https://example.com/api/admin/orders', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect(badAuth.status).toBe(401);
  });

  it('16. Edge case: Cannot cancel a delivered order', async () => {
    const deliveredOrderId = crypto.randomUUID();
    const { sql } = getDb(env);

    await sql`
      INSERT INTO orders (id, user_id, status, total_amount, shipping_first_name, created_at)
      VALUES (${deliveredOrderId}, ${testUserId}, 'delivered', 500.00, 'DeliveredUser', NOW())
    `;

    const cancelRes = await SELF.fetch(`https://example.com/api/admin/orders/${deliveredOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Attempting to cancel delivered order' }),
    });
    expect(cancelRes.status).toBe(400);
    const body = await cancelRes.json() as any;
    expect(body.message).toContain('delivered');

    // Cleanup
    await sql`DELETE FROM orders WHERE id = ${deliveredOrderId}`;
  });

  it('17. Filter and Sort variations: status, payment_status, date ranges and sort directions', async () => {
    // Test various sort options
    const sorts = ['created_at_desc', 'created_at_asc', 'total_desc', 'total_asc'];
    for (const s of sorts) {
      const res = await SELF.fetch(`https://example.com/api/admin/orders?sort=${s}&limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(Array.isArray(data.orders)).toBe(true);
    }

    // Test valid date range filter
    const today = new Date().toISOString().split('T')[0];
    const dateRes = await SELF.fetch(`https://example.com/api/admin/orders?date_from=${today}&date_to=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(dateRes.status).toBe(200);
    const dateData = await dateRes.json() as any;
    expect(Array.isArray(dateData.orders)).toBe(true);
  });

  it('18. Edge case: Status update without shipment tracking does not fail', async () => {
    const testStatusOrderId = crypto.randomUUID();
    const { sql } = getDb(env);

    await sql`
      INSERT INTO orders (id, user_id, status, total_amount, shipping_first_name, created_at)
      VALUES (${testStatusOrderId}, ${testUserId}, 'pending', 350.00, 'StatusUser', NOW())
    `;

    const statusRes = await SELF.fetch(`https://example.com/api/admin/orders/${testStatusOrderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'processing', notes: 'Order acknowledged' }),
    });
    expect(statusRes.status).toBe(200);
    const body = await statusRes.json() as any;
    expect(body.success).toBe(true);
    expect(body.order.status).toBe('processing');

    // Cleanup
    await sql`DELETE FROM order_status_history WHERE order_id = ${testStatusOrderId}`;
    await sql`DELETE FROM orders WHERE id = ${testStatusOrderId}`;
  });

  it('19. Edge case: Cannot refund an order with failed payment', async () => {
    const failedOrderId = crypto.randomUUID();
    const failedPaymentId = crypto.randomUUID();
    const { sql } = getDb(env);

    await sql`
      INSERT INTO orders (id, user_id, status, total_amount, created_at)
      VALUES (${failedOrderId}, ${testUserId}, 'failed', 200.00, NOW())
    `;

    await sql`
      INSERT INTO payments (id, order_id, amount, method, status, created_at)
      VALUES (${failedPaymentId}, ${failedOrderId}, 200.00, 'card', 'failed', NOW())
    `;

    const refundRes = await SELF.fetch(`https://example.com/api/admin/orders/${failedOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(refundRes.status).toBe(400);
    const body = await refundRes.json() as any;
    expect(body.message).toContain('failed');

    // Cleanup
    await sql`DELETE FROM payments WHERE id = ${failedPaymentId}`;
    await sql`DELETE FROM orders WHERE id = ${failedOrderId}`;
  });
});