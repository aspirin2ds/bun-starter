import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// After changing tables here, run `bun run db:generate` and commit the new file in drizzle/.

export const notes = pgTable("notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Note = typeof notes.$inferSelect;
