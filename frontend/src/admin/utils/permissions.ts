import type { AdminRole, AdminPermission } from '@/admin/types/admin'

export const ALL_PERMISSIONS: AdminPermission[] = [
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
  'cms.read', 'cms.write', 'cms.publish',
]

export const PERMISSION_DESCRIPTIONS: Record<AdminPermission, string> = {
  'orders.read': 'View customer orders, details, status history and receipts',
  'orders.write': 'Update order status and customer shipping details',
  'orders.fulfill': 'Manage shipments, carrier assignments, and tracking info',
  'orders.cancel': 'Cancel pending or processing orders',
  'orders.refund': 'Issue order refunds and manage return requests',
  'products.read': 'View full catalog products, taxonomy, and pricing',
  'products.write': 'Create and update products, images, and color variants',
  'products.delete': 'Delete or archive catalog products',
  'products.bulk': 'Perform bulk operations on catalog products',
  'inventory.manage': 'Monitor stock levels and out of stock warnings',
  'categories.manage': 'Manage categories, spaces, styles, rooms, and materials',
  'customers.read': 'View customer directory, spending metrics, and order history',
  'customers.write': 'Edit customer accounts and toggle active/disabled status',
  'customers.delete': 'Delete or permanently purge customer data',
  'marketing.coupons': 'Create, edit, toggle, and delete coupon codes',
  'reviews.read': 'View customer ratings and product reviews',
  'reviews.write': 'Create, edit, and moderate reviews',
  'reviews.delete': 'Delete spam or inappropriate reviews',
  'media.manage': 'Upload, manage, link, and audit product images and assets',
  'analytics.view': 'View sales dashboard KPIs, revenue trends, and operational summaries',
  'admins.manage': 'Invite admin team members, assign roles, and configure permissions',
  'settings.manage': 'Configure store settings and operational policies',
  'cms.read': 'View CMS pages, sections, policies, and version history',
  'cms.write': 'Create, edit, and manage draft CMS pages, sections, and policies',
  'cms.publish': 'Publish CMS content live and trigger site rebuilds',
}

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
    'cms.read', 'cms.write', 'cms.publish',
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
    'cms.read',
  ],
  catalog_inventory: [
    'products.read', 'products.write', 'products.delete', 'products.bulk',
    'inventory.manage', 'categories.manage',
    'media.manage',
    'reviews.read',
    'cms.read', 'cms.write',
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
