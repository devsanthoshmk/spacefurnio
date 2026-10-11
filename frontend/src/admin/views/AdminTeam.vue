<template>
  <div>
    <Toast />

    <!-- Confirm Dialog -->
    <AdminConfirmDialog
      :visible="confirmState.visible"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-label="confirmState.confirmLabel"
      :danger="confirmState.danger"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @update:visible="confirmState.visible = $event"
    />

    <!-- Page Header -->
    <AdminPageHeader title="Team" :breadcrumbs="breadcrumbs">
      <template #actions>
        <button
          v-if="canManage"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openInviteModal"
        >
          <i class="pi pi-user-plus text-sm" aria-hidden="true" />
          <span>Invite Member</span>
        </button>
      </template>
    </AdminPageHeader>

    <!-- Permission Warning Notice if user cannot manage -->
    <div
      v-if="!canManage"
      class="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      <i class="pi pi-shield text-lg text-amber-600" aria-hidden="true" />
      <div>
        <span class="font-medium">Read-Only Mode:</span>
        <span class="ml-1">You need the "admins.manage" permission to invite or modify team members.</span>
      </div>
    </div>

    <!-- Team Stats Strip -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <AdminStatsCard
        title="Total Members"
        :value="loading ? '...' : team.length"
        color="blue"
        icon="pi pi-users"
      />
      <AdminStatsCard
        title="Super Admins"
        :value="loading ? '...' : superAdminsCount"
        color="purple"
        icon="pi pi-shield"
      />
      <AdminStatsCard
        title="Active Members"
        :value="loading ? '...' : activeMembersCount"
        color="emerald"
        icon="pi pi-check-circle"
      />
      <AdminStatsCard
        title="Pending Invites"
        :value="loading ? '...' : invitations.length"
        color="amber"
        icon="pi pi-envelope"
      />
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="mb-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-500" aria-hidden="true" />
      <h3 class="mt-2 text-base font-semibold text-red-800">Failed to load team</h3>
      <p class="mt-1 text-sm text-red-600">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        @click="fetchTeam"
      >
        Retry
      </button>
    </div>

    <!-- Section 1: Active Team Members Card -->
    <div class="mb-8 overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
      <!-- Section Header with Search and Role Filter -->
      <div class="border-b border-slate-200 p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2.5">
            <h2 class="text-lg font-semibold text-slate-900">Team Members</h2>
            <span
              class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
            >
              {{ team.length }}
            </span>
          </div>

          <!-- Search & Filter Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <AdminSearchBar
              v-model="searchQuery"
              placeholder="Search by name or email..."
              class="w-full sm:w-64"
            />
            <select
              v-model="roleFilter"
              aria-label="Filter by role"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option
                v-for="roleKey in AVAILABLE_ROLES"
                :key="roleKey"
                :value="roleKey"
              >
                {{ ROLE_LABELS[roleKey] }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Members Table -->
      <div v-if="loading && team.length === 0" class="p-12 text-center text-slate-400">
        <i class="pi pi-spin pi-spinner text-3xl text-blue-600" aria-hidden="true" />
        <p class="mt-3 text-sm text-slate-500">Loading team members...</p>
      </div>

      <div
        v-else-if="!loading && filteredTeam.length === 0 && team.length > 0"
        class="p-12 text-center"
      >
        <i class="pi pi-search text-3xl text-slate-300" aria-hidden="true" />
        <p class="mt-2 text-sm font-medium text-slate-700">No members match your filter</p>
        <p class="text-xs text-slate-400">Try adjusting your search query or role filter.</p>
        <button
          type="button"
          class="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
          @click="resetFilters"
        >
          Reset filters
        </button>
      </div>

      <div v-else-if="!loading && team.length === 0" class="p-8">
        <AdminEmptyState
          title="No team members yet"
          description="Invite administrators, managers, and support agents to collaborate on SpaceFurnio."
          icon="pi pi-users"
        >
          <template #action>
            <button
              v-if="canManage"
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              @click="openInviteModal"
            >
              Invite First Member
            </button>
          </template>
        </AdminEmptyState>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" class="px-5 py-3.5">Member</th>
              <th scope="col" class="px-5 py-3.5">Role</th>
              <th scope="col" class="px-5 py-3.5">Status</th>
              <th scope="col" class="px-5 py-3.5">Permissions</th>
              <th scope="col" class="px-5 py-3.5">Joined</th>
              <th scope="col" class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="member in filteredTeam"
              :key="member.id"
              class="transition-colors hover:bg-slate-50/75"
            >
              <!-- Avatar & Member Info -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-xs tracking-wider text-white shadow-sm"
                  >
                    {{ getInitials(member.name, member.email) }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="truncate font-semibold text-slate-900">{{ member.name }}</span>
                      <span
                        v-if="isCurrentUser(member)"
                        class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase"
                      >
                        You
                      </span>
                    </div>
                    <p class="truncate text-xs text-slate-500">{{ member.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Role Badge -->
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
                    getRoleBadgeClass(member.role),
                  ]"
                >
                  <i :class="[getRoleIcon(member.role), 'text-[11px]']" aria-hidden="true" />
                  <span>{{ ROLE_LABELS[member.role] || member.role }}</span>
                </span>
              </td>

              <!-- Status -->
              <td class="px-5 py-4 whitespace-nowrap">
                <AdminStatusBadge
                  :status="member.is_active ? 'active' : 'inactive'"
                  size="sm"
                />
              </td>

              <!-- Permissions count -->
              <td class="px-5 py-4 whitespace-nowrap">
                <button
                  type="button"
                  class="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="View permissions breakdown"
                  @click="openPermissionsModal(member)"
                >
                  <i class="pi pi-key text-[11px] text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
                  <span>{{ getPermissionsCountLabel(member) }}</span>
                </button>
              </td>

              <!-- Joined Date -->
              <td class="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                {{ formatDate(member.created_at) }}
              </td>

              <!-- Actions -->
              <td class="px-5 py-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end gap-1.5">
                  <!-- Edit Role & Status -->
                  <button
                    type="button"
                    :disabled="!canManage"
                    title="Edit role and status"
                    aria-label="Edit role and status"
                    class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    @click="openEditModal(member)"
                  >
                    <i class="pi pi-pencil text-sm" aria-hidden="true" />
                  </button>

                  <!-- Toggle Active / Inactive (Power Icon) -->
                  <button
                    type="button"
                    :disabled="!canManage || isCurrentUser(member) || (isLastActiveSuperAdmin(member) && member.is_active) || togglingId === member.id"
                    :title="
                      isCurrentUser(member)
                        ? 'Cannot deactivate your own account'
                        : isLastActiveSuperAdmin(member) && member.is_active
                          ? 'Cannot deactivate the only active Super Admin'
                          : member.is_active
                            ? 'Deactivate account'
                            : 'Activate account'
                    "
                    :aria-label="member.is_active ? 'Deactivate account' : 'Activate account'"
                    :class="[
                      'rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40',
                      member.is_active
                        ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                    ]"
                    @click="toggleMemberActive(member)"
                  >
                    <i
                      :class="[
                        togglingId === member.id ? 'pi pi-spin pi-spinner' : 'pi pi-power-off',
                        'text-sm',
                      ]"
                      aria-hidden="true"
                    />
                  </button>

                  <!-- Remove Member -->
                  <button
                    type="button"
                    :disabled="!canManage || isCurrentUser(member) || isLastActiveSuperAdmin(member)"
                    :title="
                      isCurrentUser(member)
                        ? 'Cannot remove yourself'
                        : isLastActiveSuperAdmin(member)
                          ? 'Cannot remove the only active Super Admin'
                          : 'Remove member access'
                    "
                    aria-label="Remove member access"
                    class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    @click="askRemoveMember(member)"
                  >
                    <i class="pi pi-trash text-sm" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 2: Pending Invitations Card (Shown ONLY when invitations exist) -->
    <div
      v-if="invitations.length > 0"
      class="mb-8 overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm"
    >
      <div class="border-b border-slate-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-lg font-semibold text-slate-900">Pending Invitations</h2>
              <span
                class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
              >
                {{ invitations.length }}
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Invited staff who have not yet completed password setup.
            </p>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" class="px-5 py-3.5">Email</th>
              <th scope="col" class="px-5 py-3.5">Name</th>
              <th scope="col" class="px-5 py-3.5">Role</th>
              <th scope="col" class="px-5 py-3.5">Invited By</th>
              <th scope="col" class="px-5 py-3.5">Expires</th>
              <th scope="col" class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="invitation in invitations"
              :key="invitation.id"
              class="transition-colors hover:bg-slate-50/75"
            >
              <!-- Email -->
              <td class="px-5 py-4 font-mono text-xs font-medium text-slate-900">
                {{ invitation.email }}
              </td>

              <!-- Name -->
              <td class="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">
                {{ invitation.name }}
              </td>

              <!-- Role Badge -->
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
                    getRoleBadgeClass(invitation.role),
                  ]"
                >
                  <i :class="[getRoleIcon(invitation.role), 'text-[11px]']" aria-hidden="true" />
                  <span>{{ ROLE_LABELS[invitation.role] || invitation.role }}</span>
                </span>
              </td>

              <!-- Invited By -->
              <td class="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                {{ invitation.invited_by || 'Admin' }}
              </td>

              <!-- Expiry -->
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                      getExpiryBadge(invitation.expires_at).badgeClass,
                    ]"
                  >
                    {{ getExpiryBadge(invitation.expires_at).text }}
                  </span>
                  <span class="text-xs text-slate-400">({{ formatDate(invitation.expires_at) }})</span>
                </div>
              </td>

              <!-- Actions -->
              <td class="px-5 py-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end gap-1.5">
                  <!-- Copy Setup Link -->
                  <button
                    type="button"
                    title="Copy setup link"
                    aria-label="Copy setup link"
                    class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="copySetupUrl(invitation)"
                  >
                    <i class="pi pi-copy text-sm" aria-hidden="true" />
                  </button>

                  <!-- Revoke Invitation -->
                  <button
                    v-if="canManage"
                    type="button"
                    title="Revoke invitation"
                    aria-label="Revoke invitation"
                    class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="askRevokeInvitation(invitation)"
                  >
                    <i class="pi pi-trash text-sm" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite Member Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="inviteModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Invite Team Member"
          @mousedown.self="closeInviteModal"
        >
          <div class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            <!-- Modal Header -->
            <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Invite Team Member</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  Send an account invitation with role-based permissions.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="closeInviteModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <form class="flex flex-1 flex-col overflow-y-auto" @submit.prevent="submitInvite">
              <div class="space-y-5 px-6 py-5">
                <!-- General Error Banner -->
                <div
                  v-if="inviteErrors.general"
                  class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <i class="pi pi-exclamation-circle text-red-500" aria-hidden="true" />
                  <span>{{ inviteErrors.general }}</span>
                </div>

                <!-- Email Input -->
                <div>
                  <label for="invite-email" class="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="invite-email"
                    v-model="inviteForm.email"
                    type="email"
                    required
                    placeholder="e.g. member@spacefurnio.com"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p v-if="inviteErrors.email" class="mt-1 text-xs text-red-600">
                    {{ inviteErrors.email }}
                  </p>
                </div>

                <!-- Name Input -->
                <div>
                  <label for="invite-name" class="mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="invite-name"
                    v-model="inviteForm.name"
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p v-if="inviteErrors.name" class="mt-1 text-xs text-red-600">
                    {{ inviteErrors.name }}
                  </p>
                </div>

                <!-- Role Selection -->
                <div>
                  <label for="invite-role" class="mb-1.5 block text-sm font-medium text-slate-700">
                    Role <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="invite-role"
                    v-model="inviteForm.role"
                    required
                    class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @change="onInviteRoleChange"
                  >
                    <option
                      v-for="roleKey in AVAILABLE_ROLES"
                      :key="roleKey"
                      :value="roleKey"
                    >
                      {{ ROLE_LABELS[roleKey] }}
                    </option>
                  </select>
                  <p v-if="inviteErrors.role" class="mt-1 text-xs text-red-600">
                    {{ inviteErrors.role }}
                  </p>
                  <p class="mt-1.5 text-xs text-slate-500">
                    {{ ROLE_DESCRIPTIONS[inviteForm.role] || '' }}
                  </p>
                </div>

                <!-- Custom Permissions Matrix (Rendered ONLY when role === 'custom') -->
                <div
                  v-if="inviteForm.role === 'custom'"
                  class="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-semibold text-slate-900">Custom Permissions Matrix</h4>
                      <p class="text-xs text-slate-500">
                        Select specific granular capabilities for this user.
                      </p>
                    </div>
                    <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {{ inviteForm.permissions.length }} selected
                    </span>
                  </div>

                  <!-- Categories Grid -->
                  <div class="space-y-4">
                    <div
                      v-for="cat in PERMISSION_CATEGORIES"
                      :key="cat.key"
                      class="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs"
                    >
                      <div class="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-700">
                          {{ cat.name }}
                        </span>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            @click="toggleCategorySelect(cat.key, inviteForm.permissions)"
                          >
                            {{ isCategoryFullySelected(cat.key, inviteForm.permissions) ? 'Deselect All' : 'Select All' }}
                          </button>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label
                          v-for="perm in cat.permissions"
                          :key="perm"
                          class="flex cursor-pointer items-start gap-2.5 rounded-md p-1.5 transition-colors hover:bg-slate-50"
                        >
                          <input
                            v-model="inviteForm.permissions"
                            type="checkbox"
                            :value="perm"
                            class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div class="min-w-0">
                            <span class="block font-mono text-xs font-medium text-slate-900">{{ perm }}</span>
                            <span class="block text-[11px] text-slate-500">{{ getPermissionDescription(perm) }}</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  @click="closeInviteModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="inviteSubmitting"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <i v-if="inviteSubmitting" class="pi pi-spin pi-spinner text-xs" aria-hidden="true" />
                  <span>{{ inviteSubmitting ? 'Sending...' : 'Send Invitation' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Invite Success Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="inviteSuccessModalVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Invitation Sent"
          @mousedown.self="closeInviteSuccessModal"
        >
          <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <i class="pi pi-check text-lg" aria-hidden="true" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Invitation Sent!</h3>
                <p class="text-xs text-slate-500">
                  The team member invitation has been created.
                </p>
              </div>
            </div>

            <div class="mt-5 space-y-3">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Setup URL
              </label>
              <div class="rounded-lg border border-slate-200 bg-slate-100 p-3 font-mono text-xs text-slate-800 break-all select-all">
                {{ createdSetupUrl }}
              </div>

              <div class="flex items-center justify-between">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  @click="copyCreatedSetupUrl"
                >
                  <i
                    :class="[copiedLink ? 'pi pi-check text-emerald-600' : 'pi pi-copy text-slate-500', 'text-xs']"
                    aria-hidden="true"
                  />
                  <span>{{ copiedLink ? 'Copied to Clipboard' : 'Copy Setup Link' }}</span>
                </button>
                <p class="text-[11px] text-slate-500">
                  Share this link with the team member. It expires in 7 days.
                </p>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                @click="closeInviteSuccessModal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Member Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="editModalVisible && editingMember"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          :aria-label="`Edit Member: ${editingMember.name}`"
          @mousedown.self="closeEditModal"
        >
          <div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
            <!-- Modal Header -->
            <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Edit Member: {{ editingMember.name }}</h3>
                <p class="mt-0.5 text-xs text-slate-500">{{ editingMember.email }}</p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="closeEditModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Form -->
            <form class="flex flex-1 flex-col overflow-y-auto" @submit.prevent="submitEdit">
              <div class="space-y-5 px-6 py-5">
                <!-- Error Banner -->
                <div
                  v-if="editError"
                  class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <i class="pi pi-exclamation-circle text-red-500" aria-hidden="true" />
                  <span>{{ editError }}</span>
                </div>

                <!-- Self Demotion / Role Lock Warning -->
                <div
                  v-if="isEditingSelf"
                  class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"
                >
                  <i class="pi pi-info-circle mr-1" aria-hidden="true" />
                  <span>You cannot change your own role.</span>
                </div>

                <!-- Last Super Admin Warning -->
                <div
                  v-else-if="isEditingLastSuperAdmin"
                  class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                >
                  <i class="pi pi-exclamation-triangle mr-1" aria-hidden="true" />
                  <span>This is the only active Super Admin. Role and active status changes are locked.</span>
                </div>

                <!-- Demoting Super Admin Alert -->
                <div
                  v-if="isDemotingSuperAdmin"
                  class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                >
                  <i class="pi pi-exclamation-triangle mr-1" aria-hidden="true" />
                  <span>Warning: Demoting a Super Admin will revoke administrative access across the store.</span>
                </div>

                <!-- Role Selector -->
                <div>
                  <label for="edit-role" class="mb-1.5 block text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <select
                    id="edit-role"
                    v-model="editForm.role"
                    :disabled="isEditingSelf || isEditingLastSuperAdmin"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option
                      v-for="roleKey in AVAILABLE_ROLES"
                      :key="roleKey"
                      :value="roleKey"
                    >
                      {{ ROLE_LABELS[roleKey] }}
                    </option>
                  </select>
                </div>

                <!-- Active Toggle -->
                <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <div>
                    <span class="block text-sm font-medium text-slate-900">Account Active</span>
                    <span class="block text-xs text-slate-500">
                      {{ editForm.is_active ? 'Member can log in and access assigned features.' : 'Access temporarily suspended.' }}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="editForm.is_active"
                    :disabled="isEditingSelf || (isEditingLastSuperAdmin && editingMember.is_active)"
                    :class="[
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
                      editForm.is_active ? 'bg-blue-600' : 'bg-slate-300',
                    ]"
                    @click="editForm.is_active = !editForm.is_active"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        editForm.is_active ? 'translate-x-5' : 'translate-x-0',
                      ]"
                    />
                  </button>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  @click="closeEditModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="editSaving"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <i v-if="editSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true" />
                  <span>{{ editSaving ? 'Saving...' : 'Save Changes' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Permissions Viewer Modal -->
    <Teleport to="body">
      <Transition name="admin-dialog">
        <div
          v-if="permissionsModalVisible && viewingMember"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          :aria-label="`Permissions: ${viewingMember.name}`"
          @mousedown.self="closePermissionsModal"
        >
          <div class="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl">
            <!-- Header -->
            <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">
                  {{ viewingMember.name }}'s Permissions
                </h3>
                <div class="mt-1 flex items-center gap-2">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                      getRoleBadgeClass(viewingMember.role),
                    ]"
                  >
                    {{ ROLE_LABELS[viewingMember.role] || viewingMember.role }}
                  </span>
                  <span class="text-xs text-slate-500">
                    ({{ viewingMember.resolved_permissions?.length || 0 }} granted)
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="closePermissionsModal"
              >
                <i class="pi pi-times text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <div class="space-y-4">
                <div
                  v-for="cat in PERMISSION_CATEGORIES"
                  :key="cat.key"
                  class="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5"
                >
                  <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {{ cat.name }}
                  </h4>
                  <ul class="space-y-1.5">
                    <li
                      v-for="perm in cat.permissions"
                      :key="perm"
                      class="flex items-start gap-2 text-xs"
                    >
                      <i
                        :class="[
                          hasResolvedPermission(viewingMember, perm)
                            ? 'pi pi-check-circle text-emerald-600'
                            : 'pi pi-times-circle text-slate-300',
                          'mt-0.5 shrink-0',
                        ]"
                        aria-hidden="true"
                      />
                      <div :class="hasResolvedPermission(viewingMember, perm) ? 'text-slate-800' : 'text-slate-400'">
                        <span class="font-mono font-medium">{{ perm }}</span>
                        <span class="ml-1 text-[11px]">— {{ getPermissionDescription(perm) }}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                type="button"
                class="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-900"
                @click="closePermissionsModal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import AdminSearchBar from '@/admin/components/shared/AdminSearchBar.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import { useConfirm } from '@/admin/composables/useConfirm'
