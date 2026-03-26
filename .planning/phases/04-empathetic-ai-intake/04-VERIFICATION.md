---
phase: 04-empathetic-ai-intake
verified: 2026-03-26T22:30:00Z
status: passed
score: 2/3 must-haves verified
re_verification: false
gaps:
  - truth: "AI follow-up exchanges are persisted to database"
    status: failed
    reason: "saveFollowUp server action exists but is never called from AIChatZone or any other component. Follow-up persistence is completely disconnected."
    artifacts:
      - path: "apps/web/src/server/actions/ai-followup.actions.ts"
        issue: "Defines saveFollowUp but no consumer imports or calls it"
      - path: "apps/web/src/components/intake/ai-chat-zone.tsx"
        issue: "Does not import or call saveFollowUp — conversations are ephemeral"
    missing:
      - "AIChatZone must call saveFollowUp after each AI response (for the question) and after each user reply (for the answer)"
      - "AIChatZone onSkip handler must call saveFollowUp with skipped=true"
      - "Alternatively, batch-persist all messages on onComplete/onSkip before navigating"
human_verification:
  - test: "Verify AI tone is warm and empathetic during actual intake conversation"
    expected: "AI uses vouvoiement, validates emotions, asks contextual follow-ups adapted to legal domain"
    why_human: "Cannot verify LLM output quality programmatically -- tone assessment requires human judgment"
  - test: "Verify sensitive case alert renders correctly with emergency numbers"
    expected: "When distress keywords are detected, a styled amber alert block appears with 3114, 17, 119 numbers"
    why_human: "Requires triggering the AI with sensitive keywords in a running app and inspecting the rendered output"
  - test: "Verify document extraction produces accurate structured data from a real PDF"
    expected: "Dates, parties, amounts, and clauses are correctly extracted and displayed in ExtractionCard"
    why_human: "Requires running Docling service with a real document and evaluating extraction accuracy"
  - test: "Verify the fade-in animation on AIChatZone and ExtractionCard"
    expected: "Smooth 200ms/300ms opacity transition when components appear"
    why_human: "Visual animation timing cannot be verified programmatically"
---

# Phase 4: Empathetic AI Intake Verification Report

**Phase Goal:** The intake form is enhanced with AI that asks empathetic follow-up questions and extracts key information from uploaded documents
**Verified:** 2026-03-26T22:30:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AI asks contextual follow-up questions adapted to the legal domain and the client's emotional state during intake | VERIFIED | INTAKE_FOLLOWUP_OVERLAY contains domain-specific guidance (droit du travail, famille, penal, immobilier, affaires), invisible emotion detection (stress, distress, anger markers), and adapts tone when detected. Route handler at /api/chat/intake streams responses using Claude as provider. AIChatZone auto-triggers first AI message with step context on mount. |
| 2 | AI tone is warm, supportive, and encouraging -- never cold or bureaucratic | VERIFIED (human confirmation needed) | System prompt contains "Ton chaleureux et rassurant", "Vouvoiement obligatoire", emotion validation instructions ("Je comprends que c'est difficile"), and sensitive case detection with emergency numbers (3114, 17, 119). UPL constraints prevent legal advice. However, actual tone quality requires human verification with a running LLM. |
| 3 | AI extracts dates, parties, amounts, and key clauses from uploaded PDF/image documents automatically | VERIFIED | BullMQ worker routes PDF to Docling, images to AI Vision. ExtractionResult interface has dates, parties, amounts, keyClauses, documentType, summary. Worker saves structured results to extraction_results table. ExtractionCard renders all four field types with inline editing. StepDocuments triggers extraction automatically on file upload completion and polls every 3s. |

**Score:** 3/3 success criteria truths verified

### Plan-Level Truth: Follow-Up Persistence

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| P1 | AI follow-up exchanges are persisted to database | FAILED | saveFollowUp action exists in ai-followup.actions.ts but is NEVER imported or called from AIChatZone or any other component. Conversations are completely ephemeral. |

