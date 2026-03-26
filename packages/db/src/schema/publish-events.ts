import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { contentUnits } from './content-units.js';
import { platformConnections } from './platform-connections.js';

export const publishEvents = pgTable('publish_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  content_unit_id: uuid('content_unit_id').notNull().references(() => contentUnits.id),
  platform_connection_id: uuid('platform_connection_id').notNull().references(() => platformConnections.id),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  published_at: timestamp('published_at', { withTimezone: true }),
  status: text('status').notNull().default('scheduled'),
  platform_post_id: text('platform_post_id'),
  platform_post_url: text('platform_post_url'),
  error_message: text('error_message'),
  retry_count: integer('retry_count').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
