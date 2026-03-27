# Phase 8: Intake Templates & Customization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-03-27
**Phase:** 08-intake-templates-customization
**Areas discussed:** Moteur de templates, Personnalisation avocat, Templates pré-construits, Expérience client

---

## Moteur de templates

### Stockage

| Option | Description | Selected |
|--------|-------------|----------|
| JSON schema en DB | Table intakeTemplates, document JSON, stepper dynamique | ✓ |
| Fichiers statiques | Templates dans le code TypeScript | |
| Claude décide | | |

### Logique conditionnelle

| Option | Description | Selected |
|--------|-------------|----------|
| Basique (show/hide) | Si réponse X → afficher question Y. Arbre simple. | ✓ |
| Linéaire | Toutes les questions affichées dans l'ordre | |
| Avancée (builder visuel) | Drag & drop avec branches type Typeform | |

### Versioning

| Option | Description | Selected |
|--------|-------------|----------|
| Pas de versioning v1 | Modification directe, snapshot des soumissions | ✓ |
| Versioning explicite | Chaque modif crée une version | |

---

## Personnalisation avocat

### Scope personnalisation

| Option | Description | Selected |
|--------|-------------|----------|
| Questions + branding | Modifier questions, réordonner, logo, couleurs, texte accueil | ✓ |
| Questions uniquement | Pas de branding personnalisé | |
| Branding uniquement | Questions fixes par spécialité | |

### Interface

| Option | Description | Selected |
|--------|-------------|----------|
| Formulaire structuré | Sections éditable, drag & drop réordonnement, preview | ✓ |
| Builder drag & drop | Interface type Typeform | |

### Point de départ

| Option | Description | Selected |
|--------|-------------|----------|
| Template pré-rempli modifiable | Choisir spécialité, pré-rempli, modifier | ✓ |
| Template vierge | Construire de zéro | |

---

## Templates pré-construits

### Spécialités

| Option | Description | Selected |
|--------|-------------|----------|
| Famille, Travail, Pénal | Les 3 domaines les plus demandés pour solos | ✓ |
| Famille, Travail, Immobilier | Remplace pénal par immobilier | |

### Profondeur questions

| Option | Description | Selected |
|--------|-------------|----------|
| 5-8 questions spécifiques | Questions communes + 5-8 spécifiques par domaine | ✓ |
| 3-4 questions | Minimum viable | |
| 10+ questions | Très détaillé | |

---

## Expérience client

### Accès

| Option | Description | Selected |
|--------|-------------|----------|
| URL dédiée par avocat | /intake/cabinet-dupont, template se charge auto | ✓ |
| Sélection au début | Client choisit le type de droit | |
| Via widget (Phase 9) | Reporté | |

### Branding

| Option | Description | Selected |
|--------|-------------|----------|
| Co-branding | "Propulsé par LegalConnect" + logo avocat + couleurs accent | ✓ |
| White-label complet | Seul branding avocat visible | |
| LegalConnect uniquement | Pas de branding avocat | |

### Preview

| Option | Description | Selected |
|--------|-------------|----------|
| Preview côté (split view) | Éditeur gauche, preview droite, temps réel | ✓ |
| Preview séparée | Bouton ouvre nouvel onglet | |
| Pas de preview | | |

---

## Claude's Discretion
- Structure JSON schema
- Types de champs supportés
- Mécanisme drag & drop
- Pattern snapshot soumissions

## Deferred Ideas
- Builder visuel Typeform
- Versioning templates
- Spécialités supplémentaires
- White-label
- Logique conditionnelle avancée
- Import/export templates
