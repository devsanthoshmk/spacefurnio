import { AutoRouter, cors } from 'itty-router';
import { authRouter } from './routes/auth';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';
import { productRouter } from './routes/products';
import { categoryRouter } from './routes/categories';
import { cartRouter } from './routes/cart';
import { wishlistRouter } from './routes/wishlist';
import { addressRouter } from './routes/addresses';
import { couponRouter } from './routes/coupons';
import { reviewRouter } from './routes/reviews';
import { engagementRouter } from './routes/engagement';
import { Env } from './types';

const { preflight, corsify } = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'Cookie']
});

const router = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({
  before: [preflight],
  finally: [corsify],
});

router.all('/auth/*', authRouter.fetch);
router.all('/api/products/*', productRouter.fetch);
router.all('/api/categories/*', categoryRouter.fetch);
router.all('/api/cart/*', cartRouter.fetch);
router.all('/api/wishlist/*', wishlistRouter.fetch);
router.all('/api/addresses/*', addressRouter.fetch);
router.all('/api/orders/*', orderRouter.fetch);
router.all('/api/coupons/*', couponRouter.fetch);
router.all('/api/reviews/*', reviewRouter.fetch);
router.all('/api/payments/*', paymentRouter.fetch);
router.all('/api/*', engagementRouter.fetch);

router.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

export default router;
