---
phase: 9
slug: distribution-embedding
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-27
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (root) + Vite build verification |
| **Config file** | `vitest.config.ts` (root), `apps/widget/vite.config.ts` |
| **Quick run command** | `pnpm tsc --noEmit && pnpm --filter widget build` |
| **Full suite command** | `pnpm vitest run && pnpm --filter widget build` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm tsc --noEmit`
- **After every plan wave:** Run `pnpm vitest run && pnpm --filter widget build`
- **Before `/gsd:verify-work`:** Full suite must be green + widget build succeeds
- **Max feedback latency:** 20 seconds

---

## Verification Strategy

This phase uses a **hybrid verification approach:**

1. **TypeScript compile checks (all plans):** `pnpm tsc --noEmit` catches type errors across monorepo
2. **Widget build verification (Plan 01):** `pnpm --filter widget build` confirms IIFE bundle generates successfully
3. **Bundle size check (Plan 01):** Verify widget.js < 150KB gzipped
4. **Human verification:** Widget embedding on test page, landing page rendering, integration page UX

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Widget renders in Shadow DOM on external page | DIST-01 | Cross-origin browser behavior | Create test HTML, add script tag, verify form renders in modal |
| Widget CSS isolation (no host conflicts) | DIST-01 | Visual CSS isolation | Add conflicting CSS on host page, verify widget unaffected |
| Widget button floats correctly on mobile | DIST-01 | Visual responsive | Test on mobile viewport |
| Landing page displays lawyer info | DIST-02 | Visual rendering | Visit /cabinet-[slug], verify hero section with name/specialties |
| OG meta tags for sharing | DIST-02 | External preview | Share URL on social, check preview card |
| Integration page snippet works | DIST-01 | Copy-paste workflow | Copy snippet from settings, paste in HTML file, verify widget loads |

---

## Validation Sign-Off

- [x] All tasks use `pnpm tsc --noEmit` as automated verify
- [x] Widget build step validates IIFE output
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
