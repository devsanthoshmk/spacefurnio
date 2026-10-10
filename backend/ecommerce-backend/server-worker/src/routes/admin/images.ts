import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getProductsDb } from '../../utils/db';
import { Env } from '../../types';

export const adminImageRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/images',
});

// 1. Image Audit
adminImageRouter.get('/audit', requirePermission('media.manage'), async (request, env) => {
  try {
    const { sql } = getProductsDb(env);

    const [
      productCounts,
      productsMissingImages,
      duplicateImages,
      allImagesStats,
      allImages,
    ] = await Promise.all([
      sql`
        SELECT 
          COUNT(DISTINCT p.id)::int as total_products,
          COUNT(DISTINCT pi.product_id)::int as products_with_images
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
      `,
      sql`
        SELECT p.id, p.name, p.slug, p.price_cents, b.name as brand_name
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE pi.id IS NULL
        ORDER BY p.id ASC
        LIMIT 50
      `,
      sql`
        SELECT src, COUNT(*)::int as usage_count, array_agg(DISTINCT product_id) as product_ids
        FROM product_images
        GROUP BY src
        HAVING COUNT(*) > 1
        ORDER BY usage_count DESC
        LIMIT 20
      `,
      sql`
        SELECT 
          COUNT(*)::int as total_images,
          COUNT(CASE WHEN is_primary = true THEN 1 END)::int as primary_images_count,
          COUNT(CASE WHEN alt IS NULL OR TRIM(alt) = '' THEN 1 END)::int as missing_alt_count
        FROM product_images
      `,
      sql`
        SELECT id, product_id, src, alt, is_primary, sort_order, created_at
        FROM product_images
        ORDER BY created_at DESC
        LIMIT 100
      `,
    ]);

    const totalProducts = Number(productCounts[0]?.total_products || 0);
    const withImages = Number(productCounts[0]?.products_with_images || 0);
    const missingImagesCount = Math.max(0, totalProducts - withImages);
    const totalImagesCount = Number(allImagesStats[0]?.total_images || 0);
    const missingAltCount = Number(allImagesStats[0]?.missing_alt_count || 0);

    return {
      summary: {
        total_products: totalProducts,
        products_with_images: withImages,
        products_missing_images_count: missingImagesCount,
        total_images: totalImagesCount,
        primary_images: Number(allImagesStats[0]?.primary_images_count || 0),
        missing_alt_count: missingAltCount,
        duplicate_url_count: duplicateImages.length,
      },
      missing_images: productsMissingImages.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand_name,
      })),
      duplicates: duplicateImages.map(d => ({
        src: d.src,
        usage_count: Number(d.usage_count),
        product_ids: d.product_ids,
      })),
      recent_assets: allImages,
    };
  } catch (e: any) {
    console.error('Failed to run image audit:', e);
    return error(500, { message: 'Failed to run image audit', error: e?.message });
  }
});

// 2. List Images
adminImageRouter.get('/', requirePermission('media.manage'), async (request, env) => {
  try {
    const url = new URL(request.url);
    const rawPage = Number(url.searchParams.get('page'));
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const rawLimit = Number(url.searchParams.get('limit'));
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 25 : rawLimit));
    const search = (url.searchParams.get('search') || '').trim();
    const rawProductId = url.searchParams.get('product_id');
    const productId = rawProductId !== null && rawProductId !== '' && !isNaN(Number(rawProductId)) ? Number(rawProductId) : null;
    const primaryOnly = url.searchParams.get('primary_only') === 'true';

    const offset = (page - 1) * limit;
    const { sql } = getProductsDb(env);

    const rows = await sql`
      WITH filtered AS (
        SELECT 
          pi.id, pi.product_id, pi.src, pi.alt, pi.sort_order, pi.is_primary, pi.created_at,
          p.name as product_name, p.slug as product_slug
        FROM product_images pi
        LEFT JOIN products p ON pi.product_id = p.id
        WHERE 
          (${search === '' ? sql`true` : sql`(pi.src ILIKE ${'%' + search + '%'} OR pi.alt ILIKE ${'%' + search + '%'} OR p.name ILIKE ${'%' + search + '%'})`})
          AND (${productId !== null ? sql`pi.product_id = ${productId}` : sql`true`})
          AND (${primaryOnly ? sql`pi.is_primary = true` : sql`true`})
      )
      SELECT 
        f.*,
        COUNT(*) OVER() as total_count
      FROM filtered f
      ORDER BY f.created_at DESC, f.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      images: rows.map(r => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.product_name || `Product #${r.product_id}`,
        product_slug: r.product_slug || '',
        src: r.src,
        alt: r.alt,
        sort_order: r.sort_order,
        is_primary: Boolean(r.is_primary),
        created_at: r.created_at,
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
    console.error('Failed to list images:', e);
    return error(500, { message: 'Failed to fetch image assets', error: e?.message });
  }
});

