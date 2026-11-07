import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';
import router from '../server-worker/src/index';
import { generateToken } from '../server-worker/src/utils/jwks';

// ---------------------------------------------------------------------------
// Configuration & Environment Setup
// ---------------------------------------------------------------------------
const workerDir = path.resolve(__dirname, '../server-worker');
const devVarsPath = path.resolve(workerDir, '.dev.vars');
const devVarsRaw = fs.readFileSync(devVarsPath, 'utf8');
const devVars: Record<string, string> = {};

for (const line of devVarsRaw.split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)=\"?(.*?)\"?$/);
  if (match) {
    devVars[match[1]] = match[2].replace(/\\n/g, '\n');
  }
}

const DATABASE_URL = devVars.DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from environment and .dev.vars');
}

const RSA_PRIVATE_KEY_PEM = devVars.RSA_PRIVATE_KEY_PEM;
const RSA_PUBLIC_KEY_PEM = devVars.RSA_PUBLIC_KEY_PEM;
if (!RSA_PRIVATE_KEY_PEM || !RSA_PUBLIC_KEY_PEM) {
  throw new Error('RSA keys missing from .dev.vars');
}

const sql = neon(DATABASE_URL);

// ---------------------------------------------------------------------------
// Verification Test Framework Helpers
// ---------------------------------------------------------------------------
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

function header(title: string) {
  console.log(`\n================================================================================`);
  console.log(`=== ${title}`);
  console.log(`================================================================================`);
}

