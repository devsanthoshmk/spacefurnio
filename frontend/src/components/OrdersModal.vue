<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="orders-backdrop">
      <div v-if="isOpen" class="sf-orders-backdrop" @click.self="closeModal"></div>
    </Transition>

    <!-- Modal Window -->
    <Transition name="orders-content">
      <div
        v-if="isOpen"
        class="sf-orders-modal"
        role="dialog"
        aria-label="Order History & Tracking"
        @keydown.esc="closeModal"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Close Button -->
        <button @click="closeModal" class="sf-orders-modal-close" aria-label="Close orders">
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
        <header class="sf-orders-header">
          <div class="sf-orders-icon-wrap">
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
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <h2 class="sf-orders-title">Order History &amp; Tracking</h2>
          <p class="sf-orders-subtitle">Manage your past purchases, track packages, and view invoices</p>
        </header>

        <!-- Notification Banner -->
        <Transition name="error-slide">
          <div v-if="actionMessage" class="sf-action-banner" :class="actionMessageType">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path v-if="actionMessageType === 'success'" d="M20 6L9 17l-5-5" />
              <circle v-else cx="12" cy="12" r="10" />
            </svg>
            <span>{{ actionMessage }}</span>
          </div>
        </Transition>

        <!-- Body -->
        <div class="sf-orders-body shop-scrollbar">
          <!-- Loading Skeletons -->
          <div v-if="isLoading" class="sf-orders-loading">
            <div v-for="i in 3" :key="i" class="sf-orders-skeleton-card animate-pulse">
              <div class="sf-orders-skeleton-header">
                <div class="h-4 bg-stone-200 rounded w-32"></div>
                <div class="h-6 bg-stone-200 rounded-full w-20"></div>
              </div>
              <div class="space-y-2 mt-3">
                <div class="h-3 bg-stone-200 rounded w-3/4"></div>
                <div class="h-3 bg-stone-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- Unauthenticated Gate -->
          <div v-else-if="!authStore.isAuthenticated" class="sf-orders-empty">
            <div class="sf-orders-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" class="text-stone-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 class="sf-orders-empty-title">Sign in to View Orders</h3>
            <p class="sf-orders-empty-text">Log in to track current shipments and view purchase history.</p>
            <button @click="goToLogin" class="sf-primary-btn">Sign In</button>
          </div>

          <!-- Empty Orders List -->
          <div v-else-if="ordersList.length === 0" class="sf-orders-empty">
            <div class="sf-orders-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" class="text-stone-400">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <h3 class="sf-orders-empty-title">No Orders Yet</h3>
            <p class="sf-orders-empty-text">Your order history will appear here once you make your first purchase.</p>
            <button @click="handleShopNow" class="sf-primary-btn">Start Shopping</button>
          </div>

          <!-- Orders Accordion List -->
          <div v-else class="sf-orders-list">
            <div
              v-for="(order, index) in ordersList"
              :key="order.id"
              class="sf-order-card"
              :style="{ '--stagger': index }"
            >
              <!-- Order Header Summary Row -->
              <div class="sf-order-card-header" @click="toggleOrder(order.id)">
                <div class="sf-order-card-products">
                  <!-- Thumbnail of primary product -->
                  <div class="sf-order-thumbnails">
                    <img
                      v-if="order.order_items?.[0]?.product_image"
                      :src="getOptimizedThumbnail(order.order_items[0].product_image, 120)"
                      :alt="order.order_items[0].product_name"
                      loading="lazy"
                      decoding="async"
                      class="sf-order-thumb"
                    />
                    <div v-else class="sf-order-thumb-placeholder">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  </div>

                  <!-- Product title & meta -->
                  <div class="sf-order-product-info">
                    <span class="sf-order-product-name">
                      {{ order.order_items?.[0]?.product_name || 'SpaceFurnio Order' }}
                      <span v-if="order.order_items?.length > 1" class="sf-order-more-items">
                        +{{ order.order_items.length - 1 }} more
                      </span>
                    </span>
                    <span class="sf-order-item-count">
                      #{{ order.id?.slice(0, 8).toUpperCase() }} · {{ order.order_items?.length || 0 }} item{{ order.order_items?.length !== 1 ? 's' : '' }} · {{ formatDate(order.created_at) }}
                    </span>
                  </div>
                </div>

                <!-- Right Side: Amount, Status Badge, Chevron -->
                <div class="sf-order-card-right">
                  <span class="sf-order-total-amount">${{ formatPrice(order.total_amount) }}</span>
                  <span :class="['sf-order-status-badge', `status-${normalizeStatus(order.status)}`]">
                    {{ formatStatus(order.status) }}
                  </span>
                  <svg
                    :class="['sf-order-chevron', { 'sf-order-chevron-open': expandedOrder === order.id }]"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <!-- Expanded Order Detail -->
              <Transition name="order-expand">
                <div v-if="expandedOrder === order.id" class="sf-order-detail">
                  <!-- Live Shipment Tracking Timeline -->
                  <div class="sf-tracking-section">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold text-stone-700 uppercase tracking-wider">Shipment Tracking</span>
                      <span v-if="order.carrier && order.tracking_number" class="text-[11px] text-stone-500 font-mono">
                        {{ order.carrier }}: {{ order.tracking_number }}
                      </span>
                    </div>

                    <!-- Timeline Steps -->
                    <div v-if="order.status === 'cancelled'" class="sf-cancelled-banner">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span>This order was cancelled.</span>
                    </div>

                    <div v-else class="sf-order-timeline">
                      <div
                        v-for="(step, sIdx) in trackingStages"
                        :key="step.key"
                        class="sf-timeline-step-wrap"
                      >
                        <div
                          :class="[
                            'sf-timeline-step',
                            { active: isTimelineStepActive(order.status, step.key), current: order.status === step.key }
                          ]"
                        >
                          <div class="sf-timeline-dot">
                            <svg
                              v-if="isTimelineStepActive(order.status, step.key)"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="3"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                          <span class="sf-timeline-label">{{ step.label }}</span>
                        </div>
                        <div
                          v-if="sIdx < trackingStages.length - 1"
                          :class="[
                            'sf-timeline-line',
                            { active: isTimelineStepActive(order.status, trackingStages[sIdx + 1].key) }
                          ]"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Expandable Order Items List -->
                  <div class="sf-order-items-list">
                    <span class="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">Order Items</span>
                    <div
                      v-for="item in order.order_items"
                      :key="item.id || item.product_id"
                      class="sf-order-item-row"
                    >
                      <div class="sf-order-item-info">
                        <img
                          v-if="item.product_image"
                          :src="getOptimizedThumbnail(item.product_image, 120)"
                          :alt="item.product_name"
                          loading="lazy"
                          decoding="async"
                          class="w-10 h-10 object-cover rounded-lg bg-stone-100 flex-shrink-0"
                        />
                        <div class="min-w-0 flex-1">
                          <span class="sf-order-item-name">{{ item.product_name || 'Furniture Item' }}</span>
                          <span class="text-[11px] text-stone-500 block">Qty: {{ item.quantity }} × ${{ formatPrice(item.unit_price) }}</span>
                        </div>
                      </div>
                      <span class="sf-order-item-price">
                        ${{ formatPrice((item.unit_price || 0) * (item.quantity || 1)) }}
                      </span>
                    </div>

                    <div class="sf-order-subtotals">
                      <div class="flex justify-between py-1 text-xs text-stone-600">
                        <span>Items Total</span>
                        <span>${{ formatPrice(order.total_amount) }}</span>
                      </div>
                      <div class="flex justify-between py-1 text-xs text-stone-600">
                        <span>Shipping</span>
                        <span class="text-emerald-700 font-medium">Free</span>
                      </div>
                      <div class="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                        <span>Total Paid</span>
                        <span>${{ formatPrice(order.total_amount) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Shipping Address Card & Payment Summary -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <!-- Shipping Card -->
                    <div class="sf-order-info-card">
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-[11px] font-bold text-stone-700 uppercase tracking-wider">Shipping Address</span>
                        <button
                          v-if="canEditShipping(order.status)"
                          @click.stop="openAddressEditor(order)"
                          class="text-xs font-semibold text-amber-700 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div v-if="hasShippingDetails(order)" class="text-xs text-stone-600 space-y-0.5">
                        <p class="font-semibold text-stone-900" v-if="order.shipping_first_name || order.shipping_last_name">
                          {{ order.shipping_first_name }} {{ order.shipping_last_name }}
                        </p>
                        <p v-if="order.shipping_address">{{ order.shipping_address }}</p>
                        <p v-if="order.shipping_city || order.shipping_state || order.shipping_pincode">
                          {{ order.shipping_city }}{{ order.shipping_city && order.shipping_state ? ', ' : '' }}{{ order.shipping_state }} {{ order.shipping_pincode }}
                        </p>
                        <p v-if="order.shipping_phone" class="text-stone-500 pt-0.5">Phone: {{ order.shipping_phone }}</p>
                      </div>
                      <p v-else class="text-xs text-stone-400 italic">Standard delivery address</p>
                    </div>

                    <!-- Payment Card -->
                    <div class="sf-order-info-card">
                      <span class="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">Payment Details</span>
                      <div class="text-xs text-stone-600 space-y-1">
                        <div class="flex justify-between">
                          <span class="text-stone-500">Method:</span>
                          <span class="font-medium text-stone-800 uppercase">{{ formatPaymentMethod(order.payment_method) }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-stone-500">Payment Status:</span>
                          <span class="font-semibold text-emerald-700 capitalize">{{ order.payment_status || 'Paid' }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-stone-500">Date Placed:</span>
                          <span class="text-stone-800">{{ formatDate(order.created_at) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Actions: Cancel Order & Buy Again -->
                  <div class="sf-order-action-bar">
                    <button
                      v-if="canCancelOrder(order.status)"
                      @click.stop="confirmCancelOrder(order)"
                      :disabled="isCancellingId === order.id"
                      class="sf-cancel-order-btn"
                    >
                      <span v-if="isCancellingId === order.id" class="sf-mini-spinner"></span>
                      <template v-else>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>Cancel Order</span>
                      </template>
                    </button>

                    <button @click.stop="handleBuyAgain(order)" class="sf-buy-again-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                      </svg>
                      <span>Buy Again</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Address Editor Modal -->
    <Transition name="orders-backdrop">
      <div v-if="showAddressEditor" class="sf-orders-backdrop" @click.self="closeAddressEditor"></div>
    </Transition>
    <Transition name="orders-content">
      <div
        v-if="showAddressEditor"
        class="sf-address-editor-modal"
        role="dialog"
        aria-label="Edit Shipping Address"
      >
        <button @click="closeAddressEditor" class="sf-orders-modal-close" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3 class="sf-section-title mb-4">Edit Shipping Address</h3>

        <form @submit.prevent="saveShippingAddress" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="sf-field-label">First Name</label>
              <input v-model="addressForm.first_name" type="text" class="sf-input" required />
            </div>
            <div>
              <label class="sf-field-label">Last Name</label>
              <input v-model="addressForm.last_name" type="text" class="sf-input" required />
            </div>
          </div>

          <div>
            <label class="sf-field-label">Address</label>
            <input v-model="addressForm.address" type="text" class="sf-input" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="sf-field-label">City</label>
              <input v-model="addressForm.city" type="text" class="sf-input" required />
            </div>
            <div>
              <label class="sf-field-label">State</label>
              <input v-model="addressForm.state" type="text" class="sf-input" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="sf-field-label">Pincode</label>
              <input v-model="addressForm.pincode" type="text" class="sf-input" required />
            </div>
            <div>
              <label class="sf-field-label">Phone</label>
              <input v-model="addressForm.phone" type="tel" class="sf-input" required />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSavingAddress"
            class="sf-primary-btn mt-4"
          >
            <span v-if="isSavingAddress" class="sf-mini-spinner"></span>
            <span v-else>Update Shipping Address</span>
          </button>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { enrichOrderItems } from '@/api/shopApi'
import { api } from '@/lib/api'
import { getOptimizedThumbnail } from '@/utils/imageOptimizer.js'

const router = useRouter()
const { isOrdersOpen: isOpen, closeOrders } = inject('ordersUtils')
const { openLogin } = inject('authUtils')
const { openCart } = inject('cartUtils')

const authStore = useAuthStore()
const cartStore = useCartStore()
const modalRef = ref(null)

const ordersList = ref([])
const isLoading = ref(false)
const expandedOrder = ref(null)
const isCancellingId = ref(null)

const actionMessage = ref('')
const actionMessageType = ref('success')
let actionMsgTimer = null

// Tracking stages
const trackingStages = [
  { key: 'placed', label: 'Placed' },
  { key: 'paid', label: 'Paid' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

// Address Editor State
const showAddressEditor = ref(false)
const editingOrder = ref(null)
const isSavingAddress = ref(false)
const addressForm = ref({
  first_name: '',
  last_name: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
})

watch(isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    actionMessage.value = ''
    await nextTick()
    modalRef.value?.focus()
    if (authStore.isAuthenticated) {
      await fetchOrders()
    }
  } else {
    document.body.style.overflow = ''
  }
})

function notify(msg, type = 'success') {
  actionMessage.value = msg
  actionMessageType.value = type
  if (actionMsgTimer) clearTimeout(actionMsgTimer)
  actionMsgTimer = setTimeout(() => {
    actionMessage.value = ''
  }, 4000)
}

async function fetchOrders() {
  try {
    isLoading.value = true
    const rawOrders = await api.getOrders()
    const ordersArray = Array.isArray(rawOrders) ? rawOrders : []

    const enriched = await Promise.all(
      ordersArray.map(async (order) => {
        const enrichedItems = await enrichOrderItems((order.order_items || []).filter(Boolean))
        return {
          ...order,
          order_items: enrichedItems,
        }
      }),
    )

    ordersList.value = enriched
    // Auto-expand first order if available
    if (enriched.length > 0 && !expandedOrder.value) {
      expandedOrder.value = enriched[0].id
    }
  } catch (err) {
    console.error('Failed to fetch orders:', err)
    ordersList.value = []
  } finally {
    isLoading.value = false
  }
}

function toggleOrder(id) {
  expandedOrder.value = expandedOrder.value === id ? null : id
}

function canCancelOrder(status) {
  const normalized = normalizeStatus(status)
  return ['placed', 'paid', 'pending', 'processing'].includes(normalized)
}

function canEditShipping(status) {
  const normalized = normalizeStatus(status)
  return ['placed', 'paid', 'pending', 'processing'].includes(normalized)
}

async function confirmCancelOrder(order) {
  if (isCancellingId.value) return
  const confirmed = window.confirm(`Are you sure you want to cancel Order #${order.id?.slice(0, 8).toUpperCase()}?`)
  if (!confirmed) return

  try {
    isCancellingId.value = order.id
    await api.cancelOrder(order.id, 'Cancelled by customer from order dashboard')
    
    // Update local state
    const target = ordersList.value.find((o) => o.id === order.id)
    if (target) {
      target.status = 'cancelled'
    }
    notify('Order has been cancelled successfully.', 'success')
  } catch (err) {
    console.error('Failed to cancel order:', err)
    notify(err.message || 'Failed to cancel order.', 'error')
  } finally {
    isCancellingId.value = null
  }
}

async function handleBuyAgain(order) {
  try {
    for (const item of order.order_items || []) {
      const pId = item.product_id || item.productId
      if (pId) {
        await cartStore.addItem(pId, item.quantity || 1, item.unit_price)
      }
    }
    closeModal()
    nextTick(() => {
      openCart()
    })
  } catch (err) {
    console.error('Buy again error:', err)
    notify('Failed to add items to cart.', 'error')
  }
}

function openAddressEditor(order) {
  editingOrder.value = order
  addressForm.value = {
    first_name: order.shipping_first_name || '',
    last_name: order.shipping_last_name || '',
    address: order.shipping_address || '',
    city: order.shipping_city || '',
    state: order.shipping_state || '',
    pincode: order.shipping_pincode || '',
    phone: order.shipping_phone || '',
  }
  showAddressEditor.value = true
}

function closeAddressEditor() {
  showAddressEditor.value = false
  editingOrder.value = null
}

async function saveShippingAddress() {
  if (!editingOrder.value || isSavingAddress.value) return

  try {
    isSavingAddress.value = true
    await api.updateOrderShipping(editingOrder.value.id, {
      shipping_first_name: addressForm.value.first_name,
      shipping_last_name: addressForm.value.last_name,
      shipping_address: addressForm.value.address,
      shipping_city: addressForm.value.city,
      shipping_state: addressForm.value.state,
      shipping_pincode: addressForm.value.pincode,
      shipping_phone: addressForm.value.phone,
    })

    const idx = ordersList.value.findIndex((o) => o.id === editingOrder.value.id)
    if (idx !== -1) {
      ordersList.value[idx] = {
        ...ordersList.value[idx],
        shipping_first_name: addressForm.value.first_name,
        shipping_last_name: addressForm.value.last_name,
        shipping_address: addressForm.value.address,
        shipping_city: addressForm.value.city,
        shipping_state: addressForm.value.state,
        shipping_pincode: addressForm.value.pincode,
        shipping_phone: addressForm.value.phone,
      }
    }
    closeAddressEditor()
    notify('Shipping address updated.')
  } catch (err) {
    console.error('Update shipping error:', err)
    notify(err.message || 'Failed to update address.', 'error')
  } finally {
    isSavingAddress.value = false
  }
}

function normalizeStatus(status) {
  return String(status || 'placed').trim().toLowerCase()
}

function formatStatus(status) {
  const norm = normalizeStatus(status)
  const map = {
    placed: 'Placed',
    paid: 'Paid',
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }
  return map[norm] || norm.charAt(0).toUpperCase() + norm.slice(1)
}

function formatPaymentMethod(method) {
  const norm = String(method || 'card').toLowerCase()
  const map = {
    card: 'Credit / Debit Card',
    upi: 'UPI Instant Pay',
    cod: 'Cash on Delivery (COD)',
    razorpay: 'Razorpay',
  }
  return map[norm] || method || 'Card'
}

const statusRanking = ['placed', 'paid', 'processing', 'shipped', 'delivered']
function isTimelineStepActive(orderStatus, stepKey) {
  const norm = normalizeStatus(orderStatus)
  const orderRank = statusRanking.indexOf(norm)
  const stepRank = statusRanking.indexOf(stepKey)
  if (orderRank === -1 || stepRank === -1) return false
  return stepRank <= orderRank
}

function hasShippingDetails(order) {
  return !!(
    order.shipping_first_name ||
    order.shipping_last_name ||
    order.shipping_address ||
    order.shipping_city
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPrice(val) {
  return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function closeModal() {
  closeOrders()
}

function goToLogin() {
  closeModal()
  nextTick(() => {
    openLogin()
  })
}

function handleShopNow() {
  closeModal()
  router.push('/shop')
}

function handleEsc(e) {
  if (e.key === 'Escape' && isOpen.value && !showAddressEditor.value) {
    closeModal()
  }
}

onMounted(() => document.addEventListener('keydown', handleEsc))
onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.body.style.overflow = ''
  if (actionMsgTimer) clearTimeout(actionMsgTimer)
})
</script>

<style scoped>
/* Backdrop */
.sf-orders-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100001;
}
.orders-backdrop-enter-active,
.orders-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.orders-backdrop-enter-from,
.orders-backdrop-leave-to {
  opacity: 0;
}

/* Modal */
.sf-orders-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 680px;
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
.orders-content-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.orders-content-leave-active {
  transition: all 0.25s ease;
}
.orders-content-enter-from {
  opacity: 0;
  transform: translate(-50%, -48%) scale(0.96);
}
.orders-content-leave-to {
  opacity: 0;
  transform: translate(-50%, -52%) scale(0.96);
}

.sf-orders-modal-close {
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
.sf-orders-modal-close:hover {
  background: #dcd5ca;
  color: #2c2723;
}

/* Header */
.sf-orders-header {
  text-align: center;
  padding: 1.75rem 2rem 1rem;
  flex-shrink: 0;
  background: #faf8f5;
}
.sf-orders-icon-wrap {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e8e3dc;
  border-radius: 12px;
  color: #5c4f42;
  margin-bottom: 0.5rem;
}
.sf-orders-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #2c2723;
}
.sf-orders-subtitle {
  font-size: 0.75rem;
  color: #8c7d6e;
  margin-top: 0.25rem;
}

/* Action Message Banner */
.sf-action-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.sf-action-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border-bottom: 1px solid #a7f3d0;
}
.sf-action-banner.error {
  background: #fef2f2;
  color: #b91c1c;
  border-bottom: 1px solid #fecaca;
}

/* Body */
.sf-orders-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1.75rem 1.5rem;
}

/* Loading & Empty */
.sf-orders-loading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.sf-orders-skeleton-card {
  background: white;
  border-radius: 0.875rem;
  padding: 1.25rem;
  border: 1px solid #e8e3dc;
}
.sf-orders-skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sf-orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3.5rem 1rem;
}
.sf-orders-empty-icon {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee8e0;
  border-radius: 50%;
  margin-bottom: 1.25rem;
}
.sf-orders-empty-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
  margin-bottom: 0.375rem;
}
.sf-orders-empty-text {
  font-size: 0.8125rem;
  color: #8c7d6e;
  margin-bottom: 1.5rem;
  max-width: 280px;
}

/* Orders List */
.sf-orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.sf-order-card {
  background: white;
  border: 1px solid #e8e3dc;
  border-radius: 0.875rem;
  overflow: hidden;
  transition: box-shadow 0.2s;
  animation: orderIn 0.35s ease forwards;
  animation-delay: calc(var(--stagger, 0) * 50ms);
  opacity: 0;
}
@keyframes orderIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.sf-order-card:hover {
  box-shadow: 0 4px 16px rgba(44, 38, 32, 0.06);
}

.sf-order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.125rem;
  cursor: pointer;
  background: white;
  transition: background 0.15s;
}
.sf-order-card-header:hover {
  background: #faf8f5;
}
.sf-order-card-products {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}
.sf-order-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  background: #f0ebe4;
}
.sf-order-thumb-placeholder {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0ebe4;
  border-radius: 8px;
  color: #8c7d6e;
}
.sf-order-product-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sf-order-product-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2723;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-order-more-items {
  font-weight: 400;
  color: #8c7d6e;
  font-size: 0.75rem;
}
.sf-order-item-count {
  font-size: 0.6875rem;
  color: #8c7d6e;
}

