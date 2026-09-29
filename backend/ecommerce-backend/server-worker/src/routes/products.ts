import { AutoRouter, error } from 'itty-router';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getProductsDb } from '../utils/db';
import { Env } from '../types';

export const productRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/products' });

// Get filter metadata (categories, spaces, styles, rooms, materials, brands, colors, price range)
productRouter.get('/filters', async (request, env) => {
    try {
        const { sql } = getProductsDb(env);

        const [categories, spaces, styles, rooms, materials, brands, colors, priceStats] = await Promise.all([
            sql`SELECT id, name, slug FROM categories ORDER BY name ASC`,
            sql`SELECT id, name, slug FROM spaces ORDER BY name ASC`,
            sql`SELECT id, name, slug FROM styles ORDER BY name ASC`,
            sql`SELECT id, name, slug FROM rooms ORDER BY name ASC`,
            sql`SELECT id, name FROM materials ORDER BY name ASC`,
            sql`SELECT id, name, slug FROM brands ORDER BY name ASC`,
            sql`SELECT id, name, hex_code FROM colors ORDER BY name ASC`,
            sql`SELECT MIN(price_cents) as min_price, MAX(price_cents) as max_price, COUNT(*) as total_count FROM products`,
        ]);

        return {
            categories,
            spaces,
            styles,
            rooms,
            materials,
            brands,
            colors,
            price_range: {
                min: Number(priceStats[0]?.min_price || 0),
                max: Number(priceStats[0]?.max_price || 0),
            },
            total_products: Number(priceStats[0]?.total_count || 0),
        };
    } catch (e: any) {
        console.error('Failed to get filters:', e);
        return error(500, { message: 'Failed to fetch filter options' });
    }
});

// Get featured / trending products
productRouter.get('/featured', async (request, env) => {
    try {
        const { sql } = getProductsDb(env);
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get('limit') || 8), 24);

        const rows = await sql`
            SELECT 
                p.id, p.name, p.slug, p.description, p.price_cents, p.listing_type,
                p.rating, p.review_count, p.popularity, p.href, p.created_at,
                b.name as brand_name, b.slug as brand_slug,
                c.name as category_name, c.slug as category_slug,
                img.src as primary_image_src, img.alt as primary_image_alt
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN LATERAL (
                SELECT src, alt 
                FROM product_images 
                WHERE product_id = p.id 
                ORDER BY is_primary DESC, sort_order ASC, id ASC 
                LIMIT 1
            ) img ON true
            ORDER BY p.popularity DESC, p.rating DESC
            LIMIT ${limit}
        `;

        return {
            products: rows.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price_cents: p.price_cents,
                listing_type: p.listing_type,
                rating: Number(p.rating || 0),
                review_count: p.review_count,
                popularity: p.popularity,
                brand: p.brand_name ? { name: p.brand_name, slug: p.brand_slug } : null,
                category: p.category_name ? { name: p.category_name, slug: p.category_slug } : null,
                primary_image: p.primary_image_src ? { src: p.primary_image_src, alt: p.primary_image_alt } : null,
            }))
        };
    } catch (e: any) {
        console.error('Failed to get featured products:', e);
        return error(500, { message: 'Failed to fetch featured products' });
    }
});

