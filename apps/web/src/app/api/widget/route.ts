/**
 * GET /api/widget — Serves the compiled widget.js bundle.
 *
 * Reads the IIFE bundle from apps/widget/dist/widget.js and returns it
 * with appropriate Content-Type, CORS, and cache headers.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { corsHeaders, handleOptions } from "./cors";

export async function GET(request: NextRequest) {
  try {
    // Resolve widget bundle path relative to project root
    const widgetPath = join(process.cwd(), "..", "widget", "dist", "widget.js");
    const bundle = await readFile(widgetPath, "utf-8");

    // Determine cache strategy: immutable if versioned, else short-lived
    const url = new URL(request.url);
    const hasVersion = url.searchParams.has("v");
    const cacheControl = hasVersion
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600";

    return new NextResponse(bundle, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": cacheControl,
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[widget] Failed to serve widget.js:", err);
    return NextResponse.json(
      { error: "widget_bundle_not_found" },
      { status: 404, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
