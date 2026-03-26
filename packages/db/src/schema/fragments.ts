import { pgTable, uuid, text, timestamp, real, jsonb } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';

export const fragments = pgTable('fragments', {
  id: uuid('id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').notNull().references(() => assets.id),
  type: text('type').notNull(),
  storage_key: text('storage_key').notNull(),
  start_time: real('start_time'),
  end_time: real('end_time'),
  description: text('description'),
  quality_score: real('quality_score').notNull(),
  nc_alignment_score: real('nc_alignment_score'),
  visual_entropy: real('visual_entropy'),
  extraction_metadata: jsonb('extraction_metadata').default('{}'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
