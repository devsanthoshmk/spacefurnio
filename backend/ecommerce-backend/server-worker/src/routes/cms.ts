import { AutoRouter, error } from 'itty-router';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const cmsRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({
  base: '/api/cms',
});

// 1. Health check
cmsRouter.get('/health', () => {
  return { status: 'ok', module: 'cms' };
});

// 2. SSG Bundle: full snapshot of published content for SSG prerender & hydration
cmsRouter.get('/bundle', async (request, env) => {
  try {
    const { sql } = getDb(env);

    const [pageRows, sectionRows, policyRows] = await Promise.all([
      sql`
        SELECT 
          id, slug, title, seo_metadata as "seoMetadata", 
          status, published_at as "publishedAt", updated_at as "updatedAt"
        FROM cms_pages
        WHERE status = 'published'
        ORDER BY slug ASC
      `,
      sql`
        SELECT 
          id, page_slug as "pageSlug", section_key as "sectionKey", 
          sort_order as "sortOrder", enabled, published_data as "publishedData", 
          updated_at as "updatedAt"
        FROM cms_sections
        WHERE enabled = true
        ORDER BY page_slug ASC, sort_order ASC
      `,
      sql`
        SELECT 
          id, slug, title, published_content as "publishedContent", 
          version_num as "versionNum", published_at as "publishedAt", 
          updated_at as "updatedAt"
        FROM cms_policies
        WHERE published_at IS NOT NULL OR (published_content IS NOT NULL AND published_content != '')
        ORDER BY slug ASC
      `,
    ]);

    // Group sections by page slug
    const sectionsByPage: Record<string, any[]> = {};
    for (const sec of sectionRows) {
      if (!sectionsByPage[sec.pageSlug]) {
        sectionsByPage[sec.pageSlug] = [];
      }
      sectionsByPage[sec.pageSlug].push({
        id: sec.id,
        sectionKey: sec.sectionKey,
        sortOrder: sec.sortOrder,
        data: sec.publishedData ?? {},
        publishedData: sec.publishedData ?? {},
        updatedAt: sec.updatedAt,
      });
    }

    const pages = pageRows.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      seoMetadata: p.seoMetadata ?? {},
      status: p.status,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      sections: sectionsByPage[p.slug] || [],
    }));

    const policies = policyRows.map((pol: any) => ({
      id: pol.id,
      slug: pol.slug,
      title: pol.title,
      content: pol.publishedContent ?? '',
      publishedContent: pol.publishedContent ?? '',
      versionNum: pol.versionNum,
      publishedAt: pol.publishedAt,
      updatedAt: pol.updatedAt,
    }));

    const bundle = {
      generatedAt: new Date().toISOString(),
      pages,
      policies,
    };

    return new Response(JSON.stringify(bundle), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('Failed to get CMS bundle:', err);
    return error(500, { message: 'Failed to generate CMS bundle', error: err?.message });
  }
});

// 3. Single published page with active sections
cmsRouter.get('/pages/:slug', async (request, env) => {
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
          status, published_at as "publishedAt", updated_at as "updatedAt"
        FROM cms_pages
        WHERE slug = ${slug} AND status = 'published'
        LIMIT 1
      `,
      sql`
        SELECT 
          id, page_slug as "pageSlug", section_key as "sectionKey", 
          sort_order as "sortOrder", enabled, published_data as "publishedData", 
          updated_at as "updatedAt"
        FROM cms_sections
        WHERE page_slug = ${slug} AND enabled = true
        ORDER BY sort_order ASC
      `,
    ]);

    if (pageRows.length === 0) {
      return error(404, { message: 'Page not found' });
    }

    const page = pageRows[0];
    const sections = sectionRows.map((sec: any) => ({
      id: sec.id,
      sectionKey: sec.sectionKey,
      sortOrder: sec.sortOrder,
      data: sec.publishedData ?? {},
      publishedData: sec.publishedData ?? {},
      updatedAt: sec.updatedAt,
    }));

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      seoMetadata: page.seoMetadata ?? {},
      status: page.status,
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
      sections,
    };
  } catch (err: any) {
    console.error('Failed to fetch page:', err);
    return error(500, { message: 'Failed to fetch page', error: err?.message });
  }
});

// 4. List published policies
cmsRouter.get('/policies', async (request, env) => {
  try {
    const { sql } = getDb(env);

    const policies = await sql`
      SELECT 
        slug, title, version_num as "versionNum", published_at as "publishedAt"
      FROM cms_policies
      WHERE published_at IS NOT NULL OR (published_content IS NOT NULL AND published_content != '')
      ORDER BY title ASC
    `;

    return policies;
  } catch (err: any) {
    console.error('Failed to fetch published policies:', err);
    return error(500, { message: 'Failed to fetch policies', error: err?.message });
  }
});

// 5. Single published policy content
cmsRouter.get('/policies/:slug', async (request, env) => {
  try {
    const slug = request.params?.slug;
    if (!slug) {
      return error(400, { message: 'Missing policy slug' });
    }

    const { sql } = getDb(env);

    const rows = await sql`
      SELECT 
        id, slug, title, published_content as "publishedContent", 
        version_num as "versionNum", published_at as "publishedAt", 
        updated_at as "updatedAt"
      FROM cms_policies
      WHERE slug = ${slug}
        AND (published_at IS NOT NULL OR (published_content IS NOT NULL AND published_content != ''))
      LIMIT 1
    `;

    if (rows.length === 0) {
      return error(404, { message: 'Policy not found' });
    }

    const pol = rows[0];

    return {
      id: pol.id,
      slug: pol.slug,
      title: pol.title,
      content: pol.publishedContent ?? '',
      publishedContent: pol.publishedContent ?? '',
      versionNum: pol.versionNum,
      publishedAt: pol.publishedAt,
      updatedAt: pol.updatedAt,
    };
  } catch (err: any) {
    console.error('Failed to fetch policy:', err);
    return error(500, { message: 'Failed to fetch policy', error: err?.message });
  }
});
