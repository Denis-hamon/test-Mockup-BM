# Phase 4: Empathetic AI Intake - Research

**Researched:** 2026-03-26
**Domain:** Conversational AI follow-ups + Document extraction pipeline
**Confidence:** HIGH

## Summary

Phase 4 adds two distinct capabilities to the existing intake flow: (1) an AI conversational zone that appears between stepper steps to ask empathetic follow-up questions, and (2) a background document extraction pipeline using BullMQ, Docling, and AI Vision. Both build on the Phase 3 `packages/ai` foundation (provider factory, streaming, UPL guardrails).

The conversational follow-ups use Vercel AI SDK 6's `useChat` hook connected to a Next.js route handler that calls `streamText` through the existing `packages/ai` provider. The document extraction pipeline uses BullMQ workers to orchestrate Docling (for PDFs) and AI Vision (for photos/screenshots) as background jobs triggered on file upload. Results are stored in a new `extraction_results` table and displayed as editable cards under each uploaded file.

**Primary recommendation:** Use AI SDK 6 `useChat` with a dedicated `/api/chat/intake` route handler for the conversational zone. Use BullMQ flow producers for the extraction pipeline with two worker types (Docling worker, Vision worker). Add `ai_follow_ups` and `extraction_results` Drizzle tables extending the existing intake schema.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** L'IA intervient apres chaque etape du formulaire. Elle analyse la reponse de l'etape et pose 1-3 questions de suivi adaptees au domaine juridique et au contexte du client avant de passer a l'etape suivante.
- **D-02:** Format bulle conversationnelle style chat entre deux etapes. Reponses en texte libre. Le client peut cliquer "Passer" pour ignorer. Streaming des questions IA (coherent avec Phase 3 D-09).
- **D-03:** L'IA detecte des marqueurs de stress/detresse dans le texte et adapte sa tonalite (plus douce, plus rassurante). Pas de classification explicite visible au client. Adaptation invisible.
- **D-04:** Extraction immediate en arriere-plan des l'upload (via BullMQ job queue). Resultats affiches sous le fichier : carte avec dates, parties, montants extraits. Le client peut corriger avant soumission.
- **D-05:** Docling (microservice Python/HTTP) pour les PDF structures (contrats, courriers). AI Vision (Claude/GPT via packages/ai) pour les photos de documents, captures SMS/WhatsApp, notes manuscrites. Comme defini dans CLAUDE.md.
- **D-06:** Zone de chat IA en transition entre les etapes. Apres validation d'une etape, la zone apparait. 1-3 questions, puis bouton "Continuer" vers l'etape suivante. Le stepper existant (intake-stepper.tsx) reste intact, l'IA s'intercale.
- **D-07:** Bouton "Passer" toujours visible. Les reponses IA sont sauvegardees en DB (nouvelle table `ai_follow_ups` liee a l'intake submission). L'avocat voit les echanges IA dans le dossier.
- **D-08:** Detection des mots-cles sensibles (violence, danger, suicide, menace) dans le texte du client. L'IA ajoute un message de soutien + numeros d'urgence (3114, 17, 119). Pas de blocage du formulaire, le client peut continuer normalement.

### Claude's Discretion
- Choix des questions de suivi par domaine juridique (quels types de questions pour droit du travail vs droit de la famille, etc.)
- Format exact de la carte d'extraction (quels champs, layout)
- Seuils de detection d'emotion (quels mots/patterns declenchent l'adaptation du ton)
- Schema exact de la table `ai_follow_ups` (colonnes, relations)
- Gestion des erreurs Docling (retry, fallback vers AI Vision si echec)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTK-02 | AI asks empathetic follow-up questions adapted to legal domain and emotional context | useChat hook + streamText route handler + system prompt overlays with domain-specific follow-up logic + emotion detection patterns |
| AI-01 | AI extracts key information from uploaded documents (dates, parties, amounts, clauses) | BullMQ extraction pipeline + Docling sidecar for PDFs + AI Vision for photos + extraction_results DB table + editable card UI |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | 6.0.138 | LLM abstraction, streamText, useChat | Already in packages/ai, provider-agnostic streaming |
| @ai-sdk/react | 3.0.140 | useChat React hook | Client-side chat state management with streaming |
| @ai-sdk/anthropic | latest | Claude provider for empathy | Already configured in packages/ai |
| @ai-sdk/openai | latest | GPT provider for extraction | Already configured in packages/ai |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bullmq | 5.71.1 | Job queue for document extraction | Background processing of uploaded documents |
| docling-serve | latest (Docker) | PDF/document extraction sidecar | Structured PDF processing via HTTP API |

