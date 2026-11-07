<template>
  <Teleport to="body">
    <Transition name="admin-dialog">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 md:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @mousedown.self="close"
      >
        <div
          class="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div class="border-b border-slate-200 bg-white px-5 py-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-admin-primary"
                  >
                    <i class="pi pi-sliders-h text-sm" />
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-admin-text">
                      {{ title }}
                    </h2>
                    <p v-if="subtitle" class="text-xs text-admin-text-secondary">
                      {{ subtitle }}
                    </p>
                    <p v-else class="text-xs text-admin-text-secondary">
                      Comparing Live Published vs. Current Staged Draft
                    </p>
                  </div>
                </div>
              </div>

              <!-- Close Button -->
              <button
                type="button"
                aria-label="Close dialog"
                class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                @click="close"
              >
                <i class="pi pi-times text-base" />
              </button>
            </div>

            <!-- Toolbar & KPI Strip -->
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
              <!-- KPI Counters -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Total Changes -->
                <div
                  class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <span class="text-slate-500">Total:</span>
                  <span class="font-bold text-slate-900">{{ kpi.totalChanges }}</span>
                </div>

                <!-- Additions -->
                <div
                  class="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                >
                  <i class="pi pi-plus text-[10px]" />
                  <span>{{ kpi.addedCount }} Added</span>
                </div>

                <!-- Deletions -->
                <div
                  class="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800"
                >
                  <i class="pi pi-minus text-[10px]" />
                  <span>{{ kpi.removedCount }} Removed</span>
                </div>

                <!-- Modifications (for structured mode) -->
                <div
                  v-if="!isTextMode"
                  class="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                >
                  <i class="pi pi-sync text-[10px]" />
                  <span>{{ kpi.modifiedCount }} Modified</span>
                </div>
              </div>

              <!-- View Controls -->
              <div class="flex items-center gap-2.5">
                <!-- Show Unchanged Toggle (structured mode only) -->
                <label
                  v-if="!isTextMode && kpi.totalChanges > 0"
                  class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600 select-none"
                >
                  <input
                    v-model="showUnchanged"
                    type="checkbox"
                    class="h-3.5 w-3.5 rounded border-slate-300 text-admin-primary focus:ring-admin-primary"
                  />
                  <span>Show unchanged</span>
                </label>

                <!-- View Mode Toggle -->
                <div
                  class="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium"
                >
                  <button
                    type="button"
                    :disabled="isMobile"
                    :class="[
                      'flex items-center gap-1 rounded-md px-2.5 py-1 transition',
                      viewMode === 'split'
                        ? 'bg-white text-admin-primary shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900',
                      isMobile ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                    ]"
                    title="Side-by-Side (Split) View"
                    @click="viewMode = 'split'"
                  >
                    <i class="pi pi-pause text-[10px]" />
                    <span class="hidden sm:inline">Split</span>
                  </button>
                  <button
                    type="button"
                    :class="[
                      'flex items-center gap-1 rounded-md px-2.5 py-1 transition cursor-pointer',
                      viewMode === 'unified'
                        ? 'bg-white text-admin-primary shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900',
                    ]"
                    title="Unified List View"
                    @click="viewMode = 'unified'"
                  >
                    <i class="pi pi-bars text-[10px]" />
                    <span class="hidden sm:inline">Unified</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-5">
            <!-- Empty State: No Changes -->
            <div
              v-if="hasNoChanges"
              class="flex flex-col items-center justify-center py-16 text-center"
            >
              <div
                class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              >
                <i class="pi pi-check text-2xl" />
              </div>
              <h3 class="mt-4 text-base font-semibold text-slate-800">
                No changes detected
              </h3>
              <p class="mt-1 max-w-sm text-sm text-slate-500">
                The current staged draft matches the live published version exactly.
              </p>
            </div>

            <!-- Content Mode: Policy / Multiline Text Diff -->
            <div v-else-if="isTextMode" class="space-y-4">
              <!-- Split Mode Text Diff -->
              <div
                v-if="viewMode === 'split'"
                class="overflow-hidden rounded-lg border border-slate-200 bg-white font-mono text-xs shadow-xs"
              >
                <!-- Split Table Header -->
                <div
                  class="grid grid-cols-2 border-b border-slate-200 bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider"
                >
                  <div class="border-r border-slate-200 px-3 py-2">
                    Live Published
                  </div>
                  <div class="px-3 py-2 text-admin-primary">
                    Staged Draft
                  </div>
                </div>

                <!-- Split Lines Table -->
                <div class="max-h-[55vh] overflow-y-auto">
                  <table class="w-full border-collapse">
                    <tbody>
                      <tr
                        v-for="(pair, idx) in splitLinePairs"
                        :key="idx"
                        class="border-b border-slate-100 last:border-b-0"
                      >
                        <!-- Left: Live Line -->
                        <td
                          class="w-1/2 align-top border-r border-slate-200"
                          :class="[
                            pair.oldLine
                              ? pair.oldLine.type === 'removed'
                                ? 'bg-rose-50/80 text-rose-950 font-medium'
                                : 'text-slate-700 hover:bg-slate-50/60'
                              : 'bg-slate-50/50',
                          ]"
                        >
                          <div v-if="pair.oldLine" class="flex items-start">
                            <span
                              class="w-10 shrink-0 select-none border-r border-slate-200 px-2 py-1 text-right text-[11px] text-slate-400"
                            >
                              {{ pair.oldLine.num }}
                            </span>
                            <span
                              class="w-5 shrink-0 select-none py-1 text-center font-bold"
                              :class="
                                pair.oldLine.type === 'removed'
                                  ? 'text-rose-600'
                                  : 'text-slate-300'
                              "
                            >
                              {{ pair.oldLine.type === 'removed' ? '-' : ' ' }}
                            </span>
                            <span
                              :class="[
                                'flex-1 px-2 py-1 whitespace-pre-wrap break-all',
                                pair.oldLine.type === 'removed' ? 'line-through' : '',
                              ]"
                            >
                              {{ pair.oldLine.line || '\u00A0' }}
                            </span>
                          </div>
                          <div v-else class="h-6" />
                        </td>

                        <!-- Right: Draft Line -->
                        <td
                          class="w-1/2 align-top"
                          :class="[
                            pair.newLine
                              ? pair.newLine.type === 'added'
                                ? 'bg-emerald-50/80 text-emerald-950 font-medium'
                                : 'text-slate-700 hover:bg-slate-50/60'
                              : 'bg-slate-50/50',
                          ]"
                        >
                          <div v-if="pair.newLine" class="flex items-start">
                            <span
                              class="w-10 shrink-0 select-none border-r border-slate-200 px-2 py-1 text-right text-[11px] text-slate-400"
                            >
                              {{ pair.newLine.num }}
                            </span>
                            <span
                              class="w-5 shrink-0 select-none py-1 text-center font-bold"
                              :class="
                                pair.newLine.type === 'added'
                                  ? 'text-emerald-600'
                                  : 'text-slate-300'
                              "
                            >
                              {{ pair.newLine.type === 'added' ? '+' : ' ' }}
                            </span>
                            <span class="flex-1 px-2 py-1 whitespace-pre-wrap break-all">
                              {{ pair.newLine.line || '\u00A0' }}
                            </span>
                          </div>
                          <div v-else class="h-6" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Unified Mode Text Diff -->
              <div
                v-else
                class="overflow-hidden rounded-lg border border-slate-200 bg-white font-mono text-xs shadow-xs"
              >
                <div class="max-h-[55vh] overflow-y-auto">
                  <table class="w-full border-collapse">
                    <thead>
                      <tr
                        class="border-b border-slate-200 bg-slate-100 text-slate-600 text-[11px]"
                      >
                        <th class="w-12 px-2 py-1.5 text-right font-medium">Live</th>
                        <th class="w-12 px-2 py-1.5 text-right font-medium">Draft</th>
                        <th class="w-6 px-1 py-1.5 text-center font-medium"></th>
                        <th class="px-3 py-1.5 text-left font-medium">Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, idx) in unifiedLines"
                        :key="idx"
                        :class="[
                          row.type === 'added'
                            ? 'bg-emerald-50/80 text-emerald-950 font-medium'
                            : row.type === 'removed'
                              ? 'bg-rose-50/80 text-rose-950'
                              : 'text-slate-700 hover:bg-slate-50/70',
                          'border-b border-slate-100 last:border-b-0',
                        ]"
                      >
                        <td class="w-12 select-none px-2 py-1 text-right text-slate-400 border-r border-slate-100">
                          {{ row.oldLineNum ?? '' }}
                        </td>
                        <td class="w-12 select-none px-2 py-1 text-right text-slate-400 border-r border-slate-100">
                          {{ row.newLineNum ?? '' }}
                        </td>
                        <td
                          class="w-6 select-none px-1 py-1 text-center font-bold"
                          :class="
                            row.type === 'added'
                              ? 'text-emerald-600'
                              : row.type === 'removed'
                                ? 'text-rose-600'
                                : 'text-slate-300'
                          "
                        >
                          {{ row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' ' }}
                        </td>
                        <td
                          :class="[
                            'px-3 py-1 whitespace-pre-wrap break-all',
                            row.type === 'removed' ? 'line-through text-rose-900' : '',
                          ]"
                        >
                          {{ row.line || '\u00A0' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Content Mode: Structured Section / JSON Diff -->
            <div v-else class="space-y-3">
              <AdminCmsDiffNode
                v-for="node in visibleStructuredNodes"
                :key="node.path"
                :node="node"
                :view-mode="viewMode"
                :depth="0"
                :show-unchanged="showUnchanged"
              />
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3"
          >
            <div class="text-xs text-slate-500">
              <span v-if="kpi.totalChanges > 0" class="font-medium text-slate-700">
                {{ kpi.totalChanges }} staged change{{ kpi.totalChanges === 1 ? '' : 's' }} ready to review
              </span>
              <span v-else>All changes synchronized</span>
            </div>

            <div class="flex items-center gap-2.5">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none"
                @click="close"
              >
                Close
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-admin-primary-hover focus:outline-none"
                @click="onPublish"
              >
                <i class="pi pi-cloud-upload text-xs" />
                <span>Publish Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  computeDeepDiff,
  computeTextLineDiff,
  type DiffNode,
  type DiffSummary,
} from '@/admin/utils/diff'
import AdminCmsDiffNode from '@/admin/components/cms/AdminCmsDiffNode.vue'

defineOptions({
  name: 'AdminCmsDiffViewer',
})

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    subtitle?: string
    publishedData: Record<string, any> | string
    draftData: Record<string, any> | string
    isPolicy?: boolean
  }>(),
  {
    title: 'Staged Changes Review',
    subtitle: '',
    isPolicy: false,
  },
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'publish'): void
}>()

