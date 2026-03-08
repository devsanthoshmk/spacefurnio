# 🎨 Reimagined UI Components — Documentation

> **Date:** 2026-03-05
> **Scope:** Cart canvas, Wishlist canvas, Orders modal, Login/Signup modal, Checkout modal

---

## 📋 Overview

All five overlay/modal components were **completely reimagined** with a premium warm-minimalist design, matching the existing shop design system (`shop.css`). Every component:

- Uses **state-based open/close** (managed by reactive refs in App.vue via provide/inject)
- Is **fully responsive** (mobile → desktop)
- Integrates with the **actual backend API** (Worker + Neon Data API)
- Uses **custom Teleport-based drawers/modals** (no PrimeVue Drawer dependency for new components)
- Features **staggered animations**, **skeleton loading states**, and **micro-interactions**

---

## ⚠️ Architecture Decision: State-Based vs Route-Based Modals

### Why we switched from route-based (`/cart`, `/wishlist`, etc.) to state-based:

The original route-based approach used `component: null` routes. When these routes matched:
1. **`<RouterView>` rendered nothing** — the page content disappeared behind the overlay
2. **Double-slash URLs** — appending `/cart` to `route.fullPath` when on `/` created `//cart`
3. **Cart drawer wouldn't appear** — routing glitches caused only the backdrop to show, not the drawer

**State-based modals** (reactive refs + provide/inject) fix all these issues:
- The page stays **fully intact** behind the smooth backdrop overlay  
- No URL manipulation = **no double-slash bugs**  
- Each modal opens **reliably** via its own ref toggle

---

## 🗂️ Files Changed / Created

| File | Action | Description |
|------|--------|-------------|
| `src/components/CartOffCanvas.vue` | **Rewritten** | Reimagined cart drawer with Teleport, free-shipping progress bar, skeleton loading |
| `src/components/WishlistOffCanvas.vue` | **Rewritten** | Reimagined wishlist drawer with 2-column grid card layout |
| `src/components/OrdersModal.vue` | **Created** | Orders modal with expandable cards + timeline |
| `src/components/AuthModal.vue` | **Created** | Login/signup modal with tab switcher, Google OAuth, Worker API |
| `src/components/CheckoutModal.vue` | **Created** | Multi-step checkout (Review → Shipping → Payment) |
| `src/router/index.js` | **Modified** | Removed all `component: null` modal routes |
| `src/App.vue` | **Modified** | State-based modal management via refs + provide/inject |
| `src/components/Nav-component.vue` | **Modified** | User icon opens Login (guest) or Orders (authenticated) |
| `.env` | **Modified** | Added `VITE_WORKER_URL`, `VITE_NEON_URL`, `VITE_CATALOG_URL`, connection strings |

---

## 🔗 Modal Management Pattern

### How Modals Open/Close (State-Based)

```
App.vue                        Component
┌──────────────────────┐       ┌──────────────────────┐
│ const isCartOpen     │──────▸│ inject('cartUtils')  │
│ function openCart()  │       │ { isCartOpen, ...}   │
│ function closeCart() │       │                      │
└──────────────────────┘       └──────────────────────┘
         │
         │ provide('cartUtils', { openCart, closeCart, isCartOpen, ... })
```

Each modal has:
- `isXxxOpen` — reactive `ref(false)` for visibility
- `openXxx()` — sets ref to `true`, calls `closeAllModals()` first to prevent stacking
- `closeXxx()` — sets ref to `false`

### Injected Keys

| Key | Provides | Used By |
|-----|----------|---------|
| `cartUtils` | `openCart, closeCart, isCartOpen, cartItemCount` | CartOffCanvas, Nav |
| `wishlistUtils` | `openWishlist, closeWishlist, isWishlistOpen, wishlistItemCount` | WishlistOffCanvas, Nav |
| `authUtils` | `openLogin, closeLogin, isLoginOpen, authStore` | AuthModal, Nav, Orders, Checkout |
| `ordersUtils` | `openOrders, closeOrders, isOrdersOpen` | OrdersModal, Nav, Checkout |
| `checkoutUtils` | `openCheckout, closeCheckout, isCheckoutOpen` | CheckoutModal, Cart |

---

## 🔌 Backend API Integration

### Authentication (AuthModal)
- **Login:** `POST {VITE_WORKER_URL}/auth/login` with `{ email, password }`
- **Register:** `POST {VITE_WORKER_URL}/auth/register` with `{ email, password, firstName, lastName }`
- **Google OAuth:** Via `authStore.getGoogleAuthUrl()` (existing API client)
- Token stored in `localStorage` via `setAuthToken()`

### Orders (OrdersModal)
- **Fetch Orders:** Uses existing `ordersApi.getAll()` from `@/api`
- RLS automatically scopes to authenticated user

### Checkout (CheckoutModal)
- **Place Order:** `POST {VITE_WORKER_URL}/api/orders/checkout` with cart items, shipping address, payment method
- Clears cart on success, redirects to Orders modal

### Cart & Wishlist
- Use existing Pinia stores (`cart.js`, `wishlist.js`) — no API changes

---

## 🌍 Environment Variables (.env)

```env
# Existing
VITE_API_URL="http://localhost:8787"

# New — Hybrid Backend URLs
VITE_WORKER_URL="https://backend.spacefurnio.workers.dev"
VITE_NEON_URL="https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1"
VITE_CATALOG_URL="https://ep-flat-brook-a1h1dgii.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1"
VITE_NEON_CONN="postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
VITE_CATALOG_CONN="postgresql://authenticator@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

---

## 🎯 Design System Alignment

All components use the **shop design tokens** defined in `src/assets/shop.css`:

| Token | Usage |
|-------|-------|
| `--shop-cream` (#FAF8F5) | Background |
| `--shop-charcoal` (#3D3A36) | Primary buttons, text |
| `--shop-accent` (#B8956C) | Badges, progress bars, highlights |
| `--shop-error` (#C47575) | Wishlist hearts, error states |
| `--shop-success` (#7D9B76) | Success banners, delivered status |
| `--shop-font-display` | Headings (Playfair Display) |
| `--shop-radius-*` | Border radius |
| `--shop-shadow-*` | Elevation |

---

## 📱 Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| `≤ 480px` | Full-width drawers, single-column forms, smaller labels |
| `> 480px` | Max-width constrained drawers (26rem), 2-column grids |

---

## ⚠️ Notes

1. **Scrolling is unchanged.** Per user rules, no scrolling behavior was modified.
2. **No other files were touched.** Only the listed files were created or modified.
3. The `PrimeVue Drawer` import was removed from CartOffCanvas and WishlistOffCanvas (now use custom Teleport-based drawers).
4. The Nav component's user icon is now **context-aware**: opens Login for guests, Opens Orders for authenticated users.
5. **Modal routes were removed from the router** to prevent the blank-page bug. Modals are purely state-driven now.
