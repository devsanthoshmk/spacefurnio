/**
 * ===========================================
 * AUTHENTICATION ROUTES
 * ===========================================
 * Handles Google OAuth, Magic Link, and session management
 */

import { Router, json, error } from 'itty-router';
import { createToken, hashToken, hashPassword, verifyPassword, markTokenAsExpired, getJwtExpiration, isTokenExpired } from '../middleware/auth.js';
import * as jose from 'jose';
import { sendMagicLinkEmail } from '../services/email.js';

const router = Router({ base: '/backend/api/v1/auth' });

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

    return createAuthResponse(token, user, env, { isNewUser });

  } catch (err) {
    console.error('Google OAuth error:', err);
    return error(500, { message: 'Authentication failed' });
  }
});

// ===========================================
// User Signup - tested
// ===========================================
router.post('/signup', async (request) => {
  const { env, db } = request;
  const { email, password, phone, name } = await request.json();

  if (!email || !isValidEmail(email)) {
    return error(400, { message: 'Valid email address required' });
  }

  if (!password || password.length < 6) {
    return error(400, { message: 'Password must be at least 6 characters' });
  }

  if (phone && !isValidPhoneNumber(phone)) {
    return error(400, { message: 'Invalid phone number format' });
  }

  if (name && name.length > 40) {
    return error(400, { message: 'Name must be less than 40 characters' });
  }

  try {
    // Check if user already exists
    const existingUsers = await db`
			SELECT id FROM users WHERE email = ${email.toLowerCase()}
		`;

    if (existingUsers.length > 0) {
      return error(400, { message: 'User already exists' });
    }

    // Hash password using PBKDF2
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUsers = await db`
			INSERT INTO users (email, pass, provider, email_verified, phone, name)
			VALUES (${email.toLowerCase()}, ${hashedPassword}, 'email', FALSE, ${phone || null}, ${name || null})
			RETURNING id, email, name, avatar_url, is_admin
		`;

    const user = newUsers[0];

    // Create session
    const { token, session } = await createSession(db, env, user, request);

    return createAuthResponse(token, user, env, { isNewUser: true });

  } catch (err) {
    console.error('Signup error:', err);
    return error(500, { message: 'Signup failed' });
  }
});

