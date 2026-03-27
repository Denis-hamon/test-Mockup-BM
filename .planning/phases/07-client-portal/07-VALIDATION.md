---
phase: 7
slug: client-portal
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-27
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (workspace config at root + per-package) |
| **Config file** | `vitest.config.ts` (root), `packages/crypto/vitest.config.ts` |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PORT-01 | unit+tdd | `pnpm vitest run packages/crypto/src/__tests__/key-exchange.test.ts -x` | Created by Plan 01 Task 1 (tdd=true) | ⬜ pending |
| 07-01-02 | 01 | 1 | PORT-01 | typecheck | `pnpm tsc --noEmit` | N/A (compile check) | ⬜ pending |
| 07-02-01 | 02 | 2 | PORT-02, PORT-03 | typecheck | `pnpm tsc --noEmit` | N/A (compile check) | ⬜ pending |
| 07-03-01 | 03 | 2 | PORT-01 | typecheck | `pnpm tsc --noEmit` | N/A (compile check) | ⬜ pending |
| 07-03-02 | 03 | 2 | PORT-01 | manual | Human verification checkpoint (Plan 03 Task 2) | N/A | ⬜ pending |
| 07-04-01 | 04 | 3 | PORT-04, PORT-01 | typecheck | `pnpm tsc --noEmit` | N/A (compile check) | ⬜ pending |
| 07-04-02 | 04 | 3 | PORT-04 | typecheck | `pnpm tsc --noEmit` | N/A (compile check) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Verification Strategy

This phase uses a **hybrid verification approach**:

1. **Unit tests (Plan 01 only):** Plan 01 Task 1 is TDD — it creates `packages/crypto/src/__tests__/key-exchange.test.ts` as part of the red-green cycle. This test file is created by the plan itself, not by a separate Wave 0.

2. **TypeScript compile checks (all plans):** Every task uses `pnpm tsc --noEmit` as its primary automated verification. This catches type errors, missing imports, and contract violations across the monorepo.

3. **Human verification (Plan 03):** The chat UI and portal shell are verified visually via a checkpoint task (Plan 03 Task 2) covering SSE real-time delivery, encryption badges, responsive layout, and role-conditional sidebar.

4. **Acceptance criteria (all plans):** Each task includes grep-based acceptance criteria that verify specific patterns exist in output files (function names, component names, key patterns).

**Rationale:** The server actions and UI components in this phase are primarily integration/wiring code consuming existing tested libraries (crypto, email, drizzle). TypeScript's type system catches most contract violations. The crypto key-exchange module (the only pure logic) gets full TDD coverage.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time message delivery via SSE | PORT-01 | Requires two browser sessions | Open portal as client and lawyer, send message, verify instant delivery |
| E2E encryption badge displays correctly | PORT-01 | Visual UI element | Check cadenas icon next to chat input area |
| Document preview in message thread | PORT-02 | Visual rendering | Upload PDF in chat, verify preview renders |
| Case status progress bar for client | PORT-03 | Visual component | Open client portal, check horizontal progress tracker |
| Appointment confirmation email | PORT-04 | External email delivery | Request appointment, have lawyer confirm, check email |
| Cron reminder endpoint | PORT-04 | Requires time-based trigger | Call GET /api/cron/appointment-reminders with CRON_SECRET, verify emails sent |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (tsc --noEmit or vitest)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Plan 01 TDD task creates its own test file (no separate Wave 0 needed)
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
