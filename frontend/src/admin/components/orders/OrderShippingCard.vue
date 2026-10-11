<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-semibold text-slate-900">Shipping Info</h3>
      <button
        v-if="editable && !editing"
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        @click="startEdit"
      >
        <i class="pi pi-pencil mr-1 text-xs" aria-hidden="true" />Edit
      </button>
    </div>

    <form v-if="editing" @submit.prevent="handleSave">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-first-name">First Name</label>
          <input id="ship-first-name" v-model="form.shipping_first_name" type="text" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-last-name">Last Name</label>
          <input id="ship-last-name" v-model="form.shipping_last_name" type="text" :class="inputClass" />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-address">Address</label>
          <input id="ship-address" v-model="form.shipping_address" type="text" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-city">City</label>
          <input id="ship-city" v-model="form.shipping_city" type="text" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-state">State</label>
          <input id="ship-state" v-model="form.shipping_state" type="text" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-pincode">Pincode</label>
          <input id="ship-pincode" v-model="form.shipping_pincode" type="text" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700" for="ship-phone">Phone</label>
          <input id="ship-phone" v-model="form.shipping_phone" type="tel" :class="inputClass" />
        </div>
      </div>
      <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
      <div class="mt-4 flex justify-end gap-3">
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          @click="cancelEdit"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </form>

    <dl v-else class="space-y-2.5 text-sm">
      <div class="flex justify-between gap-4">
        <dt class="text-slate-500">Name</dt>
        <dd class="text-right font-medium text-slate-900">{{ fullName }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-slate-500">Address</dt>
        <dd class="text-right font-medium text-slate-900">{{ shippingAddress || '-' }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-slate-500">City</dt>
        <dd class="text-right font-medium text-slate-900">{{ shippingCity || '-' }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-slate-500">State</dt>
        <dd class="text-right font-medium text-slate-900">{{ shippingState || '-' }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-slate-500">Pincode</dt>
        <dd class="text-right font-medium text-slate-900">{{ shippingPincode || '-' }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-slate-500">Phone</dt>
        <dd class="text-right font-medium text-slate-900">{{ formatPhone(shippingPhone) }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { formatPhone } from '@/admin/utils/formatters'
import type { OrderDetail } from '@/admin/types/admin'

export interface ShippingFormData {
  shipping_first_name: string
  shipping_last_name: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_pincode: string
  shipping_phone: string
}

type ShippingInfo = OrderDetail['shipping']

const props = withDefaults(
  defineProps<{
    shipping: ShippingInfo
    editable?: boolean
    saving?: boolean
  }>(),
  { editable: false, saving: false },
)

const emit = defineEmits<{
  (e: 'save', payload: ShippingFormData): void
}>()

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary'

const editing = ref(false)
const formError = ref<string | null>(null)

const form = reactive<ShippingFormData>({
  shipping_first_name: '',
  shipping_last_name: '',
  shipping_address: '',
  shipping_city: '',
  shipping_state: '',
  shipping_pincode: '',
  shipping_phone: '',
})

const firstName = computed(() => props.shipping?.shipping_first_name ?? props.shipping?.firstName ?? '')
const lastName = computed(() => props.shipping?.shipping_last_name ?? props.shipping?.lastName ?? '')
const shippingAddress = computed(() => props.shipping?.shipping_address ?? props.shipping?.address ?? '')
const shippingCity = computed(() => props.shipping?.shipping_city ?? props.shipping?.city ?? '')
const shippingState = computed(() => props.shipping?.shipping_state ?? props.shipping?.state ?? '')
const shippingPincode = computed(() => props.shipping?.shipping_pincode ?? props.shipping?.pincode ?? '')
const shippingPhone = computed(() => props.shipping?.shipping_phone ?? props.shipping?.phone ?? '')

const fullName = computed(() => {
  const name = `${firstName.value} ${lastName.value}`.trim()
  return name || '-'
})

function fillForm(source?: ShippingInfo): void {
  form.shipping_first_name = source?.shipping_first_name ?? source?.firstName ?? ''
  form.shipping_last_name = source?.shipping_last_name ?? source?.lastName ?? ''
  form.shipping_address = source?.shipping_address ?? source?.address ?? ''
  form.shipping_city = source?.shipping_city ?? source?.city ?? ''
  form.shipping_state = source?.shipping_state ?? source?.state ?? ''
  form.shipping_pincode = source?.shipping_pincode ?? source?.pincode ?? ''
  form.shipping_phone = source?.shipping_phone ?? source?.phone ?? ''
}

function startEdit(): void {
  fillForm(props.shipping)
  formError.value = null
  editing.value = true
}

function cancelEdit(): void {
  editing.value = false
  formError.value = null
}

function handleSave(): void {
  if (!form.shipping_first_name.trim() || !form.shipping_address.trim() || !form.shipping_phone.trim()) {
    formError.value = 'First name, address and phone are required.'
    return
  }
  formError.value = null
  emit('save', { ...form })
}

watch(
  () => props.shipping,
  (next) => {
    if (!editing.value) fillForm(next)
  },
)

watch(
  () => props.saving,
  (isSaving, wasSaving) => {
    if (wasSaving && !isSaving && !formError.value) editing.value = false
  },
)
</script>
