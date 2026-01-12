/**
 * ===========================================
 * CONTENT ADMIN ROUTES
 * ===========================================
 * Admin content management API with passcode verification
 * Uses Cloudflare KV for passcode/PAT token storage
 * Updates content files via GitHub API
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/admin/content' });

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'devsanthoshmk';
const REPO_NAME = 'spacefurnio';
const CONTENTS_PATH = 'frontend/src/assets/contents';
const BRANCH = 'main';

// ===========================================
// VERIFY PASSCODE AND GET PAT TOKEN
// ===========================================
router.post('/verify', async (request) => {
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
    if (!filename.endsWith('.json')) {
        return error(400, { message: 'Only JSON files allowed' });
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
        const content = atob(data.content.replace(/\n/g, ''));

        return json({
            success: true,
            filename,
            content: JSON.parse(content),
            sha: data.sha // Need this for updating
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

        // Filter only JSON files
        const jsonFiles = files
            .filter(f => f.type === 'file' && f.name.endsWith('.json'))
            .map(f => ({
                name: f.name,
                path: f.path,
                sha: f.sha
            }));

        return json({
            success: true,
            files: jsonFiles
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

    if (!filename.endsWith('.json')) {
        return error(400, { message: 'Only JSON files allowed' });
    }

    try {
        const filePath = `${CONTENTS_PATH}/${filename}`;

        // Encode content to base64
        const contentString = JSON.stringify(content, null, 4);
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
