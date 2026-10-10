import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb, getProductsDb } from '../../utils/db';
import { Env } from '../../types';

export const adminOrderRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/orders',
});

function isValidUUID(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

const VALID_ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

// 1. Get Order Summary Stats
adminOrderRouter.get('/stats', requirePermission('orders.read'), async (request, env) => {
  try {
    const { sql } = getDb(env);

    const stats = await sql`
      SELECT 
        COUNT(*)::int as total_orders,
        COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'failed', 'refunded') THEN total_amount::numeric ELSE 0 END), 0)::numeric(10,2) as total_revenue,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::int as paid_count,
        COUNT(CASE WHEN status = 'processing' THEN 1 END)::int as processing_count,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END)::int as shipped_count,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int as delivered_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_count,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END)::int as refunded_count
      FROM orders
    `;

    const row = stats[0] || {};
    return {
      total_orders: Number(row.total_orders || 0),
      total_revenue: parseFloat(row.total_revenue || '0'),
      pending_count: Number(row.pending_count || 0),
      paid_count: Number(row.paid_count || 0),
      processing_count: Number(row.processing_count || 0),
      shipped_count: Number(row.shipped_count || 0),
      delivered_count: Number(row.delivered_count || 0),
      cancelled_count: Number(row.cancelled_count || 0),
      refunded_count: Number(row.refunded_count || 0),
    };
  } catch (e: any) {
    console.error('Failed to get order stats:', e);
    return error(500, { message: 'Failed to fetch order statistics', error: e?.message });
  }
});

// 2. List & Filter Orders (Admin view)
adminOrderRouter.get('/', requirePermission('orders.read'), async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25)));
    const search = (url.searchParams.get('search') || '').trim();
    const status = url.searchParams.get('status')?.trim() || 'all';
    const paymentStatus = url.searchParams.get('payment_status')?.trim() || 'all';
    const paymentMethod = url.searchParams.get('payment_method')?.trim() || 'all';
    const dateFrom = url.searchParams.get('date_from')?.trim();
    const dateTo = url.searchParams.get('date_to')?.trim();
    const sort = url.searchParams.get('sort')?.trim() || 'created_at_desc';

    let parsedDateFrom: string | null = null;
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (isNaN(d.getTime())) {
        return error(400, { message: 'Invalid date_from format. Use ISO 8601 or YYYY-MM-DD' });
      }
      parsedDateFrom = /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? `${dateFrom} 00:00:00` : d.toISOString();
    }

    let parsedDateTo: string | null = null;
    if (dateTo) {
      const d = new Date(dateTo);
      if (isNaN(d.getTime())) {
        return error(400, { message: 'Invalid date_to format. Use ISO 8601 or YYYY-MM-DD' });
      }
      parsedDateTo = /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? `${dateTo} 23:59:59.999` : d.toISOString();
    }

    const offset = (page - 1) * limit;
    const { sql } = getDb(env);

    const rows = await sql`
      WITH filtered_orders AS (
        SELECT 
          o.id, o.user_id, o.address_id, o.status, o.total_amount, o.created_at,
          o.shipping_first_name, o.shipping_last_name, o.shipping_address,
          o.shipping_city, o.shipping_state, o.shipping_pincode, o.shipping_phone,
          u.email as customer_email,
          p.id as payment_id, p.method as payment_method, p.status as payment_status,
          s.id as shipment_id, s.status as shipment_status, s.tracking_number, s.carrier,
          COUNT(oi.id)::int as items_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN payments p ON p.order_id = o.id
        LEFT JOIN shipments s ON s.order_id = o.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE 
          (${search === '' ? sql`true` : sql`(
            o.id::text ILIKE ${'%' + search + '%'} OR
            u.email ILIKE ${'%' + search + '%'} OR
            o.shipping_first_name ILIKE ${'%' + search + '%'} OR
            o.shipping_last_name ILIKE ${'%' + search + '%'} OR
            o.shipping_phone ILIKE ${'%' + search + '%'} OR
            o.shipping_city ILIKE ${'%' + search + '%'} OR
            s.tracking_number ILIKE ${'%' + search + '%'}
          )`})
          AND (${status === 'all' ? sql`true` : sql`o.status = ${status}`})
          AND (${paymentStatus === 'all' ? sql`true` : sql`p.status = ${paymentStatus}`})
          AND (${paymentMethod === 'all' ? sql`true` : sql`p.method = ${paymentMethod}`})
          AND (${parsedDateFrom ? sql`o.created_at >= ${parsedDateFrom}` : sql`true`})
          AND (${parsedDateTo ? sql`o.created_at <= ${parsedDateTo}` : sql`true`})
        GROUP BY o.id, u.email, p.id, p.method, p.status, s.id, s.status, s.tracking_number, s.carrier
      )
      SELECT 
        fo.*,
        COUNT(*) OVER() as total_count
      FROM filtered_orders fo
      ORDER BY 
        ${sort === 'created_at_asc' ? sql`fo.created_at ASC` :
          sort === 'total_desc' ? sql`fo.total_amount::numeric DESC` :
          sort === 'total_asc' ? sql`fo.total_amount::numeric ASC` :
          sql`fo.created_at DESC`}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      orders: rows.map(o => ({
        id: o.id,
        user_id: o.user_id,
        customer: {
          email: o.customer_email || 'Guest Checkout',
          name: [o.shipping_first_name, o.shipping_last_name].filter(Boolean).join(' ') || 'Customer',
          phone: o.shipping_phone || '',
          city: o.shipping_city || '',
          state: o.shipping_state || '',
        },
        status: o.status,
        total_amount: parseFloat(o.total_amount) || 0,
        items_count: Number(o.items_count || 0),
        payment: {
          id: o.payment_id,
          method: o.payment_method || 'N/A',
          status: o.payment_status || 'pending',
        },
        shipment: o.shipment_id ? {
          id: o.shipment_id,
          status: o.shipment_status || 'pending',
          tracking_number: o.tracking_number || null,
          carrier: o.carrier || null,
        } : null,
        created_at: o.created_at,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    };
  } catch (e: any) {
    console.error('Failed to list admin orders:', e);
    return error(500, { message: 'Failed to fetch orders', error: e?.message });
  }
});

// 3. Get Single Order Detail
adminOrderRouter.get('/:id', requirePermission('orders.read'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Order not found' });
    }

    const { sql } = getDb(env);

    const ordersRows = await sql`
      SELECT 
        o.id, o.user_id, o.address_id, o.status, o.total_amount, o.created_at,
        o.shipping_first_name, o.shipping_last_name, o.shipping_address,
        o.shipping_city, o.shipping_state, o.shipping_pincode, o.shipping_phone,
        u.email as customer_email, u.phone_number as customer_phone,
        p.id as payment_id, p.method as payment_method, p.status as payment_status, p.amount as payment_amount, p.created_at as payment_created_at,
        s.id as shipment_id, s.tracking_number, s.carrier, s.status as shipment_status, s.created_at as shipment_created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.id = ${id}
      LIMIT 1
    `;

    if (ordersRows.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = ordersRows[0];

    const [items, statusHistory, refundsRows] = await Promise.all([
      sql`
        SELECT id, product_id, quantity, unit_price 
        FROM order_items 
        WHERE order_id = ${id}
      `,
      sql`
        SELECT id, status, notes, created_at 
        FROM order_status_history 
        WHERE order_id = ${id} 
        ORDER BY created_at ASC
      `,
      order.payment_id ? sql`
        SELECT id, payment_id, amount, reason, status, created_at 
        FROM refunds 
        WHERE payment_id = ${order.payment_id}
        ORDER BY created_at DESC
      ` : Promise.resolve([]),
    ]);

    // Product enrichment
    const productIds = items.map(i => i.product_id);
    let productsMap = new Map<number, any>();

    if (productIds.length > 0) {
      try {
        const { sql: prodSql } = getProductsDb(env);
        const prodRows = await prodSql`
          SELECT p.id, p.name, p.slug, p.price_cents, img.src as image_src
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
        console.error('Failed to resolve products for admin order detail:', e);
      }
    }

    const enrichedItems = items.map(item => {
      const prod = productsMap.get(item.product_id);
      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || '0'),
        subtotal: item.quantity * parseFloat(item.unit_price || '0'),
        product: prod ? {
          name: prod.name,
          slug: prod.slug,
          image: prod.image_src,
        } : null,
      };
    });

    return {
      id: order.id,
      user_id: order.user_id,
      customer: {
        id: order.user_id,
        email: order.customer_email || 'Guest',
        name: [order.shipping_first_name, order.shipping_last_name].filter(Boolean).join(' ') || 'Customer',
        phone: order.customer_phone || order.shipping_phone || '',
      },
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
        created_at: order.payment_created_at,
      },
      shipment: order.shipment_id ? {
        id: order.shipment_id,
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        status: order.shipment_status,
        created_at: order.shipment_created_at,
      } : null,
      items: enrichedItems,
      statusHistory,
      refunds: (refundsRows as any[]).map(r => ({
        id: r.id,
        amount: parseFloat(r.amount || '0'),
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
      })),
      created_at: order.created_at,
    };
  } catch (e: any) {
    console.error('Failed to get order detail:', e);
    return error(500, { message: 'Failed to fetch order details', error: e?.message });
  }
});

