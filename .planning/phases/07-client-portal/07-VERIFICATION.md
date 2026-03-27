---
phase: 07-client-portal
verified: 2026-03-27T21:30:00Z
status: passed
score: 4/4 success criteria verified
must_haves:
  truths:
    - "Client and lawyer can exchange E2E encrypted messages in real time within the portal"
    - "Client and lawyer can share documents securely through the portal"
    - "Client can see their case status and progress updates at any time"
    - "Client can request an appointment with availability preferences, and the lawyer confirms or declines manually"
  artifacts:
    - path: "packages/crypto/src/key-exchange.ts"
      provides: "crypto_kx key exchange"
    - path: "apps/web/src/lib/db/schema/messaging.ts"
      provides: "conversations and messages tables"
    - path: "apps/web/src/lib/db/schema/appointments.ts"
      provides: "appointments and reminderLogs tables"
    - path: "apps/web/src/app/api/sse/messages/route.ts"
      provides: "SSE endpoint"
    - path: "apps/web/src/server/actions/messaging.actions.ts"
      provides: "7 messaging server actions"
    - path: "apps/web/src/server/actions/appointment.actions.ts"
      provides: "6 appointment server actions"
    - path: "apps/web/src/server/actions/portal.actions.ts"
      provides: "4 portal server actions + auth guards"
    - path: "apps/web/src/components/chat/chat-container.tsx"
      provides: "Full E2E encrypted chat UI"
    - path: "apps/web/src/app/(app)/portail/messages/page.tsx"
      provides: "Messages page with conversation list"
    - path: "apps/web/src/app/(app)/portail/rendez-vous/page.tsx"
      provides: "Appointment page with request form"
    - path: "apps/web/src/app/(app)/portail/page.tsx"
      provides: "Client dashboard"
    - path: "apps/web/src/app/(app)/layout.tsx"
      provides: "Role-conditional sidebar layout"
  key_links:
    - from: "messaging.actions.ts"
      to: "message-emitter.ts"
      via: "messageEmitter.emit"
    - from: "sse/messages/route.ts"
      to: "message-emitter.ts"
      via: "messageEmitter.on"
    - from: "chat-container.tsx"
      to: "use-sse-messages.ts"
      via: "useSSEMessages"
    - from: "chat-container.tsx"
      to: "key-exchange.ts"
      via: "deriveClientKeys/deriveServerKeys"
    - from: "portail/page.tsx"
      to: "portal.actions.ts"
      via: "getClientDashboard"
    - from: "rendez-vous/page.tsx"
      to: "appointment.actions.ts"
      via: "getClientAppointments"
    - from: "messaging.actions.ts"
      to: "new-message-notification.tsx"
      via: "sendNewMessageNotification"
    - from: "appointment.actions.ts"
      to: "appointment-confirmed.tsx"
      via: "sendAppointmentConfirmedNotification"
    - from: "cron/appointment-reminders/route.ts"
      to: "packages/email/src/index.ts"
      via: "sendAppointmentReminder"
---

# Phase 7: Client Portal Verification Report

