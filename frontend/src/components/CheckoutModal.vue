<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="checkout-backdrop">
      <div v-if="isOpen" class="sf-checkout-backdrop" @click.self="handleBackdropClick"></div>
    </Transition>

    <!-- Modal Dialog -->
    <Transition name="checkout-modal">
      <div
        v-if="isOpen"
        class="sf-checkout-modal"
        role="dialog"
        aria-label="Checkout"
        @keydown.esc="handleEsc"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close Button (hidden on success step) -->
        <button
          v-if="currentStep !== 3"
          @click="closeModal"
          class="sf-checkout-close-btn"
          aria-label="Close checkout"
        >
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

        <!-- Step Indicator (steps 0 to 2) -->
        <div v-if="currentStep !== 3 && authStore.isAuthenticated && !cart.isEmpty" class="sf-checkout-steps-header">
          <div class="sf-checkout-steps">
            <div
              v-for="(stepName, i) in stepNames"
              :key="i"
              :class="['sf-step', { active: currentStep === i, completed: currentStep > i }]"
            >
              <div class="sf-step-circle">
                <svg
                  v-if="currentStep > i"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="sf-step-label">{{ stepName }}</span>
            </div>
            <div class="sf-steps-line">
              <div class="sf-steps-line-fill" :style="{ width: stepProgress + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="sf-checkout-body shop-scrollbar">
          <!-- ─── Unauthenticated State ─── -->
          <div v-if="!authStore.isAuthenticated" class="sf-checkout-gate">
            <div class="sf-gate-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                class="text-stone-400"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 class="sf-gate-title">Sign in to Checkout</h3>
            <p class="sf-gate-text">Please sign in to your SpaceFurnio account to complete your order safely.</p>
            <button @click="goToLogin" class="sf-primary-btn">Sign In to Continue</button>
          </div>

          <!-- ─── Empty Cart State ─── -->
          <div v-else-if="cart.isEmpty && currentStep !== 3" class="sf-checkout-gate">
            <div class="sf-gate-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                class="text-stone-400"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 class="sf-gate-title">Your Cart is Empty</h3>
            <p class="sf-gate-text">Add items to your cart before proceeding to checkout.</p>
            <button @click="handleContinueShopping" class="sf-primary-btn">Discover Products</button>
          </div>

          <!-- ─── STEP 1: Shipping Address ─── -->
          <div v-else-if="currentStep === 0" class="sf-step-content">
            <div class="mb-4">
              <h3 class="sf-section-title">Shipping Address</h3>
              <p class="text-xs text-stone-500">Where should we deliver your order?</p>
            </div>

            <!-- Saved Addresses Selector -->
            <div v-if="savedAddresses.length > 0 && !isEnteringCustomAddress" class="mb-4">
              <label class="sf-field-label mb-2 block">Saved Addresses</label>
              <div class="space-y-2">
                <div
                  v-for="addr in savedAddresses"
                  :key="addr.id"
                  @click="selectedAddressId = addr.id"
                  :class="[
                    'sf-address-card',
                    { selected: selectedAddressId === addr.id }
                  ]"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-semibold text-stone-900 text-sm">
                        {{ addr.address_line_1 }}
                      </p>
                      <p v-if="addr.address_line_2" class="text-xs text-stone-500">
                        {{ addr.address_line_2 }}
                      </p>
                      <p class="text-xs text-stone-600 mt-1">
                        {{ addr.city }}, {{ addr.state }} {{ addr.postal_code }} · {{ addr.country || 'India' }}
                      </p>
                    </div>
                    <span v-if="selectedAddressId === addr.id" class="sf-selected-check">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  @click="switchToNewAddress"
                  class="sf-add-address-toggle"
                >
                  + Add & Use a Different Address
                </button>
              </div>
            </div>

            <!-- Address Form (New or Selected custom) -->
            <form v-if="isEnteringCustomAddress || savedAddresses.length === 0" class="sf-checkout-form">
              <div v-if="savedAddresses.length > 0" class="mb-2">
                <button
                  type="button"
                  @click="isEnteringCustomAddress = false"
                  class="text-xs font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1"
                >
                  ← Select from saved addresses
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="sf-form-field">
                  <label class="sf-field-label">First Name *</label>
                  <input
                    v-model="shippingForm.firstName"
                    type="text"
                    class="sf-input"
                    placeholder="John"
                    required
                  />
                </div>
                <div class="sf-form-field">
                  <label class="sf-field-label">Last Name *</label>
                  <input
                    v-model="shippingForm.lastName"
                    type="text"
                    class="sf-input"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div class="sf-form-field">
                <label class="sf-field-label">Street Address *</label>
                <input
                  v-model="shippingForm.address"
                  type="text"
                  class="sf-input"
                  placeholder="Flat 402, Highline Residency, Park Road"
                  required
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="sf-form-field">
                  <label class="sf-field-label">City *</label>
                  <input
                    v-model="shippingForm.city"
                    type="text"
                    class="sf-input"
                    placeholder="Mumbai"
                    required
                  />
                </div>
                <div class="sf-form-field">
                  <label class="sf-field-label">State *</label>
                  <input
                    v-model="shippingForm.state"
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
                    v-model="shippingForm.pincode"
                    type="text"
                    class="sf-input"
                    placeholder="400001"
                    required
                  />
                </div>
                <div class="sf-form-field">
                  <label class="sf-field-label">Phone Number *</label>
                  <input
                    v-model="shippingForm.phone"
                    type="tel"
                    class="sf-input"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <label class="sf-checkbox-label">
                <input v-model="saveAddressToAccount" type="checkbox" class="sf-checkbox" />
                <span>Save this address to my profile for future orders</span>
              </label>
            </form>
          </div>

          <!-- ─── STEP 2: Order Review & Coupon ─── -->
          <div v-else-if="currentStep === 1" class="sf-step-content">
            <div class="mb-4">
              <h3 class="sf-section-title">Order Review</h3>
              <p class="text-xs text-stone-500">Review your chosen items and apply discounts.</p>
            </div>

            <!-- Items List -->
            <div class="sf-review-items shop-scrollbar max-h-56 overflow-y-auto space-y-2 pr-1 mb-4">
              <div
                v-for="item in cart.displayItems"
                :key="item.id || item.productId"
                class="sf-review-item"
              >
                <div class="sf-review-img">
                  <img v-if="item.image || item.primaryImage" :src="item.image || item.primaryImage" :alt="item.name" />
                  <div v-else class="sf-review-img-ph">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="sf-review-item-name">{{ item.name }}</span>
                  <span class="text-[11px] text-stone-500">Qty: {{ item.quantity }} · ${{ formatPrice(item.unitPrice) }} each</span>
                </div>
                <span class="sf-review-item-price">
                  ${{ formatPrice((item.unitPrice || 0) * (item.quantity || 1)) }}
                </span>
              </div>
            </div>

            <!-- Coupon Code Section -->
            <div class="sf-checkout-coupon-box mb-4">
              <label class="sf-field-label mb-1.5 block">Have a Coupon or Promo Code?</label>
              
              <div v-if="cart.hasDiscount" class="sf-active-coupon-chip">
                <div class="flex items-center gap-2">
                  <span class="sf-coupon-badge">
                    {{ cart.discountCode }}
                  </span>
                  <span class="text-xs font-semibold text-emerald-700">
                    −${{ formatPrice(cart.discountAmount) }} Discount Applied
                  </span>
                </div>
                <button @click="handleRemoveCoupon" class="sf-chip-close-btn" title="Remove coupon">×</button>
              </div>

              <div v-else class="flex gap-2">
                <input
                  v-model="couponCodeInput"
                  type="text"
                  placeholder="Enter code (e.g. WELCOME10)"
                  class="sf-input flex-1 uppercase"
                  :disabled="isValidatingCoupon"
                />
                <button
                  type="button"
                  @click="handleApplyCoupon"
                  :disabled="!couponCodeInput.trim() || isValidatingCoupon"
                  class="sf-coupon-btn"
                >
                  <span v-if="isValidatingCoupon" class="sf-mini-spinner"></span>
                  <span v-else>Apply</span>
                </button>
              </div>
              <p v-if="couponError" class="text-xs text-rose-600 mt-1 pl-1">{{ couponError }}</p>
            </div>

            <!-- Summary Totals Breakdown -->
            <div class="sf-summary-box">
              <div class="sf-summary-line">
                <span>Items Subtotal</span>
                <span>${{ formatPrice(cart.subtotal) }}</span>
              </div>
              <div v-if="cart.hasDiscount" class="sf-summary-line text-emerald-700 font-semibold">
                <span>Discount ({{ cart.discountCode }})</span>
                <span>−${{ formatPrice(cart.discountAmount) }}</span>
              </div>
              <div class="sf-summary-line">
                <span>Estimated Shipping</span>
                <span v-if="shippingFee === 0" class="text-emerald-700 font-medium">Free</span>
                <span v-else>${{ formatPrice(shippingFee) }}</span>
              </div>
              <div class="sf-summary-total">
                <span>Estimated Total</span>
                <span>${{ formatPrice(orderFinalTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- ─── STEP 3: Payment Method ─── -->
          <div v-else-if="currentStep === 2" class="sf-step-content">
            <div class="mb-4">
              <h3 class="sf-section-title">Payment Method</h3>
              <p class="text-xs text-stone-500">Choose your preferred payment method.</p>
            </div>

            <!-- Payment Options -->
            <div class="space-y-2.5 mb-5">
              <label
                v-for="method in paymentMethods"
                :key="method.id"
                :class="['sf-payment-card', { selected: selectedPaymentMethod === method.id }]"
              >
                <input
                  type="radio"
                  :value="method.id"
                  v-model="selectedPaymentMethod"
                  class="sr-only"
                />
                <div class="sf-payment-icon" v-html="method.icon"></div>
                <div class="flex-1">
                  <span class="sf-payment-title">{{ method.name }}</span>
                  <span class="sf-payment-desc">{{ method.desc }}</span>
                </div>
                <div class="sf-radio-circle" :class="{ checked: selectedPaymentMethod === method.id }"></div>
              </label>
            </div>

            <!-- Security Badge -->
            <div class="sf-security-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-700 flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-bit SSL Encrypted &amp; Secure Checkout</span>
            </div>

            <!-- Total Charge Confirmation -->
            <div class="sf-charge-box">
              <div>
                <span class="block text-xs text-stone-500 font-medium">Total Amount to Pay</span>
                <span class="block text-lg font-bold text-stone-900">${{ formatPrice(orderFinalTotal) }}</span>
              </div>
              <span class="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                {{ cart.itemCount }} item{{ cart.itemCount !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- ─── STEP 4: Order Success Screen ─── -->
          <div v-else-if="currentStep === 3" class="sf-success-screen">
            <div class="sf-success-icon-wrap">
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                class="text-emerald-600"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h3 class="sf-success-title">Order Placed Successfully!</h3>
            <p class="sf-success-subtitle">Thank you for your purchase with SpaceFurnio.</p>

            <div class="sf-order-badge-box">
              <span class="text-xs text-stone-500 uppercase tracking-wider font-semibold">Order ID</span>
              <div class="flex items-center justify-center gap-2 mt-0.5">
                <span class="font-mono text-sm font-bold text-stone-900">#{{ completedOrderId?.slice(0, 12).toUpperCase() }}</span>
                <button @click="copyOrderId" class="text-stone-400 hover:text-stone-700 p-1" title="Copy Order ID">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Details Summary Card -->
            <div class="sf-success-details-card">
              <div class="flex justify-between py-1.5 border-b border-stone-100 text-xs">
                <span class="text-stone-500">Amount Paid:</span>
                <span class="font-bold text-stone-900">${{ formatPrice(completedOrderTotal) }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-stone-100 text-xs">
                <span class="text-stone-500">Payment Method:</span>
                <span class="font-medium text-stone-800 uppercase">{{ completedPaymentMethod }}</span>
              </div>
              <div class="flex justify-between py-1.5 text-xs">
                <span class="text-stone-500">Estimated Delivery:</span>
                <span class="font-semibold text-emerald-700">3 - 5 Business Days</span>
              </div>
            </div>

            <!-- CTAs -->
            <div class="sf-success-actions">
              <button @click="handleViewOrderDetails" class="sf-primary-btn">
                <span>View My Orders</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <button @click="handleContinueShopping" class="sf-secondary-btn">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Actions (Steps 0, 1, 2) -->
        <footer
          v-if="currentStep < 3 && authStore.isAuthenticated && !cart.isEmpty"
          class="sf-checkout-footer"
        >
          <!-- Error Notification -->
          <Transition name="error-slide">
            <div v-if="serverError" class="sf-checkout-error mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{{ serverError }}</span>
            </div>
          </Transition>

          <div class="flex gap-2.5">
            <button
              v-if="currentStep > 0"
              type="button"
              @click="currentStep--"
              class="sf-back-btn"
            >
              Back
            </button>

            <button
              v-if="currentStep < 2"
              type="button"
              @click="handleNextStep"
              :disabled="!isStepValid"
              class="sf-next-btn"
            >
              <span>Continue to {{ stepNames[currentStep + 1] }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              v-else-if="currentStep === 2"
              type="button"
              @click="handlePlaceOrder"
              :disabled="isSubmittingOrder"
              class="sf-place-order-btn"
            >
              <span v-if="isSubmittingOrder" class="sf-order-spinner"></span>
              <span v-else>Place Order · ${{ formatPrice(orderFinalTotal) }}</span>
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

const router = useRouter()

const { isCheckoutOpen: isOpen, closeCheckout } = inject('checkoutUtils')
const { openLogin } = inject('authUtils')
const { openOrders } = inject('ordersUtils')

const cart = useCartStore()
const authStore = useAuthStore()
const modalRef = ref(null)

// ─── Step State ───
const stepNames = ['Shipping', 'Review', 'Payment']
const currentStep = ref(0)
const isSubmittingOrder = ref(false)
const serverError = ref('')

const stepProgress = computed(() => {
  if (currentStep.value >= 2) return 100
  return (currentStep.value / (stepNames.length - 1)) * 100
})

// ─── Address State ───
const savedAddresses = ref([])
const selectedAddressId = ref(null)
const isEnteringCustomAddress = ref(false)
const saveAddressToAccount = ref(true)

const shippingForm = ref({
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
})

// ─── Coupon State ───
const couponCodeInput = ref('')
const isValidatingCoupon = ref(false)
const couponError = ref('')

// ─── Payment State ───
const selectedPaymentMethod = ref('card')
const paymentMethods = [
  {
    id: 'card',
    name: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay, Amex',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  },
  {
    id: 'upi',
    name: 'UPI Instant Pay',
    desc: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    desc: 'Pay cash or UPI upon delivery',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
  },
]

// ─── Success Screen Data ───
const completedOrderId = ref('')
const completedOrderTotal = ref(0)
const completedPaymentMethod = ref('')

// ─── Calculations ───
const FREE_SHIPPING_THRESHOLD = 150
const FLAT_SHIPPING_RATE = 9.99

const shippingFee = computed(() => (cart.subtotal >= FREE_SHIPPING_THRESHOLD || cart.subtotal === 0 ? 0 : FLAT_SHIPPING_RATE))
const orderFinalTotal = computed(() => Math.max(0, Math.round((cart.total + shippingFee.value) * 100) / 100))

// ─── Validation ───
const isStepValid = computed(() => {
  if (currentStep.value === 0) {
    if (savedAddresses.value.length > 0 && !isEnteringCustomAddress.value) {
      return !!selectedAddressId.value
    }
    const f = shippingForm.value
    return !!(
      f.firstName?.trim() &&
      f.lastName?.trim() &&
      f.address?.trim() &&
      f.city?.trim() &&
      f.state?.trim() &&
      f.pincode?.trim() &&
      f.phone?.trim()
    )
  }
  if (currentStep.value === 1) {
    return !cart.isEmpty
  }
  if (currentStep.value === 2) {
    return !!selectedPaymentMethod.value
  }
  return true
})

// ─── Lifecycle / Watcher ───
watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    currentStep.value = 0
    serverError.value = ''
    couponError.value = ''
    isEnteringCustomAddress.value = false

    if (authStore.isAuthenticated) {
      await fetchSavedAddresses()
    }
    if (cart.items.length > 0 && cart.enrichedItems.length === 0) {
      await cart.enrichItems()
    }
    await nextTick()
    modalRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

async function fetchSavedAddresses() {
  try {
    const list = await api.getAddresses()
    savedAddresses.value = Array.isArray(list) ? list : []
    if (savedAddresses.value.length > 0) {
      const defaultAddr = savedAddresses.value.find((a) => a.is_default) || savedAddresses.value[0]
      selectedAddressId.value = defaultAddr?.id || null
    }
  } catch (err) {
    console.warn('Could not fetch saved addresses:', err)
    savedAddresses.value = []
  }
}

function switchToNewAddress() {
  isEnteringCustomAddress.value = true
  selectedAddressId.value = null
}

function handleNextStep() {
  if (isStepValid.value && currentStep.value < 2) {
    currentStep.value++
  }
}

async function handleApplyCoupon() {
  if (!couponCodeInput.value.trim() || isValidatingCoupon.value) return
  couponError.value = ''
  isValidatingCoupon.value = true

  try {
    await cart.applyCoupon(couponCodeInput.value.trim())
    couponCodeInput.value = ''
  } catch (err) {
    couponError.value = err.message || 'Invalid coupon code.'
  } finally {
    isValidatingCoupon.value = false
  }
}

function handleRemoveCoupon() {
  cart.removeCoupon()
  couponError.value = ''
}

async function handlePlaceOrder() {
  if (isSubmittingOrder.value) return
  serverError.value = ''

  try {
    isSubmittingOrder.value = true

    let resolvedShipping = null
    let addressIdToPass = null

    if (savedAddresses.value.length > 0 && !isEnteringCustomAddress.value && selectedAddressId.value) {
      addressIdToPass = selectedAddressId.value
      const matched = savedAddresses.value.find((a) => a.id === selectedAddressId.value)
      if (matched) {
        resolvedShipping = {
          firstName: authStore.user?.firstName || 'Customer',
          lastName: authStore.user?.lastName || '',
          address: matched.address_line_2 ? `${matched.address_line_1}, ${matched.address_line_2}` : matched.address_line_1,
          city: matched.city,
          state: matched.state,
          pincode: matched.postal_code,
          phone: authStore.user?.phone || '',
        }
      }
    } else {
      resolvedShipping = { ...shippingForm.value }
      // If user opted to save address, save it in background
      if (saveAddressToAccount.value) {
        api.createAddress({
          address_line_1: shippingForm.value.address,
          city: shippingForm.value.city,
          state: shippingForm.value.state,
          postal_code: shippingForm.value.pincode,
          country: 'India',
        }).catch((e) => console.warn('Background save address warning:', e))
      }
    }

    const orderPayload = {
      cartItems: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      shippingAddress: resolvedShipping,
      addressId: addressIdToPass,
      paymentMethod: selectedPaymentMethod.value,
      couponCode: cart.discountCode || undefined,
    }

    const response = await api.checkout(orderPayload)

    // Capture success response details
    completedOrderId.value = response.orderId || response.id || 'SF-' + Math.floor(100000 + Math.random() * 900000)
    completedOrderTotal.value = response.total_amount || orderFinalTotal.value
    completedPaymentMethod.value = selectedPaymentMethod.value

    // Clear cart
    await cart.clearCart()

    // Move to step 4: success screen
    currentStep.value = 3
  } catch (err) {
    console.error('Order placement error:', err)
    serverError.value = err.message || 'Failed to place order. Please try again.'
  } finally {
    isSubmittingOrder.value = false
  }
}

function handleViewOrderDetails() {
  closeModal()
  nextTick(() => {
    openOrders()
  })
}

function handleContinueShopping() {
  closeModal()
  router.push('/shop')
}

function copyOrderId() {
  if (completedOrderId.value && navigator.clipboard) {
    navigator.clipboard.writeText(completedOrderId.value)
  }
}

function closeModal() {
  closeCheckout()
}

function goToLogin() {
  closeModal()
  nextTick(() => {
    openLogin()
  })
}

function handleBackdropClick() {
  if (currentStep.value !== 3) {
    closeModal()
  }
}

function handleEsc(e) {
  if (e.key === 'Escape' && isOpen.value && currentStep.value !== 3) {
    closeModal()
  }
}

function formatPrice(val) {
  return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => document.addEventListener('keydown', handleEsc))
onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Backdrop */
.sf-checkout-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 100001;
}
.checkout-backdrop-enter-active,
.checkout-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.checkout-backdrop-enter-from,
.checkout-backdrop-leave-to {
  opacity: 0;
}

/* Modal Dialog */
.sf-checkout-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 540px;
  max-height: calc(100vh - 3.5rem);
  background: #faf8f5;
  border-radius: 1.5rem;
  z-index: 100002;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(44, 38, 32, 0.25);
  outline: none;
}
.checkout-modal-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.checkout-modal-leave-active {
  transition: all 0.25s ease;
}
.checkout-modal-enter-from {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.96);
}
.checkout-modal-leave-to {
  opacity: 0;
  transform: translate(-50%, -52%) scale(0.96);
}

.sf-checkout-close-btn {
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
.sf-checkout-close-btn:hover {
  background: #dcd5ca;
  color: #2c2723;
}

/* Step Indicator */
.sf-checkout-steps-header {
  padding: 1.5rem 2rem 0.5rem;
  flex-shrink: 0;
}
.sf-checkout-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.sf-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  z-index: 1;
}
.sf-step-circle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  background: #e8e3dc;
  color: #8c7d6e;
  transition: all 0.35s ease;
}
.sf-step.active .sf-step-circle {
  background: #2c2723;
  color: white;
  box-shadow: 0 0 0 4px rgba(44, 38, 32, 0.12);
}
.sf-step.completed .sf-step-circle {
  background: #059669;
  color: white;
}
.sf-step-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #a8947f;
  transition: color 0.25s;
}
.sf-step.active .sf-step-label {
  color: #2c2723;
}
.sf-step.completed .sf-step-label {
  color: #059669;
}

.sf-steps-line {
  position: absolute;
  top: 16px;
  left: 24px;
  right: 24px;
  height: 2px;
  background: #dcd5ca;
  z-index: 0;
}
.sf-steps-line-fill {
  height: 100%;
  background: #059669;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 999px;
}

/* Modal Body */
.sf-checkout-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 2rem 1.5rem;
}