import { formatDate } from '@/admin/utils/formatters'
import { ROLE_LABELS } from '@/admin/utils/permissions'
import type {
  TeamMember,
  TeamInvitation,
  TeamListResponse,
  AdminRole,
  AdminPermission,
} from '@/admin/types/admin'

const toast = useToast()
const { user, hasPermission } = useAdminAuth()
const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()

const breadcrumbs = [{ label: 'Admin', to: '/admin' }, { label: 'Team' }]

const canManage = computed(() => hasPermission('admins.manage'))
const currentUserId = computed(() => user.value?.id || '')
const currentUserEmail = computed(() => user.value?.email || '')

// State
const team = ref<TeamMember[]>([])
const invitations = ref<TeamInvitation[]>([])
const permissionDescriptions = ref<Record<string, string>>({})
const sessionSetupUrls = ref<Record<string, string>>({})
const loading = ref(false)
const error = ref<string | null>(null)
const togglingId = ref<string | null>(null)

// Search & Filtering
const searchQuery = ref('')
const roleFilter = ref<string>('all')

const AVAILABLE_ROLES: AdminRole[] = [
  'super_admin',
  'admin',
  'store_manager',
  'sales_fulfillment',
  'customer_support',
  'catalog_inventory',
  'custom',
]

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full unrestricted access to all store features, finances, and team administration.',
  admin: 'Full management of catalog, orders, customers, reviews, and store settings.',
  store_manager: 'Day-to-day operations: products, orders, coupons, reviews, and analytics.',
  sales_fulfillment: 'Order tracking, shipment fulfillment, status updates, and customer receipts.',
  customer_support: 'Customer directory, order lookup, refunds, cancellations, and reviews.',
  catalog_inventory: 'Product CRUD, inventory adjustments, categories, and image assets.',
  custom: 'Granular permissions assigned individually to the user.',
}

