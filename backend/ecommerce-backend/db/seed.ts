import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { roles, users, userRoles } from "./schema/users";

config({ path: ".env" });

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

async function seed() {
    try {
        console.log("Seeding initial data...");

        // 1. Insert roles
        await db.insert(roles).values([
            { id: 'admin', description: 'System Administrator' },
            { id: 'vendor', description: 'Product Vendor' },
            { id: 'customer', description: 'Regular Customer' },
            { id: 'support', description: 'Customer Support' },
        ]).onConflictDoNothing();

        // 2. Insert Super Admin User
        const adminEmail = process.env.SUPERADMIN_EMAIL || "admin@store.com";

        const [adminUser] = await db.insert(users).values({
            email: adminEmail,
            passwordHash: 'dummy_hash_or_oauth_provider_id', // Handle securely in real scenario
            isActive: true,
        }).returning({ id: users.id }).onConflictDoNothing();

        if (adminUser) {
            // 3. Assign admin role
            await db.insert(userRoles).values({
                userId: adminUser.id,
                roleId: 'admin'
            }).onConflictDoNothing();
            console.log(`Admin user created with email: ${adminEmail}`);
        } else {
            console.log(`Admin user ${adminEmail} already exists.`);
        }

        console.log("Seeding complete!");
    } catch (error) {
        console.error("Seeding failed!", error);
    } finally {
        await client.end();
    }
}

seed();
