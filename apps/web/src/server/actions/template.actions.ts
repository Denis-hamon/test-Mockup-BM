"use server";

/**
 * Server actions for intake template CRUD.
 *
 * Authorization: most actions require role === "avocat".
 * Public actions: getTemplateBySlug, getSpecialtyTemplates.
 */

import { db } from "@/lib/db";
import {
  intakeTemplates,
  intakeTemplateSnapshots,
} from "@/lib/db/schema/intake-templates";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  intakeTemplateSchema,
  type IntakeTemplate,
} from "@legalconnect/shared";
import { seedTemplates } from "@/lib/db/seed/intake-templates";

// ---------------------------------------------------------------------------
// Auth helper (same pattern as lawyer-settings.actions.ts)
// ---------------------------------------------------------------------------

async function requireAvocat() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("not_authenticated");
  }
  if (session.user.role !== "avocat") {
    throw new Error("unauthorized");
  }
  return session;
}

// ---------------------------------------------------------------------------
// getSpecialtyTemplates — public, returns seed template summaries
// ---------------------------------------------------------------------------

export async function getSpecialtyTemplates() {
  return seedTemplates.map((st) => ({
    specialty: st.specialty,
    label:
      st.specialty === "famille"
        ? "Droit de la famille"
        : st.specialty === "travail"
          ? "Droit du travail"
          : "Droit penal",
    questionCount: st.template.steps.reduce(
      (sum, step) => sum + step.questions.length,
      0
    ),
  }));
}

// ---------------------------------------------------------------------------
// getTemplateForLawyer — requires avocat
// ---------------------------------------------------------------------------

export async function getTemplateForLawyer() {
  try {
    const session = await requireAvocat();

    const template = await db.query.intakeTemplates.findFirst({
      where: and(
        eq(intakeTemplates.lawyerId, session.user.id),
        eq(intakeTemplates.isActive, 1)
      ),
    });

    return { success: true, template: template ?? null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "retrieval_failed";
    return { success: false, error: message, template: null };
  }
}

// ---------------------------------------------------------------------------
// getTemplateBySlug — public (used by /intake/[slug])
// ---------------------------------------------------------------------------

export async function getTemplateBySlug(slug: string) {
  try {
    const template = await db.query.intakeTemplates.findFirst({
      where: and(
        eq(intakeTemplates.slug, slug),
        eq(intakeTemplates.isActive, 1)
      ),
    });

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      specialty: template.specialty,
      schema: template.schema as IntakeTemplate,
      logoUrl: template.logoUrl,
      accentColor: template.accentColor,
      welcomeText: template.welcomeText,
      slug: template.slug,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// saveTemplate — requires avocat, upsert with slug uniqueness
// ---------------------------------------------------------------------------

export async function saveTemplate(data: {
  specialty: string;
  schema: IntakeTemplate;
  logoUrl?: string;
  accentColor?: string;
  welcomeText?: string;
  slug?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requireAvocat();

    // Validate schema against Zod
    intakeTemplateSchema.parse(data.schema);

    // Check if lawyer already has a template
    const existing = await db.query.intakeTemplates.findFirst({
      where: and(
        eq(intakeTemplates.lawyerId, session.user.id),
        eq(intakeTemplates.isActive, 1)
      ),
    });

    if (existing) {
      // UPDATE existing template
      await db
        .update(intakeTemplates)
        .set({
          specialty: data.specialty,
          schema: data.schema,
          logoUrl: data.logoUrl ?? null,
          accentColor: data.accentColor ?? null,
          welcomeText: data.welcomeText ?? null,
          slug: data.slug ?? null,
          updatedAt: new Date(),
        })
        .where(eq(intakeTemplates.id, existing.id));

      return { success: true, id: existing.id };
    } else {
      // INSERT new template
      const [result] = await db
        .insert(intakeTemplates)
        .values({
          lawyerId: session.user.id,
          specialty: data.specialty,
          schema: data.schema,
          logoUrl: data.logoUrl ?? null,
          accentColor: data.accentColor ?? null,
          welcomeText: data.welcomeText ?? null,
          slug: data.slug ?? null,
          isActive: 1,
        })
        .returning({ id: intakeTemplates.id });

      return { success: true, id: result.id };
    }
  } catch (error) {
    // Handle Postgres unique constraint violation on slug
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return { success: false, error: "slug_taken" };
    }
    const message = error instanceof Error ? error.message : "save_failed";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// checkSlugAvailability — requires avocat
// ---------------------------------------------------------------------------

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean }> {
  try {
    const session = await requireAvocat();

    const existing = await db.query.intakeTemplates.findFirst({
      where: and(
        eq(intakeTemplates.slug, slug),
        ne(intakeTemplates.lawyerId, session.user.id)
      ),
    });

    return { available: !existing };
  } catch {
    return { available: false };
  }
}

// ---------------------------------------------------------------------------
// createTemplateSnapshot — internal helper (not a server action)
// ---------------------------------------------------------------------------

export async function createTemplateSnapshot(
  templateId: string
): Promise<string> {
  const template = await db.query.intakeTemplates.findFirst({
    where: eq(intakeTemplates.id, templateId),
  });

  if (!template) {
    throw new Error("template_not_found");
  }

  const [snapshot] = await db
    .insert(intakeTemplateSnapshots)
    .values({
      templateId,
      schema: template.schema,
    })
    .returning({ id: intakeTemplateSnapshots.id });

  return snapshot.id;
}
