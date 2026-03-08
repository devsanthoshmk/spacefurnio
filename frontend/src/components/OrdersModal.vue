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
      <div v-if="isOpen" class="sf-orders-backdrop" @click.self="closeModal"></div>
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
          <h2 class="sf-orders-title">My Orders</h2>
          <p class="sf-orders-subtitle">Track and manage your purchases</p>
        </header>

        <!-- Body -->
        <div class="sf-orders-body shop-scrollbar">
          <!-- Loading -->
          <div v-if="isLoading" class="sf-orders-loading">
            <div v-for="i in 3" :key="i" class="sf-orders-skeleton-card">
              <div class="sf-orders-skeleton-header">
                <div
                  class="shop-skeleton"
                  style="height: 14px; width: 120px; border-radius: 6px"
                ></div>
                <div
                  class="shop-skeleton"
                  style="height: 24px; width: 80px; border-radius: 999px"
                ></div>
              </div>
              <div class="sf-orders-skeleton-body">
                <div
                  class="shop-skeleton"
                  style="height: 12px; width: 60%; border-radius: 6px"
                ></div>
                <div
                  class="shop-skeleton"
                  style="height: 12px; width: 40%; border-radius: 6px; margin-top: 6px"
                ></div>
              </div>
            </div>
          </div>

          <!-- Not Authenticated -->
          <div v-else-if="!authStore.isAuthenticated" class="sf-orders-empty">
            <div class="sf-orders-empty-icon">
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--shop-tan)"
                stroke-width="1.2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 class="sf-orders-empty-title">Sign in to view orders</h3>
            <p class="sf-orders-empty-text">Log in to your account to see your order history.</p>
            <button @click="goToLogin" class="shop-btn shop-btn-primary">Sign In</button>
          </div>

          <!-- Empty -->
          <div v-else-if="ordersList.length === 0" class="sf-orders-empty">
            <div class="sf-orders-empty-icon">
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--shop-tan)"
                stroke-width="1.2"
              >
                <path
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <h3 class="sf-orders-empty-title">No orders yet</h3>
            <p class="sf-orders-empty-text">
              Your order history will appear here once you make a purchase.
            </p>
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
                <div class="sf-order-card-products">
                  <div class="sf-order-thumbnails">
                    <img
                      v-if="order.order_items?.[0]?.product_image"
                      :src="order.order_items[0].product_image"
                      :alt="order.order_items[0].product_name"
                      class="sf-order-thumb"
                    />
                    <div v-else class="sf-order-thumb-placeholder">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  </div>
                  <div class="sf-order-product-info">
                    <span class="sf-order-product-name">
                      {{ order.order_items?.[0]?.product_name || 'Product' }}
                      <span v-if="order.order_items?.length > 1" class="sf-order-more-items">
                        +{{ order.order_items.length - 1 }} more
                      </span>
                    </span>
                    <span class="sf-order-item-count"
                      >{{ order.order_items?.length || 0 }} item{{
                        order.order_items?.length !== 1 ? 's' : ''
                      }}
                      · {{ formatDate(order.created_at) }}</span
                    >
                  </div>
                </div>
                <div class="sf-order-card-right">
                  <span class="sf-order-total-amount">${{ formatPrice(order.total_amount) }}</span>
                  <span :class="['sf-order-status', `sf-status-${order.status}`]">
                    {{ formatStatus(order.status) }}
                  </span>
                  <svg
                    :class="[
                      'sf-order-chevron',
                      { 'sf-order-chevron-open': expandedOrder === order.id },
                    ]"
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
                      <span class="sf-order-item-price"
                        >${{ formatPrice(item.unit_price * item.quantity) }}</span
                      >
                    </div>
                  </div>

                  <div class="sf-order-total">
                    <span>Total</span>
                    <span class="sf-order-total-value">${{ formatPrice(order.total_amount) }}</span>
                  </div>

                  <!-- Shipping Info -->
                  <div class="sf-order-shipping">
                    <div class="sf-order-shipping-header">
                      <span class="sf-order-shipping-title">Shipping Address</span>
                      <button
                        v-if="canEditShipping(order.status)"
                        @click.stop="openAddressEditor(order)"
                        class="sf-order-edit-btn"
                      >
                        Edit
                      </button>
                    </div>
                    <div class="sf-order-shipping-content">
                      <template
                        v-if="
                          order.shipping_first_name ||
                          order.shipping_last_name ||
                          order.shipping_address ||
                          order.shipping_city ||
                          order.shipping_state ||
                          order.shipping_pincode ||
                          order.shipping_phone
                        "
                      >
                        <p v-if="order.shipping_first_name || order.shipping_last_name">
                          <span class="sf-shipping-label">Name:</span>
                          {{ order.shipping_first_name }} {{ order.shipping_last_name }}
                        </p>
                        <p v-if="order.shipping_address">
                          <span class="sf-shipping-label">Address:</span>
                          {{ order.shipping_address }}
                        </p>
                        <p
                          v-if="
                            order.shipping_city || order.shipping_state || order.shipping_pincode
                          "
                        >
                          <span class="sf-shipping-label">City:</span>
                          {{ order.shipping_city
                          }}{{ order.shipping_city && order.shipping_state ? ', ' : ''
                          }}{{ order.shipping_state }} {{ order.shipping_pincode }}
                        </p>
                        <p v-if="order.shipping_phone">
                          <span class="sf-shipping-label">Phone:</span>
                          {{ order.shipping_phone }}
                        </p>
                      </template>
                      <p v-else class="sf-order-no-shipping">No shipping address provided</p>
                      <p class="sf-order-payment">
                        <span class="sf-order-payment-label">Payment:</span>
                        {{ formatPaymentMethod(order.payment_method || order.paymentMethod) }}
                      </p>
                    </div>
                  </div>

                  <!-- Order Actions -->
                  <div class="sf-order-actions">
                    <button
                      class="sf-order-action-btn sf-order-buy-again"
                      @click.stop="buyAgain(order)"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M23 4v6h-6M1 20v-6h6" />
                        <path
                          d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
                        />
                      </svg>
                      Buy Again
                    </button>
                    <button
                      class="sf-order-action-btn sf-order-invoice"
                      @click.stop="viewInvoice(order)"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      View Invoice
                    </button>
                  </div>

                  <!-- Order Timeline -->
                  <div class="sf-order-timeline">
                    <div
                      :class="[
                        'sf-timeline-step',
                        { active: isStepActive(order.status, 'placed') },
                      ]"
                    >
                      <div class="sf-timeline-dot"></div>
                      <span class="sf-timeline-label">Placed</span>
                      <span class="sf-timeline-date">{{ formatDate(order.created_at) }}</span>
                    </div>
                    <div class="sf-timeline-line"></div>
                    <div
                      :class="[
                        'sf-timeline-step',
                        { active: isStepActive(order.status, 'processing') },
                      ]"
                    >
                      <div class="sf-timeline-dot"></div>
                      <span class="sf-timeline-label">Processing</span>
                    </div>
                    <div class="sf-timeline-line"></div>
                    <div
                      :class="[
                        'sf-timeline-step',
                        { active: isStepActive(order.status, 'shipped') },
                      ]"
                    >
                      <div class="sf-timeline-dot"></div>
                      <span class="sf-timeline-label">Shipped</span>
                    </div>
                    <div class="sf-timeline-line"></div>
                    <div
                      :class="[
                        'sf-timeline-step',
                        { active: isStepActive(order.status, 'delivered') },
                      ]"
                    >
                      <div class="sf-timeline-dot"></div>
                      <span class="sf-timeline-label">Delivered</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Address Editor Modal -->
    <Transition name="modal-backdrop">
      <div
        v-if="showAddressEditor"
        class="sf-orders-backdrop"
        @click.self="closeAddressEditor"
      ></div>
    </Transition>
    <Transition name="modal-content">
      <div
        v-if="showAddressEditor"
        class="sf-address-editor-modal"
        role="dialog"
        aria-label="Edit Shipping Address"
      >
        <button @click="closeAddressEditor" class="sf-address-editor-close" aria-label="Close">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3 class="sf-address-editor-title">Edit Shipping Address</h3>

        <!-- Existing Addresses Dropdown -->
        <div v-if="!isNewAddress && userAddresses.length > 0" class="sf-address-options">
          <label class="sf-address-label">Select from saved addresses</label>
          <div class="sf-address-list">
            <div
              v-for="addr in userAddresses"
              :key="addr.id"
              class="sf-address-option"
              :class="{ active: addressForm.selectedAddressId === addr.id }"
              @click="selectAddress(addr)"
            >
              <p class="sf-address-option-line1">{{ addr.address_line_1 }}</p>
              <p class="sf-address-option-line2">
                {{ addr.city }}, {{ addr.state }} {{ addr.postal_code }}
              </p>
            </div>
            <button class="sf-address-new-btn" @click="startNewAddress">+ Add New Address</button>
          </div>
        </div>

        <!-- New Address Form -->
        <div v-if="isNewAddress || userAddresses.length === 0" class="sf-address-form">
          <div class="sf-address-row">
            <div class="sf-address-col">
              <label class="sf-address-field-label">First Name</label>
              <input
                v-model="addressForm.first_name"
                type="text"
                placeholder="First Name"
                class="sf-address-input"
              />
            </div>
            <div class="sf-address-col">
              <label class="sf-address-field-label">Last Name</label>
              <input
                v-model="addressForm.last_name"
                type="text"
                placeholder="Last Name"
                class="sf-address-input"
              />
            </div>
          </div>
          <div class="sf-address-field">
            <label class="sf-address-field-label">Address</label>
            <input
              v-model="addressForm.address"
              type="text"
              placeholder="Street address"
              class="sf-address-input"
            />
          </div>
          <div class="sf-address-row">
            <div class="sf-address-col">
              <label class="sf-address-field-label">City</label>
              <input
                v-model="addressForm.city"
                type="text"
                placeholder="City"
                class="sf-address-input"
              />
            </div>
            <div class="sf-address-col">
              <label class="sf-address-field-label">State</label>
              <input
                v-model="addressForm.state"
                type="text"
                placeholder="State"
                class="sf-address-input"
              />
            </div>
          </div>
          <div class="sf-address-row">
            <div class="sf-address-col">
              <label class="sf-address-field-label">Pincode</label>
              <input
                v-model="addressForm.pincode"
                type="text"
                placeholder="Pincode"
                class="sf-address-input"
              />
            </div>
            <div class="sf-address-col">
              <label class="sf-address-field-label">Phone Number</label>
              <input
                v-model="addressForm.phone"
                type="tel"
                placeholder="Phone Number"
                class="sf-address-input"
              />
            </div>
          </div>

          <button @click="saveAddress" :disabled="isSavingAddress" class="sf-address-save-btn">
            {{ isSavingAddress ? 'Saving...' : 'Save Address' }}
          </button>

          <button
            v-if="userAddresses.length > 0"
            @click="isNewAddress = false"
            class="sf-address-back-btn"
          >
            Back to saved addresses
          </button>
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

