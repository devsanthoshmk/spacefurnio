<template>
  <div>
    <!-- Backdrop & Slide-Over Drawer -->
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
        <div class="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <Transition name="admin-slide">
            <div
              v-if="visible"
              class="flex w-screen max-w-2xl flex-col bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Build & Deployment Logs"
            >
              <!-- Drawer Header -->
              <div class="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-admin-primary"
                  >
                    <i class="pi pi-server text-lg" />
                  </div>
                  <div>
                    <h2 class="text-base font-bold text-admin-text sm:text-lg">
                      Build & Deployment Logs
                    </h2>
                    <p class="text-xs text-admin-text-secondary">
                      Cloudflare Pages SSG deploy webhook history from <code class="font-mono text-slate-700">cms_build_events</code>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    :disabled="loading"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none disabled:opacity-40 cursor-pointer"
                    title="Refresh build logs"
                    aria-label="Refresh build logs"
                    @click="fetchBuildEvents"
                  >
                    <i :class="['pi pi-refresh text-sm', loading ? 'animate-spin text-admin-primary' : '']" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label="Close build logs drawer"
                    @click="close"
                  >
                    <i class="pi pi-times text-base" />
                  </button>
                </div>
              </div>

              <!-- Drawer Body -->
              <div class="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
                <!-- Loading State -->
                <div
                  v-if="loading && events.length === 0"
                  class="flex flex-col items-center justify-center py-24 text-center"
                >
                  <i class="pi pi-spin pi-spinner text-3xl text-admin-primary" />
                  <p class="mt-3 text-sm font-medium text-slate-600">
                    Loading build history...
                  </p>
                </div>

                <!-- Error State -->
                <div
                  v-else-if="errorMessage"
                  class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                >
                  <div class="flex items-start gap-2.5">
                    <i class="pi pi-exclamation-triangle mt-0.5 text-rose-500" />
                    <div class="flex-1">
                      <p class="font-semibold text-rose-800">Failed to load build events</p>
                      <p class="mt-0.5 text-xs text-rose-600">{{ errorMessage }}</p>
                      <button
                        type="button"
                        class="mt-2.5 rounded-md bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-200 focus:outline-none cursor-pointer"
                        @click="fetchBuildEvents"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  v-else-if="events.length === 0"
                  class="py-12"
                >
                  <AdminEmptyState
                    title="No Build Logs Recorded"
                    description="No deploy hook events have been dispatched yet. Publishing content or triggering manual builds will log records here."
                    icon="pi pi-server"
                  >
                    <template #action>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-admin-primary-hover focus:outline-none cursor-pointer"
                        @click="handleTriggerBuild"
                      >
                        <i class="pi pi-play text-xs" />
                        <span>Trigger First Build</span>
                      </button>
                    </template>
                  </AdminEmptyState>
                </div>

                <!-- Events List -->
                <div v-else class="space-y-3.5">
                  <div
                    v-for="event in events"
                    :key="event.id"
                    class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300 hover:shadow-xs"
                  >
                    <!-- Event Header: Status, Trigger Type & Duration -->
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <!-- Status Badge -->
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          :class="getStatusBadgeClass(event.status)"
                        >
                          <i
                            :class="[
                              'text-[10px]',
                              event.status === 'pending'
                                ? 'pi pi-spin pi-spinner'
                                : event.status === 'success'
                                  ? 'pi pi-check'
                                  : event.status === 'failed'
                                    ? 'pi pi-times'
                                    : event.status === 'skipped_local'
                                      ? 'pi pi-info'
                                      : 'pi pi-clock',
                            ]"
                          />
                          <span>{{ getStatusLabel(event.status) }}</span>
                        </span>

                        <!-- Trigger Type Badge -->
                        <span
                          class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                        >
                          <i
                            :class="[
                              'text-[10px] text-slate-500',
                              getTriggerType(event) === 'publish' ? 'pi pi-cloud-upload' : 'pi pi-bolt',
                            ]"
                          />
                          <span class="capitalize">{{ getTriggerType(event) }}</span>
                        </span>

                        <!-- HTTP Response Code Badge -->
                        <span
                          v-if="getResponseCode(event) != null"
                          class="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                          :class="getHttpCodeClass(getResponseCode(event))"
                        >
                          HTTP {{ getResponseCode(event) }}
                        </span>
                      </div>

                      <!-- Duration & Started At -->
                      <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span
                          class="inline-flex items-center gap-1 text-slate-600 font-medium"
                          :title="`Duration: ${getDuration(event)}`"
                        >
                          <i class="pi pi-hourglass text-[10px] text-slate-400" />
                          <span>{{ getDuration(event) }}</span>
                        </span>
                        <span class="text-slate-300">•</span>
                        <span :title="formatDateTime(getStartedAt(event))">
                          {{ formatRelativeTime(getStartedAt(event)) }}
                        </span>
                      </div>
                    </div>

                    <!-- Meta Details: Webhook URL & Triggered By -->
                    <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                      <!-- Masked Webhook -->
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="text-slate-400 font-medium">Webhook:</span>
                        <span
                          v-if="getWebhookUrl(event)"
                          class="font-mono text-[11px] text-slate-700 truncate max-w-[220px] sm:max-w-xs"
                          :title="getWebhookUrl(event)"
                        >
                          {{ getWebhookUrl(event) }}
                        </span>
                        <span v-else class="text-slate-400 italic">None</span>
                      </div>

                      <!-- Triggered By User -->
                      <div class="flex items-center gap-1.5 text-slate-500">
                        <i class="pi pi-user text-[10px] text-slate-400" />
                        <span class="truncate max-w-[150px]">
                          {{ getTriggeredBy(event) }}
                        </span>
                      </div>
                    </div>

                    <!-- Response Body or Error Message (Expandable) -->
                    <div
                      v-if="getResponseBody(event) || getErrorMessage(event)"
                      class="mt-3"
                    >
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-admin-primary hover:text-admin-primary-hover focus:outline-none cursor-pointer"
                        @click="toggleDetails(event.id)"
                      >
                        <i
                          :class="[
                            'pi text-[9px] transition-transform',
                            expandedIds.has(event.id) ? 'pi-chevron-down' : 'pi-chevron-right',
                          ]"
                        />
                        <span>
                          {{ expandedIds.has(event.id) ? 'Hide response payload' : 'View response payload' }}
                        </span>
                      </button>

                      <!-- Expanded Payload View -->
                      <div
                        v-if="expandedIds.has(event.id)"
                        class="mt-2 rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-200"
                      >
                        <!-- Local Dev Notice -->
                        <div
                          v-if="event.status === 'skipped_local'"
                          class="mb-2 rounded border border-purple-500/30 bg-purple-950/40 p-2.5 text-xs text-purple-200"
                        >
                          <div class="flex items-center gap-1.5 font-semibold text-purple-300">
                            <i class="pi pi-info-circle text-xs" />
                            <span>Local Development Mode</span>
                          </div>
                          <p class="mt-1 text-[11px] text-purple-200/90 leading-relaxed">
                            Draft content was published successfully to the database. Outbound deploy hook was skipped because CLOUDFLARE_PAGES_DEPLOY_HOOK is not configured in localhost.
                          </p>
                        </div>

                        <!-- Real Error Notice (for failed builds) -->
                        <div
                          v-else-if="getErrorMessage(event)"
                          class="mb-2 rounded border border-rose-500/30 bg-rose-950/40 p-2 text-xs text-rose-300"
                        >
                          <strong class="font-semibold text-rose-200">Error:</strong>
                          {{ getErrorMessage(event) }}
                        </div>

                        <div v-if="getResponseBody(event)">
                          <div class="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                            <span>Response Body</span>
                            <button
                              type="button"
                              class="text-slate-400 hover:text-white transition"
                              @click="copyPayload(event.id, getResponseBody(event)!)"
                            >
                              {{ copiedId === event.id ? 'Copied' : 'Copy' }}
                            </button>
                          </div>
                          <pre class="max-h-48 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">{{ formatPayload(getResponseBody(event)) }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Drawer Footer -->
              <div class="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                <span class="text-xs text-slate-500">
                  {{ events.length }} event{{ events.length === 1 ? '' : 's' }} recorded
                </span>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none cursor-pointer"
                    @click="close"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    :disabled="triggering"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-admin-primary-hover focus:outline-none focus:ring-2 focus:ring-admin-primary disabled:opacity-60 cursor-pointer"
                    @click="handleTriggerBuild"
                  >
                    <i
                      :class="[
                        'text-xs',
                        triggering ? 'pi pi-spin pi-spinner' : 'pi pi-play',
                      ]"
                    />
                    <span>Trigger Build</span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import adminApi from '@/admin/api/adminApi'
