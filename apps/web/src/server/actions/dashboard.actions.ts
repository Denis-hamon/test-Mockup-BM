"use server";

/**
 * Server actions for the lawyer dashboard.
 *
 * Authorization model: role === "avocat" (NOT submission ownership).
 * This is the key difference from client-facing actions like getCaseIntelligence.
 *
 * Actions:
 * - listCasesForLawyer: Paginated case list with filters (status, date range, score, search, specialty)
 * - getCaseDetailForLawyer: Full case detail with intelligence, documents, notes, AI follow-ups
 * - updateCaseStatus: Status transition (submitted -> en_cours -> termine -> archive)
 * - addLawyerNote: Add a note to a case
 * - updateLawyerNote: Update an existing note (ownership-checked)
 * - deleteLawyerNote: Delete a note (ownership-checked)
 * - regenerateCaseForLawyer: Re-trigger AI case intelligence
 */

import { db } from "@/lib/db";
import { intakeSubmissions, intakeDocuments, aiFollowUps } from "@/lib/db/schema/intake";
import { caseSummaries, caseTimelines, qualificationScores } from "@/lib/db/schema/case-intelligence";
import { lawyerNotes } from "@/lib/db/schema/lawyer";
import { triggerCaseIntelligence, type CaseIntelligenceResult } from "./case-intelligence.actions";
import { eq, and, sql, desc, asc, gte, lte, ilike, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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

// ---------------------------------------------------------------------------
// listCasesForLawyer
// ---------------------------------------------------------------------------

export interface ListCasesParams {
  page: number;
  pageSize: number;
  status?: string;
  specialty?: string;
  scoreRange?: "faible" | "moyen" | "eleve";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listCasesForLawyer(params: ListCasesParams) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  try {
    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [];

    // Always exclude drafts
    conditions.push(ne(intakeSubmissions.status, "draft"));

    // Status filter
    if (params.status) {
      conditions.push(eq(intakeSubmissions.status, params.status));
    }

    // Search by client name
    if (params.search) {
      conditions.push(ilike(intakeSubmissions.fullName, `%${params.search}%`));
    }

    // Date range filters (D-02)
    if (params.dateFrom) {
      conditions.push(gte(intakeSubmissions.createdAt, new Date(params.dateFrom)));
    }
    if (params.dateTo) {
      conditions.push(lte(intakeSubmissions.createdAt, new Date(params.dateTo)));
    }

    // Specialty filter (on caseSummaries.legalDomain)
    if (params.specialty) {
      conditions.push(eq(caseSummaries.legalDomain, params.specialty));
    }

    // Score range filter
    if (params.scoreRange) {
      switch (params.scoreRange) {
        case "faible":
          conditions.push(sql`${qualificationScores.overallScore} < 40`);
          break;
        case "moyen":
          conditions.push(sql`${qualificationScores.overallScore} >= 40 AND ${qualificationScores.overallScore} < 70`);
          break;
        case "eleve":
          conditions.push(sql`${qualificationScores.overallScore} >= 70`);
          break;
      }
    }

    // Determine sort order
    let orderByClause;
    const sortDesc = params.sortOrder !== "asc";
    switch (params.sortBy) {
      case "score":
        orderByClause = sortDesc
          ? desc(qualificationScores.overallScore)
          : asc(qualificationScores.overallScore);
        break;
      case "status":
        orderByClause = sortDesc
          ? desc(intakeSubmissions.status)
          : asc(intakeSubmissions.status);
        break;
      default:
        orderByClause = sortDesc
          ? desc(intakeSubmissions.createdAt)
          : asc(intakeSubmissions.createdAt);
    }

    // Main query with LEFT JOINs
    const cases = await db
      .select({
        id: intakeSubmissions.id,
        clientName: intakeSubmissions.fullName,
        problemType: intakeSubmissions.problemType,
        status: intakeSubmissions.status,
        createdAt: intakeSubmissions.createdAt,
        overallScore: qualificationScores.overallScore,
        legalDomain: caseSummaries.legalDomain,
      })
      .from(intakeSubmissions)
      .leftJoin(qualificationScores, eq(qualificationScores.submissionId, intakeSubmissions.id))
      .leftJoin(caseSummaries, eq(caseSummaries.submissionId, intakeSubmissions.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize);

    // Count query with same conditions
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(intakeSubmissions)
      .leftJoin(qualificationScores, eq(qualificationScores.submissionId, intakeSubmissions.id))
      .leftJoin(caseSummaries, eq(caseSummaries.submissionId, intakeSubmissions.id))
      .where(and(...conditions));

    const total = Number(countResult[0]?.count ?? 0);

    return {
      success: true,
      data: cases,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  } catch (error) {
    console.error("[dashboard] listCasesForLawyer failed:", error);
    return { success: false, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// getCaseDetailForLawyer
// ---------------------------------------------------------------------------

export async function getCaseDetailForLawyer(submissionId: string) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  try {
    // Fetch submission (excluding drafts)
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, submissionId),
        ne(intakeSubmissions.status, "draft"),
      ),
    });

    if (!submission) {
      return { success: false, error: "not_found" };
    }

    // Fetch intelligence + documents + notes + AI follow-ups in parallel
    const [caseSummary, caseTimeline, caseScore, documents, followUps, notes] =
      await Promise.all([
        db.query.caseSummaries.findFirst({
          where: eq(caseSummaries.submissionId, submissionId),
        }),
        db.query.caseTimelines.findFirst({
          where: eq(caseTimelines.submissionId, submissionId),
        }),
        db.query.qualificationScores.findFirst({
          where: eq(qualificationScores.submissionId, submissionId),
        }),
        db
          .select()
          .from(intakeDocuments)
          .where(eq(intakeDocuments.submissionId, submissionId)),
        db
          .select()
          .from(aiFollowUps)
          .where(eq(aiFollowUps.submissionId, submissionId)),
        db
          .select()
          .from(lawyerNotes)
          .where(eq(lawyerNotes.submissionId, submissionId))
          .orderBy(desc(lawyerNotes.createdAt)),
      ]);

    // Build CaseIntelligenceResult (same structure as getCaseIntelligence but without ownership check)
    const intelligence: CaseIntelligenceResult = {
      summary: caseSummary
        ? {
            status: "done" as const,
            clientIdentity: submission.fullName,
            problemType: caseSummary.legalDomain,
            situationSummary: caseSummary.summary,
            keyFacts: safeJsonParse<string[]>(caseSummary.keyFacts, []),
            opposingParties: safeJsonParse<
              Array<{ name: string; role: string }>
            >(caseSummary.parties, []).map((p) => p.name),
            urgencyAssessment: caseSummary.urgencyAssessment,
            version: 1,
            error: null,
            updatedAt: caseSummary.updatedAt,
          }
        : null,
      timeline: caseTimeline
        ? {
            status: "done" as const,
            events: safeJsonParse(caseTimeline.events, []),
            undatedEvents: safeJsonParse(caseTimeline.undatedEvents, []),
            version: 1,
            error: null,
            updatedAt: caseTimeline.updatedAt,
          }
        : null,
      score: caseScore
        ? {
            status: "done" as const,
            overallScore: caseScore.overallScore,
            urgencyScore: caseScore.urgencyScore,
            completenessScore: caseScore.completenessScore,
            complexityScore: caseScore.complexityScore,
            rationale: caseScore.rationale,
            version: 1,
            error: null,
            updatedAt: caseScore.updatedAt,
          }
        : null,
    };

    return {
      success: true,
      data: {
        submission,
        intelligence,
        documents,
        aiFollowUps: followUps,
        notes,
      },
    };
  } catch (error) {
    console.error("[dashboard] getCaseDetailForLawyer failed:", error);
    return { success: false, error: "retrieval_failed" };
  }
}

// ---------------------------------------------------------------------------
// updateCaseStatus
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["submitted", "en_cours", "termine", "archive"] as const;
type CaseStatus = (typeof VALID_STATUSES)[number];

export async function updateCaseStatus(submissionId: string, newStatus: string) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  // Validate newStatus
  if (!VALID_STATUSES.includes(newStatus as CaseStatus)) {
    return { success: false, error: "invalid_status" };
  }

  try {
    // Fetch current status
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, submissionId),
    });

    if (!submission) {
      return { success: false, error: "not_found" };
    }

    // Prevent transition from archive to anything else
    if (submission.status === "archive" && newStatus !== "archive") {
      return { success: false, error: "cannot_unarchive" };
    }

    await db
      .update(intakeSubmissions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(intakeSubmissions.id, submissionId));

    return { success: true };
  } catch (error) {
    console.error("[dashboard] updateCaseStatus failed:", error);
    return { success: false, error: "update_failed" };
  }
}

