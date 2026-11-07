# Frontend Agent Guidelines

Rules and invariants for frontend architecture, view creation, and content management in `frontend/`.

## CMS Content Invariant

Derive visible text for non-storefront pages from CMS content bundles or fallback asset modules.

- **Content Binding**: Non-storefront pages (Home, About, Collabs, Portfolio, Contact, Policies, Footer, and future marketing views) must bind all display text from CMS data keys (`/api/cms/bundle` or `@/assets/contents/`). Never hardcode static display strings inside Vue templates.
- **Fallback Content**: Maintain default fallback text models in `@/assets/contents/` so views render during offline development or API initialization.
- **Dynamic Storefront Isolation**: Keep `/shop`, `/shop/product/:id`, cart, wishlist, checkout, customer account, and order views strictly dynamic Client-Side Rendering (CSR). Never connect storefront catalog views to CMS section keys or include them in CMS data bundles.

## Static Site Generation (SSG) Prerender Registration

Register non-storefront routes in the prerendering pipeline to enable headless build snapshots.

- **Route Registration**: Add every new non-storefront route path to `discoverRoutes()` in `scripts/prerender.js`.
- **SSG Boundary**: Restrict prerendering sweeps strictly to marketing and informational pages. Exclude dynamic catalog routes (`/shop*`), cart, checkout, and authenticated admin/user routes.
- **Hydration & Mount Safety**: Ensure components mount cleanly without throw when auth tokens or live backend endpoints are unavailable during headless Chromium prerender passes.

## Custom Scrolling DOM Constraint

Preserve custom scroll DOM hierarchy in views utilizing `customScroll.js`.

- **Direct Child Hierarchy**: Place all `.scroll-section` elements as direct children of `#scroll-wrapper`.
- **Wrapper Prohibition**: Avoid intermediate container `<div>` tags or layout wrappers between `#scroll-wrapper` and `.scroll-section`. Intermediate wrappers break custom scroll calculations.

## New Page Creation Checklist

When adding a new non-storefront page, complete every step in order:

1. **Define Content Schema**: Create or extend a content config in `@/assets/contents/[pageName].js` mirroring the CMS section keys.
2. **Bind Template Text**: Map all titles, headings, body text, buttons, and alt labels to the content object in the Vue component.
3. **Register Route**: Add the view route definition to `src/router/index.js`.
4. **Register Prerender**: Add the route path string to `discoverRoutes()` in `scripts/prerender.js`.
5. **Verify Scroll Structure**: If using `customScroll`, verify all `.scroll-section` elements are direct children of `#scroll-wrapper`.
6. **Backend Seed Sync**: Ensure matching page and section keys are added to `backend/ecommerce-backend/db/seed-cms.ts`.
7. **Verification**: Run `pnpm lint` and `pnpm build` to confirm clean compilation and prerendering.
