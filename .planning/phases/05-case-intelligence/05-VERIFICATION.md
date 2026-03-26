---
phase: 05-case-intelligence
verified: 2026-03-26T23:15:00Z
status: gaps_found
score: 1/3 must-haves verified
re_verification: false
gaps:
  - truth: "A chronological timeline of events is built from client narrative and document contents"
    status: failed
    reason: "No caseTimelines table, no timeline generation logic, getCaseIntelligence returns timeline: null unconditionally"
    artifacts:
      - path: "apps/web/src/lib/db/schema/case-intelligence.ts"
        issue: "Only defines caseSummaries table. No caseTimelines table exists."
      - path: "apps/web/src/server/actions/case-intelligence.actions.ts"
        issue: "getCaseIntelligence always returns timeline: null (lines 213-214)"
    missing:
      - "caseTimelines database table schema (id, submissionId, events JSON, undatedEvents JSON, status, timestamps)"
      - "Timeline generation AI prompt (extract dates and events from narrative + documents)"
      - "generateTimeline() function that calls AI and stores in caseTimelines table"
      - "getCaseIntelligence must query caseTimelines and return real data"
  - truth: "A qualification score is computed to help lawyers prioritize cases by urgency and completeness"
    status: failed
    reason: "No qualificationScores table, no score computation logic, getCaseIntelligence returns score: null unconditionally"
    artifacts:
      - path: "apps/web/src/lib/db/schema/case-intelligence.ts"
        issue: "Only defines caseSummaries table. No qualificationScores table exists."
      - path: "apps/web/src/server/actions/case-intelligence.actions.ts"
        issue: "getCaseIntelligence always returns score: null (lines 215)"
    missing:
      - "qualificationScores database table schema (id, submissionId, overallScore, urgencyScore, completenessScore, complexityScore, rationale, timestamps)"
      - "Score computation logic (AI prompt or algorithm to compute urgency, completeness, complexity)"
      - "generateQualificationScore() function that processes intake data and produces scores"
      - "getCaseIntelligence must query qualificationScores and return real data"
---

# Phase 5: Case Intelligence Verification Report

**Phase Goal:** The system generates a complete, structured case file from intake data and documents -- ready for lawyer review
**Verified:** 2026-03-26T23:15:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A structured case summary (fiche synthetique) is auto-generated from intake data and uploaded documents | VERIFIED | caseSummaries table, generateCaseSummary pipeline, French prompts with UPL guardrails, Zod validation, mock fallback, fire-and-forget trigger from intake |
| 2 | A chronological timeline of events is built from client narrative and document contents | FAILED | No caseTimelines table exists. No timeline generation logic. getCaseIntelligence returns timeline: null unconditionally |
| 3 | A qualification score is computed to help lawyers prioritize cases by urgency and completeness | FAILED | No qualificationScores table exists. No score computation logic. getCaseIntelligence returns score: null unconditionally |

