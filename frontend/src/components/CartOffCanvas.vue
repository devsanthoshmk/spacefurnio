<template>
  <!--
    ================================================================
    CART OFF-CANVAS — Reimagined
    ================================================================
    Premium warm-minimalist cart drawer with:
    - Glassmorphism header + smooth slide animation
    - Staggered item entry animations
    - Skeleton shimmer loading state
    - Free-shipping progress bar
    - Quantity stepper with micro-animations
    - Responsive — full-width on mobile, 28rem max on desktop
    - Route-driven open/close (same pattern as before)
    ================================================================
  -->
  <Teleport to="body">
    <div v-if="isCartOpen" class="sf-cart-backdrop" @click.self="closeCart"></div>

    <aside
      v-if="isCartOpen"
      class="sf-cart-drawer"
      role="dialog"
      aria-label="Shopping Cart"
      @keydown.esc="closeCart"
      tabindex="-1"
      ref="drawerRef"
    >
      <!-- ─── Header ─── -->
      <header class="sf-cart-header">
        <div class="sf-cart-header-inner">
          <div class="sf-cart-title-group">
            <div class="sf-cart-icon-wrap">
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
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 class="sf-cart-title">Cart</h2>
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

        <!-- Free Shipping Progress -->
        <div v-if="!cart.isEmpty && !cart.isLoading" class="sf-shipping-bar">
          <div class="sf-shipping-bar-track">
            <div class="sf-shipping-bar-fill" :style="{ width: shippingProgress + '%' }"></div>
          </div>
          <p class="sf-shipping-msg">
            <template v-if="shippingProgress >= 100">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--shop-success)"
                stroke-width="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span style="color: var(--shop-success)">Free shipping unlocked!</span>
            </template>
            <template v-else>
              Add <strong>${{ amountToFreeShipping.toFixed(2) }}</strong> more for free shipping
            </template>
          </p>
        </div>
      </header>

      <!-- ─── Body ─── -->
      <div class="sf-cart-body shop-scrollbar">
        <!-- Loading Skeleton -->
        <div v-if="cart.isLoading" class="sf-cart-skeleton-list">
          <div v-for="i in 3" :key="i" class="sf-cart-skeleton-item">
            <div class="sf-cart-skeleton-img shop-skeleton"></div>
            <div class="sf-cart-skeleton-info">
              <div class="shop-skeleton" style="height: 14px; width: 70%; border-radius: 6px"></div>
              <div
                class="shop-skeleton"
                style="height: 12px; width: 40%; border-radius: 6px; margin-top: 8px"
              ></div>
              <div
                class="shop-skeleton"
                style="height: 28px; width: 50%; border-radius: 8px; margin-top: 12px"
              ></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="cart.isEmpty" class="sf-cart-empty">
          <div class="sf-cart-empty-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--shop-tan)"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h3 class="sf-cart-empty-title">Your cart is empty</h3>
          <p class="sf-cart-empty-text">Explore our collection and find something you love.</p>
          <button @click="closeCart" class="shop-btn shop-btn-primary sf-cart-empty-btn">
            Continue Shopping
          </button>
        </div>

        <!-- Cart Items -->
        <TransitionGroup v-else name="cart-item" tag="div" class="sf-cart-items">
          <div
            v-for="(item, index) in cart.displayItems"
            :key="item.id"
            class="sf-cart-item"
            :style="{ '--stagger': index }"
          >
            <div class="sf-cart-item-img shop-img-zoom">
              <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
              <div v-else class="sf-cart-item-img-placeholder">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--shop-tan)"
                  stroke-width="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            </div>

            <div class="sf-cart-item-details">
              <h4 class="sf-cart-item-name">{{ item.name }}</h4>
              <p v-if="item.variant" class="sf-cart-item-variant">{{ item.variant }}</p>
              <p class="sf-cart-item-price">${{ formatPrice(item.unitPrice) }}</p>

              <div class="sf-cart-item-actions">
                <!-- Quantity Stepper -->
                <div class="sf-qty-stepper">
                  <button
                    @click="decrementQuantity(item)"
                    :disabled="item.quantity <= 1"
                    class="sf-qty-btn"
                    aria-label="Decrease quantity"
                  >
                    <svg
                      width="14"
                      height="14"
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
                    class="sf-qty-btn"
                    aria-label="Increase quantity"
                  >
                    <svg
                      width="14"
                      height="14"
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

                <!-- Remove -->
                <button
                  @click="removeItem(item.id)"
                  class="sf-cart-remove"
                  aria-label="Remove item"
                >
                  <svg
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
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="sf-cart-item-total">${{ formatPrice(item.unitPrice * item.quantity) }}</div>
          </div>
        </TransitionGroup>
      </div>

      <!-- ─── Footer ─── -->
      <footer v-if="!cart.isEmpty && !cart.isLoading" class="sf-cart-footer">
        <div class="sf-cart-summary">
          <div class="sf-cart-summary-row">
            <span>Subtotal</span>
            <span>${{ formatPrice(cart.subtotal) }}</span>
          </div>
          <div v-if="cart.hasDiscount" class="sf-cart-summary-row sf-discount">
            <span>Discount ({{ cart.discountCode }})</span>
            <span>−${{ formatPrice(cart.discountAmount) }}</span>
          </div>
          <div class="sf-cart-summary-total">
            <span>Total</span>
            <span>${{ formatPrice(cart.total) }}</span>
          </div>
        </div>

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
  </Teleport>
