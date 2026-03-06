<template>
  <!--
    ================================================================
    ORDERS MODAL — Reimagined
    ================================================================
    Premium orders history modal with:
    - Order timeline with status indicators
    - Expandable order detail cards
    - Order status color-coded badges
    - Fetches from the actual Neon Data API /orders endpoint
    - Route-driven open/close (/orders suffix)
    ================================================================
  -->
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="isOpen"
        class="sf-orders-backdrop"
        @click.self="closeModal"
      ></div>
    </Transition>

    <Transition name="modal-content">
      <div
        v-if="isOpen"
        class="sf-orders-modal"
        role="dialog"
        aria-label="Order History"
        @keydown.esc="closeModal"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close -->
        <button @click="closeModal" class="sf-orders-modal-close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Header -->
        <header class="sf-orders-header">
          <div class="sf-orders-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
          </div>
          <h2 class="sf-orders-title">My Orders</h2>
          <p class="sf-orders-subtitle">Track and manage your purchases</p>
        </header>

        <!-- Body -->
        <div class="sf-orders-body shop-scrollbar">
          <!-- Loading -->
          <div v-if="isLoading" class="sf-orders-loading">
            <div v-for="i in 3" :key="i" class="sf-orders-skeleton-card">
              <div class="sf-orders-skeleton-header">
                <div class="shop-skeleton" style="height:14px;width:120px;border-radius:6px;"></div>
                <div class="shop-skeleton" style="height:24px;width:80px;border-radius:999px;"></div>
              </div>
              <div class="sf-orders-skeleton-body">
                <div class="shop-skeleton" style="height:12px;width:60%;border-radius:6px;"></div>
                <div class="shop-skeleton" style="height:12px;width:40%;border-radius:6px;margin-top:6px;"></div>
              </div>
            </div>
          </div>

          <!-- Not Authenticated -->
          <div v-else-if="!authStore.isAuthenticated" class="sf-orders-empty">
            <div class="sf-orders-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--shop-tan)" stroke-width="1.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3 class="sf-orders-empty-title">Sign in to view orders</h3>
            <p class="sf-orders-empty-text">Log in to your account to see your order history.</p>
            <button @click="goToLogin" class="shop-btn shop-btn-primary">Sign In</button>
          </div>

          <!-- Empty -->
          <div v-else-if="ordersList.length === 0" class="sf-orders-empty">
            <div class="sf-orders-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--shop-tan)" stroke-width="1.2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </div>
            <h3 class="sf-orders-empty-title">No orders yet</h3>
            <p class="sf-orders-empty-text">Your order history will appear here once you make a purchase.</p>
            <button @click="closeModal" class="shop-btn shop-btn-primary">Start Shopping</button>
          </div>

          <!-- Orders List -->
          <div v-else class="sf-orders-list">
            <div
              v-for="(order, index) in ordersList"
              :key="order.id"
              class="sf-order-card"
              :style="{ '--stagger': index }"
            >
              <div class="sf-order-card-header" @click="toggleOrder(order.id)">
                <div class="sf-order-card-meta">
                  <span class="sf-order-id">#{{ order.id?.slice(0, 8).toUpperCase() }}</span>
                  <span class="sf-order-date">{{ formatDate(order.created_at) }}</span>
                </div>
                <div class="sf-order-card-right">
                  <span :class="['sf-order-status', `sf-status-${order.status}`]">
                    {{ formatStatus(order.status) }}
                  </span>
                  <svg
                    :class="['sf-order-chevron', { 'sf-order-chevron-open': expandedOrder === order.id }]"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              <!-- Expanded Detail -->
              <Transition name="order-expand">
                <div v-if="expandedOrder === order.id" class="sf-order-detail">
                  <!-- Order Items -->
                  <div v-if="order.order_items?.length" class="sf-order-items">
                    <div v-for="item in order.order_items" :key="item.id" class="sf-order-item">
                      <div class="sf-order-item-info">
                        <span class="sf-order-item-name">{{ item.product_name || 'Product' }}</span>
                        <span class="sf-order-item-qty">× {{ item.quantity }}</span>
                      </div>
                      <span class="sf-order-item-price">${{ formatPrice(item.unit_price * item.quantity) }}</span>
                    </div>
                  </div>

                  <div class="sf-order-total">
                    <span>Total</span>
                    <span class="sf-order-total-value">${{ formatPrice(order.total_amount) }}</span>
                  </div>

                  <!-- Order Timeline -->
                  <div class="sf-order-timeline">
                    <div :class="['sf-timeline-step', { active: isStepActive(order.status, 'placed') }]">
                      <div class="sf-timeline-dot"></div>
                      <span>Placed</span>
                    </div>
                    <div class="sf-timeline-line"></div>
                    <div :class="['sf-timeline-step', { active: isStepActive(order.status, 'processing') }]">
                      <div class="sf-timeline-dot"></div>
                      <span>Processing</span>
                    </div>
                    <div class="sf-timeline-line"></div>
                    <div :class="['sf-timeline-step', { active: isStepActive(order.status, 'shipped') }]">
                      <div class="sf-timeline-dot"></div>
                      <span>Shipped</span>
                    </div>
                    <div class="sf-timeline-line"></div>
                    <div :class="['sf-timeline-step', { active: isStepActive(order.status, 'delivered') }]">
                      <div class="sf-timeline-dot"></div>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * ===========================================
 * ORDERS MODAL — Reimagined
 * ===========================================
 * Uses:
 * - Injected isOrdersOpen ref from App.vue
 * - Injected closeOrders() from App.vue
 * - API client orders.getAll() to fetch order history
 * - Expandable order cards with timeline
 */

