import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb } from '../../utils/db';
import { Env } from '../../types';

export const adminCmsRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/cms',
});

// Helper to mask secret deploy hook URLs for audit logs
function maskWebhookUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/');
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (last.length > 8) {
        parts[parts.length - 1] = `${last.slice(0, 4)}...${last.slice(-4)}`;
      } else {
        parts[parts.length - 1] = '****';
      }
      parsed.pathname = parts.join('/');
    }
    parsed.search = '';
    return parsed.toString();
  } catch {
    return url.length > 10 ? `${url.slice(0, 6)}...${url.slice(-4)}` : '****';
  }
}

// Helper to sync active Cloudflare Pages deployment status
export async function syncActiveDeploymentStatus(
  sql: any,
  env: Env,
  buildEvent: any
): Promise<any> {
  if (!buildEvent) return buildEvent;
  if (buildEvent.status !== 'triggered' && buildEvent.status !== 'pending') {
    return buildEvent;
  }

  let deploymentId: string | null = null;
  const rawBody = buildEvent.responseBody || buildEvent.response_body;
  if (rawBody) {
    try {
      const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
      deploymentId = parsed?.result?.id || parsed?.id || null;
    } catch {
      deploymentId = null;
    }
  }

  if (!deploymentId || !env.CLOUDFLARE_API_TOKEN) {
    return buildEvent;
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID || '23c1d5f8c743a085716fe51f52512bd7';
  const projectName = env.CLOUDFLARE_PAGES_PROJECT_NAME || 'spacefurnio';

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'User-Agent': 'Spacefurnio-CMS-Worker/1.0',
        },
      }
    );

    if (!cfRes.ok) {
      return buildEvent;
    }

    const cfJson = (await cfRes.json()) as any;
    const dep = cfJson?.result;
    const stageStatus = dep?.latest_stage?.status;

    if (stageStatus === 'success') {
      const now = new Date();
      await sql`
        UPDATE cms_build_events
        SET status = 'success',
            completed_at = NOW()
        WHERE id = ${buildEvent.id}
      `;
      return {
        ...buildEvent,
        status: 'success',
        completedAt: now.toISOString(),
      };
    }

    if (stageStatus === 'failure' || stageStatus === 'failed') {
      const errorMessage = dep?.latest_stage?.name
        ? `Deployment failed at stage: ${dep.latest_stage.name}`
        : 'Cloudflare Pages deployment failed';
      const now = new Date();
      await sql`
        UPDATE cms_build_events
        SET status = 'failed',
            completed_at = NOW(),
            error_message = ${errorMessage}
        WHERE id = ${buildEvent.id}
      `;
      return {
        ...buildEvent,
        status: 'failed',
        errorMessage,
        completedAt: now.toISOString(),
      };
    }
  } catch (err: any) {
    console.error('Failed to sync Cloudflare Pages deployment status:', err);
  }

  return buildEvent;
}

