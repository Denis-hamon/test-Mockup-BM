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

// ---------------------------------------------------------------------------
// Case Timelines (AI-03)
// ---------------------------------------------------------------------------

export const caseTimelines = pgTable("case_timelines", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .unique()
    .references(() => intakeSubmissions.id),
  events: text("events").notNull(), // JSON-encoded TimelineEvent[]
  undatedEvents: text("undated_events").notNull(), // JSON-encoded UndatedEvent[]
  aiModel: text("ai_model").notNull(),
  aiTokensUsed: integer("ai_tokens_used"),
  generatedAt: timestamp("generated_at", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const caseTimelinesRelations = relations(caseTimelines, ({ one }) => ({
  submission: one(intakeSubmissions, {
    fields: [caseTimelines.submissionId],
    references: [intakeSubmissions.id],
  }),
}));

// ---------------------------------------------------------------------------
// Qualification Scores (AI-04)
// ---------------------------------------------------------------------------

export const qualificationScores = pgTable("qualification_scores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .unique()
    .references(() => intakeSubmissions.id),
  overallScore: integer("overall_score").notNull(), // 0-100
  urgencyScore: integer("urgency_score").notNull(), // 0-100, weight 40%
  completenessScore: integer("completeness_score").notNull(), // 0-100, weight 35%
  complexityScore: integer("complexity_score").notNull(), // 0-100, weight 25%
  rationale: text("rationale").notNull(), // French explanation
  aiModel: text("ai_model").notNull(),
  aiTokensUsed: integer("ai_tokens_used"),
  generatedAt: timestamp("generated_at", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const qualificationScoresRelations = relations(qualificationScores, ({ one }) => ({
  submission: one(intakeSubmissions, {
    fields: [qualificationScores.submissionId],
    references: [intakeSubmissions.id],
  }),
}));
