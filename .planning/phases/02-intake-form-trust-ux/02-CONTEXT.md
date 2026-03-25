# Phase 2: Intake Form & Trust UX - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Le client peut decrire sa situation juridique via un formulaire multi-etapes guide, uploader des pieces justificatives (PDF, images, videos) chiffrees cote client, et voir des indicateurs de securite contextuels a chaque interaction sensible.

</domain>

<decisions>
## Implementation Decisions

### Structure du formulaire
- **D-01:** Stepper lineaire guide avec barre de progression numerotee. Navigation avant/arriere entre etapes. Style Doctolib/Typeform.
- **D-02:** 4 etapes : 1) Type de probleme juridique 2) Description de la situation 3) Pieces justificatives (upload) 4) Coordonnees et preferences.
- **D-03:** Auto-save dans localStorage a chaque etape. Si le client ferme et revient, il reprend ou il en etait. Pas de compte requis pour commencer.

### Upload de fichiers
- **D-04:** Drag & drop + bouton "Parcourir" en fallback. Zone de drop visuelle avec apercu des fichiers (thumbnail pour images, icone pour PDF/video). Barre de progression avec badge "Chiffre" une fois uploade.
- **D-05:** Limite 50 Mo par fichier, 200 Mo total par dossier. Types acceptes : PDF, images (JPG/PNG/HEIC), videos (MP4/MOV/WebM).
- **D-06:** Stockage sur OVHcloud Object Storage (S3-compatible). Fichiers chiffres cote client via packages/crypto (XChaCha20-Poly1305) avant envoi. SSE-C pour le chiffrement at-rest supplementaire.

### Indicateurs de securite (Trust UX)
- **D-07:** Style subtil et integre. Petits badges discrets (cadenas vert, bouclier) a cote des champs sensibles. Tooltip "Vos donnees sont chiffrees de bout en bout" au survol.
- **D-08:** Placement contextuel : cadenas a cote des champs description et upload. Badge "Chiffre" qui apparait apres upload reussi. Banniere de confiance en haut de l'etape 1 uniquement.

### Ton et contenu
- **D-09:** Textes d'aide empathiques par etape. Message d'introduction rassurant a chaque etape (ex: "Prenez votre temps pour decrire votre situation. Il n'y a pas de mauvaise reponse."). Placeholders explicatifs dans les champs. Coherent avec D-12 Phase 1 (ton chaleureux, vouvoiement).
- **D-10:** Francais uniquement en v1. Vouvoiement. next-intl config minimale (une locale FR). L'anglais sera ajoute plus tard.

### Claude's Discretion
- Choix entre formulaire ouvert (login a la soumission) ou login requis des le debut. Claude choisit l'approche la plus adaptee a l'UX du produit.
- Choix des champs specifiques a chaque etape (types de problemes juridiques proposes, champs de description, etc.).
- Design system shadcn/ui : choix des composants specifiques, palette de couleurs, spacing.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in:
- `.planning/REQUIREMENTS.md` — INTK-01, INTK-03, INTK-04, SECU-03
- `.planning/ROADMAP.md` §Phase 2 — success criteria and plan breakdown
- `.planning/phases/01-auth-encryption/01-CONTEXT.md` — D-12 (ton chaleureux), encryption patterns
- `packages/crypto/src/encrypt.ts` — XChaCha20-Poly1305 encrypt/decrypt functions to reuse for file encryption
- `packages/crypto/src/keypair.ts` — X25519 keypair generation (keys needed for file encryption)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/crypto` : encrypt/decrypt XChaCha20-Poly1305, keypair generation — reutiliser pour chiffrer les fichiers avant upload
- `react-hook-form` + `zodResolver` : deja utilise dans les formulaires auth (register-form, login-form)
- `packages/shared/src/schemas/` : schemas Zod existants — ajouter les schemas intake ici
- `packages/email` : templates React Email — pour les confirmations de soumission

### Established Patterns
- Server Actions (`apps/web/src/server/actions/`) : pattern etabli en Phase 1
- Drizzle ORM schemas (`apps/web/src/lib/db/schema/`) : pattern pour ajouter tables intake/documents
- proxy.ts pour la protection de routes authentifiees

### Integration Points
- shadcn/ui : PAS encore installe — Phase 2 doit initialiser shadcn/ui dans apps/web
- OVHcloud Object Storage : nouveau — necessite @aws-sdk/client-s3 et config S3
- Nouvelle route `/intake` dans le App Router
- Nouveau schema Drizzle pour les soumissions intake et documents

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-intake-form-trust-ux*
*Context gathered: 2026-03-26*
