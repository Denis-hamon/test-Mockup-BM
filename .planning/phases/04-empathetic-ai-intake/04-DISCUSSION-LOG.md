# Phase 4: Empathetic AI Intake - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 04-empathetic-ai-intake
**Areas discussed:** Follow-ups IA conversationnels, Extraction documentaire, Integration dans le parcours intake, Gestion des cas sensibles

---

## Follow-ups IA conversationnels

| Option | Description | Selected |
|--------|-------------|----------|
| Apres chaque etape | L'IA analyse la reponse et pose 1-2 questions de suivi adaptees | ✓ |
| Etape dediee en fin de formulaire | Etape 5 conversationnelle apres les 4 etapes normales | |
| Chat libre en parallele | Panneau de chat lateral toujours disponible | |

**User's choice:** Apres chaque etape

| Option | Description | Selected |
|--------|-------------|----------|
| Bulle conversationnelle | Style chat entre deux etapes, 1-3 questions, bouton Passer | ✓ |
| Questions structurees | Champs de formulaire additionnels generes par l'IA | |
| Suggestion non-bloquante | Tooltip/notification avec question optionnelle | |

**User's choice:** Bulle conversationnelle

| Option | Description | Selected |
|--------|-------------|----------|
| Adaptation du ton | Detection marqueurs stress, adaptation tonalite invisible | ✓ |
| Detection + message de soutien | Adaptation + message explicite de soutien | |
| Pas de detection d'emotion | Ton empathique constant sans adaptation | |

**User's choice:** Adaptation du ton

---

## Extraction documentaire

| Option | Description | Selected |
|--------|-------------|----------|
| Extraction immediate + resume | Background job, resultats sous le fichier, client peut corriger | ✓ |
| Extraction post-soumission | Apres soumission, visible par l'avocat seulement | |
| Extraction a la demande | Bouton "Analyser" sous chaque fichier | |

**User's choice:** Extraction immediate + resume

| Option | Description | Selected |
|--------|-------------|----------|
| Docling pour PDF + AI Vision pour photos | Comme CLAUDE.md : Docling microservice pour PDF, AI Vision pour photos | ✓ |
| AI Vision uniquement | Tout vers LLM vision, pas de microservice Python | |
| Docling uniquement + OCR | Docling pour tout, OCR pour images | |

**User's choice:** Docling pour PDF + AI Vision pour photos

---

## Integration dans le parcours intake

| Option | Description | Selected |
|--------|-------------|----------|
| Transition IA entre etapes | Zone chat entre etapes, stepper intact, IA s'intercale | ✓ |
| 5eme etape dediee | Nouvelle etape au stepper | |
| Panneau lateral permanent | Drawer/panneau a droite pendant tout le formulaire | |

**User's choice:** Transition IA entre etapes

| Option | Description | Selected |
|--------|-------------|----------|
| Skip possible + persistence DB | Bouton Passer, reponses en DB, avocat voit les echanges | ✓ |
| Skip possible + pas de persistence | Bouton Passer, echanges non sauvegardes | |
| Obligatoire | Client doit repondre avant de continuer | |

**User's choice:** Skip possible + persistence DB

---

## Gestion des cas sensibles

| Option | Description | Selected |
|--------|-------------|----------|
| Message de soutien + numeros d'urgence | Detection mots-cles, message + 3114/17/119, pas de blocage | ✓ |
| Alerte prioritaire a l'avocat | En plus, dossier flag urgent automatiquement | |
| Pas de traitement special | Ton empathique general suffisant | |

**User's choice:** Message de soutien + numeros d'urgence

---

## Claude's Discretion

- Choix des questions de suivi par domaine juridique
- Format exact de la carte d'extraction
- Seuils de detection d'emotion
- Schema table ai_follow_ups
- Gestion erreurs Docling

## Deferred Ideas

None
