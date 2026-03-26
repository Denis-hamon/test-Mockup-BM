/**
 * Case Summary Generation
 *
 * Orchestrates AI-powered case summary generation from intake submission data.
 * Loads submission from DB, builds prompt, calls AI, validates output, stores result.
 */

import { db } from "@/lib/db";
import { intakeSubmissions, intakeDocuments } from "@/lib/db/schema/intake";
import { caseSummaries } from "@/lib/db/schema/case-intelligence";
import { caseSummaryOutputSchema, type CaseSummaryOutput } from "@legalconnect/shared";
import { getAIProvider } from "./provider";
import { getMockSummary } from "./mock-provider";
import { CASE_SUMMARY_SYSTEM_PROMPT, buildCaseSummaryUserPrompt } from "./prompts/case-summary";
import { eq } from "drizzle-orm";
import { generateText } from "ai";

export type GenerateCaseSummaryResult =
  | { success: true; summary: typeof caseSummaries.$inferSelect }
  | { success: false; error: string };

/**
 * Generates an AI case summary for the given intake submission.
 *
 * - Loads submission + documents from DB
 * - Calls AI provider (or mock in dev)
 * - Validates structured output against Zod schema
 * - Stores result in caseSummaries table
 *
 * @param submissionId - The intake submission ID to generate a summary for
 * @returns The generated case summary or an error
 */
export async function generateCaseSummary(
  submissionId: string
): Promise<GenerateCaseSummaryResult> {
  try {
    // 1. Load submission
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, submissionId),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    // 2. Check if summary already exists
    const existing = await db.query.caseSummaries.findFirst({
      where: eq(caseSummaries.submissionId, submissionId),
    });

    if (existing) {
      return { success: true, summary: existing };
    }

    // 3. Load documents metadata
    const documents = await db
      .select({
        fileName: intakeDocuments.fileName,
        mimeType: intakeDocuments.mimeType,
        fileSize: intakeDocuments.fileSize,
      })
      .from(intakeDocuments)
      .where(eq(intakeDocuments.submissionId, submissionId));

    // 4. Get AI provider
    const provider = await getAIProvider();

    let summaryOutput: CaseSummaryOutput;
    let tokensUsed: number | null = null;

    if (provider.isMock) {
      // Development mode: use mock data
      summaryOutput = getMockSummary(submission.problemType);
    } else {
      // Production mode: call AI
      const userPrompt = buildCaseSummaryUserPrompt({
        problemType: submission.problemType,
        problemSubType: submission.problemSubType,
        description: submission.description,
        urgency: submission.urgency ?? "normal",
        opposingParty: submission.opposingParty,
        desiredOutcome: submission.desiredOutcome,
        fullName: submission.fullName,
        documentCount: documents.length,
        documentTypes: [...new Set(documents.map((d) => d.mimeType))],
      });

      const result = await generateText({
        model: provider.model,
        system: CASE_SUMMARY_SYSTEM_PROMPT,
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
      const validation = caseSummaryOutputSchema.safeParse(parsed);
      if (!validation.success) {
        console.error("[AI] Summary validation failed:", validation.error.flatten());
        return { success: false, error: "ai_response_validation_failed" };
      }

      summaryOutput = validation.data;
    }

    // 5. Store in database
    const [inserted] = await db
      .insert(caseSummaries)
      .values({
        submissionId,
        summary: summaryOutput.summary,
        keyFacts: JSON.stringify(summaryOutput.keyFacts),
        legalDomain: summaryOutput.legalDomain,
        parties: JSON.stringify(summaryOutput.parties),
        amounts: summaryOutput.amounts.length > 0 ? JSON.stringify(summaryOutput.amounts) : null,
        urgencyAssessment: summaryOutput.urgencyAssessment,
        strengthIndicators:
          summaryOutput.strengthIndicators.length > 0
            ? JSON.stringify(summaryOutput.strengthIndicators)
            : null,
        aiModel: provider.modelName,
        aiTokensUsed: tokensUsed,
      })
      .returning();

    return { success: true, summary: inserted };
  } catch (error) {
    console.error("[AI] Case summary generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}