// Shared build dispatcher with 60-second cooldown and ctx.waitUntil execution
async function dispatchBuild(
  env: Env,
  ctx?: ExecutionContext,
  userId: string | null = null,
  triggerType: 'publish' | 'manual' = 'publish'
) {
  const { sql } = getDb(env);

  // 1. Enforce 60-second cooldown on active / recent builds
  const recentBuilds = await sql`
    SELECT id, status, started_at
    FROM cms_build_events
    WHERE started_at > NOW() - INTERVAL '60 seconds'
      AND status IN ('pending', 'triggered')
    ORDER BY started_at DESC
    LIMIT 1
  `;

  if (recentBuilds.length > 0) {
    const recent = recentBuilds[0];
    const elapsedMs = Date.now() - new Date(recent.started_at).getTime();
    const cooldownRemainingSeconds = Math.max(1, Math.ceil((60000 - elapsedMs) / 1000));
    return {
      status: 429,
      error: {
        message: 'A storefront build was triggered less than 60 seconds ago. Please wait before triggering another build.',
        cooldownRemainingSeconds,
      },
    };
  }

  const webhookUrl = env.CLOUDFLARE_PAGES_DEPLOY_HOOK || env.BUILD_WEBHOOK_URL;

  // 2. Fallback when no deploy hook is configured
  if (!webhookUrl) {
    const [skippedEvent] = await sql`
      INSERT INTO cms_build_events (
        trigger_type, status, triggered_by, webhook_url_masked, 
        error_message, response_body, started_at, completed_at
      ) VALUES (
        ${triggerType},
        'skipped_local',
        ${userId},
        NULL,
        NULL,
        'Local dev environment: Content published successfully to database. Outbound deploy hook skipped because CLOUDFLARE_PAGES_DEPLOY_HOOK is not set in local host.',
        NOW(),
        NOW()
      )
      RETURNING 
        id, trigger_type as "triggerType", status, 
        webhook_url_masked as "webhookUrlMasked", 
        started_at as "startedAt", completed_at as "completedAt",
        error_message as "errorMessage",
        response_body as "responseBody"
    `;

    return {
      status: 200,
      data: {
        success: true,
        status: 'skipped_local',
        message: 'Content published successfully. Deploy hook dispatch skipped in local/dev environment.',
        buildEvent: skippedEvent,
      },
    };
  }

  // 3. Insert pending build event
  const maskedUrl = maskWebhookUrl(webhookUrl);
  const [buildEvent] = await sql`
    INSERT INTO cms_build_events (
      trigger_type, status, triggered_by, webhook_url_masked, started_at
    ) VALUES (
      ${triggerType},
      'pending',
      ${userId},
      ${maskedUrl},
      NOW()
    )
    RETURNING 
      id, trigger_type as "triggerType", status, 
      webhook_url_masked as "webhookUrlMasked", 
      started_at as "startedAt"
  `;

  // 4. Asynchronous trigger via ctx.waitUntil
  const doFetch = async () => {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Spacefurnio-CMS-Worker/1.0',
        },
      });
      const resText = await res.text();
      const finalStatus = res.ok ? 'triggered' : 'failed';

      let responseBodyToSave = resText.slice(0, 1000);
      if (res.ok) {
        try {
          const json = JSON.parse(resText);
          const depId = json?.result?.id;
          if (depId) {
            responseBodyToSave = JSON.stringify({ result: { id: depId } });
          }
        } catch {
          // Keep raw slice if not valid JSON
        }
      }

      await sql`
        UPDATE cms_build_events
        SET status = ${finalStatus},
            response_code = ${res.status},
            response_body = ${responseBodyToSave},
            completed_at = NOW()
        WHERE id = ${buildEvent.id}
      `;
    } catch (err: any) {
      await sql`
        UPDATE cms_build_events
        SET status = 'failed',
            error_message = ${err?.message || 'Unknown network error during webhook dispatch'},
            completed_at = NOW()
        WHERE id = ${buildEvent.id}
      `;
    }
  };

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(doFetch());
  } else {
    doFetch().catch((e) => console.error('Build dispatch error:', e));
  }

  return {
    status: 200,
    data: {
      success: true,
      status: 'pending',
      message: 'Storefront build deploy hook triggered successfully',
      buildEvent,
    },
  };
}