// ===========================================
// User Login (Email/Password) - tested
// ===========================================
router.post('/login', async (request) => {
  const { env, db } = request;
  const { email, password, phone } = await request.json();
  let isemail = false;
  let isphone = false;
  if (email && isValidEmail(email)) {
    isemail = true;
  }
  if (!isemail && phone && isValidPhoneNumber(phone)) {
    isphone = true;
  }
  if (!isemail && !isphone) {
    return error(400, { message: 'Valid email address or phone number required' });
  }
  if (!password) {
    return error(400, { message: 'Password required' });
  }

  try {
    // Find user by email or phone
    let users;
    if (isemail) {
      users = await db`
				SELECT * FROM users
				WHERE email = ${email.toLowerCase()}
				AND is_active = TRUE
			`;
    } else {
      users = await db`
				SELECT * FROM users
				WHERE phone = ${phone}
				AND is_active = TRUE
			`;
    }

    if (users.length === 0) {
      return error(401, { message: 'Invalid email/phone' });
    }
    const user = users[0];

    // Verify password
    if (!user.pass) {
      return error(401, { message: 'Invalid email or password' });
    }

    const isValidPassword = await verifyPassword(password, user.pass);

    if (!isValidPassword) {
      return error(401, { message: 'Invalid password' });
    }

    // Update last login
    await db`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    // Create session
    const { token, session } = await createSession(db, env, user, request);

    // Merge guest cart
    const guestSessionId = request.headers.get('X-Session-ID');
    if (guestSessionId) {
      await db`SELECT merge_carts(${user.id}::uuid, ${guestSessionId})`;
    }

    return createAuthResponse(token, user, env);

  } catch (err) {
    console.error('Login error:', err);
    return error(500, { message: 'Login failed' });
  }
});

// ===========================================
// MAGIC LINK - REQUEST - tested
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
// MAGIC LINK VERIFY - tested
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

    return createAuthResponse(sessionToken, user, env, { isNewUser });

  } catch (err) {
    console.error('Magic link verify error:', err);
    return error(500, { message: 'Verification failed' });
  }
});

// ===========================================
// GET CURRENT USER - tested
// ===========================================
router.get('/me', async (request) => {
  const { db, env } = request;

  // Extract token from header or cookie
  const token = extractToken(request);
  if (!token) {
    return error(401, { message: 'Authentication required' });
  }

  // Verify JWT using JWT_SECRET
  let payload;
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const result = await jose.jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER || 'spacefurnio-api',
      audience: env.JWT_AUDIENCE || 'spacefurnio-users'
    });
    payload = result.payload;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return error(401, { message: 'Invalid or expired token' });
  }

  // Check if token has been revoked (stored in EXPIRED_SESSIONS KV)
  const tokenHash = await hashToken(token);
  const isExpired = await isTokenExpired(tokenHash, env);

  if (isExpired) {
    return error(401, { message: 'Session has been revoked' });
  }

  // Get user from users table using the sub claim from JWT
  const userId = payload.sub;
  const users = await db`
    SELECT id, email, name, avatar_url, phone, is_admin, email_verified, created_at
    FROM users
    WHERE id = ${userId}
      AND is_active = TRUE
  `;

  if (users.length === 0) {
    return error(401, { message: 'User not found or inactive' });
  }

  const user = users[0];

  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    phone: user.phone,
    isAdmin: user.is_admin,
    emailVerified: user.email_verified,
    createdAt: user.created_at
  });
});

// ===========================================
// UPDATE CURRENT USER - tested
// ===========================================
router.patch('/me', async (request) => {
  const { db, env } = request;

  // Extract token from header or cookie
  const token = extractToken(request);
  if (!token) {
    return error(401, { message: 'Authentication required' });
  }

  // Verify JWT using JWT_SECRET
  let payload;
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const result = await jose.jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER || 'spacefurnio-api',
      audience: env.JWT_AUDIENCE || 'spacefurnio-users'
    });
    payload = result.payload;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return error(401, { message: 'Invalid or expired token' });
  }

  // Check if token has been revoked (stored in EXPIRED_SESSIONS KV)
  const tokenHash = await hashToken(token);
  const isExpired = await isTokenExpired(tokenHash, env);

  if (isExpired) {
    return error(401, { message: 'Session has been revoked' });
  }

  // Get user ID from JWT payload
  const userId = payload.sub;

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { name, phone, email, avatar_url } = body;

  // Validate inputs
  if (name !== undefined && name !== null) {
    if (name.length > 40) {
      return error(400, { message: 'Name must be less than 40 characters' });
    }
  }

  if (phone !== undefined && phone !== null) {
    if (!isValidPhoneNumber(phone)) {
      return error(400, { message: 'Invalid phone number format' });
    }
  }

  if (email !== undefined && email !== null) {
    if (!isValidEmail(email)) {
      return error(400, { message: 'Valid email address required' });
    }
  }

  if (!name && !phone && !email && !avatar_url) {
    return error(400, { message: 'No valid fields to update' });
  }

  // Build update object for Neon's tagged template
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (avatar_url) updateData.avatar_url = avatar_url;
  if (email) {
    updateData.email = email.toLowerCase();
    updateData.email_verified = false;
    updateData.provider = 'email';
  }

  // Use individual conditional updates with proper parameterization
  const users = await db`
    UPDATE users
    SET
      name = COALESCE(${updateData.name ?? null}, name),
      phone = COALESCE(${updateData.phone ?? null}, phone),
      avatar_url = COALESCE(${updateData.avatar_url ?? null}, avatar_url),
      email = COALESCE(${updateData.email ?? null}, email),
      email_verified = CASE WHEN ${email ? true : false} THEN FALSE ELSE email_verified END,
      provider = CASE WHEN ${email ? true : false} THEN 'email' ELSE provider END,
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
// LOGOUT - tested
// ===========================================
router.post('/logout', async (request) => {
  const { env } = request;

  const token = extractToken(request);
  if (!token) {
    return json({ success: true }); // Already logged out
  }

  const tokenHash = await hashToken(token);

  // Get JWT expiration from the token to set proper KV TTL
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER || 'spacefurnio-api',
      audience: env.JWT_AUDIENCE || 'spacefurnio-users'
    });

    // Mark token as expired in KV with TTL matching JWT expiration
    const jwtExp = getJwtExpiration(payload);
    if (jwtExp) {
      await markTokenAsExpired(tokenHash, jwtExp, env);
    }
  } catch (err) {
    // Token is already invalid/expired, no need to revoke
    console.warn('Could not get JWT expiration for logout:', err.message);
  }

  // Clear cookie
  const cookieHeader = clearAuthCookie();

  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader
    }
  });
});

// ===========================================
// LOGOUT ALL SESSIONS (deprecated)
// Note: With stateless JWT, we can only revoke the current token.
// True "logout all" would require server-side session tracking.
// This endpoint now functions the same as /logout for the current token.
// ===========================================
router.post('/logout-all', async (request) => {
  const { env } = request;

  const token = extractToken(request);
  if (!token) {
    return error(401, { message: 'Authentication required' });
  }

  // Verify JWT using JWT_SECRET
  let payload;
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const result = await jose.jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER || 'spacefurnio-api',
      audience: env.JWT_AUDIENCE || 'spacefurnio-users'
    });
    payload = result.payload;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return error(401, { message: 'Invalid or expired token' });
  }

  // Mark current token as expired in KV
  const tokenHash = await hashToken(token);
  const jwtExp = getJwtExpiration(payload);
  if (jwtExp) {
    await markTokenAsExpired(tokenHash, jwtExp, env);
  }

  // Clear cookie
  const cookieHeader = clearAuthCookie();

  return new Response(JSON.stringify({
    success: true,
    message: 'Current session logged out. Note: With stateless JWT authentication, other sessions will remain valid until their tokens expire.'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader
    }
  });
});

