---
phase: 04-empathetic-ai-intake
plan: 01
subsystem: ai
tags: [vercel-ai-sdk, useChat, streaming, drizzle, emotion-detection, intake]

# Dependency graph
requires:
  - phase: 03-ai-engine-foundation
    provides: "LLM-agnostic provider (getModel, buildSystemPrompt, streamText)"
  - phase: 02-intake-form-trust-ux
    provides: "IntakeStepper, useIntakeForm, intake DB schemas"
provides:
  - "AI conversational follow-up zone between intake steps"
  - "INTAKE_FOLLOWUP_OVERLAY system prompt with emotion detection"
  - "aiFollowUps database table for persisting follow-up exchanges"
  - "POST /api/chat/intake streaming route handler"
affects: [05-case-intelligence, 08-intake-templates]

# Tech tracking
tech-stack:
  added: ["@ai-sdk/react useChat", "DefaultChatTransport"]
  patterns: ["step/chatting phase state machine in stepper", "system prompt overlay pattern"]

key-files:
  created:
    - packages/ai/src/prompts/overlays.ts
    - apps/web/src/app/api/chat/intake/route.ts
    - apps/web/src/hooks/use-intake-chat.ts
    - apps/web/src/components/intake/ai-chat-zone.tsx
    - apps/web/src/server/actions/ai-followup.actions.ts
  modified:
    - apps/web/src/lib/db/schema/intake.ts
    - packages/ai/src/index.ts
    - apps/web/src/components/intake/intake-stepper.tsx

key-decisions:
  - "Claude as primary provider for empathetic follow-ups (warm tone per D-01)"
  - "System prompt overlay pattern for reusable prompt modules"
  - "Phase state machine (step/chatting) in stepper for AI intercalation"

patterns-established:
  - "Prompt overlays: separate files in packages/ai/src/prompts/ re-exported via barrel"
  - "AI chat integration: useChat + DefaultChatTransport to Next.js route handler"
  - "Stepper phase state machine: type IntakePhase = step | chatting"

requirements-completed: [INTK-02]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 4 Plan 1: AI Conversational Follow-Ups Summary

**Empathetic AI chat zone between intake steps with streaming follow-ups, emotion-adaptive prompting, and sensitive case alerts (3114/17/119)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T20:51:52Z
- **Completed:** 2026-03-26T20:55:24Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- AI follow-up chat zone appears between intake steps 0-2 with streaming responses via Vercel AI SDK 6
- INTAKE_FOLLOWUP_OVERLAY system prompt with invisible emotion detection, domain-specific questions, and emergency number alerts
- Step/chatting phase state machine in IntakeStepper with Passer/Continuer navigation
- aiFollowUps database table with Drizzle relations for persisting follow-up exchanges

## Task Commits

Each task was committed atomically:

1. **Task 1: DB schema, AI prompt overlay, and route handler** - `62e238f` (feat)
2. **Task 2: Chat zone component, useIntakeChat hook, and stepper integration** - `ed8c0d9` (feat)

## Files Created/Modified
- `packages/ai/src/prompts/overlays.ts` - INTAKE_FOLLOWUP_OVERLAY system prompt with emotion detection and UPL constraints
- `apps/web/src/app/api/chat/intake/route.ts` - POST streaming route handler using Claude via getModel
- `apps/web/src/hooks/use-intake-chat.ts` - useIntakeChat hook wrapping useChat with DefaultChatTransport
- `apps/web/src/components/intake/ai-chat-zone.tsx` - Chat bubble UI with streaming, sensitive alerts, Passer/Continuer
- `apps/web/src/server/actions/ai-followup.actions.ts` - saveFollowUp and getFollowUpsForSubmission server actions
- `apps/web/src/lib/db/schema/intake.ts` - Added aiFollowUps table and relations (preserved existing extractionResults)
- `packages/ai/src/index.ts` - Re-exported INTAKE_FOLLOWUP_OVERLAY
- `apps/web/src/components/intake/intake-stepper.tsx` - Added step/chatting phase state machine and AIChatZone rendering

## Decisions Made
- Claude selected as primary provider for follow-up conversations (warm empathetic tone)
- System prompt overlay pattern established for modular prompt composition
- Phase state machine approach (step/chatting) chosen over separate overlay/modal for natural flow
- AI SDK 6 message.parts rendering (not deprecated message.content)
- convertToModelMessages used (not deprecated convertToCoreMessages)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are wired to real data sources (AI SDK streaming, Drizzle DB).

## Next Phase Readiness
- AI conversational follow-ups are functional and ready for Phase 5 (case intelligence)
- The aiFollowUps table provides data for case summary generation
- Prompt overlay pattern can be extended for future AI interaction contexts

---
*Phase: 04-empathetic-ai-intake*
*Completed: 2026-03-26*

## Self-Check: PASSED
- All 8 files verified present
- Both task commits (62e238f, ed8c0d9) verified in git log
