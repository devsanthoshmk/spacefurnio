<template>
  <div class="space-y-6">
    <Toast />

    <!-- SUB-VIEW: SECTION EDITOR -->
    <AdminCmsSectionEditor
      v-if="currentView === 'section-editor' && selectedPageSlug"
      :page-slug="selectedPageSlug"
      :page-title="selectedPageTitle"
      @back="navigateBackToHub"
      @updated="fetchSummaryAndData"
    />

    <!-- SUB-VIEW: POLICY EDITOR -->
    <AdminCmsPolicyEditor
      v-else-if="currentView === 'policy-editor' && selectedPolicySlug"
      :policy-slug="selectedPolicySlug"
      @back="navigateBackToHub"
      @updated="fetchSummaryAndData"
    />

    <!-- PRIMARY HUB VIEW -->
    <div v-else class="space-y-6">
      <!-- Page Header & Action Bar -->
      <AdminPageHeader title="Content Management" :breadcrumbs="breadcrumbs">
        <template #actions>
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Build History Button -->
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="buildLogsOpen = true"
            >
              <i class="pi pi-history text-xs text-slate-500" aria-hidden="true" />
              <span>Deploy Logs</span>
            </button>

            <!-- View Diff Button -->
            <button
              type="button"
              :disabled="totalDirtyCount === 0"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Review all staged draft changes against live site"
              @click="openGlobalDiff"
            >
              <i class="pi pi-sliders-h text-xs text-slate-500" aria-hidden="true" />
              <span>View Diff</span>
              <span
                v-if="totalDirtyCount > 0"
                class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
              >
                {{ totalDirtyCount }}
              </span>
            </button>

            <!-- Update Site (Publish & Rebuild) Button -->
            <button
              v-if="canPublish"
              type="button"
              :disabled="publishing || cooldownSeconds > 0"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              @click="promptPublish"
            >
              <i
                :class="publishing ? 'pi pi-spin pi-spinner text-xs' : 'pi pi-cloud-upload text-xs'"
                aria-hidden="true"
              />
              <span v-if="publishing">Updating Site...</span>
              <span v-else-if="cooldownSeconds > 0">Cooldown ({{ cooldownSeconds }}s)</span>
              <span v-else>Update Site</span>
              <span
                v-if="!publishing && cooldownSeconds === 0 && totalDirtyCount > 0"
                class="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-emerald-100"
              >
                {{ totalDirtyCount }}
              </span>
            </button>
          </div>
        </template>
      </AdminPageHeader>

      <!-- Cooldown Warning Banner if Active -->
      <div
        v-if="cooldownSeconds > 0"
        class="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-900 shadow-2xs"
      >
        <div class="flex items-center gap-2.5">
          <i class="pi pi-clock text-blue-600" aria-hidden="true" />
          <span>
            Storefront deployment in progress. Build cooldown active:
            <strong class="font-mono font-semibold">{{ cooldownSeconds }}s remaining</strong> before next deploy can be triggered.
          </span>
        </div>
        <button
          type="button"
          class="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
          @click="buildLogsOpen = true"
        >
          View Status
        </button>
      </div>

      <!-- Summary KPI Metric Cards (6 cards) -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <AdminStatsCard
          title="Staged Changes"
          :value="loading ? '...' : totalDirtyCount"
          :color="totalDirtyCount > 0 ? 'amber' : 'emerald'"
          :icon="totalDirtyCount > 0 ? 'pi pi-file-edit' : 'pi pi-check-circle'"
        />
        <AdminStatsCard
          title="Managed Pages"
          :value="loading ? '...' : pages.length"
          color="blue"
          icon="pi pi-file"
        />
        <AdminStatsCard
          title="Active Sections"
          :value="loading ? '...' : totalSectionsCount"
          color="cyan"
          icon="pi pi-th-large"
        />
        <AdminStatsCard
          title="Legal Policies"
          :value="loading ? '...' : policies.length"
          color="purple"
          icon="pi pi-shield"
        />
        <AdminStatsCard
          title="Last Published"
          :value="loading ? '...' : formatRelativeTime(summary?.lastPublishedAt)"
          color="indigo"
          icon="pi pi-calendar"
        />
        <AdminStatsCard
          title="Latest Build"
          :value="loading ? '...' : (summary?.latestBuild?.status || 'idle')"
          :color="getBuildColor(summary?.latestBuild?.status, summary?.latestBuild)"
          :icon="getBuildIcon(summary?.latestBuild?.status, summary?.latestBuild)"
        />
      </div>

      <!-- Tab Navigation (Pills) -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div class="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'pages'"
            :class="[
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'pages'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
            @click="activeTab = 'pages'"
          >
            <i class="pi pi-desktop text-xs" aria-hidden="true" />
            <span>Storefront Pages</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                activeTab === 'pages' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ pages.length }}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'policies'"
            :class="[
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'policies'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
            @click="activeTab = 'policies'"
          >
            <i class="pi pi-shield text-xs" aria-hidden="true" />
            <span>Legal Policies</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                activeTab === 'policies' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ policies.length }}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'builds'"
            :class="[
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'builds'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
            @click="activeTab = 'builds'"
          >
            <i class="pi pi-cloud text-xs" aria-hidden="true" />
            <span>Deployments</span>
          </button>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          title="Refresh summary data"
          @click="fetchSummaryAndData"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner text-xs' : 'pi pi-refresh text-xs'" aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- TAB 1: STOREFRONT PAGES GRID -->
      <div v-if="activeTab === 'pages'" class="space-y-4">
        <div v-if="loading && pages.length === 0" class="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <i class="pi pi-spin pi-spinner text-3xl text-blue-600" aria-hidden="true" />
          <p class="mt-3 text-sm text-slate-500">Loading CMS pages...</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="page in pages"
            :key="page.slug"
            class="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-blue-300 hover:shadow-md"
          >
            <!-- Card Header -->
            <div>
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <i :class="getPageIcon(page.slug)" class="text-lg" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">{{ page.title }}</h3>
                    <span class="font-mono text-xs text-slate-500">/{{ page.slug === 'home' ? '' : page.slug }}</span>
                  </div>
                </div>

                <!-- Status Badge -->
                <AdminStatusBadge
                  :status="page.has_unpublished_changes ? 'warning' : 'active'"
                  :label="page.has_unpublished_changes ? 'Draft Changes' : 'Published'"
                />
              </div>

              <!-- Metadata Summary -->
              <div class="mt-4 space-y-1.5 text-xs text-slate-600">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Sections</span>
                  <span class="font-semibold text-slate-800">{{ page.sections_count ?? getSectionsCountForPage(page.slug) }} sections</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Target Pipeline</span>
                  <span class="font-mono font-medium text-slate-700">SSG Prerender</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Last Updated</span>
                  <span class="text-slate-700">{{ formatRelativeTime(page.updated_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span class="text-xs text-slate-400">
                {{ page.has_unpublished_changes ? 'Pending site update' : 'Live on production' }}
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="openSectionEditor(page.slug, page.title)"
              >
                <span>Edit Sections</span>
                <i class="pi pi-arrow-right text-[10px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: LEGAL POLICIES TABLE -->
      <div v-else-if="activeTab === 'policies'" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div class="border-b border-slate-200 px-6 py-4">
          <h3 class="text-base font-semibold text-slate-900">Legal & Compliance Documents</h3>
          <p class="text-xs text-slate-500">
            Structured Markdown compliance policies deployed alongside the static storefront.
          </p>
        </div>

        <div v-if="loading && policies.length === 0" class="p-12 text-center">
          <i class="pi pi-spin pi-spinner text-3xl text-blue-600" aria-hidden="true" />
          <p class="mt-3 text-sm text-slate-500">Loading policy documents...</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                <th class="px-6 py-3.5">Policy Document</th>
                <th class="px-6 py-3.5">Slug</th>
                <th class="px-6 py-3.5">Version</th>
                <th class="px-6 py-3.5">Status</th>
                <th class="px-6 py-3.5">Last Published</th>
                <th class="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="pol in policies"
                :key="pol.slug"
                class="transition-colors hover:bg-slate-50/70"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <i class="pi pi-file-o text-sm" aria-hidden="true" />
                    </div>
                    <span class="font-medium text-slate-900">{{ pol.title }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 font-mono text-xs text-slate-500">
                  /{{ pol.slug }}
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">
                    v{{ pol.version_num || pol.versionNum || 1 }}.0
                  </span>
                </td>
                <td class="px-6 py-4">
                  <AdminStatusBadge
                    :status="pol.has_unpublished_changes ? 'warning' : 'active'"
                    :label="pol.has_unpublished_changes ? 'Draft Changes' : 'Published'"
                  />
                </td>
                <td class="px-6 py-4 text-xs text-slate-600">
                  {{ formatRelativeTime(pol.published_at || pol.publishedAt) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    @click="openPolicyEditor(pol.slug)"
                  >
                    <i class="pi pi-pencil text-[10px]" aria-hidden="true" />
                    <span>Edit Document</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: DEPLOYMENT HISTORY TABLE -->
      <div v-else-if="activeTab === 'builds'" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 class="text-base font-semibold text-slate-900">Recent SSG Deployments</h3>
            <p class="text-xs text-slate-500">
              Audit log of Cloudflare Pages deploy hook dispatches and rebuild statuses.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
            @click="buildLogsOpen = true"
          >
            <i class="pi pi-external-link text-[10px]" aria-hidden="true" />
            <span>Open Detailed Logs</span>
          </button>
        </div>

        <div v-if="recentBuildEvents.length === 0" class="p-12 text-center text-slate-400">
          <i class="pi pi-cloud text-3xl text-slate-300" aria-hidden="true" />
          <p class="mt-2 text-sm font-medium text-slate-700">No deployment logs recorded</p>
          <p class="text-xs text-slate-500">Deploy events will appear here after clicking "Update Site".</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                <th class="px-6 py-3.5">Status</th>
                <th class="px-6 py-3.5">Trigger</th>
                <th class="px-6 py-3.5">Started</th>
                <th class="px-6 py-3.5">Duration</th>
                <th class="px-6 py-3.5">Response Code</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="ev in recentBuildEvents.slice(0, 8)"
                :key="ev.id"
                class="transition-colors hover:bg-slate-50/70"
              >
                <td class="px-6 py-3.5">
                  <AdminStatusBadge
                    :status="getBadgeTone(ev.status)"
                    :label="ev.status"
                  />
                </td>
                <td class="px-6 py-3.5 capitalize font-medium text-slate-800">
                  {{ ev.trigger_type || ev.triggerType || 'publish' }}
                </td>
                <td class="px-6 py-3.5 text-xs text-slate-600">
                  {{ formatDateTime(ev.started_at || ev.startedAt) }}
                </td>
                <td class="px-6 py-3.5 font-mono text-xs text-slate-600">
                  {{ calcDuration(ev.started_at || ev.startedAt, ev.completed_at || ev.completedAt) }}
                </td>
                <td class="px-6 py-3.5 font-mono text-xs">
                  <span
                    :class="[
                      'rounded-md px-2 py-0.5 font-semibold',
                      (ev.response_code || ev.responseCode) === 200
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700',
                    ]"
                  >
                    {{ ev.response_code ?? ev.responseCode ?? '-' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PUBLISH CONFIRMATION DIALOG -->
    <AdminConfirmDialog
      :visible="publishConfirmVisible"
      title="Publish Staged Changes & Rebuild Site"
      :message="publishConfirmMessage"
      confirm-label="Update Live Site"
      @confirm="executePublish"
      @cancel="publishConfirmVisible = false"
    />

    <!-- GLOBAL DIFF VIEWER DIALOG -->
    <AdminCmsDiffViewer
      v-model:visible="diffViewerVisible"
      title="All Staged Content Changes"
      subtitle="Reviewing all modified sections across non-storefront pages before deployment"
      :published-data="globalDiffPublished"
      :draft-data="globalDiffDraft"
      @publish="onDiffPublishTrigger"
    />

    <!-- DETAILED BUILD LOGS DRAWER -->
    <AdminCmsBuildLogs
      v-model:visible="buildLogsOpen"
      @trigger-build="executePublish"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import AdminPageHeader from '@/admin/components/shared/AdminPageHeader.vue'
import AdminStatsCard from '@/admin/components/shared/AdminStatsCard.vue'
import AdminStatusBadge from '@/admin/components/shared/AdminStatusBadge.vue'
import AdminConfirmDialog from '@/admin/components/shared/AdminConfirmDialog.vue'
import AdminCmsSectionEditor from '@/admin/components/cms/AdminCmsSectionEditor.vue'
import AdminCmsPolicyEditor from '@/admin/components/cms/AdminCmsPolicyEditor.vue'
import AdminCmsDiffViewer from '@/admin/components/cms/AdminCmsDiffViewer.vue'
import AdminCmsBuildLogs from '@/admin/components/cms/AdminCmsBuildLogs.vue'
import { adminApi } from '@/admin/api/adminApi'
import { useAdminAuth } from '@/admin/composables/useAdminAuth'
import type { CmsPage, CmsPolicy, CmsSummary, CmsBuildEvent } from '@/admin/types/admin'

const toast = useToast()
const { hasPermission } = useAdminAuth()

const canPublish = computed(() => hasPermission('cms.publish'))

const breadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Site Content' },
]

// ─── Sub-View Navigation State ──────────────────────────────────────────────
type CmsView = 'hub' | 'section-editor' | 'policy-editor'
const currentView = ref<CmsView>('hub')
const selectedPageSlug = ref<string>('')
const selectedPageTitle = ref<string>('')
const selectedPolicySlug = ref<string>('')

// ─── Tabs State ─────────────────────────────────────────────────────────────
type ActiveTab = 'pages' | 'policies' | 'builds'
const activeTab = ref<ActiveTab>('pages')

// ─── Data State ─────────────────────────────────────────────────────────────
const loading = ref(false)
const summary = ref<CmsSummary | null>(null)
const pages = ref<CmsPage[]>([])
const policies = ref<CmsPolicy[]>([])
const recentBuildEvents = ref<CmsBuildEvent[]>([])

// ─── Publish & Cooldown State ───────────────────────────────────────────────
const publishing = ref(false)
const publishConfirmVisible = ref(false)
const cooldownSeconds = ref(0)
let cooldownInterval: ReturnType<typeof setInterval> | null = null

// ─── Build Polling & Status Tracking ─────────────────────────────────────────
const previousBuildStatus = ref<string>('')
let buildPollTimer: ReturnType<typeof setInterval> | null = null
let pollCheckCount = 0
const MAX_POLL_CHECKS = 36 // 3 minutes at 5s interval

// ─── Modal Dialogs ──────────────────────────────────────────────────────────
const diffViewerVisible = ref(false)
const buildLogsOpen = ref(false)
const globalDiffPublished = ref<Record<string, unknown>>({})
const globalDiffDraft = ref<Record<string, unknown>>({})

// ─── Computed Getters ───────────────────────────────────────────────────────
const totalDirtyCount = computed(() => {
  const dirtyPages = pages.value.filter((p) => p.has_unpublished_changes).length
  const dirtyPolicies = policies.value.filter((p) => p.has_unpublished_changes).length
  return dirtyPages + dirtyPolicies
})

const totalSectionsCount = computed(() => {
  if (summary.value?.totalSections) return summary.value.totalSections
  return pages.value.reduce((acc, p) => acc + (p.sections_count || getSectionsCountForPage(p.slug)), 0)
})

const publishConfirmMessage = computed(() => {
  const dirtyP = pages.value.filter((p) => p.has_unpublished_changes).map((p) => p.title)
  const dirtyPol = policies.value.filter((p) => p.has_unpublished_changes).map((p) => p.title)
  const items = [...dirtyP, ...dirtyPol]
  if (items.length === 0) {
    return 'No staged content changes detected. Do you want to trigger a manual static rebuild of the storefront anyway?'
  }
  return `This will publish all staged changes across ${items.length} item(s) (${items.join(', ')}) and dispatch the Cloudflare Pages SSG rebuild pipeline.`
})

// ─── Lifecycle & Data Fetching ──────────────────────────────────────────────
onMounted(async () => {
  await fetchSummaryAndData()
})

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
  stopBuildPolling()
})

async function fetchSummaryAndData(): Promise<void> {
  loading.value = true
  try {
    const [summaryRes, pagesRes, policiesRes, buildsRes] = await Promise.allSettled([
      adminApi.get<CmsSummary>('/api/admin/cms/summary'),
      adminApi.get<{ pages: CmsPage[] } | CmsPage[]>('/api/admin/cms/pages'),
      adminApi.get<{ policies: CmsPolicy[] } | CmsPolicy[]>('/api/admin/cms/policies'),
      adminApi.get<{ buildEvents: CmsBuildEvent[] } | CmsBuildEvent[]>('/api/admin/cms/build-events'),
    ])

    if (summaryRes.status === 'fulfilled' && summaryRes.value) {
      summary.value = summaryRes.value
      syncCooldown(summary.value.latestBuild)
      syncBuildPolling(summary.value.latestBuild)
    }

    if (pagesRes.status === 'fulfilled' && pagesRes.value) {
      const val = pagesRes.value
      pages.value = Array.isArray(val) ? val : val.pages || []
    }

    if (policiesRes.status === 'fulfilled' && policiesRes.value) {
      const val = policiesRes.value
      policies.value = Array.isArray(val) ? val : val.policies || []
    }

    if (buildsRes.status === 'fulfilled' && buildsRes.value) {
      const val = buildsRes.value
      recentBuildEvents.value = Array.isArray(val) ? val : val.buildEvents || []
    }
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      severity: 'error',
      summary: 'Data Fetch Error',
      detail: error?.message || 'Could not load CMS status.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

// ─── Cooldown Synchronization ───────────────────────────────────────────────
function syncCooldown(latestBuild: CmsBuildEvent | null | undefined): void {
  if (!latestBuild) return
  const startedAtStr = latestBuild.started_at || latestBuild.startedAt
  if (!startedAtStr) return

  const startedAt = new Date(startedAtStr).getTime()
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
  const remaining = Math.max(0, 60 - elapsedSeconds)

  if (remaining > 0 && (latestBuild.status === 'pending' || latestBuild.status === 'triggered')) {
    startCooldownTimer(remaining)
  }
}

function startCooldownTimer(seconds: number): void {
  if (cooldownInterval) clearInterval(cooldownInterval)
  cooldownSeconds.value = seconds
  cooldownInterval = setInterval(() => {
    cooldownSeconds.value -= 1
    if (cooldownSeconds.value <= 0) {
      cooldownSeconds.value = 0
      if (cooldownInterval) clearInterval(cooldownInterval)
    }
  }, 1000)
}

// ─── Build Polling Synchronization ──────────────────────────────────────────
function stopBuildPolling(): void {
  if (buildPollTimer) {
    clearInterval(buildPollTimer)
    buildPollTimer = null
  }
  pollCheckCount = 0
}

function startBuildPolling(): void {
  if (buildPollTimer) return
  pollCheckCount = 0
  buildPollTimer = setInterval(async () => {
    pollCheckCount++
    if (pollCheckCount >= MAX_POLL_CHECKS) {
      stopBuildPolling()
      return
    }
    await fetchSummaryAndData()
  }, 5000)
}

function syncBuildPolling(latestBuild: CmsBuildEvent | null | undefined): void {
  const currentStatus = latestBuild?.status || ''
  const prevStatus = previousBuildStatus.value

  if (prevStatus === 'pending' || prevStatus === 'triggered') {
    if (currentStatus === 'success') {
      stopBuildPolling()
      toast.add({
        severity: 'success',
        summary: 'Storefront Deployment Complete',
        detail: 'Cloudflare Pages SSG build has finished successfully.',
        life: 5000,
      })
    } else if (currentStatus === 'failed') {
      stopBuildPolling()
      const errorDetail =
        latestBuild?.errorMessage ||
        latestBuild?.error_message ||
        'Cloudflare Pages build failed.'
      toast.add({
        severity: 'error',
        summary: 'Deployment Failed',
        detail: errorDetail,
        life: 6000,
      })
    }
  }

  previousBuildStatus.value = currentStatus

  if (currentStatus === 'pending' || currentStatus === 'triggered') {
    startBuildPolling()
  } else {
    stopBuildPolling()
  }
}

// ─── Navigation Handlers ────────────────────────────────────────────────────
function openSectionEditor(slug: string, title: string): void {
  selectedPageSlug.value = slug
  selectedPageTitle.value = title
  currentView.value = 'section-editor'
}

function openPolicyEditor(slug: string): void {
  selectedPolicySlug.value = slug
  currentView.value = 'policy-editor'
}

function navigateBackToHub(): void {
  currentView.value = 'hub'
  selectedPageSlug.value = ''
  selectedPolicySlug.value = ''
  fetchSummaryAndData()
}

// ─── Publish Handlers ───────────────────────────────────────────────────────
function promptPublish(): void {
  if (cooldownSeconds.value > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Cooldown Active',
      detail: `Please wait ${cooldownSeconds.value}s before triggering another build.`,
      life: 3000,
    })
    return
  }
  publishConfirmVisible.value = true
}

async function executePublish(): Promise<void> {
  publishConfirmVisible.value = false
  publishing.value = true
  try {
    const res = await adminApi.post<{ success: boolean; message: string; eventId?: string }>('/api/admin/cms/publish-and-build')
    toast.add({
      severity: 'success',
      summary: 'Site Update Triggered',
      detail: res?.message || 'Published staged content and initiated storefront build.',
      life: 5000,
    })
    startCooldownTimer(60)
    await fetchSummaryAndData()
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: error?.message || 'Failed to publish content or trigger deploy hook.',
      life: 5000,
    })
  } finally {
    publishing.value = false
  }
}

function onDiffPublishTrigger(): void {
  diffViewerVisible.value = false
  promptPublish()
}

// ─── Global Diff Assembly ───────────────────────────────────────────────────
async function openGlobalDiff(): Promise<void> {
  loading.value = true
  const pubCombined: Record<string, unknown> = {}
  const draftCombined: Record<string, unknown> = {}

  try {
    for (const page of pages.value) {
      if (page.has_unpublished_changes) {
        const pageRes = await adminApi.get<{ sections: Array<{ section_key?: string; sectionKey?: string; draft_data?: Record<string, unknown>; draftData?: Record<string, unknown>; published_data?: Record<string, unknown>; publishedData?: Record<string, unknown> }> }>(`/api/admin/cms/pages/${page.slug}`)
        if (pageRes?.sections) {
          pubCombined[page.slug] = {}
          draftCombined[page.slug] = {}
          for (const s of pageRes.sections) {
            const k = s.sectionKey || s.section_key || 'section'
            ;(pubCombined[page.slug] as Record<string, unknown>)[k] = s.publishedData || s.published_data || {}
            ;(draftCombined[page.slug] as Record<string, unknown>)[k] = s.draftData || s.draft_data || {}
          }
        }
      }
    }

    for (const pol of policies.value) {
      if (pol.has_unpublished_changes) {
        pubCombined[`policy:${pol.slug}`] = pol.published_content || pol.publishedContent || ''
        draftCombined[`policy:${pol.slug}`] = pol.draft_content || pol.draftContent || ''
      }
    }

    globalDiffPublished.value = pubCombined
    globalDiffDraft.value = draftCombined
    diffViewerVisible.value = true
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      severity: 'error',
      summary: 'Diff Error',
      detail: error?.message || 'Could not assemble staged diff data.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

// ─── Formatters & Visual Helpers ────────────────────────────────────────────
function getPageIcon(slug: string): string {
  switch (slug) {
    case 'home':
      return 'pi pi-home'
    case 'about':
      return 'pi pi-info-circle'
    case 'collabs':
      return 'pi pi-sparkles'
    case 'portfolio':
      return 'pi pi-images'
    case 'contact':
      return 'pi pi-envelope'
    case 'footer':
      return 'pi pi-bars'
    default:
      return 'pi pi-file'
  }
}

function getSectionsCountForPage(slug: string): number {
  switch (slug) {
    case 'home':
      return 3
    case 'about':
      return 2
    case 'collabs':
      return 1
    case 'portfolio':
      return 1
    case 'contact':
      return 1
    case 'footer':
      return 1
    default:
      return 1
  }
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Never'
  const time = new Date(dateStr).getTime()
  if (isNaN(time)) return 'Never'
  const diffSec = Math.floor((Date.now() - time) / 1000)
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calcDuration(start?: string | null, end?: string | null): string {
  if (!start) return '-'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  if (isNaN(s) || isNaN(e)) return '-'
  const sec = Math.max(0, Math.round((e - s) / 1000))
  return `${sec}s`
}

function isBuildTriggerActive(build?: CmsBuildEvent | null): boolean {
  if (cooldownSeconds.value > 0) return true
  const targetBuild = build ?? summary.value?.latestBuild
  const startedAtStr = targetBuild?.started_at || targetBuild?.startedAt
  if (!startedAtStr) return false
  const startedAt = new Date(startedAtStr).getTime()
  if (isNaN(startedAt)) return false
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
  return elapsedSeconds < 60
}

function getBuildColor(status?: string, build?: CmsBuildEvent | null): 'emerald' | 'blue' | 'red' | 'purple' {
  switch (status) {
    case 'success':
      return 'emerald'
    case 'pending':
      return 'blue'
    case 'triggered':
      return isBuildTriggerActive(build) ? 'blue' : 'blue'
    case 'failed':
      return 'red'
    case 'skipped_local':
      return 'purple'
    default:
      return 'emerald'
  }
}

function getBuildIcon(status?: string, build?: CmsBuildEvent | null): string {
  switch (status) {
    case 'success':
      return 'pi pi-check-circle'
    case 'pending':
      return 'pi pi-spin pi-spinner'
    case 'triggered':
      return isBuildTriggerActive(build) ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'
    case 'failed':
      return 'pi pi-exclamation-triangle'
    case 'skipped_local':
      return 'pi pi-info-circle'
    default:
      return 'pi pi-cloud'
  }
}

function getBadgeTone(status?: string): 'active' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'success':
      return 'active'
    case 'pending':
    case 'triggered':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}
</script>