const ROLE_BADGE_CLASSES: Record<AdminRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  store_manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sales_fulfillment: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  customer_support: 'bg-amber-100 text-amber-700 border-amber-200',
  catalog_inventory: 'bg-teal-100 text-teal-700 border-teal-200',
  custom: 'bg-slate-100 text-slate-700 border-slate-200',
}

const ROLE_ICONS: Record<AdminRole, string> = {
  super_admin: 'pi pi-shield',
  admin: 'pi pi-user',
  store_manager: 'pi pi-briefcase',
  sales_fulfillment: 'pi pi-truck',
  customer_support: 'pi pi-headphones',
  catalog_inventory: 'pi pi-box',
  custom: 'pi pi-sliders-h',
}

interface PermissionCategory {
  key: string
  name: string
  permissions: AdminPermission[]
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: 'orders',
    name: 'Orders & Sales',
    permissions: [
      'orders.read',
      'orders.write',
      'orders.fulfill',
      'orders.cancel',
      'orders.refund',
    ],
  },
  {
    key: 'products',
    name: 'Products & Inventory',
    permissions: [
      'products.read',
      'products.write',
      'products.delete',
      'products.bulk',
      'inventory.manage',
      'categories.manage',
    ],
  },
  {
    key: 'customers',
    name: 'Customers',
    permissions: [
      'customers.read',
      'customers.write',
      'customers.delete',
    ],
  },
  {
    key: 'marketing',
    name: 'Marketing & Coupons',
    permissions: ['marketing.coupons'],
  },
  {
    key: 'reviews',
    name: 'Reviews & Feedback',
    permissions: [
      'reviews.read',
      'reviews.write',
      'reviews.delete',
    ],
  },
  {
    key: 'media',
    name: 'Media & Assets',
    permissions: ['media.manage'],
  },
  {
    key: 'analytics',
    name: 'Analytics',
    permissions: ['analytics.view'],
  },
  {
    key: 'admin',
    name: 'Admin & System',
    permissions: [
      'admins.manage',
      'settings.manage',
    ],
  },
]

