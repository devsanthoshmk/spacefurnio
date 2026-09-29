// frontend/src/lib/api.js

function resolveWorkerUrl() {
  const envUrl = import.meta.env.VITE_WORKER_URL || import.meta.env.VITE_API_URL
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/$/, '')
    }
    return 'https://backend.thepreview.workers.dev'
  }
  return (envUrl || 'http://localhost:8787').replace(/\/$/, '')
}

const WORKER_URL = resolveWorkerUrl()
const TOKEN_KEY = 'spacefurnio_token'

const NEON_URL =
  import.meta.env.VITE_NEON_URL ||
  'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1'
const CATALOG_URL =
  import.meta.env.VITE_CATALOG_URL ||
  'https://ep-flat-brook-a1h1dgii.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1'
const NEON_CONN =
  import.meta.env.VITE_NEON_CONN ||
  'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
const CATALOG_CONN =
  import.meta.env.VITE_CATALOG_CONN ||
  'postgresql://authenticator@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

class ApiClient {
  constructor() {
    this.token = null
    this._refreshPromise = null
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY)
    }
  }

  // --- TOKEN MANAGEMENT ---

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY)
    }
    return this.token
  }

  setToken(token) {
    this.token = token || null
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  clearAuth() {
    this.setToken(null)
  }

  _isTokenExpiringSoon(thresholdSeconds = 60) {
    if (!this.token) return true
    try {
      const parts = this.token.split('.')
      if (parts.length < 2) return true
      const payload = JSON.parse(atob(parts[1]))
      if (!payload.exp) return false
      const expMs = payload.exp * 1000
      return expMs - Date.now() < thresholdSeconds * 1000
    } catch {
      return true
    }
  }

  async _ensureValidToken() {
    if (!this.token) {
      this.token = this.getToken()
    }
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    if (this._isTokenExpiringSoon(60)) {
      if (!this._refreshPromise) {
        this._refreshPromise = this.refresh()
          .catch((err) => {
            this.clearAuth()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:logout'))
            }
            throw err
          })
          .finally(() => {
            this._refreshPromise = null
          })
      }
      await this._refreshPromise
    }
  }

  // --- CORE WORKER HTTP REQUEST HELPER ---

  async _request(endpoint, options = {}, requiresAuth = false, retryCount = 0) {
    if (requiresAuth) {
      await this._ensureValidToken()
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }

    const currentToken = this.getToken()
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`
    }

    const url = endpoint.startsWith('http') ? endpoint : `${WORKER_URL}${endpoint}`

    const res = await fetch(url, {
      ...options,
      headers,
    })

    if (res.status === 401 && retryCount < 1 && (requiresAuth || currentToken)) {
      try {
        if (!this._refreshPromise) {
          this._refreshPromise = this.refresh().finally(() => {
            this._refreshPromise = null
          })
        }
        await this._refreshPromise
        return this._request(endpoint, options, requiresAuth, retryCount + 1)
      } catch {
        this.clearAuth()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        throw new Error('Session expired. Please log in again.')
      }
    }

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`
      let errorData = null
      try {
        errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // use default status message
      }

      const err = new Error(errorMessage)
      err.status = res.status
      err.data = errorData
      if (errorData?.allowed_methods) {
        err.allowedMethods = errorData.allowed_methods
      }
      throw err
    }

    if (res.status === 204) {
      return { success: true }
    }

    return res.json()
  }

  // --- NEON DATA API HELPER (fallback / direct read compatibility) ---

  async _neonFetch(path, options = {}, isCatalog = false, retryCount = 0) {
    if (this.token && this._isTokenExpiringSoon(60)) {
      try {
        await this._ensureValidToken()
      } catch {
        // continue without refresh if failed
      }
    }

    const url = isCatalog ? CATALOG_URL : NEON_URL
    let headers = {
      'neon-connection-string': isCatalog ? CATALOG_CONN : NEON_CONN,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }
    const token = this.getToken()
    if (token) {
      headers.Authorization = 'Bearer ' + token
    }
    if (options.headers) {
      headers = { ...headers, ...options.headers }
    }

    const res = await fetch(url + path, { ...options, headers })

    if (res.status === 401 && retryCount < 1 && token) {
      try {
        await this.refresh()
        return this._neonFetch(path, options, isCatalog, retryCount + 1)
      } catch {
        this.clearAuth()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        throw new Error('Session expired. Please log in again.')
      }
    }

    if (!res.ok) {
      let errorMessage = 'Data API error: ' + res.status
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // keep fallback
      }
      if (res.status === 409) throw new Error('Item already exists.')
      if (res.status === 401) throw new Error('Unauthorized')
      throw new Error(errorMessage)
    }

    return res.status === 204 ? null : res.json()
  }

  // ===========================================
  // 1. AUTH METHODS
  // ===========================================

  async login(email, password) {
    const data = await this._request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data?.access_token) {
      this.setToken(data.access_token)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:login'))
      }
    }
    return data
  }

  async register(userData) {
    const data = await this._request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    if (data?.access_token) {
      this.setToken(data.access_token)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:login'))
      }
    }
    return data
  }

  async getMe() {
    return this._request('/auth/me', { method: 'GET' }, true)
  }

  async getCurrentUser() {
    try {
      const me = await this.getMe()
      return { user: me }
    } catch {
      const token = this.getToken()
      if (!token) throw new Error('Not authenticated')
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return {
          user: {
            id: payload.sub,
            role: payload.role || 'authenticated',
            email: payload.email || 'user@example.com',
          },
        }
      } catch {
        throw new Error('Invalid token')
      }
    }
  }

  async updateProfile(data) {
    return this._request(
      '/auth/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      true,
    )
  }

  async changePassword(currentPasswordOrData, newPassword = null) {
    const payload =
      typeof currentPasswordOrData === 'object' && currentPasswordOrData !== null
        ? currentPasswordOrData
        : { current_password: currentPasswordOrData, new_password: newPassword }

    return this._request(
      '/auth/change-password',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      true,
    )
  }

  async forgotPassword(email) {
    return this._request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(email, tokenOrCode, newPassword) {
    return this._request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, tokenOrCode, newPassword }),
    })
  }

  async logout() {
    try {
      await this._request('/auth/logout', { method: 'POST' })
    } catch (e) {
      console.warn('Logout request warning:', e)
    } finally {
      this.clearAuth()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    }
    return { success: true }
  }

  async refresh() {
    const data = await this._request('/auth/refresh', {
      method: 'POST',
    })
    if (data?.access_token) {
      this.setToken(data.access_token)
    }
    return data
  }

  // ===========================================
  // 2. PRODUCTS METHODS
  // ===========================================

  async getProducts(params = {}) {
    const query = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
          val.forEach((item) => query.append(key, item))
        } else {
          query.append(key, String(val))
        }
      }
    }
    const qs = query.toString()
    return this._request(`/api/products${qs ? `?${qs}` : ''}`, { method: 'GET' })
  }

  async getProduct(idOrSlug) {
    return this._request(`/api/products/${encodeURIComponent(idOrSlug)}`, { method: 'GET' })
  }

  async getFilters() {
    return this._request('/api/products/filters', { method: 'GET' })
  }

  async getFeaturedProducts(limit = 8) {
    return this._request(`/api/products/featured?limit=${limit}`, { method: 'GET' })
  }

  async getCategories() {
    return this._request('/api/categories', { method: 'GET' })
  }

  async getCategory(slugOrId) {
    return this._request(`/api/categories/${encodeURIComponent(slugOrId)}`, { method: 'GET' })
  }

  // ===========================================
  // 3. CART METHODS
  // ===========================================

  async getCart() {
    return this._request('/api/cart', { method: 'GET' }, true)
  }

  async addToCart(productIdOrData, quantity = 1, priceSnapshot = null) {
    let payload
    if (typeof productIdOrData === 'object' && productIdOrData !== null) {
      payload = {
        product_id: productIdOrData.product_id || productIdOrData.productId,
        quantity: productIdOrData.quantity || quantity || 1,
        price_snapshot:
          productIdOrData.price_snapshot !== undefined
            ? productIdOrData.price_snapshot
            : productIdOrData.priceSnapshot !== undefined
              ? productIdOrData.priceSnapshot
              : priceSnapshot,
      }
    } else {
      payload = {
        product_id: productIdOrData,
        quantity,
        price_snapshot: priceSnapshot,
      }
    }

    return this._request(
      '/api/cart/items',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true,
    )
  }

  addCartItem(data) {
    return this.addToCart(data)
  }

  async updateCartItem(itemId, quantity) {
    return this._request(
      `/api/cart/items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      },
      true,
    )
  }

  async removeCartItem(itemId) {
    return this._request(`/api/cart/items/${itemId}`, { method: 'DELETE' }, true)
  }

  async clearCart() {
    return this._request('/api/cart/clear', { method: 'DELETE' }, true)
  }

  async createCart() {
    return this.getCart()
  }

  // ===========================================
  // 4. WISHLIST METHODS
  // ===========================================

  async getWishlist() {
    return this._request('/api/wishlist', { method: 'GET' }, true)
  }

  async getWishlistId() {
    const data = await this.getWishlist()
    return data?.items?.[0]?.wishlist_id || 'user_wishlist'
  }

  async addToWishlist(productIdOrData) {
    const productId =
      typeof productIdOrData === 'object' && productIdOrData !== null
        ? productIdOrData.product_id || productIdOrData.productId
        : productIdOrData

    return this._request(
      '/api/wishlist/items',
      {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      },
      true,
    )
  }

  addWishlistItem(data) {
    return this.addToWishlist(data)
  }

  async removeFromWishlist(itemId) {
    return this._request(`/api/wishlist/items/${itemId}`, { method: 'DELETE' }, true)
  }

  removeWishlistItem(itemId) {
    return this.removeFromWishlist(itemId)
  }

  async removeWishlistItemByProductId(productId) {
    return this._request(
      `/api/wishlist/items/by-product/${encodeURIComponent(productId)}`,
      { method: 'DELETE' },
      true,
    )
  }

  async clearWishlist() {
    return this._request('/api/wishlist/clear', { method: 'DELETE' }, true)
  }

  async createWishlist() {
    return this.getWishlist()
  }

  // ===========================================
  // 5. ADDRESSES METHODS
  // ===========================================

  async getAddresses() {
    return this._request('/api/addresses', { method: 'GET' }, true)
  }

  async getDefaultAddress() {
    return this._request('/api/addresses/default', { method: 'GET' }, true)
  }

  async getAddress(addressId) {
    return this._request(`/api/addresses/${addressId}`, { method: 'GET' }, true)
  }

  async createAddress(addressData) {
    return this._request(
      '/api/addresses',
      {
        method: 'POST',
        body: JSON.stringify(addressData),
      },
      true,
    )
  }

  async updateAddress(addressId, addressData) {
    return this._request(
      `/api/addresses/${addressId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(addressData),
      },
      true,
    )
  }

  async setDefaultAddress(addressId) {
    return this.updateAddress(addressId, { is_default: true })
  }

  async deleteAddress(addressId) {
    return this._request(`/api/addresses/${addressId}`, { method: 'DELETE' }, true)
  }

  // ===========================================
  // 6. COUPONS METHODS
  // ===========================================

  async getActiveCoupons() {
    return this._request('/api/coupons/active', { method: 'GET' })
  }

  async validateCoupon(code, subtotal = 0) {
    return this._request('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    })
  }

  // ===========================================
  // 7. ORDERS METHODS
  // ===========================================

  async checkout(orderData) {
    return this._request(
      '/api/orders/checkout',
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      },
      true,
    )
  }

  async getOrders() {
    return this._request('/api/orders', { method: 'GET' }, true)
  }

  async getOrder(orderId) {
    return this._request(`/api/orders/${orderId}`, { method: 'GET' }, true)
  }

  async getOrderById(orderId) {
    return this.getOrder(orderId)
  }

  async updateOrderShipping(orderId, shippingData) {
    return this._request(
      `/api/orders/${orderId}/shipping`,
      {
        method: 'PATCH',
        body: JSON.stringify(shippingData),
      },
      true,
    )
  }

  async cancelOrder(orderId, reason = 'Cancelled by customer') {
    return this._request(
      `/api/orders/${orderId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      true,
    )
  }

  // ===========================================
  // 8. REVIEWS METHODS
  // ===========================================

  async getProductReviews(productId, params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    return this._request(`/api/reviews/product/${productId}${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    })
  }

  async submitReview(reviewData) {
    return this._request(
      '/api/reviews',
      {
        method: 'POST',
        body: JSON.stringify(reviewData),
      },
      true,
    )
  }

  // ===========================================
  // 9. PAYMENTS METHODS
  // ===========================================

  async createPaymentOrder(orderId, amount, currency = 'INR') {
    return this._request(
      '/api/payments/create-order',
      {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId, amount, currency }),
      },
      true,
    )
  }

  async verifyPayment(paymentData) {
    return this._request(
      '/api/payments/verify',
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      },
      true,
    )
  }

  // ===========================================
  // 10. ENGAGEMENT METHODS
  // ===========================================

  async subscribeNewsletter(email) {
    return this._request('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async submitContact(contactData) {
    return this._request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    })
  }
}

export const api = new ApiClient()
export default api
