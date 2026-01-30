# Content Intelligence Pipeline

> 🔒 **Outil interne OVHcloud** - Usage restreint

Pipeline de collecte et transformation de contenu pour optimiser le référencement organique.

## Fonctionnalités

### 1. Scraping
- Collecte automatique des articles depuis des bases de tutoriels concurrentes
- Extraction des métadonnées (catégorie, nombre de mots, date de mise à jour)
- Sélection multiple pour traitement par lot

### 2. Transformation
- **Remplacements de marque** : Adaptation automatique des références concurrentes → OVHcloud
- **Injection de liens** : Ajout de liens vers docs.ovh.com et help.ovhcloud.com
- **Adaptation tonale** : Alignement avec la charte éditoriale OVHcloud
- **Disclaimers** : Ajout automatique des mentions légales

### 3. Export
- Export JSON pour intégration API
- Export CSV pour traitement manuel
- Push direct vers CMS (à configurer)

## Installation

```bash
npm install
npm run dev
```

## Stack technique

- React 18
- Vite
- IBM Plex Sans / Mono (typographie)

## Roadmap

- [ ] Backend de scraping (Playwright/Puppeteer)
- [ ] Intégration Claude API pour réécriture intelligente
- [ ] Détection de plagiat pré-publication
- [ ] File d'attente pour gros volumes
- [ ] Connecteur CMS WordPress/Strapi

## Contact

Product Team - product-team@ovhcloud.com

---

⚠️ **Attention** : Cet outil est destiné à un usage interne uniquement. Le contenu collecté doit être substantiellement transformé avant publication pour éviter tout problème de duplicate content.
