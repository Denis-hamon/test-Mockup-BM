/**
 * POST /api/widget/submit — Handles widget form submissions.
 *
 * Accepts { slug, responses } from the embedded widget, resolves the
 * template by slug, creates a snapshot, and inserts the intake submission.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { intakeTemplates } from "@/lib/db/schema/intake-templates";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { eq, and } from "drizzle-orm";
import { createTemplateSnapshot } from "@/server/actions/template.actions";
import { corsHeaders, handleOptions } from "../cors";

interface WidgetSubmitBody {
  slug: string;
  responses: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WidgetSubmitBody;

    // Validate required fields
    if (!body.slug || !body.responses) {
      return NextResponse.json(
        { error: "missing_required_fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve template by slug
    const template = await db.query.intakeTemplates.findFirst({
      where: and(
        eq(intakeTemplates.slug, body.slug),
        eq(intakeTemplates.isActive, 1)
      ),
    });

    if (!template) {
      return NextResponse.json(
        { error: "template_not_found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create template snapshot
    const snapshotId = await createTemplateSnapshot(template.id);

    // Insert intake submission with widget responses
    const [result] = await db
      .insert(intakeSubmissions)
      .values({
        problemType: template.specialty,
        description: "Widget submission",
        fullName: (body.responses.fullName as string) || "Widget User",
        phone: (body.responses.phone as string) || null,
        preferredContact: "email",
        status: "submitted",
        templateId: template.id,
        templateSnapshotId: snapshotId,
        templateAnswers: JSON.stringify(body.responses),
      })
      .returning({ id: intakeSubmissions.id });

    return NextResponse.json(
      { success: true, id: result.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error("[widget] Submit error:", err);
    return NextResponse.json(
      { error: "submission_failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
