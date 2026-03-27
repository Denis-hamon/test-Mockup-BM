import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { intakeSubmissions } from "./intake";

export const lawyerProfiles = pgTable("lawyer_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  firmName: text("firm_name"),
  phone: text("phone"),
  specialties: text("specialties").notNull().default("[]"), // JSON string[] e.g. ["famille","travail"]
  notifyNewCase: integer("notify_new_case").default(1).notNull(), // 1=on, 0=off
  notifyNewMessage: integer("notify_new_message").default(1).notNull(), // 1=on, 0=off
  readReceiptsEnabled: integer("read_receipts_enabled").default(1).notNull(), // 1=on, 0=off
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const lawyerNotes = pgTable("lawyer_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => intakeSubmissions.id),
  lawyerId: text("lawyer_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const lawyerProfilesRelations = relations(lawyerProfiles, ({ one }) => ({
  user: one(users, { fields: [lawyerProfiles.userId], references: [users.id] }),
}));

export const lawyerNotesRelations = relations(lawyerNotes, ({ one }) => ({
  submission: one(intakeSubmissions, {
    fields: [lawyerNotes.submissionId],
    references: [intakeSubmissions.id],
  }),
  lawyer: one(users, {
    fields: [lawyerNotes.lawyerId],
    references: [users.id],
  }),
}));
