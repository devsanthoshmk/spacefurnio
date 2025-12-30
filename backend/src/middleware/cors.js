/**
 * ===========================================
 * CORS MIDDLEWARE
 * ===========================================
 * Handles Cross-Origin Resource Sharing
 */

import { json } from 'itty-router';

/**
 * Allowed origins based on environment
 */
const getAllowedOrigins = (env) => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    env.FRONTEND_URL
  ].filter(Boolean);

  // Add production origins
  if (env.ENVIRONMENT === 'production') {
    origins.push(
      'https://spacefurnio.in',
      'https://www.spacefurnio.in',
      'https://admin.spacefurnio.in'
    );
  }

  return origins;
};

/**
 * Generate CORS headers
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 */
export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = getAllowedOrigins(env);

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed =>
    origin === allowed ||
    (allowed.includes('*') && origin.match(new RegExp(allowed.replace('*', '.*'))))
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID, X-Admin-Code',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Expose-Headers': 'X-Total-Count, X-Page, X-Per-Page'
  };
}

/**
 * Handle CORS preflight requests
 * @param {Request} request
 */
export function handleCors(request) {
  const headers = corsHeaders(request, request.env);

  return new Response(null, {
    status: 204,
    headers
  });
}

/**
 * Middleware to add CORS headers to response
 */
export function withCors(response, request, env) {
  const headers = corsHeaders(request, env);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export default { corsHeaders, handleCors, withCors };
