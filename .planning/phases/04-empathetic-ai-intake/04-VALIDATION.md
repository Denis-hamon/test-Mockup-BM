---
phase: 04
slug: empathetic-ai-intake
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | apps/web/vitest.config.ts, packages/ai/vitest.config.ts |
| **Quick run command** | `pnpm --filter web test && pnpm --filter @legalconnect/ai test` |
| **Full suite command** | `pnpm test --recursive` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run relevant package tests
- **After each plan:** Full suite + manual spot-check of AI responses

---

## Validation Architecture

### Critical Path Tests

| Test | What it validates | Acceptance |
|------|------------------|------------|
| AI follow-up generation | INTK-02: contextual questions after each step | useChat returns 1-3 follow-up questions adapted to legal domain |
| Follow-up streaming | D-02: streaming chat bubble UX | SSE chunks arrive incrementally, displayed word-by-word |
| Emotion adaptation | D-03: tone adapts to stress markers | System prompt includes emotion detection instructions, response tone shifts |
| Skip functionality | D-07: client can skip AI questions | "Passer" button advances to next step without AI response |
| Follow-up persistence | D-07: responses saved to DB | ai_follow_ups table records question + answer per intake |
| Document extraction trigger | D-04: extraction starts on upload | BullMQ job created after successful S3 upload |
| PDF extraction via Docling | AI-01/D-05: dates, parties, amounts from PDF | Docling returns structured extraction result |
| Image extraction via Vision | AI-01/D-05: data from photos/screenshots | AI Vision returns extraction from image content |
| Extraction result display | D-04: card under file with extracted data | ExtractionCard component renders dates, parties, amounts |
| Extraction result editing | D-04: client can correct extraction | Edited values persist and override AI extraction |
| Sensitive case detection | D-08: distress triggers support message | Keywords trigger emergency numbers display (3114, 17, 119) |
| UPL guardrails on follow-ups | AI-06: no legal advice in follow-ups | Follow-up responses pass through UPL middleware |

### Edge Cases

| Scenario | Expected behavior |
|----------|------------------|
| Empty step response | AI still generates relevant follow-ups based on problem type |
| Docling service unavailable | Fallback to AI Vision for PDF extraction |
| Very large PDF (>20 pages) | Extraction processes first 20 pages, indicates truncation |
| Client uploads non-document image | AI Vision returns "no extractable legal data" gracefully |
| Multiple rapid uploads | BullMQ handles queue, extraction results appear as each completes |
| Client in extreme distress | Emergency message appears immediately, form continues |
