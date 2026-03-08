# Auth modal API refactor

- `frontend/src/components/AuthModal.vue` now uses the shared `api.login()` and `api.register()` methods instead of duplicating `fetch()` logic.
- `frontend/src/lib/api.js` now preserves backend `message` values for login and register failures so the modal still shows useful auth errors.
- The modal now relies on the correct backend token field: `access_token`.
