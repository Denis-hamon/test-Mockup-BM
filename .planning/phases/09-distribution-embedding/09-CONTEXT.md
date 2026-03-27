# Phase 9: Distribution & Embedding - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Widget embeddable via script tag (Shadow DOM + Vite IIFE bundle) avec bouton flottant modal, et pages hébergées par avocat (/cabinet-[slug]) avec landing page + intake dynamique. Distribution self-hosted, documentation d'intégration in-app.

</domain>

<decisions>
## Implementation Decisions

### Widget embeddable
- **D-01:** Shadow DOM inline — le script crée un Shadow DOM directement dans la page hôte. Isolation CSS totale, pas d'iframe. Vite IIFE bundle per CLAUDE.md stack.
- **D-02:** Mode modal avec bouton flottant — bouton en bas à droite "Prendre rendez-vous". Clic ouvre le formulaire en modal overlay dans le Shadow DOM. Pattern type Intercom/Drift.
- **D-03:** Configuration via attributs data-* sur le script tag : `<script src="https://app.legalconnect.fr/widget.js" data-slug="dupont-avocats" data-lang="fr" data-color="#1a365d">`. Simple, standard, pas de JS supplémentaire.

### Pages hébergées avocat
- **D-04:** Landing page + intake : /cabinet-dupont affiche une présentation du cabinet (nom, spécialités, photo optionnelle) + call-to-action vers le formulaire d'intake en dessous. Mini site vitrine + formulaire.
- **D-05:** Meta tags dynamiques générés depuis le profil avocat. Title, description, OG image personnalisés. Ex: "Cabinet Dupont - Avocat en droit de la famille | Consultation en ligne".

### Intégration & déploiement
- **D-06:** Self-hosted /widget.js — le fichier JS servi depuis le même domaine que l'app. Pas de CDN tiers. Contrôle total, OVHcloud EU compatible.
- **D-07:** Page /settings/cabinet/integration dans l'app avec snippet `<script>` prêt à copier, instructions en 3 étapes, et prévisualisation du widget. L'avocat n'a qu'à copier-coller.

### Claude's Discretion
- Architecture du build Vite IIFE (entry point, config, output)
- Communication Shadow DOM → app API (fetch direct ou postMessage)
- Stratégie de cache/versioning du widget.js (hash dans URL ou header)
- Responsive du bouton flottant sur mobile
- OG image generation (static template ou dynamic avec satori/og)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Intake Route (Phase 8)
- `apps/web/src/app/intake/[slug]/page.tsx` — Route intake standalone existante (réutilisable pour hosted page)
- `apps/web/src/app/intake/[slug]/layout.tsx` — Layout standalone sans sidebar
- `apps/web/src/components/intake/dynamic-stepper.tsx` — Stepper dynamique (réutiliser dans widget)
- `apps/web/src/components/intake/cobranding-footer.tsx` — Co-branding footer

### Template Engine (Phase 8)
- `apps/web/src/server/actions/template.actions.ts` — getTemplateBySlug, saveTemplate
- `packages/shared/src/schemas/intake-template.ts` — Zod schema templates

### Lawyer Profile
- `apps/web/src/lib/db/schema/lawyer.ts` — lawyerProfiles (slug, specialties, branding)
- `apps/web/src/server/actions/lawyer-settings.actions.ts` — getLawyerProfile

### CLAUDE.md Stack
- Vite 6.x pour widget bundler (IIFE output)
- Shadow DOM natif pour isolation CSS
- React 19.x dans le widget (même version que l'app)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `/intake/[slug]` route — DIST-02 (hosted pages) est presque déjà implémenté par Phase 8 ! Il suffit d'ajouter une landing page au-dessus du formulaire.
- `dynamic-stepper.tsx` — Le formulaire dynamique complet, réutilisable dans le widget Shadow DOM
- `cobranding-footer.tsx` — Footer "Propulsé par LegalConnect"
- `lawyerProfiles` — Données branding (logo, couleurs, slug) déjà en base

### Established Patterns
- RSC pages avec server-side data fetching
- CSS variables pour branding avocat (--lawyer-accent, --lawyer-bg)
- Standalone layout sans app chrome

### Integration Points
- `/settings/cabinet/` — Ajouter section "Intégration" avec snippet widget
- `apps/widget/` — Nouveau package dans le monorepo pour le build Vite IIFE
- `/cabinet-[slug]` ou `/[slug]` — Nouvelle route pour la landing page hébergée
- `public/widget.js` ou route API pour servir le bundle

</code_context>

<specifics>
## Specific Ideas

- Le widget Shadow DOM doit charger les composants React dans un container isolé (createRoot dans shadowRoot)
- Le bouton flottant doit être personnalisable via data-* (position, texte, couleur)
- La landing page hébergée réutilise les données de lawyerProfiles (nom cabinet, spécialités, photo, description)
- Le snippet copiable dans /settings inclut le slug auto-généré et les couleurs du profil

</specifics>

<deferred>
## Deferred Ideas

- Widget iframe comme fallback pour navigateurs sans Shadow DOM — v2
- Mode inline embed (data-mode="inline") — v2
- CDN externe pour distribution plus rapide — v2 si trafic important
- Analytics d'utilisation du widget (vues, conversions) — v2
- A/B testing de la landing page — v2
- Multi-langue dans le widget (data-lang) — actuellement FR only

</deferred>

---

*Phase: 09-distribution-embedding*
*Context gathered: 2026-03-27*
