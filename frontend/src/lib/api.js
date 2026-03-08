// frontend/src/lib/api.js

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://backend.spacefurnio.workers.dev'
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
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('spacefurnio_token')
    }
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('spacefurnio_token', token)
    } else {
      localStorage.removeItem('spacefurnio_token')
    }
  }

  clearAuth() {
    this.setToken(null)
  }

  async _ensureValidToken() {
    if (!this.token) throw new Error('Not authenticated')
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]))
      const exp = payload.exp * 1000
      const now = Date.now()
      if (exp - now < 60000) {
        await this.refresh()
      }
    } catch {
      await this.refresh()
    }
  }

  // --- AUTH ---
  async login(email, password) {
    const res = await fetch(WORKER_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    this.setToken(data.access_token)
    return data
  }

  async register(userData) {
    const res = await fetch(WORKER_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Registration failed')
    if (data.access_token) {
      this.setToken(data.access_token)
    }
    return data
  }

  async refresh() {
    const res = await fetch(WORKER_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('Token refresh failed')
    const data = await res.json()
    this.setToken(data.access_token)
    return data
  }

  async getCurrentUser() {
    if (!this.token) throw new Error('Not authenticated')
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]))
      return {
        user: {
          id: payload.sub,
          role: payload.role,
          email: payload.email || 'user@example.com',
        },
      }
    } catch {
      throw new Error('Invalid token')
    }
  }

  logout() {
    fetch(WORKER_URL + '/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
    this.clearAuth()
    return Promise.resolve()
  }

  // --- NEON DATA API HELPER (with auto-refresh) ---
  async _neonFetch(path, options = {}, isCatalog = false, retryCount = 0) {
    await this._ensureValidToken()

    const url = isCatalog ? CATALOG_URL : NEON_URL
    let headers = {
      'neon-connection-string': isCatalog ? CATALOG_CONN : NEON_CONN,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }
    if (this.token) {
      headers.Authorization = 'Bearer ' + this.token
    }
    if (options.headers) {
      headers = { ...headers, ...options.headers }
    }

    const res = await fetch(url + path, { ...options, headers })

    if (res.status === 401 && retryCount < 1) {
      try {
        await this.refresh()
        return this._neonFetch(path, options, isCatalog, retryCount + 1)
      } catch {
        this.clearAuth()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        throw new Error('Session expired. Please log in again.')
      }
    }

    if (!res.ok) {
      let errorMessage = 'Data API error: ' + res.status
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (parseError) {
        console.error('Failed to parse Data API error response:', parseError)
      }
      if (res.status === 409) throw new Error('Item already exists.')
      if (res.status === 401) throw new Error('Unauthorized')
      throw new Error(errorMessage)
    }
    return res.status === 204 ? null : res.json()
  }

  // --- WORKER API HELPER (with auto-refresh) ---
  async _workerFetch(endpoint, options = {}, retryCount = 0) {
    await this._ensureValidToken()

    const headers = {
      Authorization: 'Bearer ' + this.token,
      'Content-Type': 'application/json',
    }
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    const res = await fetch(WORKER_URL + endpoint, { ...options, headers })

    if (res.status === 401 && retryCount < 1) {
      try {
        await this.refresh()
        return this._workerFetch(endpoint, options, retryCount + 1)
      } catch {
        this.clearAuth()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        throw new Error('Session expired. Please log in again.')
      }
    }

    return res
  }

  // --- CARTS & WISHLISTS (via Neon Data API) ---
  async getCart() {
    if (!this.token) return null
    const carts = await this._neonFetch('/carts?select=id,user_id,created_at,updated_at')
    if (!carts || !carts.length) return null
    const cartId = carts[0].id
    const items = await this._neonFetch(
      '/cart_items?cart_id=eq.' +
        cartId +
        '&select=id,cart_id,product_id,quantity,price_snapshot,created_at',
    )
    return { ...carts[0], cart_items: items || [] }
  }

  async getCartId() {
    if (!this.token) return null
    const carts = await this._neonFetch('/carts?select=id')
    return carts && carts.length ? carts[0].id : null
  }

  async createCart() {
    const user = await this.getCurrentUser()
    if (!user.user.id) throw new Error('Not authenticated')
    return this._neonFetch('/carts', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.user.id }),
    })
  }

  async createWishlist() {
    const user = await this.getCurrentUser()
    if (!user.user.id) throw new Error('Not authenticated')
    return this._neonFetch('/wishlists', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.user.id }),
    })
  }

  addCartItem(data) {
    return this._neonFetch('/cart_items', { method: 'POST', body: JSON.stringify(data) })
  }

  updateCartItem(id, qty) {
    return this._neonFetch('/cart_items?id=eq.' + id, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: qty }),
    })
  }

  removeCartItem(id) {
    return this._neonFetch('/cart_items?id=eq.' + id, { method: 'DELETE' })
  }

  async clearCart(cartId) {
    if (cartId) {
      return this._neonFetch('/cart_items?cart_id=eq.' + cartId, { method: 'DELETE' })
    }
  }

  async getWishlist() {
    if (!this.token) return []
    const wishlists = await this._neonFetch('/wishlists?select=id')
    if (!wishlists || !wishlists.length) return []
    const wishlistId = wishlists[0].id
    return this._neonFetch(
      '/wishlist_items?wishlist_id=eq.' +
        wishlistId +
        '&select=id,wishlist_id,product_id,created_at',
    )
  }

  async getWishlistId() {
    if (!this.token) return null
    const wishlists = await this._neonFetch('/wishlists?select=id')
    return wishlists && wishlists.length ? wishlists[0].id : null
  }

  addWishlistItem(data) {
    return this._neonFetch('/wishlist_items', { method: 'POST', body: JSON.stringify(data) })
  }

  removeWishlistItem(id) {
    return this._neonFetch('/wishlist_items?id=eq.' + id, { method: 'DELETE' })
  }

  removeWishlistItemByProductId(pid) {
    return this._neonFetch('/wishlist_items?product_id=eq.' + pid, { method: 'DELETE' })
  }

  // --- ORDERS (read via Neon Data API, write via Worker API) ---
  async getOrders() {
    return this._neonFetch(
      '/orders?select=id,status,total_amount,created_at,address_id,shipping_first_name,shipping_last_name,shipping_address,shipping_city,shipping_state,shipping_pincode,shipping_phone,order_items(*),user_addresses(id,address_line_1,address_line_2,city,state,postal_code,country),payments(method,status)&order=created_at.desc',
    )
  }

  async getOrderById(orderId) {
    return this._neonFetch(
      '/orders?id=eq.' +
        orderId +
        '&select=id,status,total_amount,created_at,address_id,shipping_first_name,shipping_last_name,shipping_address,shipping_city,shipping_state,shipping_pincode,shipping_phone,order_items(*),user_addresses(id,address_line_1,address_line_2,city,state,postal_code,country),payments(method,status)',
    )
  }

  async updateOrderShipping(orderId, shippingData) {
    const res = await this._workerFetch('/api/orders/' + orderId + '/shipping', {
      method: 'PATCH',
      body: JSON.stringify(shippingData),
    })
    if (!res.ok) throw new Error('Failed to update shipping')
    return res.json()
  }

  async checkout(orderData) {
    const res = await this._workerFetch('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
    if (!res.ok) {
      let message = 'Checkout failed'
      let allowedMethods = null

      try {
        const data = await res.json()
        message = data?.message || message
        if (Array.isArray(data?.allowed_methods)) {
          allowedMethods = data.allowed_methods
        }
      } catch {
        // keep default message
      }

      const err = new Error(message)
      if (allowedMethods) {
        err.allowedMethods = allowedMethods
      }
      throw err
    }
    return res.json()
  }

  // --- CATALOG ---
  getProducts() {
    return this._neonFetch('/products?is_active=eq.true', {}, true)
  }
}

export const api = new ApiClient()
