<template>
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <slot />
    <div v-if="$slots.right" class="ml-auto flex flex-wrap items-center gap-3">
      <slot name="right" />
    </div>
  </div>
</template>
