import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateToken } from '../src/utils/jwks';
import { getDb, getProductsDb } from '../src/utils/db';

describe('Admin Products API Endpoints, Edge Cases & Permissions', () => {
  let adminToken: string;
  let catalogToken: string;
  let supportToken: string;
  let customerToken: string;

  let testAdminId: string;
  let testCatalogId: string;
  let testSupportId: string;
  let testUserId: string;

  let testBrandId: number;
  let testBrandId2: number;
  let testCategoryId: number;
  let testCategoryId2: number;
  let testSpaceId: number;
  let testStyleId: number;
  let testRoomId: number;
  let testMaterialId: number;
  let testColorId1: number;
  let testColorId2: number;

  let createdProductId: number;
  let createdProductSlug: string;
  let bulkProductIds: number[] = [];

  beforeAll(async () => {
    testAdminId = crypto.randomUUID();
    testCatalogId = crypto.randomUUID();
    testSupportId = crypto.randomUUID();
    testUserId = crypto.randomUUID();

    const { sql: mainSql } = getDb(env);
    const { sql: prodSql } = getProductsDb(env);

    // 1. Ensure roles exist in main DB
    await mainSql`
      INSERT INTO roles (id, description)
      VALUES 
        ('admin', 'Administrator'),
        ('super_admin', 'Super Admin'),
        ('catalog_inventory', 'Catalog Inventory'),
        ('customer_support', 'Customer Support'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    const adminEmail = `admin_prod_${testAdminId.slice(0, 8)}@spacefurnio.com`;
    const catalogEmail = `catalog_prod_${testCatalogId.slice(0, 8)}@spacefurnio.com`;
    const supportEmail = `support_prod_${testSupportId.slice(0, 8)}@spacefurnio.com`;
    const customerEmail = `customer_prod_${testUserId.slice(0, 8)}@spacefurnio.com`;

    // 2. Insert test users and roles in main DB
    await mainSql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Administrator'),
        ('catalog_inventory', 'Catalog Inventory'),
        ('customer_support', 'Customer Support'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    await mainSql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${testAdminId}, ${adminEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testCatalogId}, ${catalogEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testSupportId}, ${supportEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testUserId}, ${customerEmail}, 'dummy_hash', true, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    await mainSql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${testAdminId}, 'super_admin'),
        (${testCatalogId}, 'catalog_inventory'),
        (${testSupportId}, 'customer_support'),
        (${testUserId}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    adminToken = await generateToken({ id: testAdminId, email: adminEmail, role: 'super_admin' }, env.RSA_PRIVATE_KEY_PEM);
    catalogToken = await generateToken({ id: testCatalogId, email: catalogEmail, role: 'catalog_inventory' }, env.RSA_PRIVATE_KEY_PEM);
    supportToken = await generateToken({ id: testSupportId, email: supportEmail, role: 'customer_support' }, env.RSA_PRIVATE_KEY_PEM);
    customerToken = await generateToken({ id: testUserId, email: customerEmail, role: 'customer' }, env.RSA_PRIVATE_KEY_PEM);

    // Cleanup any lingering test products
    await prodSql`DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE slug LIKE 'modern-teak-dining-table%')`;
    await prodSql`DELETE FROM product_colors WHERE product_id IN (SELECT id FROM products WHERE slug LIKE 'modern-teak-dining-table%')`;
    await prodSql`DELETE FROM products WHERE slug LIKE 'modern-teak-dining-table%'`;

    // 2. Insert test taxonomy in products DB
    const brandRes = await prodSql`
      INSERT INTO brands (name, slug, created_at)
      VALUES ('TestBrand Products', 'testbrand-products', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testBrandId = brandRes[0].id;

    const brandRes2 = await prodSql`
      INSERT INTO brands (name, slug, created_at)
      VALUES ('TestBrand Products 2', 'testbrand-products-2', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testBrandId2 = brandRes2[0].id;

    const catRes = await prodSql`
      INSERT INTO categories (name, slug, created_at)
      VALUES ('Test Category A', 'test-category-a', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testCategoryId = catRes[0].id;

    const catRes2 = await prodSql`
      INSERT INTO categories (name, slug, created_at)
      VALUES ('Test Category B', 'test-category-b', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testCategoryId2 = catRes2[0].id;

    const spaceRes = await prodSql`
      INSERT INTO spaces (name, slug, created_at)
      VALUES ('Test Space Living', 'test-space-living', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testSpaceId = spaceRes[0].id;

    const styleRes = await prodSql`
      INSERT INTO styles (name, slug, created_at)
      VALUES ('Test Style Nordic', 'test-style-nordic', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testStyleId = styleRes[0].id;

    const roomRes = await prodSql`
      INSERT INTO rooms (name, slug, created_at)
      VALUES ('Test Room Lounge', 'test-room-lounge', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testRoomId = roomRes[0].id;

    const matRes = await prodSql`
      INSERT INTO materials (name, created_at)
      VALUES ('Test Solid Teak', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    testMaterialId = matRes[0].id;

    const colorRes1 = await prodSql`
      INSERT INTO colors (name, hex_code, created_at)
      VALUES ('Test Walnut Brown', '#5C4033', NOW())
      ON CONFLICT (name) DO UPDATE SET hex_code = EXCLUDED.hex_code
      RETURNING id
    `;
    testColorId1 = colorRes1[0].id;

    const colorRes2 = await prodSql`
      INSERT INTO colors (name, hex_code, created_at)
      VALUES ('Test Slate Grey', '#708090', NOW())
      ON CONFLICT (name) DO UPDATE SET hex_code = EXCLUDED.hex_code
      RETURNING id
    `;
    testColorId2 = colorRes2[0].id;
  });

  afterAll(async () => {
    const { sql: mainSql } = getDb(env);
    const { sql: prodSql } = getProductsDb(env);

    try {
      // 1. Delete all products (and their images/colors) associated with test brands
      await prodSql`
        DELETE FROM product_images 
        WHERE product_id IN (SELECT id FROM products WHERE brand_id IN (${testBrandId}, ${testBrandId2}))
      `;
      await prodSql`
        DELETE FROM product_colors 
        WHERE product_id IN (SELECT id FROM products WHERE brand_id IN (${testBrandId}, ${testBrandId2}))
      `;
      await prodSql`
        DELETE FROM products 
        WHERE brand_id IN (${testBrandId}, ${testBrandId2})
      `;

      // 2. Cleanup taxonomy
      await prodSql`DELETE FROM colors WHERE id IN (${testColorId1}, ${testColorId2})`;
      await prodSql`DELETE FROM materials WHERE id = ${testMaterialId}`;
      await prodSql`DELETE FROM rooms WHERE id = ${testRoomId}`;
      await prodSql`DELETE FROM styles WHERE id = ${testStyleId}`;
      await prodSql`DELETE FROM spaces WHERE id = ${testSpaceId}`;
      await prodSql`DELETE FROM categories WHERE id IN (${testCategoryId}, ${testCategoryId2})`;
      await prodSql`DELETE FROM brands WHERE id IN (${testBrandId}, ${testBrandId2})`;

      // 3. Cleanup users
      await mainSql`DELETE FROM user_roles WHERE user_id IN (${testAdminId}, ${testCatalogId}, ${testSupportId}, ${testUserId})`;
      await mainSql`DELETE FROM users WHERE id IN (${testAdminId}, ${testCatalogId}, ${testSupportId}, ${testUserId})`;
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  // 1. Taxonomy / Lookups
  it('1. GET /api/admin/products/lookups - returns taxonomy and metadata', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/products/lookups', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data.categories)).toBe(true);
    expect(Array.isArray(data.spaces)).toBe(true);
    expect(Array.isArray(data.styles)).toBe(true);
    expect(Array.isArray(data.rooms)).toBe(true);
    expect(Array.isArray(data.materials)).toBe(true);
    expect(Array.isArray(data.brands)).toBe(true);
    expect(Array.isArray(data.colors)).toBe(true);
    expect(Array.isArray(data.listing_types)).toBe(true);
    expect(data.listing_types).toContain('category');
    expect(data.listing_types).toContain('space');
    expect(data.listing_types).toContain('style');
  });

  // 2. Product Creation (POST)
  it('2. POST /api/admin/products - creates a product with images and colors', async () => {
    const payload = {
      name: 'Modern Teak Dining Table',
      slug: 'modern-teak-dining-table',
      description: 'Handcrafted solid teak table for 6 people.',
      price_cents: 84999,
      brand_id: testBrandId,
      category_id: testCategoryId,
      space_id: testSpaceId,
      style_id: testStyleId,
      room_id: testRoomId,
      material_id: testMaterialId,
      listing_type: 'category',
      rating: 4.8,
      review_count: 12,
      popularity: 85,
      href: '/products/modern-teak-dining-table',
      images: [
        { src: 'https://images.unsplash.com/photo-table-1', alt: 'Front view', is_primary: false, sort_order: 1 },
        { src: 'https://images.unsplash.com/photo-table-primary', alt: 'Hero main view', is_primary: true, sort_order: 0 },
        { src: 'https://images.unsplash.com/photo-table-2', alt: 'Angle detail view', sort_order: 2 },
      ],
      colors: [
        { color_id: testColorId1, sort_order: 0 },
        { color_id: testColorId2, sort_order: 1 },
      ],
    };

    const res = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.product).toBeDefined();
    expect(body.product.id).toBeTypeOf('number');
    expect(body.product.name).toBe('Modern Teak Dining Table');
    expect(body.product.slug).toBe('modern-teak-dining-table');
    expect(body.product.price_cents).toBe(84999);

    createdProductId = body.product.id;
    createdProductSlug = body.product.slug;
  });

  // 3. Product Detail (GET /:id) by ID and Slug
  it('3. GET /api/admin/products/:id - retrieves product by numeric ID and validates relations', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const product = await res.json() as any;
    expect(product.id).toBe(createdProductId);
    expect(product.name).toBe('Modern Teak Dining Table');
    expect(product.price_formatted).toBe('₹849.99');
    expect(product.brand).toBeDefined();
    expect(product.brand.id).toBe(testBrandId);
    expect(product.category.id).toBe(testCategoryId);
    expect(product.space.id).toBe(testSpaceId);
    expect(product.style.id).toBe(testStyleId);
    expect(product.room.id).toBe(testRoomId);
    expect(product.material.name).toBe('Test Solid Teak');

    // Validate images & primary image designation
    expect(Array.isArray(product.images)).toBe(true);
    expect(product.images.length).toBe(3);
    const primaryImg = product.images.find((i: any) => i.is_primary === true);
    expect(primaryImg).toBeDefined();
    expect(primaryImg.src).toBe('https://images.unsplash.com/photo-table-primary');

    // Validate colors
    expect(Array.isArray(product.colors)).toBe(true);
    expect(product.colors.length).toBe(2);
    expect(product.colors.map((c: any) => c.id)).toContain(testColorId1);
    expect(product.colors.map((c: any) => c.id)).toContain(testColorId2);
  });

  it('4. GET /api/admin/products/:slug - retrieves product by slug', async () => {
    const res = await SELF.fetch(`https://example.com/api/admin/products/${createdProductSlug}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const product = await res.json() as any;
    expect(product.id).toBe(createdProductId);
    expect(product.slug).toBe(createdProductSlug);
  });

  // 4. Duplicate slug handling on creation
  it('5. POST /api/admin/products - automatically handles duplicate slugs without failing', async () => {
    const payload = {
      name: 'Modern Teak Dining Table',
      slug: 'modern-teak-dining-table', // duplicate slug
      price_cents: 99900,
      brand_id: testBrandId,
    };

    const res = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.product.slug).not.toBe('modern-teak-dining-table');
    expect(body.product.slug.startsWith('modern-teak-dining-table-')).toBe(true);

    bulkProductIds.push(body.product.id);
  });

  // 5. Product Update (PUT)
  it('6. PUT /api/admin/products/:id - updates product fields and replaces images & colors', async () => {
    const updatePayload = {
      name: 'Updated Modern Oak Dining Table',
      price_cents: 89900,
      description: 'Now crafted from European White Oak.',
      category_id: null, // Test setting relation to null
      images: [
        'https://images.unsplash.com/photo-single-image-url',
      ],
      colors: [testColorId1],
    };

    const res = await SELF.fetch(`https://example.com/api/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updatePayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.product.name).toBe('Updated Modern Oak Dining Table');
    expect(body.product.price_cents).toBe(89900);

    // Verify detail reflects null category and updated image/color lists
    const detailRes = await SELF.fetch(`https://example.com/api/admin/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detail = await detailRes.json() as any;
    expect(detail.name).toBe('Updated Modern Oak Dining Table');
    expect(detail.description).toBe('Now crafted from European White Oak.');
    expect(detail.category).toBeNull();
    expect(detail.images.length).toBe(1);
    expect(detail.images[0].src).toBe('https://images.unsplash.com/photo-single-image-url');
    expect(detail.images[0].is_primary).toBe(true);
    expect(detail.colors.length).toBe(1);
    expect(detail.colors[0].id).toBe(testColorId1);
  });

  // 6. List & Search & Filters & Pagination
  it('7. GET /api/admin/products - filters by search, brand, price range, and sorting', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/admin/products?search=Updated%20Modern&brand=${testBrandId}&min_price=50000&max_price=100000&sort=price_desc`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products.length).toBeGreaterThanOrEqual(1);
    const found = data.products.find((p: any) => p.id === createdProductId);
    expect(found).toBeDefined();
    expect(found.brand.id).toBe(testBrandId);
    expect(found.primary_image).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  // 7. Bulk Operations
  it('8. POST /api/admin/products/bulk - performs bulk category and brand update', async () => {
    // Create 2 additional test products for bulk testing
    const p1Res = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Bulk Product 1', price_cents: 12000, brand_id: testBrandId }),
    });
    const p1 = await p1Res.json() as any;

    const p2Res = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Bulk Product 2', price_cents: 15000, brand_id: testBrandId }),
    });
    const p2 = await p2Res.json() as any;

    const pIds = [p1.product.id, p2.product.id];
    bulkProductIds.push(...pIds);

    // Bulk update category
    const catBulkRes = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'update_category', product_ids: pIds, category_id: testCategoryId2 }),
    });
    expect(catBulkRes.status).toBe(200);
    const catBulk = await catBulkRes.json() as any;
    expect(catBulk.success).toBe(true);
    expect(catBulk.count).toBe(2);

    // Bulk update brand
    const brandBulkRes = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'update_brand', product_ids: pIds, brand_id: testBrandId2 }),
    });
    expect(brandBulkRes.status).toBe(200);
    const brandBulk = await brandBulkRes.json() as any;
    expect(brandBulk.success).toBe(true);
    expect(brandBulk.count).toBe(2);

    // Verify detail
    const verifyRes = await SELF.fetch(`https://example.com/api/admin/products/${p1.product.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const verify = await verifyRes.json() as any;
    expect(verify.category.id).toBe(testCategoryId2);
    expect(verify.brand.id).toBe(testBrandId2);

    // Bulk delete
    const deleteBulkRes = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'delete', product_ids: pIds }),
    });
    expect(deleteBulkRes.status).toBe(200);
    const deleteBulk = await deleteBulkRes.json() as any;
    expect(deleteBulk.success).toBe(true);
    expect(deleteBulk.count).toBe(2);

    // Cleaned up pIds from bulkProductIds tracking
    bulkProductIds = bulkProductIds.filter(id => !pIds.includes(id));
  });

  // 8. Delete Single Product (DELETE)
  it('9. DELETE /api/admin/products/:id - deletes product and cascade deletes relations', async () => {
    // Create temporary product to delete
    const tempRes = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Temp Delete Product',
        price_cents: 5000,
        brand_id: testBrandId,
        images: ['https://example.com/temp-image.jpg'],
        colors: [testColorId1],
      }),
    });
    const temp = await tempRes.json() as any;
    const tempId = temp.product.id;

    // Delete by ID
    const delRes = await SELF.fetch(`https://example.com/api/admin/products/${tempId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json() as any;
    expect(delBody.success).toBe(true);

    // Verify 404
    const notFoundRes = await SELF.fetch(`https://example.com/api/admin/products/${tempId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(notFoundRes.status).toBe(404);
  });

  // 9. Edge Cases & Validation Tests
  it('10. Edge Case: Missing or invalid product creation fields return 400', async () => {
    // Missing name
    const res1 = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ price_cents: 1000, brand_id: testBrandId }),
    });
    expect(res1.status).toBe(400);

    // Empty name
    const res2 = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: '   ', price_cents: 1000, brand_id: testBrandId }),
    });
    expect(res2.status).toBe(400);

    // Negative price
    const res3 = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Invalid Price', price_cents: -500, brand_id: testBrandId }),
    });
    expect(res3.status).toBe(400);

    // NaN price
    const res4 = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Invalid Price', price_cents: 'invalid', brand_id: testBrandId }),
    });
    expect(res4.status).toBe(400);

    // Missing brand_id
    const res5 = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'No Brand', price_cents: 1000 }),
    });
    expect(res5.status).toBe(400);

    // Non-existent brand_id
    const res6 = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Ghost Brand', price_cents: 1000, brand_id: 9999999 }),
    });
    expect(res6.status).toBe(400);
  });

  it('11. Edge Case: Non-existent product ID/slug returns 404 for GET, PUT, DELETE', async () => {
    const fakeId = 98765432;
    const fakeSlug = 'non-existent-furniture-slug-999';

    const getRes1 = await SELF.fetch(`https://example.com/api/admin/products/${fakeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes1.status).toBe(404);

    const getRes2 = await SELF.fetch(`https://example.com/api/admin/products/${fakeSlug}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes2.status).toBe(404);

    const putRes = await SELF.fetch(`https://example.com/api/admin/products/${fakeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'New Name' }),
    });
    expect(putRes.status).toBe(404);

    const delRes = await SELF.fetch(`https://example.com/api/admin/products/${fakeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.status).toBe(404);
  });

  it('12. Edge Case: Bulk operations with empty/invalid product_ids or actions return 400', async () => {
    // Empty product_ids
    const res1 = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'delete', product_ids: [] }),
    });
    expect(res1.status).toBe(400);

    // Invalid product IDs (strings / negative)
    const res2 = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'delete', product_ids: ['abc', -10, 0] }),
    });
    expect(res2.status).toBe(400);

    // Unsupported action
    const res3 = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'unsupported_action', product_ids: [1, 2] }),
    });
    expect(res3.status).toBe(400);

    // Missing category_id for update_category
    const res4 = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'update_category', product_ids: [1, 2] }),
    });
    expect(res4.status).toBe(400);

    // Missing brand_id for update_brand
    const res5 = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'update_brand', product_ids: [1, 2] }),
    });
    expect(res5.status).toBe(400);
  });

  it('13. Edge Case: List endpoint handles invalid query param values gracefully', async () => {
    const res = await SELF.fetch(
      'https://example.com/api/admin/products?page=invalid&limit=-5&min_price=abc&max_price=def&sort=unknown_sort',
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(25);
  });

  // 10. Role-Based Permissions & Auth Tests
  it('14. Permissions: Catalog Inventory Specialist can perform product operations', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/products/lookups', {
      headers: { Authorization: `Bearer ${catalogToken}` },
    });
    expect(res.status).toBe(200);

    const listRes = await SELF.fetch('https://example.com/api/admin/products', {
      headers: { Authorization: `Bearer ${catalogToken}` },
    });
    expect(listRes.status).toBe(200);
  });

  it('15. Permissions: Customer Support role cannot create, update, delete, or bulk products', async () => {
    // Support has products.read? Let's check: support has customer & order read, not products.write / products.delete / products.bulk
    const postRes = await SELF.fetch('https://example.com/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supportToken}` },
      body: JSON.stringify({ name: 'Unauthorized Post', price_cents: 5000, brand_id: testBrandId }),
    });
    expect(postRes.status).toBe(403);

    const putRes = await SELF.fetch(`https://example.com/api/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supportToken}` },
      body: JSON.stringify({ name: 'Unauthorized Put' }),
    });
    expect(putRes.status).toBe(403);

    const delRes = await SELF.fetch(`https://example.com/api/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${supportToken}` },
    });
    expect(delRes.status).toBe(403);

    const bulkRes = await SELF.fetch('https://example.com/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supportToken}` },
      body: JSON.stringify({ action: 'delete', product_ids: [1] }),
    });
    expect(bulkRes.status).toBe(403);
  });

  it('16. Permissions: Regular Customer role receives 403 on all admin product endpoints', async () => {
    const res = await SELF.fetch('https://example.com/api/admin/products', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('17. Permissions: Missing / Invalid token receives 401', async () => {
    const noAuth = await SELF.fetch('https://example.com/api/admin/products');
    expect(noAuth.status).toBe(401);

    const badAuth = await SELF.fetch('https://example.com/api/admin/products', {
      headers: { Authorization: 'Bearer invalid.token.signature' },
    });
    expect(badAuth.status).toBe(401);
  });

  // 11. Bulk Product Upload
  it('18. POST /api/admin/products/bulk-upload - dry-run validation', async () => {
    const uploadPayload = {
      dry_run: true,
      items: [
        {
          name: 'Dry Run Luxury Sofa',
          price: 750, // in rupees -> 75000 cents
          brand: 'Nordic Craft',
          category: 'Living Room Sofas',
          space: 'Living Room',
          images: ['https://images.unsplash.com/photo-sofa-dry'],
        },
        {
          name: 'Invalid Row (No Price)',
          brand: 'Nordic Craft',
        },
      ],
    };

    const res = await SELF.fetch('https://example.com/api/admin/products/bulk-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(uploadPayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.dry_run).toBe(true);
    expect(body.total).toBe(2);
    expect(body.imported_count).toBe(1);
    expect(body.failed_count).toBe(1);
    expect(body.errors).toBeDefined();
    expect(body.errors.length).toBe(1);
    expect(body.errors[0].row).toBe(2);
  });

  it('19. POST /api/admin/products/bulk-upload - successfully imports products with auto-created lookups', async () => {
    const uploadPayload = {
      items: [
        {
          name: 'Bulk Imported Oak Wardrobe',
          price_cents: 120000,
          brand: 'Scandinavian Woods',
          category: 'Bedroom Wardrobes',
          space: 'Bedroom',
          style: 'Minimalist Modern',
          room: 'Master Bedroom',
          material: 'Solid White Oak',
          listing_type: 'category',
          images: [
            { src: 'https://images.unsplash.com/photo-wardrobe-1', alt: 'Wardrobe Primary', is_primary: true },
            { src: 'https://images.unsplash.com/photo-wardrobe-2', alt: 'Wardrobe Inside' },
          ],
        },
        {
          name: 'Bulk Imported Velvet Armchair',
          price: 499.50, // 49950 cents
          brand_id: testBrandId,
          category_id: testCategoryId,
        },
      ],
    };

    const res = await SELF.fetch('https://example.com/api/admin/products/bulk-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(uploadPayload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.dry_run).toBe(false);
    expect(body.total).toBe(2);
    expect(body.imported_count).toBe(2);
    expect(body.failed_count).toBe(0);
    expect(Array.isArray(body.imported_products)).toBe(true);
    expect(body.imported_products.length).toBe(2);

    const importedIds = body.imported_products.map((p: any) => p.id);
    bulkProductIds.push(...importedIds);

    // Verify first product's details and auto-resolved relations
    const verifyRes = await SELF.fetch(`https://example.com/api/admin/products/${importedIds[0]}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyRes.status).toBe(200);
    const verify = await verifyRes.json() as any;
    expect(verify.name).toBe('Bulk Imported Oak Wardrobe');
    expect(verify.price_cents).toBe(120000);
    expect(verify.brand.name).toBe('Scandinavian Woods');
    expect(verify.category.name).toBe('Bedroom Wardrobes');
    expect(verify.space.name).toBe('Bedroom');
    expect(verify.style.name).toBe('Minimalist Modern');
    expect(verify.room.name).toBe('Master Bedroom');
    expect(verify.material.name).toBe('Solid White Oak');
    expect(verify.images.length).toBe(2);
    expect(verify.images[0].is_primary).toBe(true);
  });

  it('20. POST /api/admin/products/bulk-upload - rejects empty/malformed payload with 400', async () => {
    const res1 = await SELF.fetch('https://example.com/api/admin/products/bulk-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ items: [] }),
    });
    expect(res1.status).toBe(400);

    const res2 = await SELF.fetch('https://example.com/api/admin/products/bulk-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: 'invalid-json{',
    });
    expect(res2.status).toBe(400);
  });
});