// ==========================================
// 1. Summary & Overview
// ==========================================
adminCmsRouter.get('/summary', requirePermission('cms.read'), async (request, env) => {
  try {
    const { sql } = getDb(env);

    const [dirtyPages, dirtyPolicies, lastPublished, latestBuilds] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM cms_pages WHERE has_unpublished_changes = true`,
      sql`SELECT COUNT(*)::int as count FROM cms_policies WHERE has_unpublished_changes = true`,
      sql`
        SELECT GREATEST(
          (SELECT MAX(published_at) FROM cms_pages),
          (SELECT MAX(published_at) FROM cms_policies)
        ) as "lastPublishedAt"
      `,
      sql`
        SELECT 
          b.id, b.trigger_type as "triggerType", b.status, 
          b.triggered_by as "triggeredBy", b.webhook_url_masked as "webhookUrlMasked", 
          b.response_code as "responseCode", b.response_body as "responseBody", 
          b.error_message as "errorMessage", b.started_at as "startedAt", 
          b.completed_at as "completedAt",
          u.email as "triggeredByEmail"
        FROM cms_build_events b
        LEFT JOIN users u ON b.triggered_by = u.id
        ORDER BY b.started_at DESC
        LIMIT 1
      `,
    ]);

    const latestBuild = latestBuilds[0]
      ? await syncActiveDeploymentStatus(sql, env, latestBuilds[0])
      : null;

    return {
      dirtyPagesCount: Number(dirtyPages[0]?.count || 0),
      dirtyPoliciesCount: Number(dirtyPolicies[0]?.count || 0),
      lastPublishedAt: lastPublished[0]?.lastPublishedAt || null,
      latestBuild,
    };
  } catch (err: any) {
    console.error('Failed to get CMS summary:', err);
    return error(500, { message: 'Failed to fetch CMS summary', error: err?.message });
  }
});

// ==========================================
// 2. Pages & Sections
// ==========================================

// List all pages with sections summary and hasUnpublishedChanges
adminCmsRouter.get('/pages', requirePermission('cms.read'), async (request, env) => {
  try {
    const { sql } = getDb(env);

    const [pageRows, sectionRows] = await Promise.all([
      sql`
        SELECT 
          id, slug, title, seo_metadata as "seoMetadata", 
          status, has_unpublished_changes as "hasUnpublishedChanges", 
          published_at as "publishedAt", updated_at as "updatedAt", 
          created_at as "createdAt"
        FROM cms_pages
        ORDER BY slug ASC
      `,
      sql`
        SELECT 
          id, page_slug as "pageSlug", section_key as "sectionKey", 
          sort_order as "sortOrder", enabled, updated_at as "updatedAt"
        FROM cms_sections
        ORDER BY page_slug ASC, sort_order ASC
      `,
    ]);

    const sectionsByPage: Record<string, any[]> = {};
    for (const sec of sectionRows) {
      if (!sectionsByPage[sec.pageSlug]) {
        sectionsByPage[sec.pageSlug] = [];
      }
      sectionsByPage[sec.pageSlug].push({
        id: sec.id,
        sectionKey: sec.sectionKey,
        sortOrder: sec.sortOrder,
        enabled: Boolean(sec.enabled),
        updatedAt: sec.updatedAt,
      });
    }

    const pages = pageRows.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      seoMetadata: p.seoMetadata ?? {},
      status: p.status,
      hasUnpublishedChanges: Boolean(p.hasUnpublishedChanges),
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      sectionCount: (sectionsByPage[p.slug] || []).length,
      sections: sectionsByPage[p.slug] || [],
    }));

    return pages;
  } catch (err: any) {
    console.error('Failed to list CMS pages:', err);
    return error(500, { message: 'Failed to list pages', error: err?.message });
  }
});

// Get full page with all sections (draftData, publishedData, enabled, sortOrder)
adminCmsRouter.get('/pages/:slug', requirePermission('cms.read'), async (request, env) => {
  try {
    const slug = request.params?.slug;
    if (!slug) {
      return error(400, { message: 'Missing page slug' });
    }

    const { sql } = getDb(env);

    const [pageRows, sectionRows] = await Promise.all([
      sql`
        SELECT 
          id, slug, title, seo_metadata as "seoMetadata", 
          status, has_unpublished_changes as "hasUnpublishedChanges", 
          published_at as "publishedAt", updated_at as "updatedAt", 
          created_at as "createdAt"
        FROM cms_pages
        WHERE slug = ${slug}
        LIMIT 1
      `,
      sql`
        SELECT 
          id, page_slug as "pageSlug", section_key as "sectionKey", 
          sort_order as "sortOrder", enabled, 
          draft_data as "draftData", published_data as "publishedData", 
          updated_at as "updatedAt"
        FROM cms_sections
        WHERE page_slug = ${slug}
        ORDER BY sort_order ASC
      `,
    ]);

    if (pageRows.length === 0) {
      return error(404, { message: 'Page not found' });
    }

    const page = pageRows[0];
    const sections = sectionRows.map((s: any) => ({
      id: s.id,
      pageSlug: s.pageSlug,
      sectionKey: s.sectionKey,
      sortOrder: s.sortOrder,
      enabled: Boolean(s.enabled),
      draftData: s.draftData ?? {},
      publishedData: s.publishedData ?? {},
      updatedAt: s.updatedAt,
    }));

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      seoMetadata: page.seoMetadata ?? {},
      status: page.status,
      hasUnpublishedChanges: Boolean(page.hasUnpublishedChanges),
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
      sections,
    };
  } catch (err: any) {
    console.error('Failed to get page details:', err);
    return error(500, { message: 'Failed to get page details', error: err?.message });
  }
});

// Update draft content for a section with 30s version deduplication
adminCmsRouter.put('/pages/:slug/sections/:id', requirePermission('cms.write'), async (request, env) => {
  try {
    const { slug, id } = request.params;
    if (!slug || !id) {
      return error(400, { message: 'Missing page slug or section id' });
    }

    const body = (await request.json().catch(() => ({}))) as {
      draftData?: any;
      enabled?: boolean;
      changeSummary?: string;
    };

    const { sql } = getDb(env);

    // Verify section exists for this page
    const existingSections = await sql`
      SELECT id, page_slug, section_key, sort_order, enabled, draft_data, published_data
      FROM cms_sections
      WHERE id = ${id} AND page_slug = ${slug}
      LIMIT 1
    `;

    if (existingSections.length === 0) {
      return error(404, { message: 'Section not found for page ' + slug });
    }

    const currentSection = existingSections[0];
    const newDraftData = body.draftData !== undefined ? body.draftData : currentSection.draft_data;
    const newEnabled = body.enabled !== undefined ? Boolean(body.enabled) : Boolean(currentSection.enabled);
    const changeSummary = body.changeSummary || 'Updated section draft';
    const authorId = request.user?.id || null;

    // 1. Update section draft and enabled flag
    const [updatedSection] = await sql`
      UPDATE cms_sections
      SET draft_data = ${JSON.stringify(newDraftData)}::jsonb,
          enabled = ${newEnabled},
          updated_at = NOW()
      WHERE id = ${id} AND page_slug = ${slug}
      RETURNING 
        id, page_slug as "pageSlug", section_key as "sectionKey", 
        sort_order as "sortOrder", enabled, 
        draft_data as "draftData", published_data as "publishedData", 
        updated_at as "updatedAt"
    `;

    // 2. Mark parent page as having unpublished changes
    await sql`
      UPDATE cms_pages
      SET has_unpublished_changes = true,
          updated_at = NOW()
      WHERE slug = ${slug}
    `;

    // 3. Snapshot version with 30-second deduplication
    const snapshot = {
      draftData: newDraftData,
      enabled: newEnabled,
      sectionKey: currentSection.section_key,
      sortOrder: currentSection.sort_order,
    };

    const recentVersions = await sql`
      SELECT id, version_num, created_at
      FROM cms_versions
      WHERE scope = ${slug} AND entity_id = ${id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const latest = recentVersions[0];
    const isWithin30s = latest && Date.now() - new Date(latest.created_at).getTime() < 30000;

    if (isWithin30s) {
      await sql`
        UPDATE cms_versions
        SET snapshot = ${JSON.stringify(snapshot)}::jsonb,
            change_summary = ${changeSummary},
            created_at = NOW()
        WHERE id = ${latest.id}
      `;
    } else {
      const nextVersionNum = (latest?.version_num || 0) + 1;
      await sql`
        INSERT INTO cms_versions (
          scope, entity_id, version_num, snapshot, 
          change_summary, author_id, created_at
        ) VALUES (
          ${slug},
          ${id},
          ${nextVersionNum},
          ${JSON.stringify(snapshot)}::jsonb,
          ${changeSummary},
          ${authorId},
          NOW()
        )
      `;
    }

    return {
      success: true,
      section: {
        id: updatedSection.id,
        pageSlug: updatedSection.pageSlug,
        sectionKey: updatedSection.sectionKey,
        sortOrder: updatedSection.sortOrder,
        enabled: Boolean(updatedSection.enabled),
        draftData: updatedSection.draftData ?? {},
        publishedData: updatedSection.publishedData ?? {},
        updatedAt: updatedSection.updatedAt,
      },
    };
  } catch (err: any) {
    console.error('Failed to update section:', err);
    return error(500, { message: 'Failed to update section', error: err?.message });
  }
});

// Reorder sections for a page
adminCmsRouter.post('/pages/:slug/sections/reorder', requirePermission('cms.write'), async (request, env) => {
  try {
    const slug = request.params?.slug;
    if (!slug) {
      return error(400, { message: 'Missing page slug' });
    }

    const body: any = await request.json().catch(() => ({}));
    const orders: Array<{ id: string; sortOrder: number }> = Array.isArray(body)
      ? body
      : body?.orders;

    if (!Array.isArray(orders) || orders.length === 0) {
      return error(400, { message: 'Invalid or empty orders array' });
    }

    const { sql } = getDb(env);

    for (const item of orders) {
      if (item.id && typeof item.sortOrder === 'number') {
        await sql`
          UPDATE cms_sections
          SET sort_order = ${item.sortOrder},
              updated_at = NOW()
          WHERE id = ${item.id} AND page_slug = ${slug}
        `;
      }
    }

    await sql`
      UPDATE cms_pages
      SET has_unpublished_changes = true,
          updated_at = NOW()
      WHERE slug = ${slug}
    `;

    return { success: true, message: 'Sections reordered successfully' };
  } catch (err: any) {
    console.error('Failed to reorder sections:', err);
    return error(500, { message: 'Failed to reorder sections', error: err?.message });
  }
});

// ==========================================
// 3. Policies
// ==========================================

// List all policies with draft vs published info
adminCmsRouter.get('/policies', requirePermission('cms.read'), async (request, env) => {
  try {
    const { sql } = getDb(env);

    const policies = await sql`
      SELECT 
        id, slug, title, 
        draft_content as "draftContent", 
        published_content as "publishedContent", 
        version_num as "versionNum", 
        has_unpublished_changes as "hasUnpublishedChanges", 
        published_at as "publishedAt", 
        updated_at as "updatedAt"
      FROM cms_policies
      ORDER BY title ASC
    `;

    return policies.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      draftContent: p.draftContent ?? '',
      publishedContent: p.publishedContent ?? '',
      versionNum: p.versionNum,
      hasUnpublishedChanges: Boolean(p.hasUnpublishedChanges),
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
    }));
  } catch (err: any) {
    console.error('Failed to list policies:', err);
    return error(500, { message: 'Failed to list policies', error: err?.message });
  }
});

