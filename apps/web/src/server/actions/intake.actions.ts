"use server";

import { db } from "@/lib/db";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { users } from "@/lib/db/schema/auth";
import { lawyerProfiles } from "@/lib/db/schema/lawyer";
import { intakeSchema } from "@legalconnect/shared";
import { triggerCaseIntelligence } from "./case-intelligence.actions";
import { sendNewCaseNotification } from "@legalconnect/email";
import { eq } from "drizzle-orm";

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

    // Fire-and-forget: send notification to all lawyers with notifyNewCase=1
    // Per D-05 and research pitfall 5: do NOT await, do NOT block the response
    void (async () => {
      try {
        const lawyers = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .innerJoin(lawyerProfiles, eq(lawyerProfiles.userId, users.id))
          .where(eq(lawyerProfiles.notifyNewCase, 1));

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        for (const lawyer of lawyers) {
          sendNewCaseNotification(lawyer.email, {
            lawyerName: lawyer.name ?? undefined,
            clientName: parsed.fullName,
            problemType: parsed.problemType,
            submissionDate: new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            caseUrl: `${baseUrl}/dossiers/${result.id}`,
          }).catch((err) => console.error("[email] Notification failed:", err));
        }
      } catch (err) {
        console.error("[email] Failed to send new case notifications:", err);
      }
    })();

    return { success: true, id: result.id };
  } catch {
    return { success: false, error: "submission_failed" };
  }
}
