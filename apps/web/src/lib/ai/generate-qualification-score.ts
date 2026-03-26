/**
 * Qualification Score Generation
 *
 * Orchestrates AI-powered qualification scoring from intake submission data.
 * Loads submission from DB, builds prompt, calls AI, validates output, stores result.
 *
 * Scoring weights per D-06:
 * - Urgence: 40%
 * - Completude: 35%
 * - Complexite: 25%
 *
 * Follows the same pattern as generate-case-summary.ts.
 */

import { db } from "@/lib/db";
import { intakeSubmissions, intakeDocuments } from "@/lib/db/schema/intake";
import { qualificationScores } from "@/lib/db/schema/case-intelligence";
import { qualificationScoreOutputSchema, type QualificationScoreOutput } from "@legalconnect/shared";
import { getAIProvider } from "./provider";
import { getMockQualificationScore } from "./mock-provider";
import {
  QUALIFICATION_SCORE_SYSTEM_PROMPT,
  buildQualificationScoreUserPrompt,
} from "./prompts/qualification-score";
import { eq } from "drizzle-orm";
import { generateText } from "ai";

export type GenerateQualificationScoreResult =
  | { success: true; score: typeof qualificationScores.$inferSelect }
  | { success: false; error: string };

// Fields in the intake submission that count toward "filled fields"
const INTAKE_FIELDS = [
  "problemType",
  "problemSubType",
  "description",
  "urgency",
  "opposingParty",
  "desiredOutcome",
  "fullName",
  "email",
  "phone",
] as const;

/**
 * Generates an AI-powered qualification score for the given intake submission.
 *
 * - Loads submission + documents from DB
 * - Calls AI provider (or mock in dev)
 * - Validates structured output against Zod schema
 * - Computes weighted overall score
 * - Stores result in qualificationScores table
 *
 * @param submissionId - The intake submission ID to score
 * @returns The generated score or an error
 */
export async function generateQualificationScore(
  submissionId: string
): Promise<GenerateQualificationScoreResult> {
  try {
    // 1. Load submission
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, submissionId),
    });

    if (!submission) {
      return { success: false, error: "submission_not_found" };
    }

    // 2. Check if score already exists
    const existing = await db.query.qualificationScores.findFirst({
      where: eq(qualificationScores.submissionId, submissionId),
    });

    if (existing) {
      return { success: true, score: existing };
    }

    // 3. Load documents count
    const documents = await db
      .select({ fileName: intakeDocuments.fileName })
      .from(intakeDocuments)
      .where(eq(intakeDocuments.submissionId, submissionId));

    // 4. Calculate filled fields
    const totalFieldsCount = INTAKE_FIELDS.length;
    const filledFieldsCount = INTAKE_FIELDS.filter((field) => {
      const value = (submission as Record<string, unknown>)[field];
      return value !== null && value !== undefined && value !== "";
    }).length;

    // 5. Get AI provider
    const provider = await getAIProvider();

    let scoreOutput: QualificationScoreOutput;
    let tokensUsed: number | null = null;

    if (provider.isMock) {
      // Development mode: use mock data
      scoreOutput = getMockQualificationScore(submission.problemType);
    } else {
      // Production mode: call AI
      const userPrompt = buildQualificationScoreUserPrompt({
        problemType: submission.problemType,
        problemSubType: submission.problemSubType,
        description: submission.description,
        urgency: submission.urgency ?? "normal",
        opposingParty: submission.opposingParty,
        desiredOutcome: submission.desiredOutcome,
        fullName: submission.fullName,
        documentCount: documents.length,
        filledFieldsCount,
        totalFieldsCount,
      });

      const result = await generateText({
        model: provider.model,
        system: QUALIFICATION_SCORE_SYSTEM_PROMPT,
        prompt: userPrompt,
        maxTokens: 1000,
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
      const validation = qualificationScoreOutputSchema.safeParse(parsed);
      if (!validation.success) {
        console.error("[AI] Score validation failed:", validation.error.flatten());
        return { success: false, error: "ai_response_validation_failed" };
      }

      scoreOutput = validation.data;
    }

    // 6. Compute weighted overall score per D-06
    const overallScore = Math.round(
      scoreOutput.urgencyScore * 0.4 +
      scoreOutput.completenessScore * 0.35 +
      scoreOutput.complexityScore * 0.25
    );

    // 7. Store in database
    const [inserted] = await db
      .insert(qualificationScores)
      .values({
        submissionId,
        overallScore,
        urgencyScore: scoreOutput.urgencyScore,
        completenessScore: scoreOutput.completenessScore,
        complexityScore: scoreOutput.complexityScore,
        rationale: scoreOutput.rationale,
        aiModel: provider.modelName,
        aiTokensUsed: tokensUsed,
      })
      .returning();

    return { success: true, score: inserted };
  } catch (error) {
    console.error("[AI] Qualification score generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}