// Get single policy with draftContent and publishedContent
adminCmsRouter.get('/policies/:slug', requirePermission('cms.read'), async (request, env) => {
  try {
    const slug = request.params?.slug;
    if (!slug) {
      return error(400, { message: 'Missing policy slug' });
    }

    const { sql } = getDb(env);

    const rows = await sql`
      SELECT 
        id, slug, title, 
        draft_content as "draftContent", 
        published_content as "publishedContent", 
        version_num as "versionNum", 
        has_unpublished_changes as "hasUnpublishedChanges", 
        published_at as "publishedAt", 
        updated_at as "updatedAt"
      FROM cms_policies
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return error(404, { message: 'Policy not found' });
    }

    const p = rows[0];
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      draftContent: p.draftContent ?? '',
      publishedContent: p.publishedContent ?? '',
      versionNum: p.versionNum,
      hasUnpublishedChanges: Boolean(p.hasUnpublishedChanges),
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
    };
  } catch (err: any) {
    console.error('Failed to get policy:', err);
    return error(500, { message: 'Failed to get policy', error: err?.message });
  }
});

// Create a new policy
adminCmsRouter.post('/policies', requirePermission('cms.write'), async (request, env) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: string;
      title?: string;
      draftContent?: string;
    };

    const slug = body.slug?.trim().toLowerCase();
    const title = body.title?.trim();

    if (!slug || !title) {
      return error(400, { message: 'Slug and title are required' });
    }

    const { sql } = getDb(env);

    // Check slug uniqueness
    const existing = await sql`
      SELECT id FROM cms_policies WHERE slug = ${slug} LIMIT 1
    `;
    if (existing.length > 0) {
      return error(409, { message: 'Policy with this slug already exists' });
    }

    const draftContent = body.draftContent || '';
    const authorId = request.user?.id || null;

    const [newPolicy] = await sql`
      INSERT INTO cms_policies (
        slug, title, draft_content, published_content, 
        version_num, has_unpublished_changes, updated_at
      ) VALUES (
        ${slug}, ${title}, ${draftContent}, '', 
        1, true, NOW()
      )
      RETURNING 
        id, slug, title, 
        draft_content as "draftContent", 
        published_content as "publishedContent", 
        version_num as "versionNum", 
        has_unpublished_changes as "hasUnpublishedChanges", 
        published_at as "publishedAt", 
        updated_at as "updatedAt"
    `;

    // Record initial version in cms_versions
    await sql`
      INSERT INTO cms_versions (
        scope, entity_id, version_num, snapshot, 
        change_summary, author_id, created_at
      ) VALUES (
        'policies',
        ${slug},
        1,
        ${JSON.stringify({ title, draftContent, versionNum: 1 })}::jsonb,
        'Initial policy creation',
        ${authorId},
        NOW()
      )
    `;

    return {
      success: true,
      policy: {
        id: newPolicy.id,
        slug: newPolicy.slug,
        title: newPolicy.title,
        draftContent: newPolicy.draftContent,
        publishedContent: newPolicy.publishedContent,
        versionNum: newPolicy.versionNum,
        hasUnpublishedChanges: Boolean(newPolicy.hasUnpublishedChanges),
        publishedAt: newPolicy.publishedAt,
        updatedAt: newPolicy.updatedAt,
      },
    };
  } catch (err: any) {
    console.error('Failed to create policy:', err);
    return error(500, { message: 'Failed to create policy', error: err?.message });
  }
});

// Update policy draft content with version snapshot & 30s deduplication
adminCmsRouter.put('/policies/:slug', requirePermission('cms.write'), async (request, env) => {
  try {
    const slug = request.params?.slug;
    if (!slug) {
      return error(400, { message: 'Missing policy slug' });
    }

    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      draftContent?: string;
      changeSummary?: string;
    };

    const { sql } = getDb(env);

    const existing = await sql`
      SELECT id, slug, title, draft_content, version_num
      FROM cms_policies
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Policy not found' });
    }

    const current = existing[0];
    const newTitle = body.title !== undefined ? body.title.trim() : current.title;
    const newDraftContent = body.draftContent !== undefined ? body.draftContent : current.draft_content;
    const changeSummary = body.changeSummary || 'Updated policy draft';
    const authorId = request.user?.id || null;

    const [updated] = await sql`
      UPDATE cms_policies
      SET title = ${newTitle},
          draft_content = ${newDraftContent},
          has_unpublished_changes = true,
          updated_at = NOW()
      WHERE slug = ${slug}
      RETURNING 
        id, slug, title, 
        draft_content as "draftContent", 
        published_content as "publishedContent", 
        version_num as "versionNum", 
        has_unpublished_changes as "hasUnpublishedChanges", 
        published_at as "publishedAt", 
        updated_at as "updatedAt"
    `;

    // 30-second version deduplication for policies
    const recentVersions = await sql`
      SELECT id, version_num, created_at
      FROM cms_versions
      WHERE scope = 'policies' AND entity_id = ${slug}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const snapshot = {
      title: newTitle,
      draftContent: newDraftContent,
      versionNum: updated.versionNum,
    };

    const latest = recentVersions[0];
    const isWithin30s = latest && Date.now() - new Date(latest.created_at).getTime() < 30000;

    if (isWithin30s) {
      await sql`
        UPDATE cms_versions
        SET snapshot = ${JSON.stringify(snapshot)}::jsonb,
            change_summary = ${changeSummary},
            created_at = NOW()
        WHERE id = ${latest.id}
      `;
    } else {
      const nextVer = (latest?.version_num || 0) + 1;
      await sql`
        INSERT INTO cms_versions (
          scope, entity_id, version_num, snapshot, 
          change_summary, author_id, created_at
        ) VALUES (
          'policies',
          ${slug},
          ${nextVer},
          ${JSON.stringify(snapshot)}::jsonb,
          ${changeSummary},
          ${authorId},
          NOW()
        )
      `;
    }

    return {
      success: true,
      policy: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        draftContent: updated.draftContent,
        publishedContent: updated.publishedContent,
        versionNum: updated.versionNum,
        hasUnpublishedChanges: Boolean(updated.hasUnpublishedChanges),
        publishedAt: updated.publishedAt,
        updatedAt: updated.updatedAt,
      },
    };
  } catch (err: any) {
    console.error('Failed to update policy:', err);
    return error(500, { message: 'Failed to update policy', error: err?.message });
  }
});

// Delete a policy
adminCmsRouter.delete('/policies/:slug', requirePermission('cms.write'), async (request, env) => {
  try {
    const slug = request.params?.slug;
    if (!slug) {
      return error(400, { message: 'Missing policy slug' });
    }

    const { sql } = getDb(env);

    const deleted = await sql`
      DELETE FROM cms_policies
      WHERE slug = ${slug}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return error(404, { message: 'Policy not found' });
    }

    return { success: true, message: 'Policy deleted successfully' };
  } catch (err: any) {
    console.error('Failed to delete policy:', err);
    return error(500, { message: 'Failed to delete policy', error: err?.message });
  }
});

