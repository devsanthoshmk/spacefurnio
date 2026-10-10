import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb, getProductsDb } from '../../utils/db';
import { Env } from '../../types';

export const adminReviewRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/reviews',
});

function isValidUUID(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id.trim());
}

// Helper to recalculate & sync product average rating and review count into products catalog DB
async function syncProductRating(productId: number, env: Env) {
  if (!productId || isNaN(Number(productId)) || Number(productId) <= 0) return;
  try {
    const { sql } = getDb(env);
    const [stats] = await sql`
      SELECT COUNT(*)::int as total_count, COALESCE(AVG(rating), 0)::numeric(3,1) as avg_rating
      FROM reviews
      WHERE product_id = ${productId}
    `;

    const totalCount = Number(stats?.total_count || 0);
    const avgRating = Number(stats?.avg_rating || 0);

    const { sql: prodSql } = getProductsDb(env);
    await prodSql`
      UPDATE products
      SET rating = ${avgRating}, review_count = ${totalCount}, updated_at = NOW()
      WHERE id = ${productId}
    `;
  } catch (err) {
    console.error(`Failed to sync rating for product #${productId}:`, err);
  }
}

// 1. List / Filter Reviews (Admin view with overall stats)
adminReviewRouter.get('/', requirePermission('reviews.read'), async (request, env) => {
  try {
    const url = new URL(request.url);
    const pageRaw = parseInt(url.searchParams.get('page') || '1', 10);
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitRaw = parseInt(url.searchParams.get('limit') || '25', 10);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(100, limitRaw) : 25;
    const search = (url.searchParams.get('search') || '').trim();
    
    const ratingParam = url.searchParams.get('rating');
    const rating = ratingParam && !isNaN(Number(ratingParam)) && Number.isInteger(Number(ratingParam)) && Number(ratingParam) >= 1 && Number(ratingParam) <= 5
      ? Number(ratingParam)
      : null;

    const productIdParam = url.searchParams.get('product_id');
    const productId = productIdParam && !isNaN(Number(productIdParam)) && Number.isInteger(Number(productIdParam)) && Number(productIdParam) > 0
      ? Number(productIdParam)
      : null;

    const verifiedOnly = url.searchParams.get('verified_only') === 'true';
    const sort = url.searchParams.get('sort') || 'newest';

    const offset = (page - 1) * limit;
    const { sql } = getDb(env);

    const [rows, overallStats] = await Promise.all([
      sql`
        WITH filtered_reviews AS (
          SELECT 
            r.id, r.product_id, r.user_id, r.author_name, r.rating, r.title, r.comment,
            r.is_verified_purchase, r.created_at, r.updated_at,
            u.email as user_email
          FROM reviews r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE 
            (${search === '' ? sql`true` : sql`(
              r.comment ILIKE ${'%' + search + '%'} OR
              r.title ILIKE ${'%' + search + '%'} OR
              r.author_name ILIKE ${'%' + search + '%'} OR
              u.email ILIKE ${'%' + search + '%'}
            )`})
            AND (${rating !== null ? sql`r.rating = ${rating}` : sql`true`})
            AND (${productId !== null ? sql`r.product_id = ${productId}` : sql`true`})
            AND (${verifiedOnly ? sql`r.is_verified_purchase = true` : sql`true`})
        )
        SELECT 
          fr.*,
          COUNT(*) OVER() as filtered_total
        FROM filtered_reviews fr
        ORDER BY 
          ${sort === 'rating_desc' ? sql`fr.rating DESC, fr.created_at DESC` :
            sort === 'rating_asc' ? sql`fr.rating ASC, fr.created_at DESC` :
            sort === 'oldest' ? sql`fr.created_at ASC` :
            sql`fr.created_at DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `,

      // Aggregate stats
      sql`
        SELECT 
          COUNT(*)::int as total_reviews,
          COALESCE(AVG(rating), 0)::numeric(3,1) as avg_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END)::int as stars_5,
          COUNT(CASE WHEN rating = 4 THEN 1 END)::int as stars_4,
          COUNT(CASE WHEN rating = 3 THEN 1 END)::int as stars_3,
          COUNT(CASE WHEN rating = 2 THEN 1 END)::int as stars_2,
          COUNT(CASE WHEN rating = 1 THEN 1 END)::int as stars_1,
          COUNT(CASE WHEN is_verified_purchase = true THEN 1 END)::int as verified_count
        FROM reviews
      `,
    ]);

    const filteredTotal = rows.length > 0 ? Number(rows[0].filtered_total || 0) : 0;
    const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));
    const st = overallStats[0] || {};

    // Product enrichment
    const pIds = Array.from(new Set(rows.map(r => r.product_id)));
    let productMap = new Map<number, any>();
    if (pIds.length > 0) {
      try {
        const { sql: prodSql } = getProductsDb(env);
        const prodRows = await prodSql`
          SELECT p.id, p.name, p.slug, img.src as image_src
          FROM products p
          LEFT JOIN LATERAL (
            SELECT src FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1
          ) img ON true
          WHERE p.id = ANY(${pIds})
        `;
        for (const p of prodRows) {
          productMap.set(p.id, p);
        }
      } catch (pe) {
        console.error('Failed to resolve products for admin reviews:', pe);
      }
    }

    return {
      stats: {
        total_reviews: Number(st.total_reviews || 0),
        average_rating: parseFloat(st.avg_rating || '0'),
        verified_count: Number(st.verified_count || 0),
        rating_breakdown: {
          5: Number(st.stars_5 || 0),
          4: Number(st.stars_4 || 0),
          3: Number(st.stars_3 || 0),
          2: Number(st.stars_2 || 0),
          1: Number(st.stars_1 || 0),
        },
      },
      reviews: rows.map(r => {
        const prod = productMap.get(r.product_id);
        return {
          id: r.id,
          product_id: r.product_id,
          product: prod ? {
            name: prod.name,
            slug: prod.slug,
            image: prod.image_src,
          } : { name: `Product #${r.product_id}`, slug: '', image: null },
          user_id: r.user_id,
          user_email: r.user_email || null,
          author_name: r.author_name,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          is_verified_purchase: Boolean(r.is_verified_purchase),
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      }),
      pagination: {
        page,
        limit,
        total: filteredTotal,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    };
  } catch (e: any) {
    console.error('Failed to get admin reviews:', e);
    return error(500, { message: 'Failed to fetch reviews', error: e?.message });
  }
});