### Infrastructure
| Component | Image/Config | Purpose |
|-----------|-------------|---------|
| Docling Serve | `quay.io/docling-project/docling-serve` | PDF extraction microservice on port 5001 |
| Valkey | Already planned (CLAUDE.md) | BullMQ backend, queue persistence |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Route handler for chat | Server Actions | Route handler is more natural for useChat streaming; Server Actions work but route handlers give more control over headers/SSE |
| BullMQ step jobs | BullMQ flow producers | Step jobs simpler for linear pipelines; flow producers better for parallel extraction; recommend step jobs for simplicity |
| Docling serve | Direct Docling Python API | Serve gives HTTP interface callable from Node.js; avoids Python in monorepo |

**Installation:**
```bash
# In apps/web
pnpm add bullmq

# Docker (dev environment)
docker run -d --name docling-serve -p 5001:5001 quay.io/docling-project/docling-serve
```

## Architecture Patterns

### Recommended Project Structure
```
packages/ai/src/
  prompts/
    overlays.ts              # Add "intake-followup" overlay
    sensitive-detection.ts   # Emotion/distress keyword detection
  index.ts                   # Export new functions

apps/web/src/
  app/api/chat/intake/
    route.ts                 # POST handler for useChat streaming
  components/intake/
    intake-stepper.tsx        # Modified: add AI chat transition zone
    ai-chat-zone.tsx          # NEW: chat bubble UI between steps
    extraction-card.tsx       # NEW: editable extraction result card
  hooks/
    use-intake-chat.ts        # NEW: wraps useChat for intake context
  server/
    workers/
      extraction.worker.ts   # BullMQ worker for document extraction
    services/
      docling.service.ts     # HTTP client for Docling Serve API
      extraction.service.ts  # Orchestrates Docling vs Vision routing
  lib/db/schema/
    intake.ts                # Extended: ai_follow_ups + extraction_results tables
```

### Pattern 1: AI Chat Zone Between Steps (D-06)

**What:** After validating a step in intake-stepper, instead of immediately moving to the next step, show an AI chat zone. The zone uses `useChat` to stream 1-3 follow-up questions. The user can respond or click "Skip".

**When to use:** After each of the first 3 steps (problem type, description, documents). Not after contact (last step).

**Implementation approach:**

The intake-stepper currently calls `nextStep()` which increments `currentStep`. The modification adds an intermediate "chat" state between steps:

```typescript
// State machine: step -> chatting -> step -> chatting -> step -> chatting -> step -> submit
type IntakePhase = "step" | "chatting";
const [phase, setPhase] = useState<IntakePhase>("step");

// When user clicks "Next" on a step:
async function handleStepComplete() {
  const valid = await validateStep(currentStep);
  if (!valid) return;
  // Show AI chat zone instead of moving to next step
  setPhase("chatting");
}

// When user clicks "Continue" or "Skip" in chat zone:
function handleChatComplete() {
  nextStep();
  setPhase("step");
}
```

### Pattern 2: useChat with Route Handler

**What:** Vercel AI SDK 6 `useChat` hook connected to a `/api/chat/intake` route handler.

**Why route handler over Server Action:** The chat zone needs stateful streaming with message history. Route handlers are the established pattern for `useChat` in AI SDK 6 -- Server Actions work but route handlers are more explicit for SSE streaming.

```typescript
// apps/web/src/app/api/chat/intake/route.ts
import { streamText, convertToModelMessages } from "ai";
import { getModel, buildSystemPrompt } from "@legalconnect/ai";

export async function POST(req: Request) {
  const { messages, stepData } = await req.json();

  const systemPrompt = buildSystemPrompt(
    buildIntakeFollowupPrompt(stepData),
    true // append UPL disclaimer
  );

  const result = streamText({
    model: getModel({ provider: "anthropic" }), // Claude for empathy
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    maxOutputTokens: 500, // Keep follow-ups concise
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
```