// ==========================================
// 4. Version History & Rollback
// ==========================================

// Get version snapshots (capped at 50)
adminCmsRouter.get('/versions', requirePermission('cms.read'), async (request, env) => {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') || null;
    const entityId = url.searchParams.get('entityId') || null;

    const { sql } = getDb(env);

    const versions = await sql`
      SELECT 
        v.id, v.scope, v.entity_id as "entityId", 
        v.version_num as "versionNum", v.snapshot, 
        v.change_summary as "changeSummary", v.field_path as "fieldPath", 
        v.author_id as "authorId", v.created_at as "createdAt",
        u.email as "authorEmail"
      FROM cms_versions v
      LEFT JOIN users u ON v.author_id = u.id
      WHERE (${scope}::text IS NULL OR v.scope = ${scope})
        AND (${entityId}::text IS NULL OR v.entity_id = ${entityId})
      ORDER BY v.created_at DESC
      LIMIT 50
    `;

    return versions;
  } catch (err: any) {
    console.error('Failed to get versions:', err);
    return error(500, { message: 'Failed to fetch versions', error: err?.message });
  }
});

// Rollback section or policy draft data to snapshot state
adminCmsRouter.post('/versions/:id/rollback', requirePermission('cms.write'), async (request, env) => {
  try {
    const versionId = Number(request.params?.id);
    if (!versionId || isNaN(versionId)) {
      return error(400, { message: 'Invalid version ID' });
    }

    const { sql } = getDb(env);

    const versionRows = await sql`
      SELECT id, scope, entity_id, version_num, snapshot, author_id
      FROM cms_versions
      WHERE id = ${versionId}
      LIMIT 1
    `;

    if (versionRows.length === 0) {
      return error(404, { message: 'Version record not found' });
    }

    const version = versionRows[0];
    const authorId = request.user?.id || null;

    // A. Rollback Policy
    if (version.scope === 'policies') {
      const restoredDraft =
        typeof version.snapshot === 'string'
          ? version.snapshot
          : version.snapshot?.draftContent ?? version.snapshot?.content ?? '';
      const restoredTitle =
        typeof version.snapshot === 'object' && version.snapshot?.title
          ? version.snapshot.title
          : null;

      const [updatedPolicy] = await sql`
        UPDATE cms_policies
        SET draft_content = ${restoredDraft},
            title = COALESCE(${restoredTitle}, title),
            has_unpublished_changes = true,
            updated_at = NOW()
        WHERE slug = ${version.entity_id}
        RETURNING 
          id, slug, title, 
          draft_content as "draftContent", 
          published_content as "publishedContent", 
          version_num as "versionNum", 
          has_unpublished_changes as "hasUnpublishedChanges", 
          updated_at as "updatedAt"
      `;

      if (!updatedPolicy) {
        return error(404, { message: `Target policy '${version.entity_id}' no longer exists` });
      }

      // Record rollback version
      const nextVer = (version.version_num || 0) + 1;
      await sql`
        INSERT INTO cms_versions (
          scope, entity_id, version_num, snapshot, 
          change_summary, author_id, created_at
        ) VALUES (
          'policies',
          ${version.entity_id},
          ${nextVer},
          ${JSON.stringify({ title: updatedPolicy.title, draftContent: restoredDraft, versionNum: updatedPolicy.versionNum })}::jsonb,
          ${`Rollback to version #${version.version_num}`},
          ${authorId},
          NOW()
        )
      `;

      return {
        success: true,
        message: `Policy rolled back to version #${version.version_num}`,
        policy: updatedPolicy,
      };
    }

    // B. Rollback Section
    const sectionId = version.entity_id;
    const restoredDraftData =
      version.snapshot?.draftData !== undefined ? version.snapshot.draftData : version.snapshot;
    const restoredEnabled =
      version.snapshot?.enabled !== undefined ? Boolean(version.snapshot.enabled) : true;

    const [updatedSection] = await sql`
      UPDATE cms_sections
      SET draft_data = ${JSON.stringify(restoredDraftData)}::jsonb,
          enabled = ${restoredEnabled},
          updated_at = NOW()
      WHERE id = ${sectionId}
      RETURNING 
        id, page_slug as "pageSlug", section_key as "sectionKey", 
        sort_order as "sortOrder", enabled, 
        draft_data as "draftData", published_data as "publishedData", 
        updated_at as "updatedAt"
    `;

    if (!updatedSection) {
      return error(404, { message: `Target section '${sectionId}' no longer exists` });
    }

    // Update parent page
    await sql`
      UPDATE cms_pages
      SET has_unpublished_changes = true,
          updated_at = NOW()
      WHERE slug = ${updatedSection.pageSlug}
    `;

    // Record rollback version
    const nextVer = (version.version_num || 0) + 1;
    await sql`
      INSERT INTO cms_versions (
        scope, entity_id, version_num, snapshot, 
        change_summary, author_id, created_at
      ) VALUES (
        ${version.scope},
        ${sectionId},
        ${nextVer},
        ${JSON.stringify({
          draftData: restoredDraftData,
          enabled: restoredEnabled,
          sectionKey: updatedSection.sectionKey,
          sortOrder: updatedSection.sortOrder,
        })}::jsonb,
        ${`Rollback to version #${version.version_num}`},
        ${authorId},
        NOW()
      )
    `;

    return {
      success: true,
      message: `Section rolled back to version #${version.version_num}`,
      section: updatedSection,
    };
  } catch (err: any) {
    console.error('Failed to rollback version:', err);
    return error(500, { message: 'Failed to rollback version', error: err?.message });
  }
});