// 2. Get Single Review
adminReviewRouter.get('/:id', requirePermission('reviews.read'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Review not found' });
    }

    const { sql } = getDb(env);

    const rows = await sql`
      SELECT r.*, u.email as user_email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    const review = rows[0];

    // Product detail
    let product = null;
    try {
      const { sql: prodSql } = getProductsDb(env);
      const prodRows = await prodSql`
        SELECT p.id, p.name, p.slug, img.src as image_src
        FROM products p
        LEFT JOIN LATERAL (
          SELECT src FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1
        ) img ON true
        WHERE p.id = ${review.product_id}
        LIMIT 1
      `;
      if (prodRows.length > 0) {
        product = prodRows[0];
      }
    } catch (pe) {
      console.error('Failed to get product for review detail:', pe);
    }

    return {
      ...review,
      product,
    };
  } catch (e: any) {
    console.error('Failed to get review:', e);
    return error(500, { message: 'Failed to fetch review', error: e?.message });
  }
});

// 3. Create / Import Review (Admin)
adminReviewRouter.post('/', requirePermission('reviews.write'), async (request, env) => {
  try {
    const body = await request.json().catch(() => null) as any;
    if (!body || typeof body !== 'object') {
      return error(400, { message: 'Invalid JSON request body' });
    }

    const {
      product_id,
      rating,
      comment,
      title = null,
      author_name = 'Customer',
      is_verified_purchase = true,
      user_id = null,
    } = body;

    const numProductId = Number(product_id);
    if (
      product_id === undefined ||
      product_id === null ||
      typeof product_id === 'boolean' ||
      isNaN(numProductId) ||
      !Number.isInteger(numProductId) ||
      numProductId <= 0
    ) {
      return error(400, { message: 'Valid numeric product_id is required' });
    }

    const numRating = Number(rating);
    if (
      rating === undefined ||
      rating === null ||
      typeof rating === 'boolean' ||
      isNaN(numRating) ||
      !Number.isInteger(numRating) ||
      numRating < 1 ||
      numRating > 5
    ) {
      return error(400, { message: 'Rating must be an integer between 1 and 5' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return error(400, { message: 'Review comment is required' });
    }

    let finalUserId: string | null = null;
    if (user_id) {
      if (typeof user_id === 'string' && isValidUUID(user_id)) {
        finalUserId = user_id.trim();
      } else {
        return error(400, { message: 'user_id must be a valid UUID or null' });
      }
    }

    const finalAuthorName = (typeof author_name === 'string' && author_name.trim().length > 0)
      ? author_name.trim()
      : 'Customer';

    const finalTitle = (typeof title === 'string' && title.trim().length > 0)
      ? title.trim()
      : null;

    const finalVerified = Boolean(is_verified_purchase);

    const { sql } = getDb(env);
    const reviewId = crypto.randomUUID();

    const inserted = await sql`
      INSERT INTO reviews (
        id, product_id, user_id, author_name, rating, title, comment, is_verified_purchase, created_at, updated_at
      )
      VALUES (
        ${reviewId}, ${numProductId}, ${finalUserId}, ${finalAuthorName},
        ${numRating}, ${finalTitle}, ${comment.trim()}, ${finalVerified},
        NOW(), NOW()
      )
      RETURNING *
    `;

    // Sync rating to product catalog DB
    await syncProductRating(numProductId, env);

    return {
      success: true,
      message: 'Review created successfully',
      review: inserted[0],
    };
  } catch (e: any) {
    console.error('Failed to create review:', e);
    return error(500, { message: 'Failed to create review', error: e?.message });
  }
});

// 4. Update Review
adminReviewRouter.put('/:id', requirePermission('reviews.write'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Review not found' });
    }

    const body = await request.json().catch(() => null) as any;
    if (!body || typeof body !== 'object') {
      return error(400, { message: 'Invalid JSON request body' });
    }

    const { rating, title, comment, author_name, is_verified_purchase } = body;

    const { sql } = getDb(env);

    const existing = await sql`
      SELECT id, product_id, rating, title, comment, author_name, is_verified_purchase
      FROM reviews
      WHERE id = ${id}
      LIMIT 1
    `;
    if (existing.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    let updatedRating = existing[0].rating;
    if (rating !== undefined) {
      const numRating = Number(rating);
      if (typeof rating === 'boolean' || isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        return error(400, { message: 'Rating must be an integer between 1 and 5' });
      }
      updatedRating = numRating;
    }

    let updatedComment = existing[0].comment;
    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return error(400, { message: 'Review comment cannot be empty' });
      }
      updatedComment = comment.trim();
    }

    let updatedTitle = existing[0].title;
    if (title !== undefined) {
      updatedTitle = (typeof title === 'string' && title.trim().length > 0) ? title.trim() : null;
    }

    let updatedAuthor = existing[0].author_name;
    if (author_name !== undefined) {
      if (typeof author_name !== 'string' || author_name.trim().length === 0) {
        return error(400, { message: 'Author name cannot be empty' });
      }
      updatedAuthor = author_name.trim();
    }

    let updatedVerified = existing[0].is_verified_purchase;
    if (is_verified_purchase !== undefined) {
      updatedVerified = Boolean(is_verified_purchase);
    }

    const updated = await sql`
      UPDATE reviews
      SET 
        rating = ${updatedRating},
        title = ${updatedTitle},
        comment = ${updatedComment},
        author_name = ${updatedAuthor},
        is_verified_purchase = ${updatedVerified},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Sync product rating
    await syncProductRating(existing[0].product_id, env);

    return {
      success: true,
      message: 'Review updated successfully',
      review: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to update review:', e);
    return error(500, { message: 'Failed to update review', error: e?.message });
  }
});

// 5. Delete Review
adminReviewRouter.delete('/:id', requirePermission('reviews.delete'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Review not found' });
    }

    const { sql } = getDb(env);

    const existing = await sql`SELECT id, product_id FROM reviews WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    const productId = existing[0].product_id;
    await sql`DELETE FROM reviews WHERE id = ${id}`;

    // Recalculate & sync rating
    await syncProductRating(productId, env);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  } catch (e: any) {
    console.error('Failed to delete review:', e);
    return error(500, { message: 'Failed to delete review', error: e?.message });
  }
});
