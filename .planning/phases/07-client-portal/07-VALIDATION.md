---
phase: 7
slug: client-portal
status: draft
nyquist_compliant: false
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
| 07-01-01 | 01 | 1 | PORT-01 | unit | `pnpm vitest run packages/crypto/src/__tests__/key-exchange.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | PORT-01 | unit | `pnpm vitest run tests/messaging.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | PORT-01 | integration | `pnpm vitest run tests/sse-messages.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | PORT-02 | unit | `pnpm vitest run tests/messaging-attachments.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | PORT-03 | unit | `pnpm vitest run tests/portal-cases.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | PORT-04 | unit | `pnpm vitest run tests/appointments.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/crypto/src/__tests__/key-exchange.test.ts` — stubs for PORT-01 crypto_kx key derivation
- [ ] `tests/messaging.test.ts` — stubs for PORT-01/PORT-02 message CRUD server actions
- [ ] `tests/portal-cases.test.ts` — stubs for PORT-03 client case list/detail
- [ ] `tests/appointments.test.ts` — stubs for PORT-04 appointment lifecycle

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time message delivery via SSE | PORT-01 | Requires two browser sessions | Open portal as client and lawyer, send message, verify instant delivery |
| E2E encryption badge displays correctly | PORT-01 | Visual UI element | Check cadenas icon next to chat input area |
| Document preview in message thread | PORT-02 | Visual rendering | Upload PDF in chat, verify preview renders |
| Case status progress bar for client | PORT-03 | Visual component | Open client portal, check horizontal progress tracker |
| Appointment confirmation email | PORT-04 | External email delivery | Request appointment, have lawyer confirm, check email |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