// 3. Upload / Import Image
adminImageRouter.post('/upload', requirePermission('media.manage'), async (request, env) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let src = '';
    let alt = '';
    let productId: number | null = null;
    let isPrimary = false;
    let sortOrder = 0;

    if (contentType.includes('application/json')) {
      const body = await request.json() as any;
      src = body.src || body.url || body.image_url;
      alt = body.alt || '';
      const rawProdId = body.product_id;
      if (rawProdId !== undefined && rawProdId !== null && (isNaN(Number(rawProdId)) || Number(rawProdId) <= 0)) {
        return error(400, { message: 'Invalid product_id provided' });
      }
      productId = rawProdId ? Number(rawProdId) : null;
      isPrimary = Boolean(body.is_primary);
      sortOrder = Number(body.sort_order || 0);
      if (isNaN(sortOrder)) sortOrder = 0;

      if (!src || typeof src !== 'string' || src.trim().length === 0) {
        return error(400, { message: 'Image URL or base64 data string is required' });
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const urlField = formData.get('url') as string | null;
      alt = (formData.get('alt') as string) || '';
      const prodField = formData.get('product_id');
      if (prodField !== null && prodField !== undefined && (isNaN(Number(prodField)) || Number(prodField) <= 0)) {
        return error(400, { message: 'Invalid product_id provided' });
      }
      productId = prodField ? Number(prodField) : null;
      isPrimary = formData.get('is_primary') === 'true';
      sortOrder = Number(formData.get('sort_order') || 0);
      if (isNaN(sortOrder)) sortOrder = 0;

      if (urlField && urlField.trim().length > 0) {
        src = urlField.trim();
      } else if (file) {
        // Convert uploaded binary to Base64 Data URL for standalone edge worker storage
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = file.type || 'image/jpeg';
        src = `data:${mimeType};base64,${base64}`;
        if (!alt) alt = file.name;
      } else {
        return error(400, { message: 'No file or url provided in form data' });
      }
    } else {
      return error(400, { message: 'Unsupported content-type. Use application/json or multipart/form-data' });
    }

    const { sql } = getProductsDb(env);

    let insertedRecord = null;
    if (productId) {
      const prodCheck = await sql`SELECT id, name FROM products WHERE id = ${productId} LIMIT 1`;
      if (prodCheck.length === 0) {
        return error(404, { message: `Product #${productId} not found` });
      }

      if (!alt) alt = prodCheck[0].name;

      // Auto-set as primary if specified or if product has 0 existing images
      if (!isPrimary) {
        const existingImages = await sql`SELECT COUNT(*)::int as count FROM product_images WHERE product_id = ${productId}`;
        if (Number(existingImages[0]?.count || 0) === 0) {
          isPrimary = true;
        }
      }

      if (isPrimary) {
        await sql`UPDATE product_images SET is_primary = false WHERE product_id = ${productId}`;
      }

      const inserted = await sql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${productId}, ${src.trim()}, ${alt}, ${sortOrder}, ${isPrimary}, NOW())
        RETURNING *
      `;
      insertedRecord = inserted[0];
    }

    return {
      success: true,
      message: 'Image uploaded successfully',
      url: src,
      record: insertedRecord,
    };
  } catch (e: any) {
    console.error('Failed to upload image:', e);
    return error(500, { message: 'Failed to upload image', error: e?.message });
  }
});

// 4. Link Image to Product
adminImageRouter.post('/link', requirePermission('media.manage'), async (request, env) => {
  try {
    const body = await request.json() as any;
    const { product_id, src, alt = '', sort_order = 0, is_primary = false } = body;

    const pid = Number(product_id);
    if (!product_id || isNaN(pid) || pid <= 0) {
      return error(400, { message: 'Valid product_id is required' });
    }

    if (!src || typeof src !== 'string' || src.trim().length === 0) {
      return error(400, { message: 'Image src URL is required' });
    }

    const { sql } = getProductsDb(env);

    const prodCheck = await sql`SELECT id, name FROM products WHERE id = ${pid} LIMIT 1`;
    if (prodCheck.length === 0) {
      return error(404, { message: `Product #${pid} not found` });
    }

    let isPrimary = Boolean(is_primary);
    if (!isPrimary) {
      const existingImages = await sql`SELECT COUNT(*)::int as count FROM product_images WHERE product_id = ${pid}`;
      if (Number(existingImages[0]?.count || 0) === 0) {
        isPrimary = true;
      }
    }

    if (isPrimary) {
      await sql`UPDATE product_images SET is_primary = false WHERE product_id = ${pid}`;
    }

    const sortOrderNum = isNaN(Number(sort_order)) ? 0 : Number(sort_order);

    const inserted = await sql`
      INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
      VALUES (${pid}, ${src.trim()}, ${alt || prodCheck[0].name}, ${sortOrderNum}, ${isPrimary}, NOW())
      RETURNING *
    `;

    return {
      success: true,
      message: 'Image linked to product successfully',
      image: inserted[0],
    };
  } catch (e: any) {
    console.error('Failed to link image:', e);
    return error(500, { message: 'Failed to link image', error: e?.message });
  }
});

