# LegalConnect — Description Fonctionnelle Produit

> **Version :** 1.0 — Mars 2026
> **Positionnement :** Portail client intelligent pour avocats — à la croisée de Calendly et Doctolib, conçu pour le juridique.

---

## Vision produit

**Le problème.** Quand un particulier a un problème juridique, le premier contact avec un avocat est anxiogène, désorganisé et inefficace. Le client ne sait pas quoi dire, oublie des détails importants, n'a pas ses documents. L'avocat reçoit des demandes incomplètes, perd du temps à requalifier, et le client a l'impression de ne pas être compris.

**La promesse.** LegalConnect permet au client d'exprimer sa situation juridique de manière complète et structurée, guidé par une IA empathique, dans un environnement perçu comme totalement sécurisé — pour que l'avocat reçoive un dossier parfaitement qualifié dès le premier contact.

**Le résultat.** L'avocat ouvre un dossier et trouve : un résumé IA de la situation, une chronologie des faits, les documents clés déjà analysés, un score de qualification. Le client, lui, a eu le sentiment d'être écouté et accompagné — pas interrogé.

---

## Les deux utilisateurs

### L'avocat (persona : Me Sophie Martin)

Avocate en droit de la famille, cabinet solo. 40 ans, débordée. Reçoit des demandes par email, téléphone, formulaire de contact — aucun format standard. Passe 30 min par nouveau dossier juste à comprendre la situation.

**Ce qu'elle veut :**
- Recevoir des dossiers pré-qualifiés, prêts à traiter
- Ne pas courir après les documents manquants
- Avoir une vision claire de la charge entrante
- Garder le contrôle sur son image et sa relation client

### Le client (persona : Jean Dupont)

38 ans, en procédure de divorce. Stressé, ne connaît pas le vocabulaire juridique. A peur de "mal dire" les choses. Veut être rassuré sur la confidentialité.

**Ce qu'il veut :**
- Être guidé pas à pas, sans jargon
- Sentir que ses données sont en sécurité
- Pouvoir s'exprimer à son rythme, sans pression
- Avoir un espace de communication simple avec son avocat

---

## Les parcours utilisateur

### Parcours 1 — L'avocat configure son cabinet

```
Inscription → Phrase de récupération → Paramètres cabinet → Choix du template → Personnalisation → Publication
```

**1. Inscription et sécurité**

L'avocat crée son compte avec email + mot de passe. Le système génère une paire de clés de chiffrement (X25519) et affiche une phrase de récupération de 12 mots (BIP39). C'est un écran bloquant — impossible de continuer sans confirmer avoir noté les mots. Cette phrase est le seul moyen de récupérer ses données chiffrées en cas de perte d'accès.

*Pourquoi ce choix UX :* Les avocats manipulent des données ultra-sensibles. Le chiffrement bout en bout n'est pas un argument marketing — c'est une obligation déontologique. La phrase de récupération, bien que contraignante, établit un contrat de confiance : "vos données sont si bien protégées que même nous ne pouvons pas y accéder".

**2. Configuration du cabinet**

L'avocat renseigne son profil (nom du cabinet, téléphone, spécialités, logo, photo). Ces informations alimentent sa page publique et le widget intégrable.

**3. Template d'intake**

L'avocat choisit parmi des templates pré-construits par spécialité :
- **Droit de la famille** — 7 questions (situation familiale, enfants, régime matrimonial, patrimoine, urgence, partie adverse, issue souhaitée)
- **Droit du travail** — 6 questions (type de contrat, ancienneté, motif du litige, convention collective, urgence)
- **Droit pénal** — 5 questions (nature des faits, date, garde à vue, antécédents, urgence)

Chaque template est personnalisable : l'avocat peut réordonner les questions (drag-and-drop), en ajouter, en supprimer, modifier les libellés, ajouter des conditions d'affichage (ex: "Afficher la question sur les enfants uniquement si la situation familiale est Marié ou Pacsé").

6 types de champs disponibles : texte, zone de texte, sélection, date, case à cocher, email/téléphone/nombre.

**4. Branding et publication**

