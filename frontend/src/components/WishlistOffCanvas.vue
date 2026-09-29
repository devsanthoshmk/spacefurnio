<template>
  <Teleport to="body">
    <!-- Backdrop with blur -->
    <Transition name="wl-backdrop">
      <div v-if="isWishlistOpen" class="sf-wl-backdrop" @click.self="closeWishlist"></div>
    </Transition>

    <!-- Slide-in Drawer -->
    <Transition name="wl-slide">
      <aside
        v-if="isWishlistOpen"
        class="sf-wl-drawer"
        role="dialog"
        aria-label="Wishlist"
        @keydown.esc="closeWishlist"
        tabindex="-1"
        ref="drawerRef"
      >
        <!-- Header -->
        <header class="sf-wl-header">
          <div class="sf-wl-header-inner">
            <div class="sf-wl-title-group">
              <div class="sf-wl-icon-wrap">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  class="text-rose-500"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </div>
              <h2 class="sf-wl-title">My Wishlist</h2>
              <Transition name="badge-pop">
                <span v-if="wishlist.itemCount > 0" class="sf-wl-badge">
                  {{ wishlist.itemCount }}
                </span>
              </Transition>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="wishlist.itemCount > 0"
                @click="handleClearAll"
                :disabled="isClearing"
                class="sf-wl-clear-btn"
                title="Clear all saved items"
              >
                Clear All
              </button>
              <button @click="closeWishlist" class="sf-wl-close" aria-label="Close wishlist">
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
          </div>
        </header>

        <!-- Notification Banner / Toast Feedback -->
        <Transition name="toast-slide">
          <div v-if="feedbackMsg" class="sf-wl-feedback">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class="text-emerald-700"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{{ feedbackMsg }}</span>
          </div>
        </Transition>

        <!-- Body -->
        <div class="sf-wl-body shop-scrollbar">
          <!-- Loading Skeletons -->
          <div v-if="wishlist.isLoading || wishlist.isSyncing" class="sf-wl-skeleton-list">
            <div v-for="i in 3" :key="i" class="sf-wl-skeleton-item animate-pulse">
              <div class="sf-wl-skeleton-img bg-stone-200"></div>
              <div class="sf-wl-skeleton-info flex-1">
                <div class="h-3.5 bg-stone-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-stone-200 rounded w-1/3 mb-2"></div>
                <div class="h-4 bg-stone-200 rounded w-1/4 mb-3"></div>
                <div class="h-8 bg-stone-200 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="wishlist.isEmpty" class="sf-wl-empty">
            <div class="sf-wl-empty-icon">
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                class="text-rose-300"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
            </div>
            <h3 class="sf-wl-empty-title">Your Wishlist is Empty</h3>
            <p class="sf-wl-empty-text">Save your favorite pieces here to easily find and purchase them later.</p>
            <button @click="handleExploreCatalog" class="sf-explore-btn">
              <span>Explore Catalog</span>
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

          <!-- Wishlist Items List -->
          <TransitionGroup v-else name="wl-item-anim" tag="div" class="sf-wl-items">
            <div
              v-for="(item, index) in wishlist.displayItems"
              :key="item.id || item.productId"
              class="sf-wl-item group"
              :style="{ '--stagger': index }"
            >
              <!-- Image Thumbnail -->
              <div class="sf-wl-item-img">
                <img
                  v-if="item.product?.primaryImage || item.product?.thumbnail"
                  :src="getOptimizedThumbnail(item.product.primaryImage || item.product.thumbnail, 160)"
                  :alt="item.product?.name"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="sf-wl-item-img-placeholder">
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

              <!-- Item Information -->
              <div class="sf-wl-item-details">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <h4 class="sf-wl-item-name">{{ item.product?.name || 'Product' }}</h4>
                    <p class="sf-wl-item-price">${{ formatPrice(item.product?.price) }}</p>
                  </div>
                  <!-- Trash remove button -->
                  <button
                    @click="handleRemove(item.id)"
                    :disabled="operatingItemId === item.id"
                    class="sf-wl-remove-btn"
                    aria-label="Remove item"
                    title="Remove from wishlist"
                  >
                    <span v-if="operatingItemId === item.id && operatingAction === 'remove'" class="sf-mini-spinner text-rose-500"></span>
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

                <div class="sf-wl-item-footer">
                  <!-- Stock Status -->
                  <div class="sf-stock-badge" :class="item.product?.inStock !== false ? 'in-stock' : 'out-of-stock'">
                    <span class="sf-stock-dot"></span>
                    <span>{{ item.product?.inStock !== false ? 'In Stock' : 'Out of Stock' }}</span>
                  </div>

                  <!-- Move to Cart Button -->
                  <button
                    @click="handleMoveToCart(item)"
                    :disabled="operatingItemId === item.id || item.product?.inStock === false"
                    class="sf-move-cart-btn"
                  >
                    <span v-if="operatingItemId === item.id && operatingAction === 'move'" class="sf-mini-spinner"></span>
                    <template v-else>
                      <svg
                        width="13"
                        height="13"
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
                      <span>Move to Cart</span>
                    </template>
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Footer -->
        <footer v-if="!wishlist.isEmpty && !wishlist.isLoading" class="sf-wl-footer">
          <button @click="handleExploreCatalog" class="sf-continue-btn">Continue Shopping</button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted, ref, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '@/stores/wishlist'