// List / search / filter products with pagination
productRouter.get('/', async (request, env) => {
    try {
        const { sql } = getProductsDb(env);
        const url = new URL(request.url);

        const search = url.searchParams.get('search')?.trim();
        const category = url.searchParams.get('category')?.trim();
        const space = url.searchParams.get('space')?.trim();
        const style = url.searchParams.get('style')?.trim();
        const room = url.searchParams.get('room')?.trim();
        const material = url.searchParams.get('material')?.trim();
        const brand = url.searchParams.get('brand')?.trim();
        const minPrice = url.searchParams.get('min_price') ? Number(url.searchParams.get('min_price')) : null;
        const maxPrice = url.searchParams.get('max_price') ? Number(url.searchParams.get('max_price')) : null;
        const listingType = url.searchParams.get('listing_type')?.trim();
        const sort = url.searchParams.get('sort')?.trim() || 'popularity';
        const page = Math.max(1, Number(url.searchParams.get('page') || 1));
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 20)));
        const offset = (page - 1) * limit;

        // Build base query
        const conditions: string[] = ['1=1'];
        const params: any[] = [];

        // Dynamic WHERE clauses using raw parameterized conditions
        const rows = await sql`
            WITH filtered_products AS (
                SELECT 
                    p.id, p.name, p.slug, p.description, p.price_cents, p.listing_type,
                    p.rating, p.review_count, p.popularity, p.href, p.created_at,
                    p.brand_id, p.category_id, p.space_id, p.style_id, p.room_id, p.material_id,
                    b.name as brand_name, b.slug as brand_slug,
                    c.name as category_name, c.slug as category_slug,
                    sp.name as space_name, sp.slug as space_slug,
                    st.name as style_name, st.slug as style_slug,
                    rm.name as room_name, rm.slug as room_slug,
                    mat.name as material_name
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN spaces sp ON p.space_id = sp.id
                LEFT JOIN styles st ON p.style_id = st.id
                LEFT JOIN rooms rm ON p.room_id = rm.id
                LEFT JOIN materials mat ON p.material_id = mat.id
                WHERE 
                    (${search ? sql`(p.name ILIKE ${'%' + search + '%'} OR p.description ILIKE ${'%' + search + '%'})` : sql`true`})
                    AND (${category ? sql`(c.slug = ${category} OR c.id::text = ${category})` : sql`true`})
                    AND (${space ? sql`(sp.slug = ${space} OR sp.id::text = ${space})` : sql`true`})
                    AND (${style ? sql`(st.slug = ${style} OR st.id::text = ${style})` : sql`true`})
                    AND (${room ? sql`(rm.slug = ${room} OR rm.id::text = ${room})` : sql`true`})
                    AND (${material ? sql`(mat.name ILIKE ${material} OR mat.id::text = ${material})` : sql`true`})
                    AND (${brand ? sql`(b.slug = ${brand} OR b.id::text = ${brand})` : sql`true`})
                    AND (${minPrice !== null ? sql`p.price_cents >= ${minPrice}` : sql`true`})
                    AND (${maxPrice !== null ? sql`p.price_cents <= ${maxPrice}` : sql`true`})
                    AND (${listingType ? sql`p.listing_type = ${listingType}` : sql`true`})
            )
            SELECT 
                fp.*,
                img.src as primary_image_src, img.alt as primary_image_alt,
                COUNT(*) OVER() as total_count
            FROM filtered_products fp
            LEFT JOIN LATERAL (
                SELECT src, alt 
                FROM product_images 
                WHERE product_id = fp.id 
                ORDER BY is_primary DESC, sort_order ASC, id ASC 
                LIMIT 1
            ) img ON true
            ORDER BY 
                ${sort === 'price_asc' ? sql`fp.price_cents ASC` :
                  sort === 'price_desc' ? sql`fp.price_cents DESC` :
                  sort === 'rating' ? sql`fp.rating DESC` :
                  sort === 'newest' ? sql`fp.created_at DESC` :
                  sql`fp.popularity DESC, fp.id ASC`}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
        const totalPages = Math.ceil(totalCount / limit);

        return {
            products: rows.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price_cents: p.price_cents,
                listing_type: p.listing_type,
                rating: Number(p.rating || 0),
                review_count: p.review_count,
                popularity: p.popularity,
                brand: p.brand_name ? { id: p.brand_id, name: p.brand_name, slug: p.brand_slug } : null,
                category: p.category_name ? { id: p.category_id, name: p.category_name, slug: p.category_slug } : null,
                space: p.space_name ? { id: p.space_id, name: p.space_name, slug: p.space_slug } : null,
                style: p.style_name ? { id: p.style_id, name: p.style_name, slug: p.style_slug } : null,
                room: p.room_name ? { id: p.room_id, name: p.room_name, slug: p.room_slug } : null,
                material: p.material_name ? { id: p.material_id, name: p.material_name } : null,
                primary_image: p.primary_image_src ? { src: p.primary_image_src, alt: p.primary_image_alt } : null,
            })),
            pagination: {
                total: totalCount,
                page,
                limit,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            }
        };
    } catch (e: any) {
        console.error('Failed to list products:', e);
        return error(500, { message: 'Failed to fetch products', detail: e?.message });
    }
});

// Get single product by id or slug
productRouter.get('/:idOrSlug', async (request, env) => {
    try {
        const { idOrSlug } = request.params;
        const { sql } = getProductsDb(env);
        const isNumeric = /^\d+$/.test(idOrSlug);

        const rows = await sql`
            SELECT 
                p.id, p.name, p.slug, p.description, p.price_cents, p.listing_type,
                p.rating, p.review_count, p.popularity, p.href, p.created_at, p.updated_at,
                p.brand_id, p.category_id, p.space_id, p.style_id, p.room_id, p.material_id,
                b.name as brand_name, b.slug as brand_slug,
                c.name as category_name, c.slug as category_slug,
                sp.name as space_name, sp.slug as space_slug,
                st.name as style_name, st.slug as style_slug,
                rm.name as room_name, rm.slug as room_slug,
                mat.name as material_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN spaces sp ON p.space_id = sp.id
            LEFT JOIN styles st ON p.style_id = st.id
            LEFT JOIN rooms rm ON p.room_id = rm.id
            LEFT JOIN materials mat ON p.material_id = mat.id
            WHERE ${isNumeric ? sql`p.id = ${Number(idOrSlug)}` : sql`p.slug = ${idOrSlug}`}
            LIMIT 1
        `;

        if (rows.length === 0) {
            return error(404, { message: 'Product not found' });
        }

        const product = rows[0];

        // Fetch images & colors in parallel
        const [images, colors] = await Promise.all([
            sql`
                SELECT id, src, alt, sort_order, is_primary 
                FROM product_images 
                WHERE product_id = ${product.id} 
                ORDER BY is_primary DESC, sort_order ASC, id ASC
            `,
            sql`
                SELECT c.id, c.name, c.hex_code, pc.sort_order
                FROM product_colors pc
                JOIN colors c ON pc.color_id = c.id
                WHERE pc.product_id = ${product.id}
                ORDER BY pc.sort_order ASC, c.name ASC
            `,
        ]);

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price_cents: product.price_cents,
            listing_type: product.listing_type,
            rating: Number(product.rating || 0),
            review_count: product.review_count,
            popularity: product.popularity,
            brand: product.brand_name ? { id: product.brand_id, name: product.brand_name, slug: product.brand_slug } : null,
            category: product.category_name ? { id: product.category_id, name: product.category_name, slug: product.category_slug } : null,
            space: product.space_name ? { id: product.space_id, name: product.space_name, slug: product.space_slug } : null,
            style: product.style_name ? { id: product.style_id, name: product.style_name, slug: product.style_slug } : null,
            room: product.room_name ? { id: product.room_id, name: product.room_name, slug: product.room_slug } : null,
            material: product.material_name ? { id: product.material_id, name: product.material_name } : null,
            images,
            colors,
            primary_image: images.length > 0 ? images[0] : null,
            created_at: product.created_at,
            updated_at: product.updated_at,
        };
    } catch (e: any) {
        console.error('Failed to get product:', e);
        return error(500, { message: 'Failed to fetch product details' });
    }
});

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

        const result = await sql`
            UPDATE products 
            SET name = COALESCE(${body.name ?? null}, name),
                slug = COALESCE(${body.slug ?? null}, slug),
                description = COALESCE(${body.description ?? null}, description),
                price_cents = COALESCE(${body.price_cents ?? null}, price_cents),
                brand_id = COALESCE(${body.brand_id ?? null}, brand_id),
                category_id = COALESCE(${body.category_id ?? null}, category_id),
                space_id = COALESCE(${body.space_id ?? null}, space_id),
                style_id = COALESCE(${body.style_id ?? null}, style_id),
                room_id = COALESCE(${body.room_id ?? null}, room_id),
                material_id = COALESCE(${body.material_id ?? null}, material_id),
                listing_type = COALESCE(${body.listing_type ?? null}, listing_type),
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
