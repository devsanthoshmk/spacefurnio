<script setup>
/**
 * AdminLayout.vue - Sidebar layout with navigation
 * Inspired by the reference design - clean, modern admin panel
 */
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// import Button from 'primevue/button';

const props = defineProps({
  patToken: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['logout']);

const router = useRouter();
const route = useRoute();

// Sidebar collapsed state
const isSidebarCollapsed = ref(false);
const isMobileMenuOpen = ref(false);

// Navigation items
const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'pi-th-large',
    route: '/admin-spacefurnio/dashboard',
    disabled: true
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'pi-box',
    route: '/admin-spacefurnio/products',
    disabled: true
  },
  {
    id: 'contents',
    label: 'Contents',
    icon: 'pi-file-edit',
    route: '/admin-spacefurnio/contents',
    disabled: false
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'pi-shopping-cart',
    route: '/admin-spacefurnio/orders',
    disabled: true
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: 'pi-star',
    route: '/admin-spacefurnio/reviews',
    disabled: true
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'pi-chart-line',
    route: '/admin-spacefurnio/analytics',
    disabled: true
  }
];

const bottomNavItems = [
  {
    id: 'settings',
    label: 'Settings',
    icon: 'pi-cog',
    route: '/admin-spacefurnio/settings',
    disabled: true
  }
];

// Check if nav item is active
function isActive(item) {
  return route.path === item.route || route.path.startsWith(item.route + '/');
}

// Navigate to route
function navigateTo(item) {
  if (!item.disabled) {
    router.push(item.route);
    isMobileMenuOpen.value = false;
  }
}

// Toggle sidebar
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

// Toggle mobile menu
function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

// Logout
function handleLogout() {
  emit('logout');
}
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-toggle" @click="toggleMobileMenu">
        <i class="pi" :class="isMobileMenuOpen ? 'pi-times' : 'pi-bars'"></i>
      </button>
      <div class="mobile-brand">
        <span class="brand-text">Spacefurnio Admin</span>
      </div>
      <button class="logout-btn-mobile" @click="handleLogout">
        <i class="pi pi-sign-out"></i>
      </button>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <i class="pi pi-building"></i>
        </div>
        <span v-if="!isSidebarCollapsed" class="brand-name">Spacefurnio</span>
      </div>

      <!-- Search -->
      <div v-if="!isSidebarCollapsed" class="sidebar-search">
        <i class="pi pi-search"></i>
        <input type="text" placeholder="Search..." disabled />
        <span class="search-shortcut">⌘K</span>
      </div>

      <!-- Main Navigation -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li
            v-for="item in navItems"
            :key="item.id"
            class="nav-item"
            :class="{
              active: isActive(item),
              disabled: item.disabled,
              collapsed: isSidebarCollapsed
            }"
            @click="navigateTo(item)"
          >
            <i class="pi" :class="item.icon"></i>
            <span v-if="!isSidebarCollapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="item.disabled && !isSidebarCollapsed" class="coming-soon-badge">Soon</span>
          </li>
        </ul>

        <!-- Divider -->
        <div class="nav-divider"></div>

        <!-- Bottom Navigation -->
        <ul class="nav-list nav-bottom">
          <li
            v-for="item in bottomNavItems"
            :key="item.id"
            class="nav-item"
            :class="{
              active: isActive(item),
              disabled: item.disabled,
              collapsed: isSidebarCollapsed
            }"
            @click="navigateTo(item)"
          >
            <i class="pi" :class="item.icon"></i>
            <span v-if="!isSidebarCollapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="item.disabled && !isSidebarCollapsed" class="coming-soon-badge">Soon</span>
          </li>

          <!-- Logout -->
          <li class="nav-item logout-item" :class="{ collapsed: isSidebarCollapsed }" @click="handleLogout">
            <i class="pi pi-sign-out"></i>
            <span v-if="!isSidebarCollapsed" class="nav-label">Logout</span>
          </li>
        </ul>
      </nav>

      <!-- Collapse Toggle -->
      <button class="collapse-toggle" @click="toggleSidebar">
        <i class="pi" :class="isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'"></i>
      </button>
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="mobile-overlay"
      @click="toggleMobileMenu"
    ></div>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-left">
          <h1 class="page-title">{{ route.meta?.title || 'Admin Panel' }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <div class="user-avatar">
              <i class="pi pi-user"></i>
            </div>
            <span class="user-name">Admin</span>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="content-area">
        <router-view :pat-token="props.patToken" />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Layout Base */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.3s ease;
}

.sidebar-collapsed .sidebar {
  width: 80px;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-icon i {
  font-size: 1.25rem;
  color: white;
}

.brand-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

/* Search */
.sidebar-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.sidebar-search:focus-within {
  border-color: #f97316;
  background: white;
}

.sidebar-search i {
  color: #94a3b8;
  font-size: 0.875rem;
}

.sidebar-search input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #475569;
  outline: none;
}

.sidebar-search input::placeholder {
  color: #94a3b8;
}

.search-shortcut {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
  background: #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-weight: 500;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin: 0.25rem 0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  position: relative;
}

.nav-item.collapsed {
  justify-content: center;
  padding: 0.875rem;
}

.nav-item i {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.nav-item:hover:not(.disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
  color: #ea580c;
}

.nav-item.active i {
  color: #ea580c;
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.coming-soon-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  background: #e2e8f0;
  border-radius: 20px;
  color: #64748b;
  margin-left: auto;
}

.nav-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1rem 0;
}

.nav-bottom {
  margin-top: auto;
}

.logout-item {
  color: #ef4444;
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
}

/* Collapse Toggle */
.collapse-toggle {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.collapse-toggle:hover {
  background: #f97316;
  border-color: #f97316;
  color: white;
}

.collapse-toggle i {
  font-size: 0.75rem;
  color: #64748b;
}

.collapse-toggle:hover i {
  color: white;
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1rem;
  align-items: center;
  justify-content: space-between;
  z-index: 90;
}

.menu-toggle,
.logout-btn-mobile {
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.menu-toggle i,
.logout-btn-mobile i {
  font-size: 1.125rem;
  color: #475569;
}

.mobile-brand {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  color: #1e293b;
}

.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  transition: margin-left 0.3s ease;
}

.sidebar-collapsed .main-content {
  margin-left: 80px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar i {
  color: white;
  font-size: 1rem;
}

.user-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

/* Content Area */
.content-area {
  padding: 2rem;
  min-height: calc(100vh - 81px);
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  .main-content {
    margin-left: 0;
    padding-top: 60px;
  }

  .sidebar-collapsed .main-content {
    margin-left: 0;
  }

  .collapse-toggle {
    display: none;
  }

  .page-header {
    display: none;
  }

  .content-area {
    padding: 1rem;
    min-height: calc(100vh - 60px);
  }
}
</style>