// ---------------------------------------------------------------------------
// Test Execution Suite
// ---------------------------------------------------------------------------
async function runVerification() {
  const startTime = Date.now();
  console.log(`Starting Spacefurnio CMS Backend Comprehensive Verification...`);
  console.log(`Target database: ${DATABASE_URL.split('@')[1] || 'neon-db'}`);

  // Test identifiers with unique UUID suffix for complete isolation
  const runId = crypto.randomUUID().slice(0, 8);
  const testIds = {
    superAdmin: crypto.randomUUID(),
    storeManager: crypto.randomUUID(),
    catalogSpecialist: crypto.randomUUID(),
    customerSupport: crypto.randomUUID(),
    salesLead: crypto.randomUUID(),
    customerUser: crypto.randomUUID(),
    stagingPage: `qa-page-${runId}`,
    stagingSec1: `qa-page-${runId}-hero`,
    stagingSec2: `qa-page-${runId}-feature`,
    stagingPolicy: `qa-policy-${runId}`,
  };

  // Mock deploy hook server on local loopback
  let mockWebhookCallCount = 0;
  const mockServer = http.createServer((req, res) => {
    mockWebhookCallCount++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'triggered', buildId: `build_${runId}_${mockWebhookCallCount}` }));
  });

  await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', () => resolve()));
  const mockPort = (mockServer.address() as any).port;
  const mockDeployHookUrl = `http://127.0.0.1:${mockPort}/deploy-hook`;

  const workerEnv = {
    DATABASE_URL,
    RSA_PUBLIC_KEY_PEM,
    RSA_PRIVATE_KEY_PEM,
    BUILD_WEBHOOK_URL: mockDeployHookUrl,
  };

  const workerCtx = {
    waitUntil: (p: any) => Promise.resolve(p),
    passThroughOnException: () => {},
  };

  const dispatch = async (url: string, init?: RequestInit, customEnv?: any) => {
    const req = new Request(url, init);
    const envToUse = customEnv !== undefined ? customEnv : workerEnv;
    return await router.fetch(req, envToUse, workerCtx);
  };

  try {
    // =========================================================================
    // 1. TypeScript Compilation Check
    // =========================================================================
    header('1. TypeScript Compilation Check');
    console.log('Running tsc in backend/ecommerce-backend...');
    try {
      execSync('pnpm exec tsc --noEmit', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
      assert(true, 'backend/ecommerce-backend type-check passed');
    } catch (err: any) {
      assert(false, 'backend/ecommerce-backend type-check failed', err.stderr?.toString());
    }

    console.log('Running tsc in backend/ecommerce-backend/server-worker...');
    try {
      execSync('pnpm exec tsc --noEmit', { cwd: workerDir, stdio: 'pipe' });
      assert(true, 'server-worker type-check passed');
    } catch (err: any) {
      assert(false, 'server-worker type-check failed', err.stderr?.toString());
    }

    // =========================================================================
    // 2. Public CMS Endpoints Verification (/api/cms/*)
    // =========================================================================
    header('2. Public CMS Endpoints (/api/cms/*)');

    // 2.1 Health Check
    const healthRes = await dispatch('https://spacefurnio-api.local/api/cms/health');
    assert(healthRes.status === 200, 'GET /api/cms/health returns 200 OK');
    const healthData = await healthRes.json();
    assert(healthData.status === 'ok' && healthData.module === 'cms', 'Health check payload is valid');

    // 2.2 SSG Bundle (/api/cms/bundle)
    const bundleRes = await dispatch('https://spacefurnio-api.local/api/cms/bundle');
    assert(bundleRes.status === 200, 'GET /api/cms/bundle returns 200 OK');

    const cacheHeader = bundleRes.headers.get('cache-control') || '';
    assert(
      cacheHeader.includes('public, max-age=60') &&
      cacheHeader.includes('s-maxage=3600') &&
      cacheHeader.includes('stale-while-revalidate=86400'),
      'GET /api/cms/bundle includes correct Cache-Control headers',
      `Header received: ${cacheHeader}`
    );

    const bundleData = await bundleRes.json();
    assert(typeof bundleData.generatedAt === 'string', 'Bundle contains ISO generatedAt timestamp');
    assert(Array.isArray(bundleData.pages), 'Bundle contains pages array');
    assert(Array.isArray(bundleData.policies), 'Bundle contains policies array');

    const requiredPages = ['home', 'about', 'collabs', 'portfolio', 'contact', 'footer'];
    const bundlePageSlugs = bundleData.pages.map((p: any) => p.slug);
    const hasAllPages = requiredPages.every((slug) => bundlePageSlugs.includes(slug));
    assert(hasAllPages, 'Bundle includes all required published pages (home, about, collabs, portfolio, contact, footer)');

    // Verify draft_data is NOT leaked in bundle
    let draftLeakedInBundle = false;
    for (const p of bundleData.pages) {
      for (const sec of p.sections || []) {
        if ('draftData' in sec || 'draft_data' in sec) {
          draftLeakedInBundle = true;
        }
      }
    }
    assert(!draftLeakedInBundle, 'Bundle sections do NOT leak draft_data');

    // Verify draftContent is NOT leaked in bundle policies
    let draftContentLeakedInBundle = false;
    for (const pol of bundleData.policies) {
      if ('draftContent' in pol || 'draft_content' in pol) {
        draftContentLeakedInBundle = true;
      }
    }
    assert(!draftContentLeakedInBundle, 'Bundle policies do NOT leak draftContent');

    // 2.3 Single Published Page (/api/cms/pages/home)
    const homeRes = await dispatch('https://spacefurnio-api.local/api/cms/pages/home');
    assert(homeRes.status === 200, 'GET /api/cms/pages/home returns 200 OK');
    const homeData = await homeRes.json();
    assert(homeData.slug === 'home', 'Page slug is home');
    assert(Array.isArray(homeData.sections) && homeData.sections.length >= 3, 'Home page has active sections');

    // Check sortOrder ascending
    let isSorted = true;
    for (let i = 1; i < homeData.sections.length; i++) {
      if (homeData.sections[i].sortOrder < homeData.sections[i - 1].sortOrder) {
        isSorted = false;
      }
    }
    assert(isSorted, 'Home sections are strictly sorted by sortOrder ascending');

    // Check draft_data is NOT leaked
    let homeDraftLeaked = false;
    for (const sec of homeData.sections) {
      if ('draftData' in sec || 'draft_data' in sec) {
        homeDraftLeaked = true;
      }
      assert(sec.publishedData !== undefined || sec.data !== undefined, `Section ${sec.id} has publishedData/data`);
    }
    assert(!homeDraftLeaked, 'GET /api/cms/pages/home does NOT leak draft_data');

    // 2.4 Policies List (/api/cms/policies)
    const policiesRes = await dispatch('https://spacefurnio-api.local/api/cms/policies');
    assert(policiesRes.status === 200, 'GET /api/cms/policies returns 200 OK');
    const policiesData = await policiesRes.json();
    assert(Array.isArray(policiesData) && policiesData.length >= 4, 'Policies list returns published policies');
    const hasPrivacyPolicy = policiesData.some((p: any) => p.slug === 'privacy-policy');
    assert(hasPrivacyPolicy, 'Published policies list includes privacy-policy');

    // 2.5 Single Policy Content (/api/cms/policies/privacy-policy)
    const privacyRes = await dispatch('https://spacefurnio-api.local/api/cms/policies/privacy-policy');
    assert(privacyRes.status === 200, 'GET /api/cms/policies/privacy-policy returns 200 OK');
    const privacyData = await privacyRes.json();
    assert(privacyData.slug === 'privacy-policy', 'Policy slug is privacy-policy');
    assert(typeof privacyData.publishedContent === 'string' && privacyData.publishedContent.length > 50, 'Privacy policy contains markdown content');
    assert(!('draftContent' in privacyData || 'draft_content' in privacyData), 'Privacy policy does NOT leak draft_content');

    // 2.6 404 Handling for Missing Resources
    const missingPageRes = await dispatch('https://spacefurnio-api.local/api/cms/pages/missing-non-existent-page');
    assert(missingPageRes.status === 404, 'GET /api/cms/pages/non-existent returns 404 Not Found');

    const missingPolicyRes = await dispatch('https://spacefurnio-api.local/api/cms/policies/missing-non-existent-policy');
    assert(missingPolicyRes.status === 404, 'GET /api/cms/policies/non-existent returns 404 Not Found');

    // =========================================================================
    // 3. Admin CMS Security & RBAC Enforcement
    // =========================================================================
    header('3. Admin CMS Security & RBAC Enforcement');

    // Setup Test Users in Database
    await sql`
      INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
      VALUES 
        (${testIds.superAdmin}, ${`admin_${runId}@spacefurnio.com`}, 'hash', true, NOW(), NOW()),
        (${testIds.storeManager}, ${`mgr_${runId}@spacefurnio.com`}, 'hash', true, NOW(), NOW()),
        (${testIds.catalogSpecialist}, ${`cat_${runId}@spacefurnio.com`}, 'hash', true, NOW(), NOW()),
        (${testIds.customerSupport}, ${`sup_${runId}@spacefurnio.com`}, 'hash', true, NOW(), NOW()),
        (${testIds.salesLead}, ${`sales_${runId}@spacefurnio.com`}, 'hash', true, NOW(), NOW()),
        (${testIds.customerUser}, ${`cust_${runId}@spacefurnio.com`}, 'hash', true, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        (${testIds.superAdmin}, 'super_admin'),
        (${testIds.storeManager}, 'store_manager'),
        (${testIds.catalogSpecialist}, 'catalog_inventory'),
        (${testIds.customerSupport}, 'customer_support'),
        (${testIds.salesLead}, 'sales_fulfillment'),
        (${testIds.customerUser}, 'customer')
      ON CONFLICT DO NOTHING
    `;

    // Generate Tokens
    const tokens = {
      superAdmin: await generateToken({ id: testIds.superAdmin, email: `admin_${runId}@spacefurnio.com`, role: 'super_admin' }, RSA_PRIVATE_KEY_PEM),
      storeManager: await generateToken({ id: testIds.storeManager, email: `mgr_${runId}@spacefurnio.com`, role: 'store_manager' }, RSA_PRIVATE_KEY_PEM),
      catalogSpecialist: await generateToken({ id: testIds.catalogSpecialist, email: `cat_${runId}@spacefurnio.com`, role: 'catalog_inventory' }, RSA_PRIVATE_KEY_PEM),
      customerSupport: await generateToken({ id: testIds.customerSupport, email: `sup_${runId}@spacefurnio.com`, role: 'customer_support' }, RSA_PRIVATE_KEY_PEM),
      salesLead: await generateToken({ id: testIds.salesLead, email: `sales_${runId}@spacefurnio.com`, role: 'sales_fulfillment' }, RSA_PRIVATE_KEY_PEM),
      customerUser: await generateToken({ id: testIds.customerUser, email: `cust_${runId}@spacefurnio.com`, role: 'customer' }, RSA_PRIVATE_KEY_PEM),
    };

    // 3.1 Unauthenticated requests return 401
    const unauthSummary = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary');
    assert(unauthSummary.status === 401, 'Unauthenticated GET /api/admin/cms/summary returns 401 Unauthorized');

    const unauthPages = await dispatch('https://spacefurnio-api.local/api/admin/cms/pages');
    assert(unauthPages.status === 401, 'Unauthenticated GET /api/admin/cms/pages returns 401 Unauthorized');

    const unauthPublish = await dispatch('https://spacefurnio-api.local/api/admin/cms/publish', { method: 'POST' });
    assert(unauthPublish.status === 401, 'Unauthenticated POST /api/admin/cms/publish returns 401 Unauthorized');

    const invalidTokenRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary', {
      headers: { Authorization: 'Bearer invalid.bogus.jwt.token' },
    });
    assert(invalidTokenRes.status === 401, 'Invalid Bearer token returns 401 Unauthorized');

    // 3.2 Customer token returns 403 Forbidden
    const custSummaryRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary', {
      headers: { Authorization: `Bearer ${tokens.customerUser}` },
    });
    assert(custSummaryRes.status === 403, 'Customer token receives 403 Forbidden on admin CMS endpoint');

    // 3.3 Role without CMS permissions (sales_fulfillment) returns 403
    const salesRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary', {
      headers: { Authorization: `Bearer ${tokens.salesLead}` },
    });
    assert(salesRes.status === 403, 'sales_fulfillment role receives 403 Forbidden (no cms.read)');

    // 3.4 Customer Support role (has cms.read, lacks cms.write & cms.publish)
    const csReadRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary', {
      headers: { Authorization: `Bearer ${tokens.customerSupport}` },
    });
    assert(csReadRes.status === 200, 'customer_support can read CMS summary (has cms.read)');

    const csWriteRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/policies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.customerSupport}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: `cs-unauth-${runId}`, title: 'CS Policy', draftContent: 'test' }),
    });
    assert(csWriteRes.status === 403, 'customer_support cannot write CMS policies (403 Forbidden)');

    const csPublishRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.customerSupport}` },
    });
    assert(csPublishRes.status === 403, 'customer_support cannot publish CMS content (403 Forbidden)');

    // 3.5 Catalog Specialist role (has cms.read & cms.write, lacks cms.publish)
    const catReadRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/pages', {
      headers: { Authorization: `Bearer ${tokens.catalogSpecialist}` },
    });
    assert(catReadRes.status === 200, 'catalog_inventory can read CMS pages');

    const catPublishRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.catalogSpecialist}` },
    });
    assert(catPublishRes.status === 403, 'catalog_inventory cannot publish CMS content (403 Forbidden)');

    // 3.6 Super Admin role (full access)
    const adminReadRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary', {
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(adminReadRes.status === 200, 'super_admin can read CMS summary');

    // 3.7 Store Manager role (has cms.read, cms.write, cms.publish)
    const mgrReadRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/summary', {
      headers: { Authorization: `Bearer ${tokens.storeManager}` },
    });
    assert(mgrReadRes.status === 200, 'store_manager can read CMS summary');

    const mgrPublishRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.storeManager}` },
    });
    assert(mgrPublishRes.status === 200, 'store_manager can publish CMS content');

    // =========================================================================
    // 4. CMS Staging Lifecycle (Draft vs Published)
    // =========================================================================
    header('4. CMS Staging Lifecycle (Draft vs Published)');

    // 4.1 Seed Isolated Staging Page and Sections
    const originalDraft = { headline: 'Initial Staging Draft Headline', subhead: 'Draft Subhead 1' };
    const originalPublished = { headline: 'Initial Staging Published Headline', subhead: 'Published Subhead 1' };

    await sql`
      INSERT INTO cms_pages (slug, title, seo_metadata, status, has_unpublished_changes, published_at, created_at, updated_at)
      VALUES (${testIds.stagingPage}, 'Staging Test Page', '{"title":"SEO"}'::jsonb, 'published', false, NOW(), NOW(), NOW())
    `;

    await sql`
      INSERT INTO cms_sections (id, page_slug, section_key, sort_order, enabled, draft_data, published_data, updated_at)
      VALUES 
        (${testIds.stagingSec1}, ${testIds.stagingPage}, 'hero', 0, true, 
         ${JSON.stringify(originalDraft)}::jsonb, 
         ${JSON.stringify(originalPublished)}::jsonb, 
         NOW()),
        (${testIds.stagingSec2}, ${testIds.stagingPage}, 'feature', 1, true, 
         '{"title":"Feature Draft"}'::jsonb, 
         '{"title":"Feature Published"}'::jsonb, 
         NOW())
    `;

    // Baseline version snapshot for rollback testing (1 minute in the past so 30s dedup does not merge)
    const [baselineVersion] = await sql`
      INSERT INTO cms_versions (scope, entity_id, version_num, snapshot, change_summary, author_id, created_at)
      VALUES (
        ${testIds.stagingPage}, 
        ${testIds.stagingSec1}, 
        1, 
        ${JSON.stringify({ draftData: originalDraft, enabled: true, sectionKey: 'hero', sortOrder: 0 })}::jsonb, 
        'Baseline initial version', 
        ${testIds.superAdmin}, 
        NOW() - INTERVAL '1 minute'
      )
      RETURNING id, version_num as "versionNum"
    `;

    // Verify initial public state returns publishedData
    const pubPageBefore = await dispatch(`https://spacefurnio-api.local/api/cms/pages/${testIds.stagingPage}`);
    assert(pubPageBefore.status === 200, 'Public GET /api/cms/pages/:slug returns 200 for staging page');
    const pubDataBefore = await pubPageBefore.json();
    assert(pubDataBefore.sections[0].publishedData.headline === 'Initial Staging Published Headline', 'Public API serves publishedData before edits');

    // 4.2 Update Section Draft Data
    const updatedDraft = { headline: 'NEW STAGING DRAFT HEADLINE V2', subhead: 'Updated Draft Subhead' };
    const updateSecRes = await dispatch(
      `https://spacefurnio-api.local/api/admin/cms/pages/${testIds.stagingPage}/sections/${testIds.stagingSec1}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokens.superAdmin}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftData: updatedDraft, changeSummary: 'Updated hero headline to V2' }),
      }
    );
    assert(updateSecRes.status === 200, 'PUT /api/admin/cms/pages/:slug/sections/:id returns 200 OK');
    const updateSecData = await updateSecRes.json();
    assert(updateSecData.success === true, 'Section update success is true');
    assert(updateSecData.section.draftData.headline === 'NEW STAGING DRAFT HEADLINE V2', 'Section draftData updated to V2');
    assert(updateSecData.section.publishedData.headline === 'Initial Staging Published Headline', 'Section publishedData remains OLD version');

    // Verify parent page hasUnpublishedChanges is now true in admin endpoint
    const adminPageAfterEdit = await dispatch(`https://spacefurnio-api.local/api/admin/cms/pages/${testIds.stagingPage}`, {
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    const adminPageData = await adminPageAfterEdit.json();
    assert(adminPageData.hasUnpublishedChanges === true, 'Parent page hasUnpublishedChanges is true after section edit');

    // Verify public endpoint still serves OLD publishedData
    const pubPageAfterEdit = await dispatch(`https://spacefurnio-api.local/api/cms/pages/${testIds.stagingPage}`);
    const pubDataAfterEdit = await pubPageAfterEdit.json();
    assert(pubDataAfterEdit.sections[0].publishedData.headline === 'Initial Staging Published Headline', 'Public API STILL returns OLD publishedData (draft changes isolated)');

    // 4.3 Publish & SSG Build Trigger ("Update Site")
    // Clean recent build events from previous runs for clean cooldown test
    await sql`DELETE FROM cms_build_events WHERE started_at > NOW() - INTERVAL '70 seconds'`;

    const publishBuildRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/publish-and-build', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(publishBuildRes.status === 200, 'POST /api/admin/cms/publish-and-build returns 200 OK');
    const pubBuildData = await publishBuildRes.json();
    assert(pubBuildData.success === true, 'Publish and build success is true');
    assert(pubBuildData.published === true, 'Publish flag is true');
    assert(typeof pubBuildData.publishedAt === 'string', 'publishedAt timestamp returned');
    assert(pubBuildData.build?.status === 'pending' || pubBuildData.build?.status === 'triggered', 'Build dispatch initiated');

    // Verify section publishedData now matches draftData
    const adminPageAfterPub = await dispatch(`https://spacefurnio-api.local/api/admin/cms/pages/${testIds.stagingPage}`, {
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    const adminPageDataAfterPub = await adminPageAfterPub.json();
    assert(adminPageDataAfterPub.hasUnpublishedChanges === false, 'Parent page hasUnpublishedChanges is now false after publish');
    assert(adminPageDataAfterPub.sections[0].publishedData.headline === 'NEW STAGING DRAFT HEADLINE V2', 'Section publishedData now matches draftData');

    // Verify public endpoint now serves NEW publishedData
    const pubPageAfterPub = await dispatch(`https://spacefurnio-api.local/api/cms/pages/${testIds.stagingPage}`);
    const pubDataAfterPub = await pubPageAfterPub.json();
    assert(pubDataAfterPub.sections[0].publishedData.headline === 'NEW STAGING DRAFT HEADLINE V2', 'Public API now serves NEW publishedData');

    // Verify build event audit record
    const buildEventsRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/build-events', {
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    const buildEvents = await buildEventsRes.json();
    assert(Array.isArray(buildEvents) && buildEvents.length >= 1, 'Build events audit log contains entries');
    const latestEvent = buildEvents[0];
    assert(latestEvent.triggerType === 'publish' || latestEvent.triggerType === 'manual', 'Build event recorded with valid triggerType');
    assert(latestEvent.webhookUrlMasked !== null, 'Webhook URL is masked in audit record');

    // 4.4 60-Second Cooldown Enforcement
    // Immediate subsequent build request must return 429 Too Many Requests
    const immediateBuildRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/build', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(immediateBuildRes.status === 429, 'Immediate POST /api/admin/cms/build returns HTTP 429 Too Many Requests');
    const cooldownData = await immediateBuildRes.json();
    assert(typeof cooldownData.cooldownRemainingSeconds === 'number' && cooldownData.cooldownRemainingSeconds > 0, 'Response includes cooldownRemainingSeconds > 0');
    assert(cooldownData.message?.includes('60 seconds'), 'Response contains informative cooldown message');

    // 4.5 Version Snapshot & Rollback
    // Check version history for this section
    const versionsRes = await dispatch(
      `https://spacefurnio-api.local/api/admin/cms/versions?scope=${testIds.stagingPage}&entityId=${testIds.stagingSec1}`,
      { headers: { Authorization: `Bearer ${tokens.superAdmin}` } }
    );
    assert(versionsRes.status === 200, 'GET /api/admin/cms/versions returns 200 OK');
    const versions = await versionsRes.json();
    assert(Array.isArray(versions) && versions.length >= 2, 'Section has at least 2 version snapshots');

    // Execute rollback to baseline version 1
    const rollbackRes = await dispatch(`https://spacefurnio-api.local/api/admin/cms/versions/${baselineVersion.id}/rollback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(rollbackRes.status === 200, 'POST /api/admin/cms/versions/:id/rollback returns 200 OK');
    const rollbackData = await rollbackRes.json();
    assert(rollbackData.success === true, 'Rollback success is true');
    assert(rollbackData.section.draft_data?.headline === 'Initial Staging Draft Headline' || rollbackData.section.draftData?.headline === 'Initial Staging Draft Headline', 'Draft data successfully restored to baseline version 1');

    // Verify parent page hasUnpublishedChanges is marked true again after rollback
    const pageAfterRollback = await dispatch(`https://spacefurnio-api.local/api/admin/cms/pages/${testIds.stagingPage}`, {
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    const pageDataAfterRollback = await pageAfterRollback.json();
    assert(pageDataAfterRollback.hasUnpublishedChanges === true, 'Parent page hasUnpublishedChanges is true after rollback');

    // =========================================================================
    // 5. Policies Lifecycle Verification
    // =========================================================================
    header('5. Policies Lifecycle Verification');

    // 5.1 Create Policy (POST /api/admin/cms/policies)
    const createPolRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/policies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.superAdmin}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: testIds.stagingPolicy,
        title: 'QA Lifecycle Test Policy',
        draftContent: '# QA Lifecycle Draft Content V1\n\nInitial draft content for testing.',
      }),
    });
    assert(createPolRes.status === 200, 'POST /api/admin/cms/policies returns 200 OK');
    const createPolData = await createPolRes.json();
    assert(createPolData.success === true, 'Policy creation success is true');
    assert(createPolData.policy.slug === testIds.stagingPolicy, 'Policy slug matches');
    assert(createPolData.policy.hasUnpublishedChanges === true, 'New policy hasUnpublishedChanges is true');

    // 5.2 Verify Public Access returns 404 BEFORE publish
    const pubPolBefore = await dispatch(`https://spacefurnio-api.local/api/cms/policies/${testIds.stagingPolicy}`);
    assert(pubPolBefore.status === 404, 'Public GET /api/cms/policies/:slug returns 404 before policy is published');

    // 5.3 Update Policy Draft Content (PUT /api/admin/cms/policies/:slug)
    const updatePolRes = await dispatch(`https://spacefurnio-api.local/api/admin/cms/policies/${testIds.stagingPolicy}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.superAdmin}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'QA Lifecycle Test Policy (Updated)',
        draftContent: '# QA Lifecycle Published Content V2\n\nFully approved and published policy.',
        changeSummary: 'Updated policy content to V2',
      }),
    });
    assert(updatePolRes.status === 200, 'PUT /api/admin/cms/policies/:slug returns 200 OK');
    const updatePolData = await updatePolRes.json();
    assert(updatePolData.policy.draftContent.includes('V2'), 'Policy draftContent updated to V2');
    assert(updatePolData.policy.hasUnpublishedChanges === true, 'Policy hasUnpublishedChanges remains true');

    // 5.4 Publish Policy (POST /api/admin/cms/publish)
    const publishPolRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(publishPolRes.status === 200, 'POST /api/admin/cms/publish returns 200 OK');

    // 5.5 Verify Public Access returns 200 AFTER publish
    const pubPolAfter = await dispatch(`https://spacefurnio-api.local/api/cms/policies/${testIds.stagingPolicy}`);
    assert(pubPolAfter.status === 200, 'Public GET /api/cms/policies/:slug returns 200 OK after publish');
    const pubPolData = await pubPolAfter.json();
    assert(pubPolData.slug === testIds.stagingPolicy, 'Public policy slug matches');
    assert(pubPolData.publishedContent.includes('QA Lifecycle Published Content V2'), 'Public policy returns published markdown content');

    // Verify appears in public /api/cms/policies list
    const pubPolsList = await dispatch('https://spacefurnio-api.local/api/cms/policies');
    const pubPolsListData = await pubPolsList.json();
    const policyInList = pubPolsListData.some((p: any) => p.slug === testIds.stagingPolicy);
    assert(policyInList, 'Newly published policy appears in public /api/cms/policies list');

    // 5.6 Delete Policy (DELETE /api/admin/cms/policies/:slug)
    const delPolRes = await dispatch(`https://spacefurnio-api.local/api/admin/cms/policies/${testIds.stagingPolicy}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(delPolRes.status === 200, 'DELETE /api/admin/cms/policies/:slug returns 200 OK');
    const delPolData = await delPolRes.json();
    assert(delPolData.success === true, 'Delete policy response success is true');

    // 5.7 Verify 404 after deletion on both public and admin endpoints
    const pubPolAfterDel = await dispatch(`https://spacefurnio-api.local/api/cms/policies/${testIds.stagingPolicy}`);
    assert(pubPolAfterDel.status === 404, 'Public GET /api/cms/policies/:slug returns 404 after deletion');

    const adminPolAfterDel = await dispatch(`https://spacefurnio-api.local/api/admin/cms/policies/${testIds.stagingPolicy}`, {
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    });
    assert(adminPolAfterDel.status === 404, 'Admin GET /api/admin/cms/policies/:slug returns 404 after deletion');

    // 5.8 Local Fallback Check (Build without webhook binding)
    const localFallbackEnv = {
      DATABASE_URL,
      RSA_PUBLIC_KEY_PEM,
      RSA_PRIVATE_KEY_PEM,
      // No BUILD_WEBHOOK_URL or CLOUDFLARE_PAGES_DEPLOY_HOOK
    };
    // Clear recent builds for test user
    await sql`DELETE FROM cms_build_events WHERE triggered_by = ${testIds.superAdmin}`;
    const localBuildRes = await dispatch('https://spacefurnio-api.local/api/admin/cms/build', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.superAdmin}` },
    }, localFallbackEnv);
    assert(localBuildRes.status === 200, 'Build without webhook binding returns 200 OK (local fallback)');
    const localBuildData = await localBuildRes.json();
    assert(localBuildData.status === 'skipped_local', 'Build event status is skipped_local');

  } finally {
    // =========================================================================
    // 6. Cleanup of Test Fixtures & Artifacts
    // =========================================================================
    header('6. Cleanup Test Fixtures & Artifacts');
    console.log('Tearing down test database rows...');
    try {
      await sql`DELETE FROM cms_versions WHERE scope IN (${testIds.stagingPage}, 'policies') AND (entity_id = ${testIds.stagingSec1} OR entity_id = ${testIds.stagingPolicy})`;
      await sql`DELETE FROM cms_sections WHERE page_slug = ${testIds.stagingPage}`;
      await sql`DELETE FROM cms_pages WHERE slug = ${testIds.stagingPage}`;
      await sql`DELETE FROM cms_policies WHERE slug = ${testIds.stagingPolicy}`;
      await sql`DELETE FROM cms_build_events WHERE triggered_by IN (${testIds.superAdmin}, ${testIds.storeManager}, ${testIds.catalogSpecialist})`;
      await sql`DELETE FROM user_roles WHERE user_id IN (${testIds.superAdmin}, ${testIds.storeManager}, ${testIds.catalogSpecialist}, ${testIds.customerSupport}, ${testIds.salesLead}, ${testIds.customerUser})`;
      await sql`DELETE FROM users WHERE id IN (${testIds.superAdmin}, ${testIds.storeManager}, ${testIds.catalogSpecialist}, ${testIds.customerSupport}, ${testIds.salesLead}, ${testIds.customerUser})`;
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }

    mockServer.close();
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  header('Verification Results Summary');
  console.log(`Total assertions: ${totalTests}`);
  console.log(`Passed:           ${passedTests}`);
  console.log(`Failed:           ${failedTests}`);
  console.log(`Execution Time:   ${durationSec}s`);

  if (failedTests > 0) {
    console.error(`\nFAILED: ${failedTests} assertions failed.`);
    process.exit(1);
  } else {
    console.log(`\nALL VERIFICATION CHECKS PASSED (100% PASS RATE).`);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
