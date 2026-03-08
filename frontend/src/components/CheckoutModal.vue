<template>
  <!--
    ================================================================
    CHECKOUT MODAL — Reimagined
    ================================================================
    Multi-step checkout with:
    - Step 1: Order Summary review
    - Step 2: Shipping address
    - Step 3: Payment (Razorpay integration placeholder)
    - Animated step indicator
    - Uses Worker API: POST /api/orders/checkout
    - Route-driven open/close (/checkout suffix)
    ================================================================
  -->
  <Teleport to="body">
    <Transition name="checkout-backdrop">
      <div v-if="isOpen" class="sf-checkout-backdrop" @click.self="closeModal"></div>
    </Transition>

    <Transition name="checkout-content">
      <div
        v-if="isOpen"
        class="sf-checkout-modal"
        role="dialog"
        aria-label="Checkout"
        @keydown.esc="closeModal"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close -->
        <button @click="closeModal" class="sf-checkout-close-btn" aria-label="Close checkout">
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

        <!-- Step Indicator -->
        <div class="sf-checkout-steps">
          <div
            v-for="(s, i) in steps"
            :key="i"
            :class="['sf-step', { active: currentStep >= i, completed: currentStep > i }]"
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
            <span class="sf-step-label">{{ s }}</span>
          </div>
          <div class="sf-steps-line">
            <div class="sf-steps-line-fill" :style="{ width: stepProgress + '%' }"></div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="sf-checkout-body shop-scrollbar">
          <!-- Not Authenticated -->
          <div v-if="!authStore.isAuthenticated" class="sf-checkout-auth-prompt">
            <div class="sf-checkout-auth-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--shop-tan)"
                stroke-width="1.2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 class="sf-checkout-auth-title">Sign in to checkout</h3>
            <p class="sf-checkout-auth-text">Please log in to continue with your purchase.</p>
            <button @click="goToLogin" class="shop-btn shop-btn-primary">Sign In</button>
          </div>

          <!-- Empty Cart -->
          <div v-else-if="cart.isEmpty" class="sf-checkout-auth-prompt">
            <div class="sf-checkout-auth-icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--shop-tan)"
                stroke-width="1.2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 class="sf-checkout-auth-title">Your cart is empty</h3>
            <p class="sf-checkout-auth-text">Add items to your cart before checking out.</p>
            <button @click="closeModal" class="shop-btn shop-btn-primary">Shop Now</button>
          </div>

          <!-- STEP 0: Order Summary -->
          <div v-else-if="currentStep === 0" class="sf-checkout-step-content">
            <h3 class="sf-checkout-section-title">Order Summary</h3>
            <div class="sf-checkout-items">
              <div v-for="item in cart.displayItems" :key="item.id" class="sf-checkout-item">
                <div class="sf-checkout-item-img">
                  <img v-if="item.image" :src="item.image" :alt="item.name" />
                  <div v-else class="sf-checkout-item-img-ph">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--shop-tan)"
                      stroke-width="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                </div>
                <div class="sf-checkout-item-info">
                  <span class="sf-checkout-item-name">{{ item.name }}</span>
                  <span class="sf-checkout-item-qty">Qty: {{ item.quantity }}</span>
                </div>
                <span class="sf-checkout-item-price"
                  >${{ formatPrice(item.unitPrice * item.quantity) }}</span
                >
              </div>
            </div>

            <div class="sf-checkout-summary-divider"></div>

            <div class="sf-checkout-totals">
              <div class="sf-checkout-totals-row">
                <span>Subtotal</span>
                <span>${{ formatPrice(cart.subtotal) }}</span>
              </div>
              <div class="sf-checkout-totals-row">
                <span>Shipping</span>
                <span>{{ cart.subtotal >= 150 ? 'Free' : '$9.99' }}</span>
              </div>
              <div v-if="cart.hasDiscount" class="sf-checkout-totals-row sf-discount">
                <span>Discount</span>
                <span>−${{ formatPrice(cart.discountAmount) }}</span>
              </div>
              <div class="sf-checkout-totals-total">
                <span>Total</span>
                <span>${{ formatPrice(finalTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- STEP 1: Shipping -->
          <div v-else-if="currentStep === 1" class="sf-checkout-step-content">
            <h3 class="sf-checkout-section-title">Shipping Address</h3>

            <form @submit.prevent class="sf-checkout-form">
              <div class="sf-checkout-form-row">
                <div class="sf-checkout-form-field">
                  <label class="sf-checkout-label">First Name</label>
                  <input
                    v-model="shippingForm.firstName"
                    type="text"
                    class="sf-auth-input"
                    placeholder="John"
                    required
                  />
                </div>
                <div class="sf-checkout-form-field">
                  <label class="sf-checkout-label">Last Name</label>
                  <input
                    v-model="shippingForm.lastName"
                    type="text"
                    class="sf-auth-input"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div class="sf-checkout-form-field">
                <label class="sf-checkout-label">Address</label>
                <input
                  v-model="shippingForm.address"
                  type="text"
                  class="sf-auth-input"
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div class="sf-checkout-form-row">
                <div class="sf-checkout-form-field">
                  <label class="sf-checkout-label">City</label>
                  <input
                    v-model="shippingForm.city"
                    type="text"
                    class="sf-auth-input"
                    placeholder="Mumbai"
                    required
                  />
                </div>
                <div class="sf-checkout-form-field">
                  <label class="sf-checkout-label">State</label>
                  <input
                    v-model="shippingForm.state"
                    type="text"
                    class="sf-auth-input"
                    placeholder="Maharashtra"
                    required
                  />
                </div>
              </div>

              <div class="sf-checkout-form-row">
                <div class="sf-checkout-form-field">
                  <label class="sf-checkout-label">Pincode</label>
                  <input
                    v-model="shippingForm.pincode"
                    type="text"
                    class="sf-auth-input"
                    placeholder="400001"
                    required
                  />
                </div>
                <div class="sf-checkout-form-field">
                  <label class="sf-checkout-label">Phone</label>
                  <input
                    v-model="shippingForm.phone"
                    type="tel"
                    class="sf-auth-input"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
            </form>
          </div>

          <!-- STEP 2: Payment -->
          <div v-else-if="currentStep === 2" class="sf-checkout-step-content">
            <h3 class="sf-checkout-section-title">Payment</h3>

            <!-- Payment Methods -->
            <div class="sf-checkout-payment-methods">
              <label
                v-for="method in paymentMethods"
                :key="method.id"
                :class="['sf-payment-option', { selected: selectedPayment === method.id }]"
              >
                <input
                  type="radio"
                  :value="method.id"
                  v-model="selectedPayment"
                  class="sf-payment-radio"
                />
                <div class="sf-payment-icon" v-html="method.icon"></div>
                <div class="sf-payment-info">
                  <span class="sf-payment-name">{{ method.name }}</span>
                  <span class="sf-payment-desc">{{ method.desc }}</span>
                </div>
              </label>
            </div>

            <!-- Order Total Confirmation -->
            <div class="sf-checkout-final-total">
              <span>You will be charged</span>
              <span class="sf-final-amount">${{ formatPrice(finalTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <footer v-if="authStore.isAuthenticated && !cart.isEmpty" class="sf-checkout-footer">
          <!-- Error -->
          <Transition name="error-slide">
            <div v-if="checkoutError" class="sf-auth-error" style="margin-bottom: 0.75rem">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{{ checkoutError }}</span>
            </div>
          </Transition>

          <div class="sf-checkout-footer-btns">
            <button v-if="currentStep > 0" @click="currentStep--" class="sf-continue-btn">
              Back
            </button>
            <button
              v-if="currentStep < 2"
              @click="nextStep"
              class="sf-checkout-btn"
              :disabled="!canProceed"
            >
              Continue
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button
              v-else
              @click="placeOrder"
              :disabled="isPlacingOrder"
              class="sf-checkout-btn sf-checkout-btn-pay"
            >
              <span v-if="isPlacingOrder" class="sf-auth-spinner"></span>
              <span v-else>Place Order — ${{ formatPrice(finalTotal) }}</span>
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * ===========================================
 * CHECKOUT MODAL — Reimagined
 * ===========================================
 * Multi-step checkout flow:
 * Step 0: Order summary
 * Step 1: Shipping address
 * Step 2: Payment method + place order
 *
 * Uses:
 * - Injected isCheckoutOpen ref from App.vue
 * - Injected closeCheckout() from App.vue
 * - Worker API: POST /api/orders/checkout
 * - Cart store for order items
 * - Auth store for auth check
 */

import { computed, ref, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

// ─── Inject modal state from App.vue ───
const { isCheckoutOpen: isOpen, closeCheckout } = inject('checkoutUtils')
const { openLogin } = inject('authUtils')
const { openOrders } = inject('ordersUtils')

const cart = useCartStore()
const authStore = useAuthStore()
const modalRef = ref(null)

// ─── Steps ───
const steps = ['Review', 'Shipping', 'Payment']
const currentStep = ref(0)
const isPlacingOrder = ref(false)
const checkoutError = ref('')

const stepProgress = computed(() => (currentStep.value / (steps.length - 1)) * 100)

// ─── Shipping Form ───
const shippingForm = ref({
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
})

// ─── Payment ───
const selectedPayment = ref('card')
const paymentMethods = [
  {
    id: 'card',
    name: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  },
  {
    id: 'upi',
    name: 'UPI',
    desc: 'GPay, PhonePe, Paytm',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    desc: 'Pay when you receive',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
  },
]

// ─── Computed ───
const finalTotal = computed(() => {
  const shipping = cart.subtotal >= 150 ? 0 : 9.99
  return cart.total + shipping
})

const canProceed = computed(() => {
  if (currentStep.value === 0) return !cart.isEmpty
  if (currentStep.value === 1) {
    const f = shippingForm.value
    return f.firstName && f.lastName && f.address && f.city && f.state && f.pincode && f.phone
  }
  return true
})

watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    currentStep.value = 0
    checkoutError.value = ''
    if (cart.items.length > 0 && cart.enrichedItems.length === 0) {
      await cart.enrichItems()
    }
    await nextTick()
    modalRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

// ─── Actions ───
function nextStep() {
  if (canProceed.value && currentStep.value < 2) {
    currentStep.value++
  }
}

async function placeOrder() {
  if (isPlacingOrder.value) return
  checkoutError.value = ''

  try {
    isPlacingOrder.value = true

    const orderData = {
      cartItems: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      shippingAddress: shippingForm.value,
      paymentMethod: selectedPayment.value,
      payment_method: selectedPayment.value,
    }

    await api.checkout(orderData)

    // Clear cart
    cart.$reset()

    // Navigate to orders
    closeModal()
    nextTick(() => {
      openOrders()
    })
  } catch (err) {
    const allowed = Array.isArray(err?.allowedMethods) ? err.allowedMethods : []
    if (allowed.length > 0) {
      checkoutError.value = `${err.message || 'Invalid payment method.'} Allowed: ${allowed.join(', ')}`
    } else {
      checkoutError.value = err.message || 'Something went wrong.'
    }
  } finally {
    isPlacingOrder.value = false
  }
}

// ─── Navigation ───
function closeModal() {
  closeCheckout()
}
function goToLogin() {
  closeModal()
  nextTick(() => {
    openLogin()
  })
}

// ─── Helpers ───
function formatPrice(val) {
  return (val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
   CHECKOUT MODAL — Reimagined Styles
   ═══════════════════════════════════════════ */

.sf-checkout-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.55);
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

.sf-checkout-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 520px;
  max-height: calc(100vh - 3rem);
  background: var(--shop-cream, #faf8f5);
  border-radius: var(--shop-radius-xl, 1.5rem);
  z-index: 100002;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(61, 58, 54, 0.2);
  outline: none;
}
.checkout-content-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.checkout-content-leave-active {
  transition: all 0.25s ease;
}
.checkout-content-enter-from {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.96);
}
.checkout-content-leave-to {
  opacity: 0;
  transform: translate(-50%, -52%) scale(0.96);
}

.sf-checkout-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: var(--shop-beige, #e8e3dc);
  color: var(--shop-brown-dark, #8b7d6d);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}
.sf-checkout-close-btn:hover {
  background: var(--shop-beige-dark, #d4cfc6);
  color: var(--shop-charcoal, #3d3a36);
}

/* Steps Indicator */
.sf-checkout-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem 0;
  position: relative;
  flex-shrink: 0;
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
  background: var(--shop-beige, #e8e3dc);
  color: var(--shop-brown, #a89b8c);
  transition: all 0.35s ease;
}
.sf-step.active .sf-step-circle {
  background: var(--shop-charcoal, #3d3a36);
  color: white;
}
.sf-step.completed .sf-step-circle {
  background: var(--shop-accent, #b8956c);
  color: white;
}
.sf-step-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--shop-tan, #c4b8a9);
  transition: color 0.25s;
}
.sf-step.active .sf-step-label {
  color: var(--shop-charcoal, #3d3a36);
}
.sf-step.completed .sf-step-label {
  color: var(--shop-accent-dark, #8c6d4d);
}

.sf-steps-line {
  position: absolute;
  top: calc(1.5rem + 16px);
  left: calc(2rem + 16px);
  right: calc(2rem + 16px);
  height: 2px;
  background: var(--shop-beige-dark, #d4cfc6);
  z-index: 0;
}
.sf-steps-line-fill {
  height: 100%;
  background: var(--shop-accent, #b8956c);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 999px;
}

/* Body */
.sf-checkout-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

/* Auth Prompt / Empty */
.sf-checkout-auth-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 0;
  min-height: 200px;
}
.sf-checkout-auth-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-beige, #e8e3dc);
  border-radius: 50%;
  margin-bottom: 1rem;
}
.sf-checkout-auth-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 0.375rem;
}
.sf-checkout-auth-text {
  font-size: 0.8125rem;
  color: var(--shop-brown, #a89b8c);
  margin-bottom: 1.25rem;
}

/* Step Content */
.sf-checkout-step-content {
  animation: stepFadeIn 0.35s ease;
}
@keyframes stepFadeIn {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sf-checkout-section-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 1rem;
}

/* Checkout Items */
.sf-checkout-items {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.sf-checkout-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  background: white;
  border-radius: var(--shop-radius-md, 0.75rem);
}
.sf-checkout-item-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--shop-cream-dark, #f5f2ed);
}
.sf-checkout-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sf-checkout-item-img-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sf-checkout-item-info {
  flex: 1;
  min-width: 0;
}
.sf-checkout-item-name {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-checkout-item-qty {
  font-size: 0.6875rem;
  color: var(--shop-brown, #a89b8c);
}
.sf-checkout-item-price {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  flex-shrink: 0;
}

.sf-checkout-summary-divider {
  height: 1px;
  background: var(--shop-beige, #e8e3dc);
  margin: 1rem 0;
}

/* Totals */
.sf-checkout-totals {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.sf-checkout-totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--shop-brown-dark, #8b7d6d);
}
.sf-checkout-totals-row.sf-discount {
  color: var(--shop-success, #7d9b76);
}
.sf-checkout-totals-total {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  padding-top: 0.5rem;
  margin-top: 0.25rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}

/* Checkout Form */
.sf-checkout-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.sf-checkout-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.sf-checkout-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.sf-checkout-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--shop-brown-dark, #8b7d6d);
  letter-spacing: 0.02em;
}

/* Payment Methods */
.sf-checkout-payment-methods {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sf-payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: white;
  border: 2px solid var(--shop-beige, #e8e3dc);
  border-radius: var(--shop-radius-md, 0.75rem);
  cursor: pointer;
  transition: all 0.2s;
}
.sf-payment-option.selected {
  border-color: var(--shop-accent, #b8956c);
  background: rgba(184, 149, 108, 0.04);
}
.sf-payment-option:hover {
  border-color: var(--shop-tan, #c4b8a9);
}
.sf-payment-radio {
  display: none;
}
.sf-payment-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-cream-dark, #f5f2ed);
  border-radius: 8px;
  color: var(--shop-brown-dark, #8b7d6d);
  flex-shrink: 0;
}
.sf-payment-info {
  display: flex;
  flex-direction: column;
}
.sf-payment-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
}
.sf-payment-desc {
  font-size: 0.6875rem;
  color: var(--shop-brown, #a89b8c);
}

.sf-checkout-final-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.25rem;
  padding: 0.875rem 1rem;
  background: white;
  border-radius: var(--shop-radius-md, 0.75rem);
}
.sf-checkout-final-total span:first-child {
  font-size: 0.8125rem;
  color: var(--shop-brown-dark, #8b7d6d);
}
.sf-final-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
}

/* Footer */
.sf-checkout-footer {
  flex-shrink: 0;
  padding: 1rem 2rem 1.5rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}
.sf-checkout-footer-btns {
  display: flex;
  gap: 0.5rem;
}
.sf-checkout-footer-btns .sf-continue-btn {
  flex: 0 0 auto;
  padding: 0.75rem 1.25rem;
}
.sf-checkout-footer-btns .sf-checkout-btn {
  flex: 1;
}
.sf-checkout-btn-pay {
  background: linear-gradient(
    135deg,
    var(--shop-accent-dark, #8c6d4d),
    var(--shop-accent, #b8956c)
  ) !important;
}
.sf-checkout-btn-pay:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(184, 149, 108, 0.35) !important;
}

/* Responsive */
@media (max-width: 480px) {
  .sf-checkout-modal {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 2rem);
    border-radius: var(--shop-radius-lg, 1rem);
  }
  .sf-checkout-steps,
  .sf-checkout-body,
  .sf-checkout-footer {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
  .sf-checkout-form-row {
    grid-template-columns: 1fr;
  }
  .sf-step-label {
    font-size: 0.5625rem;
  }
}
</style>
