"use server";

/**
 * Server actions for case intelligence CRUD.
 *
 * New actions (Plan 05-02):
 * - triggerCaseIntelligence: Triggers AI generation (version-aware, rate-limited)
 * - getCaseIntelligence: Returns combined case intelligence for a submission
 * - regenerateCaseIntelligence: Regenerates case intelligence (delegates to trigger)
 *
 * Legacy actions (Plan 05-01, kept for backward compatibility):
 * - generateCaseSummaryAction: Auth-gated summary generation
 * - getCaseSummaryAction: Auth-gated summary retrieval
 */

import { db } from "@/lib/db";
import { caseSummaries } from "@/lib/db/schema/case-intelligence";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { generateCaseSummary } from "@/lib/ai/generate-case-summary";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

const MAX_GENERATION_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Combined case intelligence result returned by getCaseIntelligence.
 * Contains summary data with parsed JSON fields. Timeline and score
 * sections are prepared for future caseTimelines/qualificationScores tables.
 */
export interface CaseIntelligenceResult {
  summary: {
    status: "pending" | "processing" | "done" | "failed";
    clientIdentity: string | null;
    problemType: string | null;
    situationSummary: string | null;
    keyFacts: string[];
    opposingParties: string[];
    urgencyAssessment: string | null;
    version: number;
    error: string | null;
    updatedAt: Date;
  } | null;
  timeline: {
    status: "pending" | "processing" | "done" | "failed";
    events: Array<{
      date: string;
      description: string;
      source: "client" | "document";
      confidence: "high" | "low";
      documentId?: string;
    }>;
    undatedEvents: Array<{
      description: string;
      source: "client" | "document";
      documentId?: string;
    }>;
    version: number;
    error: string | null;
    updatedAt: Date;
  } | null;
  score: {
    status: "pending" | "processing" | "done" | "failed";
    overallScore: number | null;
    urgencyScore: number | null;
    completenessScore: number | null;
    complexityScore: number | null;
    rationale: string | null;
    version: number;
    error: string | null;
    updatedAt: Date;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse JSON with fallback to default value.
 */
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// New actions (Plan 05-02)
// ---------------------------------------------------------------------------

/**
 * Triggers AI case intelligence generation for a submission.
 *
 * Per D-02: generation automatique des la soumission.
 *
 * 1. Determines version number from existing summaries count
 * 2. If regeneration (version > 1): deletes previous summary so new one can be created
 * 3. Calls generateCaseSummary which inserts the result
 * 4. Returns success/failure with version
 *
 * Rate limited to MAX_GENERATION_ATTEMPTS per submission.
 * BullMQ job configured with attempts: 2, exponential backoff delay: 5000
 * when queue infrastructure is available. Currently runs inline.
 */
export async function triggerCaseIntelligence(
  submissionId: string
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    // Determine version from existing summaries
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(caseSummaries)
      .where(eq(caseSummaries.submissionId, submissionId));

    const existingCount = countResult[0]?.count ?? 0;
    const version = existingCount + 1;

    // Rate limiting: max attempts per submission to control AI costs
    if (existingCount >= MAX_GENERATION_ATTEMPTS) {
      return { success: false, error: "max_attempts_reached" };
    }

    // If regeneration (version > 1): remove previous summary
    // so generateCaseSummary won't short-circuit on existing check
    if (existingCount > 0) {
      await db
        .delete(caseSummaries)
        .where(eq(caseSummaries.submissionId, submissionId));
    }

    // Trigger generation
    const result = await generateCaseSummary(submissionId);

    if (!result.success) {
      return { success: false, version, error: result.error };
    }

    return { success: true, version };
  } catch (error) {
    console.error("[case-intelligence] Trigger failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "trigger_failed",
    };
  }
}

/**
 * Retrieves the latest case intelligence for a submission.
 *
 * Auth: only the submission owner can access case intelligence.
 *
 * Returns a CaseIntelligenceResult with:
 * - summary: parsed from caseSummaries table with safe JSON parsing
 * - timeline: null (future caseTimelines table)
 * - score: null (future qualificationScores table)
 */
export async function getCaseIntelligence(
  submissionId: string
): Promise<{
  success: boolean;
  data?: CaseIntelligenceResult;
  error?: string;
}> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "not_authenticated" };
    }

    // Verify submission ownership
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, submissionId),
        eq(intakeSubmissions.userId, session.user.id)
      ),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    // Get latest summary
    const caseSummary = await db.query.caseSummaries.findFirst({
      where: eq(caseSummaries.submissionId, submissionId),
    });

    const result: CaseIntelligenceResult = {
      summary: caseSummary
        ? {
            status: "done" as const,
            clientIdentity: submission.fullName,
            problemType: caseSummary.legalDomain,
            situationSummary: caseSummary.summary,
            keyFacts: safeJsonParse<string[]>(caseSummary.keyFacts, []),
            opposingParties: safeJsonParse<
              Array<{ name: string; role: string }>
            >(caseSummary.parties, []).map((p) => p.name),
            urgencyAssessment: caseSummary.urgencyAssessment,
            version: 1,
            error: null,
            updatedAt: caseSummary.updatedAt,
          }
        : null,
      // Timeline and score sections prepared for future tables
      timeline: null,
      score: null,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("[case-intelligence] Get intelligence failed:", error);
    return { success: false, error: "retrieval_failed" };
  }
}

