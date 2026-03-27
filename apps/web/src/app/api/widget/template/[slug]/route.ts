/**
 * GET /api/widget/template/[slug] — Returns template data by slug.
 *
 * Public endpoint for the embeddable widget to fetch its form schema.
 * Queries the database directly (not via server action) for API route context.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { intakeTemplates } from "@/lib/db/schema/intake-templates";
import { eq, and } from "drizzle-orm";
import { corsHeaders, handleOptions } from "../../cors";
import type { IntakeTemplate } from "@legalconnect/shared";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const template = await db.query.intakeTemplates.findFirst({
      where: and(
        eq(intakeTemplates.slug, slug),
        eq(intakeTemplates.isActive, 1)
      ),
    });

    if (!template) {
      return NextResponse.json(
        { error: "template_not_found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        id: template.id,
        specialty: template.specialty,
        schema: template.schema as IntakeTemplate,
        logoUrl: template.logoUrl,
        accentColor: template.accentColor,
        welcomeText: template.welcomeText,
        slug: template.slug,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("[widget] Template fetch error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
