import { AutoRouter } from 'itty-router';
import { adminDashboardRouter } from './dashboard';
import { adminProductRouter } from './products';
import { adminOrderRouter } from './orders';
import { adminCustomerRouter } from './customers';
import { adminReviewRouter } from './reviews';
import { adminCouponRouter } from './coupons';
import { adminImageRouter } from './images';
import { adminTeamRouter } from './team';
import { AdminAuthRequest } from '../../middleware/adminAuth';
import { Env } from '../../types';

export const adminRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin',
});

adminRouter.all('/dashboard/*', adminDashboardRouter.fetch);
adminRouter.all('/dashboard', adminDashboardRouter.fetch);

adminRouter.all('/products/*', adminProductRouter.fetch);
adminRouter.all('/products', adminProductRouter.fetch);

adminRouter.all('/orders/*', adminOrderRouter.fetch);
adminRouter.all('/orders', adminOrderRouter.fetch);

adminRouter.all('/customers/*', adminCustomerRouter.fetch);
adminRouter.all('/customers', adminCustomerRouter.fetch);

adminRouter.all('/reviews/*', adminReviewRouter.fetch);
adminRouter.all('/reviews', adminReviewRouter.fetch);

adminRouter.all('/coupons/*', adminCouponRouter.fetch);
adminRouter.all('/coupons', adminCouponRouter.fetch);

adminRouter.all('/images/*', adminImageRouter.fetch);
adminRouter.all('/images', adminImageRouter.fetch);

adminRouter.all('/team/*', adminTeamRouter.fetch);
adminRouter.all('/team', adminTeamRouter.fetch);
