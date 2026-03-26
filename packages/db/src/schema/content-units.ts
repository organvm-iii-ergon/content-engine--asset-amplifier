import { pgTable, uuid, text, timestamp, real, jsonb } from 'drizzle-orm/pg-core';
import { fragments } from './fragments.js';
import { brands } from './brands.js';

export const contentUnits = pgTable('content_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  fragment_id: uuid('fragment_id').notNull().references(() => fragments.id),
  brand_id: uuid('brand_id').notNull().references(() => brands.id),
  platform: text('platform').notNull(),
  caption: text('caption').notNull(),
  media_key: text('media_key').notNull(),
  media_type: text('media_type').notNull(),
  hashtags: jsonb('hashtags').default('[]'),
  nc_score: real('nc_score').notNull(),
  nc_score_breakdown: jsonb('nc_score_breakdown').notNull(),
  approval_status: text('approval_status').notNull().default('pending'),
  flagged_reason: text('flagged_reason'),
  similarity_hash: text('similarity_hash').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
