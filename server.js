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

const OVH_AI_ENDPOINT = process.env.OVH_AI_ENDPOINT || 'https://llama-3-3-70b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';

// Multiple API keys for parallelization - round-robin rotation
const OVH_AI_TOKENS = [
  process.env.OVH_AI_TOKEN || '',
  process.env.OVH_AI_TOKEN_2 || 'eyJhbGciOiJFZERTQSIsImtpZCI6IjgzMkFGNUE5ODg3MzFCMDNGM0EzMTRFMDJFRUJFRjBGNDE5MUY0Q0YiLCJraW5kIjoicGF0IiwidHlwIjoiSldUIn0.eyJ0b2tlbiI6InlxanJwR2M1K2hOTzRJSGhjdi9zSzB0aGw0M0ljNExaQU1rSC9TaW1ja2s9In0.ArrxekCMgthTexgA-fUeIq1acWr3w1koCddxNlfadNLtsevcOrTa-f7k-AQRqbkzZHuLBQtffdRiLoBMCHCHAQ'
].filter(t => t); // Remove empty tokens

let currentTokenIndex = 0;
const tokenUsageCount = new Map();
const tokenLastUsed = new Map();

// Round-robin API key rotation with stats tracking
function getNextApiKey() {
  if (OVH_AI_TOKENS.length === 0) {
    throw new Error('No OVH AI tokens configured');
  }
  const token = OVH_AI_TOKENS[currentTokenIndex];
  const keyIndex = currentTokenIndex;
  currentTokenIndex = (currentTokenIndex + 1) % OVH_AI_TOKENS.length;

  // Track usage
  tokenUsageCount.set(keyIndex, (tokenUsageCount.get(keyIndex) || 0) + 1);
  tokenLastUsed.set(keyIndex, Date.now());

  console.log('[API Key] Using key #' + (keyIndex + 1) + ' of ' + OVH_AI_TOKENS.length);
  return token;
}

// For backwards compatibility
const OVH_AI_TOKEN = OVH_AI_TOKENS[0] || '';

console.log('[OVH AI] Multi-key configuration loaded with ' + OVH_AI_TOKENS.length + ' keys');

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

// ==================== ARTICLE VALIDATION ====================

// Known bot protection phrases
const BOT_PROTECTION_PHRASES = [
  "please wait while your request is being verified",
  "one moment, please",
  "checking your browser",
  "please enable javascript",
  "access denied",
  "ray id:",
  "cloudflare",
  "ddos protection",
  "please complete the security check",
  "just a moment",
  "verifying you are human"
];

// Validate article content quality
function validateArticleContent(content, title) {
  const issues = [];
  const contentLower = (content || "").toLowerCase();
  const titleLower = (title || "").toLowerCase();
  
  // Check minimum content length (at least 200 chars for meaningful content)
  if (!content || content.length < 200) {
    issues.push({
      type: "content_too_short",
      message: "Content is too short (" + (content?.length || 0) + " chars). Minimum 200 chars required.",
      severity: "error"
    });
  }
  
  // Check for bot protection phrases
  for (const phrase of BOT_PROTECTION_PHRASES) {
    if (contentLower.includes(phrase) || titleLower.includes(phrase)) {
      issues.push({
        type: "bot_protection_detected",
        message: "Bot protection detected: ",
        severity: "error"
      });
      break;
    }
  }
  
  // Check word count (at least 50 words for meaningful content)
  const wordCount = (content || "").split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 50) {
    issues.push({
      type: "word_count_too_low",
      message: "Word count too low (" + wordCount + " words). Minimum 50 words required.",
      severity: "error"
    });
  }
  
  // Check for generic error titles
  const errorTitles = ["error", "404", "not found", "access denied", "forbidden", "one moment"];
  for (const errorTitle of errorTitles) {
    if (titleLower.includes(errorTitle)) {
      issues.push({
        type: "error_title_detected",
        message: "Error page title detected: ",
        severity: "warning"
      });
      break;
    }
  }
  
  const isValid = !issues.some(i => i.severity === "error");
  
  return {
    isValid,
    issues,
    wordCount,
    contentLength: content?.length || 0,
    canTransform: isValid && wordCount >= 50 && (content?.length || 0) >= 200
  };
}

// Diagnose articles endpoint
app.get("/api/articles/diagnose", async (req, res) => {
  try {
    const { providerId, status } = req.query;
    
    let query = "SELECT id, original_title, original_content, source_url, status, provider_id FROM articles WHERE 1=1";
    const params = [];
    
    if (providerId) {
      params.push(parseInt(providerId));
      query += " AND provider_id = $" + params.length;
    }
    
    if (status) {
      params.push(status);
      query += " AND status = $" + params.length;
    }
    
    query += " ORDER BY id DESC LIMIT 100";
    
    const result = await pgPool.query(query, params);
    
    const diagnoses = result.rows.map(article => {
      const validation = validateArticleContent(article.original_content, article.original_title);
      return {
        id: article.id,
        title: article.original_title,
        url: article.source_url,
        status: article.status,
        providerId: article.provider_id,
        validation: validation
      };
    });
    
    // Summary stats
    const validCount = diagnoses.filter(d => d.validation.isValid).length;
    const invalidCount = diagnoses.filter(d => !d.validation.isValid).length;
    const botProtectionCount = diagnoses.filter(d => 
      d.validation.issues.some(i => i.type === "bot_protection_detected")
    ).length;
    
    res.json({
      summary: {
        total: diagnoses.length,
        valid: validCount,
        invalid: invalidCount,
        botProtectionBlocked: botProtectionCount,
        transformable: diagnoses.filter(d => d.validation.canTransform).length
      },
      articles: diagnoses
    });
    
  } catch (error) {
    logger.error("Article diagnose error", error);
    res.status(500).json({ error: error.message });
  }
});

