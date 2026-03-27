# Phase 6: Lawyer Dashboard - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Interface de gestion pour l'avocat : liste des dossiers entrants avec filtres et tri, vue detail complete (fiche synthetique IA, documents, timeline, score de qualification), notifications email pour les nouveaux dossiers, et page de configuration (specialites, profil, preferences notifications).

</domain>

<decisions>
## Implementation Decisions

### Liste des dossiers
- **D-01:** Tableau avec colonnes (pattern shadcn DataTable) : nom client, type probleme, score, statut, date. Tri par colonne. Responsive. Compact et scannable.
- **D-02:** Filtres : par statut (Nouveau, En cours, Termine, Archive), par specialite juridique, par tranche de score (faible/moyen/eleve), par date. Barre de recherche par nom client.

### Vue detail dossier
- **D-03:** Tabs horizontaux : Synthese | Documents | Timeline | Echanges IA. Score et statut visibles en header permanent au-dessus des tabs.
- **D-04:** Actions disponibles : changer le statut (Nouveau > En cours > Termine > Archive), ajouter des notes internes (pas visibles au client), regenerer la fiche IA, telecharger les documents.

### Notifications email
- **D-05:** Email immediat par evenement : nouveau dossier soumis, nouveau message client (Phase 7). Opt-out possible par type dans les parametres. Templates React Email avec ton chaleureux (coherent D-12 Phase 1).

### Configuration cabinet
- **D-06:** Page Parametres dediee : selection des specialites juridiques (famille, travail, penal, immobilier, commercial, autre), nom du cabinet, coordonnees, preferences de notification (opt-out par type).

### Claude's Discretion
- Colonnes exactes du DataTable (largeurs, formatage)
- Schema Drizzle pour lawyer_profiles et lawyer_notes
- Design des templates React Email
- Composants shadcn specifiques pour les tabs et filtres
- Pagination vs infinite scroll pour la liste

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — DASH-01, DASH-02, DASH-03, DASH-04
- `.planning/ROADMAP.md` §Phase 6 — success criteria and plan breakdown

### Prior phase context
- `.planning/phases/01-auth-encryption/01-CONTEXT.md` — D-07 (roles Avocat/Client), D-12 (ton chaleureux)
- `.planning/phases/05-case-intelligence/05-CONTEXT.md` — D-01 a D-07 (fiche, timeline, score, regeneration)

### Existing code
- `apps/web/src/server/actions/case-intelligence.actions.ts` — getCaseIntelligence(), regenerateCaseIntelligence()
- `apps/web/src/lib/db/schema/case-intelligence.ts` — caseSummaries, caseTimelines, qualificationScores tables
- `apps/web/src/lib/db/schema/intake.ts` — intakeSubmissions, intakeDocuments, extractionResults, aiFollowUps
- `packages/email/` — Package email existant pour les templates React Email
- `apps/web/src/components/ui/` — shadcn/ui components (DataTable a creer)

### Stack reference
- `./CLAUDE.md` §Technology Stack — React Email + Resend, shadcn/ui, Drizzle ORM, tRPC

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getCaseIntelligence()` — Retourne summary + timeline + score pour un dossier
- `packages/email/` — Package email existant dans le monorepo
- shadcn/ui DataTable (a initialiser) — Pattern officiel pour les tableaux filtres
- `apps/web/src/components/trust/` — Trust indicators reutilisables dans le dashboard

### Established Patterns
- Server actions pour les mutations (intake.actions.ts, case-intelligence.actions.ts)
- Drizzle ORM pour les schemas DB
- Auth.js avec auth() pour les verifications de session
- useTranslations pour l'i18n (francais uniquement v1)
- App Router avec route groups (app)

### Integration Points
- `apps/web/src/app/(app)/` — Route group pour les pages authentifiees
- `apps/web/src/lib/db/schema/` — Ajouter lawyer_profiles, lawyer_notes
- `packages/email/` — Templates pour notifications
- BullMQ — Reutiliser pour l'envoi d'emails asynchrones

</code_context>

<specifics>
## Specific Ideas

- Le score de qualification doit etre affiche avec un badge couleur (vert/orange/rouge) dans la liste et le header detail
- Les notes internes de l'avocat sont en texte riche simple (gras, italique, listes)
- Le header du detail dossier montre : nom client, type, score (badge), statut (dropdown), date de soumission

</specifics>

<deferred>
## Deferred Ideas

- Export PDF de la fiche synthetique — Phase 8 (customisation)
- Edition manuelle de la timeline par l'avocat — future version
- Logo et couleurs du cabinet — Phase 8 (customisation)
- Assignation a un collaborateur — future version (multi-user cabinet)

</deferred>

---

*Phase: 06-lawyer-dashboard*
*Context gathered: 2026-03-27*
