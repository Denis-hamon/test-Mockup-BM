---
phase: 1
slug: auth-encryption
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
updated: 2026-03-25
---

# Phase 1 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 |
| **Config file** | `vitest.config.ts` (root, created in Plan 02 Task 2) + `packages/crypto/vitest.config.ts` (created in Plan 03 Task 1) |
| **Quick run command** | `pnpm vitest run --changed` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --changed`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Created By | Status |
|---------|------|------|-------------|-----------|-------------------|------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | scaffolding | `pnpm install && pnpm --filter web exec -- npx next --version` | Plan 01 T1 | pending |
| 01-01-02 | 01 | 1 | AUTH-01 | integration | `docker compose up -d && pnpm --filter web db:push` | Plan 01 T2 | pending |
| 01-02-01 | 02 | 2 | AUTH-01..04 | typecheck | `pnpm tsc --noEmit` | Plan 02 T1 | pending |
| 01-02-02 | 02 | 2 | AUTH-01..04 | behavioral | `pnpm vitest run tests/auth/` | Plan 02 T2 | pending |
| 01-03-01 | 03 | 2 | SECU-01 | unit | `pnpm --filter @legalconnect/crypto test` | Plan 03 T1 | pending |
| 01-03-02 | 03 | 2 | SECU-01 | unit | `pnpm --filter @legalconnect/crypto test` | Plan 03 T2 | pending |
| 01-04-01 | 04 | 3 | SECU-01,02 | typecheck | `pnpm tsc --noEmit` | Plan 04 T1 | pending |
| 01-04-02 | 04 | 3 | SECU-02 | behavioral | `pnpm vitest run tests/rgpd/` | Plan 04 T2 | pending |

*Status: pending -- green -- red -- flaky*

---

## Test Creation Ownership

| Test File | Created By | Requirement |
|-----------|-----------|-------------|
| `vitest.config.ts` (root) | Plan 02, Task 2 | Infrastructure |
| `tests/setup.ts` | Plan 02, Task 2 | Infrastructure |
| `tests/auth/register.test.ts` | Plan 02, Task 2 | AUTH-01 |
| `tests/auth/login.test.ts` | Plan 02, Task 2 | AUTH-03 |
| `tests/auth/verification.test.ts` | Plan 02, Task 2 | AUTH-02 |
| `tests/auth/reset-password.test.ts` | Plan 02, Task 2 | AUTH-04 |
| `packages/crypto/vitest.config.ts` | Plan 03, Task 1 | SECU-01 |
| `packages/crypto/src/__tests__/*.test.ts` | Plan 03, Tasks 1-2 | SECU-01 |
| `tests/rgpd/compliance.test.ts` | Plan 04, Task 2 | SECU-02 |

---

## Nyquist Compliance

- No 3 consecutive tasks without behavioral tests (Plan 02 T2 runs auth tests after T1 typecheck; Plan 03 has crypto tests; Plan 04 T2 runs RGPD tests)
- All `<verify>` blocks use `pnpm tsc --noEmit` or `pnpm vitest run` (no `pnpm build` -- feedback latency < 15s)
- Wave 0 test stubs integrated into Plans 02 and 04 (no separate Wave 0 plan needed)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recovery passphrase display (blocking screen) | SECU-01 | UI flow requires visual confirmation | 1. Register new user 2. Verify 12-word mnemonic appears 3. Verify cannot proceed without 3-word verification |
| Email delivery | AUTH-02, AUTH-04 | Requires external email service | 1. Register user 2. Check Resend dashboard for sent email 3. Click verification link |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated behavioral verify
- [x] Test stubs created by Plans 02 and 04 (integrated, no separate Wave 0)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (tsc --noEmit + vitest run, not pnpm build)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