// Batch validate and mark invalid articles
app.post("/api/articles/validate-batch", async (req, res) => {
  try {
    const { providerId, markInvalid } = req.body;
    
    let query = "SELECT id, original_title, original_content FROM articles WHERE status = collected";
    const params = [];
    
    if (providerId) {
      params.push(parseInt(providerId));
      query += " AND provider_id = $" + params.length;
    }
    
    const result = await pgPool.query(query, params);
    
    let validCount = 0;
    let invalidCount = 0;
    const invalidArticles = [];
    
    for (const article of result.rows) {
      const validation = validateArticleContent(article.original_content, article.original_title);
      
      if (validation.isValid) {
        validCount++;
      } else {
        invalidCount++;
        invalidArticles.push({
          id: article.id,
          title: article.original_title,
          issues: validation.issues
        });
        
        // Mark as invalid if requested
        if (markInvalid) {
          await pgPool.query(
            "UPDATE articles SET status = invalid, updated_at = NOW() WHERE id = $1",
            [article.id]
          );
        }
      }
    }
    
    res.json({
      success: true,
      total: result.rows.length,
      valid: validCount,
      invalid: invalidCount,
      markedInvalid: markInvalid ? invalidCount : 0,
      invalidArticles: invalidArticles.slice(0, 20) // Return first 20 for review
    });
    
  } catch (error) {
    logger.error("Batch validate error", error);
    res.status(500).json({ error: error.message });
  }
});


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
      total,
      articles: result.rows,
      counts: {},
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
// PATCH single article - update title or content
app.patch('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: 'At least one of title or content is required' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`transformed_title = $${paramIndex++}`);
      values.push(title);
    }

    if (content !== undefined) {
      updates.push(`transformed_content = $${paramIndex++}`);
      values.push(content);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE articles 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pgPool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Return updated article with all details
    const article = result.rows[0];
    
    // Get translations
    const translationsResult = await pgPool.query(
      'SELECT id, language, status, transformed_title FROM articles WHERE parent_article_id = $1',
      [id]
    );

    res.json({
      ...article,
      translations: translationsResult.rows
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// Batch transform articles with rate limiting
app.post("/api/articles/batch/transform", async (req, res) => {
  try {
    const { articleIds } = req.body;

    // Validate input
    const validation = validateIds(articleIds, "articleIds");
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get provider ID from first article
    let providerId = null;
    try {
      const articleResult = await pgPool.query("SELECT provider_id FROM articles WHERE id = $1", [articleIds[0]]);
      providerId = articleResult.rows[0]?.provider_id;
    } catch (e) {
      console.log("Could not get provider ID from article");
    }

    // Initialize progress in Redis
    await redisClient.hSet("transform_progress", {
      status: "running",
      current: "0",
      total: String(articleIds.length),
      errors: "0",
      providerId: String(providerId || 0),
      startedAt: new Date().toISOString()
    });

    logger.info("Batch transform started", { count: articleIds.length, providerId });
    res.json({
      success: true,
      message: "Started transformation of " + articleIds.length + " articles",
      queued: articleIds.length
    });

    // Process articles in background with rate limiting
    (async () => {
      let current = 0;
      let errors = 0;
      
      for (const articleId of articleIds) {
        let retries = 0;
        const maxRetries = 3;
        let success = false;
        
        while (!success && retries < maxRetries) {
          try {
            await transformArticle(articleId);
            current++;
            success = true;
            await redisClient.hSet("transform_progress", { 
              current: String(current),
              currentArticleId: String(articleId)
            });
          } catch (error) {
            if (error.message && error.message.includes("429") && retries < maxRetries - 1) {
              retries++;
              const delay = Math.pow(2, retries) * 5000; // Exponential backoff: 10s, 20s, 40s
              console.log("[Transform] Rate limited, waiting " + (delay/1000) + "s before retry " + retries);
              await new Promise(r => setTimeout(r, delay));
            } else {
              logger.error("Transform error for article " + articleId, error);
              await redisClient.lPush("pipeline_errors", JSON.stringify({ type: error.message.includes("429") ? "rate_limit" : "transform", articleId, message: error.message, timestamp: new Date().toISOString() }));
              await redisClient.sAdd("pipeline_failed_articles", String(articleId));
              await redisClient.hSet("transform_progress", { lastError: error.message, lastErrorAt: new Date().toISOString() });
              errors++;
              await redisClient.hSet("transform_progress", { errors: String(errors) });
              break;
            }
          }
        }
        
        // Rate limit: wait 3 seconds between articles
        await new Promise(r => setTimeout(r, 3000));
      }
      
      await redisClient.hSet("transform_progress", { 
        status: "completed",
        completedAt: new Date().toISOString()
      });
      logger.info("Batch transform completed", { processed: current, errors });
    })();

  } catch (error) {
    logger.error("Batch transform error", error);
    res.status(500).json({ error: error.message });
  }
});


// Batch translate articles with rate limiting
app.post("/api/articles/batch/translate", async (req, res) => {
  try {
    const { articleIds, languages } = req.body;

    // Validate input
    const validation = validateIds(articleIds, "articleIds");
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get provider ID from first article
    let providerId = null;
    try {
      const articleResult = await pgPool.query("SELECT provider_id FROM articles WHERE id = $1", [articleIds[0]]);
      providerId = articleResult.rows[0]?.provider_id;
    } catch (e) {
      console.log("Could not get provider ID from article");
    }

    // Use provided languages or default to all languages
    const targetLanguages = languages && languages.length > 0 ? languages : ALL_LANGUAGES;

    // Initialize progress in Redis
    const totalTranslations = articleIds.length * targetLanguages.length;
    await redisClient.hSet("translate_progress", {
      status: "running",
      current: "0",
      total: String(totalTranslations),
      errors: "0",
      providerId: String(providerId || 0),
      startedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Started translation of " + articleIds.length + " articles to " + targetLanguages.length + " languages",
      queued: totalTranslations
    });

    // Process translations in background with rate limiting
    (async () => {
      let current = 0;
      let errors = 0;
      
      for (const articleId of articleIds) {
        // Get article source language
        const articleResult = await pgPool.query("SELECT language FROM articles WHERE id = $1", [articleId]);
        const sourceLanguage = articleResult.rows[0]?.language || "fr";

        for (const targetLang of targetLanguages) {
          // Skip if target language is same as source
          if (targetLang === sourceLanguage) {
            current++;
            await redisClient.hSet("translate_progress", { current: String(current) });
            continue;
          }

          let retries = 0;
          const maxRetries = 3;
          let success = false;
          
          while (!success && retries < maxRetries) {
            try {
              await translateArticle(articleId, targetLang);
              current++;
              success = true;
              await redisClient.hSet("translate_progress", { 
                current: String(current),
                currentLanguage: targetLang,
                currentArticleId: String(articleId)
              });
            } catch (error) {
              if (error.message && error.message.includes("429") && retries < maxRetries - 1) {
                retries++;
                const delay = Math.pow(2, retries) * 5000; // Exponential backoff: 10s, 20s, 40s
                console.log("[Translate] Rate limited, waiting " + (delay/1000) + "s before retry " + retries);
                await new Promise(r => setTimeout(r, delay));
              } else {
                console.error("Translate error for article " + articleId + " to " + targetLang + ":", error.message);
                errors++;
                await redisClient.hSet("translate_progress", { errors: String(errors) });
                current++;
                await redisClient.hSet("translate_progress", { current: String(current) });
                break;
              }
            }
          }
          
          // Rate limit: wait 2 seconds between translations
          await new Promise(r => setTimeout(r, 2000));
        }
        
        // Extra delay between articles
        await new Promise(r => setTimeout(r, 1000));
      }
      
      await redisClient.hSet("translate_progress", { 
        status: "completed",
        completedAt: new Date().toISOString()
      });
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

// ==================== IMAGE GENERATION ====================

// Style presets for Stable Diffusion
const IMAGE_STYLE_PRESETS = {
  photorealistic: 'professional photograph, high quality, 4k, realistic lighting',
  illustration: 'digital illustration, vibrant colors, artistic style',
  abstract: 'abstract art, geometric shapes, modern design',
  minimal: 'minimalist design, clean lines, simple composition, white background',
  tech: 'futuristic tech, digital art, neon accents, dark background'
};

// Generate thumbnail for article
app.post('/api/articles/:id/generate-thumbnail', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id, 10);
    
    // Get article and project info
    const articleResult = await pgPool.query(
      'SELECT a.*, p.ai_guidelines FROM articles a JOIN providers pr ON a.provider_id = pr.id JOIN projects p ON pr.project_id = p.id WHERE a.id = $1',
      [articleId]
    );
    
    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const article = articleResult.rows[0];
    const aiGuidelines = article.ai_guidelines || {};
    const imageSettings = aiGuidelines.imageGeneration || {};
    
    if (!imageSettings.enabled) {
      return res.status(400).json({ error: 'Image generation is not enabled for this project' });
    }
    
    const title = article.transformed_title || article.original_title;
    const style = imageSettings.style || 'photorealistic';
    const stylePreset = IMAGE_STYLE_PRESETS[style] || IMAGE_STYLE_PRESETS.photorealistic;
    
    // Build prompt
    let prompt = imageSettings.promptTemplate || 'A professional hero image for a blog article about {title}';
    prompt = prompt.replace('{title}', title);
    prompt = prompt + ', ' + stylePreset;
    
    const negativePrompt = imageSettings.negativePrompt || 'text, watermark, logo, low quality, blurry, distorted';
    
    logger.info('Generating thumbnail', { articleId, prompt: prompt.substring(0, 100) });
    
    // Call OVH Stable Diffusion XL API
    const sdResponse = await fetch('https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + getNextApiKey(),
        'accept': 'application/octet-stream',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt
      })
    });
    
    if (!sdResponse.ok) {
      const error = await sdResponse.text();
      logger.error('Stable Diffusion API error', { status: sdResponse.status, error });
      return res.status(500).json({ error: 'Image generation failed' });
    }
    
    // Get the image binary
    const imageBuffer = await sdResponse.arrayBuffer();
    
    // Save image to disk
    const fs = require('fs').promises;
    const path = require('path');
    const imagesDir = path.join(__dirname, 'public', 'images', 'thumbnails');
    await fs.mkdir(imagesDir, { recursive: true });
    
    const filename = 'article-' + articleId + '-' + Date.now() + '.png';
    const filepath = path.join(imagesDir, filename);
    await fs.writeFile(filepath, Buffer.from(imageBuffer));
    
    // Update article with thumbnail URL
    const thumbnailUrl = '/images/thumbnails/' + filename;
    await pgPool.query(
      'UPDATE articles SET thumbnail_url = $1 WHERE id = $2',
      [thumbnailUrl, articleId]
    );
    
    logger.info('Thumbnail generated', { articleId, thumbnailUrl });
    
    res.json({
      message: 'Thumbnail generated successfully',
      thumbnail_url: thumbnailUrl
    });
  } catch (error) {
    logger.error('Generate thumbnail error', error);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

// Batch generate thumbnails
app.post('/api/articles/batch/generate-thumbnails', async (req, res) => {
  const { articleIds } = req.body;
  
  if (!articleIds || !articleIds.length) {
    return res.status(400).json({ error: 'Article IDs required' });
  }
  
  logger.info('Batch thumbnail generation started', { count: articleIds.length });
  
  // Queue thumbnail generation in background
  (async () => {
    for (const articleId of articleIds) {
      try {
        const articleResult = await pgPool.query(
          'SELECT a.*, p.ai_guidelines FROM articles a JOIN providers pr ON a.provider_id = pr.id JOIN projects p ON pr.project_id = p.id WHERE a.id = $1',
          [articleId]
        );
        
        if (articleResult.rows.length === 0) continue;
        
        const article = articleResult.rows[0];
        const aiGuidelines = article.ai_guidelines || {};
        const imageSettings = aiGuidelines.imageGeneration || {};
        
        if (!imageSettings.enabled) continue;
        
        const title = article.transformed_title || article.original_title;
        const style = imageSettings.style || 'photorealistic';
        const stylePreset = IMAGE_STYLE_PRESETS[style] || IMAGE_STYLE_PRESETS.photorealistic;
        
        let prompt = imageSettings.promptTemplate || 'A professional hero image for a blog article about {title}';
        prompt = prompt.replace('{title}', title);
        prompt = prompt + ', ' + stylePreset;
        
        const negativePrompt = imageSettings.negativePrompt || 'text, watermark, logo, low quality, blurry, distorted';
        
        const sdResponse = await fetch('https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + getNextApiKey(),
            'accept': 'application/octet-stream',
            'content-type': 'application/json'
          },
          body: JSON.stringify({ prompt, negative_prompt: negativePrompt })
        });
        
        if (sdResponse.ok) {
          const imageBuffer = await sdResponse.arrayBuffer();
          const fs = require('fs').promises;
          const path = require('path');
          const imagesDir = path.join(__dirname, 'public', 'images', 'thumbnails');
          await fs.mkdir(imagesDir, { recursive: true });
          
          const filename = 'article-' + articleId + '-' + Date.now() + '.png';
          const filepath = path.join(imagesDir, filename);
          await fs.writeFile(filepath, Buffer.from(imageBuffer));
          
          const thumbnailUrl = '/images/thumbnails/' + filename;
          await pgPool.query('UPDATE articles SET thumbnail_url = $1 WHERE id = $2', [thumbnailUrl, articleId]);
          
          logger.info('Thumbnail generated', { articleId, thumbnailUrl });
        }
        
        // Rate limiting - wait 1.5 seconds between requests
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        logger.error('Batch thumbnail error', { articleId, error: err.message });
      }
    }
  })();
  
  res.json({
    message: 'Started thumbnail generation for ' + articleIds.length + ' articles',
    queued: articleIds.length
  });
});

// ==================== JOBS ====================

app.get('/api/jobs', async (req, res) => {
  const jobs = await getAllJobsFromRedis();
  res.json(jobs);
});
// Archived jobs - must come before /api/jobs/:id
app.get('/api/jobs/archived', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM archived_jobs ORDER BY archived_at DESC LIMIT 100').catch(() => ({ rows: [] }));
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
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
        "/tutoriels/", "/tutorials/", "/tutoriales/",
        "/blog/", "/article/", "/articles/",
        "/post/", "/posts/", "/news/",
        "/guide/", "/guides/", "/how-to/",
        "/learn/", "/resources/", "/kb/", "/knowledge-base/"
      ];

      try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        const urlPath = parsedUrl.pathname;
        const segments = urlPath.split("/").filter(Boolean);

        // Check if domain indicates its a blog (subdomain or domain name)
        const isBlogDomain = hostname.startsWith("blog") || 
                            hostname.includes(".blog.") || 
                            hostname.includes("blog.");

        // Check if URL contains any article pattern
        const hasArticlePattern = articlePatterns.some(p => url.includes(p));

        // For blog domains, a single path segment is enough (e.g., blogs.vultr.com/article-slug)
        if (isBlogDomain) {
          if (segments.length === 0) return false; // Homepage
          const slug = segments[segments.length - 1] || "";
          
          // Skip utility pages
          if (slug.startsWith("page") || url.includes("/page/")) return false;
          if (url.includes("/category/") || url.includes("/tag/")) return false;
          if (url.includes("/author/") || url.includes("/archive/")) return false;
          if (["about", "contact", "privacy", "terms", "search", "login", "register"].includes(slug.toLowerCase())) return false;
          
          // Accept if slug looks like an article (contains hyphen and is long enough)
          if (slug.length >= 5 && (slug.includes("-") || slug.includes("_"))) {
            return true;
          }
          // Also accept if slug is long and doesnt have obvious non-article patterns
          if (slug.length >= 10 && !slug.match(/^(page|tag|category|author)\d*$/i)) {
            return true;
          }
          return false;
        }

        // For non-blog domains, require article pattern
        if (segments.length < 2) return false;
        const slug = segments[segments.length - 1] || "";

        // Skip pagination, categories, tags, authors
        if (slug.startsWith("page") || url.includes("/page/")) return false;
        if (url.includes("/category/") || url.includes("/tag/")) return false;
        if (url.includes("/author/") || url.includes("/archive/")) return false;

        // Accept if has article pattern OR if slug looks like an article (contains hyphen)
        if (hasArticlePattern && slug.length >= 3 && slug.includes("-")) {
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

        const insertResult = await pgPool.query(`
          INSERT INTO articles (provider_id, original_title, source_url, original_content, language, word_count, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'collected')
          ON CONFLICT (source_url) DO UPDATE SET
            original_content = EXCLUDED.original_content,
            word_count = EXCLUDED.word_count,
            updated_at = NOW()
          RETURNING id
        `, [job.providerId, title, url, content, job.language, wordCount]);

        const articleId = insertResult.rows[0]?.id;
        job.articles.push({ id: articleId, url, title, wordCount });
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

// Pipeline Jobs Endpoint - Combined transform/translate progress
app.get("/api/pipeline-jobs", async (req, res) => {
  try {
    const transformProgress = await redisClient.hGetAll("transform_progress");
    const translateProgress = await redisClient.hGetAll("translate_progress");
    
    const jobs = [];
    
    // Determine the actual overall status
    const transformStatus = transformProgress?.status || "idle";
    const translateStatus = translateProgress?.status || "idle";
    const currentPhase = transformProgress?.phase || "transform";
    
    // Only show job if there is activity
    if (transformStatus !== "idle" || translateStatus !== "idle") {
      const providerId = parseInt(transformProgress?.providerId || translateProgress?.providerId) || 0;
      
      // Get provider name from database
      let providerName = "AI Pipeline";
      if (providerId > 0) {
        try {
          const providerResult = await pgPool.query("SELECT name FROM providers WHERE id = $1", [providerId]);
          providerName = providerResult.rows[0]?.name || "AI Pipeline";
        } catch (e) {
          // Keep default name
        }
      }

      // Determine overall status:
      // - "running" if either transform or translate is running
      // - "completed" only if both are completed (or translate idle after transform done)
      // - "failed" if either has error status
      let overallStatus = "running";
      if (transformStatus === "error" || translateStatus === "error") {
        overallStatus = "failed";
      } else if (transformStatus === "completed" && (translateStatus === "completed" || translateStatus === "idle")) {
        // Only completed if phase is also "completed" or all work is done
        if (currentPhase === "completed" || (currentPhase === "translate" && translateStatus === "completed")) {
          overallStatus = "completed";
        }
      }

      jobs.push({
        id: providerId || 1,
        type: "pipeline",
        providerId: providerId,
        providerName: providerName,
        status: overallStatus,
        phase: currentPhase,
        totalArticles: parseInt(transformProgress?.total) || 0,
        currentArticle: parseInt(transformProgress?.current) || 0,
        transformedCount: parseInt(transformProgress?.current) || 0,
        translatedCount: parseInt(translateProgress?.current) || 0,
        totalTranslations: parseInt(translateProgress?.total) || 0,
        currentTranslation: parseInt(translateProgress?.current) || 0,
        errors: (parseInt(transformProgress?.errors) || 0) + (parseInt(translateProgress?.errors) || 0),
        startedAt: transformProgress?.startedAt || translateProgress?.startedAt || new Date().toISOString(),
        completedAt: overallStatus === "completed" ? (translateProgress?.completedAt || transformProgress?.completedAt) : null,
        logs: []
      });
    }
    
    res.json(jobs);
  } catch (error) {
    logger.error("Pipeline jobs error", error);
    res.json([]);
  }
});


// ==================== PIPELINE DIAGNOSTICS ====================

app.get("/api/pipeline-jobs/diagnostics", async (req, res) => {
  try {
    const transformProgress = await redisClient.hGetAll("transform_progress");
    const translateProgress = await redisClient.hGetAll("translate_progress");
    const pipelineErrors = await redisClient.lRange("pipeline_errors", 0, 49) || [];
    
    // Parse errors
    const errors = pipelineErrors.map(e => {
      try { return JSON.parse(e); } catch { return { message: e, type: "unknown" }; }
    });
    
    // Group errors by type
    const errorsByType = {};
    errors.forEach(e => {
      const type = e.type || "unknown";
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });
    
    // Get failed article IDs
    const failedArticleIds = await redisClient.sMembers("pipeline_failed_articles") || [];
    
    // Calculate speed (articles per minute)
    const startedAt = transformProgress.startedAt ? new Date(transformProgress.startedAt).getTime() : Date.now();
    const elapsed = (Date.now() - startedAt) / 60000;
    const processed = parseInt(transformProgress.current || "0") + parseInt(translateProgress.current || "0");
    const speed = elapsed > 0.5 ? Math.round((processed / elapsed) * 10) / 10 : 0;
    
    // Estimate remaining time
    const transformRemaining = Math.max(0, parseInt(transformProgress.total || "0") - parseInt(transformProgress.current || "0"));
    const translateRemaining = Math.max(0, parseInt(translateProgress.total || "0") - parseInt(translateProgress.current || "0"));
    const totalRemaining = transformRemaining + translateRemaining;
    const etaMinutes = speed > 0 ? Math.ceil(totalRemaining / speed) : null;
    
    res.json({
      transform: {
        status: transformProgress.status || "idle",
        phase: transformProgress.phase || "transform",
        current: parseInt(transformProgress.current || "0"),
        total: parseInt(transformProgress.total || "0"),
        errors: parseInt(transformProgress.errors || "0"),
        lastError: transformProgress.lastError || null,
        lastErrorAt: transformProgress.lastErrorAt || null,
        paused: transformProgress.paused === "true"
      },
      translate: {
        status: translateProgress.status || "idle",
        current: parseInt(translateProgress.current || "0"),
        total: parseInt(translateProgress.total || "0"),
        errors: parseInt(translateProgress.errors || "0"),
        lastError: translateProgress.lastError || null,
        lastErrorAt: translateProgress.lastErrorAt || null,
        paused: translateProgress.paused === "true"
      },
      errorsByType,
      recentErrors: errors.slice(0, 10),
      failedArticleCount: failedArticleIds.length,
      speed,
      etaMinutes,
      isRateLimited: errors.some(e => e.type === "rate_limit" && 
        new Date(e.timestamp).getTime() > Date.now() - 60000)
    });
  } catch (error) {
    logger.error("Pipeline diagnostics error", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pipeline-jobs/retry-failed", async (req, res) => {
  try {
    const failedIds = await redisClient.sMembers("pipeline_failed_articles") || [];
    if (failedIds.length === 0) {
      return res.json({ message: "No failed articles to retry", retried: 0 });
    }
    
    const articleIds = failedIds.map(id => parseInt(id));
    
    // Clear failed set and errors
    await redisClient.del("pipeline_failed_articles");
    await redisClient.del("pipeline_errors");
    
    // Get provider ID from first article
    const firstArticle = await pgPool.query("SELECT provider_id FROM articles WHERE id = $1", [articleIds[0]]);
    const providerId = firstArticle.rows[0]?.provider_id || 0;
    
    // Trigger reprocessing asynchronously
    processAutoPipeline(articleIds, providerId).catch(err => {
      logger.error("Retry pipeline error", err);
    });
    
    res.json({ 
      message: articleIds.length + " articles queued for retry",
      retried: articleIds.length
    });
  } catch (error) {
    logger.error("Retry failed error", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pipeline-jobs/pause", async (req, res) => {
  try {
    await redisClient.hSet("transform_progress", { paused: "true" });
    await redisClient.hSet("translate_progress", { paused: "true" });
    res.json({ success: true, message: "Pipeline paused" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pipeline-jobs/resume", async (req, res) => {
  try {
    await redisClient.hSet("transform_progress", { paused: "false" });
    await redisClient.hSet("translate_progress", { paused: "false" });
    res.json({ success: true, message: "Pipeline resumed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pipeline-jobs/cancel", async (req, res) => {
  try {
    await redisClient.hSet("transform_progress", { status: "cancelled" });
    await redisClient.hSet("translate_progress", { status: "cancelled" });
    await redisClient.del("pipeline_errors");
    await redisClient.del("pipeline_failed_articles");
    res.json({ success: true, message: "Pipeline cancelled" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pipeline-jobs/clear", async (req, res) => {
  try {
    await redisClient.hSet("transform_progress", { 
      status: "idle", current: "0", total: "0", errors: "0" 
    });
    await redisClient.hSet("translate_progress", { 
      status: "idle", current: "0", total: "0", errors: "0" 
    });
    await redisClient.del("pipeline_errors");
    await redisClient.del("pipeline_failed_articles");
    res.json({ success: true, message: "Pipeline cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ==================== PARALLELIZED AUTO-PIPELINE ====================
// Process articles and translations in parallel for much faster execution

const PARALLEL_ARTICLES = 2;  // Parallel with multi-key rotation
const PARALLEL_TRANSLATIONS = 2;  // Parallel with multi-key rotation

// Retry with exponential backoff for rate limits
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 15000;  // 15 seconds initial retry

async function withRetry(fn, context = 'operation') {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error.message && (error.message.includes('429') || error.message.includes('rate limit'));
      if (attempt === MAX_RETRIES || !isRateLimit) {
        throw error;
      }
      const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`[Retry] ${context} attempt ${attempt}/${MAX_RETRIES} rate limited, waiting ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}


// Helper function to run promises with concurrency limit
// Add delay between batches to avoid rate limits
const BATCH_DELAY = 2000;  // 2 seconds between requests (reduced with multi-key)

async function promisePool(tasks, concurrency) {
  const results = [];
  const executing = new Set();
  
  for (const task of tasks) {
    const promise = Promise.resolve().then(() => task());
    results.push(promise);
    executing.add(promise);
    
    const clean = () => executing.delete(promise);
    promise.then(clean, clean);
    
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  
  return Promise.allSettled(results);
}

async function processAutoPipeline(articleIds, providerId) {
  logger.info("[Auto-Pipeline] Starting PARALLEL processing", { 
    articleCount: articleIds.length, 
    providerId,
    parallelArticles: PARALLEL_ARTICLES,
    parallelTranslations: PARALLEL_TRANSLATIONS
  });

  const totalTranslations = articleIds.length * ALL_LANGUAGES.length;

  // Initialize Redis progress tracking
  await redisClient.hSet("transform_progress", {
    status: "running",
    total: String(articleIds.length),
    current: "0",
    errors: "0",
    providerId: String(providerId),
    phase: "transform",
    startedAt: new Date().toISOString()
  });

  await redisClient.hSet("translate_progress", {
    status: "idle",
    total: String(totalTranslations),
    current: "0",
    errors: "0",
    providerId: String(providerId),
    startedAt: new Date().toISOString()
  });

  // Get project settings for this provider
  let aiGuidelines = {};
  try {
    const providerResult = await pgPool.query(
      "SELECT p.ai_guidelines FROM projects p JOIN providers pr ON pr.project_id = p.id WHERE pr.id = $1",
      [providerId]
    );
    if (providerResult.rows.length > 0 && providerResult.rows[0].ai_guidelines) {
      aiGuidelines = providerResult.rows[0].ai_guidelines;
    }
  } catch (err) {
    console.log("[Auto-Pipeline] Could not load AI guidelines, using defaults");
  }

  // Atomic counters
  let transformedCount = 0;
  let transformErrors = 0;
  let translatedCount = 0;
  let translateErrors = 0;

  // Process a single article (transform + translate)
  async function processArticle(articleId) {
    const maxRetries = 3;
    let transformSuccess = false;
    let retries = 0;

    // TRANSFORM PHASE
    while (!transformSuccess && retries < maxRetries) {
      try {
        console.log("[Auto-Pipeline] Transforming article " + articleId + " (attempt " + (retries + 1) + ")");
        await transformArticleWithGuidelines(articleId, aiGuidelines);
        transformSuccess = true;
        transformedCount++;
        
        // Update progress
        await redisClient.hSet("transform_progress", {
          current: String(transformedCount),
          currentArticleId: String(articleId)
        });
      } catch (err) {
        if (err.message && err.message.includes("429") && retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 5000;
          console.log("[Auto-Pipeline] Rate limited, waiting " + (delay/1000) + "s before retry");
          await new Promise(r => setTimeout(r, delay));
        } else {
          transformErrors++;
          await redisClient.hSet("transform_progress", { errors: String(transformErrors) });
          console.error("[Auto-Pipeline] Transform failed for article " + articleId + ":", err.message);
          return { articleId, success: false, error: err.message };
        }
      }
    }

    if (!transformSuccess) {
      return { articleId, success: false, error: "Transform failed" };
    }

    // THUMBNAIL PHASE (if enabled)
    if (aiGuidelines?.imageGeneration?.autoGenerate) {
      try {
        console.log("[Auto-Pipeline] Generating thumbnail for article " + articleId);
        const style = aiGuidelines.imageGeneration.style || "photorealistic";
        const stylePreset = IMAGE_STYLE_PRESETS[style] || IMAGE_STYLE_PRESETS.photorealistic;
        
        const articleData = await pgPool.query("SELECT transformed_title, original_title FROM articles WHERE id = $1", [articleId]);
        const title = articleData.rows[0]?.transformed_title || articleData.rows[0]?.original_title || "Article";
        
        let prompt = aiGuidelines.imageGeneration.promptTemplate || "A professional hero image for a blog article about {title}";
        prompt = prompt.replace("{title}", title);
        prompt = prompt + ", " + stylePreset;
        
        const negativePrompt = aiGuidelines.imageGeneration.negativePrompt || "text, watermark, logo, low quality, blurry, distorted";
        
        const sdResponse = await fetch("https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + process.env.OVH_AI_TOKEN,
            "accept": "application/octet-stream",
            "content-type": "application/json"
          },
          body: JSON.stringify({ prompt, negative_prompt: negativePrompt })
        });
        
        if (sdResponse.ok) {
          const imageBuffer = await sdResponse.arrayBuffer();
          const fs = require("fs").promises;
          const path = require("path");
          const imagesDir = path.join(__dirname, "public", "images", "thumbnails");
          await fs.mkdir(imagesDir, { recursive: true });
          
          const filename = "article-" + articleId + "-" + Date.now() + ".png";
          const filepath = path.join(imagesDir, filename);
          await fs.writeFile(filepath, Buffer.from(imageBuffer));
          
          const thumbnailUrl = "/images/thumbnails/" + filename;
          await pgPool.query("UPDATE articles SET thumbnail_url = $1 WHERE id = $2", [thumbnailUrl, articleId]);
          console.log("[Auto-Pipeline] Thumbnail generated: " + thumbnailUrl);
        }
      } catch (thumbErr) {
        console.error("[Auto-Pipeline] Thumbnail generation failed: " + thumbErr.message);
      }
    }

    // TRANSLATE PHASE - Parallel translations
    await redisClient.hSet("transform_progress", { phase: "translate" });
    await redisClient.hSet("translate_progress", { status: "running" });

    const translationTasks = ALL_LANGUAGES.map(targetLang => async () => {
      let translateRetries = 0;
      const maxTranslateRetries = 3;
      
      while (translateRetries < maxTranslateRetries) {
        try {
          await translateArticle(articleId, targetLang);
          translatedCount++;
          
          await redisClient.hSet("translate_progress", {
            current: String(translatedCount),
            currentLanguage: targetLang
          });
          
          return { lang: targetLang, success: true };
        } catch (translateErr) {
          if (translateErr.message && translateErr.message.includes("429") && translateRetries < maxTranslateRetries - 1) {
            translateRetries++;
            const delay = Math.pow(2, translateRetries) * 3000;
            console.log("[Auto-Pipeline] Translation rate limited, waiting " + (delay/1000) + "s");
            await new Promise(r => setTimeout(r, delay));
          } else {
            translateErrors++;
            await redisClient.hSet("translate_progress", { errors: String(translateErrors) });
            console.error("[Auto-Pipeline] Translation to " + targetLang + " failed:", translateErr.message);
            return { lang: targetLang, success: false, error: translateErr.message };
          }
        }
      }
      return { lang: targetLang, success: false, error: "Max retries" };
    });

    // Process translations in parallel (4 at a time)
    const translationResults = await promisePool(translationTasks, PARALLEL_TRANSLATIONS);
    const successfulTranslations = translationResults.filter(r => r.status === "fulfilled" && r.value.success).length;

    if (successfulTranslations > 0) {
      await pgPool.query(
        "UPDATE articles SET status = 'translated', updated_at = NOW() WHERE id = $1",
        [articleId]
      );
    }

    console.log("[Auto-Pipeline] Article " + articleId + " done (" + successfulTranslations + "/" + ALL_LANGUAGES.length + " translations)");
    return { articleId, success: true, translations: successfulTranslations };
  }

  // Process all articles in parallel (3 at a time)
  const articleTasks = articleIds.map(articleId => () => processArticle(articleId));
  
  console.log("[Auto-Pipeline] Starting parallel processing of " + articleIds.length + " articles");
  const results = await promisePool(articleTasks, PARALLEL_ARTICLES);

  // Mark as completed
  await redisClient.hSet("transform_progress", { 
    status: "completed",
    phase: "completed",
    completedAt: new Date().toISOString()
  });
  await redisClient.hSet("translate_progress", { 
    status: "completed",
    completedAt: new Date().toISOString()
  });

  const successCount = results.filter(r => r.status === "fulfilled" && r.value.success).length;
  console.log("[Auto-Pipeline] COMPLETED. Success: " + successCount + "/" + articleIds.length + 
              ", Transform errors: " + transformErrors + ", Translate errors: " + translateErrors);
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
        'Authorization': `Bearer ${getNextApiKey()}`
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3_3-70B-Instruct',
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
        'Authorization': `Bearer ${getNextApiKey()}`
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3_3-70B-Instruct',
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

  const langNames = { en: 'English', fr: 'French', es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese', nl: 'Dutch', pl: 'Polish' };
  const langName = langNames[targetLanguage] || targetLanguage;

  // Shorter, more efficient prompt
  const prompt = `Translate to ${langName}. Keep markdown formatting. Only output the translation:

${content.substring(0, 6000)}`;

  try {
    const response = await withRetry(async () => {
      const r = await fetch(`${OVH_AI_ENDPOINT}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getNextApiKey()}`
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3_3-70B-Instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3500,
          temperature: 0.2
        })
      });
      if (!r.ok && r.status === 429) {
        throw new Error('429 rate limit');
      }
      if (!r.ok) {
        throw new Error(`OVH AI error: ${r.status}`);
      }
      return r;
    }, `translate article ${articleId} to ${targetLanguage}`);

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


// Batch transform all pending articles
app.post('/api/articles/transform-pending', async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    
    // Get pending articles (no transformed content)
    const result = await pgPool.query(`
      SELECT id FROM articles 
      WHERE (transformed_content IS NULL OR transformed_content = '')
      AND original_content IS NOT NULL AND original_content != ''
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    
    const articleIds = result.rows.map(r => r.id);
    
    if (articleIds.length === 0) {
      return res.json({ message: 'No pending articles to transform', count: 0 });
    }
    
    console.log(`[Batch Transform] Starting transformation of ${articleIds.length} articles`);
    
    // Start transformation in background
    processAutoPipeline(articleIds, null).catch(err => {
      console.error('[Batch Transform] Error:', err.message);
    });
    
    res.json({ 
      message: 'Batch transformation started',
      count: articleIds.length,
      articleIds 
    });
  } catch (error) {
    console.error('[Batch Transform] Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Approve article for translation
app.post("/api/articles/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check article exists and is transformed
    const article = await pgPool.query("SELECT * FROM articles WHERE id = $1", [id]);
    if (article.rows.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    
    if (!article.rows[0].transformed_content) {
      return res.status(400).json({ error: "Article must be transformed before approval" });
    }
    
    // Update status to approved
    await pgPool.query(
      "UPDATE articles SET status = $1, updated_at = NOW() WHERE id = $2",
      ["approved", id]
    );
    
    console.log(`[Approval] Article ${id} approved for translation`);
    
    // Get provider to know target languages
    // Get project target languages
    const project = await pgPool.query(
      "SELECT target_languages FROM projects WHERE id = (SELECT project_id FROM providers WHERE id = $1)",
      [article.rows[0].provider_id]
    );
    
    const targetLanguages = project.rows[0]?.target_languages || ["en", "fr", "es", "de"];
    
    // Start translations in background
    for (const lang of targetLanguages) {
      if (lang !== article.rows[0].language) {
        translateArticle(parseInt(id), lang).catch(err => {
          console.error(`[Approval] Translation to ${lang} failed:`, err.message);
        });
        // Add delay between translations to avoid rate limits
        await new Promise(r => setTimeout(r, 10000));
      }
    }
    
    res.json({ 
      success: true, 
      message: "Article approved and translations started",
      targetLanguages 
    });
  } catch (error) {
    console.error("[Approval] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk approve articles
app.post("/api/articles/bulk-approve", async (req, res) => {
  try {
    const { articleIds } = req.body;
    
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ error: "articleIds array required" });
    }
    
    // Update all to approved
    await pgPool.query(
      "UPDATE articles SET status = $1, updated_at = NOW() WHERE id = ANY($2) AND transformed_content IS NOT NULL",
      ["approved", articleIds]
    );
    
    console.log(`[Bulk Approval] ${articleIds.length} articles approved`);
    
    res.json({ 
      success: true, 
      message: `${articleIds.length} articles approved`,
      note: "Translations will start automatically"
    });
  } catch (error) {
    console.error("[Bulk Approval] Error:", error);
    res.status(500).json({ error: error.message });
  }
});


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
// AI Text Transform Endpoint - Add this to server.js
app.post('/api/ai/transform', async (req, res) => {
  try {
    const { text, action, customPrompt, context } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (!action && !customPrompt) {
      return res.status(400).json({ error: 'Action or custom prompt is required' });
    }
    
    // Build the system prompt based on action
    const actionPrompts = {
      'improve': 'You are a professional editor. Improve the following text to make it clearer, more engaging, and better written. Keep the same meaning and approximate length. Return ONLY the improved text, no explanations.',
      'fix-grammar': 'You are a grammar expert. Fix any grammar, spelling, and punctuation errors in the following text. Keep the same meaning and style. Return ONLY the corrected text, no explanations.',
      'make-shorter': 'You are a concise writer. Shorten the following text while keeping all essential information. Make it more concise and impactful. Return ONLY the shortened text, no explanations.',
      'make-longer': 'You are a detailed writer. Expand the following text with more details, examples, or explanations while keeping the same tone. Return ONLY the expanded text, no explanations.',
      'simplify': 'You are a plain language expert. Simplify the following text to make it easier to understand. Use simple words and shorter sentences. Return ONLY the simplified text, no explanations.',
      'professional': 'You are a business writer. Rewrite the following text in a professional, formal tone suitable for business communication. Return ONLY the rewritten text, no explanations.',
      'casual': 'You are a friendly writer. Rewrite the following text in a casual, conversational tone. Make it warm and approachable. Return ONLY the rewritten text, no explanations.',
      'translate-en': 'You are a professional translator. Translate the following text to English. Maintain the tone and style. Return ONLY the translation, no explanations.',
      'translate-fr': 'You are a professional translator. Translate the following text to French. Maintain the tone and style. Return ONLY the translation, no explanations.',
      'translate-es': 'You are a professional translator. Translate the following text to Spanish. Maintain the tone and style. Return ONLY the translation, no explanations.',
      'translate-de': 'You are a professional translator. Translate the following text to German. Maintain the tone and style. Return ONLY the translation, no explanations.',
      'summarize': 'You are an expert summarizer. Summarize the following text in a few key points. Return ONLY the summary, no explanations.',
      'bullet-points': 'Convert the following text into clear bullet points. Return ONLY the bullet points, no explanations.',
      'explain': 'You are a teacher. Explain the following text in simple terms that anyone can understand. Return ONLY the explanation, no meta-commentary.',
    };
    
    let systemPrompt;
    if (customPrompt) {
      systemPrompt = `You are a helpful AI assistant. Follow the user's instruction precisely for the given text. Return ONLY the result, no explanations or meta-commentary. User instruction: ${customPrompt}`;
    } else {
      systemPrompt = actionPrompts[action];
      if (!systemPrompt) {
        return res.status(400).json({ error: 'Invalid action' });
      }
    }
    
    // Add context if provided
    let userMessage = text;
    if (context) {
      userMessage = `Context (for reference only, do not include in output):\n${context}\n\nText to transform:\n${text}`;
    }
    
    console.log(`[AI Transform] Action: ${action || 'custom'}, Text length: ${text.length}`);
    
    const response = await fetch(`${OVH_AI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getNextApiKey()}`
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3_3-70B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Transform] API Error:', errorText);
      throw new Error('AI API request failed');
    }
    
    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || '';
    
    // Clean up the result - remove any thinking tags or prefixes
    result = result
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^(Here's|Here is|The|I've|I have).*?:\s*/i, '')
      .trim();
    
    console.log(`[AI Transform] Success, result length: ${result.length}`);
    
    res.json({ 
      success: true, 
      result,
      action: action || 'custom'
    });
    
  } catch (error) {
    console.error('[AI Transform] Error:', error);
    res.status(500).json({ error: 'AI transformation failed', message: error.message });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Content Pipeline API v2 running on port ${PORT}`);
});

// ==================== API KEY STATS ENDPOINT ====================

app.get("/api/ai/key-stats", (req, res) => {
  const stats = {
    totalKeys: typeof OVH_AI_TOKENS !== "undefined" ? OVH_AI_TOKENS.length : 1,
    currentKeyIndex: typeof currentTokenIndex !== "undefined" ? currentTokenIndex : 0,
    keyUsage: [],
    parallelConfig: {
      articles: typeof PARALLEL_ARTICLES !== "undefined" ? PARALLEL_ARTICLES : 1,
      translations: typeof PARALLEL_TRANSLATIONS !== "undefined" ? PARALLEL_TRANSLATIONS : 1,
      batchDelay: typeof BATCH_DELAY !== "undefined" ? BATCH_DELAY : 8000
    }
  };
  
  if (typeof tokenUsageCount !== "undefined") {
    for (let i = 0; i < stats.totalKeys; i++) {
      stats.keyUsage.push({
        keyIndex: i + 1,
        usageCount: tokenUsageCount.get(i) || 0,
        lastUsed: tokenLastUsed.get(i) ? new Date(tokenLastUsed.get(i)).toISOString() : null
      });
    }
  }
  
  res.json(stats);
});

// ==================== RELEVANCE SCORING WITH LLAMA 3.3 ====================

// Llama 3.3 endpoint for relevance scoring (different from DeepSeek for transformation)
const LLAMA_ENDPOINT = process.env.LLAMA_ENDPOINT || 'https://llama-3-3-70b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';

// Calculate relevance score for an article based on project intention
async function calculateRelevanceScore(articleId, projectIntention) {
  try {
    const articleResult = await pgPool.query(
      'SELECT id, original_title, original_content, provider_id FROM articles WHERE id = $1',
      [articleId]
    );

    if (articleResult.rows.length === 0) {
      throw new Error('Article not found');
    }

    const article = articleResult.rows[0];
    const content = article.original_content || '';
    const title = article.original_title || '';

    // Truncate content for API efficiency
    const truncatedContent = content.substring(0, 4000);

    const prompt = `Tu es un assistant d'évaluation de contenu. Évalue la pertinence de cet article par rapport à l'intention du projet.

INTENTION DU PROJET:
${projectIntention}

ARTICLE À ÉVALUER:
Titre: ${title}
Contenu: ${truncatedContent}

Réponds UNIQUEMENT au format JSON suivant, sans aucun texte avant ou après:
{
  "score": <nombre entre 0 et 100>,
  "reason": "<explication courte en 1-2 phrases de pourquoi ce score>",
  "keywords_match": ["<mot-clé pertinent 1>", "<mot-clé pertinent 2>"],
  "recommendation": "<keep|review|delete>"
}

Critères de scoring:
- 80-100: Très pertinent, correspond parfaitement à l'intention
- 60-79: Pertinent, correspond partiellement
- 40-59: Moyennement pertinent, peut nécessiter une revue
- 20-39: Peu pertinent, probablement hors sujet
- 0-19: Non pertinent, à supprimer`;

    console.log(`[Relevance] Scoring article ${articleId} with Llama 3.3...`);

    const response = await fetch(`${LLAMA_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getNextApiKey()}`
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3_3-70B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Relevance] Llama API error ${response.status}:`, errorText);
      throw new Error(`Llama API error: ${response.status}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || '';

    // Clean response
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    result = result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Parse JSON
    let scoring;
    try {
      scoring = JSON.parse(result);
    } catch (parseErr) {
      console.error(`[Relevance] Failed to parse response:`, result);
      // Fallback scoring
      scoring = {
        score: 50,
        reason: "Impossible d'évaluer automatiquement",
        keywords_match: [],
        recommendation: "review"
      };
    }

    // Validate and clamp score
    scoring.score = Math.max(0, Math.min(100, parseInt(scoring.score) || 50));

    // Update database
    await pgPool.query(
      `UPDATE articles SET
        relevance_score = $1,
        relevance_reason = $2,
        relevance_scored_at = NOW()
      WHERE id = $3`,
      [scoring.score, JSON.stringify(scoring), articleId]
    );

    console.log(`[Relevance] Article ${articleId} scored: ${scoring.score}%`);

    return {
      articleId,
      score: scoring.score,
      reason: scoring.reason,
      keywords_match: scoring.keywords_match || [],
      recommendation: scoring.recommendation || 'review'
    };

  } catch (error) {
    console.error(`[Relevance] Error scoring article ${articleId}:`, error.message);
    throw error;
  }
}

// API endpoint to score a single article
app.post('/api/articles/:id/relevance-score', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);

    // Get article's project intention
    const result = await pgPool.query(`
      SELECT p.project_intention, p.description, p.name
      FROM articles a
      JOIN providers pr ON a.provider_id = pr.id
      JOIN projects p ON pr.project_id = p.id
      WHERE a.id = $1
    `, [articleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article or project not found' });
    }

    const project = result.rows[0];
    const intention = project.project_intention || project.description;

    if (!intention) {
      return res.status(400).json({
        error: 'Project intention not defined',
        message: 'Veuillez définir l\'intention du projet avant de calculer la pertinence'
      });
    }

    const scoring = await calculateRelevanceScore(articleId, intention);
    res.json({ success: true, ...scoring });

  } catch (error) {
    console.error('[API] Relevance score error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to batch score articles
app.post('/api/articles/batch-relevance-score', async (req, res) => {
  try {
    const { articleIds, projectId } = req.body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ error: 'articleIds array required' });
    }

    // Get project intention
    let intention;
    if (projectId) {
      const projectResult = await pgPool.query(
        'SELECT project_intention, description FROM projects WHERE id = $1',
        [projectId]
      );
      if (projectResult.rows.length > 0) {
        intention = projectResult.rows[0].project_intention || projectResult.rows[0].description;
      }
    }

    if (!intention) {
      // Try to get from first article's project
      const articleResult = await pgPool.query(`
        SELECT p.project_intention, p.description
        FROM articles a
        JOIN providers pr ON a.provider_id = pr.id
        JOIN projects p ON pr.project_id = p.id
        WHERE a.id = $1
      `, [articleIds[0]]);

      if (articleResult.rows.length > 0) {
        intention = articleResult.rows[0].project_intention || articleResult.rows[0].description;
      }
    }

    if (!intention) {
      return res.status(400).json({
        error: 'Project intention not defined',
        message: 'Veuillez définir l\'intention du projet avant de calculer la pertinence'
      });
    }

    // Score articles with rate limiting
    const results = [];
    const errors = [];

    for (const articleId of articleIds.slice(0, 20)) { // Limit to 20 at a time
      try {
        const scoring = await calculateRelevanceScore(articleId, intention);
        results.push(scoring);
        // Small delay between requests
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        errors.push({ articleId, error: err.message });
      }
    }

    res.json({
      success: true,
      scored: results.length,
      errors: errors.length,
      results,
      errorDetails: errors
    });

  } catch (error) {
    console.error('[API] Batch relevance score error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to update project intention
app.patch('/api/projects/:id/intention', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { intention } = req.body;

    if (!intention || intention.trim().length < 10) {
      return res.status(400).json({
        error: 'Intention must be at least 10 characters',
        message: 'Décrivez l\'intention du projet de manière détaillée'
      });
    }

    await pgPool.query(
      'UPDATE projects SET project_intention = $1, updated_at = NOW() WHERE id = $2',
      [intention.trim(), projectId]
    );

    res.json({ success: true, message: 'Project intention updated' });

  } catch (error) {
    console.error('[API] Update project intention error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get relevance statistics for a project
app.get('/api/projects/:id/relevance-stats', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const stats = await pgPool.query(`
      SELECT
        COUNT(*) as total_articles,
        COUNT(relevance_score) as scored_articles,
        ROUND(AVG(relevance_score)::numeric, 1) as avg_score,
        COUNT(CASE WHEN relevance_score >= 80 THEN 1 END) as highly_relevant,
        COUNT(CASE WHEN relevance_score >= 60 AND relevance_score < 80 THEN 1 END) as relevant,
        COUNT(CASE WHEN relevance_score >= 40 AND relevance_score < 60 THEN 1 END) as moderate,
        COUNT(CASE WHEN relevance_score < 40 AND relevance_score IS NOT NULL THEN 1 END) as low_relevance
      FROM articles a
      JOIN providers pr ON a.provider_id = pr.id
      WHERE pr.project_id = $1
    `, [projectId]);

    const projectResult = await pgPool.query(
      'SELECT project_intention FROM projects WHERE id = $1',
      [projectId]
    );

    res.json({
      ...stats.rows[0],
      has_intention: !!projectResult.rows[0]?.project_intention,
      intention_preview: projectResult.rows[0]?.project_intention?.substring(0, 100)
    });

  } catch (error) {
    console.error('[API] Relevance stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('[Relevance Scoring] Module loaded - Llama 3.3 endpoint configured');

// ==================== DEEPSEEK TRANSFORM FOR SINGLE ARTICLES ====================

const DEEPSEEK_ENDPOINT = process.env.DEEPSEEK_ENDPOINT || 'https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';

// Create a transform task with DeepSeek
app.post('/api/articles/:id/transform-deepseek', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    
    // Generate unique task ID
    const taskId = 'deepseek_' + Date.now() + '_' + articleId;
    
    // Create task entry in Redis
    const task = {
      taskId,
      articleId,
      status: 'pending',
      phase: 'Initializing',
      progress: 0,
      thinkingContent: '',
      generatedContent: '',
      error: '',
      startedAt: new Date().toISOString(),
      completedAt: ''
    };
    
    await redisClient.hSet('deepseek_task:' + taskId, task);
    await redisClient.expire('deepseek_task:' + taskId, 3600); // 1 hour TTL
    
    // Start transformation in background
    transformWithDeepSeek(taskId, articleId).catch(err => {
      console.error('[DeepSeek Transform] Background error:', err);
      redisClient.hSet('deepseek_task:' + taskId, {
        status: 'failed',
        error: err.message,
        completedAt: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      message: 'DeepSeek transform started',
      taskId
    });
  } catch (error) {
    console.error('[DeepSeek Transform] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transform task status
app.get('/api/transform-tasks/:taskId', async (req, res) => {
  try {
    const task = await redisClient.hGetAll('deepseek_task:' + req.params.taskId);
    
    if (!task || Object.keys(task).length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Convert progress to number
    task.progress = parseInt(task.progress) || 0;
    task.articleId = parseInt(task.articleId) || 0;
    
    res.json(task);
  } catch (error) {
    console.error('[DeepSeek Transform] Task status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DeepSeek transformation function with progress tracking
async function transformWithDeepSeek(taskId, articleId) {
  const updateTask = async (updates) => {
    await redisClient.hSet('deepseek_task:' + taskId, updates);
  };
  
  try {
    // Update status to thinking
    await updateTask({
      status: 'thinking',
      phase: 'Analyzing content',
      progress: '10'
    });
    
    // Fetch article
    const articleResult = await pgPool.query(
      'SELECT a.*, p.ai_guidelines FROM articles a LEFT JOIN providers pr ON a.provider_id = pr.id LEFT JOIN projects p ON pr.project_id = p.id WHERE a.id = $1',
      [articleId]
    );
    
    if (articleResult.rows.length === 0) {
      throw new Error('Article not found');
    }
    
    const article = articleResult.rows[0];
    const content = article.original_content;
    const aiGuidelines = article.ai_guidelines || {};
    
    await updateTask({ progress: '20' });
    
    // Build system prompt with AI guidelines
    let systemPrompt = 'You are an expert content writer for OVHcloud. Your task is to rewrite and optimize content for the OVHcloud blog.';
    
    if (aiGuidelines.tone) {
      systemPrompt += ' Use a ' + aiGuidelines.tone + ' tone.';
    }
    if (aiGuidelines.brandVoice) {
      systemPrompt += ' Brand voice: ' + aiGuidelines.brandVoice;
    }
    if (aiGuidelines.customInstructions) {
      systemPrompt += ' ' + aiGuidelines.customInstructions;
    }
    
    await updateTask({
      progress: '30',
      thinkingContent: 'Analyzing article structure and content...'
    });
    
    // Call DeepSeek API
    console.log('[DeepSeek Transform] Calling API for article ' + articleId);
    const response = await fetch(DEEPSEEK_ENDPOINT + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getNextApiKey()
      },
      body: JSON.stringify({
        model: 'DeepSeek-R1-Distill-Llama-70B',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Rewrite and optimize the following article for OVHcloud blog. Maintain the key information but improve clarity, engagement, and SEO. Output in HTML format with proper headings and paragraphs:\n\n' + content }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    await updateTask({
      status: 'generating',
      phase: 'Generating content',
      progress: '50',
      thinkingContent: 'DeepSeek is generating optimized content...'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek Transform] API error:', response.status, errorText);
      throw new Error('DeepSeek API error: ' + response.status + ' - ' + errorText.substring(0, 200));
    }
    
    const data = await response.json();
    await updateTask({ progress: '80' });
    
    const transformedContent = data.choices?.[0]?.message?.content;
    if (!transformedContent) {
      throw new Error('No content generated');
    }
    
    await updateTask({
      progress: '90',
      generatedContent: transformedContent.substring(0, 200) + '...'
    });
    
    // Extract title from transformed content
    let transformedTitle = article.original_title;
    const h1Match = transformedContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      transformedTitle = h1Match[1].trim();
    }
    
    // Update article in database
    await pgPool.query(
      'UPDATE articles SET transformed_content = $1, transformed_title = $2, status = \'transformed\', updated_at = NOW() WHERE id = $3',
      [transformedContent, transformedTitle, articleId]
    );
    
    // Mark task as completed
    await updateTask({
      status: 'completed',
      phase: 'Done',
      progress: '100',
      completedAt: new Date().toISOString()
    });
    
    console.log('[DeepSeek Transform] Article ' + articleId + ' transformed successfully');
    
  } catch (error) {
    console.error('[DeepSeek Transform] Error for article ' + articleId + ':', error);
    await updateTask({
      status: 'failed',
      error: error.message,
      completedAt: new Date().toISOString()
    });
  }
}

console.log('[DeepSeek Transform] Module loaded - endpoint: ' + DEEPSEEK_ENDPOINT);

// ==================== REPORTING ENDPOINTS ====================

app.get('/api/reporting/overview', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM providers) as total_providers,
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM articles WHERE created_at > NOW() - INTERVAL '7 days') as articles_this_week
    `);
    
    const statusResult = await pgPool.query(`
      SELECT status, COUNT(*) as count FROM articles GROUP BY status
    `);
    
    const byStatus = {};
    statusResult.rows.forEach(row => { byStatus[row.status] = parseInt(row.count); });
    
    res.json({
      totalProjects: parseInt(result.rows[0].total_projects),
      totalProviders: parseInt(result.rows[0].total_providers),
      totalArticles: parseInt(result.rows[0].total_articles),
      articlesThisWeek: parseInt(result.rows[0].articles_this_week),
      successRate: 95,
      byStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reporting/by-project', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT p.id, p.name, p.color,
        (SELECT COUNT(*) FROM providers WHERE project_id = p.id) as providers_count,
        (SELECT COUNT(*) FROM articles a JOIN providers pr ON a.provider_id = pr.id WHERE pr.project_id = p.id) as articles_count,
        (SELECT COALESCE(SUM(word_count), 0) FROM articles a JOIN providers pr ON a.provider_id = pr.id WHERE pr.project_id = p.id) as total_words
      FROM projects p
      ORDER BY articles_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reporting/by-provider', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT p.id, p.name, p.slug, pr.name as project_name,
        COUNT(a.id) as articles_count,
        COALESCE(SUM(a.word_count), 0) as total_words,
        COUNT(a.id) FILTER (WHERE a.status = 'transformed') as transformed_count
      FROM providers p
      LEFT JOIN projects pr ON p.project_id = pr.id
      LEFT JOIN articles a ON a.provider_id = p.id
      GROUP BY p.id, p.name, p.slug, pr.name
      ORDER BY articles_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reporting/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await pgPool.query(`
      SELECT DATE(created_at) as date,
        COUNT(*) as articles_count,
        COALESCE(SUM(word_count), 0) as words_count
      FROM articles
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROJECT STATS ====================

app.get('/api/projects/:id/stats', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const result = await pgPool.query(`
      SELECT
        (SELECT COUNT(*) FROM providers WHERE project_id = $1) as providers_count,
        (SELECT COUNT(*) FROM articles a JOIN providers p ON a.provider_id = p.id WHERE p.project_id = $1) as articles_count,
        (SELECT COALESCE(SUM(word_count), 0) FROM articles a JOIN providers p ON a.provider_id = p.id WHERE p.project_id = $1) as total_words,
        (SELECT COUNT(*) FROM articles a JOIN providers p ON a.provider_id = p.id WHERE p.project_id = $1 AND a.status = 'collected') as collected,
        (SELECT COUNT(*) FROM articles a JOIN providers p ON a.provider_id = p.id WHERE p.project_id = $1 AND a.status = 'transformed') as transformed
    `, [projectId]);
    
    res.json({
      providers_count: parseInt(result.rows[0].providers_count),
      articles_count: parseInt(result.rows[0].articles_count),
      total_words: parseInt(result.rows[0].total_words),
      collected: parseInt(result.rows[0].collected),
      transformed: parseInt(result.rows[0].transformed)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ARCHIVED JOBS ====================

app.get('/api/jobs/archived', async (req, res) => {
  try {
    // Return empty array if no archived_jobs table exists
    const result = await pgPool.query(`
      SELECT * FROM archived_jobs ORDER BY archived_at DESC LIMIT 100
    `).catch(() => ({ rows: [] }));
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

console.log('[Endpoints] Reporting, Project Stats, and Archived Jobs endpoints added');
