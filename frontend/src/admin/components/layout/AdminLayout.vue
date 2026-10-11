<template>
  <div class="flex h-screen overflow-hidden bg-admin-bg font-admin">
    <AdminSidebar
      :collapsed="sidebarStore.isCollapsed"
      :mobile-open="sidebarStore.isMobileOpen"
      @update:collapsed="handleCollapsedUpdate"
      @update:mobile-open="handleMobileOpenUpdate"
    />
    <div class="flex min-w-0 flex-1 flex-col">
      <AdminTopbar @toggle-mobile="sidebarStore.toggleMobile()" />
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AdminSidebar from '@/admin/components/layout/AdminSidebar.vue'
import AdminTopbar from '@/admin/components/layout/AdminTopbar.vue'
import { useAdminAuthStore } from '@/admin/stores/adminAuth'
import { useAdminSidebarStore } from '@/admin/stores/adminSidebar'

const authStore = useAdminAuthStore()
const sidebarStore = useAdminSidebarStore()

function handleCollapsedUpdate(value: boolean): void {
  if (value) {
    sidebarStore.collapse()
  } else {
    sidebarStore.expand()
  }
}

function handleMobileOpenUpdate(value: boolean): void {
  if (value !== sidebarStore.isMobileOpen) {
    sidebarStore.toggleMobile()
  }
}

onMounted(() => {
  authStore.initAuth()
})
</script>
