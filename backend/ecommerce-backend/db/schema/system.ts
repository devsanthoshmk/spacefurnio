import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id'), // The admin/system performing the action
    action: text('action').notNull(), // 'create_refund', 'update_inventory', etc.
    entityType: text('entity_type').notNull(), // 'orders', 'inventory', etc.
    entityId: text('entity_id').notNull(),
    details: text('details'), // JSON payload of changes
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventLogs = pgTable('event_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'), // Optional, for anonymous tracking
    eventType: text('event_type').notNull(), // 'add_to_cart', 'checkout_started'
    eventData: text('event_data'), // JSON payload
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
