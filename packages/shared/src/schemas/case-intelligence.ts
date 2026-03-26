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