const viewMode = ref<'split' | 'unified'>('split')
const showUnchanged = ref(false)
const isMobile = ref(false)

function checkMobile(): void {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) {
      viewMode.value = 'unified'
    }
  }
}

const isTextMode = computed(() => {
  return (
    props.isPolicy ||
    typeof props.publishedData === 'string' ||
    typeof props.draftData === 'string'
  )
})

// Safe JSON parser helper
function parseIfString(val: any): any {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }
  return val
}

// Structured Diff calculation
const structuredDiff = computed<DiffSummary>(() => {
  if (isTextMode.value) {
    return {
      totalChanges: 0,
      addedCount: 0,
      removedCount: 0,
      modifiedCount: 0,
      nodes: [],
    }
  }

  const oldParsed = parseIfString(props.publishedData) || {}
  const newParsed = parseIfString(props.draftData) || {}
  return computeDeepDiff(oldParsed, newParsed)
})

function hasNodeChanges(node: DiffNode): boolean {
  if (node.type !== 'unchanged') return true
  if (!node.children || node.children.length === 0) return false
  return node.children.some(hasNodeChanges)
}

const visibleStructuredNodes = computed(() => {
  if (showUnchanged.value) return structuredDiff.value.nodes
  return structuredDiff.value.nodes.filter(hasNodeChanges)
})

