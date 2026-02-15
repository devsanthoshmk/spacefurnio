/**
 * ===========================================
 * AUTHENTICATION MIDDLEWARE
 * ===========================================
 * JWT verification and user context handling
 */

import { error } from 'itty-router';
import * as jose from 'jose';

// ---- RSA Key Caching ----
let _cachedSigningKey = null;
let _cachedVerificationKey = null;
let _cachedJWKS = null;

/**
 * Parse the RSA private JWK from the environment variable.
 * @param {Object} env - Environment bindings
 * @returns {Object} Parsed JWK object
 */
function parsePrivateJWK(env) {
  if (!env.JWT_PRIVATE_JWK) {
    throw new Error('JWT_PRIVATE_JWK is not configured in environment');
  }
  return typeof env.JWT_PRIVATE_JWK === 'string'
    ? JSON.parse(env.JWT_PRIVATE_JWK)
    : env.JWT_PRIVATE_JWK;
}

/**
 * Get the RSA private key (CryptoKey) for signing JWTs.
 * Caches the key after first import for performance.
 * @param {Object} env - Environment bindings
 * @returns {Promise<CryptoKey>} Private key for signing
 */
export async function getSigningKey(env) {
  if (_cachedSigningKey) return _cachedSigningKey;
  const jwk = parsePrivateJWK(env);
  _cachedSigningKey = await jose.importJWK(jwk, 'RS256');
  return _cachedSigningKey;
}

/**
 * Get the RSA public key (CryptoKey) for verifying JWTs.
 * Extracts only the public components (kty, n, e) from the private JWK.
 * Caches the key after first import for performance.
 * @param {Object} env - Environment bindings
 * @returns {Promise<CryptoKey>} Public key for verification
 */
export async function getVerificationKey(env) {
  if (_cachedVerificationKey) return _cachedVerificationKey;

  // If JWKS_URL is configured, use it via jose.createRemoteJWKSet
  if (env.JWKS_URL && env.JWKS_URL !== '') {
    if (!_cachedJWKS) {
      _cachedJWKS = jose.createRemoteJWKSet(new URL(env.JWKS_URL));
    }
    return _cachedJWKS;
  }

  // Otherwise, derive the public key from the private JWK
  const jwk = parsePrivateJWK(env);
  const publicJWK = { kty: jwk.kty, n: jwk.n, e: jwk.e, kid: jwk.kid };
  _cachedVerificationKey = await jose.importJWK(publicJWK, 'RS256');
  return _cachedVerificationKey;
}

/**
 * Verify JWT token and extract payload.
 * Uses RSA public key derived from JWT_PRIVATE_JWK (or JWKS_URL) for verification.
 * @param {string} token - JWT token
 * @param {Object} env - Environment bindings
 * @returns {Object|null} Token payload (including exp claim) or null
 */
