# Plan de Test Complet - Content Pipeline OVH v2

## 1. Tests API Backend

### 1.1 Providers API
| Test | Endpoint | Attendu | Status |
|------|----------|---------|--------|
| GET all providers | `GET /api/providers` | Array de providers | ✅ |
| GET provider by ID | `GET /api/providers/:id` | Provider object | ✅ |
| GET providers by project | `GET /api/providers?projectId=1` | Filtered array | ✅ |
| CREATE provider | `POST /api/providers` | New provider | ✅ |
| UPDATE provider | `PUT /api/providers/:id` | Updated provider | ✅ |
| DELETE provider sans articles | `DELETE /api/providers/:id` | Success | ✅ |
| DELETE provider avec articles | `DELETE /api/providers/:id` | 409 + article count | ✅ |
| DELETE force | `DELETE /api/providers/:id?force=true` | Success + deleted articles | ✅ |

### 1.2 Articles API
| Test | Endpoint | Attendu | Status |
|------|----------|---------|--------|
| GET articles | `GET /api/articles` | ArticlesResponse | ✅ |
| GET article by ID | `GET /api/articles/:id` | ArticleDetail + translations | ✅ |
| DELETE article | `DELETE /api/articles/:id` | Success | ✅ |
| BATCH delete | `POST /api/articles/batch/delete` | Count deleted | ✅ |
| BATCH transform | `POST /api/articles/batch/transform` | Count queued | ✅ |
| BATCH translate | `POST /api/articles/batch/translate` | Count queued | ✅ |
| BATCH publish | `POST /api/articles/batch/publish` | Count published | ✅ |

### 1.3 Jobs API
| Test | Endpoint | Attendu | Status |
|------|----------|---------|--------|
| GET jobs | `GET /api/jobs` | Array of jobs | ✅ |
| GET job by ID | `GET /api/jobs/:id` | Job object | ✅ |
| PAUSE job | `POST /api/jobs/:id/pause` | Job paused | ✅ |
| RESUME job | `POST /api/jobs/:id/resume` | Job running | ✅ |
| STOP job | `POST /api/jobs/:id/stop` | Job stopped | ✅ |

### 1.4 Scraping API
| Test | Endpoint | Attendu | Status |
|------|----------|---------|--------|
| START scrape | `POST /api/scrape` | Job ID | ✅ |
| START duplicate scrape | `POST /api/scrape` (même provider) | 409 job already running | ✅ |

### 1.5 Projects API
| Test | Endpoint | Attendu | Status |
|------|----------|---------|--------|
| GET projects | `GET /api/projects` | Array with counts | ✅ |
| GET project | `GET /api/projects/:id` | Project object | ✅ |
| CREATE project | `POST /api/projects` | New project | ✅ |
| UPDATE project | `PUT /api/projects/:id` | Updated project | ✅ |
| DELETE project | `DELETE /api/projects/:id` | Success | ✅ |
| GET project stats | `GET /api/projects/:id/stats` | Stats object | ✅ |

---

## 2. Tests E2E Frontend

### 2.1 Navigation (11 tests)
- [x] Page d'accueil charge
- [x] Navigation vers Projects
- [x] Navigation vers Reporting
- [x] Navigation vers Settings
- [x] Gestion 404
- [x] Sidebar items corrects
- [x] Navigation projet avec tabs
- [x] Switch entre tabs projet
- [x] Breadcrumb affiché

### 2.2 Projects (13 tests)
- [x] Liste des projets
- [x] Bouton créer projet
- [x] Modal création projet
- [x] Navigation vers détail
- [x] Dashboard projet
- [x] Section active jobs
- [x] Section collection points
- [x] Section articles récents
- [x] Bouton Run Collection
- [x] Page settings
- [x] Sections settings
- [x] Sauvegarde settings

