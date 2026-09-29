import { pgTable, serial, varchar, text, integer, smallint, numeric, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enum for listing type
export const listingTypeEnum = pgEnum('listing_type', ['category', 'space', 'style']);

// ============= LOOKUP TABLES =============

export const brands = pgTable('brands', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const colors = pgTable('colors', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    hexCode: varchar('hex_code', { length: 7 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const materials = pgTable('materials', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const spaces = pgTable('spaces', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const styles = pgTable('styles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rooms = pgTable('rooms', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============= PRODUCTS TABLE =============

export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 250 }).notNull().unique(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    brandId: integer('brand_id').notNull().references(() => brands.id),
    categoryId: integer('category_id').references(() => categories.id),
    spaceId: integer('space_id').references(() => spaces.id),
    styleId: integer('style_id').references(() => styles.id),
    roomId: integer('room_id').references(() => rooms.id),
    materialId: integer('material_id').references(() => materials.id),
    listingType: listingTypeEnum('listing_type').notNull(),
    rating: numeric('rating', { precision: 3, scale: 1 }).notNull().default('0'),
    reviewCount: integer('review_count').notNull().default(0),
    popularity: smallint('popularity').notNull().default(0),
    href: varchar('href', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============= JUNCTION TABLES =============

export const productColors = pgTable('product_colors', {
    productId: integer('product_id').notNull().references(() => products.id),
    colorId: integer('color_id').notNull().references(() => colors.id),
    sortOrder: smallint('sort_order').notNull().default(0),
});

export const productImages = pgTable('product_images', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().references(() => products.id),
    src: text('src').notNull(),
    alt: varchar('alt', { length: 200 }),
    sortOrder: smallint('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