```typescript
// apps/web/src/hooks/use-intake-chat.ts
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function useIntakeChat(stepIndex: number, stepData: Record<string, unknown>) {
  return useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/intake",
      body: { stepData: { stepIndex, ...stepData } },
    }),
  });
}
```

### Pattern 3: Emotion-Adaptive System Prompt (D-03)

**What:** The system prompt includes instructions for invisible emotion detection. The AI adapts its tone based on stress markers in the user's text, without explicit classification visible to the user.

**Approach:** System prompt overlay instructs the LLM to detect emotional markers and adapt tone. No separate NLP pipeline -- the LLM itself handles detection as part of its response generation.

```typescript
// packages/ai/src/prompts/overlays.ts
export const INTAKE_FOLLOWUP_OVERLAY = `
Vous etes un assistant empathique qui aide les clients a decrire leur situation juridique.
Vouvoiement obligatoire. Ton chaleureux et rassurant.

## Votre role
Apres que le client a rempli une etape du formulaire, posez 1 a 3 questions de suivi
pertinentes pour mieux qualifier son dossier. Soyez bref et precis.

## Detection emotionnelle (invisible)
Analysez le texte du client pour des marqueurs de:
- Stress eleve: termes urgents, ponctuation excessive, majuscules
- Detresse: vocabulaire negatif intense, expressions de desespoir
- Colere: accusations, langage agressif

Si detecte: adoptez un ton plus doux, validez les emotions ("Je comprends que c'est difficile"),
posez des questions plus ouvertes et moins directes.

## Detection de cas sensibles
Si le texte contient des references a: violence, danger imminent, suicide, menace de mort,
maltraitance d'enfant -- ajoutez IMMEDIATEMENT un message de soutien:
"Si vous etes en danger ou en detresse, n'hesitez pas a contacter:
- 3114 (prevention du suicide, 24h/24)
- 17 (police secours)
- 119 (enfance en danger)"
Puis continuez normalement. Ne bloquez JAMAIS le formulaire.

## Adaptation par domaine juridique
- Droit du travail: demandez la nature du contrat, anciennete, taille entreprise
- Droit de la famille: demandez la situation familiale, enfants, procedure en cours
- Droit penal: demandez les faits, dates, temoins, plainte deposee
- Droit immobilier: demandez le type de bien, bail, montants
- Droit des affaires: demandez la structure juridique, litiges, montants en jeu

## Contraintes UPL
Ne donnez JAMAIS de conseil juridique. Ne qualifiez JAMAIS juridiquement la situation.
Vous collectez des informations, vous ne les interpretez pas.
`;
```

### Pattern 4: BullMQ Document Extraction Pipeline (D-04, D-05)

**What:** When a file upload completes (s3Key returned), a BullMQ job is queued. A worker picks it up, routes to Docling (PDF) or AI Vision (images), extracts structured data, and stores results.

```typescript
// apps/web/src/server/workers/extraction.worker.ts
import { Worker, Queue } from "bullmq";

interface ExtractionJobData {
  documentId: string;
  submissionId: string;
  s3Key: string;
  mimeType: string;
  fileName: string;
  step: "pending" | "extracting" | "done" | "failed";
}

const extractionQueue = new Queue<ExtractionJobData>("document-extraction", {
  connection: { host: "localhost", port: 6379 },
});

// Worker with step-based processing
const worker = new Worker<ExtractionJobData>(
  "document-extraction",
  async (job) => {
    const { mimeType, s3Key, documentId } = job.data;

    // Route to appropriate extractor
    const isPDF = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");

    let extractionResult;
    if (isPDF) {
      extractionResult = await extractWithDocling(s3Key);
    } else if (isImage) {
      extractionResult = await extractWithVision(s3Key, mimeType);
    } else {
      // Unsupported type -- skip extraction
      return { status: "skipped", reason: "unsupported_type" };
    }

    // Store results in DB
    await saveExtractionResult(documentId, extractionResult);

    return { status: "done", documentId };
  },
  {
    connection: { host: "localhost", port: 6379 },
    concurrency: 3,
  }
);
```

### Pattern 5: Docling HTTP Client

**What:** HTTP client to call Docling Serve's `/v1/convert/source` endpoint.

