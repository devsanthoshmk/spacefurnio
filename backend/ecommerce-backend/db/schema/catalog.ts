import { pgTable, text, timestamp, integer, uuid, boolean, decimal } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    price: integer('price').notNull(),
    brand: text('brand'),
    category: text('category'),
    material: text('material'),
    rating: decimal('rating', { precision: 3, scale: 1 }),
    reviews: integer('reviews').default(0),
    popularity: integer('popularity').default(0),
    imageSrc: text('image_src'),
    imageAlt: text('image_alt'),
    href: text('href'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