const DEFAULT_PERMISSION_DESCRIPTIONS: Record<AdminPermission, string> = {
  'orders.read': 'View customer orders, details, status history and receipts',
  'orders.write': 'Update order status and customer shipping details',
  'orders.fulfill': 'Manage shipments, carrier assignments, and tracking info',
  'orders.cancel': 'Cancel pending or processing orders',
  'orders.refund': 'Issue order refunds and manage return requests',
  'products.read': 'View full catalog products, taxonomy, and pricing',
  'products.write': 'Create and update products, images, and color variants',
  'products.delete': 'Delete or archive catalog products',
  'products.bulk': 'Perform bulk operations on catalog products',
  'inventory.manage': 'Monitor stock levels and out of stock warnings',
  'categories.manage': 'Manage categories, spaces, styles, rooms, and materials',
  'customers.read': 'View customer directory, spending metrics, and order history',
  'customers.write': 'Edit customer accounts and toggle active/disabled status',
  'customers.delete': 'Delete or permanently purge customer data',
  'marketing.coupons': 'Create, edit, toggle, and delete coupon codes',
  'reviews.read': 'View customer ratings and product reviews',
  'reviews.write': 'Create, edit, and moderate reviews',
  'reviews.delete': 'Delete spam or inappropriate reviews',
  'media.manage': 'Upload, manage, link, and audit product images and assets',
  'analytics.view': 'View sales dashboard KPIs, revenue trends, and operational summaries',
  'admins.manage': 'Invite admin team members, assign roles, and configure permissions',
  'settings.manage': 'Configure store settings and operational policies',
}

