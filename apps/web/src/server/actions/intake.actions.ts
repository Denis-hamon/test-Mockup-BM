"use server";

import { db } from "@/lib/db";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { intakeSchema } from "@legalconnect/shared";
import { triggerCaseIntelligence } from "./case-intelligence.actions";

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

    // Trigger case intelligence generation (non-blocking per D-02)
    // Fire-and-forget: don't await — submission should not be blocked by AI generation
    triggerCaseIntelligence(result.id).catch((err) =>
      console.error("Failed to trigger case intelligence:", err)
    );

    return { success: true, id: result.id };
  } catch {
    return { success: false, error: "submission_failed" };
  }
}