L'avocat personnalise l'apparence : logo, couleur d'accentuation, texte d'accueil, slug d'URL. Il obtient deux canaux de distribution :

- **Page hébergée** : `legalconnect.fr/cabinet-maitre-martin` — une landing page autonome avec hero, spécialités, et formulaire d'intake intégré. Optimisée SEO avec métadonnées OpenGraph dynamiques.
- **Widget intégrable** : un snippet `<script>` à coller sur son site. Le widget s'ouvre dans un modal en Shadow DOM (isolation CSS totale), avec le branding de l'avocat.

---

### Parcours 2 — Le client soumet sa demande

```
Arrivée (page avocat ou widget) → Formulaire guidé → IA empathique → Documents → Coordonnées → Confirmation
```

**1. Premier contact**

Le client arrive soit sur la page hébergée de l'avocat (lien partagé, Google), soit via le widget sur le site de l'avocat. Dans les deux cas, il voit le nom du cabinet, les spécialités, et un bouton "Commencer ma demande".

*Design UX :* Pas de formulaire visible immédiatement. D'abord une zone d'accueil rassurante avec le logo, les spécialités, un texte chaleureux. Le bouton d'action utilise la couleur d'accent de l'avocat. L'objectif est de créer un sentiment de "je suis au bon endroit".

**2. Formulaire multi-étapes**

Le formulaire se déroule en 4 étapes avec un stepper visuel :

| Étape | Contenu | Objectif UX |
|-------|---------|-------------|
| **1. Problème** | Type de problème juridique (sélection) | Canaliser sans intimider |
| **2. Situation** | Description libre + questions guidées du template | Libérer la parole |
| **3. Documents** | Upload drag-and-drop (PDF, images, vidéos) | Apporter les preuves |
| **4. Contact** | Nom, téléphone, mode de contact préféré | Finaliser |

*Chaque étape affiche un bandeau de confiance :* "Vos données sont protégées par un chiffrement de bout en bout. Ni nous, ni personne d'autre ne peut y accéder." avec une icône bouclier verte.

**3. IA empathique (étape 2)**

Après la description libre, l'IA intervient avec des questions de suivi contextuelles, en streaming. Le ton est chaleureux et non-intrusif :

> "Je comprends que cette situation est difficile. Pour aider votre avocat à bien comprendre votre cas, pourriez-vous me préciser depuis quand cette situation dure ?"

L'utilisateur peut répondre ou passer. L'IA ne donne jamais de conseil juridique (garde-fous UPL intégrés). Elle extrait des informations structurées (dates, montants, parties) pour enrichir le dossier.

*Pourquoi l'IA ici :* Un formulaire statique ne capture que ce qu'il demande. L'IA conversationnelle capture ce que le client n'aurait pas pensé à mentionner. C'est la différence entre un formulaire et un entretien préliminaire.

**4. Upload de documents**

Zone de drag-and-drop acceptant PDF, images (JPG, PNG, HEIC), vidéos (MP4, MOV, WebM). Limite : 50 Mo par fichier, 200 Mo total.

Chaque fichier est :
1. Chiffré côté navigateur avant upload (AES-256 via clé dérivée)
2. Uploadé vers le stockage objet OVHcloud (S3-compatible, SSE-C)
3. Analysé automatiquement par le pipeline d'extraction (Docling pour PDF, Vision API pour images)

L'extraction identifie : dates, parties, montants, clauses clés. Le client peut corriger les résultats d'extraction avant soumission.

**5. Soumission et confirmation**

À la soumission :
- Un snapshot du template est figé (la version exacte du formulaire est conservée)
- Le pipeline d'intelligence artificielle se déclenche en arrière-plan (résumé, chronologie, score)
- L'avocat reçoit une notification email ("Nouveau dossier — Droit de la famille — Jean Dupont")
- Le client voit un écran de confirmation chaleureux

---

### Parcours 3 — L'avocat traite le dossier

```
Notification email → Dashboard → Dossier détaillé → Notes internes → Changement de statut → Communication
```

**1. Dashboard**

