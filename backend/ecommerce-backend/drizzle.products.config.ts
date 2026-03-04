import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    schema: "./db/products-schema/index.ts",
    out: "./db/products-migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.PRODUCTS_DATABASE_URL || "postgresql://authenticator@icy-union-81751721-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require", // Placeholder URL for type safety, user will override as neondb_owner
    },
});
