import { SELF, env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, importPKCS8 } from 'jose';
import { getDb } from '../src/utils/db';
import { calcDelta, getDateRanges } from '../src/routes/admin/dashboard';

async function createJwt(payload: Record<string, any>, privateKeyPem: string, expiresIn = '1h') {
  const unescapedPem = privateKeyPem.replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(unescapedPem, 'RS256');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: 'neon-ecommerce-key-1' })
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

describe('Admin Dashboard Unit Functions', () => {
  describe('calcDelta', () => {
    it('handles zero cur and zero prev correctly', () => {
      expect(calcDelta(0, 0)).toEqual({ deltaPct: null, isPositive: true });
    });

    it('handles zero prev with positive cur', () => {
      expect(calcDelta(50, 0)).toEqual({ deltaPct: 100, isPositive: true });
    });

    it('handles zero prev with zero or negative cur', () => {
      expect(calcDelta(0, 0)).toEqual({ deltaPct: null, isPositive: true });
      expect(calcDelta(-10, 0)).toEqual({ deltaPct: 100, isPositive: false });
    });

    it('handles positive increase', () => {
      expect(calcDelta(150, 100)).toEqual({ deltaPct: 50, isPositive: true });
    });

    it('handles decrease', () => {
      expect(calcDelta(80, 100)).toEqual({ deltaPct: 20, isPositive: false });
    });

    it('handles drop to zero', () => {
      expect(calcDelta(0, 100)).toEqual({ deltaPct: 100, isPositive: false });
    });
  });

  describe('getDateRanges', () => {
    it('returns valid date ranges for period=today', () => {
      const { curFrom, curTo, prevFrom, prevTo } = getDateRanges('today');
      expect(curFrom.getTime()).toBeLessThan(curTo.getTime());
      expect(prevFrom.getTime()).toBeLessThan(prevTo.getTime());
      expect(prevTo.getTime()).toBeLessThan(curFrom.getTime());
      expect(curFrom.getHours()).toBe(0);
      expect(curFrom.getMinutes()).toBe(0);
    });

    it('returns valid date ranges for period=week', () => {
      const { curFrom, curTo, prevFrom, prevTo } = getDateRanges('week');
      expect(curFrom.getTime()).toBeLessThan(curTo.getTime());
      expect(curFrom.getDay()).toBe(0); // Sunday
    });

    it('returns valid date ranges for period=month', () => {
      const { curFrom, curTo } = getDateRanges('month');
      expect(curFrom.getDate()).toBe(1);
      expect(curFrom.getTime()).toBeLessThan(curTo.getTime());
    });

    it('returns valid date ranges for period=year', () => {
      const { curFrom, curTo } = getDateRanges('year');
      expect(curFrom.getMonth()).toBe(0);
      expect(curFrom.getDate()).toBe(1);
    });

    it('returns valid date ranges for period=all', () => {
      const { curFrom, curTo } = getDateRanges('all');
      expect(curFrom.getFullYear()).toBe(2020);
    });

    it('handles custom date strings with YYYY-MM-DD', () => {
      const { curFrom, curTo } = getDateRanges('custom', '2026-01-01', '2026-01-31');
      expect(curFrom.getFullYear()).toBe(2026);
      expect(curFrom.getMonth()).toBe(0);
      expect(curFrom.getDate()).toBe(1);
      expect(curTo.getMonth()).toBe(0);
      expect(curTo.getDate()).toBe(31);
    });

    it('handles custom date strings with ISO timestamps', () => {
      const { curFrom, curTo } = getDateRanges('custom', '2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.999Z');
      expect(curFrom.getTime()).toBeLessThan(curTo.getTime());
    });

    it('handles custom date with only from provided', () => {
      const { curFrom, curTo } = getDateRanges('custom', '2026-02-15');
      expect(curFrom.getFullYear()).toBe(2026);
      expect(curFrom.getMonth()).toBe(1);
      expect(curFrom.getDate()).toBe(15);
      expect(curFrom.getTime()).toBeLessThan(curTo.getTime());
    });

    it('handles custom date with only to provided', () => {
      const { curFrom, curTo } = getDateRanges('custom', undefined, '2026-03-31');
      expect(curTo.getFullYear()).toBe(2026);
      expect(curTo.getMonth()).toBe(2);
      expect(curTo.getDate()).toBe(31);
      expect(curFrom.getTime()).toBeLessThan(curTo.getTime());
    });

    it('handles inverted custom dates gracefully by swapping', () => {
      const { curFrom, curTo } = getDateRanges('custom', '2026-12-31', '2026-01-01');
      expect(curFrom.getTime()).toBeLessThanOrEqual(curTo.getTime());
      expect(!isNaN(curFrom.getTime())).toBe(true);
      expect(!isNaN(curTo.getTime())).toBe(true);
    });

    it('handles malformed date strings gracefully without throwing', () => {
      const { curFrom, curTo, prevFrom, prevTo } = getDateRanges('custom', 'invalid-date', 'gibberish');
      expect(!isNaN(curFrom.getTime())).toBe(true);
      expect(!isNaN(curTo.getTime())).toBe(true);
      expect(!isNaN(prevFrom.getTime())).toBe(true);
      expect(!isNaN(prevTo.getTime())).toBe(true);
    });

    it('handles unknown period strings gracefully', () => {
      const { curFrom, curTo } = getDateRanges('unsupported_period_name');
      expect(!isNaN(curFrom.getTime())).toBe(true);
      expect(!isNaN(curTo.getTime())).toBe(true);
    });
  });
});

