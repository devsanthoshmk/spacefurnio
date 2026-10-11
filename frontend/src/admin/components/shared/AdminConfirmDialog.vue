<template>
  <Teleport to="body">
    <Transition name="admin-dialog">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @mousedown.self="close"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 class="text-lg font-semibold text-admin-text">{{ title }}</h3>
          <p class="mt-2 text-sm text-admin-text-secondary">{{ message }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              ref="cancelButton"
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-admin-primary focus:outline-none"
              @click="close"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              :class="[
                'rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors focus:ring-2 focus:outline-none',
                danger
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-admin-primary hover:bg-admin-primary-hover focus:ring-admin-primary',
              ]"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', value: boolean): void
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)

function close(): void {
  emit('update:visible', false)
  emit('cancel')
}

function handleConfirm(): void {
  emit('confirm')
  emit('update:visible', false)
}

function onEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      document.addEventListener('keydown', onEscape)
      nextTick(() => cancelButton.value?.focus())
    } else {
      document.removeEventListener('keydown', onEscape)
    }
  },
)
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
  transform: translateY(12px);
}
</style>
