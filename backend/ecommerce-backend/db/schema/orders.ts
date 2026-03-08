import { pgTable, text, timestamp, uuid, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, userAddresses } from './users';

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id').references(() => userAddresses.id), // Snapshot of address details
    status: text('status').notNull().default('pending'), // 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    shippingFirstName: text('shipping_first_name'),
    shippingLastName: text('shipping_last_name'),
    shippingAddress: text('shipping_address'),
    shippingCity: text('shipping_city'),
    shippingState: text('shipping_state'),
    shippingPincode: text('shipping_pincode'),
    shippingPhone: text('shipping_phone'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(), // FK removed — products live in separate Neon project (icy-union-81751721), uses INT
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').unique().notNull().references(() => orders.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    method: text('method').notNull(), // 'card', 'upi', 'cod', 'razorpay', 'paypal', 'stripe'
    status: text('status').notNull().default('pending'), // 'pending', 'completed', 'failed', 'refunded'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentTransactions = pgTable('payment_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
    gatewayStatus: text('gateway_status'),
    gatewayReference: text('gateway_reference'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shipments = pgTable('shipments', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    trackingNumber: text('tracking_number'),
    carrier: text('carrier'),
    status: text('status').notNull().default('pending'), // 'pending', 'shipped', 'delivered'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shipmentItems = pgTable('shipment_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
    quantityShipped: integer('quantity_shipped').notNull(),
});

// Returns
export const returnRequests = pgTable('return_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected', 'completed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const returnItems = pgTable('return_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    returnRequestId: uuid('return_request_id').notNull().references(() => returnRequests.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
    quantity: integer('quantity').notNull(),
});

export const refunds = pgTable('refunds', {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id').notNull().references(() => payments.id), // Refund tied strictly to payment
    returnRequestId: uuid('return_request_id').references(() => returnRequests.id), // Optional: can be a direct refund without return
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    reason: text('reason'),
    status: text('status').notNull().default('pending'), // 'pending', 'completed', 'failed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