</template>

<script setup>
/**
 * ===========================================
 * CART OFF-CANVAS — Reimagined
 * ===========================================
 * State-driven cart panel that slides from the right.
 *
 * Uses:
 * - Injected isCartOpen ref from App.vue
 * - Injected closeCart() from App.vue
 * - Pinia cart store for data
 *
 * Features:
 * - Custom Teleport-based drawer (no PrimeVue Drawer dependency)
 * - Free-shipping progress bar
 * - Skeleton loading & staggered animations
 * - Accessible keyboard & focus management
 */

import { computed, watch, onMounted, onUnmounted, ref, nextTick, inject } from 'vue'
import { useCartStore } from '@/stores/cart'

// ─── Inject modal state from App.vue ───
const { isCartOpen, closeCart: closeCartFn } = inject('cartUtils')
const { openCheckout } = inject('checkoutUtils')

const cart = useCartStore()
const drawerRef = ref(null)

// ─── Free Shipping Threshold ───
const FREE_SHIPPING_THRESHOLD = 150 // dollars

const shippingProgress = computed(() =>
  Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100),
)
const amountToFreeShipping = computed(() => Math.max(0, FREE_SHIPPING_THRESHOLD - cart.subtotal))

// When cart opens, focus the drawer for keyboard access + lock scroll
watch(isCartOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    drawerRef.value?.focus()
    await cart.fetchCart()
  } else {
    document.body.style.overflow = ''
  }
})

// ─── Navigation ───
function closeCart() {
  closeCartFn()
}
function handleCheckout() {
  closeCart()
  nextTick(() => {
    openCheckout()
  })
}

// ─── Cart Actions ───
function incrementQuantity(item) {
  cart.updateItemQuantity(item.id, item.quantity + 1)
}
function decrementQuantity(item) {
  if (item.quantity > 1) {
    cart.updateItemQuantity(item.id, item.quantity - 1)
  }
}
function removeItem(itemId) {
  cart.removeItem(itemId)
}

