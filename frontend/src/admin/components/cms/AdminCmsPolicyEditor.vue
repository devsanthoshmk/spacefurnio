<template>
  <div class="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-slate-100/70 text-slate-800">
    <Toast />

    <!-- TOPBAR / ACTION BAR -->
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md sm:px-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Left: Back Button & Breadcrumbs -->
        <div class="flex min-w-0 items-center gap-3">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary"
            title="Back to CMS"
            aria-label="Back to CMS"
            @click="handleBack"
          >
            <i class="pi pi-arrow-left text-sm" />
          </button>

          <nav class="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm" aria-label="Breadcrumb">
            <button
              type="button"
              class="font-medium text-slate-500 transition hover:text-slate-800"
              @click="handleBack"
            >
              CMS
            </button>
            <i class="pi pi-angle-right text-[10px] text-slate-400" />
            <span class="font-medium text-slate-500">Policies</span>
            <i class="pi pi-angle-right text-[10px] text-slate-400" />
            <span class="max-w-[140px] sm:max-w-xs truncate font-semibold text-slate-900">
              {{ policyTitle || policySlug }}
            </span>
          </nav>
        </div>

        <!-- Center: Status Chips -->
        <div class="flex items-center gap-2">
          <!-- Dirty Draft Indicator -->
          <span
            v-if="hasUnpublishedChanges || isDirty"
            class="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 shadow-2xs"
            title="Unpublished draft changes present"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Draft Changes Active
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 shadow-2xs"
            title="Draft matches live published policy"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Published & Synced
          </span>

          <!-- Autosave Status Indicator -->
          <div
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
            :class="{
              'bg-blue-50 text-blue-700': saveStatus === 'saving',
              'bg-emerald-50 text-emerald-700': saveStatus === 'saved',
              'bg-amber-50 text-amber-700': saveStatus === 'unsaved',
              'bg-rose-50 text-rose-700': saveStatus === 'error',
            }"
          >
            <i
              v-if="saveStatus === 'saving'"
              class="pi pi-spin pi-spinner text-xs"
            />
            <i
              v-else-if="saveStatus === 'saved'"
              class="pi pi-check text-xs"
            />
            <i
              v-else-if="saveStatus === 'error'"
              class="pi pi-exclamation-circle text-xs"
            />
            <span
              v-else
              class="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
            <span>{{ statusLabel }}</span>
          </div>
        </div>

        <!-- Right: View Mode & Action Buttons -->
        <div class="flex items-center gap-2">
          <!-- Pane Toggle Controls (Split / Editor / Preview) -->
          <div
            class="hidden md:inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-slate-600"
            role="group"
            aria-label="Editor View Layout"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer"
              :class="viewMode === 'split' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'hover:text-slate-900'"
              title="Split View (Editor + Live Preview)"
              @click="viewMode = 'split'"
            >
              <i class="pi pi-table text-xs" />
              <span>Split</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer"
              :class="viewMode === 'editor' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'hover:text-slate-900'"
              title="Editor Only"
              @click="viewMode = 'editor'"
            >
              <i class="pi pi-file-edit text-xs" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer"
              :class="viewMode === 'preview' ? 'bg-white text-admin-primary shadow-2xs font-semibold' : 'hover:text-slate-900'"
              title="Preview Only"
              @click="viewMode = 'preview'"
            >
              <i class="pi pi-eye text-xs" />
              <span>Preview</span>
            </button>
          </div>

          <!-- View Diff Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary cursor-pointer"
            title="Compare published content vs draft"
            @click="diffViewerOpen = true"
          >
            <i class="pi pi-sliders-h text-xs text-slate-500" />
            <span class="hidden sm:inline">View Diff</span>
          </button>

          <!-- History Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-admin-primary cursor-pointer"
            title="Version history and rollbacks"
            @click="versionDrawerOpen = true"
          >
            <i class="pi pi-history text-xs text-slate-500" />
            <span class="hidden sm:inline">History</span>
          </button>

          <!-- Save Draft Button -->
          <button
            type="button"
            :disabled="saveStatus === 'saving' || loading"
            class="inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-admin-primary-hover focus:outline-none focus:ring-2 focus:ring-admin-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            @click="handleManualSave"
          >
            <i
              :class="[
                'text-xs',
                saveStatus === 'saving' ? 'pi pi-spin pi-spinner' : 'pi pi-save',
              ]"
            />
            <span>Save Draft</span>
          </button>
        </div>
      </div>
    </header>

    <!-- LOADING STATE -->
    <div
      v-if="loading && !initialLoaded"
      class="flex flex-1 flex-col items-center justify-center py-24 text-center"
    >
      <i class="pi pi-spin pi-spinner text-3xl text-admin-primary" />
      <p class="mt-3 text-sm font-medium text-slate-600">Loading policy document...</p>
    </div>

    <!-- ERROR STATE -->
    <div
      v-else-if="loadError"
      class="m-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-rose-500" />
      <h3 class="mt-2 text-base font-semibold text-rose-900">Failed to load policy</h3>
      <p class="mt-1 text-sm text-rose-700">{{ loadError }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 focus:outline-none"
        @click="fetchPolicy"
      >
        <i class="pi pi-refresh text-xs" />
        <span>Retry</span>
      </button>
    </div>

    <!-- MAIN SPLIT WORKSPACE -->
    <div
      v-else
      class="flex flex-1 flex-col overflow-hidden lg:flex-row"
    >
      <!-- LEFT: MARKDOWN EDITOR PANE -->
      <section
        v-show="viewMode === 'split' || viewMode === 'editor'"
        :class="[
          'flex flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r',
          viewMode === 'editor' ? 'w-full' : 'w-full lg:w-1/2',
        ]"
      >
        <!-- Editor Header: Document Title & Slug -->
        <div class="border-b border-slate-200 bg-slate-50/70 p-4">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Policy Document Title
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="policyTitle"
              type="text"
              placeholder="e.g. Terms of Service"
              class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20"
              @input="onFieldChange"
            />
            <span
              class="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-2 font-mono text-xs text-slate-600"
              title="Policy URL slug"
            >
              <i class="pi pi-link text-[11px] text-slate-400" />
              <span>/{{ policySlug }}</span>
            </span>
          </div>
        </div>

        <!-- Markdown Toolbar -->
        <div class="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-1.5 select-none">
          <!-- Heading 1 -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Heading 1"
            aria-label="Heading 1"
            @click="insertLinePrefix('# ')"
          >
            H1
          </button>
          <!-- Heading 2 -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Heading 2"
            aria-label="Heading 2"
            @click="insertLinePrefix('## ')"
          >
            H2
          </button>
          <!-- Heading 3 -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Heading 3"
            aria-label="Heading 3"
            @click="insertLinePrefix('### ')"
          >
            H3
          </button>

          <span class="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />

          <!-- Bold -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Bold (**text**)"
            aria-label="Bold"
            @click="insertWrap('**', '**', 'bold text')"
          >
            <i class="pi pi-bold text-xs" />
          </button>
          <!-- Italic -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Italic (*text*)"
            aria-label="Italic"
            @click="insertWrap('*', '*', 'italic text')"
          >
            <i class="pi pi-italic text-xs" />
          </button>
          <!-- Strikethrough -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Strikethrough (~~text~~)"
            aria-label="Strikethrough"
            @click="insertWrap('~~', '~~', 'strikethrough text')"
          >
            <span class="line-through text-xs font-semibold">S</span>
          </button>

          <span class="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />

          <!-- Bullet List -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Bulleted List (- item)"
            aria-label="Bulleted List"
            @click="insertLinePrefix('- ')"
          >
            <i class="pi pi-list text-xs" />
          </button>
          <!-- Numbered List -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-mono text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Numbered List (1. item)"
            aria-label="Numbered List"
            @click="insertLinePrefix('1. ')"
          >
            <span class="text-[11px] font-bold">1.</span>
          </button>
          <!-- Blockquote -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Blockquote (> quote)"
            aria-label="Blockquote"
            @click="insertLinePrefix('> ')"
          >
            <i class="pi pi-comment text-xs" />
          </button>

          <span class="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />

          <!-- Link -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Insert Link [title](url)"
            aria-label="Insert Link"
            @click="insertLink"
          >
            <i class="pi pi-link text-xs" />
          </button>
          <!-- Code Block -->
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition cursor-pointer"
            title="Code Block"
            aria-label="Code Block"
            @click="insertWrap('```\n', '\n```', 'code content')"
          >
            <i class="pi pi-code text-xs" />
          </button>
        </div>

        <!-- Textarea with Synchronized Line Numbers -->
        <div class="relative flex flex-1 overflow-hidden bg-white">
          <!-- Line Numbers Gutter -->
          <div
            ref="lineNumbersContainer"
            class="w-12 select-none overflow-hidden border-r border-slate-200 bg-slate-50/70 py-3 pr-2 text-right font-mono text-xs text-slate-400 leading-6 shrink-0"
            aria-hidden="true"
          >
            <div
              v-for="n in lineCount"
              :key="n"
              class="h-6"
            >
              {{ n }}
            </div>
          </div>

          <!-- Main Markdown Textarea -->
          <textarea
            ref="editorTextarea"
            v-model="draftContent"
            rows="20"
            spellcheck="false"
            placeholder="Write legal policy content using markdown..."
            class="h-full w-full resize-none overflow-y-auto bg-white p-3 font-mono text-xs sm:text-sm text-slate-800 leading-6 focus:outline-none"
            @scroll="syncScroll"
            @input="onFieldChange"
          />
        </div>

        <!-- Editor Footer: Stats & Meta -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-xs text-slate-500">
          <div class="flex items-center gap-3">
            <span>
              <strong class="font-semibold text-slate-700">{{ wordCount }}</strong> words
            </span>
            <span class="text-slate-300">•</span>
            <span>
              <strong class="font-semibold text-slate-700">{{ charCount }}</strong> characters
            </span>
            <span class="text-slate-300">•</span>
            <span>
              <strong class="font-semibold text-slate-700">{{ lineCount }}</strong> lines
            </span>
          </div>

          <div class="flex items-center gap-3 text-[11px] text-slate-400">
            <span v-if="versionNum != null">Version #{{ versionNum }}</span>
            <span v-if="lastSavedAt">
              Saved {{ formatTime(lastSavedAt) }}
            </span>
          </div>
        </div>
      </section>

      <!-- RIGHT: REAL-TIME RENDERED PREVIEW PANE -->
      <section
        v-show="viewMode === 'split' || viewMode === 'preview'"
        :class="[
          'flex flex-col bg-slate-50 overflow-hidden',
          viewMode === 'preview' ? 'w-full' : 'w-full lg:w-1/2',
        ]"
      >
        <!-- Preview Header -->
        <div class="flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-3 backdrop-blur-xs">
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 rounded-full bg-emerald-500" />
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Rendered Preview
            </h2>
          </div>

          <div class="flex items-center gap-2.5 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1">
              <i class="pi pi-clock text-[10px]" />
              <span>~{{ readTimeMinutes }} min read</span>
            </span>
            <span
              v-if="publishedAt"
              class="hidden sm:inline-block text-slate-400"
            >
              Published {{ formatDate(publishedAt) }}
            </span>
          </div>
        </div>

        <!-- Preview Document Canvas -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10">
          <div class="mx-auto max-w-3xl rounded-xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs">
            <!-- Spacefurnio Editorial Brand Document Header -->
            <header class="border-b border-slate-200 pb-6 mb-8">
              <div class="flex items-center gap-2 mb-2">
                <span class="inline-block rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Spacefurnio Legal Policy
                </span>
                <span v-if="publishedAt" class="text-xs text-slate-400">
                  Last updated {{ formatDate(publishedAt) }}
                </span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
                {{ policyTitle || 'Untitled Policy Document' }}
              </h1>
            </header>

            <!-- Rendered Markdown Body -->
            <div
              v-if="renderedHtml"
              class="policy-markdown-content"
              v-html="renderedHtml"
            />
            <div
              v-else
              class="py-12 text-center text-slate-400"
            >
              <i class="pi pi-file-edit text-3xl mb-2 text-slate-300" />
              <p class="text-sm">No policy content entered yet. Type markdown on the left to see live preview.</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- INTEGRATED MODALS & DRAWERS -->
    <!-- 1. Diff Viewer (Policy Multiline Text Mode) -->
    <AdminCmsDiffViewer
      v-model:visible="diffViewerOpen"
      :is-policy="true"
      :title="`Compare: ${policyTitle || policySlug}`"
      :subtitle="`Comparing Live Published vs Staged Draft (${policySlug})`"
      :published-data="publishedContent"
      :draft-data="draftContent"
      @publish="handlePublishFromDiff"
    />

    <!-- 2. Version History Drawer -->
    <AdminCmsVersionDrawer
      v-model:visible="versionDrawerOpen"
      :scope="policySlug"
      :entity-id="policySlug"
      :title="`${policyTitle || policySlug} History`"
      @restored="handleVersionRestored"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import adminApi from '@/admin/api/adminApi'
