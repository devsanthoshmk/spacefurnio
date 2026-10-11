// Admin TypeScript interfaces — single source of truth for all admin frontend code

// ─── Auth & Users ────────────────────────────────────────────────────────────

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'store_manager'
  | 'sales_fulfillment'
  | 'customer_support'
  | 'catalog_inventory'
  | 'custom'

export type AdminPermission =
  | 'orders.read' | 'orders.write' | 'orders.fulfill' | 'orders.cancel' | 'orders.refund'
  | 'products.read' | 'products.write' | 'products.delete' | 'products.bulk'
  | 'inventory.manage' | 'categories.manage'
  | 'customers.read' | 'customers.write' | 'customers.delete'
  | 'marketing.coupons'
  | 'reviews.read' | 'reviews.write' | 'reviews.delete'
  | 'media.manage'
  | 'analytics.view'
  | 'admins.manage'
  | 'settings.manage'

export interface AdminUser {
  id: string
  email: string
  name: string
  phone_number?: string | null
  role: AdminRole
  is_active: boolean
  permissions: AdminPermission[]
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  user: { id: string; email: string; name: string }
  token: string
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next_page: boolean
  has_prev_page: boolean
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface KpiMetric {
  value: number
  previous_value: number
  delta_pct: number
  is_positive: boolean
  sparkline: number[]
}

export interface OrdersKpi extends KpiMetric {
  completed: number
  pending: number
  cancelled: number
}

export interface CustomersKpi extends KpiMetric {
  total_registered: number
}

export interface TrendPoint {
  date: string
  label: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: number
  name: string
  slug: string
  image: string | null
  units_sold: number
  orders_count: number
  revenue: number
}

export interface RecentOrder {
  id: string
  status: string
  total_amount: number
  customer_email: string
  customer_name: string
  city: string | null
  phone: string | null
  payment_method: string | null
  payment_status: string | null
  shipment_status: string | null
  tracking_number: string | null
  carrier: string | null
  items_count: number
  created_at: string
}

export interface CatalogStats {
  total_products: number
  active_products: number
  inventory_value: number
  out_of_stock: unknown[]
  low_stock: unknown[]
}

export interface OperationsQueue {
  awaiting_fulfillment: number
  active_carts: number
  total_reviews: number
  store_rating: number
}

export interface TopCoupon {
  id: string
  code: string
  uses: number
  total_discount: number
}

export interface CustomerAcquisition {
  new_customers: number
  returning_customers: number
  guest_orders: number
  new_pct: number
  returning_pct: number
  guest_pct: number
}

export interface DashboardData {
  period: string
  from: string
  to: string
  kpis: {
    revenue: KpiMetric
    orders: OrdersKpi
    aov: KpiMetric
    customers: CustomersKpi
  }
  trends: TrendPoint[]
  top_products: TopProduct[]
  recent_orders: RecentOrder[]
  catalog: CatalogStats
  operations_queue: OperationsQueue
  top_coupons: TopCoupon[]
  customer_acquisition: CustomerAcquisition
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface LookupItem {
  id: number
  name: string
  slug?: string
}

export interface ColorLookup {
  id: number
  name: string
  hex_code: string | null
}

export interface ProductLookups {
  categories: LookupItem[]
  spaces: LookupItem[]
  styles: LookupItem[]
  rooms: LookupItem[]
  materials: LookupItem[]
  brands: LookupItem[]
  colors: ColorLookup[]
  listing_types: string[]
}

export interface ProductImage {
  id?: number
  src: string
  alt: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductColor {
  color_id: number
  sort_order: number
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  price_cents: number
  price_formatted?: string
  listing_type: 'category' | 'space' | 'style'
  rating: number
  review_count: number
  popularity: number
  brand_id: number
  category_id: number | null
  space_id: number | null
  style_id: number | null
  room_id: number | null
  material_id: number | null
  href: string | null
  brand?: LookupItem | null
  category?: LookupItem | null
  space?: LookupItem | null
  style?: LookupItem | null
  room?: LookupItem | null
  material?: LookupItem | null
  primary_image?: { src: string; alt: string | null } | null
  images?: ProductImage[]
  colors?: ProductColor[]
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  name: string
  slug: string
  description: string
  price_cents: number
  brand_id: number | null
  category_id: number | null
  space_id: number | null
  style_id: number | null
  room_id: number | null
  material_id: number | null
  listing_type: 'category' | 'space' | 'style'
  rating: number
  review_count: number
  popularity: number
  href: string
  images: ProductImage[]
  colors: ProductColor[]
}

export interface ProductListResponse {
  products: Product[]
  pagination: Pagination
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'partially_refunded' | 'failed'

export interface OrderCustomer {
  email: string
  name: string | null
  phone: string | null
  city: string | null
  state: string | null
}

export interface OrderPayment {
  id: string
  method: string
  status: PaymentStatus
}

export interface OrderShipment {
  id: string
  status: string
  tracking_number: string | null
  carrier: string | null
}

export interface Order {
  id: string
  user_id: string
  customer: OrderCustomer
  status: OrderStatus
  total_amount: number
  items_count: number
  payment: OrderPayment | null
  shipment: OrderShipment | null
  created_at: string
}

export interface OrderItem {
  id: string
  productId: number
  quantity: number
  unitPrice: number
  subtotal: number
  product: {
    name: string
    slug: string
    image: string | null
  } | null
}

export interface OrderStatusEntry {
  id: string
  status: string
  notes: string | null
  created_at: string
}

export interface OrderRefund {
  id: string
  amount: number
  reason: string | null
  status: string
  created_at: string
}

export interface OrderDetail extends Order {
  shipping: {
    firstName?: string | null
    lastName?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    phone?: string | null
    shipping_first_name?: string | null
    shipping_last_name?: string | null
    shipping_address?: string | null
    shipping_city?: string | null
    shipping_state?: string | null
    shipping_pincode?: string | null
    shipping_phone?: string | null
  }
  items: OrderItem[]
  statusHistory: OrderStatusEntry[]
  refunds: OrderRefund[]
}

export interface OrderStats {
  total_orders: number
  total_revenue: number
  pending_count: number
  paid_count: number
  processing_count: number
  shipped_count: number
  delivered_count: number
  cancelled_count: number
  refunded_count: number
}

export interface OrderListResponse {
  orders: Order[]
  pagination: Pagination
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface CustomerMetrics {
  total_customers: number
  new_customers_30d: number
  active_customers: number
  returning_customers: number
  high_value_customers: number
  total_revenue: number
  average_order_value: number
}

export interface Customer {
  id: string
  email: string
  name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  status: string
  is_active: boolean
  role: string
  total_orders: number
  total_spent: number
  average_order_value: number
  last_order_date: string | null
  city: string | null
  state: string | null
  segment: string
  created_at: string
}

export interface CustomerAddress {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

export interface CustomerDetail {
  customer: Customer & {
    phone_number: string | null
    updated_at: string
  }
  stats: {
    total_orders: number
    total_spent: number
    average_order_value: number
    cart_items_count: number
    wishlist_items_count: number
    reviews_count: number
  }
  addresses: CustomerAddress[]
  orders: Order[]
  reviews: Review[]
}

export interface CustomerListResponse {
  metrics: CustomerMetrics
  customers: Customer[]
  pagination: Pagination
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed_amount'

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  discount_formatted: string
  is_active: boolean
  status: string
  expires_at: string | null
  redemptions_count: number
  total_discount_applied: number
  created_at: string
}

export interface CouponStats {
  total_coupons: number
  active_coupons: number
  inactive_coupons: number
  expired_coupons: number
  total_redemptions: number
  total_discount_given: number
}

export interface CouponRedemption {
  id: string
  user_email: string
  order_id: string
  discount_applied: number
  created_at: string
}

export interface CouponDetail {
  coupon: Coupon
  stats: CouponStats
  redemptions: CouponRedemption[]
}

export interface CouponFormData {
  code: string
  description: string
  discount_type: DiscountType
  discount_value: number
  is_active: boolean
  expires_at: string | null
}

export interface CouponListResponse {
  coupons: Coupon[]
  pagination: Pagination
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  verified_count: number
  rating_breakdown: Record<string, number>
}

export interface Review {
  id: string
  product_id: number
  product?: {
    name: string
    slug: string
    image: string | null
  }
  user_id: string | null
  user_email?: string
  author_name: string
  rating: number
  title: string | null
  comment: string
  is_verified_purchase: boolean
  created_at: string
  updated_at: string
}

export interface ReviewListResponse {
  stats: ReviewStats
  reviews: Review[]
  pagination: Pagination
}

// ─── Images / Media ──────────────────────────────────────────────────────────

export interface ImageAuditSummary {
  total_products: number
  products_with_images: number
  products_missing_images_count: number
  total_images: number
  primary_images: number
  missing_alt_count: number
  duplicate_url_count: number
}

export interface ImageAuditMissing {
  id: number
  name: string
  slug: string
  brand: string | null
}

export interface ImageAuditDuplicate {
  src: string
  usage_count: number
  product_ids: number[]
}

export interface ImageAudit {
  summary: ImageAuditSummary
  missing_images: ImageAuditMissing[]
  duplicates: ImageAuditDuplicate[]
  recent_assets: ProductImage[]
}

export interface ImageRecord {
  id: number
  product_id: number
  src: string
  alt: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
  product_name?: string
}

export interface ImageListResponse {
  images: ImageRecord[]
  pagination: Pagination
}

// ─── Team / RBAC ─────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  email: string
  name: string
  phone_number: string | null
  role: AdminRole
  is_active: boolean
  resolved_permissions: AdminPermission[]
  created_at: string
  updated_at: string
}

export interface TeamInvitation {
  id: string
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
  invited_by: string | null
  expires_at: string
  created_at: string
}

export interface TeamListResponse {
  team: TeamMember[]
  invitations: TeamInvitation[]
  presets: Record<string, AdminPermission[]>
  permissions: Record<string, string>
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface SuccessResponse {
  success: boolean
  message: string
}

export interface ApiError {
  message: string
  status?: number
}
