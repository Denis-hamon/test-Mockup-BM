# Phase 1: Auth & Encryption - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 01-auth-encryption
**Areas discussed:** Récupération de clés E2E, Stratégie de session auth, Parcours RGPD utilisateur, Emails transactionnels

---

## Récupération de clés E2E

### Génération de passphrase

| Option | Description | Selected |
|--------|-------------|----------|
| Générée par le système | 12 mots type BIP39, affichés une fois à l'inscription. Plus sûr — entropie garantie. UX type Signal/crypto wallet. | ✓ |
| Choisie par l'utilisateur | L'utilisateur crée sa propre phrase. Plus intuitif mais risque de faible entropie. | |
| Hybride | Système propose, utilisateur peut modifier ou choisir la sienne. | |

**User's choice:** Générée par le système
**Notes:** Aucune

### Perte de passphrase

| Option | Description | Selected |
|--------|-------------|----------|
| Perte définitive | Vrai E2E — aucun recours serveur. Les données chiffrées sont perdues. Similaire à Signal. | ✓ |
| Clé de secours côté serveur | Le serveur garde une clé d'escrow chiffrée. Permet la récupération mais affaiblit le modèle E2E. | |
| Contact de confiance | L'utilisateur désigne un contact qui peut aider à récupérer. Complexe à implémenter. | |

**User's choice:** Perte définitive
**Notes:** Aucune

### Timing de présentation

| Option | Description | Selected |
|--------|-------------|----------|
| Juste après l'inscription | Écran dédié post-signup avec les 12 mots. Confirmation requise avant de continuer. Bloquant. | ✓ |
| Après première action sensible | Affiché après le premier upload ou message. Moins intrusif. | |
| Tu décides | Claude choisit le meilleur moment dans le flow d'onboarding. | |

**User's choice:** Juste après l'inscription
**Notes:** Aucune

### Vérification de la passphrase

| Option | Description | Selected |
|--------|-------------|----------|
| Resaisie de 3 mots aléatoires | Demander de retaper le mot #3, #7 et #11 par exemple. Standard crypto wallets. | ✓ |
| Checkbox simple | "J'ai bien noté ma phrase de récupération". Rapide mais pas de vérification réelle. | |
| Resaisie complète | L'utilisateur retape les 12 mots. Très sûr mais UX lourde. | |

**User's choice:** Resaisie de 3 mots aléatoires
**Notes:** Aucune

---

## Stratégie de session auth

### Durée de session

| Option | Description | Selected |
|--------|-------------|----------|
| 30 jours | Standard SaaS. L'utilisateur reste connecté longtemps. Refresh token silencieux. | ✓ |
| 7 jours | Plus conservateur. Reconnexion chaque semaine. | |
| 24 heures | Très strict. Reconnexion quotidienne. | |

**User's choice:** 30 jours
**Notes:** Aucune

### Politique multi-appareils

| Option | Description | Selected |
|--------|-------------|----------|
| Sessions multiples autorisées | PC + mobile en parallèle. Chaque appareil a sa propre clé de session. | ✓ |
| Session unique | Un seul appareil à la fois. Connexion ailleurs = déconnexion automatique. | |
| Tu décides | Claude choisit selon les bonnes pratiques pour un outil juridique. | |

**User's choice:** Sessions multiples autorisées
**Notes:** Aucune

### Rôles utilisateurs

| Option | Description | Selected |
|--------|-------------|----------|
| Deux rôles dès le départ | Avocat et Client distincts dans le schéma DB. L'inscription demande le type. | ✓ |
| Compte unique, rôles plus tard | Tout le monde est "user". Plus simple mais migration coûteuse plus tard. | |
| Tu décides | Claude choisit l'approche la plus pragmatique. | |

**User's choice:** Deux rôles dès le départ
**Notes:** Aucune

### Force du mot de passe

| Option | Description | Selected |
|--------|-------------|----------|
| 8+ caractères, indicateur de force | Minimum 8 caractères avec indicateur visuel. Pas de règles rigides — approche NIST. | ✓ |
| 12+ caractères, règles strictes | Minimum 12 + majuscule + chiffre + spécial. Plus sécurisé mais frustrant. | |
| Tu décides | Claude suit les recommandations NIST/ANSSI actuelles. | |

**User's choice:** 8+ caractères, indicateur de force
**Notes:** Aucune

---

## Parcours RGPD utilisateur

### Consentement RGPD

| Option | Description | Selected |
|--------|-------------|----------|
| Bannière + page dédiée | Checkbox à l'inscription + page Paramètres de confidentialité. Consentement granulaire. | ✓ |
| Consentement minimal | Simple checkbox CGU à l'inscription. Pas de granularité. | |
| Tu décides | Claude implémente selon les bonnes pratiques RGPD françaises. | |

**User's choice:** Bannière + page dédiée
**Notes:** Aucune

### Export de données

| Option | Description | Selected |
|--------|-------------|----------|
| Bouton dans les paramètres | "Exporter mes données" dans la page Compte. ZIP (JSON + fichiers). Délai max 48h. | ✓ |
| Sur demande par email | L'utilisateur envoie un email, traitement manuel. | |
| Tu décides | Claude choisit l'approche la plus pragmatique. | |

**User's choice:** Bouton dans les paramètres
**Notes:** Aucune

### Suppression de compte

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete + période de grâce 30j | Compte désactivé immédiatement, données purgées après 30 jours. Annulation possible. | ✓ |
| Suppression immédiate | Tout effacé dès confirmation. Irréversible. | |
| Tu décides | Claude choisit la meilleure pratique RGPD. | |

**User's choice:** Soft delete + période de grâce 30j
**Notes:** Aucune

---

## Emails transactionnels

### Ton des emails

| Option | Description | Selected |
|--------|-------------|----------|
| Professionnel chaleureux | Vouvoiement, rassurant mais pas froid. Cohérent avec la promesse d'empathie. | ✓ |
| Minimaliste technique | Juste les infos nécessaires, pas de fioriture. | |
| Tu décides | Claude adapte le ton selon les bonnes pratiques. | |

**User's choice:** Professionnel chaleureux
**Notes:** Aucune

### Expéditeur

| Option | Description | Selected |
|--------|-------------|----------|
| LegalConnect <noreply@legalconnect.fr> | Nom du produit, domaine dédié. Professionnel, clair. | ✓ |
| L'équipe LegalConnect <contact@legalconnect.fr> | Plus humain, invite à répondre. | |
| Tu décides | Claude choisit selon les bonnes pratiques de délivrabilité. | |

**User's choice:** LegalConnect <noreply@legalconnect.fr>
**Notes:** Aucune

### Durée de validité des liens

| Option | Description | Selected |
|--------|-------------|----------|
| 24h vérification, 1h reset | Lien vérification 24h, lien reset password 1h. | ✓ |
| Durées identiques (6h) | 6h pour les deux types. Simple. | |
| Tu décides | Claude applique les standards de sécurité. | |

**User's choice:** 24h vérification, 1h reset
**Notes:** Aucune

---

## Claude's Discretion

Aucun domaine délégué — toutes les décisions ont été prises par l'utilisateur.

## Deferred Ideas

Aucune — la discussion est restée dans le périmètre de la phase.
