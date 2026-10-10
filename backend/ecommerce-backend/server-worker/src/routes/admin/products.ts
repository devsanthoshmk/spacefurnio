import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getProductsDb } from '../../utils/db';
import { Env } from '../../types';

export const adminProductRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/products',
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const VALID_LISTING_TYPES = ['category', 'space', 'style'] as const;

// 1. Get Taxonomy / Lookups for form builders
adminProductRouter.get('/lookups', requirePermission('products.read'), async (request, env) => {
  try {
    const { sql } = getProductsDb(env);

    const [categories, spaces, styles, rooms, materials, brands, colors] = await Promise.all([
      sql`SELECT id, name, slug FROM categories ORDER BY name ASC`,
      sql`SELECT id, name, slug FROM spaces ORDER BY name ASC`,
      sql`SELECT id, name, slug FROM styles ORDER BY name ASC`,
      sql`SELECT id, name, slug FROM rooms ORDER BY name ASC`,
      sql`SELECT id, name FROM materials ORDER BY name ASC`,
      sql`SELECT id, name, slug FROM brands ORDER BY name ASC`,
      sql`SELECT id, name, hex_code FROM colors ORDER BY name ASC`,
    ]);

    return {
      categories,
      spaces,
      styles,
      rooms,
      materials,
      brands,
      colors,
      listing_types: Array.from(VALID_LISTING_TYPES),
    };
  } catch (e: any) {
    console.error('Failed to get product lookups:', e);
    return error(500, { message: 'Failed to fetch product lookup metadata', error: e?.message });
  }
});

