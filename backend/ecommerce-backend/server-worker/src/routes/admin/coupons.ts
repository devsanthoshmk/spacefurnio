import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb } from '../../utils/db';
import { Env } from '../../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id?: string): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

export const adminCouponRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/coupons',
});

// 1. Get Coupon Summary Stats
adminCouponRouter.get('/stats', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const { sql } = getDb(env);

    const [stats, redemptions] = await Promise.all([
      sql`
        SELECT 
          COUNT(*)::int as total_coupons,
          COUNT(CASE WHEN is_active = true AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END)::int as active_coupons,
          COUNT(CASE WHEN is_active = false AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END)::int as inactive_coupons,
          COUNT(CASE WHEN expires_at <= NOW() THEN 1 END)::int as expired_coupons
        FROM coupons
      `,
      sql`
        SELECT 
          COUNT(*)::int as total_redemptions,
          COALESCE(SUM(discount_applied), 0)::numeric(10,2) as total_discount_given
        FROM coupon_redemptions
      `,
    ]);

    const s = stats[0] || {};
    const r = redemptions[0] || {};

    return {
      total_coupons: Number(s.total_coupons || 0),
      active_coupons: Number(s.active_coupons || 0),
      inactive_coupons: Number(s.inactive_coupons || 0),
      expired_coupons: Number(s.expired_coupons || 0),
      total_redemptions: Number(r.total_redemptions || 0),
      total_discount_given: parseFloat(r.total_discount_given || '0'),
    };
  } catch (e: any) {
    console.error('Failed to get coupon stats:', e);
    return error(500, { message: 'Failed to fetch coupon statistics', error: e?.message });
  }
});

