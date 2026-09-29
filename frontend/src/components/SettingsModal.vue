<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="settings-backdrop">
      <div v-if="isOpen" class="sf-settings-backdrop" @click.self="closeModal"></div>
    </Transition>

    <!-- Modal Window -->
    <Transition name="settings-content">
      <div
        v-if="isOpen"
        class="sf-settings-modal"
        role="dialog"
        aria-label="Account Settings"
        @keydown.esc="closeModal"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close Button -->
        <button @click="closeModal" class="sf-settings-modal-close" aria-label="Close settings">
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

        <!-- Header -->
        <header class="sf-settings-header">
          <div class="sf-settings-icon-wrap">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h2 class="sf-settings-title">Account Settings</h2>
          <p class="sf-settings-subtitle">Manage your saved addresses, account details, and preferences</p>
        </header>

        <!-- Notification Banner -->
        <Transition name="fade-banner">
          <div v-if="actionMessage" class="sf-action-banner" :class="actionMessageType">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path v-if="actionMessageType === 'success'" d="M20 6L9 17l-5-5" />
              <circle v-else cx="12" cy="12" r="10" />
            </svg>
            <span>{{ actionMessage }}</span>
          </div>
        </Transition>

        <!-- Tab Navigation -->
        <div class="sf-settings-tabs">
          <button
            @click="activeTab = 'addresses'"
            :class="['sf-tab-btn', { active: activeTab === 'addresses' }]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Saved Addresses</span>
            <span v-if="addresses.length > 0" class="sf-tab-count">{{ addresses.length }}</span>
          </button>

          <button
            @click="activeTab = 'profile'"
            :class="['sf-tab-btn', { active: activeTab === 'profile' }]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile &amp; Password</span>
          </button>

          <button
            @click="activeTab = 'danger'"
            :class="['sf-tab-btn sf-tab-danger', { active: activeTab === 'danger' }]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Delete Account</span>
          </button>
        </div>

        <!-- Body -->
        <div class="sf-settings-body shop-scrollbar">
          <!-- Loading State -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-stone-400">
            <div class="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium">Loading settings...</p>
          </div>

          <!-- Unauthenticated Gate -->
          <div v-else-if="!authStore.isAuthenticated" class="sf-settings-empty">
            <div class="sf-settings-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" class="text-stone-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 class="sf-settings-empty-title">Sign in to Access Settings</h3>
            <p class="sf-settings-empty-text">Log in to manage your delivery addresses and account security.</p>
            <button @click="goToLogin" class="sf-primary-btn">Sign In</button>
          </div>

          <!-- ════════════════════════════════════════════════════════════════════ -->
          <!-- TAB 1: SAVED ADDRESSES -->
          <!-- ════════════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'addresses'" class="space-y-4">
            <!-- Header bar with Add Address Button -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-serif font-bold text-stone-900">Delivery Addresses</h3>
                <p class="text-xs text-stone-500">Addresses saved here are automatically used for faster checkout.</p>
              </div>
              <button
                v-if="!showAddressForm"
                @click="openAddAddressForm"
                class="sf-add-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Address</span>
              </button>
            </div>

            <!-- Address Form (Add or Edit) -->
            <Transition name="fade-scale">
              <div v-if="showAddressForm" class="sf-address-form-box">
                <div class="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                  <h4 class="text-sm font-semibold text-stone-900">
                    {{ editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address' }}
                  </h4>
                  <button @click="cancelAddressForm" class="text-xs text-stone-400 hover:text-stone-700">Cancel</button>
                </div>

                <form @submit.prevent="handleSaveAddress" class="space-y-3">
                  <div class="sf-form-field">
                    <label class="sf-field-label">Street / House Address *</label>
                    <input
                      v-model="addressForm.address_line_1"
                      type="text"
                      class="sf-input"
                      placeholder="e.g. 402 Palm Heights, MG Road"
                      required
                    />
                  </div>

                  <div class="sf-form-field">
                    <label class="sf-field-label">Apartment, Suite, Landmark (Optional)</label>
                    <input
                      v-model="addressForm.address_line_2"
                      type="text"
                      class="sf-input"
                      placeholder="e.g. Near City Mall"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="sf-form-field">
                      <label class="sf-field-label">City *</label>
                      <input
                        v-model="addressForm.city"
                        type="text"
                        class="sf-input"
                        placeholder="Mumbai"
                        required
                      />
                    </div>
                    <div class="sf-form-field">
                      <label class="sf-field-label">State *</label>
                      <input
                        v-model="addressForm.state"
                        type="text"
                        class="sf-input"
                        placeholder="Maharashtra"
                        required
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="sf-form-field">
                      <label class="sf-field-label">Postal / Pincode *</label>
                      <input
                        v-model="addressForm.postal_code"
                        type="text"
                        class="sf-input"
                        placeholder="400001"
                        required
                      />
                    </div>
                    <div class="sf-form-field">
                      <label class="sf-field-label">Country</label>
                      <input
                        v-model="addressForm.country"
                        type="text"
                        class="sf-input"
                        placeholder="India"
                        required
                      />
                    </div>
                  </div>

                  <label class="sf-checkbox-label">
                    <input v-model="addressForm.is_default" type="checkbox" class="sf-checkbox" />
                    <span>Set as my default delivery address</span>
                  </label>

                  <div class="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      @click="cancelAddressForm"
                      class="sf-secondary-btn text-xs px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="isSavingAddress"
                      class="sf-primary-btn text-xs px-5 py-2 flex items-center gap-1.5"
                    >
                      <span v-if="isSavingAddress" class="sf-mini-spinner"></span>
                      <span>{{ editingAddressId ? 'Save Changes' : 'Add Address' }}</span>
                    </button>
                  </div>
                </form>
              </div>
            </Transition>

            <!-- Empty Addresses List -->
            <div v-if="addresses.length === 0 && !showAddressForm" class="sf-settings-empty">
              <div class="sf-settings-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" class="text-stone-400">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 class="sf-settings-empty-title">No Saved Addresses</h3>
              <p class="sf-settings-empty-text">Add your delivery address now or it will be automatically saved from your next order.</p>
              <button @click="openAddAddressForm" class="sf-primary-btn">+ Add Your First Address</button>
            </div>

            <!-- Address Cards List -->
            <div v-else class="space-y-3">
              <div
                v-for="addr in addresses"
                :key="addr.id"
                class="sf-addr-card"
                :class="{ 'is-default': addr.is_default }"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-stone-900 text-sm">
                        {{ addr.address_line_1 }}
                      </span>
                      <span v-if="addr.is_default" class="sf-default-badge">
                        DEFAULT
                      </span>
                    </div>
                    <p v-if="addr.address_line_2" class="text-xs text-stone-600">
                      {{ addr.address_line_2 }}
                    </p>
                    <p class="text-xs text-stone-500">
                      {{ addr.city }}, {{ addr.state }} {{ addr.postal_code }} · {{ addr.country || 'India' }}
                    </p>
                  </div>

                  <!-- Actions Dropdown / Buttons -->
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      v-if="!addr.is_default"
                      @click="handleSetDefault(addr.id)"
                      class="sf-action-chip"
                      title="Set as Default"
                    >
                      Make Default
                    </button>
                    <button
                      @click="openEditAddressForm(addr)"
                      class="sf-icon-action-btn"
                      title="Edit address"
                      aria-label="Edit address"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      @click="handleDeleteAddress(addr.id)"
                      class="sf-icon-action-btn sf-delete-action"
                      title="Delete address"
                      aria-label="Delete address"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════════════════════════════════════════════════════════════════════ -->
          <!-- TAB 2: PROFILE & PASSWORD -->
          <!-- ════════════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'profile'" class="space-y-6">
            <!-- User Info Card -->
            <div class="sf-profile-card">
              <div class="sf-profile-avatar">
                <img
                  v-if="authStore.userAvatar"
                  :src="authStore.userAvatar"
                  :alt="authStore.userName"
                  class="w-full h-full object-cover rounded-full"
                />
                <span v-else>{{ userInitials }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-bold text-stone-900">{{ authStore.userName }}</h4>
                <p class="text-xs text-stone-500">{{ authStore.userEmail }}</p>
                <div class="mt-1 flex items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Active Member
                  </span>
                </div>
              </div>
            </div>

            <!-- Phone Number Update Form -->
            <div class="sf-setting-section">
              <h4 class="text-sm font-semibold text-stone-900 mb-1">Contact Phone Number</h4>
              <p class="text-xs text-stone-500 mb-3">Used for delivery updates and SMS tracking notifications.</p>
              
              <form @submit.prevent="handleUpdatePhone" class="flex gap-2">
                <input
                  v-model="phoneInput"
                  type="tel"
                  class="sf-input flex-1"
                  placeholder="+91 98765 43210"
                />
                <button
                  type="submit"
                  :disabled="isUpdatingProfile"
                  class="sf-secondary-btn text-xs px-4"
                >
                  <span v-if="isUpdatingProfile" class="sf-mini-spinner"></span>
                  <span v-else>Update</span>
                </button>
              </form>
            </div>

            <!-- Password Change Form -->
            <div class="sf-setting-section">
              <h4 class="text-sm font-semibold text-stone-900 mb-1">Change Password</h4>
              <p class="text-xs text-stone-500 mb-3">Ensure your account is using a long, random password to stay secure.</p>

              <form @submit.prevent="handleChangePassword" class="space-y-3">
                <div class="sf-form-field">
                  <label class="sf-field-label">Current Password *</label>
                  <input
                    v-model="passwordForm.current"
                    type="password"
                    class="sf-input"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="sf-form-field">
                    <label class="sf-field-label">New Password *</label>
                    <input
                      v-model="passwordForm.next"
                      type="password"
                      class="sf-input"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  <div class="sf-form-field">
                    <label class="sf-field-label">Confirm New Password *</label>
                    <input
                      v-model="passwordForm.confirm"
                      type="password"
                      class="sf-input"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                </div>

                <div class="flex justify-end pt-1">
                  <button
                    type="submit"
                    :disabled="isChangingPassword || !passwordForm.current || !passwordForm.next"
                    class="sf-primary-btn text-xs px-5 py-2 flex items-center gap-1.5"
                  >
                    <span v-if="isChangingPassword" class="sf-mini-spinner"></span>
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- ════════════════════════════════════════════════════════════════════ -->
          <!-- TAB 3: DANGER ZONE (DELETE ACCOUNT) -->
          <!-- ════════════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'danger'" class="space-y-4">
            <div class="sf-danger-box">
              <div class="flex items-start gap-3">
                <div class="sf-danger-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div class="space-y-1">
                  <h4 class="text-sm font-bold text-rose-900">Delete Account Permanently</h4>
                  <p class="text-xs text-rose-700 leading-relaxed">
                    Once your account is deleted, all saved addresses, order history, wishlist items, and personal preferences will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <!-- Confirmation Safeguard -->
            <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <label class="text-xs font-semibold text-stone-800 block">
                To confirm deletion, please type <span class="font-mono font-bold text-rose-600">DELETE</span> below:
              </label>
              <input
                v-model="deleteConfirmInput"
                type="text"
                class="sf-input uppercase font-mono tracking-wider"
                placeholder="Type DELETE"
              />

              <div class="flex items-center justify-between pt-2">
                <span class="text-[11px] text-stone-500">You will be logged out immediately.</span>
                <button
                  @click="handleDeleteAccount"
                  :disabled="deleteConfirmInput.trim().toUpperCase() !== 'DELETE' || isDeletingAccount"
                  class="sf-delete-account-btn flex items-center gap-1.5"
                >
                  <span v-if="isDeletingAccount" class="sf-mini-spinner"></span>
                  <span>Permanently Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, inject, watch, nextTick } from 'vue'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const settingsUtils = inject('settingsUtils', null)
const authUtils = inject('authUtils', null)

const isOpen = computed(() => settingsUtils?.isSettingsOpen?.value ?? false)
const modalRef = ref(null)

const activeTab = ref('addresses') // 'addresses' | 'profile' | 'danger'
const isLoading = ref(false)
const actionMessage = ref('')
const actionMessageType = ref('success') // 'success' | 'error'

// ─── Addresses State ───
const addresses = ref([])
const showAddressForm = ref(false)
const editingAddressId = ref(null)
const isSavingAddress = ref(false)

const addressForm = ref({
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false,
})

// ─── Profile State ───
const phoneInput = ref('')
const isUpdatingProfile = ref(false)

// ─── Password State ───
const passwordForm = ref({
  current: '',
  next: '',
  confirm: '',
})
const isChangingPassword = ref(false)

// ─── Delete Account State ───
const deleteConfirmInput = ref('')
const isDeletingAccount = ref(false)

// ─── Initials ───
const userInitials = computed(() => {
  const name = (authStore.userName || 'User').trim()
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

function notify(msg, type = 'success') {
  actionMessage.value = msg
  actionMessageType.value = type
  setTimeout(() => {
    if (actionMessage.value === msg) {
      actionMessage.value = ''
    }
  }, 4000)
}

function closeModal() {
  if (settingsUtils?.closeSettings) {
    settingsUtils.closeSettings()
  }
}

function goToLogin() {
  closeModal()
  if (authUtils?.openLogin) {
    authUtils.openLogin()
  }
}

// ─── Fetch Data on Open ───
watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    actionMessage.value = ''
    showAddressForm.value = false
    editingAddressId.value = null
    deleteConfirmInput.value = ''
    passwordForm.value = { current: '', next: '', confirm: '' }

    if (authStore.isAuthenticated) {
      phoneInput.value = authStore.user?.phoneNumber || authStore.user?.phone_number || ''
      await fetchAddresses()
    }
    await nextTick()
    modalRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

async function fetchAddresses() {
  try {
    isLoading.value = true
    const list = await api.getAddresses()
    addresses.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('Failed to load addresses:', err)
    addresses.value = []
  } finally {
    isLoading.value = false
  }
}

// ─── Address Form Handlers ───
function openAddAddressForm() {
  editingAddressId.value = null
  addressForm.value = {
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: addresses.value.length === 0,
  }
  showAddressForm.value = true
}

function openEditAddressForm(addr) {
  editingAddressId.value = addr.id
  addressForm.value = {
    address_line_1: addr.address_line_1 || '',
    address_line_2: addr.address_line_2 || '',
    city: addr.city || '',
    state: addr.state || '',
    postal_code: addr.postal_code || '',
    country: addr.country || 'India',
    is_default: addr.is_default || false,
  }
  showAddressForm.value = true
}

function cancelAddressForm() {
  showAddressForm.value = false
  editingAddressId.value = null
}

async function handleSaveAddress() {
  if (!addressForm.value.address_line_1.trim() || !addressForm.value.city.trim()) {
    notify('Please fill in required address fields', 'error')
    return
  }

  try {
    isSavingAddress.value = true

    if (editingAddressId.value) {
      await api.updateAddress(editingAddressId.value, addressForm.value)
      notify('Address updated successfully.')
    } else {
      await api.createAddress(addressForm.value)
      notify('New address added successfully.')
    }

    showAddressForm.value = false
    editingAddressId.value = null
    await fetchAddresses()
  } catch (err) {
    notify(err.message || 'Failed to save address.', 'error')
  } finally {
    isSavingAddress.value = false
  }
}

async function handleSetDefault(addressId) {
  try {
    await api.setDefaultAddress(addressId)
    notify('Default delivery address updated.')
    await fetchAddresses()
  } catch (err) {
    notify(err.message || 'Failed to update default address.', 'error')
  }
}

async function handleDeleteAddress(addressId) {
  if (!confirm('Are you sure you want to delete this saved address?')) return

  try {
    await api.deleteAddress(addressId)
    notify('Address removed.')
    await fetchAddresses()
  } catch (err) {
    notify(err.message || 'Failed to delete address.', 'error')
  }
}

// ─── Profile & Password Handlers ───
async function handleUpdatePhone() {
  try {
    isUpdatingProfile.value = true
    await authStore.updateProfile({ phone_number: phoneInput.value.trim() })
    notify('Phone number updated.')
  } catch (err) {
    notify(err.message || 'Failed to update phone number.', 'error')
  } finally {
    isUpdatingProfile.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.value.next.length < 6) {
    notify('New password must be at least 6 characters.', 'error')
    return
  }
  if (passwordForm.value.next !== passwordForm.value.confirm) {
    notify('New passwords do not match.', 'error')
    return
  }

  try {
    isChangingPassword.value = true
    await authStore.changePassword(passwordForm.value.current, passwordForm.value.next)
    passwordForm.value = { current: '', next: '', confirm: '' }
    notify('Password changed successfully.')
  } catch (err) {
    notify(err.message || 'Failed to change password.', 'error')
  } finally {
    isChangingPassword.value = false
  }
}

// ─── Danger Zone: Delete Account ───
async function handleDeleteAccount() {
  if (deleteConfirmInput.value.trim().toUpperCase() !== 'DELETE') return

  try {
    isDeletingAccount.value = true
    await authStore.deleteAccount()
    closeModal()
    alert('Your account has been deleted successfully.')
  } catch (err) {
    notify(err.message || 'Failed to delete account.', 'error')
  } finally {
    isDeletingAccount.value = false
  }
}
</script>

<style scoped>
/* ─── Backdrop ─── */
.sf-settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.65);
  backdrop-filter: blur(8px);
  z-index: 100000;
}

/* ─── Modal Box ─── */
.sf-settings-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  max-width: 640px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 1.5rem;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 100001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
}

/* ─── Close Button ─── */
.sf-settings-modal-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78716c;
  background: #f5f5f4;
  transition: all 0.2s ease;
  z-index: 10;
}
.sf-settings-modal-close:hover {
  background: #e7e5e4;
  color: #1c1917;
  transform: scale(1.05);
}