// ---------------------------------------------------------------------------
// Lawyer Notes CRUD
// ---------------------------------------------------------------------------

export async function addLawyerNote(submissionId: string, content: string) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  try {
    const [note] = await db
      .insert(lawyerNotes)
      .values({
        submissionId,
        lawyerId: authResult.userId,
        content,
      })
      .returning({ id: lawyerNotes.id });

    return { success: true, noteId: note.id };
  } catch (error) {
    console.error("[dashboard] addLawyerNote failed:", error);
    return { success: false, error: "insert_failed" };
  }
}

export async function updateLawyerNote(noteId: string, content: string) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  try {
    // Verify ownership
    const note = await db.query.lawyerNotes.findFirst({
      where: and(
        eq(lawyerNotes.id, noteId),
        eq(lawyerNotes.lawyerId, authResult.userId),
      ),
    });

    if (!note) {
      return { success: false, error: "not_found" };
    }

    await db
      .update(lawyerNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(lawyerNotes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error("[dashboard] updateLawyerNote failed:", error);
    return { success: false, error: "update_failed" };
  }
}

export async function deleteLawyerNote(noteId: string) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  try {
    // Verify ownership
    const note = await db.query.lawyerNotes.findFirst({
      where: and(
        eq(lawyerNotes.id, noteId),
        eq(lawyerNotes.lawyerId, authResult.userId),
      ),
    });

    if (!note) {
      return { success: false, error: "not_found" };
    }

    await db.delete(lawyerNotes).where(eq(lawyerNotes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error("[dashboard] deleteLawyerNote failed:", error);
    return { success: false, error: "delete_failed" };
  }
}

// ---------------------------------------------------------------------------
// regenerateCaseForLawyer
// ---------------------------------------------------------------------------

export async function regenerateCaseForLawyer(submissionId: string) {
  const authResult = await requireAvocat();
  if (!authResult.authorized) {
    return { success: false, error: authResult.error };
  }

  try {
    // Verify submission exists and is not draft
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, submissionId),
        ne(intakeSubmissions.status, "draft"),
      ),
    });

    if (!submission) {
      return { success: false, error: "not_found" };
    }

    return await triggerCaseIntelligence(submissionId);
  } catch (error) {
    console.error("[dashboard] regenerateCaseForLawyer failed:", error);
    return { success: false, error: "regeneration_failed" };
  }
}