// Filtered Team
const filteredTeam = computed(() => {
  return team.value.filter((member) => {
    if (roleFilter.value !== 'all' && member.role !== roleFilter.value) {
      return false
    }
    if (!searchQuery.value.trim()) return true
    const q = searchQuery.value.toLowerCase().trim()
    const nameMatch = member.name.toLowerCase().includes(q)
    const emailMatch = member.email.toLowerCase().includes(q)
    return nameMatch || emailMatch
  })
})

// Counts
const superAdminsCount = computed(() => {
  return team.value.filter(
    (m) => (m.role === 'super_admin' || m.role === 'admin') && m.is_active,
  ).length
})

const activeMembersCount = computed(() => {
  return team.value.filter((m) => m.is_active).length
})

const activeSuperAdmins = computed(() => {
  return team.value.filter(
    (m) => (m.role === 'super_admin' || m.role === 'admin') && m.is_active,
  )
})

// Modals State
const inviteModalVisible = ref(false)
const inviteSubmitting = ref(false)
const inviteForm = reactive<{
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
}>({
  email: '',
  name: '',
  role: 'store_manager',
  permissions: [],
})
const inviteErrors = reactive({
  email: '',
  name: '',
  role: '',
  general: '',
})

const inviteSuccessModalVisible = ref(false)
const createdSetupUrl = ref('')
const copiedLink = ref(false)

