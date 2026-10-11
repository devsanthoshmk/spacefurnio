import { computed } from 'vue'
import { useAdminAuthStore } from '@/admin/stores/adminAuth'
import type { AdminPermission } from '@/admin/types/admin'

export function useAdminAuth() {
  const store = useAdminAuthStore()

  return {
    user: computed(() => store.user),
    role: computed(() => store.role),
    permissions: computed(() => store.permissions),
    isAuthenticated: computed(() => store.isAuthenticated),
    isLoading: computed(() => store.isLoading),
    hasPermission: (p: AdminPermission) => store.hasPermission(p),
    login: store.login,
    logout: store.logout,
    initAuth: store.initAuth,
  }
}
