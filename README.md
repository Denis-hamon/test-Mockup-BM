# Content Pipeline OVHcloud

> 🔒 **Outil interne OVHcloud** - Pipeline de collecte, transformation et publication de contenu optimisé SEO.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [API Reference](#-api-reference)
- [Développement Frontend](#-développement-frontend)
- [Maintenance](#-maintenance)
- [Troubleshooting](#-troubleshooting)

## ✨ Fonctionnalités

### Collecte de contenu
- Scraping automatique via Firecrawl (self-hosted)
- Support multi-langue (FR, EN, ES, DE, IT, PT, NL, PL)
- Gestion des providers par projet
- Détection et gestion des protections anti-bot

### Transformation AI
- **Llama 3.3** (OVH AI Endpoints) - Transformation rapide des articles
- **DeepSeek R1** - Transformation approfondie avec raisonnement
- **Stable Diffusion XL** - Génération de thumbnails
- Guidelines AI personnalisables par projet
- Scoring de pertinence automatique

### Gestion de contenu
- Organisation par projets et providers
- Workflow: Collected → Transformed → Approved → Translated → Published
- Traduction automatique multi-langue
- Éditeur WYSIWYG intégré

### Monitoring
- Live Monitor des jobs de scraping
- Pipeline AI avec progression en temps réel
- Diagnostics et gestion des erreurs
- Reporting et statistiques

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                    │
│  - Dashboard, Projects, Repository, Live Monitor, Reporting │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                  │
│  - API REST, Jobs Queue, AI Processing Pipeline             │
└─────────────────────────────────────────────────────────────┘
        │                │                    │
        ▼                ▼                    ▼
┌─────────────┐  ┌─────────────┐    ┌─────────────────────┐
│  PostgreSQL │  │    Redis    │    │   OVH AI Endpoints  │
│  (données)  │  │   (cache)   │    │  Llama/DeepSeek/SD  │
└─────────────┘  └─────────────┘    └─────────────────────┘
        │
        ▼
┌─────────────┐
│  Firecrawl  │
│  (scraping) │
└─────────────┘
```

## 📦 Prérequis

### Système
- **OS**: Ubuntu 20.04+ / Debian 11+
- **Node.js**: 18.x ou supérieur
- **npm**: 9.x ou supérieur

### Services
- **PostgreSQL**: 14+ 
- **Redis**: 6+
- **Firecrawl**: Instance self-hosted (optionnel)

### Comptes externes
- **OVH AI Endpoints**: Token API pour Llama 3.3, DeepSeek, Stable Diffusion XL

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-org/content-pipeline-ovh.git
cd content-pipeline-ovh
```

### 2. Installer PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Démarrer le service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Créer la base de données

```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Créer l'utilisateur et la base
CREATE USER pipeline_user WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE content_pipeline OWNER pipeline_user;
GRANT ALL PRIVILEGES ON DATABASE content_pipeline TO pipeline_user;
\q
```

### 4. Initialiser le schéma

```bash
sudo -u postgres psql -d content_pipeline << 'SQL'

-- Table des projets
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    project_intention TEXT,
    color VARCHAR(50) DEFAULT '#3b82f6',
    icon VARCHAR(50) DEFAULT 'folder',
    is_active BOOLEAN DEFAULT true,
    default_language VARCHAR(10) DEFAULT 'en',
    target_languages TEXT[] DEFAULT ARRAY['fr'],
    auto_transform BOOLEAN DEFAULT false,
    auto_translate BOOLEAN DEFAULT false,
    ai_guidelines JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des providers
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    folder_id INTEGER,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    base_urls JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des articles
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id),
    parent_article_id INTEGER REFERENCES articles(id),
    source_url TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    original_title TEXT,
    original_content TEXT,
    transformed_title TEXT,
    transformed_content TEXT,
    status VARCHAR(50) DEFAULT 'collected',
    word_count INTEGER DEFAULT 0,
    category VARCHAR(255),
    ovh_links JSONB,
    disclaimer TEXT,
    seo_score INTEGER,
    seo_breakdown JSONB,
    thumbnail_url TEXT,
    relevance_score INTEGER,
    relevance_reason TEXT,
    relevance_scored_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des logs de jobs
CREATE TABLE job_logs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER,
    level VARCHAR(20),
    message TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des jobs archivés
CREATE TABLE archived_jobs (
    id SERIAL PRIMARY KEY,
    original_job_id INTEGER,
    provider_id INTEGER,
    provider_name VARCHAR(255),
    status VARCHAR(50),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    articles_found INTEGER,
    articles_processed INTEGER,
    estimated_total INTEGER,
    completion_rate DECIMAL,
    failure_reason TEXT,
    error_details JSONB,
    archived_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_articles_provider ON articles(provider_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_language ON articles(language);
CREATE INDEX idx_articles_created ON articles(created_at DESC);
CREATE INDEX idx_providers_project ON providers(project_id);

SQL
```

### 5. Installer Redis

```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Vérifier
redis-cli ping
# Devrait répondre: PONG
```

### 6. Installer les dépendances Node.js

```bash
npm install
```

### 7. Installer PM2 (gestionnaire de processus)

```bash
npm install -g pm2
```

## ⚙️ Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine:

```env
# Database
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=content_pipeline
PG_USER=pipeline_user
PG_PASSWORD=votre_mot_de_passe

# Redis
REDIS_URL=redis://localhost:6379

# OVH AI Endpoints
OVH_AI_TOKEN=eyJhbGciOiJFZERTQSIs...votre_token
OVH_AI_TOKEN_2=eyJhbGciOiJFZERTQSIs...second_token_optionnel

# Firecrawl (optionnel)
FIRECRAWL_API_KEY=fc-votre-cle
FIRECRAWL_URL=http://localhost:3002

# Server
PORT=3001
NODE_ENV=production
```

### Configuration PM2

Le fichier `ecosystem.config.js` est déjà configuré:

```javascript
module.exports = {
  apps: [{
    name: 'content-pipeline',
    script: 'server.js',
    instances: 4,           // 4 workers
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

## 🎯 Démarrage

### Production

```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs content-pipeline

# Redémarrer
pm2 restart content-pipeline

# Arrêter
pm2 stop content-pipeline
```

### Accès à l'application

- **Frontend**: http://votre-serveur:3001
- **API**: http://votre-serveur:3001/api
- **Health check**: http://votre-serveur:3001/api/health

## 📡 API Reference

### Health
```
GET /api/health
```

### Projects
```
GET    /api/projects                    # Liste des projets
GET    /api/projects/:id                # Détail d'un projet
POST   /api/projects                    # Créer un projet
PUT    /api/projects/:id                # Modifier un projet
DELETE /api/projects/:id                # Supprimer un projet
GET    /api/projects/:id/stats          # Statistiques du projet
GET    /api/projects/:id/relevance-stats # Stats de pertinence
```

### Providers
```
GET    /api/providers                   # Liste (filtrable par projectId)
GET    /api/providers/:id               # Détail
POST   /api/providers                   # Créer
PUT    /api/providers/:id               # Modifier
DELETE /api/providers/:id               # Supprimer
```

### Articles
```
GET    /api/articles                    # Liste avec pagination et filtres
GET    /api/articles/:id                # Détail avec traductions
PATCH  /api/articles/:id                # Modifier (titre, contenu)
DELETE /api/articles/:id                # Supprimer

# Filtres disponibles: status, language, providerId, projectId, limit, offset
```

### Batch Operations
```
POST /api/articles/batch/transform      # {articleIds: [1,2,3]}
POST /api/articles/batch/translate      # {articleIds: [1,2,3], languages: [fr,es]}
POST /api/articles/batch/publish        # {articleIds: [1,2,3]}
POST /api/articles/batch/delete         # {articleIds: [1,2,3]}
```

### AI Processing
```
POST /api/articles/:id/transform-deepseek    # Transform avec DeepSeek
GET  /api/transform-tasks/:taskId            # Status de la tâche
POST /api/articles/:id/relevance-score       # Scorer la pertinence
POST /api/articles/:id/generate-thumbnail    # Générer une vignette
```

### Jobs
```
GET  /api/jobs                          # Jobs de scraping actifs
GET  /api/jobs/:id                      # Détail d'un job
POST /api/jobs/:id/pause                # Mettre en pause
POST /api/jobs/:id/resume               # Reprendre
POST /api/jobs/:id/stop                 # Annuler
GET  /api/jobs/archived                 # Jobs archivés

GET  /api/pipeline-jobs                 # Jobs AI en cours
GET  /api/pipeline-jobs/diagnostics     # Diagnostics pipeline
```

### Reporting
```
GET /api/reporting/overview             # Vue d'ensemble
GET /api/reporting/by-project           # Stats par projet
GET /api/reporting/by-provider          # Stats par provider
GET /api/reporting/trends?days=30       # Tendances
GET /api/stats                          # Dashboard stats
```

### Scraping
```
POST /api/scrape                        # Lancer un scrape
     {providerId: 1, language: fr, url: https://...}
GET  /api/scrape/progress               # Progression
```

## 💻 Développement Frontend

Le frontend est une application React/Vite séparée.

### Installation locale

```bash
# Dans un autre répertoire
git clone https://github.com/votre-org/content-pipeline-frontend.git
cd content-pipeline-frontend

npm install
npm run dev
```

### Build et déploiement

```bash
# Build
npm run build

# Copier vers le serveur
scp -r dist/* user@serveur:/chemin/content-pipeline-ovh/public/
```

### Proxy API en développement

Dans `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

## 🔧 Maintenance

### Logs PM2

```bash
# Logs en temps réel
pm2 logs content-pipeline

# Logs avec lignes
pm2 logs content-pipeline --lines 100

# Fichiers de logs
ls ~/.pm2/logs/
```

### Monitoring

```bash
# Status des processus
pm2 status

# Monitoring interactif
pm2 monit

# Métriques
pm2 show content-pipeline
```

### Backup base de données

```bash
# Export
pg_dump -U pipeline_user content_pipeline > backup.sql

# Import
psql -U pipeline_user content_pipeline < backup.sql
```

### Mise à jour

```bash
# Pull les changements
git pull origin main

# Installer les nouvelles dépendances
npm install

# Redémarrer
pm2 restart content-pipeline
```

## 🔍 Troubleshooting

### Le serveur ne démarre pas

```bash
# Vérifier les logs
pm2 logs content-pipeline --err --lines 50

# Vérifier PostgreSQL
sudo systemctl status postgresql
psql -U pipeline_user -d content_pipeline -c SELECT 1

# Vérifier Redis
redis-cli ping
```

### Erreurs de connexion à la base

```bash
# Vérifier pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Ajouter si nécessaire:
# local   all   pipeline_user   md5
# host    all   pipeline_user   127.0.0.1/32   md5

sudo systemctl restart postgresql
```

### Erreurs OVH AI (429 Rate Limit)

- Ajouter un second token API dans `OVH_AI_TOKEN_2`
- Le système fait du round-robin automatique entre les tokens

### Jobs de scraping bloqués

```bash
# Vider le cache Redis
redis-cli FLUSHDB

# Redémarrer PM2
pm2 restart content-pipeline
```

### Problèmes de mémoire

```bash
# Augmenter la limite mémoire Node.js
pm2 start ecosystem.config.js --node-args=--max-old-space-size=4096
```

## 📊 Tests E2E

Un script de test est disponible pour vérifier tous les endpoints:

```bash
# Sur le serveur
/tmp/e2e-tests.sh
```

Couvre: Health, Projects, Providers, Articles, Batch, Jobs, Reporting, AI, Thumbnails.

## 📝 License

Usage interne OVHcloud uniquement.

## 👥 Contact

Product Team - product-team@ovhcloud.com

---

⚠️ **Important**: Le contenu collecté doit être substantiellement transformé avant publication.
