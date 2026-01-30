# Plan d'implémentation - Backend Content Pipeline OVHcloud

## Objectif
Définir et implémenter toutes les fonctionnalités backend nécessaires pour supporter le nouveau frontend.

---

## 1. API Endpoints à créer/modifier

### 1.1 Dashboard Stats
```
GET /api/stats
```
**Response:**
```json
{
  "totalArticles": 245,
  "collected": 10,
  "transformed": 50,
  "translated": 150,
  "published": 35,
  "avgWordCount": 1250,
  "activeJobs": 2,
  "languageCounts": { "en": 210, "fr": 35 },
  "statusCounts": { "scraped": 50, "transformed": 100, "translated": 95 }
}
```

### 1.2 Activity Feed
```
GET /api/activity?limit=20
```
**Response:**
```json
{
  "activities": [
    {
      "id": "act-1",
      "type": "collection|transformation|translation|error|publish",
      "message": "Completed transformation of Article X",
      "timestamp": "2026-01-30T20:00:00Z",
      "articleId": 123,
      "metadata": {}
    }
  ]
}
```
**Backend:** Créer table `activity_log` et logger les événements.

### 1.3 Collection Points (Providers)
```
GET /api/providers
```
**Modifier pour inclure:**
```json
{
  "id": 1,
  "name": "Hostinger",
  "domain": "hostinger.com",
  "base_urls": { "en": "https://...", "fr": "https://..." },
  "status": "active|paused|scheduled",
  "articlesCollected": 342,
  "lastRun": "2026-01-30T18:00:00Z",
  "nextRun": "2026-01-31T18:00:00Z",
  "successRate": 98.5,
  "schedule": "daily|weekly|monthly|one-time",
  "crawlDepth": 3,
  "includePatterns": ["/tutorials/*"],
  "excludePatterns": ["/author/*"]
}
```

```
POST /api/providers
PUT /api/providers/:id
DELETE /api/providers/:id
```

```
POST /api/providers/:id/start   # Démarrer collection
POST /api/providers/:id/pause   # Mettre en pause
POST /api/providers/:id/schedule # Planifier
```

### 1.4 Collection Jobs (Live Monitor)
```
GET /api/jobs
```
**Response:**
```json
{
  "jobs": [
    {
      "id": "job-1",
      "providerId": 1,
      "providerName": "Hostinger",
      "status": "running|paused|completed|error",
      "startedAt": "2026-01-30T19:00:00Z",
      "articlesFound": 127,
      "articlesProcessed": 89,
      "estimatedTotal": 150,
      "articlesPerHour": 118,
      "errors": [],
      "recentDiscoveries": []
    }
  ],
  "transformQueue": {
    "enabled": true,
    "queueSize": 50,
    "isProcessing": true
  },
  "translateQueue": {
    "enabled": true,
    "queueSize": 200,
    "isProcessing": true
  }
}
```

```
GET /api/jobs/:id/logs  # Logs en temps réel pour un job
```

### 1.5 Articles (Content Repository)
```
GET /api/articles
```
**Query params:**
- `status`: scraped|transformed|translated
- `language`: en|fr|es|de|it|pt|nl|pl
- `providerId`: number
- `search`: string (recherche dans titre)
- `limit`: number (default 50)
- `offset`: number
- `sortBy`: created_at|word_count|title
- `sortOrder`: asc|desc

**Response (enrichie):**
```json
{
  "articles": [
    {
      "id": 123,
      "title": "Article Title",
      "originalTitle": "Original Title",
      "transformedTitle": "Transformed Title",
      "sourceUrl": "https://...",
      "providerName": "Hostinger",
      "status": "transformed",
      "language": "en",
      "wordCount": 1500,
      "createdAt": "2026-01-30T18:00:00Z",
      "transformedAt": "2026-01-30T19:00:00Z",
      "translationsCount": 3,
      "hasTranslations": { "fr": true, "es": true, "de": true }
    }
  ],
  "total": 245,
  "limit": 50,
  "offset": 0,
  "counts": { "en": 210, "fr": 35 },
  "statusCounts": { "scraped": 50, "transformed": 100, "translated": 95 }
}
```

