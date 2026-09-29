<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="auth-backdrop">
      <div v-if="isOpen" class="sf-auth-backdrop" @click.self="closeModal"></div>
    </Transition>

    <!-- Modal Window -->
    <Transition name="auth-content">
      <div
        v-if="isOpen"
        class="sf-auth-modal"
        role="dialog"
        :aria-label="modalTitle"
        @keydown.esc="closeModal"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close Button -->
        <button @click="closeModal" class="sf-auth-close" aria-label="Close authentication dialog">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- Brand Logo Header -->
        <div class="sf-auth-brand">
          <img src="/images/Spacefurnio-Logo.png" alt="SpaceFurnio" class="sf-auth-logo" />
        </div>

        <!-- Tab Switcher (Login / Register) -->
        <div v-if="authView === 'login' || authView === 'register'" class="sf-auth-tabs">
          <button
            type="button"
            :class="['sf-auth-tab', { active: authView === 'login' }]"
            @click="switchTab('login')"
          >
            Sign In
          </button>
          <button
            type="button"
            :class="['sf-auth-tab', { active: authView === 'register' }]"
            @click="switchTab('register')"
          >
            Create Account
          </button>
          <div
            class="sf-auth-tab-indicator"
            :style="{ left: authView === 'login' ? '3px' : 'calc(50% + 1px)' }"
          ></div>
        </div>

        <!-- Alt Headers for Forgot / Reset -->
        <div v-else-if="authView === 'forgot'" class="sf-auth-header-alt">
          <h3 class="sf-auth-alt-title">Forgot Password</h3>
          <p class="sf-auth-alt-desc">Enter your email address and we'll send you a password reset code.</p>
        </div>

        <div v-else-if="authView === 'reset'" class="sf-auth-header-alt">
          <h3 class="sf-auth-alt-title">Set New Password</h3>
          <p class="sf-auth-alt-desc">Enter the verification code sent to your email and your new password.</p>
        </div>

        <!-- Form Area -->
        <div class="sf-auth-form-wrap">
          <!-- Error Alert -->
          <Transition name="error-slide">
            <div v-if="errorMessage" class="sf-auth-alert error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span class="flex-1">{{ errorMessage }}</span>
              <button type="button" @click="errorMessage = ''" class="sf-alert-dismiss" aria-label="Dismiss error">×</button>
            </div>
          </Transition>

          <!-- Success Alert -->
          <Transition name="error-slide">
            <div v-if="successMessage" class="sf-auth-alert success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="flex-shrink-0">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span class="flex-1">{{ successMessage }}</span>
            </div>
          </Transition>

          <!-- 1. LOGIN VIEW -->
          <form v-if="authView === 'login'" @submit.prevent="handleLogin" class="sf-auth-form">
            <div class="sf-auth-field">
              <label for="login-email" class="sf-auth-label">Email Address</label>
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
              <div class="sf-auth-field-header">
                <label for="login-password" class="sf-auth-label">Password</label>
                <button type="button" class="sf-auth-forgot" @click="switchTab('forgot')">
                  Forgot password?
                </button>
              </div>
              <div class="sf-auth-input-wrap">
                <input
                  id="login-password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="sf-auth-input pr-10"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="sf-auth-eye"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" :disabled="isSubmitting" class="sf-auth-submit">
              <span v-if="isSubmitting" class="sf-auth-spinner"></span>
              <span v-else>Sign In</span>
            </button>
          </form>

          <!-- 2. REGISTER VIEW -->
          <form v-else-if="authView === 'register'" @submit.prevent="handleRegister" class="sf-auth-form">
            <div class="grid grid-cols-2 gap-3">
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
              <label for="reg-email" class="sf-auth-label">Email Address</label>
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
                  class="sf-auth-input pr-10"
                  placeholder="At least 6 characters"
                  required
                  minlength="6"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="sf-auth-eye"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <p class="text-[11px] text-stone-400 mt-0.5">Password must be at least 6 characters</p>
            </div>

            <button type="submit" :disabled="isSubmitting" class="sf-auth-submit">
              <span v-if="isSubmitting" class="sf-auth-spinner"></span>
              <span v-else>Create Account</span>
            </button>
          </form>

          <!-- 3. FORGOT PASSWORD VIEW -->
          <form v-else-if="authView === 'forgot'" @submit.prevent="handleForgot" class="sf-auth-form">
            <div class="sf-auth-field">
              <label for="forgot-email" class="sf-auth-label">Registered Email</label>
              <input
                id="forgot-email"
                v-model="forgotForm.email"
                type="email"
                class="sf-auth-input"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <button type="submit" :disabled="isSubmitting" class="sf-auth-submit">
              <span v-if="isSubmitting" class="sf-auth-spinner"></span>
              <span v-else>Send Reset Code</span>
            </button>

            <button type="button" @click="switchTab('login')" class="sf-auth-back-link">
              ← Back to Sign In
            </button>
          </form>

          <!-- 4. RESET PASSWORD VIEW -->
          <form v-else-if="authView === 'reset'" @submit.prevent="handleReset" class="sf-auth-form">
            <div class="sf-auth-field">
              <label for="reset-email" class="sf-auth-label">Email Address</label>
              <input
                id="reset-email"
                v-model="resetForm.email"
                type="email"
                class="sf-auth-input bg-stone-100"
                placeholder="you@example.com"
                required
              />
            </div>

            <div class="sf-auth-field">
              <label for="reset-token" class="sf-auth-label">6-Digit Code / Reset Token</label>
              <input
                id="reset-token"
                v-model="resetForm.token"
                type="text"
                class="sf-auth-input tracking-widest uppercase font-mono"
                placeholder="123456"
                required
              />
            </div>

            <div class="sf-auth-field">
              <label for="reset-password" class="sf-auth-label">New Password</label>
              <div class="sf-auth-input-wrap">
                <input
                  id="reset-password"
                  v-model="resetForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="sf-auth-input pr-10"
                  placeholder="New password (min 6 chars)"
                  required
                  minlength="6"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="sf-auth-eye"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" :disabled="isSubmitting" class="sf-auth-submit">
              <span v-if="isSubmitting" class="sf-auth-spinner"></span>
              <span v-else>Update Password</span>
            </button>

            <button type="button" @click="switchTab('login')" class="sf-auth-back-link">
              ← Back to Sign In
            </button>
          </form>
        </div>

        <!-- Footer terms info -->
        <p class="sf-auth-footer">
          By continuing, you agree to SpaceFurnio's
          <router-link to="/about" @click="closeModal" class="sf-auth-link">Terms</router-link> &amp;
          <router-link to="/about" @click="closeModal" class="sf-auth-link">Privacy Policy</router-link>.
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'

