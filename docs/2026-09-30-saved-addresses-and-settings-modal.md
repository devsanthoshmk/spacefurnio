# Saved Addresses & Account Settings Upgrade

**Date:** 2026-09-30  
**Status:** Completed & Verified

## Overview

Upgraded user account navigation, address management, and account lifecycle handling across SpaceFurnio:
1. Replaced the user dropdown's "My Wishlist" button with **Settings** (which opens a dedicated Settings Modal with saved addresses management, profile editor, and permanent account deletion). Wishlist remains readily accessible via the persistent heart badge icon in the navigation bar.
2. Implemented automated address persistence during checkout: when placing an order, newly provided addresses are automatically saved to `user_addresses` (and set as default if first address), enabling 1-click address selection across all future orders.
3. Created a comprehensive, luxury **Settings Modal** (`SettingsModal.vue`) featuring:
   - **Saved Addresses Tab**: View all addresses, set default, add new addresses, inline edit, and delete addresses.
   - **Profile & Password Tab**: Update contact phone number and change password securely.
   - **Danger Zone (Delete Account)**: Allows authenticated users to permanently remove their account with confirmation validation (`DELETE` typed keyword).
4. Added backend API routes and handlers:
   - `DELETE /auth/account` and `DELETE /auth/me` with cascading cleanup of sessions, addresses, carts, wishlists, and orders.
   - Enhanced `POST /api/orders/checkout` to auto-link and persist addresses to `user_addresses`.
   - Enhanced `DELETE /api/addresses/:addressId` to cleanly unlink past orders without foreign key constraint violations and auto-promote remaining addresses to default.

---

## Changes Summary

### Backend (`/backend/ecommerce-backend/server-worker`)
- `src/routes/auth.ts`: Added `DELETE /account` and `DELETE /me` endpoints to support permanent account deletion with full cascade deletion and cookie revocation.
- `src/routes/orders.ts`: In `/checkout`, automatically checks and persists newly supplied shipping addresses into `user_addresses` for the user.
- `src/routes/addresses.ts`:
  - Ensured first address created is marked as default automatically.
  - In `DELETE /:addressId`, unlinked `orders.address_id` prior to deletion to prevent Postgres foreign key constraint errors and promoted next address to default.

### Frontend (`/frontend`)
- `src/components/SettingsModal.vue`: Created full-featured Settings Modal.
- `src/components/Nav-component.vue`: Updated user dropdown and mobile menu to open the Settings modal.
- `src/App.vue`: Provided `settingsUtils` (`openSettings`, `closeSettings`, `isSettingsOpen`) and mounted `<SettingsModal />`.
- `src/components/CheckoutModal.vue`: Refined address pre-selection and background persistence for seamless next-order checkouts.
- `src/lib/api.js` & `src/api/index.js`: Added `deleteAccount()` API helpers.
- `src/stores/auth.js`: Added `deleteAccount()` action with store and cache cleanup.

---

## Verification

- Worker TypeScript type check: `pnpm exec tsc --noEmit` passed with 0 errors.
- Frontend ESLint check: `pnpm lint` passed with 0 errors.
- Frontend build: `pnpm build` passed and completed SSG prerendering successfully.
