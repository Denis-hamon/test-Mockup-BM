# Phase 2: Intake Form & Trust UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-intake-form-trust-ux
**Areas discussed:** Structure du formulaire, Upload de fichiers, Indicateurs de securite, Ton et contenu

---

## Structure du formulaire

| Option | Description | Selected |
|--------|-------------|----------|
| Stepper lineaire guide | Etapes numerotees avec barre de progression, navigation avant/arriere. Style Doctolib/Typeform. | ✓ |
| Formulaire long avec ancres | Une seule page avec sections visibles, scroll libre. | |
| Conversationnel (chat-like) | Questions une par une, style chatbot. | |

**User's choice:** Stepper lineaire guide
**Notes:** Meilleur pour des clients non-tech stresses

| Option | Description | Selected |
|--------|-------------|----------|
| 4 etapes | Type + Description + Documents + Contact | ✓ |
| 3 etapes (compact) | Probleme+description / Documents / Contact | |
| 5+ etapes (detaille) | Separation plus fine | |

**User's choice:** 4 etapes

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-save localStorage | Sauvegarde automatique a chaque etape dans le navigateur | ✓ |
| Save cote serveur apres auth | Brouillon persistant cote serveur | |
| Pas de sauvegarde | Formulaire en une seule session | |

**User's choice:** Auto-save localStorage

| Option | Description | Selected |
|--------|-------------|----------|
| Formulaire ouvert puis login a la soumission | Client commence sans compte | |
| Login requis des le debut | Client authentifie avant de commencer | |
| Tu decides | Claude choisit | ✓ |

**User's choice:** Tu decides
**Notes:** Claude a discretion sur ce point

---

## Upload de fichiers

| Option | Description | Selected |
|--------|-------------|----------|
| Drag & drop + bouton | Zone de drop visuelle avec apercu, barre de progression + badge "Chiffre" | ✓ |
| Bouton simple | Juste un bouton "Ajouter un document" | |

**User's choice:** Drag & drop + bouton

| Option | Description | Selected |
|--------|-------------|----------|
| 50 Mo / fichier, 200 Mo total | Suffisant pour la plupart des documents juridiques | ✓ |
| 100 Mo / fichier, 500 Mo total | Plus genereux, gros fichiers possibles | |

**User's choice:** 50 Mo par fichier, 200 Mo total

| Option | Description | Selected |
|--------|-------------|----------|
| OVHcloud Object Storage S3 | S3-compatible, EU data residency, SSE-C | ✓ |
| Systeme de fichiers serveur | Plus simple mais pas scalable | |

**User's choice:** OVHcloud Object Storage S3

---

## Indicateurs de securite

| Option | Description | Selected |
|--------|-------------|----------|
| Subtil et integre | Petits badges discrets, tooltip au survol | ✓ |
| Visible et affirme | Gros badges, animations, section dediee | |
| Minimal | Mention en footer uniquement | |

**User's choice:** Subtil et integre

| Option | Description | Selected |
|--------|-------------|----------|
| Contextuels | Cadenas a cote des champs sensibles, badge apres upload | ✓ |
| Permanents | Barre laterale/footer fixe | |

**User's choice:** Contextuels

---

## Ton et contenu

| Option | Description | Selected |
|--------|-------------|----------|
| Textes d'aide empathiques par etape | Messages d'introduction rassurants, placeholders explicatifs | ✓ |
| Textes minimalistes | Labels clairs mais pas d'encouragement | |
| Assistant IA en sidebar | Panel lateral avec IA en temps reel (Phase 4) | |

**User's choice:** Textes d'aide empathiques par etape

| Option | Description | Selected |
|--------|-------------|----------|
| Francais uniquement en v1 | Vouvoiement, next-intl config minimale | ✓ |
| Bilingue FR/EN | next-intl avec 2 locales | |

**User's choice:** Francais uniquement en v1

---

## Claude's Discretion

- Auth requis ou non avant le formulaire (formulaire ouvert vs login obligatoire)
- Choix des champs specifiques par etape
- Design system shadcn/ui (composants, palette, spacing)

## Deferred Ideas

None — discussion stayed within phase scope.
