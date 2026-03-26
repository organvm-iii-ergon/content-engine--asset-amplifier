import { pgTable, uuid, timestamp, integer, real, jsonb } from 'drizzle-orm/pg-core';
import { publishEvents } from './publish-events.js';

export const performanceObservations = pgTable('performance_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  publish_event_id: uuid('publish_event_id').notNull().references(() => publishEvents.id),
  observed_at: timestamp('observed_at', { withTimezone: true }).notNull(),
  views: integer('views').default(0),
  impressions: integer('impressions').default(0),
  reach: integer('reach').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  saves: integer('saves').default(0),
  clicks: integer('clicks').default(0),
  followers_gained: integer('followers_gained').default(0),
  engagement_rate: real('engagement_rate'),
  normalized_score: real('normalized_score'),
  raw_metrics: jsonb('raw_metrics').default('{}'),
});