// 2. List / Filter / Search products (Admin view)
adminProductRouter.get('/', requirePermission('products.read'), async (request, env) => {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim();
    const category = url.searchParams.get('category')?.trim();
    const brand = url.searchParams.get('brand')?.trim();
    const space = url.searchParams.get('space')?.trim();
    const style = url.searchParams.get('style')?.trim();
    const room = url.searchParams.get('room')?.trim();
    const material = url.searchParams.get('material')?.trim();
    const listingType = url.searchParams.get('listing_type')?.trim();

    const rawMinPrice = url.searchParams.get('min_price');
    const minPrice = rawMinPrice !== null && rawMinPrice !== '' && !isNaN(Number(rawMinPrice)) ? Number(rawMinPrice) : null;

    const rawMaxPrice = url.searchParams.get('max_price');
    const maxPrice = rawMaxPrice !== null && rawMaxPrice !== '' && !isNaN(Number(rawMaxPrice)) ? Number(rawMaxPrice) : null;

    const sort = url.searchParams.get('sort')?.trim() || 'newest';

    const rawPage = Number(url.searchParams.get('page'));
    const page = !isNaN(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

    const rawLimit = Number(url.searchParams.get('limit'));
    const limit = !isNaN(rawLimit) && rawLimit >= 1 ? Math.min(100, Math.floor(rawLimit)) : 25;
    const offset = (page - 1) * limit;

    const { sql } = getProductsDb(env);

    const rows = await sql`
      WITH filtered AS (
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
        WHERE 
          (${search ? sql`(p.name ILIKE ${'%' + search + '%'} OR p.description ILIKE ${'%' + search + '%'} OR p.slug ILIKE ${'%' + search + '%'})` : sql`true`})
          AND (${category ? sql`(c.slug = ${category} OR c.id::text = ${category})` : sql`true`})
          AND (${brand ? sql`(b.slug = ${brand} OR b.id::text = ${brand})` : sql`true`})
          AND (${space ? sql`(sp.slug = ${space} OR sp.id::text = ${space})` : sql`true`})
          AND (${style ? sql`(st.slug = ${style} OR st.id::text = ${style})` : sql`true`})
          AND (${room ? sql`(rm.slug = ${room} OR rm.id::text = ${room})` : sql`true`})
          AND (${material ? sql`(mat.name ILIKE ${material} OR mat.id::text = ${material})` : sql`true`})
          AND (${listingType ? sql`p.listing_type = ${listingType}` : sql`true`})
          AND (${minPrice !== null ? sql`p.price_cents >= ${minPrice}` : sql`true`})
          AND (${maxPrice !== null ? sql`p.price_cents <= ${maxPrice}` : sql`true`})
      )
      SELECT 
        f.*,
        img.src as primary_image_src, img.alt as primary_image_alt,
        COUNT(*) OVER() as total_count
      FROM filtered f
      LEFT JOIN LATERAL (
        SELECT src, alt 
        FROM product_images 
        WHERE product_id = f.id 
        ORDER BY is_primary DESC, sort_order ASC, id ASC 
        LIMIT 1
      ) img ON true
      ORDER BY 
        ${sort === 'price_asc' ? sql`f.price_cents ASC` :
          sort === 'price_desc' ? sql`f.price_cents DESC` :
          sort === 'name_asc' ? sql`f.name ASC` :
          sort === 'name_desc' ? sql`f.name DESC` :
          sort === 'rating' ? sql`f.rating DESC` :
          sort === 'popularity' ? sql`f.popularity DESC` :
          sort === 'oldest' ? sql`f.created_at ASC` :
          sql`f.created_at DESC`}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      products: rows.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price_cents: p.price_cents,
        price_formatted: `₹${(p.price_cents / 100).toFixed(2)}`,
        listing_type: p.listing_type,
        rating: Number(p.rating || 0),
        review_count: p.review_count,
        popularity: p.popularity,
        brand_id: p.brand_id,
        category_id: p.category_id,
        space_id: p.space_id,
        style_id: p.style_id,
        room_id: p.room_id,
        material_id: p.material_id,
        brand: p.brand_name ? { id: p.brand_id, name: p.brand_name, slug: p.brand_slug } : null,
        category: p.category_name ? { id: p.category_id, name: p.category_name, slug: p.category_slug } : null,
        space: p.space_name ? { id: p.space_id, name: p.space_name, slug: p.space_slug } : null,
        style: p.style_name ? { id: p.style_id, name: p.style_name, slug: p.style_slug } : null,
        room: p.room_name ? { id: p.room_id, name: p.room_name, slug: p.room_slug } : null,
        material: p.material_name ? { id: p.material_id, name: p.material_name } : null,
        primary_image: p.primary_image_src ? { src: p.primary_image_src, alt: p.primary_image_alt } : null,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    };
  } catch (e: any) {
    console.error('Admin products listing failed:', e);
    return error(500, { message: 'Failed to fetch products', error: e?.message });
  }
});

// 3. Get single product detail by ID or Slug
adminProductRouter.get('/:id', requirePermission('products.read'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || typeof id !== 'string') {
      return error(400, { message: 'Product ID or slug is required' });
    }

    const { sql } = getProductsDb(env);
    const isNumeric = /^\d+$/.test(id);

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
      WHERE ${isNumeric ? sql`p.id = ${Number(id)}` : sql`p.slug = ${id}`}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    const product = rows[0];

    const [images, colors] = await Promise.all([
      sql`
        SELECT id, src, alt, sort_order, is_primary, created_at 
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
      price_formatted: `₹${(product.price_cents / 100).toFixed(2)}`,
      listing_type: product.listing_type,
      rating: Number(product.rating || 0),
      review_count: product.review_count,
      popularity: product.popularity,
      href: product.href,
      brand_id: product.brand_id,
      category_id: product.category_id,
      space_id: product.space_id,
      style_id: product.style_id,
      room_id: product.room_id,
      material_id: product.material_id,
      brand: product.brand_name ? { id: product.brand_id, name: product.brand_name, slug: product.brand_slug } : null,
      category: product.category_name ? { id: product.category_id, name: product.category_name, slug: product.category_slug } : null,
      space: product.space_name ? { id: product.space_id, name: product.space_name, slug: product.space_slug } : null,
      style: product.style_name ? { id: product.style_id, name: product.style_name, slug: product.style_slug } : null,
      room: product.room_name ? { id: product.room_id, name: product.room_name, slug: product.room_slug } : null,
      material: product.material_name ? { id: product.material_id, name: product.material_name } : null,
      images,
      colors,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  } catch (e: any) {
    console.error('Failed to get product detail:', e);
    return error(500, { message: 'Failed to fetch product details', error: e?.message });
  }
});

// Helper to sanitize and process images
function processImages(images: any[], defaultAlt: string) {
  if (!Array.isArray(images) || images.length === 0) return [];

  const rawList = images
    .map((img, index) => {
      const src = typeof img === 'string' ? img.trim() : (img?.src ? String(img.src).trim() : '');
      if (!src) return null;
      const alt = typeof img === 'object' && img?.alt ? String(img.alt).trim() : defaultAlt;
      const isExplicitPrimary = typeof img === 'object' && img?.is_primary === true;
      const sortOrder = typeof img === 'object' && img?.sort_order !== undefined && !isNaN(Number(img.sort_order))
        ? Number(img.sort_order)
        : index;
      return { src, alt, isExplicitPrimary, sortOrder };
    })
    .filter((img): img is NonNullable<typeof img> => Boolean(img));

  if (rawList.length === 0) return [];

  const hasExplicitPrimary = rawList.some(i => i.isExplicitPrimary);
  let primaryAssigned = false;

  return rawList.map((item, idx) => {
    let isPrimary = false;
    if (hasExplicitPrimary) {
      if (item.isExplicitPrimary && !primaryAssigned) {
        isPrimary = true;
        primaryAssigned = true;
      }
    } else if (idx === 0) {
      isPrimary = true;
      primaryAssigned = true;
    }
    return {
      src: item.src,
      alt: item.alt,
      sort_order: item.sortOrder,
      is_primary: isPrimary,
    };
  });
}