import { renderMarkdown } from '@/admin/utils/markdown'
import { formatDate } from '@/admin/utils/formatters'
import AdminCmsDiffViewer from '@/admin/components/cms/AdminCmsDiffViewer.vue'
import AdminCmsVersionDrawer from '@/admin/components/cms/AdminCmsVersionDrawer.vue'
import type { CmsPolicy, CmsVersion } from '@/admin/types/admin'

defineOptions({
  name: 'AdminCmsPolicyEditor',
})

// ─── Props & Emits ───────────────────────────────────────────────────────────
const props = defineProps<{
  policySlug: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'updated'): void
}>()

const toast = useToast()

// ─── State ───────────────────────────────────────────────────────────────────
const loading = ref(true)
const initialLoaded = ref(false)
const loadError = ref<string | null>(null)

// Document Fields
const policyTitle = ref('')
const draftContent = ref('')
const publishedContent = ref('')
const versionNum = ref<number | null>(null)
const hasUnpublishedChanges = ref(false)
const publishedAt = ref<string | null>(null)
const updatedAt = ref<string | null>(null)

// Saved baseline state for dirty check
const baselineTitle = ref('')
const baselineDraft = ref('')

// Layout & UI
const viewMode = ref<'split' | 'editor' | 'preview'>('split')
const saveStatus = ref<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
const lastSavedAt = ref<Date | null>(null)

