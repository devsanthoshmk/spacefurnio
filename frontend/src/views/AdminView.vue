<script setup>
/**
 * AdminView.vue - Main admin wrapper with passcode protection
 * Shows passcode input initially, then renders AdminLayout
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/admin/AdminLayout.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

// State
const passcode = ref('');
const isLoading = ref(false);
const isAuthenticated = ref(false);
const patToken = ref('');
const errorMessage = ref('');

// API base URL
const API_BASE= import.meta.env.VITE_API_URL || 'https://spacefurnio.in/backend/';

// Check for existing session on mount
onMounted(() => {
  const storedToken = sessionStorage.getItem('admin_pat_token');
  if (storedToken) {
    patToken.value = storedToken;
    isAuthenticated.value = true;
  }
});

// Verify passcode
async function verifyPasscode() {
  if (!passcode.value.trim()) {
    errorMessage.value = 'Please enter the passcode';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/content/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ passcode: passcode.value.trim() })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    // Store token in session
    patToken.value = data.pat;
    sessionStorage.setItem('admin_pat_token', data.pat);
    isAuthenticated.value = true;

    toast.add({
      severity: 'success',
      summary: 'Access Granted',
      detail: 'Welcome to the admin panel',
      life: 3000
    });

  } catch (err) {
    errorMessage.value = err.message || 'Invalid passcode';
    toast.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: err.message || 'Invalid passcode',
      life: 5000
    });
  } finally {
    isLoading.value = false;
  }
}

// Logout
function logout() {
  sessionStorage.removeItem('admin_pat_token');
  patToken.value = '';
  isAuthenticated.value = false;
  passcode.value = '';
}

// Handle keypress for enter
function handleKeypress(e) {
  if (e.key === 'Enter') {
    verifyPasscode();
  }
}
</script>

<template>
  <Toast />

  <!-- Authenticated: Show Admin Layout -->
  <AdminLayout
    v-if="isAuthenticated"
    :pat-token="patToken"
    @logout="logout"
  />

  <!-- Not Authenticated: Show Passcode Form -->
  <div v-else class="passcode-container">
    <div class="passcode-card">
      <!-- Logo/Brand -->
      <div class="brand-section">
        <div class="brand-icon">
          <i class="pi pi-shield"></i>
        </div>
        <h1 class="brand-title">Spacefurnio</h1>
        <p class="brand-subtitle">Admin Panel</p>
      </div>

      <!-- Passcode Form -->
      <div class="form-section">
        <label for="passcode" class="form-label">Enter Access Code</label>
        <div class="input-wrapper">
          <InputText
            id="passcode"
            v-model="passcode"
            type="password"
            placeholder="••••••••••••"
            class="passcode-input"
            :disabled="isLoading"
            @keypress="handleKeypress"
          />
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          {{ errorMessage }}
        </p>

        <!-- Submit Button -->
        <Button
          label="Access Admin Panel"
          icon="pi pi-unlock"
          class="submit-button"
          :loading="isLoading"
          @click="verifyPasscode"
        />
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <p class="footer-text">
          <i class="pi pi-lock"></i>
          Secured with passcode verification
        </p>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.passcode-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

.passcode-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 10;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Brand Section */
.brand-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.brand-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 40px rgba(249, 115, 22, 0.3);
}

.brand-icon i {
  font-size: 2.5rem;
  color: white;
}

.brand-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Form Section */
.form-section {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
}

.input-wrapper {
  margin-bottom: 1rem;
}

.passcode-input {
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
}

.passcode-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
  background: rgba(255, 255, 255, 0.1);
}

.passcode-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #ef4444;
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.error-message i {
  font-size: 1rem;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Footer */
.footer-section {
  text-align: center;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.footer-text i {
  font-size: 0.875rem;
}

/* Background Decoration */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.05) 100%);
  filter: blur(60px);
}

.circle-1 {
  width: 500px;
  height: 500px;
  top: -200px;
  right: -150px;
}

.circle-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
}

.circle-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 480px) {
  .passcode-card {
    padding: 2rem;
    border-radius: 20px;
  }

  .brand-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
  }

  .brand-icon i {
    font-size: 2rem;
  }

  .brand-title {
    font-size: 1.5rem;
  }
}
</style>
