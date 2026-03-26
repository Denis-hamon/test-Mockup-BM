"use server";

import { db } from "@/lib/db";
import { caseSummaries } from "@/lib/db/schema/case-intelligence";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { generateCaseSummary } from "@/lib/ai/generate-case-summary";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

const MAX_GENERATION_ATTEMPTS = 3;

/**
 * Triggers AI case summary generation for a submission.
 * Auth: only the submission owner can trigger generation.
 * Rate limit: max 3 attempts per submission.
 */
export async function generateCaseSummaryAction(submissionId: string): Promise<{
  success: boolean;
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

    // Rate limiting: count existing summaries for this submission
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(caseSummaries)
      .where(eq(caseSummaries.submissionId, submissionId));

    if (existingCount[0] && existingCount[0].count >= MAX_GENERATION_ATTEMPTS) {
      return { success: false, error: "max_attempts_reached" };
    }

    // Generate summary
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
 */
export async function getCaseSummaryAction(submissionId: string): Promise<{
  success: boolean;
  summary?: typeof caseSummaries.$inferSelect;
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

    // Get summary
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