### 2.3 Project Settings (31 tests)
- [x] Navigation vers settings
- [x] Affichage page settings
- [x] Section General
- [x] Input nom projet
- [x] Textarea description
- [x] Color picker
- [x] Changement couleur
- [x] Edition nom
- [x] Section Language
- [x] Dropdown source language
- [x] Options langues
- [x] Selection langue
- [x] Target languages
- [x] Toggle target language
- [x] Section Automation
- [x] Switch auto-transform
- [x] Switch auto-translate
- [x] Toggle switches
- [x] Persistence état switch
- [x] Bouton Save Changes
- [x] Sauvegarde réelle
- [x] Loading state
- [x] Danger Zone
- [x] Bouton delete
- [x] Dialog confirmation
- [x] Affichage nom projet
- [x] Bouton cancel
- [x] Bouton confirm delete
- [x] Validation required

### 2.4 Collection Points (15 tests)
- [x] Affichage liste
- [x] Status badge correct
- [x] Bouton start collection
- [x] Progress bar pendant job
- [x] Success rate basé sur jobs réels
- [x] Création nouveau provider
- [x] Edition provider
- [x] Suppression provider (erreur si articles)
- [x] Message d'erreur clair

### 2.5 Live Monitor (10 tests)
- [x] Affichage jobs actifs
- [x] Stats header
- [x] Progress en temps réel
- [x] Boutons action (pause/resume/cancel)
- [x] Réactivité < 2s
- [x] Empty state
- [x] Filtrage par projet

### 2.6 Content Repository (20 tests)
- [x] Pipeline overview cards
- [x] Filtrage par status
- [x] Selection multiple
- [x] Batch actions
- [x] Transform single
- [x] Translate single
- [x] Delete single
- [x] Batch delete
- [x] Batch transform
- [x] Batch translate
- [x] Pagination
- [x] Article detail
- [x] SEO score display

### 2.7 API/Health (5 tests)
- [x] Health endpoint
- [x] Stats endpoint
- [x] Providers endpoint
- [x] Articles endpoint
- [x] Jobs endpoint

---

## 3. Tests de Performance

### 3.1 API Response Times
| Endpoint | Target | Actual |
|----------|--------|--------|
| /api/health | < 100ms | ✅ |
| /api/providers | < 200ms | ✅ |
| /api/articles?limit=50 | < 500ms | ✅ |
| /api/jobs | < 100ms | ✅ |

### 3.2 Scraping Performance
| Metric | Target |
|--------|--------|
| URLs processed/min | 60+ |
| Memory usage | < 200MB/instance |
| Job startup time | < 5s |

---

## 4. Tests de Robustesse

### 4.1 Cluster Mode
- [x] Jobs visibles depuis toutes les instances (Redis)
- [x] Pas de jobs dupliqués (Redis lock)
- [x] Cleanup Redis on job complete/fail

### 4.2 Error Handling
- [x] Delete provider with articles → 409 avec message clair
- [x] Article not found → 404
- [x] Job not found → 404
- [x] Invalid request → 400 avec message
- [x] Database error → 500 avec message

### 4.3 Edge Cases
- [x] Batch delete empty array → 400
- [x] Batch operations with invalid IDs → Handled gracefully
- [x] Concurrent scrape requests same provider → 409

---

## 5. Commandes de Test

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/project-settings.spec.ts

# Run with UI
npx playwright test --ui

# Run with debug
npx playwright test --debug

# Generate report
npx playwright test --reporter=html
```

---

## 6. Checklist Pre-Deploy

- [ ] All 122 E2E tests pass
- [ ] API health check returns ok
- [ ] PM2 all instances online
- [ ] Redis connection ok
- [ ] PostgreSQL connection ok
- [ ] No console errors in browser
- [ ] Build completes without errors

---

## 7. Issues Résolus

| Issue | Fix |
|-------|-----|
| Duplicate jobs in cluster | Redis-based job tracking |
| Article not found error | Created translations table |
| Delete provider fails | Added article check with clear message |
| Batch delete 404 | Added batch endpoints to server |
| Jobs disappear from UI | Using Redis for cluster-wide visibility |

---

## 8. Improvements Futurs

1. **WebSocket** pour updates temps réel des jobs
2. **Job queue** avec Bull/BullMQ pour persistence
3. **Rate limiting** sur les endpoints
4. **Authentication** JWT
5. **Monitoring** avec Prometheus/Grafana
