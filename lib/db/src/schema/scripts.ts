import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scriptsTable = pgTable("scripts", {
  id: serial("id").primaryKey(),
  niche: text("niche").notNull(),
  idea: text("idea").notNull(),
  hook: text("hook").notNull(),
  body: text("body").notNull(),
  cta: text("cta").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScriptSchema = createInsertSchema(scriptsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scriptsTable.$inferSelect;