Vue d'ensemble avec 4 indicateurs :
- **Total dossiers** — nombre total hors brouillons
- **Nouveaux** — dossiers soumis, pas encore ouverts
- **En cours** — dossiers en traitement
- **Terminés** — dossiers clôturés

Chaque carte est cliquable et filtre la liste des dossiers.

**2. Liste des dossiers**

Tableau filtrable et triable :
- **Filtres :** statut (Nouveau / En cours / Terminé / Archivé), score de qualification (Faible / Moyen / Élevé), plage de dates, recherche textuelle
- **Colonnes :** nom client, type de problème, score, statut, date
- **Tri :** sur chaque colonne, ascendant/descendant
- **Pagination :** 20 dossiers par page avec navigation

*Version mobile :* Les dossiers passent en vue cartes (pas de tableau).

**3. Dossier détaillé**

Le dossier s'ouvre avec 4 onglets :

**Synthèse** — Résumé IA du cas (généré automatiquement) :
- Résumé textuel de la situation
- Faits clés extraits (liste structurée)
- Domaine juridique identifié
- Parties impliquées
- Montants en jeu
- Évaluation d'urgence
- Indicateurs de solidité du dossier

**Chronologie** — Frise temporelle des événements extraits par l'IA :
- Événements datés (triés chronologiquement)
- Événements non datés (listés séparément)
- Source de chaque événement (description client, document X, échange IA)

**Documents** — Galerie des pièces jointes :
- Aperçu miniature
- Type de fichier, taille, date d'ajout
- Résultats d'extraction (dates, parties, montants, clauses)

**Échanges IA** — Historique de l'intake conversationnel :
- Questions posées par l'IA
- Réponses du client
- Marqueurs d'émotion détectés (stress, urgence, hésitation)

**Score de qualification** — Badge visible sur la carte et le détail :
- Score global 0-100 (Faible / Moyen / Élevé)
- Sous-scores : urgence, complétude, complexité
- Justification textuelle de l'IA

**Notes internes** — L'avocat peut ajouter des notes privées (jamais visibles par le client). CRUD complet avec vérification de propriété.

**Statut** — Workflow en 4 états :
```
Nouveau → En cours → Terminé → Archivé
```
Transitions vers l'avant uniquement. L'archivage demande une confirmation (dialog).

---

### Parcours 4 — Communication avocat-client

```
Avocat ouvre le portail → Message chiffré → Client reçoit notification → Réponse → Échange en temps réel
```

**Messagerie chiffrée de bout en bout**

Le chat utilise le protocole crypto_kx (X25519 key exchange) pour dériver un secret partagé entre l'avocat et le client. Chaque message est chiffré avec XChaCha20-Poly1305 côté navigateur avant envoi. Le serveur ne stocke que le ciphertext + nonce.

*Interface :*
- Vue conversation (liste à gauche, messages à droite sur desktop ; navigation séquentielle sur mobile)
- Indicateurs de frappe en temps réel (SSE)
- Accusés de lecture
- Pièces jointes chiffrées
- Badge "Chiffré de bout en bout" visible en permanence

*Notifications :*
- Email "Vous avez un nouveau message" (jamais le contenu du message)
- Badge de compteur non-lu dans la sidebar

---

### Parcours 5 — Prise de rendez-vous

```
Client demande un rendez-vous → Avocat confirme/refuse → Notification → Rappel J-1 et J-0
```

Le système de rendez-vous est volontairement **manuel** (pas de Calendly automatique). L'avocat garde le contrôle total.

**1. Demande (client)**
- Type : visioconférence ou présentiel
- Dates souhaitées (multi-sélection)
- Créneaux préférés (matin/après-midi/soir)
- Note optionnelle

**2. Réponse (avocat)**
- **Confirmer** : choisit une date/heure parmi les propositions, ajoute le lien Jitsi (visio) ou l'adresse du cabinet (présentiel)
- **Refuser** : avec motif optionnel

**3. Notifications**
- Demande → email à l'avocat
- Confirmation → email au client (avec lien visio ou adresse)
- Refus → email au client
- Rappels → cron J-1 à 9h + J-0 à 8h (aux deux parties)

