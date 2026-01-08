/**
 * Dashboards Schema
 *
 * Drizzle table definitions for dashboard definitions + ACL shares.
 *
 * NOTE:
 * - This was moved out of erp-shell-core so dashboards become a first-class pack.
 * - Table Views + Notification Reads remain in erp-shell-core.
 */
import { pgTable, varchar, text, timestamp, uuid, jsonb, index, boolean, integer, unique, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Dashboard Definitions Table
 * Stores dashboard configurations (layout + widgets) as JSONB.
 */
export const dashboardDefinitions = pgTable('dashboard_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(), // Unique key for the dashboard (e.g., "system.company_overview")
    ownerUserId: varchar('owner_user_id', { length: 255 }).notNull().default('system'),
    isSystem: boolean('is_system').notNull().default(true),
    name: text('name').notNull(),
    description: text('description'),
    // public dashboards are visible to all authenticated users
    // private dashboards require owner or explicit shares
    visibility: varchar('visibility', { length: 16 }).notNull().default('public'),
    // scope is a JSON object: { kind: "global" } | { kind: "pack", pack: string }
    scope: jsonb('scope').notNull().default({ kind: 'global' }),
    // config-language version (not renderer version)
    version: integer('version').notNull().default(0),
    // the full dashboard config (layout + widgets + any future fields)
    definition: jsonb('definition').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    keyIdx: unique('dashboard_definitions_key_unique').on(table.key),
    scopeIdx: index('dashboard_definitions_scope_idx').on(table.scope),
    ownerIdx: index('dashboard_definitions_owner_idx').on(table.ownerUserId),
    visibilityIdx: index('dashboard_definitions_visibility_idx').on(table.visibility),
    isSystemIdx: index('dashboard_definitions_is_system_idx').on(table.isSystem),
}));
/**
 * Dashboard Definition Shares Table
 * ACL entries for sharing dashboards with users, groups, or roles.
 */
export const dashboardDefinitionShares = pgTable('dashboard_definition_shares', {
    id: uuid('id').primaryKey().defaultRandom(),
    dashboardId: uuid('dashboard_id')
        .references(() => dashboardDefinitions.id, { onDelete: 'cascade' })
        .notNull(),
    principalType: varchar('principal_type', { length: 16 }).notNull(), // user | group | role
    principalId: varchar('principal_id', { length: 255 }).notNull(),
    permission: varchar('permission', { length: 16 }).notNull().default('view'), // view | full
    sharedBy: varchar('shared_by', { length: 255 }).notNull(),
    sharedByName: varchar('shared_by_name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    dashboardIdx: index('dashboard_definition_shares_dashboard_idx').on(table.dashboardId),
    principalIdx: index('dashboard_definition_shares_principal_idx').on(table.principalType, table.principalId),
    uniqueShare: unique('dashboard_definition_shares_unique').on(table.dashboardId, table.principalType, table.principalId),
}));
// Relations
export const dashboardDefinitionsRelations = relations(dashboardDefinitions, ({ many }) => ({
    shares: many(dashboardDefinitionShares),
}));
export const dashboardDefinitionSharesRelations = relations(dashboardDefinitionShares, ({ one }) => ({
    dashboard: one(dashboardDefinitions, {
        fields: [dashboardDefinitionShares.dashboardId],
        references: [dashboardDefinitions.id],
    }),
}));