.sf-section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
}

/* Gates / Empty State */
.sf-checkout-gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
}
.sf-gate-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee8e0;
  border-radius: 50%;
  margin-bottom: 1.25rem;
}
.sf-gate-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
  margin-bottom: 0.375rem;
}
.sf-gate-text {
  font-size: 0.8125rem;
  color: #8c7d6e;
  margin-bottom: 1.5rem;
  max-width: 280px;
}

/* Saved Address Cards */
.sf-address-card {
  padding: 0.875rem 1rem;
  background: white;
  border: 2px solid #e8e3dc;
  border-radius: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-address-card:hover {
  border-color: #b8956c;
}
.sf-address-card.selected {
  border-color: #b8956c;
  background: rgba(184, 149, 108, 0.05);
}
.sf-selected-check {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #b8956c;
  color: white;
  border-radius: 50%;
}
.sf-add-address-toggle {
  width: 100%;
  padding: 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #b8956c;
  background: transparent;
  border: 1px dashed #dcd5ca;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-add-address-toggle:hover {
  background: white;
  border-color: #b8956c;
}

/* Forms */
.sf-checkout-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.sf-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sf-field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #5c4f42;
  letter-spacing: 0.01em;
}
.sf-input {
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
.sf-input:focus {
  border-color: #b8956c;
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.15);
}
.sf-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b5e52;
  cursor: pointer;
  margin-top: 0.25rem;
}
.sf-checkbox {
  width: 15px;
  height: 15px;
  accent-color: #b8956c;
  cursor: pointer;
}

