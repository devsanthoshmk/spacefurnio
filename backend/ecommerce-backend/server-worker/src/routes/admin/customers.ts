import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb } from '../../utils/db';
import { Env } from '../../types';

export const adminCustomerRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/customers',
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 1. List & Search Customers with Analytics & Segmentation
adminCustomerRouter.get('/', requirePermission('customers.read'), async (request, env) => {
  try {
    const url = new URL(request.url);

    const rawPage = parseInt(url.searchParams.get('page') || '1', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(url.searchParams.get('limit') || '25', 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 25 : Math.min(100, rawLimit);

    const search = (url.searchParams.get('search') || '').trim();
    const searchDigits = search.replace(/\D/g, '');

    const segment = url.searchParams.get('segment') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'joined';
    const sortDir = url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    const offset = (page - 1) * limit;
    const { sql } = getDb(env);

    // 1. Calculate overall customer metrics (excluding staff accounts)
    const metricsResult = await sql`
      WITH order_stats AS (
        SELECT 
          o.user_id,
          COUNT(*)::int as total_orders,
          COALESCE(SUM(o.total_amount::numeric), 0)::numeric(10,2) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.status NOT IN ('cancelled', 'failed', 'refunded')
        GROUP BY o.user_id
      ),
      all_customers AS (
        SELECT 
          u.id::text as id,
          u.email,
          u.is_active,
          u.created_at,
          COALESCE(os.total_orders, 0) as total_orders,
          COALESCE(os.total_spent, 0)::numeric(10,2) as total_spent,
          os.last_order_date
        FROM users u
        LEFT JOIN order_stats os ON u.id = os.user_id
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = u.id 
            AND ur.role_id IN ('admin', 'super_admin', 'store_manager', 'sales_fulfillment', 'customer_support', 'catalog_inventory', 'custom')
        )
      )
      SELECT 
        COUNT(*)::int as total_customers,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)::int as new_customers_30d,
        COUNT(CASE WHEN is_active = true AND (last_order_date >= NOW() - INTERVAL '90 days' OR created_at >= NOW() - INTERVAL '30 days') THEN 1 END)::int as active_customers,
        COUNT(CASE WHEN total_orders > 1 THEN 1 END)::int as returning_customers,
        COUNT(CASE WHEN total_spent >= 50000 THEN 1 END)::int as high_value_customers,
        COALESCE(SUM(total_spent), 0)::numeric(10,2) as total_revenue,
        CASE WHEN SUM(total_orders) > 0 THEN (SUM(total_spent) / SUM(total_orders))::numeric(10,2) ELSE 0 END as aov
      FROM all_customers
    `;

    const rawMetrics = metricsResult[0] || {};
    const metrics = {
      total_customers: Number(rawMetrics.total_customers || 0),
      new_customers_30d: Number(rawMetrics.new_customers_30d || 0),
      active_customers: Number(rawMetrics.active_customers || 0),
      returning_customers: Number(rawMetrics.returning_customers || 0),
      high_value_customers: Number(rawMetrics.high_value_customers || 0),
      total_revenue: parseFloat(rawMetrics.total_revenue || '0'),
      average_order_value: parseFloat(rawMetrics.aov || '0'),
    };

    // 2. Query paginated customers uniting users and order summary
    const rows = await sql`
      WITH order_summary AS (
        SELECT 
          o.user_id,
          COUNT(*)::int as total_orders,
          COALESCE(SUM(o.total_amount::numeric), 0)::numeric(10,2) as total_spent,
          MAX(o.created_at) as last_order_date,
          (ARRAY_AGG(o.shipping_first_name) FILTER (WHERE o.shipping_first_name IS NOT NULL AND o.shipping_first_name != ''))[1] as first_name,
          (ARRAY_AGG(o.shipping_last_name) FILTER (WHERE o.shipping_last_name IS NOT NULL AND o.shipping_last_name != ''))[1] as last_name,
          (ARRAY_AGG(o.shipping_city) FILTER (WHERE o.shipping_city IS NOT NULL AND o.shipping_city != ''))[1] as city,
          (ARRAY_AGG(o.shipping_state) FILTER (WHERE o.shipping_state IS NOT NULL AND o.shipping_state != ''))[1] as state,
          (ARRAY_AGG(o.shipping_phone) FILTER (WHERE o.shipping_phone IS NOT NULL AND o.shipping_phone != ''))[1] as phone
        FROM orders o
        WHERE o.status NOT IN ('cancelled', 'failed', 'refunded')
        GROUP BY o.user_id
      ),
      raw_customers AS (
        SELECT 
          u.id::text as id,
          u.email,
          u.phone_number as user_phone,
          COALESCE(os.phone, u.phone_number) as phone,
          u.is_active,
          COALESCE((SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = u.id LIMIT 1), 'customer') as role,
          COALESCE(os.total_orders, 0) as total_orders,
          COALESCE(os.total_spent, 0)::numeric(10,2) as total_spent,
          os.last_order_date,
          os.city,
          os.state,
          os.first_name,
          os.last_name,
          TRIM(CONCAT(COALESCE(os.first_name, ''), ' ', COALESCE(os.last_name, ''))) as full_name,
          u.created_at
        FROM users u
        LEFT JOIN order_summary os ON u.id = os.user_id
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = u.id 
            AND ur.role_id IN ('admin', 'super_admin', 'store_manager', 'sales_fulfillment', 'customer_support', 'catalog_inventory', 'custom')
        )
      ),
      segmented_customers AS (
        SELECT 
          rc.*,
          CASE 
            WHEN rc.total_spent >= 50000 THEN 'High Value'
            WHEN rc.created_at >= NOW() - INTERVAL '30 days' THEN 'New'
            WHEN rc.total_orders > 1 THEN 'Returning'
            WHEN rc.is_active = false OR (rc.last_order_date IS NOT NULL AND rc.last_order_date < NOW() - INTERVAL '90 days') OR (rc.total_orders = 0 AND rc.created_at < NOW() - INTERVAL '90 days') THEN 'Inactive'
            WHEN rc.total_orders = 0 THEN 'No Orders'
            ELSE 'Returning'
          END as segment
        FROM raw_customers rc
      )
      SELECT 
        sc.*,
        COUNT(*) OVER() as filtered_total
      FROM segmented_customers sc
      WHERE 
        (${search === '' ? sql`true` : sql`(
          sc.id::text ILIKE ${'%' + search + '%'} OR
          sc.email ILIKE ${'%' + search + '%'} OR
          sc.full_name ILIKE ${'%' + search + '%'} OR
          sc.phone ILIKE ${'%' + search + '%'} OR
          sc.city ILIKE ${'%' + search + '%'} OR
          sc.state ILIKE ${'%' + search + '%'}
          ${searchDigits.length >= 3 ? sql`OR REGEXP_REPLACE(COALESCE(sc.phone, ''), '\D', '', 'g') ILIKE ${'%' + searchDigits + '%'}` : sql``}
        )`})
        AND (${status === 'all' ? sql`true` : (status === 'active' ? sql`sc.is_active = true` : sql`sc.is_active = false`)})
        AND (${segment === 'all' ? sql`true` : (
          segment === 'high_value' ? sql`sc.segment = 'High Value'` :
          segment === 'returning' ? sql`sc.segment = 'Returning'` :
          segment === 'new' ? sql`sc.segment = 'New'` :
          segment === 'inactive' ? sql`sc.segment = 'Inactive'` :
          segment === 'no_orders' ? sql`sc.segment = 'No Orders'` :
          sql`true`
        )})
      ORDER BY 
        ${sortBy === 'total_spent' && sortDir === 'asc' ? sql`sc.total_spent ASC` :
          sortBy === 'total_spent' && sortDir === 'desc' ? sql`sc.total_spent DESC` :
          sortBy === 'orders' && sortDir === 'asc' ? sql`sc.total_orders ASC` :
          sortBy === 'orders' && sortDir === 'desc' ? sql`sc.total_orders DESC` :
          sortBy === 'name' && sortDir === 'asc' ? sql`sc.full_name ASC` :
          sortBy === 'name' && sortDir === 'desc' ? sql`sc.full_name DESC` :
          sortBy === 'last_order' && sortDir === 'asc' ? sql`sc.last_order_date ASC NULLS FIRST` :
          sortBy === 'last_order' && sortDir === 'desc' ? sql`sc.last_order_date DESC NULLS LAST` :
          sortDir === 'asc' ? sql`sc.created_at ASC` :
          sql`sc.created_at DESC`}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const filteredTotal = rows.length > 0 ? Number(rows[0].filtered_total || 0) : 0;
    const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));

    return {
      metrics,
      customers: rows.map(r => {
        const totalOrders = Number(r.total_orders || 0);
        const totalSpent = parseFloat(r.total_spent || '0');
        const aov = totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0;
        const name = r.full_name && r.full_name.trim() !== '' ? r.full_name : r.email.split('@')[0];

        return {
          id: r.id,
          email: r.email,
          name,
          first_name: r.first_name || '',
          last_name: r.last_name || '',
          phone: r.phone || r.user_phone || null,
          status: r.is_active ? 'ACTIVE' : 'DISABLED',
          is_active: Boolean(r.is_active),
          role: r.role,
          total_orders: totalOrders,
          total_spent: totalSpent,
          average_order_value: aov,
          last_order_date: r.last_order_date,
          city: r.city || null,
          state: r.state || null,
          segment: r.segment,
          created_at: r.created_at,
        };
      }),
      pagination: {
        page,
        limit,
        total: filteredTotal,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    };
  } catch (e: any) {
    console.error('Failed to get customer directory:', e);
    return error(500, { message: 'Failed to fetch customer directory', error: e?.message });
  }
});

// 2. Get Single Customer Profile & Details
adminCustomerRouter.get('/:id', requirePermission('customers.read'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || !UUID_REGEX.test(id)) {
      return error(404, { message: 'Customer not found' });
    }

    const { sql } = getDb(env);

    const userRows = await sql`
      SELECT u.id, u.email, u.phone_number, u.is_active, u.created_at, u.updated_at,
             COALESCE(ur.role_id, 'customer') as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ${id}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return error(404, { message: 'Customer not found' });
    }

    const customer = userRows[0];

    const [addresses, orders, reviews, cartRows, wishlistRows] = await Promise.all([
      sql`
        SELECT id, address_line_1, address_line_2, city, state, postal_code, country, is_default, created_at
        FROM user_addresses
        WHERE user_id = ${id}
        ORDER BY is_default DESC, created_at DESC
      `,
      sql`
        SELECT id, status, total_amount, created_at, shipping_city, shipping_state, 
               shipping_first_name, shipping_last_name, shipping_phone
        FROM orders
        WHERE user_id = ${id}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT id, product_id, rating, title, comment, is_verified_purchase, created_at
        FROM reviews
        WHERE user_id = ${id}
        ORDER BY created_at DESC
      `,
      sql`
        SELECT COUNT(ci.id)::int as item_count
        FROM carts c
        JOIN cart_items ci ON c.id = ci.cart_id
        WHERE c.user_id = ${id}
      `,
      sql`
        SELECT COUNT(wi.id)::int as item_count
        FROM wishlists w
        JOIN wishlist_items wi ON w.id = wi.wishlist_id
        WHERE w.user_id = ${id}
      `,
    ]);

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(o => !['cancelled', 'failed', 'refunded'].includes(o.status))
      .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const firstName = orders.find(o => o.shipping_first_name)?.shipping_first_name || '';
    const lastName = orders.find(o => o.shipping_last_name)?.shipping_last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || customer.email.split('@')[0];
    const phone = customer.phone_number || orders.find(o => o.shipping_phone)?.shipping_phone || null;
    const lastOrderDate = orders[0]?.created_at || null;

    let segment = 'No Orders';
    const createdAtTime = new Date(customer.created_at).getTime();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    if (totalSpent >= 50000) {
      segment = 'High Value';
    } else if (createdAtTime >= thirtyDaysAgo) {
      segment = 'New';
    } else if (totalOrders > 1) {
      segment = 'Returning';
    } else if (!customer.is_active || (lastOrderDate && new Date(lastOrderDate).getTime() < ninetyDaysAgo) || (totalOrders === 0 && createdAtTime < ninetyDaysAgo)) {
      segment = 'Inactive';
    } else if (totalOrders === 0) {
      segment = 'No Orders';
    } else {
      segment = 'Returning';
    }

    return {
      customer: {
        id: customer.id,
        email: customer.email,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone_number: customer.phone_number,
        phone,
        status: customer.is_active ? 'ACTIVE' : 'DISABLED',
        is_active: customer.is_active,
        role: customer.role,
        segment,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      },
      stats: {
        total_orders: totalOrders,
        total_spent: Math.round(totalSpent * 100) / 100,
        average_order_value: totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0,
        cart_items_count: Number(cartRows[0]?.item_count || 0),
        wishlist_items_count: Number(wishlistRows[0]?.item_count || 0),
        reviews_count: reviews.length,
      },
      addresses,
      orders: orders.map(o => ({
        id: o.id,
        status: o.status,
        total_amount: parseFloat(o.total_amount) || 0,
        city: o.shipping_city,
        state: o.shipping_state,
        created_at: o.created_at,
      })),
      reviews,
    };
  } catch (e: any) {
    console.error('Failed to get customer detail:', e);
    return error(500, { message: 'Failed to fetch customer profile', error: e?.message });
  }
});

// 3. Update Customer Profile
adminCustomerRouter.put('/:id', requirePermission('customers.write'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || !UUID_REGEX.test(id)) {
      return error(404, { message: 'Customer not found' });
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const { phone_number, is_active } = body;

    const { sql } = getDb(env);

    // Check user exists
    const existing = await sql`SELECT id, phone_number, is_active FROM users WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Customer not found' });
    }

    const nextPhone = phone_number !== undefined ? (phone_number === null || phone_number === '' ? null : String(phone_number).trim()) : existing[0].phone_number;
    const nextActive = is_active !== undefined ? Boolean(is_active) : existing[0].is_active;

    const updated = await sql`
      UPDATE users
      SET 
        phone_number = ${nextPhone},
        is_active = ${nextActive},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, phone_number, is_active, updated_at
    `;

    return {
      success: true,
      message: 'Customer updated successfully',
      customer: {
        ...updated[0],
        status: updated[0].is_active ? 'ACTIVE' : 'DISABLED',
      },
    };
  } catch (e: any) {
    console.error('Failed to update customer:', e);
    if (e?.code === '23505' || e?.message?.includes('users_phone_number_unique')) {
      return error(400, { message: 'Phone number is already associated with another account' });
    }
    return error(500, { message: 'Failed to update customer', error: e?.message });
  }
});

// 4. Quick Toggle Customer Active / Disabled Status
adminCustomerRouter.post('/:id/toggle-status', requirePermission('customers.write'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || !UUID_REGEX.test(id)) {
      return error(404, { message: 'Customer not found' });
    }

    const { sql } = getDb(env);

    const existing = await sql`SELECT id, email, is_active FROM users WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Customer not found' });
    }

    const nextActive = !existing[0].is_active;

    const updated = await sql`
      UPDATE users 
      SET is_active = ${nextActive}, updated_at = NOW() 
      WHERE id = ${id} 
      RETURNING id, email, phone_number, is_active, updated_at
    `;

    return {
      success: true,
      is_active: nextActive,
      message: `Customer account ${nextActive ? 'activated' : 'disabled'} successfully`,
      customer: {
        ...updated[0],
        status: nextActive ? 'ACTIVE' : 'DISABLED',
      },
    };
  } catch (e: any) {
    console.error('Failed to toggle customer status:', e);
    return error(500, { message: 'Failed to toggle status', error: e?.message });
  }
});