*Pourquoi pas d'auto-booking :* Un avocat ne prend pas de rendez-vous comme un médecin. La qualification préalable du dossier conditionne le type et la durée du rendez-vous. Le contrôle manuel est une feature, pas un manque.

---

### Parcours 6 — Espace client (portail)

Le client authentifié accède à son portail avec une navigation dédiée :

| Section | Contenu |
|---------|---------|
| **Accueil** | Dossiers actifs, messages non lus, prochain rendez-vous, activité récente |
| **Mes dossiers** | Liste de ses soumissions avec statut (Nouveau → En cours → Terminé) |
| **Messages** | Messagerie E2E avec son avocat |
| **Rendez-vous** | Liste des rendez-vous (en attente, confirmés, passés) |
| **Documents** | Galerie de tous les documents partagés |
| **Paramètres** | Informations personnelles, notifications, sécurité (phrase de récupération), export RGPD |

*Le portail client est visuellement distinct du dashboard avocat* : même design system mais navigation et contenu adaptés au rôle.

---

## Principes UX

### 1. La confiance avant tout

Chaque écran rappelle visuellement la sécurité :
- Badge "Connexion sécurisée" dans le header (vert, icône bouclier)
- Bandeau de chiffrement sur le formulaire d'intake
- Badge E2E sur chaque message
- Indicateur de chiffrement lors de l'upload

*La couleur verte (trust green)* est utilisée exclusivement pour les éléments de sécurité — jamais pour des actions commerciales.

### 2. L'empathie par le design

- Les textes utilisent le "vous" et un ton chaleureux, jamais bureaucratique
- Les messages d'erreur sont explicatifs ("Vérifiez votre connexion") pas techniques
- Les états vides sont encourageants ("Votre premier dossier apparaîtra ici")
- L'IA conversationnelle utilise des formulations empathiques et reconnaît les émotions

### 3. Le progressive disclosure

- Le formulaire d'intake ne montre qu'une étape à la fois
- Les questions conditionnelles apparaissent en contexte
- Le dashboard résume avant de détailler
- Les paramètres avancés sont dans des sections collapser

### 4. L'accessibilité

- Tailles tactiles minimum 44px sur tous les éléments interactifs
- Navigation clavier complète (focus visible, skip links)
- ARIA labels sur les éléments non-textuels
- Contrastes conformes WCAG (composants Radix UI)

### 5. Mobile-first

- Sidebar collapsée en sheet (hamburger menu) sous `lg`
- Tableau de dossiers → vue cartes sur mobile
- Chat responsive (liste ou conversation, pas les deux)
- Formulaire d'intake pleine largeur

---

## Architecture de l'information

```
LegalConnect
├── Public
│   ├── / ........................ Landing page
│   ├── /login .................. Connexion
│   ├── /register ............... Inscription (choix avocat/client)
│   ├── /cabinet-{slug} ......... Page publique de l'avocat
│   └── /intake/{slug} .......... Formulaire d'intake public
│
├── Espace Avocat
│   ├── /dashboard .............. Vue d'ensemble + stats
│   ├── /dossiers ............... Liste filtrée des dossiers
│   ├── /dossiers/{id} .......... Détail dossier (4 onglets)
│   └── /settings
│       ├── /cabinet ............ Profil du cabinet
│       ├── /cabinet/template ... Éditeur de template
│       ├── /cabinet/integration  Widget + page hébergée
│       ├── /privacy ............ Confidentialité
│       ├── /export ............. Export RGPD
│       └── /delete ............. Suppression de compte
│
└── Espace Client
    ├── /portail ................ Accueil + résumé
    ├── /portail/dossiers ....... Mes dossiers
    ├── /portail/dossiers/{id} .. Détail d'un dossier
    ├── /portail/messages ....... Messagerie E2E
    ├── /portail/rendez-vous .... Mes rendez-vous
    ├── /portail/documents ...... Mes documents
    └── /portail/parametres ..... Paramètres + sécurité
```

---

## Design system

### Palette

