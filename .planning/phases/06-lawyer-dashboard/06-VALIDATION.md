---
phase: 6
slug: lawyer-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (configured in packages/ai, packages/crypto) |
| **Config file** | `apps/web/vitest.config.ts` — Wave 0 must create |
| **Quick run command** | `pnpm --filter web test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter web vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DASH-01 | unit | `pnpm --filter web vitest run src/server/actions/dashboard.actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | DASH-03 | unit | `pnpm --filter web vitest run src/server/actions/dashboard.actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | DASH-02 | unit | `pnpm --filter email vitest run src/new-case-notification.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | DASH-04 | unit | `pnpm --filter web vitest run src/server/actions/lawyer-settings.actions.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/vitest.config.ts` — Vitest config for the web app (currently missing)
- [ ] `apps/web/src/server/actions/dashboard.actions.test.ts` — stubs for DASH-01, DASH-03
- [ ] `apps/web/src/server/actions/lawyer-settings.actions.test.ts` — stubs for DASH-04
- [ ] `packages/email/src/new-case-notification.test.ts` — stubs for DASH-02
- [ ] Test fixtures: mock session for `role: "avocat"`, mock intake submissions with case intelligence data

*Existing infrastructure covers packages/ai and packages/crypto. Web app needs Vitest setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Filter dropdown visually updates list | DASH-01 | UI visual state | Open /dashboard, select filter by specialty, verify list updates |
| Case detail page renders AI summary tabs | DASH-03 | Layout/visual | Open a case, check each tab (Synthese, Documents, Chronologie, IA) renders content |
| Email notification arrives in inbox | DASH-02 | External delivery | Submit a case, check lawyer email inbox for notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