```typescript
// apps/web/src/server/services/docling.service.ts
const DOCLING_URL = process.env.DOCLING_URL || "http://localhost:5001";

interface DoclingResult {
  text: string;
  tables: Array<{ headers: string[]; rows: string[][] }>;
  metadata: Record<string, unknown>;
}

export async function extractWithDocling(fileUrl: string): Promise<DoclingResult> {
  const response = await fetch(`${DOCLING_URL}/v1/convert/source`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sources: [{ kind: "http", url: fileUrl }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Docling extraction failed: ${response.status}`);
  }

  return response.json();
}
```

### Pattern 6: AI Vision Extraction

**What:** For photos, screenshots, handwritten notes -- use AI SDK multimodal content parts to send image to Claude/GPT Vision.

```typescript
// apps/web/src/server/services/extraction.service.ts
import { generateText } from "ai";
import { getModel } from "@legalconnect/ai";

export async function extractWithVision(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  const result = await generateText({
    model: getModel({ provider: "anthropic" }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageBuffer,
            mimeType,
          },
          {
            type: "text",
            text: `Analysez ce document et extrayez les informations suivantes en JSON:
- dates: tableau de dates mentionnees (format ISO)
- parties: noms des personnes/entites impliquees
- montants: montants financiers avec devise
- clauses_cles: phrases ou clauses importantes
- type_document: type de document (contrat, courrier, facture, SMS, etc.)
- resume: resume en 2-3 phrases

Repondez UNIQUEMENT avec le JSON, sans texte supplementaire.`,
          },
        ],
      },
    ],
    maxOutputTokens: 1000,
    temperature: 0.1, // Low temperature for extraction accuracy
  });

  return JSON.parse(result.text);
}
```

### Anti-Patterns to Avoid
- **Inline AI calls in React components:** All AI calls go through route handlers or server actions, never directly from client
- **Synchronous document extraction:** Never block the upload response waiting for extraction -- always use BullMQ background jobs
- **Hardcoded emotion keywords:** Don't build a keyword dictionary for emotion detection -- let the LLM handle it via system prompt instructions
- **Separate prompts for each domain:** Use one flexible overlay with domain-specific sections, not 10 separate prompt files
- **Polling for extraction results:** Use tRPC subscriptions (SSE) or short polling with exponential backoff to show extraction progress

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chat state management | Custom message state + fetch | `useChat` from `@ai-sdk/react` | Handles streaming, message history, status tracking, abort, retry |
| Streaming SSE | Manual EventSource + parsing | `streamText().toUIMessageStreamResponse()` | Handles chunking, backpressure, error recovery |
| Job queue | Custom setTimeout/setInterval | BullMQ 5.71 | Retries, concurrency, dead letter queue, persistence across restarts |
| PDF text extraction | Custom PDF.js parsing | Docling Serve | 97.9% accuracy, handles tables, OCR, complex layouts |
| Image-to-text | Custom Tesseract OCR | AI Vision (Claude/GPT) | Better for photos of SMS, handwritten notes, screenshots |
| Emotion detection | Custom NLP/sentiment library | LLM system prompt | The LLM already understands emotional context -- no separate model needed |

**Key insight:** The AI conversational zone is essentially a standard chat UI with custom system prompts. Don't overcomplicate it -- `useChat` handles 90% of the complexity. The extraction pipeline is where the real engineering challenge is (Docling sidecar, S3 file retrieval for workers, result storage).

## Common Pitfalls

### Pitfall 1: S3 SSE-C and Docling Access
**What goes wrong:** Docling Serve needs to read the uploaded file, but files are encrypted with SSE-C (client-provided keys). Docling cannot decrypt them.
**Why it happens:** Phase 2 encrypts all uploads with SSE-C using a key derived from the file encryption key.
**How to avoid:** The BullMQ worker must: (1) download the file from S3 using the SSE-C key, (2) decrypt it in memory, (3) either pass the buffer directly to AI Vision, or temporarily store the decrypted file and pass its URL to Docling. For Docling, consider using the `/v1/convert/file` endpoint (multipart upload) instead of the URL-based `/v1/convert/source`.
**Warning signs:** Docling returns 403/empty results on encrypted files.

### Pitfall 2: useChat Message Format in AI SDK 6
**What goes wrong:** Messages in AI SDK 6 use a `parts` array structure (`UIMessage`), not the simple `{role, content}` format.
**Why it happens:** AI SDK 6 changed the message format to support multimodal content parts.
**How to avoid:** Use `convertToModelMessages()` in the route handler to convert UIMessage format to model-compatible format. On the client, access `message.parts` to render text.
**Warning signs:** Empty or malformed messages in the chat UI.

### Pitfall 3: Chat History Persistence Timing
**What goes wrong:** AI follow-up responses are lost if the user refreshes the page during the chat zone.
**Why it happens:** `useChat` stores messages in React state (memory only).
**How to avoid:** Persist each AI exchange to the `ai_follow_ups` table as it completes. On page reload, check if there are persisted follow-ups for the current step and skip the AI zone (or restore the conversation).
**Warning signs:** Users report lost AI conversations after page refresh.

### Pitfall 4: BullMQ Worker Initialization in Next.js
**What goes wrong:** BullMQ workers are long-running processes. They don't fit naturally in Next.js serverless functions.
**Why it happens:** Next.js API routes are request-response; workers need to run continuously.
**How to avoid:** Run the BullMQ worker as a separate Node.js process (e.g., `apps/web/src/server/workers/start.ts` launched via `tsx` in development, or a separate container in production). Do NOT initialize workers inside Next.js API routes.
**Warning signs:** Workers stop processing after Next.js cold start timeout.

### Pitfall 5: Docling Container Memory
**What goes wrong:** Docling Serve uses significant memory for OCR and layout analysis (2-4GB typical).
**Why it happens:** ML models for document understanding are loaded in memory.
**How to avoid:** Set Docker memory limits (`--memory=4g`), configure concurrency limits in Docling, and implement queue-side rate limiting in BullMQ.
**Warning signs:** Docling container OOM-killed, extraction jobs stuck.

### Pitfall 6: Extraction Results Race Condition
**What goes wrong:** User submits the intake form before extraction jobs complete.
**Why it happens:** Extraction is async; user might not wait for results.
**How to avoid:** Allow submission with pending extractions. Mark extraction_results as `pending` in the database. The lawyer dashboard shows results once available. Don't block form submission on extraction completion.
**Warning signs:** Null extraction results in submitted intakes.

## Code Examples

### DB Schema Extension (Drizzle)

```typescript
// apps/web/src/lib/db/schema/intake.ts -- additions

