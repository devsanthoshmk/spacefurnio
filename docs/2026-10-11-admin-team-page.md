# Admin Team & RBAC Management Implementation

**Date:** 2026-10-11  
**Scope:** Admin frontend (`frontend/src/admin/views/AdminTeam.vue`) — Staff directory, invitations & Role-Based Access Control (RBAC)  
**Status:** Completed (lint passes, production build succeeds)

---

## 1. Overview

Replaced the stub `AdminTeam.vue` view with a complete team directory, invitation management, and granular Role-Based Access Control (RBAC) interface consuming the Cloudflare Worker admin endpoints:
- `GET /api/admin/team`
- `POST /api/admin/team/invite`
- `PUT /api/admin/team/:id`
- `DELETE /api/admin/team/:id`
- `DELETE /api/admin/team/invite/:inviteId`

No backend modifications were required, no new dependencies were added, and no route changes were made.

---

## 2. Files Modified

- `frontend/src/admin/views/AdminTeam.vue` — Complete page implementation including:
  - Header with `AdminPageHeader` and "Invite Member" action modal trigger (guarded by `admins.manage`).
  - Read-only banner displayed if user lacks `admins.manage`.
  - Team Stats strip with 4 `AdminStatsCard` components: Total Members, Super Admins, Active Members, and Pending Invites.
  - Active Team Members section:
    - Search by name/email via `AdminSearchBar` and role filter dropdown.
    - User avatar with initials circle (`bg-blue-600 text-white`).
    - Name and email with `"You"` indicator badge for current user.
    - Role badge with semantic color schemes across all 7 roles:
      - `super_admin`: purple
      - `admin`: blue
      - `store_manager`: emerald
      - `sales_fulfillment`: cyan
      - `customer_support`: amber
      - `catalog_inventory`: teal
      - `custom`: slate
    - Status pill via `AdminStatusBadge` (`active` / `inactive`).
    - Granular permissions count badge with one-click breakdown modal.
    - Joined date formatted with `formatDate`.
    - Quick actions: Edit Role/Status (pencil), Quick toggle active/deactivate (power icon), and Remove (trash icon).
  - Pending Invitations section (rendered when invitations exist):
    - Table displaying Email, Name, Role badge, Invited By, and Expiry indicator with relative countdown pills.
    - Quick actions: Copy Setup Link (clipboard icon) and Revoke (trash icon).
  - Invite Member Modal (`Teleport` to `body`):
    - Email, Name, and Role selection.
    - Dynamic Custom Permissions Matrix when `role === 'custom'`, categorized across 8 operational domains (Orders, Products & Inventory, Customers, Marketing, Reviews, Media, Analytics, Administration) with "Select All" / "Deselect All" per domain.
  - Invite Success Modal (`Teleport` to `body`):
    - Monospace setup URL box with one-click clipboard copy button and expiry notice.
  - Edit Member Modal (`Teleport` to `body`):
    - Role selector and Active toggle switch.
    - Safety enforcement: self-demotion lockout, last active Super Admin lock, and Super Admin demotion warning.
  - Permissions Viewer Modal (`Teleport` to `body`):
    - Displays full categorized permission capability checkmarks for any selected member.
  - Confirmation dialog via `AdminConfirmDialog` for Member Removal and Invitation Revocation.

---

## 3. Safety Rules & Guardrails Enforced

1. **Self-Protection Guard**:
   - An admin cannot demote their own role.
   - An admin cannot deactivate their own account.
   - An admin cannot remove their own account.
2. **Last Active Super Admin Guard**:
   - When only 1 active Super Admin remains, their role cannot be changed, account cannot be deactivated, and they cannot be removed.
3. **Super Admin Demotion Warning**:
   - Modal displays an alert if a Super Admin is about to be demoted to another role.
4. **Permission Guard**:
   - All mutating actions are guarded by `hasPermission('admins.manage')`.

---

## 4. Verification

- `cd frontend && pnpm lint` passed with 0 errors.
- `cd frontend && pnpm run build:spa` compiled successfully with 0 errors.
- Backend worker `pnpm exec tsc --noEmit` in `backend/ecommerce-backend/server-worker/` passed with 0 errors.
