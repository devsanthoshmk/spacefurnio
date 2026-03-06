<template>
  <!--
    ================================================================
    WISHLIST OFF-CANVAS — Reimagined
    ================================================================
    Premium warm-minimalist wishlist drawer with:
    - Glassmorphism header
    - Grid view for items (more visual than list)
    - Move-to-cart interaction with confirmation
    - Staggered animations
    - Route-driven open/close (same pattern as before)
    ================================================================
  -->
  <Teleport to="body">
    <div
      v-if="isWishlistOpen"
      class="sf-wl-backdrop"
      @click.self="closeWishlist"
    ></div>

    <aside
      v-if="isWishlistOpen"
      class="sf-wl-drawer"
        role="dialog"
        aria-label="Wishlist"
        @keydown.esc="closeWishlist"
        tabindex="-1"
        ref="drawerRef"
      >
        <!-- ─── Header ─── -->
        <header class="sf-wl-header">
          <div class="sf-wl-header-inner">
            <div class="sf-wl-title-group">
              <div class="sf-wl-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--shop-error, #C47575)" stroke="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h2 class="sf-wl-title">Wishlist</h2>
              <Transition name="badge-pop">
                <span v-if="wishlist.itemCount > 0" class="sf-wl-badge">
                  {{ wishlist.itemCount }}
                </span>
              </Transition>
            </div>
            <button @click="closeWishlist" class="sf-wl-close" aria-label="Close wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- ─── Body ─── -->
        <div class="sf-wl-body shop-scrollbar">
          <!-- Loading Skeleton -->
          <div v-if="wishlist.isLoading" class="sf-wl-skeleton-grid">
            <div v-for="i in 4" :key="i" class="sf-wl-skeleton-card">
              <div class="sf-wl-skeleton-img shop-skeleton"></div>
              <div style="padding:0.75rem;">
                <div class="shop-skeleton" style="height:14px;width:80%;border-radius:6px;"></div>
                <div class="shop-skeleton" style="height:12px;width:50%;border-radius:6px;margin-top:8px;"></div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="wishlist.isEmpty" class="sf-wl-empty">
            <div class="sf-wl-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--shop-tan)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3 class="sf-wl-empty-title">No saved items yet</h3>
            <p class="sf-wl-empty-text">Tap the heart on any product to save it here.</p>
            <button @click="closeWishlist" class="shop-btn shop-btn-primary sf-wl-empty-btn">
              Explore Collection
            </button>
          </div>

          <!-- Wishlist Items Grid -->
          <TransitionGroup v-else name="wl-item" tag="div" class="sf-wl-grid">
            <div
              v-for="(item, index) in wishlist.items"
              :key="item.id"
              class="sf-wl-card"
              :style="{ '--stagger': index }"
            >
              <div class="sf-wl-card-img shop-img-zoom">
                <img
                  v-if="item.product?.primaryImage"
                  :src="item.product.primaryImage"
                  :alt="item.product?.name"
                  loading="lazy"
                />
                <div v-else class="sf-wl-card-img-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--shop-tan)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>

                <!-- Remove heart button (top-right on card) -->
                <button
                  @click="removeItem(item.id)"
                  class="sf-wl-card-heart"
                  aria-label="Remove from wishlist"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--shop-error, #C47575)" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>

              <div class="sf-wl-card-info">
                <h4 class="sf-wl-card-name">{{ item.product?.name }}</h4>
                <p v-if="item.variant" class="sf-wl-card-variant">{{ item.variant }}</p>
                <p class="sf-wl-card-price">${{ item.product?.price?.toLocaleString() }}</p>

                <button @click="moveToCart(item.id)" class="sf-wl-add-cart-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- ─── Footer ─── -->
        <footer v-if="!wishlist.isEmpty && !wishlist.isLoading" class="sf-wl-footer">
          <button @click="closeWishlist" class="sf-continue-btn">Continue Shopping</button>
        </footer>
      </aside>
  </Teleport>
</template>

<script setup>
/**
 * ===========================================
 * WISHLIST OFF-CANVAS — Reimagined
 * ===========================================
 * State-driven wishlist panel with a visual grid layout.
 *
 * Uses:
 * - Injected isWishlistOpen ref from App.vue
 * - Injected closeWishlist() from App.vue
 * - Pinia wishlist store for data
 *
 * Features:
 * - Custom Teleport-based drawer (no PrimeVue Drawer)
 * - Grid card layout for visual browsing
 * - Heart toggle on each card
 * - Staggered grid entrance animation
 */

import { computed, watch, onMounted, onUnmounted, ref, nextTick, inject } from 'vue'
import { useWishlistStore } from '@/stores/wishlist'

// ─── Inject modal state from App.vue ───
const { isWishlistOpen, closeWishlist: closeWishlistFn } = inject('wishlistUtils')

const wishlist = useWishlistStore()
const drawerRef = ref(null)

watch(isWishlistOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    drawerRef.value?.focus()
    wishlist.fetchWishlist()
  } else {
    document.body.style.overflow = ''
  }
})