/* ─── Header ─── */
.sf-settings-header {
  padding: 1.75rem 1.75rem 1.25rem;
  border-bottom: 1px solid #f5f5f4;
  text-align: center;
}
.sf-settings-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: #fef3c7;
  color: #b45309;
  margin-bottom: 0.75rem;
}
.sf-settings-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1c1917;
  margin: 0;
}
.sf-settings-subtitle {
  font-size: 0.8125rem;
  color: #78716c;
  margin-top: 0.25rem;
}

/* ─── Banner ─── */
.sf-action-banner {
  margin: 0.75rem 1.75rem 0;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sf-action-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.sf-action-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* ─── Tabs ─── */
.sf-settings-tabs {
  display: flex;
  border-bottom: 1px solid #e7e5e4;
  padding: 0 1.25rem;
  background: #fafaf9;
  gap: 0.5rem;
  overflow-x: auto;
}
.sf-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #78716c;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.sf-tab-btn:hover {
  color: #1c1917;
}
.sf-tab-btn.active {
  color: #92400e;
  border-bottom-color: #92400e;
  background: #ffffff;
}
.sf-tab-danger.active {
  color: #b91c1c;
  border-bottom-color: #b91c1c;
}
.sf-tab-count {
  background: #e7e5e4;
  color: #44403c;
  font-size: 0.6875rem;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  font-weight: 700;
}