async function verifyToken(token, env) {
  try {
    const key = await getVerificationKey(env);

    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ['RS256'],
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
 * Check if a token has been marked as expired/revoked in EXPIRED_SESSIONS KV
 * @param {string} tokenHash - Hashed token
 * @param {Object} env - Environment bindings
 * @returns {Promise<boolean>} True if token is expired/revoked
 */
export async function isTokenExpired(tokenHash, env) {
  try {
    if (!env.EXPIRED_SESSIONS) {
      console.warn('EXPIRED_SESSIONS KV not configured, skipping expired check');
      return false;
    }

    const expiredEntry = await env.EXPIRED_SESSIONS.get(`session:${tokenHash}`);
    return expiredEntry !== null;
  } catch (err) {
    console.error('Error checking expired session:', err.message);
    return false;
  }
}

/**
 * Mark a token as expired/revoked in EXPIRED_SESSIONS KV
 * The TTL is set to the remaining time until JWT expiration
 * @param {string} tokenHash - Hashed token
 * @param {number} jwtExpTimestamp - JWT expiration timestamp (Unix seconds)
 * @param {Object} env - Environment bindings
 * @returns {Promise<boolean>} True if successfully marked
 */
export async function markTokenAsExpired(tokenHash, jwtExpTimestamp, env) {
  try {
    if (!env.EXPIRED_SESSIONS) {
      console.warn('EXPIRED_SESSIONS KV not configured, cannot mark token as expired');
      return false;
    }

    // Calculate TTL in seconds (remaining time until JWT natural expiration)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ttlSeconds = Math.max(1, jwtExpTimestamp - nowSeconds);

    // Store in KV with expiration matching JWT expiry
    await env.EXPIRED_SESSIONS.put(
      `session:${tokenHash}`,
      JSON.stringify({ revokedAt: new Date().toISOString() }),
      { expirationTtl: ttlSeconds }
    );

    return true;
  } catch (err) {
    console.error('Error marking token as expired:', err.message);
    return false;
  }
}

/**
 * Get JWT expiration timestamp from a verified payload
 * @param {Object} payload - JWT payload
 * @returns {number|null} Expiration timestamp in seconds, or null
 */
export function getJwtExpiration(payload) {
  return payload?.exp || null;
}

/**
 * Create a new JWT token using RSA (RS256) asymmetric signing.
 * @param {Object} payload - Token payload
 * @param {Object} env - Environment bindings
 * @returns {string} JWT token
 */
export async function createToken(payload, env) {
  const privateKey = await getSigningKey(env);
  const jwk = parsePrivateJWK(env); // Get JWK to access 'kid'
  const expiryHours = parseInt(env.JWT_EXPIRY_HOURS || '168'); // 7 days default

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER || 'spacefurnio-api')
    .setAudience(env.JWT_AUDIENCE || 'spacefurnio-users')
    .setExpirationTime(`${expiryHours}h`)
    .sign(privateKey);

  return token;
}

/**
 * Hash a token for storage (using SHA-256 - for tokens only, NOT passwords)
 * @param {string} token - Token to hash
 * @returns {Promise<string>} Hashed token
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
 * Hash a password using PBKDF2 (proper password hashing with salt)
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Hashed password with salt (format: salt:hash)
 */
export async function hashPassword(password) {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Import password as key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive hash using PBKDF2
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations
      hash: 'SHA-256'
    },
    key,
    256 // 256 bits = 32 bytes
  );

  // Convert to hex and combine with salt
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored hash (format: salt:hash)
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');

  // Convert salt from hex
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Import password as key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive hash with same salt
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  const newHashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  return newHashHex === hashHex;
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
 * Validates JWT using RSA public key and checks EXPIRED_SESSIONS KV for revoked tokens
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

  // Verify JWT signature and claims using RSA public key
  const payload = await verifyToken(token, env);

  if (!payload) {
    return error(401, {
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  // Check if token has been explicitly revoked (stored in EXPIRED_SESSIONS KV)
  const tokenHash = await hashToken(token);
  const isExpired = await isTokenExpired(tokenHash, env);

  if (isExpired) {
    return error(401, {
      error: 'Unauthorized',
      message: 'Session has been revoked'
    });
  }

  // Get user from users table using sub claim from JWT
  const userId = payload.sub;
  const users = await db`
    SELECT id, email, name, avatar_url, is_admin, is_active
    FROM users
    WHERE id = ${userId}
      AND is_active = TRUE
  `;

  if (users.length === 0) {
    return error(401, {
      error: 'Unauthorized',
      message: 'User not found or inactive'
    });
  }

  const user = users[0];

  // Attach user to request
  request.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    isAdmin: user.is_admin
  };

  request.jwtPayload = payload; // Store payload for potential use (e.g., getting exp for logout)

  // Create database client with user context
  request.dbWithContext = request.createDbWithContext(user.id, null);
}

/**
 * Optional authentication middleware - populates user if token valid
 * Validates JWT using RSA public key and checks EXPIRED_SESSIONS KV for revoked tokens
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

  // Verify JWT signature and claims using RSA public key
  const payload = await verifyToken(token, env);

  if (!payload) {
    // Invalid token - continue as guest
    if (guestSessionId) {
      request.guestSessionId = guestSessionId;
      request.dbWithContext = request.createDbWithContext(null, guestSessionId);
    }
    return;
  }

  // Check if token has been explicitly revoked (stored in EXPIRED_SESSIONS KV)
  const tokenHash = await hashToken(token);
  const isExpired = await isTokenExpired(tokenHash, env);

  if (isExpired) {
    // Token was revoked - continue as guest
    if (guestSessionId) {
      request.guestSessionId = guestSessionId;
      request.dbWithContext = request.createDbWithContext(null, guestSessionId);
    }
    return;
  }

  // Get user from users table using sub claim from JWT
  const userId = payload.sub;
  const users = await db`
    SELECT id, email, name, avatar_url, is_admin, is_active
    FROM users
    WHERE id = ${userId}
      AND is_active = TRUE
  `;

  if (users.length > 0) {
    const user = users[0];

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      isAdmin: user.is_admin
    };

    request.jwtPayload = payload; // Store payload for potential use
    request.dbWithContext = request.createDbWithContext(user.id, null);
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

export { verifyToken };

export default {
  withAuth,
  withOptionalAuth,
  withAdminAuth,
  createToken,
  verifyToken,
  getSigningKey,
  getVerificationKey,
  hashToken,
  hashPassword,
  verifyPassword,
  isTokenExpired,
  markTokenAsExpired,
  getJwtExpiration
};