// Modals
const diffViewerOpen = ref(false)
const versionDrawerOpen = ref(false)

// DOM Elements
const editorTextarea = ref<HTMLTextAreaElement | null>(null)
const lineNumbersContainer = ref<HTMLDivElement | null>(null)

// Autosave timer
let autosaveTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Computed Properties ─────────────────────────────────────────────────────
const isDirty = computed(() => {
  return policyTitle.value !== baselineTitle.value || draftContent.value !== baselineDraft.value
})

const statusLabel = computed(() => {
  switch (saveStatus.value) {
    case 'saving':
      return 'Saving...'
    case 'saved':
      return 'Saved'
    case 'unsaved':
      return 'Unsaved changes'
    case 'error':
      return 'Save failed'
    default:
      return ''
  }
})

const charCount = computed(() => draftContent.value.length)

const wordCount = computed(() => {
  const trimmed = draftContent.value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
})

const lineCount = computed(() => {
  if (!draftContent.value) return 1
  return draftContent.value.split('\n').length
})

const readTimeMinutes = computed(() => {
  return Math.max(1, Math.ceil(wordCount.value / 200))
})

const renderedHtml = computed(() => {
  return renderMarkdown(draftContent.value)
})

// ─── Methods ─────────────────────────────────────────────────────────────────
function handleBack(): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
    autosaveTimeout = null
  }
  emit('back')
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}

