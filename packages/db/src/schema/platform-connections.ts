import { pgTable, uuid, text, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { brands } from './brands.js';

export const platformConnections = pgTable('platform_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand_id: uuid('brand_id').notNull().references(() => brands.id),
  platform: text('platform').notNull(),
  platform_account_id: text('platform_account_id').notNull(),
  platform_account_name: text('platform_account_name'),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  token_expires_at: timestamp('token_expires_at', { withTimezone: true }),
  scopes: jsonb('scopes').notNull(),
  status: text('status').notNull().default('active'),
  rate_limit_state: jsonb('rate_limit_state').default('{}'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('platform_connections_brand_platform_account_unique')
    .on(table.brand_id, table.platform, table.platform_account_id),
]);
