import type { OrderStatus } from '@/admin/types/admin'

export const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

export function getNextStatuses(status: OrderStatus): OrderStatus[] {
  return NEXT_STATUS_MAP[status] ?? []
}

export function isOrderCancellable(status: OrderStatus): boolean {
  return !['delivered', 'cancelled', 'refunded'].includes(status)
}
