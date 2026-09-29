# Modals and Offcanvas Drawers Suite Upgrade

## Overview
Comprehensive overhaul and enhancement of SpaceFurnio's shopping drawers, checkout workflow, order tracking, authentication dialogs, and navigation header.

## Components Upgraded

### 1. Cart Drawer (`frontend/src/components/CartOffCanvas.vue`)
- **Slide-in Motion**: Right-aligned slide drawer with background backdrop blur (`backdrop-filter: blur(8px)`).
- **Header & Progress Bar**: Cart item counter badge and free shipping progress bar with dynamic amount remaining and success indicators ($150 threshold).
- **Interactive Items**:
  - Thumbnail preview with placeholder fallback.
  - Brand tag and product title.
  - Formatted unit pricing and total per line item.
  - Quantity increment/decrement buttons with per-item loading spinners.
  - Delete action with staggered exit animation.
- **Coupon Code Management**:
  - Promo code input with instant validation and discount computation.
  - Removable active coupon chip/badge with one-click removal.
- **Order Summary**:
  - Item subtotal, applied discount calculation, shipping estimate (Free over threshold), and calculated total.
- **Checkout CTA**: Primary action triggering `CheckoutModal.vue`.
- **Empty State**: Minimalist illustration with "Discover Products" navigation to `/shop`.
- **Loading State**: Shimmer skeleton cards during sync and retrieval.

### 2. Wishlist Drawer (`frontend/src/components/WishlistOffCanvas.vue`)
- **Slide-in Motion**: Right-aligned slide drawer with smooth backdrop blur.
- **Header Actions**: Wishlist count badge and "Clear All" action with confirmation.
- **Items List**:
  - Image thumbnail, item title, and formatted price.
  - Stock availability badge (In Stock / Out of Stock).
  - "Move to Cart" button with per-item spinner feedback and toast alert.
  - Trash button for removal.
- **Empty State**: Heart icon illustration with "Explore Catalog" CTA.
- **Loading State**: Shimmer skeleton layout.

### 3. Checkout Modal (`frontend/src/components/CheckoutModal.vue`)
- **Multi-Step Checkout Flow**:
  - **Step 1: Shipping Address**: Choice between saved addresses from backend or new address form with full validation (First Name, Last Name, Street Address, City, State, Pincode, Phone) and option to save address.
  - **Step 2: Order Review & Coupon**: Scrollable line items with thumbnail previews, quantities, unit prices, coupon code application, discount preview, shipping calculation, and subtotal breakdown.
  - **Step 3: Payment Method**: Selection between Credit/Debit Card, UPI Instant Pay, and Cash on Delivery (COD) with 256-bit SSL encryption security badge and total charge confirmation.
  - **Step 4: Order Success Screen**: Order ID display with copy action, summary card with amount paid, payment method, estimated delivery time (3-5 business days), and navigation CTAs ("View My Orders", "Continue Shopping").
- **Error Handling**: Non-blocking banner notifications for server/network errors.

### 4. Orders Modal (`frontend/src/components/OrdersModal.vue`)
- **Order Tracking & Dashboard**:
  - Chronological list of user orders fetched via `api.getOrders()`.
  - Color-coded status badges: Placed (amber), Paid (emerald), Processing (sky), Shipped (indigo), Delivered (green), Cancelled (red).
  - Expandable order cards with product thumbnails, item names, quantities, and pricing.
  - Live shipment tracking timeline (Placed → Paid → Processing → Shipped → Delivered).
  - Shipping address card with inline editor for eligible active orders.
  - Payment details summary.
  - "Cancel Order" action with confirmation for active/processing orders.
  - "Buy Again" action adding all items back to active cart.
  - Empty state with "Start Shopping" CTA.

### 5. Auth Modal (`frontend/src/components/AuthModal.vue`)
- **Tabbed Authentication**:
  - Sign In (Email, Password with eye visibility toggle, "Forgot password?" link).
  - Create Account (First Name, Last Name, Email, Password with length validation helper).
  - Forgot Password (Email input for reset code dispatch).
  - Reset Password (Email, 6-digit code / token input, new password).
- **Validation & Alerts**: Inline dismissible error and success alert banners.
- **Lifecycle Integration**: Auto-closes on authentication and syncs guest cart/wishlist to backend database.

### 6. Navigation Header (`frontend/src/components/Nav-component.vue`)
- **Live Badges**: Real-time counter badges on Cart and Wishlist icons driven by Pinia store getters.
- **User Avatar & Dropdown**:
  - Guest: Opens Auth modal on click.
  - Authenticated: Shows user avatar / initials with dropdown menu (User details, "My Orders", "My Wishlist", "Sign Out").
- **Instant Search**: Search trigger button activating pill search input with live debounced product search results, thumbnails, and quick navigation.
