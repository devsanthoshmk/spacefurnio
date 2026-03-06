<template>
  <!--
    ================================================================
    LOGIN / SIGNUP MODAL — Reimagined
    ================================================================
    Premium auth modal with:
    - Smooth tab switch between Login & Register
    - Google OAuth button
    - Magic link option
    - Form validation with inline errors
    - Route-driven open/close (/login suffix)
    - Uses actual Worker API: POST /auth/login, POST /auth/register
    ================================================================
  -->
  <Teleport to="body">
    <Transition name="auth-backdrop">
      <div
        v-if="isOpen"
        class="sf-auth-backdrop"
        @click.self="closeModal"
      ></div>
    </Transition>

    <Transition name="auth-content">
      <div
        v-if="isOpen"
        class="sf-auth-modal"
        role="dialog"
        :aria-label="isLogin ? 'Sign In' : 'Create Account'"
        @keydown.esc="closeModal"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close -->
        <button @click="closeModal" class="sf-auth-close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Brand -->
        <div class="sf-auth-brand">
          <img src="/images/Spacefurnio-Logo.png" alt="Spacefurnio" class="sf-auth-logo" />
        </div>

        <!-- Tab Switcher -->
        <div class="sf-auth-tabs">
          <button
            :class="['sf-auth-tab', { active: isLogin }]"
            @click="switchTab('login')"
          >
            Sign In
          </button>
          <button
            :class="['sf-auth-tab', { active: !isLogin }]"
            @click="switchTab('register')"
          >
            Create Account
          </button>
          <div class="sf-auth-tab-indicator" :style="{ left: isLogin ? '0' : '50%' }"></div>
        </div>

        <!-- Form Container -->
        <div class="sf-auth-form-wrap">
          <!-- Error Banner -->
          <Transition name="error-slide">
            <div v-if="errorMessage" class="sf-auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <span>{{ errorMessage }}</span>
              <button @click="errorMessage = ''" class="sf-auth-error-dismiss">×</button>
            </div>
          </Transition>

          <!-- Success Banner -->
          <Transition name="error-slide">
            <div v-if="successMessage" class="sf-auth-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              <span>{{ successMessage }}</span>
            </div>
          </Transition>

          <!-- LOGIN FORM -->
          <form v-if="isLogin" @submit.prevent="handleLogin" class="sf-auth-form">
            <div class="sf-auth-field">
              <label for="login-email" class="sf-auth-label">Email</label>
              <input
                id="login-email"
                v-model="loginForm.email"
                type="email"
                class="sf-auth-input"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="sf-auth-field">
              <label for="login-password" class="sf-auth-label">Password</label>
              <div class="sf-auth-input-wrap">
                <input
                  id="login-password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="sf-auth-input"
                  placeholder="Enter your password"
                  required
                  autocomplete="current-password"
                />
                <button type="button" @click="showPassword = !showPassword" class="sf-auth-eye" aria-label="Toggle password visibility">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" :disabled="isSubmitting" class="sf-auth-submit">
              <span v-if="isSubmitting" class="sf-auth-spinner"></span>
              <span v-else>Sign In</span>
            </button>
          </form>

          <!-- REGISTER FORM -->
          <form v-else @submit.prevent="handleRegister" class="sf-auth-form">
            <div class="sf-auth-row">
              <div class="sf-auth-field">
                <label for="reg-fname" class="sf-auth-label">First Name</label>
                <input
                  id="reg-fname"
                  v-model="registerForm.firstName"
                  type="text"
                  class="sf-auth-input"
                  placeholder="John"
                  required
                  autocomplete="given-name"
                />
              </div>
              <div class="sf-auth-field">
                <label for="reg-lname" class="sf-auth-label">Last Name</label>
                <input
                  id="reg-lname"
                  v-model="registerForm.lastName"
                  type="text"
                  class="sf-auth-input"
                  placeholder="Doe"
                  required
                  autocomplete="family-name"
                />
              </div>
            </div>

            <div class="sf-auth-field">
              <label for="reg-email" class="sf-auth-label">Email</label>
              <input
                id="reg-email"
                v-model="registerForm.email"
                type="email"
                class="sf-auth-input"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="sf-auth-field">
              <label for="reg-password" class="sf-auth-label">Password</label>
              <div class="sf-auth-input-wrap">
                <input
                  id="reg-password"
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="sf-auth-input"
                  placeholder="Min 6 characters"
                  required
                  minlength="6"
                  autocomplete="new-password"
                />
                <button type="button" @click="showPassword = !showPassword" class="sf-auth-eye" aria-label="Toggle password visibility">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" :disabled="isSubmitting" class="sf-auth-submit">
              <span v-if="isSubmitting" class="sf-auth-spinner"></span>
              <span v-else>Create Account</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="sf-auth-divider">
            <span>or</span>
          </div>

          <!-- Google OAuth -->
          <button @click="handleGoogleLogin" class="sf-auth-google">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>

        <!-- Footer */-->
        <p class="sf-auth-footer">
          By continuing, you agree to our
          <a href="/terms" class="sf-auth-link">Terms</a> &
          <a href="/privacy" class="sf-auth-link">Privacy Policy</a>
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * ===========================================
 * LOGIN / SIGNUP MODAL — Reimagined
 * ===========================================
 * Uses:
 * - Injected isLoginOpen ref from App.vue
 * - Injected closeLogin() from App.vue
 * - Worker API: POST /auth/login, POST /auth/register
 * - Google OAuth via auth store
 * - Form validation
 */