// 2. List & Filter Coupons
adminCouponRouter.get('/', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
    const search = (url.searchParams.get('search') || '').trim().toUpperCase();
    const status = (url.searchParams.get('status') || 'all').toLowerCase();
    const sort = url.searchParams.get('sort') || 'newest';

    const offset = (page - 1) * limit;
    const { sql } = getDb(env);

    const rows = await sql`
      WITH filtered_coupons AS (
        SELECT 
          c.id, c.code, c.description, c.discount_type, c.discount_value,
          c.is_active, c.expires_at, c.created_at,
          COUNT(cr.id)::int as redemptions_count,
          COALESCE(SUM(cr.discount_applied), 0)::numeric(10,2) as total_discount_applied
        FROM coupons c
        LEFT JOIN coupon_redemptions cr ON cr.coupon_id = c.id
        WHERE 
          (${search === '' ? sql`true` : sql`(c.code ILIKE ${'%' + search + '%'} OR c.description ILIKE ${'%' + search + '%'})`})
          AND (${status === 'all' ? sql`true` : (
            status === 'active' ? sql`c.is_active = true AND (c.expires_at IS NULL OR c.expires_at > NOW())` :
            status === 'expired' ? sql`c.expires_at <= NOW()` :
            status === 'inactive' ? sql`c.is_active = false AND (c.expires_at IS NULL OR c.expires_at > NOW())` :
            sql`true`
          )})
        GROUP BY c.id
      )
      SELECT 
        fc.*,
        COUNT(*) OVER() as total_count
      FROM filtered_coupons fc
      ORDER BY 
        ${sort === 'code_asc' ? sql`fc.code ASC` :
          sort === 'code_desc' ? sql`fc.code DESC` :
          sort === 'uses_desc' ? sql`fc.redemptions_count DESC` :
          sort === 'uses_asc' ? sql`fc.redemptions_count ASC` :
          sort === 'discount_desc' ? sql`fc.total_discount_applied DESC` :
          sort === 'discount_asc' ? sql`fc.total_discount_applied ASC` :
          sort === 'oldest' ? sql`fc.created_at ASC` :
          sql`fc.created_at DESC`}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

    return {
      coupons: rows.map(c => {
        const isExpired = Boolean(c.expires_at && new Date(c.expires_at) <= new Date());
        const computedStatus = isExpired ? 'EXPIRED' : (!c.is_active ? 'INACTIVE' : 'ACTIVE');
        const numVal = parseFloat(c.discount_value);

        return {
          id: c.id,
          code: c.code,
          description: c.description,
          discount_type: c.discount_type,
          discount_value: numVal,
          discount_formatted: c.discount_type === 'percentage' ? `${numVal}%` : `₹${numVal}`,
          is_active: Boolean(c.is_active),
          status: computedStatus,
          expires_at: c.expires_at,
          redemptions_count: Number(c.redemptions_count || 0),
          total_discount_applied: parseFloat(c.total_discount_applied || '0'),
          created_at: c.created_at,
        };
      }),
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
    console.error('Failed to list admin coupons:', e);
    return error(500, { message: 'Failed to fetch coupons', error: e?.message });
  }
});

// 3. Get Single Coupon Detail + Redemptions
adminCouponRouter.get('/:id', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Coupon not found' });
    }

    const { sql } = getDb(env);

    const [couponRows, redemptionsStats, redemptions] = await Promise.all([
      sql`
        SELECT id, code, description, discount_type, discount_value, is_active, expires_at, created_at
        FROM coupons
        WHERE id = ${id}
        LIMIT 1
      `,
      sql`
        SELECT 
          COUNT(*)::int as total_redemptions,
          COALESCE(SUM(discount_applied), 0)::numeric(10,2) as total_discount_given
        FROM coupon_redemptions
        WHERE coupon_id = ${id}
      `,
      sql`
        SELECT 
          cr.id, cr.order_id, cr.user_id, cr.discount_applied, cr.created_at,
          u.email as user_email,
          o.total_amount as order_total, o.status as order_status
        FROM coupon_redemptions cr
        LEFT JOIN users u ON cr.user_id = u.id
        LEFT JOIN orders o ON cr.order_id = o.id
        WHERE cr.coupon_id = ${id}
        ORDER BY cr.created_at DESC
        LIMIT 50
      `,
    ]);

    if (couponRows.length === 0) {
      return error(404, { message: 'Coupon not found' });
    }

    const coupon = couponRows[0];
    const rStats = redemptionsStats[0] || {};
    const isExpired = Boolean(coupon.expires_at && new Date(coupon.expires_at) <= new Date());
    const computedStatus = isExpired ? 'EXPIRED' : (!coupon.is_active ? 'INACTIVE' : 'ACTIVE');
    const numVal = parseFloat(coupon.discount_value);

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: numVal,
        discount_formatted: coupon.discount_type === 'percentage' ? `${numVal}%` : `₹${numVal}`,
        is_active: Boolean(coupon.is_active),
        status: computedStatus,
        expires_at: coupon.expires_at,
        created_at: coupon.created_at,
      },
      stats: {
        total_redemptions: Number(rStats.total_redemptions || 0),
        total_discount_given: parseFloat(rStats.total_discount_given || '0'),
      },
      redemptions: redemptions.map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        user_id: r.user_id,
        user_email: r.user_email || 'Guest',
        discount_applied: parseFloat(r.discount_applied || '0'),
        order_total: parseFloat(r.order_total || '0'),
        order_status: r.order_status,
        created_at: r.created_at,
      })),
    };
  } catch (e: any) {
    console.error('Failed to get coupon detail:', e);
    return error(500, { message: 'Failed to fetch coupon details', error: e?.message });
  }
});

// 4. Create Coupon
adminCouponRouter.post('/', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const {
      code,
      description = '',
      discount_type = 'percentage',
      discount_value,
      is_active = true,
      expires_at = null,
    } = body || {};

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return error(400, { message: 'Coupon code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!['percentage', 'fixed_amount'].includes(discount_type)) {
      return error(400, { message: 'discount_type must be "percentage" or "fixed_amount"' });
    }

    const numValue = Number(discount_value);
    if (discount_value === undefined || isNaN(numValue) || numValue <= 0) {
      return error(400, { message: 'discount_value must be a positive number' });
    }

    if (discount_type === 'percentage' && numValue > 100) {
      return error(400, { message: 'Percentage discount cannot exceed 100%' });
    }

    let parsedExpiresAt: Date | null = null;
    if (expires_at) {
      const d = new Date(expires_at);
      if (isNaN(d.getTime())) {
        return error(400, { message: 'Invalid expires_at date format' });
      }
      parsedExpiresAt = d;
    }

    const { sql } = getDb(env);

    // Check duplicate code
    const existing = await sql`SELECT id FROM coupons WHERE UPPER(code) = ${normalizedCode} LIMIT 1`;
    if (existing.length > 0) {
      return error(409, { message: `Coupon with code "${normalizedCode}" already exists` });
    }

    const couponId = crypto.randomUUID();
    const inserted = await sql`
      INSERT INTO coupons (
        id, code, description, discount_type, discount_value, is_active, expires_at, created_at
      )
      VALUES (
        ${couponId}, ${normalizedCode}, ${description || ''}, ${discount_type}, ${numValue.toFixed(2)},
        ${Boolean(is_active)}, ${parsedExpiresAt}, NOW()
      )
      RETURNING *
    `;

    return {
      success: true,
      message: 'Coupon created successfully',
      coupon: inserted[0],
    };
  } catch (e: any) {
    console.error('Failed to create coupon:', e);
    return error(500, { message: 'Failed to create coupon', error: e?.message });
  }
});

// 5. Update Coupon
adminCouponRouter.put('/:id', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Coupon not found' });
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const { code, description, discount_type, discount_value, is_active, expires_at } = body || {};

    const { sql } = getDb(env);

    const existing = await sql`SELECT id, code, discount_type, discount_value FROM coupons WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Coupon not found' });
    }

    let normalizedCode: string | undefined = undefined;
    if (code !== undefined) {
      if (typeof code !== 'string' || code.trim().length === 0) {
        return error(400, { message: 'Coupon code cannot be empty' });
      }
      normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== existing[0].code) {
        const duplicate = await sql`SELECT id FROM coupons WHERE UPPER(code) = ${normalizedCode} AND id != ${id} LIMIT 1`;
        if (duplicate.length > 0) {
          return error(409, { message: `Coupon code "${normalizedCode}" is already in use` });
        }
      }
    }

    if (discount_type !== undefined && !['percentage', 'fixed_amount'].includes(discount_type)) {
      return error(400, { message: 'discount_type must be "percentage" or "fixed_amount"' });
    }

    let numValue: number | undefined = undefined;
    if (discount_value !== undefined) {
      numValue = Number(discount_value);
      if (isNaN(numValue) || numValue <= 0) {
        return error(400, { message: 'discount_value must be a positive number' });
      }
    }

    const effectiveType = discount_type !== undefined ? discount_type : existing[0].discount_type;
    const effectiveValue = numValue !== undefined ? numValue : parseFloat(existing[0].discount_value);

    if (effectiveType === 'percentage' && effectiveValue > 100) {
      return error(400, { message: 'Percentage discount cannot exceed 100%' });
    }

    let parsedExpiresAt: Date | null | undefined = undefined;
    if (expires_at !== undefined) {
      if (expires_at === null || expires_at === '') {
        parsedExpiresAt = null;
      } else {
        const d = new Date(expires_at);
        if (isNaN(d.getTime())) {
          return error(400, { message: 'Invalid expires_at date format' });
        }
        parsedExpiresAt = d;
      }
    }

    const updated = await sql`
      UPDATE coupons
      SET 
        code = ${normalizedCode !== undefined ? normalizedCode : sql`code`},
        description = ${description !== undefined ? description : sql`description`},
        discount_type = ${discount_type !== undefined ? discount_type : sql`discount_type`},
        discount_value = ${numValue !== undefined ? numValue.toFixed(2) : sql`discount_value`},
        is_active = ${is_active !== undefined ? Boolean(is_active) : sql`is_active`},
        expires_at = ${parsedExpiresAt !== undefined ? parsedExpiresAt : sql`expires_at`}
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      success: true,
      message: 'Coupon updated successfully',
      coupon: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to update coupon:', e);
    return error(500, { message: 'Failed to update coupon', error: e?.message });
  }
});

// 6. Quick Toggle Active Status
adminCouponRouter.patch('/:id/toggle', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Coupon not found' });
    }

    const { sql } = getDb(env);

    const existing = await sql`SELECT id, is_active, code FROM coupons WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Coupon not found' });
    }

    const nextActive = !existing[0].is_active;

    const updated = await sql`
      UPDATE coupons 
      SET is_active = ${nextActive} 
      WHERE id = ${id} 
      RETURNING id, code, is_active
    `;

    return {
      success: true,
      is_active: nextActive,
      message: `Coupon "${existing[0].code}" ${nextActive ? 'activated' : 'deactivated'} successfully`,
      coupon: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to toggle coupon status:', e);
    return error(500, { message: 'Failed to toggle coupon', error: e?.message });
  }
});

// 7. Delete Coupon
adminCouponRouter.delete('/:id', requirePermission('marketing.coupons'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Coupon not found' });
    }

    const { sql } = getDb(env);

    const existing = await sql`SELECT id, code FROM coupons WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Coupon not found' });
    }

    // Delete associated redemptions first to maintain referential integrity
    await sql`DELETE FROM coupon_redemptions WHERE coupon_id = ${id}`;
    await sql`DELETE FROM coupons WHERE id = ${id}`;

    return {
      success: true,
      message: `Coupon "${existing[0].code}" deleted successfully`,
    };
  } catch (e: any) {
    console.error('Failed to delete coupon:', e);
    return error(500, { message: 'Failed to delete coupon', error: e?.message });
  }
});
