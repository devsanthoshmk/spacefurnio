/**
 * ===========================================
 * AUTH STORE
 * ===========================================
 * Manages user authentication state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { useCartStore } from './cart'
import { useWishlistStore } from './wishlist'

export const useAuthStore = defineStore('auth', () => {
  // ===========================================
  // STATE
  // ===========================================

  const user = ref(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref(null)

  // ===========================================
  // GETTERS
  // ===========================================

  const isAuthenticated = computed(() => !!user.value)
  const userName = computed(() => user.value?.firstName || user.value?.name || 'Guest')
  const userEmail = computed(() => user.value?.email || '')
  const userAvatar = computed(() => user.value?.avatarUrl || null)

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Initialize auth state on app load
   */
  async function initialize() {
    if (isInitialized.value) return

    const token = localStorage.getItem('spacefurnio_token')

    if (!token) {
      isInitialized.value = true
      return
    }

    // If we have a token, try to get current user
    try {
      isLoading.value = true
      const response = await api.getCurrentUser()
      user.value = response.user
    } catch (err) {
      console.error('Auth init error:', err)
      // Token might be expired, try to refresh (cookie will be sent automatically)
      try {
        await api.refresh()
        const response = await api.getCurrentUser()
        user.value = response.user
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr)
        api.clearAuth()
      }
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  // Stubs for magic link / oauth
  async function getGoogleAuthUrl() {
    return null
  }
  async function handleGoogleCallback(code, state) {
    return null
  }
  async function requestMagicLink(email, name = null) {
    return null
  }
  async function verifyMagicLink(token) {
    return null
  }
  async function updateProfile(data) {
    return null
  }
  async function getSessions() {
    return []
  }
  async function revokeSession(sessionId) {}

  /**
   * Logout current session
   */
  async function logout() {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()
      cartStore.$reset()
      wishlistStore.$reset()
    }
  }

  /**
   * Logout all sessions
   */
  async function logoutAll() {
    await logout()
  }

  /**
   * Sync user data after login (cart, wishlist)
   */
  async function syncUserData() {
    try {
      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()

      await Promise.all([cartStore.fetchCart(), wishlistStore.fetchWishlist()])
    } catch (err) {
      console.error('Sync error:', err)
    }
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null
  }

  // Listen for logout events (from API client)
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
      user.value = null
    })
  }

  return {
    user,
    isLoading,
    isInitialized,
    error,
    isAuthenticated,
    userName,
    userEmail,
    userAvatar,
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
  }
})
