# Phase 4: Empathetic AI Intake - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Le formulaire d'intake est enrichi par une IA conversationnelle empathique qui pose des questions de suivi contextuelles entre chaque etape, et par un pipeline d'extraction automatique qui analyse les documents uploades pour en extraire dates, parties, montants et clauses cles.

</domain>

<decisions>
## Implementation Decisions

### Follow-ups IA conversationnels
- **D-01:** L'IA intervient apres chaque etape du formulaire. Elle analyse la reponse de l'etape et pose 1-3 questions de suivi adaptees au domaine juridique et au contexte du client avant de passer a l'etape suivante.
- **D-02:** Format bulle conversationnelle style chat entre deux etapes. Reponses en texte libre. Le client peut cliquer "Passer" pour ignorer. Streaming des questions IA (coherent avec Phase 3 D-09).
- **D-03:** L'IA detecte des marqueurs de stress/detresse dans le texte et adapte sa tonalite (plus douce, plus rassurante). Pas de classification explicite visible au client. Adaptation invisible.

### Extraction documentaire
- **D-04:** Extraction immediate en arriere-plan des l'upload (via BullMQ job queue). Resultats affiches sous le fichier : carte avec dates, parties, montants extraits. Le client peut corriger avant soumission.
- **D-05:** Docling (microservice Python/HTTP) pour les PDF structures (contrats, courriers). AI Vision (Claude/GPT via packages/ai) pour les photos de documents, captures SMS/WhatsApp, notes manuscrites. Comme defini dans CLAUDE.md.

### Integration dans le parcours intake
- **D-06:** Zone de chat IA en transition entre les etapes. Apres validation d'une etape, la zone appara\u00eet. 1-3 questions, puis bouton "Continuer" vers l'etape suivante. Le stepper existant (intake-stepper.tsx) reste intact, l'IA s'intercale.
- **D-07:** Bouton "Passer" toujours visible. Les reponses IA sont sauvegardees en DB (nouvelle table `ai_follow_ups` liee a l'intake submission). L'avocat voit les echanges IA dans le dossier.

### Gestion des cas sensibles
- **D-08:** Detection des mots-cles sensibles (violence, danger, suicide, menace) dans le texte du client. L'IA ajoute un message de soutien + numeros d'urgence (3114, 17, 119). Pas de blocage du formulaire, le client peut continuer normalement.

### Claude's Discretion
- Choix des questions de suivi par domaine juridique (quels types de questions pour droit du travail vs droit de la famille, etc.)
- Format exact de la carte d'extraction (quels champs, layout)
- Seuils de detection d'emotion (quels mots/patterns declenchent l'adaptation du ton)
- Schema exact de la table `ai_follow_ups` (colonnes, relations)
- Gestion des erreurs Docling (retry, fallback vers AI Vision si echec)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — INTK-02 (AI follow-ups), AI-01 (document extraction)
- `.planning/ROADMAP.md` §Phase 4 — success criteria and plan breakdown

### Prior phase context
- `.planning/phases/01-auth-encryption/01-CONTEXT.md` — D-12 (ton chaleureux, vouvoiement)
- `.planning/phases/02-intake-form-trust-ux/02-CONTEXT.md` — D-01 a D-10 (structure formulaire, upload, trust UX)
- `.planning/phases/03-ai-engine-foundation/03-CONTEXT.md` — D-01 a D-10 (guardrails, provider, persona, streaming, prompts)

### Existing code (Phase 2 + 3)
- `apps/web/src/components/intake/intake-stepper.tsx` — Stepper 4 etapes a enrichir avec transitions IA
- `apps/web/src/hooks/use-intake-form.ts` — Hook formulaire avec localStorage persistence
- `apps/web/src/components/intake/step-documents.tsx` — Upload existant a connecter au pipeline extraction
- `packages/ai/src/provider.ts` — Factory provider a utiliser pour les appels IA
- `packages/ai/src/stream.ts` — streamAIResponse() pour le streaming des follow-ups
- `packages/ai/src/guardrails/` — UPL middleware deja wire sur tous les appels

### Stack reference
- `./CLAUDE.md` §Technology Stack — BullMQ, Docling, Vercel AI SDK 6, @ai-sdk/anthropic vision

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/ai` — Provider factory, streaming, guardrails UPL (Phase 3). Les follow-ups IA passent par ce package.
- `packages/ai/src/stream.ts` — streamAIResponse() pour le streaming des reponses conversationnelles
- `apps/web/src/hooks/use-file-encryption.ts` — Pipeline upload existant, les resultats d'extraction s'ajoutent aux metadonnees fichier
- `apps/web/src/components/trust/` — TrustBanner, TrustTooltip, EncryptionBadge reutilisables dans la zone de chat IA

### Established Patterns
- Monorepo Turborepo avec pnpm workspaces
- tRPC pour l'API layer
- Server actions pour les mutations (intake.actions.ts, upload.actions.ts)
- Zod pour la validation de schemas
- Drizzle ORM pour les schemas DB
- react-hook-form + useIntakeForm pour le state formulaire
- useTranslations('intake') pour l'i18n

### Integration Points
- `apps/web/src/components/intake/intake-stepper.tsx` — Inserer la zone de chat IA entre les etapes
- `apps/web/src/server/actions/upload.actions.ts` — Declencher l'extraction apres upload reussi
- `apps/web/src/lib/db/schema/intake.ts` — Ajouter table ai_follow_ups + extraction_results
- `packages/ai/src/prompts/overlays.ts` — Overlay "intake-followup" a ajouter

</code_context>

<specifics>
## Specific Ideas

- Les numeros d'urgence pour les cas sensibles sont : 3114 (suicide), 17 (police), 119 (enfance maltraitee)
- Le bouton "Passer" dans la zone de chat doit etre visuellement discret mais toujours accessible
- La carte d'extraction sous les fichiers doit etre editable par le client (correction des erreurs OCR/IA)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-empathetic-ai-intake*
*Context gathered: 2026-03-26*
