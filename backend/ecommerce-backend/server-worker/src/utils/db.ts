import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../../db/schema/index';
import * as productSchema from '../../../db/products-schema/index';

// Helper to initialize Drizzle with the main database Neon connection string
export const getDb = (env: { DATABASE_URL: string }) => {
    const sql = neon(env.DATABASE_URL);
    return { db: drizzle(sql, { schema }), sql };
};

// Helper to initialize Drizzle isolated for products against the catalog Neon project
export const getProductsDb = (env: { PRODUCTS_DATABASE_URL: string }) => {
    if (!env.PRODUCTS_DATABASE_URL) throw new Error("PRODUCTS_DATABASE_URL environment binding is missing. Set it via wrangler secret put PRODUCTS_DATABASE_URL");
    const sql = neon(env.PRODUCTS_DATABASE_URL);
    return { db: drizzle(sql, { schema: productSchema }), sql };
};