// 4. Update Order Status and Shipment
adminOrderRouter.put('/:id/status', requirePermission('orders.write'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Order not found' });
    }

    const body = await request.json().catch(() => ({})) as any;
    const { notes, tracking_number, carrier } = body;
    const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';

    if (!status) {
      return error(400, { message: 'status is required' });
    }

    if (!VALID_ORDER_STATUSES.includes(status as any)) {
      return error(400, {
        message: `Invalid status "${status}". Valid statuses are: ${VALID_ORDER_STATUSES.join(', ')}`,
      });
    }

    const { sql } = getDb(env);

    const updated = await sql`
      UPDATE orders 
      SET status = ${status} 
      WHERE id = ${id} 
      RETURNING id, status
    `;

    if (updated.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    // Insert history
    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes, created_at)
      VALUES (${crypto.randomUUID()}, ${id}, ${status}, ${notes || `Status updated to ${status}`}, NOW())
    `;

    // Shipment update or insert
    if (tracking_number !== undefined || carrier !== undefined || status === 'shipped' || status === 'delivered') {
      const existingShipment = await sql`SELECT id, status FROM shipments WHERE order_id = ${id} LIMIT 1`;
      const shipmentStatus = status === 'delivered' ? 'delivered' : (status === 'shipped' ? 'shipped' : (existingShipment[0]?.status || 'pending'));

      if (existingShipment.length > 0) {
        await sql`
          UPDATE shipments 
          SET tracking_number = COALESCE(${tracking_number !== undefined ? tracking_number : null}, tracking_number),
              carrier = COALESCE(${carrier !== undefined ? carrier : null}, carrier),
              status = ${shipmentStatus},
              updated_at = NOW()
          WHERE order_id = ${id}
        `;
      } else {
        await sql`
          INSERT INTO shipments (id, order_id, tracking_number, carrier, status, created_at, updated_at)
          VALUES (${crypto.randomUUID()}, ${id}, ${tracking_number || null}, ${carrier || null}, ${shipmentStatus}, NOW(), NOW())
        `;
      }
    }

    return {
      success: true,
      message: `Order #${id} status updated to "${status}"`,
      order: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to update order status:', e);
    return error(500, { message: 'Failed to update order status', error: e?.message });
  }
});