.sf-order-card-right {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
}
.sf-order-total-amount {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2c2723;
}

/* Distinct Status Badges */
.sf-order-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  border-radius: 999px;
  text-transform: capitalize;
}
.status-placed {
  background: #fef3c7;
  color: #92400e;
}
.status-paid {
  background: #ecfdf5;
  color: #065f46;
}
.status-processing {
  background: #e0f2fe;
  color: #0369a1;
}
.status-shipped {
  background: #ede9fe;
  color: #6d28d9;
}
.status-delivered {
  background: #dcfce7;
  color: #15803d;
}
.status-cancelled,
.status-refunded {
  background: #fee2e2;
  color: #b91c1c;
}

.sf-order-chevron {
  color: #8c7d6e;
  transition: transform 0.25s ease;
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
  padding: 0.875rem 1.125rem 1.125rem;
  border-top: 1px solid #ece7e0;
  background: #faf8f5;
}

/* Tracking Timeline */
.sf-tracking-section {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e8e3dc;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
}
.sf-cancelled-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #b91c1c;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 6px;
}
.sf-order-timeline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
  position: relative;
}
.sf-timeline-step-wrap {
  display: flex;
  align-items: center;
  flex: 1;
}
.sf-timeline-step-wrap:last-child {
  flex: 0 0 auto;
}
.sf-timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3125rem;
  z-index: 1;
}
.sf-timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e8e3dc;
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
}
.sf-timeline-step.active .sf-timeline-dot {
  background: #059669;
  color: white;
}
.sf-timeline-step.current .sf-timeline-dot {
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}
.sf-timeline-label {
  font-size: 0.625rem;
  font-weight: 600;
  color: #a8947f;
}
.sf-timeline-step.active .sf-timeline-label {
  color: #2c2723;
}
.sf-timeline-step.current .sf-timeline-label {
  color: #059669;
}
.sf-timeline-line {
  flex: 1;
  height: 2px;
  background: #e8e3dc;
  margin: 0 4px 14px 4px;
}
.sf-timeline-line.active {
  background: #059669;
}