// 5. Delete Customer Account (Safe Cascading Cleanup)
adminCustomerRouter.delete('/:id', requirePermission('customers.delete'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || !UUID_REGEX.test(id)) {
      return error(404, { message: 'Customer not found' });
    }

    const { sql } = getDb(env);

    const existing = await sql`SELECT id, email FROM users WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Customer not found' });
    }

    // Stage 1: Unlink snapshot references, delete leaf data (reviews, carts/wishlists items, sessions, logs)
    await Promise.all([
      sql`
        UPDATE orders 
        SET address_id = NULL 
        WHERE address_id IN (SELECT id FROM user_addresses WHERE user_id = ${id}) 
           OR user_id = ${id}
      `,
      sql`
        UPDATE refunds 
        SET return_request_id = NULL 
        WHERE return_request_id IN (SELECT id FROM return_requests WHERE user_id = ${id})
      `,
      sql`DELETE FROM reviews WHERE user_id = ${id}`,
      sql`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ${id})`,
      sql`DELETE FROM wishlist_items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ${id})`,
      sql`DELETE FROM notifications WHERE user_id = ${id}`.catch(() => null),
      sql`DELETE FROM password_resets WHERE user_id = ${id}`.catch(() => null),
      sql`DELETE FROM user_sessions WHERE user_id = ${id}`.catch(() => null),
      sql`DELETE FROM user_roles WHERE user_id = ${id}`.catch(() => null),
      sql`UPDATE admin_invitations SET invited_by = NULL WHERE invited_by = ${id}`.catch(() => null),
    ]);

    // Stage 2: Delete sub-order items, payment transactions, return items, shipments items, carts, wishlists
    await Promise.all([
      sql`DELETE FROM carts WHERE user_id = ${id}`,
      sql`DELETE FROM wishlists WHERE user_id = ${id}`,
      sql`
        DELETE FROM refunds 
        WHERE payment_id IN (
          SELECT p.id FROM payments p 
          JOIN orders o ON p.order_id = o.id 
          WHERE o.user_id = ${id}
        )
      `,
      sql`
        DELETE FROM return_items 
        WHERE return_request_id IN (SELECT id FROM return_requests WHERE user_id = ${id})
      `,
      sql`
        DELETE FROM shipment_items 
        WHERE shipment_id IN (
          SELECT s.id FROM shipments s 
          JOIN orders o ON s.order_id = o.id 
          WHERE o.user_id = ${id}
        )
      `,
      sql`
        DELETE FROM payment_transactions 
        WHERE payment_id IN (
          SELECT p.id FROM payments p 
          JOIN orders o ON p.order_id = o.id 
          WHERE o.user_id = ${id}
        )
      `,
      sql`
        DELETE FROM order_status_history 
        WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${id})
      `,
      sql`
        DELETE FROM order_items 
        WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${id})
      `,
    ]);

    // Stage 3: Delete return requests, coupon redemptions, payments, shipments
    await Promise.all([
      sql`
        DELETE FROM return_requests 
        WHERE user_id = ${id} 
           OR order_id IN (SELECT id FROM orders WHERE user_id = ${id})
      `,
      sql`
        DELETE FROM coupon_redemptions 
        WHERE user_id = ${id} 
           OR order_id IN (SELECT id FROM orders WHERE user_id = ${id})
      `,
      sql`
        DELETE FROM payments 
        WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${id})
      `,
      sql`
        DELETE FROM shipments 
        WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${id})
      `,
    ]);

    // Stage 4: Delete orders & addresses
    await Promise.all([
      sql`DELETE FROM orders WHERE user_id = ${id}`,
      sql`DELETE FROM user_addresses WHERE user_id = ${id}`,
    ]);

    // Stage 5: Delete user
    await sql`DELETE FROM users WHERE id = ${id}`;

    return {
      success: true,
      message: `Customer ${existing[0].email} deleted successfully`,
    };
  } catch (e: any) {
    console.error('Failed to delete customer:', e);
    return error(500, { message: 'Failed to delete customer', error: e?.message });
  }
});
