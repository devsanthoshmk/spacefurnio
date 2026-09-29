<template>
  <Teleport to="body">
    <!-- Backdrop with blur -->
    <Transition name="cart-backdrop">
      <div v-if="isCartOpen" class="sf-cart-backdrop" @click.self="closeCart"></div>
    </Transition>

    <!-- Slide-in Drawer -->
    <Transition name="cart-slide">
      <aside
        v-if="isCartOpen"
        class="sf-cart-drawer"
        role="dialog"
        aria-label="Shopping Cart"
        @keydown.esc="closeCart"
        tabindex="-1"
        ref="drawerRef"
      >
        <!-- Header -->
        <header class="sf-cart-header">
          <div class="sf-cart-header-inner">
            <div class="sf-cart-title-group">
              <div class="sf-cart-icon-wrap">
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
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h2 class="sf-cart-title">Shopping Cart</h2>
              <Transition name="badge-pop">
                <span v-if="cart.itemCount > 0" class="sf-cart-badge">
                  {{ cart.itemCount }}
                </span>
              </Transition>
            </div>
            <button @click="closeCart" class="sf-cart-close" aria-label="Close cart">
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
          </div>

          <!-- Free Shipping Progress Bar -->
          <div v-if="!cart.isEmpty && !cart.isLoading" class="sf-shipping-bar">
            <div class="sf-shipping-bar-track">
              <div class="sf-shipping-bar-fill" :style="{ width: shippingProgress + '%' }"></div>
            </div>
            <div class="sf-shipping-msg">
              <template v-if="shippingProgress >= 100">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  class="text-emerald-600"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span class="font-medium text-emerald-700">Free Shipping Unlocked!</span>
              </template>
              <template v-else>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="text-amber-700"
                >
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>
                  Add <strong class="text-stone-900">${{ amountToFreeShipping.toFixed(2) }}</strong> more for <strong>Free Shipping</strong>
                </span>
              </template>
            </div>
          </div>
        </header>

        <!-- Body -->
        <div class="sf-cart-body shop-scrollbar">
          <!-- Loading Skeletons -->
          <div v-if="cart.isLoading || cart.isSyncing" class="sf-cart-skeleton-list">
            <div v-for="i in 3" :key="i" class="sf-cart-skeleton-item animate-pulse">
              <div class="sf-cart-skeleton-img bg-stone-200"></div>
              <div class="sf-cart-skeleton-info flex-1">
                <div class="h-3.5 bg-stone-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-stone-200 rounded w-1/3 mb-3"></div>
                <div class="h-7 bg-stone-200 rounded-full w-28"></div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="cart.isEmpty" class="sf-cart-empty">
            <div class="sf-cart-empty-icon">
              <svg
                width="44"
                height="44"
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
            <h3 class="sf-cart-empty-title">Your Cart is Empty</h3>
            <p class="sf-cart-empty-text">Looks like you haven't added any luxury furniture yet.</p>
            <button @click="handleDiscoverProducts" class="sf-discover-btn">
              <span>Discover Products</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <!-- Cart Items List -->
          <TransitionGroup v-else name="cart-item-anim" tag="div" class="sf-cart-items">
            <div
              v-for="(item, index) in cart.displayItems"
              :key="item.id || item.productId"
              class="sf-cart-item group"
              :style="{ '--stagger': index }"
            >
              <!-- Thumbnail -->
              <div class="sf-cart-item-img">
                <img
                  v-if="item.image || item.primaryImage"
                  :src="getOptimizedThumbnail(item.image || item.primaryImage, 160)"
                  :alt="item.name"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="sf-cart-item-img-placeholder">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    class="text-stone-400"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>

              <!-- Item Details -->
              <div class="sf-cart-item-details">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="sf-cart-item-brand">
                      {{ item.brand || item.product?.brandName || item.product?.brand || 'SpaceFurnio' }}
                    </span>
                    <h4 class="sf-cart-item-name">{{ item.name }}</h4>
                  </div>
                  <div class="text-right">
                    <span class="sf-cart-item-total">
                      ${{ formatPrice((item.unitPrice || 0) * (item.quantity || 1)) }}
                    </span>
                    <p class="text-[11px] text-stone-400">
                      ${{ formatPrice(item.unitPrice) }}/ea
                    </p>
                  </div>
                </div>

                <!-- Quantity and Remove Actions -->
                <div class="sf-cart-item-actions">
                  <div class="sf-qty-stepper">
                    <button
                      @click="decrementQuantity(item)"
                      :disabled="item.quantity <= 1 || updatingItemId === item.id"
                      class="sf-qty-btn"
                      aria-label="Decrease quantity"
                    >
                      <span v-if="updatingItemId === item.id && updatingAction === 'dec'" class="sf-mini-spinner"></span>
                      <svg
                        v-else
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span class="sf-qty-value">{{ item.quantity }}</span>
                    <button
                      @click="incrementQuantity(item)"
                      :disabled="updatingItemId === item.id"
                      class="sf-qty-btn"
                      aria-label="Increase quantity"
                    >
                      <span v-if="updatingItemId === item.id && updatingAction === 'inc'" class="sf-mini-spinner"></span>
                      <svg
                        v-else
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>

                  <!-- Remove Item -->
                  <button
                    @click="removeItem(item.id)"
                    :disabled="updatingItemId === item.id"
                    class="sf-cart-remove"
                    aria-label="Remove item from cart"
                    title="Remove item"
                  >
                    <span v-if="updatingItemId === item.id && updatingAction === 'del'" class="sf-mini-spinner text-rose-500"></span>
                    <svg
                      v-else
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Footer / Coupon & Order Summary -->
        <footer v-if="!cart.isEmpty && !cart.isLoading" class="sf-cart-footer">
          <!-- Coupon Code Section -->
          <div class="sf-coupon-box">
            <div v-if="cart.hasDiscount" class="sf-active-coupon">
              <div class="flex items-center gap-2">
                <span class="sf-coupon-tag">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {{ cart.discountCode }}
                </span>
                <span class="text-xs font-semibold text-emerald-700">−${{ formatPrice(cart.discountAmount) }} applied</span>
              </div>
              <button @click="handleRemoveCoupon" class="sf-coupon-remove-btn" title="Remove coupon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form v-else @submit.prevent="handleApplyCoupon" class="sf-coupon-form">
              <div class="relative flex-1">
                <input
                  v-model="couponInput"
                  type="text"
                  placeholder="Enter promo code (e.g. WELCOME10)"
                  class="sf-coupon-input"
                  :disabled="isApplyingCoupon"
                />
              </div>
              <button
                type="submit"
                :disabled="!couponInput.trim() || isApplyingCoupon"
                class="sf-coupon-apply-btn"
              >
                <span v-if="isApplyingCoupon" class="sf-mini-spinner"></span>
                <span v-else>Apply</span>
              </button>
            </form>

            <p v-if="couponError" class="sf-coupon-error">{{ couponError }}</p>
          </div>

          <!-- Order Summary -->
          <div class="sf-cart-summary">
            <div class="sf-cart-summary-row">
              <span>Subtotal</span>
              <span>${{ formatPrice(cart.subtotal) }}</span>
            </div>
            <div v-if="cart.hasDiscount" class="sf-cart-summary-row sf-discount-row">
              <span class="flex items-center gap-1">
                Discount ({{ cart.discountCode }})
              </span>
              <span>−${{ formatPrice(cart.discountAmount) }}</span>
            </div>
            <div class="sf-cart-summary-row">
              <span>Estimated Shipping</span>
              <span v-if="estimatedShipping === 0" class="text-emerald-700 font-medium">Free</span>
              <span v-else>${{ formatPrice(estimatedShipping) }}</span>
            </div>
            <div class="sf-cart-summary-total">
              <div>
                <span class="block text-sm font-semibold text-stone-900">Estimated Total</span>
                <span class="block text-[11px] text-stone-400 font-normal">Taxes calculated at checkout</span>
              </div>
              <span class="text-lg font-bold text-stone-900">${{ formatPrice(estimatedTotal) }}</span>
            </div>
          </div>

          <!-- Primary CTA Button -->
          <div class="sf-cart-footer-actions">
            <button @click="handleCheckout" class="sf-checkout-btn">
              <span>Proceed to Checkout</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button @click="closeCart" class="sf-continue-btn">Continue Shopping</button>
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { getOptimizedThumbnail } from '@/utils/imageOptimizer.js'