import { getOptimizedThumbnail } from '@/utils/imageOptimizer.js'

const router = useRouter()
const { isWishlistOpen, closeWishlist: closeWishlistFn } = inject('wishlistUtils')

const wishlist = useWishlistStore()
const drawerRef = ref(null)

const operatingItemId = ref(null)
const operatingAction = ref(null)
const isClearing = ref(false)
const feedbackMsg = ref('')
let feedbackTimer = null

watch(isWishlistOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    feedbackMsg.value = ''
    await nextTick()
    drawerRef.value?.focus()
    await wishlist.fetchWishlist()
  } else {
    document.body.style.overflow = ''
  }
})

function closeWishlist() {
  closeWishlistFn()
}

function handleExploreCatalog() {
  closeWishlist()
  router.push('/shop')
}

function showFeedback(msg) {
  feedbackMsg.value = msg
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedbackMsg.value = ''
  }, 3000)
}

async function handleMoveToCart(item) {
  if (operatingItemId.value) return
  operatingItemId.value = item.id
  operatingAction.value = 'move'

  try {
    await wishlist.moveToCart(item.id)
    showFeedback(`Moved "${item.product?.name || 'Item'}" to your Cart!`)
  } catch (err) {
    console.error('Failed to move item to cart:', err)
  } finally {
    operatingItemId.value = null
    operatingAction.value = null
  }
}

async function handleRemove(itemId) {
  if (operatingItemId.value) return
  operatingItemId.value = itemId
  operatingAction.value = 'remove'

  try {
    await wishlist.removeItem(itemId)
    showFeedback('Item removed from wishlist.')
  } catch (err) {
    console.error('Failed to remove item:', err)
  } finally {
    operatingItemId.value = null
    operatingAction.value = null
  }
}

async function handleClearAll() {
  if (isClearing.value || wishlist.isEmpty) return
  if (!window.confirm('Are you sure you want to clear your entire wishlist?')) return

  try {
    isClearing.value = true
    await wishlist.clearWishlist()
    showFeedback('Wishlist cleared.')
  } catch (err) {
    console.error('Failed to clear wishlist:', err)
  } finally {
    isClearing.value = false
  }
}

function formatPrice(val) {
  return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleEscKey(event) {
  if (event.key === 'Escape' && isWishlistOpen.value) closeWishlist()
}

onMounted(async () => {
  document.addEventListener('keydown', handleEscKey)
  await wishlist.fetchWishlist()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
  if (feedbackTimer) clearTimeout(feedbackTimer)
})
</script>

<style scoped>
/* Backdrop */
.sf-wl-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100001;
}
.wl-backdrop-enter-active,
.wl-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.wl-backdrop-enter-from,
.wl-backdrop-leave-to {
  opacity: 0;
}

/* Drawer */
.sf-wl-drawer {
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
.wl-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.wl-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.7, 0, 0.84, 0);
}
.wl-slide-enter-from,
.wl-slide-leave-to {
  transform: translateX(100%);
}

