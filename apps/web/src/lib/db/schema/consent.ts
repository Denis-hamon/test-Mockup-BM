import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const consents = pgTable("consents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type", { enum: ["essential", "analytics"] }).notNull(),
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at", { mode: "date" }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const consentsRelations = relations(consents, ({ one }) => ({
  user: one(users, { fields: [consents.userId], references: [users.id] }),
}));