// 5. Update Image Metadata (alt, sort_order, is_primary)
adminImageRouter.put('/:id', requirePermission('media.manage'), async (request, env) => {
  try {
    const { id } = request.params;
    const imgId = Number(id);
    if (!id || isNaN(imgId) || imgId <= 0) {
      return error(404, { message: 'Image record not found' });
    }

    const body = await request.json() as any;
    const { alt, sort_order, is_primary, src } = body;

    const { sql } = getProductsDb(env);

    const existing = await sql`SELECT id, product_id, is_primary FROM product_images WHERE id = ${imgId} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Image record not found' });
    }

    const img = existing[0];

    if (is_primary === true) {
      await sql`UPDATE product_images SET is_primary = false WHERE product_id = ${img.product_id} AND id != ${imgId}`;
    }

    const updated = await sql`
      UPDATE product_images
      SET 
        src = COALESCE(${src !== undefined ? src.trim() : null}, src),
        alt = COALESCE(${alt !== undefined ? alt : null}, alt),
        sort_order = COALESCE(${sort_order !== undefined && !isNaN(Number(sort_order)) ? Number(sort_order) : null}, sort_order),
        is_primary = COALESCE(${is_primary !== undefined ? Boolean(is_primary) : null}, is_primary)
      WHERE id = ${imgId}
      RETURNING *
    `;

    return {
      success: true,
      message: 'Image updated successfully',
      image: updated[0],
    };
  } catch (e: any) {
    console.error('Failed to update image:', e);
    return error(500, { message: 'Failed to update image metadata', error: e?.message });
  }
});

// 6. Delete Image
adminImageRouter.delete('/:id', requirePermission('media.manage'), async (request, env) => {
  try {
    const { id } = request.params;
    const imgId = Number(id);
    if (!id || isNaN(imgId) || imgId <= 0) {
      return error(404, { message: 'Image record not found' });
    }

    const { sql } = getProductsDb(env);

    const existing = await sql`SELECT id, product_id, is_primary FROM product_images WHERE id = ${imgId} LIMIT 1`;
    if (existing.length === 0) {
      return error(404, { message: 'Image record not found' });
    }

    const img = existing[0];
    await sql`DELETE FROM product_images WHERE id = ${imgId}`;

    // If deleted image was primary, make the first remaining image primary
    if (img.is_primary) {
      const remaining = await sql`
        SELECT id FROM product_images WHERE product_id = ${img.product_id} ORDER BY sort_order ASC, id ASC LIMIT 1
      `;
      if (remaining.length > 0) {
        await sql`UPDATE product_images SET is_primary = true WHERE id = ${remaining[0].id}`;
      }
    }

    return {
      success: true,
      message: 'Image deleted successfully',
    };
  } catch (e: any) {
    console.error('Failed to delete image:', e);
    return error(500, { message: 'Failed to delete image', error: e?.message });
  }
});