/* Header */
.sf-wl-header {
  padding: 1.25rem 1.5rem;
  flex-shrink: 0;
  background: #faf8f5;
  border-bottom: 1px solid #e8e3dc;
}
.sf-wl-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sf-wl-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sf-wl-icon-wrap {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 63, 94, 0.1);
  border-radius: 10px;
}
.sf-wl-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2723;
  letter-spacing: -0.01em;
}
.sf-wl-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  background: #f43f5e;
  border-radius: 999px;
}
.badge-pop-enter-active {
  animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badgePop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.sf-wl-clear-btn {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8c7d6e;
  background: transparent;
  border: 1px solid #dcd5ca;
  border-radius: 999px;
  padding: 0.3125rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-wl-clear-btn:hover:not(:disabled) {
  border-color: #c47575;
  color: #c47575;
  background: #fff;
}
.sf-wl-clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-wl-close {
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
.sf-wl-close:hover {
  background: #e8e3dc;
  color: #2c2723;
}

/* Feedback banner */
.sf-wl-feedback {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #ecfdf5;
  border-bottom: 1px solid #a7f3d0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #065f46;
}
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s ease;
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Body */
.sf-wl-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* Skeletons */
.sf-wl-skeleton-list {
  padding: 0 1.5rem;
}
.sf-wl-skeleton-item {
  display: flex;
  gap: 1rem;
  padding: 1.125rem 0;
  border-bottom: 1px solid #e8e3dc;
}
.sf-wl-skeleton-img {
  width: 76px;
  height: 76px;
  border-radius: 12px;
  flex-shrink: 0;
}

/* Empty State */
.sf-wl-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 55vh;
}
.sf-wl-empty-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 63, 94, 0.08);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}
.sf-wl-empty-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #2c2723;
  margin-bottom: 0.375rem;
}
.sf-wl-empty-text {
  font-size: 0.875rem;
  color: #8c7d6e;
  margin-bottom: 1.75rem;
  max-width: 250px;
}
.sf-explore-btn {
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
.sf-explore-btn:hover {
  background: #151311;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(44, 38, 32, 0.25);
}

/* Wishlist Items */
.sf-wl-items {
  position: relative;
}
.sf-wl-item {
  display: flex;
  gap: 1rem;
  padding: 1.125rem 1.5rem;
  border-bottom: 1px solid #ece7e0;
  background: transparent;
  transition: background-color 0.2s;
  animation: wlItemIn 0.35s ease forwards;
  animation-delay: calc(var(--stagger, 0) * 50ms);
  opacity: 0;
}
@keyframes wlItemIn {
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
}
.sf-wl-item:hover {
  background: rgba(232, 227, 220, 0.4);
}

.wl-item-anim-enter-active,
.wl-item-anim-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.wl-item-anim-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.wl-item-anim-leave-to {
  opacity: 0;
  transform: scale(0.9);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
  overflow: hidden;
}

.sf-wl-item-img {
  width: 76px;
  height: 76px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0ebe4;
  border: 1px solid #e2dbd1;
}
.sf-wl-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.sf-wl-item:hover .sf-wl-item-img img {
  transform: scale(1.05);
}
.sf-wl-item-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sf-wl-item-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.sf-wl-item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c2723;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.sf-wl-item-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #b8956c;
  margin-top: 2px;
}

.sf-wl-remove-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #c47575;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
}
.sf-wl-remove-btn:hover {
  background: rgba(196, 117, 117, 0.12);
  opacity: 1;
}

.sf-wl-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.625rem;
}

.sf-stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
}
.sf-stock-badge.in-stock {
  color: #059669;
}
.sf-stock-badge.out-of-stock {
  color: #dc2626;
}
.sf-stock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.sf-move-cart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: #2c2723;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-move-cart-btn:hover:not(:disabled) {
  background: #110e0c;
  transform: translateY(-1px);
}
.sf-move-cart-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Footer */
.sf-wl-footer {
  flex-shrink: 0;
  padding: 1.125rem 1.5rem 1.375rem;
  background: white;
  border-top: 1px solid #e8e3dc;
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
  .sf-wl-drawer {
    max-width: 100%;
  }
  .sf-wl-header,
  .sf-wl-item {
    padding-left: 1.125rem;
    padding-right: 1.125rem;
  }
  .sf-wl-footer {
    padding: 1.125rem;
  }
}
</style>