### 1.6 Article Detail
```
GET /api/articles/:id
```
**Response (enrichie):**
```json
{
  "id": 123,
  "providerId": 1,
  "providerName": "Hostinger",
  "sourceUrl": "https://...",
  "language": "en",
  "status": "transformed",
  "originalTitle": "How to Install Docker",
  "originalContent": "...",
  "transformedTitle": "Guide Docker OVHcloud",
  "transformedContent": "...",
  "wordCount": 1500,
  "createdAt": "2026-01-30T18:00:00Z",
  "transformedAt": "2026-01-30T19:00:00Z",
  "translations": [
    {
      "id": 456,
      "language": "fr",
      "status": "translated",
      "title": "Guide Docker OVHcloud",
      "createdAt": "2026-01-30T20:00:00Z"
    },
    {
      "id": 457,
      "language": "es",
      "status": "translated",
      "title": "Guía Docker OVHcloud",
      "createdAt": "2026-01-30T20:05:00Z"
    }
  ],
  "parentArticleId": null
}
```

### 1.7 Batch Actions
```
POST /api/articles/batch/transform
Body: { "articleIds": [1, 2, 3] }
```

```
POST /api/articles/batch/translate
Body: { "articleIds": [1, 2, 3], "targetLanguages": ["fr", "es", "de"] }
```

```
POST /api/articles/batch/delete
Body: { "articleIds": [1, 2, 3] }
```

### 1.8 Settings
```
GET /api/settings
```
**Response:**
```json
{
  "autoTransform": {
    "enabled": true,
    "queueSize": 50,
    "isProcessing": true
  },
  "autoTranslate": {
    "enabled": true,
    "queueSize": 200,
    "isProcessing": true,
    "targetLanguages": ["fr", "es", "de", "it", "pt", "nl", "pl"]
  },
  "ovhAi": {
    "endpoint": "https://deepseek-r1...",
    "model": "DeepSeek-R1-Distill-Llama-70B"
  },
  "firecrawl": {
    "url": "http://localhost:3002",
    "status": "connected"
  }
}
```

```
PUT /api/settings
Body: {
  "autoTransform": { "enabled": true },
  "autoTranslate": { "enabled": true, "targetLanguages": ["fr", "es"] }
}
```

---

## 2. Modifications Base de Données

### 2.1 Table `activity_log` (nouvelle)
```sql
CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- collection, transformation, translation, error, publish
  message TEXT NOT NULL,
  article_id INTEGER REFERENCES articles(id),
  provider_id INTEGER REFERENCES providers(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_type ON activity_log(type);
```

### 2.2 Table `providers` (modifier)
```sql
ALTER TABLE providers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS last_run TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS next_run TIMESTAMP;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS schedule VARCHAR(20) DEFAULT 'manual';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS crawl_depth INTEGER DEFAULT 2;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS include_patterns JSONB DEFAULT '[]';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS exclude_patterns JSONB DEFAULT '[]';
```

### 2.3 Table `collection_jobs` (nouvelle)
```sql
CREATE TABLE collection_jobs (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  status VARCHAR(20) DEFAULT 'running', -- running, paused, completed, error
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  articles_found INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  estimated_total INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  recent_discoveries JSONB DEFAULT '[]'
);

CREATE INDEX idx_collection_jobs_status ON collection_jobs(status);
```

### 2.4 Table `articles` (modifier)
```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS transformed_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
```

---

## 3. Fonctions Backend à implémenter

### 3.1 Activity Logger
```javascript
async function logActivity(type, message, options = {}) {
  const { articleId, providerId, metadata } = options;
  await pgPool.query(`
    INSERT INTO activity_log (type, message, article_id, provider_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
  `, [type, message, articleId, providerId, JSON.stringify(metadata || {})]);
}
```
**Appeler dans:**
- Scraping: début, fin, erreur, articles découverts
- Transformation: début, succès, erreur
- Traduction: début, succès par langue, erreur
- Suppression d'articles

### 3.2 Stats Aggregator
```javascript
async function getStats() {
  const result = await pgPool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'scraped') as scraped,
      COUNT(*) FILTER (WHERE status = 'transformed') as transformed,
      COUNT(*) FILTER (WHERE status = 'translated') as translated,
      COUNT(*) FILTER (WHERE parent_article_id IS NULL) as parents,
      AVG(word_count) as avg_word_count
    FROM articles
  `);
  // + counts par langue, par provider, etc.
}
```

### 3.3 Job Manager
```javascript
async function createCollectionJob(providerId) {
  const result = await pgPool.query(`
    INSERT INTO collection_jobs (provider_id, status)
    VALUES ($1, 'running') RETURNING id
  `, [providerId]);
  return result.rows[0].id;
}