// 5. Update Order Shipping Details
adminOrderRouter.put('/:id/shipping', requirePermission('orders.write'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Order not found' });
    }

    const body = await request.json().catch(() => ({})) as any;
    const {
      shipping_first_name,
      shipping_last_name,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_pincode,
      shipping_phone,
    } = body;

    const { sql } = getDb(env);

    const updated = await sql`
      UPDATE orders
      SET 
        shipping_first_name = COALESCE(${shipping_first_name !== undefined ? shipping_first_name : null}, shipping_first_name),
        shipping_last_name = COALESCE(${shipping_last_name !== undefined ? shipping_last_name : null}, shipping_last_name),
        shipping_address = COALESCE(${shipping_address !== undefined ? shipping_address : null}, shipping_address),
        shipping_city = COALESCE(${shipping_city !== undefined ? shipping_city : null}, shipping_city),
        shipping_state = COALESCE(${shipping_state !== undefined ? shipping_state : null}, shipping_state),
        shipping_pincode = COALESCE(${shipping_pincode !== undefined ? shipping_pincode : null}, shipping_pincode),
        shipping_phone = COALESCE(${shipping_phone !== undefined ? shipping_phone : null}, shipping_phone)
      WHERE id = ${id}
      RETURNING id, shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_state, shipping_pincode, shipping_phone
    `;

    if (updated.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    return {
      success: true,
      message: 'Shipping information updated successfully',
      shipping: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to update shipping info:', e);
    return error(500, { message: 'Failed to update shipping information', error: e?.message });
  }
});

