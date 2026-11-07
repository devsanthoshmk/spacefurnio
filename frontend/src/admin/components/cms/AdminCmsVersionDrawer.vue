<template>
  <div>
    <!-- Backdrop & Slide-over Drawer -->
    <Teleport to="body">
      <div v-if="visible" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <Transition name="admin-fade">
          <div
            v-if="visible"
            class="fixed inset-0 bg-black/50 transition-opacity"
            aria-hidden="true"
            @click="close"
          />
        </Transition>

        <!-- Slide-Over Container -->
        <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition name="admin-slide">
            <div
              v-if="visible"
              class="w-screen max-w-xl bg-white shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              :aria-label="title"
            >
              <!-- Drawer Header -->
              <div
                class="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-admin-primary"
                  >
                    <i class="pi pi-history text-lg" />
                  </div>
                  <div>
                    <h2 class="text-base font-bold text-admin-text sm:text-lg">
                      {{ title }}
                    </h2>
                    <p class="text-xs text-admin-text-secondary">
                      Scope: <span class="font-semibold text-slate-700">{{ scope }}</span>
                      <span v-if="entityId">
                        • Entity: <span class="font-semibold text-slate-700">{{ entityId }}</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    :disabled="loading"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none disabled:opacity-40"
                    title="Refresh version history"
                    aria-label="Refresh version history"
                    @click="fetchVersions"
                  >
                    <i :class="['pi pi-refresh text-sm', loading ? 'animate-spin' : '']" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                    aria-label="Close version drawer"
                    @click="close"
                  >
                    <i class="pi pi-times text-base" />
                  </button>
                </div>
              </div>

              <!-- Drawer Body -->
              <div class="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                <!-- Loading State -->
                <div
                  v-if="loading && versions.length === 0"
                  class="flex flex-col items-center justify-center py-20 text-center"
                >
                  <i class="pi pi-spin pi-spinner text-3xl text-admin-primary" />
                  <p class="mt-3 text-sm font-medium text-slate-600">
                    Loading version snapshots...
                  </p>
                </div>

                <!-- Error State -->
                <div
                  v-else-if="errorMessage"
                  class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <div class="flex items-start gap-2.5">
                    <i class="pi pi-exclamation-triangle mt-0.5 text-red-500" />
                    <div class="flex-1">
                      <p class="font-semibold text-red-800">Failed to load versions</p>
                      <p class="mt-0.5 text-xs text-red-600">{{ errorMessage }}</p>
                      <button
                        type="button"
                        class="mt-2.5 rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 focus:outline-none"
                        @click="fetchVersions"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  v-else-if="versions.length === 0"
                  class="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div
                    class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                  >
                    <i class="pi pi-history text-2xl" />
                  </div>
                  <h3 class="mt-3 text-sm font-semibold text-slate-800">
                    No Version History
                  </h3>
                  <p class="mt-1 max-w-xs text-xs text-slate-500">
                    No snapshot records have been saved for this content scope yet.
                  </p>
                </div>

                <!-- Timeline List -->
                <div v-else class="relative pl-6 ml-2 space-y-6">
                  <!-- Vertical Rail Line -->
                  <div
                    class="absolute bottom-2 left-2.5 top-2 w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />

                  <div
                    v-for="(version, idx) in versions"
                    :key="version.id"
                    class="relative"
                  >
                    <!-- Timeline Node Indicator -->
                    <div
                      :class="[
                        'absolute -left-[1.625rem] top-3.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white',
                        idx === 0
                          ? 'border-admin-primary text-admin-primary ring-4 ring-blue-50'
                          : 'border-slate-300 text-slate-400',
                      ]"
                    >
                      <span
                        :class="[
                          'h-1.5 w-1.5 rounded-full',
                          idx === 0 ? 'bg-admin-primary' : 'bg-slate-400',
                        ]"
                      />
                    </div>

                    <!-- Version Card -->
                    <div
                      class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <!-- Card Header -->
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span
                            class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800"
                          >
                            Version #{{ getVersionNum(version) }}
                          </span>
                          <span
                            v-if="idx === 0"
                            class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-admin-primary"
                          >
                            Latest
                          </span>
                        </div>
                        <span
                          class="text-xs text-slate-400"
                          :title="formatDateTime(getCreatedAt(version))"
                        >
                          {{ formatRelativeTime(getCreatedAt(version)) }}
                        </span>
                      </div>

                      <!-- Author & Description -->
                      <div class="mt-2.5">
                        <p class="text-sm font-semibold text-slate-800">
                          {{ getChangeSummary(version) }}
                        </p>
                        <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <i class="pi pi-user text-[11px] text-slate-400" />
                          <span>{{ getAuthor(version) }}</span>
                          <span class="text-slate-300">•</span>
                          <span>{{ formatDateTime(getCreatedAt(version)) }}</span>
                        </div>
                      </div>

                      <!-- Card Actions -->
                      <div
                        class="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"
                      >
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
                          @click="toggleExpanded(version.id)"
                        >
                          <i
                            :class="[
                              'pi text-[10px] transition-transform',
                              isExpanded(version.id) ? 'pi-chevron-up' : 'pi-chevron-down',
                            ]"
                          />
                          <span>
                            {{ isExpanded(version.id) ? 'Hide Snapshot' : 'Inspect Snapshot' }}
                          </span>
                        </button>

                        <button
                          type="button"
                          :disabled="isRestoring"
                          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-admin-primary hover:bg-blue-50 hover:text-admin-primary focus:outline-none disabled:opacity-40"
                          @click="promptRestore(version)"
                        >
                          <i class="pi pi-replay text-xs" />
                          <span>Restore this Version</span>
                        </button>
                      </div>

                      <!-- Expanded Snapshot Inspector -->
                      <div
                        v-if="isExpanded(version.id)"
                        class="mt-3 rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-100"
                      >
                        <div class="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs">
                          <span class="font-mono text-slate-400">Snapshot JSON Payload</span>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white focus:outline-none"
                            @click="copySnapshotJson(version)"
                          >
                            <i :class="copiedId === version.id ? 'pi pi-check text-emerald-400' : 'pi pi-copy'" />
                            <span>{{ copiedId === version.id ? 'Copied!' : 'Copy' }}</span>
                          </button>
                        </div>
                        <pre
                          class="max-h-60 overflow-auto font-mono text-[11px] leading-relaxed text-slate-200"
                        >{{ formatSnapshotJson(version.snapshot) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Drawer Footer -->
              <div
                class="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4"
              >
                <span class="text-xs text-slate-500">
                  {{ versions.length }} snapshot{{ versions.length === 1 ? '' : 's' }} recorded
                </span>
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none"
                  @click="close"
                >
                  Close
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Teleport>

    <!-- Confirmation Dialog for Non-Destructive Restore -->
    <AdminConfirmDialog
      v-model:visible="confirmDialogOpen"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      confirm-label="Restore Snapshot"
      cancel-label="Cancel"
      :danger="false"
      @confirm="executeRestore"
    />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import adminApi from '@/admin/api/adminApi'
import type { CmsVersion } from '@/admin/types/admin'
import { formatDateTime, formatRelativeTime } from '@/admin/utils/formatters'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'

defineOptions({
  name: 'AdminCmsVersionDrawer',
})

const props = withDefaults(
  defineProps<{
    visible: boolean
    scope: string
    entityId?: string
    title?: string
  }>(),
  {
    title: 'Version History',
    entityId: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'restored', version: CmsVersion): void
}>()

const toast = useToast()

const versions = ref<CmsVersion[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const expandedIds = ref<Set<number>>(new Set())
const copiedId = ref<number | null>(null)

// Confirmation Dialog State
const confirmDialogOpen = ref(false)
const targetVersion = ref<CmsVersion | null>(null)
const isRestoring = ref(false)

const confirmDialogTitle = computed(() => {
  if (!targetVersion.value) return 'Restore Historical Snapshot'
  return `Restore Version #${getVersionNum(targetVersion.value)}?`
})

const confirmDialogMessage =
  'Restoring is non-destructive. It loads this historical snapshot into your current draft, allowing you to review changes before publishing.'

// Helper functions for flexible schema attributes
function getVersionNum(v: CmsVersion): number {
  return v.versionNum ?? v.version_num ?? v.id
}

function getChangeSummary(v: CmsVersion): string {
  return v.changeSummary || v.change_summary || 'Saved snapshot'
}

function getAuthor(v: CmsVersion): string {
  return v.authorEmail || v.author_id || v.authorId || 'Admin'
}

function getCreatedAt(v: CmsVersion): string {
  return v.createdAt || v.created_at || ''
}

function isExpanded(id: number): boolean {
  return expandedIds.value.has(id)
}

function toggleExpanded(id: number): void {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function formatSnapshotJson(snapshot: Record<string, any>): string {
  try {
    return JSON.stringify(snapshot, null, 2)
  } catch {
    return String(snapshot)
  }
}

async function copySnapshotJson(version: CmsVersion): Promise<void> {
  try {
    const text = formatSnapshotJson(version.snapshot)
    await navigator.clipboard.writeText(text)
    copiedId.value = version.id
    setTimeout(() => {
      if (copiedId.value === version.id) {
        copiedId.value = null
      }
    }, 2000)
  } catch {
    // Clipboard permission fallback
  }
}

async function fetchVersions(): Promise<void> {
  if (!props.scope) return
  loading.value = true
  errorMessage.value = null

  try {
    const params: Record<string, string> = {}
    const isPolicyScope =
      props.scope === 'policies' ||
      ['privacy-policy', 'terms-of-service', 'shipping-policy', 'refund-policy'].includes(props.scope) ||
      props.scope.endsWith('-policy')

    if (isPolicyScope) {
      params.scope = 'policies'
      if (props.entityId) {
        params.entityId = props.entityId
      } else if (props.scope !== 'policies') {
        params.entityId = props.scope
      }
    } else {
      params.scope = props.scope
      if (props.entityId) {
        params.entityId = props.entityId
      }
    }

    const data = await adminApi.get<CmsVersion[]>('/api/admin/cms/versions', params)
    versions.value = Array.isArray(data) ? data : []
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to fetch version history'
  } finally {
    loading.value = false
  }
}

function promptRestore(version: CmsVersion): void {
  targetVersion.value = version
  confirmDialogOpen.value = true
}

async function executeRestore(): Promise<void> {
  if (!targetVersion.value) return
  const version = targetVersion.value
  isRestoring.value = true

  try {
    await adminApi.post(`/api/admin/cms/versions/${version.id}/rollback`)

    toast.add({
      severity: 'success',
      summary: 'Version Restored',
      detail: `Successfully rolled back to version #${getVersionNum(version)}. Current draft updated.`,
      life: 4000,
    })

    emit('restored', version)
    close()
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Restore Failed',
      detail: err?.message || 'Failed to rollback version snapshot',
      life: 5000,
    })
  } finally {
    isRestoring.value = false
    confirmDialogOpen.value = false
    targetVersion.value = null
  }
}

function close(): void {
  emit('update:visible', false)
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.visible && !confirmDialogOpen.value) {
    close()
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      window.addEventListener('keydown', onKeydown)
      fetchVersions()
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

watch(
  () => [props.scope, props.entityId],
  () => {
    if (props.visible) {
      fetchVersions()
    }
  },
)
</script>

<style scoped>
.admin-fade-enter-active,
.admin-fade-leave-active {
  transition: opacity 250ms ease;
}

.admin-fade-enter-from,
.admin-fade-leave-to {
  opacity: 0;
}

.admin-slide-enter-active,
.admin-slide-leave-active {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-slide-enter-from,
.admin-slide-leave-to {
  transform: translateX(100%);
}
</style>