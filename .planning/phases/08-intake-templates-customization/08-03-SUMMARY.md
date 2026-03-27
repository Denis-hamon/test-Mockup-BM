---
phase: 08-intake-templates-customization
plan: 03
subsystem: ui, api
tags: [react, next.js, dynamic-forms, zod, react-hook-form, css-variables, branding, co-branding]

# Dependency graph
requires:
  - phase: 08-intake-templates-customization
    provides: Zod template schema, buildStepSchema, isQuestionVisible, DynamicField/DynamicStep components, template server actions
provides:
  - useDynamicIntakeForm hook with per-step dynamic Zod validation and localStorage persistence
  - DynamicStepper component rendering Contact + specialty + Documents steps
  - CobrandingFooter with LegalConnect attribution and encryption badge
  - /intake/[slug] RSC route with lawyer branding via CSS variables
  - Standalone layout without app chrome for public intake
  - Loading skeleton for intake route
affects: [widget, 09-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS custom properties for lawyer branding, standalone layout for public routes, RSC page with client component stepper]

key-files:
  created:
    - apps/web/src/hooks/use-dynamic-intake-form.ts
    - apps/web/src/components/intake/dynamic-stepper.tsx
    - apps/web/src/components/intake/cobranding-footer.tsx
    - apps/web/src/app/intake/[slug]/layout.tsx
    - apps/web/src/app/intake/[slug]/page.tsx
    - apps/web/src/app/intake/[slug]/loading.tsx
  modified: []

key-decisions:
  - "CSS custom properties (--lawyer-accent) for runtime branding without rebuilds"
  - "Standalone layout wrapper (div only) since root layout provides html/body/font/Toaster"
  - "Form type casting (as never) for StepContact/StepDocuments compatibility with dynamic Record<string, unknown> form"

patterns-established:
  - "CSS variables for per-tenant branding: set at container, consumed by child components"
  - "Standalone public route pattern: layout.tsx as div wrapper outside (app) group"
  - "Dynamic form with manual Zod validation (safeParse + setError) instead of zodResolver for per-step schema switching"

requirements-completed: [INTK-05, INTK-06]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 08 Plan 03: Client-Facing Dynamic Intake Summary

**Template-driven /intake/[slug] route with lawyer branding CSS variables, dynamic multi-step form with per-step Zod validation, and co-branding footer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T22:08:06Z
- **Completed:** 2026-03-27T22:11:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- useDynamicIntakeForm hook: dynamic Zod validation per step (Contact/specialty/Documents), localStorage auto-save every 10s, draft restoration, all fields registered at init to prevent data loss on navigation
- DynamicStepper: horizontal stepper with accent color, completed step navigation, conditional field fade transitions, submit flow with templateId for snapshot creation
- /intake/[slug] RSC page: fetches template by slug, applies lawyer branding (logo, accent color, welcome text) via CSS custom properties, 404 handling with user-friendly alert
- CobrandingFooter: "Propulse par LegalConnect" + lock icon encryption badge per D-11
- Standalone layout outside (app) group: no sidebar, no auth, public-facing
- Loading skeleton with stepper + form field placeholders

## Task Commits

Each task was committed atomically:

1. **Task 1: Dynamic intake form hook + DynamicStepper + co-branding** - `65d6ab5` (feat)
2. **Task 2: /intake/[slug] route with standalone layout and lawyer branding** - `fd3a7bf` (feat)

## Files Created/Modified
- `apps/web/src/hooks/use-dynamic-intake-form.ts` - Template-driven form hook with dynamic Zod validation and localStorage persistence
- `apps/web/src/components/intake/dynamic-stepper.tsx` - Multi-step stepper rendering Contact + specialty + Documents with lawyer accent color
- `apps/web/src/components/intake/cobranding-footer.tsx` - "Propulse par LegalConnect" footer with encryption badge
- `apps/web/src/app/intake/[slug]/layout.tsx` - Standalone layout wrapper (no sidebar/auth)
- `apps/web/src/app/intake/[slug]/page.tsx` - RSC page with template fetch, branding CSS variables, 404 handling
- `apps/web/src/app/intake/[slug]/loading.tsx` - Skeleton loading state

## Decisions Made
- Used CSS custom properties (--lawyer-accent, --lawyer-accent-foreground) for runtime branding rather than Tailwind config extension -- allows per-lawyer customization without build-time changes
- Standalone layout is a minimal div wrapper since root layout.tsx already provides html/body/font/Toaster -- avoids duplicate html/body elements
- Used manual Zod safeParse + setError for step validation instead of zodResolver, because the schema changes per step and depends on conditional visibility at validation time

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed slug type mismatch (string | null vs string | undefined)**
- **Found during:** Task 2 (page.tsx branding construction)
- **Issue:** getTemplateBySlug returns slug as `string | null` but BrandingConfig.slug expects `string | undefined`
- **Fix:** Added `?? undefined` coercion on slug assignment
- **Files modified:** apps/web/src/app/intake/[slug]/page.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** fd3a7bf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type coercion. No scope creep.

## Issues Encountered
None - pre-existing TypeScript errors in unrelated files (dossiers, ai-chat-zone, intake-stepper) were not in scope.

## Known Stubs
None - all components are fully functional with real data sources wired.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client-facing intake route complete and connected to template engine from Plan 01
- Plan 02 (lawyer editor UI) can proceed independently -- when a lawyer saves a template with a slug, clients can immediately access /intake/[slug]
- Phase 08 complete when Plan 02 finishes (parallel execution)

## Self-Check: PASSED

All 6 created files verified present. Both commit hashes (65d6ab5, fd3a7bf) found in git log.

---
*Phase: 08-intake-templates-customization*
*Completed: 2026-03-27*