function syncScroll(): void {
  if (editorTextarea.value && lineNumbersContainer.value) {
    lineNumbersContainer.value.scrollTop = editorTextarea.value.scrollTop
  }
}

// Markdown Helper Insertions
function insertWrap(prefix: string, suffix = '', defaultText = ''): void {
  const textarea = editorTextarea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = draftContent.value
  const selectedText = text.substring(start, end)
  const replacement = selectedText || defaultText

  draftContent.value = text.substring(0, start) + prefix + replacement + suffix + text.substring(end)
  onFieldChange()

  nextTick(() => {
    textarea.focus()
    const cursorStart = start + prefix.length
    const cursorEnd = cursorStart + replacement.length
    textarea.setSelectionRange(cursorStart, cursorEnd)
  })
}

function insertLinePrefix(prefix: string): void {
  const textarea = editorTextarea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = draftContent.value

  if (start !== end) {
    const selectedText = text.substring(start, end)
    const lines = selectedText.split('\n')
    const prefixed = lines
      .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
      .join('\n')
    draftContent.value = text.substring(0, start) + prefixed + text.substring(end)
    onFieldChange()

    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + prefixed.length)
    })
    return
  }

  const lineStart = text.lastIndexOf('\n', start - 1) + 1

  draftContent.value = text.substring(0, lineStart) + prefix + text.substring(lineStart)
  onFieldChange()

  nextTick(() => {
    textarea.focus()
    const newPos = start + prefix.length
    textarea.setSelectionRange(newPos, newPos)
  })
}

