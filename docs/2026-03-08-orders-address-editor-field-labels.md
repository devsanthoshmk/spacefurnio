# Orders Address Editor Field Label Update (2026-03-08)

## Request
Add proper labels for each form field in the shipping address editor.

## Changes
Updated `frontend/src/components/OrdersModal.vue` address editor form:

- Added explicit labels above each input field:
  - First Name
  - Last Name
  - Address
  - City
  - State
  - Pincode
  - Phone Number
- Replaced grouped labels (`City & State`, `Pincode & Phone`) with per-field labels.
- Added `.sf-address-col` layout helper to keep two-column rows aligned.

## Result
Every input now has its own clear label above it, improving readability and form clarity.
