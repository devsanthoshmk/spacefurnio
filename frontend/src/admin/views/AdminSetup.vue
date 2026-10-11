<template>
  <div class="flex min-h-screen items-center justify-center bg-admin-bg px-4 font-admin">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div class="text-center">
        <p class="text-2xl font-bold text-admin-text">SpaceFurnio</p>
        <p class="mt-1 text-sm text-admin-text-secondary">Set Up Your Account</p>
      </div>
      <p v-if="inviteEmail" class="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-admin-text-secondary">
        Invited as <span class="font-medium text-admin-text">{{ inviteEmail }}</span>
      </p>
      <div
        v-if="success"
        role="status"
        class="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
      >
        {{ success }} Redirecting to login...
      </div>
      <form v-else class="mt-6 space-y-5" novalidate @submit.prevent="handleSubmit">
        <fieldset :disabled="missingToken" :class="{ 'opacity-60': missingToken }">
        <div>
          <label for="setup-name" class="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="setup-name"
            v-model="name"
            type="text"
            autocomplete="name"
            required
            placeholder="Your full name"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
          />
        </div>
        <div>
          <label for="setup-password" class="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="setup-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            placeholder="Minimum 6 characters"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
          />
        </div>
        <div>
          <label for="setup-confirm" class="mb-1.5 block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <input
            id="setup-confirm"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            placeholder="Repeat your password"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary focus:outline-none"
          />
        </div>
        </fieldset>
        <p v-if="error" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ error }}
        </p>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-lg bg-admin-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-admin-primary-hover focus:ring-2 focus:ring-admin-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? 'Setting up...' : 'Set Up Account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi } from '@/admin/api/adminApi'

const route = useRoute()
const router = useRouter()

const inviteToken = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const inviteEmail = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
const missingToken = computed(() => !inviteToken.value)

const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const isSubmitting = ref(false)

onMounted(() => {
  if (missingToken.value) {
    error.value = 'Missing invitation token. Please use the link from your invitation email.'
  }
})

async function handleSubmit(): Promise<void> {
  error.value = ''
  if (!inviteToken.value) {
    error.value = 'Missing invitation token. Please use the link from your invitation email.'
    return
  }
  if (!name.value.trim()) {
    error.value = 'Please enter your full name.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  isSubmitting.value = true
  try {
    const result = await adminApi.post<{ message?: string }>('/api/admin/team/accept-invite', {
      token: inviteToken.value,
      password: password.value,
      name: name.value.trim(),
    })
    success.value = result.message || 'Account set up successfully.'
    setTimeout(() => {
      router.push({ name: 'AdminLogin' })
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Setup failed. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
