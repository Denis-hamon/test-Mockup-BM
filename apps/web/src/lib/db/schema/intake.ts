import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const intakeSubmissions = pgTable("intake_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  problemType: text("problem_type").notNull(),
  problemSubType: text("problem_sub_type"),
  description: text("description").notNull(),
  descriptionNonce: text("description_nonce"),
  urgency: text("urgency", {
    enum: ["normal", "urgent", "tres_urgent"],
  }).default("normal"),
  opposingParty: text("opposing_party"),
  desiredOutcome: text("desired_outcome"),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  preferredContact: text("preferred_contact", {
    enum: ["email", "telephone", "les_deux"],
  }).default("email"),
  availabilities: text("availabilities"),
  status: text("status", {
    enum: ["draft", "submitted", "assigned", "reviewed"],
  }).default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const intakeDocuments = pgTable("intake_documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => intakeSubmissions.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  s3Key: text("s3_key").notNull(),
  encryptedKey: text("encrypted_key").notNull(),
  nonce: text("nonce").notNull(),
  ssecKeyHash: text("ssec_key_hash"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const intakeSubmissionsRelations = relations(
  intakeSubmissions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [intakeSubmissions.userId],
      references: [users.id],
    }),
    documents: many(intakeDocuments),
  })
);

export const intakeDocumentsRelations = relations(
  intakeDocuments,
  ({ one }) => ({
    submission: one(intakeSubmissions, {
      fields: [intakeDocuments.submissionId],
      references: [intakeSubmissions.id],
    }),
  })
);