const router = useRouter()
const { isCartOpen, closeCart: closeCartFn } = inject('cartUtils')
const { openCheckout } = inject('checkoutUtils')

const cart = useCartStore()
const drawerRef = ref(null)

// ─── Free Shipping Settings ───
const FREE_SHIPPING_THRESHOLD = 150
const FLAT_SHIPPING_RATE = 9.99

const shippingProgress = computed(() =>
  Math.min(100, Math.round((cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100)),
)
const amountToFreeShipping = computed(() => Math.max(0, FREE_SHIPPING_THRESHOLD - cart.subtotal))
const estimatedShipping = computed(() => (cart.subtotal >= FREE_SHIPPING_THRESHOLD || cart.subtotal === 0 ? 0 : FLAT_SHIPPING_RATE))
const estimatedTotal = computed(() => Math.max(0, Math.round((cart.total + estimatedShipping.value) * 100) / 100))

// ─── Updating State ───
const updatingItemId = ref(null)
const updatingAction = ref(null)

// ─── Coupon State ───
const couponInput = ref('')
const isApplyingCoupon = ref(false)
const couponError = ref('')

// ─── Drawer Watcher ───
watch(isCartOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    couponError.value = ''
    await nextTick()
    drawerRef.value?.focus()
    await cart.fetchCart()
  } else {
    document.body.style.overflow = ''
  }
})