function insertLink(): void {
  const textarea = editorTextarea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = draftContent.value
  const selected = text.substring(start, end)

  if (selected) {
    insertWrap('[', '](https://example.com)', selected)
  } else {
    insertWrap('[', '](https://example.com)', 'link text')
  }
}

// Fetch Policy from Backend API
async function fetchPolicy(): Promise<void> {
  if (!props.policySlug) return
  loading.value = true
  loadError.value = null

  try {
    const data = await adminApi.get<CmsPolicy>(`/api/admin/cms/policies/${props.policySlug}`)

    policyTitle.value = data.title || ''
    draftContent.value = data.draftContent ?? data.draft_content ?? ''
    publishedContent.value = data.publishedContent ?? data.published_content ?? ''
    versionNum.value = data.versionNum ?? data.version_num ?? 1
    hasUnpublishedChanges.value = Boolean(data.hasUnpublishedChanges ?? data.has_unpublished_changes)
    publishedAt.value = data.publishedAt ?? data.published_at ?? null
    updatedAt.value = data.updatedAt ?? data.updated_at ?? null

    baselineTitle.value = policyTitle.value
    baselineDraft.value = draftContent.value
    saveStatus.value = 'saved'
    initialLoaded.value = true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch policy'
    loadError.value = msg
    toast.add({
      severity: 'error',
      summary: 'Load Error',
      detail: msg,
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

// Field Change Tracker with Debounced Autosave (1200ms)
function onFieldChange(): void {
  saveStatus.value = 'unsaved'

  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
  }

  autosaveTimeout = setTimeout(() => {
    savePolicy(true)
  }, 1200)
}

// Save Policy Draft
async function savePolicy(isAutosave = false): Promise<void> {
  if (saveStatus.value === 'saving') return
  if (isAutosave && !isDirty.value) return

  saveStatus.value = 'saving'

  try {
    const payload = {
      title: policyTitle.value.trim(),
      draftContent: draftContent.value,
      changeSummary: isAutosave ? 'Autosaved policy draft' : 'Manual policy draft update',
    }

    const res = await adminApi.put<{
      success: boolean
      policy: CmsPolicy
    }>(`/api/admin/cms/policies/${props.policySlug}`, payload)

    if (res.policy) {
      versionNum.value = res.policy.versionNum ?? res.policy.version_num ?? versionNum.value
      hasUnpublishedChanges.value = Boolean(
        res.policy.hasUnpublishedChanges ?? res.policy.has_unpublished_changes ?? true,
      )
      publishedContent.value = res.policy.publishedContent ?? res.policy.published_content ?? publishedContent.value
      updatedAt.value = res.policy.updatedAt ?? res.policy.updated_at ?? new Date().toISOString()
    }

    baselineTitle.value = policyTitle.value
    baselineDraft.value = draftContent.value
    saveStatus.value = 'saved'
    lastSavedAt.value = new Date()

    if (!isAutosave) {
      toast.add({
        severity: 'success',
        summary: 'Draft Saved',
        detail: `Draft for "${policyTitle.value}" saved successfully.`,
        life: 3000,
      })
    }

    emit('updated')
  } catch (err: unknown) {
    saveStatus.value = 'error'
    const msg = err instanceof Error ? err.message : 'Failed to save policy draft'
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: msg,
      life: 5000,
    })
  }
}

function handleManualSave(): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
    autosaveTimeout = null
  }
  savePolicy(false)
}