// ==========================================
// 5. Publish & SSG Build Trigger ("Update Site")
// ==========================================

// Atomic Publish: draftData -> publishedData and draftContent -> publishedContent
adminCmsRouter.post('/publish', requirePermission('cms.publish'), async (request, env) => {
  try {
    const { sql } = getDb(env);
    const authorId = request.user?.id || null;

    // Copy draftData to publishedData for all sections
    await sql`
      UPDATE cms_sections
      SET published_data = draft_data,
          updated_at = NOW()
    `;

    // Mark all pages as published with has_unpublished_changes = false
    await sql`
      UPDATE cms_pages
      SET status = 'published',
          has_unpublished_changes = false,
          published_at = NOW(),
          updated_at = NOW()
    `;

    // Copy draftContent to publishedContent for all policies
    await sql`
      UPDATE cms_policies
      SET published_content = draft_content,
          version_num = version_num + 1,
          has_unpublished_changes = false,
          published_at = NOW(),
          updated_at = NOW()
    `;

    // Record publication baseline snapshot in cms_versions
    await sql`
      INSERT INTO cms_versions (
        scope, entity_id, version_num, snapshot, 
        change_summary, author_id, created_at
      ) VALUES (
        'publish',
        'all',
        (SELECT COALESCE(MAX(version_num), 0) + 1 FROM cms_versions WHERE scope = 'publish'),
        jsonb_build_object('publishedAt', NOW()),
        'Full storefront content published',
        ${authorId},
        NOW()
      )
    `;

    return {
      success: true,
      publishedAt: new Date().toISOString(),
      message: 'All storefront content published successfully',
    };
  } catch (err: any) {
    console.error('Failed to publish content:', err);
    return error(500, { message: 'Failed to publish content', error: err?.message });
  }
});