import { ref, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { addresses as addressesApi } from '@/api'
import { enrichOrderItems } from '@/api/shopApi'
import { api } from '@/lib/api'

// ─── Inject modal state from App.vue ───
const { isOrdersOpen: isOpen, closeOrders } = inject('ordersUtils')
const { openLogin } = inject('authUtils')

const authStore = useAuthStore()
const modalRef = ref(null)

const ordersList = ref([])
const isLoading = ref(false)
const expandedOrder = ref(null)

// Address editor state
const showAddressEditor = ref(false)
const editingOrder = ref(null)
const userAddresses = ref([])
const addressForm = ref({
  first_name: '',
  last_name: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  selectedAddressId: '',
})
const isNewAddress = ref(false)
const isSavingAddress = ref(false)

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
    const orders = await api.getOrders()

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const enrichedItems = await enrichOrderItems((order.order_items || []).filter(Boolean))

        let shippingFirstName = (order.shipping_first_name || '').trim()
        let shippingLastName = (order.shipping_last_name || '').trim()
        let shippingAddress = (order.shipping_address || '').trim()
        let shippingCity = (order.shipping_city || '').trim()
        let shippingState = (order.shipping_state || '').trim()
        let shippingPincode = (order.shipping_pincode || '').trim()
        let shippingPhone = (order.shipping_phone || '').trim()

        let addrFallback = null
        if (Array.isArray(order.user_addresses) && order.user_addresses.length) {
          addrFallback = order.user_addresses[0]
        } else if (order.user_addresses && !Array.isArray(order.user_addresses)) {
          addrFallback = order.user_addresses
        }

        if (!shippingAddress && addrFallback) {
          shippingAddress = addrFallback.address_line_2
            ? `${addrFallback.address_line_1}, ${addrFallback.address_line_2}`
            : addrFallback.address_line_1 || ''
          shippingCity = (addrFallback.city || '').trim()
          shippingState = (addrFallback.state || '').trim()
          shippingPincode = (addrFallback.postal_code || '').trim()
        }

        let paymentMethod = String(order.payment_method || order.paymentMethod || '').trim()
        if (!paymentMethod && Array.isArray(order.payments) && order.payments.length) {
          paymentMethod = String(
            order.payments[0]?.method ||
              order.payments[0]?.payment_method ||
              order.payments[0]?.paymentMethod ||
              '',
          ).trim()
        } else if (!paymentMethod && order.payments && !Array.isArray(order.payments)) {
          paymentMethod = String(
            order.payments.method || order.payments.payment_method || order.payments.paymentMethod || '',
          ).trim()
        }

        if (!paymentMethod) paymentMethod = 'N/A'

        return {
          ...order,
          order_items: enrichedItems,
          shipping_first_name: shippingFirstName,
          shipping_last_name: shippingLastName,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_state: shippingState,
          shipping_pincode: shippingPincode,
          shipping_phone: shippingPhone,
          payment_method: paymentMethod,
        }
      }),
    )
    ordersList.value = enrichedOrders
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

