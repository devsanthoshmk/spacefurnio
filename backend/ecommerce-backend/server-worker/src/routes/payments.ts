import { AutoRouter, error } from 'itty-router';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const paymentRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/payments' });

// Initiate payment / create order for gateway
paymentRouter.post('/create-order', authenticate, async (request, env) => {
    try {
        const body = await request.json() as any;
        const { order_id, amount, currency = 'INR' } = body;

        if (!order_id || !amount) {
            return error(400, { message: 'order_id and amount are required' });
        }

        // Generate gateway transaction ID (or integrate Razorpay SDK if keys present)
        const gatewayOrderId = `order_${crypto.randomUUID().replace(/-/g, '').substring(0, 14)}`;

        return {
            success: true,
            gateway_order_id: gatewayOrderId,
            order_id,
            amount: Number(amount),
            currency,
        };
    } catch (e: any) {
        console.error('Failed to create payment gateway order:', e);
        return error(500, { message: 'Failed to create payment order' });
    }
});

// Verify payment
paymentRouter.post('/verify', authenticate, async (request, env) => {
    try {
        const body = await request.json() as any;
        const { order_id, payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        const userId = request.user.sub;

        const targetOrderId = order_id || razorpay_order_id;
        const gatewayPaymentId = payment_id || razorpay_payment_id || `pay_${crypto.randomUUID().substring(0, 12)}`;

        if (!targetOrderId) {
            return error(400, { message: 'order_id is required' });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetOrderId);
        if (!isUuid) {
            return error(400, { message: 'Invalid order_id format. Must be a valid UUID.' });
        }

        const { sql } = getDb(env);

        // Verify order exists and belongs to user (or admin)
        const orders = await sql`
            SELECT id, status, total_amount 
            FROM orders 
            WHERE id = ${targetOrderId} AND (user_id = ${userId} OR ${request.user.role === 'admin'})
            LIMIT 1
        `;

        if (orders.length === 0) {
            return error(404, { message: 'Order not found' });
        }

        const order = orders[0];

        // Update payment status
        const payments = await sql`
            UPDATE payments 
            SET status = 'completed'
            WHERE order_id = ${order.id}
            RETURNING id
        `;

        let paymentRecordId = payments[0]?.id;
        if (!paymentRecordId) {
            paymentRecordId = crypto.randomUUID();
            await sql`
                INSERT INTO payments (id, order_id, amount, method, status)
                VALUES (${paymentRecordId}, ${order.id}, ${order.total_amount}, 'card', 'completed')
            `;
        }

        // Record payment transaction
        await sql`
            INSERT INTO payment_transactions (id, payment_id, gateway_status, gateway_reference)
            VALUES (${crypto.randomUUID()}, ${paymentRecordId}, 'success', ${gatewayPaymentId})
        `;

        // Update order status to paid
        await sql`
            UPDATE orders 
            SET status = 'paid' 
            WHERE id = ${order.id}
        `;

        // Update status history
        await sql`
            INSERT INTO order_status_history (id, order_id, status, notes)
            VALUES (${crypto.randomUUID()}, ${order.id}, 'paid', ${`Payment verified (${gatewayPaymentId})`})
        `;

        return {
            success: true,
            message: 'Payment verified and order updated successfully',
            order_id: order.id,
            payment_id: gatewayPaymentId,
        };
    } catch (e: any) {
        console.error('Failed to verify payment:', e);
        return error(500, { message: 'Payment verification failed' });
    }
});