const editModalVisible = ref(false)
const editingMember = ref<TeamMember | null>(null)
const editSaving = ref(false)
const editError = ref<string | null>(null)
const editForm = reactive<{
  role: AdminRole
  is_active: boolean
}>({
  role: 'store_manager',
  is_active: true,
})

const permissionsModalVisible = ref(false)
const viewingMember = ref<TeamMember | null>(null)

// Safety Helpers
function isCurrentUser(member?: TeamMember | null): boolean {
  if (!member) return false
  if (currentUserId.value && member.id === currentUserId.value) return true
  if (
    currentUserEmail.value &&
    member.email.toLowerCase() === currentUserEmail.value.toLowerCase()
  ) {
    return true
  }
  return false
}

function isLastActiveSuperAdmin(member?: TeamMember | null): boolean {
  if (!member) return false
  const isSuper = member.role === 'super_admin' || member.role === 'admin'
  if (!isSuper || !member.is_active) return false
  return activeSuperAdmins.value.length <= 1
}

const isEditingSelf = computed(() => {
  return isCurrentUser(editingMember.value)
})

const isEditingLastSuperAdmin = computed(() => {
  return isLastActiveSuperAdmin(editingMember.value)
})

const isDemotingSuperAdmin = computed(() => {
  if (!editingMember.value) return false
  const wasSuper =
    editingMember.value.role === 'super_admin' || editingMember.value.role === 'admin'
  const willBeSuper = editForm.role === 'super_admin' || editForm.role === 'admin'
  return wasSuper && !willBeSuper
})

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.trim().slice(0, 2).toUpperCase()
  }
  if (email && email.trim()) {
    const username = email.split('@')[0]
    return username.slice(0, 2).toUpperCase()
  }
  return 'U'
}

function getRoleBadgeClass(role: AdminRole): string {
  return ROLE_BADGE_CLASSES[role] || 'bg-slate-100 text-slate-700 border-slate-200'
}

function getRoleIcon(role: AdminRole): string {
  return ROLE_ICONS[role] || 'pi pi-user'
}

function getPermissionsCountLabel(member: TeamMember): string {
  if (member.role === 'super_admin') {
    return 'All (22)'
  }
  const count = member.resolved_permissions?.length || 0
  return `${count} permissions`
}

function getPermissionDescription(perm: AdminPermission): string {
  return (
    permissionDescriptions.value[perm] ||
    DEFAULT_PERMISSION_DESCRIPTIONS[perm] ||
    perm
  )
}

function hasResolvedPermission(member: TeamMember, perm: AdminPermission): boolean {
  if (member.role === 'super_admin' || member.role === 'admin') return true
  return member.resolved_permissions?.includes(perm) ?? false
}

function getExpiryBadge(expiresAt: string): {
  text: string
  isExpired: boolean
  badgeClass: string
} {
  if (!expiresAt) {
    return { text: 'No expiry', isExpired: false, badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' }
  }
  const date = new Date(expiresAt)
  if (isNaN(date.getTime())) {
    return { text: 'Invalid', isExpired: false, badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' }
  }
  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true, badgeClass: 'bg-red-100 text-red-700 border-red-200' }
  }
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) {
    return {
      text: `${diffHours}h left`,
      isExpired: false,
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    }
  }
  const diffDays = Math.ceil(diffHours / 24)
  return {
    text: `${diffDays} days left`,
    isExpired: false,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  }
}

