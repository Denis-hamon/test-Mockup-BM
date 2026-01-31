const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const redis = require('redis');
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const app = express();

// ==================== SECURITY CONFIGURATION ====================

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  maxAge: 600,
}));

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ==================== STRUCTURED LOGGING ====================

const logger = {
  info: (msg, data = {}) => console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    msg,
    ...data
  })),
  warn: (msg, data = {}) => console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'warn',
    msg,
    ...data
  })),
  error: (msg, error = null, data = {}) => console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    msg,
    error: error?.message || error,
    stack: error?.stack,
    ...data
  })),
};

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health' && !req.path.startsWith('/assets')) {
      logger.info(`${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });
  next();
});

// ==================== CONSTANTS ====================

const ALL_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl'];
const BATCH_LIMIT = 1000; // Maximum items per batch operation
const MAX_PAGE_SIZE = 100; // Maximum items per page

// ==================== INPUT VALIDATION HELPERS ====================

function validatePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit || '20', 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function validateIds(ids, fieldName = 'ids') {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { valid: false, error: `${fieldName} array required` };
  }
  if (ids.length > BATCH_LIMIT) {
    return { valid: false, error: `Maximum ${BATCH_LIMIT} items per batch` };
  }
  if (!ids.every(id => Number.isInteger(id) && id > 0)) {
    return { valid: false, error: `${fieldName} must be positive integers` };
  }
  return { valid: true };
}

// ==================== DATABASE CONFIGURATION ====================

const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'content_pipeline',
  user: process.env.PG_USER || 'pipeline_user',
  password: process.env.PG_PASSWORD || 'pipeline_password'
});

let redisClient;
(async () => {
  redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  redisClient.on('error', err => console.error('Redis error:', err));
  await redisClient.connect();
  console.log('Redis connected successfully');
})();

// ==================== FIRECRAWL CONFIGURATION ====================

let firecrawlApiKey = process.env.FIRECRAWL_API_KEY || 'fc-test';
const FIRECRAWL_URL = process.env.FIRECRAWL_URL || 'http://localhost:3002';

app.post('/api/firecrawl/config', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    firecrawlApiKey = apiKey;
    res.json({ message: 'Firecrawl API key configured' });
  } else {
    res.status(400).json({ error: 'API key required' });
  }
});

// ==================== OVH AI CONFIGURATION ====================

const OVH_AI_ENDPOINT = process.env.OVH_AI_ENDPOINT || 'https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';
const OVH_AI_TOKEN = process.env.OVH_AI_TOKEN || '';

// ==================== JOB MANAGEMENT ====================

class Job {
  constructor(id, providerId, url, language = 'fr') {
    this.id = id;
    this.providerId = providerId;
    this.url = url;
    this.language = language;
    this.status = 'running';
    this.current = 0;
    this.total = 0;
    this.errors = 0;
    this.isPaused = false;
    this.logs = [];
    this.startedAt = new Date();
    this.articles = [];
  }

  get completionRate() {
    return this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;
  }

  addLog(message, level = 'info', url = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, url };
    this.logs.push(logEntry);
    console.log(`${timestamp}: [Job ${this.id}] ${level.toUpperCase()}: ${message}`);

    // Save to database
    pgPool.query(
      'INSERT INTO job_logs (job_id, level, message, url) VALUES ($1, $2, $3, $4)',
      [this.id, level, message, url]
    ).catch(err => console.error('Failed to save log:', err.message));
  }

  toJSON() {
    return {
      id: this.id,
      providerId: this.providerId,
      url: this.url,
      language: this.language,
      status: this.status,
      current: this.current,
      total: this.total,
      errors: this.errors,
      completionRate: this.completionRate,
      startedAt: this.startedAt,
      logs: this.logs.slice(-50)
    };
  }
}

// Redis-backed job storage for cluster mode
const JOBS_KEY = 'active_jobs'; // Redis hash for all jobs

async function saveJobToRedis(job) {
  try {
    await redisClient.hSet(JOBS_KEY, String(job.id), JSON.stringify(job.toJSON()));
  } catch (err) {
    console.error('Failed to save job to Redis:', err.message);
  }
}

async function getJobFromRedis(jobId) {
  try {
    const data = await redisClient.hGet(JOBS_KEY, String(jobId));
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to get job from Redis:', err.message);
    return null;
  }
}

async function getAllJobsFromRedis() {
  try {
    const data = await redisClient.hGetAll(JOBS_KEY);
    return Object.values(data).map(j => JSON.parse(j));
  } catch (err) {
    console.error('Failed to get jobs from Redis:', err.message);
    return [];
  }
}

async function deleteJobFromRedis(jobId) {
  try {
    await redisClient.hDel(JOBS_KEY, String(jobId));
  } catch (err) {
    console.error('Failed to delete job from Redis:', err.message);
  }
}

// Local reference for active job instances (for running scrape processes)
const localJobs = new Map();

// ==================== HEALTH & STATS ====================

app.get('/api/health', async (req, res) => {
  let pgStatus = 'error';
  let redisStatus = 'error';

  try {
    await pgPool.query('SELECT 1');
    pgStatus = 'ok';
  } catch (e) {}

  try {
    await redisClient.ping();
    redisStatus = 'ok';
  } catch (e) {}

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: { postgresql: pgStatus, redis: redisStatus }
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    // Optimized: Single query instead of 4 separate queries
    const statsResult = await pgPool.query(`
      SELECT
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'transformed') as transformed_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'translated') as translated_articles,
        (SELECT COUNT(*) FROM providers) as total_providers,
        (SELECT COALESCE(SUM(word_count), 0) FROM articles) as total_words
    `);

    const stats = statsResult.rows[0];
    const jobs = await getAllJobsFromRedis();

    res.json({
      totalArticles: parseInt(stats.total_articles),
      transformedArticles: parseInt(stats.transformed_articles),
      translatedArticles: parseInt(stats.translated_articles),
      totalProviders: parseInt(stats.total_providers),
      totalWords: parseInt(stats.total_words),
      activeJobs: jobs.filter(j => j.status === 'running').length
    });
  } catch (error) {
    logger.error('Stats endpoint error', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDERS ====================

app.get('/api/providers', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = `
      SELECT p.*, pr.name as project_name,
             (SELECT COUNT(*) FROM articles a WHERE a.provider_id = p.id) as articles_count
      FROM providers p
      LEFT JOIN projects pr ON p.project_id = pr.id
    `;
    const params = [];

    if (projectId) {
      query += ' WHERE p.project_id = $1';
      params.push(projectId);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM providers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/providers', async (req, res) => {
  try {
    const { name, slug, base_urls, project_id } = req.body;
    const result = await pgPool.query(
      'INSERT INTO providers (name, slug, base_urls, project_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, slug, JSON.stringify(base_urls), project_id || 1, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/providers/:id', async (req, res) => {
  try {
    const { name, slug, base_urls, status } = req.body;
    const result = await pgPool.query(
      'UPDATE providers SET name = COALESCE($1, name), slug = COALESCE($2, slug), base_urls = COALESCE($3, base_urls), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, slug, base_urls ? JSON.stringify(base_urls) : null, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/providers/:id', async (req, res) => {
  try {
    const providerId = req.params.id;

    // Check if there are articles for this provider
    const articleCheck = await pgPool.query(
      'SELECT COUNT(*) as count FROM articles WHERE provider_id = $1',
      [providerId]
    );
    const articleCount = parseInt(articleCheck.rows[0].count);

    // Check for force delete option
    const forceDelete = req.query.force === 'true';

    if (articleCount > 0 && !forceDelete) {
      return res.status(409).json({
        error: 'Cannot delete provider with articles',
        articleCount: articleCount,
        message: `This provider has ${articleCount} articles. Delete them first or use force delete.`
      });
    }

    // If force delete, delete articles first
    if (forceDelete && articleCount > 0) {
      await pgPool.query('DELETE FROM articles WHERE provider_id = $1', [providerId]);
    }

    // Delete the provider
    await pgPool.query('DELETE FROM providers WHERE id = $1', [providerId]);

    // Clean up any Redis tracking
    await redisClient.del(`active_job_provider:${providerId}`);

    res.json({ success: true, deletedArticles: forceDelete ? articleCount : 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROJECTS ====================

app.get('/api/projects', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM providers pr WHERE pr.project_id = p.id) as providers_count,
             (SELECT COUNT(*) FROM articles a JOIN providers pr ON a.provider_id = pr.id WHERE pr.project_id = p.id) as articles_count
      FROM projects p
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, color, default_language, target_languages, auto_transform, auto_translate } = req.body;
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await pgPool.query(
      'INSERT INTO projects (name, slug, description, color, default_language, target_languages, auto_transform, auto_translate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, slug, description, color || '#3b82f6', default_language || 'en', target_languages || ['fr'], auto_transform || false, auto_translate || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, description, color, default_language, target_languages, auto_transform, auto_translate, ai_guidelines } = req.body;
    // Generate slug from name if name is provided
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null;
    const result = await pgPool.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        color = COALESCE($4, color),
        default_language = COALESCE($5, default_language),
        target_languages = COALESCE($6, target_languages),
        auto_transform = COALESCE($7, auto_transform),
        auto_translate = COALESCE($8, auto_translate),
        ai_guidelines = COALESCE($9, ai_guidelines),
        updated_at = NOW()
      WHERE id = $10 RETURNING *`,
      [name, slug, description, color, default_language, target_languages, auto_transform, auto_translate, ai_guidelines ? JSON.stringify(ai_guidelines) : null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const forceDelete = req.query.force === 'true';

    // Check for providers in this project
    const providerCheck = await pgPool.query(
      'SELECT COUNT(*) as count FROM providers WHERE project_id = $1',
      [projectId]
    );
    const providerCount = parseInt(providerCheck.rows[0].count);

    if (providerCount > 0 && !forceDelete) {
      return res.status(409).json({
        error: 'Cannot delete project with providers',
        providerCount: providerCount,
        message: `This project has ${providerCount} collection points. Delete them first or use force delete.`
      });
    }

    // If force delete, delete providers and their articles first
    if (forceDelete && providerCount > 0) {
      // Get provider IDs
      const providers = await pgPool.query('SELECT id FROM providers WHERE project_id = $1', [projectId]);
      const providerIds = providers.rows.map(p => p.id);

      // Delete articles for these providers
      if (providerIds.length > 0) {
        const placeholders = providerIds.map((_, i) => `$${i + 1}`).join(', ');
        await pgPool.query(`DELETE FROM articles WHERE provider_id IN (${placeholders})`, providerIds);
      }

      // Delete providers
      await pgPool.query('DELETE FROM providers WHERE project_id = $1', [projectId]);
    }

    // Delete the project
    await pgPool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ARTICLES ====================

app.get('/api/articles', async (req, res) => {
  try {
    // Validate pagination parameters
    const { page, limit, offset } = validatePagination(req.query);
    const { status, language, providerId, projectId, search } = req.query;

    let query = `
      SELECT a.*, p.name as provider_name, p.slug as provider_slug
      FROM articles a
      LEFT JOIN providers p ON a.provider_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    if (language) {
      query += ` AND a.language = $${paramIndex++}`;
      params.push(language);
    }
    if (providerId) {
      query += ` AND a.provider_id = $${paramIndex++}`;
      params.push(parseInt(providerId));
    }
    if (projectId) {
      query += ` AND p.project_id = $${paramIndex++}`;
      params.push(parseInt(projectId));
    }
    if (search) {
      query += ` AND (a.title ILIKE $${paramIndex} OR a.original_content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT a.*, p.name as provider_name, p.slug as provider_slug', 'SELECT COUNT(*) as total');
    const countResult = await pgPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pgPool.query(query, params);

    res.json({
      articles: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Articles listing error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT a.*, p.name as provider_name
      FROM articles a
      LEFT JOIN providers p ON a.provider_id = p.id
      WHERE a.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get translations
    const translations = await pgPool.query(
      'SELECT * FROM translations WHERE article_id = $1',
      [req.params.id]
    );

    const article = result.rows[0];
    article.translations = translations.rows;

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { title, transformed_content, status, seo_score, seo_breakdown } = req.body;
    const result = await pgPool.query(
      `UPDATE articles SET
        title = COALESCE($1, title),
        transformed_content = COALESCE($2, transformed_content),
        status = COALESCE($3, status),
        seo_score = COALESCE($4, seo_score),
        seo_breakdown = COALESCE($5, seo_breakdown),
        updated_at = NOW()
      WHERE id = $6 RETURNING *`,
      [title, transformed_content, status, seo_score, seo_breakdown ? JSON.stringify(seo_breakdown) : null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE single article
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const result = await pgPool.query(
      'DELETE FROM articles WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ success: true, deleted: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch delete articles
app.post('/api/articles/batch/delete', async (req, res) => {
  try {
    const { articleIds } = req.body;

    // Validate input
    const validation = validateIds(articleIds, 'articleIds');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const placeholders = articleIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pgPool.query(
      `DELETE FROM articles WHERE id IN (${placeholders}) RETURNING id`,
      articleIds
    );

    logger.info('Batch delete completed', { deleted: result.rows.length });
    res.json({
      success: true,
      message: `Deleted ${result.rows.length} articles`,
      deleted: result.rows.length
    });
  } catch (error) {
    logger.error('Batch delete error', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch transform articles
app.post('/api/articles/batch/transform', async (req, res) => {
  try {
    const { articleIds } = req.body;

    // Validate input
    const validation = validateIds(articleIds, 'articleIds');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Initialize progress in Redis
    await redisClient.hSet('transform_progress', {
      status: 'running',
      current: '0',
      total: String(articleIds.length),
      errors: '0'
    });

    logger.info('Batch transform started', { count: articleIds.length });
    res.json({
      success: true,
      message: `Started transformation of ${articleIds.length} articles`,
      queued: articleIds.length
    });

    // Process articles in background
    (async () => {
      let current = 0;
      let errors = 0;
      for (const articleId of articleIds) {
        try {
          await transformArticle(articleId);
          current++;
          await redisClient.hSet('transform_progress', { current: String(current) });
        } catch (error) {
          logger.error(`Transform error for article ${articleId}`, error);
          errors++;
          await redisClient.hSet('transform_progress', { errors: String(errors) });
        }
      }
      await redisClient.hSet('transform_progress', { status: 'completed' });
      logger.info('Batch transform completed', { processed: current, errors });
    })();

  } catch (error) {
    logger.error('Batch transform error', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch translate articles
app.post('/api/articles/batch/translate', async (req, res) => {
  try {
    const { articleIds, languages } = req.body;

    // Validate input
    const validation = validateIds(articleIds, 'articleIds');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Use provided languages or default to all languages
    const targetLanguages = languages && languages.length > 0 ? languages : ALL_LANGUAGES;

    // Initialize progress in Redis
    const totalTranslations = articleIds.length * targetLanguages.length;
    await redisClient.hSet('translate_progress', {
      status: 'running',
      current: '0',
      total: String(totalTranslations),
      errors: '0'
    });

    res.json({
      success: true,
      message: `Started translation of ${articleIds.length} articles to ${targetLanguages.length} languages`,
      queued: totalTranslations
    });

    // Process translations in background
    (async () => {
      let current = 0;
      let errors = 0;
      for (const articleId of articleIds) {
        // Get article's source language
        const articleResult = await pgPool.query('SELECT language FROM articles WHERE id = $1', [articleId]);
        const sourceLanguage = articleResult.rows[0]?.language || 'fr';

        for (const targetLang of targetLanguages) {
          // Skip if target language is same as source
          if (targetLang === sourceLanguage) {
            current++;
            await redisClient.hSet('translate_progress', { current: String(current) });
            continue;
          }

          try {
            await translateArticle(articleId, targetLang);
            current++;
            await redisClient.hSet('translate_progress', { current: String(current) });
          } catch (error) {
            console.error(`Translate error for article ${articleId} to ${targetLang}:`, error.message);
            errors++;
            await redisClient.hSet('translate_progress', { errors: String(errors) });
            current++;
            await redisClient.hSet('translate_progress', { current: String(current) });
          }
        }
      }
      await redisClient.hSet('translate_progress', { status: 'completed' });
    })();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch publish articles
app.post('/api/articles/batch/publish', async (req, res) => {
  try {
    const { articleIds } = req.body;
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ error: 'articleIds array required' });
    }
    const placeholders = articleIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pgPool.query(
      `UPDATE articles SET status = 'published', updated_at = NOW() WHERE id IN (${placeholders}) RETURNING id`,
      articleIds
    );
    res.json({
      success: true,
      message: `Published ${result.rows.length} articles`,
      published: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== JOBS ====================

app.get('/api/jobs', async (req, res) => {
  const jobs = await getAllJobsFromRedis();
  res.json(jobs);
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await getJobFromRedis(parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.post('/api/jobs/:id/pause', async (req, res) => {
  const jobId = parseInt(req.params.id);
  const jobData = await getJobFromRedis(jobId);
  if (!jobData) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Update local job if it exists on this instance
  const localJob = localJobs.get(jobId);
  if (localJob) {
    localJob.isPaused = true;
    localJob.status = 'paused';
    localJob.addLog('Job paused', 'info');
    await saveJobToRedis(localJob);
    res.json(localJob.toJSON());
  } else {
    // Just update Redis directly
    jobData.status = 'paused';
    await redisClient.hSet(JOBS_KEY, String(jobId), JSON.stringify(jobData));
    res.json(jobData);
  }
});

app.post('/api/jobs/:id/resume', async (req, res) => {
  const jobId = parseInt(req.params.id);
  const jobData = await getJobFromRedis(jobId);
  if (!jobData) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Update local job if it exists on this instance
  const localJob = localJobs.get(jobId);
  if (localJob) {
    localJob.isPaused = false;
    localJob.status = 'running';
    localJob.addLog('Job resumed', 'info');
    await saveJobToRedis(localJob);
    res.json(localJob.toJSON());
  } else {
    // Just update Redis directly
    jobData.status = 'running';
    await redisClient.hSet(JOBS_KEY, String(jobId), JSON.stringify(jobData));
    res.json(jobData);
  }
});

app.post('/api/jobs/:id/stop', async (req, res) => {
  const jobId = parseInt(req.params.id);
  const jobData = await getJobFromRedis(jobId);
  if (!jobData) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Update local job if it exists on this instance
  const localJob = localJobs.get(jobId);
  if (localJob) {
    localJob.status = 'cancelled';
    localJob.addLog('Job stopped by user', 'info');
    await saveJobToRedis(localJob);
    localJobs.delete(jobId);
  }

  // Update Redis
  jobData.status = 'cancelled';
  await redisClient.hSet(JOBS_KEY, String(jobId), JSON.stringify(jobData));
  await redisClient.del(`active_job_provider:${jobData.providerId}`);

  res.json({ success: true });
});

// ==================== SCRAPING ====================

app.post('/api/scrape', async (req, res) => {
  const { providerId, url, language = 'fr' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  // Check if there is already an active job for this provider (using Redis for cluster mode)
  const existingJobKey = await redisClient.get(`active_job_provider:${providerId}`);
  if (existingJobKey) {
    const existingJob = JSON.parse(existingJobKey);
    return res.status(409).json({
      error: 'Job already running for this provider',
      jobId: existingJob.id,
      status: existingJob.status
    });
  }

  const jobId = Date.now();
  const job = new Job(jobId, providerId, url, language);

  // Store locally for this instance AND in Redis for cluster mode
  localJobs.set(jobId, job);
  await saveJobToRedis(job);

  // Track provider lock in Redis (expires in 1 hour)
  await redisClient.setEx(`active_job_provider:${providerId}`, 3600, JSON.stringify({ id: jobId, status: 'running' }));

  res.json({ jobId, message: 'Scraping started' });

  // Run scraping in background
  scrapeWithFirecrawl(job).catch(err => {
    job.status = 'failed';
    job.addLog(`Erreur fatale: ${err.message}`, 'error');
    saveJobToRedis(job);
    redisClient.del(`active_job_provider:${job.providerId}`);
  });
});

async function scrapeWithFirecrawl(job) {
  try {
    job.addLog(`Demarrage collecte: ${job.url}`, 'info');

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey, apiUrl: FIRECRAWL_URL });

    job.addLog('Crawling du site...', 'info');

    // Use crawlUrl instead of mapUrl for self-hosted Firecrawl
    const crawlResult = await firecrawl.crawlUrl(job.url, {
      limit: 100,
      scrapeOptions: { formats: ['markdown'] }
    });

    if (!crawlResult.success) {
      throw new Error(crawlResult.error || 'Crawl failed');
    }

    // Extract URLs from crawl results
    const allUrls = (crawlResult.data || [])
      .map(page => page.metadata?.sourceURL || page.metadata?.url)
      .filter(Boolean);

    job.addLog(`${allUrls.length} URLs trouvees`, 'info');

    // Log sample URLs for debugging
    if (allUrls.length > 0) {
      job.addLog(`Sample URLs: ${allUrls.slice(0, 5).join(', ')}`, 'info');
    }

    // Filter article URLs - more lenient filtering
    const articleUrls = allUrls.filter(url => {
      const articlePatterns = [
        '/tutoriels/', '/tutorials/', '/tutoriales/',
        '/blog/', '/article/', '/articles/',
        '/post/', '/posts/', '/news/',
        '/guide/', '/guides/', '/how-to/',
        '/learn/', '/resources/', '/kb/', '/knowledge-base/'
      ];

      // Check if URL contains any article pattern
      const hasArticlePattern = articlePatterns.some(p => url.includes(p));

      // Also accept URLs that look like articles (have a slug after the pattern)
      try {
        const urlPath = new URL(url).pathname;
        const segments = urlPath.split('/').filter(Boolean);

        // Skip if only has pattern segment (e.g., /tutorials/ with no article slug)
        if (segments.length < 2) return false;

        const slug = segments[segments.length - 1] || '';

        // Skip pagination, categories, tags, authors
        if (slug.startsWith('page') || url.includes('/page/')) return false;
        if (url.includes('/category/') || url.includes('/tag/')) return false;
        if (url.includes('/author/') || url.includes('/archive/')) return false;

        // Accept if has article pattern OR if slug looks like an article (contains hyphen)
        if (hasArticlePattern && slug.length >= 3 && slug.includes('-')) {
          return true;
        }

        // Also accept if URL has enough path depth and a decent slug
        if (segments.length >= 2 && slug.length >= 5 && slug.length <= 200) {
          return hasArticlePattern;
        }

        return false;
      } catch {
        return false;
      }
    });

    const uniqueUrls = [...new Set(articleUrls)];
    job.addLog(`${uniqueUrls.length} articles a collecter`, 'info');

    job.total = uniqueUrls.length;
    await saveJobToRedis(job); // Save total count to Redis
    const maxArticles = Math.min(uniqueUrls.length, 100);

    // Process articles - use data from crawl if available
    const crawlDataMap = new Map();
    (crawlResult.data || []).forEach(page => {
      const pageUrl = page.metadata?.sourceURL || page.metadata?.url;
      if (pageUrl) crawlDataMap.set(pageUrl, page);
    });

    for (let i = 0; i < maxArticles; i++) {
      // Check Redis for pause/stop from other cluster instances
      const redisJobState = await getJobFromRedis(job.id);
      if (redisJobState) {
        if (redisJobState.status === 'paused') job.isPaused = true;
        if (redisJobState.status === 'running') job.isPaused = false;
        if (redisJobState.status === 'cancelled' || redisJobState.status === 'stopped') {
          job.status = 'cancelled';
        }
      }

      while (job.isPaused) {
        await new Promise(r => setTimeout(r, 1000));
        // Re-check Redis while paused
        const pausedState = await getJobFromRedis(job.id);
        if (pausedState && pausedState.status === 'running') {
          job.isPaused = false;
        }
        if (pausedState && (pausedState.status === 'cancelled' || pausedState.status === 'stopped')) {
          job.status = 'cancelled';
          break;
        }
      }

      if (job.status === 'stopped' || job.status === 'cancelled') break;

      const url = uniqueUrls[i];
      job.current = i + 1;
      job.addLog(`Traitement ${i + 1}/${maxArticles}: ${url}`, 'info', url);

      try {
        let content, title;

        // Check if we already have the content from crawl
        if (crawlDataMap.has(url)) {
          const pageData = crawlDataMap.get(url);
          content = pageData.markdown || '';
          title = pageData.metadata?.title || url.split('/').pop();
        } else {
          // Scrape individually if not in crawl data
          const scrapeResult = await firecrawl.scrapeUrl(url, {
            formats: ['markdown']
          });

          if (!scrapeResult.success) {
            job.errors++;
            job.addLog(`Echec scrape: ${url}`, 'error', url);
            continue;
          }

          content = scrapeResult.data?.markdown || '';
          title = scrapeResult.data?.metadata?.title || url.split('/').pop();
        }

        // Save to database
        const wordCount = content.split(/\s+/).length;

        await pgPool.query(`
          INSERT INTO articles (provider_id, original_title, source_url, original_content, language, word_count, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'collected')
          ON CONFLICT (source_url) DO UPDATE SET
            original_content = EXCLUDED.original_content,
            word_count = EXCLUDED.word_count,
            updated_at = NOW()
        `, [job.providerId, title, url, content, job.language, wordCount]);

        job.articles.push({ url, title, wordCount });
        job.addLog(`Article sauvegarde: ${title}`, 'success', url);

      } catch (error) {
        job.errors++;
        job.addLog(`Erreur: ${error.message}`, 'error', url);
      }

      // Save progress to Redis every 3 articles
      if (job.current % 3 === 0) {
        await saveJobToRedis(job);
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    job.status = 'completed';
    job.addLog(`Collecte terminee! ${job.articles.length} articles`, 'success');
    await saveJobToRedis(job); // Final save

    // Clean up Redis tracking
    await redisClient.del(`active_job_provider:${job.providerId}`);

    // Update provider last_sync
    if (job.providerId) {
      await pgPool.query(
        'UPDATE providers SET last_sync_at = NOW() WHERE id = $1',
        [job.providerId]
      );
    }

    // AUTO-PIPELINE: Automatically transform and translate collected articles
    if (job.articles && job.articles.length > 0) {
      console.log(`[Auto-Pipeline] Starting automatic transformation for ${job.articles.length} articles`);

      // Start transformation in background (don't await to not block)
      processAutoPipeline(job.articles.map(a => a.id), job.providerId).catch(err => {
        console.error('[Auto-Pipeline] Error:', err.message);
      });
    }

  } catch (error) {
    job.status = 'failed';
    job.addLog(`Erreur fatale: ${error.message}`, 'error');
    // Clean up Redis tracking on failure
    await redisClient.del(`active_job_provider:${job.providerId}`);
    throw error;
  }
}

// ==================== TRANSFORMATION ====================

app.get('/api/transform/progress', async (req, res) => {
  try {
    const progress = await redisClient.hGetAll('transform_progress');
    res.json({
      status: progress.status || 'idle',
      current: parseInt(progress.current) || 0,
      total: parseInt(progress.total) || 0,
      errors: parseInt(progress.errors) || 0
    });
  } catch (error) {
    res.json({ status: 'idle', current: 0, total: 0, errors: 0 });
  }
});

app.get('/api/translate/progress', async (req, res) => {
  try {
    const progress = await redisClient.hGetAll('translate_progress');
    res.json({
      status: progress.status || 'idle',
      current: parseInt(progress.current) || 0,
      total: parseInt(progress.total) || 0,
      errors: parseInt(progress.errors) || 0
    });
  } catch (error) {
    res.json({ status: 'idle', current: 0, total: 0, errors: 0 });
  }
});

app.post('/api/transform', async (req, res) => {
  const { articleIds } = req.body;

  if (!articleIds || !articleIds.length) {
    return res.status(400).json({ error: 'Article IDs required' });
  }

  res.json({ message: 'Transformation started', count: articleIds.length });

  // Process in background
  for (const articleId of articleIds) {
    try {
      await transformArticle(articleId);
    } catch (error) {
      console.error(`Transform error for article ${articleId}:`, error.message);
    }
  }
});

// ==================== AUTO-PIPELINE ====================
// Automatically transform and translate articles after collection

async function processAutoPipeline(articleIds, providerId) {
  logger.info('[Auto-Pipeline] Starting', { articleCount: articleIds.length, providerId });

  // Get project settings for this provider
  let aiGuidelines = {};
  try {
    const providerResult = await pgPool.query(
      'SELECT p.ai_guidelines FROM projects p JOIN providers pr ON pr.project_id = p.id WHERE pr.id = $1',
      [providerId]
    );
    if (providerResult.rows.length > 0 && providerResult.rows[0].ai_guidelines) {
      aiGuidelines = providerResult.rows[0].ai_guidelines;
    }
  } catch (err) {
    console.log('[Auto-Pipeline] Could not load AI guidelines, using defaults');
  }

  // Process each article: transform then translate
  for (const articleId of articleIds) {
    try {
      // Step 1: Transform the article
      console.log(`[Auto-Pipeline] Transforming article ${articleId}`);
      await transformArticleWithGuidelines(articleId, aiGuidelines);

      // Step 2: Translate to all 8 languages
      console.log(`[Auto-Pipeline] Translating article ${articleId} to ${ALL_LANGUAGES.length} languages`);
      let translationCount = 0;
      for (const targetLang of ALL_LANGUAGES) {
        try {
          await translateArticle(articleId, targetLang);
          translationCount++;
        } catch (translateErr) {
          console.error(`[Auto-Pipeline] Translation to ${targetLang} failed for article ${articleId}:`, translateErr.message);
        }
        // Small delay between translations
        await new Promise(r => setTimeout(r, 1000));
      }

      // Update article status to 'translated' if at least one translation succeeded
      if (translationCount > 0) {
        await pgPool.query(
          "UPDATE articles SET status = 'translated', updated_at = NOW() WHERE id = $1",
          [articleId]
        );
      }

      console.log(`[Auto-Pipeline] Article ${articleId} fully processed (${translationCount}/${ALL_LANGUAGES.length} translations)`);
    } catch (err) {
      console.error(`[Auto-Pipeline] Error processing article ${articleId}:`, err.message);
    }

    // Small delay between articles to avoid overloading AI endpoint
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`[Auto-Pipeline] Completed processing ${articleIds.length} articles`);
}

async function transformArticleWithGuidelines(articleId, aiGuidelines = {}) {
  console.log(`[Transform] Starting transformation for article ${articleId} with guidelines`);

  const result = await pgPool.query('SELECT * FROM articles WHERE id = $1', [articleId]);
  if (result.rows.length === 0) {
    console.log(`[Transform] Article ${articleId} not found`);
    return;
  }

  const article = result.rows[0];
  if (!article.original_content) {
    console.log(`[Transform] Article ${articleId} has no content`);
    return;
  }

  // Skip if already transformed
  if (article.status === 'transformed' || article.status === 'translated') {
    console.log(`[Transform] Article ${articleId} already processed (status: ${article.status})`);
    return;
  }

  console.log(`[Transform] Article ${articleId} has ${article.original_content.length} chars`);

  // Build system prompt with AI guidelines
  let systemPrompt = `Tu es un expert en rédaction de contenu web SEO-optimisé. Transforme l'article fourni en contenu de haute qualité.`;

  if (aiGuidelines.tone) {
    const toneMap = { formal: 'formel', professional: 'professionnel', casual: 'décontracté', technical: 'technique', educational: 'éducatif' };
    systemPrompt += `\n\nTon: ${toneMap[aiGuidelines.tone] || aiGuidelines.tone}`;
  }
  if (aiGuidelines.targetAudiences && aiGuidelines.targetAudiences.length > 0) {
    const audienceMap = {
      developers: 'développeurs',
      sysadmins: 'administrateurs systèmes',
      startups: 'startups et entrepreneurs',
      smb: 'PME',
      enterprise: 'grandes entreprises',
      agencies: 'agences web',
      ecommerce: 'e-commerce',
      gamers: 'gamers',
      'data-scientists': 'data scientists',
      students: 'étudiants',
      hobbyists: 'hobbyistes',
      resellers: 'revendeurs'
    };
    const audiences = aiGuidelines.targetAudiences.map(a => audienceMap[a] || a).join(', ');
    systemPrompt += `\nAudiences cibles: ${audiences}`;
  }
  if (aiGuidelines.brandName) {
    systemPrompt += `\nMarque à mentionner: ${aiGuidelines.brandName}`;
  }
  if (aiGuidelines.brandVoice) {
    systemPrompt += `\nVoix de marque: ${aiGuidelines.brandVoice}`;
  }
  if (aiGuidelines.termsToUse && aiGuidelines.termsToUse.length > 0) {
    systemPrompt += `\nTermes à utiliser: ${aiGuidelines.termsToUse.join(', ')}`;
  }
  if (aiGuidelines.termsToAvoid && aiGuidelines.termsToAvoid.length > 0) {
    systemPrompt += `\nTermes à éviter: ${aiGuidelines.termsToAvoid.join(', ')}`;
  }
  if (aiGuidelines.primaryKeywords && aiGuidelines.primaryKeywords.length > 0) {
    systemPrompt += `\nMots-clés principaux SEO: ${aiGuidelines.primaryKeywords.join(', ')}`;
  }
  if (aiGuidelines.productsToMention && aiGuidelines.productsToMention.length > 0) {
    systemPrompt += `\nProduits/services à mentionner: ${aiGuidelines.productsToMention.join(', ')}`;
  }
  if (aiGuidelines.customInstructions) {
    systemPrompt += `\n\nInstructions spécifiques:\n${aiGuidelines.customInstructions}`;
  }

  systemPrompt += `\n\nRéponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant/après):
{
  "title": "Titre optimisé SEO",
  "content": "Contenu transformé en HTML",
  "seo_score": 85,
  "ovh_links": [{"keyword": "mot", "url": "https://..."}]
}`;

  try {
    console.log(`[Transform] Calling OVH AI for article ${articleId}...`);
    const response = await fetch(`${OVH_AI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OVH_AI_TOKEN}`
      },
      body: JSON.stringify({
        model: 'DeepSeek-R1-Distill-Llama-70B',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transforme cet article:\n\nTitre: ${article.original_title}\n\nContenu:\n${article.original_content.substring(0, 15000)}` }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OVH AI responded with ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Transform] OVH AI responded for article ${articleId}`);

    let content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let transformed;
    try {
      // Clean the response - remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Remove thinking tags if present
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      transformed = JSON.parse(content);
    } catch (parseErr) {
      console.log(`[Transform] Could not parse JSON, using raw content`);
      transformed = {
        title: article.original_title,
        content: content,
        seo_score: 70,
        ovh_links: []
      };
    }

    // Update article in database
    await pgPool.query(
      `UPDATE articles SET
        transformed_title = $1,
        transformed_content = $2,
        seo_score = $3,
        ovh_links = $4,
        status = 'transformed',
        updated_at = NOW()
      WHERE id = $5`,
      [
        transformed.title || article.original_title,
        transformed.content || content,
        transformed.seo_score || 70,
        JSON.stringify(transformed.ovh_links || []),
        articleId
      ]
    );

    console.log(`Article ${articleId} transformed successfully`);

  } catch (error) {
    console.error(`[Transform] Error for article ${articleId}:`, error.message);
    throw error;
  }
}

async function transformArticle(articleId) {
  // Legacy function - calls the new one with empty guidelines
  return transformArticleWithGuidelines(articleId, {});

  const result = await pgPool.query('SELECT * FROM articles WHERE id = $1', [articleId]);
  if (result.rows.length === 0) {
    console.log(`[Transform] Article ${articleId} not found`);
    return;
  }

  const article = result.rows[0];
  if (!article.original_content) {
    console.log(`[Transform] Article ${articleId} has no content`);
    return;
  }

  console.log(`[Transform] Article ${articleId} has ${article.original_content.length} chars`);

  const prompt = `Tu es un expert SEO. Transforme cet article pour optimiser son référencement tout en gardant le sens original. Améliore la structure avec des titres H2/H3, ajoute des listes à puces si pertinent, et optimise les mots-clés.

Article original:
${article.original_content.substring(0, 8000)}

Retourne uniquement l'article transformé en markdown, sans commentaires.`;

  try {
    console.log(`[Transform] Calling OVH AI for article ${articleId}...`);
    const response = await fetch(`${OVH_AI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OVH_AI_TOKEN}`
      },
      body: JSON.stringify({
        model: 'DeepSeek-R1-Distill-Llama-70B',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Transform] OVH AI error ${response.status}: ${errorText}`);
      throw new Error(`OVH AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Transform] OVH AI responded for article ${articleId}`);
    const transformedContent = data.choices?.[0]?.message?.content || '';

    // Calculate SEO score
    const seoScore = calculateSEOScore(transformedContent);

    await pgPool.query(
      `UPDATE articles SET
        transformed_content = $1,
        status = 'transformed',
        seo_score = $2,
        seo_breakdown = $3,
        updated_at = NOW()
      WHERE id = $4`,
      [transformedContent, seoScore.total, JSON.stringify(seoScore.breakdown), articleId]
    );

    console.log(`Article ${articleId} transformed successfully`);
  } catch (error) {
    console.error(`Transform error for ${articleId}:`, error.message);
    throw error;
  }
}

function calculateSEOScore(content) {
  let breakdown = {
    keywords: 0,
    readability: 0,
    structure: 0,
    meta: 0
  };

  // Structure score (headings)
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;
  breakdown.structure = Math.min(100, (h2Count * 15) + (h3Count * 10));

  // Readability score (paragraph length, lists)
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
  const hasList = content.includes('- ') || content.includes('* ');
  breakdown.readability = Math.min(100, 50 + (avgParagraphLength < 500 ? 30 : 0) + (hasList ? 20 : 0));

  // Keywords score (basic heuristic)
  const wordCount = content.split(/\s+/).length;
  breakdown.keywords = Math.min(100, wordCount > 300 ? 80 : 50);

  // Meta score (has title, good length)
  const hasTitle = content.startsWith('#');
  breakdown.meta = hasTitle ? 80 : 40;

  const total = Math.round((breakdown.keywords + breakdown.readability + breakdown.structure + breakdown.meta) / 4);

  return { total, breakdown };
}

// ==================== TRANSLATIONS ====================

app.post('/api/articles/:id/translate', async (req, res) => {
  const { targetLanguage } = req.body;
  const articleId = req.params.id;

  res.json({ message: 'Translation started' });

  try {
    await translateArticle(articleId, targetLanguage);
  } catch (error) {
    console.error(`Translation error:`, error.message);
  }
});

async function translateArticle(articleId, targetLanguage) {
  const result = await pgPool.query('SELECT * FROM articles WHERE id = $1', [articleId]);
  if (result.rows.length === 0) return;

  const article = result.rows[0];
  const content = article.transformed_content || article.original_content;
  if (!content) return;

  const prompt = `Traduis cet article en ${targetLanguage}. Garde la mise en forme markdown et la structure.

Article:
${content.substring(0, 8000)}

Retourne uniquement la traduction, sans commentaires.`;

  try {
    const response = await fetch(`${OVH_AI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OVH_AI_TOKEN}`
      },
      body: JSON.stringify({
        model: 'DeepSeek-R1-Distill-Llama-70B',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OVH AI error: ${response.status}`);
    }

    const data = await response.json();
    const translatedContent = data.choices?.[0]?.message?.content || '';

    await pgPool.query(`
      INSERT INTO translations (article_id, language, translated_content, status)
      VALUES ($1, $2, $3, 'completed')
      ON CONFLICT (article_id, language) DO UPDATE SET
        translated_content = EXCLUDED.translated_content,
        status = 'completed',
        updated_at = NOW()
    `, [articleId, targetLanguage, translatedContent]);

    console.log(`Article ${articleId} translated to ${targetLanguage}`);
  } catch (error) {
    console.error(`Translation error:`, error.message);
    throw error;
  }
}

// ==================== SSE FOR REAL-TIME UPDATES ====================

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(async () => {
    const jobs = await getAllJobsFromRedis();
    sendEvent({ type: 'jobs', data: jobs });
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ==================== SPA FALLBACK ====================

app.get('/*path', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Content Pipeline API v2 running on port ${PORT}`);
});