/* Review Items */
.sf-review-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #ece7e0;
}
.sf-review-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0ebe4;
  flex-shrink: 0;
}
.sf-review-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sf-review-img-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a8947f;
}
.sf-review-item-name {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2723;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-review-item-price {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #2c2723;
  flex-shrink: 0;
}

/* Coupon Box */
.sf-checkout-coupon-box {
  padding: 0.875rem;
  background: white;
  border: 1px solid #e8e3dc;
  border-radius: 0.875rem;
}
.sf-active-coupon-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 0.5rem;
}
.sf-coupon-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #065f46;
  text-transform: uppercase;
}
.sf-chip-close-btn {
  border: none;
  background: transparent;
  color: #047857;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}
.sf-coupon-btn {
  padding: 0.6875rem 1.125rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  background: #3d342d;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}
.sf-coupon-btn:hover:not(:disabled) {
  background: #1f1b17;
}
.sf-coupon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Totals Summary */
.sf-summary-box {
  padding: 0.875rem 1rem;
  background: white;
  border-radius: 0.875rem;
  border: 1px solid #e8e3dc;
}
.sf-summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #6b5e52;
  padding: 3px 0;
}
.sf-summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #2c2723;
  padding-top: 0.625rem;
  margin-top: 0.375rem;
  border-top: 1px solid #ece7e0;
}