// Helper to sanitize and process colors
function processColors(colors: any[]) {
  if (!Array.isArray(colors) || colors.length === 0) return [];

  const list: { color_id: number; sort_order: number }[] = [];
  const seenIds = new Set<number>();

  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const rawId = typeof c === 'object' && c !== null ? (c.color_id || c.id) : c;
    const colorId = Number(rawId);

    if (!colorId || isNaN(colorId) || colorId <= 0 || seenIds.has(colorId)) {
      continue;
    }

    seenIds.add(colorId);
    const sortOrder = typeof c === 'object' && c !== null && c.sort_order !== undefined && !isNaN(Number(c.sort_order))
      ? Number(c.sort_order)
      : i;

    list.push({ color_id: colorId, sort_order: sortOrder });
  }

  return list;
}

// 4. Create Product
adminProductRouter.post('/', requirePermission('products.write'), async (request, env) => {
  try {
    const body = await request.json() as any;
    const {
      name,
      slug: providedSlug,
      description = '',
      price_cents,
      brand_id,
      category_id = null,
      space_id = null,
      style_id = null,
      room_id = null,
      material_id = null,
      listing_type = 'category',
      rating = 0,
      review_count = 0,
      popularity = 0,
      href = null,
      images = [],
      colors = [],
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return error(400, { message: 'Product name is required' });
    }

    if (
      price_cents === undefined ||
      price_cents === null ||
      isNaN(Number(price_cents)) ||
      !Number.isFinite(Number(price_cents)) ||
      Number(price_cents) < 0
    ) {
      return error(400, { message: 'A valid non-negative price_cents is required' });
    }

    if (!brand_id || isNaN(Number(brand_id)) || Number(brand_id) <= 0) {
      return error(400, { message: 'A valid brand_id is required' });
    }

    const { sql } = getProductsDb(env);

    // Validate brand existence
    const brandCheck = await sql`SELECT id FROM brands WHERE id = ${Number(brand_id)} LIMIT 1`;
    if (brandCheck.length === 0) {
      return error(400, { message: `Brand with ID ${brand_id} does not exist` });
    }

    // Validate listing type
    const normalizedListingType = VALID_LISTING_TYPES.includes(listing_type) ? listing_type : 'category';

    // Slug generation and uniqueness check
    const baseSlug = (providedSlug ? generateSlug(providedSlug) : generateSlug(name)) || `product-${Date.now()}`;
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existingSlug = await sql`SELECT id FROM products WHERE slug = ${finalSlug} LIMIT 1`;
      if (existingSlug.length === 0) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const inserted = await sql`
      INSERT INTO products (
        name, slug, description, price_cents, brand_id, category_id,
        space_id, style_id, room_id, material_id, listing_type,
        rating, review_count, popularity, href, created_at, updated_at
      )
      VALUES (
        ${name.trim()}, ${finalSlug}, ${description || ''}, ${Math.round(Number(price_cents))}, ${Number(brand_id)},
        ${category_id ? Number(category_id) : null},
        ${space_id ? Number(space_id) : null},
        ${style_id ? Number(style_id) : null},
        ${room_id ? Number(room_id) : null},
        ${material_id ? Number(material_id) : null},
        ${normalizedListingType},
        ${Number(rating) || 0}, ${Number(review_count) || 0}, ${Number(popularity) || 0},
        ${href || null},
        NOW(), NOW()
      )
      RETURNING id, name, slug, price_cents, created_at
    `;

    const newProduct = inserted[0];
    const productId = newProduct.id;

    // Insert images if provided
    const processedImages = processImages(images, name.trim());
    for (const img of processedImages) {
      await sql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${productId}, ${img.src}, ${img.alt}, ${img.sort_order}, ${img.is_primary}, NOW())
      `;
    }

    // Insert colors if provided
    const processedColors = processColors(colors);
    for (const c of processedColors) {
      await sql`
        INSERT INTO product_colors (product_id, color_id, sort_order)
        VALUES (${productId}, ${c.color_id}, ${c.sort_order})
        ON CONFLICT DO NOTHING
      `;
    }

    return {
      success: true,
      message: 'Product created successfully',
      product: newProduct,
    };
  } catch (e: any) {
    console.error('Failed to create product:', e);
    if (e?.code === '23503') {
      return error(400, { message: 'Invalid foreign key reference: Check category, space, style, room, or material ID' });
    }
    return error(500, { message: 'Failed to create product', error: e?.message });
  }
});

// 5. Update Product
adminProductRouter.put('/:id', requirePermission('products.write'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || typeof id !== 'string') {
      return error(400, { message: 'Product ID or slug is required' });
    }

    const body = await request.json() as any;
    const { sql } = getProductsDb(env);

    const isNumeric = /^\d+$/.test(id);
    const existing = await sql`
      SELECT * FROM products WHERE ${isNumeric ? sql`id = ${Number(id)}` : sql`slug = ${id}`} LIMIT 1
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    const currentProduct = existing[0];
    const productId = currentProduct.id;

    // Validations
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
      return error(400, { message: 'Product name cannot be empty' });
    }

    if (
      body.price_cents !== undefined &&
      (body.price_cents === null || isNaN(Number(body.price_cents)) || !Number.isFinite(Number(body.price_cents)) || Number(body.price_cents) < 0)
    ) {
      return error(400, { message: 'A valid non-negative price_cents is required' });
    }

    if (body.brand_id !== undefined) {
      const bId = Number(body.brand_id);
      if (isNaN(bId) || bId <= 0) {
        return error(400, { message: 'A valid brand_id is required' });
      }
      const brandCheck = await sql`SELECT id FROM brands WHERE id = ${bId} LIMIT 1`;
      if (brandCheck.length === 0) {
        return error(400, { message: `Brand with ID ${body.brand_id} does not exist` });
      }
    }

    // Slug uniqueness if modifying slug
    let finalSlug = currentProduct.slug;
    if (body.slug !== undefined && typeof body.slug === 'string') {
      const candidateSlug = generateSlug(body.slug);
      if (candidateSlug && candidateSlug !== currentProduct.slug) {
        finalSlug = candidateSlug;
        let counter = 1;
        while (true) {
          const slugCheck = await sql`SELECT id FROM products WHERE slug = ${finalSlug} AND id != ${productId} LIMIT 1`;
          if (slugCheck.length === 0) break;
          finalSlug = `${candidateSlug}-${counter++}`;
        }
      }
    }

    // Prepare updated fields
    const updatedName = body.name !== undefined ? body.name.trim() : currentProduct.name;
    const updatedDescription = body.description !== undefined ? (body.description || '') : currentProduct.description;
    const updatedPriceCents = body.price_cents !== undefined ? Math.round(Number(body.price_cents)) : currentProduct.price_cents;
    const updatedBrandId = body.brand_id !== undefined ? Number(body.brand_id) : currentProduct.brand_id;
    const updatedCategoryId = body.category_id !== undefined ? (body.category_id ? Number(body.category_id) : null) : currentProduct.category_id;
    const updatedSpaceId = body.space_id !== undefined ? (body.space_id ? Number(body.space_id) : null) : currentProduct.space_id;
    const updatedStyleId = body.style_id !== undefined ? (body.style_id ? Number(body.style_id) : null) : currentProduct.style_id;
    const updatedRoomId = body.room_id !== undefined ? (body.room_id ? Number(body.room_id) : null) : currentProduct.room_id;
    const updatedMaterialId = body.material_id !== undefined ? (body.material_id ? Number(body.material_id) : null) : currentProduct.material_id;
    const updatedListingType = body.listing_type !== undefined
      ? (VALID_LISTING_TYPES.includes(body.listing_type) ? body.listing_type : currentProduct.listing_type)
      : currentProduct.listing_type;
    const updatedRating = body.rating !== undefined ? Number(body.rating) : currentProduct.rating;
    const updatedReviewCount = body.review_count !== undefined ? Number(body.review_count) : currentProduct.review_count;
    const updatedPopularity = body.popularity !== undefined ? Number(body.popularity) : currentProduct.popularity;
    const updatedHref = body.href !== undefined ? body.href : currentProduct.href;

    const updated = await sql`
      UPDATE products
      SET 
        name = ${updatedName},
        slug = ${finalSlug},
        description = ${updatedDescription},
        price_cents = ${updatedPriceCents},
        brand_id = ${updatedBrandId},
        category_id = ${updatedCategoryId},
        space_id = ${updatedSpaceId},
        style_id = ${updatedStyleId},
        room_id = ${updatedRoomId},
        material_id = ${updatedMaterialId},
        listing_type = ${updatedListingType},
        rating = ${updatedRating},
        review_count = ${updatedReviewCount},
        popularity = ${updatedPopularity},
        href = ${updatedHref},
        updated_at = NOW()
      WHERE id = ${productId}
      RETURNING id, name, slug, price_cents, updated_at
    `;

    // Replace images if provided
    if (Array.isArray(body.images)) {
      await sql`DELETE FROM product_images WHERE product_id = ${productId}`;
      const processedImages = processImages(body.images, updatedName);
      for (const img of processedImages) {
        await sql`
          INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
          VALUES (${productId}, ${img.src}, ${img.alt}, ${img.sort_order}, ${img.is_primary}, NOW())
        `;
      }
    }

    // Replace colors if provided
    if (Array.isArray(body.colors)) {
      await sql`DELETE FROM product_colors WHERE product_id = ${productId}`;
      const processedColors = processColors(body.colors);
      for (const c of processedColors) {
        await sql`
          INSERT INTO product_colors (product_id, color_id, sort_order)
          VALUES (${productId}, ${c.color_id}, ${c.sort_order})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return {
      success: true,
      message: 'Product updated successfully',
      product: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to update product:', e);
    if (e?.code === '23503') {
      return error(400, { message: 'Invalid foreign key reference: Check category, space, style, room, or material ID' });
    }
    return error(500, { message: 'Failed to update product', error: e?.message });
  }
});

// 6. Delete Product
adminProductRouter.delete('/:id', requirePermission('products.delete'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!id || typeof id !== 'string') {
      return error(400, { message: 'Product ID or slug is required' });
    }

    const { sql } = getProductsDb(env);
    const isNumeric = /^\d+$/.test(id);

    const existing = await sql`
      SELECT id, name FROM products WHERE ${isNumeric ? sql`id = ${Number(id)}` : sql`slug = ${id}`} LIMIT 1
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Product not found' });
    }

    const productId = existing[0].id;

    // Cascade delete relations in products DB
    await sql`DELETE FROM product_images WHERE product_id = ${productId}`;
    await sql`DELETE FROM product_colors WHERE product_id = ${productId}`;
    await sql`DELETE FROM products WHERE id = ${productId}`;

    return {
      success: true,
      message: `Product "${existing[0].name}" (#${productId}) deleted successfully`,
    };
  } catch (e: any) {
    console.error('Failed to delete product:', e);
    return error(500, { message: 'Failed to delete product', error: e?.message });
  }
});