| Token | Usage | Valeur (light) |
|-------|-------|----------------|
| `primary` | Actions principales, sidebar active, liens | Bleu marine profond (oklch 0.37 0.14 265) |
| `muted` | Fonds secondaires, texte désactivé | Gris bleuté subtil |
| `destructive` | Suppressions, erreurs | Rouge orangé |
| `trust` | Badges sécurité, chiffrement | Vert (hsl 142 71% 45%) |
| `background` | Fond de page | Blanc cassé légèrement bleuté |
| `card` | Cartes, modals | Blanc pur |

### Typographie

- **Police :** Geist (variable font, chargée via `next/font/google`)
- **Hiérarchie :** h1 2xl semibold, h2 xl semibold, body sm, caption xs
- **Langue :** Français (locale `fr`), internationalisation via `next-intl`

### Composants

Basés sur **shadcn/ui** (Radix UI + Tailwind CSS 4) — composants copiés dans le projet, pas de dépendance externe. Cela permet une personnalisation totale pour l'esthétique "confiance juridique".

### Animations

Transitions subtiles uniquement — hover sur les cartes, transitions de pages, skeleton loaders pendant le chargement. Jamais de mouvement gratuit. L'interface doit inspirer le sérieux.

---

## Sécurité — pilier de l'expérience

La sécurité n'est pas un layer technique caché — c'est un élément visible de l'UX, un argument de vente, et une obligation réglementaire.

| Fonctionnalité | Implémentation | Visible par l'utilisateur |
|----------------|----------------|---------------------------|
| Chiffrement des messages | XChaCha20-Poly1305 (libsodium) | Badge "Chiffré E2E" sur chaque message |
| Chiffrement des documents | SSE-C (S3) + clé client | Icône cadenas lors de l'upload |
| Phrase de récupération | 12 mots BIP39 | Écran bloquant après inscription |
| Clés de chiffrement | X25519 keypair, stocké chiffré | Invisible (derive du mot de passe) |
| Consentements RGPD | Tracking granulaire (essential/analytics) | Page paramètres avec toggles |
| Export de données | JSON complet sur demande | Bouton "Exporter mes données" |
| Suppression de compte | Période de grâce 30 jours, puis purge | Flow en 3 étapes avec confirmation |
| Vérification email | Token 24h | Email avec lien de vérification |
| Reset mot de passe | Token 1h | Email avec lien sécurisé |

---

## Notifications email

| Événement | Destinataire | Contenu |
|-----------|-------------|---------|
| Inscription | Utilisateur | Email de bienvenue + lien de vérification |
| Nouveau dossier | Avocat | Nom client, type de problème, lien vers le dossier |
| Nouveau message | Destinataire | "Vous avez un nouveau message" (jamais le contenu) |
| Demande de rendez-vous | Avocat | Détails de la demande + lien pour répondre |
| Rendez-vous confirmé | Client | Date, heure, lien visio ou adresse cabinet |
| Rendez-vous refusé | Client | Motif optionnel + invitation à reproposer |
| Rappel J-1 | Les deux | Rappel du rendez-vous demain |
| Rappel J-0 | Les deux | Rappel du rendez-vous aujourd'hui |
| Suppression programmée | Utilisateur | Confirmation + délai de 30 jours |

---

## Intelligence artificielle

### Philosophie IA

L'IA est au service de l'humain, jamais à sa place. Elle :
- **Guide** le client sans le diriger
- **Résume** pour l'avocat sans décider
- **Extrait** des informations sans les inventer
- **Ne donne jamais de conseil juridique** (garde-fous UPL)

### Fonctionnalités IA

| Feature | Déclencheur | Modèle | Output |
|---------|-------------|--------|--------|
| Questions de suivi empathiques | Pendant l'intake (étape 2) | Claude / GPT (streaming) | Questions contextuelles en langage naturel |
| Résumé de dossier | À la soumission (async) | Claude / GPT | Texte structuré (résumé, faits clés, domaine) |
| Extraction de chronologie | À la soumission (async) | Claude / GPT | Liste d'événements datés/non datés |
| Score de qualification | À la soumission (async) | Claude / GPT | Score 0-100 + sous-scores + justification |
| Extraction documentaire | À l'upload (BullMQ job) | Docling (PDF) / Vision API (images) | Dates, parties, montants, clauses clés |

