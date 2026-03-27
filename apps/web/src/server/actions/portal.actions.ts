"use server";

/**
 * Server actions for the client portal.
 *
 * Authorization model:
 * - requireClient(): role === "client" (portal pages)
 * - requireAuth(): any authenticated user (shared actions)
 *
 * Actions:
 * - getClientDashboard: Summary stats (active cases, unread, next appointment)
 * - getClientCases: Case list with status mapping (D-06: no score, no notes)
 * - getClientCaseDetail: Case detail with timeline, documents, conversation
 * - getClientDocuments: All documents across cases
 */

import { db } from "@/lib/db";
import { intakeSubmissions, intakeDocuments } from "@/lib/db/schema/intake";
import { caseTimelines } from "@/lib/db/schema/case-intelligence";
import { conversations, messages } from "@/lib/db/schema/messaging";
import { appointments } from "@/lib/db/schema/appointments";
import { eq, and, sql, desc, ne, gt, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Auth Helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function requireClient() {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false as const, error: "not_authenticated" };
  }
  if (session.user.role !== "client") {
    return { authorized: false as const, error: "unauthorized" };
  }
  return { authorized: true as const, userId: session.user.id, session };
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false as const, error: "not_authenticated" };
  }
  return {
    authorized: true as const,
    userId: session.user.id,
    role: session.user.role as "avocat" | "client",
    session,
  };
}

// ---------------------------------------------------------------------------
// Status mapping (D-06): submitted -> Nouveau, en_cours -> En cours, termine -> Termine
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  submitted: "Nouveau",
  en_cours: "En cours",
  termine: "Termine",
};

function mapStatus(status: string | null): string {
  return STATUS_LABELS[status ?? ""] ?? status ?? "Inconnu";
}

// ---------------------------------------------------------------------------
// getClientDashboard
// ---------------------------------------------------------------------------