// ─── Shipping Edit ───
function canEditShipping(status) {
  return status === 'placed' || status === 'paid' || status === 'processing'
}

async function openAddressEditor(order) {
  editingOrder.value = order
  addressForm.value = {
    first_name: order.shipping_first_name || '',
    last_name: order.shipping_last_name || '',
    address: order.shipping_address || '',
    city: order.shipping_city || '',
    state: order.shipping_state || '',
    pincode: order.shipping_pincode || '',
    phone: order.shipping_phone || '',
    selectedAddressId: '',
  }
  isNewAddress.value = false

  try {
    userAddresses.value = await addressesApi.getAll()
  } catch (err) {
    console.error('Failed to fetch addresses:', err)
    userAddresses.value = []
  }

  showAddressEditor.value = true
}

function closeAddressEditor() {
  showAddressEditor.value = false
  editingOrder.value = null
  userAddresses.value = []
  isNewAddress.value = false
}

function selectAddress(address) {
  addressForm.value = {
    first_name: address.address_line_1 || '',
    last_name: '',
    address: address.address_line_2
      ? `${address.address_line_1}, ${address.address_line_2}`
      : address.address_line_1,
    city: address.city || '',
    state: address.state || '',
    pincode: address.postal_code || '',
    phone: '',
    selectedAddressId: address.id,
  }
  isNewAddress.value = false
}

