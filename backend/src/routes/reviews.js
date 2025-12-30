/**
 * ===========================================
 * REVIEW ROUTES
 * ===========================================
 * Product reviews and ratings
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/reviews' });

// ===========================================
// GET REVIEWS FOR PRODUCT
// ===========================================
router.get('/product/:productId', async (request) => {
  const { db, params, user } = request;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '10'), 50);
  const offset = (page - 1) * perPage;
  const sortBy = url.searchParams.get('sort') || 'helpful';
  const rating = url.searchParams.get('rating');

  try {
    // Build sort order
    let orderBy = 'r.helpful_count DESC, r.created_at DESC';
    if (sortBy === 'newest') orderBy = 'r.created_at DESC';
    if (sortBy === 'oldest') orderBy = 'r.created_at ASC';
    if (sortBy === 'highest') orderBy = 'r.rating DESC, r.created_at DESC';
    if (sortBy === 'lowest') orderBy = 'r.rating ASC, r.created_at DESC';

    // Get reviews with user info
    let reviews;
    if (rating) {
      reviews = await db`
        SELECT r.*, u.name as user_name, u.avatar_url,
               COUNT(*) OVER() as total_count
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${params.productId}::uuid
          AND r.status = 'approved'
          AND r.rating = ${parseInt(rating)}
        ORDER BY ${db.raw(orderBy)}
        LIMIT ${perPage} OFFSET ${offset}
      `;
    } else {
      reviews = await db`
        SELECT r.*, u.name as user_name, u.avatar_url,
               COUNT(*) OVER() as total_count
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${params.productId}::uuid
          AND r.status = 'approved'
        ORDER BY ${db.raw(orderBy)}
        LIMIT ${perPage} OFFSET ${offset}
      `;
    }

    const total = reviews.length > 0 ? reviews[0].total_count : 0;

    // Get rating distribution
    const ratingDist = await db`
      SELECT rating, COUNT(*) as count
      FROM reviews
      WHERE product_id = ${params.productId}::uuid AND status = 'approved'
      GROUP BY rating
      ORDER BY rating DESC
    `;

    // Get user's vote status if authenticated
    let userVotes = {};
    if (user) {
      const votes = await db`
        SELECT review_id, is_helpful FROM review_votes
        WHERE user_id = ${user.id}
          AND review_id = ANY(${reviews.map(r => r.id)}::uuid[])
      `;
      userVotes = votes.reduce((acc, v) => {
        acc[v.review_id] = v.is_helpful;
        return acc;
      }, {});
    }

    // Check if user has reviewed this product
    let userHasReviewed = false;
    if (user) {
      const userReview = await db`
        SELECT 1 FROM reviews
        WHERE product_id = ${params.productId}::uuid AND user_id = ${user.id}
        LIMIT 1
      `;
      userHasReviewed = userReview.length > 0;
    }

    return json({
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        images: r.images || [],
        verifiedPurchase: r.verified_purchase,
        helpfulCount: r.helpful_count,
        userName: r.user_name,
        userAvatar: r.avatar_url,
        createdAt: r.created_at,
        userVote: userVotes[r.id] ?? null
      })),
      distribution: ratingDist.reduce((acc, { rating, count }) => {
        acc[rating] = parseInt(count);
        return acc;
      }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }),
      userHasReviewed,
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get reviews error:', err);
    return error(500, { message: 'Failed to fetch reviews' });
  }
});

// ===========================================
// CREATE REVIEW
// ===========================================
router.post('/product/:productId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required to write a review' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { rating, title, content, images, orderId } = body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return error(400, { message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if product exists
    const products = await db`
      SELECT * FROM products WHERE id = ${params.productId}::uuid
    `;

    if (products.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReviews = await db`
      SELECT * FROM reviews
      WHERE product_id = ${params.productId}::uuid AND user_id = ${user.id}
    `;

    if (existingReviews.length > 0) {
      return error(400, { message: 'You have already reviewed this product' });
    }

    // Check if verified purchase
    let verifiedPurchase = false;
    if (orderId) {
      const orders = await db`
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.id = ${orderId}::uuid
          AND o.user_id = ${user.id}
          AND oi.product_id = ${params.productId}::uuid
          AND o.status IN ('delivered', 'completed')
        LIMIT 1
      `;
      verifiedPurchase = orders.length > 0;
    } else {
      // Check if user has ever purchased this product
      const purchases = await db`
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ${user.id}
          AND oi.product_id = ${params.productId}::uuid
          AND o.status IN ('delivered', 'completed')
        LIMIT 1
      `;
      verifiedPurchase = purchases.length > 0;
    }

    // Create review (pending moderation)
    const reviews = await db`
      INSERT INTO reviews (
        product_id, user_id, order_id, rating, title, content, images, verified_purchase, status
      ) VALUES (
        ${params.productId}::uuid,
        ${user.id},
        ${orderId}::uuid,
        ${rating},
        ${title || null},
        ${content || null},
        ${JSON.stringify(images || [])},
        ${verifiedPurchase},
        'pending'
      )
      RETURNING *
    `;

    const review = reviews[0];

    return json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images,
        verifiedPurchase: review.verified_purchase,
        status: review.status,
        createdAt: review.created_at
      },
      message: 'Review submitted successfully. It will be visible after moderation.'
    });

  } catch (err) {
    console.error('Create review error:', err);
    return error(500, { message: 'Failed to create review' });
  }
});

// ===========================================
// UPDATE REVIEW
// ===========================================
router.patch('/:reviewId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { rating, title, content, images } = body;

  try {
    // Check ownership and status
    const reviews = await db`
      SELECT * FROM reviews
      WHERE id = ${params.reviewId}::uuid AND user_id = ${user.id}
    `;

    if (reviews.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    const review = reviews[0];

    // Can only edit pending reviews
    if (review.status !== 'pending') {
      return error(400, { message: 'Only pending reviews can be edited' });
    }

    // Update review
    const updatedReviews = await db`
      UPDATE reviews
      SET
        rating = COALESCE(${rating}, rating),
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        images = COALESCE(${images ? JSON.stringify(images) : null}, images),
        updated_at = NOW()
      WHERE id = ${params.reviewId}::uuid
      RETURNING *
    `;

    const updatedReview = updatedReviews[0];

    return json({
      success: true,
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        title: updatedReview.title,
        content: updatedReview.content,
        images: updatedReview.images,
        status: updatedReview.status
      }
    });

  } catch (err) {
    console.error('Update review error:', err);
    return error(500, { message: 'Failed to update review' });
  }
});

// ===========================================
// DELETE REVIEW
// ===========================================
router.delete('/:reviewId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Check ownership
    const reviews = await db`
      SELECT * FROM reviews
      WHERE id = ${params.reviewId}::uuid AND user_id = ${user.id}
    `;

    if (reviews.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    // Delete review
    await db`DELETE FROM reviews WHERE id = ${params.reviewId}::uuid`;

    return json({ success: true });

  } catch (err) {
    console.error('Delete review error:', err);
    return error(500, { message: 'Failed to delete review' });
  }
});

// ===========================================
// VOTE ON REVIEW (HELPFUL/NOT HELPFUL)
// ===========================================
router.post('/:reviewId/vote', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required to vote' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { isHelpful } = body;

  if (typeof isHelpful !== 'boolean') {
    return error(400, { message: 'isHelpful must be a boolean' });
  }

  try {
    // Check if review exists
    const reviews = await db`
      SELECT * FROM reviews WHERE id = ${params.reviewId}::uuid
    `;

    if (reviews.length === 0) {
      return error(404, { message: 'Review not found' });
    }

    // Can't vote on own review
    if (reviews[0].user_id === user.id) {
      return error(400, { message: "You can't vote on your own review" });
    }

    // Upsert vote
    await db`
      INSERT INTO review_votes (review_id, user_id, is_helpful)
      VALUES (${params.reviewId}::uuid, ${user.id}, ${isHelpful})
      ON CONFLICT (review_id, user_id)
      DO UPDATE SET is_helpful = ${isHelpful}
    `;

    // Get updated helpful count
    const countResult = await db`
      SELECT helpful_count FROM reviews WHERE id = ${params.reviewId}::uuid
    `;

    return json({
      success: true,
      helpfulCount: countResult[0].helpful_count
    });

  } catch (err) {
    console.error('Vote error:', err);
    return error(500, { message: 'Failed to record vote' });
  }
});

// ===========================================
// REMOVE VOTE
// ===========================================
router.delete('/:reviewId/vote', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    await db`
      DELETE FROM review_votes
      WHERE review_id = ${params.reviewId}::uuid AND user_id = ${user.id}
    `;

    // Get updated helpful count
    const countResult = await db`
      SELECT helpful_count FROM reviews WHERE id = ${params.reviewId}::uuid
    `;

    return json({
      success: true,
      helpfulCount: countResult[0]?.helpful_count || 0
    });

  } catch (err) {
    console.error('Remove vote error:', err);
    return error(500, { message: 'Failed to remove vote' });
  }
});

// ===========================================
// GET USER'S REVIEWS
// ===========================================
router.get('/my-reviews', async (request) => {
  const { db, user } = request;
  const url = new URL(request.url);

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '10'), 50);
  const offset = (page - 1) * perPage;

  try {
    const reviews = await db`
      SELECT r.*, p.name as product_name, p.slug as product_slug, p.images as product_images,
             COUNT(*) OVER() as total_count
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ${user.id}
      ORDER BY r.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const total = reviews.length > 0 ? reviews[0].total_count : 0;

    return json({
      reviews: reviews.map(r => ({
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        productSlug: r.product_slug,
        productImage: r.product_images?.[0]?.url,
        rating: r.rating,
        title: r.title,
        content: r.content,
        images: r.images,
        verifiedPurchase: r.verified_purchase,
        helpfulCount: r.helpful_count,
        status: r.status,
        createdAt: r.created_at
      })),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Get my reviews error:', err);
    return error(500, { message: 'Failed to fetch reviews' });
  }
});

// ===========================================
// GET PRODUCTS AVAILABLE FOR REVIEW
// ===========================================
router.get('/products-to-review', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Get products from delivered orders that haven't been reviewed
    const products = await db`
      SELECT DISTINCT ON (p.id)
             p.id, p.name, p.slug, p.images, o.id as order_id, o.order_number
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.user_id = ${user.id}
      WHERE o.user_id = ${user.id}
        AND o.status IN ('delivered', 'completed')
        AND r.id IS NULL
      ORDER BY p.id, o.delivered_at DESC
      LIMIT 10
    `;

    return json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images?.[0]?.url,
        orderId: p.order_id,
        orderNumber: p.order_number
      }))
    });

  } catch (err) {
    console.error('Get products to review error:', err);
    return error(500, { message: 'Failed to fetch products' });
  }
});

export default router;