export const aiFollowUps = pgTable("ai_follow_ups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id").notNull()
    .references(() => intakeSubmissions.id),
  stepIndex: integer("step_index").notNull(), // 0-3
  question: text("question").notNull(), // AI's follow-up question
  answer: text("answer"), // Client's response (null if skipped)
  skipped: integer("skipped").default(0).notNull(), // 1 if user clicked Skip
  emotionMarkers: text("emotion_markers"), // JSON: detected markers (internal)
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const extractionResults = pgTable("extraction_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull()
    .references(() => intakeDocuments.id),
  status: text("status", {
    enum: ["pending", "processing", "done", "failed"],
  }).default("pending").notNull(),
  extractionMethod: text("extraction_method", {
    enum: ["docling", "vision"],
  }),
  dates: text("dates"), // JSON array of extracted dates
  parties: text("parties"), // JSON array of party names
  amounts: text("amounts"), // JSON array of {value, currency}
  keyClauses: text("key_clauses"), // JSON array of clause strings
  documentType: text("document_type"), // detected document type
  summary: text("summary"), // 2-3 sentence summary
  rawOutput: text("raw_output"), // Full extraction JSON for debugging
  userEdited: integer("user_edited").default(0).notNull(), // 1 if client modified
  error: text("error"), // Error message if failed
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
```

### AI Chat Zone Component

```typescript
// apps/web/src/components/intake/ai-chat-zone.tsx
"use client";

import { useIntakeChat } from "@/hooks/use-intake-chat";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, SkipForward } from "lucide-react";

interface AIChatZoneProps {
  stepIndex: number;
  stepData: Record<string, unknown>;
  onComplete: () => void;
}

