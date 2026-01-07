## Minimal AI Prompt — Vue 3 Route-Driven wishlist Off-Canvas

You are implementing a **route-driven off-canvas wishlist modal** for this e-commerce site.

### Stack

* Vue 3 **Composition API only**
* Vue Router (router/index.js)
* TailwindCSS
* you can use PrimeVue v4 components
* PrimeVue AOS
* **Pinia store already exists: `wishlist.js` (must be used, not reimplemented)**

### Requirements

1. **wishlist UI**

   * Off-canvas panel sliding from the right
   * Uses PrimeVue (`Sidebar` or equivalent)
   * Styled with TailwindCSS
   * Animated on open/close (PrimeVue AOS or transitions)

2. **Route-Driven Behavior (Non-negotiable)**

   * Opening wishlist appends `/wishlist` to the current route
   * Closing wishlist restores the previous route
   * Must work from deep routes
     Example:

     * `/shop/category/item` → `/shop/category/item/wishlist` → back to `/shop/category/item`
   * Browser back/forward must correctly open/close the wishlist
   * wishlist auto-opens if user lands directly on a `/wishlist` route

3. **Router Design**

   * Implement wishlist as a **child/modal route**, not a standalone page
   * Overlay current page instead of replacing it
   * Use `router/index.js` cleanly (no hacks, no watchers on `$route.path`)

4. **State Rules**

   * wishlist open state comes **only from the route**
   * wishlist data, totals, and actions come from **existing `wishlist.js` Pinia store**
   * No duplicated state

5. **UX**

   * Backdrop click closes wishlist and updates URL
   * ESC closes wishlist and updates URL
   * Prevent body scroll when open

### Deliverables

* `wishlistOffCanvas.vue` (Composition API)
* Router configuration snippet
* Clear comments explaining route-based modal logic

### Constraints

* No Options API
* No new store creation
* No separate `/wishlist` page
* Production-grade code only