// ─── Helpers ───
function formatPrice(val) {
  return (val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Keyboard ───
function handleEscKey(event) {
  if (event.key === 'Escape' && isCartOpen.value) closeCart()
}
onMounted(async () => {
  document.addEventListener('keydown', handleEscKey)
  await cart.fetchCart()
  await cart.enrichItems()
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<style>
/* ═══════════════════════════════════════════
   CART DRAWER — Reimagined Styles
   ═══════════════════════════════════════════ */

/* Backdrop */
.sf-cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 100001;
  animation: cartBackdropIn 0.3s ease forwards;
}
@keyframes cartBackdropIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Drawer */
.sf-cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 26rem;
  background: var(--shop-cream, #faf8f5);
  z-index: 100002;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(61, 58, 54, 0.12);
  outline: none;
  animation: cartSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes cartSlideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Header */
.sf-cart-header {
  padding: 1.25rem 1.5rem 0;
  flex-shrink: 0;
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
  background: var(--shop-beige, #e8e3dc);
  border-radius: 10px;
  color: var(--shop-brown-dark, #8b7d6d);
}
.sf-cart-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
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
  background: var(--shop-accent, #b8956c);
  border-radius: 999px;
}
.badge-pop-enter-active {
  animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badgePop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
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
  color: var(--shop-brown, #a89b8c);
  cursor: pointer;
  transition: all 0.2s;
}
.sf-cart-close:hover {
  background: var(--shop-beige, #e8e3dc);
  color: var(--shop-charcoal, #3d3a36);
}

/* Shipping Progress */
.sf-shipping-bar {
  margin-top: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
}
.sf-shipping-bar-track {
  width: 100%;
  height: 4px;
  background: var(--shop-beige, #e8e3dc);
  border-radius: 999px;
  overflow: hidden;
}
.sf-shipping-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--shop-accent, #b8956c), var(--shop-accent-dark, #8c6d4d));
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.sf-shipping-msg {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--shop-brown, #a89b8c);
}
.sf-shipping-msg strong {
  color: var(--shop-charcoal, #3d3a36);
}

/* Body */
.sf-cart-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* Skeleton */
.sf-cart-skeleton-list {
  padding: 0 1.5rem;
}
.sf-cart-skeleton-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
}
.sf-cart-skeleton-img {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  flex-shrink: 0;
}
.sf-cart-skeleton-info {
  flex: 1;
  padding: 4px 0;
}

/* Empty State */
.sf-cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  min-height: 50vh;
}
.sf-cart-empty-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-beige, #e8e3dc);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}
.sf-cart-empty-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 0.5rem;
}
.sf-cart-empty-text {
  font-size: 0.875rem;
  color: var(--shop-brown, #a89b8c);
  margin-bottom: 1.5rem;
  max-width: 240px;
}
.sf-cart-empty-btn {
  min-width: 180px;
}

/* Cart Items */
.sf-cart-items {
  position: relative;
}
.sf-cart-item {
  display: flex;
  gap: 0.875rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--shop-beige, #e8e3dc);
  transition: background 0.2s;
  animation: cartItemIn 0.4s ease forwards;
  animation-delay: calc(var(--stagger, 0) * 60ms);
  opacity: 0;
}
@keyframes cartItemIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.sf-cart-item:hover {
  background: rgba(232, 227, 220, 0.35);
}

/* Item transitions */
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.35s ease;
}
.cart-item-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  overflow: hidden;
}

.sf-cart-item-img {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--shop-cream-dark, #f5f2ed);
}
.sf-cart-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
}
.sf-cart-item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.sf-cart-item-variant {
  font-size: 0.75rem;
  color: var(--shop-brown, #a89b8c);
  margin-top: 2px;
}
.sf-cart-item-price {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shop-accent-dark, #8c6d4d);
  margin-top: 4px;
}
.sf-cart-item-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Quantity Stepper */
.sf-qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 999px;
  overflow: hidden;
  background: white;
}
.sf-qty-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--shop-brown-dark, #8b7d6d);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.sf-qty-btn:hover:not(:disabled) {
  background: var(--shop-cream-dark, #f5f2ed);
  color: var(--shop-charcoal, #3d3a36);
}
.sf-qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.sf-qty-btn:active:not(:disabled) {
  transform: scale(0.9);
}
.sf-qty-value {
  min-width: 1.75rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  user-select: none;
}

/* Remove button */
.sf-cart-remove {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--shop-error, #c47575);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
}
.sf-cart-remove:hover {
  background: rgba(196, 117, 117, 0.1);
  opacity: 1;
}

/* Item Total */
.sf-cart-item-total {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  white-space: nowrap;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}

/* Footer */
.sf-cart-footer {
  flex-shrink: 0;
  padding: 1.25rem 1.5rem 1.5rem;
  background: white;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}
.sf-cart-summary {
  margin-bottom: 1rem;
}
.sf-cart-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--shop-brown-dark, #8b7d6d);
  padding: 4px 0;
}
.sf-cart-summary-row.sf-discount {
  color: var(--shop-success, #7d9b76);
}
.sf-cart-summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  padding-top: 0.625rem;
  margin-top: 0.375rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}
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
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: white;
  background: var(--shop-charcoal, #3d3a36);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.sf-checkout-btn:hover {
  background: var(--shop-black, #1a1816);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(61, 58, 54, 0.2);
}
.sf-checkout-btn:active {
  transform: translateY(0);
}
.sf-continue-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shop-brown-dark, #8b7d6d);
  background: transparent;
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-continue-btn:hover {
  background: var(--shop-cream-dark, #f5f2ed);
  border-color: var(--shop-tan, #c4b8a9);
}

/* Responsive */
@media (max-width: 480px) {
  .sf-cart-drawer {
    max-width: 100%;
  }
  .sf-cart-header,
  .sf-cart-item {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .sf-cart-footer {
    padding: 1rem;
  }
  .sf-cart-item-img {
    width: 60px;
    height: 60px;
  }
}
</style>
