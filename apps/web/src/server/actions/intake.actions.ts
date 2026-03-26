"use server";

import { db } from "@/lib/db";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { intakeSchema } from "@legalconnect/shared";
import { generateCaseSummary } from "@/lib/ai/generate-case-summary";

export async function submitIntake(data: unknown): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    const parsed = intakeSchema.parse(data);

    const [result] = await db
      .insert(intakeSubmissions)
      .values({
        problemType: parsed.problemType,
        problemSubType: parsed.problemSubType,
        description: parsed.description,
        urgency: parsed.urgency,
        opposingParty: parsed.opposingParty,
        desiredOutcome: parsed.desiredOutcome,
        fullName: parsed.fullName,
        phone: parsed.phone,
        preferredContact: parsed.preferredContact,
        availabilities: parsed.availabilities,
        status: "submitted",
      })
      .returning({ id: intakeSubmissions.id });

    // Fire-and-forget: trigger AI case summary generation
    // Do not await — summary generation runs in background
    generateCaseSummary(result.id).catch((err) => {
      console.error("[intake] Background case summary generation failed:", err);
    });

    return { success: true, id: result.id };
  } catch {
    return { success: false, error: "submission_failed" };
  }
}
