import { AutoRouter, cors } from 'itty-router';
import { authRouter } from './routes/auth';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';
import { productRouter } from './routes/products';
import { cartRouter } from './routes/cart';
import { wishlistRouter } from './routes/wishlist';
import { addressRouter } from './routes/addresses';
import { Env } from './types';

const { preflight, corsify } = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-session-id']
});

const router = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({
  before: [preflight],
  finally: [corsify],
});

router.all('/auth/*', authRouter.fetch);
router.all('/api/orders/*', orderRouter.fetch);
router.all('/api/payments/*', paymentRouter.fetch);
router.all('/api/products/*', productRouter.fetch);
router.all('/api/cart/*', cartRouter.fetch);
router.all('/api/wishlist/*', wishlistRouter.fetch);
router.all('/api/addresses/*', addressRouter.fetch);

router.get('/health', () => ({ status: 'ok' }));

// For local dev, you can use `export default router;`
// wrangler dynamically maps to fetch event.
export default router;
