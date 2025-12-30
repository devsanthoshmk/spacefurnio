/**
 * ===========================================
 * AUTHENTICATION ROUTES
 * ===========================================
 * Handles Google OAuth, Magic Link, and session management
 */

import { Router, json, error } from 'itty-router';
import { createToken, hashToken } from '../middleware/auth.js';
import { sendMagicLinkEmail } from '../services/email.js';

const router = Router({ base: '/api/v1/auth' });

// ===========================================
// GOOGLE OAUTH - INITIATE
// ===========================================
router.get('/google', async (request) => {
  const { env } = request;

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.FRONTEND_URL}/auth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: crypto.randomUUID() // CSRF protection
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return json({ url: authUrl });
});

// ===========================================
// GOOGLE OAUTH - CALLBACK
// ===========================================
router.post('/google/callback', async (request) => {
  const { env, db } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { code, redirectUri } = body;

  if (!code) {
    return error(400, { message: 'Authorization code required' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || `${env.FRONTEND_URL}/auth/callback/google`
      })
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json();
      console.error('Google token exchange failed:', err);
      return error(400, { message: 'Failed to exchange authorization code' });
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userResponse.ok) {
      return error(400, { message: 'Failed to get user info from Google' });
    }

    const googleUser = await userResponse.json();

    // Find or create user
    let users = await db`
      SELECT * FROM users WHERE email = ${googleUser.email}
    `;

    let user;
    let isNewUser = false;

    if (users.length === 0) {
      // Create new user
      const newUsers = await db`
        INSERT INTO users (email, name, avatar_url, provider, provider_id, email_verified)
        VALUES (${googleUser.email}, ${googleUser.name}, ${googleUser.picture}, 'google', ${googleUser.id}, TRUE)
        RETURNING *
      `;
      user = newUsers[0];
      isNewUser = true;
    } else {
      user = users[0];

      // Update user info if needed
      if (user.provider !== 'google') {
        await db`
          UPDATE users
          SET provider = 'google', provider_id = ${googleUser.id},
              avatar_url = COALESCE(avatar_url, ${googleUser.picture}),
              email_verified = TRUE
          WHERE id = ${user.id}
        `;
      }
    }

    // Create session
    const { token, session } = await createSession(db, env, user, request);

    // Get guest session ID for cart merging
    const guestSessionId = request.headers.get('X-Session-ID');
    if (guestSessionId) {
      // Merge guest cart to user cart
      await db`SELECT merge_carts(${user.id}::uuid, ${guestSessionId})`;
    }

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        isAdmin: user.is_admin
      },
      token,
      isNewUser
    });

  } catch (err) {
    console.error('Google OAuth error:', err);
    return error(500, { message: 'Authentication failed' });
  }
});

// ===========================================
// MAGIC LINK - REQUEST
// ===========================================
router.post('/magic-link', async (request) => {
  const { env, db } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { email } = body;

  if (!email || !isValidEmail(email)) {
    return error(400, { message: 'Valid email address required' });
  }

  try {
    // Generate token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiryMins = parseInt(env.MAGIC_LINK_EXPIRY_MINS || '15');
    const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);

    // Get client info
    const ipAddress = request.headers.get('CF-Connecting-IP') ||
                      request.headers.get('X-Forwarded-For')?.split(',')[0] || null;
    const userAgent = request.headers.get('User-Agent');

    // Store magic link
    await db`
      INSERT INTO magic_links (email, token, expires_at, ip_address, user_agent)
      VALUES (${email.toLowerCase()}, ${token}, ${expiresAt}, ${ipAddress}::inet, ${userAgent})
    `;

    // Send email
    const magicLinkUrl = `${env.FRONTEND_URL}/auth/verify?token=${token}`;
    await sendMagicLinkEmail(env, email, magicLinkUrl);

    return json({
      success: true,
      message: 'Magic link sent to your email'
    });

  } catch (err) {
    console.error('Magic link error:', err);
    return error(500, { message: 'Failed to send magic link' });
  }
});