export async function getClientDashboard() {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  try {
    // Active cases count (submitted, en_cours, termine -- not draft, not archive)
    const activeCasesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(intakeSubmissions)
      .where(
        and(
          eq(intakeSubmissions.userId, clientId),
          ne(intakeSubmissions.status, "draft"),
          ne(intakeSubmissions.status, "archive"),
        ),
      );

    const activeCases = Number(activeCasesResult[0]?.count ?? 0);

    // Unread messages count (messages in my conversations where I'm not the sender and readAt is null)
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.clientId, clientId),
          ne(messages.senderId, clientId),
          isNull(messages.readAt),
        ),
      );

    const unreadMessages = Number(unreadResult[0]?.count ?? 0);

    // Next confirmed appointment
    const nextAppointmentResult = await db
      .select({
        confirmedDate: appointments.confirmedDate,
        type: appointments.type,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.clientId, clientId),
          eq(appointments.status, "confirme"),
          gt(appointments.confirmedDate, new Date()),
        ),
      )
      .orderBy(appointments.confirmedDate)
      .limit(1);

    const nextAppointment = nextAppointmentResult[0] ?? null;

    // Recent activity (last 10 submissions with their status changes)
    const recentCases = await db
      .select({
        id: intakeSubmissions.id,
        problemType: intakeSubmissions.problemType,
        status: intakeSubmissions.status,
        createdAt: intakeSubmissions.createdAt,
        updatedAt: intakeSubmissions.updatedAt,
      })
      .from(intakeSubmissions)
      .where(
        and(
          eq(intakeSubmissions.userId, clientId),
          ne(intakeSubmissions.status, "draft"),
        ),
      )
      .orderBy(desc(intakeSubmissions.updatedAt))
      .limit(10);

    const recentActivity = recentCases.map((c) => ({
      type: "case" as const,
      description: `${c.problemType} - ${mapStatus(c.status)}`,
      date: c.updatedAt,
      caseId: c.id,
    }));

    return {
      success: true as const,
      data: {
        activeCases,
        unreadMessages,
        nextAppointment: nextAppointment
          ? {
              date: nextAppointment.confirmedDate,
              type: nextAppointment.type,
            }
          : null,
        recentActivity,
      },
    };
  } catch (error) {
    console.error("[portal] getClientDashboard failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// getClientCases (D-06: no score, no lawyer notes)
// ---------------------------------------------------------------------------

export async function getClientCases() {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  try {
    const cases = await db
      .select({
        id: intakeSubmissions.id,
        problemType: intakeSubmissions.problemType,
        status: intakeSubmissions.status,
        createdAt: intakeSubmissions.createdAt,
        updatedAt: intakeSubmissions.updatedAt,
      })
      .from(intakeSubmissions)
      .where(
        and(
          eq(intakeSubmissions.userId, clientId),
          ne(intakeSubmissions.status, "draft"),
        ),
      )
      .orderBy(desc(intakeSubmissions.updatedAt));

    // Get unread count and lastMessageAt per case via conversations
    const caseIds = cases.map((c) => c.id);

    const conversationData =
      caseIds.length > 0
        ? await db
            .select({
              submissionId: conversations.submissionId,
              lastMessageAt: conversations.lastMessageAt,
              unreadCount: sql<number>`count(${messages.id}) filter (where ${messages.readAt} is null and ${messages.senderId} != ${clientId})`,
            })
            .from(conversations)
            .leftJoin(messages, eq(messages.conversationId, conversations.id))
            .where(eq(conversations.clientId, clientId))
            .groupBy(conversations.id)
        : [];

    const conversationMap = new Map(
      conversationData.map((c) => [
        c.submissionId,
        { lastMessageAt: c.lastMessageAt, unreadCount: Number(c.unreadCount) },
      ]),
    );

    const enrichedCases = cases.map((c) => {
      const conv = conversationMap.get(c.id);
      return {
        id: c.id,
        problemType: c.problemType,
        status: mapStatus(c.status),
        createdAt: c.createdAt,
        lastMessageAt: conv?.lastMessageAt ?? null,
        unreadCount: conv?.unreadCount ?? 0,
      };
    });

    return { success: true as const, data: enrichedCases };
  } catch (error) {
    console.error("[portal] getClientCases failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// getClientCaseDetail (D-06: no score, no lawyer notes)
// ---------------------------------------------------------------------------

export async function getClientCaseDetail(caseId: string) {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  try {
    // Fetch submission (only client's own)
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, caseId),
        eq(intakeSubmissions.userId, clientId),
        ne(intakeSubmissions.status, "draft"),
      ),
    });

    if (!submission) {
      return { success: false as const, error: "not_found" };
    }

    // Fetch timeline, documents, and conversation in parallel
    const [timeline, documents, conversation] = await Promise.all([
      db.query.caseTimelines.findFirst({
        where: eq(caseTimelines.submissionId, caseId),
      }),
      db
        .select({
          id: intakeDocuments.id,
          fileName: intakeDocuments.fileName,
          fileSize: intakeDocuments.fileSize,
          mimeType: intakeDocuments.mimeType,
          createdAt: intakeDocuments.createdAt,
        })
        .from(intakeDocuments)
        .where(eq(intakeDocuments.submissionId, caseId)),
      db.query.conversations.findFirst({
        where: and(
          eq(conversations.submissionId, caseId),
          eq(conversations.clientId, clientId),
        ),
      }),
    ]);

    return {
      success: true as const,
      data: {
        submission: {
          id: submission.id,
          problemType: submission.problemType,
          problemSubType: submission.problemSubType,
          description: submission.description,
          status: mapStatus(submission.status),
          urgency: submission.urgency,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        },
        timeline: timeline
          ? {
              events: safeJsonParse(timeline.events, []),
              undatedEvents: safeJsonParse(timeline.undatedEvents, []),
            }
          : null,
        documents,
        conversationId: conversation?.id ?? null,
      },
    };
  } catch (error) {
    console.error("[portal] getClientCaseDetail failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// getClientDocuments (D-08)
// ---------------------------------------------------------------------------

export async function getClientDocuments() {
  const authResult = await requireClient();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const clientId = authResult.userId;

  try {
    const documents = await db
      .select({
        id: intakeDocuments.id,
        fileName: intakeDocuments.fileName,
        fileSize: intakeDocuments.fileSize,
        mimeType: intakeDocuments.mimeType,
        createdAt: intakeDocuments.createdAt,
        submissionId: intakeDocuments.submissionId,
        problemType: intakeSubmissions.problemType,
      })
      .from(intakeDocuments)
      .innerJoin(
        intakeSubmissions,
        eq(intakeDocuments.submissionId, intakeSubmissions.id),
      )
      .where(eq(intakeSubmissions.userId, clientId))
      .orderBy(desc(intakeDocuments.createdAt));

    return { success: true as const, data: documents };
  } catch (error) {
    console.error("[portal] getClientDocuments failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}
