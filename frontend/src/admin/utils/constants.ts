import type { OrderStatus, PaymentStatus } from '@/admin/types/admin'

export const TOKEN_KEY = 'spacefurnio_token'
export const ADMIN_SIDEBAR_KEY = 'admin_sidebar_collapsed'

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700',  bgColor: 'bg-amber-50' },
  paid:       { label: 'Paid',       color: 'text-blue-700',   bgColor: 'bg-blue-50' },
  processing: { label: 'Processing', color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  shipped:    { label: 'Shipped',    color: 'text-purple-700', bgColor: 'bg-purple-50' },
  delivered:  { label: 'Delivered',  color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  cancelled:  { label: 'Cancelled',  color: 'text-rose-700',   bgColor: 'bg-rose-50' },
  refunded:   { label: 'Refunded',   color: 'text-slate-700',  bgColor: 'bg-slate-100' },
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  pending:             { label: 'Pending',              color: 'text-amber-700',  bgColor: 'bg-amber-50' },
  completed:           { label: 'Completed',            color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  refunded:            { label: 'Refunded',             color: 'text-slate-700',  bgColor: 'bg-slate-100' },
  partially_refunded:  { label: 'Partially Refunded',   color: 'text-orange-700', bgColor: 'bg-orange-50' },
  failed:              { label: 'Failed',               color: 'text-rose-700',   bgColor: 'bg-rose-50' },
}

export interface NavItem {
  label: string
  icon: string
  route: string
  permission?: string
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-chart-line',  route: '/admin/dashboard' },
  { label: 'Products',  icon: 'pi pi-box',         route: '/admin/products',  permission: 'products.read' },
  { label: 'Orders',    icon: 'pi pi-shopping-bag', route: '/admin/orders',   permission: 'orders.read' },
  { label: 'Customers', icon: 'pi pi-users',        route: '/admin/customers', permission: 'customers.read' },
  { label: 'Coupons',   icon: 'pi pi-ticket',       route: '/admin/coupons',  permission: 'marketing.coupons' },
  { label: 'Reviews',   icon: 'pi pi-star',         route: '/admin/reviews',  permission: 'reviews.read' },
  { label: 'Media',     icon: 'pi pi-images',       route: '/admin/media',    permission: 'media.manage' },
  { label: 'Team',      icon: 'pi pi-shield',       route: '/admin/team',     permission: 'admins.manage' },
]