import { formatDateTime, formatRelativeTime } from '@/admin/utils/formatters'
import AdminEmptyState from '@/admin/components/shared/AdminEmptyState.vue'
import type { CmsBuildEvent } from '@/admin/types/admin'

defineOptions({
  name: 'AdminCmsBuildLogs',
})

// ─── Props & Emits ───────────────────────────────────────────────────────────
const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'triggerBuild'): void
}>()

// ─── State ───────────────────────────────────────────────────────────────────
const events = ref<CmsBuildEvent[]>([])
const loading = ref(false)
const triggering = ref(false)
const errorMessage = ref<string | null>(null)
const expandedIds = ref<Set<string>>(new Set())
const copiedId = ref<string | null>(null)

// ─── Attribute Accessors ─────────────────────────────────────────────────────
function getTriggerType(event: CmsBuildEvent): string {
  return event.triggerType || event.trigger_type || 'manual'
}

function getStartedAt(event: CmsBuildEvent): string {
  return event.startedAt || event.started_at || ''
}

function getCompletedAt(event: CmsBuildEvent): string | null {
  return event.completedAt ?? event.completed_at ?? null
}

function getWebhookUrl(event: CmsBuildEvent): string {
  return event.webhookUrlMasked || event.webhook_url_masked || ''
}

