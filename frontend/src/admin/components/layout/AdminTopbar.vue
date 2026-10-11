<template>
  <header class="flex h-16 shrink-0 items-center justify-between border-b border-admin-border bg-white px-4 lg:px-6">
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        aria-label="Open navigation menu"
        class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus:ring-2 focus:ring-admin-primary focus:outline-none lg:hidden"
        @click="emit('toggleMobile')"
      >
        <i class="pi pi-bars text-lg" aria-hidden="true" />
      </button>
      <div class="min-w-0">
        <slot name="title" />
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div v-if="authStore.user" class="hidden items-center gap-2 sm:flex">
        <div class="text-right">
          <p class="max-w-40 truncate text-sm font-medium text-admin-text">
            {{ authStore.user.name }}
          </p>
          <span
            class="inline-block rounded-full bg-admin-primary-light px-2 py-0.5 text-xs font-medium text-admin-primary"
          >
            {{ formatRole(authStore.user.role) }}
          </span>
        </div>
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-admin-primary font-semibold text-white"
          aria-hidden="true"
        >
          {{ initial }}
        </div>
      </div>
      <button
        type="button"
        aria-label="Log out"
        :disabled="isLoggingOut"
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-admin-primary focus:outline-none disabled:opacity-50"
        @click="handleLogout"
      >
        <i class="pi pi-sign-out" aria-hidden="true" />
        <span class="hidden md:inline">{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/admin/stores/adminAuth'

const emit = defineEmits<{
  (e: 'toggleMobile'): void
}>()

const authStore = useAdminAuthStore()
const router = useRouter()
const isLoggingOut = ref(false)

const initial = computed(() => {
  const name = authStore.user?.name || authStore.user?.email || 'A'
  return name.charAt(0).toUpperCase()
})

function formatRole(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function handleLogout(): Promise<void> {
  isLoggingOut.value = true
  try {
    await authStore.logout()
    router.push({ name: 'AdminLogin' })
  } finally {
    isLoggingOut.value = false
  }
}
</script>