// Text / Policy line-by-line diff calculation
const lineDiff = computed(() => {
  if (!isTextMode.value) return []
  const oldText =
    typeof props.publishedData === 'string'
      ? props.publishedData
      : JSON.stringify(props.publishedData ?? '', null, 2)
  const newText =
    typeof props.draftData === 'string'
      ? props.draftData
      : JSON.stringify(props.draftData ?? '', null, 2)

  return computeTextLineDiff(oldText, newText)
})

interface UnifiedLine {
  oldLineNum: number | null
  newLineNum: number | null
  type: 'added' | 'removed' | 'unchanged'
  line: string
}

const unifiedLines = computed<UnifiedLine[]>(() => {
  let oldNum = 0
  let newNum = 0
  return lineDiff.value.map((item) => {
    if (item.type === 'unchanged') {
      oldNum++
      newNum++
      return { oldLineNum: oldNum, newLineNum: newNum, type: item.type, line: item.line }
    } else if (item.type === 'removed') {
      oldNum++
      return { oldLineNum: oldNum, newLineNum: null, type: item.type, line: item.line }
    } else {
      newNum++
      return { oldLineNum: null, newLineNum: newNum, type: item.type, line: item.line }
    }
  })
})

interface SplitLinePair {
  oldLine: { num: number; line: string; type: 'removed' | 'unchanged' } | null
  newLine: { num: number; line: string; type: 'added' | 'unchanged' } | null
}

