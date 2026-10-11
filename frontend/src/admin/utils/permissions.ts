import type { AdminRole, AdminPermission } from '@/admin/types/admin'

const ALL_PERMISSIONS: AdminPermission[] = [
  'orders.read', 'orders.write', 'orders.fulfill', 'orders.cancel', 'orders.refund',
  'products.read', 'products.write', 'products.delete', 'products.bulk',
  'inventory.manage', 'categories.manage',
  'customers.read', 'customers.write', 'customers.delete',
  'marketing.coupons',
  'reviews.read', 'reviews.write', 'reviews.delete',
  'media.manage',
  'analytics.view',
  'admins.manage',
  'settings.manage',
]

export const ADMIN_ROLE_PRESETS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  store_manager: [
    'orders.read', 'orders.write', 'orders.fulfill', 'orders.cancel', 'orders.refund',
    'products.read', 'products.write', 'products.delete', 'products.bulk',
    'inventory.manage', 'categories.manage',
    'customers.read', 'customers.write',
    'marketing.coupons',
    'reviews.read', 'reviews.write', 'reviews.delete',
    'media.manage',
    'analytics.view',
    'settings.manage',
  ],
  sales_fulfillment: [
    'orders.read', 'orders.write', 'orders.fulfill',
    'customers.read',
    'products.read',
    'analytics.view',
  ],
  customer_support: [
    'customers.read', 'customers.write',
    'orders.read',
    'marketing.coupons',
    'reviews.read', 'reviews.write',
  ],
  catalog_inventory: [
    'products.read', 'products.write', 'products.delete', 'products.bulk',
    'inventory.manage', 'categories.manage',
    'media.manage',
    'reviews.read',
  ],
  custom: [],
}

export function resolvePermissions(role: AdminRole, customPermissions?: AdminPermission[]): AdminPermission[] {
  if (role === 'super_admin' || role === 'admin') return ALL_PERMISSIONS
  if (role === 'custom') return customPermissions ?? []
  const preset = ADMIN_ROLE_PRESETS[role] ?? []
  if (!customPermissions?.length) return preset
  return Array.from(new Set([...preset, ...customPermissions]))
}

export function hasPermission(userPermissions: AdminPermission[], required: AdminPermission): boolean {
  const isSuper = ALL_PERMISSIONS.every((p) => userPermissions.includes(p))
  if (isSuper) return true
  return userPermissions.includes(required)
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  store_manager: 'Store Manager',
  sales_fulfillment: 'Sales & Fulfillment Lead',
  customer_support: 'Customer Support Representative',
  catalog_inventory: 'Catalog & Inventory Specialist',
  custom: 'Custom Permissions',
}