// Trigger SSG Deploy Hook with 60-second cooldown
adminCmsRouter.post('/build', requirePermission('cms.publish'), async (request, env, ctx) => {
  try {
    const authorId = request.user?.id || null;
    const result = await dispatchBuild(env, ctx, authorId, 'manual');
    if (result.status !== 200) {
      return error(result.status, result.error);
    }
    return result.data;
  } catch (err: any) {
    console.error('Failed to trigger build:', err);
    return error(500, { message: 'Failed to trigger build', error: err?.message });
  }
});

// Composite action: Publish all changes then trigger build deploy hook
adminCmsRouter.post('/publish-and-build', requirePermission('cms.publish'), async (request, env, ctx) => {
  try {
    const { sql } = getDb(env);
    const authorId = request.user?.id || null;

    // 1. Publish content atomically
    await sql`
      UPDATE cms_sections
      SET published_data = draft_data,
          updated_at = NOW()
    `;

    await sql`
      UPDATE cms_pages
      SET status = 'published',
          has_unpublished_changes = false,
          published_at = NOW(),
          updated_at = NOW()
    `;

    await sql`
      UPDATE cms_policies
      SET published_content = draft_content,
          version_num = version_num + 1,
          has_unpublished_changes = false,
          published_at = NOW(),
          updated_at = NOW()
    `;

    await sql`
      INSERT INTO cms_versions (
        scope, entity_id, version_num, snapshot, 
        change_summary, author_id, created_at
      ) VALUES (
        'publish',
        'all',
        (SELECT COALESCE(MAX(version_num), 0) + 1 FROM cms_versions WHERE scope = 'publish'),
        jsonb_build_object('publishedAt', NOW()),
        'Full storefront content published (Update Site)',
        ${authorId},
        NOW()
      )
    `;

    const publishedAt = new Date().toISOString();

    // 2. Dispatch storefront rebuild hook
    const buildResult = await dispatchBuild(env, ctx, authorId, 'publish');

    return {
      success: true,
      published: true,
      publishedAt,
      build: buildResult.status === 200 ? buildResult.data : buildResult.error,
    };
  } catch (err: any) {
    console.error('Failed to publish and build:', err);
    return error(500, { message: 'Failed to publish and build', error: err?.message });
  }
});

// List the last 20 build events
adminCmsRouter.get('/build-events', requirePermission('cms.read'), async (request, env) => {
  try {
    const { sql } = getDb(env);

    const buildEvents = await sql`
      SELECT 
        b.id, b.trigger_type as "triggerType", b.status, 
        b.triggered_by as "triggeredBy", b.webhook_url_masked as "webhookUrlMasked", 
        b.response_code as "responseCode", b.response_body as "responseBody", 
        b.error_message as "errorMessage", b.started_at as "startedAt", 
        b.completed_at as "completedAt",
        u.email as "triggeredByEmail"
      FROM cms_build_events b
      LEFT JOIN users u ON b.triggered_by = u.id
      ORDER BY b.started_at DESC
      LIMIT 20
    `;

    const syncedBuildEvents = await Promise.all(
      buildEvents.map((evt: any) => syncActiveDeploymentStatus(sql, env, evt))
    );

    return syncedBuildEvents;
  } catch (err: any) {
    console.error('Failed to list build events:', err);
    return error(500, { message: 'Failed to list build events', error: err?.message });
  }
});

export { dispatchBuild, dispatchBuild as dispatchBuildDeployHook };