const splitLinePairs = computed<SplitLinePair[]>(() => {
  const pairs: SplitLinePair[] = []
  let oldNum = 0
  let newNum = 0
  const items = lineDiff.value
  let i = 0

  while (i < items.length) {
    if (items[i].type === 'unchanged') {
      oldNum++
      newNum++
      pairs.push({
        oldLine: { num: oldNum, line: items[i].line, type: 'unchanged' },
        newLine: { num: newNum, line: items[i].line, type: 'unchanged' },
      })
      i++
    } else {
      const removedBlock: Array<{ num: number; line: string; type: 'removed' }> = []
      while (i < items.length && items[i].type === 'removed') {
        oldNum++
        removedBlock.push({ num: oldNum, line: items[i].line, type: 'removed' })
        i++
      }

      const addedBlock: Array<{ num: number; line: string; type: 'added' }> = []
      while (i < items.length && items[i].type === 'added') {
        newNum++
        addedBlock.push({ num: newNum, line: items[i].line, type: 'added' })
        i++
      }

      const maxLen = Math.max(removedBlock.length, addedBlock.length)
      for (let j = 0; j < maxLen; j++) {
        pairs.push({
          oldLine: j < removedBlock.length ? removedBlock[j] : null,
          newLine: j < addedBlock.length ? addedBlock[j] : null,
        })
      }
    }
  }

  return pairs
})

// Unified KPI summary
const kpi = computed(() => {
  if (isTextMode.value) {
    let added = 0
    let removed = 0
    for (const item of lineDiff.value) {
      if (item.type === 'added') added++
      else if (item.type === 'removed') removed++
    }
    return {
      totalChanges: added + removed,
      addedCount: added,
      removedCount: removed,
      modifiedCount: 0,
    }
  }
  return {
    totalChanges: structuredDiff.value.totalChanges,
    addedCount: structuredDiff.value.addedCount,
    removedCount: structuredDiff.value.removedCount,
    modifiedCount: structuredDiff.value.modifiedCount,
  }
})

const hasNoChanges = computed(() => kpi.value.totalChanges === 0)

function close(): void {
  emit('update:visible', false)
}

function onPublish(): void {
  emit('publish')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      checkMobile()
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.admin-dialog-enter-active,
.admin-dialog-leave-active {
  transition: opacity 200ms ease;
}

.admin-dialog-enter-active > div,
.admin-dialog-leave-active > div {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.admin-dialog-enter-from,
.admin-dialog-leave-to {
  opacity: 0;
}

.admin-dialog-enter-from > div,
.admin-dialog-leave-to > div {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>