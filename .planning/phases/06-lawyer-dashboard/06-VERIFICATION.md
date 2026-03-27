---
phase: 06-lawyer-dashboard
verified: 2026-03-27T15:26:00Z
status: passed
score: 4/4 success criteria verified
gaps: []
human_verification:
  - test: "Navigate to /dossiers as avocat user, verify table renders with correct layout and responsive breakpoints"
    expected: "Full DataTable on desktop, card layout on mobile, filters visible"
    why_human: "Visual layout, responsive breakpoints, CSS rendering"
  - test: "Select date range via Calendar pickers and verify filtered results"
    expected: "Calendar popover opens, date selection updates URL and filters table"
    why_human: "Interactive component behavior, visual calendar rendering"
  - test: "Open a case at /dossiers/[id], switch between all 4 tabs"
    expected: "Each tab shows its content (synthese, documents, timeline, AI exchanges) without page reload"
    why_human: "Tab switching interaction, content rendering"
  - test: "Change case status via dropdown, verify toast and page refresh"
    expected: "Status updates, toast confirms, page refreshes with new status"
    why_human: "Real-time UI feedback, toast notifications"
  - test: "Submit intake as client, verify lawyer receives email notification"
    expected: "Email sent to lawyers with notifyNewCase=true, containing client name and case URL"
    why_human: "External email delivery, requires running server and email service"
---

# Phase 6: Lawyer Dashboard Verification Report

