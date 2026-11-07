<template>
  <div class="cms-diff-node">
    <!-- Container Node (has children) -->
    <div
      v-if="node.children && node.children.length > 0"
      class="rounded-lg border border-slate-200 bg-white p-3 shadow-xs"
    >
      <!-- Section Header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
            :aria-label="isExpanded ? 'Collapse section' : 'Expand section'"
            @click="isExpanded = !isExpanded"
          >
            <i
              :class="[
                'pi text-xs transition-transform duration-150',
                isExpanded ? 'pi-chevron-down' : 'pi-chevron-right',
              ]"
            />
          </button>
          <span class="text-sm font-semibold text-slate-800">{{ node.label }}</span>
          <span v-if="node.path" class="font-mono text-xs text-slate-400">
            {{ node.path }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span
            v-if="badgeInfo"
            :class="[
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              badgeInfo.classes,
            ]"
          >
            <i :class="['text-[10px]', badgeInfo.icon]" />
            {{ badgeInfo.label }}
          </span>
          <span
            v-if="childChangesCount > 0"
            class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {{ childChangesCount }} change{{ childChangesCount === 1 ? '' : 's' }}
          </span>
        </div>
      </div>

      <!-- Child Nodes -->
      <div
        v-if="isExpanded"
        class="mt-3 space-y-2.5 border-l-2 border-slate-100 pl-3 sm:ml-3 sm:pl-4"
      >
        <AdminCmsDiffNode
          v-for="child in visibleChildren"
          :key="child.path"
          :node="child"
          :view-mode="viewMode"
          :depth="depth + 1"
          :show-unchanged="showUnchanged"
        />
        <div
          v-if="visibleChildren.length === 0"
          class="py-2 text-xs italic text-slate-400"
        >
          No changed properties inside.
        </div>
      </div>
    </div>

    <!-- Leaf Node: Unified Mode -->
    <div
      v-else-if="viewMode === 'unified'"
      :class="[
        'rounded-lg border p-3 text-xs sm:text-sm transition-colors',
        node.type === 'added'
          ? 'border-emerald-200 bg-emerald-50/60'
          : node.type === 'removed'
            ? 'border-rose-200 bg-rose-50/60'
            : node.type === 'modified'
              ? 'border-blue-200 bg-blue-50/40'
              : 'border-slate-200 bg-slate-50/40',
      ]"
    >
      <div class="flex flex-wrap items-center justify-between gap-1.5 pb-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-slate-900">{{ node.label }}</span>
          <span v-if="node.path" class="font-mono text-xs text-slate-400">
            {{ node.path }}
          </span>
        </div>
        <span
          v-if="badgeInfo"
          :class="[
            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold',
            badgeInfo.classes,
          ]"
        >
          <i :class="['text-[10px]', badgeInfo.icon]" />
          {{ badgeInfo.label }}
        </span>
      </div>

      <!-- Added Value -->
      <div v-if="node.type === 'added'" class="mt-1.5">
        <div
          class="break-words whitespace-pre-wrap rounded border border-emerald-200 bg-white/90 p-2 font-mono text-xs text-emerald-950"
        >
          {{ formatDiffValue(node.newValue) }}
        </div>
      </div>

      <!-- Removed Value -->
      <div v-else-if="node.type === 'removed'" class="mt-1.5">
        <div
          class="break-words whitespace-pre-wrap rounded border border-rose-200 bg-white/90 p-2 font-mono text-xs text-rose-950 line-through"
        >
          {{ formatDiffValue(node.oldValue) }}
        </div>
      </div>

      <!-- Modified Value -->
      <div v-else-if="node.type === 'modified'" class="mt-1.5">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            class="flex-1 break-words whitespace-pre-wrap rounded border border-rose-200 bg-rose-50/90 p-2 font-mono text-xs text-rose-900 line-through"
          >
            {{ formatDiffValue(node.oldValue) }}
          </div>
          <div class="flex items-center justify-center text-blue-500">
            <i class="pi pi-arrow-right hidden sm:inline" />
            <i class="pi pi-arrow-down sm:hidden" />
          </div>
          <div
            class="flex-1 break-words whitespace-pre-wrap rounded border border-emerald-200 bg-emerald-50/90 p-2 font-mono text-xs text-emerald-900"
          >
            {{ formatDiffValue(node.newValue) }}
          </div>
        </div>
      </div>

      <!-- Unchanged Value -->
      <div v-else class="mt-1">
        <span class="break-words font-mono text-xs text-slate-600">
          {{ formatDiffValue(node.newValue) }}
        </span>
      </div>
    </div>

    <!-- Leaf Node: Split Mode -->
    <div
      v-else
      class="rounded-lg border border-slate-200 bg-white p-3 shadow-xs"
    >
      <!-- Row Header -->
      <div class="mb-2 flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-slate-900 text-sm">{{ node.label }}</span>
          <span v-if="node.path" class="font-mono text-xs text-slate-400">
            {{ node.path }}
          </span>
        </div>
        <span
          v-if="badgeInfo"
          :class="[
            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold',
            badgeInfo.classes,
          ]"
        >
          <i :class="['text-[10px]', badgeInfo.icon]" />
          {{ badgeInfo.label }}
        </span>
      </div>

      <!-- Side-by-Side Split Columns -->
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <!-- Left: Live Published -->
        <div>
          <div class="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Live Published
          </div>
          <div
            v-if="node.type === 'added'"
            class="flex min-h-[42px] items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50 p-2 text-xs italic text-slate-400"
          >
            Not present in published
          </div>
          <div
            v-else-if="node.type === 'removed'"
            class="break-words whitespace-pre-wrap rounded border border-rose-200 bg-rose-50/80 p-2 font-mono text-xs text-rose-900 line-through"
          >
            {{ formatDiffValue(node.oldValue) }}
          </div>
          <div
            v-else-if="node.type === 'modified'"
            class="break-words whitespace-pre-wrap rounded border border-rose-200 bg-rose-50/60 p-2 font-mono text-xs text-rose-900"
          >
            {{ formatDiffValue(node.oldValue) }}
          </div>
          <div
            v-else
            class="break-words whitespace-pre-wrap rounded border border-slate-200 bg-slate-50/80 p-2 font-mono text-xs text-slate-600"
          >
            {{ formatDiffValue(node.oldValue) }}
          </div>
        </div>

        <!-- Right: Staged Draft -->
        <div>
          <div class="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Staged Draft
          </div>
          <div
            v-if="node.type === 'added'"
            class="break-words whitespace-pre-wrap rounded border border-emerald-200 bg-emerald-50/80 p-2 font-mono text-xs text-emerald-950 font-medium"
          >
            {{ formatDiffValue(node.newValue) }}
          </div>
          <div
            v-else-if="node.type === 'removed'"
            class="flex min-h-[42px] items-center justify-center rounded border border-dashed border-rose-200 bg-rose-50/40 p-2 text-xs italic text-rose-400"
          >
            Removed in draft
          </div>
          <div
            v-else-if="node.type === 'modified'"
            class="break-words whitespace-pre-wrap rounded border border-emerald-200 bg-emerald-50/80 p-2 font-mono text-xs text-emerald-950 font-medium"
          >
            {{ formatDiffValue(node.newValue) }}
          </div>
          <div
            v-else
            class="break-words whitespace-pre-wrap rounded border border-slate-200 bg-slate-50/80 p-2 font-mono text-xs text-slate-600"
          >
            {{ formatDiffValue(node.newValue) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDiffValue, type DiffNode } from '@/admin/utils/diff'

defineOptions({
  name: 'AdminCmsDiffNode',
})

const props = withDefaults(
  defineProps<{
    node: DiffNode
    viewMode?: 'split' | 'unified'
    depth?: number
    showUnchanged?: boolean
  }>(),
  {
    viewMode: 'split',
    depth: 0,
    showUnchanged: false,
  },
)

const isExpanded = ref(props.depth < 2 || props.node.type !== 'unchanged')

function hasChanges(n: DiffNode): boolean {
  if (n.type !== 'unchanged') return true
  if (!n.children || n.children.length === 0) return false
  return n.children.some(hasChanges)
}

function countTotalChanges(n: DiffNode): number {
  let count = n.type !== 'unchanged' ? 1 : 0
  if (n.children) {
    for (const child of n.children) {
      count += countTotalChanges(child)
    }
  }
  return count
}

const childChangesCount = computed(() => {
  if (!props.node.children) return 0
  let count = 0
  for (const child of props.node.children) {
    count += countTotalChanges(child)
  }
  return count
})

const visibleChildren = computed(() => {
  if (!props.node.children) return []
  if (props.showUnchanged) return props.node.children
  return props.node.children.filter(hasChanges)
})

const badgeInfo = computed(() => {
  switch (props.node.type) {
    case 'added':
      return {
        label: 'Added',
        icon: 'pi-plus',
        classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      }
    case 'removed':
      return {
        label: 'Removed',
        icon: 'pi-minus',
        classes: 'bg-rose-100 text-rose-800 border border-rose-200',
      }
    case 'modified':
      return {
        label: 'Modified',
        icon: 'pi-sync',
        classes: 'bg-blue-100 text-blue-800 border border-blue-200',
      }
    case 'unchanged':
      return props.showUnchanged
        ? {
            label: 'Unchanged',
            icon: 'pi-check',
            classes: 'bg-slate-100 text-slate-600 border border-slate-200',
          }
        : null
    default:
      return null
  }
})
</script>

<style scoped>
.cms-diff-node {
  width: 100%;
}
</style>