// 6. Process Refund for Order
adminOrderRouter.post('/:id/refund', requirePermission('orders.refund'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Order not found' });
    }

    const body = await request.json().catch(() => ({})) as any;
    const { amount, reason = 'Admin initiated refund' } = body;

    const { sql } = getDb(env);

    const orders = await sql`
      SELECT o.id, o.status, o.total_amount, p.id as payment_id, p.amount as payment_amount, p.status as payment_status
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = ${id}
      LIMIT 1
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    const order = orders[0];
    if (!order.payment_id) {
      return error(400, { message: 'No payment record found for this order' });
    }

    if (order.payment_status === 'failed') {
      return error(400, { message: 'Cannot refund an order with failed payment' });
    }

    // Check existing refunds
    const existingRefunds = await sql`
      SELECT COALESCE(SUM(amount::numeric), 0)::numeric(10,2) as total_refunded
      FROM refunds
      WHERE payment_id = ${order.payment_id} AND status = 'completed'
    `;
    const alreadyRefunded = parseFloat(existingRefunds[0]?.total_refunded || '0');
    const totalPayable = parseFloat(order.payment_amount || order.total_amount || '0');
    const remainingRefundable = Math.max(0, Number((totalPayable - alreadyRefunded).toFixed(2)));

    if (remainingRefundable <= 0) {
      return error(400, { message: 'Order has already been fully refunded' });
    }

    const rawAmount = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : remainingRefundable;
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return error(400, { message: 'Valid positive refund amount is required' });
    }

    const refundAmount = Number(rawAmount.toFixed(2));
    if (refundAmount > remainingRefundable) {
      return error(400, {
        message: `Refund amount (₹${refundAmount.toFixed(2)}) exceeds remaining refundable amount (₹${remainingRefundable.toFixed(2)})`,
      });
    }

    const isFullRefund = (alreadyRefunded + refundAmount) >= (totalPayable - 0.001);
    const refundId = crypto.randomUUID();

    // Insert refund record
    await sql`
      INSERT INTO refunds (id, payment_id, amount, reason, status, created_at)
      VALUES (${refundId}, ${order.payment_id}, ${refundAmount.toFixed(2)}, ${reason}, 'completed', NOW())
    `;

    // Update payment status
    const newPaymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    await sql`
      UPDATE payments 
      SET status = ${newPaymentStatus}
      WHERE id = ${order.payment_id}
    `;

    // Update order status if full refund
    if (isFullRefund) {
      await sql`
        UPDATE orders 
        SET status = 'refunded' 
        WHERE id = ${id}
      `;
    }

    const historyNote = isFullRefund
      ? `Full refund of ₹${refundAmount.toFixed(2)} processed. Reason: ${reason}`
      : `Partial refund of ₹${refundAmount.toFixed(2)} processed (Remaining: ₹${(remainingRefundable - refundAmount).toFixed(2)}). Reason: ${reason}`;

    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes, created_at)
      VALUES (${crypto.randomUUID()}, ${id}, ${isFullRefund ? 'refunded' : order.status}, ${historyNote}, NOW())
    `;

    return {
      success: true,
      refund_id: refundId,
      amount: refundAmount,
      is_full_refund: isFullRefund,
      remaining_refundable: Number((remainingRefundable - refundAmount).toFixed(2)),
      message: `Refund of ₹${refundAmount.toFixed(2)} issued successfully`,
    };
  } catch (e: any) {
    console.error('Failed to process refund:', e);
    return error(500, { message: 'Failed to process refund', error: e?.message });
  }
});

// 7. Cancel Order
adminOrderRouter.post('/:id/cancel', requirePermission('orders.cancel'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Order not found' });
    }

    const body = await request.json().catch(() => ({})) as any;
    const reason = body?.reason || 'Cancelled by store administrator';

    const { sql } = getDb(env);

    const orders = await sql`
      SELECT id, status FROM orders WHERE id = ${id} LIMIT 1
    `;

    if (orders.length === 0) {
      return error(404, { message: 'Order not found' });
    }

    if (['cancelled', 'refunded'].includes(orders[0].status)) {
      return error(400, { message: `Order is already in "${orders[0].status}" status` });
    }

    if (orders[0].status === 'delivered') {
      return error(400, { message: 'Cannot cancel an order that has already been delivered. Use refund/return instead.' });
    }

    await sql`UPDATE orders SET status = 'cancelled' WHERE id = ${id}`;
    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes, created_at)
      VALUES (${crypto.randomUUID()}, ${id}, 'cancelled', ${reason}, NOW())
    `;

    return {
      success: true,
      message: 'Order cancelled successfully',
    };
  } catch (e: any) {
    console.error('Failed to cancel order:', e);
    return error(500, { message: 'Failed to cancel order', error: e?.message });
  }
});