**Phase Goal:** Lawyers can view, filter, and review all incoming case requests with full AI-generated case files and configure their practice settings
**Verified:** 2026-03-27T15:26:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Lawyer sees all incoming requests in a list view and can filter by status and specialty | VERIFIED | `/dossiers/page.tsx` calls `listCasesForLawyer` with status, specialty, score, date, search filters. `CaseFilters` renders Select dropdowns, Calendar date pickers, debounced search. `CaseDataTable` renders table rows with ScoreBadge, StatusBadge. All server-side via URL searchParams. |
| 2 | Lawyer receives email notifications for new cases, messages, and appointment requests | VERIFIED | `intake.actions.ts` imports `sendNewCaseNotification` and fires it (void IIFE, non-blocking) after intake submission. Queries lawyers with `notifyNewCase=1`. `NewCaseNotification` email template renders client name, problem type, date, case URL. Message/appointment notifications are Phase 7 scope. |
| 3 | Lawyer can open a complete case file showing AI summary, uploaded documents, timeline, and qualification score | VERIFIED | `/dossiers/[id]/page.tsx` calls `getCaseDetailForLawyer` which fetches in parallel: caseSummary, caseTimeline, caseScore, documents, aiFollowUps, lawyerNotes. `CaseTabs` renders 4 tabs: synthese (AI summary + keyFacts + opposingParties + urgency + regenerate), documents (grid with file cards), timeline (vertical with date markers), AI exchanges (conversation bubbles). |
| 4 | Lawyer can configure their available specialties and practice areas | VERIFIED | `/settings/cabinet/page.tsx` calls `getLawyerProfile` (auto-creates default). `CabinetSettingsForm` renders 3 cards: profile (firmName, phone), specialties (6 checkboxes via `SpecialtySelector`), notifications (2 switches via `NotificationSettings`). Save calls `updateLawyerProfile` with upsert logic. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/lib/db/schema/lawyer.ts` | lawyerProfiles and lawyerNotes tables | VERIFIED | 58 lines, 2 tables with relations, proper FK references |
| `apps/web/src/server/actions/dashboard.actions.ts` | listCasesForLawyer, getCaseDetailForLawyer, updateCaseStatus, notes CRUD | VERIFIED | 450 lines, 7 server actions, role-based auth via requireAvocat, LEFT JOIN queries, date range filters |
| `apps/web/src/server/actions/lawyer-settings.actions.ts` | getLawyerProfile, updateLawyerProfile | VERIFIED | 140 lines, auto-create default profile, upsert pattern, JSON serialization |
| `packages/email/src/new-case-notification.tsx` | Email template for new case | VERIFIED | 138 lines, full React Email component with styles, French copy, CTA button |
| `apps/web/src/app/(app)/dossiers/page.tsx` | Case list page | VERIFIED | 83 lines, RSC, auth guard, calls listCasesForLawyer, renders CaseFilters + CaseDataTable |
| `apps/web/src/app/(app)/dossiers/[id]/page.tsx` | Case detail page | VERIFIED | 44 lines, RSC, auth guard, calls getCaseDetailForLawyer, renders Header + Tabs + Notes |
| `apps/web/src/components/dashboard/case-data-table.tsx` | DataTable with sorting/pagination | VERIFIED | Exists, renders table with clickable rows, pagination |
| `apps/web/src/components/dashboard/case-filters.tsx` | Filter bar with status, score, date, search | VERIFIED | 291 lines, Calendar+Popover date pickers, Select dropdowns, debounced search, mobile Sheet |
| `apps/web/src/components/dashboard/tab-synthese.tsx` | AI summary tab with regeneration | VERIFIED | 114 lines, renders summary/keyFacts/opposingParties/urgency, regenerate button calls regenerateCaseForLawyer |
| `apps/web/src/components/dashboard/tab-documents.tsx` | Documents grid | VERIFIED | File cards with metadata. Download button disabled (S3 presigned URL deferred -- INFO, not a blocker) |
| `apps/web/src/components/dashboard/tab-timeline.tsx` | Timeline visualization | VERIFIED | Exists, renders events with date markers |
| `apps/web/src/components/dashboard/tab-echanges-ia.tsx` | AI exchanges conversation view | VERIFIED | Exists, renders Q&A pairs as bubbles |
| `apps/web/src/components/dashboard/internal-notes.tsx` | Notes CRUD | VERIFIED | 222 lines, add/edit/delete with AlertDialog confirmation, toast feedback |
| `apps/web/src/components/dashboard/status-dropdown.tsx` | Status transition dropdown | VERIFIED | 136 lines, forward-only transitions, archive confirmation dialog, calls updateCaseStatus |
| `apps/web/src/components/dashboard/score-badge.tsx` | Score badge with 3 ranges | VERIFIED | Exists, faible/moyen/eleve with color coding |
| `apps/web/src/components/dashboard/status-badge.tsx` | Status badge with French labels | VERIFIED | Exists, maps DB values to French labels |
| `apps/web/src/app/(app)/settings/cabinet/page.tsx` | Settings page | VERIFIED | 31 lines, RSC, auth guard, calls getLawyerProfile |
| `apps/web/src/app/(app)/settings/cabinet/cabinet-form.tsx` | Settings form | VERIFIED | Exists, 3 cards: profile, specialties, notifications |
| `apps/web/src/components/dashboard/specialty-selector.tsx` | Specialty checkboxes | VERIFIED | Exists, 6 legal specialties |
| `apps/web/src/components/dashboard/notification-settings.tsx` | Notification toggles | VERIFIED | Exists, 2 Switch components |
| `tests/dashboard/list-cases.test.ts` | Tests for listCasesForLawyer | VERIFIED | 6 tests, real assertions (auth check, date filter gte/lte verification, ilike search) |
| `tests/dashboard/case-status.test.ts` | Tests for updateCaseStatus | VERIFIED | 3 tests (auth, forward transition, archive guard) |
| `tests/dashboard/lawyer-settings.test.ts` | Tests for profile CRUD | VERIFIED | 3 tests (auto-create, parsed specialties, upsert) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| dossiers/page.tsx | dashboard.actions.ts | `import listCasesForLawyer` | WIRED | Line 3: direct import, called with all filter params |
| dossiers/[id]/page.tsx | dashboard.actions.ts | `import getCaseDetailForLawyer` | WIRED | Line 3: direct import, called with submission id |
| status-dropdown.tsx | dashboard.actions.ts | `import updateCaseStatus` | WIRED | Line 7: direct import, called on status change |
| tab-synthese.tsx | dashboard.actions.ts | `import regenerateCaseForLawyer` | WIRED | Line 7: direct import, called on regenerate click |
| internal-notes.tsx | dashboard.actions.ts | `import addLawyerNote, updateLawyerNote, deleteLawyerNote` | WIRED | Lines 8-11: all 3 imported and called |
| settings/cabinet/page.tsx | lawyer-settings.actions.ts | `import getLawyerProfile` | WIRED | Line 3: direct import, called on page load |
| dashboard.actions.ts | schema/lawyer.ts | `import lawyerNotes` | WIRED | Line 22: used in getCaseDetailForLawyer and notes CRUD |
| dashboard.actions.ts | schema/case-intelligence.ts | leftJoin qualificationScores | WIRED | Lines 151-152: LEFT JOIN on submissionId for scores and summaries |
| packages/email/src/index.ts | new-case-notification.tsx | export + sendNewCaseNotification | WIRED | Lines 7, 13, 51-66: import, re-export, and helper function |
| intake.actions.ts | email/index.ts | sendNewCaseNotification | WIRED | Line 9: imported, line 55: called in fire-and-forget IIFE |
| schema/index.ts | schema/lawyer.ts | `export * from "./lawyer"` | WIRED | Line 6: barrel export present |
| settings/layout.tsx | settings/cabinet | Cabinet nav link | WIRED | Line 4: `{ href: "/settings/cabinet", label: "Cabinet" }` |
| app layout.tsx | /dossiers | Dossiers nav link | WIRED | Line 29: "Dossiers" link rendered |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| dossiers/page.tsx | result.data | listCasesForLawyer -> db.select with LEFT JOINs | DB query with conditions | FLOWING |
| dossiers/[id]/page.tsx | result.data | getCaseDetailForLawyer -> Promise.all(6 DB queries) | DB queries on submissionId | FLOWING |
| settings/cabinet/page.tsx | result.profile | getLawyerProfile -> db.query.lawyerProfiles.findFirst | DB query or auto-insert | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Dashboard tests pass | `npx vitest run tests/dashboard/` | 12/12 passed (250ms) | PASS |
| listCasesForLawyer date filter verified | gte/lte called in test | expect(gte).toHaveBeenCalled() passes | PASS |
| Archive guard verified | updateCaseStatus test | archive->en_cours returns error | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DASH-01 | 06-01, 06-02 | Lawyer views all incoming requests with filters by status and specialty | SATISFIED | listCasesForLawyer with 6 filter types, CaseDataTable, CaseFilters, /dossiers page |
| DASH-02 | 06-01, 06-03 | Lawyer receives email notifications for new cases, messages, and appointment requests | SATISFIED | NewCaseNotification template, sendNewCaseNotification helper, fire-and-forget wiring in intake.actions.ts. Note: message/appointment notifications are Phase 7 scope. |
| DASH-03 | 06-01, 06-03 | Lawyer can review complete case file (AI summary, documents, timeline, qualification score) | SATISFIED | getCaseDetailForLawyer fetches all intelligence in parallel. 4-tab UI renders each section. InternalNotes allows annotations. |
| DASH-04 | 06-01, 06-03 | Lawyer configures available specialties and practice areas | SATISFIED | lawyerProfiles schema, getLawyerProfile (auto-create), updateLawyerProfile (upsert), /settings/cabinet page with SpecialtySelector and NotificationSettings |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| tab-documents.tsx | 55 | TODO: Wire download via presigned S3 URL | INFO | Download button disabled. Expected -- S3 presigned URL integration is a future phase concern. Does not block DASH-03 (viewing documents metadata is functional). |

No blocker or warning-level anti-patterns found. All server actions are fully implemented with real DB queries. No placeholder returns, no `expect(true).toBe(true)` stubs in tests. No hardcoded empty data flowing to rendering.

### Human Verification Required

### 1. Case List Page Visual Layout
**Test:** Navigate to /dossiers as an avocat user
**Expected:** Full DataTable with client name, type, score badge, status badge, date columns. Responsive: cards on mobile, full table on desktop. Filters inline on desktop, Sheet on mobile.
**Why human:** Visual layout, responsive breakpoints, CSS rendering quality

### 2. Date Range Filter Interaction
**Test:** Click "Du" and "Au" date pickers, select date range
**Expected:** Calendar popover opens, date selection updates URL params (dateFrom/dateTo), table re-renders with filtered results
**Why human:** Interactive Calendar component behavior

### 3. Case Detail Tabs
**Test:** Open a case at /dossiers/[id], click each of the 4 tabs
**Expected:** Each tab shows its content without page reload. Synthese shows AI summary with regenerate button. Documents shows file cards. Timeline shows chronological events. AI Exchanges shows conversation bubbles.
**Why human:** Tab switching, content rendering, regeneration interaction

### 4. Status Dropdown and Archive Confirmation
**Test:** Change case status via dropdown. Try archiving -- confirm the AlertDialog appears.
**Expected:** Status updates with toast feedback, archive shows confirmation dialog
**Why human:** Interactive dropdown behavior, dialog rendering

### 5. Email Notification Delivery
**Test:** Submit intake form as client, check if lawyers receive email
**Expected:** Lawyers with notifyNewCase=true receive email with client name, problem type, case URL
**Why human:** Requires running server, email service, and real email delivery

### Gaps Summary

No gaps found. All 4 success criteria from the ROADMAP are verified at the code level:

1. **Case list with filters** -- Complete server actions with 6 filter types (status, specialty, score range, date range, search), paginated DataTable UI, responsive layout.
2. **Email notifications** -- Template created, helper function exported, fire-and-forget wiring in intake submission. Message/appointment notifications are Phase 7 scope (not Phase 6).
3. **Complete case file review** -- 4-tab detail page with parallel data loading, internal notes CRUD, status transitions, AI regeneration.
4. **Practice settings** -- Specialty selector (6 legal domains), notification toggles, auto-create profile, upsert pattern.

The only notable item is the disabled download button in the documents tab (S3 presigned URL deferred), which is explicitly expected and does not block the DASH-03 requirement (viewing document metadata is functional).

---

_Verified: 2026-03-27T15:26:00Z_
_Verifier: Claude (gsd-verifier)_
