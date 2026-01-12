/**
 * ===========================================
 * CONTENT ADMIN ROUTES
 * ===========================================
 * Admin content management API with passcode verification
 * Uses Cloudflare KV for passcode/PAT token storage
 * Updates content files via GitHub API
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/backend/api/v1/admin/content' });

// // test
// router.all('*', (req) => {
//   console.log('Reached content admin fallback for:', req.method, req.url);
//   return error(404);
// });


// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'devsanthoshmk';
const REPO_NAME = 'spacefurnio';
const CONTENTS_PATH = 'frontend/src/assets/contents';
const BRANCH = 'main';

// ===========================================
// JS FILE PARSING HELPERS
// ===========================================

/**
 * Parse a JS content file and extract the content object
 * Handles the format: export default { key: { text: "...", component: ... }, ... }
 */
function parseJsContentFile(jsContent) {
    const result = {};

    // First pass: extract all keys with their text values
    // Pattern matches: key: { text: "value" or key: { text: 'value'
    const textPattern = /(\w+):\s*\{\s*text:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;

    let match;
    while ((match = textPattern.exec(jsContent)) !== null) {
        const key = match[1];
        let textValue = match[2];

        // Remove surrounding quotes from text
        textValue = textValue.slice(1, -1);
        // Unescape the string
        textValue = textValue.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');

        result[key] = { text: textValue };
    }

    // Second pass: extract component definitions for each key
    // Handle single arrow function: component: () => import(...)
    const singleComponentPattern = /(\w+):\s*\{[^}]*component:\s*(\(\)\s*=>\s*import\s*\([^)]+\))/g;
    while ((match = singleComponentPattern.exec(jsContent)) !== null) {
        const key = match[1];
        if (result[key]) {
            result[key].componentRaw = match[2].trim();
        }
    }

    // Handle array of arrow functions: component: [() => import(...), () => import(...)]
    const arrayComponentPattern = /(\w+):\s*\{[^}]*component:\s*\[([\s\S]*?)\]/g;
    while ((match = arrayComponentPattern.exec(jsContent)) !== null) {
        const key = match[1];
        if (result[key] && !result[key].componentRaw) {
            // Clean up the array content
            const arrayContent = match[2].replace(/\s+/g, ' ').trim();
            result[key].componentRaw = `[${arrayContent}]`;
        }
    }

    return result;
}

/**
 * Generate a JS content file from the content object
 * Preserves the original structure with dynamic imports
 */
