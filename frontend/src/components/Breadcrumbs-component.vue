<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li v-for="(item, index) in items" :key="index">
        <div class="flex items-center">
          <!-- Separator (not for the first item) -->
          <svg
            v-if="index > 0"
            class="h-5 w-5 flex-shrink-0 text-gray-300"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
          </svg>

          <!-- Link or Text -->
          <router-link
            v-if="item.route"
            :to="item.route"
            :class="[
              index > 0 ? 'ml-2' : '',
              'text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center'
            ]"
          >
            <!-- Optional Icon for the first item (Home) if needed, or just text -->
            <template v-if="index === 0 && $slots.icon">
              <slot name="icon"></slot>
            </template>
            <template v-else-if="index === 0 && item.name === 'Home'">
              <svg
                class="h-5 w-5 flex-shrink-0 text-gray-400 hover:text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117.414 11H16v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5H2.586a1 1 0 01-.707-1.707l7-7z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="sr-only">Home</span>
            </template>
            <span v-else>{{ item.name }}</span>
          </router-link>

          <span
            v-else
            :class="[
              index > 0 ? 'ml-2' : '',
              'text-sm font-medium text-gray-900'
            ]"
            aria-current="page"
          >
            {{ item.name }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    // Expected format: [{ name: 'Home', route: '/' }, { name: 'Shop', route: '/shop' }, { name: 'Current Page' }]
  }
})
</script>
