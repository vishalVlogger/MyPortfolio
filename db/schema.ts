import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const portfolioContent = sqliteTable('portfolio_content', {
  id: integer('id').primaryKey(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
});
