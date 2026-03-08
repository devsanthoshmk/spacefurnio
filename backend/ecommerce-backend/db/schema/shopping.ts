import { pgTable, timestamp, uuid, integer, decimal, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const carts = pgTable('carts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(), // FK removed — products live in separate Neon project (icy-union-81751721), uses INT
  quantity: integer('quantity').notNull().default(1),
  priceSnapshot: decimal('price_snapshot', { precision: 10, scale: 2 }).notNull(), // To prevent price change issues
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.cartId, t.productId), // Prevent duplicates in cart
}));

export const wishlists = pgTable('wishlists', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wishlistItems = pgTable('wishlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  wishlistId: uuid('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(), // FK removed — products live in separate Neon project (icy-union-81751721), uses INT
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.wishlistId, t.productId),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
    user: one(users, { fields: [carts.userId], references: [users.id] }),
    items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
    // product relation removed — products are in a separate Neon project
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
    user: one(users, { fields: [wishlists.userId], references: [users.id] }),
    items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
    wishlist: one(wishlists, { fields: [wishlistItems.wishlistId], references: [wishlists.id] }),
    // product relation removed — products are in a separate Neon project
}));
