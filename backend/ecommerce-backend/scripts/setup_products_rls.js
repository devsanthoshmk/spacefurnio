const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL);

async function applyRLS() {
    try {
        // 1. Grant usage to authenticator just in case
        await client`GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticator`;

        // 2. Enable RLS
        await client`ALTER TABLE products ENABLE ROW LEVEL SECURITY`;

        // 3. Drop existing policies if any
        try { await client`DROP POLICY "Anyone can view products" ON products`; } catch (e) { }
        try { await client`DROP POLICY "Only admins can write products" ON products`; } catch (e) { }

        // 4. Create read policy (everyone can read)
        await client`
      CREATE POLICY "Anyone can view products"
      ON products
      FOR SELECT
      USING (true)
    `;

        // 5. Create write policy (admin only)
        await client`
      CREATE POLICY "Only admins can write products"
      ON products
      FOR ALL
      USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
      )
    `;

        console.log("RLS policies applied to products table.");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

applyRLS();
