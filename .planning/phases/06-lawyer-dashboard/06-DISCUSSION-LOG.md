# Phase 6: Lawyer Dashboard - Discussion Log

> **Audit trail only.**

**Date:** 2026-03-27
**Phase:** 06-lawyer-dashboard
**Areas discussed:** Liste des dossiers, Vue detail dossier, Notifications email, Configuration cabinet

---

## Liste des dossiers

| Option | Description | Selected |
|--------|-------------|----------|
| Tableau avec colonnes | DataTable shadcn, tri par colonne, responsive | ✓ |
| Cartes empilees | Grille de cartes, mobile-friendly | |
| Vue mixte | Toggle tableau/cartes | |

| Option | Description | Selected |
|--------|-------------|----------|
| Statuts + specialite + score | 4 statuts, filtres multi-criteres, recherche nom | ✓ |
| Statuts uniquement | Filtrage simple | |
| Filtres avances | Multi-criteres avec sauvegarde | |

## Vue detail dossier

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs horizontaux | Synthese/Documents/Timeline/Echanges IA, header permanent | ✓ |
| Page longue scrollee | Toutes sections empilees | |
| Panneau split | Liste gauche, detail droite | |

| Option | Description | Selected |
|--------|-------------|----------|
| Statut + notes | Changer statut, notes internes, regenerer fiche, telecharger docs | ✓ |
| Statut seulement | Juste changer statut | |
| Actions completes | Statut, notes, assignation, etiquettes | |

## Notifications email

| Option | Description | Selected |
|--------|-------------|----------|
| Immediat par evenement | Nouveau dossier, nouveau message, opt-out par type | ✓ |
| Digest quotidien | Recap par jour | |
| Les deux | Immediat + recap | |

## Configuration cabinet

| Option | Description | Selected |
|--------|-------------|----------|
| Specialites + profil | Specialites, nom cabinet, coordonnees, prefs notifs | ✓ |
| Specialites uniquement | Juste specialites | |
| Config complete | Logo, couleurs, horaires | |

## Claude's Discretion
- Colonnes DataTable, schema lawyer_profiles, templates email, composants tabs/filtres, pagination

## Deferred Ideas
- Export PDF → Phase 8
- Edition timeline → future
- Logo/couleurs cabinet → Phase 8
- Assignation collaborateur → future
