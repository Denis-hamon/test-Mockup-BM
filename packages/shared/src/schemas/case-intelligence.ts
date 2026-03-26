import { z } from "zod";

export const partySchema = z.object({
  name: z.string(),
  role: z.string(), // e.g., "demandeur", "defendeur", "temoin", "employeur"
});

export const amountSchema = z.object({
  value: z.number(),
  currency: z.string().default("EUR"),
  context: z.string(), // e.g., "salaire impaye", "indemnite demandee"
});

export const strengthIndicatorSchema = z.object({
  category: z.string(), // e.g., "documentation", "delais", "preuve"
  level: z.enum(["fort", "moyen", "faible"]),
  description: z.string(),
});

export const caseSummaryOutputSchema = z.object({
  summary: z.string().min(50),
  keyFacts: z.array(z.string()).min(1),
  legalDomain: z.string(),
  parties: z.array(partySchema),
  amounts: z.array(amountSchema).default([]),
  urgencyAssessment: z.enum(["low", "medium", "high", "critical"]),
  strengthIndicators: z.array(strengthIndicatorSchema).default([]),
});

export type CaseSummaryOutput = z.infer<typeof caseSummaryOutputSchema>;

export const caseSummarySchema = caseSummaryOutputSchema.extend({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  aiModel: z.string(),
  aiTokensUsed: z.number().nullable(),
  generatedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CaseSummary = z.infer<typeof caseSummarySchema>;

export const generateSummaryRequestSchema = z.object({
  submissionId: z.string().uuid(),
});

export type GenerateSummaryRequest = z.infer<typeof generateSummaryRequestSchema>;

// ---------------------------------------------------------------------------
// Timeline schemas (AI-03)
// ---------------------------------------------------------------------------

export const timelineEventSchema = z.object({
  date: z.string(), // ISO date or '~' prefix for approximate
  description: z.string().min(10),
  source: z.enum(["recit", "document"]),
  confidence: z.enum(["high", "low"]),
  documentId: z.string().optional(),
});

export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const undatedEventSchema = z.object({
  description: z.string().min(10),
  source: z.enum(["recit", "document"]),
  documentId: z.string().optional(),
});

export type UndatedEvent = z.infer<typeof undatedEventSchema>;

export const timelineOutputSchema = z.object({
  events: z.array(timelineEventSchema),
  undatedEvents: z.array(undatedEventSchema).default([]),
});

export type TimelineOutput = z.infer<typeof timelineOutputSchema>;

// ---------------------------------------------------------------------------
// Qualification Score schemas (AI-04)
// ---------------------------------------------------------------------------

export const qualificationScoreOutputSchema = z.object({
  urgencyScore: z.number().int().min(0).max(100),
  completenessScore: z.number().int().min(0).max(100),
  complexityScore: z.number().int().min(0).max(100),
  rationale: z.string().min(20),
});

export type QualificationScoreOutput = z.infer<typeof qualificationScoreOutputSchema>;
