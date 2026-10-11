import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi } from '@/admin/api/adminApi'
import { resolvePermissions } from '@/admin/utils/permissions'
import { TOKEN_KEY } from '@/admin/utils/constants'
import type { AdminUser, AdminRole, AdminPermission } from '@/admin/types/admin'

interface JwtPayload {
  sub: string
  email: string
  name?: string
  role: AdminRole
  exp?: number
  permissions?: AdminPermission[]
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 < Date.now()
}

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const user = ref<AdminUser | null>(null)
  const token = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  )
  const isLoading = ref(false)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role ?? null)
  const permissions = computed(() => user.value?.permissions ?? [])

  function hasPermission(permission: AdminPermission): boolean {
    const r = role.value
    if (r === 'super_admin' || r === 'admin') return true
    return permissions.value.includes(permission)
  }

  function setToken(newToken: string | null): void {
    token.value = newToken
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken)
        adminApi.setToken(newToken)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        adminApi.clearAuth()
      }
    }
  }

  function buildUserFromPayload(payload: JwtPayload): AdminUser {
    const resolvedPermissions = resolvePermissions(payload.role, payload.permissions)
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0],
      role: payload.role,
      is_active: true,
      permissions: resolvedPermissions,
      created_at: '',
      updated_at: '',
    }
  }

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true
    try {
      const data = await adminApi.post<{ token?: string; access_token?: string; user?: { id: string; email: string; name: string } }>(
        '/auth/login',
        { email, password },
      )
      const receivedToken = data.token ?? data.access_token ?? null
      if (!receivedToken) throw new Error('No token returned from login')

      setToken(receivedToken)

      const payload = decodeJwtPayload(receivedToken)
      if (!payload) throw new Error('Invalid token received')

      user.value = buildUserFromPayload({
        ...payload,
        email: data.user?.email ?? payload.email ?? email,
        name: data.user?.name ?? payload.name,
      })
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      await adminApi.post('/auth/logout').catch(() => null)
    } finally {
      setToken(null)
      user.value = null
      isLoading.value = false
    }
  }

  async function initAuth(): Promise<void> {
    if (isInitialized.value) return

    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    if (!storedToken) {
      isInitialized.value = true
      return
    }

    if (isTokenExpired(storedToken)) {
      setToken(null)
      isInitialized.value = true
      return
    }

    isLoading.value = true
    try {
      const payload = decodeJwtPayload(storedToken)
      if (!payload) {
        setToken(null)
        return
      }
      token.value = storedToken
      adminApi.setToken(storedToken)
      user.value = buildUserFromPayload(payload)
    } catch {
      setToken(null)
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  return {
    user,
    token,
    isLoading,
    isInitialized,
    isAuthenticated,
    role,
    permissions,
    hasPermission,
    login,
    logout,
    initAuth,
  }
})