/* ─── Body ─── */
.sf-settings-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

/* ─── Empty State ─── */
.sf-settings-empty {
  padding: 2.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.sf-settings-empty-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: #f5f5f4;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.sf-settings-empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1c1917;
}
.sf-settings-empty-text {
  font-size: 0.8125rem;
  color: #78716c;
  max-width: 320px;
  margin-bottom: 0.75rem;
}

/* ─── Address Cards ─── */
.sf-addr-card {
  padding: 1rem 1.125rem;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 1rem;
  transition: all 0.2s ease;
}
.sf-addr-card:hover {
  background: #ffffff;
  border-color: #d6d3d1;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
}
.sf-addr-card.is-default {
  background: #fefce8;
  border-color: #fde047;
}
.sf-default-badge {
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  background: #fef08a;
  color: #854d0e;
  border-radius: 9999px;
}
.sf-action-chip {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  background: #ffffff;
  color: #78716c;
  border: 1px solid #d6d3d1;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}
.sf-action-chip:hover {
  background: #f5f5f4;
  color: #1c1917;
}
.sf-icon-action-btn {
  width: 1.875rem;
  height: 1.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: #78716c;
  background: #ffffff;
  border: 1px solid #e7e5e4;
  transition: all 0.15s ease;
}
.sf-icon-action-btn:hover {
  background: #f5f5f4;
  color: #1c1917;
}
.sf-delete-action:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

/* ─── Address Form Box ─── */
.sf-address-form-box {
  background: #ffffff;
  border: 1px solid #e7e5e4;
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.05);
}

