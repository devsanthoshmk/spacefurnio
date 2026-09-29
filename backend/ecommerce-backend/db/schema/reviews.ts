import { pgTable, text, timestamp, uuid, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: integer('product_id').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    rating: integer('rating').notNull(), // 1 to 5
    title: text('title'),
    comment: text('comment').notNull(),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    productIdx: index('reviews_product_id_idx').on(t.productId),
    userIdx: index('reviews_user_id_idx').on(t.userId),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));