/* Payment Methods */
.sf-payment-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: white;
  border: 2px solid #e8e3dc;
  border-radius: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-payment-card:hover {
  border-color: #b8956c;
}
.sf-payment-card.selected {
  border-color: #b8956c;
  background: rgba(184, 149, 108, 0.05);
}
.sf-payment-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f0e9;
  border-radius: 8px;
  color: #5c4f42;
}
.sf-payment-title {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2723;
}
.sf-payment-desc {
  display: block;
  font-size: 0.6875rem;
  color: #8c7d6e;
}
.sf-radio-circle {
  width: 18px;
  height: 18px;
  border: 2px solid #dcd5ca;
  border-radius: 50%;
  transition: all 0.2s;
}
.sf-radio-circle.checked {
  border-color: #b8956c;
  background: #b8956c;
  box-shadow: inset 0 0 0 3px white;
}

.sf-security-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 1rem;
}

.sf-charge-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: white;
  border-radius: 0.875rem;
  border: 1px solid #e8e3dc;
}

/* Success Screen */
.sf-success-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 0.5rem 0.5rem;
}
.sf-success-icon-wrap {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecfdf5;
  border-radius: 50%;
  margin-bottom: 1.25rem;
  box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.12);
}
.sf-success-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c2723;
  margin-bottom: 0.25rem;
}
.sf-success-subtitle {
  font-size: 0.8125rem;
  color: #8c7d6e;
  margin-bottom: 1.25rem;
}
.sf-order-badge-box {
  padding: 0.625rem 1.25rem;
  background: #eee8e0;
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
}
.sf-success-details-card {
  width: 100%;
  background: white;
  border: 1px solid #e8e3dc;
  border-radius: 0.875rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}