import { computed, ref, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { orders as ordersApi } from '@/api'

// ─── Inject modal state from App.vue ───
const { isOrdersOpen: isOpen, closeOrders } = inject('ordersUtils')
const { openLogin } = inject('authUtils')

const authStore = useAuthStore()
const modalRef = ref(null)

const ordersList = ref([])
const isLoading = ref(false)
const expandedOrder = ref(null)

watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    modalRef.value?.focus()
    if (authStore.isAuthenticated) {
      fetchOrders()
    }
  } else {
    document.body.style.overflow = ''
  }
})

// ─── Fetch Orders ───
async function fetchOrders() {
  try {
    isLoading.value = true
    const res = await ordersApi.getAll()
    ordersList.value = res.orders || res || []
  } catch (err) {
    console.error('Failed to fetch orders:', err)
    ordersList.value = []
  } finally {
    isLoading.value = false
  }
}

// ─── Navigation ───
function closeModal() {
  closeOrders()
}
function goToLogin() {
  closeModal()
  nextTick(() => {
    openLogin()
  })
}
function toggleOrder(id) {
  expandedOrder.value = expandedOrder.value === id ? null : id
}

// ─── Helpers ───
function formatPrice(val) {
  return (val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}
function formatStatus(status) {
  const map = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    placed: 'Placed'
  }
  return map[status] || status || 'Unknown'
}

const statusOrder = ['placed', 'pending', 'processing', 'shipped', 'delivered']
function isStepActive(currentStatus, step) {
  const currentIndex = statusOrder.indexOf(currentStatus)
  const stepIndex = statusOrder.indexOf(step)
  return stepIndex <= currentIndex
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
   ORDERS MODAL — Reimagined Styles
   ═══════════════════════════════════════════ */

.sf-orders-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100001;
}
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.sf-orders-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 540px;
  max-height: calc(100vh - 4rem);
  background: var(--shop-cream, #FAF8F5);
  border-radius: var(--shop-radius-xl, 1.5rem);
  z-index: 100002;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(61, 58, 54, 0.2);
  outline: none;
}
.modal-content-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-content-leave-active {
  transition: all 0.25s ease;
}
.modal-content-enter-from {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.96);
}
.modal-content-leave-to {
  opacity: 0;
  transform: translate(-50%, -52%) scale(0.96);
}