// Version Restored Callback
async function handleVersionRestored(version: CmsVersion): Promise<void> {
  versionDrawerOpen.value = false
  await fetchPolicy()

  toast.add({
    severity: 'success',
    summary: 'Version Restored',
    detail: `Restored snapshot #${version.versionNum ?? version.id}. Draft updated.`,
    life: 4000,
  })

  emit('updated')
}

// Publish from Diff Viewer Callback
async function handlePublishFromDiff(): Promise<void> {
  try {
    diffViewerOpen.value = false
    // Ensure draft is saved first
    await savePolicy(true)

    toast.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: 'Staged changes saved. Use "Update Site" in CMS to publish all changes.',
      life: 4000,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error syncing before publish'
    toast.add({
      severity: 'error',
      summary: 'Action Failed',
      detail: msg,
      life: 4000,
    })
  }
}

// ─── Lifecycle & Watchers ────────────────────────────────────────────────────
watch(
  () => props.policySlug,
  (newSlug) => {
    if (newSlug) {
      fetchPolicy()
    }
  },
)

onMounted(() => {
  fetchPolicy()
})

onBeforeUnmount(() => {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
    autosaveTimeout = null
  }
})
</script>

<style scoped>
/* Spacefurnio Brand Markdown Typography Styling */
.policy-markdown-content :deep(h1) {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.25;
  color: #0f172a;
  border-bottom: 2px solid #f59e0b;
  padding-bottom: 0.5rem;
  margin-top: 1.75rem;
  margin-bottom: 1rem;
}

.policy-markdown-content :deep(h2) {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.3;
  color: #1e293b;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  position: relative;
  padding-left: 0.75rem;
}

.policy-markdown-content :deep(h2)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.25rem;
  bottom: 0.25rem;
  width: 3px;
  background-color: #f59e0b;
  border-radius: 9999px;
}

.policy-markdown-content :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.policy-markdown-content :deep(p) {
  font-size: 0.9375rem;
  line-height: 1.75;
  color: #334155;
  margin-bottom: 1.125rem;
}

.policy-markdown-content :deep(strong) {
  font-weight: 600;
  color: #0f172a;
}

.policy-markdown-content :deep(em) {
  font-style: italic;
  color: #475569;
}

.policy-markdown-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1.125rem;
  color: #334155;
}

.policy-markdown-content :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1.125rem;
  color: #334155;
}

.policy-markdown-content :deep(li) {
  margin-bottom: 0.375rem;
  line-height: 1.6;
}

.policy-markdown-content :deep(blockquote) {
  border-left: 4px solid #f59e0b;
  background-color: #fffbeb;
  padding: 0.875rem 1.25rem;
  border-radius: 0 0.5rem 0.5rem 0;
  margin: 1.25rem 0;
  color: #78350f;
  font-style: italic;
}

.policy-markdown-content :deep(blockquote p) {
  margin-bottom: 0;
  color: inherit;
}

.policy-markdown-content :deep(a) {
  color: #d97706;
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 500;
  transition: color 150ms ease;
}

.policy-markdown-content :deep(a:hover) {
  color: #b45309;
}

.policy-markdown-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  background-color: #f1f5f9;
  color: #0f172a;
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
}

.policy-markdown-content :deep(pre) {
  background-color: #0f172a;
  color: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.25rem 0;
}

.policy-markdown-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.8125rem;
}
</style>
