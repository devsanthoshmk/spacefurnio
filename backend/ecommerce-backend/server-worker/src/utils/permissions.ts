export const ADMIN_PERMISSIONS = {
  // Orders & Sales
  'orders.read': 'View customer orders, details, status history and receipts',
  'orders.write': 'Update order status and customer shipping details',
  'orders.fulfill': 'Manage shipments, carrier assignments, and tracking info',
  'orders.cancel': 'Cancel pending or processing orders',
  'orders.refund': 'Issue order refunds and manage return requests',

  // Catalog & Inventory
  'products.read': 'View full catalog products, taxonomy, and pricing',
  'products.write': 'Create and update products, images, and color variants',
  'products.delete': 'Delete or archive catalog products',
  'products.bulk': 'Perform bulk operations on catalog products',
  'inventory.manage': 'Monitor stock levels and out of stock warnings',
  'categories.manage': 'Manage categories, spaces, styles, rooms, and materials',

  // Customers
  'customers.read': 'View customer directory, spending metrics, and order history',
  'customers.write': 'Edit customer accounts and toggle active/disabled status',
  'customers.delete': 'Delete or permanently purge customer data',

  // Marketing & Promotions
  'marketing.coupons': 'Create, edit, toggle, and delete coupon codes',

  // Reviews & Feedback
  'reviews.read': 'View customer ratings and product reviews',
  'reviews.write': 'Create, edit, and moderate reviews',
  'reviews.delete': 'Delete spam or inappropriate reviews',

  // Media & Assets
  'media.manage': 'Upload, manage, link, and audit product images and assets',

  // Analytics & Reporting
  'analytics.view': 'View sales dashboard KPIs, revenue trends, and operational summaries',

  // Team & Administration
  'admins.manage': 'Invite admin team members, assign roles, and configure permissions',
  'settings.manage': 'Configure store settings and operational policies',
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS;

export interface RolePreset {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  permissions: AdminPermission[];
}

export const ADMIN_ROLE_PRESETS: Record<string, RolePreset> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Unrestricted full access across all store operations, financials, staff, and settings.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    permissions: Object.keys(ADMIN_PERMISSIONS) as AdminPermission[],
  },
  store_manager: {
    id: 'store_manager',
    name: 'Store Manager',
    description: 'Full management of catalog, orders, customers, reviews, and promotions without staff administration.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    permissions: [
      'orders.read',
      'orders.write',
      'orders.fulfill',
      'orders.cancel',
      'orders.refund',
      'products.read',
      'products.write',
      'products.delete',
      'products.bulk',
      'inventory.manage',
      'categories.manage',
      'customers.read',
      'customers.write',
      'marketing.coupons',
      'reviews.read',
      'reviews.write',
      'reviews.delete',
      'media.manage',
      'analytics.view',
      'settings.manage',
    ],
  },
  sales_fulfillment: {
    id: 'sales_fulfillment',
    name: 'Sales & Fulfillment Lead',
    description: 'Manage incoming orders, customer receipts, shipments, carriers, and order status updates.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    permissions: [
      'orders.read',
      'orders.write',
      'orders.fulfill',
      'customers.read',
      'products.read',
      'analytics.view',
    ],
  },
  customer_support: {
    id: 'customer_support',
    name: 'Customer Support Representative',
    description: 'Assist customers, view customer and order histories, manage reviews, and issue support coupons.',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    permissions: [
      'customers.read',
      'customers.write',
      'orders.read',
      'marketing.coupons',
      'reviews.read',
      'reviews.write',
    ],
  },
  catalog_inventory: {
    id: 'catalog_inventory',
    name: 'Catalog & Inventory Specialist',
    description: 'Maintain furniture products, pricing, stock levels, materials, styles, and product media.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    permissions: [
      'products.read',
      'products.write',
      'products.delete',
      'products.bulk',
      'inventory.manage',
      'categories.manage',
      'media.manage',
      'reviews.read',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Permissions',
    description: 'Granular permissions assigned individually to the user.',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    permissions: [],
  },
};

export function isSuperAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = String(role).toLowerCase().trim();
  return (
    normalized === 'super_admin' ||
    normalized === 'superadmin' ||
    normalized === 'admin'
  );
}

export function resolvePermissions(role?: string | null, customPermissions: string[] = []): string[] {
  if (!role) return customPermissions || [];
  const normalizedRole = role.toLowerCase().trim();

  if (isSuperAdminRole(normalizedRole)) {
    return Object.keys(ADMIN_PERMISSIONS);
  }

  const preset = ADMIN_ROLE_PRESETS[normalizedRole];
  if (preset && preset.id !== 'custom') {
    const combined = new Set([...preset.permissions, ...(customPermissions || [])]);
    return Array.from(combined);
  }

  return customPermissions || [];
}

export function hasPermission(adminPermissions: string[] = [], ...requiredPermissions: AdminPermission[]): boolean {
  const perms = adminPermissions || [];
  const allPermissions = Object.keys(ADMIN_PERMISSIONS) as AdminPermission[];
  const isSuper = allPermissions.every((p) => perms.includes(p));
  if (isSuper) {
    return true;
  }
  return requiredPermissions.every((perm) => perms.includes(perm));
}

export interface AdminUserRecord {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export function canModifyAdmin(
  actor: AdminUserRecord,
  target: AdminUserRecord,
  newRole?: string,
  newIsActive?: boolean,
  totalActiveSuperAdmins: number = 1
): { allowed: boolean; reason?: string } {
  // Self modification checks
  if (actor.id === target.id) {
    if (newIsActive === false) {
      return { allowed: false, reason: 'You cannot deactivate your own admin account.' };
    }
    if (isSuperAdminRole(actor.role) && newRole && !isSuperAdminRole(newRole)) {
      return { allowed: false, reason: 'You cannot demote your own Super Admin role.' };
    }
  }

  // Non-super-admins cannot modify super-admins
  if (!isSuperAdminRole(actor.role) && isSuperAdminRole(target.role)) {
    return { allowed: false, reason: 'Only Super Admins can modify Super Admin accounts.' };
  }

  // Last super admin protection
  if (isSuperAdminRole(target.role)) {
    const isDemoting = Boolean(newRole && !isSuperAdminRole(newRole));
    const isDeactivating = newIsActive === false;

    if ((isDemoting || isDeactivating) && totalActiveSuperAdmins <= 1) {
      return {
        allowed: false,
        reason: 'Cannot demote or deactivate the last remaining Super Admin.',
      };
    }
  }

  return { allowed: true };
}
