const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

// Just simple raw SQL for insertion, it's easier to avoid full drizzle schema logic right now
async function seedProducts() {
    const dir = '../../../frontend/public/data/products';
    const files = ['category-products.json', 'design-space-products.json', 'design-style-products.json'];

    for (const file of files) {
        const dataPath = path.join(__dirname, dir, file);
        try {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            for (const item of data) {
                // Some IDs might be integers, so we'll store them as string
                const id = String(item.id);
                const name = item.name;
                const price = item.price || 0;
                const brand = item.brand || '';
                const category = item.category || '';
                const material = item.material || '';
                const rating = item.rating || 0;
                const reviews = item.reviews || 0;
                const popularity = item.popularity || 0;
                const imageSrc = item.imageSrc || '';
                const imageAlt = item.imageAlt || '';
                const href = item.href || '';

                await client`
           INSERT INTO products (id, name, description, price, brand, category, material, rating, reviews, popularity, image_src, image_alt, href, is_active)
           VALUES (${id}, ${name}, '', ${price}, ${brand}, ${category}, ${material}, ${rating}, ${reviews}, ${popularity}, ${imageSrc}, ${imageAlt}, ${href}, true)
           ON CONFLICT (id) DO NOTHING
         `;
            }
            console.log(`Successfully seeded ${file}`);
        } catch (e) {
            console.error(`Failed to seed ${file}`, e);
        }
    }
    await client.end();
}

seedProducts().then(() => console.log('Seeding complete')).catch(console.error);
