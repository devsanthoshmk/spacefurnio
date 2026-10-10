import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../src/utils/db';
import { generateToken } from '../src/utils/jwks';

describe('Admin Customers API Suite', () => {
  let adminToken = '';
  let customerToken = '';
  let adminUserId = '';
  let regCustId = '';
  let testCustomerId = '';
  let testDeleteCustomerId = '';
  const testEmailPrefix = `test_cust_${Date.now()}`;

  beforeAll(async () => {
    const { sql } = getDb(env);

    // 1. Ensure required roles exist in roles table
    await sql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Administrator'),
        ('admin', 'Administrator'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    // Ensure test admin user exists
    const adminEmail = `admin_${testEmailPrefix}@example.com`;
    const adminRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${adminEmail}, true)
      RETURNING id, email
    `;
    adminUserId = adminRows[0].id;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${adminUserId}, 'super_admin')
      ON CONFLICT DO NOTHING
    `;

    adminToken = await generateToken(
      { id: adminUserId, email: adminEmail, role: 'super_admin' },
      env.RSA_PRIVATE_KEY_PEM
    );

    // 2. Create customer user and token for 403 test
    const regularCustEmail = `cust_${testEmailPrefix}@example.com`;
    const regCustRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${regularCustEmail}, true)
      RETURNING id, email
    `;
    regCustId = regCustRows[0].id;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${regCustId}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    customerToken = await generateToken(
      { id: regCustId, email: regularCustEmail, role: 'customer' },
      env.RSA_PRIVATE_KEY_PEM
    );

    // 3. Create test customer
    const custEmail = `shopper_${testEmailPrefix}@example.com`;
    const custPhone = `+1987654${Math.floor(1000 + Math.random() * 9000)}`;
    const custRows = await sql`
      INSERT INTO users (email, phone_number, is_active)
      VALUES (${custEmail}, ${custPhone}, true)
      RETURNING id, email, phone_number
    `;
    testCustomerId = custRows[0].id;

    // Add address for test customer
    const addrRows = await sql`
      INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country, is_default)
      VALUES (${testCustomerId}, '123 Test St', 'Metropolis', 'NY', '10001', 'USA', true)
      RETURNING id
    `;
    const addressId = addrRows[0].id;

    // Add orders for test customer
    await sql`
      INSERT INTO orders (user_id, address_id, status, total_amount, shipping_first_name, shipping_last_name, shipping_city, shipping_state, shipping_phone)
      VALUES 
        (${testCustomerId}, ${addressId}, 'delivered', 250.00, 'Bruce', 'Wayne', 'Metropolis', 'NY', ${custPhone}),
        (${testCustomerId}, ${addressId}, 'paid', 150.00, 'Bruce', 'Wayne', 'Metropolis', 'NY', ${custPhone})
      RETURNING id
    `;

    // 4. Create customer specifically for cascading deletion test
    const delCustEmail = `delete_me_${testEmailPrefix}@example.com`;
    const delCustRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${delCustEmail}, true)
      RETURNING id
    `;
    testDeleteCustomerId = delCustRows[0].id;

    // Add comprehensive related records to deleteCustomerId
    const delAddrRows = await sql`
      INSERT INTO user_addresses (user_id, address_line_1, city, state, postal_code, country)
      VALUES (${testDeleteCustomerId}, '456 Delete Ave', 'Gotham', 'NJ', '07001', 'USA')
      RETURNING id
    `;
    const delOrderRows = await sql`
      INSERT INTO orders (user_id, address_id, status, total_amount, shipping_first_name, shipping_last_name)
      VALUES (${testDeleteCustomerId}, ${delAddrRows[0].id}, 'pending', 500.00, 'Clark', 'Kent')
      RETURNING id
    `;
    const delOrderId = delOrderRows[0].id;

    // Add order item
    await sql`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (${delOrderId}, 1, 2, 250.00)
    `;

    // Add payment
    const delPayRows = await sql`
      INSERT INTO payments (order_id, amount, method, status)
      VALUES (${delOrderId}, 500.00, 'card', 'completed')
      RETURNING id
    `;
    const delPaymentId = delPayRows[0].id;

    // Add return request & refund
    const delRetRows = await sql`
      INSERT INTO return_requests (order_id, user_id, reason, status)
      VALUES (${delOrderId}, ${testDeleteCustomerId}, 'Defective item', 'pending')
      RETURNING id
    `;
    const delReturnId = delRetRows[0].id;

    await sql`
      INSERT INTO refunds (payment_id, return_request_id, amount, status)
      VALUES (${delPaymentId}, ${delReturnId}, 250.00, 'pending')
    `;

    // Add coupon & redemption
    const couponRows = await sql`
      INSERT INTO coupons (code, discount_type, discount_value)
      VALUES (${`TEST_COUPON_${Date.now()}`}, 'fixed_amount', 20.00)
      RETURNING id
    `;
    await sql`
      INSERT INTO coupon_redemptions (coupon_id, user_id, order_id, discount_applied)
      VALUES (${couponRows[0].id}, ${testDeleteCustomerId}, ${delOrderId}, 20.00)
    `;

    // Add cart & cart item
    const cartRows = await sql`
      INSERT INTO carts (user_id)
      VALUES (${testDeleteCustomerId})
      RETURNING id
    `;
    await sql`
      INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
      VALUES (${cartRows[0].id}, 1, 1, 100.00)
    `;

    // Add wishlist & wishlist item
    const wishRows = await sql`
      INSERT INTO wishlists (user_id)
      VALUES (${testDeleteCustomerId})
      RETURNING id
    `;
    await sql`
      INSERT INTO wishlist_items (wishlist_id, product_id)
      VALUES (${wishRows[0].id}, 1)
    `;
  });

  afterAll(async () => {
    // Cleanup created test accounts
    const { sql } = getDb(env);
    try {
      if (adminUserId) {
        await sql`DELETE FROM user_roles WHERE user_id = ${adminUserId}`;
        await sql`DELETE FROM users WHERE id = ${adminUserId}`;
      }
      if (regCustId) {
        await sql`DELETE FROM user_roles WHERE user_id = ${regCustId}`;
        await sql`DELETE FROM users WHERE id = ${regCustId}`;
      }
      if (testCustomerId) {
        await sql`DELETE FROM orders WHERE user_id = ${testCustomerId}`;
        await sql`DELETE FROM user_addresses WHERE user_id = ${testCustomerId}`;
        await sql`DELETE FROM users WHERE id = ${testCustomerId}`;
      }
      if (testDeleteCustomerId) {
        // In case delete test was skipped or failed
        await sql`UPDATE orders SET address_id = NULL WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM return_items WHERE return_request_id IN (SELECT id FROM return_requests WHERE user_id = ${testDeleteCustomerId})`;
        await sql`UPDATE refunds SET return_request_id = NULL WHERE return_request_id IN (SELECT id FROM return_requests WHERE user_id = ${testDeleteCustomerId})`;
        await sql`DELETE FROM refunds WHERE payment_id IN (SELECT p.id FROM payments p JOIN orders o ON p.order_id = o.id WHERE o.user_id = ${testDeleteCustomerId})`;
        await sql`DELETE FROM return_requests WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM coupon_redemptions WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${testDeleteCustomerId})`;
        await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${testDeleteCustomerId})`;
        await sql`DELETE FROM orders WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ${testDeleteCustomerId})`;
        await sql`DELETE FROM carts WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM wishlist_items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ${testDeleteCustomerId})`;
        await sql`DELETE FROM wishlists WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM user_addresses WHERE user_id = ${testDeleteCustomerId}`;
        await sql`DELETE FROM users WHERE id = ${testDeleteCustomerId}`;
      }
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
  });

  // 1. Authorization & Security Tests
  describe('Authentication & Authorization', () => {
    it('returns 401 Unauthorized when no Authorization header is provided', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/customers');
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when a customer token is used', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/customers', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });
  });

  // 2. GET /api/admin/customers (List, Metrics, Search, Segments, Pagination)
  describe('GET /api/admin/customers', () => {
    it('returns customer metrics and customer list with pagination', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data).toHaveProperty('metrics');
      expect(data.metrics).toHaveProperty('total_customers');
      expect(data.metrics).toHaveProperty('new_customers_30d');
      expect(data.metrics).toHaveProperty('active_customers');
      expect(data.metrics).toHaveProperty('returning_customers');
      expect(data.metrics).toHaveProperty('high_value_customers');
      expect(data.metrics).toHaveProperty('total_revenue');
      expect(data.metrics).toHaveProperty('average_order_value');

      expect(data).toHaveProperty('customers');
      expect(Array.isArray(data.customers)).toBe(true);

      expect(data).toHaveProperty('pagination');
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(25);
    });

    it('handles edge case pagination parameters (NaN, negative, oversized limit)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/customers?page=invalid&limit=9999', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(100); // clamped to max 100
    });

    it('filters correctly by search query (email, name, phone, city)', async () => {
      // Search by email prefix
      const resEmail = await SELF.fetch(
        `https://example.com/api/admin/customers?search=${testEmailPrefix}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      expect(resEmail.status).toBe(200);
      const dataEmail = (await resEmail.json()) as any;
      expect(dataEmail.customers.length).toBeGreaterThan(0);

      // Search by name "Wayne"
      const resName = await SELF.fetch(
        'https://example.com/api/admin/customers?search=Wayne',
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      expect(resName.status).toBe(200);
      const dataName = (await resName.json()) as any;
      expect(dataName.customers.some((c: any) => c.name.includes('Wayne'))).toBe(true);

      // Search by city "Metropolis"
      const resCity = await SELF.fetch(
        'https://example.com/api/admin/customers?search=Metropolis',
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      expect(resCity.status).toBe(200);
      const dataCity = (await resCity.json()) as any;
      expect(dataCity.customers.some((c: any) => c.city === 'Metropolis')).toBe(true);
    });

    it('supports segment filtering (returning, new, high_value, no_orders, inactive)', async () => {
      const segments = ['returning', 'new', 'high_value', 'no_orders', 'inactive', 'all'];
      const results = await Promise.all(
        segments.map(seg =>
          SELF.fetch(`https://example.com/api/admin/customers?segment=${seg}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          })
        )
      );

      for (const res of results) {
        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(Array.isArray(data.customers)).toBe(true);
      }
    });

    it('supports sorting (total_spent, orders, name, last_order, joined)', async () => {
      const sorts = ['total_spent', 'orders', 'name', 'last_order', 'joined'];
      const responses = await Promise.all(
        sorts.flatMap(sortBy => [
          SELF.fetch(`https://example.com/api/admin/customers?sortBy=${sortBy}&sortDir=asc`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          }),
          SELF.fetch(`https://example.com/api/admin/customers?sortBy=${sortBy}&sortDir=desc`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          }),
        ])
      );

      for (const res of responses) {
        expect(res.status).toBe(200);
      }
    });
  });

  // 3. GET /api/admin/customers/:id
  describe('GET /api/admin/customers/:id', () => {
    it('returns full customer profile, addresses, orders, and stats', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;

      expect(data).toHaveProperty('customer');
      expect(data.customer.id).toBe(testCustomerId);
      expect(data.customer.name).toContain('Wayne');
      expect(data).toHaveProperty('stats');
      expect(data.stats.total_orders).toBe(2);
      expect(data.stats.total_spent).toBe(400.00);
      expect(data.stats.average_order_value).toBe(200.00);

      expect(data).toHaveProperty('addresses');
      expect(data.addresses.length).toBeGreaterThan(0);

      expect(data).toHaveProperty('orders');
      expect(data.orders.length).toBe(2);
    });

    it('returns 404 for non-existent valid UUID', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await SELF.fetch(`https://example.com/api/admin/customers/${nonExistentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for malformed ID string', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/customers/invalid-id-string', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  // 4. PUT /api/admin/customers/:id
  describe('PUT /api/admin/customers/:id', () => {
    it('updates customer phone number and status', async () => {
      const updatedPhone = `+1555${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await SELF.fetch(`https://example.com/api/admin/customers/${testCustomerId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: updatedPhone, is_active: false }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.customer.phone_number).toBe(updatedPhone);
      expect(data.customer.is_active).toBe(false);
      expect(data.customer.status).toBe('DISABLED');
    });

    it('returns 404 when updating non-existent customer', async () => {
      const nonExistentId = crypto.randomUUID();
      const res = await SELF.fetch(`https://example.com/api/admin/customers/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true }),
      });
      expect(res.status).toBe(404);
    });
  });

  // 5. POST /api/admin/customers/:id/toggle-status
  describe('POST /api/admin/customers/:id/toggle-status', () => {
    it('toggles customer active status back and forth', async () => {
      // Toggle to active
      const res1 = await SELF.fetch(
        `https://example.com/api/admin/customers/${testCustomerId}/toggle-status`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      expect(res1.status).toBe(200);
      const data1 = (await res1.json()) as any;
      expect(data1.success).toBe(true);
      expect(data1.is_active).toBe(true);
      expect(data1.customer.status).toBe('ACTIVE');

      // Toggle to disabled
      const res2 = await SELF.fetch(
        `https://example.com/api/admin/customers/${testCustomerId}/toggle-status`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      expect(res2.status).toBe(200);
      const data2 = (await res2.json()) as any;
      expect(data2.success).toBe(true);
      expect(data2.is_active).toBe(false);
      expect(data2.customer.status).toBe('DISABLED');
    });

    it('returns 404 for invalid customer ID', async () => {
      const res = await SELF.fetch(
        'https://example.com/api/admin/customers/not-a-uuid/toggle-status',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      expect(res.status).toBe(404);
    });
  });

  // 6. DELETE /api/admin/customers/:id (Safe Cascading Cleanup)
  describe('DELETE /api/admin/customers/:id', () => {
    it('safely deletes customer and related orders/payments/returns/coupons without FK constraint failure', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/admin/customers/${testDeleteCustomerId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);

      // Verify customer is deleted
      const { sql } = getDb(env);
      const checkRows = await sql`SELECT id FROM users WHERE id = ${testDeleteCustomerId}`;
      expect(checkRows.length).toBe(0);
    });

    it('returns 404 when deleting an already deleted or non-existent customer', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/admin/customers/${testDeleteCustomerId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      expect(res.status).toBe(404);
    });
  });
});
