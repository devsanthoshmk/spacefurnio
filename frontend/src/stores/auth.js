/**
 * ===========================================
 * AUTH STORE
 * ===========================================
 * Manages user authentication state
 * Pinia setup store using ref() and computed()
 * Syncs token with localStorage and handles cart/wishlist sync
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { useCartStore } from './cart'
import { useWishlistStore } from './wishlist'
import { hasLocalCart, hasLocalWishlist } from '@/lib/localCart'

const TOKEN_KEY = 'spacefurnio_token'

export const useAuthStore = defineStore('auth', () => {
  // ===========================================
  // STATE
  // ===========================================

  const user = ref(null)
  const token = ref(typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref(null)

  // ===========================================
  // GETTERS (COMPUTED)
  // ===========================================

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => {
    if (!user.value) return 'Guest'
    return (
      user.value.firstName ||
      user.value.name ||
      user.value.email?.split('@')[0] ||
      'User'
    )
  })
  const userEmail = computed(() => user.value?.email || '')
  const userAvatar = computed(() => user.value?.avatarUrl || null)

  // ===========================================
  // ACTIONS
  // ===========================================

  /**
   * Set and persist auth token
   */
  function setToken(newToken) {
    token.value = newToken || null
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  /**
   * Sync local guest cart and wishlist to database after login
   */
  async function syncUserData() {
    try {
      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()

      cartStore.setMode(true)
      wishlistStore.setMode(true)

      await Promise.all([
        typeof cartStore.syncToDatabase === 'function' ? cartStore.syncToDatabase() : Promise.resolve(),
        typeof wishlistStore.syncToDatabase === 'function' ? wishlistStore.syncToDatabase() : Promise.resolve(),
      ])
    } catch (syncErr) {
      console.error('Failed to sync guest data to backend:', syncErr)
    }
  }

  /**
   * Initialize auth state from stored token on app start
   */
  async function initAuth() {
    if (isInitialized.value) return

    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    token.value = storedToken

    const cartStore = useCartStore()
    const wishlistStore = useWishlistStore()

    if (!storedToken) {
      cartStore.setMode(false)
      wishlistStore.setMode(false)
      await Promise.all([cartStore.fetchCart(), wishlistStore.fetchWishlist()])
      isInitialized.value = true
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const meResponse = await api.getMe()
      user.value = meResponse

      cartStore.setMode(true)
      wishlistStore.setMode(true)

      if (hasLocalCart() || hasLocalWishlist()) {
        await syncUserData()
      } else {
        await Promise.all([cartStore.fetchCart(), wishlistStore.fetchWishlist()])
      }
    } catch (err) {
      console.warn('Auth init validation failed, attempting refresh:', err)
      try {
        const refreshResponse = await api.refresh()
        if (refreshResponse?.access_token) {
          setToken(refreshResponse.access_token)
          const meResponse = await api.getMe()
          user.value = meResponse

          cartStore.setMode(true)
          wishlistStore.setMode(true)

          if (hasLocalCart() || hasLocalWishlist()) {
            await syncUserData()
          } else {
            await Promise.all([cartStore.fetchCart(), wishlistStore.fetchWishlist()])
          }
        } else {
          throw new Error('Refresh token invalid')
        }
      } catch (refreshErr) {
        console.warn('Authentication expired:', refreshErr)
        setToken(null)
        user.value = null
        api.clearAuth()
        cartStore.setMode(false)
        wishlistStore.setMode(false)
        await Promise.all([cartStore.fetchCart(), wishlistStore.fetchWishlist()])
      }
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  /**
   * Backward-compatible alias for initAuth
   */
  async function initialize() {
    return initAuth()
  }

  /**
   * Log in user
   */
  async function login(email, password) {
    try {
      isLoading.value = true
      error.value = null

      const data = await api.login(email, password)
      if (data?.access_token) {
        setToken(data.access_token)
      }
      user.value = data.user || (await api.getMe().catch(() => null))

      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()
      cartStore.setMode(true)
      wishlistStore.setMode(true)

      await syncUserData()
      return data
    } catch (err) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Register new user
   */
  async function register(userData) {
    try {
      isLoading.value = true
      error.value = null

      const data = await api.register(userData)
      if (data?.access_token) {
        setToken(data.access_token)
      }
      user.value = data.user || (await api.getMe().catch(() => null))

      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()
      cartStore.setMode(true)
      wishlistStore.setMode(true)

      await syncUserData()
      return data
    } catch (err) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Log out user
   */
  async function logout() {
    try {
      isLoading.value = true
      await api.logout()
    } catch (err) {
      console.warn('Logout API error:', err)
    } finally {
      setToken(null)
      user.value = null
      error.value = null
      isLoading.value = false

      const cartStore = useCartStore()
      const wishlistStore = useWishlistStore()
      cartStore.setMode(false)
      wishlistStore.setMode(false)
      cartStore.$reset()
      wishlistStore.$reset()
      await Promise.all([cartStore.fetchCart(), wishlistStore.fetchWishlist()])
    }
  }

  /**
   * Update current user profile
   */
  async function updateProfile(data) {
    try {
      isLoading.value = true
      error.value = null

      const response = await api.updateProfile(data)
      if (response?.user) {
        user.value = { ...user.value, ...response.user }
      } else {
        const freshUser = await api.getMe().catch(() => null)
        if (freshUser) user.value = freshUser
      }
      return response
    } catch (err) {
      error.value = err.message || 'Failed to update profile'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Change user password
   */
  async function changePassword(currentPassword, newPassword) {
    try {
      isLoading.value = true
      error.value = null

      return await api.changePassword(currentPassword, newPassword)
    } catch (err) {
      error.value = err.message || 'Failed to change password'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Request password reset email
   */
  async function forgotPassword(email) {
    try {
      isLoading.value = true
      error.value = null

      return await api.forgotPassword(email)
    } catch (err) {
      error.value = err.message || 'Failed to send reset link'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reset password with token/code
   */
  async function resetPassword(email, tokenOrCode, newPassword) {
    try {
      isLoading.value = true
      error.value = null

      return await api.resetPassword(email, tokenOrCode, newPassword)
    } catch (err) {
      error.value = err.message || 'Failed to reset password'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // --- Browser Event Handlers ---
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
      setToken(null)
      user.value = null
    })

    window.addEventListener('auth:login', async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedToken && storedToken !== token.value) {
        token.value = storedToken
        try {
          user.value = await api.getMe()
        } catch {
          // ignore
        }
      }
    })
  }

  return {
    // State
    user,
    token,
    isLoading,
    isInitialized,
    error,

    // Getters
    isAuthenticated,
    userName,
    userEmail,
    userAvatar,

    // Actions
    initAuth,
    initialize,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    syncUserData,
  }
})
