# Phase 7: Client Portal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 07-client-portal
**Areas discussed:** Messagerie E2E, Suivi de dossier client, Rendez-vous, UX & navigation portail

---

## Messagerie E2E

| Option | Description | Selected |
|--------|-------------|----------|
| Chat temps réel | Interface type WhatsApp/iMessage. Messages instantanés, bulles, indicateur de frappe. WebSocket/SSE. | ✓ |
| Messagerie asynchrone | Interface type email/fil de discussion. Pas de temps réel. | |
| Hybride | Asynchrone par défaut avec notification push quand l'autre partie est en ligne. | |

**User's choice:** Chat temps réel
**Notes:** Plus engageant pour le client

### Pièces jointes

| Option | Description | Selected |
|--------|-------------|----------|
| Fichiers + images | Réutilise pipeline upload chiffré Phase 2 | ✓ |
| Texte uniquement | Documents partagés via onglet séparé | |
| Fichiers + images + vocal | Ajoute messages vocaux | |

**User's choice:** Fichiers + images

### Accusés de lecture

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, discrets | "Lu" affiché sous le message | |
| Non | Pas d'accusé de lecture | |
| Optionnel par l'avocat | L'avocat active/désactive dans ses paramètres | ✓ |

**User's choice:** Optionnel par l'avocat

### Chiffrement E2E

| Option | Description | Selected |
|--------|-------------|----------|
| X25519 key exchange | Keypair existant Phase 1, clé partagée par conversation, XChaCha20-Poly1305 | ✓ |
| Clé serveur | Serveur génère clé symétrique, chiffrée avec clé publique participants | |
| Claude décide | | |

**User's choice:** X25519 key exchange

### Recherche messages

| Option | Description | Selected |
|--------|-------------|----------|
| Non, E2E prioritaire | Messages chiffrés = pas de recherche serveur | |
| Recherche locale | Déchiffrer côté client et chercher en mémoire | |
| Claude décide | | ✓ |

**User's choice:** Claude décide

### Notifications messages

| Option | Description | Selected |
|--------|-------------|----------|
| Email + badge in-app | Email immédiat si pas en ligne + compteur non lus | ✓ |
| Email uniquement | Pas de notification in-app | |
| In-app uniquement | Badge/compteur sans email | |

**User's choice:** Email + badge in-app

---

## Suivi de dossier client

### Transparence

| Option | Description | Selected |
|--------|-------------|----------|
| Statut + timeline | Statut actuel + timeline événements. Pas le score ni notes internes. | ✓ |
| Statut uniquement | Juste le statut, pas de timeline | |
| Transparence totale | Statut + timeline + score + résumé IA | |

**User's choice:** Statut + timeline

### Multi-dossiers

| Option | Description | Selected |
|--------|-------------|----------|
| Oui | Plusieurs dossiers en parallèle | ✓ |
| Un seul actif | Un dossier actif à la fois | |

**User's choice:** Oui

### Documents client

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, avec téléchargement | Retrouve tous ses docs uploadés, retéléchargement possible | ✓ |
| Oui, lecture seule | Voit la liste mais pas de téléchargement | |
| Non, récapitulatif seulement | Résumé de ce qui a été soumis | |

**User's choice:** Oui, avec téléchargement

---

## Rendez-vous

### Demande de RDV

| Option | Description | Selected |
|--------|-------------|----------|
| Demande libre avec préférences | Client indique disponibilités, avocat confirme manuellement | ✓ |
| Calendrier intégré type Calendly | Avocat définit créneaux, client réserve directement | |
| Via la messagerie | Pas de système dédié, via messages | |

**User's choice:** Demande libre avec préférences

### Type de RDV

| Option | Description | Selected |
|--------|-------------|----------|
| Visio + présentiel | Client choisit, lien visio auto-généré ou adresse cabinet | ✓ |
| Présentiel uniquement | Cabinet seulement | |
| Claude décide | | |

**User's choice:** Visio + présentiel

### Rappels

| Option | Description | Selected |
|--------|-------------|----------|
| Email J-1 + J-0 | Rappel veille et matin du RDV | ✓ |
| Email J-1 uniquement | Un seul rappel la veille | |
| Pas de rappels | Aucun rappel | |

**User's choice:** Email J-1 + J-0

---

## UX & Navigation portail

### Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard + sidebar | Page accueil avec résumé + sidebar navigation | ✓ |
| Page unique avec tabs | Tout sur une page avec onglets | |
| App mobile-first | Navigation bottom-tab type app mobile | |

**User's choice:** Dashboard + sidebar

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Layout partagé + thème différent | Même structure, couleurs adaptées, rôle détermine contenu sidebar | ✓ |
| Layout dédié client | Design complètement séparé | |
| Claude décide | | |

**User's choice:** Layout partagé + thème différent

### Indicateurs de sécurité

| Option | Description | Selected |
|--------|-------------|----------|
| Cadenas + badges discrets | Cadenas zone messages, badge "Connexion sécurisée" header | ✓ |
| Bannière permanente | Bannière verte en haut du portail | |
| Aucun supplémentaire | Les indicateurs Phase 2 suffisent | |

**User's choice:** Cadenas + badges discrets

---

## Claude's Discretion

- Recherche dans historique messages (contraintes E2E)
- Choix WebSocket vs SSE
- Pattern stockage messages chiffrés serveur
- Pagination/chargement messages anciens

## Deferred Ideas

- Calendrier synchronisé type Calendly (Google Calendar / Outlook)
- Messages vocaux (enregistrement audio + chiffrement)
- Notifications push browser (Web Push API)
- Visioconférence intégrée (WebRTC)
- Recherche full-text serveur des messages
