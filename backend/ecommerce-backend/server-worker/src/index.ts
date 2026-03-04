import { AutoRouter, cors } from 'itty-router';
import { authRouter } from './routes/auth';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';
import { productRouter } from './routes/products';
import { Env } from './types';

const { preflight, corsify } = cors({
	origin: '*',
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization']
});

const router = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({
	before: [preflight],
	finally: [corsify],
});

router.all('/auth/*', authRouter.fetch);
router.all('/api/orders/*', orderRouter.fetch);
router.all('/api/payments/*', paymentRouter.fetch);
router.all('/api/products/*', productRouter.fetch);

router.get('/health', () => ({ status: 'ok' }));

// For local dev, you can use `export default router;`
// wrangler dynamically maps to fetch event.
export default router;
