/**
 * ===========================================
 * RATE LIMITING MIDDLEWARE
 * ===========================================
 * Uses Cloudflare KV for distributed rate limiting
 */

import { error } from 'itty-router';

/**
 * Rate limit configuration per endpoint type
 */
const RATE_LIMITS = {
  default: { requests: 100, window: 60 },       // 100 req/min
  auth: { requests: 10, window: 60 },           // 10 req/min for auth
  login: { requests: 5, window: 300 },          // 5 req/5min for login attempts
  magicLink: { requests: 3, window: 300 },      // 3 req/5min for magic links
  checkout: { requests: 10, window: 60 },       // 10 req/min for checkout
  admin: { requests: 60, window: 60 },          // 60 req/min for admin
  webhook: { requests: 100, window: 60 }        // 100 req/min for webhooks
};

/**
 * Get client identifier for rate limiting
 * @param {Request} request - Incoming request
 * @returns {string} Client identifier
 */
function getClientId(request) {
  // Use CF-Connecting-IP if available (Cloudflare)
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // Fall back to X-Forwarded-For
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim();

  // Last resort - use a header or generate identifier
  return request.headers.get('X-Real-IP') || 'unknown';
}

/**
 * Check and update rate limit
 * @param {Object} kv - KV namespace binding
 * @param {string} key - Rate limit key
 * @param {Object} limit - Rate limit config
 * @returns {Object} Rate limit status
 */
async function checkRateLimit(kv, key, limit) {
  const now = Date.now();
  const windowStart = now - (limit.window * 1000);

  // Get current rate limit data
  const data = await kv.get(key, { type: 'json' }) || { requests: [], blocked_until: 0 };

  // Check if currently blocked
  if (data.blocked_until > now) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil((data.blocked_until - now) / 1000),
      blocked: true
    };
  }

  // Filter requests within window
  const recentRequests = data.requests.filter(ts => ts > windowStart);

  // Check if limit exceeded
  if (recentRequests.length >= limit.requests) {
    // Block for the window duration
    const blockedData = {
      requests: recentRequests,
      blocked_until: now + (limit.window * 1000)
    };

    await kv.put(key, JSON.stringify(blockedData), {
      expirationTtl: limit.window * 2
    });

    return {
      allowed: false,
      remaining: 0,
      reset: limit.window,
      blocked: true
    };
  }

  // Add current request
  recentRequests.push(now);

  // Store updated data
  await kv.put(key, JSON.stringify({ requests: recentRequests, blocked_until: 0 }), {
    expirationTtl: limit.window * 2
  });

  return {
    allowed: true,
    remaining: limit.requests - recentRequests.length,
    reset: Math.ceil((windowStart + (limit.window * 1000) - now) / 1000),
    blocked: false
  };
}

/**
 * Rate limiting middleware factory
 * @param {string} limitType - Type of rate limit to apply
 */
export function withRateLimit(limitType = 'default') {
  const limit = RATE_LIMITS[limitType] || RATE_LIMITS.default;

  return async (request) => {
    const { env } = request;

    // Skip rate limiting if KV not configured
    if (!env.RATE_LIMIT) {
      console.warn('Rate limiting KV not configured');
      return;
    }

    const clientId = getClientId(request);
    const path = new URL(request.url).pathname;
    const key = `rate:${limitType}:${clientId}:${path}`;

    const status = await checkRateLimit(env.RATE_LIMIT, key, limit);

    // Add rate limit headers to request for response
    request.rateLimitHeaders = {
      'X-RateLimit-Limit': limit.requests.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.reset.toString()
    };

    if (!status.allowed) {
      return error(429, {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${status.reset} seconds.`,
        retryAfter: status.reset
      });
    }
  };
}

/**
 * Apply rate limit headers to response
 * @param {Response} response - Response object
 * @param {Request} request - Request object
 */
export function applyRateLimitHeaders(response, request) {
  if (request.rateLimitHeaders) {
    Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export default { withRateLimit, applyRateLimitHeaders };
