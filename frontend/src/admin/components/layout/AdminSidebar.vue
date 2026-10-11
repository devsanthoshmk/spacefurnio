<template>
  <div>
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      aria-hidden="true"
      @click="emit('update:mobileOpen', false)"
    />
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-admin-sidebar transition-all duration-200 ease-in-out lg:static lg:translate-x-0',
        collapsed && !mobileOpen ? 'w-[72px]' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
      aria-label="Admin navigation"
    >
      <div class="flex items-center px-4 py-6">
        <span class="text-xl font-bold text-white">
          {{ collapsed && !mobileOpen ? 'SF' : 'SpaceFurnio' }}
        </span>
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto px-2">
        <div v-for="section in navSections" :key="section.label">
          <p
            v-if="!collapsed || mobileOpen"
            class="mt-4 px-4 py-2 text-xs uppercase tracking-wide text-slate-500"
          >
            {{ section.label }}
          </p>
          <router-link
            v-for="item in section.items"
            :key="item.route"
            :to="item.route"
            :title="item.label"
            :class="[
              'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-admin-sidebar-hover hover:text-white',
              collapsed && !mobileOpen ? 'justify-center' : '',
              isActive(item.route) ? 'bg-admin-sidebar-active text-white' : 'text-slate-400',
            ]"
            @click="emit('update:mobileOpen', false)"
          >
            <i :class="[item.icon, 'shrink-0 text-base']" aria-hidden="true" />
            <span v-if="!collapsed || mobileOpen" class="whitespace-nowrap text-sm font-medium">
              {{ item.label }}
            </span>
          </router-link>
        </div>
      </nav>
      <div class="hidden border-t border-slate-800 p-2 lg:block">
        <button
          type="button"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!collapsed"
          class="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-slate-400 transition-colors hover:bg-admin-sidebar-hover hover:text-white"
          @click="emit('update:collapsed', !collapsed)"
        >
          <i :class="collapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" aria-hidden="true" />
          <span v-if="!collapsed" class="text-sm font-medium">Collapse</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

interface NavItem {
  label: string
  icon: string
  route: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

withDefaults(
  defineProps<{
    collapsed?: boolean
    mobileOpen?: boolean
  }>(),
  { collapsed: false, mobileOpen: false },
)

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
  (e: 'update:mobileOpen', value: boolean): void
}>()

const route = useRoute()

const navSections: NavSection[] = [
  {
    label: 'MAIN',
    items: [{ label: 'Dashboard', icon: 'pi pi-home', route: '/admin' }],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { label: 'Products', icon: 'pi pi-box', route: '/admin/products' },
      { label: 'Orders', icon: 'pi pi-shopping-cart', route: '/admin/orders' },
      { label: 'Customers', icon: 'pi pi-users', route: '/admin/customers' },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { label: 'Coupons', icon: 'pi pi-tag', route: '/admin/coupons' },
      { label: 'Reviews', icon: 'pi pi-star', route: '/admin/reviews' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Media', icon: 'pi pi-image', route: '/admin/images' },
      { label: 'Team', icon: 'pi pi-user-plus', route: '/admin/team' },
    ],
  },
]

function isActive(itemRoute: string): boolean {
  if (itemRoute === '/admin') {
    return route.path === '/admin'
  }
  return route.path === itemRoute || route.path.startsWith(`${itemRoute}/`)
}
</script>