// ─── Actions ───
function closeCart() {
  closeCartFn()
}

function handleDiscoverProducts() {
  closeCart()
  router.push('/shop')
}

function handleCheckout() {
  closeCart()
  nextTick(() => {
    openCheckout()
  })
}

async function incrementQuantity(item) {
  if (updatingItemId.value) return
  updatingItemId.value = item.id
  updatingAction.value = 'inc'
  try {
    await cart.updateItemQuantity(item.id, (Number(item.quantity) || 1) + 1)
  } catch (err) {
    console.error('Failed to increment quantity:', err)
  } finally {
    updatingItemId.value = null
    updatingAction.value = null
  }
}

async function decrementQuantity(item) {
  if (updatingItemId.value || item.quantity <= 1) return
  updatingItemId.value = item.id
  updatingAction.value = 'dec'
  try {
    await cart.updateItemQuantity(item.id, Number(item.quantity) - 1)
  } catch (err) {
    console.error('Failed to decrement quantity:', err)
  } finally {
    updatingItemId.value = null
    updatingAction.value = null
  }
}

async function removeItem(itemId) {
  if (updatingItemId.value) return
  updatingItemId.value = itemId
  updatingAction.value = 'del'
  try {
    await cart.removeItem(itemId)
  } catch (err) {
    console.error('Failed to remove item:', err)
  } finally {
    updatingItemId.value = null
    updatingAction.value = null
  }
}

async function handleApplyCoupon() {
  if (!couponInput.value.trim() || isApplyingCoupon.value) return
  couponError.value = ''
  isApplyingCoupon.value = true

  try {
    await cart.applyCoupon(couponInput.value.trim())
    couponInput.value = ''
  } catch (err) {
    couponError.value = err.message || 'Invalid coupon code.'
  } finally {
    isApplyingCoupon.value = false
  }
}

function handleRemoveCoupon() {
  cart.removeCoupon()
  couponError.value = ''
}

function formatPrice(val) {
  return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleEscKey(event) {
  if (event.key === 'Escape' && isCartOpen.value) closeCart()
}

onMounted(async () => {
  document.addEventListener('keydown', handleEscKey)
  await cart.fetchCart()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Backdrop */
.sf-cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100001;
}
.cart-backdrop-enter-active,
.cart-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.cart-backdrop-enter-from,
.cart-backdrop-leave-to {
  opacity: 0;
}

/* Drawer */
.sf-cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 28rem;
  background: #faf8f5;
  z-index: 100002;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 40px rgba(44, 38, 32, 0.16);
  outline: none;
}
.cart-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cart-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.7, 0, 0.84, 0);
}
.cart-slide-enter-from,
.cart-slide-leave-to {
  transform: translateX(100%);
}

/* Header */
.sf-cart-header {
  padding: 1.25rem 1.5rem 0.75rem;
  flex-shrink: 0;
  background: #faf8f5;
  border-bottom: 1px solid #e8e3dc;
}
.sf-cart-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sf-cart-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sf-cart-icon-wrap {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e3dc;
  border-radius: 10px;
  color: #5c4f42;
}
.sf-cart-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
  letter-spacing: -0.01em;
}
.sf-cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  background: #b8956c;
  border-radius: 999px;
}
.badge-pop-enter-active {
  animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badgePop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.sf-cart-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #8c7d6e;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-cart-close:hover {
  background: #e8e3dc;
  color: #2c2723;
}

/* Shipping Progress Bar */
.sf-shipping-bar {
  margin-top: 1rem;
  padding-bottom: 0.5rem;
}
.sf-shipping-bar-track {
  width: 100%;
  height: 5px;
  background: #e8e3dc;
  border-radius: 999px;
  overflow: hidden;
}
.sf-shipping-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #b8956c 0%, #059669 100%);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.sf-shipping-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b5e52;
}

/* Body */
.sf-cart-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* Skeletons */
.sf-cart-skeleton-list {
  padding: 0 1.5rem;
}
.sf-cart-skeleton-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e8e3dc;
}
.sf-cart-skeleton-img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  flex-shrink: 0;
}

/* Empty State */
.sf-cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 55vh;
}
.sf-cart-empty-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee8e0;
  border-radius: 50%;
  margin-bottom: 1.5rem;
}
.sf-cart-empty-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #2c2723;
  margin-bottom: 0.375rem;
}
.sf-cart-empty-text {
  font-size: 0.875rem;
  color: #8c7d6e;
  margin-bottom: 1.75rem;
  max-width: 240px;
}
.sf-discover-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.sf-discover-btn:hover {
  background: #151311;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(44, 38, 32, 0.25);
}