const { isLoginOpen: isOpen, closeLogin } = inject('authUtils')
const authStore = useAuthStore()

const modalRef = ref(null)
const authView = ref('login') // 'login' | 'register' | 'forgot' | 'reset'
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ firstName: '', lastName: '', email: '', password: '' })
const forgotForm = ref({ email: '' })
const resetForm = ref({ email: '', token: '', password: '' })

const modalTitle = computed(() => {
  if (authView.value === 'login') return 'Sign In'
  if (authView.value === 'register') return 'Create Account'
  if (authView.value === 'forgot') return 'Forgot Password'
  return 'Reset Password'
})

watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    errorMessage.value = ''
    successMessage.value = ''
    showPassword.value = false

    // Check query params if reset requested
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('reset') === 'true') {
        authView.value = 'reset'
        resetForm.value.email = params.get('email') || ''
        resetForm.value.token = params.get('token') || ''
      }
    }

    await nextTick()
    modalRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

function switchTab(view) {
  authView.value = view
  errorMessage.value = ''
  successMessage.value = ''
  showPassword.value = false
}

async function handleLogin() {
  if (isSubmitting.value) return
  errorMessage.value = ''
  successMessage.value = ''

  if (!loginForm.value.email.trim() || !loginForm.value.password) {
    errorMessage.value = 'Please enter both your email and password.'
    return
  }

  try {
    isSubmitting.value = true
    await authStore.login(loginForm.value.email.trim(), loginForm.value.password)
    successMessage.value = 'Welcome back! Signing you in...'
    setTimeout(() => {
      closeModal()
    }, 600)
  } catch (err) {
    console.error('Login failed:', err)
    errorMessage.value = err.message || 'Invalid email or password. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleRegister() {
  if (isSubmitting.value) return
  errorMessage.value = ''
  successMessage.value = ''

  if (registerForm.value.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long.'
    return
  }

  try {
    isSubmitting.value = true
    const res = await authStore.register({
      email: registerForm.value.email.trim(),
      password: registerForm.value.password,
      firstName: registerForm.value.firstName.trim(),
      lastName: registerForm.value.lastName.trim(),
    })
    successMessage.value = res?.message || 'Account created successfully! Welcome to SpaceFurnio.'
    setTimeout(() => {
      closeModal()
    }, 800)
  } catch (err) {
    console.error('Registration failed:', err)
    errorMessage.value = err.message || 'Could not complete registration. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleForgot() {
  if (isSubmitting.value) return
  errorMessage.value = ''
  successMessage.value = ''

  if (!forgotForm.value.email.trim()) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  try {
    isSubmitting.value = true
    const res = await authStore.forgotPassword(forgotForm.value.email.trim())
    successMessage.value = res?.message || 'Verification code sent to your email.'
    resetForm.value.email = forgotForm.value.email.trim()
    setTimeout(() => {
      switchTab('reset')
    }, 1200)
  } catch (err) {
    console.error('Forgot password error:', err)
    errorMessage.value = err.message || 'Failed to send reset code. Please check your email.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleReset() {
  if (isSubmitting.value) return
  errorMessage.value = ''
  successMessage.value = ''

  if (resetForm.value.password.length < 6) {
    errorMessage.value = 'New password must be at least 6 characters.'
    return
  }

  try {
    isSubmitting.value = true
    const res = await authStore.resetPassword(
      resetForm.value.email.trim(),
      resetForm.value.token.trim(),
      resetForm.value.password,
    )
    successMessage.value = res?.message || 'Password reset successfully! Please sign in with your new password.'
    setTimeout(() => {
      loginForm.value.email = resetForm.value.email
      switchTab('login')
    }, 1200)
  } catch (err) {
    console.error('Reset password error:', err)
    errorMessage.value = err.message || 'Failed to reset password. Please verify the code.'
  } finally {
    isSubmitting.value = false
  }
}

function closeModal() {
  closeLogin()
}

function handleEscKey(e) {
  if (e.key === 'Escape' && isOpen.value) closeModal()
}

onMounted(() => document.addEventListener('keydown', handleEscKey))
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Backdrop */
.sf-auth-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.6);
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

/* Modal Window */
.sf-auth-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 420px;
  max-height: calc(100vh - 3.5rem);
  overflow-y: auto;
  background: #faf8f5;
  border-radius: 1.5rem;
  z-index: 100002;
  padding: 2rem 2rem 1.75rem;
  box-shadow: 0 24px 60px rgba(44, 38, 32, 0.25);
  outline: none;
}
.auth-content-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
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
  top: 1.125rem;
  right: 1.125rem;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: #e8e3dc;
  color: #5c4f42;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}
.sf-auth-close:hover {
  background: #dcd5ca;
  color: #2c2723;
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
  background: #e8e3dc;
  border-radius: 999px;
  padding: 3px;
  margin-bottom: 1.25rem;
}
.sf-auth-tab {
  flex: 1;
  padding: 0.5625rem 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #8c7d6e;
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.25s;
  position: relative;
  z-index: 1;
  text-align: center;
}
.sf-auth-tab.active {
  color: #2c2723;
}
.sf-auth-tab-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: calc(50% - 4px);
  background: white;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sf-auth-header-alt {
  text-align: center;
  margin-bottom: 1.25rem;
}
.sf-auth-alt-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
  margin-bottom: 0.25rem;
}
.sf-auth-alt-desc {
  font-size: 0.75rem;
  color: #8c7d6e;
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
.sf-auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sf-auth-field-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.sf-auth-forgot {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  color: #8c7d6e;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.sf-auth-forgot:hover {
  color: #2c2723;
  text-decoration: underline;
}

.sf-auth-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #5c4f42;
  letter-spacing: 0.01em;
}
.sf-auth-input {
  width: 100%;
  padding: 0.6875rem 0.875rem;
  font-size: 0.8125rem;
  border: 1px solid #dcd5ca;
  border-radius: 0.75rem;
  background: white;
  color: #2c2723;
  outline: none;
  transition: all 0.2s;
}
.sf-auth-input:focus {
  border-color: #b8956c;
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.15);
}
.sf-auth-input-wrap {
  position: relative;
}
.sf-auth-eye {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #8c7d6e;
  cursor: pointer;
  transition: color 0.15s;
}
.sf-auth-eye:hover {
  color: #2c2723;
}

/* Submit Button */
.sf-auth-submit {
  width: 100%;
  padding: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.375rem;
}
.sf-auth-submit:hover:not(:disabled) {
  background: #110e0c;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(44, 38, 32, 0.2);
}
.sf-auth-submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.sf-auth-back-link {
  background: none;
  border: none;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #8c7d6e;
  cursor: pointer;
  transition: color 0.2s;
  text-align: center;
}
.sf-auth-back-link:hover {
  color: #2c2723;
}

/* Alerts */
.sf-auth-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
}
.sf-auth-alert.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}
.sf-auth-alert.success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}
.sf-alert-dismiss {
  border: none;
  background: none;
  color: inherit;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
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

.sf-auth-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.sf-auth-footer {
  text-align: center;
  font-size: 0.6875rem;
  color: #8c7d6e;
  margin-top: 1.25rem;
  line-height: 1.4;
}
.sf-auth-link {
  color: #b8956c;
  text-decoration: underline;
}
.sf-auth-link:hover {
  color: #2c2723;
}

@media (max-width: 480px) {
  .sf-auth-modal {
    padding: 1.5rem 1.25rem;
  }
}
</style>
