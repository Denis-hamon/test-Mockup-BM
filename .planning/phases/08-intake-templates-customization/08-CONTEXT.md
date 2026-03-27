# Phase 8: Intake Templates & Customization - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Moteur de templates d'intake par spécialité juridique avec JSON schema dynamique, 3 templates pré-construits (famille, travail, pénal), UI de personnalisation pour l'avocat (questions, branding), et URL dédiée par avocat pour l'expérience client personnalisée.

</domain>

<decisions>
## Implementation Decisions

### Moteur de templates
- **D-01:** Templates stockés en JSON schema en base de données (table intakeTemplates). Chaque template définit les étapes, questions, types de champs, validations. L'intake stepper lit le schema dynamiquement.
- **D-02:** Logique conditionnelle basique : show/hide de questions selon les réponses précédentes. Arbre simple (si réponse X → afficher question Y), pas de boucles. Suffisant pour v1.
- **D-03:** Pas de versioning en v1. L'avocat modifie directement. Les soumissions existantes gardent leur snapshot (stocker les réponses avec la structure template au moment de la soumission).

### Personnalisation avocat
- **D-04:** L'avocat peut personnaliser : questions (ajouter/modifier/supprimer), ordre des étapes, texte d'accueil, logo, couleurs d'accent. Couvre INTK-06 complètement.
- **D-05:** Interface formulaire structuré dans les paramètres : sections pour questions (liste éditable, drag & drop pour réordonner), branding (logo upload, color picker, texte d'accueil), et prévisualisation. Pas de builder visuel type Typeform.
- **D-06:** L'avocat part d'un template pré-rempli par spécialité qu'il peut modifier. Meilleur onboarding que le template vierge.
- **D-07:** Preview live côté : split view éditeur à gauche, preview du formulaire à droite. L'avocat voit en temps réel l'impact de ses modifications.

### Templates pré-construits
- **D-08:** 3 spécialités : Droit de la famille, Droit du travail, Droit pénal. Les 3 domaines les plus demandés pour les avocats solos.
- **D-09:** 5-8 questions spécifiques par template en plus des questions communes (contact, description). Ex droit famille : enfants, régime matrimonial, patrimoine. Assez pour qualifier sans surcharger le client.

### Expérience client
- **D-10:** URL dédiée par avocat : /intake/[slug-cabinet]. Le template personnalisé (questions, branding) se charge automatiquement. Le client ne voit que le formulaire de cet avocat.
- **D-11:** Co-branding : "Propulsé par LegalConnect" en footer + logo avocat en header. Couleurs accent de l'avocat utilisées. Identité LegalConnect préservée.

### Claude's Discretion
- Structure exacte du JSON schema (champs, types, validation rules)
- Types de champs supportés (texte, select, date, checkbox, textarea, etc.)
- Pattern de snapshot des réponses au moment de la soumission
- Mécanisme de drag & drop pour réordonner les questions (dnd-kit vs native)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Intake Form (existing)
- `apps/web/src/components/intake/intake-stepper.tsx` — Stepper actuel 4 étapes (à rendre dynamique)
- `apps/web/src/components/intake/step-contact.tsx` — Étape contact (réutilisable comme étape commune)
- `apps/web/src/components/intake/step-problem-type.tsx` — Sélection type problème (à remplacer par template)
- `apps/web/src/components/intake/step-description.tsx` — Description libre
- `apps/web/src/components/intake/step-documents.tsx` — Upload documents (réutilisable)
- `apps/web/src/lib/db/schema/intake.ts` — Schema intake actuel (intakeSubmissions)

### Lawyer Settings (existing)
- `apps/web/src/lib/db/schema/lawyer.ts` — lawyerProfiles avec specialties JSON
- `apps/web/src/server/actions/lawyer-settings.actions.ts` — CRUD profil avocat
- `apps/web/src/app/(app)/settings/cabinet/page.tsx` — Page paramètres cabinet existante

### Upload Pipeline
- `apps/web/src/components/upload/file-dropzone.tsx` — Pour logo upload dans branding

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `intake-stepper.tsx` — Stepper à adapter pour lire un JSON schema au lieu d'étapes hardcodées
- `step-contact.tsx`, `step-documents.tsx` — Étapes communes réutilisables dans tous les templates
- `lawyerProfiles.specialties` — Spécialités déjà stockées, sert de base pour proposer le bon template
- `file-dropzone.tsx` — Réutilisable pour upload logo avocat

### Established Patterns
- Server actions avec auth guards (requireAvocat, requireClient)
- RSC pages avec server-side data fetching
- shadcn/ui composants avec cn() et gap-*
- react-hook-form + Zod pour validation formulaires
- URL searchParams comme source de vérité

### Integration Points
- `/intake` route — Actuellement formulaire fixe, à remplacer par /intake/[slug]
- `lawyerProfiles` — Étendre avec templateId et branding fields
- `intakeSubmissions` — Ajouter templateSnapshotId pour snapshot au moment de soumission
- `/settings/cabinet` — Ajouter section template dans les paramètres avocat

</code_context>

<specifics>
## Specific Ideas

- Le stepper existant doit devenir un "dynamic stepper" qui lit sa config depuis le template JSON
- Les étapes communes (contact, documents) sont toujours présentes, les questions spécifiques sont insérées entre
- Le slug cabinet vient de lawyerProfiles (ex: "dupont-avocats" → /intake/dupont-avocats)
- Les couleurs d'accent de l'avocat s'appliquent via CSS variables sur la page intake

</specifics>

<deferred>
## Deferred Ideas

- Builder visuel drag & drop type Typeform — complexité v2
- Versioning de templates avec historique — v2 si audit requis
- Templates pour spécialités supplémentaires (immobilier, commercial, etc.) — ajoutables facilement
- White-label complet (pas de mention LegalConnect) — offre premium future
- Logique conditionnelle avancée (boucles, calculs) — v2
- Import/export de templates entre avocats — v2

</deferred>

---

*Phase: 08-intake-templates-customization*
*Context gathered: 2026-03-27*
