# Phase 1: Auth & Encryption - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

User accounts (avocat and client roles), authentication (signup, login, email verification, password reset), E2E encryption with libsodium (client-side key management, passphrase-based recovery), and RGPD compliance infrastructure (consent, data export, account deletion).

</domain>

<decisions>
## Implementation Decisions

### Récupération de clés E2E
- **D-01:** Passphrase de récupération générée par le système — 12 mots type BIP39, affichés une fois à l'inscription. Entropie garantie, pas de choix utilisateur.
- **D-02:** Perte de passphrase = perte définitive des données chiffrées. Vrai E2E, aucun recours serveur. Message d'avertissement clair à l'inscription.
- **D-03:** Passphrase présentée juste après l'inscription, écran dédié bloquant. L'utilisateur ne peut pas continuer sans confirmer.
- **D-04:** Vérification par resaisie de 3 mots aléatoires parmi les 12. Standard crypto wallets, bonne balance sécurité/UX.

### Stratégie de session auth
- **D-05:** Sessions de 30 jours avec refresh token silencieux. Standard SaaS.
- **D-06:** Sessions multiples autorisées — PC + mobile en parallèle. Chaque appareil a sa propre clé de session.
- **D-07:** Deux rôles distincts dès le départ : Avocat et Client. L'inscription demande le type de compte. Évite une migration coûteuse plus tard.
- **D-08:** Mot de passe minimum 8 caractères avec indicateur visuel de force (faible/moyen/fort). Pas de règles rigides (majuscule obligatoire, etc.) — approche NIST.

### Parcours RGPD
- **D-09:** Consentement RGPD via bannière à l'inscription + page Paramètres de confidentialité accessible plus tard. Consentement granulaire (données essentielles vs analytics).
- **D-10:** Export de données via bouton dans les paramètres du compte. Génère un ZIP (JSON + fichiers) téléchargeable ou envoyé par email. Délai max 48h si gros volume.
- **D-11:** Suppression de compte en soft delete avec période de grâce de 30 jours. Compte désactivé immédiatement, données purgées après 30 jours. Annulation possible pendant le délai. Email de confirmation.

### Emails transactionnels
- **D-12:** Ton professionnel chaleureux. Vouvoiement, rassurant mais pas froid. Cohérent avec la promesse d'empathie du produit.
- **D-13:** Expéditeur : `LegalConnect <noreply@legalconnect.fr>`. Nécessite config DNS (SPF/DKIM).
- **D-14:** Lien de vérification email valable 24h. Lien de reset password expire en 1h.

### Claude's Discretion
- Aucun domaine délégué — toutes les décisions ont été prises par l'utilisateur.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in:
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04, SECU-01, SECU-02
- `.planning/ROADMAP.md` §Phase 1 — success criteria and plan breakdown
- `.planning/PROJECT.md` — constraints (sécurité, hébergement OVHcloud, RGPD)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Aucun — projet greenfield. Le codebase actuel (`content-pipeline-ovh`) est un projet différent.

### Established Patterns
- Stack défini dans CLAUDE.md : Next.js 16, Auth.js v5, Drizzle ORM, PostgreSQL, libsodium-wrappers, React Email + Resend
- Monorepo Turborepo avec pnpm prévu

### Integration Points
- Le schéma DB avec RLS (Row-Level Security) sera le fondement de toutes les phases suivantes
- Le système de clés E2E sera utilisé par Phase 2 (upload chiffré), Phase 7 (messagerie chiffrée)
- Les rôles avocat/client impactent Phase 6 (dashboard avocat) et Phase 7 (portail client)

</code_context>

<specifics>
## Specific Ideas

- Passphrase BIP39 type Signal/crypto wallet — UX de référence
- Indicateur de force du mot de passe visuel (barre colorée faible/moyen/fort)
- Email de bienvenue chaleureux cohérent avec le positionnement empathique du produit

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-auth-encryption*
*Context gathered: 2026-03-25*
