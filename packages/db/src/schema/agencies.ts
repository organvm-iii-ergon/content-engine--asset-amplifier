import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  logo_url: text('logo_url'),
  primary_color: text('primary_color'),
  contact_email: text('contact_email').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
