---
phase: 8
slug: intake-templates-customization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (workspace root config) |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `pnpm vitest run tests/templates/ --reporter=verbose` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/templates/ --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INTK-05 | unit | `pnpm vitest run tests/templates/template-schema.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | INTK-05, INTK-06 | unit | `pnpm vitest run tests/templates/template-actions.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | INTK-06 | unit | `pnpm vitest run tests/templates/dynamic-schema.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | INTK-06 | unit | `pnpm vitest run tests/templates/conditional-logic.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/templates/template-schema.test.ts` — stubs for INTK-05 (schema validation, seed templates)
- [ ] `tests/templates/template-actions.test.ts` — stubs for INTK-05/06 (CRUD, slug, snapshot)
- [ ] `tests/templates/dynamic-schema.test.ts` — stubs for INTK-06 (dynamic Zod generation)
- [ ] `tests/templates/conditional-logic.test.ts` — stubs for INTK-06 (conditional visibility)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Split-view preview updates live | INTK-06 | Visual rendering | Open template editor, modify question, verify preview updates |
| Drag & drop reorders questions | INTK-06 | Interactive behavior | Drag a question card up/down, verify order persists |
| Client sees lawyer branding | INTK-06 | Visual CSS override | Open /intake/[slug], verify logo and accent color |
| Co-branding footer visible | INTK-06 | Visual element | Check "Propulsé par LegalConnect" in footer |
| Conditional questions show/hide | INTK-05 | Interactive form logic | Fill a field that triggers conditional, verify question appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
