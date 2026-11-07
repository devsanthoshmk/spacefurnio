import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { generateToken } from '../src/utils/jwks';
import { getDb } from '../src/utils/db';
import { syncActiveDeploymentStatus } from '../src/routes/admin/cms';

describe('CMS Public & Admin Endpoints, Edge Cases & Permissions', () => {
  let adminToken: string;
  let storeManagerToken: string;
  let catalogToken: string;
  let supportToken: string;
  let salesToken: string;

  let testAdminId: string;
  let testStoreManagerId: string;
  let testCatalogId: string;
  let testSupportId: string;
  let testSalesId: string;

  const testPageSlug = `test-page-${crypto.randomUUID().slice(0, 8)}`;
  const testSectionId1 = `${testPageSlug}-hero`;
  const testSectionId2 = `${testPageSlug}-features`;
  const testPolicySlug = `test-policy-${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    testAdminId = crypto.randomUUID();
    testStoreManagerId = crypto.randomUUID();
    testCatalogId = crypto.randomUUID();
    testSupportId = crypto.randomUUID();
    testSalesId = crypto.randomUUID();

    const { sql } = getDb(env);

    // 1. Ensure roles exist
    await sql`
      INSERT INTO roles (id, description)
      VALUES 
        ('super_admin', 'Super Admin'),
        ('store_manager', 'Store Manager'),
        ('catalog_inventory', 'Catalog Inventory'),
        ('customer_support', 'Customer Support'),
        ('sales_fulfillment', 'Sales Fulfillment')
      ON CONFLICT (id) DO NOTHING
    `;

    // 2. Insert test users
    await sql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${testAdminId}, ${`admin_${testAdminId.slice(0, 8)}@spacefurnio.com`}, 'dummy_hash', true, NOW(), NOW()),
        (${testStoreManagerId}, ${`mgr_${testStoreManagerId.slice(0, 8)}@spacefurnio.com`}, 'dummy_hash', true, NOW(), NOW()),
        (${testCatalogId}, ${`cat_${testCatalogId.slice(0, 8)}@spacefurnio.com`}, 'dummy_hash', true, NOW(), NOW()),
        (${testSupportId}, ${`sup_${testSupportId.slice(0, 8)}@spacefurnio.com`}, 'dummy_hash', true, NOW(), NOW()),
        (${testSalesId}, ${`sales_${testSalesId.slice(0, 8)}@spacefurnio.com`}, 'dummy_hash', true, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    // 3. Assign user roles
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${testAdminId}, 'super_admin'),
        (${testStoreManagerId}, 'store_manager'),
        (${testCatalogId}, 'catalog_inventory'),
        (${testSupportId}, 'customer_support'),
        (${testSalesId}, 'sales_fulfillment')
      ON CONFLICT DO NOTHING
    `;

    // 4. Generate JWT tokens
    const adminEmail = `admin_${testAdminId.slice(0, 8)}@spacefurnio.com`;
    const managerEmail = `mgr_${testStoreManagerId.slice(0, 8)}@spacefurnio.com`;
    const catalogEmail = `cat_${testCatalogId.slice(0, 8)}@spacefurnio.com`;
    const supportEmail = `sup_${testSupportId.slice(0, 8)}@spacefurnio.com`;
    const salesEmail = `sales_${testSalesId.slice(0, 8)}@spacefurnio.com`;

    adminToken = await generateToken({ id: testAdminId, email: adminEmail, role: 'super_admin' }, env.RSA_PRIVATE_KEY_PEM);
    storeManagerToken = await generateToken({ id: testStoreManagerId, email: managerEmail, role: 'store_manager' }, env.RSA_PRIVATE_KEY_PEM);
    catalogToken = await generateToken({ id: testCatalogId, email: catalogEmail, role: 'catalog_inventory' }, env.RSA_PRIVATE_KEY_PEM);
    supportToken = await generateToken({ id: testSupportId, email: supportEmail, role: 'customer_support' }, env.RSA_PRIVATE_KEY_PEM);
    salesToken = await generateToken({ id: testSalesId, email: salesEmail, role: 'sales_fulfillment' }, env.RSA_PRIVATE_KEY_PEM);

    // 5. Seed test page and sections in database
    await sql`
      INSERT INTO cms_pages (slug, title, seo_metadata, status, has_unpublished_changes, published_at, created_at, updated_at)
      VALUES (${testPageSlug}, 'Test Page Title', ${JSON.stringify({ title: 'SEO Title', description: 'SEO Desc' })}::jsonb, 'published', false, NOW(), NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO cms_sections (id, page_slug, section_key, sort_order, enabled, draft_data, published_data, updated_at)
      VALUES 
        (${testSectionId1}, ${testPageSlug}, 'hero', 0, true, 
         ${JSON.stringify({ headline: 'Draft Hero Headline' })}::jsonb, 
         ${JSON.stringify({ headline: 'Published Hero Headline' })}::jsonb, 
         NOW()),
        (${testSectionId2}, ${testPageSlug}, 'features', 1, true, 
         ${JSON.stringify({ title: 'Draft Features' })}::jsonb, 
         ${JSON.stringify({ title: 'Published Features' })}::jsonb, 
         NOW())
      ON CONFLICT DO NOTHING
    `;

    // 6. Seed test policy
    await sql`
      INSERT INTO cms_policies (slug, title, draft_content, published_content, version_num, has_unpublished_changes, published_at, updated_at)
      VALUES (${testPolicySlug}, 'Test Policy Title', '# Draft Policy Content', '# Published Policy Content', 1, false, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;
  });

  afterAll(async () => {
    const { sql } = getDb(env);
    await sql`DELETE FROM cms_sections WHERE page_slug = ${testPageSlug}`;
    await sql`DELETE FROM cms_pages WHERE slug = ${testPageSlug}`;
    await sql`DELETE FROM cms_policies WHERE slug = ${testPolicySlug}`;
    await sql`DELETE FROM cms_versions WHERE scope IN (${testPageSlug}, 'policies', 'publish')`;
    await sql`DELETE FROM cms_build_events WHERE triggered_by IN (${testAdminId}, ${testStoreManagerId}, ${testCatalogId})`;
    await sql`DELETE FROM user_roles WHERE user_id IN (${testAdminId}, ${testStoreManagerId}, ${testCatalogId}, ${testSupportId}, ${testSalesId})`;
    await sql`DELETE FROM users WHERE id IN (${testAdminId}, ${testStoreManagerId}, ${testCatalogId}, ${testSupportId}, ${testSalesId})`;
  });

  // ========================================================
  // A. Public CMS Router Tests
  // ========================================================
  describe('Public CMS Router (/api/cms)', () => {
    it('GET /api/cms/health returns status ok', async () => {
      const res = await SELF.fetch('https://example.com/api/cms/health');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.status).toBe('ok');
      expect(data.module).toBe('cms');
    });

    it('GET /api/cms/bundle returns snapshot with Cache-Control headers', async () => {
      const res = await SELF.fetch('https://example.com/api/cms/bundle');
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('public, max-age=60');
      expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
      expect(res.headers.get('Cache-Control')).toContain('stale-while-revalidate=86400');

      const data = (await res.json()) as any;
      expect(Array.isArray(data.pages)).toBe(true);
      expect(Array.isArray(data.policies)).toBe(true);
      expect(data.generatedAt).toBeDefined();

      const page = data.pages.find((p: any) => p.slug === testPageSlug);
      expect(page).toBeDefined();
      expect(page.sections.length).toBeGreaterThanOrEqual(2);
      expect(page.sections[0].publishedData.headline).toBe('Published Hero Headline');
    });

    it('GET /api/cms/pages/:slug returns page and active sections', async () => {
      const res = await SELF.fetch(`https://example.com/api/cms/pages/${testPageSlug}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.slug).toBe(testPageSlug);
      expect(data.title).toBe('Test Page Title');
      expect(data.sections).toBeDefined();
      expect(data.sections.length).toBe(2);
      expect(data.sections[0].id).toBe(testSectionId1);
      expect(data.sections[0].sortOrder).toBe(0);
      expect(data.sections[1].id).toBe(testSectionId2);
      expect(data.sections[1].sortOrder).toBe(1);
    });

    it('GET /api/cms/pages/:slug returns 404 for non-existent page', async () => {
      const res = await SELF.fetch('https://example.com/api/cms/pages/non-existent-page-slug');
      expect(res.status).toBe(404);
    });

    it('GET /api/cms/policies returns published policies list', async () => {
      const res = await SELF.fetch('https://example.com/api/cms/policies');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data)).toBe(true);
      const policy = data.find((p: any) => p.slug === testPolicySlug);
      expect(policy).toBeDefined();
      expect(policy.title).toBe('Test Policy Title');
      expect(policy.versionNum).toBeDefined();
      expect(policy.publishedAt).toBeDefined();
    });

    it('GET /api/cms/policies/:slug returns single policy published content', async () => {
      const res = await SELF.fetch(`https://example.com/api/cms/policies/${testPolicySlug}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.slug).toBe(testPolicySlug);
      expect(data.publishedContent).toBe('# Published Policy Content');
    });

    it('GET /api/cms/policies/:slug returns 404 for non-existent policy', async () => {
      const res = await SELF.fetch('https://example.com/api/cms/policies/non-existent-policy');
      expect(res.status).toBe(404);
    });
  });

  // ========================================================
  // B. Admin CMS Router Tests (/api/admin/cms)
  // ========================================================
  describe('Admin CMS Router (/api/admin/cms)', () => {
    it('GET /api/admin/cms/summary returns dirty counts, lastPublishedAt, and latestBuild', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/summary', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(typeof data.dirtyPagesCount).toBe('number');
      expect(typeof data.dirtyPoliciesCount).toBe('number');
      expect(data.lastPublishedAt).toBeDefined();
    });

    it('GET /api/admin/cms/pages returns all pages with sections summary', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/pages', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(Array.isArray(data)).toBe(true);
      const page = data.find((p: any) => p.slug === testPageSlug);
      expect(page).toBeDefined();
      expect(page.sectionCount).toBe(2);
      expect(page.hasUnpublishedChanges).toBe(false);
    });

    it('GET /api/admin/cms/pages/:slug returns full page with sections draft & published data', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/cms/pages/${testPageSlug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.slug).toBe(testPageSlug);
      expect(data.sections.length).toBe(2);
      expect(data.sections[0].draftData.headline).toBe('Draft Hero Headline');
      expect(data.sections[0].publishedData.headline).toBe('Published Hero Headline');
    });

    it('PUT /api/admin/cms/pages/:slug/sections/:id updates section draft & creates version', async () => {
      const updatedDraft = { headline: 'Brand New Draft Headline', subtitle: 'New Subtitle' };
      const res = await SELF.fetch(
        `https://example.com/api/admin/cms/pages/${testPageSlug}/sections/${testSectionId1}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draftData: updatedDraft,
            changeSummary: 'Updated hero headline test',
          }),
        }
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.section.draftData.headline).toBe('Brand New Draft Headline');

      // Verify page is marked as having unpublished changes
      const pageRes = await SELF.fetch(`https://example.com/api/admin/cms/pages/${testPageSlug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const pageData = (await pageRes.json()) as any;
      expect(pageData.hasUnpublishedChanges).toBe(true);

      // Verify version record exists
      const verRes = await SELF.fetch(
        `https://example.com/api/admin/cms/versions?scope=${testPageSlug}&entityId=${testSectionId1}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      expect(verRes.status).toBe(200);
      const versions = (await verRes.json()) as any[];
      expect(versions.length).toBeGreaterThanOrEqual(1);
      expect(versions[0].snapshot.draftData.headline).toBe('Brand New Draft Headline');
    });

    it('POST /api/admin/cms/pages/:slug/sections/reorder updates section sort orders', async () => {
      const res = await SELF.fetch(
        `https://example.com/api/admin/cms/pages/${testPageSlug}/sections/reorder`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orders: [
              { id: testSectionId1, sortOrder: 10 },
              { id: testSectionId2, sortOrder: 5 },
            ],
          }),
        }
      );
      expect(res.status).toBe(200);

      const pageRes = await SELF.fetch(`https://example.com/api/admin/cms/pages/${testPageSlug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const pageData = (await pageRes.json()) as any;
      // testSectionId2 should now come first since sortOrder is 5 < 10
      expect(pageData.sections[0].id).toBe(testSectionId2);
      expect(pageData.sections[1].id).toBe(testSectionId1);
    });

    it('GET /api/admin/cms/policies lists policies with draft vs published info', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/policies', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const policies = (await res.json()) as any[];
      const policy = policies.find((p: any) => p.slug === testPolicySlug);
      expect(policy).toBeDefined();
      expect(policy.draftContent).toBe('# Draft Policy Content');
      expect(policy.publishedContent).toBe('# Published Policy Content');
    });

    it('PUT /api/admin/cms/policies/:slug updates policy draft and sets hasUnpublishedChanges', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/cms/policies/${testPolicySlug}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Policy Title',
          draftContent: '# Updated Draft Content',
          changeSummary: 'Test policy update',
        }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.policy.title).toBe('Updated Policy Title');
      expect(data.policy.draftContent).toBe('# Updated Draft Content');
      expect(data.policy.hasUnpublishedChanges).toBe(true);
    });

    it('POST /api/admin/cms/versions/:id/rollback rolls back section draft data', async () => {
      // Find latest version
      const verRes = await SELF.fetch(
        `https://example.com/api/admin/cms/versions?scope=${testPageSlug}&entityId=${testSectionId1}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const versions = (await verRes.json()) as any[];
      expect(versions.length).toBeGreaterThanOrEqual(1);
      const versionToRollback = versions[0];

      const res = await SELF.fetch(
        `https://example.com/api/admin/cms/versions/${versionToRollback.id}/rollback`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.section.id).toBe(testSectionId1);
    });

    it('POST /api/admin/cms/publish publishes all draft content atomically', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.publishedAt).toBeDefined();

      // Verify page hasUnpublishedChanges is false
      const pageRes = await SELF.fetch(`https://example.com/api/admin/cms/pages/${testPageSlug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const pageData = (await pageRes.json()) as any;
      expect(pageData.hasUnpublishedChanges).toBe(false);
      expect(pageData.status).toBe('published');
    });

    it('POST /api/admin/cms/build returns skipped_local or pending when build is triggered', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/build', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(['skipped_local', 'pending']).toContain(data.status);
      expect(data.buildEvent).toBeDefined();
    });

    it('POST /api/admin/cms/publish-and-build executes atomic publish then build', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/publish-and-build', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.published).toBe(true);
      expect(data.publishedAt).toBeDefined();
      expect(data.build).toBeDefined();
    });

    it('GET /api/admin/cms/build-events lists recent build events', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/cms/build-events', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const events = (await res.json()) as any[];
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].id).toBeDefined();
      expect(events[0].status).toBeDefined();
    });

    it('syncActiveDeploymentStatus correctly syncs triggered event from Cloudflare Pages API', async () => {
      const { sql } = getDb(env);

      const mockFetch = (async () => {
        return new Response(
          JSON.stringify({
            result: {
              id: 'mock-dep-123',
              status: 'success',
              latest_stage: { name: 'deploy', status: 'success' },
            },
            success: true,
            errors: [],
            messages: [],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const testDepId = 'mock-dep-123';
      const [insertedEvent] = await sql`
        INSERT INTO cms_build_events (
          trigger_type, status, triggered_by, webhook_url_masked,
          response_code, response_body, started_at
        ) VALUES (
          'publish', 'triggered', ${testAdminId}, 'https://api.cloudflare.com/****',
          200, ${JSON.stringify({ result: { id: testDepId } })}, NOW()
        )
        RETURNING
          id, trigger_type as "triggerType", status,
          triggered_by as "triggeredBy", webhook_url_masked as "webhookUrlMasked",
          response_code as "responseCode", response_body as "responseBody",
          started_at as "startedAt", completed_at as "completedAt"
      `;

      // 1. Sync through helper with mockFetch
      const synced = await syncActiveDeploymentStatus(
        sql,
        { ...env, CLOUDFLARE_API_TOKEN: 'mock-token' },
        insertedEvent,
        mockFetch
      );
      expect(synced.status).toBe('success');
      expect(synced.completedAt).toBeDefined();

      // 2. Verify database was updated
      const [dbRow] = await sql`
        SELECT status, completed_at as "completedAt" FROM cms_build_events WHERE id = ${insertedEvent.id}
      `;
      expect(dbRow.status).toBe('success');
      expect(dbRow.completedAt).toBeDefined();

      // Clean up test event
      await sql`DELETE FROM cms_build_events WHERE id = ${insertedEvent.id}`;
    });

    it('syncActiveDeploymentStatus ignores non-triggered/non-pending events', async () => {
      const { sql } = getDb(env);
      const fakeEvent = {
        id: 'fake-id',
        status: 'success',
        responseBody: JSON.stringify({ result: { id: 'any-id' } }),
      };
      const result = await syncActiveDeploymentStatus(sql, env, fakeEvent);
      expect(result).toBe(fakeEvent);
    });

    it('POST & DELETE /api/admin/cms/policies creates and deletes a policy', async () => {
      const tempPolicySlug = `temp-pol-${crypto.randomUUID().slice(0, 8)}`;
      const createRes = await SELF.fetch('https://example.com/api/admin/cms/policies', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: tempPolicySlug,
          title: 'Temporary Policy',
          draftContent: 'Temp content',
        }),
      });
      expect(createRes.status).toBe(200);
      const created = (await createRes.json()) as any;
      expect(created.policy.slug).toBe(tempPolicySlug);

      const deleteRes = await SELF.fetch(`https://example.com/api/admin/cms/policies/${tempPolicySlug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(deleteRes.status).toBe(200);

      const getRes = await SELF.fetch(`https://example.com/api/admin/cms/policies/${tempPolicySlug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(getRes.status).toBe(404);
    });
  });

  // ========================================================
  // C. RBAC & Granular Permission Tests
  // ========================================================
  describe('RBAC & Permission Enforcement', () => {
    it('store_manager can read, write, and publish', async () => {
      const summaryRes = await SELF.fetch('https://example.com/api/admin/cms/summary', {
        headers: { Authorization: `Bearer ${storeManagerToken}` },
      });
      expect(summaryRes.status).toBe(200);

      const publishRes = await SELF.fetch('https://example.com/api/admin/cms/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${storeManagerToken}` },
      });
      expect(publishRes.status).toBe(200);
    });

    it('catalog_inventory can read and write, but NOT publish (403 Forbidden)', async () => {
      const summaryRes = await SELF.fetch('https://example.com/api/admin/cms/summary', {
        headers: { Authorization: `Bearer ${catalogToken}` },
      });
      expect(summaryRes.status).toBe(200);

      const publishRes = await SELF.fetch('https://example.com/api/admin/cms/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${catalogToken}` },
      });
      expect(publishRes.status).toBe(403);
    });

    it('customer_support can read, but NOT write (403 Forbidden)', async () => {
      const summaryRes = await SELF.fetch('https://example.com/api/admin/cms/summary', {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(summaryRes.status).toBe(200);

      const writeRes = await SELF.fetch(
        `https://example.com/api/admin/cms/pages/${testPageSlug}/sections/${testSectionId1}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${supportToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ draftData: {} }),
        }
      );
      expect(writeRes.status).toBe(403);
    });

    it('sales_fulfillment has NO CMS permissions (403 Forbidden on read, write, publish)', async () => {
      const summaryRes = await SELF.fetch('https://example.com/api/admin/cms/summary', {
        headers: { Authorization: `Bearer ${salesToken}` },
      });
      expect(summaryRes.status).toBe(403);
    });
  });
});