export function AIChatZone({ stepIndex, stepData, onComplete }: AIChatZoneProps) {
  const { messages, sendMessage, status } = useIntakeChat(stepIndex, stepData);

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="size-4" />
        <span>Questions complementaires</span>
      </div>

      {/* Chat messages */}
      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "assistant" ? "text-left" : "text-right"}
          >
            <div className={`inline-block rounded-lg px-3 py-2 text-sm ${
              m.role === "assistant"
                ? "bg-background border"
                : "bg-primary text-primary-foreground"
            }`}>
              {m.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}
        {status === "streaming" && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onComplete}>
          <SkipForward className="mr-1 size-3" />
          Passer
        </Button>
        <Button size="sm" onClick={onComplete}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
```

### Extraction Card Component

```typescript
// apps/web/src/components/intake/extraction-card.tsx
"use client";

interface ExtractionCardProps {
  documentId: string;
  status: "pending" | "processing" | "done" | "failed";
  result?: {
    dates: string[];
    parties: string[];
    amounts: Array<{ value: string; currency: string }>;
    keyClauses: string[];
    documentType: string;
    summary: string;
  };
  onEdit: (field: string, value: unknown) => void;
}

// Renders extraction results as editable fields under each file preview.
// Shows skeleton loader while processing, error state on failure.
// Each field is inline-editable (contentEditable or input).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useChat with API route URL string | useChat with DefaultChatTransport | AI SDK 6 (late 2025) | Transport pattern replaces simple api string |
| message.content (string) | message.parts (array) | AI SDK 6 | Messages now have typed parts for multimodal support |
| convertToCoreMessages | convertToModelMessages | AI SDK 6 | Renamed function for model message conversion |
| maxTokens | maxOutputTokens | AI SDK 6 | Parameter renamed in streamText/generateText |
| Docling v0 API (v1alpha) | Docling v1 API | docling-serve 1.0 | Stable API, new source format |
| BullMQ basic jobs | BullMQ step jobs + flows | BullMQ 5.x | Step-based processing for multi-stage pipelines |

**Deprecated/outdated:**
- `maxTokens` parameter in AI SDK 6 -- use `maxOutputTokens` (already adopted in packages/ai)
- `convertToCoreMessages` -- renamed to `convertToModelMessages`
- Docling `/v1alpha/` endpoints -- use `/v1/` endpoints

## Open Questions

1. **Docling file upload vs URL**
   - What we know: Docling Serve has `/v1/convert/file` (multipart) and `/v1/convert/source` (URL-based)
   - What's unclear: Since files are SSE-C encrypted in S3, the worker must decrypt first. The cleanest path is multipart upload of decrypted buffer to Docling's `/v1/convert/file` endpoint.
   - Recommendation: Use `/v1/convert/file` with the decrypted buffer. Avoid writing decrypted files to disk.

2. **Docling accuracy on French legal documents**
   - What we know: Docling benchmarks at 97.9% on English documents
   - What's unclear: Accuracy on French legal documents (contrats, courriers officiels) is unverified (flagged in STATE.md blockers)
   - Recommendation: Early validation in Phase 4 implementation. If accuracy is insufficient, fall back to AI Vision for all document types.

3. **Extraction result real-time updates**
   - What we know: BullMQ processes jobs asynchronously. Client needs to see extraction results appear.
   - What's unclear: Best mechanism for real-time updates (tRPC subscription, SSE, polling)
   - Recommendation: Simple polling (every 3s while any extraction is "pending") is sufficient for v1. tRPC subscriptions can be added later if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Docling Serve sidecar | Yes | 28.5.2 (OrbStack) | -- |
| Node.js | BullMQ workers | Yes | v20.19.6 | -- |
| Valkey/Redis | BullMQ backend | Not verified locally | -- | Docker: `docker run -d --name valkey -p 6379:6379 valkey/valkey:9` |
| Docling Serve | PDF extraction | Not running | -- | `docker run -d --name docling-serve -p 5001:5001 quay.io/docling-project/docling-serve` |

**Missing dependencies with no fallback:**
- None (all can be started via Docker)

