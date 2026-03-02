import { AutoRouter, error } from 'itty-router';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const orderRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/orders' });

// Only an authenticated user can place their own order.
orderRouter.post('/checkout', authenticate, async (request, env) => {
    try {
        const body = await request.json() as any;
        const { cartItems, shippingAddressId, paymentMethod } = body;
        const userId = request.user.sub;

        const { sql } = getDb(env);

        // Pseudocode database operations:
        // 1. Calculate total server-side
        // 2. Wrap via Database Transaction:
        //    - Insert into `orders`
        //    - Insert into `order_items`
        //    - Insert into `payments`
        //    - Insert into `order_status_history`

        return { message: 'Order created securely via backend' };
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Failed to process checkout' });
    }
});

// Admin only order status update
orderRouter.put('/:orderId/status', authenticate, requireRole('admin'), async (request, env) => {
    try {
        const body = await request.json() as any;
        const { status, trackingNumber } = body;
        const { orderId } = request.params;

        // Pseudocode ops...
        return { message: `Order ${orderId} status securely updated to ${status}` };
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Failed to update order' });
    }
});
