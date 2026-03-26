# Phase 5: Case Intelligence - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Le systeme genere un dossier structure complet a partir des donnees d'intake et des documents uploades : fiche synthetique, timeline chronologique des evenements, et score de qualification. Ce dossier est pret pour la revue par l'avocat dans son dashboard (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Fiche synthetique
- **D-01:** Structure complete : identite client, type de probleme, resume de la situation, faits cles extraits des documents, parties adverses, urgence, timeline integree, score de qualification. Format structure avec sections nettes.
- **D-02:** Generation automatique des la soumission du formulaire par le client. L'avocat voit le dossier complet dans son dashboard sans action requise. Via BullMQ job (coherent avec pipeline extraction Phase 4).

### Timeline chronologique
- **D-03:** Liste verticale chronologique — evenements dates, ordonnes chronologiquement. Chaque entree : date, description, source (recit client ou document). Simple, scannable, responsive.
- **D-04:** Marqueur d'incertitude pour les dates — dates extraites avec faible confiance marquees '~' (ex: '~mars 2024'). Evenements sans date places dans une section 'Non dates' en bas de la timeline.

### Score de qualification
- **D-05:** Visible par l'avocat uniquement. Le client ne voit jamais le score. Evite l'anxiete et les biais.
- **D-06:** Multi-criteres ponderes : urgence (delai, mots-cles), completude (% champs remplis, nb documents), complexite (nombre de parties, domaine juridique). Echelle 0-100 avec seuils (faible/moyen/eleve).

### Generation et mise a jour
- **D-07:** Regeneration automatique si le client modifie ses reponses ou ajoute des documents apres soumission. Version precedente conservee (historique simple). L'avocat voit la derniere version.

### Claude's Discretion
- Poids specifiques de chaque critere dans le score de qualification
- Nombre exact de sections dans la fiche synthetique
- Schema exact de la table case_summaries (colonnes, relations)
- Choix du provider IA pour la generation (Claude vs GPT) — selon routing Phase 3 D-05
- Format de stockage de la timeline (JSON structure vs texte)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — AI-02 (case summary), AI-03 (timeline), AI-04 (qualification score)
- `.planning/ROADMAP.md` §Phase 5 — success criteria and plan breakdown

### Prior phase context
- `.planning/phases/03-ai-engine-foundation/03-CONTEXT.md` — D-05 (routing par cas d'usage), D-08 (prompts composables)
- `.planning/phases/04-empathetic-ai-intake/04-CONTEXT.md` — D-04 (extraction immediate), D-05 (Docling + AI Vision)

### Existing code (Phase 3 + 4)
- `packages/ai/src/provider.ts` — Factory provider pour les appels IA
- `packages/ai/src/prompts/overlays.ts` — Overlays existants (intake followup), ajouter summary/timeline/scoring overlays
- `packages/ai/src/stream.ts` — streamAIResponse() reutilisable
- `apps/web/src/lib/db/schema/intake.ts` — Tables intakeSubmissions, extractionResults, aiFollowUps
- `apps/web/src/server/workers/extraction.worker.ts` — Pattern BullMQ worker a reproduire
- `apps/web/src/server/actions/extraction.actions.ts` — Pattern server actions

### Stack reference
- `./CLAUDE.md` §Technology Stack — BullMQ, Drizzle ORM, Vercel AI SDK 6

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/ai` — Provider factory, streaming, guardrails UPL, prompts composables
- `apps/web/src/server/workers/extraction.worker.ts` — Pattern BullMQ worker a reproduire pour la generation de dossier
- `apps/web/src/lib/db/schema/intake.ts` — Schema existant a etendre avec case_summaries, timelines, qualification_scores
- `apps/web/src/server/actions/extraction.actions.ts` — Pattern server actions (trigger, get, update)

### Established Patterns
- BullMQ pour les jobs asynchrones (extraction Phase 4)
- Drizzle ORM pour les schemas DB avec relations
- Server actions pour les mutations
- Prompts composables (base + overlays)
- Routing IA par cas d'usage via config

### Integration Points
- `apps/web/src/server/actions/intake.actions.ts` — Trigger la generation de dossier apres soumission
- `packages/ai/src/prompts/overlays.ts` — Ajouter overlays pour summary, timeline, scoring
- `apps/web/src/lib/db/schema/` — Nouvelles tables pour les artefacts de case intelligence

</code_context>

<specifics>
## Specific Ideas

- La fiche synthetique doit etre exportable en PDF (pour l'avocat qui veut imprimer)
- Le score de qualification doit avoir des seuils configurables par l'avocat (Phase 6 ou 8)
- La timeline doit pouvoir etre editee manuellement par l'avocat (ajout/suppression d'evenements)

</specifics>

<deferred>
## Deferred Ideas

- Export PDF de la fiche synthetique — Phase 6 (dashboard avocat) ou Phase 8 (customisation)
- Seuils de score configurables par avocat — Phase 8 (customisation)
- Edition manuelle de la timeline — Phase 6 (dashboard avocat)

</deferred>

---

*Phase: 05-case-intelligence*
*Context gathered: 2026-03-26*
