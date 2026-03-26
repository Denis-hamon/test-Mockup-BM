# Phase 3: AI Engine Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Architecture LLM-agnostique operationnelle avec interface provider unifiee (Claude, GPT, Mistral), guardrails UPL empechant toute reponse contenant un conseil juridique, et infrastructure de prompts composables. Pas de fonctionnalites utilisateur directes — c'est la fondation technique pour les Phases 4-5.

</domain>

<decisions>
## Implementation Decisions

### Guardrails UPL
- **D-01:** Reecriture automatique des reponses contenant un potentiel conseil juridique. L'IA reformule en supprimant le conseil et en redirigeant vers l'avocat. L'utilisateur ne voit jamais la version problematique.
- **D-02:** Disclaimers contextuels — uniquement quand la reponse touche un sujet juridique sensible (droits, procedures, delais). Pas de disclaimer systematique sur chaque reponse.
- **D-03:** Suite de tests automatises red-team (50-100 cas adversariaux) executable en CI. Prompts du type "Ai-je le droit de...", "Quelle procedure pour...", verifiant que l'IA ne donne jamais de conseil.

### Architecture provider
- **D-04:** Nouveau package `packages/ai` dedie — provider interface, guardrails, prompts. Coherent avec packages/crypto et packages/shared. Reutilisable par apps/web et le futur widget (Phase 9).
- **D-05:** Routing par cas d'usage configurable. Chaque cas d'usage (intake follow-up, extraction, resume) a un provider par defaut configurable. Ex: Claude pour l'empathie, GPT pour l'extraction simple. Switch via config, pas code.
- **D-06:** Cles API dans les variables d'environnement. Rate limiting simple par utilisateur (ex: 20 requetes/min). Suffisant pour la fondation.

### Ton et persona IA
- **D-07:** Persona assistant empathique — chaleureux, rassurant, vouvoiement. "Je comprends que cette situation est difficile. Pourriez-vous me decrire...". Coherent avec D-12 Phase 1 (ton professionnel chaleureux).
- **D-08:** System prompt de base + overlays par cas d'usage. Un prompt de base contient le persona, guardrails UPL, et disclaimers. Des overlays specifiques par fonctionnalite (intake, extraction, resume) ajoutent le contexte specifique. Composable et maintenable.

### Streaming et UX reponses
- **D-09:** Streaming active — reponses affichees mot par mot via SSE. Vercel AI SDK 6 avec useChat/useCompletion nativement. UX moderne, percu comme plus rapide.
- **D-10:** Format texte riche leger — markdown rendu (gras, listes, paragraphes) mais pas de tableaux/code. Suffisant pour des reponses conversationnelles empathiques.

### Claude's Discretion
- Organisation interne du package packages/ai (structure de fichiers, exports)
- Implementation technique du rate limiting (middleware tRPC ou custom)
- Choix des modeles specifiques par defaut pour chaque cas d'usage
- Structure exacte des system prompts (longueur, sections)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — AI-05 (LLM-agnostic architecture), AI-06 (UPL guardrails)
- `.planning/ROADMAP.md` §Phase 3 — success criteria and plan breakdown

### Prior phase context
- `.planning/phases/01-auth-encryption/01-CONTEXT.md` — D-12 (ton professionnel chaleureux, vouvoiement)
- `.planning/phases/02-intake-form-trust-ux/02-CONTEXT.md` — D-10 (francais uniquement v1)

### Stack reference
- `./CLAUDE.md` §Technology Stack — Vercel AI SDK 6.x, @ai-sdk/anthropic, @ai-sdk/openai

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/crypto` — Pattern de package monorepo a suivre pour packages/ai
- `packages/shared` — Schemas Zod partages, pourrait accueillir les types AI partages
- `packages/email` — Autre reference de package structure

### Established Patterns
- Monorepo Turborepo avec pnpm workspaces
- Zod pour la validation de schemas (reutiliser pour valider les reponses AI)
- tRPC pour l'API layer (les endpoints AI passeront par tRPC)
- Server actions pour les mutations (pattern etabli en Phase 2)

### Integration Points
- `apps/web/src/server/` — Les routes tRPC pour les appels AI seront ici
- `packages/shared/src/schemas/` — Types partages pour les requetes/reponses AI
- `.env` / `.env.local` — Variables ANTHROPIC_API_KEY, OPENAI_API_KEY

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following Vercel AI SDK 6 patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-ai-engine-foundation*
*Context gathered: 2026-03-26*
