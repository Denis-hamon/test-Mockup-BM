# Phase 5: Case Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-03-26
**Phase:** 05-case-intelligence
**Areas discussed:** Fiche synthetique, Timeline chronologique, Score de qualification, Generation et mise a jour

---

## Fiche synthetique

| Option | Description | Selected |
|--------|-------------|----------|
| Complete structuree | Identite, type, resume, faits, parties, urgence, timeline, score | ✓ |
| Resume narratif | Texte redige 500-1000 mots | |
| Fiche minimaliste | Type, urgence, parties, 3-5 faits | |

**User's choice:** Complete structuree

| Option | Description | Selected |
|--------|-------------|----------|
| Auto apres soumission | Generation automatique, avocat voit sans action | ✓ |
| Generation a la demande | Bouton dans le dashboard | |
| Progressive pendant l'intake | Construction en temps reel | |

**User's choice:** Auto apres soumission

---

## Timeline chronologique

| Option | Description | Selected |
|--------|-------------|----------|
| Liste verticale chronologique | Evenements dates, ordonnes, source indiquee | ✓ |
| Frise horizontale interactive | Timeline graphique avec axe temporel | |
| Tableau | Date / Evenement / Source | |

**User's choice:** Liste verticale chronologique

| Option | Description | Selected |
|--------|-------------|----------|
| Marqueur d'incertitude | Dates faible confiance '~', non dates en bas | ✓ |
| Estimation par l'IA | IA estime les dates manquantes | |
| Dates uniquement | Seuls evenements dates | |

**User's choice:** Marqueur d'incertitude

---

## Score de qualification

| Option | Description | Selected |
|--------|-------------|----------|
| Avocat uniquement | Client ne voit jamais le score | ✓ |
| Visible aux deux | Client voit aussi | |
| Client version simplifiee | Client voit texte, avocat voit chiffre | |

**User's choice:** Avocat uniquement

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-criteres ponderes | Urgence + completude + complexite, 0-100 | ✓ |
| Score IA libre | Score + justification sans criteres fixes | |
| Categories sans score | Urgent / Standard / Incomplet | |

**User's choice:** Multi-criteres ponderes

---

## Generation et mise a jour

| Option | Description | Selected |
|--------|-------------|----------|
| Regeneration automatique | Modification declenche regeneration, historique conserve | ✓ |
| Pas de mise a jour | Generation unique a la soumission | |
| Regeneration manuelle | Bouton dans le dashboard | |

**User's choice:** Regeneration automatique

---

## Claude's Discretion

- Poids des criteres du score
- Nombre de sections de la fiche
- Schema tables case_summaries
- Provider IA pour generation
- Format stockage timeline

## Deferred Ideas

- Export PDF fiche synthetique — Phase 6/8
- Seuils score configurables — Phase 8
- Edition manuelle timeline — Phase 6
