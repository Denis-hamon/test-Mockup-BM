---
phase: 07-client-portal
plan: 01
subsystem: api, database, crypto
tags: [libsodium, crypto_kx, sse, drizzle, server-actions, e2e-encryption, appointments]

# Dependency graph
requires:
  - phase: 01-auth-encryption
    provides: X25519 keypairs (crypto_box_keypair), libsodium-wrappers-sumo, auth system
  - phase: 06-lawyer-dashboard
    provides: lawyerProfiles schema, requireAvocat pattern, dashboard.actions pattern
provides:
  - crypto_kx key exchange module (deriveClientKeys, deriveServerKeys, ConversationKeys)
  - conversations and messages DB schemas with E2E encrypted content storage
  - appointments DB schema with full lifecycle (en_attente -> confirme/refuse/annule)
  - SSE infrastructure (message emitter + Route Handler + client hook)
  - portal server actions (requireClient, requireAuth, dashboard, cases, documents)
  - messaging server actions (conversations CRUD, send with SSE push, read receipts)
  - appointment server actions (request, confirm, refuse, cancel with Zod validation)
affects: [07-02-portal-ui, 07-03-chat-ui, 07-04-appointments-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [crypto_kx key exchange, SSE via Route Handler, cursor-based pagination, fire-and-forget email notifications]

key-files:
  created:
    - packages/crypto/src/key-exchange.ts
    - packages/crypto/src/__tests__/key-exchange.test.ts
    - apps/web/src/lib/db/schema/messaging.ts
    - apps/web/src/lib/db/schema/appointments.ts
    - apps/web/src/lib/sse/message-emitter.ts
    - apps/web/src/app/api/sse/messages/route.ts
    - apps/web/src/hooks/use-sse-messages.ts
    - apps/web/src/server/actions/portal.actions.ts
    - apps/web/src/server/actions/messaging.actions.ts
    - apps/web/src/server/actions/appointment.actions.ts
  modified:
    - packages/crypto/src/index.ts
    - apps/web/src/lib/db/schema/index.ts
    - apps/web/src/lib/db/schema/lawyer.ts
    - apps/web/src/lib/db/index.ts
    - packages/email/src/send.ts

key-decisions:
  - "crypto_kx_client/server_session_keys for per-conversation shared secret derivation from existing X25519 keypairs"
  - "SSE via Next.js Route Handler (not WebSocket/tRPC) for unidirectional server-to-client push"
  - "initiatorId stored in conversation record to determine crypto_kx role assignment"
  - "Cursor-based pagination for messages (50 per page, createdAt cursor)"
  - "Fire-and-forget text-only email notifications (never include message content)"
  - "Jitsi Meet auto-generated links for visio appointments"

patterns-established:
  - "requireClient(): role guard for client-only server actions"
  - "requireAuth(): role-agnostic guard for shared server actions (messaging)"
  - "messageEmitter.emit('user:{id}', event): SSE event routing by user ID"
  - "Tab visibility detection in useSSEMessages hook to manage SSE connections"

requirements-completed: [PORT-01, PORT-02, PORT-03, PORT-04]

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 7 Plan 01: Client Portal Backend Summary

**crypto_kx key exchange, E2E messaging schemas, SSE real-time infrastructure, and full server actions for portal/messaging/appointments**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-27T19:53:40Z
- **Completed:** 2026-03-27T20:01:40Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- crypto_kx key exchange module with 5 passing tests (directional symmetry verified)
- DB schemas for conversations, messages (E2E encrypted), and appointments
- SSE infrastructure: emitter, Route Handler with auth/heartbeat, client hook with reconnect
- 3 server action files: portal (4 actions), messaging (7 actions), appointments (6 actions)
- Zero TypeScript errors in new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Crypto key exchange + DB schemas** - `817bcc2` (test: RED), `cca5c52` (feat: GREEN + schemas)
2. **Task 2: SSE infrastructure + all server actions** - `cad0c75` (feat)

## Files Created/Modified
- `packages/crypto/src/key-exchange.ts` - crypto_kx_client/server_session_keys wrapper
- `packages/crypto/src/__tests__/key-exchange.test.ts` - 5 tests for key exchange
- `packages/crypto/src/index.ts` - Re-export key-exchange
- `apps/web/src/lib/db/schema/messaging.ts` - conversations + messages tables with relations
- `apps/web/src/lib/db/schema/appointments.ts` - appointments table with relations
- `apps/web/src/lib/db/schema/index.ts` - Export messaging + appointments
- `apps/web/src/lib/db/schema/lawyer.ts` - Added readReceiptsEnabled column
- `apps/web/src/lib/db/index.ts` - Added lawyer/messaging/appointments schemas to db instance
- `apps/web/src/lib/sse/message-emitter.ts` - Singleton EventEmitter with typed SSE events
- `apps/web/src/app/api/sse/messages/route.ts` - SSE endpoint with auth + heartbeat
- `apps/web/src/hooks/use-sse-messages.ts` - Client hook with reconnect + tab visibility
- `apps/web/src/server/actions/portal.actions.ts` - requireClient/requireAuth + 4 portal actions
- `apps/web/src/server/actions/messaging.actions.ts` - 7 messaging actions with SSE push
- `apps/web/src/server/actions/appointment.actions.ts` - 6 appointment actions with Zod validation
- `packages/email/src/send.ts` - Extended to support text-only emails

## Decisions Made
- crypto_kx "client" = conversation initiator, "server" = responder (stored via initiatorId)
- SSE over WebSocket: unidirectional push sufficient, no ws server needed
- Cursor-based pagination (createdAt) for messages, 50 per page
- Jitsi Meet links auto-generated for visio appointments when no custom link provided
- Email notifications are fire-and-forget, text-only (never include E2E encrypted content)
- readReceiptsEnabled as integer(0/1) on lawyerProfiles, default 1 (enabled)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added messaging/appointments/lawyer schemas to Drizzle db instance**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `db.query.conversations`, `db.query.appointments`, `db.query.lawyerProfiles` not recognized because schemas not registered in db instance
- **Fix:** Added `lawyerSchema`, `messagingSchema`, `appointmentsSchema` imports to `apps/web/src/lib/db/index.ts`
- **Files modified:** apps/web/src/lib/db/index.ts
- **Verification:** TypeScript compiles without errors in our files
- **Committed in:** cad0c75

**2. [Rule 3 - Blocking] Extended sendEmail to support text-only emails**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `sendEmail` only accepted `react` prop, but messaging/appointment notifications use plain text (no React component needed for "Vous avez un nouveau message")
- **Fix:** Made `react` optional, added `text` parameter to `sendEmail`
- **Files modified:** packages/email/src/send.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** cad0c75

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- Drizzle-kit migration generation skipped (requires remote DB connection) -- schemas are code-complete and will be applied during deployment

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend infrastructure ready for Plan 02 (portal shell UI), Plan 03 (chat UI), Plan 04 (appointments UI)
- Server actions provide all data endpoints the UI plans will consume
- SSE hook ready for real-time chat integration
- DB migration needs to be applied on the development server before testing

## Self-Check: PASSED

All 10 created files verified present. All 3 commit hashes verified in git log.

---
*Phase: 07-client-portal*
*Completed: 2026-03-27*