**Plan-level score:** 6/7 truths verified (1 failed -- persistence wiring gap)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/lib/db/schema/intake.ts` | aiFollowUps + extractionResults tables | VERIFIED | Both tables defined with all specified columns, Drizzle relations configured correctly |
| `packages/ai/src/prompts/overlays.ts` | INTAKE_FOLLOWUP_OVERLAY system prompt | VERIFIED | 54 lines, contains vouvoiement, emotion detection, emergency numbers (3114/17/119), domain guidance, UPL constraints |
| `apps/web/src/app/api/chat/intake/route.ts` | POST route handler for streaming | VERIFIED | Uses streamText, getModel({provider:"anthropic"}), convertToModelMessages, maxOutputTokens:500, temperature:0.7, toUIMessageStreamResponse() |
| `apps/web/src/hooks/use-intake-chat.ts` | useIntakeChat hook | VERIFIED | Wraps useChat with DefaultChatTransport pointing to /api/chat/intake |
| `apps/web/src/components/intake/ai-chat-zone.tsx` | AIChatZone component | VERIFIED | 205 lines, message.parts rendering, Passer/Continuer/Envoyer buttons, role="log", aria-live="polite", sensitive alert with role="alert" |
| `apps/web/src/components/intake/intake-stepper.tsx` | Stepper with phase state machine | VERIFIED | IntakePhase type ("step" \| "chatting"), AIChatZone rendered when phase==="chatting" && currentStep<3, nav buttons hidden during chatting |
| `apps/web/src/server/services/docling.service.ts` | Docling HTTP client | VERIFIED | Uses /v1/convert/file multipart, handles ECONNREFUSED, structured DoclingResult |
| `apps/web/src/server/services/extraction.service.ts` | AI Vision extraction | VERIFIED | generateText with image content part, maxOutputTokens:1000, temperature:0.1, parseDoclingToExtractionResult for PDF text |
| `apps/web/src/server/workers/extraction.worker.ts` | BullMQ worker | VERIFIED | Routes PDF to Docling with Vision fallback, image to Vision, concurrency:3, saves to DB |
| `apps/web/src/components/intake/extraction-card.tsx` | ExtractionCard UI | VERIFIED | 4 states (pending/processing/done/failed), inline editable fields, role="region", aria-label with filename |
| `apps/web/src/server/actions/extraction.actions.ts` | Extraction actions | VERIFIED | triggerExtraction, getExtractionResults, updateExtractionResult with userEdited flag |
| `apps/web/src/server/actions/ai-followup.actions.ts` | Follow-up persistence | ORPHANED | saveFollowUp and getFollowUpsForSubmission exist but are never imported/called |
| `packages/ai/src/index.ts` | INTAKE_FOLLOWUP_OVERLAY re-export | VERIFIED | Line 32: export { INTAKE_FOLLOWUP_OVERLAY } from "./prompts/overlays" |
| `docker-compose.yml` | Valkey + Docling services | VERIFIED | valkey:9-alpine on 6379, docling-serve on 5001 with 4g memory limit |
| `apps/web/src/server/workers/start.ts` | Worker start script | VERIFIED | Imports extractionWorker, graceful SIGTERM/SIGINT shutdown |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ai-chat-zone.tsx | use-intake-chat.ts | useIntakeChat hook call | WIRED | Line 4: import, Line 31-38: destructured call |
| use-intake-chat.ts | /api/chat/intake route | DefaultChatTransport to /api/chat/intake | WIRED | Line 17-19: DefaultChatTransport with api: "/api/chat/intake" |
| /api/chat/intake route | overlays.ts | INTAKE_FOLLOWUP_OVERLAY import | WIRED | Line 5: import from @legalconnect/ai |
| intake-stepper.tsx | ai-chat-zone.tsx | AIChatZone rendered when chatting | WIRED | Line 11: import, Lines 168-175: conditional render |
| extraction.worker.ts | docling.service.ts | extractWithDocling() call | WIRED | Line 21: import, Line 113: call for PDF |
| extraction.worker.ts | extraction.service.ts | extractWithVision() call | WIRED | Lines 22-25: import, Line 127/134: calls |
| step-documents.tsx | extraction-card.tsx | ExtractionCard rendered per file | WIRED | Line 8: import, Lines 225-231: rendered per file |
| extraction.actions.ts | extraction.worker.ts | BullMQ queue.add() | WIRED | Line 14: import extractionQueue, Line 46: queue.add() |
| ai-chat-zone.tsx | ai-followup.actions.ts | saveFollowUp call | NOT WIRED | saveFollowUp is never imported or called anywhere |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| ai-chat-zone.tsx | messages | useIntakeChat -> useChat -> /api/chat/intake | Yes, streams from Claude via AI SDK | FLOWING |
| extraction-card.tsx | result (dates, parties, etc.) | Props from step-documents.tsx -> getExtractionResults -> DB | Yes, DB query returns parsed JSON fields | FLOWING |
| step-documents.tsx | extractions state | triggerExtraction -> BullMQ -> worker -> DB -> getExtractionResults | Yes, full pipeline from upload to DB to polling | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (requires running Next.js dev server, Valkey, Docling, and AI API keys to test the pipeline end-to-end)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INTK-02 | 04-01-PLAN | AI asks empathetic follow-up questions adapted to legal domain and emotional context | SATISFIED | INTAKE_FOLLOWUP_OVERLAY prompt, AIChatZone component, useIntakeChat hook, /api/chat/intake route, stepper integration |
| AI-01 | 04-02-PLAN | AI extracts key information from uploaded documents (dates, parties, amounts, clauses) | SATISFIED | Docling service, Vision extraction service, BullMQ worker, extractionResults table, ExtractionCard with inline editing |

No orphaned requirements found -- REQUIREMENTS.md maps INTK-02 and AI-01 to Phase 4, and both plans claim them.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| ai-followup.actions.ts | all | ORPHANED: defined but never imported/called | Blocker | Follow-up exchanges are not persisted -- data loss between sessions |
| extraction-card.tsx | 101-106 | useState() used as an initializer (not useEffect) -- this is a misuse of useState that may not run cleanup | Warning | Fade-in animation cleanup timer may leak, but non-blocking |
| extraction.worker.ts | 122 | Docling fallback check `message.includes("5")` is too broad -- matches any error containing "5" | Warning | Could trigger false fallbacks, but non-blocking since Vision is a valid fallback |
| extraction.worker.ts | 65-69 | SSE-C key MD5 computation uses SHA-256 then slices to 24 chars -- incorrect MD5 derivation | Warning | S3 SSE-C download will fail in production; AWS expects actual MD5 of the key |

### Human Verification Required

### 1. AI Tone Quality
**Test:** Start an intake, complete step 1, and interact with the AI chat zone
**Expected:** AI uses vouvoiement, warm tone, contextual follow-up questions for the selected legal domain
**Why human:** LLM output quality and empathetic tone assessment requires human judgment

### 2. Sensitive Case Alert
**Test:** Type distress keywords (e.g., "je veux en finir", "mon enfant est en danger") in the AI chat
**Expected:** AI response includes emergency numbers in a styled amber alert block
**Why human:** Requires triggering specific AI behavior and verifying visual rendering

### 3. Document Extraction Accuracy
**Test:** Upload a real PDF contract and an image screenshot during intake
**Expected:** ExtractionCard shows accurately extracted dates, parties, amounts, and clauses
**Why human:** Requires running Docling/Vision services and evaluating extraction quality

### 4. Visual Animations
**Test:** Complete step 1 and observe AIChatZone fade-in; upload a file and observe ExtractionCard transition
**Expected:** Smooth opacity transitions (200ms for chat, 300ms for extraction card)
**Why human:** Animation timing requires visual observation

## Gaps Summary

One gap blocks full goal achievement:

**AI follow-up persistence is disconnected.** The `saveFollowUp` server action in `ai-followup.actions.ts` is correctly implemented (inserts into `aiFollowUps` table, queries by submission) but is never called from `AIChatZone` or anywhere else. This means all AI follow-up conversations are ephemeral -- they disappear when the user navigates away. The phase goal includes persisting exchanges so lawyers receive a "perfectly qualified dossier," and the plan explicitly lists this as a must-have truth.

This is a wiring-only fix: `AIChatZone` needs to call `saveFollowUp` on `onComplete` and `onSkip` (batching the conversation), or after each message exchange.

Additionally, two warnings are noted:
- The SSE-C key MD5 computation in the extraction worker is incorrect (uses SHA-256 + slice instead of MD5), which will cause S3 downloads to fail in production.
- The Docling fallback condition `message.includes("5")` is overly broad.

These warnings do not block the phase goal but will block runtime functionality when tested against real S3 storage.

---

_Verified: 2026-03-26T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