/**
 * Regenerates case intelligence for a submission.
 *
 * Per D-07: regeneration automatique si le client modifie ses reponses
 * ou ajoute des documents.
 *
 * Delegates to triggerCaseIntelligence which handles version increment
 * and previous version cleanup.
 */
export async function regenerateCaseIntelligence(
  submissionId: string
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "not_authenticated" };
    }

    // Verify submission ownership
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, submissionId),
        eq(intakeSubmissions.userId, session.user.id)
      ),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    // Delegate to trigger which handles version increment
    return await triggerCaseIntelligence(submissionId);
  } catch (error) {
    console.error("[case-intelligence] Regeneration failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "regeneration_failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Legacy actions (Plan 05-01 — kept for backward compatibility)
// ---------------------------------------------------------------------------

/**
 * Triggers AI case summary generation for a submission.
 * Auth: only the submission owner can trigger generation.
 * Rate limit: max 3 attempts per submission.
 *
 * @deprecated Use triggerCaseIntelligence instead
 */
export async function generateCaseSummaryAction(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "not_authenticated" };
    }

    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, submissionId),
        eq(intakeSubmissions.userId, session.user.id)
      ),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(caseSummaries)
      .where(eq(caseSummaries.submissionId, submissionId));

    if (existingCount[0] && existingCount[0].count >= MAX_GENERATION_ATTEMPTS) {
      return { success: false, error: "max_attempts_reached" };
    }

    const result = await generateCaseSummary(submissionId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("[case-intelligence] Generation action failed:", error);
    return { success: false, error: "generation_failed" };
  }
}

/**
 * Retrieves the existing case summary for a submission.
 * Auth: only the submission owner can access the summary.
 *
 * @deprecated Use getCaseIntelligence instead
 */
export async function getCaseSummaryAction(
  submissionId: string
): Promise<{
  success: boolean;
  summary?: typeof caseSummaries.$inferSelect;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "not_authenticated" };
    }

    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, submissionId),
        eq(intakeSubmissions.userId, session.user.id)
      ),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    const summary = await db.query.caseSummaries.findFirst({
      where: eq(caseSummaries.submissionId, submissionId),
    });

    if (!summary) {
      return { success: false, error: "summary_not_found" };
    }

    return { success: true, summary };
  } catch (error) {
    console.error("[case-intelligence] Get summary action failed:", error);
    return { success: false, error: "retrieval_failed" };
  }
}
