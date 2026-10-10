import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateToken } from '../src/utils/jwks';
import { getDb, getProductsDb } from '../src/utils/db';

describe('Admin Reviews API Endpoints, Edge Cases, Recalculation & RBAC', () => {
  let superAdminToken: string;
  let storeManagerToken: string;
  let customerSupportToken: string;
  let catalogInventoryToken: string;
  let salesFulfillmentToken: string;
  let customerToken: string;

  let superAdminId: string;
  let storeManagerId: string;
  let customerSupportId: string;
  let catalogInventoryId: string;
  let salesFulfillmentId: string;
  let customerId: string;

  let testBrandId: number;
  let testProductId: number;
  let testProductSlug: string;

  const createdReviewIds: string[] = [];

  beforeAll(async () => {
    superAdminId = crypto.randomUUID();
    storeManagerId = crypto.randomUUID();
    customerSupportId = crypto.randomUUID();
    catalogInventoryId = crypto.randomUUID();
    salesFulfillmentId = crypto.randomUUID();
    customerId = crypto.randomUUID();

    const { sql: mainSql } = getDb(env);
    const { sql: prodSql } = getProductsDb(env);

    // 1. Ensure roles exist
    await mainSql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Administrator'),
        ('store_manager', 'Store Manager'),
        ('customer_support', 'Customer Support'),
        ('catalog_inventory', 'Catalog Inventory'),
        ('sales_fulfillment', 'Sales & Fulfillment'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    const superAdminEmail = `admin_rev_${superAdminId.slice(0, 8)}@spacefurnio.com`;
    const storeManagerEmail = `mgr_rev_${storeManagerId.slice(0, 8)}@spacefurnio.com`;
    const customerSupportEmail = `supp_rev_${customerSupportId.slice(0, 8)}@spacefurnio.com`;
    const catalogInventoryEmail = `cat_rev_${catalogInventoryId.slice(0, 8)}@spacefurnio.com`;
    const salesFulfillmentEmail = `sales_rev_${salesFulfillmentId.slice(0, 8)}@spacefurnio.com`;
    const customerEmail = `cust_rev_${customerId.slice(0, 8)}@spacefurnio.com`;

    // 2. Insert test users
    await mainSql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${superAdminId}, ${superAdminEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${storeManagerId}, ${storeManagerEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${customerSupportId}, ${customerSupportEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${catalogInventoryId}, ${catalogInventoryEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${salesFulfillmentId}, ${salesFulfillmentEmail}, 'dummy_hash', true, NOW(), NOW()),
        (${customerId}, ${customerEmail}, 'dummy_hash', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    await mainSql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${superAdminId}, 'super_admin'),
        (${storeManagerId}, 'store_manager'),
        (${customerSupportId}, 'customer_support'),
        (${catalogInventoryId}, 'catalog_inventory'),
        (${salesFulfillmentId}, 'sales_fulfillment'),
        (${customerId}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    // 3. Generate tokens
    superAdminToken = await generateToken({ id: superAdminId, email: superAdminEmail, role: 'super_admin' }, env.RSA_PRIVATE_KEY_PEM);
    storeManagerToken = await generateToken({ id: storeManagerId, email: storeManagerEmail, role: 'store_manager' }, env.RSA_PRIVATE_KEY_PEM);
    customerSupportToken = await generateToken({ id: customerSupportId, email: customerSupportEmail, role: 'customer_support' }, env.RSA_PRIVATE_KEY_PEM);
    catalogInventoryToken = await generateToken({ id: catalogInventoryId, email: catalogInventoryEmail, role: 'catalog_inventory' }, env.RSA_PRIVATE_KEY_PEM);
    salesFulfillmentToken = await generateToken({ id: salesFulfillmentId, email: salesFulfillmentEmail, role: 'sales_fulfillment' }, env.RSA_PRIVATE_KEY_PEM);
    customerToken = await generateToken({ id: customerId, email: customerEmail, role: 'customer' }, env.RSA_PRIVATE_KEY_PEM);

    // 4. Create test brand and test product in catalog DB
    const uniqueBrandSuffix = superAdminId.slice(0, 8) + '_' + Date.now();
    const brandRes = await prodSql`
      INSERT INTO brands (name, slug, created_at)
      VALUES (${'Test Review Brand ' + uniqueBrandSuffix}, ${'test-review-brand-' + uniqueBrandSuffix}, NOW())
      RETURNING id
    `;
    testBrandId = brandRes[0].id;

    testProductSlug = `test-review-product-${Date.now()}`;
    const prodRes = await prodSql`
      INSERT INTO products (
        name, slug, description, price_cents, brand_id, listing_type, rating, review_count, popularity, created_at, updated_at
      )
      VALUES (
        'Test Review Product', ${testProductSlug}, 'Product for review testing', 19999,
        ${testBrandId}, 'category', 0, 0, 50, NOW(), NOW()
      )
      RETURNING id
    `;
    testProductId = prodRes[0].id;

    // Add a product image for cross-db enrichment testing
    await prodSql`
      INSERT INTO product_images (product_id, src, alt, sort_order, is_primary, created_at)
      VALUES (${testProductId}, 'https://images.unsplash.com/photo-review-test.jpg', 'Test Review Img', 0, true, NOW())
    `;
  });

  afterAll(async () => {
    const { sql: mainSql } = getDb(env);
    const { sql: prodSql } = getProductsDb(env);

    try {
      // Clean up reviews
      if (createdReviewIds.length > 0) {
        await mainSql`DELETE FROM reviews WHERE id = ANY(${createdReviewIds})`;
      }
      if (testProductId) {
        await mainSql`DELETE FROM reviews WHERE product_id = ${testProductId}`;
        await prodSql`DELETE FROM product_images WHERE product_id = ${testProductId}`;
        await prodSql`DELETE FROM products WHERE id = ${testProductId}`;
      }
      if (testBrandId) {
        await prodSql`DELETE FROM products WHERE brand_id = ${testBrandId}`;
        await prodSql`DELETE FROM brands WHERE id = ${testBrandId}`;
      }

      // Clean up users & roles
      const userIds = [superAdminId, storeManagerId, customerSupportId, catalogInventoryId, salesFulfillmentId, customerId];
      await mainSql`DELETE FROM user_roles WHERE user_id = ANY(${userIds})`;
      await mainSql`DELETE FROM users WHERE id = ANY(${userIds})`;
    } catch (e) {
      console.error('Error in review test teardown:', e);
    }
  });

  // ==========================================
  // 1. POST /api/admin/reviews (Creation & Validations)
  // ==========================================
  describe('POST /api/admin/reviews (Creation, Validations & Auto Sync)', () => {
    let reviewId1: string;
    let reviewId2: string;

    it('creates a review successfully and auto-syncs product rating & review_count to 5.0 / 1', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 5,
          title: 'Outstanding quality!',
          comment: 'The craftsmanship on this piece is breathtaking. Arrived on time and was easy to assemble.',
          author_name: 'Jane Reviewer',
          is_verified_purchase: true,
          user_id: customerId,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.review).toBeDefined();
      expect(data.review.product_id).toBe(testProductId);
      expect(data.review.rating).toBe(5);
      expect(data.review.title).toBe('Outstanding quality!');
      expect(data.review.author_name).toBe('Jane Reviewer');
      expect(data.review.is_verified_purchase).toBe(true);

      reviewId1 = data.review.id;
      createdReviewIds.push(reviewId1);

      // Verify product rating sync in products DB
      const { sql: prodSql } = getProductsDb(env);
      const [prod] = await prodSql`SELECT rating, review_count FROM products WHERE id = ${testProductId}`;
      expect(Number(prod.rating)).toBe(5.0);
      expect(prod.review_count).toBe(1);
    });

    it('creates a second review with rating 3 and auto-syncs average rating to 4.0 / 2', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 3,
          title: 'Decent, but smaller than expected',
          comment: 'Good materials, but the dimensions felt slightly smaller in my space.',
          author_name: 'Alex Reviewer',
          is_verified_purchase: false,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.review.rating).toBe(3);

      reviewId2 = data.review.id;
      createdReviewIds.push(reviewId2);

      // Verify product rating sync: (5 + 3) / 2 = 4.0, count = 2
      const { sql: prodSql } = getProductsDb(env);
      const [prod] = await prodSql`SELECT rating, review_count FROM products WHERE id = ${testProductId}`;
      expect(Number(prod.rating)).toBe(4.0);
      expect(prod.review_count).toBe(2);
    });

    it('validates rating boundary conditions: rejects < 1, > 5, floats, NaN, booleans with 400', async () => {
      const invalidRatings = [0, -1, 6, 10, 3.5, 4.2, NaN, 'five', true, false, null, undefined];

      for (const badRating of invalidRatings) {
        const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({
            product_id: testProductId,
            rating: badRating,
            comment: 'Testing invalid rating value',
          }),
        });

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toMatch(/rating must be an integer between 1 and 5/i);
      }
    });

    it('validates product_id: rejects missing, string, negative, float, zero with 400', async () => {
      const invalidProductIds = ['abc', -5, 0, 4.7, true, null, undefined];

      for (const badId of invalidProductIds) {
        const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({
            product_id: badId,
            rating: 5,
            comment: 'Testing invalid product id',
          }),
        });

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toMatch(/product_id/i);
      }
    });

    it('validates comment: rejects missing, empty string, or whitespace-only comment with 400', async () => {
      const invalidComments = ['', '   ', null, undefined, 123];

      for (const badComment of invalidComments) {
        const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({
            product_id: testProductId,
            rating: 5,
            comment: badComment,
          }),
        });

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toMatch(/comment/i);
      }
    });

    it('validates user_id: rejects non-UUID strings with 400', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 4,
          comment: 'Testing invalid user_id',
          user_id: 'not-a-valid-uuid',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toMatch(/user_id must be a valid uuid/i);
    });
  });

  // ==========================================
  // 2. GET /api/admin/reviews (Listing, Stats, Filters, Sorting & Pagination)
  // ==========================================
  describe('GET /api/admin/reviews (Stats, Filters, Sorting & Pagination)', () => {
    it('returns reviews list with overall statistics and cross-db product enrichment', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;

      expect(data.stats).toBeDefined();
      expect(typeof data.stats.total_reviews).toBe('number');
      expect(typeof data.stats.average_rating).toBe('number');
      expect(typeof data.stats.verified_count).toBe('number');
      expect(data.stats.rating_breakdown).toBeDefined();
      expect(typeof data.stats.rating_breakdown[5]).toBe('number');
      expect(typeof data.stats.rating_breakdown[1]).toBe('number');

      expect(Array.isArray(data.reviews)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(25);

      // Verify product enrichment on our test review
      const testRev = data.reviews.find((r: any) => r.product_id === testProductId);
      expect(testRev).toBeDefined();
      expect(testRev.product).toBeDefined();
      expect(testRev.product.name).toBe('Test Review Product');
      expect(testRev.product.slug).toBe(testProductSlug);
      expect(testRev.product.image).toBe('https://images.unsplash.com/photo-review-test.jpg');
    });

    it('filters by product_id correctly', async () => {
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews?product_id=${testProductId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.reviews.length).toBeGreaterThanOrEqual(2);
      for (const r of data.reviews) {
        expect(r.product_id).toBe(testProductId);
      }
    });

    it('filters by rating correctly', async () => {
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews?product_id=${testProductId}&rating=5`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.reviews.length).toBe(1);
      expect(data.reviews[0].rating).toBe(5);
    });

    it('filters by verified_only=true correctly', async () => {
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews?product_id=${testProductId}&verified_only=true`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.reviews.length).toBe(1);
      expect(data.reviews[0].is_verified_purchase).toBe(true);
    });

    it('filters by search query matching comment, title, author, or user email', async () => {
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews?product_id=${testProductId}&search=craftsmanship`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.reviews.length).toBe(1);
      expect(data.reviews[0].comment).toContain('craftsmanship');
    });

    it('supports sorting: rating_desc, rating_asc, oldest, newest', async () => {
      const resDesc = await SELF.fetch(`https://worker.local/api/admin/reviews?product_id=${testProductId}&sort=rating_desc`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const dataDesc = await resDesc.json() as any;
      expect(dataDesc.reviews[0].rating).toBeGreaterThanOrEqual(dataDesc.reviews[1].rating);

      const resAsc = await SELF.fetch(`https://worker.local/api/admin/reviews?product_id=${testProductId}&sort=rating_asc`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const dataAsc = await resAsc.json() as any;
      expect(dataAsc.reviews[0].rating).toBeLessThanOrEqual(dataAsc.reviews[1].rating);
    });

    it('handles pagination parameters gracefully (NaN, negative, oversized limit capped at 100)', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews?page=bad&limit=500', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(100);
    });
  });

  // ==========================================
  // 3. GET /api/admin/reviews/:id (Single Review)
  // ==========================================
  describe('GET /api/admin/reviews/:id (Single Review Detail & Edge Cases)', () => {
    it('returns single review by ID with product details', async () => {
      const targetId = createdReviewIds[0];
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${targetId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.id).toBe(targetId);
      expect(data.product_id).toBe(testProductId);
      expect(data.product).toBeDefined();
      expect(data.product.name).toBe('Test Review Product');
      expect(data.product.slug).toBe(testProductSlug);
    });

    it('returns 404 cleanly for invalid non-UUID string without crashing SQL', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews/not-a-valid-uuid', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.message).toBe('Review not found');
    });

    it('returns 404 for non-existent valid UUID', async () => {
      const nonExistent = crypto.randomUUID();
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${nonExistent}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.message).toBe('Review not found');
    });
  });

  // ==========================================
  // 4. PUT /api/admin/reviews/:id (Update & Auto Sync)
  // ==========================================
  describe('PUT /api/admin/reviews/:id (Update Review & Rating Recalculation)', () => {
    it('updates review rating from 3 to 4 and auto-syncs product average rating to 4.5', async () => {
      const targetId = createdReviewIds[1]; // The second review (rating was 3)

      const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          rating: 4,
          comment: 'Updated: After living with it for a week, it actually fits great!',
          title: 'Better than initial impression',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.review.rating).toBe(4);
      expect(data.review.title).toBe('Better than initial impression');

      // Check product rating sync in products DB: (5 + 4) / 2 = 4.5
      const { sql: prodSql } = getProductsDb(env);
      const [prod] = await prodSql`SELECT rating, review_count FROM products WHERE id = ${testProductId}`;
      expect(Number(prod.rating)).toBe(4.5);
      expect(prod.review_count).toBe(2);
    });

    it('rejects invalid rating updates (< 1, > 5, floats, string) with 400', async () => {
      const targetId = createdReviewIds[0];
      const invalidRatings = [0, 6, 3.7, 'bad', false];

      for (const badRating of invalidRatings) {
        const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${targetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({ rating: badRating }),
        });

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toMatch(/rating must be an integer between 1 and 5/i);
      }
    });

    it('rejects empty comment update with 400', async () => {
      const targetId = createdReviewIds[0];
      const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ comment: '   ' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toMatch(/comment cannot be empty/i);
    });

    it('returns 404 when updating invalid non-UUID or non-existent review', async () => {
      const resInvalid = await SELF.fetch('https://worker.local/api/admin/reviews/not-a-uuid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ rating: 5 }),
      });
      expect(resInvalid.status).toBe(404);

      const resNonExistent = await SELF.fetch(`https://worker.local/api/admin/reviews/${crypto.randomUUID()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ rating: 5 }),
      });
      expect(resNonExistent.status).toBe(404);
    });
  });

  // ==========================================
  // 5. DELETE /api/admin/reviews/:id (Delete & Rating Recalculation)
  // ==========================================
  describe('DELETE /api/admin/reviews/:id (Delete & Rating Reset to 0)', () => {
    it('deletes one review and recalculates product rating to 5.0 / count 1', async () => {
      const targetId = createdReviewIds[1]; // The second review (rating 4)

      const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify product rating sync: only 1 review left (rating 5)
      const { sql: prodSql } = getProductsDb(env);
      const [prod] = await prodSql`SELECT rating, review_count FROM products WHERE id = ${testProductId}`;
      expect(Number(prod.rating)).toBe(5.0);
      expect(prod.review_count).toBe(1);
    });

    it('deletes the only remaining review and resets product rating and review_count to 0.0 / 0', async () => {
      const lastReviewId = createdReviewIds[0]; // The first review (rating 5)

      const res = await SELF.fetch(`https://worker.local/api/admin/reviews/${lastReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify product rating resets to 0 and 0 in products DB
      const { sql: prodSql } = getProductsDb(env);
      const [prod] = await prodSql`SELECT rating, review_count FROM products WHERE id = ${testProductId}`;
      expect(Number(prod.rating)).toBe(0.0);
      expect(prod.review_count).toBe(0);
    });

    it('returns 404 cleanly when deleting non-UUID or non-existent review', async () => {
      const resInvalid = await SELF.fetch('https://worker.local/api/admin/reviews/not-a-uuid', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(resInvalid.status).toBe(404);

      const resAlreadyDeleted = await SELF.fetch(`https://worker.local/api/admin/reviews/${createdReviewIds[0]}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(resAlreadyDeleted.status).toBe(404);
    });
  });

  // ==========================================
  // 6. RBAC & Permission Enforcement
  // ==========================================
  describe('RBAC & Permission Enforcement', () => {
    let permReviewId: string;

    it('allows store_manager full access (read, create, update, delete)', async () => {
      // 1. Create
      const postRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storeManagerToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 4,
          comment: 'Store manager test review',
        }),
      });
      expect(postRes.status).toBe(200);
      const postData = await postRes.json() as any;
      permReviewId = postData.review.id;
      createdReviewIds.push(permReviewId);

      // 2. Read
      const getRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${permReviewId}`, {
        headers: { Authorization: `Bearer ${storeManagerToken}` },
      });
      expect(getRes.status).toBe(200);

      // 3. Update
      const putRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${permReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storeManagerToken}`,
        },
        body: JSON.stringify({ comment: 'Store manager updated review' }),
      });
      expect(putRes.status).toBe(200);

      // 4. Delete
      const delRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${permReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storeManagerToken}` },
      });
      expect(delRes.status).toBe(200);
    });

    it('allows customer_support to read and create/update, but blocks delete with 403 Forbidden', async () => {
      // 1. Create (has reviews.write)
      const postRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerSupportToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 5,
          comment: 'Support created review',
        }),
      });
      expect(postRes.status).toBe(200);
      const postData = await postRes.json() as any;
      const suppReviewId = postData.review.id;
      createdReviewIds.push(suppReviewId);

      // 2. Read (has reviews.read)
      const getRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${suppReviewId}`, {
        headers: { Authorization: `Bearer ${customerSupportToken}` },
      });
      expect(getRes.status).toBe(200);

      // 3. Update (has reviews.write)
      const putRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${suppReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerSupportToken}`,
        },
        body: JSON.stringify({ comment: 'Support updated review' }),
      });
      expect(putRes.status).toBe(200);

      // 4. Delete (does NOT have reviews.delete -> 403)
      const delRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${suppReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerSupportToken}` },
      });
      expect(delRes.status).toBe(403);
      const delData = await delRes.json() as any;
      expect(delData.message).toMatch(/forbidden/i);
    });

    it('allows catalog_inventory to read, but blocks create, update, delete with 403 Forbidden', async () => {
      // 1. Read (has reviews.read)
      const listRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        headers: { Authorization: `Bearer ${catalogInventoryToken}` },
      });
      expect(listRes.status).toBe(200);

      // 2. Create (does NOT have reviews.write -> 403)
      const postRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogInventoryToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 5,
          comment: 'Catalog test review',
        }),
      });
      expect(postRes.status).toBe(403);

      // 3. Update (does NOT have reviews.write -> 403)
      const putRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${createdReviewIds[createdReviewIds.length - 1]}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${catalogInventoryToken}`,
        },
        body: JSON.stringify({ rating: 2 }),
      });
      expect(putRes.status).toBe(403);

      // 4. Delete (does NOT have reviews.delete -> 403)
      const delRes = await SELF.fetch(`https://worker.local/api/admin/reviews/${createdReviewIds[createdReviewIds.length - 1]}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${catalogInventoryToken}` },
      });
      expect(delRes.status).toBe(403);
    });

    it('blocks sales_fulfillment from all review endpoints with 403 Forbidden', async () => {
      const getRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        headers: { Authorization: `Bearer ${salesFulfillmentToken}` },
      });
      expect(getRes.status).toBe(403);

      const postRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${salesFulfillmentToken}`,
        },
        body: JSON.stringify({
          product_id: testProductId,
          rating: 5,
          comment: 'Sales test review',
        }),
      });
      expect(postRes.status).toBe(403);
    });

    it('blocks customer role with 403 Forbidden (Admin access required)', async () => {
      const res = await SELF.fetch('https://worker.local/api/admin/reviews', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toMatch(/admin access required/i);
    });

    it('blocks unauthenticated requests with 401 Unauthorized', async () => {
      const noAuthRes = await SELF.fetch('https://worker.local/api/admin/reviews');
      expect(noAuthRes.status).toBe(401);

      const badTokenRes = await SELF.fetch('https://worker.local/api/admin/reviews', {
        headers: { Authorization: 'Bearer invalid.token.value' },
      });
      expect(badTokenRes.status).toBe(401);
    });
  });
});