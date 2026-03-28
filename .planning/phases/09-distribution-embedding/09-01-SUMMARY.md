---
phase: 09-distribution-embedding
plan: 01
subsystem: widget, api
tags: [vite, iife, shadow-dom, cors, react, widget, embeddable]

# Dependency graph
requires:
  - phase: 08-intake-templates-customization
    provides: "intakeTemplates table with slug, schema jsonb, branding fields"
provides:
  - "apps/widget/ package with Vite IIFE build producing widget.js"
  - "Shadow DOM entry point reading data-slug from script tag"
  - "Widget CSS with :host reset and complete form styling"
  - "API routes: /api/widget (bundle), /api/widget/template/[slug], /api/widget/submit"
  - "CORS helper for cross-origin widget embedding"
  - "Luminance utility for contrast-safe accent foreground"
affects: [09-distribution-embedding]

# Tech tracking
tech-stack:
  added: [vite, "@vitejs/plugin-react"]
  patterns: ["IIFE library mode via Vite", "Shadow DOM style isolation with ?inline CSS", "CORS helper shared across widget API routes", "Script src origin derivation for API base URL"]

key-files:
  created:
    - apps/widget/package.json
    - apps/widget/tsconfig.json
    - apps/widget/vite.config.ts
    - apps/widget/src/main.tsx
    - apps/widget/src/lib/config.ts
    - apps/widget/src/lib/api.ts
    - apps/widget/src/lib/luminance.ts
    - apps/widget/src/styles/widget.css
    - apps/web/src/app/api/widget/cors.ts
    - apps/web/src/app/api/widget/route.ts
    - apps/web/src/app/api/widget/template/[slug]/route.ts
    - apps/web/src/app/api/widget/submit/route.ts
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Script src origin derivation for API_BASE -- widget calls back to the server that served it"
  - "CORS headers as shared helper (cors.ts) reused by all three widget API routes"
  - "esbuild minification (not terser) for widget bundle -- simpler, no extra dependency"
  - "Widget submit creates template snapshot for immutable form structure at submission time"

patterns-established:
  - "Shadow DOM widget: attachShadow + ?inline CSS import for total style isolation"
  - "Widget API route pattern: cors.ts helper + handleOptions() for preflight"
  - "document.currentScript capture at top level before any async"

requirements-completed: [DIST-01]

# Metrics
duration: 2min
completed: 2026-03-28
---

# Phase 09 Plan 01: Widget Scaffold & API Routes Summary

**Vite IIFE widget package with Shadow DOM isolation, CSS :host reset, luminance utility, and three Next.js API routes serving bundle/template/submissions with CORS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-28T00:07:00Z
- **Completed:** 2026-03-28T00:09:13Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Widget package builds to single 199KB IIFE bundle (widget.js) with React inlined
- Shadow DOM entry point reads data-slug, data-color, data-position from script tag with safe defaults
- Complete CSS system: :host reset with all:initial, form elements, modal, step dots, mobile responsive, prefers-reduced-motion
- Three API routes with shared CORS headers: bundle serving with cache control, template data by slug, and form submission with template snapshot

## Task Commits

Each task was committed atomically:

1. **Task 1: Widget Vite package scaffold and utilities** - `18d6cf5` (feat)
2. **Task 2: Widget API routes (serve bundle, template data, submit)** - `8a94e61` (feat)

## Files Created/Modified
- `apps/widget/package.json` - @legalconnect/widget package with Vite build scripts
- `apps/widget/tsconfig.json` - ES2020 target, bundler moduleResolution, react-jsx
- `apps/widget/vite.config.ts` - Library mode IIFE build config, cssCodeSplit false
- `apps/widget/src/main.tsx` - IIFE entry: currentScript capture, Shadow DOM, CSS custom properties
- `apps/widget/src/lib/config.ts` - parseConfig reading data-* attributes with defaults
- `apps/widget/src/lib/api.ts` - fetchTemplate and submitWidgetIntake with origin derivation
- `apps/widget/src/lib/luminance.ts` - WCAG 2.1 relative luminance and contrast foreground
- `apps/widget/src/styles/widget.css` - Complete widget CSS: :host reset, modal, forms, animations, mobile
- `apps/web/src/app/api/widget/cors.ts` - Shared CORS headers and OPTIONS handler
- `apps/web/src/app/api/widget/route.ts` - Serves widget.js with cache headers
- `apps/web/src/app/api/widget/template/[slug]/route.ts` - Template data API by slug
- `apps/web/src/app/api/widget/submit/route.ts` - Form submission with template snapshot
- `pnpm-lock.yaml` - Updated with widget dependencies

## Decisions Made
- Script src origin derivation for API_BASE -- the widget calls back to the server that served the bundle, enabling cross-origin embedding
- CORS headers as shared helper (cors.ts) reused by all three widget API routes -- consistent, DRY
- esbuild minification instead of terser -- no extra devDependency, adequate for production
- Widget submit creates template snapshot at submission time -- immutable form structure per D-03

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Widget scaffold ready for 09-02 (UI components: button, modal, intake form, confirmation)
- API routes ready for cross-origin widget embedding
- CSS system complete with all needed classes for widget UI components

## Self-Check: PASSED

- All key files exist (widget package, API routes, dist bundle)
- Commits 18d6cf5 and 8a94e61 verified in git log
- Widget bundle (199KB) builds successfully

---
*Phase: 09-distribution-embedding*
*Completed: 2026-03-28*
