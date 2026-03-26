---
phase: 02-intake-form-trust-ux
plan: 04
status: complete
started: 2026-03-26T14:10:00Z
completed: 2026-03-26T14:15:00Z
duration: 5min
gap_closure: true
---

# Plan 02-04: Intake Stepper Wiring Fix

## What Was Done

Rewrote `intake-stepper.tsx` (the only file modified) to reconnect all orphaned Phase 2 components that were disconnected during a parallel worktree merge conflict.

## Key Changes

- Replaced inline `useForm()` with `useIntakeForm()` hook (localStorage auto-save, per-step validation, draft restoration)
- Wired all 4 step components: StepProblemType (step 0), StepDescription (step 1), StepDocuments (step 2), StepContact (step 3)
- Added `<Progress>` bar and `<Badge>` step indicators with completed/current/upcoming states
- Rendered `<TrustBanner>` on step 0 for SECU-03 coverage
- Added draft restoration `<Alert>` when `hasDraft` is true
- Added storage full warning when `storageFull` is true
- Wired `handleSubmit` to call `submitIntake` server action with full form validation
- Added success and error states post-submission
- All text uses `useTranslations('intake')` — zero hardcoded French strings

## Gaps Closed

| Gap | Before | After |
|-----|--------|-------|
| Multi-step form (INTK-01) | FAILED — placeholder text divs | All 4 step components rendered with validation |
| Trust indicators (SECU-03) | PARTIAL — TrustBanner orphaned | TrustBanner rendered on step 0 |

## Key Files

### Created
None

### Modified
- `apps/web/src/components/intake/intake-stepper.tsx` — Full rewrite (174 lines)

## Self-Check: PASSED

All acceptance criteria verified:
- All 4 step components imported and rendered
- useIntakeForm hook used (no inline useForm)
- TrustBanner rendered on step 0
- Progress bar and Badge indicators present
- submitIntake wired in handleSubmit
- useTranslations used for all text
- No hardcoded French strings remain

## Commits

- `f21e597` fix(02-04): rewrite intake-stepper to wire all orphaned Phase 2 components
