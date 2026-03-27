# Phase 7: Client Portal - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Espace partagé client-avocat avec : messagerie E2E chiffrée en temps réel, partage de documents sécurisé, suivi de dossier côté client (statut + timeline), et demandes de rendez-vous avec confirmation manuelle par l'avocat.

</domain>

<decisions>
## Implementation Decisions

### Messagerie E2E
- **D-01:** Chat temps réel (WebSocket ou SSE). Interface type conversation avec bulles, indicateur de frappe. Messages instantanés.
- **D-02:** Pièces jointes fichiers + images dans les messages. Réutilise le pipeline d'upload chiffré de Phase 2 (file-dropzone, XChaCha20-Poly1305).
- **D-03:** Accusés de lecture optionnels — l'avocat active/désactive dans ses paramètres (page /settings/cabinet existante). "Lu" discret sous le message quand activé.
- **D-04:** Chiffrement X25519 key exchange. Chaque user a déjà un keypair (Phase 1). Dériver une clé partagée par conversation. Messages chiffrés XChaCha20-Poly1305. Pattern Signal simplifié.
- **D-05:** Notifications nouveaux messages : email immédiat si pas en ligne + badge/compteur de messages non lus in-app. Réutilise React Email.

### Suivi de dossier client
- **D-06:** Le client voit le statut actuel (Nouveau/En cours/Terminé) et la timeline des événements (soumission, prise en charge, messages). PAS le score de qualification ni les notes internes de l'avocat.
- **D-07:** Multi-dossiers : un client peut avoir plusieurs dossiers en parallèle. Liste de dossiers dans le portail.
- **D-08:** Le client retrouve tous ses documents uploadés avec possibilité de retéléchargement.

### Rendez-vous
- **D-09:** Demande libre avec préférences : le client indique ses disponibilités (jours/créneaux préférés) via un formulaire. L'avocat confirme ou propose un créneau manuellement. Pas de calendrier synchronisé en v1.
- **D-10:** Deux types de rendez-vous : visio (lien généré automatiquement) et présentiel (adresse du cabinet). L'avocat configure ses options dans les paramètres.
- **D-11:** Rappels email J-1 et J-0 (matin du rendez-vous). Templates React Email.

### UX & Navigation portail
- **D-12:** Dashboard client avec sidebar : page d'accueil avec résumé (dossiers en cours, messages non lus, prochain RDV) + sidebar (Mes dossiers, Messages, Rendez-vous, Documents, Paramètres).
- **D-13:** Layout partagé avec le dashboard avocat + thème différent. Même structure (sidebar, header) mais contenu de la sidebar adapté au rôle. Moins de code dupliqué.
- **D-14:** Indicateurs de sécurité discrets : cadenas à côté de la zone messages ("Chiffré bout en bout"), badge "Connexion sécurisée" dans le header. Cohérent avec Phase 2 (SECU-03).

### Claude's Discretion
- Recherche dans l'historique des messages : optimiser selon les contraintes E2E (recherche locale côté client si possible)
- Choix technique WebSocket vs SSE pour le temps réel
- Pattern de stockage des messages chiffrés côté serveur
- Gestion de la pagination/chargement des messages anciens

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Encryption & Security
- `packages/crypto/src/keypair.ts` — X25519 keypair generation (réutiliser pour key exchange messaging)
- `packages/crypto/src/encrypt.ts` — XChaCha20-Poly1305 encrypt/decrypt (réutiliser pour messages)
- `packages/crypto/src/kdf.ts` — Key derivation functions
- `apps/web/src/server/actions/encryption.actions.ts` — Server-side encryption actions

### File Upload Pipeline
- `apps/web/src/components/upload/file-dropzone.tsx` — Drag & drop upload (réutiliser pour pièces jointes messages)
- `apps/web/src/components/upload/file-preview.tsx` — File preview component
- `apps/web/src/server/actions/upload.actions.ts` — S3 encrypted upload action

### Dashboard Patterns
- `apps/web/src/server/actions/dashboard.actions.ts` — Server action patterns (requireAvocat, query patterns)
- `apps/web/src/components/dashboard/` — UI component patterns (tabs, badges, etc.)
- `apps/web/src/app/(app)/layout.tsx` — App layout with sidebar navigation

### Email Templates
- `packages/email/src/` — Existing email templates and send helper (ton chaleureux, vouvoiement)

### Auth & Roles
- `apps/web/src/lib/db/schema/auth.ts` — User schema with role enum (avocat/client)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/crypto/` — Keypair, encrypt, kdf complets pour E2E messaging
- `apps/web/src/components/upload/` — File dropzone et preview pour pièces jointes
- `packages/email/` — Templates React Email + sendHelper pour notifications
- `apps/web/src/components/dashboard/` — Patterns RSC + server actions, tabs, badges
- `apps/web/src/app/(app)/layout.tsx` — Layout avec sidebar (à étendre pour rôle client)

### Established Patterns
- Server actions avec auth guard (requireAvocat → créer requireClient)
- RSC pages avec server-side data fetching
- URL searchParams comme source de vérité pour filtres/pagination
- Toast notifications via Sonner (Toaster dans root layout)
- Fire-and-forget email pattern (void IIFE)

### Integration Points
- `apps/web/src/app/(app)/layout.tsx` — Sidebar à conditionner par rôle (avocat vs client)
- `apps/web/src/lib/db/schema/` — Nouveaux schemas pour messages, conversations, rendez-vous
- `packages/email/src/` — Nouveaux templates (nouveau message, rappel RDV)

</code_context>

<specifics>
## Specific Ideas

- Le chat doit être rassurant : cadenas visible, indication "chiffré bout en bout" à côté de la zone de saisie
- Timeline client simplifiée par rapport à celle de l'avocat (pas de détails internes)
- Les rappels RDV doivent suivre le même ton chaleureux que les autres emails (D-12 Phase 1)

</specifics>

<deferred>
## Deferred Ideas

- Calendrier synchronisé type Calendly (intégration Google Calendar / Outlook) — complexité v2
- Messages vocaux — enregistrement audio + chiffrement — Phase ultérieure
- Notifications push browser (Web Push API) — après v1 email + in-app
- Visioconférence intégrée (WebRTC) — v1 génère juste un lien externe
- Recherche full-text côté serveur des messages (incompatible E2E actuel)

</deferred>

---

*Phase: 07-client-portal*
*Context gathered: 2026-03-27*
