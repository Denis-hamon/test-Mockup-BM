---
phase: 07-client-portal
plan: 04
subsystem: ui, email, api
tags: [react-email, cron, appointments, shadcn, react-hook-form, zod, drizzle]

# Dependency graph
requires:
  - phase: 07-01
    provides: appointment server actions, schema, portal actions
  - phase: 07-03
    provides: messaging server actions with SSE
provides:
  - 5 React Email templates (new-message, appointment-request, confirmed, refused, reminder)
  - Appointment page with request form and card components
  - Cron endpoint for J-1/J-0 appointment reminders with dedup
  - Read receipts toggle in lawyer settings
affects: [08-templates]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget email with React Email templates, cron endpoint with CRON_SECRET auth, reminder dedup via reminder_logs table]

key-files:
  created:
    - packages/email/src/templates/new-message-notification.tsx
    - packages/email/src/templates/appointment-request-notification.tsx
    - packages/email/src/templates/appointment-confirmed.tsx
    - packages/email/src/templates/appointment-refused.tsx
    - packages/email/src/templates/appointment-reminder.tsx
    - apps/web/src/app/api/cron/appointment-reminders/route.ts
    - apps/web/src/components/appointments/appointment-status-badge.tsx
    - apps/web/src/components/appointments/appointment-card.tsx
    - apps/web/src/components/appointments/appointment-request-form.tsx
    - apps/web/src/app/(app)/portail/rendez-vous/page.tsx
    - apps/web/src/app/(app)/portail/rendez-vous/appointment-list.tsx
  modified:
    - packages/email/src/index.ts
    - apps/web/src/server/actions/messaging.actions.ts
    - apps/web/src/server/actions/appointment.actions.ts
    - apps/web/src/lib/db/schema/appointments.ts
    - apps/web/src/server/actions/lawyer-settings.actions.ts
    - apps/web/src/app/(app)/settings/cabinet/cabinet-form.tsx
    - apps/web/src/app/(app)/settings/cabinet/page.tsx

key-decisions:
  - "Email templates in packages/email/src/templates/ subdirectory (new convention for plan-04 templates)"
  - "Base UI triggers styled inline instead of asChild (shadcn v4 / Base UI pattern)"
  - "reminderLogs table for cron dedup instead of appointment-level flag"

patterns-established:
  - "React Email template pattern: warm French vouvoiement, LegalConnect branding, security note for messages"
  - "Cron endpoint auth: CRON_SECRET Bearer token validation"
  - "Computed display status: 'passe' derived from confirmedDate < now(), not stored in DB"

requirements-completed: [PORT-04, PORT-01]

# Metrics
duration: 12min
completed: 2026-03-27
---

# Phase 07 Plan 04: Appointment UI, Email Templates, and Reminder Scheduling Summary

**5 React Email templates with warm French tone, appointment request/list page with status badges, cron-based J-1/J-0 reminders with dedup, and lawyer read receipts toggle**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-27T20:46:19Z
- **Completed:** 2026-03-27T20:57:57Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- 5 email templates (new-message, appointment-request, confirmed, refused, reminder) with warm French vouvoiement and LegalConnect branding
- Appointment page with request form (type, dates, slots, notes), status badges per UI-SPEC colors, cancel confirmation dialog
- Cron endpoint /api/cron/appointment-reminders for J-1/J-0 with reminder_logs dedup table
- Server actions upgraded from plain text emails to React Email templates
- Read receipts toggle added to lawyer cabinet settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Email templates + cron reminder endpoint + server action wiring** - `0c2e45b` (feat)
2. **Task 2: Appointment UI + lawyer settings update** - `0a81396` (feat)

## Files Created/Modified
- `packages/email/src/templates/new-message-notification.tsx` - Message notification (NEVER includes content)
- `packages/email/src/templates/appointment-request-notification.tsx` - Lawyer notification for new request
- `packages/email/src/templates/appointment-confirmed.tsx` - Client confirmation with date/type/link
- `packages/email/src/templates/appointment-refused.tsx` - Empathetic refusal with CTA for new request
- `packages/email/src/templates/appointment-reminder.tsx` - J-1/J-0 reminder with visio link or address
- `packages/email/src/index.ts` - 5 new send helpers exported
- `apps/web/src/server/actions/messaging.actions.ts` - sendMessage uses React Email template
- `apps/web/src/server/actions/appointment.actions.ts` - All emails use React Email templates
- `apps/web/src/lib/db/schema/appointments.ts` - Added reminderLogs table + relations
- `apps/web/src/app/api/cron/appointment-reminders/route.ts` - Cron endpoint with CRON_SECRET auth
- `apps/web/src/components/appointments/appointment-status-badge.tsx` - Status badge with UI-SPEC colors
- `apps/web/src/components/appointments/appointment-card.tsx` - Card with cancel dialog, visio link, address
- `apps/web/src/components/appointments/appointment-request-form.tsx` - Form with zod validation, max 3 dates
- `apps/web/src/app/(app)/portail/rendez-vous/page.tsx` - RSC page calling server actions
- `apps/web/src/app/(app)/portail/rendez-vous/appointment-list.tsx` - Client component with upcoming/history sections
- `apps/web/src/server/actions/lawyer-settings.actions.ts` - readReceiptsEnabled in get/update
- `apps/web/src/app/(app)/settings/cabinet/cabinet-form.tsx` - Read receipts Switch toggle
- `apps/web/src/app/(app)/settings/cabinet/page.tsx` - readReceiptsEnabled in fallback profile

## Decisions Made
- Email templates placed in `packages/email/src/templates/` subdirectory to organize plan-04 additions
- Base UI Trigger components styled with inline className instead of asChild (not supported in Base UI / shadcn v4)
- reminderLogs table created for cron dedup instead of adding a flag to appointments table (cleaner, supports multiple reminder types)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Base UI trigger component API mismatch**
- **Found during:** Task 2 (Appointment UI)
- **Issue:** Plan specified `asChild` prop on DialogTrigger/AlertDialogTrigger/PopoverTrigger, but Base UI (shadcn v4) does not support `asChild`
- **Fix:** Applied inline className styling directly to trigger components
- **Files modified:** appointment-list.tsx, appointment-card.tsx, appointment-request-form.tsx
- **Verification:** TypeScript compiles with zero errors in modified files
- **Committed in:** 0a81396 (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed Select onValueChange nullable type**
- **Found during:** Task 2 (Appointment request form)
- **Issue:** Base UI Select `onValueChange` passes `string | null`, but form field expects `string`
- **Fix:** Added null coalescing `val ?? ""`
- **Files modified:** appointment-request-form.tsx
- **Verification:** TypeScript compiles
- **Committed in:** 0a81396 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary due to shadcn v4 / Base UI API differences from plan assumptions. No scope creep.

## Issues Encountered
None beyond the Base UI API deviations noted above.

## User Setup Required
- CRON_SECRET environment variable must be set for the appointment reminder cron endpoint
- External cron scheduler must be configured to call `GET /api/cron/appointment-reminders` twice daily at 08:00 and 09:00 Paris time

## Known Stubs
None - all components are wired to real server actions and data sources.

## Next Phase Readiness
- Phase 07 (client-portal) is now complete with all 4 plans executed
- Messaging, documents, appointments, and email notifications fully functional
- Ready for Phase 08 (templates) or integration testing

---
*Phase: 07-client-portal*
*Completed: 2026-03-27*