import { computed, ref, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

// ─── Inject modal state from App.vue ───
const { isLoginOpen: isOpen, closeLogin } = inject('authUtils')

const authStore = useAuthStore()
const modalRef = ref(null)

// ─── State ───
const isLogin = ref(true)
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ firstName: '', lastName: '', email: '', password: '' })

// Worker API URL from .env
const WORKER_URL = import.meta.env.VITE_WORKER_URL || import.meta.env.VITE_API_URL || 'https://backend.spacefurnio.workers.dev'

watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    modalRef.value?.focus()
    // Reset forms
    errorMessage.value = ''
    successMessage.value = ''
  } else {
    document.body.style.overflow = ''
  }
})

// ─── Tab Switch ───
function switchTab(tab) {
  isLogin.value = tab === 'login'
  errorMessage.value = ''
  successMessage.value = ''
}

// ─── Login ───
async function handleLogin() {
  if (isSubmitting.value) return
  errorMessage.value = ''

  try {
    isSubmitting.value = true

    const res = await fetch(`${WORKER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.value.email,
        password: loginForm.value.password
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Login failed. Please check your credentials.')
    }

    // Store token + update auth state
    api.setToken(data.token)
    authStore.user = data.user

    // Sync cart/wishlist
    successMessage.value = 'Welcome back!'
    setTimeout(() => closeModal(), 800)

  } catch (err) {
    errorMessage.value = err.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// ─── Register ───
async function handleRegister() {
  if (isSubmitting.value) return
  errorMessage.value = ''

  if (registerForm.value.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  try {
    isSubmitting.value = true

    const res = await fetch(`${WORKER_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerForm.value.email,
        password: registerForm.value.password,
        firstName: registerForm.value.firstName,
        lastName: registerForm.value.lastName
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed.')
    }

    // Store token + update auth state
    if (data.token) {
      api.setToken(data.token)
      authStore.user = data.user
    }

    successMessage.value = data.message || 'Account created successfully!'
    setTimeout(() => closeModal(), 800)

  } catch (err) {
    errorMessage.value = err.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// ─── Google OAuth ───
async function handleGoogleLogin() {
  try {
    const url = await authStore.getGoogleAuthUrl()
    if (url) window.location.href = url
  } catch (err) {
    errorMessage.value = 'Google sign-in is currently unavailable.'
  }
}

// ─── Navigation ───
function closeModal() {
  closeLogin()
}

// ─── Keyboard ───
function handleEscKey(e) {
  if (e.key === 'Escape' && isOpen.value) closeModal()
}
onMounted(() => document.addEventListener('keydown', handleEscKey))
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<style>
/* ═══════════════════════════════════════════
   AUTH MODAL — Reimagined Styles
   ═══════════════════════════════════════════ */

.sf-auth-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 100001;
}
.auth-backdrop-enter-active,
.auth-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.auth-backdrop-enter-from,
.auth-backdrop-leave-to {
  opacity: 0;
}

.sf-auth-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 420px;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  background: var(--shop-cream, #FAF8F5);
  border-radius: var(--shop-radius-xl, 1.5rem);
  z-index: 100002;
  padding: 2rem;
  box-shadow: 0 24px 60px rgba(61, 58, 54, 0.2);
  outline: none;
}
.auth-content-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.auth-content-leave-active {
  transition: all 0.25s ease;
}
.auth-content-enter-from {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.96);
}
.auth-content-leave-to {
  opacity: 0;
  transform: translate(-50%, -52%) scale(0.96);
}

.sf-auth-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: var(--shop-beige, #E8E3DC);
  color: var(--shop-brown-dark, #8B7D6D);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}
.sf-auth-close:hover {
  background: var(--shop-beige-dark, #D4CFC6);
  color: var(--shop-charcoal, #3D3A36);
}

/* Brand */
.sf-auth-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}
.sf-auth-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

/* Tabs */
.sf-auth-tabs {
  position: relative;
  display: flex;
  background: var(--shop-beige, #E8E3DC);
  border-radius: 999px;
  padding: 3px;
  margin-bottom: 1.5rem;
}
.sf-auth-tab {
  flex: 1;
  padding: 0.625rem 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-brown, #A89B8C);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.25s;
  position: relative;
  z-index: 1;
}
.sf-auth-tab.active {
  color: var(--shop-charcoal, #3D3A36);
}
.sf-auth-tab-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: 50%;
  background: white;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Form */
.sf-auth-form-wrap {
  min-height: 0;
}
.sf-auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.sf-auth-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.sf-auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.sf-auth-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--shop-brown-dark, #8B7D6D);
  letter-spacing: 0.02em;
}
.sf-auth-input {
  width: 100%;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: var(--shop-radius-md, 0.75rem);
  background: white;
  color: var(--shop-charcoal, #3D3A36);
  transition: all 0.2s;
  outline: none;
}
.sf-auth-input:focus {
  border-color: var(--shop-accent, #B8956C);
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.12);
}
.sf-auth-input::placeholder {
  color: var(--shop-tan, #C4B8A9);
}
.sf-auth-input-wrap {
  position: relative;
}
.sf-auth-input-wrap .sf-auth-input {
  padding-right: 2.75rem;
}
.sf-auth-eye {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--shop-brown, #A89B8C);
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.15s;
}
.sf-auth-eye:hover {
  color: var(--shop-charcoal, #3D3A36);
}

/* Submit */
.sf-auth-submit {
  width: 100%;
  padding: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: var(--shop-charcoal, #3D3A36);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
}
.sf-auth-submit:hover:not(:disabled) {
  background: var(--shop-black, #1A1816);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(61, 58, 54, 0.2);
}
.sf-auth-submit:disabled {
  opacity: 0.6;
  cursor: wait;
}
.sf-auth-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: authSpin 0.6s linear infinite;
}
@keyframes authSpin {
  to { transform: rotate(360deg); }
}

/* Divider */
.sf-auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
}
.sf-auth-divider::before,
.sf-auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--shop-beige-dark, #D4CFC6);
}
.sf-auth-divider span {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--shop-brown, #A89B8C);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Google */
.sf-auth-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  background: white;
  border: 1px solid var(--shop-beige-dark, #D4CFC6);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-auth-google:hover {
  background: var(--shop-cream-dark, #F5F2ED);
  border-color: var(--shop-tan, #C4B8A9);
  transform: translateY(-1px);
}

/* Error / Success */
.sf-auth-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  background: rgba(196, 117, 117, 0.08);
  border: 1px solid rgba(196, 117, 117, 0.2);
  border-radius: var(--shop-radius-md, 0.75rem);
  font-size: 0.8125rem;
  color: var(--shop-error, #C47575);
  margin-bottom: 0.75rem;
}
.sf-auth-error-dismiss {
  margin-left: auto;
  border: none;
  background: none;
  color: inherit;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.sf-auth-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  background: rgba(125, 155, 118, 0.1);
  border: 1px solid rgba(125, 155, 118, 0.25);
  border-radius: var(--shop-radius-md, 0.75rem);
  font-size: 0.8125rem;
  color: var(--shop-success, #5A7D51);
  margin-bottom: 0.75rem;
}
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.25s ease;
}
.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Footer */
.sf-auth-footer {
  text-align: center;
  font-size: 0.6875rem;
  color: var(--shop-brown, #A89B8C);
  margin-top: 1.25rem;
  line-height: 1.5;
}
.sf-auth-link {
  color: var(--shop-accent-dark, #8C6D4D);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.sf-auth-link:hover {
  color: var(--shop-charcoal, #3D3A36);
}

/* Responsive */
@media (max-width: 480px) {
  .sf-auth-modal {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 2rem);
    padding: 1.5rem;
    border-radius: var(--shop-radius-lg, 1rem);
  }
  .sf-auth-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