// ─── Navigation ───
function closeWishlist() {
  closeWishlistFn()
}

// ─── Wishlist Actions ───
async function moveToCart(itemId) {
  try {
    await wishlist.moveToCart(itemId)
  } catch (error) {
    console.error('Failed to move item to cart:', error)
  }
}
async function removeItem(itemId) {
  try {
    await wishlist.removeItem(itemId)
  } catch (error) {
    console.error('Failed to remove item:', error)
  }
}

// ─── Keyboard ───
function handleEscKey(event) {
  if (event.key === 'Escape' && isWishlistOpen.value) closeWishlist()
}
onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
  wishlist.fetchWishlist()
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<style>
/* ═══════════════════════════════════════════
   WISHLIST DRAWER — Reimagined Styles
   ═══════════════════════════════════════════ */

/* Backdrop */
.sf-wl-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 100001;
  animation: wlBackdropIn 0.3s ease forwards;
}
@keyframes wlBackdropIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Drawer */
.sf-wl-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 26rem;
  background: var(--shop-cream, #FAF8F5);
  z-index: 100002;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(61, 58, 54, 0.12);
  outline: none;
  animation: wlSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes wlSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Header */
.sf-wl-header {
  padding: 1.25rem 1.5rem;
  flex-shrink: 0;
  border-bottom: 1px solid var(--shop-beige, #E8E3DC);
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
  background: rgba(196, 117, 117, 0.12);
  border-radius: 10px;
}
.sf-wl-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
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
  background: var(--shop-error, #C47575);
  border-radius: 999px;
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
  color: var(--shop-brown, #A89B8C);
  cursor: pointer;
  transition: all 0.2s;
}
.sf-wl-close:hover {
  background: var(--shop-beige, #E8E3DC);
  color: var(--shop-charcoal, #3D3A36);
}

/* Body */
.sf-wl-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Skeleton Grid */
.sf-wl-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
.sf-wl-skeleton-card {
  border-radius: var(--shop-radius-lg, 1rem);
  overflow: hidden;
  background: white;
}
.sf-wl-skeleton-img {
  width: 100%;
  aspect-ratio: 1;
}

/* Empty State */
.sf-wl-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  min-height: 50vh;
}
.sf-wl-empty-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(196, 117, 117, 0.08);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}
.sf-wl-empty-title {
  font-family: var(--shop-font-display, 'Playfair Display', serif);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--shop-charcoal, #3D3A36);
  margin-bottom: 0.5rem;
}
.sf-wl-empty-text {
  font-size: 0.875rem;
  color: var(--shop-brown, #A89B8C);
  margin-bottom: 1.5rem;
  max-width: 240px;
}
.sf-wl-empty-btn {
  min-width: 180px;
}

/* Grid */
.sf-wl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

/* Card */
.sf-wl-card {
  background: white;
  border-radius: var(--shop-radius-lg, 1rem);
  overflow: hidden;
  transition: all 0.25s ease;
  animation: wlCardIn 0.45s ease forwards;
  animation-delay: calc(var(--stagger, 0) * 80ms);
  opacity: 0;
}
@keyframes wlCardIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.sf-wl-card:hover {
  box-shadow: var(--shop-shadow-lg);
  transform: translateY(-2px);
}

/* Item transition */
.wl-item-enter-active,
.wl-item-leave-active {
  transition: all 0.35s ease;
}
.wl-item-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.wl-item-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.sf-wl-card-img {
  width: 100%;
  aspect-ratio: 1;
  background: var(--shop-cream-dark, #F5F2ED);
  position: relative;
}
.sf-wl-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sf-wl-card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Heart button on card */
.sf-wl-card-heart {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  opacity: 0;
}
.sf-wl-card:hover .sf-wl-card-heart {
  opacity: 1;
}
.sf-wl-card-heart:hover {
  transform: scale(1.1);
  background: rgba(196, 117, 117, 0.1);
}

.sf-wl-card-info {
  padding: 0.75rem;
}
.sf-wl-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-charcoal, #3D3A36);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.sf-wl-card-variant {
  font-size: 0.6875rem;
  color: var(--shop-brown, #A89B8C);
  margin-top: 2px;
}
.sf-wl-card-price {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shop-accent-dark, #8C6D4D);
  margin-top: 4px;
}
.sf-wl-add-cart-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: var(--shop-charcoal, #3D3A36);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.sf-wl-add-cart-btn:hover {
  background: var(--shop-black, #1A1816);
  transform: translateY(-1px);
}
.sf-wl-add-cart-btn:active {
  transform: translateY(0);
}

/* Footer */
.sf-wl-footer {
  flex-shrink: 0;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--shop-beige, #E8E3DC);
}

/* Responsive */
@media (max-width: 480px) {
  .sf-wl-drawer {
    max-width: 100%;
  }
  .sf-wl-header {
    padding: 1rem;
  }
  .sf-wl-body {
    padding: 0.75rem;
  }
  .sf-wl-footer {
    padding: 0.75rem 1rem 1rem;
  }
  .sf-wl-grid {
    gap: 0.5rem;
  }
}
</style>
