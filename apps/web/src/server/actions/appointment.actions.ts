"use server";

/**
 * Server actions for appointment management.
 *
 * Client actions: requestAppointment, getClientAppointments, cancelAppointment
 * Lawyer actions: getLawyerAppointments, confirmAppointment, refuseAppointment
 *
 * D-09: Free-form preferences (dates + slots), manual lawyer confirmation
 * D-10: Visio (auto Jitsi link) or presentiel (cabinet address)
 * D-11: Email reminders (handled by cron in Plan 04, templates here)
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { appointments } from "@/lib/db/schema/appointments";
import { requireClient, requireAuth } from "./portal.actions";
import { sendEmail } from "@legalconnect/email";
import { eq, and, desc, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAvocat() {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false as const, error: "not_authenticated" };
  }
  if (session.user.role !== "avocat") {
    return { authorized: false as const, error: "unauthorized" };
  }
  return { authorized: true as const, userId: session.user.id, session };
}

const VALID_SLOTS = ["matin", "apres_midi", "fin_journee"] as const;

const requestAppointmentSchema = z.object({
  submissionId: z.string().min(1),
  type: z.enum(["visio", "presentiel"]),
  preferredDates: z
    .array(z.string().datetime({ offset: true }).or(z.string().date()))
    .min(1)
    .max(3),
  preferredSlots: z
    .array(z.enum(VALID_SLOTS))
    .min(1)
    .max(3),
  notes: z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// requestAppointment (client)
// ---------------------------------------------------------------------------

export async function requestAppointment(input: {
  submissionId: string;
  type: "visio" | "presentiel";
  preferredDates: string[];
  preferredSlots: string[];
  notes?: string;
}) {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  // Validate input
  const parsed = requestAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "validation_failed",
      details: parsed.error.flatten(),
    };
  }

  try {
    // Verify submission belongs to client
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, parsed.data.submissionId),
        eq(intakeSubmissions.userId, clientId),
      ),
    });

    if (!submission) {
      return { success: false as const, error: "submission_not_found" };
    }

    // Find the avocat (for now, first avocat user)
    const avocat = await db.query.users.findFirst({
      where: eq(users.role, "avocat"),
    });

    if (!avocat) {
      return { success: false as const, error: "no_avocat_available" };
    }

    const [appointment] = await db
      .insert(appointments)
      .values({
        submissionId: parsed.data.submissionId,
        clientId,
        avocatId: avocat.id,
        type: parsed.data.type,
        preferredDates: JSON.stringify(parsed.data.preferredDates),
        preferredSlots: JSON.stringify(parsed.data.preferredSlots),
        notes: parsed.data.notes ?? null,
      })
      .returning();

    // D-05: send email notification to avocat
    void (async () => {
      try {
        if (avocat.email) {
          const client = await db.query.users.findFirst({
            where: eq(users.id, clientId),
            columns: { name: true },
          });
          await sendEmail({
            to: avocat.email,
            subject: "Nouvelle demande de rendez-vous - LegalConnect",
            text: `Bonjour${avocat.name ? ` ${avocat.name}` : ""},\n\n${client?.name ?? "Un client"} a fait une demande de rendez-vous (${parsed.data.type}).\n\nConnectez-vous pour consulter les details et confirmer.\n\nCordialement,\nL'equipe LegalConnect`,
          });
        }
      } catch (emailError) {
        console.error("[appointments] email notification failed:", emailError);
      }
    })();

    return { success: true as const, data: appointment };
  } catch (error) {
    console.error("[appointments] requestAppointment failed:", error);
    return { success: false as const, error: "create_failed" };
  }
}

// ---------------------------------------------------------------------------
// getClientAppointments
// ---------------------------------------------------------------------------

export async function getClientAppointments() {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  try {
    const results = await db
      .select({
        id: appointments.id,
        submissionId: appointments.submissionId,
        type: appointments.type,
        status: appointments.status,
        preferredDates: appointments.preferredDates,
        preferredSlots: appointments.preferredSlots,
        notes: appointments.notes,
        confirmedDate: appointments.confirmedDate,
        visioLink: appointments.visioLink,
        cabinetAddress: appointments.cabinetAddress,
        createdAt: appointments.createdAt,
        problemType: intakeSubmissions.problemType,
      })
      .from(appointments)
      .innerJoin(
        intakeSubmissions,
        eq(appointments.submissionId, intakeSubmissions.id),
      )
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.createdAt));

    // D-06: do NOT show cancelled-by-lawyer detail (rejection reason hidden)
    const sanitized = results.map((a) => ({
      id: a.id,
      submissionId: a.submissionId,
      type: a.type,
      status: a.status,
      preferredDates: a.preferredDates,
      preferredSlots: a.preferredSlots,
      notes: a.notes,
      confirmedDate: a.confirmedDate,
      visioLink: a.visioLink,
      cabinetAddress: a.cabinetAddress,
      createdAt: a.createdAt,
      problemType: a.problemType,
      // rejectionReason intentionally omitted for client view
    }));

    return { success: true as const, data: sanitized };
  } catch (error) {
    console.error("[appointments] getClientAppointments failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// getLawyerAppointments
// ---------------------------------------------------------------------------

export async function getLawyerAppointments() {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  try {
    const results = await db
      .select({
        id: appointments.id,
        submissionId: appointments.submissionId,
        clientId: appointments.clientId,
        type: appointments.type,
        status: appointments.status,
        preferredDates: appointments.preferredDates,
        preferredSlots: appointments.preferredSlots,
        notes: appointments.notes,
        confirmedDate: appointments.confirmedDate,
        visioLink: appointments.visioLink,
        cabinetAddress: appointments.cabinetAddress,
        rejectionReason: appointments.rejectionReason,
        createdAt: appointments.createdAt,
        clientName: users.name,
        clientEmail: users.email,
        problemType: intakeSubmissions.problemType,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .innerJoin(
        intakeSubmissions,
        eq(appointments.submissionId, intakeSubmissions.id),
      )
      .where(eq(appointments.avocatId, authResult.userId))
      .orderBy(desc(appointments.createdAt));

    return { success: true as const, data: results };
  } catch (error) {
    console.error("[appointments] getLawyerAppointments failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// confirmAppointment (lawyer only)
// ---------------------------------------------------------------------------

export async function confirmAppointment(
  appointmentId: string,
  confirmedDate: string,
  visioLink?: string,
  cabinetAddress?: string,
) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  try {
    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.avocatId, authResult.userId),
      ),
    });

    if (!appointment) {
      return { success: false as const, error: "not_found" };
    }

    if (appointment.status !== "en_attente") {
      return { success: false as const, error: "invalid_status" };
    }

    // D-10: auto-generate Jitsi link for visio if none provided
    let finalVisioLink = visioLink ?? null;
    if (appointment.type === "visio" && !finalVisioLink) {
      finalVisioLink = `https://meet.jit.si/legalconnect-${appointmentId}`;
    }

    await db
      .update(appointments)
      .set({
        status: "confirme",
        confirmedDate: new Date(confirmedDate),
        visioLink: finalVisioLink,
        cabinetAddress: cabinetAddress ?? null,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    // Send confirmation email to client
    void (async () => {
      try {
        const client = await db.query.users.findFirst({
          where: eq(users.id, appointment.clientId),
          columns: { email: true, name: true },
        });
        if (client?.email) {
          const typeLabel =
            appointment.type === "visio" ? "visioconference" : "en cabinet";
          await sendEmail({
            to: client.email,
            subject: "Rendez-vous confirme - LegalConnect",
            text: `Bonjour${client.name ? ` ${client.name}` : ""},\n\nVotre rendez-vous ${typeLabel} a ete confirme.\n\nDate : ${new Date(confirmedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${finalVisioLink ? `\nLien visio : ${finalVisioLink}` : ""}${cabinetAddress ? `\nAdresse : ${cabinetAddress}` : ""}\n\nCordialement,\nL'equipe LegalConnect`,
          });
        }
      } catch (emailError) {
        console.error("[appointments] confirmation email failed:", emailError);
      }
    })();

    return { success: true as const };
  } catch (error) {
    console.error("[appointments] confirmAppointment failed:", error);
    return { success: false as const, error: "update_failed" };
  }
}

// ---------------------------------------------------------------------------
// refuseAppointment (lawyer only)
// ---------------------------------------------------------------------------

export async function refuseAppointment(
  appointmentId: string,
  rejectionReason?: string,
) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  try {
    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.avocatId, authResult.userId),
      ),
    });

    if (!appointment) {
      return { success: false as const, error: "not_found" };
    }

    if (appointment.status !== "en_attente") {
      return { success: false as const, error: "invalid_status" };
    }

    await db
      .update(appointments)
      .set({
        status: "refuse",
        rejectionReason: rejectionReason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    // Send refusal email to client
    void (async () => {
      try {
        const client = await db.query.users.findFirst({
          where: eq(users.id, appointment.clientId),
          columns: { email: true, name: true },
        });
        if (client?.email) {
          await sendEmail({
            to: client.email,
            subject: "Rendez-vous non disponible - LegalConnect",
            text: `Bonjour${client.name ? ` ${client.name}` : ""},\n\nNous sommes desoles, votre demande de rendez-vous n'a pas pu etre honoree.\n\nN'hesitez pas a soumettre une nouvelle demande avec d'autres disponibilites.\n\nCordialement,\nL'equipe LegalConnect`,
          });
        }
      } catch (emailError) {
        console.error("[appointments] refusal email failed:", emailError);
      }
    })();

    return { success: true as const };
  } catch (error) {
    console.error("[appointments] refuseAppointment failed:", error);
    return { success: false as const, error: "update_failed" };
  }
}

// ---------------------------------------------------------------------------
// cancelAppointment (client only, only en_attente)
// ---------------------------------------------------------------------------

export async function cancelAppointment(appointmentId: string) {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  try {
    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.clientId, clientId),
      ),
    });

    if (!appointment) {
      return { success: false as const, error: "not_found" };
    }

    if (appointment.status !== "en_attente") {
      return {
        success: false as const,
        error: "can_only_cancel_pending",
      };
    }

    await db
      .update(appointments)
      .set({
        status: "annule",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    return { success: true as const };
  } catch (error) {
    console.error("[appointments] cancelAppointment failed:", error);
    return { success: false as const, error: "update_failed" };
  }
}
