<template>
  <Teleport to="body">
    <Transition name="admin-dialog">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-phone-title"
        @mousedown.self="close"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 id="edit-phone-title" class="text-lg font-semibold text-admin-text">
              Edit Phone Number
            </h3>
            <button
              type="button"
              aria-label="Close dialog"
              class="rounded-lg p-1 text-admin-text-muted hover:bg-slate-100 hover:text-slate-700"
              @click="close"
            >
              <i class="pi pi-times text-sm" aria-hidden="true" />
            </button>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="handleSave">
            <div>
              <label for="customer-phone-input" class="mb-1.5 block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="customer-phone-input"
                ref="phoneInput"
                v-model="phoneValue"
                type="tel"
                placeholder="+91 98765 43210"
                class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
              <p class="mt-1.5 text-xs text-admin-text-secondary">
                Enter a 10-digit mobile number or standard phone number with country code.
              </p>
            </div>

            <div class="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-admin-primary"
                @click="close"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="inline-flex items-center gap-1.5 rounded-lg bg-admin-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-admin-primary-hover focus:outline-none focus:ring-2 focus:ring-admin-primary disabled:opacity-50"
              >
                <i v-if="saving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true" />
                {{ saving ? 'Saving...' : 'Save Phone' }}
              </button>
            </div>
          </form>
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
    phone: string | null
    saving?: boolean
  }>(),
  { saving: false },
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save', phone: string): void
}>()

const phoneValue = ref('')
const phoneInput = ref<HTMLInputElement | null>(null)

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      phoneValue.value = props.phone || ''
      nextTick(() => {
        phoneInput.value?.focus()
      })
    }
  },
  { immediate: true },
)

function close(): void {
  emit('update:visible', false)
}

function handleSave(): void {
  emit('save', phoneValue.value.trim())
}
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