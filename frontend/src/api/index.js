/**
 * ===========================================
 * API CLIENT
 * ===========================================
 * Centralized API client for all backend requests
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.spacefurnio.in';
const API_VERSION = 'v1';

// Session ID for guest cart
const SESSION_KEY = 'spacefurnio_session_id';

/**
 * Get or create session ID for guest users
 */
function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get auth token from storage
 */
function getAuthToken() {
  return localStorage.getItem('spacefurnio_token');
}

/**
 * Set auth token in storage
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('spacefurnio_token', token);
  } else {
    localStorage.removeItem('spacefurnio_token');
  }
}

/**
 * Clear all auth data
 */
export function clearAuth() {
  localStorage.removeItem('spacefurnio_token');
  // Keep session ID for cart
}

/**
 * Base API request function
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add session ID for guest cart functionality
  headers['X-Session-ID'] = getSessionId();

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        // Token expired or invalid
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      throw {
        status: response.status,
        message: data.message || 'An error occurred',
        errors: data.errors,
      };
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }

    // Network error
    throw {
      status: 0,
      message: 'Network error. Please check your connection.',
    };
  }
}

// ===========================================
// AUTH API
// ===========================================

export const auth = {
  /**
   * Get Google OAuth URL
   */
  async getGoogleAuthUrl() {
    return apiRequest('/auth/google');
  },

  /**
   * Complete Google OAuth callback
   */
  async googleCallback(code, state) {
    return apiRequest('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  },

  /**
   * Request magic link
   */
  async requestMagicLink(email, name = null) {
    return apiRequest('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token) {
    return apiRequest('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    return apiRequest('/auth/me');
  },

  /**
   * Update current user profile
   */
  async updateProfile(data) {
    return apiRequest('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Logout current session
   */
  async logout() {
    const result = await apiRequest('/auth/logout', { method: 'POST' });
    clearAuth();
    return result;
  },

  /**
   * Logout all sessions
   */
  async logoutAll() {
    const result = await apiRequest('/auth/logout-all', { method: 'POST' });
    clearAuth();
    return result;
  },

  /**
   * Get all sessions
   */
  async getSessions() {
    return apiRequest('/auth/sessions');
  },

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId) {
    return apiRequest(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  },
};

// ===========================================
// PRODUCTS API
// ===========================================

export const products = {
  /**
   * Get products list
   */
  async getAll(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/products?${searchParams}`);
  },

  /**
   * Get featured products
   */
  async getFeatured(limit = 8) {
    return apiRequest(`/products/featured?limit=${limit}`);
  },

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit = 8) {
    return apiRequest(`/products/new-arrivals?limit=${limit}`);
  },

  /**
   * Get products by room
   */
  async getByRoom(room, params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/products/room/${room}?${searchParams}`);
  },

  /**
   * Get products by style
   */
  async getByStyle(style, params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/products/style/${style}?${searchParams}`);
  },

  /**
   * Get single product by slug
   */
  async getBySlug(slug) {
    return apiRequest(`/products/${slug}`);
  },

  /**
   * Get all categories
   */
  async getCategories() {
    return apiRequest('/products/categories/all');
  },

  /**
   * Get filter options
   */
  async getFilterOptions() {
    return apiRequest('/products/filters/options');
  },
};

// ===========================================
// CART API
// ===========================================

export const cart = {
  /**
   * Get cart
   */
  async get() {
    return apiRequest('/cart');
  },

  /**
   * Add item to cart
   */
  async addItem(productId, quantity = 1, variantId = null) {
    return apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, variantId }),
    });
  },

  /**
   * Update cart item quantity
   */
  async updateItem(itemId, quantity) {
    return apiRequest(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  /**
   * Remove item from cart
   */
  async removeItem(itemId) {
    return apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' });
  },

  /**
   * Clear entire cart
   */
  async clear() {
    return apiRequest('/cart', { method: 'DELETE' });
  },

  /**
   * Apply coupon code
   */
  async applyCoupon(code) {
    return apiRequest('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Remove coupon
   */
  async removeCoupon() {
    return apiRequest('/cart/coupon', { method: 'DELETE' });
  },

  /**
   * Get cart count
   */
  async getCount() {
    return apiRequest('/cart/count');
  },
};

// ===========================================
// WISHLIST API
// ===========================================

export const wishlist = {
  /**
   * Get wishlist
   */
  async get() {
    return apiRequest('/wishlist');
  },

  /**
   * Add item to wishlist
   */
  async addItem(productId, variantId = null) {
    return apiRequest('/wishlist/items', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId }),
    });
  },

  /**
   * Remove item from wishlist
   */
  async removeItem(itemId) {
    return apiRequest(`/wishlist/items/${itemId}`, { method: 'DELETE' });
  },

  /**
   * Remove item by product ID
   */
  async removeByProductId(productId) {
    return apiRequest(`/wishlist/product/${productId}`, { method: 'DELETE' });
  },

  /**
   * Check if product is in wishlist
   */
  async checkProduct(productId) {
    return apiRequest(`/wishlist/check/${productId}`);
  },

  /**
   * Move item to cart
   */
  async moveToCart(itemId, quantity = 1) {
    return apiRequest(`/wishlist/items/${itemId}/move-to-cart`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
  },

  /**
   * Get wishlist count
   */
  async getCount() {
    return apiRequest('/wishlist/count');
  },

  /**
   * Update wishlist visibility
   */
  async setVisibility(isPublic) {
    return apiRequest('/wishlist/visibility', {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
  },
};

// ===========================================
// REVIEWS API
// ===========================================

export const reviews = {
  /**
   * Get reviews for product
   */
  async getForProduct(productId, params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reviews/product/${productId}?${searchParams}`);
  },

  /**
   * Create review
   */
  async create(productId, data) {
    return apiRequest(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update review
   */
  async update(reviewId, data) {
    return apiRequest(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete review
   */
  async delete(reviewId) {
    return apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
  },

  /**
   * Vote on review
   */
  async vote(reviewId, isHelpful) {
    return apiRequest(`/reviews/${reviewId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ isHelpful }),
    });
  },

  /**
   * Remove vote
   */
  async removeVote(reviewId) {
    return apiRequest(`/reviews/${reviewId}/vote`, { method: 'DELETE' });
  },

  /**
   * Get user's reviews
   */
  async getMyReviews(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reviews/my-reviews?${searchParams}`);
  },

  /**
   * Get products available for review
   */
  async getProductsToReview() {
    return apiRequest('/reviews/products-to-review');
  },
};

// ===========================================
// ORDERS API
// ===========================================

export const orders = {
  /**
   * Get all orders
   */
  async getAll(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/orders?${searchParams}`);
  },

  /**
   * Get single order
   */
  async getById(orderId) {
    return apiRequest(`/orders/${orderId}`);
  },

  /**
   * Create order from cart
   */
  async create(data) {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(orderId, data) {
    return apiRequest(`/orders/${orderId}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Cancel order
   */
  async cancel(orderId, reason = null) {
    return apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Track order
   */
  async track(orderId) {
    return apiRequest(`/orders/${orderId}/track`);
  },
};

// ===========================================
// ADDRESSES API
// ===========================================

export const addresses = {
  /**
   * Get all addresses
   */
  async getAll() {
    return apiRequest('/addresses');
  },

  /**
   * Get single address
   */
  async getById(addressId) {
    return apiRequest(`/addresses/${addressId}`);
  },

  /**
   * Create address
   */
  async create(data) {
    return apiRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update address
   */
  async update(addressId, data) {
    return apiRequest(`/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete address
   */
  async delete(addressId) {
    return apiRequest(`/addresses/${addressId}`, { method: 'DELETE' });
  },

  /**
   * Set default address
   */
  async setDefault(addressId) {
    return apiRequest(`/addresses/${addressId}/default`, { method: 'POST' });
  },

  /**
   * Get default address
   */
  async getDefault() {
    return apiRequest('/addresses/default');
  },

  /**
   * Get Indian states list
   */
  async getStates() {
    return apiRequest('/addresses/meta/states');
  },
};

// ===========================================
// ADMIN API
// ===========================================

export const admin = {
  /**
   * Request admin access
   */
  async requestAccess(securityCode) {
    return apiRequest('/admin/request-access', {
      method: 'POST',
      body: JSON.stringify({ securityCode }),
    });
  },

  /**
   * Check admin status
   */
  async getStatus() {
    return apiRequest('/admin/status');
  },

  /**
   * Get dashboard data
   */
  async getDashboard() {
    return apiRequest('/admin/dashboard');
  },

  // Products
  products: {
    async getAll(params = {}) {
      const searchParams = new URLSearchParams(params);
      return apiRequest(`/admin/products?${searchParams}`);
    },
    async create(data) {
      return apiRequest('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async update(productId, data) {
      return apiRequest(`/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async delete(productId) {
      return apiRequest(`/admin/products/${productId}`, { method: 'DELETE' });
    },
  },

  // Orders
  orders: {
    async getAll(params = {}) {
      const searchParams = new URLSearchParams(params);
      return apiRequest(`/admin/orders?${searchParams}`);
    },
    async getById(orderId) {
      return apiRequest(`/admin/orders/${orderId}`);
    },
    async update(orderId, data) {
      return apiRequest(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Reviews
  reviews: {
    async getAll(params = {}) {
      const searchParams = new URLSearchParams(params);
      return apiRequest(`/admin/reviews?${searchParams}`);
    },
    async updateStatus(reviewId, status) {
      return apiRequest(`/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  // Users
  users: {
    async getAll(params = {}) {
      const searchParams = new URLSearchParams(params);
      return apiRequest(`/admin/users?${searchParams}`);
    },
  },

  // Categories
  categories: {
    async getAll() {
      return apiRequest('/admin/categories');
    },
    async create(data) {
      return apiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Coupons
  coupons: {
    async getAll() {
      return apiRequest('/admin/coupons');
    },
    async create(data) {
      return apiRequest('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Settings
  settings: {
    async getAll() {
      return apiRequest('/admin/settings');
    },
    async update(data) {
      return apiRequest('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Activity logs
  activity: {
    async getAll(params = {}) {
      const searchParams = new URLSearchParams(params);
      return apiRequest(`/admin/activity?${searchParams}`);
    },
  },
};

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
  auth,
  products,
  cart,
  wishlist,
  reviews,
  orders,
  addresses,
  admin,
  setAuthToken,
  clearAuth,
};
