# Orders Modal Address Editor Overflow Fix (2026-03-08)

## Issue
In the Orders modal shipping address editor, paired inputs (First/Last Name, City/State, Pincode/Phone) overflowed outside the dialog boundary.

## Root Cause
The inputs in `.sf-address-row` used flex layout with default `content-box` sizing. Input padding and borders increased effective width, causing the row to exceed available space.

## Fix Applied
Updated `frontend/src/components/OrdersModal.vue`:

- Added `box-sizing: border-box;` to `.sf-address-editor-modal`
- Added `min-width: 0;` for `.sf-address-row > .sf-address-input`
- Added `width: 100%; min-width: 0; box-sizing: border-box;` to `.sf-address-input`

## Result
Address fields now stay inside the modal at all supported breakpoints and no longer clip/overflow on the right edge.
