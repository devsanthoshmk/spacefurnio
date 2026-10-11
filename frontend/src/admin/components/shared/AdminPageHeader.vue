<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <nav v-if="breadcrumbs.length > 0" aria-label="Breadcrumb" class="mb-1">
        <ol class="flex flex-wrap items-center gap-1 text-sm text-admin-text-secondary">
          <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center gap-1">
            <span v-if="index > 0" class="text-admin-text-muted" aria-hidden="true">&gt;</span>
            <router-link
              v-if="crumb.to && index < breadcrumbs.length - 1"
              :to="crumb.to"
              class="transition-colors hover:text-admin-primary"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
              {{ crumb.label }}
            </span>
          </li>
        </ol>
      </nav>
      <h1 class="text-2xl font-semibold text-admin-text">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Breadcrumb {
  label: string
  to?: string
}

withDefaults(
  defineProps<{
    title: string
    breadcrumbs?: Breadcrumb[]
  }>(),
  { breadcrumbs: () => [] },
)
</script>