.sf-success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* Footer Buttons */
.sf-checkout-footer {
  flex-shrink: 0;
  padding: 1rem 2rem 1.5rem;
  background: white;
  border-top: 1px solid #e8e3dc;
}
.sf-back-btn {
  padding: 0.75rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b5e52;
  background: #faf8f5;
  border: 1px solid #dcd5ca;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-back-btn:hover {
  background: #f0ebe4;
  color: #2c2723;
}
.sf-next-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s;
}
.sf-next-btn:hover:not(:disabled) {
  background: #110e0c;
  transform: translateY(-1px);
}
.sf-next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sf-place-order-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #8c6d4d, #b8956c);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 16px rgba(184, 149, 108, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sf-place-order-btn:hover:not(:disabled) {
  box-shadow: 0 6px 22px rgba(184, 149, 108, 0.4);
  transform: translateY(-1px);
}
.sf-place-order-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.sf-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s;
}
.sf-primary-btn:hover {
  background: #110e0c;
}
.sf-secondary-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b5e52;
  background: transparent;
  border: 1px solid #dcd5ca;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-secondary-btn:hover {
  background: #faf8f5;
  color: #2c2723;
}

/* Error Banner */
.sf-checkout-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(196, 117, 117, 0.1);
  border: 1px solid rgba(196, 117, 117, 0.3);
  border-radius: 0.75rem;
  font-size: 0.75rem;
  color: #c47575;
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

.sf-order-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.sf-mini-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .sf-checkout-modal {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 2rem);
  }
  .sf-checkout-steps-header,
  .sf-checkout-body,
  .sf-checkout-footer {
    padding-left: 1.125rem;
    padding-right: 1.125rem;
  }
}
</style>
