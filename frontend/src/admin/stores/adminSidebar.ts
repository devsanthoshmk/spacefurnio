import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ADMIN_SIDEBAR_KEY } from '@/admin/utils/constants'

export const useAdminSidebarStore = defineStore('adminSidebar', () => {
  const storedCollapsed = typeof window !== 'undefined'
    ? localStorage.getItem(ADMIN_SIDEBAR_KEY) === 'true'
    : false

  const isCollapsed = ref(storedCollapsed)
  const isMobileOpen = ref(false)

  function persistCollapsed(value: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SIDEBAR_KEY, String(value))
    }
  }

  function toggle(): void {
    isCollapsed.value = !isCollapsed.value
    persistCollapsed(isCollapsed.value)
  }

  function collapse(): void {
    isCollapsed.value = true
    persistCollapsed(true)
  }

  function expand(): void {
    isCollapsed.value = false
    persistCollapsed(false)
  }

  function toggleMobile(): void {
    isMobileOpen.value = !isMobileOpen.value
  }

  function closeMobile(): void {
    isMobileOpen.value = false
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggle,
    collapse,
    expand,
    toggleMobile,
    closeMobile,
  }
})