// ===========================================
// Change Password
// ===========================================
router.patch('/change-password', async (request) => {
	const { db, env } = request;

	// Extract token from header or cookie
	const token = extractToken(request);
	if (!token) {
		return error(401, { message: 'Authentication required' });
	}

	// Verify JWT using JWT_SECRET
	let payload;
	try {
		const secret = new TextEncoder().encode(env.JWT_SECRET);
		const result = await jose.jwtVerify(token, secret, {
			issuer: env.JWT_ISSUER || 'spacefurnio-api',
			audience: env.JWT_AUDIENCE || 'spacefurnio-users'
		});
		payload = result.payload;
	} catch (err) {
		console.error('Token verification failed:', err.message);
		return error(401, { message: 'Invalid or expired token' });
	}

	// Check if token has been revoked (stored in EXPIRED_SESSIONS KV)
	const tokenHash = await hashToken(token);
	const isExpired = await isTokenExpired(tokenHash, env);

	if (isExpired) {
		return error(401, { message: 'Session has been revoked' });
	}

	// Get user ID from JWT payload
	const userId = payload.sub;

	let body;
	try {
		body = await request.json();
	} catch {
		return error(400, { message: 'Invalid request body' });
	}

	const { new_password } = body;

	// Validate inputs
	if (new_password !== undefined && new_password !== null) {
		if (new_password.length < 8) {
			return error(400, { message: 'Password must be at least 8 characters' });
		}
	}

	try {
		const users = await db`
			UPDATE users
			SET
				pass = ${await hashPassword(body.new_password)},
				updated_at = NOW()
			WHERE id = ${userId}
			RETURNING id, email, name, avatar_url, phone, is_admin, email_verified
		`;
	} catch (err) {
		console.error('Database error:', err);
		return error(500, { message: 'Failed to change password' });
	}

	return new Response(JSON.stringify({
		success: true,
		message: 'Password changed successfully'
	}), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
});



// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Create a new session for user (stateless - JWT only)
 * No database session storage - relies on JWT expiration and KV revocation
 */
async function createSession(db, env, user, request) {
  const expiryHours = parseInt(env.JWT_EXPIRY_HOURS || '168');

  // Create JWT token with user ID and admin status
  const token = await createToken({
    sub: user.id,
    isAdmin: user.is_admin
  }, env);

  // Create httpOnly cookie
  const cookieOptions = [
    `sf_token=${token}`,
    `Max-Age=${expiryHours * 3600}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];

  // Add Secure flag in production
  if (env.ENVIRONMENT === 'production') {
    cookieOptions.push('Secure');
  }

  const cookieHeader = cookieOptions.join('; ');

  return { token, cookieHeader };
}

/**
 * Set authentication cookie
 */
function setAuthCookie(token, expiryHours, env) {
  const maxAge = expiryHours * 60 * 60; // Convert to seconds

  const cookieOptions = [
    `sf_token=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];

  // Add Secure flag in production
  if (env?.ENVIRONMENT === 'production') {
    cookieOptions.push('Secure');
  }

  return cookieOptions.join('; ');
}

/**
 * Clear authentication cookie
 */
function clearAuthCookie() {
  return 'sf_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/';
}

/**
 * Create authentication response with cookie and user data
 * @param {string} token - JWT token
 * @param {Object} user - User object
 * @param {Object} env - Environment bindings
 * @param {Object} options - Additional options (isNewUser, etc.)
 * @returns {Response} Response with cookie set
 */
function createAuthResponse(token, user, env, options = {}) {
  const expiryHours = parseInt(env.JWT_EXPIRY_HOURS || '168');
  const cookieHeader = setAuthCookie(token, expiryHours, env);

  const responseData = {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      isAdmin: user.is_admin,
      email_verified: user.email_verified
    },
    token
  };

  // Add optional fields
  if (options.isNewUser !== undefined) {
    responseData.isNewUser = options.isNewUser;
  }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader
    }
  });
}

/**
 * Extract auth token from Authorization header or sf_token cookie
 */
function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    // Only use header token if it looks valid (not "undefined", "null", or empty)
    if (token && token !== 'undefined' && token !== 'null') {
      return token;
    }
    console.warn('Ignoring invalid Authorization header:', authHeader);
  }

  // Fallback: extract from sf_token cookie
  const cookies = request.headers.get('Cookie');
  console.log('Extracting token from cookies:', cookies);
  if (cookies) {
    const match = cookies.match(/(?:^|;\s*)sf_token=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * validate phone number format (E.164) - optional, can be enhanced to support more formats
 */
function isValidPhoneNumber(phone) {
  const PHONE_CHARS_REGEX = /^[0-9+\-().\s]+$/;
  return PHONE_CHARS_REGEX.test(phone);
}

export default router;
