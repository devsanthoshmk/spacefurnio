<template>
  <div class="space-y-6" aria-label="Loading dashboard">
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="n in 4" :key="n" class="h-36 animate-pulse rounded-xl bg-slate-200" />
    </div>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="h-80 animate-pulse rounded-xl bg-slate-200 lg:col-span-2" />
      <div class="h-80 animate-pulse rounded-xl bg-slate-200" />
    </div>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="h-72 animate-pulse rounded-xl bg-slate-200" />
      <div class="h-72 animate-pulse rounded-xl bg-slate-200" />
    </div>
  </div>
</template>
