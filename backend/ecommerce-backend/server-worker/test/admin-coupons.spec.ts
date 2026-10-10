import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateToken } from '../src/utils/jwks';
import { getDb } from '../src/utils/db';

describe('Admin & Public Coupons API Endpoints, Edge Cases & Permissions', () => {
  let adminToken: string;
  let supportToken: string;
  let salesToken: string;
  let customerToken: string;

  let testAdminId: string;
  let testSupportId: string;
  let testSalesId: string;
  let testCustomerId: string;

  let createdPercentageCouponId: string;
  let createdFixedCouponId: string;
  let expiredCouponId: string;
  let inactiveCouponId: string;
  let testOrderId: string;

  const testSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  const testCodePercentage = `DISC20_${testSuffix}`;
  const testCodeFixed = `FLAT500_${testSuffix}`;
  const testCodeExpired = `EXP_${testSuffix}`;
  const testCodeInactive = `INACT_${testSuffix}`;

  beforeAll(async () => {
    testAdminId = crypto.randomUUID();
    testSupportId = crypto.randomUUID();
    testSalesId = crypto.randomUUID();
    testCustomerId = crypto.randomUUID();

    const { sql } = getDb(env);

    // 1. Ensure roles exist
    await sql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Administrator'),
        ('customer_support', 'Customer Support'),
        ('sales_fulfillment', 'Sales & Fulfillment'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    const adminEmail = `admin_coup_${testAdminId.slice(0, 8)}@spacefurnio.com`;
    const supportEmail = `support_coup_${testSupportId.slice(0, 8)}@spacefurnio.com`;
    const salesEmail = `sales_coup_${testSalesId.slice(0, 8)}@spacefurnio.com`;
    const customerEmail = `customer_coup_${testCustomerId.slice(0, 8)}@spacefurnio.com`;

    // 2. Insert test users and roles
    await sql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${testAdminId}, ${adminEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testSupportId}, ${supportEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testSalesId}, ${salesEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testCustomerId}, ${customerEmail}, 'dummy_hash', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${testAdminId}, 'super_admin'),
        (${testSupportId}, 'customer_support'),
        (${testSalesId}, 'sales_fulfillment'),
        (${testCustomerId}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    adminToken = await generateToken({ id: testAdminId, email: adminEmail, role: 'super_admin' }, env.RSA_PRIVATE_KEY_PEM);
    supportToken = await generateToken({ id: testSupportId, email: supportEmail, role: 'customer_support' }, env.RSA_PRIVATE_KEY_PEM);
    salesToken = await generateToken({ id: testSalesId, email: salesEmail, role: 'sales_fulfillment' }, env.RSA_PRIVATE_KEY_PEM);
    customerToken = await generateToken({ id: testCustomerId, email: customerEmail, role: 'customer' }, env.RSA_PRIVATE_KEY_PEM);

    // 3. Insert test expired & inactive coupons
    expiredCouponId = crypto.randomUUID();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO coupons (id, code, description, discount_type, discount_value, is_active, expires_at, created_at)
      VALUES (${expiredCouponId}, ${testCodeExpired}, 'Expired Test Coupon', 'percentage', 15.00, true, ${yesterday}, NOW())
    `;

    inactiveCouponId = crypto.randomUUID();
    await sql`
      INSERT INTO coupons (id, code, description, discount_type, discount_value, is_active, expires_at, created_at)
      VALUES (${inactiveCouponId}, ${testCodeInactive}, 'Inactive Test Coupon', 'percentage', 10.00, false, NULL, NOW())
    `;

    // 4. Create a test order for redemption testing
    testOrderId = crypto.randomUUID();
    await sql`
      INSERT INTO orders (id, user_id, status, total_amount, shipping_first_name, shipping_city, created_at)
      VALUES (${testOrderId}, ${testCustomerId}, 'completed', 2500.00, 'CouponTester', 'Mumbai', NOW())
    `;
  });

  afterAll(async () => {
    const { sql } = getDb(env);
    try {
      await sql`DELETE FROM coupon_redemptions WHERE order_id = ${testOrderId}`;
      await sql`DELETE FROM orders WHERE id = ${testOrderId}`;
      await sql`DELETE FROM coupons WHERE code LIKE ${'%' + testSuffix + '%'}`;
      await sql`DELETE FROM user_roles WHERE user_id IN (${testAdminId}, ${testSupportId}, ${testSalesId}, ${testCustomerId})`;
      await sql`DELETE FROM users WHERE id IN (${testAdminId}, ${testSupportId}, ${testSalesId}, ${testCustomerId})`;
    } catch (e) {
      console.error('Coupons cleanup error:', e);
    }
  });

  // 1. Stats Endpoint
  it('1. GET /api/admin/coupons/stats - returns coupon statistics summary', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/coupons/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('total_coupons');
    expect(body).toHaveProperty('active_coupons');
    expect(body).toHaveProperty('inactive_coupons');
    expect(body).toHaveProperty('expired_coupons');
    expect(body).toHaveProperty('total_redemptions');
    expect(body).toHaveProperty('total_discount_given');
    expect(typeof body.total_coupons).toBe('number');
    expect(typeof body.active_coupons).toBe('number');
    expect(typeof body.inactive_coupons).toBe('number');
    expect(typeof body.expired_coupons).toBe('number');
    expect(typeof body.total_redemptions).toBe('number');
    expect(typeof body.total_discount_given).toBe('number');
    expect(body.total_coupons).toBeGreaterThanOrEqual(2);
  });

  // 2. Create Coupon (POST)
  it('2. POST /api/admin/coupons - creates percentage coupon and normalizes uppercase code', async () => {
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await SELF.fetch('https://example.com/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: `  ${testCodePercentage.toLowerCase()}  `,
        description: 'Get 20% off on all furniture',
        discount_type: 'percentage',
        discount_value: 20,
        is_active: true,
        expires_at: nextMonth,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.coupon).toBeDefined();
    expect(body.coupon.code).toBe(testCodePercentage);
    expect(body.coupon.discount_type).toBe('percentage');
    expect(parseFloat(body.coupon.discount_value)).toBe(20);
    expect(body.coupon.is_active).toBe(true);

    createdPercentageCouponId = body.coupon.id;
  });

  it('3. POST /api/admin/coupons - creates fixed amount coupon', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: testCodeFixed,
        description: 'Flat ₹500 off on minimum purchase',
        discount_type: 'fixed_amount',
        discount_value: 500,
        is_active: true,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.coupon.code).toBe(testCodeFixed);
    expect(body.coupon.discount_type).toBe('fixed_amount');
    expect(parseFloat(body.coupon.discount_value)).toBe(500);

    createdFixedCouponId = body.coupon.id;
  });

  // 4. Duplicate Code Validation (POST returns 409)
  it('4. POST /api/admin/coupons - returns 409 on duplicate coupon code', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: testCodePercentage.toLowerCase(),
        description: 'Duplicate attempt',
        discount_type: 'percentage',
        discount_value: 10,
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json() as any;
    expect(body.message).toContain('already exists');
  });

  // 5. Validation Edge Cases (POST returns 400)
  it('5. POST /api/admin/coupons - edge cases: missing code, negative values, percentage > 100%', async () => {
    const badPayloads = [
      { payload: { description: 'No code' }, msg: 'Coupon code is required' },
      { payload: { code: '   ' }, msg: 'Coupon code is required' },
      { payload: { code: 'BADTYPE', discount_type: 'bogo', discount_value: 10 }, msg: 'discount_type must be' },
      { payload: { code: 'BADVAL1', discount_type: 'percentage', discount_value: 0 }, msg: 'positive number' },
      { payload: { code: 'BADVAL2', discount_type: 'percentage', discount_value: -15 }, msg: 'positive number' },
      { payload: { code: 'BADVAL3', discount_type: 'percentage', discount_value: 'not-a-number' }, msg: 'positive number' },
      { payload: { code: 'BADVAL4', discount_type: 'percentage', discount_value: 101 }, msg: 'cannot exceed 100%' },
      { payload: { code: 'BADVAL5', discount_type: 'fixed_amount', discount_value: -50 }, msg: 'positive number' },
      { payload: { code: 'BADDATE', discount_type: 'fixed_amount', discount_value: 50, expires_at: 'invalid-date' }, msg: 'Invalid expires_at date format' },
    ];

    for (const item of badPayloads) {
      const res = await SELF.fetch('https://example.com/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(item.payload),
      });

      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.message).toContain(item.msg);
    }
  }, 15000);

  // 6. List & Search / Filter / Pagination
  it('6. GET /api/admin/coupons - lists coupons with search, status filters, and pagination', async () => {
    // Search by code
    const searchRes = await SELF.fetch(`https://example.com/api/admin/coupons?search=${testSuffix}&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(searchRes.status).toBe(200);
    const searchData = await searchRes.json() as any;
    expect(Array.isArray(searchData.coupons)).toBe(true);
    expect(searchData.coupons.length).toBeGreaterThanOrEqual(4);
    expect(searchData.pagination).toBeDefined();
    expect(searchData.pagination.page).toBe(1);
    expect(searchData.pagination.total).toBeGreaterThanOrEqual(4);

    // Filter by status=active
    const activeRes = await SELF.fetch(`https://example.com/api/admin/coupons?search=${testSuffix}&status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(activeRes.status).toBe(200);
    const activeData = await activeRes.json() as any;
    expect(activeData.coupons.every((c: any) => c.status === 'ACTIVE')).toBe(true);

    // Filter by status=inactive
    const inactiveRes = await SELF.fetch(`https://example.com/api/admin/coupons?search=${testSuffix}&status=inactive`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(inactiveRes.status).toBe(200);
    const inactiveData = await inactiveRes.json() as any;
    expect(inactiveData.coupons.every((c: any) => c.status === 'INACTIVE')).toBe(true);

    // Filter by status=expired
    const expiredRes = await SELF.fetch(`https://example.com/api/admin/coupons?search=${testSuffix}&status=expired`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(expiredRes.status).toBe(200);
    const expiredData = await expiredRes.json() as any;
    expect(expiredData.coupons.every((c: any) => c.status === 'EXPIRED')).toBe(true);
  }, 15000);

  it('6b. GET /api/admin/coupons - supports various sort options', async () => {
    const sortModes = ['code_asc', 'code_desc', 'uses_desc', 'uses_asc', 'discount_desc', 'oldest', 'newest'];
    await Promise.all(
      sortModes.map(async (sortMode) => {
        const sortRes = await SELF.fetch(`https://example.com/api/admin/coupons?sort=${sortMode}&limit=5`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(sortRes.status).toBe(200);
      })
    );
  }, 15000);

  // 7. Get Coupon Details + Redemptions
  it('7. GET /api/admin/coupons/:id - retrieves coupon details, computed status, and redemption history', async () => {
    // Record a redemption for testCodePercentage
    const { sql } = getDb(env);
    await sql`
      INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_applied, created_at)
      VALUES (${crypto.randomUUID()}, ${createdPercentageCouponId}, ${testCustomerId}, ${testOrderId}, 500.00, NOW())
    `;

    const res = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.coupon).toBeDefined();
    expect(body.coupon.id).toBe(createdPercentageCouponId);
    expect(body.coupon.code).toBe(testCodePercentage);
    expect(body.coupon.status).toBe('ACTIVE');
    expect(body.coupon.discount_formatted).toBe('20%');
    expect(body.stats).toBeDefined();
    expect(body.stats.total_redemptions).toBe(1);
    expect(body.stats.total_discount_given).toBe(500);
    expect(Array.isArray(body.redemptions)).toBe(true);
    expect(body.redemptions.length).toBe(1);
    expect(body.redemptions[0].order_id).toBe(testOrderId);
    expect(body.redemptions[0].discount_applied).toBe(500);
  });

  // 8. Update Coupon (PUT)
  it('8. PUT /api/admin/coupons/:id - updates coupon details and handles duplicate collision', async () => {
    // Valid update
    const res = await SELF.fetch(`https://example.com/api/admin/coupons/${createdFixedCouponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Updated description: Flat ₹600 off',
        discount_value: 600,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.coupon.description).toBe('Updated description: Flat ₹600 off');
    expect(parseFloat(body.coupon.discount_value)).toBe(600);

    // Attempting to rename to another existing code returns 409
    const dupRes = await SELF.fetch(`https://example.com/api/admin/coupons/${createdFixedCouponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: testCodePercentage,
      }),
    });
    expect(dupRes.status).toBe(409);
    const dupBody = await dupRes.json() as any;
    expect(dupBody.message).toContain('already in use');

    // Attempting invalid percentage update (> 100%) returns 400
    const overPctRes = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discount_value: 150,
      }),
    });
    expect(overPctRes.status).toBe(400);

    // Attempting negative discount_value returns 400
    const negRes = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        discount_value: -10,
      }),
    });
    expect(negRes.status).toBe(400);
  }, 15000);

  // 9. Quick Toggle Status (PATCH)
  it('9. PATCH /api/admin/coupons/:id/toggle - toggles active state cleanly', async () => {
    // Toggle active -> inactive
    const toggle1 = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(toggle1.status).toBe(200);
    const body1 = await toggle1.json() as any;
    expect(body1.success).toBe(true);
    expect(body1.is_active).toBe(false);

    // Toggle inactive -> active
    const toggle2 = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(toggle2.status).toBe(200);
    const body2 = await toggle2.json() as any;
    expect(body2.success).toBe(true);
    expect(body2.is_active).toBe(true);
  }, 15000);

  // 10. Delete Coupon (DELETE)
  it('10. DELETE /api/admin/coupons/:id - safely deletes coupon and associated redemptions', async () => {
    // Delete percentage coupon (which has a redemption row)
    const delRes = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.status).toBe(200);
    const body = await delRes.json() as any;
    expect(body.success).toBe(true);

    // Verifying it is gone (GET returns 404)
    const checkRes = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(checkRes.status).toBe(404);

    // Deleting again returns 404
    const reDelRes = await SELF.fetch(`https://example.com/api/admin/coupons/${createdPercentageCouponId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(reDelRes.status).toBe(404);
  }, 15000);

  // 11. Invalid UUID Edge Cases (returns 404 cleanly)
  it('11. Edge case: Invalid UUIDs return 404 cleanly on all parameterized endpoints', async () => {
    const invalidIds = ['invalid-uuid-123', 'undefined', 'null', '12345'];

    for (const id of invalidIds) {
      const getRes = await SELF.fetch(`https://example.com/api/admin/coupons/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(getRes.status).toBe(404);

      const putRes = await SELF.fetch(`https://example.com/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ description: 'Test' }),
      });
      expect(putRes.status).toBe(404);

      const toggleRes = await SELF.fetch(`https://example.com/api/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(toggleRes.status).toBe(404);

      const delRes = await SELF.fetch(`https://example.com/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(delRes.status).toBe(404);
    }
  }, 15000);

  // 12. Public Endpoints: GET /api/coupons/active and POST /api/coupons/validate
  it('12. Public API: GET /api/coupons/active and POST /api/coupons/validate', async () => {
    // GET /api/coupons/active should include active fixed coupon but not expired or inactive
    const activeRes = await SELF.fetch('https://example.com/api/coupons/active');
    expect(activeRes.status).toBe(200);
    const activeList = await activeRes.json() as any[];
    expect(Array.isArray(activeList)).toBe(true);
    expect(activeList.some((c: any) => c.id === createdFixedCouponId)).toBe(true);
    expect(activeList.some((c: any) => c.id === expiredCouponId)).toBe(false);
    expect(activeList.some((c: any) => c.id === inactiveCouponId)).toBe(false);

    // POST /api/coupons/validate with valid fixed coupon
    const validRes = await SELF.fetch('https://example.com/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testCodeFixed.toLowerCase(),
        subtotal: 2000,
      }),
    });
    expect(validRes.status).toBe(200);
    const validData = await validRes.json() as any;
    expect(validData.valid).toBe(true);
    expect(validData.subtotal).toBe(2000);
    expect(validData.discount_amount).toBe(600); // was updated to 600 in test 8
    expect(validData.final_amount).toBe(1400);

    // Validate fixed coupon when subtotal is smaller than discount (capped at subtotal)
    const capRes = await SELF.fetch('https://example.com/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testCodeFixed,
        subtotal: 400,
      }),
    });
    expect(capRes.status).toBe(200);
    const capData = await capRes.json() as any;
    expect(capData.discount_amount).toBe(400);
    expect(capData.final_amount).toBe(0);

    // Validate invalid / non-existent code (returns 404)
    const badCodeRes = await SELF.fetch('https://example.com/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'DOESNOTEXIST999', subtotal: 1000 }),
    });
    expect(badCodeRes.status).toBe(404);

    // Validate inactive coupon (returns 400)
    const inactRes = await SELF.fetch('https://example.com/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCodeInactive, subtotal: 1000 }),
    });
    expect(inactRes.status).toBe(400);

    // Validate expired coupon (returns 400)
    const expRes = await SELF.fetch('https://example.com/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCodeExpired, subtotal: 1000 }),
    });
    expect(expRes.status).toBe(400);

    // Validate missing code (returns 400)
    const noCodeRes = await SELF.fetch('https://example.com/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtotal: 1000 }),
    });
    expect(noCodeRes.status).toBe(400);
  }, 15000);

  // 13. Permissions & RBAC
  it('13. Permissions: Customer Support role has marketing.coupons permission', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/coupons/stats', {
      headers: { Authorization: `Bearer ${supportToken}` },
    });
    expect(res.status).toBe(200);
  });

  it('14. Permissions: Sales Fulfillment role lacks marketing.coupons permission (returns 403)', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/coupons', {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.message).toContain('Forbidden');
  });

  it('15. Permissions: Regular Customer receives 403 on admin coupons', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/coupons', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('16. Permissions: Missing / Invalid token receives 401', async () => {
    const noAuth = await SELF.fetch('https://example.com/api/admin/coupons');
    expect(noAuth.status).toBe(401);

    const badAuth = await SELF.fetch('https://example.com/api/admin/coupons', {
      headers: { Authorization: 'Bearer invalid.token' },
    });
    expect(badAuth.status).toBe(401);
  });
});
