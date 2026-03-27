---
phase: 06-lawyer-dashboard
plan: 01
subsystem: api
tags: [drizzle, server-actions, email, react-email, vitest, dashboard]

# Dependency graph
requires:
  - phase: 05-case-intelligence
    provides: caseSummaries, caseTimelines, qualificationScores schemas and CaseIntelligenceResult type
  - phase: 01-auth-encryption
    provides: users table with role enum, auth() session helper
provides:
  - lawyerProfiles and lawyerNotes Drizzle tables
  - Dashboard server actions (listCasesForLawyer with date/score/status filters, getCaseDetailForLawyer, updateCaseStatus, notes CRUD, regenerateCaseForLawyer)
  - Lawyer settings server actions (getLawyerProfile with auto-create, updateLawyerProfile upsert)
  - NewCaseNotification email template and sendNewCaseNotification helper
  - Extended intake status enum (submitted/en_cours/termine/archive)
affects: [06-02-PLAN, 06-03-PLAN, lawyer-dashboard-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [requireAvocat helper for role-based auth in server actions, safeJsonParse for JSON-encoded columns]

key-files:
  created:
    - apps/web/src/lib/db/schema/lawyer.ts
    - apps/web/src/server/actions/dashboard.actions.ts
    - apps/web/src/server/actions/lawyer-settings.actions.ts
    - packages/email/src/new-case-notification.tsx
    - tests/dashboard/list-cases.test.ts
    - tests/dashboard/case-status.test.ts
    - tests/dashboard/lawyer-settings.test.ts
  modified:
    - apps/web/src/lib/db/schema/intake.ts
    - apps/web/src/lib/db/schema/index.ts
    - packages/email/src/index.ts

key-decisions:
  - "requireAvocat() helper centralizes role=avocat auth check across all dashboard actions"
  - "Status enum replaced assigned/reviewed with en_cours/termine/archive for lawyer workflow"
  - "Archive status is terminal - no transition back from archive"

patterns-established:
  - "requireAvocat pattern: reusable auth guard returning typed authorized/unauthorized result"
  - "Left JOIN pattern for case list: intakeSubmissions LEFT JOIN qualificationScores LEFT JOIN caseSummaries"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 06 Plan 01: Dashboard Data Layer Summary

**Lawyer dashboard server actions with role-based auth, paginated case list (date/score/status filters), case detail with intelligence joins, status workflow (en_cours/termine/archive), notes CRUD, and new-case email notification**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T13:00:18Z
- **Completed:** 2026-03-27T13:06:46Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created lawyerProfiles and lawyerNotes Drizzle tables with full relations
- Built complete dashboard server actions: listCasesForLawyer with 6 filter types (status, specialty, scoreRange, search, dateFrom, dateTo per D-02), getCaseDetailForLawyer with parallel intelligence/documents/notes fetch, updateCaseStatus with archive guard, notes CRUD with ownership verification
- Built lawyer settings actions with auto-create default profile and upsert pattern
- Created NewCaseNotification email template matching existing warm French tone
- Extended intake status enum from assigned/reviewed to en_cours/termine/archive
- All 12 tests passing with real assertions (auth checks, date filter verification, archive prevention, profile auto-creation)

## Task Commits

Each task was committed atomically:

1. **Task 1: DB schemas, status enum extension, and test stubs** - `537db48` (feat)
2. **Task 2: Server actions for dashboard + settings + email template** - `7e70141` (feat)

## Files Created/Modified
- `apps/web/src/lib/db/schema/lawyer.ts` - lawyerProfiles and lawyerNotes tables with relations
- `apps/web/src/lib/db/schema/intake.ts` - Status enum extended to en_cours/termine/archive
- `apps/web/src/lib/db/schema/index.ts` - Barrel export for lawyer schema
- `apps/web/src/server/actions/dashboard.actions.ts` - 7 server actions for lawyer dashboard
- `apps/web/src/server/actions/lawyer-settings.actions.ts` - getLawyerProfile and updateLawyerProfile
- `packages/email/src/new-case-notification.tsx` - New case notification email template
- `packages/email/src/index.ts` - Added NewCaseNotification export and sendNewCaseNotification helper
- `tests/dashboard/list-cases.test.ts` - 6 tests for listCasesForLawyer including date range filter
- `tests/dashboard/case-status.test.ts` - 3 tests for updateCaseStatus including archive guard
- `tests/dashboard/lawyer-settings.test.ts` - 3 tests for profile CRUD including auto-create

## Decisions Made
- Used `requireAvocat()` helper to centralize role-based auth across all dashboard actions (not submission ownership like client-facing actions)
- Replaced old status values (assigned, reviewed) with lawyer workflow values (en_cours, termine, archive) since no production data exists yet
- Made archive status terminal (cannot transition back) per plan specification
- Used left joins for case list query to handle cases without intelligence data yet

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all server actions are fully implemented with real database queries and proper error handling.

## Issues Encountered
- Vitest not installed in node_modules (pnpm install resolved it)
- Mock chain for drizzle select().from().leftJoin().leftJoin().where() required careful setup to handle second leftJoin call returning proper chain

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All server actions ready for UI consumption in plans 06-02 (dashboard layout) and 06-03 (case detail page)
- Email template ready for integration when case submission triggers notification
- Test infrastructure for dashboard tests established

## Self-Check: PASSED
- All 7 created files verified present
- Commits 537db48 and 7e70141 verified in git log

---
*Phase: 06-lawyer-dashboard*
*Completed: 2026-03-27*
