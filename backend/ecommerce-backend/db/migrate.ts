import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from "dotenv";

config({ path: ".env" });

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
    try {
        console.log("Starting migrations via postgres-js...");
        await migrate(db, { migrationsFolder: "db/migrations" });
        console.log("Migrations applied successfully!");
    } catch (error) {
        console.error("Migration failed!", error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

main();
