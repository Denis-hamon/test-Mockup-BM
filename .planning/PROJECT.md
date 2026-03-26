# LegalConnect — Portail Client Intelligent pour Avocats

## What This Is

Une application SaaS à la croisée de Calendly et Doctolib, conçue pour les cabinets d'avocats et avocats solos. Elle permet aux clients (ou prospects) de structurer leur demande juridique via un formulaire intelligent guidé par IA, puis d'entrer dans un espace de communication partagé avec leur avocat. L'IA apporte empathie, guidance et extraction automatique d'informations depuis les pièces jointes pour qualifier parfaitement chaque dossier.

## Core Value

Le client doit pouvoir exprimer sa situation juridique de manière complète et structurée, guidé par une IA empathique, dans un environnement perçu comme totalement sécurisé — pour que l'avocat reçoive un dossier parfaitement qualifié dès le premier contact.

## Requirements

### Validated

- [x] Authentification email/mot de passe avec confirmation email — Validated in Phase 1: Auth & Encryption
- [x] Chiffrement bout en bout des données client — Validated in Phase 1: Auth & Encryption
- [x] Indicateurs visuels de sécurité omniprésents (cadenas, badges, rappels contextuels) — Validated in Phase 2: Intake Form & Trust UX
- [x] Formulaire multi-étapes guidé pour décrire la situation juridique — Validated in Phase 2: Intake Form & Trust UX
- [x] Upload de documents (PDF, images, vidéos) avec chiffrement client-side — Validated in Phase 2: Intake Form & Trust UX
- [x] Architecture IA LLM-agnostique (Claude, GPT, Mistral via interface unifiée) — Validated in Phase 3: AI Engine Foundation
- [x] Guardrails UPL empêchant tout conseil juridique dans les réponses IA — Validated in Phase 3: AI Engine Foundation

### Active

- [ ] Widget d'intake intelligent embeddable sur le site de l'avocat
- [ ] Formulaire hybride IA conversationnelle + adaptatif selon le domaine juridique
- [ ] Extraction IA des pièces jointes (PDF, photos, scans, captures d'écran, vidéos)
- [ ] Tonalité empathique et bienveillante de l'IA (sollicitude, encouragement subtil pour clients en détresse)
- [ ] Espace avocat (dashboard, configuration spécialités, gestion demandes)
- [ ] Portail client partagé (messagerie, documents, suivi de dossier)
- [ ] Demande de RDV avec proposition de créneaux et confirmation manuelle par l'avocat
- [ ] Templates de parcours par spécialité juridique + personnalisation par l'avocat
- [ ] Dossier complet généré (fiche synthétique, pièces jointes, timeline des faits, analyse IA, score de qualification)
- [ ] Authentification email/mot de passe avec confirmation email
- [ ] Chiffrement bout en bout des données client
- [ ] Indicateurs visuels de sécurité omniprésents (cadenas, badges, rappels contextuels)

### Out of Scope

- Vrai booking avec créneaux automatiques (type Calendly) — v1 = demande de RDV avec confirmation manuelle
- Application mobile native — web-first, responsive
- Modèle économique / facturation — à définir après le MVP
- Intégration logiciels de gestion de cabinet (RPVA, etc.) — post-MVP

## Context

- Le marché LegalTech français est en croissance mais peu d'outils combinent intake intelligent + portail client
- Les clients d'avocats sont souvent en situation de stress/détresse — l'expérience utilisateur doit être rassurante
- Le secret professionnel impose des standards de sécurité élevés (équivalent HDS pour données juridiques)
- Les avocats solos et petits cabinets n'ont souvent pas d'outil digital de prise en charge client
- L'IA doit être LLM-agnostic (architecture permettant de changer de modèle : Claude, GPT, etc.)
- Les pièces jointes sont variées : contrats PDF, photos de courriers, captures d'écran SMS/WhatsApp, vidéos

## Constraints

- **Sécurité** : Chiffrement bout en bout, hébergeur certifié (type HDS), conformité RGPD — données juridiques sensibles
- **Hébergement** : OVHcloud (EU, RGPD-compatible)
- **IA** : Architecture LLM-flexible, pas de dépendance à un seul fournisseur
- **UX** : L'interface doit inspirer confiance et sécurité visuellement à chaque étape
- **Empathie** : Les réponses IA doivent être chaleureuses et soutenantes, jamais froides ou bureaucratiques

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Widget embed + page hébergée | Widget pour l'acquisition sur le site avocat, page hébergée comme socle de la relation client-avocat | — Pending |
| Formulaire hybride IA + adaptatif | Ni pur chatbot ni pur formulaire — le meilleur des deux mondes pour guider le client | — Pending |
| Demande de RDV (pas booking auto) | Les avocats veulent garder le contrôle de leur agenda, confirmation manuelle | — Pending |
| Templates + personnalisation | Templates par spécialité pour démarrer vite, personnalisation pour l'avocat exigeant | — Pending |
| LLM-agnostic | Pas de vendor lock-in, flexibilité de changer de modèle selon coût/qualité | — Pending |
| Hébergement OVHcloud | Cohérence RGPD, données EU, certification possible | — Pending |
| Chiffrement E2E visible | Pas juste technique mais UX — le client doit *voir* que c'est sécurisé | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*