function getResponseCode(event: CmsBuildEvent): number | null {
  return event.responseCode ?? event.response_code ?? null
}

function getResponseBody(event: CmsBuildEvent): string | null {
  return event.responseBody ?? event.response_body ?? null
}

function getErrorMessage(event: CmsBuildEvent): string | null {
  return event.errorMessage ?? event.error_message ?? null
}

function getTriggeredBy(event: CmsBuildEvent): string {
  return event.triggeredByEmail || event.triggeredBy || event.triggered_by || 'System'
}

function getDuration(event: CmsBuildEvent): string {
  const started = getStartedAt(event)
  if (!started) return '-'
  const startTime = new Date(started).getTime()
  if (isNaN(startTime)) return '-'

  const completed = getCompletedAt(event)
  if (!completed) {
    if (event.status === 'pending' || event.status === 'triggered') {
      return 'Running...'
    }
    return '-'
  }

  const endTime = new Date(completed).getTime()
  if (isNaN(endTime)) return '-'

  const diffMs = Math.max(0, endTime - startTime)
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 60) {
    return `${diffSec}s`
  }
  const mins = Math.floor(diffSec / 60)
  const secs = diffSec % 60
  return `${mins}m ${secs}s`
}

// Badge Helpers
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'pending':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'triggered':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'failed':
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    case 'skipped_local':
      return 'bg-purple-50 text-purple-700 border border-purple-200'
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'success':
      return 'Success'
    case 'pending':
      return 'Pending'
    case 'triggered':
      return 'Triggered'
    case 'failed':
      return 'Failed'
    case 'skipped_local':
      return 'Skipped (Local)'
    default:
      return status
  }
}

function getHttpCodeClass(code: number | null): string {
  if (code == null) return 'bg-slate-100 text-slate-600'
  if (code >= 200 && code < 300) return 'bg-emerald-100 text-emerald-800'
  if (code === 429) return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function formatPayload(payload: string | null): string {
  if (!payload) return ''
  try {
    const parsed = JSON.parse(payload) as unknown
    return JSON.stringify(parsed, null, 2)
  } catch {
    return payload
  }
}

function toggleDetails(id: string): void {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

async function copyPayload(id: string, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) {
        copiedId.value = null
      }
    }, 2000)
  } catch {
    // Clipboard permission fallback
  }
}

// ─── API Interactions ────────────────────────────────────────────────────────
async function fetchBuildEvents(): Promise<void> {
  loading.value = true
  errorMessage.value = null

  try {
    const data = await adminApi.get<
      { buildEvents?: CmsBuildEvent[]; events?: CmsBuildEvent[] } | CmsBuildEvent[]
    >('/api/admin/cms/build-events')
    if (Array.isArray(data)) {
      events.value = data
    } else if (data && typeof data === 'object') {
      events.value = data.buildEvents || data.events || []
    } else {
      events.value = []
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to fetch build events'
  } finally {
    loading.value = false
  }
}

function close(): void {
  emit('update:visible', false)
}

function handleTriggerBuild(): void {
  emit('triggerBuild')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
}

// ─── Lifecycle & Watchers ────────────────────────────────────────────────────
watch(
  () => props.visible,
  (val) => {
    if (val) {
      fetchBuildEvents()
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeydown)
      }
    } else {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeydown)
      }
    }
  },
)

onMounted(() => {
  if (props.visible) {
    fetchBuildEvents()
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeydown)
    }
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<style scoped>
.admin-fade-enter-active,
.admin-fade-leave-active {
  transition: opacity 200ms ease;
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
