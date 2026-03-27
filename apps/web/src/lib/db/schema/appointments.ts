import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { intakeSubmissions } from "./intake";

export const appointments = pgTable("appointments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => intakeSubmissions.id),
  clientId: text("client_id")
    .notNull()
    .references(() => users.id),
  avocatId: text("avocat_id")
    .notNull()
    .references(() => users.id),
  type: text("type", { enum: ["visio", "presentiel"] }).notNull(),
  status: text("status", {
    enum: ["en_attente", "confirme", "refuse", "annule"],
  })
    .default("en_attente")
    .notNull(),
  // Client preferences (stored as JSON text)
  preferredDates: text("preferred_dates").notNull(), // JSON: string[] (ISO dates)
  preferredSlots: text("preferred_slots").notNull(), // JSON: string[] ("matin"|"apres_midi"|"fin_journee")
  notes: text("notes"),
  // Confirmed details (set by lawyer)
  confirmedDate: timestamp("confirmed_date", { mode: "date" }),
  visioLink: text("visio_link"),
  cabinetAddress: text("cabinet_address"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const reminderLogs = pgTable("reminder_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  appointmentId: text("appointment_id")
    .notNull()
    .references(() => appointments.id),
  type: text("type", { enum: ["j-1", "j-0"] }).notNull(),
  sentAt: timestamp("sent_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  appointment: one(appointments, {
    fields: [reminderLogs.appointmentId],
    references: [appointments.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  reminders: many(reminderLogs),
  submission: one(intakeSubmissions, {
    fields: [appointments.submissionId],
    references: [intakeSubmissions.id],
  }),
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
    relationName: "appointmentClient",
  }),
  avocat: one(users, {
    fields: [appointments.avocatId],
    references: [users.id],
    relationName: "appointmentAvocat",
  }),
}));
