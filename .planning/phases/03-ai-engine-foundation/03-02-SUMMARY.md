---
phase: 03-ai-engine-foundation
plan: 02
subsystem: ai
tags: [upl-guardrail, legal-advice-detection, rate-limiting, red-team, middleware]

requires:
  - phase: 03-ai-engine-foundation
    plan: 01
    provides: "@legalconnect/ai package with provider factory and getModel()"
provides:
  - "UPL guardrail middleware intercepting and rewriting legal advice"
  - "Contextual disclaimer injection for sensitive legal topics"
  - "In-memory per-user rate limiter (20 req/min)"
  - "57 adversarial red-team test cases"
affects: [04-01-ai-conversational, 04-02-document-extraction, 05-01-case-summary]

tech-stack:
  added: []
  patterns: [upl-middleware, regex-pattern-detection, llm-rewrite, rate-limiting, red-team-testing]

key-files:
  created:
    - packages/ai/src/guardrails/patterns.ts
    - packages/ai/src/guardrails/upl-middleware.ts
    - packages/ai/src/guardrails/disclaimer.ts
    - packages/ai/src/guardrails/rewrite.ts
    - packages/ai/src/rate-limit/limiter.ts
    - packages/ai/src/streaming/helpers.ts
    - packages/ai/src/__tests__/guardrails.test.ts
    - packages/ai/src/__tests__/rate-limit.test.ts
    - packages/ai/src/__tests__/red-team.test.ts
  modified:
    - packages/ai/src/provider.ts
    - packages/ai/src/index.ts
    - packages/ai/src/__tests__/provider.test.ts
    - packages/ai/src/__tests__/stream.test.ts

key-decisions:
  - "Untyped middleware object instead of LanguageModelV3Middleware (AI SDK 6 type incompatibility)"
  - "getModelRaw() for internal use without guardrail to prevent rewrite infinite loops"
  - "Full-buffer stream approach for v1 guardrail (collect, check, rewrite, re-emit)"
  - "20 regex patterns for French legal advice detection covering direct, subtle, and legal references"

patterns-established:
  - "UPL guardrail: every getModel() call is automatically guardrail-protected"
  - "Pattern detection + LLM rewrite: regex for fast detection, LLM for nuanced rewriting"
  - "Test escape hatch: _setRewriteModelForTest() for injecting mock models in tests"

requirements-completed: [AI-06]

duration: 7min
completed: 2026-03-26
---

# Phase 3 Plan 02: UPL Guardrails & Output Filtering Summary

**UPL guardrail middleware with French legal advice regex detection, LLM-based rewrite, contextual disclaimers, rate limiting, and 57 adversarial red-team tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T19:29:53Z
- **Completed:** 2026-03-26T19:36:51Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Created UPL guardrail middleware (wrapGenerate + wrapStream) that intercepts every AI response
- 20 French regex patterns detect legal advice (direct rights, procedures, legal references, advice formulations)
- LLM-based rewrite replaces legal advice with empathetic redirection to lawyer
- Contextual disclaimers auto-appended when responses touch sensitive legal topics
- In-memory rate limiter with per-user sliding window (default 20 req/min)
- 57 adversarial red-team tests covering direct, subtle, safe, and jailbreak scenarios
- getModel() now returns guardrail-wrapped model by default; getModelRaw() for internal use

## Task Commits

Each task was committed atomically:

1. **Task 1: UPL guardrail patterns, middleware, disclaimer, rewrite, rate limiter** - `8cc77dd` (feat)
2. **Task 2: Red-team test suite and wire guardrail into registry** - `b1371c5` (feat)

## Files Created/Modified
- `packages/ai/src/guardrails/patterns.ts` - 20 French legal advice regex patterns + containsLegalAdvice()
- `packages/ai/src/guardrails/upl-middleware.ts` - LanguageModelMiddleware (wrapGenerate + wrapStream)
- `packages/ai/src/guardrails/disclaimer.ts` - Contextual disclaimer injection (shouldAddDisclaimer/addDisclaimer)
- `packages/ai/src/guardrails/rewrite.ts` - LLM-based rewrite with safe fallback
- `packages/ai/src/rate-limit/limiter.ts` - In-memory per-user rate limiter (createRateLimiter)
- `packages/ai/src/streaming/helpers.ts` - collectStream utility for buffering AI SDK streams
- `packages/ai/src/__tests__/guardrails.test.ts` - 21 tests for patterns, disclaimer, middleware, rewrite
- `packages/ai/src/__tests__/rate-limit.test.ts` - 5 tests for rate limiter
- `packages/ai/src/__tests__/red-team.test.ts` - 57 adversarial test cases (22 direct, 15 subtle, 16 safe, 4 jailbreak)
- `packages/ai/src/provider.ts` - getModel now wraps with UPL guardrail; added getModelRaw
- `packages/ai/src/index.ts` - Added all guardrail, rate-limit, streaming exports

## Decisions Made
- Used untyped middleware object (AI SDK 6 LanguageModelV3Middleware type mismatch with PromiseLike vs Promise)
- Added getModelRaw() to prevent infinite rewrite loops (guardrail calls rewrite which calls LLM)
- Full-buffer approach for streaming guardrail in v1 (simpler, sufficient for initial use)
- 20 regex patterns balance between catching legal advice and avoiding false positives on safe responses

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed LanguageModelV3Middleware type incompatibility**
- **Found during:** Task 2
- **Issue:** AI SDK 6 exports `LanguageModelMiddleware` not `LanguageModelV3Middleware`; and the type uses `PromiseLike` not `Promise`, causing type errors with async functions
- **Fix:** Used untyped middleware object with explicit parameter types
- **Files modified:** packages/ai/src/guardrails/upl-middleware.ts
- **Committed in:** b1371c5

**2. [Rule 1 - Bug] Fixed existing tests breaking after wrapLanguageModel integration**
- **Found during:** Task 2
- **Issue:** provider.test.ts and stream.test.ts mocked `ai` module without `wrapLanguageModel`, causing test failures when getModel() was updated
- **Fix:** Added `wrapLanguageModel` passthrough mock to both test files
- **Files modified:** packages/ai/src/__tests__/provider.test.ts, packages/ai/src/__tests__/stream.test.ts
- **Committed in:** b1371c5

**3. [Rule 1 - Bug] Fixed 2 failing red-team patterns**
- **Found during:** Task 2 (red-team test run)
- **Issue:** "Le delai legal de prescription est de" not matched (regex required either "legal" OR "de prescription" but text had both); "La loi autorise le locataire" not matched (pattern required "la loi vous autorise")
- **Fix:** Updated regex to allow optional parts; added pattern for "la loi (autorise|permet|oblige)" without "vous"
- **Files modified:** packages/ai/src/guardrails/patterns.ts
- **Committed in:** b1371c5

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All fixes necessary for correct behavior and compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - all components work in-memory without external service dependencies. API keys needed only at runtime when AI rewrite is triggered.

## Known Stubs
None - all exported functions are fully implemented with real logic. The rewrite function has a safe fallback string for when the LLM call fails.

## Next Phase Readiness
- UPL guardrail is automatically applied to every getModel() call
- Rate limiter ready for integration in tRPC middleware (Phase 4+)
- Red-team test suite provides CI safety net for future pattern additions
- Streaming guardrail buffers full response (v1); can be optimized to chunk-level in future

## Self-Check: PASSED

All 9 created files verified present. Both commit hashes (8cc77dd, b1371c5) verified in git log.

---
*Phase: 03-ai-engine-foundation*
*Completed: 2026-03-26*
