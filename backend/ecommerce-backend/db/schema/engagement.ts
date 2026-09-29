import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    subject: text('subject'),
    message: text('message').notNull(),
    status: text('status').default('unread').notNull(), // 'unread', 'read', 'replied'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
