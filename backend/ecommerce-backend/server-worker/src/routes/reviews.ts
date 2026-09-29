import { AutoRouter, error } from 'itty-router';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDb, getProductsDb } from '../utils/db';
import { Env } from '../types';

export const reviewRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/reviews' });

// Get reviews for a product
reviewRouter.get('/product/:productId', async (request, env) => {
    try {
        const { productId } = request.params;
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page') || 1));
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
        const offset = (page - 1) * limit;

        const { sql } = getDb(env);

        const [reviews, stats] = await Promise.all([
            sql`
                SELECT id, product_id, user_id, author_name, rating, title, comment, is_verified_purchase, created_at
                FROM reviews
                WHERE product_id = ${Number(productId)}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `,
            sql`
                SELECT COUNT(*) as total_count, AVG(rating) as avg_rating
                FROM reviews
                WHERE product_id = ${Number(productId)}
            `,
        ]);

        const totalCount = Number(stats[0]?.total_count || 0);
        const avgRating = stats[0]?.avg_rating ? parseFloat(Number(stats[0].avg_rating).toFixed(1)) : 0;

        return {
            productId: Number(productId),
            stats: {
                total_reviews: totalCount,
                average_rating: avgRating,
            },
            reviews: reviews.map(r => ({
                id: r.id,
                author_name: r.author_name,
                rating: r.rating,
                title: r.title,
                comment: r.comment,
                is_verified_purchase: r.is_verified_purchase,
                created_at: r.created_at,
            })),
            pagination: {
                page,
                limit,
                total: totalCount,
                total_pages: Math.ceil(totalCount / limit),
            }
        };
    } catch (e: any) {
        console.error('Failed to get reviews:', e);
        return error(500, { message: 'Failed to fetch reviews' });
    }
});

// Submit a review (authenticated)
reviewRouter.post('/', authenticate, async (request, env) => {
    try {
        const userId = request.user.sub;
        const userEmail = request.user.email || 'Customer';
        const body = await request.json() as any;
        const { product_id, rating, title, comment, author_name } = body;

        if (!product_id || !rating || !comment) {
            return error(400, { message: 'product_id, rating (1-5), and comment are required' });
        }

        const numRating = Number(rating);
        if (numRating < 1 || numRating > 5) {
            return error(400, { message: 'Rating must be between 1 and 5' });
        }

        const { sql } = getDb(env);

        // Check if user has bought this product for verified purchase badge
        const orders = await sql`
            SELECT o.id 
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ${userId} AND oi.product_id = ${Number(product_id)}
            LIMIT 1
        `;

        const isVerified = orders.length > 0;
        const displayName = author_name || userEmail.split('@')[0] || 'Verified Buyer';

        const reviewId = crypto.randomUUID();
        const result = await sql`
            INSERT INTO reviews (id, product_id, user_id, author_name, rating, title, comment, is_verified_purchase)
            VALUES (${reviewId}, ${Number(product_id)}, ${userId}, ${displayName}, ${numRating}, ${title || null}, ${comment}, ${isVerified})
            RETURNING id, product_id, author_name, rating, title, comment, is_verified_purchase, created_at
        `;

        // Calculate new rating and review count from reviews table
        const [stats] = await sql`
            SELECT COUNT(*) as total_count, AVG(rating) as avg_rating
            FROM reviews
            WHERE product_id = ${Number(product_id)}
        `;

        const newCount = Number(stats?.total_count || 1);
        const newAvg = stats?.avg_rating ? parseFloat(Number(stats.avg_rating).toFixed(1)) : numRating;

        // Update product table in products DB
        try {
            const { sql: prodSql } = getProductsDb(env);
            await prodSql`
                UPDATE products
                SET rating = ${newAvg}, review_count = ${newCount}
                WHERE id = ${Number(product_id)}
            `;
        } catch (pe) {
            console.error('Failed to sync product rating in products DB:', pe);
        }

        return {
            success: true,
            review: result[0],
            message: 'Review submitted successfully',
        };
    } catch (e: any) {
        console.error('Failed to submit review:', e);
        return error(500, { message: 'Failed to submit review' });
    }
});