function isCategoryFullySelected(
  categoryKey: string,
  targetList: AdminPermission[],
): boolean {
  const cat = PERMISSION_CATEGORIES.find((c) => c.key === categoryKey)
  if (!cat) return false
  return cat.permissions.every((p) => targetList.includes(p))
}

function toggleCategorySelect(
  categoryKey: string,
  targetList: AdminPermission[],
): void {
  const cat = PERMISSION_CATEGORIES.find((c) => c.key === categoryKey)
  if (!cat) return
  const allSelected = isCategoryFullySelected(categoryKey, targetList)
  if (allSelected) {
    for (const p of cat.permissions) {
      const idx = targetList.indexOf(p)
      if (idx !== -1) {
        targetList.splice(idx, 1)
      }
    }
  } else {
    for (const p of cat.permissions) {
      if (!targetList.includes(p)) {
        targetList.push(p)
      }
    }
  }
}

function onInviteRoleChange(): void {
  if (inviteForm.role !== 'custom') {
    inviteForm.permissions = []
  }
}

function resetFilters(): void {
  searchQuery.value = ''
  roleFilter.value = 'all'
}

// Fetch Data
async function fetchTeam(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const data = await adminApi.get<TeamListResponse>('/api/admin/team')
    team.value = data.team || []
    invitations.value = data.invitations || []
    permissionDescriptions.value = {
      ...DEFAULT_PERMISSION_DESCRIPTIONS,
      ...(data.permissions || {}),
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch team members'
  } finally {
    loading.value = false
  }
}

// Invite Actions
function openInviteModal(): void {
  inviteForm.email = ''
  inviteForm.name = ''
  inviteForm.role = 'store_manager'
  inviteForm.permissions = []
  inviteErrors.email = ''
  inviteErrors.name = ''
  inviteErrors.role = ''
  inviteErrors.general = ''
  inviteModalVisible.value = true
}

function closeInviteModal(): void {
  inviteModalVisible.value = false
}

async function submitInvite(): Promise<void> {
  inviteErrors.email = ''
  inviteErrors.name = ''
  inviteErrors.role = ''
  inviteErrors.general = ''

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!inviteForm.email.trim()) {
    inviteErrors.email = 'Valid email is required'
  } else if (!emailRegex.test(inviteForm.email.trim())) {
    inviteErrors.email = 'Please provide a valid email address'
  }

  if (!inviteForm.name.trim()) {
    inviteErrors.name = 'Full name is required'
  }

  if (!inviteForm.role) {
    inviteErrors.role = 'Role is required'
  }

  if (inviteForm.role === 'custom' && inviteForm.permissions.length === 0) {
    inviteErrors.general = 'Please select at least one permission for the custom role'
  }

  if (inviteErrors.email || inviteErrors.name || inviteErrors.role || inviteErrors.general) {
    return
  }

  inviteSubmitting.value = true
  try {
    const payload = {
      email: inviteForm.email.trim().toLowerCase(),
      name: inviteForm.name.trim(),
      role: inviteForm.role,
      permissions: inviteForm.role === 'custom' ? inviteForm.permissions : [],
    }

    const res = await adminApi.post<{
      success: boolean
      message: string
      invitation: { id: string; email: string; name: string; role: AdminRole; expires_at: string }
      setup_url: string
      raw_token: string
    }>('/api/admin/team/invite', payload)

    createdSetupUrl.value = res.setup_url
    if (res.invitation?.id && res.setup_url) {
      sessionSetupUrls.value[res.invitation.id] = res.setup_url
    }

    closeInviteModal()
    inviteSuccessModalVisible.value = true

    toast.add({
      severity: 'success',
      summary: 'Invitation Sent',
      detail: `Invitation generated for ${inviteForm.email}`,
      life: 4000,
    })

    await fetchTeam()
  } catch (err: unknown) {
    inviteErrors.general = err instanceof Error ? err.message : 'Failed to create invitation'
  } finally {
    inviteSubmitting.value = false
  }
}

function closeInviteSuccessModal(): void {
  inviteSuccessModalVisible.value = false
  createdSetupUrl.value = ''
  copiedLink.value = false
}

async function copyCreatedSetupUrl(): Promise<void> {
  if (!createdSetupUrl.value) return
  try {
    await navigator.clipboard.writeText(createdSetupUrl.value)
    copiedLink.value = true
    setTimeout(() => {
      copiedLink.value = false
    }, 2000)
    toast.add({
      severity: 'success',
      summary: 'Link Copied',
      detail: 'Invitation setup link copied to clipboard',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy link to clipboard',
      life: 3000,
    })
  }
}

