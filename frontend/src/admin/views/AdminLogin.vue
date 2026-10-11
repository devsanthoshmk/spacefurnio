<template>
  <div class="flex min-h-screen items-center justify-center bg-admin-bg px-4 font-admin">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div class="text-center">
        <p class="text-2xl font-bold text-admin-text">SpaceFurnio</p>
        <p class="mt-1 text-sm text-admin-text-secondary">Admin Portal</p>
      </div>
      <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
        <div>
          <label for="admin-email" class="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="admin-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="admin@spacefurnio.com"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
          />
        </div>
        <div>
          <label for="admin-password" class="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div class="relative">
            <input
              id="admin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="Enter your password"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
            />
            <button
              type="button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              class="absolute top-1/2 right-3 -translate-y-1/2 text-admin-text-muted transition-colors hover:text-slate-600 focus:ring-2 focus:ring-admin-primary focus:outline-none"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p v-if="error" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ error }}
        </p>
        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full rounded-lg bg-admin-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-admin-primary-hover focus:ring-2 focus:ring-admin-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ authStore.isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/admin/stores/adminAuth'

const authStore = useAdminAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

async function handleSubmit(): Promise<void> {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  try {
    await authStore.login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    router.push(redirect)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed. Please try again.'
  }
}

onMounted(() => {
  if (import.meta.env.DEV && typeof route.query.token === 'string' && route.query.token) {
    localStorage.setItem('spacefurnio_token', route.query.token)
    authStore.initAuth().then(() => {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/images'
      router.push(redirect)
    })
  }
})
</script>
