---
phase: 2
slug: intake-form-trust-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 |
| **Config file** | `vitest.config.ts` (root, from Phase 1) |
| **Quick run command** | `pnpm vitest run --changed` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~10 seconds |

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
| 02-01-01 | 01 | 1 | INTK-01 | unit | `pnpm vitest run tests/intake-schemas.test.ts` | Plan 01 | pending |
| 02-01-02 | 01 | 1 | INTK-01 | unit | `pnpm vitest run tests/intake-persistence.test.ts` | Plan 01 | pending |
| 02-02-01 | 02 | 2 | INTK-03 | unit | `pnpm vitest run tests/file-encryption.test.ts` | Plan 02 | pending |
| 02-02-02 | 02 | 2 | INTK-04 | unit | `pnpm vitest run tests/intake-schemas.test.ts` | Plan 02 | pending |
| 02-03-01 | 03 | 2 | SECU-03 | unit | `pnpm vitest run tests/trust-components.test.ts` | Plan 03 | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

- [ ] `tests/intake-schemas.test.ts` — validates 4 step schemas + merged schema + video types
- [ ] `tests/intake-persistence.test.ts` — localStorage save/load roundtrip
- [ ] `tests/file-encryption.test.ts` — encrypt file bytes, decrypt roundtrip
- [ ] `tests/trust-components.test.ts` — render security badge/tooltip components

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Multi-step stepper visual | INTK-01 | Visual UI progression | 1. Visit /intake 2. Verify 4-step stepper with progress bar 3. Navigate forward/back |
| Drag & drop upload UX | INTK-03 | Browser drag events | 1. Drag file onto drop zone 2. Verify preview appears 3. Verify encryption badge after upload |
| Security badges visible | SECU-03 | Visual placement | 1. Navigate all 4 steps 2. Verify padlock icons on sensitive fields 3. Verify tooltip on hover |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify commands
- [ ] Sampling continuity: no 3 consecutive tasks without automated behavioral verify
- [ ] Test stubs created by plans (integrated, no separate Wave 0)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