async function updateJobProgress(jobId, articlesFound, articlesProcessed) {
  await pgPool.query(`
    UPDATE collection_jobs
    SET articles_found = $2, articles_processed = $3
    WHERE id = $1
  `, [jobId, articlesFound, articlesProcessed]);
}
```

### 3.4 Provider Scheduler
```javascript
// Cron job pour vérifier les providers à exécuter
async function checkScheduledProviders() {
  const result = await pgPool.query(`
    SELECT * FROM providers
    WHERE status = 'scheduled'
      AND next_run <= CURRENT_TIMESTAMP
  `);
  for (const provider of result.rows) {
    await startCollection(provider.id);
  }
}
```

### 3.5 Batch Operations
```javascript
async function batchTransform(articleIds) {
  for (const id of articleIds) {
    transformQueue.push(id);
  }
  if (!isProcessingQueue) {
    processTransformQueue();
  }
  await logActivity('transformation', `Batch transformation queued: ${articleIds.length} articles`);
}

async function batchTranslate(articleIds, targetLanguages) {
  for (const id of articleIds) {
    translationQueue.push({ articleId: id, targetLangs: targetLanguages });
  }
  if (!isProcessingTranslations) {
    processTranslationQueue();
  }
  await logActivity('translation', `Batch translation queued: ${articleIds.length} articles to ${targetLanguages.length} languages`);
}

async function batchDelete(articleIds) {
  // Supprimer d'abord les traductions enfants
  await pgPool.query(`DELETE FROM articles WHERE parent_article_id = ANY($1)`, [articleIds]);
  // Puis les parents
  await pgPool.query(`DELETE FROM articles WHERE id = ANY($1)`, [articleIds]);
  await logActivity('delete', `Deleted ${articleIds.length} articles`);
}
```

---

## 4. Ordre d'implémentation

### Phase 1: Base de données
1. Créer table `activity_log`
2. Créer table `collection_jobs`
3. Modifier table `providers` (nouveaux champs)
4. Modifier table `articles` (timestamps)

### Phase 2: API Stats & Activity
1. `GET /api/stats` - Statistiques agrégées
2. `GET /api/activity` - Feed d'activité
3. Fonction `logActivity()` + intégration dans code existant

### Phase 3: API Providers
1. `GET /api/providers` - Enrichir response
2. `PUT /api/providers/:id` - Modifier provider
3. `POST /api/providers/:id/start` - Démarrer collection
4. `POST /api/providers/:id/pause` - Pause

### Phase 4: API Jobs
1. `GET /api/jobs` - Liste des jobs actifs
2. Intégrer `collection_jobs` dans le process de scraping

### Phase 5: API Articles enrichie
1. `GET /api/articles` - Ajouter filtres, tri, recherche
2. `GET /api/articles/:id` - Inclure traductions
3. `POST /api/articles/batch/*` - Actions batch

### Phase 6: API Settings
1. `GET /api/settings` - Configuration actuelle
2. `PUT /api/settings` - Modifier configuration

---

## 5. Résumé des endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/stats | Statistiques dashboard |
| GET | /api/activity | Feed d'activité |
| GET | /api/providers | Liste providers avec stats |
| POST | /api/providers | Créer provider |
| PUT | /api/providers/:id | Modifier provider |
| DELETE | /api/providers/:id | Supprimer provider |
| POST | /api/providers/:id/start | Démarrer scraping |
| POST | /api/providers/:id/pause | Pause scraping |
| GET | /api/jobs | Jobs actifs |
| GET | /api/jobs/:id/logs | Logs d'un job |
| GET | /api/articles | Liste articles (filtres, pagination) |
| GET | /api/articles/:id | Détail article + traductions |
| POST | /api/articles/batch/transform | Batch transform |
| POST | /api/articles/batch/translate | Batch translate |
| POST | /api/articles/batch/delete | Batch delete |
| GET | /api/settings | Configuration |
| PUT | /api/settings | Modifier config |
| GET | /api/transform/auto | Status queue transform |
| POST | /api/transform/auto | Toggle auto-transform |
| GET | /api/translate/auto | Status queue translate |
| POST | /api/translate/auto | Toggle auto-translate |
