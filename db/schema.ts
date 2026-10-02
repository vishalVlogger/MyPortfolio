import {
  blob,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const portfolioContent = sqliteTable('portfolio_content', {
  id: integer('id').primaryKey(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Uploaded images and PDFs, one per row, addressed by a hash of their bytes. */
export const portfolioFiles = sqliteTable('portfolio_files', {
  id: text('id').primaryKey(),
  contentType: text('content_type').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
});

/** Anonymous daily counters; no visitor identifiers are stored. */
export const portfolioEvents = sqliteTable(
  'portfolio_events',
  {
    day: text('day').notNull(),
    name: text('name').notNull(),
    count: integer('count').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.day, table.name] })],
);