// ===========================================
// MAGIC LINK - VERIFY
// ===========================================
router.post('/magic-link/verify', async (request) => {
  const { env, db } = request;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { token } = body;

  if (!token) {
    return error(400, { message: 'Token required' });
  }

  try {
    // Find and validate magic link
    const links = await db`
      SELECT * FROM magic_links
      WHERE token = ${token}
        AND expires_at > NOW()
        AND used_at IS NULL
    `;

    if (links.length === 0) {
      return error(400, { message: 'Invalid or expired magic link' });
    }

    const magicLink = links[0];

    // Mark as used
    await db`
      UPDATE magic_links
      SET used_at = NOW()
      WHERE id = ${magicLink.id}
    `;

    // Find or create user
    let users = await db`
      SELECT * FROM users WHERE email = ${magicLink.email}
    `;

    let user;
    let isNewUser = false;

    if (users.length === 0) {
      // Create new user
      const newUsers = await db`
        INSERT INTO users (email, provider, email_verified)
        VALUES (${magicLink.email}, 'email', TRUE)
        RETURNING *
      `;
      user = newUsers[0];
      isNewUser = true;
    } else {
      user = users[0];

      // Mark email as verified
      if (!user.email_verified) {
        await db`
          UPDATE users SET email_verified = TRUE WHERE id = ${user.id}
        `;
      }
    }

    // Update last login
    await db`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    // Create session
    const { token: sessionToken, session } = await createSession(db, env, user, request);

    // Merge guest cart
    const guestSessionId = request.headers.get('X-Session-ID');
    if (guestSessionId) {
      await db`SELECT merge_carts(${user.id}::uuid, ${guestSessionId})`;
    }

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        isAdmin: user.is_admin
      },
      token: sessionToken,
      isNewUser
    });

  } catch (err) {
    console.error('Magic link verify error:', err);
    return error(500, { message: 'Verification failed' });
  }
});

// ===========================================
// GET CURRENT USER
// ===========================================
router.get('/me', async (request) => {
  const { db } = request;

  // Extract and verify token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return error(401, { message: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  const sessions = await db`
    SELECT s.*, u.id as user_id, u.email, u.name, u.avatar_url, u.is_admin,
           u.phone, u.email_verified, u.created_at as user_created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
  `;

  if (sessions.length === 0) {
    return error(401, { message: 'Invalid or expired session' });
  }

  const session = sessions[0];

  return json({
    id: session.user_id,
    email: session.email,
    name: session.name,
    avatarUrl: session.avatar_url,
    phone: session.phone,
    isAdmin: session.is_admin,
    emailVerified: session.email_verified,
    createdAt: session.user_created_at
  });
});

// ===========================================
// UPDATE CURRENT USER
// ===========================================
router.patch('/me', async (request) => {
  const { db } = request;

  // Extract and verify token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return error(401, { message: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  const sessions = await db`
    SELECT user_id FROM sessions
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
  `;

  if (sessions.length === 0) {
    return error(401, { message: 'Invalid or expired session' });
  }

  const userId = sessions[0].user_id;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { name, phone } = body;

  // Update user
  const users = await db`
    UPDATE users
    SET
      name = COALESCE(${name}, name),
      phone = COALESCE(${phone}, phone),
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, name, avatar_url, phone, is_admin, email_verified
  `;

  const user = users[0];

  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    phone: user.phone,
    isAdmin: user.is_admin,
    emailVerified: user.email_verified
  });
});

// ===========================================
// LOGOUT
// ===========================================
router.post('/logout', async (request) => {
  const { db } = request;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ success: true }); // Already logged out
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  // Delete session
  await db`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;

  return json({ success: true, message: 'Logged out successfully' });
});

// ===========================================
// LOGOUT ALL SESSIONS
// ===========================================
router.post('/logout-all', async (request) => {
  const { db } = request;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return error(401, { message: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  // Get user ID
  const sessions = await db`
    SELECT user_id FROM sessions WHERE token_hash = ${tokenHash}
  `;

  if (sessions.length === 0) {
    return error(401, { message: 'Invalid session' });
  }

  // Delete all sessions for this user
  await db`DELETE FROM sessions WHERE user_id = ${sessions[0].user_id}`;

  return json({ success: true, message: 'All sessions logged out' });
});

// ===========================================
// GET ACTIVE SESSIONS
// ===========================================
router.get('/sessions', async (request) => {
  const { db } = request;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return error(401, { message: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  // Get user ID
  const currentSession = await db`
    SELECT user_id, id as current_session_id FROM sessions
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
  `;

  if (currentSession.length === 0) {
    return error(401, { message: 'Invalid session' });
  }

  // Get all active sessions
  const sessions = await db`
    SELECT id, created_at, last_used_at, ip_address, user_agent, expires_at
    FROM sessions
    WHERE user_id = ${currentSession[0].user_id}
      AND expires_at > NOW()
    ORDER BY last_used_at DESC
  `;

  return json({
    sessions: sessions.map(s => ({
      id: s.id,
      createdAt: s.created_at,
      lastUsedAt: s.last_used_at,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      expiresAt: s.expires_at,
      isCurrent: s.id === currentSession[0].current_session_id
    }))
  });
});

// ===========================================
// REVOKE SPECIFIC SESSION
// ===========================================
router.delete('/sessions/:sessionId', async (request) => {
  const { db, params } = request;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return error(401, { message: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  // Get user ID
  const currentSession = await db`
    SELECT user_id FROM sessions
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
  `;

  if (currentSession.length === 0) {
    return error(401, { message: 'Invalid session' });
  }

  // Delete specific session (only if belongs to same user)
  await db`
    DELETE FROM sessions
    WHERE id = ${params.sessionId}::uuid
      AND user_id = ${currentSession[0].user_id}
  `;

  return json({ success: true });
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Create a new session for user
 */
async function createSession(db, env, user, request) {
  const expiryHours = parseInt(env.JWT_EXPIRY_HOURS || '168');
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  // Create JWT token
  const token = await createToken({
    sub: user.id,
    email: user.email,
    isAdmin: user.is_admin
  }, env);

  const tokenHash = await hashToken(token);

  // Get client info
  const ipAddress = request.headers.get('CF-Connecting-IP') ||
                    request.headers.get('X-Forwarded-For')?.split(',')[0] || null;
  const userAgent = request.headers.get('User-Agent');

  // Store session
  const sessions = await db`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (${user.id}, ${tokenHash}, ${expiresAt}, ${ipAddress}::inet, ${userAgent})
    RETURNING *
  `;

  return { token, session: sessions[0] };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default router;
