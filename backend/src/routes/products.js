/**
 * ===========================================
 * PRODUCT ROUTES
 * ===========================================
 * Public product listing, search, and details
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/products' });

// ===========================================
// LIST PRODUCTS WITH FILTERS
// ===========================================
router.get('/', async (request) => {
  const { db } = request;
  const url = new URL(request.url);

  // Parse query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;

  const query = url.searchParams.get('q');
  const categoryId = url.searchParams.get('category');
  const categorySlug = url.searchParams.get('category_slug');
  const minPrice = url.searchParams.get('min_price');
  const maxPrice = url.searchParams.get('max_price');
  const room = url.searchParams.get('room');
  const style = url.searchParams.get('style');
  const brand = url.searchParams.get('brand');
  const sortBy = url.searchParams.get('sort') || 'created_at';
  const sortOrder = url.searchParams.get('order') || 'desc';
  const featured = url.searchParams.get('featured') === 'true';

  try {
    // Build dynamic query
    let conditions = ['p.status = \'active\''];
    let params = [];
    let paramIndex = 1;

    if (query) {
      conditions.push(`(
        p.name ILIKE $${paramIndex} OR
        p.description ILIKE $${paramIndex} OR
        p.brand ILIKE $${paramIndex}
      )`);
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`p.category_id = $${paramIndex}::uuid`);
      params.push(categoryId);
      paramIndex++;
    }

    if (categorySlug) {
      conditions.push(`c.slug = $${paramIndex}`);
      params.push(categorySlug);
      paramIndex++;
    }

    if (minPrice) {
      conditions.push(`p.price >= $${paramIndex}`);
      params.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      conditions.push(`p.price <= $${paramIndex}`);
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    if (room) {
      conditions.push(`p.room = $${paramIndex}`);
      params.push(room);
      paramIndex++;
    }

    if (style) {
      conditions.push(`p.style = $${paramIndex}`);
      params.push(style);
      paramIndex++;
    }

    if (brand) {
      conditions.push(`p.brand = $${paramIndex}`);
      params.push(brand);
      paramIndex++;
    }

    if (featured) {
      conditions.push(`p.is_featured = TRUE`);
    }

    const whereClause = conditions.join(' AND ');

    // Validate sort column
    const allowedSorts = ['created_at', 'price', 'name', 'rating_average'];
    const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await db`
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${db.raw(whereClause)}
    `;

    // This approach doesn't work with parameterized queries, so let's use a simpler approach
    // For now, use the search_products function we created

    const products = await db`
      SELECT * FROM search_products(
        ${query || null},
        ${categoryId || null}::uuid,
        ${minPrice ? parseFloat(minPrice) : null},
        ${maxPrice ? parseFloat(maxPrice) : null},
        ${room || null},
        ${style || null},
        ${brand || null},
        ${sortColumn},
        ${sortDir},
        ${page},
        ${perPage}
      )
    `;

    const total = products.length > 0 ? products[0].total_count : 0;

    // Format response
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.short_description,
      price: parseFloat(p.price),
      compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
      images: p.images || [],
      categoryId: p.category_id,
      categoryName: p.category_name,
      brand: p.brand,
      ratingAverage: parseFloat(p.rating_average || 0),
      ratingCount: p.rating_count || 0
    }));

    return json({
      products: formattedProducts,
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    }, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Per-Page': perPage.toString()
      }
    });

  } catch (err) {
    console.error('Product list error:', err);
    return error(500, { message: 'Failed to fetch products' });
  }
});

// ===========================================
// GET FEATURED PRODUCTS
// ===========================================
router.get('/featured', async (request) => {
  const { db } = request;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '8'), 20);

  try {
    const products = await db`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.is_featured = TRUE
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;

    return json({
      products: products.map(formatProduct)
    });

  } catch (err) {
    console.error('Featured products error:', err);
    return error(500, { message: 'Failed to fetch featured products' });
  }
});

// ===========================================
// GET NEW ARRIVALS
// ===========================================
router.get('/new-arrivals', async (request) => {
  const { db } = request;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '8'), 20);

  try {
    const products = await db`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
        AND p.published_at > NOW() - INTERVAL '30 days'
      ORDER BY p.published_at DESC
      LIMIT ${limit}
    `;

    return json({
      products: products.map(formatProduct)
    });

  } catch (err) {
    console.error('New arrivals error:', err);
    return error(500, { message: 'Failed to fetch new arrivals' });
  }
});

// ===========================================
// GET PRODUCTS BY ROOM
// ===========================================
router.get('/room/:room', async (request) => {
  const { db, params } = request;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;

  try {
    const products = await db`
      SELECT p.*, c.name as category_name,
             COUNT(*) OVER() as total_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.room = ${params.room}
      ORDER BY p.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const total = products.length > 0 ? products[0].total_count : 0;

    return json({
      room: params.room,
      products: products.map(formatProduct),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Products by room error:', err);
    return error(500, { message: 'Failed to fetch products' });
  }
});

// ===========================================
// GET PRODUCTS BY STYLE
// ===========================================
router.get('/style/:style', async (request) => {
  const { db, params } = request;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100);
  const offset = (page - 1) * perPage;

  try {
    const products = await db`
      SELECT p.*, c.name as category_name,
             COUNT(*) OVER() as total_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.style = ${params.style}
      ORDER BY p.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const total = products.length > 0 ? products[0].total_count : 0;

    return json({
      style: params.style,
      products: products.map(formatProduct),
      pagination: {
        page,
        perPage,
        total: parseInt(total),
        totalPages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    console.error('Products by style error:', err);
    return error(500, { message: 'Failed to fetch products' });
  }
});

// ===========================================
// GET SINGLE PRODUCT BY SLUG
// ===========================================
router.get('/:slug', async (request) => {
  const { db, params, user } = request;

  try {
    // Get product with details
    const products = await db`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ${params.slug} AND p.status = 'active'
    `;

    if (products.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    const product = products[0];

    // Get variants
    const variants = await db`
      SELECT * FROM product_variants
      WHERE product_id = ${product.id} AND is_active = TRUE
      ORDER BY is_default DESC, name ASC
    `;

    // Get reviews summary and top reviews
    const reviews = await db`
      SELECT r.*, u.name as user_name, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${product.id} AND r.status = 'approved'
      ORDER BY r.helpful_count DESC, r.created_at DESC
      LIMIT 5
    `;

    // Get rating distribution
    const ratingDist = await db`
      SELECT rating, COUNT(*) as count
      FROM reviews
      WHERE product_id = ${product.id} AND status = 'approved'
      GROUP BY rating
      ORDER BY rating DESC
    `;

    // Get related products
    const relatedProducts = await db`
      SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.images, p.rating_average
      FROM products p
      WHERE p.category_id = ${product.category_id}
        AND p.id != ${product.id}
        AND p.status = 'active'
      ORDER BY p.rating_average DESC
      LIMIT 4
    `;

    // Check if user has this in wishlist
    let inWishlist = false;
    if (user) {
      const wishlistCheck = await db`
        SELECT 1 FROM wishlist_items wi
        JOIN wishlists w ON wi.wishlist_id = w.id
        WHERE w.user_id = ${user.id} AND wi.product_id = ${product.id}
        LIMIT 1
      `;
      inWishlist = wishlistCheck.length > 0;
    }

    return json({
      product: {
        ...formatProduct(product),
        sku: product.sku,
        material: product.material,
        colors: product.colors || [],
        dimensions: product.dimensions,
        weight: product.weight,
        weightUnit: product.weight_unit,
        quantity: product.quantity,
        trackInventory: product.track_inventory,
        allowBackorder: product.allow_backorder,
        metaTitle: product.meta_title,
        metaDescription: product.meta_description,
        model3dUrl: product.model_3d_url
      },
      variants: variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        priceModifier: parseFloat(v.price_modifier || 0),
        quantity: v.quantity,
        color: v.color,
        size: v.size,
        attributes: v.attributes,
        imageUrl: v.image_url,
        isDefault: v.is_default
      })),
      reviews: {
        items: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          images: r.images || [],
          verifiedPurchase: r.verified_purchase,
          helpfulCount: r.helpful_count,
          userName: r.user_name,
          userAvatar: r.avatar_url,
          createdAt: r.created_at
        })),
        distribution: ratingDist.reduce((acc, { rating, count }) => {
          acc[rating] = parseInt(count);
          return acc;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
      },
      relatedProducts: relatedProducts.map(formatProduct),
      inWishlist
    });

  } catch (err) {
    console.error('Product detail error:', err);
    return error(500, { message: 'Failed to fetch product' });
  }
});

// ===========================================
// GET CATEGORIES
// ===========================================
router.get('/categories/all', async (request) => {
  const { db } = request;

  try {
    const categories = await db`
      SELECT c.*,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    return json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image_url,
        parentId: c.parent_id,
        productCount: parseInt(c.product_count)
      }))
    });

  } catch (err) {
    console.error('Categories error:', err);
    return error(500, { message: 'Failed to fetch categories' });
  }
});

// ===========================================
// GET AVAILABLE FILTERS
// ===========================================
router.get('/filters/options', async (request) => {
  const { db } = request;

  try {
    // Get unique rooms
    const rooms = await db`
      SELECT DISTINCT room FROM products
      WHERE status = 'active' AND room IS NOT NULL
      ORDER BY room
    `;

    // Get unique styles
    const styles = await db`
      SELECT DISTINCT style FROM products
      WHERE status = 'active' AND style IS NOT NULL
      ORDER BY style
    `;

    // Get unique brands
    const brands = await db`
      SELECT DISTINCT brand FROM products
      WHERE status = 'active' AND brand IS NOT NULL
      ORDER BY brand
    `;

    // Get price range
    const priceRange = await db`
      SELECT MIN(price) as min_price, MAX(price) as max_price
      FROM products WHERE status = 'active'
    `;

    return json({
      rooms: rooms.map(r => r.room),
      styles: styles.map(s => s.style),
      brands: brands.map(b => b.brand),
      priceRange: {
        min: parseFloat(priceRange[0]?.min_price || 0),
        max: parseFloat(priceRange[0]?.max_price || 100000)
      }
    });

  } catch (err) {
    console.error('Filters error:', err);
    return error(500, { message: 'Failed to fetch filters' });
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.short_description,
    price: parseFloat(p.price),
    compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
    images: p.images || [],
    categoryId: p.category_id,
    categoryName: p.category_name,
    categorySlug: p.category_slug,
    brand: p.brand,
    room: p.room,
    style: p.style,
    ratingAverage: parseFloat(p.rating_average || 0),
    ratingCount: p.rating_count || 0,
    reviewCount: p.review_count || 0,
    isFeatured: p.is_featured
  };
}

export default router;