/* Items list */
.sf-order-items-list {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e8e3dc;
  border-radius: 0.75rem;
}
.sf-order-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #ece7e0;
}
.sf-order-item-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  min-width: 0;
}
.sf-order-item-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2723;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-order-item-price {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #2c2723;
  flex-shrink: 0;
}
.sf-order-subtotals {
  margin-top: 0.5rem;
  padding-top: 0.25rem;
}

/* Info cards */
.sf-order-info-card {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e8e3dc;
  border-radius: 0.75rem;
}

/* Action Bar */
.sf-order-action-bar {
  display: flex;
  gap: 0.625rem;
  margin-top: 0.75rem;
}
.sf-cancel-order-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #b91c1c;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-cancel-order-btn:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #b91c1c;
}
.sf-cancel-order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sf-buy-again-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-buy-again-btn:hover {
  background: #110e0c;
}

.sf-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
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

/* Address Editor Modal */
.sf-address-editor-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 440px;
  background: white;
  border-radius: 1.25rem;
  z-index: 100003;
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgba(44, 38, 32, 0.3);
}
.sf-section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
}
.sf-field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #5c4f42;
  display: block;
  margin-bottom: 0.25rem;
}
.sf-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  border: 1px solid #dcd5ca;
  border-radius: 0.75rem;
  background: #faf8f5;
  color: #2c2723;
  outline: none;
  transition: all 0.2s;
}
.sf-input:focus {
  border-color: #b8956c;
  background: white;
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.15);
}

.sf-mini-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .sf-orders-modal {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 2rem);
  }
  .sf-orders-header {
    padding: 1.5rem 1.25rem 0.75rem;
  }
  .sf-orders-body {
    padding: 0.5rem 1rem 1.25rem;
  }
}
</style>
