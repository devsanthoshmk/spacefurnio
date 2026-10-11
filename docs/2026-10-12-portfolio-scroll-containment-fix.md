# 2026-10-12 — Portfolio Mobile Scroll Containment Fix

## Symptom
On real phones (production only), `/portfolio` showed the native scrollbar and the
custom section scroll felt broken. Desktop hid the problem because the `wheel`
handler (`passive: false` + `preventDefault`) masks native body scroll.

## Root cause
`frontend/src/views/PortfolioView.vue` was the only `customScroll` view without
viewport containment:

1. An extra anonymous `<div>` sat between `#scroll-container` and
   `#scroll-wrapper` (introduced in `09ccd34`), so the wrapper was not a direct
   child of the container.
2. `#scroll-wrapper` had no fixed height (only `min-h-screen`), unlike `HomeView`
   and `AboutView` which pin it to `height: 100dvh`. The wrapper grew to the sum
   of all sections, the container grew with it, nothing clipped, and the body
   scrolled natively — hence the visible scrollbar on mobile, where the
   `touchmove` handler cannot win the race against the browser.
3. The CTA `.scroll-section` carried outer margins (`mb-8 md:mb-16`) which
   `offsetHeight` does not include, skewing the scroller's offset math.

## Fix (`PortfolioView.vue` only, `customScroll.js` untouched)
- Removed the intermediate `<div>`; `#scroll-wrapper` is again a direct child of
  `#scroll-container` with all `.scroll-section` elements direct children of the
  wrapper.
- Added scoped CSS: container `height: 100dvh + overflow hidden +
  touch-action: pan-x pinch-zoom + overscroll-behavior: none`; wrapper
  `height: 100dvh`.
- Converted the CTA section's outer margins to inner padding
  (`pt-12 pb-20 md:pb-28`) to preserve spacing without breaking measurements.
- Removed the dead `sectionChange` listener (it listened on the wrapper element,
  but the scroller dispatches on `window`, and only logged errors).

## Verification
- `pnpm lint` (frontend): clean.
- `pnpm build`: succeeds, SSG prerender of `/portfolio` OK.
- Manual check still needed on a real phone: `wrapper.offsetHeight ==
  window.innerHeight`, no native scrollbar, one section per swipe.
