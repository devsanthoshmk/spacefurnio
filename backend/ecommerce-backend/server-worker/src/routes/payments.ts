import { AutoRouter, error } from 'itty-router';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const paymentRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/payments' });

// User ONLY: Verify razorpay payment
paymentRouter.post('/verify', authenticate, async (request, env) => {
    try {
        const body = await request.json() as any;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        const userId = request.user.sub;

        // Mock verification logic here
        // if (computedSignature === razorpay_signature) {
        //     await updateOrderPaymentStatusToPaid(razorpay_order_id)
        //     return { message: 'Payment verified successfully' }
        // }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return error(400, { message: 'Missing Razorpay properties' });
        }

        return { message: 'Payment verified successfully (Mock)', orderId: razorpay_order_id, paymentId: razorpay_payment_id };
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Payment verification failed' });
    }
});
