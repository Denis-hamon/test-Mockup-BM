/**
 * Timeline Generation
 *
 * Orchestrates AI-powered timeline extraction from intake submission data.
 * Loads submission from DB, builds prompt, calls AI, validates output, stores result.
 *
 * Follows the same pattern as generate-case-summary.ts.
 */

import { db } from "@/lib/db";
import { intakeSubmissions, intakeDocuments } from "@/lib/db/schema/intake";
import { caseTimelines } from "@/lib/db/schema/case-intelligence";
import { timelineOutputSchema, type TimelineOutput } from "@legalconnect/shared";
import { getAIProvider } from "./provider";
import { getMockTimeline } from "./mock-provider";
import { TIMELINE_SYSTEM_PROMPT, buildTimelineUserPrompt } from "./prompts/timeline";
import { eq } from "drizzle-orm";
import { generateText } from "ai";

export type GenerateTimelineResult =
  | { success: true; timeline: typeof caseTimelines.$inferSelect }
  | { success: false; error: string };

/**
 * Generates an AI-powered chronological timeline for the given intake submission.
 *
 * - Loads submission + documents from DB
 * - Calls AI provider (or mock in dev)
 * - Validates structured output against Zod schema
 * - Stores result in caseTimelines table
 *
 * @param submissionId - The intake submission ID to generate a timeline for
 * @returns The generated timeline or an error
 */
export async function generateTimeline(
  submissionId: string
): Promise<GenerateTimelineResult> {
  try {
    // 1. Load submission
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, submissionId),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    // 2. Check if timeline already exists
    const existing = await db.query.caseTimelines.findFirst({
      where: eq(caseTimelines.submissionId, submissionId),
    });

    if (existing) {
      return { success: true, timeline: existing };
    }

    // 3. Load documents metadata
    const documents = await db
      .select({
        fileName: intakeDocuments.fileName,
        mimeType: intakeDocuments.mimeType,
      })
      .from(intakeDocuments)
      .where(eq(intakeDocuments.submissionId, submissionId));

    // 4. Get AI provider
    const provider = await getAIProvider();

    let timelineOutput: TimelineOutput;
    let tokensUsed: number | null = null;

    if (provider.isMock) {
      // Development mode: use mock data
      timelineOutput = getMockTimeline(submission.problemType);
    } else {
      // Production mode: call AI
      const userPrompt = buildTimelineUserPrompt({
        problemType: submission.problemType,
        problemSubType: submission.problemSubType,
        description: submission.description,
        urgency: submission.urgency ?? "normal",
        opposingParty: submission.opposingParty,
        fullName: submission.fullName,
        documentSummaries: documents.map((d) => ({
          fileName: d.fileName,
          mimeType: d.mimeType,
        })),
      });

      const result = await generateText({
        model: provider.model,
        system: TIMELINE_SYSTEM_PROMPT,
        prompt: userPrompt,
        maxTokens: 2000,
        temperature: 0.3,
      });

      tokensUsed = result.usage?.totalTokens ?? null;

      // Parse JSON from AI response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, error: "ai_response_not_json" };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return { success: false, error: "ai_response_invalid_json" };
      }

      // Validate against Zod schema
      const validation = timelineOutputSchema.safeParse(parsed);
      if (!validation.success) {
        console.error("[AI] Timeline validation failed:", validation.error.flatten());
        return { success: false, error: "ai_response_validation_failed" };
      }

      timelineOutput = validation.data;
    }

    // 5. Store in database
    const [inserted] = await db
      .insert(caseTimelines)
      .values({
        submissionId,
        events: JSON.stringify(timelineOutput.events),
        undatedEvents: JSON.stringify(timelineOutput.undatedEvents),
        aiModel: provider.modelName,
        aiTokensUsed: tokensUsed,
      })
      .returning();

    return { success: true, timeline: inserted };
  } catch (error) {
    console.error("[AI] Timeline generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}
