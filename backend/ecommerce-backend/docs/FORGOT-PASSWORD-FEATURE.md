# Forgot Password Implementation

## Overview
Added a "Forgot Password" feature within the existing `AuthModal.vue` to allow users to reset their password using emails via Resend. The feature implements a unified modal structure, removing the necessity to navigate away from the current page to perform password resets. The "Continue with Google" sign-in option has been temporarily commented out for future implementation.

## Steps Completed

### Database
- A new table `password_resets` was added to the Neon PostgreSQL database without modifying raw Drizzle schemas immediately, storing `user_id`, `token` (combined UUID and 6-digit code), `expires_at`, and `created_at`.
- The token string stores a `UUID:6-digit-code` which can be verified using either the magic link token or the 6-digit manual input.

### Backend (`server-worker/src/routes/auth.ts`)
- Added Resend dependency to `server-worker`.
- Implemented `POST /auth/forgot-password` route:
  - Generates a random UUID token and a 6-digit code.
  - Inserts them into the `password_resets` table with a 1-hour expiration.
  - Sends an email via `noreply@spacefurnio.com` using Resend.
- Implemented `POST /auth/reset-password` route:
  - Takes `email`, `tokenOrCode`, and `newPassword`.
  - Searches the `password_resets` table for the specific user.
  - Matches the provided `tokenOrCode` against the stored token or 6-digit code.
  - Hashes the new password and updates the user's `password_hash`.
  - Clears used reset tokens.

### Frontend (`frontend/src/lib/api.js`)
- Added `api.forgotPassword(email)` utility function.
- Added `api.resetPassword(email, tokenOrCode, newPassword)` utility function.

### Frontend (`frontend/src/components/AuthModal.vue`)
- Revamped the state management to use `authView` (`'login'`, `'register'`, `'forgot'`, `'reset'`) instead of a boolean `isLogin`.
- Removed (commented out) the Google OAuth button as requested.
- Added "Forgot your password?" option in the login form.
- Designed two new views for "Forgot Password" (requesting email) and "Reset Password" (requesting code/token and new password).
- Automatically parsing `?reset=true&email=...&token=...` from the URL parameters on mount to shift the user automatically into the reset password view with pre-filled inputs when they click the magic link from the email.

## Next Steps
- Implement "Sign in with Google" when ready using the existing Cloudflare logic and OAuth plugins.
- Add `RESEND_API_KEY` to production and development environments via Cloudflare Dashboard or `.dev.vars`.
