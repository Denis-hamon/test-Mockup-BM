---
phase: 1
slug: auth-encryption
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 |
| **Config file** | none — Wave 0 installs |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | integration | `pnpm vitest run tests/auth/register.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUTH-02 | unit | `pnpm vitest run tests/auth/verification.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-03 | integration | `pnpm vitest run tests/auth/login.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | AUTH-04 | integration | `pnpm vitest run tests/auth/reset-password.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | SECU-01 | unit | `pnpm vitest run tests/crypto/encryption.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | SECU-02 | integration | `pnpm vitest run tests/rgpd/compliance.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — root config with path aliases
- [ ] `packages/crypto/vitest.config.ts` — crypto package config
- [ ] `tests/auth/register.test.ts` — stubs for AUTH-01
- [ ] `tests/auth/verification.test.ts` — stubs for AUTH-02
- [ ] `tests/auth/login.test.ts` — stubs for AUTH-03
- [ ] `tests/auth/reset-password.test.ts` — stubs for AUTH-04
- [ ] `tests/crypto/encryption.test.ts` — stubs for SECU-01
- [ ] `tests/rgpd/compliance.test.ts` — stubs for SECU-02
- [ ] `tests/setup.ts` — shared test setup (DB, mocks)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recovery passphrase display (blocking screen) | SECU-01 | UI flow requires visual confirmation | 1. Register new user 2. Verify 12-word mnemonic appears 3. Verify cannot proceed without 3-word verification |
| Email delivery | AUTH-02, AUTH-04 | Requires external email service | 1. Register user 2. Check Resend dashboard for sent email 3. Click verification link |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
