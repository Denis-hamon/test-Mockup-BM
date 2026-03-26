---
phase: 03
slug: ai-engine-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | packages/ai/vitest.config.ts |
| **Quick run command** | `pnpm --filter @legalconnect/ai test` |
| **Full suite command** | `pnpm --filter @legalconnect/ai test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @legalconnect/ai test`
- **After each plan:** Full suite + manual spot-check of streaming output

---

## Validation Architecture

### Wave 0 — Test Infrastructure (embedded in Plan 03-01, Task 1)
- [ ] vitest config in packages/ai
- [ ] Test utilities for mocking AI SDK providers
- [ ] CI-compatible test runner

### Critical Path Tests

| Test | What it validates | Acceptance |
|------|------------------|------------|
| Provider registry routing | AI-05: requests route to correct provider | `createProviderRegistry` returns valid model for each provider key |
| Provider swap via config | AI-05: no code changes to switch | Changing env/config routes to different provider |
| UPL detection - obvious | AI-06: French legal advice patterns caught | Regex layer flags "vous avez le droit de", "la loi prevoit que" |
| UPL rewrite - middleware | AI-06: flagged responses get rewritten | Middleware intercepts and rewrites before user sees |
| Disclaimer injection | AI-06: contextual disclaimers present | Sensitive topics trigger disclaimer, neutral topics don't |
| Red-team suite | AI-06: adversarial prompts blocked | 50+ adversarial cases pass (no legal advice leaks) |
| Streaming output | D-09: SSE streaming works | streamText returns incremental chunks |
| System prompt composability | D-08: base + overlay merging | Combined prompt includes persona + guardrails + use-case overlay |

### Edge Cases

| Scenario | Expected behavior |
|----------|------------------|
| Provider API key missing | Clear error message, no crash |
| Provider timeout | Graceful timeout with user-friendly message |
| Rate limit exceeded | 429 response with retry-after |
| Empty AI response | Handled gracefully, no blank UI |
| Very long response | Streaming handles without timeout |