describe('Admin Dashboard Route Authentication & RBAC', () => {
  let superAdminId: string;
  let storeManagerId: string;
  let salesFulfillmentId: string;
  let customerSupportId: string;
  let catalogInventoryId: string;
  let regularCustomerId: string;
  let deactivatedAdminId: string;

  beforeAll(async () => {
    const { sql } = getDb(env as any);

    // Ensure all role presets exist in roles table
    await sql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Admin'),
        ('store_manager', 'Store Manager'),
        ('sales_fulfillment', 'Sales & Fulfillment'),
        ('customer_support', 'Customer Support'),
        ('catalog_inventory', 'Catalog & Inventory'),
        ('custom', 'Custom'),
        ('admin', 'Administrator'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    // Helper to create or ensure a user with a given role
    async function ensureUserWithRole(email: string, role: string, isActive = true) {
      const [user] = await sql`
        INSERT INTO users (email, is_active)
        VALUES (${email}, ${isActive})
        ON CONFLICT (email) DO UPDATE SET is_active = ${isActive}
        RETURNING id
      `;
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${user.id}, ${role})
        ON CONFLICT (user_id, role_id) DO NOTHING
      `;
      return user.id;
    }

    superAdminId = await ensureUserWithRole('dash_super_admin@store.com', 'super_admin');
    storeManagerId = await ensureUserWithRole('dash_store_manager@store.com', 'store_manager');
    salesFulfillmentId = await ensureUserWithRole('dash_sales_lead@store.com', 'sales_fulfillment');
    customerSupportId = await ensureUserWithRole('dash_cust_support@store.com', 'customer_support');
    catalogInventoryId = await ensureUserWithRole('dash_catalog_spec@store.com', 'catalog_inventory');
    regularCustomerId = await ensureUserWithRole('dash_regular_cust@store.com', 'customer');
    deactivatedAdminId = await ensureUserWithRole('dash_deact_admin@store.com', 'super_admin', false);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard');
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.message).toContain('authorization');
  });

  it('rejects requests with malformed tokens with 401', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: 'Bearer not-a-valid-token' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects requests with missing Bearer prefix with 401', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects deactivated user accounts with 401', async () => {
    const token = await createJwt(
      { sub: deactivatedAdminId, email: 'dash_deact_admin@store.com', role: 'super_admin' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent user IDs with 401', async () => {
    const token = await createJwt(
      { sub: crypto.randomUUID(), email: 'nonexistent@store.com', role: 'super_admin' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-admin customer roles with 403 Forbidden', async () => {
    const token = await createJwt(
      { sub: regularCustomerId, email: 'dash_regular_cust@store.com', role: 'customer' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.message).toContain('Forbidden');
  });

  it('rejects customer_support role because it lacks analytics.view permission (403)', async () => {
    const token = await createJwt(
      { sub: customerSupportId, email: 'dash_cust_support@store.com', role: 'customer_support' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.message).toContain('Insufficient permissions');
    expect(body.required).toContain('analytics.view');
  });

  it('rejects catalog_inventory role because it lacks analytics.view permission (403)', async () => {
    const token = await createJwt(
      { sub: catalogInventoryId, email: 'dash_catalog_spec@store.com', role: 'catalog_inventory' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.message).toContain('Insufficient permissions');
    expect(body.required).toContain('analytics.view');
  });

  it('allows store_manager role to access dashboard (has analytics.view)', async () => {
    const token = await createJwt(
      { sub: storeManagerId, email: 'dash_store_manager@store.com', role: 'store_manager' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.kpis).toBeDefined();
  });

  it('allows sales_fulfillment role to access dashboard (has analytics.view)', async () => {
    const token = await createJwt(
      { sub: salesFulfillmentId, email: 'dash_sales_lead@store.com', role: 'sales_fulfillment' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.kpis).toBeDefined();
  });

  it('allows super_admin role full access to dashboard', async () => {
    const token = await createJwt(
      { sub: superAdminId, email: 'dash_super_admin@store.com', role: 'super_admin' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );

    const res = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    
    // Validate complete dashboard payload schema
    expect(data.period).toBe('week');
    expect(data.from).toBeDefined();
    expect(data.to).toBeDefined();

    // KPIs
    expect(data.kpis.revenue).toBeDefined();
    expect(typeof data.kpis.revenue.value).toBe('number');
    expect(typeof data.kpis.revenue.previous_value).toBe('number');
    expect(typeof data.kpis.revenue.is_positive).toBe('boolean');
    expect(Array.isArray(data.kpis.revenue.sparkline)).toBe(true);
    expect(data.kpis.revenue.sparkline.length).toBe(7);

    expect(data.kpis.orders).toBeDefined();
    expect(typeof data.kpis.orders.value).toBe('number');
    expect(typeof data.kpis.orders.completed).toBe('number');
    expect(typeof data.kpis.orders.pending).toBe('number');
    expect(typeof data.kpis.orders.cancelled).toBe('number');
    expect(Array.isArray(data.kpis.orders.sparkline)).toBe(true);
    expect(data.kpis.orders.sparkline.length).toBe(7);

    expect(data.kpis.aov).toBeDefined();
    expect(typeof data.kpis.aov.value).toBe('number');
    expect(Array.isArray(data.kpis.aov.sparkline)).toBe(true);

    expect(data.kpis.customers).toBeDefined();
    expect(typeof data.kpis.customers.value).toBe('number');
    expect(typeof data.kpis.customers.total_registered).toBe('number');
    expect(Array.isArray(data.kpis.customers.sparkline)).toBe(true);

    // Trends
    expect(Array.isArray(data.trends)).toBe(true);
    expect(data.trends.length).toBeGreaterThan(0);
    expect(typeof data.trends[0].revenue).toBe('number');
    expect(typeof data.trends[0].orders).toBe('number');

    // Operations Queue
    expect(typeof data.operations_queue.awaiting_fulfillment).toBe('number');
    expect(typeof data.operations_queue.active_carts).toBe('number');
    expect(typeof data.operations_queue.total_reviews).toBe('number');
    expect(typeof data.operations_queue.store_rating).toBe('number');

    // Catalog Stats
    expect(typeof data.catalog.total_products).toBe('number');
    expect(typeof data.catalog.active_products).toBe('number');
    expect(typeof data.catalog.inventory_value).toBe('number');

    // Customer Acquisition
    expect(typeof data.customer_acquisition.new_customers).toBe('number');
    expect(typeof data.customer_acquisition.returning_customers).toBe('number');
    expect(typeof data.customer_acquisition.guest_orders).toBe('number');
    expect(typeof data.customer_acquisition.new_pct).toBe('number');

    // Recent orders, top products, top coupons
    expect(Array.isArray(data.recent_orders)).toBe(true);
    expect(Array.isArray(data.top_products)).toBe(true);
    expect(Array.isArray(data.top_coupons)).toBe(true);
  });
});

describe('Admin Dashboard Query Parameters & Filter Variations', () => {
  let adminToken: string;

  beforeAll(async () => {
    const { sql } = getDb(env as any);
    const [user] = await sql`
      INSERT INTO users (email, is_active)
      VALUES ('dash_query_test@store.com', true)
      ON CONFLICT (email) DO UPDATE SET is_active = true
      RETURNING id
    `;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${user.id}, 'super_admin')
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    adminToken = await createJwt(
      { sub: user.id, email: 'dash_query_test@store.com', role: 'super_admin' },
      (env as any).RSA_PRIVATE_KEY_PEM
    );
  });

  it('supports path without trailing slash and with trailing slash', async () => {
    const resNoSlash = await SELF.fetch('https://example.com/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resNoSlash.status).toBe(200);

    const resSlash = await SELF.fetch('https://example.com/api/admin/dashboard/', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resSlash.status).toBe(200);
  });

  it('supports period=today with 8 hourly trend intervals', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=today', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('today');
    expect(data.trends.length).toBe(8);
  });

  it('supports period=week with 7 trend intervals', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=week', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('week');
    expect(data.trends.length).toBe(7);
  });

  it('supports period=month', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('month');
  });

  it('supports period=year', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=year', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('year');
  });

  it('supports period=all', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=all', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('all');
  });

  it('supports custom date ranges with YYYY-MM-DD from and to', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=custom&from=2026-01-01&to=2026-03-31', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('custom');
    expect(new Date(data.from).getFullYear()).toBe(2026);
  });

  it('supports custom date ranges with ISO timestamp strings', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=custom&from=2026-01-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.period).toBe('custom');
  });

  it('handles inverted date ranges (from > to) safely without crashing', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=custom&from=2026-12-31&to=2026-01-01', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(new Date(data.from).getTime()).toBeLessThanOrEqual(new Date(data.to).getTime());
  });

  it('handles malformed date parameters safely without throwing 500 error', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?period=custom&from=invalid-date&to=garbage', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.kpis).toBeDefined();
  });

  it('handles custom range with single date parameter safely', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/dashboard?from=2026-02-01', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.kpis).toBeDefined();
  });
});