.sf-orders-modal-close {
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
  background: var(--shop-beige, #E8E3DC);
  color: var(--shop-brown-dark, #8B7D6D);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}
.sf-orders-modal-close:hover {
  background: var(--shop-beige-dark, #D4CFC6);
  color: var(--shop-charcoal, #3D3A36);
}

/* Header */
.sf-orders-header {
  text-align: center;
  padding: 2rem 2rem 1.25rem;
  flex-shrink: 0;
}
.sf-orders-icon-wrap {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-beige, #E8E3DC);
  border-radius: 14px;
  color: var(--shop-brown-dark, #8B7D6D);
  margin-bottom: 0.75rem;
}
.sf-orders-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
}
.sf-orders-subtitle {
  font-size: 0.8125rem;
  color: var(--shop-brown, #A89B8C);
  margin-top: 0.25rem;
}

/* Body */
.sf-orders-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
}

/* Loading */
.sf-orders-loading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.sf-orders-skeleton-card {
  background: white;
  border-radius: var(--shop-radius-md, 0.75rem);
  padding: 1rem;
}
.sf-orders-skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.sf-orders-skeleton-body {
  padding-top: 0.25rem;
}

/* Empty */
.sf-orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  min-height: 240px;
}
.sf-orders-empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-beige, #E8E3DC);
  border-radius: 50%;
  margin-bottom: 1.25rem;
}
.sf-orders-empty-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  margin-bottom: 0.375rem;
}
.sf-orders-empty-text {
  font-size: 0.8125rem;
  color: var(--shop-brown, #A89B8C);
  margin-bottom: 1.25rem;
  max-width: 260px;
}

/* Order Card */
.sf-orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.sf-order-card {
  background: white;
  border-radius: var(--shop-radius-md, 0.75rem);
  overflow: hidden;
  transition: box-shadow 0.2s;
  animation: orderCardIn 0.4s ease forwards;
  animation-delay: calc(var(--stagger, 0) * 60ms);
  opacity: 0;
}
@keyframes orderCardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.sf-order-card:hover {
  box-shadow: var(--shop-shadow-md);
}
.sf-order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.sf-order-card-header:hover {
  background: var(--shop-cream-dark, #F5F2ED);
}
.sf-order-card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sf-order-id {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3D3A36);
  font-family: monospace;
}
.sf-order-date {
  font-size: 0.6875rem;
  color: var(--shop-brown, #A89B8C);
}
.sf-order-card-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Status Badges */
.sf-order-status {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 999px;
  text-transform: capitalize;
}
.sf-status-pending, .sf-status-placed {
  background: rgba(212, 168, 75, 0.12);
  color: #B88E30;
}
.sf-status-processing {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}
.sf-status-shipped {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}
.sf-status-delivered {
  background: rgba(125, 155, 118, 0.15);
  color: var(--shop-success, #5A7D51);
}
.sf-status-cancelled, .sf-status-refunded {
  background: rgba(196, 117, 117, 0.1);
  color: var(--shop-error, #C47575);
}

.sf-order-chevron {
  transition: transform 0.25s ease;
  color: var(--shop-brown, #A89B8C);
}
.sf-order-chevron-open {
  transform: rotate(180deg);
}

/* Expanded Detail */
.order-expand-enter-active,
.order-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.order-expand-enter-from,
.order-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.sf-order-detail {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--shop-beige, #E8E3DC);
}
.sf-order-items {
  padding: 0.75rem 0;
}
.sf-order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
}
.sf-order-item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sf-order-item-name {
  font-size: 0.8125rem;
  color: var(--shop-charcoal, #3D3A36);
}
.sf-order-item-qty {
  font-size: 0.75rem;
  color: var(--shop-brown, #A89B8C);
}
.sf-order-item-price {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
}
.sf-order-total {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3D3A36);
  padding-top: 0.625rem;
  border-top: 1px solid var(--shop-beige, #E8E3DC);
}

/* Timeline */
.sf-order-timeline {
  display: flex;
  align-items: center;
  gap: 0;
  padding-top: 1rem;
  margin-top: 0.75rem;
}
.sf-timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}
.sf-timeline-step span {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--shop-tan, #C4B8A9);
  white-space: nowrap;
}
.sf-timeline-step.active span {
  color: var(--shop-accent-dark, #8C6D4D);
  font-weight: 700;
}
.sf-timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--shop-beige-dark, #D4CFC6);
  transition: all 0.3s;
}
.sf-timeline-step.active .sf-timeline-dot {
  background: var(--shop-accent, #B8956C);
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.2);
}
.sf-timeline-line {
  flex: 1;
  height: 2px;
  background: var(--shop-beige-dark, #D4CFC6);
  min-width: 16px;
  margin-bottom: 1.25rem;
}

/* Responsive */
@media (max-width: 480px) {
  .sf-orders-modal {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 2rem);
    border-radius: var(--shop-radius-lg, 1rem);
  }
  .sf-orders-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  .sf-orders-body {
    padding: 0 1rem 1rem;
  }
  .sf-timeline-step span {
    font-size: 0.5625rem;
  }
}
</style>
