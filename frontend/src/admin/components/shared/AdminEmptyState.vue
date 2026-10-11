<template>
  <div class="flex flex-col items-center py-16 text-center">
    <i :class="[icon, 'text-5xl text-admin-text-muted']" aria-hidden="true" />
    <h3 class="mt-4 text-lg font-medium text-admin-text">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-sm text-sm text-admin-text-secondary">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
  }>(),
  { description: undefined, icon: 'pi pi-inbox' },
)
</script>