function generateJsContentFile(content) {
    const lines = [
        '/**',
        ' * Home Page Content Configuration',
        ' * Each content key contains:',
        ' *   - text: The content value',
        ' *   - component: Arrow function(s) to dynamically import the component(s) that use this content',
        ' */',
        '',
        'export default {'
    ];

    const entries = Object.entries(content);
    entries.forEach(([key, value], index) => {
        const text = (value.text || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const componentRaw = value.componentRaw || "() => import('@/views/HomeView.vue')";
        const comma = index < entries.length - 1 ? ',' : '';

        lines.push(`    ${key}: {`);
        lines.push(`        text: "${text}",`);
        lines.push(`        component: ${componentRaw}`);
        lines.push(`    }${comma}`);
    });

    lines.push('};');
    lines.push('');

    return lines.join('\n');
}


// ===========================================
// VERIFY PASSCODE AND GET PAT TOKEN
// ===========================================
router.post('/verify', async (request) => {
    console.log('Content admin verify request received');
    const { env } = request;

    let body;
    try {
        body = await request.json();
    } catch {
        return error(400, { message: 'Invalid request body' });
    }

    const { passcode } = body;

    if (!passcode) {
        return error(400, { message: 'Passcode is required' });
    }

    try {
        // Get PAT token from KV using passcode as key
        const secretData = await env.ADMIN_SECRETS.get(passcode, { type: 'json' });

        if (!secretData || !secretData.pat) {
            console.log('Invalid passcode attempt:', passcode);
            return error(403, { message: 'Invalid passcode' });
        }

        // Return the PAT token for frontend to use in subsequent requests
        // In production, you might want to create a session token instead
        return json({
            success: true,
            message: 'Passcode verified',
            pat: secretData.pat,
            repo: secretData.repo || `${REPO_OWNER}/${REPO_NAME}`,
            branch: secretData.branch || BRANCH
        });

    } catch (err) {
        console.error('Passcode verification error:', err);
        return error(500, { message: 'Failed to verify passcode' });
    }
});

// ===========================================
// GET CONTENT FILE
// ===========================================
router.get('/files/:filename', async (request) => {
    const { params, env } = request;
    const url = new URL(request.url);
    const pat = url.searchParams.get('pat');

    if (!pat) {
        return error(401, { message: 'PAT token required' });
    }

    const filename = params.filename;
    const isJson = filename.endsWith('.json');
    const isJs = filename.endsWith('.js');
    if (!isJson && !isJs) {
        return error(400, { message: 'Only JSON and JS files allowed' });
    }

    try {
        const filePath = `${CONTENTS_PATH}/${filename}`;
        const response = await fetch(
            `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`,
            {
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Spacefurnio-Admin'
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API error:', errorData);
            return error(response.status, { message: errorData.message || 'Failed to fetch file' });
        }

        const data = await response.json();

        // Decode base64 content
        const rawContent = atob(data.content.replace(/\n/g, ''));

        let parsedContent;
        if (isJson) {
            parsedContent = JSON.parse(rawContent);
        } else {
            // Parse JS file - extract the default export object
            // The JS file format is: export default { key: { text: "...", component: ... }, ... }
            parsedContent = parseJsContentFile(rawContent);
        }

        return json({
            success: true,
            filename,
            content: parsedContent,
            sha: data.sha, // Need this for updating
            fileType: isJson ? 'json' : 'js'
        });

    } catch (err) {
        console.error('Get content file error:', err);
        return error(500, { message: 'Failed to fetch content file' });
    }
});

// ===========================================
// LIST CONTENT FILES
// ===========================================
router.get('/files', async (request) => {
    const { env } = request;
    const url = new URL(request.url);
    const pat = url.searchParams.get('pat');

    if (!pat) {
        return error(401, { message: 'PAT token required' });
    }

    try {
        const response = await fetch(
            `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENTS_PATH}?ref=${BRANCH}`,
            {
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Spacefurnio-Admin'
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return error(response.status, { message: errorData.message || 'Failed to list files' });
        }

        const files = await response.json();

        // Filter JSON and JS content files
        const contentFiles = files
            .filter(f => f.type === 'file' && (f.name.endsWith('.json') || f.name.endsWith('.js')))
            .map(f => ({
                name: f.name,
                path: f.path,
                sha: f.sha
            }));

        return json({
            success: true,
            files: contentFiles
        });

    } catch (err) {
        console.error('List content files error:', err);
        return error(500, { message: 'Failed to list content files' });
    }
});

// ===========================================
// UPDATE CONTENT FILE
// ===========================================
router.post('/update', async (request) => {
    const { env } = request;

    let body;
    try {
        body = await request.json();
    } catch {
        return error(400, { message: 'Invalid request body' });
    }

    const { pat, filename, content, sha, commitMessage } = body;

    if (!pat) {
        return error(401, { message: 'PAT token required' });
    }

    if (!filename || !content || !sha) {
        return error(400, { message: 'Filename, content, and SHA are required' });
    }

    const isJson = filename.endsWith('.json');
    const isJs = filename.endsWith('.js');
    if (!isJson && !isJs) {
        return error(400, { message: 'Only JSON and JS files allowed' });
    }

    try {
        const filePath = `${CONTENTS_PATH}/${filename}`;

        // Generate file content based on type
        let contentString;
        if (isJson) {
            contentString = JSON.stringify(content, null, 4);
        } else {
            // Generate JS file content
            contentString = generateJsContentFile(content);
        }
        const encodedContent = btoa(contentString);

        const response = await fetch(
            `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Spacefurnio-Admin',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage || `Update ${filename} via admin panel`,
                    content: encodedContent,
                    sha: sha,
                    branch: BRANCH
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub update error:', errorData);
            return error(response.status, {
                message: errorData.message || 'Failed to update file',
                details: errorData
            });
        }

        const data = await response.json();

        return json({
            success: true,
            message: `Successfully updated ${filename}`,
            commit: data.commit?.sha,
            newSha: data.content?.sha
        });

    } catch (err) {
        console.error('Update content file error:', err);
        return error(500, { message: 'Failed to update content file' });
    }
});

// ===========================================
// 404 HANDLER
// ===========================================
router.all('*', () => error(404, { message: 'Content admin endpoint not found' }));

export default router;