**Score:** 1/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/lib/db/schema/case-intelligence.ts` | DB schema for case intelligence tables | PARTIAL | Only caseSummaries defined. Missing caseTimelines and qualificationScores tables |
| `apps/web/src/lib/ai/provider.ts` | AI provider abstraction | VERIFIED | Anthropic primary + mock fallback. LLM-agnostic via Vercel AI SDK |
| `apps/web/src/lib/ai/mock-provider.ts` | Development mock | VERIFIED | Returns realistic French case summaries keyed by problem type |
| `apps/web/src/lib/ai/prompts/case-summary.ts` | Prompt templates | VERIFIED | French system prompt with UPL guardrails, structured JSON output spec |
| `apps/web/src/lib/ai/generate-case-summary.ts` | Case summary generation | VERIFIED | Full pipeline: load submission, build prompt, call AI, validate with Zod, store in DB |
| `apps/web/src/server/actions/case-intelligence.actions.ts` | Server actions CRUD | PARTIAL | triggerCaseIntelligence, getCaseIntelligence, regenerateCaseIntelligence all exist but timeline/score always null |
| `packages/shared/src/schemas/case-intelligence.ts` | Zod schemas | VERIFIED | caseSummaryOutputSchema, caseSummarySchema, generateSummaryRequestSchema |
| `apps/web/src/server/actions/intake.actions.ts` | Intake trigger | VERIFIED | submitIntake calls triggerCaseIntelligence fire-and-forget |
| `apps/web/src/lib/db/schema/index.ts` | Schema exports | VERIFIED | Exports case-intelligence module |
| `apps/web/src/lib/db/index.ts` | DB client registration | VERIFIED | caseIntelligenceSchema registered in Drizzle client |
| `packages/shared/src/index.ts` | Shared exports | VERIFIED | Exports case-intelligence schemas |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| intake.actions.ts | case-intelligence.actions.ts | import triggerCaseIntelligence | WIRED | Line 6: import, line 35: fire-and-forget call after insert |
| case-intelligence.actions.ts | generate-case-summary.ts | import generateCaseSummary | WIRED | Line 19: import, line 139: called in triggerCaseIntelligence |
| generate-case-summary.ts | provider.ts | import getAIProvider | WIRED | Line 12: import, line 66: called to get model |
| generate-case-summary.ts | prompts/case-summary.ts | import prompts | WIRED | Line 14: imports, lines 76-93: used in generateText call |
| generate-case-summary.ts | case-intelligence schema | import caseSummaries | WIRED | Line 10: import, line 123: insert into DB |
| case-intelligence.actions.ts | case-intelligence schema | Drizzle queries on caseSummaries | WIRED | Lines 117-120: count query, line 133: delete, line 192: findFirst |
| case-intelligence.actions.ts | caseTimelines table | Query timeline data | NOT_WIRED | No caseTimelines table exists. getCaseIntelligence returns null |
| case-intelligence.actions.ts | qualificationScores table | Query score data | NOT_WIRED | No qualificationScores table exists. getCaseIntelligence returns null |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| generate-case-summary.ts | summaryOutput | AI provider via generateText or getMockSummary | Yes (mock returns realistic data, prod calls LLM) | FLOWING |
| case-intelligence.actions.ts | CaseIntelligenceResult.summary | caseSummaries table via Drizzle query | Yes -- reads from DB after generation | FLOWING |
| case-intelligence.actions.ts | CaseIntelligenceResult.timeline | hardcoded null | No -- always returns null | DISCONNECTED |
| case-intelligence.actions.ts | CaseIntelligenceResult.score | hardcoded null | No -- always returns null | DISCONNECTED |

### Behavioral Spot-Checks

Step 7b: SKIPPED (no running server available for behavioral checks; code is server-side requiring DB connection)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AI-02 | 05-01, 05-02 | AI generates structured case summary (fiche synthetique) from intake data and documents | SATISFIED | caseSummaries table + generateCaseSummary pipeline + triggerCaseIntelligence + fire-and-forget from intake |
| AI-03 | 05-02 | AI builds chronological timeline of events from client narrative and documents | BLOCKED | No caseTimelines table, no timeline generation logic, getCaseIntelligence returns null |
| AI-04 | 05-02 | AI produces qualification score to help lawyer prioritize cases by urgency/quality | BLOCKED | No qualificationScores table, no score computation logic, getCaseIntelligence returns null |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| case-intelligence.actions.ts | 213-215 | Hardcoded null for timeline and score sections | BLOCKER | Timeline and score are always null -- phase goal partially unmet |
| case-intelligence.actions.ts | 109-110 | Comment says "BullMQ job configured" but runs inline | Warning | Misleading documentation; generation works but not via queue as documented |
| 05-02-SUMMARY.md | 33 | key-decision says "caseTimelines/qualificationScores not yet created" | Info | SUMMARY acknowledges missing tables but requirements AI-03/AI-04 were marked complete |

### Human Verification Required

### 1. AI Summary Quality (French output)

**Test:** Submit an intake form with ANTHROPIC_API_KEY set and review the generated case summary
**Expected:** Summary is in French, factually accurate, empathetic tone, no legal advice, valid JSON structure
**Why human:** AI output quality (tone, accuracy, relevance) cannot be verified programmatically

### 2. Mock Provider Realism

**Test:** Submit an intake form without ANTHROPIC_API_KEY and review the mock case summary
**Expected:** Mock data is realistic enough for development and demo purposes
**Why human:** Realism of mock data is subjective

## Gaps Summary

Two of the three Success Criteria for Phase 5 are unmet. The case summary generation (AI-02) is fully implemented with a complete pipeline: DB schema, AI provider abstraction, French prompts with UPL guardrails, Zod validation, mock fallback, server actions, and automatic fire-and-forget trigger from intake submission.

However, the chronological timeline (AI-03) and qualification score (AI-04) have zero implementation. No database tables exist for these features, no AI prompts or generation logic has been created, and the getCaseIntelligence server action returns hardcoded null for both. The 05-02 SUMMARY acknowledges this: "Adapted to actual caseSummaries schema from 05-01 instead of plan's aspirational 3-table design."

Despite this, the SUMMARY frontmatter claims `requirements-completed: [AI-02, AI-03, AI-04]` and REQUIREMENTS.md shows all three as checked. This is inaccurate -- only AI-02 is actually satisfied.

**Root cause:** Plan 05-01 was scoped only for case summaries. Plan 05-02 was supposed to add timeline and scoring but was instead re-scoped to server actions and intake integration only. No Plan 05-03 was created for the missing features.

**To close gaps:** A new plan is needed to:
1. Add caseTimelines and qualificationScores tables to the DB schema
2. Create AI prompts and generation functions for timeline extraction and score computation
3. Wire the generation into the triggerCaseIntelligence flow (parallel or sequential with summary)
4. Update getCaseIntelligence to query and return real timeline and score data

---

_Verified: 2026-03-26T23:15:00Z_
_Verifier: Claude (gsd-verifier)_
