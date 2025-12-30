/**
 * ===========================================
 * AUTH STORE
 * ===========================================
 * Manages user authentication state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { auth, setAuthToken, clearAuth } from '@/api';
import { useCartStore } from './cart';
import { useWishlistStore } from './wishlist';

export const useAuthStore = defineStore('auth', () => {
  // ===========================================
  // STATE
  // ===========================================

  const user = ref(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);
  const error = ref(null);

  // ===========================================
  // GETTERS
  // ===========================================

  const isAuthenticated = computed(() => !!user.value);
  const userName = computed(() => user.value?.name || 'Guest');
  const userEmail = computed(() => user.value?.email || '');
  const userAvatar = computed(() => user.value?.avatarUrl || null);

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Initialize auth state on app load
   */
  async function initialize() {
    if (isInitialized.value) return;

    const token = localStorage.getItem('spacefurnio_token');
    if (!token) {
      isInitialized.value = true;
      return;
    }

    try {
      isLoading.value = true;
      const response = await auth.getCurrentUser();
      user.value = response.user;
    } catch (err) {
      console.error('Auth init error:', err);
      // Token is invalid, clear it
      clearAuth();
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  /**
   * Get Google OAuth URL
   */
  async function getGoogleAuthUrl() {
    try {
      const response = await auth.getGoogleAuthUrl();
      return response.url;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * Handle Google OAuth callback
   */
  async function handleGoogleCallback(code, state) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await auth.googleCallback(code, state);

      if (response.token) {
        setAuthToken(response.token);
        user.value = response.user;

        // Sync cart and wishlist
        await syncUserData();

        return response;
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Request magic link
   */
  async function requestMagicLink(email, name = null) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await auth.requestMagicLink(email, name);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Verify magic link token
   */
  async function verifyMagicLink(token) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await auth.verifyMagicLink(token);

      if (response.token) {
        setAuthToken(response.token);
        user.value = response.user;

        // Sync cart and wishlist
        await syncUserData();

        return response;
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update user profile
   */
  async function updateProfile(data) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await auth.updateProfile(data);
      user.value = response.user;

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout current session
   */
  async function logout() {
    try {
      await auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;

      // Reset cart and wishlist stores
      const cartStore = useCartStore();
      const wishlistStore = useWishlistStore();
      cartStore.$reset();
      wishlistStore.$reset();
    }
  }

  /**
   * Logout all sessions
   */
  async function logoutAll() {
    try {
      await auth.logoutAll();
    } catch (err) {
      console.error('Logout all error:', err);
    } finally {
      user.value = null;

      // Reset cart and wishlist stores
      const cartStore = useCartStore();
      const wishlistStore = useWishlistStore();
      cartStore.$reset();
      wishlistStore.$reset();
    }
  }

  /**
   * Get all sessions
   */
  async function getSessions() {
    try {
      const response = await auth.getSessions();
      return response.sessions;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * Revoke specific session
   */
  async function revokeSession(sessionId) {
    try {
      await auth.revokeSession(sessionId);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * Sync user data after login (cart, wishlist)
   */
  async function syncUserData() {
    try {
      const cartStore = useCartStore();
      const wishlistStore = useWishlistStore();

      // Fetch user's cart and wishlist
      await Promise.all([
        cartStore.fetchCart(),
        wishlistStore.fetchWishlist()
      ]);
    } catch (err) {
      console.error('Sync error:', err);
    }
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null;
  }

  // Listen for logout events (from API client)
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
      user.value = null;
    });
  }

  return {
    // State
    user,
    isLoading,
    isInitialized,
    error,

    // Getters
    isAuthenticated,
    userName,
    userEmail,
    userAvatar,

    // Actions
    initialize,
    getGoogleAuthUrl,
    handleGoogleCallback,
    requestMagicLink,
    verifyMagicLink,
    updateProfile,
    logout,
    logoutAll,
    getSessions,
    revokeSession,
    clearError,
  };
});