function startNewAddress() {
  addressForm.value = {
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    selectedAddressId: '',
  }
  isNewAddress.value = true
}

async function saveAddress() {
  if (!editingOrder.value) return

  isSavingAddress.value = true
  try {
    await api.updateOrderShipping(editingOrder.value.id, {
      shipping_first_name: addressForm.value.first_name,
      shipping_last_name: addressForm.value.last_name,
      shipping_address: addressForm.value.address,
      shipping_city: addressForm.value.city,
      shipping_state: addressForm.value.state,
      shipping_pincode: addressForm.value.pincode,
      shipping_phone: addressForm.value.phone,
    })

    // Update local order data
    const orderIndex = ordersList.value.findIndex((o) => o.id === editingOrder.value.id)
    if (orderIndex !== -1) {
      ordersList.value[orderIndex] = {
        ...ordersList.value[orderIndex],
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
  } catch (err) {
    console.error('Failed to update shipping:', err)
    alert('Failed to update shipping address. Please try again.')
  } finally {
    isSavingAddress.value = false
  }
}

// ─── Buy Again ───
async function buyAgain(order) {
  try {
    const { addToCart } = await import('@/stores/cart')
    const cartStore = await addToCart()

    for (const item of order.order_items || []) {
      if (item.product_id) {
        await cartStore.addItem(item.product_id, item.quantity)
      }
    }
    alert('Items added to cart!')
    closeModal()
  } catch (err) {
    console.error('Failed to add to cart:', err)
    alert('Failed to add items to cart. Please try again.')
  }
}

// ─── View Invoice ───
function viewInvoice(order) {
  alert(
    `Invoice for order #${order.id?.slice(0, 8).toUpperCase()}\nTotal: $${formatPrice(order.total_amount)}\n\nInvoice download would be implemented here.`,
  )
}

// ─── Helpers ───
function formatPrice(val) {
  return (val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
function formatStatus(status) {
  const map = {
    pending: 'Pending',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    placed: 'Placed',
  }
  return map[status] || status || 'Unknown'
}

function formatPaymentMethod(method) {
  const normalized = String(method || '').trim().toLowerCase()
  if (!normalized) return 'N/A'

  const map = {
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Card',
    razorpay: 'Razorpay',
    paypal: 'PayPal',
    stripe: 'Stripe',
  }

  return map[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const statusOrder = ['placed', 'paid', 'pending', 'processing', 'shipped', 'delivered']
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
  width: calc(100% - 1rem);
  max-width: 680px;
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
  background: var(--shop-beige, #e8e3dc);
  color: var(--shop-brown-dark, #8b7d6d);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}
.sf-orders-modal-close:hover {
  background: var(--shop-beige-dark, #d4cfc6);
  color: var(--shop-charcoal, #3d3a36);
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
  background: var(--shop-beige, #e8e3dc);
  border-radius: 14px;
  color: var(--shop-brown-dark, #8b7d6d);
  margin-bottom: 0.75rem;
}
.sf-orders-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
}
.sf-orders-subtitle {
  font-size: 0.8125rem;
  color: var(--shop-brown, #a89b8c);
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
  background: var(--shop-beige, #e8e3dc);
  border-radius: 50%;
  margin-bottom: 1.25rem;
}
.sf-orders-empty-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin-bottom: 0.375rem;
}
.sf-orders-empty-text {
  font-size: 0.8125rem;
  color: var(--shop-brown, #a89b8c);
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
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  background: var(--shop-cream-dark, #f5f2ed);
}
.sf-order-card-products {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}
.sf-order-thumbnails {
  flex-shrink: 0;
}
.sf-order-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--shop-beige, #e8e3dc);
}
.sf-order-thumb-placeholder {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--shop-beige, #e8e3dc);
  border-radius: 8px;
  color: var(--shop-brown, #a89b8c);
}
.sf-order-product-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.sf-order-product-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sf-order-more-items {
  font-weight: 400;
  color: var(--shop-brown, #a89b8c);
  margin-left: 0.25rem;
}
.sf-order-item-count {
  font-size: 0.6875rem;
  color: var(--shop-brown, #a89b8c);
}
.sf-order-card-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sf-order-total-amount {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
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
.sf-status-pending,
.sf-status-placed {
  background: rgba(212, 168, 75, 0.12);
  color: #b88e30;
}
.sf-status-processing {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}
.sf-status-shipped {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}
.sf-status-delivered {
  background: rgba(125, 155, 118, 0.15);
  color: var(--shop-success, #5a7d51);
}
.sf-status-cancelled,
.sf-status-refunded {
  background: rgba(196, 117, 117, 0.1);
  color: var(--shop-error, #c47575);
}

.sf-order-chevron {
  transition: transform 0.25s ease;
  color: var(--shop-brown, #a89b8c);
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
  border-top: 1px solid var(--shop-beige, #e8e3dc);
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
  color: var(--shop-charcoal, #3d3a36);
}
.sf-order-item-qty {
  font-size: 0.75rem;
  color: var(--shop-brown, #a89b8c);
}
.sf-order-item-price {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
}
.sf-order-total {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  padding-top: 0.625rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
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
  color: var(--shop-tan, #c4b8a9);
  white-space: nowrap;
}
.sf-timeline-step.active span {
  color: var(--shop-accent-dark, #8c6d4d);
  font-weight: 700;
}
.sf-timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--shop-beige-dark, #d4cfc6);
  transition: all 0.3s;
}
.sf-timeline-step.active .sf-timeline-dot {
  background: var(--shop-accent, #b8956c);
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.2);
}
.sf-timeline-line {
  flex: 1;
  height: 2px;
  background: var(--shop-beige-dark, #d4cfc6);
  min-width: 16px;
  margin-bottom: 1.25rem;
}
.sf-timeline-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--shop-tan, #c4b8a9);
  white-space: nowrap;
}
.sf-timeline-date {
  display: block;
  font-size: 0.5625rem;
  color: var(--shop-brown, #a89b8c);
  margin-top: 2px;
}
.sf-timeline-step.active .sf-timeline-label {
  color: var(--shop-accent-dark, #8c6d4d);
  font-weight: 700;
}
.sf-timeline-step.active .sf-timeline-date {
  color: var(--shop-accent, #b8956c);
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
  .sf-address-editor-modal {
    width: calc(100% - 1.5rem);
    max-height: calc(100vh - 3rem);
    padding: 1.25rem;
    border-radius: 1rem;
  }
  .sf-address-form {
    gap: 0.875rem;
  }
  .sf-address-field {
    gap: 0.375rem;
  }
  .sf-address-field-label {
    font-size: 0.6875rem;
  }
  .sf-address-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  .sf-address-input {
    width: 100%;
  }
}

/* Shipping Info */
.sf-order-shipping {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}
.sf-order-shipping-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.sf-order-shipping-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--shop-charcoal, #3d3a36);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.sf-order-edit-btn {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--shop-accent, #b8956c);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.sf-order-edit-btn:hover {
  color: var(--shop-accent-dark, #8c6d4d);
}
.sf-order-shipping-content {
  font-size: 0.8125rem;
  color: var(--shop-brown, #a89b8c);
  line-height: 1.6;
}
.sf-order-shipping-content p {
  margin: 0 0 0.375rem;
}
.sf-order-no-shipping {
  font-style: italic;
  color: var(--shop-tan, #c4b8a9);
}
.sf-order-payment {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--shop-beige, #e8e3dc);
}
.sf-order-payment-label {
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
}

/* Order Actions */
.sf-order-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--shop-beige, #e8e3dc);
}
.sf-order-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-order-buy-again {
  background: var(--shop-accent, #b8956c);
  color: white;
  border: none;
}
.sf-order-buy-again:hover {
  background: var(--shop-accent-dark, #8c6d4d);
}
.sf-order-invoice {
  background: white;
  color: var(--shop-charcoal, #3d3a36);
  border: 1px solid var(--shop-beige-dark, #d4cfc6);
}
.sf-order-invoice:hover {
  border-color: var(--shop-accent, #b8956c);
  color: var(--shop-accent, #b8956c);
}

/* Shipping Label */
.sf-shipping-label {
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  margin-right: 0.25rem;
}

/* Address Editor Modal */
.sf-address-editor-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 440px;
  max-height: calc(100vh - 4rem);
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 1rem;
  z-index: 100003;
  padding: 1.5rem;
  overflow-y: auto;
  box-shadow:
    0 20px 50px rgba(61, 58, 54, 0.25),
    0 0 0 1px rgba(61, 58, 54, 0.05);
}
.sf-address-editor-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: var(--shop-beige, #e8e3dc);
  color: var(--shop-brown-dark, #8b7d6d);
  cursor: pointer;
}
.sf-address-editor-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3d3a36);
  margin: 0 0 1.25rem;
}
.sf-address-options {
  margin-bottom: 1rem;
}
.sf-address-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--shop-brown, #a89b8c);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}
.sf-address-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sf-address-option {
  padding: 0.875rem;
  background: #faf8f5;
  border: 1px solid var(--shop-beige, #e8e3dc);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-address-option:hover {
  border-color: var(--shop-accent, #b8956c);
  background: #fff;
}
.sf-address-option.active {
  border-color: var(--shop-accent, #b8956c);
  background: rgba(184, 149, 108, 0.08);
  box-shadow: 0 2px 8px rgba(184, 149, 108, 0.15);
}
.sf-address-option-line1 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3d3a36);
  margin: 0;
}
.sf-address-option-line2 {
  font-size: 0.75rem;
  color: var(--shop-brown, #a89b8c);
  margin: 0.25rem 0 0;
}
.sf-address-new-btn {
  padding: 0.75rem;
  background: none;
  border: 1px dashed var(--shop-beige-dark, #d4cfc6);
  border-radius: 8px;
  color: var(--shop-accent, #b8956c);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-address-new-btn:hover {
  border-color: var(--shop-accent, #b8956c);
  background: rgba(184, 149, 108, 0.05);
}
.sf-address-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sf-address-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sf-address-field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--shop-brown-dark, #8b7d6d);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.sf-address-row {
  display: flex;
  gap: 0.75rem;
}
.sf-address-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sf-address-row > .sf-address-input {
  min-width: 0;
}
.sf-address-row-3 {
  display: flex;
  gap: 0.75rem;
}
.sf-address-row-3 .sf-address-input {
  flex: 1;
}
.sf-address-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  border: 1px solid #e8e3dc;
  border-radius: 10px;
  background: #faf8f5;
  color: var(--shop-charcoal, #3d3a36);
  outline: none;
  transition: all 0.2s;
}
.sf-address-input:focus {
  border-color: var(--shop-accent, #b8956c);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(184, 149, 108, 0.1);
}
.sf-address-input::placeholder {
  color: #a89b8c;
}

/* Large screen improvements */
@media (min-width: 480px) {
  .sf-address-form {
    gap: 1.25rem;
  }
  .sf-address-row {
    gap: 1rem;
  }
}
.sf-address-save-btn {
  padding: 0.875rem;
  background: var(--shop-accent, #b8956c);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.75rem;
  box-shadow: 0 2px 8px rgba(184, 149, 108, 0.25);
}
.sf-address-save-btn:hover:not(:disabled) {
  background: var(--shop-accent-dark, #8c6d4d);
  box-shadow: 0 4px 12px rgba(184, 149, 108, 0.3);
}
.sf-address-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.sf-address-back-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--shop-brown, #a89b8c);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
}
</style>
