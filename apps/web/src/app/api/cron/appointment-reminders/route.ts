/**
 * Cron endpoint for sending appointment reminders (J-1 and J-0).
 *
 * Schedule: Call twice daily at 08:00 and 09:00 Paris time (Europe/Paris).
 * Example crontab: 0 8,9 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://app.legalconnect.fr/api/cron/appointment-reminders
 *
 * Protected by CRON_SECRET env var in Authorization header.
 * Deduplication via reminder_logs table prevents duplicate sends.
 */

import { db } from "@/lib/db";
import { appointments, reminderLogs } from "@/lib/db/schema/appointments";
import { users } from "@/lib/db/schema/auth";
import { sendAppointmentReminder } from "@legalconnect/email";
import { eq, and, gte, lt, notInArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Validate CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.legalconnect.fr";
  const errors: string[] = [];
  let j1Sent = 0;
  let j0Sent = 0;

  try {
    const now = new Date();

    // Compute today and tomorrow date ranges (UTC)
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(todayEnd);
    const tomorrowEnd = new Date(
      tomorrowStart.getTime() + 24 * 60 * 60 * 1000,
    );

    // 2. Get IDs of already-sent reminders to exclude
    const sentJ1Ids = db
      .select({ appointmentId: reminderLogs.appointmentId })
      .from(reminderLogs)
      .where(eq(reminderLogs.type, "j-1"));

    const sentJ0Ids = db
      .select({ appointmentId: reminderLogs.appointmentId })
      .from(reminderLogs)
      .where(eq(reminderLogs.type, "j-0"));

    // 3. Query J-1 appointments (tomorrow)
    const j1Appointments = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        avocatId: appointments.avocatId,
        type: appointments.type,
        confirmedDate: appointments.confirmedDate,
        visioLink: appointments.visioLink,
        cabinetAddress: appointments.cabinetAddress,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirme"),
          gte(appointments.confirmedDate, tomorrowStart),
          lt(appointments.confirmedDate, tomorrowEnd),
          notInArray(appointments.id, sentJ1Ids),
        ),
      );

    // 4. Query J-0 appointments (today)
    const j0Appointments = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        avocatId: appointments.avocatId,
        type: appointments.type,
        confirmedDate: appointments.confirmedDate,
        visioLink: appointments.visioLink,
        cabinetAddress: appointments.cabinetAddress,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirme"),
          gte(appointments.confirmedDate, todayStart),
          lt(appointments.confirmedDate, todayEnd),
          notInArray(appointments.id, sentJ0Ids),
        ),
      );

    // 5. Send J-1 reminders
    for (const appt of j1Appointments) {
      try {
        const [client, lawyer] = await Promise.all([
          db.query.users.findFirst({
            where: eq(users.id, appt.clientId),
            columns: { email: true, name: true },
          }),
          db.query.users.findFirst({
            where: eq(users.id, appt.avocatId),
            columns: { email: true, name: true },
          }),
        ]);

        const reminderData = {
          lawyerName: lawyer?.name || "Votre avocat",
          confirmedDate: appt.confirmedDate!,
          type: appt.type as "visio" | "presentiel",
          visioLink: appt.visioLink ?? undefined,
          cabinetAddress: appt.cabinetAddress ?? undefined,
          isToday: false,
          baseUrl,
        };

        // Send to client
        if (client?.email) {
          await sendAppointmentReminder(client.email, {
            ...reminderData,
            recipientName: client.name || "Client",
          });
        }

        // Send to lawyer
        if (lawyer?.email) {
          await sendAppointmentReminder(lawyer.email, {
            ...reminderData,
            recipientName: lawyer.name || "Maitre",
          });
        }

        // Log to prevent duplicate sends
        await db.insert(reminderLogs).values({
          appointmentId: appt.id,
          type: "j-1",
        });

        j1Sent++;
      } catch (err) {
        errors.push(`J-1 failed for appointment ${appt.id}: ${String(err)}`);
      }
    }

    // 6. Send J-0 reminders
    for (const appt of j0Appointments) {
      try {
        const [client, lawyer] = await Promise.all([
          db.query.users.findFirst({
            where: eq(users.id, appt.clientId),
            columns: { email: true, name: true },
          }),
          db.query.users.findFirst({
            where: eq(users.id, appt.avocatId),
            columns: { email: true, name: true },
          }),
        ]);

        const reminderData = {
          lawyerName: lawyer?.name || "Votre avocat",
          confirmedDate: appt.confirmedDate!,
          type: appt.type as "visio" | "presentiel",
          visioLink: appt.visioLink ?? undefined,
          cabinetAddress: appt.cabinetAddress ?? undefined,
          isToday: true,
          baseUrl,
        };

        // Send to client
        if (client?.email) {
          await sendAppointmentReminder(client.email, {
            ...reminderData,
            recipientName: client.name || "Client",
          });
        }

        // Send to lawyer
        if (lawyer?.email) {
          await sendAppointmentReminder(lawyer.email, {
            ...reminderData,
            recipientName: lawyer.name || "Maitre",
          });
        }

        // Log to prevent duplicate sends
        await db.insert(reminderLogs).values({
          appointmentId: appt.id,
          type: "j-0",
        });

        j0Sent++;
      } catch (err) {
        errors.push(`J-0 failed for appointment ${appt.id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      sent: { j1: j1Sent, j0: j0Sent },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[cron] appointment-reminders failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
