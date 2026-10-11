import { AutoRouter, error } from 'itty-router';
import { requireAdmin, requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb, getProductsDb } from '../../utils/db';
import { Env } from '../../types';

export const adminDashboardRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/dashboard',
});

export function calcDelta(cur: number, prev: number): { deltaPct: number | null; isPositive: boolean } {
  if (prev === 0 && cur === 0) return { deltaPct: null, isPositive: true };
  if (prev === 0) return { deltaPct: 100, isPositive: cur >= 0 };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { deltaPct: Math.abs(pct), isPositive: pct >= 0 };
}

function parseDate(val?: string, isEnd = false): Date | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const str = trimmed.includes('T') ? trimmed : `${trimmed}T${isEnd ? '23:59:59.999' : '00:00:00'}`;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function getDateRanges(period: string = 'week', customFrom?: string, customTo?: string) {
  const now = new Date();
  const eod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let curFrom: Date;
  let curTo = eod;

  const parsedFrom = parseDate(customFrom, false);
  const parsedTo = parseDate(customTo, true);

  if (period === 'today') {
    curFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (period === 'week') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - d.getDay()); // Sunday
    d.setHours(0, 0, 0, 0);
    curFrom = d;
  } else if (period === 'month') {
    curFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (period === 'year') {
    curFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else if (period === 'all') {
    curFrom = new Date(2020, 0, 1, 0, 0, 0, 0);
  } else if (parsedFrom && parsedTo) {
    curFrom = parsedFrom;
    curTo = parsedTo;
  } else if (parsedFrom) {
    curFrom = parsedFrom;
  } else if (parsedTo) {
    curTo = parsedTo;
    const d = new Date(parsedTo.getTime() - 6 * 86400000);
    d.setHours(0, 0, 0, 0);
    curFrom = d;
  } else {
    // Default 7 days
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    curFrom = d;
  }

  // Ensure curFrom <= curTo
  if (curFrom.getTime() > curTo.getTime()) {
    const temp = curFrom;
    curFrom = curTo;
    curTo = temp;
  }

  const durationMs = Math.max(86400000, curTo.getTime() - curFrom.getTime());
  const prevTo = new Date(curFrom.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);

  return { curFrom, curTo, prevFrom, prevTo };
}

const handleDashboardRequest = async (request: AdminAuthRequest, env: Env) => {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    const customFrom = url.searchParams.get('from') || undefined;
    const customTo = url.searchParams.get('to') || undefined;

    const { curFrom, curTo, prevFrom, prevTo } = getDateRanges(period, customFrom, customTo);
    const { sql } = getDb(env);

    // Parallel DB queries
    const [
      recentOrdersRows,
      curOrdersRows,
      prevOrdersRows,
      registeredUsersRes,
      pendingFulfillmentRes,
      pendingReviewsRes,
      couponRedemptionsRes,
      cartCountRes,
    ] = await Promise.all([
      // 1. Recent 30 orders with latest payment, shipment, and exact item count (no row multiplication)
      sql`
        SELECT 
          o.id, o.user_id, o.status, o.total_amount, o.created_at,
          o.shipping_first_name, o.shipping_last_name, o.shipping_city, o.shipping_phone,
          u.email as customer_email,
          p.method as payment_method, p.status as payment_status,
          s.status as shipment_status, s.tracking_number, s.carrier,
          COALESCE(items.count, 0)::int as items_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN LATERAL (
          SELECT method, status FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1
        ) p ON true
        LEFT JOIN LATERAL (
          SELECT status, tracking_number, carrier FROM shipments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int as count FROM order_items WHERE order_id = o.id
        ) items ON true
        ORDER BY o.created_at DESC
        LIMIT 30
      `,

      // 2. Current period orders
      sql`
        SELECT 
          o.id, o.user_id, o.status, o.total_amount, o.created_at
        FROM orders o
        WHERE o.created_at >= ${curFrom.toISOString()} AND o.created_at <= ${curTo.toISOString()}
      `,

      // 3. Previous period orders for comparison
      sql`
        SELECT 
          o.id, o.user_id, o.status, o.total_amount, o.created_at
        FROM orders o
        WHERE o.created_at >= ${prevFrom.toISOString()} AND o.created_at <= ${prevTo.toISOString()}
      `,

      // 4. Total registered customers
      sql`SELECT COUNT(*)::int as count FROM users`,

      // 5. Unscoped orders awaiting fulfillment
      sql`SELECT COUNT(*)::int as count FROM orders WHERE status IN ('paid', 'processing', 'confirmed')`,

      // 6. Total reviews
      sql`SELECT COUNT(*)::int as count, COALESCE(AVG(rating), 0)::numeric(3,1) as avg_rating FROM reviews`,

      // 7. Coupon redemptions in period
      sql`
        SELECT cr.coupon_id, c.code, COUNT(*)::int as uses, COALESCE(SUM(cr.discount_applied), 0)::numeric(10,2) as total_discount
        FROM coupon_redemptions cr
        JOIN coupons c ON cr.coupon_id = c.id
        WHERE cr.created_at >= ${curFrom.toISOString()} AND cr.created_at <= ${curTo.toISOString()}
        GROUP BY cr.coupon_id, c.code
        ORDER BY total_discount DESC
        LIMIT 5
      `,

      // 8. Active carts count
      sql`SELECT COUNT(*)::int as count FROM carts`,
    ]);

    // Product catalog stats from products DB
    let catalogStats = {
      total_products: 0,
      active_products: 0,
      inventory_value: 0,
      out_of_stock: [] as any[],
      low_stock: [] as any[],
    };

    try {
      const { sql: prodSql } = getProductsDb(env);
      const [prodSummary, outOfStockRows] = await Promise.all([
        prodSql`
          SELECT 
            COUNT(*)::int as total,
            COUNT(CASE WHEN p.popularity >= 0 THEN 1 END)::int as active,
            COALESCE(SUM(p.price_cents), 0)::bigint as total_value
          FROM products p
        `,
        prodSql`
          SELECT p.id, p.name, p.slug, p.price_cents, b.name as brand_name
          FROM products p
          LEFT JOIN brands b ON p.brand_id = b.id
          ORDER BY p.id DESC
          LIMIT 5
        `,
      ]);

      catalogStats = {
        total_products: Number(prodSummary[0]?.total || 0),
        active_products: Number(prodSummary[0]?.active || 0),
        inventory_value: Number(prodSummary[0]?.total_value || 0),
        out_of_stock: [],
        low_stock: outOfStockRows.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price_cents: p.price_cents,
          brand: p.brand_name,
        })),
      };
    } catch (pe) {
      console.error('Failed to query products catalog DB for dashboard:', pe);
    }

    // Compute metrics for current period
    const validCurOrders = curOrdersRows.filter(o => !['cancelled', 'failed', 'refunded'].includes(o.status));
    const completedCurOrders = curOrdersRows.filter(o => ['delivered', 'shipped', 'paid'].includes(o.status));
    const pendingCurOrders = curOrdersRows.filter(o => ['pending', 'processing'].includes(o.status));
    const cancelledCurOrders = curOrdersRows.filter(o => ['cancelled', 'failed', 'refunded'].includes(o.status));

    const curRevenue = validCurOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const curOrdersCount = validCurOrders.length;
    const curAov = curOrdersCount > 0 ? Math.round((curRevenue / curOrdersCount) * 100) / 100 : 0;

    // Previous period metrics
    const validPrevOrders = prevOrdersRows.filter(o => !['cancelled', 'failed', 'refunded'].includes(o.status));
    const prevRevenue = validPrevOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const prevOrdersCount = validPrevOrders.length;
    const prevAov = prevOrdersCount > 0 ? Math.round((prevRevenue / prevOrdersCount) * 100) / 100 : 0;

    // Customer counts (based on valid orders for exact consistency)
    const curUserIds = new Set(validCurOrders.filter(o => o.user_id).map(o => o.user_id));
    const prevUserIds = new Set(validPrevOrders.filter(o => o.user_id).map(o => o.user_id));
    const curCustomerCount = curUserIds.size;
    const prevCustomerCount = prevUserIds.size;

    const revDelta = calcDelta(curRevenue, prevRevenue);
    const ordDelta = calcDelta(curOrdersCount, prevOrdersCount);
    const aovDelta = calcDelta(curAov, prevAov);
    const custDelta = calcDelta(curCustomerCount, prevCustomerCount);

    // Sparkline calculation: slice current range into 7 sub-intervals
    const totalDurationMs = Math.max(86400000, curTo.getTime() - curFrom.getTime());
    const intervalMs = Math.max(1, totalDurationMs / 7);
    const revSparkline: number[] = [];
    const orderSparkline: number[] = [];
    const aovSparkline: number[] = [];
    const custSparkline: number[] = [];

    for (let i = 0; i < 7; i++) {
      const bucketStart = curFrom.getTime() + i * intervalMs;
      const bucketEnd = bucketStart + intervalMs;
      const isLast = i === 6;
      const bucketOrders = validCurOrders.filter(o => {
        const ms = new Date(o.created_at).getTime();
        return ms >= bucketStart && (isLast ? ms <= bucketEnd : ms < bucketEnd);
      });
      const bRev = bucketOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const bCount = bucketOrders.length;
      const bAov = bCount > 0 ? Math.round((bRev / bCount) * 100) / 100 : 0;
      const bCust = new Set(bucketOrders.filter(o => o.user_id).map(o => o.user_id)).size;

      revSparkline.push(Math.round(bRev * 100) / 100);
      orderSparkline.push(bCount);
      aovSparkline.push(bAov);
      custSparkline.push(bCust);
    }

    // Trends Data (bucketed by day / interval)
    const isSingleDay = period === 'today' || (period !== 'week' && period !== 'month' && period !== 'year' && period !== 'all' && totalDurationMs <= 86400000);
    const trendBucketsCount = isSingleDay ? 8 : 7;
    const trendBucketMs = Math.max(1, totalDurationMs / trendBucketsCount);
    const trends: { date: string; label: string; revenue: number; orders: number }[] = [];

    for (let i = 0; i < trendBucketsCount; i++) {
      const bStart = new Date(curFrom.getTime() + i * trendBucketMs);
      const bEnd = new Date(bStart.getTime() + trendBucketMs);
      const isLastTrend = i === trendBucketsCount - 1;
      const bOrders = validCurOrders.filter(o => {
        const ms = new Date(o.created_at).getTime();
        return ms >= bStart.getTime() && (isLastTrend ? ms <= bEnd.getTime() : ms < bEnd.getTime());
      });

      const bRev = bOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const bCount = bOrders.length;
      const label = isSingleDay
        ? bStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : bStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      trends.push({
        date: bStart.toISOString(),
        label,
        revenue: Math.round(bRev * 100) / 100,
        orders: bCount,
      });
    }

    // Top selling products in current period
    let topProducts: any[] = [];
    try {
      const topItemsRes = await sql`
        SELECT 
          oi.product_id,
          COUNT(*)::int as orders_count,
          SUM(oi.quantity)::int as units_sold,
          SUM(oi.quantity * oi.unit_price)::numeric(10,2) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${curFrom.toISOString()} AND o.created_at <= ${curTo.toISOString()}
          AND o.status NOT IN ('cancelled', 'failed', 'refunded')
        GROUP BY oi.product_id
        ORDER BY total_revenue DESC
        LIMIT 5
      `;

      if (topItemsRes.length > 0) {
        const pIds = topItemsRes.map(r => Number(r.product_id)).filter(id => !isNaN(id));
        if (pIds.length > 0) {
          const { sql: prodSql } = getProductsDb(env);
          const prodRows = await prodSql`
            SELECT p.id, p.name, p.slug, p.price_cents, img.src as image_src
            FROM products p
            LEFT JOIN LATERAL (
              SELECT src FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1
            ) img ON true
            WHERE p.id = ANY(${pIds})
          `;
          const pMap = new Map(prodRows.map(p => [String(p.id), p]));

          topProducts = topItemsRes.map(r => {
            const p = pMap.get(String(r.product_id));
            return {
              id: Number(r.product_id),
              name: p?.name || `Product #${r.product_id}`,
              slug: p?.slug || '',
              image: p?.image_src || null,
              units_sold: Number(r.units_sold || 0),
              orders_count: Number(r.orders_count || 0),
              revenue: parseFloat(r.total_revenue || '0'),
            };
          });
        }
      }
    } catch (tpe) {
      console.error('Failed to compute top products:', tpe);
    }

    // Customer acquisition stats
    const totalRegistered = Number(registeredUsersRes[0]?.count || 0);
    const guestOrdersCount = validCurOrders.filter(o => !o.user_id).length;
    const returningCount = Math.max(0, curOrdersCount - curCustomerCount);
    const totalInteractions = Math.max(1, curCustomerCount + guestOrdersCount + returningCount);

    return {
      period,
      from: curFrom.toISOString(),
      to: curTo.toISOString(),
      kpis: {
        revenue: {
          value: curRevenue,
          previous_value: prevRevenue,
          delta_pct: revDelta.deltaPct,
          is_positive: revDelta.isPositive,
          sparkline: revSparkline,
        },
        orders: {
          value: curOrdersCount,
          completed: completedCurOrders.length,
          pending: pendingCurOrders.length,
          cancelled: cancelledCurOrders.length,
          previous_value: prevOrdersCount,
          delta_pct: ordDelta.deltaPct,
          is_positive: ordDelta.isPositive,
          sparkline: orderSparkline,
        },
        aov: {
          value: curAov,
          previous_value: prevAov,
          delta_pct: aovDelta.deltaPct,
          is_positive: aovDelta.isPositive,
          sparkline: aovSparkline,
        },
        customers: {
          value: curCustomerCount,
          total_registered: totalRegistered,
          previous_value: prevCustomerCount,
          delta_pct: custDelta.deltaPct,
          is_positive: custDelta.isPositive,
          sparkline: custSparkline,
        },
      },
      trends,
      top_products: topProducts,
      recent_orders: recentOrdersRows.map(o => ({
        id: o.id,
        status: o.status,
        total_amount: parseFloat(o.total_amount) || 0,
        customer_email: o.customer_email || 'Guest',
        customer_name: [o.shipping_first_name, o.shipping_last_name].filter(Boolean).join(' ') || 'Customer',
        city: o.shipping_city || '',
        phone: o.shipping_phone || '',
        payment_method: o.payment_method || 'N/A',
        payment_status: o.payment_status || 'N/A',
        shipment_status: o.shipment_status || null,
        tracking_number: o.tracking_number || null,
        carrier: o.carrier || null,
        items_count: Number(o.items_count || 0),
        created_at: o.created_at,
      })),
      catalog: catalogStats,
      operations_queue: {
        awaiting_fulfillment: Number(pendingFulfillmentRes[0]?.count || 0),
        active_carts: Number(cartCountRes[0]?.count || 0),
        total_reviews: Number(pendingReviewsRes[0]?.count || 0),
        store_rating: parseFloat(pendingReviewsRes[0]?.avg_rating || '0'),
      },
      top_coupons: couponRedemptionsRes.map(c => ({
        id: c.coupon_id,
        code: c.code,
        uses: Number(c.uses),
        total_discount: parseFloat(c.total_discount),
      })),
      customer_acquisition: {
        new_customers: curCustomerCount,
        returning_customers: returningCount,
        guest_orders: guestOrdersCount,
        new_pct: Math.round((curCustomerCount / totalInteractions) * 100),
        returning_pct: Math.round((returningCount / totalInteractions) * 100),
        guest_pct: Math.round((guestOrdersCount / totalInteractions) * 100),
      },
    };
  } catch (e: any) {
    console.error('Failed to generate admin dashboard metrics:', e);
    return error(500, { message: 'Failed to generate admin dashboard metrics', error: e?.message });
  }
};

adminDashboardRouter.get('/', requirePermission('analytics.view'), handleDashboardRequest);
adminDashboardRouter.get('', requirePermission('analytics.view'), handleDashboardRequest);
