// frontend/src/lib/api.js

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://backend.spacefurnio.workers.dev';
const NEON_URL = import.meta.env.VITE_NEON_URL || 'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1';
const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || 'https://ep-flat-brook-a1h1dgii.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1';

const NEON_CONN = import.meta.env.VITE_NEON_CONN || 'postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const CATALOG_CONN = import.meta.env.VITE_CATALOG_CONN || 'postgresql://authenticator@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

class ApiClient {
  constructor() {
    this.token = null;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('spacefurnio_token');
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('spacefurnio_token', token);
    } else {
      localStorage.removeItem('spacefurnio_token');
    }
  }

  clearAuth() {
    this.setToken(null);
  }

  // --- AUTH ---
  async login(email, password) {
    const res = await fetch(`${WORKER_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(userData) {
    const res = await fetch(`${WORKER_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async refresh() {
    // Refresh token is sent automatically via httpOnly cookie
    const res = await fetch(`${WORKER_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Token refresh failed');
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser() {
    if (!this.token) throw new Error('Not authenticated');
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return {
        user: {
          id: payload.sub,
          role: payload.role,
          email: payload.email || 'user@example.com'
        }
      };
    } catch {
      throw new Error('Invalid token');
    }
  }

  logout() {
    // Logout will send cookie automatically, then clear local storage
    fetch(`${WORKER_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {});
    
    this.clearAuth();
    return Promise.resolve();
  }

  // --- NEON HTTP HELPER ---
  async _neonFetch(path, options = {}, isCatalog = false) {
    const url = isCatalog ? CATALOG_URL : NEON_URL;

    let headers = {
      'neon-connection-string': isCatalog ? CATALOG_CONN : NEON_CONN,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers
    };

    const res = await fetch(`${url}${path}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      if (res.status === 409) throw new Error('Item already exists.');
      if (res.status === 401) throw new Error('Unauthorized');
      throw new Error(`Data API error: ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  }

  // --- CARTS & WISHLISTS ---
  async getCart() {
    if (!this.token) return [];
    const res = await this._neonFetch('/carts?select=*,cart_items(*)');
    return res && res.length ? res[0] : null;
  }

  addCartItem(data) { return this._neonFetch('/cart_items', { method: 'POST', body: JSON.stringify(data) }); }
  updateCartItem(id, qty) { return this._neonFetch(`/cart_items?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) }); }
  removeCartItem(id) { return this._neonFetch(`/cart_items?id=eq.${id}`, { method: 'DELETE' }); }

  async clearCart(cartId) {
    if (cartId) {
      return this._neonFetch(`/cart_items?cart_id=eq.${cartId}`, { method: 'DELETE' });
    }
  }

  getWishlist() { return this._neonFetch('/wishlist_items?select=id,created_at,product_id'); }
  addWishlistItem(data) { return this._neonFetch('/wishlist_items', { method: 'POST', body: JSON.stringify(data) }); }
  removeWishlistItem(id) { return this._neonFetch(`/wishlist_items?id=eq.${id}`, { method: 'DELETE' }); }
  removeWishlistItemByProductId(pid) { return this._neonFetch(`/wishlist_items?product_id=eq.${pid}`, { method: 'DELETE' }); }

  // --- ORDERS ---
  getOrders() { return this._neonFetch('/orders?select=*,order_items(*)&order=created_at.desc'); }

  async checkout(orderData) {
    const res = await fetch(`${WORKER_URL}/api/orders/checkout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Checkout failed');
    return res.json();
  }

  // --- CATALOG ---
  getProducts() { return this._neonFetch(`/products?is_active=eq.true`, {}, true); }
}

export const api = new ApiClient();