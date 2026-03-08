# Orders Bug Fixes & Improvements

## Issue: Missing Shipping and Billing Information
Date: March 8, 2026

### Description
The frontend component (`OrdersModal.vue`) was not properly displaying the shipping address and the payment method for orders. The root causes of these issues were traced back to the checkout process in the backend worker API as well as the parsing logic in the frontend.

### Fixes Implemented

**1. Backend Processing of `shippingAddress`:**
The `POST /checkout` endpoint in `server-worker/src/routes/orders.ts` was only attempting to load the shipping address using a provided `addressId`. However, the frontend (`CheckoutModal.vue`) sends the raw `shippingAddress` object instead of an `addressId` for guests or explicit checkout flows.
- **Solution:** Modified the checkout API to first parse the incoming `shippingAddress` object and map properties (`firstName`, `lastName`, `address`, `city`, `state`, `pincode`, `phone`) correctly to the DB columns (`shipping_first_name`, `shipping_last_name`, etc.). The backend still falls back to loading from `addressId` if `shippingAddress` isn't provided.

**2. Backend Recording of `paymentMethod`:**
The `POST /checkout` endpoint was receiving the `paymentMethod` from the frontend body but was not actually recording the transaction inside the database.
- **Solution:** Added a query to explicitly insert the `paymentMethod` into the `payments` table along with the `total_amount` generated during checkout so it correctly maps 1-to-1 with the `order_id`.

**3. Frontend Data Display Stability:**
On the frontend (`OrdersModal.vue`), the `user_addresses` and `payments` records are retrieved via the Neon Serverless Data API. Depending on the PostgREST configuration and 1-to-1 foreign key relations, related elements might return as either an array (i.e., `order.payments[0]`) or directly as an object (i.e., `order.payments`).
- **Solution:** Hardened the frontend UI code that maps `addrFallback` and `paymentMethod` to safely check if the properties are arrays or plain objects to ensure the UI correctly receives the string and does not default to 'N/A'.
