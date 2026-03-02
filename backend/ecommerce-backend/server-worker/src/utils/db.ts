import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../../db/schema/index';

// Helper to initialize Drizzle with the Neon connection string from environment context
export const getDb = (env: { DATABASE_URL: string }) => {
    const sql = neon(env.DATABASE_URL);
    return { db: drizzle(sql, { schema }), sql };
};
