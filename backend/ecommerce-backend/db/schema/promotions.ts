import { pgTable, text, timestamp, uuid, decimal, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { orders } from './orders';

export const coupons = pgTable('coupons', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(),
    description: text('description'),
    discountType: text('discount_type').notNull(), // 'percentage', 'fixed_amount'
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const couponRedemptions = pgTable('coupon_redemptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id').notNull().references(() => coupons.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    orderId: uuid('order_id').notNull().references(() => orders.id),
    discountApplied: decimal('discount_applied', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const couponsRelations = relations(coupons, ({ many }) => ({
    redemptions: many(couponRedemptions),
}));

export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
    coupon: one(coupons, { fields: [couponRedemptions.couponId], references: [coupons.id] }),
    user: one(users, { fields: [couponRedemptions.userId], references: [users.id] }),
    order: one(orders, { fields: [couponRedemptions.orderId], references: [orders.id] }),
}));
