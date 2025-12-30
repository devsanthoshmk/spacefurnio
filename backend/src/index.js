/**
 * ===========================================
 * SPACEFURNIO BACKEND API
 * ===========================================
 * Main entry point for Cloudflare Workers backend
 * Using itty-router for routing
 */

import { Router, error, json, withParams } from 'itty-router';
import { withAuth, withOptionalAuth } from './middleware/auth.js';
import { withRateLimit } from './middleware/rateLimit.js';
import { corsHeaders, handleCors } from './middleware/cors.js';
import { withDb } from './middleware/database.js';

// Import route handlers
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import reviewRoutes from './routes/reviews.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';
import adminRoutes from './routes/admin/index.js';
import webhookRoutes from './routes/webhooks.js';

// Create router
const router = Router();

// ===========================================
// CORS PREFLIGHT
// ===========================================
router.options('*', handleCors);

// ===========================================
// HEALTH CHECK
// ===========================================
router.get('/health', () => json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  service: 'spacefurnio-api'
}));

// ===========================================
// API VERSION
// ===========================================
router.get('/api/v1', () => json({
  version: '1.0.0',
  documentation: 'https://api.spacefurnio.in/docs',
  endpoints: {
    auth: '/api/v1/auth',
    products: '/api/v1/products',
    cart: '/api/v1/cart',
    wishlist: '/api/v1/wishlist',
    reviews: '/api/v1/reviews',
    orders: '/api/v1/orders',
    addresses: '/api/v1/addresses',
    admin: '/api/v1/admin'
  }
}));

// ===========================================
// AUTH ROUTES (Public)
// ===========================================
router.all('/api/v1/auth/*', withParams, withDb, authRoutes.handle);

// ===========================================
// PRODUCT ROUTES (Public)
// ===========================================
router.all('/api/v1/products/*', withParams, withDb, withOptionalAuth, productRoutes.handle);

// ===========================================
// CART ROUTES (Auth Optional - supports guest carts)
// ===========================================
router.all('/api/v1/cart/*', withParams, withDb, withOptionalAuth, cartRoutes.handle);

// ===========================================
// WISHLIST ROUTES (Auth Required)
// ===========================================
router.all('/api/v1/wishlist/*', withParams, withDb, withAuth, wishlistRoutes.handle);

// ===========================================
// REVIEW ROUTES (Mixed auth)
// ===========================================
router.all('/api/v1/reviews/*', withParams, withDb, withOptionalAuth, reviewRoutes.handle);

// ===========================================
// ORDER ROUTES (Auth Required)
// ===========================================
router.all('/api/v1/orders/*', withParams, withDb, withAuth, orderRoutes.handle);

// ===========================================
// ADDRESS ROUTES (Auth Required)
// ===========================================
router.all('/api/v1/addresses/*', withParams, withDb, withAuth, addressRoutes.handle);

// ===========================================
// ADMIN ROUTES (Admin Required + Security Code)
// ===========================================
router.all('/api/v1/admin/*', withParams, withDb, withAuth, adminRoutes.handle);

// ===========================================
// WEBHOOK ROUTES (Signature Verification)
// ===========================================
router.all('/api/v1/webhooks/*', withParams, withDb, webhookRoutes.handle);

// ===========================================
// 404 HANDLER
// ===========================================
router.all('*', () => error(404, {
  error: 'Not Found',
  message: 'The requested endpoint does not exist'
}));

// ===========================================
// MAIN EXPORT
// ===========================================
export default {
  /**
   * Handle incoming requests
   * @param {Request} request
   * @param {Object} env - Environment bindings
   * @param {Object} ctx - Execution context
   */
  async fetch(request, env, ctx) {
    // Add env and ctx to request for middleware access
    request.env = env;
    request.ctx = ctx;

    try {
      // Handle the request
      const response = await router.handle(request);

      // Add CORS headers to all responses
      const corsResponse = new Response(response.body, response);
      Object.entries(corsHeaders(request, env)).forEach(([key, value]) => {
        corsResponse.headers.set(key, value);
      });

      return corsResponse;
    } catch (err) {
      console.error('Unhandled error:', err);

      // Return error response with CORS headers
      const errorResponse = json({
        error: 'Internal Server Error',
        message: env.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred'
      }, { status: 500 });

      Object.entries(corsHeaders(request, env)).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }
  }
};
