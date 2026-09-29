import { AutoRouter, error } from 'itty-router';
import { getDb } from '../utils/db';
import { Env } from '../types';
import { getUserFromRequest } from '../middleware/auth';

export const couponRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api/coupons' });

// Get active public coupons
couponRouter.get('/active', async (request, env) => {
    try {
        const { sql } = getDb(env);

        const coupons = await sql`
            SELECT id, code, description, discount_type, discount_value, expires_at
            FROM coupons
            WHERE is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY created_at DESC
        `;

        return coupons.map(c => ({
            id: c.id,
            code: c.code,
            description: c.description,
            discount_type: c.discount_type,
            discount_value: parseFloat(c.discount_value),
            expires_at: c.expires_at,
        }));
    } catch (e: any) {
        console.error('Failed to get active coupons:', e);
        return error(500, { message: 'Failed to fetch coupons' });
    }
});

// Validate coupon code against subtotal
couponRouter.post('/validate', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { code, subtotal = 0 } = body;

        if (!code || typeof code !== 'string') {
            return error(400, { message: 'Coupon code is required' });
        }

        const normalizedCode = code.trim().toUpperCase();
        const { sql } = getDb(env);

        const coupons = await sql`
            SELECT id, code, description, discount_type, discount_value, is_active, expires_at
            FROM coupons
            WHERE UPPER(code) = ${normalizedCode}
            LIMIT 1
        `;

        if (coupons.length === 0) {
            return error(404, { valid: false, message: 'Invalid coupon code' });
        }

        const coupon = coupons[0];

        if (!coupon.is_active) {
            return error(400, { valid: false, message: 'This coupon is no longer active' });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return error(400, { valid: false, message: 'This coupon has expired' });
        }

        const numericSubtotal = Number(subtotal) || 0;
        const discountVal = parseFloat(coupon.discount_value);
        let discountAmount = 0;

        if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round((numericSubtotal * (discountVal / 100)) * 100) / 100;
        } else {
            // Fixed amount
            discountAmount = Math.min(numericSubtotal, discountVal);
        }

        const finalAmount = Math.max(0, Math.round((numericSubtotal - discountAmount) * 100) / 100);

        return {
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: discountVal,
            },
            subtotal: numericSubtotal,
            discount_amount: discountAmount,
            final_amount: finalAmount,
        };
    } catch (e: any) {
        console.error('Failed to validate coupon:', e);
        return error(500, { message: 'Failed to validate coupon' });
    }
});