/* ─── Profile Card ─── */
.sf-profile-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 1rem;
}
.sf-profile-avatar {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  background: #1c1917;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sf-setting-section {
  background: #ffffff;
  border: 1px solid #e7e5e4;
  border-radius: 1rem;
  padding: 1.25rem;
}

/* ─── Danger Zone ─── */
.sf-danger-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1.25rem;
  border-radius: 1rem;
}
.sf-danger-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sf-delete-account-btn {
  background: #dc2626;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.625rem 1rem;
  border-radius: 0.625rem;
  transition: all 0.2s ease;
}
.sf-delete-account-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sf-delete-account-btn:not(:disabled):hover {
  background: #b91c1c;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* ─── Inputs & Buttons ─── */
.sf-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sf-field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #44403c;
}
.sf-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  background: #ffffff;
  border: 1px solid #d6d3d1;
  border-radius: 0.625rem;
  color: #1c1917;
  outline: none;
  transition: all 0.2s ease;
}
.sf-input:focus {
  border-color: #92400e;
  box-shadow: 0 0 0 2px rgba(146, 64, 14, 0.15);
}
.sf-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #57534e;
  cursor: pointer;
  user-select: none;
}
.sf-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #92400e;
}
.sf-primary-btn {
  background: #1c1917;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}
.sf-primary-btn:hover {
  background: #292524;
}
.sf-secondary-btn {
  background: #f5f5f4;
  color: #44403c;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}
.sf-secondary-btn:hover {
  background: #e7e5e4;
  color: #1c1917;
}
.sf-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.5rem 0.875rem;
  background: #92400e;
  color: #ffffff;
  border-radius: 0.625rem;
  transition: all 0.2s ease;
}
.sf-add-btn:hover {
  background: #78350f;
  transform: translateY(-1px);
}
.sf-mini-spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 9999px;
  animation: spin 0.6s linear infinite;
}

/* ─── Transitions ─── */
.settings-backdrop-enter-active,
.settings-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.settings-backdrop-enter-from,
.settings-backdrop-leave-to {
  opacity: 0;
}

.settings-content-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.settings-content-leave-active {
  transition: all 0.2s ease;
}
.settings-content-enter-from {
  opacity: 0;
  transform: translate(-50%, -46%) scale(0.96);
}
.settings-content-leave-to {
  opacity: 0;
  transform: translate(-50%, -46%) scale(0.96);
}

.fade-banner-enter-active,
.fade-banner-leave-active,
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-banner-enter-from,
.fade-banner-leave-to,
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
