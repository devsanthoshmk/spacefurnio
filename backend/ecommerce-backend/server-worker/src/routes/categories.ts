import { AutoRouter, error } from 'itty-router';
import { getProductsDb } from '../utils/db';
import { Env } from '../types';

export const categoryRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api/categories' });

// Get all categories with product count
categoryRouter.get('/', async (request, env) => {
    try {
        const { sql } = getProductsDb(env);

        const categories = await sql`
            SELECT 
                c.id, c.name, c.slug, c.created_at,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id
            ORDER BY c.name ASC
        `;

        return categories.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            product_count: Number(c.product_count || 0),
            created_at: c.created_at,
        }));
    } catch (e: any) {
        console.error('Failed to get categories:', e);
        return error(500, { message: 'Failed to fetch categories' });
    }
});

// Get category by slug or id with products
categoryRouter.get('/:slugOrId', async (request, env) => {
    try {
        const { slugOrId } = request.params;
        const { sql } = getProductsDb(env);
        const isNumeric = /^\d+$/.test(slugOrId);

        const categories = await sql`
            SELECT id, name, slug, created_at
            FROM categories
            WHERE ${isNumeric ? sql`id = ${Number(slugOrId)}` : sql`slug = ${slugOrId}`}
            LIMIT 1
        `;

        if (categories.length === 0) {
            return error(404, { message: 'Category not found' });
        }

        const category = categories[0];

        const products = await sql`
            SELECT 
                p.id, p.name, p.slug, p.description, p.price_cents, p.rating, p.review_count, p.popularity,
                b.name as brand_name, b.slug as brand_slug,
                img.src as primary_image_src, img.alt as primary_image_alt
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN LATERAL (
                SELECT src, alt 
                FROM product_images 
                WHERE product_id = p.id 
                ORDER BY is_primary DESC, sort_order ASC, id ASC 
                LIMIT 1
            ) img ON true
            WHERE p.category_id = ${category.id}
            ORDER BY p.popularity DESC
            LIMIT 50
        `;

        return {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                created_at: category.created_at,
            },
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price_cents: p.price_cents,
                rating: Number(p.rating || 0),
                review_count: p.review_count,
                popularity: p.popularity,
                brand: p.brand_name ? { name: p.brand_name, slug: p.brand_slug } : null,
                primary_image: p.primary_image_src ? { src: p.primary_image_src, alt: p.primary_image_alt } : null,
            })),
        };
    } catch (e: any) {
        console.error('Failed to get category:', e);
        return error(500, { message: 'Failed to fetch category details' });
    }
});
