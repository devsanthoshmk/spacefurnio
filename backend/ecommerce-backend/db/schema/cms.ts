import { pgTable, text, timestamp, uuid, integer, boolean, serial, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const cmsPages = pgTable('cms_pages', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(), // 'home', 'about', 'collabs', 'portfolio', 'contact', 'footer'
    title: text('title').notNull(),
    seoMetadata: jsonb('seo_metadata').notNull().default({}),
    status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
    hasUnpublishedChanges: boolean('has_unpublished_changes').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cmsSections = pgTable('cms_sections', {
    id: text('id').primaryKey(), // e.g. 'home-hero', 'about-vision', 'footer-main'
    pageSlug: text('page_slug').notNull().references(() => cmsPages.slug, { onDelete: 'cascade' }),
    sectionKey: text('section_key').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    enabled: boolean('enabled').notNull().default(true),
    draftData: jsonb('draft_data').notNull().default({}),
    publishedData: jsonb('published_data').notNull().default({}),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    index('cms_sections_page_slug_sort_order_idx').on(t.pageSlug, t.sortOrder),
]);

export const cmsPolicies = pgTable('cms_policies', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(), // 'privacy-policy', 'terms', 'shipping-policy', 'returns'
    title: text('title').notNull(),
    draftContent: text('draft_content').notNull().default(''),
    publishedContent: text('published_content').notNull().default(''),
    versionNum: integer('version_num').notNull().default(1),
    hasUnpublishedChanges: boolean('has_unpublished_changes').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cmsVersions = pgTable('cms_versions', {
    id: serial('id').primaryKey(),
    scope: text('scope').notNull(), // 'home', 'about', 'collabs', 'portfolio', 'contact', 'footer', 'policies'
    entityId: text('entity_id').notNull(),
    versionNum: integer('version_num').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    changeSummary: text('change_summary').notNull().default(''),
    fieldPath: text('field_path'),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    index('cms_versions_scope_created_at_idx').on(t.scope, t.createdAt),
]);

export const cmsBuildEvents = pgTable('cms_build_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    triggerType: text('trigger_type', { enum: ['manual', 'publish'] }).notNull().default('publish'),
    status: text('status', { enum: ['pending', 'triggered', 'success', 'failed', 'skipped_local'] }).notNull().default('pending'),
    triggeredBy: uuid('triggered_by').references(() => users.id, { onDelete: 'set null' }),
    webhookUrlMasked: text('webhook_url_masked'),
    responseCode: integer('response_code'),
    responseBody: text('response_body'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Relations
export const cmsPagesRelations = relations(cmsPages, ({ many }) => ({
    sections: many(cmsSections),
}));

export const cmsSectionsRelations = relations(cmsSections, ({ one }) => ({
    page: one(cmsPages, {
        fields: [cmsSections.pageSlug],
        references: [cmsPages.slug],
    }),
}));

export const cmsVersionsRelations = relations(cmsVersions, ({ one }) => ({
    author: one(users, {
        fields: [cmsVersions.authorId],
        references: [users.id],
    }),
}));

export const cmsBuildEventsRelations = relations(cmsBuildEvents, ({ one }) => ({
    triggeredByUser: one(users, {
        fields: [cmsBuildEvents.triggeredBy],
        references: [users.id],
    }),
}));

// Inferred Types
export type CmsPage = typeof cmsPages.$inferSelect;
export type NewCmsPage = typeof cmsPages.$inferInsert;
export type CmsSection = typeof cmsSections.$inferSelect;
export type NewCmsSection = typeof cmsSections.$inferInsert;
export type CmsPolicy = typeof cmsPolicies.$inferSelect;
export type NewCmsPolicy = typeof cmsPolicies.$inferInsert;
export type CmsVersion = typeof cmsVersions.$inferSelect;
export type NewCmsVersion = typeof cmsVersions.$inferInsert;
export type CmsBuildEvent = typeof cmsBuildEvents.$inferSelect;
export type NewCmsBuildEvent = typeof cmsBuildEvents.$inferInsert;