**Missing dependencies with fallback:**
- Valkey: Start via Docker in dev environment
- Docling Serve: Start via Docker in dev environment

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (config at packages/ai/vitest.config.ts and root vitest.config.ts) |
| Config file | `/Users/dhamon/vitest.config.ts` (root), `/Users/dhamon/packages/ai/vitest.config.ts` |
| Quick run command | `pnpm vitest run --filter @legalconnect/ai` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTK-02-a | AI generates 1-3 follow-up questions per step | unit | `pnpm vitest run packages/ai/src/__tests__/intake-followup.test.ts -t "generates follow-up"` | Wave 0 |
| INTK-02-b | Emotion markers adapt AI tone | unit | `pnpm vitest run packages/ai/src/__tests__/intake-followup.test.ts -t "emotion"` | Wave 0 |
| INTK-02-c | Sensitive case detection adds emergency numbers | unit | `pnpm vitest run packages/ai/src/__tests__/sensitive-detection.test.ts` | Wave 0 |
| INTK-02-d | Skip button persists exchange as skipped | integration | `pnpm vitest run apps/web/src/__tests__/ai-follow-ups.test.ts` | Wave 0 |
| INTK-02-e | Route handler streams response correctly | integration | `pnpm vitest run apps/web/src/__tests__/chat-intake-route.test.ts` | Wave 0 |
| AI-01-a | PDF extraction via Docling returns structured data | integration | `pnpm vitest run apps/web/src/__tests__/extraction-docling.test.ts` | Wave 0 |
| AI-01-b | Image extraction via AI Vision returns structured data | integration | `pnpm vitest run apps/web/src/__tests__/extraction-vision.test.ts` | Wave 0 |
| AI-01-c | BullMQ job routes to correct extractor by MIME type | unit | `pnpm vitest run apps/web/src/__tests__/extraction-router.test.ts` | Wave 0 |
| AI-01-d | Extraction results stored in DB and retrievable | integration | `pnpm vitest run apps/web/src/__tests__/extraction-results.test.ts` | Wave 0 |
| AI-01-e | Extraction card is editable by client | manual-only | Manual UI test -- edit extracted date field | -- |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --changed`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/ai/src/__tests__/intake-followup.test.ts` -- covers INTK-02-a, INTK-02-b
- [ ] `packages/ai/src/__tests__/sensitive-detection.test.ts` -- covers INTK-02-c
- [ ] `apps/web/src/__tests__/chat-intake-route.test.ts` -- covers INTK-02-e
- [ ] `apps/web/src/__tests__/extraction-docling.test.ts` -- covers AI-01-a (mock Docling HTTP)
- [ ] `apps/web/src/__tests__/extraction-vision.test.ts` -- covers AI-01-b (mock AI SDK)
- [ ] `apps/web/src/__tests__/extraction-router.test.ts` -- covers AI-01-c
- [ ] `apps/web/src/__tests__/ai-follow-ups.test.ts` -- covers INTK-02-d
- [ ] `apps/web/src/__tests__/extraction-results.test.ts` -- covers AI-01-d

## Sources

### Primary (HIGH confidence)
- [AI SDK official docs](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) -- useChat hook API, message parts, transport pattern
- [AI SDK prompts docs](https://ai-sdk.dev/docs/ai-sdk-core/prompts) -- multimodal content parts (image, file) for vision
- [BullMQ official docs](https://docs.bullmq.io/patterns/process-step-jobs) -- step jobs pattern
- [docling-serve GitHub](https://github.com/docling-project/docling-serve) -- Docker image, API endpoints, deployment

### Secondary (MEDIUM confidence)
- [AI SDK 6 blog post](https://vercel.com/blog/ai-sdk-6) -- architectural changes, Server Action shift
- [BullMQ TypeScript setup guide](https://oneuptime.com/blog/post/2026-01-21-bullmq-typescript-setup/view) -- TypeScript patterns
- [Docling API REST guide](https://www.blog.brightcoding.dev/2025/08/13/docling-api-the-one-stop-rest-service-for-turning-pdf-docx-pptx-and-images-into-clean-markdown/) -- Docling endpoints and response format

### Tertiary (LOW confidence)
- Docling accuracy on French legal documents -- unverified, flagged for early validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project or documented in CLAUDE.md
- Architecture: HIGH -- patterns verified against AI SDK 6 official docs and existing codebase
- Pitfalls: HIGH -- SSE-C/Docling interaction, BullMQ worker lifecycle, AI SDK 6 message format changes all verified
- Extraction pipeline: MEDIUM -- Docling French accuracy unverified

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable libraries, 30-day window)