/* Cart Items */
.sf-cart-items {
  position: relative;
}
.sf-cart-item {
  display: flex;
  gap: 1rem;
  padding: 1.125rem 1.5rem;
  border-bottom: 1px solid #ece7e0;
  background: transparent;
  transition: background-color 0.2s;
  animation: cartItemIn 0.35s ease forwards;
  animation-delay: calc(var(--stagger, 0) * 50ms);
  opacity: 0;
}
@keyframes cartItemIn {
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
}
.sf-cart-item:hover {
  background: rgba(232, 227, 220, 0.4);
}

.cart-item-anim-enter-active,
.cart-item-anim-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.cart-item-anim-enter-from {
  opacity: 0;
  transform: translateX(25px);
}
.cart-item-anim-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  overflow: hidden;
}

.sf-cart-item-img {
  width: 76px;
  height: 76px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0ebe4;
  border: 1px solid #e2dbd1;
}
.sf-cart-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.sf-cart-item:hover .sf-cart-item-img img {
  transform: scale(1.05);
}
.sf-cart-item-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sf-cart-item-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.sf-cart-item-brand {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a8947f;
}
.sf-cart-item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c2723;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.sf-cart-item-total {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #2c2723;
}
.sf-cart-item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.625rem;
}

/* Quantity Stepper */
.sf-qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dcd5ca;
  border-radius: 999px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.sf-qty-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #5c4f42;
  cursor: pointer;
  transition: all 0.15s;
}
.sf-qty-btn:hover:not(:disabled) {
  background: #f5f0e9;
  color: #2c2723;
}
.sf-qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.sf-qty-value {
  min-width: 1.75rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2723;
}

/* Remove button */
.sf-cart-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #c47575;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}
.sf-cart-remove:hover {
  background: rgba(196, 117, 117, 0.12);
  opacity: 1;
}

/* Footer & Order Summary */
.sf-cart-footer {
  flex-shrink: 0;
  padding: 1.25rem 1.5rem 1.5rem;
  background: white;
  border-top: 1px solid #e8e3dc;
  box-shadow: 0 -8px 24px rgba(44, 38, 32, 0.05);
}

/* Coupon Box */
.sf-coupon-box {
  margin-bottom: 1rem;
}
.sf-coupon-form {
  display: flex;
  gap: 0.5rem;
}
.sf-coupon-input {
  width: 100%;
  padding: 0.5625rem 0.875rem;
  font-size: 0.8125rem;
  border: 1px solid #dcd5ca;
  border-radius: 999px;
  background: #faf8f5;
  color: #2c2723;
  outline: none;
  transition: all 0.2s;
}
.sf-coupon-input:focus {
  border-color: #b8956c;
  background: white;
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.15);
}
.sf-coupon-apply-btn {
  padding: 0.5625rem 1.125rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  background: #3d342d;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
}
.sf-coupon-apply-btn:hover:not(:disabled) {
  background: #1f1b17;
}
.sf-coupon-apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-active-coupon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.875rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 999px;
}
.sf-coupon-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #065f46;
  text-transform: uppercase;
}
.sf-coupon-remove-btn {
  border: none;
  background: transparent;
  color: #047857;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}
.sf-coupon-remove-btn:hover {
  background: #d1fae5;
}
.sf-coupon-error {
  font-size: 0.75rem;
  color: #b91c1c;
  margin-top: 0.375rem;
  padding-left: 0.5rem;
}

/* Summary Rows */
.sf-cart-summary {
  margin-bottom: 1.125rem;
}
.sf-cart-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #6b5e52;
  padding: 3px 0;
}
.sf-discount-row {
  color: #059669;
  font-weight: 600;
}
.sf-cart-summary-total {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid #e8e3dc;
}

/* Footer Action Buttons */
.sf-cart-footer-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sf-checkout-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9375rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.sf-checkout-btn:hover {
  background: #110e0c;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(44, 38, 32, 0.25);
}
.sf-checkout-btn:active {
  transform: translateY(0);
}
.sf-continue-btn {
  width: 100%;
  padding: 0.6875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b5e52;
  background: transparent;
  border: 1px solid #dcd5ca;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-continue-btn:hover {
  background: #faf8f5;
  border-color: #b8956c;
  color: #2c2723;
}

/* Spinner helper */
.sf-mini-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .sf-cart-drawer {
    max-width: 100%;
  }
  .sf-cart-header,
  .sf-cart-item {
    padding-left: 1.125rem;
    padding-right: 1.125rem;
  }
  .sf-cart-footer {
    padding: 1.125rem;
  }
}
</style>
