## Minimal AI Prompt — Vue 3 Route-Driven Cart Off-Canvas

You are implementing a **route-driven off-canvas Cart modal** for this e-commerce site.

### Stack

* Vue 3 **Composition API only**
* Vue Router (router/index.js)
* TailwindCSS
* you can use PrimeVue v4 components
* PrimeVue AOS
* **Pinia store already exists: `cart.js` (must be used, not reimplemented)**

### Requirements

1. **Cart UI**

   * Off-canvas panel sliding from the right
   * Uses PrimeVue (`Sidebar` or equivalent)
   * Styled with TailwindCSS
   * Animated on open/close (PrimeVue AOS or transitions)

2. **Route-Driven Behavior (Non-negotiable)**

   * Opening cart appends `/cart` to the current route
   * Closing cart restores the previous route
   * Must work from deep routes
     Example:

     * `/shop/category/item` → `/shop/category/item/cart` → back to `/shop/category/item`
   * Browser back/forward must correctly open/close the cart
   * Cart auto-opens if user lands directly on a `/cart` route

3. **Router Design**

   * Implement cart as a **child/modal route**, not a standalone page
   * Overlay current page instead of replacing it
   * Use `router/index.js` cleanly (no hacks, no watchers on `$route.path`)

4. **State Rules**

   * Cart open state comes **only from the route**
   * Cart data, totals, and actions come from **existing `cart.js` Pinia store**
   * No duplicated state

5. **UX**

   * Backdrop click closes cart and updates URL
   * ESC closes cart and updates URL
   * Prevent body scroll when open

### Deliverables

* `CartOffCanvas.vue` (Composition API)
* Router configuration snippet
* Clear comments explaining route-based modal logic

### Constraints

* No Options API
* No new store creation
* No separate `/cart` page
* Production-grade code only