---
phase: 08-intake-templates-customization
plan: 01
subsystem: database, api, ui
tags: [zod, drizzle, jsonb, templates, conditional-logic, server-actions]

# Dependency graph
requires:
  - phase: 06-lawyer-dashboard
    provides: requireAvocat auth pattern, lawyerProfiles schema
  - phase: 02-intake-form
    provides: intakeSubmissions schema, intake server actions
provides:
  - Zod template schema with 6 field types and conditional rules
  - Drizzle intakeTemplates + intakeTemplateSnapshots tables
  - Template CRUD server actions with slug uniqueness
  - 3 specialty seed templates (famille, travail, penal)
  - DynamicField and DynamicStep rendering components
  - Template snapshot mechanism for submission-time preservation
affects: [08-02-PLAN, 08-03-PLAN, widget]

# Tech tracking
tech-stack:
  added: []
  patterns: [jsonb columns for flexible schema storage, template snapshot pattern for form versioning, conditional visibility with recursive source checking]

key-files:
  created:
    - packages/shared/src/schemas/intake-template.ts
    - apps/web/src/lib/db/schema/intake-templates.ts
    - apps/web/src/lib/db/seed/intake-templates.ts
    - apps/web/src/server/actions/template.actions.ts
    - apps/web/src/components/intake/dynamic-field.tsx
    - apps/web/src/components/intake/dynamic-step.tsx
  modified:
    - packages/shared/src/index.ts
    - apps/web/src/lib/db/schema/intake.ts
    - apps/web/src/lib/db/schema/index.ts
    - apps/web/src/lib/db/index.ts
    - apps/web/src/server/actions/intake.actions.ts

key-decisions:
  - "jsonb column type for template schema storage — flexible JSON without separate table per field"
  - "Template snapshot at submission time — preserves exact form structure even if lawyer edits template later"
  - "base-ui Select onValueChange signature accepts (string | null) — adapted handler to filter null values"

patterns-established:
  - "Template snapshot pattern: freeze schema into intakeTemplateSnapshots at submission time"
  - "Conditional visibility with recursive source checking via isQuestionVisible"
  - "Dynamic Zod schema generation from template questions via buildStepSchema"

requirements-completed: [INTK-05, INTK-06]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 08 Plan 01: Template Engine Backend Summary

**Zod template schema with conditional visibility, Drizzle jsonb tables, CRUD server actions, 3 specialty seed templates (18 questions total), and DynamicField/DynamicStep rendering primitives**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T21:56:03Z
- **Completed:** 2026-03-27T22:01:03Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Zod schema with 6 field types (text, textarea, select, date, checkbox, number), conditional rules (equals/notEquals), and two utility functions (buildStepSchema, isQuestionVisible)
- Drizzle intakeTemplates + intakeTemplateSnapshots tables with jsonb schema columns; intakeSubmissions extended with templateId, templateSnapshotId, templateAnswers
- Template CRUD server actions (getTemplateBySlug, getTemplateForLawyer, saveTemplate, checkSlugAvailability, createTemplateSnapshot) with Postgres 23505 slug uniqueness handling
- 3 seed templates: famille (7 questions with conditional ages/regime), travail (6 questions), penal (5 questions)
- DynamicField renders all 6 field types with shadcn/ui base-ui components, a11y attributes, and validation errors
- DynamicStep evaluates conditional visibility reactively via form.watch()

## Task Commits

Each task was committed atomically:

1. **Task 1: Zod template schema + DB tables + seed data** - `eeadf72` (feat)
2. **Task 2: Server actions + dynamic field components + snapshot integration** - `b5ce231` (feat)

## Files Created/Modified
- `packages/shared/src/schemas/intake-template.ts` - Zod schema, types, buildStepSchema, isQuestionVisible
- `packages/shared/src/index.ts` - Added intake-template barrel export
- `apps/web/src/lib/db/schema/intake-templates.ts` - intakeTemplates + intakeTemplateSnapshots Drizzle tables
- `apps/web/src/lib/db/schema/intake.ts` - Added templateId, templateSnapshotId, templateAnswers columns + relations
- `apps/web/src/lib/db/schema/index.ts` - Added intake-templates export
- `apps/web/src/lib/db/index.ts` - Added intakeTemplatesSchema to db drizzle config
- `apps/web/src/lib/db/seed/intake-templates.ts` - 3 specialty seed templates (famille, travail, penal)
- `apps/web/src/server/actions/template.actions.ts` - Template CRUD server actions
- `apps/web/src/server/actions/intake.actions.ts` - Extended submitIntake with template snapshot linkage
- `apps/web/src/components/intake/dynamic-field.tsx` - Single field renderer for all 6 types
- `apps/web/src/components/intake/dynamic-step.tsx` - Step renderer with conditional visibility

## Decisions Made
- Used jsonb column type for template schema storage (flexible JSON, no separate table per field)
- Template snapshot pattern: freeze schema copy at submission time into intakeTemplateSnapshots (D-03)
- Adapted base-ui Select onValueChange to handle nullable string signature (shadcn v4 base-ui pattern)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed base-ui Select onValueChange signature**
- **Found during:** Task 2 (DynamicField component)
- **Issue:** base-ui Select onValueChange provides `(value: string | null, eventDetails)` not `(value: string)`
- **Fix:** Added null check before calling form.setValue
- **Files modified:** apps/web/src/components/intake/dynamic-field.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** b5ce231 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type signature adaptation. No scope creep.

## Issues Encountered
None - pre-existing TypeScript errors in unrelated files (dossiers pages, ai-chat-zone) were not in scope.

## Known Stubs
None - all data layers, server actions, and components are fully functional.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Template schema, DB tables, server actions, and rendering components ready for Plan 02 (lawyer editor UI) and Plan 03 (client-facing dynamic intake)
- Seed templates available for immediate testing
- No blockers

## Self-Check: PASSED

All 6 created files verified present. Both commit hashes (eeadf72, b5ce231) found in git log.

---
*Phase: 08-intake-templates-customization*
*Completed: 2026-03-27*