// 7. Bulk Operations on Products
adminProductRouter.post('/bulk', requirePermission('products.bulk'), async (request, env) => {
  try {
    const body = await request.json() as any;
    const { action, product_ids, category_id, brand_id, space_id, style_id, room_id, material_id } = body;

    if (!action || typeof action !== 'string') {
      return error(400, { message: 'Bulk action is required' });
    }

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return error(400, { message: 'product_ids array is required and must not be empty' });
    }

    const numericIds = product_ids
      .map(Number)
      .filter((n): n is number => !isNaN(n) && Number.isInteger(n) && n > 0);

    if (numericIds.length === 0) {
      return error(400, { message: 'No valid numeric product IDs provided' });
    }

    const { sql } = getProductsDb(env);

    if (action === 'delete') {
      await sql`DELETE FROM product_images WHERE product_id = ANY(${numericIds})`;
      await sql`DELETE FROM product_colors WHERE product_id = ANY(${numericIds})`;
      const deleted = await sql`DELETE FROM products WHERE id = ANY(${numericIds}) RETURNING id`;
      return {
        success: true,
        action: 'delete',
        count: deleted.length,
        message: `Successfully deleted ${deleted.length} products`,
      };
    }

    if (action === 'update_category') {
      if (category_id === undefined) {
        return error(400, { message: 'category_id is required for update_category action' });
      }
      const catId = category_id !== null ? Number(category_id) : null;
      if (catId !== null && (isNaN(catId) || catId <= 0)) {
        return error(400, { message: 'A valid category_id is required' });
      }
      if (catId !== null) {
        const catCheck = await sql`SELECT id FROM categories WHERE id = ${catId} LIMIT 1`;
        if (catCheck.length === 0) {
          return error(400, { message: `Category with ID ${catId} does not exist` });
        }
      }
      const updated = await sql`
        UPDATE products 
        SET category_id = ${catId}, updated_at = NOW() 
        WHERE id = ANY(${numericIds})
        RETURNING id
      `;
      return {
        success: true,
        action: 'update_category',
        count: updated.length,
        message: `Updated category for ${updated.length} products`,
      };
    }

    if (action === 'update_brand') {
      if (brand_id === undefined || brand_id === null) {
        return error(400, { message: 'brand_id is required for update_brand action' });
      }
      const bId = Number(brand_id);
      if (isNaN(bId) || bId <= 0) {
        return error(400, { message: 'A valid numeric brand_id is required' });
      }
      const brandCheck = await sql`SELECT id FROM brands WHERE id = ${bId} LIMIT 1`;
      if (brandCheck.length === 0) {
        return error(400, { message: `Brand with ID ${bId} does not exist` });
      }
      const updated = await sql`
        UPDATE products 
        SET brand_id = ${bId}, updated_at = NOW() 
        WHERE id = ANY(${numericIds})
        RETURNING id
      `;
      return {
        success: true,
        action: 'update_brand',
        count: updated.length,
        message: `Updated brand for ${updated.length} products`,
      };
    }

    if (action === 'update_space') {
      if (space_id === undefined) {
        return error(400, { message: 'space_id is required for update_space action' });
      }
      const spId = space_id !== null ? Number(space_id) : null;
      if (spId !== null && (isNaN(spId) || spId <= 0)) {
        return error(400, { message: 'A valid space_id is required' });
      }
      const updated = await sql`
        UPDATE products 
        SET space_id = ${spId}, updated_at = NOW() 
        WHERE id = ANY(${numericIds})
        RETURNING id
      `;
      return {
        success: true,
        action: 'update_space',
        count: updated.length,
        message: `Updated space for ${updated.length} products`,
      };
    }

    if (action === 'update_style') {
      if (style_id === undefined) {
        return error(400, { message: 'style_id is required for update_style action' });
      }
      const stId = style_id !== null ? Number(style_id) : null;
      if (stId !== null && (isNaN(stId) || stId <= 0)) {
        return error(400, { message: 'A valid style_id is required' });
      }
      const updated = await sql`
        UPDATE products 
        SET style_id = ${stId}, updated_at = NOW() 
        WHERE id = ANY(${numericIds})
        RETURNING id
      `;
      return {
        success: true,
        action: 'update_style',
        count: updated.length,
        message: `Updated style for ${updated.length} products`,
      };
    }

    return error(400, { message: `Unsupported bulk action: ${action}` });
  } catch (e: any) {
    console.error('Failed bulk product operation:', e);
    return error(500, { message: 'Failed bulk operation', error: e?.message });
  }
});