// Copy Setup URL for pending invitation
function getSetupUrl(invitation: TeamInvitation): string {
  if (sessionSetupUrls.value[invitation.id]) {
    return sessionSetupUrls.value[invitation.id]
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/admin/setup?email=${encodeURIComponent(invitation.email)}`
}

async function copySetupUrl(invitation: TeamInvitation): Promise<void> {
  const url = getSetupUrl(invitation)
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      severity: 'success',
      summary: 'Link Copied',
      detail: 'Invitation setup link copied to clipboard',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy link to clipboard',
      life: 3000,
    })
  }
}

// Edit Member
function openEditModal(member: TeamMember): void {
  editingMember.value = member
  editForm.role = member.role
  editForm.is_active = member.is_active
  editError.value = null
  editModalVisible.value = true
}

function closeEditModal(): void {
  editModalVisible.value = false
  editingMember.value = null
}

async function submitEdit(): Promise<void> {
  if (!editingMember.value) return

  editError.value = null
  editSaving.value = true

  try {
    const payload: { role?: AdminRole; is_active?: boolean } = {}
    if (!isEditingSelf.value && !isEditingLastSuperAdmin.value) {
      payload.role = editForm.role
    }
    if (!isEditingSelf.value && !(isEditingLastSuperAdmin.value && !editForm.is_active)) {
      payload.is_active = editForm.is_active
    }

    await adminApi.put<{ success: boolean; message: string }>(
      `/api/admin/team/${editingMember.value.id}`,
      payload,
    )

    toast.add({
      severity: 'success',
      summary: 'Member Updated',
      detail: `${editingMember.value.name} updated successfully`,
      life: 3000,
    })

    closeEditModal()
    await fetchTeam()
  } catch (err: unknown) {
    editError.value = err instanceof Error ? err.message : 'Failed to update member'
  } finally {
    editSaving.value = false
  }
}

// Quick Active Toggle
async function toggleMemberActive(member: TeamMember): Promise<void> {
  if (isCurrentUser(member)) {
    toast.add({
      severity: 'warn',
      summary: 'Action Blocked',
      detail: 'You cannot deactivate your own account',
      life: 3000,
    })
    return
  }

  if (isLastActiveSuperAdmin(member) && member.is_active) {
    toast.add({
      severity: 'warn',
      summary: 'Action Blocked',
      detail: 'Cannot deactivate the only active Super Admin',
      life: 3000,
    })
    return
  }

  togglingId.value = member.id
  try {
    const nextState = !member.is_active
    await adminApi.put<{ success: boolean; message: string }>(`/api/admin/team/${member.id}`, {
      is_active: nextState,
    })

    toast.add({
      severity: 'success',
      summary: nextState ? 'Member Activated' : 'Member Deactivated',
      detail: `${member.name} is now ${nextState ? 'active' : 'inactive'}`,
      life: 3000,
    })

    await fetchTeam()
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: err instanceof Error ? err.message : 'Failed to toggle status',
      life: 3000,
    })
  } finally {
    togglingId.value = null
  }
}

// Remove Member
async function askRemoveMember(member: TeamMember): Promise<void> {
  if (isCurrentUser(member)) {
    toast.add({
      severity: 'warn',
      summary: 'Action Blocked',
      detail: 'You cannot remove your own admin access',
      life: 3000,
    })
    return
  }

  if (isLastActiveSuperAdmin(member)) {
    toast.add({
      severity: 'warn',
      summary: 'Action Blocked',
      detail: 'Cannot remove the only active Super Admin',
      life: 3000,
    })
    return
  }

  const ok = await confirm({
    title: 'Remove Team Member',
    message: `Are you sure you want to remove ${member.name} (${member.email})? Their admin privileges will be revoked immediately.`,
    confirmLabel: 'Remove Member',
    danger: true,
  })

  if (!ok) return

  try {
    await adminApi.delete<{ success: boolean; message: string }>(`/api/admin/team/${member.id}`)
    toast.add({
      severity: 'success',
      summary: 'Member Removed',
      detail: `Admin privileges revoked for ${member.email}`,
      life: 3000,
    })
    await fetchTeam()
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Removal Failed',
      detail: err instanceof Error ? err.message : 'Failed to remove member',
      life: 3000,
    })
  }
}

// Revoke Invitation
async function askRevokeInvitation(invitation: TeamInvitation): Promise<void> {
  const ok = await confirm({
    title: 'Revoke Invitation',
    message: `Are you sure you want to revoke the pending invitation for ${invitation.email}? They will no longer be able to set up their account.`,
    confirmLabel: 'Revoke Invitation',
    danger: true,
  })

  if (!ok) return

  try {
    await adminApi.delete<{ success: boolean; message: string }>(
      `/api/admin/team/invite/${invitation.id}`,
    )
    toast.add({
      severity: 'success',
      summary: 'Invitation Revoked',
      detail: `Invitation for ${invitation.email} has been revoked`,
      life: 3000,
    })
    await fetchTeam()
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Revocation Failed',
      detail: err instanceof Error ? err.message : 'Failed to revoke invitation',
      life: 3000,
    })
  }
}

// Permissions Modal
function openPermissionsModal(member: TeamMember): void {
  viewingMember.value = member
  permissionsModalVisible.value = true
}

function closePermissionsModal(): void {
  permissionsModalVisible.value = false
  viewingMember.value = null
}

onMounted(async () => {
  await fetchTeam()
})
</script>

<style scoped>
.admin-dialog-enter-active,
.admin-dialog-leave-active {
  transition: opacity 200ms ease;
}

.admin-dialog-enter-from,
.admin-dialog-leave-to {
  opacity: 0;
}
</style>
