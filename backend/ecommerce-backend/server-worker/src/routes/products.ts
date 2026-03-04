import { AutoRouter, error } from 'itty-router';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getProductsDb } from '../utils/db';
import { Env } from '../types';

export const productRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/products' });

// Admin only: create a new product
productRouter.post('/', authenticate, requireRole('admin'), async (request, env) => {
    try {
        const body = await request.json() as any;
        const { name, slug, description, price_cents, brand_id, category_id, space_id, style_id, room_id, material_id, listing_type, rating, review_count, popularity, href } = body;
        const { sql } = getProductsDb(env);

        const result = await sql`
           INSERT INTO products (name, slug, description, price_cents, brand_id, category_id, space_id, style_id, room_id, material_id, listing_type, rating, review_count, popularity, href)
           VALUES (${name}, ${slug}, ${description || null}, ${price_cents}, ${brand_id}, ${category_id || null}, ${space_id || null}, ${style_id || null}, ${room_id || null}, ${material_id || null}, ${listing_type || 'category'}, ${rating || 0}, ${review_count || 0}, ${popularity || 0}, ${href || null})
           RETURNING id, name, slug
        `;

        return { message: 'Product created successfully', product: result[0] };
    } catch (e: any) {
        console.error(e);
        return error(500, { message: 'Failed to create product', detail: e?.message });
    }
});

// Admin only: update a product
productRouter.put('/:productId', authenticate, requireRole('admin'), async (request, env) => {
    try {
        const body = await request.json() as any;
        const { productId } = request.params;
        const { sql } = getProductsDb(env);

        const fields: string[] = [];
        const values: any = {};

        // Build dynamic update — only touch fields that were provided
        if (body.name !== undefined) values.name = body.name;
        if (body.slug !== undefined) values.slug = body.slug;
        if (body.description !== undefined) values.description = body.description;
        if (body.price_cents !== undefined) values.price_cents = body.price_cents;
        if (body.brand_id !== undefined) values.brand_id = body.brand_id;
        if (body.category_id !== undefined) values.category_id = body.category_id;
        if (body.listing_type !== undefined) values.listing_type = body.listing_type;

        const result = await sql`
            UPDATE products 
            SET name = COALESCE(${body.name || null}, name),
                slug = COALESCE(${body.slug || null}, slug),
                price_cents = COALESCE(${body.price_cents || null}, price_cents),
                updated_at = NOW()
            WHERE id = ${Number(productId)}
            RETURNING id, name, slug
        `;

        if (result.length === 0) return error(404, { message: 'Product not found' });
        return { message: 'Product updated successfully', product: result[0] };
    } catch (e: any) {
        console.error(e);
        return error(500, { message: 'Failed to update product', detail: e?.message });
    }
});

// Admin only: delete a product
productRouter.delete('/:productId', authenticate, requireRole('admin'), async (request, env) => {
    try {
        const { productId } = request.params;
        const { sql } = getProductsDb(env);

        const result = await sql`
            DELETE FROM products WHERE id = ${Number(productId)} RETURNING id
        `;

        if (result.length === 0) return error(404, { message: 'Product not found' });
        return { message: `Product ${productId} deleted successfully` };
    } catch (e: any) {
        console.error(e);
        return error(500, { message: 'Failed to delete product', detail: e?.message });
    }
});