// 8. Bulk Product Upload & Import
adminProductRouter.post('/bulk-upload', requirePermission('products.bulk'), async (request, env) => {
  try {
    const rawBody = (await request.json().catch(() => null)) as any;
    if (!rawBody) {
      return error(400, { message: 'Invalid JSON payload provided' });
    }

    const items: any[] = Array.isArray(rawBody)
      ? rawBody
      : (Array.isArray(rawBody.items) ? rawBody.items : (Array.isArray(rawBody.products) ? rawBody.products : (Array.isArray(rawBody.rows) ? rawBody.rows : [])));

    if (items.length === 0) {
      return error(400, { message: 'No product items provided for bulk upload' });
    }

    const isDryRun = rawBody?.dry_run === true || rawBody?.dryRun === true || String(rawBody?.dry_run) === 'true';
    const autoCreateLookups = rawBody?.auto_create_lookups !== false && rawBody?.autoCreateLookups !== false;

    const { sql } = getProductsDb(env);

    // Preload lookup caches
    const [existingBrands, existingCats, existingSpaces, existingStyles, existingRooms, existingMaterials, existingColors] = await Promise.all([
      sql`SELECT id, name, slug FROM brands`,
      sql`SELECT id, name, slug FROM categories`,
      sql`SELECT id, name, slug FROM spaces`,
      sql`SELECT id, name, slug FROM styles`,
      sql`SELECT id, name, slug FROM rooms`,
      sql`SELECT id, name FROM materials`,
      sql`SELECT id, name, hex_code FROM colors`,
    ]);

    const brandMap = new Map<string, number>();
    existingBrands.forEach(b => {
      brandMap.set(b.name.toLowerCase().trim(), b.id);
      brandMap.set(String(b.id), b.id);
    });

    const categoryMap = new Map<string, number>();
    existingCats.forEach(c => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
      categoryMap.set(String(c.id), c.id);
    });

    const spaceMap = new Map<string, number>();
    existingSpaces.forEach(s => {
      spaceMap.set(s.name.toLowerCase().trim(), s.id);
      spaceMap.set(String(s.id), s.id);
    });

    const styleMap = new Map<string, number>();
    existingStyles.forEach(s => {
      styleMap.set(s.name.toLowerCase().trim(), s.id);
      styleMap.set(String(s.id), s.id);
    });

    const roomMap = new Map<string, number>();
    existingRooms.forEach(r => {
      roomMap.set(r.name.toLowerCase().trim(), r.id);
      roomMap.set(String(r.id), r.id);
    });

    const materialMap = new Map<string, number>();
    existingMaterials.forEach(m => {
      materialMap.set(m.name.toLowerCase().trim(), m.id);
      materialMap.set(String(m.id), m.id);
    });

    const colorMap = new Map<string, number>();
    existingColors.forEach(c => {
      colorMap.set(c.name.toLowerCase().trim(), c.id);
      if (c.hex_code) colorMap.set(c.hex_code.toLowerCase().trim(), c.id);
      colorMap.set(String(c.id), c.id);
    });

    // Helper functions for lookup resolution and on-the-fly creation
    async function resolveBrandId(input: any): Promise<number | null> {
      if (input === undefined || input === null) return existingBrands[0]?.id || null;
      if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input;
      if (typeof input === 'string' && /^\d+$/.test(input.trim()) && Number(input) > 0) return Number(input);
      const key = String(input).toLowerCase().trim();
      if (brandMap.has(key)) return brandMap.get(key)!;

      if (autoCreateLookups && typeof input === 'string' && input.trim()) {
        const brandName = input.trim();
        const brandSlug = generateSlug(brandName) || `brand-${Date.now()}`;
        const inserted = await sql`
          INSERT INTO brands (name, slug, created_at)
          VALUES (${brandName}, ${brandSlug}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const newId = inserted[0]?.id;
        if (newId) {
          brandMap.set(key, newId);
          return newId;
        }
      }
      return existingBrands[0]?.id || null;
    }

    async function resolveCategoryId(input: any): Promise<number | null> {
      if (input === undefined || input === null) return null;
      if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input;
      if (typeof input === 'string' && /^\d+$/.test(input.trim()) && Number(input) > 0) return Number(input);
      const key = String(input).toLowerCase().trim();
      if (categoryMap.has(key)) return categoryMap.get(key)!;

      if (autoCreateLookups && typeof input === 'string' && input.trim()) {
        const catName = input.trim();
        const catSlug = generateSlug(catName) || `cat-${Date.now()}`;
        const inserted = await sql`
          INSERT INTO categories (name, slug, created_at)
          VALUES (${catName}, ${catSlug}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const newId = inserted[0]?.id;
        if (newId) {
          categoryMap.set(key, newId);
          return newId;
        }
      }
      return null;
    }

    async function resolveSpaceId(input: any): Promise<number | null> {
      if (input === undefined || input === null) return null;
      if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input;
      if (typeof input === 'string' && /^\d+$/.test(input.trim()) && Number(input) > 0) return Number(input);
      const key = String(input).toLowerCase().trim();
      if (spaceMap.has(key)) return spaceMap.get(key)!;

      if (autoCreateLookups && typeof input === 'string' && input.trim()) {
        const spaceName = input.trim();
        const spaceSlug = generateSlug(spaceName) || `space-${Date.now()}`;
        const inserted = await sql`
          INSERT INTO spaces (name, slug, created_at)
          VALUES (${spaceName}, ${spaceSlug}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const newId = inserted[0]?.id;
        if (newId) {
          spaceMap.set(key, newId);
          return newId;
        }
      }
      return null;
    }

    async function resolveStyleId(input: any): Promise<number | null> {
      if (input === undefined || input === null) return null;
      if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input;
      if (typeof input === 'string' && /^\d+$/.test(input.trim()) && Number(input) > 0) return Number(input);
      const key = String(input).toLowerCase().trim();
      if (styleMap.has(key)) return styleMap.get(key)!;

      if (autoCreateLookups && typeof input === 'string' && input.trim()) {
        const styleName = input.trim();
        const styleSlug = generateSlug(styleName) || `style-${Date.now()}`;
        const inserted = await sql`
          INSERT INTO styles (name, slug, created_at)
          VALUES (${styleName}, ${styleSlug}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const newId = inserted[0]?.id;
        if (newId) {
          styleMap.set(key, newId);
          return newId;
        }
      }
      return null;
    }

    async function resolveRoomId(input: any): Promise<number | null> {
      if (input === undefined || input === null) return null;
      if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input;
      if (typeof input === 'string' && /^\d+$/.test(input.trim()) && Number(input) > 0) return Number(input);
      const key = String(input).toLowerCase().trim();
      if (roomMap.has(key)) return roomMap.get(key)!;

      if (autoCreateLookups && typeof input === 'string' && input.trim()) {
        const roomName = input.trim();
        const roomSlug = generateSlug(roomName) || `room-${Date.now()}`;
        const inserted = await sql`
          INSERT INTO rooms (name, slug, created_at)
          VALUES (${roomName}, ${roomSlug}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const newId = inserted[0]?.id;
        if (newId) {
          roomMap.set(key, newId);
          return newId;
        }
      }
      return null;
    }

    async function resolveMaterialId(input: any): Promise<number | null> {
      if (input === undefined || input === null) return null;
      if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input;
      if (typeof input === 'string' && /^\d+$/.test(input.trim()) && Number(input) > 0) return Number(input);
      const key = String(input).toLowerCase().trim();
      if (materialMap.has(key)) return materialMap.get(key)!;

      if (autoCreateLookups && typeof input === 'string' && input.trim()) {
        const matName = input.trim();
        const inserted = await sql`
          INSERT INTO materials (name, created_at)
          VALUES (${matName}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const newId = inserted[0]?.id;
        if (newId) {
          materialMap.set(key, newId);
          return newId;
        }
      }
      return null;
    }

    const importedProducts: { id: number; name: string; slug: string; price_cents: number }[] = [];
    const errors: { row: number; name?: string; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      const rowNum = i + 1;

      try {
        if (!raw || typeof raw !== 'object') {
          throw new Error('Product row must be an object');
        }

        const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
        if (!rawName) {
          throw new Error('Product name is required');
        }

        // Determine price in cents
        let priceCents: number;
        if (raw.price_cents !== undefined && raw.price_cents !== null) {
          priceCents = Math.round(Number(raw.price_cents));
        } else if (raw.price !== undefined && raw.price !== null) {
          priceCents = Math.round(Number(raw.price) * 100);
        } else if (raw.mrp !== undefined && raw.mrp !== null) {
          priceCents = Math.round(Number(raw.mrp) * 100);
        } else {
          throw new Error('Price is required (price_cents or price)');
        }

        if (isNaN(priceCents) || !Number.isFinite(priceCents) || priceCents < 0) {
          throw new Error('A valid non-negative price is required');
        }

        // Resolve lookups
        const brandId = await resolveBrandId(raw.brand_id ?? raw.brand ?? raw.brand_name);
        if (!brandId) {
          throw new Error('Valid brand is required');
        }

        const categoryId = await resolveCategoryId(raw.category_id ?? raw.category ?? raw.category_name);
        const spaceId = await resolveSpaceId(raw.space_id ?? raw.space ?? raw.space_name);
        const styleId = await resolveStyleId(raw.style_id ?? raw.style ?? raw.style_name);
        const roomId = await resolveRoomId(raw.room_id ?? raw.room ?? raw.room_name);
        const materialId = await resolveMaterialId(raw.material_id ?? raw.material ?? raw.material_name);

        const listingType = (raw.listing_type === 'category' || raw.listing_type === 'space' || raw.listing_type === 'style')
          ? raw.listing_type
          : 'category';

        // Generate unique slug
        const candidateSlug = (typeof raw.slug === 'string' && raw.slug.trim())
          ? generateSlug(raw.slug)
          : generateSlug(rawName);

        const baseSlug = candidateSlug || `product-${Date.now()}`;
        let finalSlug = baseSlug;
        let counter = 1;

        if (!isDryRun) {
          while (true) {
            const existingSlug = await sql`SELECT id FROM products WHERE slug = ${finalSlug} LIMIT 1`;
            if (existingSlug.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
          }

          const inserted = await sql`
            INSERT INTO products (
              name, slug, description, price_cents, brand_id, category_id,
              space_id, style_id, room_id, material_id, listing_type,
              rating, review_count, popularity, href, created_at, updated_at
            )
            VALUES (
              ${rawName}, ${finalSlug}, ${raw.description || ''}, ${priceCents}, ${brandId},
              ${categoryId ? Number(categoryId) : null},
              ${spaceId ? Number(spaceId) : null},
              ${styleId ? Number(styleId) : null},
              ${roomId ? Number(roomId) : null},
              ${materialId ? Number(materialId) : null},
              ${listingType},
              ${Number(raw.rating) || 0}, ${Number(raw.review_count) || 0}, ${Number(raw.popularity) || 0},
              ${raw.href || null},
              NOW(), NOW()
            )
            RETURNING id, name, slug, price_cents
          `;

          const newProduct = inserted[0];
          const productId = newProduct.id;

          // Insert images
          const rawImages = Array.isArray(raw.images) ? raw.images : (raw.image_src ? [raw.image_src] : (raw.image ? [raw.image] : []));
          const processedImages = processImages(rawImages, rawName);
          for (const img of processedImages) {
            await sql`
              INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
              VALUES (${productId}, ${img.src}, ${img.alt}, ${img.sort_order}, ${img.is_primary}, NOW())
            `;
          }

          // Insert colors
          if (Array.isArray(raw.colors)) {
            const processedColors = processColors(raw.colors);
            for (const c of processedColors) {
              await sql`
                INSERT INTO product_colors (product_id, color_id, sort_order)
                VALUES (${productId}, ${c.color_id}, ${c.sort_order})
                ON CONFLICT DO NOTHING
              `;
            }
          }

          importedProducts.push({
            id: newProduct.id,
            name: newProduct.name,
            slug: newProduct.slug,
            price_cents: newProduct.price_cents,
          });
        } else {
          // Dry run preview record
          importedProducts.push({
            id: rowNum,
            name: rawName,
            slug: finalSlug,
            price_cents: priceCents,
          });
        }
      } catch (rowErr: any) {
        errors.push({
          row: rowNum,
          name: raw?.name ? String(raw.name) : undefined,
          error: rowErr?.message || 'Unknown error during row import',
        });
      }
    }

    return {
      success: errors.length === 0 || importedProducts.length > 0,
      dry_run: isDryRun,
      total: items.length,
      imported_count: importedProducts.length,
      failed_count: errors.length,
      imported_products: importedProducts,
      errors: errors.length > 0 ? errors : undefined,
      message: isDryRun
        ? `Dry run validation complete: ${importedProducts.length} valid, ${errors.length} errors`
        : `Successfully imported ${importedProducts.length} of ${items.length} products`,
    };
  } catch (e: any) {
    console.error('Failed bulk product upload:', e);
    return error(500, { message: 'Failed to process bulk product upload', error: e?.message });
  }
});
