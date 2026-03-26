import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { intakeSubmissions } from "./intake";

export const caseSummaries = pgTable("case_summaries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .unique()
    .references(() => intakeSubmissions.id),
  summary: text("summary").notNull(),
  keyFacts: text("key_facts").notNull(), // JSON-encoded string[]
  legalDomain: text("legal_domain").notNull(),
  parties: text("parties").notNull(), // JSON-encoded { name: string; role: string }[]
  amounts: text("amounts"), // JSON-encoded { value: number; currency: string; context: string }[]
  urgencyAssessment: text("urgency_assessment", {
    enum: ["low", "medium", "high", "critical"],
  }).notNull(),
  strengthIndicators: text("strength_indicators"), // JSON-encoded AI assessment
  aiModel: text("ai_model").notNull(),
  aiTokensUsed: integer("ai_tokens_used"),
  generatedAt: timestamp("generated_at", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const caseSummariesRelations = relations(caseSummaries, ({ one }) => ({
  submission: one(intakeSubmissions, {
    fields: [caseSummaries.submissionId],
    references: [intakeSubmissions.id],
  }),
}));
