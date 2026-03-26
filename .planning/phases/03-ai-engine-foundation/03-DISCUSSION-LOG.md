# Phase 3: AI Engine Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 03-ai-engine-foundation
**Areas discussed:** Guardrails UPL, Architecture provider, Ton et persona IA, Streaming et UX reponses

---

## Guardrails UPL

| Option | Description | Selected |
|--------|-------------|----------|
| Reecrire automatiquement | L'IA reformule en supprimant le conseil et en redirigeant vers l'avocat | ✓ |
| Bloquer et remplacer | Reponse remplacee par message standard | |
| Laisser passer avec disclaimer | Avertissement en bas de chaque reponse | |

**User's choice:** Reecrire automatiquement
**Notes:** Plus fluide, l'utilisateur ne voit jamais la version problematique

| Option | Description | Selected |
|--------|-------------|----------|
| Contextuel | Disclaimer uniquement sur sujets juridiques sensibles | ✓ |
| Systematique | Disclaimer sur chaque reponse | |
| Une seule fois | Disclaimer en debut de conversation | |

**User's choice:** Contextuel

| Option | Description | Selected |
|--------|-------------|----------|
| Suite de tests automatises | Batterie de prompts adversariaux, executable en CI, 50-100 cas | ✓ |
| Tests manuels uniquement | Verification humaine quelques scenarios | |
| Red-team + tests auto | Les deux combines | |

**User's choice:** Suite de tests automatises

---

## Architecture Provider

| Option | Description | Selected |
|--------|-------------|----------|
| Nouveau package packages/ai | Package dedie, reutilisable, coherent avec crypto/shared | ✓ |
| Dans apps/web/src/lib/ai/ | Plus simple mais pas reutilisable | |
| Claude decide | Laisser Claude choisir | |

**User's choice:** Nouveau package packages/ai

| Option | Description | Selected |
|--------|-------------|----------|
| Config par cas d'usage | Chaque fonctionnalite a un provider par defaut configurable | ✓ |
| Fallback automatique | Provider principal + fallback si erreur | |
| Choix unique global | Un seul provider pour tout | |

**User's choice:** Config par cas d'usage

| Option | Description | Selected |
|--------|-------------|----------|
| Env vars + rate limit basique | Cles API en env vars, rate limit simple par utilisateur | ✓ |
| Vault + rate limit avance | Service de secrets, rate limiting par tier | |
| Claude decide | Laisser Claude choisir | |

**User's choice:** Env vars + rate limit basique

---

## Ton et Persona IA

| Option | Description | Selected |
|--------|-------------|----------|
| Assistant empathique | Chaleureux, rassurant, vouvoiement, coherent D-12 Phase 1 | ✓ |
| Guide neutre-professionnel | Poli mais distant | |
| Adapte au contexte | Deux registres selon audience | |

**User's choice:** Assistant empathique

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt de base + overlays | System prompt de base + overlays par cas d'usage, composable | ✓ |
| Un prompt par cas d'usage | Chaque fonctionnalite a son propre prompt complet | |
| Prompt unique global | Un seul system prompt pour tout | |

**User's choice:** Prompt de base + overlays

---

## Streaming et UX Reponses

| Option | Description | Selected |
|--------|-------------|----------|
| Streaming active | Mot par mot via SSE, Vercel AI SDK natif | ✓ |
| Reponse complete | Attendre avant d'afficher, spinner pendant | |
| Hybride | Streaming pour conversations, complet pour background | |

**User's choice:** Streaming active

| Option | Description | Selected |
|--------|-------------|----------|
| Texte riche leger | Markdown rendu (gras, listes) sans tableaux/code | ✓ |
| Texte brut | Aucun formatage | |
| Markdown complet | Support complet markdown | |

**User's choice:** Texte riche leger

---

## Claude's Discretion

- Organisation interne du package packages/ai
- Implementation technique du rate limiting
- Choix des modeles specifiques par defaut
- Structure exacte des system prompts

## Deferred Ideas

None
