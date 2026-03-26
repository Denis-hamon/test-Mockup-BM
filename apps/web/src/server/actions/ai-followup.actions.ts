"use server";

import { db } from "@/lib/db";
import { aiFollowUps } from "@/lib/db/schema/intake";
import { eq } from "drizzle-orm";

interface SaveFollowUpData {
  submissionId: string | null;
  stepIndex: number;
  question: string;
  answer: string | null;
  skipped: boolean;
}

/**
 * Save an AI follow-up exchange to the database.
 * If submissionId is null (user hasn't submitted yet), the caller should
 * store the data in localStorage and persist later at submission time.
 */
export async function saveFollowUp(
  data: SaveFollowUpData
): Promise<{ success: boolean; id?: string }> {
  if (!data.submissionId) {
    // Cannot persist without a submission ID — caller handles localStorage fallback
    return { success: false };
  }

  try {
    const [inserted] = await db
      .insert(aiFollowUps)
      .values({
        submissionId: data.submissionId,
        stepIndex: data.stepIndex,
        question: data.question,
        answer: data.answer,
        skipped: data.skipped ? 1 : 0,
      })
      .returning({ id: aiFollowUps.id });

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("Failed to save AI follow-up:", error);
    return { success: false };
  }
}

/**
 * Get all follow-up exchanges for a given submission, ordered by step and time.
 */
export async function getFollowUpsForSubmission(submissionId: string) {
  return db
    .select()
    .from(aiFollowUps)
    .where(eq(aiFollowUps.submissionId, submissionId))
    .orderBy(aiFollowUps.stepIndex, aiFollowUps.createdAt);
}
