/**
 * ===========================================
 * AUTHENTICATION MIDDLEWARE
 * ===========================================
 * JWT verification and user context handling
 */

import { error } from 'itty-router';
import * as jose from 'jose';

/**
 * Verify JWT token and extract payload
 * @param {string} token - JWT token
 * @param {Object} env - Environment bindings
 * @returns {Object|null} Token payload or null
 */
async function verifyToken(token, env) {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER || 'spacefurnio-api',
      audience: env.JWT_AUDIENCE || 'spacefurnio-users'
    });

    return payload;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
}

/**
 * Create a new JWT token
 * @param {Object} payload - Token payload
 * @param {Object} env - Environment bindings
 * @returns {string} JWT token
 */
export async function createToken(payload, env) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const expiryHours = parseInt(env.JWT_EXPIRY_HOURS || '168'); // 7 days default

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER || 'spacefurnio-api')
    .setAudience(env.JWT_AUDIENCE || 'spacefurnio-users')
    .setExpirationTime(`${expiryHours}h`)
    .sign(secret);

  return token;
}

/**
 * Hash a token for storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Extract token from request
 * @param {Request} request - Incoming request
 * @returns {string|null} Token or null
 */
function extractToken(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try cookie
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/sf_token=([^;]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * Authentication middleware - requires valid token
 * @param {Request} request - Incoming request
 */
export async function withAuth(request) {
  const { env, db } = request;
  const token = extractToken(request);

  if (!token) {
    return error(401, {
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  const payload = await verifyToken(token, env);

  if (!payload) {
    return error(401, {
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  // Verify session exists in database
  const tokenHash = await hashToken(token);
  const sessions = await db`
    SELECT s.*, u.email, u.name, u.avatar_url, u.is_admin, u.is_active
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
  `;

  if (sessions.length === 0) {
    return error(401, {
      error: 'Unauthorized',
      message: 'Session expired or invalid'
    });
  }

  const session = sessions[0];

  // Update last_used_at
  await db`
    UPDATE sessions
    SET last_used_at = NOW()
    WHERE id = ${session.id}
  `;

  // Attach user to request
  request.user = {
    id: session.user_id,
    email: session.email,
    name: session.name,
    avatarUrl: session.avatar_url,
    isAdmin: session.is_admin
  };

  request.sessionId = session.id;

  // Create database client with user context
  request.dbWithContext = request.createDbWithContext(session.user_id, null);
}

/**
 * Optional authentication middleware - populates user if token valid
 * @param {Request} request - Incoming request
 */
export async function withOptionalAuth(request) {
  const { env, db } = request;
  const token = extractToken(request);

  // Get session ID from header for guest carts
  const guestSessionId = request.headers.get('X-Session-ID');

  if (!token) {
    // Set guest session context if available
    if (guestSessionId) {
      request.guestSessionId = guestSessionId;
      request.dbWithContext = request.createDbWithContext(null, guestSessionId);
    }
    return; // Continue without auth
  }

  const payload = await verifyToken(token, env);

  if (!payload) {
    // Invalid token - continue as guest
    if (guestSessionId) {
      request.guestSessionId = guestSessionId;
      request.dbWithContext = request.createDbWithContext(null, guestSessionId);
    }
    return;
  }

  // Verify session
  const tokenHash = await hashToken(token);
  const sessions = await db`
    SELECT s.*, u.email, u.name, u.avatar_url, u.is_admin, u.is_active
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
  `;

  if (sessions.length > 0) {
    const session = sessions[0];

    request.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      avatarUrl: session.avatar_url,
      isAdmin: session.is_admin
    };

    request.sessionId = session.id;
    request.dbWithContext = request.createDbWithContext(session.user_id, null);

    // Update last_used_at
    await db`
      UPDATE sessions
      SET last_used_at = NOW()
      WHERE id = ${session.id}
    `;
  } else if (guestSessionId) {
    request.guestSessionId = guestSessionId;
    request.dbWithContext = request.createDbWithContext(null, guestSessionId);
  }
}

/**
 * Admin authentication middleware
 * @param {Request} request - Incoming request
 */
export async function withAdminAuth(request) {
  // First run regular auth
  const authResult = await withAuth(request);
  if (authResult) return authResult; // Return error if auth failed

  // Check if user is admin
  if (!request.user?.isAdmin) {
    return error(403, {
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  // Verify admin security code
  const securityCode = request.headers.get('X-Admin-Code');
  if (!securityCode) {
    return error(403, {
      error: 'Forbidden',
      message: 'Admin security code required'
    });
  }

  // Verify security code from database
  const { db } = request;
  const adminAccess = await db`
    SELECT * FROM admin_access
    WHERE user_id = ${request.user.id}
      AND is_active = TRUE
  `;

  if (adminAccess.length === 0) {
    return error(403, {
      error: 'Forbidden',
      message: 'Admin access not configured'
    });
  }

  // Hash and compare security code
  const codeHash = await hashToken(securityCode);
  if (codeHash !== adminAccess[0].security_code_hash) {
    return error(403, {
      error: 'Forbidden',
      message: 'Invalid security code'
    });
  }

  // Update last verified
  await db`
    UPDATE admin_access
    SET last_verified_at = NOW()
    WHERE user_id = ${request.user.id}
  `;

  request.isAdminVerified = true;
}

export default {
  withAuth,
  withOptionalAuth,
  withAdminAuth,
  createToken,
  hashToken
};
