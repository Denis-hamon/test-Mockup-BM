"use server";

import { db } from "@/lib/db";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { intakeSchema } from "@legalconnect/shared";

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

    return { success: true, id: result.id };
  } catch {
    return { success: false, error: "submission_failed" };
  }
}