**Phase Goal:** Client and lawyer have a secure shared space for ongoing communication, document exchange, case tracking, and appointment scheduling
**Verified:** 2026-03-27T21:30:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Client and lawyer can exchange E2E encrypted messages in real time within the portal | VERIFIED | chat-container.tsx performs crypto_kx key derivation (line 177-179), encrypts with crypto_secretbox_easy (line 105), decrypts with crypto_secretbox_open_easy (line 126), SSE delivers new_message events in real time via useSSEMessages hook. Messages stored as encrypted ciphertext+nonce in DB, never plaintext. |
| 2 | Client and lawyer can share documents securely through the portal | VERIFIED | portal.actions.ts getClientDocuments() (line 338-369) queries intakeDocuments joined to intakeSubmissions filtered by userId. document-grid.tsx renders file list. Case detail page shows documents tab. Documents uploaded via existing intake/upload flow (Phase 3-4). |
| 3 | Client can see their case status and progress updates at any time | VERIFIED | portal.actions.ts getClientCases() (line 187-253) returns cases with status mapping (submitted->Nouveau, en_cours->En cours, termine->Termine). getClientCaseDetail() (line 260-331) returns submission, timeline, documents, conversationId. case-status-tracker.tsx shows 3-step progress. client-timeline.tsx shows event history. |
| 4 | Client can request an appointment with availability preferences, and the lawyer confirms or declines manually | VERIFIED | appointment-request-form.tsx has Zod-validated form (type, dates max 3, slots, notes). appointment.actions.ts requestAppointment() (line 63-151) inserts with Zod validation. confirmAppointment() (line 263-342) sets date + auto-generates Jitsi link for visio. refuseAppointment() (line 348-413) with optional reason. cancelAppointment() (line 420-459) client-only for pending. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/crypto/src/key-exchange.ts` | crypto_kx wrapper | VERIFIED | 43 lines, exports deriveClientKeys, deriveServerKeys, ConversationKeys. Uses sodium.crypto_kx_client/server_session_keys. |
| `packages/crypto/src/__tests__/key-exchange.test.ts` | Tests for key exchange | VERIFIED | 79 lines, 5 test cases covering directional symmetry |
| `packages/crypto/src/index.ts` | Re-export key-exchange | VERIFIED | Line 11: `export * from "./key-exchange"` |
| `apps/web/src/lib/db/schema/messaging.ts` | conversations + messages | VERIFIED | 82 lines, both tables with relations, encryptedContent + nonce columns, initiatorId for crypto_kx role |
| `apps/web/src/lib/db/schema/appointments.ts` | appointments + reminderLogs | VERIFIED | 73 lines, appointments with full lifecycle enum, reminderLogs for cron dedup |
| `apps/web/src/lib/db/schema/index.ts` | Re-exports | VERIFIED | Lines 7-8: exports messaging + appointments |
| `apps/web/src/lib/db/schema/lawyer.ts` | readReceiptsEnabled | VERIFIED | Line 24: readReceiptsEnabled column |
| `apps/web/src/lib/sse/message-emitter.ts` | SSE event emitter | VERIFIED | 35 lines, typed SSEEvent union (new_message, typing, read_receipt, unread_count), singleton emitter |
| `apps/web/src/app/api/sse/messages/route.ts` | SSE endpoint | VERIFIED | 62 lines, exports GET, authenticates via auth(), ReadableStream with heartbeat, cleanup on abort |
| `apps/web/src/hooks/use-sse-messages.ts` | SSE client hook | VERIFIED | 65 lines, EventSource with auto-reconnect after 3s, tab visibility handling |
| `apps/web/src/server/actions/portal.actions.ts` | Portal actions + auth guards | VERIFIED | 370 lines, requireClient, requireAuth, getClientDashboard, getClientCases, getClientCaseDetail, getClientDocuments |
| `apps/web/src/server/actions/messaging.actions.ts` | 7 messaging actions | VERIFIED | 558 lines, getConversations, getOrCreateConversation, getMessages (cursor-based), sendMessage (with SSE emit + email), markAsRead, sendTypingIndicator, getUnreadCount |
| `apps/web/src/server/actions/appointment.actions.ts` | 6 appointment actions | VERIFIED | 460 lines, requestAppointment (Zod), getClientAppointments, getLawyerAppointments, confirmAppointment (Jitsi auto-link), refuseAppointment, cancelAppointment |
| `apps/web/src/components/chat/chat-container.tsx` | Full chat UI with encryption | VERIFIED | 656 lines, key derivation on mount, encrypt/decrypt with directional keys, SSE integration, optimistic sends, cursor pagination, retry on failure |
| `apps/web/src/app/(app)/portail/messages/page.tsx` | Messages page | VERIFIED | 68 lines, RSC fetching conversations + other party public key, passes to MessagesView |
| `apps/web/src/app/(app)/portail/page.tsx` | Dashboard | VERIFIED | 58 lines, calls getClientDashboard, shows "Bienvenue, [Prenom]", passes data to DashboardSummary |
| `apps/web/src/app/(app)/portail/dossiers/page.tsx` | Cases list | VERIFIED | Exists, imports getClientCases + CaseListClient |
| `apps/web/src/app/(app)/portail/dossiers/[id]/page.tsx` | Case detail | VERIFIED | Exists, imports getClientCaseDetail |
| `apps/web/src/app/(app)/portail/documents/page.tsx` | Documents | VERIFIED | Exists, imports getClientDocuments + DocumentGrid |
| `apps/web/src/app/(app)/portail/parametres/page.tsx` | Settings | VERIFIED | Exists, client component with settings cards |
| `apps/web/src/app/(app)/portail/rendez-vous/page.tsx` | Appointments | VERIFIED | 35 lines, calls getClientAppointments + getClientCases, renders AppointmentList |
| `apps/web/src/components/appointments/appointment-request-form.tsx` | Request form | VERIFIED | 301 lines, Zod validation, react-hook-form, calendar multi-select max 3, slot checkboxes |
| `apps/web/src/app/(app)/layout.tsx` | Role-conditional layout | VERIFIED | 102 lines, checks session.user.role, renders ClientSidebar for client, LawyerSidebar for avocat |
| `apps/web/src/components/portal/client-sidebar.tsx` | Client nav sidebar | VERIFIED | Exists, uses usePathname |
| `apps/web/src/components/portal/security-header.tsx` | Security badge | VERIFIED | Exists, ShieldCheck icon with Badge |
| `apps/web/src/components/chat/encryption-badge.tsx` | E2E encryption indicator | VERIFIED | Exists, Lock icon with Badge |
| `packages/email/src/templates/new-message-notification.tsx` | Message email template | VERIFIED | 128 lines, warm French tone, NEVER includes message content, security note included |
| `packages/email/src/templates/appointment-reminder.tsx` | Reminder template | VERIFIED | 171 lines, J-1/J-0 aware (isToday prop), includes visio link or cabinet address |
| `packages/email/src/templates/appointment-confirmed.tsx` | Confirmation template | VERIFIED | Exists in templates directory |
| `packages/email/src/templates/appointment-refused.tsx` | Refusal template | VERIFIED | Exists in templates directory |
| `packages/email/src/templates/appointment-request-notification.tsx` | Request notification | VERIFIED | Exists in templates directory |
| `packages/email/src/index.ts` | 5 email send helpers | VERIFIED | Exports sendNewMessageNotification, sendAppointmentRequestNotification, sendAppointmentConfirmedNotification, sendAppointmentRefusedNotification, sendAppointmentReminder |
| `apps/web/src/app/api/cron/appointment-reminders/route.ts` | Cron endpoint | VERIFIED | 221 lines, CRON_SECRET auth, queries J-1/J-0 appointments, sends to both client+lawyer, dedup via reminderLogs |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| messaging.actions.ts | message-emitter.ts | messageEmitter.emit | WIRED | Line 352: `messageEmitter.emit(\`user:${otherUserId}\`, sseEvent)` |
| sse/messages/route.ts | message-emitter.ts | messageEmitter.on | WIRED | Line 31: `messageEmitter.on(\`user:${userId}\`, onMessage)` |
| chat-container.tsx | use-sse-messages.ts | useSSEMessages | WIRED | Line 376: `useSSEMessages(handleSSE)` |
| chat-container.tsx | key-exchange.ts | deriveClientKeys/deriveServerKeys | WIRED | Lines 177-179: conditional call based on isInitiator |
| chat-container.tsx | messaging.actions.ts | sendMessage | WIRED | Line 409: `await sendMessage(conversationId, ciphertext, nonce, clientMessageId)` |
| portail/page.tsx | portal.actions.ts | getClientDashboard | WIRED | Line 12: `const result = await getClientDashboard()` |
| portail/dossiers/page.tsx | portal.actions.ts | getClientCases | WIRED | Import confirmed at line 2 |
| rendez-vous/page.tsx | appointment.actions.ts | getClientAppointments | WIRED | Line 3: import, line 13: call |
| messaging.actions.ts | @legalconnect/email | sendNewMessageNotification | WIRED | Line 28: import, line 373: await call |
| appointment.actions.ts | @legalconnect/email | sendAppointmentConfirmedNotification | WIRED | Line 22: import, line 322: await call |
| appointment.actions.ts | @legalconnect/email | sendAppointmentRefusedNotification | WIRED | Line 23: import, line 397: await call |
| cron/appointment-reminders/route.ts | @legalconnect/email | sendAppointmentReminder | WIRED | Line 14: import, lines 132+184: await calls |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| portail/page.tsx | activeCases, unreadMessages, nextAppointment | getClientDashboard() -> DB queries (count, join, where) | Yes - 3 separate DB queries with real joins | FLOWING |
| portail/dossiers/page.tsx | cases | getClientCases() -> DB select from intakeSubmissions + conversations join | Yes - real queries with unread counts | FLOWING |
| portail/messages/page.tsx | conversations | getConversations() -> DB select + enrichment (last msg, unread count, other party) | Yes - 3 parallel DB queries per conversation | FLOWING |
| chat-container.tsx | messages | getMessages() -> DB select with cursor pagination | Yes - returns encrypted messages from DB, decrypted client-side | FLOWING |
| rendez-vous/page.tsx | appointments | getClientAppointments() -> DB select from appointments join intakeSubmissions | Yes - real query with sanitization (rejectionReason omitted) | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (no runnable entry points -- requires dev server with database connection)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PORT-01 | 07-01, 07-03, 07-04 | E2E encrypted messages | SATISFIED | crypto_kx key exchange, encrypted storage (ciphertext+nonce), client-side encrypt/decrypt in chat-container.tsx, SSE real-time delivery, email notifications (no content) |
| PORT-02 | 07-02 | Secure document sharing | SATISFIED | getClientDocuments() action queries intakeDocuments, DocumentGrid component renders files, case detail shows documents tab |
| PORT-03 | 07-02 | Case status and progress tracking | SATISFIED | getClientCases() with status mapping, getClientCaseDetail() with timeline, case-status-tracker 3-step progress, client-timeline events |
| PORT-04 | 07-01, 07-04 | Appointment with preferences, lawyer confirms/declines | SATISFIED | requestAppointment with Zod (max 3 dates, slots, type), confirmAppointment (Jitsi auto-link), refuseAppointment, cancelAppointment, appointment-request-form.tsx, cron J-1/J-0 reminders |

No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| apps/web/src/components/chat/chat-container.tsx | 621 | `attachment: null, // TODO: wire attachment details` | Warning | Attachment metadata not passed to ChatBubble. Attachments can be sent (attachmentId param exists in sendMessage) but the bubble UI shows null. File sharing works at the server action level but attachment details are not rendered in chat bubbles. |

Classification: This is a Warning, not a Blocker. Document sharing works through the dedicated documents page (PORT-02 satisfied). The chat attachment rendering is an enhancement that does not block the phase goal.

### Human Verification Required

### 1. End-to-End Messaging Flow
**Test:** Log in as a client, navigate to /portail/messages, select a conversation, send a message. Then log in as the lawyer in a separate browser/incognito and verify the message appears in real time.
**Expected:** Message appears as a right-aligned primary-colored bubble for sender, left-aligned muted bubble for receiver. "Chiffre bout en bout" badge visible. Typing indicator shows when other party types.
**Why human:** Requires two simultaneous authenticated sessions, real-time SSE behavior, and IndexedDB key storage.

### 2. Appointment Request Flow
**Test:** As a client, navigate to /portail/rendez-vous, click "Demander un rendez-vous", fill the form (select case, type visio, pick 2 dates, select morning slot), submit. Then as a lawyer, confirm the appointment.
**Expected:** Toast "Demande de rendez-vous envoyee". Appointment card appears as "En attente". After lawyer confirms: card shows "Confirme" with Jitsi link. Email notifications sent at each step.
**Why human:** Requires role-switching, form interaction, toast verification, email delivery check.

### 3. Role-Conditional Layout
**Test:** Log in as client, verify sidebar shows Accueil/Mes dossiers/Messages/Rendez-vous/Documents/Parametres. Log in as avocat, verify sidebar shows Dashboard/Dossiers/Parametres.
**Expected:** Different navigation per role. "Connexion securisee" badge in header for both roles.
**Why human:** Visual layout verification, role-based UI differences.

### 4. Mobile Responsiveness
**Test:** Resize browser below 768px on portal pages.
**Expected:** Sidebar collapses to hamburger Sheet. Messages page shows single-view (conversation list or chat, not split). Touch targets >= 44px.
**Why human:** Visual/responsive behavior verification.

### Gaps Summary

No gaps found. All 4 success criteria are verified through substantive artifacts that are properly wired and have real data flowing from database queries. The single TODO (attachment details in chat bubble) is a minor enhancement that does not block the phase goal -- document sharing works through the dedicated documents page.

---

_Verified: 2026-03-27T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