### Architecture LLM

- **Provider-agnostic** via Vercel AI SDK 6 — changement de provider en une variable d'environnement
- **Configuré pour OVHcloud AI Endpoints** (Qwen 72B) en production — pas de dépendance à OpenAI/Anthropic
- **Rate limiting** par provider pour contrôler les coûts
- **Streaming** pour l'UX temps réel (le texte apparaît progressivement)

---

## Distribution

### Widget intégrable

Un snippet JavaScript que l'avocat colle sur son site :

```html
<script src="https://app.legalconnect.fr/api/widget"></script>
```

Le widget :
- S'ouvre dans un **modal flottant** (bouton en bas de page)
- Est **isolé en Shadow DOM** (aucune interférence CSS avec le site hôte)
- Utilise les **couleurs de l'avocat** (accent color CSS variables)
- Pèse **~66 Ko gzippé** (build Vite IIFE, zéro dépendance UI)
- Fonctionne en **cross-origin** (CORS configuré)

### Page hébergée

URL unique par avocat : `/cabinet-{slug}`

Contient :
- **Hero section** : photo/avatar, nom du cabinet, spécialités (badges), description, CTA
- **Grille de spécialités** : cartes visuelles par domaine
- **Formulaire d'intake** : stepper dynamique avec branding
- **Footer co-brandé** : "Propulsé par LegalConnect"
- **OpenGraph dynamique** : image OG générée au runtime pour le partage social

---

## Infrastructure et conformité

| Aspect | Choix | Justification |
|--------|-------|---------------|
| Hébergement | OVHcloud (EU) | Souveraineté données, RGPD natif, certification HDS disponible |
| Base de données | PostgreSQL 16 | Row-level security, pgcrypto, JSON columns |
| Cache / Queue | Valkey 9 (fork Redis, BSD) | BullMQ-compatible, open-source, pas d'ambiguïté licence |
| Stockage fichiers | OVHcloud Object Storage (S3) | SSE-C encryption, EU data residency |
| Framework | Next.js 16 + React 19 | Server Components, streaming, App Router |
| ORM | Drizzle | SQL-first, 7.4 Ko bundle, idéal pour requêtes pgcrypto |
| Auth | Auth.js v5 | Self-hosted, données auth dans notre PostgreSQL |
| UI | shadcn/ui + Tailwind CSS 4 | Composants maîtrisés, design juridique sur-mesure |
| Email | React Email + Resend | Templates React, bonne délivrabilité |
| Monitoring | Sentry + OpenTelemetry | Erreurs en temps réel, traces distribuées |

---

## Métriques de succès (KPIs visés)

| Métrique | Cible | Pourquoi |
|----------|-------|----------|
| Taux de complétion intake | > 70% | Le formulaire est perçu comme simple et rassurant |
| Temps moyen intake | < 8 min | Guidé mais pas long |
| Score de qualification moyen | > 60/100 | L'IA enrichit efficacement les dossiers |
| Temps avocat par nouveau dossier | < 5 min | Le pré-traitement IA fonctionne |
| NPS client | > 50 | L'expérience inspire confiance |
| Taux d'adoption widget | > 30% des avocats | L'intégration est triviale |

---

## Ce qui n'est pas dans v1.0 (et pourquoi)

| Feature exclue | Raison |
|----------------|--------|
| Réservation automatique (Calendly-like) | L'avocat doit qualifier avant de planifier |
| Paiement en ligne | Hors scope — chaque cabinet a ses propres conditions |
| App mobile native | Web responsive suffit pour v1, natif en v2 |
| Multi-cabinet (équipes) | Cible initiale : avocats solos et petits cabinets |
| Intégrations logiciels cabinet | Trop fragmenté (chaque cabinet a son propre outil) |
| Marketplace d'avocats | Pas un annuaire — l'avocat amène ses propres clients |

---

*Document rédigé le 28 mars 2026 — LegalConnect v1.0 milestone complete.*
