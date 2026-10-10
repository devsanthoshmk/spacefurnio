import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateToken } from '../src/utils/jwks';
import { getDb, getProductsDb } from '../src/utils/db';

describe('Admin Images API Endpoints, Edge Cases & Permissions', () => {
  let adminToken: string;
  let storeManagerToken: string;
  let catalogToken: string;
  let salesToken: string;
  let supportToken: string;
  let customerToken: string;

  let testAdminId: string;
  let testStoreManagerId: string;
  let testCatalogId: string;
  let testSalesId: string;
  let testSupportId: string;
  let testCustomerId: string;

  let testBrandId: number;
  let testCategoryId: number;
  let testProduct1Id: number;
  let testProduct2Id: number;
  let testProductNoImagesId: number;

  beforeAll(async () => {
    testAdminId = crypto.randomUUID();
    testStoreManagerId = crypto.randomUUID();
    testCatalogId = crypto.randomUUID();
    testSalesId = crypto.randomUUID();
    testSupportId = crypto.randomUUID();
    testCustomerId = crypto.randomUUID();

    const { sql: mainSql } = getDb(env);
    const { sql: prodSql } = getProductsDb(env);

    // 1. Ensure roles exist in main DB
    await mainSql`
      INSERT INTO roles (id, description)
      VALUES 
        ('admin', 'Administrator'),
        ('super_admin', 'Super Admin'),
        ('store_manager', 'Store Manager'),
        ('catalog_inventory', 'Catalog Inventory'),
        ('sales_fulfillment', 'Sales Fulfillment'),
        ('customer_support', 'Customer Support'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    const adminEmail = `admin_img_${testAdminId.slice(0, 8)}@spacefurnio.com`;
    const managerEmail = `mgr_img_${testStoreManagerId.slice(0, 8)}@spacefurnio.com`;
    const catalogEmail = `cat_img_${testCatalogId.slice(0, 8)}@spacefurnio.com`;
    const salesEmail = `sales_img_${testSalesId.slice(0, 8)}@spacefurnio.com`;
    const supportEmail = `sup_img_${testSupportId.slice(0, 8)}@spacefurnio.com`;
    const customerEmail = `cust_img_${testCustomerId.slice(0, 8)}@spacefurnio.com`;

    // 2. Insert test users and assign roles
    await mainSql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${testAdminId}, ${adminEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testStoreManagerId}, ${managerEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testCatalogId}, ${catalogEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testSalesId}, ${salesEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testSupportId}, ${supportEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${testCustomerId}, ${customerEmail}, 'dummy_hash', true, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    await mainSql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${testAdminId}, 'super_admin'),
        (${testStoreManagerId}, 'store_manager'),
        (${testCatalogId}, 'catalog_inventory'),
        (${testSalesId}, 'sales_fulfillment'),
        (${testSupportId}, 'customer_support'),
        (${testCustomerId}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    // 3. Generate RS256 JWT tokens for each role
    adminToken = await generateToken({ id: testAdminId, email: adminEmail, role: 'super_admin' }, env.RSA_PRIVATE_KEY_PEM);
    storeManagerToken = await generateToken({ id: testStoreManagerId, email: managerEmail, role: 'store_manager' }, env.RSA_PRIVATE_KEY_PEM);
    catalogToken = await generateToken({ id: testCatalogId, email: catalogEmail, role: 'catalog_inventory' }, env.RSA_PRIVATE_KEY_PEM);
    salesToken = await generateToken({ id: testSalesId, email: salesEmail, role: 'sales_fulfillment' }, env.RSA_PRIVATE_KEY_PEM);
    supportToken = await generateToken({ id: testSupportId, email: supportEmail, role: 'customer_support' }, env.RSA_PRIVATE_KEY_PEM);
    customerToken = await generateToken({ id: testCustomerId, email: customerEmail, role: 'customer' }, env.RSA_PRIVATE_KEY_PEM);

    // 4. Create test brand and category in products DB
    const uniqueSuffix = testAdminId.slice(0, 8) + '_' + Date.now();
    const brandRes = await prodSql`
      INSERT INTO brands (name, slug, created_at)
      VALUES (${'Image Test Brand ' + uniqueSuffix}, ${'img-brand-' + uniqueSuffix}, NOW())
      RETURNING id
    `;
    testBrandId = brandRes[0].id;

    const catRes = await prodSql`
      INSERT INTO categories (name, slug, created_at)
      VALUES (${'Image Test Category ' + uniqueSuffix}, ${'img-cat-' + uniqueSuffix}, NOW())
      RETURNING id
    `;
    testCategoryId = catRes[0].id;

    // 5. Create test products
    const p1 = await prodSql`
      INSERT INTO products (name, slug, description, price_cents, brand_id, category_id, listing_type, created_at, updated_at)
      VALUES ('Image Test Product 1', ${'img-test-prod-1-' + uniqueSuffix}, 'Description 1', 19900, ${testBrandId}, ${testCategoryId}, 'category', NOW(), NOW())
      RETURNING id
    `;
    testProduct1Id = p1[0].id;

    const p2 = await prodSql`
      INSERT INTO products (name, slug, description, price_cents, brand_id, category_id, listing_type, created_at, updated_at)
      VALUES ('Image Test Product 2', ${'img-test-prod-2-' + uniqueSuffix}, 'Description 2', 29900, ${testBrandId}, ${testCategoryId}, 'category', NOW(), NOW())
      RETURNING id
    `;
    testProduct2Id = p2[0].id;

    const pNoImages = await prodSql`
      INSERT INTO products (name, slug, description, price_cents, brand_id, category_id, listing_type, created_at, updated_at)
      VALUES ('Image Test Product No Images', ${'img-test-prod-no-images-' + uniqueSuffix}, 'Description 3', 39900, ${testBrandId}, ${testCategoryId}, 'category', NOW(), NOW())
      RETURNING id
    `;
    testProductNoImagesId = pNoImages[0].id;
  });

  afterAll(async () => {
    const { sql: mainSql } = getDb(env);
    const { sql: prodSql } = getProductsDb(env);

    try {
      // 1. Delete product images
      await prodSql`
        DELETE FROM product_images 
        WHERE product_id IN (${testProduct1Id}, ${testProduct2Id}, ${testProductNoImagesId})
      `;

      // 2. Delete test products
      await prodSql`
        DELETE FROM products 
        WHERE id IN (${testProduct1Id}, ${testProduct2Id}, ${testProductNoImagesId}) OR brand_id = ${testBrandId}
      `;

      // 3. Delete taxonomy
      await prodSql`DELETE FROM categories WHERE id = ${testCategoryId}`;
      await prodSql`DELETE FROM brands WHERE id = ${testBrandId}`;

      // 4. Delete test users
      await mainSql`
        DELETE FROM user_roles 
        WHERE user_id IN (${testAdminId}, ${testStoreManagerId}, ${testCatalogId}, ${testSalesId}, ${testSupportId}, ${testCustomerId})
      `;
      await mainSql`
        DELETE FROM users 
        WHERE id IN (${testAdminId}, ${testStoreManagerId}, ${testCatalogId}, ${testSalesId}, ${testSupportId}, ${testCustomerId})
      `;
    } catch (e) {
      console.error('Test cleanup error:', e);
    }
  });

  // ==========================================
  // 1. GET /api/admin/images/audit
  // ==========================================
  describe('1. GET /api/admin/images/audit', () => {
    it('returns comprehensive image audit summary, missing images, and duplicates', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;

      expect(data).toHaveProperty('summary');
      expect(data.summary).toHaveProperty('total_products');
      expect(data.summary).toHaveProperty('products_with_images');
      expect(data.summary).toHaveProperty('products_missing_images_count');
      expect(data.summary).toHaveProperty('total_images');
      expect(data.summary).toHaveProperty('primary_images');
      expect(data.summary).toHaveProperty('missing_alt_count');
      expect(data.summary).toHaveProperty('duplicate_url_count');

      expect(typeof data.summary.total_products).toBe('number');
      expect(data.summary.total_products).toBeGreaterThanOrEqual(3);
      expect(typeof data.summary.products_missing_images_count).toBe('number');

      expect(Array.isArray(data.missing_images)).toBe(true);
      const hasMissingProduct = data.missing_images.some((p: any) => p.id === testProductNoImagesId);
      expect(hasMissingProduct).toBe(true);

      expect(Array.isArray(data.duplicates)).toBe(true);
      expect(Array.isArray(data.recent_assets)).toBe(true);
    });
  });

  // ==========================================
  // 2. POST /api/admin/images/upload
  // ==========================================
  describe('2. POST /api/admin/images/upload', () => {
    let uploadedImageId: number;

    it('uploads image via JSON with URL and auto-sets is_primary=true for first image', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: 'https://images.unsplash.com/photo-test-product-1.jpg',
          product_id: testProduct1Id,
          alt: 'Product 1 Main Shot',
          sort_order: 0,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.record).toBeDefined();
      expect(data.record.product_id).toBe(testProduct1Id);
      expect(data.record.is_primary).toBe(true);
      expect(data.record.alt).toBe('Product 1 Main Shot');
      expect(data.record.sort_order).toBe(0);

      uploadedImageId = data.record.id;
    });

    it('uploads second image via JSON with default is_primary=false', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: 'https://images.unsplash.com/photo-test-product-1-side.jpg',
          product_id: testProduct1Id,
          alt: 'Product 1 Side View',
          sort_order: 1,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.record.is_primary).toBe(false);
      expect(data.record.sort_order).toBe(1);
    });

    it('uploads standalone image (no product_id attached)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: 'https://images.unsplash.com/photo-standalone.jpg',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://images.unsplash.com/photo-standalone.jpg');
      expect(data.record).toBeNull();
    });

    it('uploads image via multipart/form-data with file binary to base64 data URL', async () => {
      const formData = new FormData();
      const fakeFile = new File(['fake-image-bytes-12345'], 'sample-chair.png', { type: 'image/png' });
      formData.append('file', fakeFile);
      formData.append('product_id', String(testProduct2Id));
      formData.append('alt', 'Uploaded PNG Chair');

      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.url).toContain('data:image/png;base64,');
      expect(data.record.product_id).toBe(testProduct2Id);
      expect(data.record.is_primary).toBe(true); // First image for Product 2
    });

    it('returns 400 when JSON body has empty/missing URL or src', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: '   ',
          product_id: testProduct1Id,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toMatch(/required/i);
    });

    it('returns 400 when invalid product_id is provided', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: 'https://images.unsplash.com/photo-valid.jpg',
          product_id: 'invalid-id-text',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toMatch(/invalid product_id/i);
    });

    it('returns 404 when uploading to non-existent product_id', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: 'https://images.unsplash.com/photo-valid.jpg',
          product_id: 99999999,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.message).toMatch(/not found/i);
    });
  });

  // ==========================================
  // 3. POST /api/admin/images/link
  // ==========================================
  describe('3. POST /api/admin/images/link', () => {
    let linkedImageId: number;

    it('links an image URL to product and unsets previous primary if is_primary=true', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          product_id: testProduct1Id,
          src: 'https://images.unsplash.com/photo-test-product-1-new-primary.jpg',
          alt: 'Product 1 New Hero Angle',
          sort_order: 0,
          is_primary: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.product_id).toBe(testProduct1Id);
      expect(data.image.is_primary).toBe(true);
      expect(data.image.src).toBe('https://images.unsplash.com/photo-test-product-1-new-primary.jpg');

      linkedImageId = data.image.id;

      // Verify in DB that only 1 image is primary for product 1
      const { sql: prodSql } = getProductsDb(env);
      const primaries = await prodSql`
        SELECT id, is_primary FROM product_images WHERE product_id = ${testProduct1Id} AND is_primary = true
      `;
      expect(primaries.length).toBe(1);
      expect(primaries[0].id).toBe(linkedImageId);
    });

    it('returns 400 for missing or invalid product_id', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          src: 'https://images.unsplash.com/photo-link.jpg',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toMatch(/product_id is required/i);
    });

    it('returns 400 for empty src URL', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          product_id: testProduct1Id,
          src: '',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toMatch(/Image src URL is required/i);
    });

    it('returns 404 when linking to non-existent product_id', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          product_id: 88888888,
          src: 'https://images.unsplash.com/photo-link.jpg',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.message).toMatch(/not found/i);
    });
  });

  // ==========================================
  // 4. GET /api/admin/images (List & Search)
  // ==========================================
  describe('4. GET /api/admin/images', () => {
    it('lists images with pagination', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images?page=1&limit=10', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(Array.isArray(data.images)).toBe(true);
      expect(data.images.length).toBeGreaterThan(0);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('filters images by product_id', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/images?product_id=${testProduct1Id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.images.every((img: any) => img.product_id === testProduct1Id)).toBe(true);
      expect(data.images.length).toBeGreaterThanOrEqual(1);
    });

    it('filters images by primary_only=true', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images?primary_only=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.images.every((img: any) => img.is_primary === true)).toBe(true);
    });

    it('searches images by alt text or product name', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images?search=Hero+Angle', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.images.length).toBeGreaterThanOrEqual(1);
      expect(data.images[0].alt).toContain('Hero Angle');
    });

    it('gracefully handles invalid pagination parameters', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images?page=abc&limit=-5', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
    });
  });

  // ==========================================
  // 5. PUT /api/admin/images/:id
  // ==========================================
  describe('5. PUT /api/admin/images/:id', () => {
    let imgAId: number;
    let imgBId: number;

    beforeAll(async () => {
      const { sql: prodSql } = getProductsDb(env);
      const resA = await prodSql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${testProduct1Id}, 'https://example.com/update-test-a.jpg', 'Original Alt A', 0, true, NOW())
        RETURNING id
      `;
      imgAId = resA[0].id;

      const resB = await prodSql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${testProduct1Id}, 'https://example.com/update-test-b.jpg', 'Original Alt B', 1, false, NOW())
        RETURNING id
      `;
      imgBId = resB[0].id;
    });

    it('updates image alt, sort_order, and src', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/images/${imgBId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          alt: 'Updated Alt B Description',
          sort_order: 5,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.image.alt).toBe('Updated Alt B Description');
      expect(data.image.sort_order).toBe(5);
    });

    it('promotes image B to primary and unsets prior primary image A', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/images/${imgBId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          is_primary: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.image.is_primary).toBe(true);

      // Verify in DB that image A is now false
      const { sql: prodSql } = getProductsDb(env);
      const rows = await prodSql`
        SELECT id, is_primary FROM product_images WHERE id IN (${imgAId}, ${imgBId})
      `;
      const imgA = rows.find((r: any) => r.id === imgAId);
      const imgB = rows.find((r: any) => r.id === imgBId);
      expect(imgA.is_primary).toBe(false);
      expect(imgB.is_primary).toBe(true);
    });

    it('returns 404 for non-existent image ID', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/9999999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          alt: 'Test Alt',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.message).toMatch(/not found/i);
    });

    it('returns 404 cleanly for invalid non-numeric image ID', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/invalid-img-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          alt: 'Test Alt',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.message).toMatch(/not found/i);
    });
  });

  // ==========================================
  // 6. DELETE /api/admin/images/:id & Auto-Primary Election
  // ==========================================
  describe('6. DELETE /api/admin/images/:id & Auto-Primary Election', () => {
    let electProdId: number;
    let imgPrimaryId: number;
    let imgCandidate1Id: number;
    let imgCandidate2Id: number;

    beforeAll(async () => {
      const { sql: prodSql } = getProductsDb(env);

      // Create a dedicated product for deletion & election testing
      const electSuffix = crypto.randomUUID().slice(0, 8);
      const prodRes = await prodSql`
        INSERT INTO products (name, slug, description, price_cents, brand_id, category_id, listing_type, created_at, updated_at)
        VALUES ('Election Test Product', ${'election-test-product-' + electSuffix}, 'Election Desc', 50000, ${testBrandId}, ${testCategoryId}, 'category', NOW(), NOW())
        RETURNING id
      `;
      electProdId = prodRes[0].id;

      // Image 1: Primary, sort_order 0
      const res1 = await prodSql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${electProdId}, 'https://example.com/elect-primary.jpg', 'Primary Image', 0, true, NOW())
        RETURNING id
      `;
      imgPrimaryId = res1[0].id;

      // Image 2: Non-primary, sort_order 10
      const res2 = await prodSql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${electProdId}, 'https://example.com/elect-high-sort.jpg', 'High Sort Image', 10, false, NOW())
        RETURNING id
      `;
      imgCandidate1Id = res2[0].id;

      // Image 3: Non-primary, sort_order 0 (Lowest sort_order, should become next primary!)
      const res3 = await prodSql`
        INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
        VALUES (${electProdId}, 'https://example.com/elect-low-sort.jpg', 'Low Sort Image', 0, false, NOW())
        RETURNING id
      `;
      imgCandidate2Id = res3[0].id;
    });

    afterAll(async () => {
      const { sql: prodSql } = getProductsDb(env);
      await prodSql`DELETE FROM product_images WHERE product_id = ${electProdId}`;
      await prodSql`DELETE FROM products WHERE id = ${electProdId}`;
    });

    it('deleting a non-primary image does NOT alter the primary image', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/images/${imgCandidate1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      const { sql: prodSql } = getProductsDb(env);
      const rows = await prodSql`
        SELECT id, is_primary FROM product_images WHERE product_id = ${electProdId}
      `;
      const primary = rows.find((r: any) => r.is_primary === true);
      expect(primary).toBeDefined();
      expect(primary.id).toBe(imgPrimaryId);
    });

    it('when primary image is deleted, auto-elects remaining image with lowest sort_order as new primary', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/images/${imgPrimaryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify that imgCandidate2 (which had sort_order 0) is now primary
      const { sql: prodSql } = getProductsDb(env);
      const rows = await prodSql`
        SELECT id, is_primary, sort_order FROM product_images WHERE product_id = ${electProdId}
      `;
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(imgCandidate2Id);
      expect(rows[0].is_primary).toBe(true);
    });

    it('deleting the last image leaves 0 images without error', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/images/${imgCandidate2Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);

      const { sql: prodSql } = getProductsDb(env);
      const rows = await prodSql`
        SELECT id FROM product_images WHERE product_id = ${electProdId}
      `;
      expect(rows.length).toBe(0);
    });

    it('returns 404 cleanly when deleting non-existent or invalid image ID', async () => {
      const res1 = await SELF.fetch('https://example.com/api/admin/images/99999999', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res1.status).toBe(404);

      const res2 = await SELF.fetch('https://example.com/api/admin/images/invalid-id-xyz', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res2.status).toBe(404);
    });
  });

  // ==========================================
  // 7. Role-Based Access Control (RBAC) & Permissions
  // ==========================================
  describe('7. Role-Based Access Control (RBAC) & Permissions', () => {
    it('allows super_admin role access to image endpoints', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('allows store_manager role access (has media.manage)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${storeManagerToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('allows catalog_inventory role access (has media.manage)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${catalogToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('forbids sales_fulfillment role (lacks media.manage)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${salesToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toMatch(/Forbidden: Insufficient permissions/i);
    });

    it('forbids customer_support role (lacks media.manage)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toMatch(/Forbidden: Insufficient permissions/i);
    });

    it('forbids standard customer role', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('returns 401 Unauthorized when request lacks authorization token', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/images/audit');
      expect(res.status).toBe(401);
    });
  });
});
