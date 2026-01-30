const express = require('express');
const cors = require('cors');
const FirecrawlApp = require('@mendable/firecrawl-js').default;
const OpenAI = require('openai');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==================== HOT STINGER - CONTENT PIPELINE API ====================
const APP_NAME = 'Hot Stinger';
const APP_VERSION = '2.0.0';

// ==================== DATABASE CONFIGURATION ====================

const pgPool = new Pool({
  host: process.env.PG_HOST || '91.134.72.199',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'content_pipeline',
  user: process.env.PG_USER || 'pipeline_user',
  password: process.env.PG_PASSWORD || 'pipeline_password'
});

let redisClient;

async function initRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://91.134.72.199:6379'
  });
  redisClient.on('error', (err) => console.log('Redis Client Error:', err));
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.log('Redis connection failed:', err.message);
  }
}

initRedis();

// ==================== POSTGRESQL LISTENER FOR AUTO-TRANSFORM & TRANSLATE ====================

const ALL_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl'];

let autoTransformEnabled = true;
let autoTranslateEnabled = true;
let transformQueue = [];
let translationQueue = [];
let isProcessingQueue = false;
let isProcessingTranslations = false;

async function initPgListener() {
  const client = await pgPool.connect();

  client.on('notification', async (msg) => {
    try {
      const payload = JSON.parse(msg.payload);
      console.log(`[PG NOTIFY] ${msg.channel}:`, payload);

      if ((msg.channel === 'new_article' || msg.channel === 'transform_article') && autoTransformEnabled) {
        transformQueue.push(payload.id);
        console.log(`[TRANSFORM QUEUE] Article ${payload.id} added. Queue size: ${transformQueue.length}`);
        if (!isProcessingQueue) {
          processTransformQueue();
        }
      }

      if (msg.channel === 'translate_article' && autoTranslateEnabled) {
        // Add to translation queue with target languages
        const sourceLang = payload.language || 'en';
        const targetLangs = ALL_LANGUAGES.filter(l => l !== sourceLang);
        translationQueue.push({ articleId: payload.id, targetLangs });
        console.log(`[TRANSLATE QUEUE] Article ${payload.id} added for ${targetLangs.length} languages`);
        if (!isProcessingTranslations) {
          processTranslationQueue();
        }
      }
    } catch (e) {
      console.error('[PG NOTIFY] Error parsing payload:', e.message);
    }
  });

  await client.query('LISTEN new_article');
  await client.query('LISTEN transform_article');
  await client.query('LISTEN translate_article');
  console.log('[PG LISTENER] Listening for new_article, transform_article, and translate_article notifications');
}

async function processTransformQueue() {
  if (isProcessingQueue || transformQueue.length === 0) return;

  isProcessingQueue = true;
  console.log(`[QUEUE] Starting to process ${transformQueue.length} articles`);

  while (transformQueue.length > 0) {
    const articleId = transformQueue.shift();

    try {
      // Check if article exists and is not already transformed
      const result = await pgPool.query(
        'SELECT * FROM articles WHERE id = $1 AND status != $2',
        [articleId, 'transformed']
      );

      if (result.rows.length === 0) {
        console.log(`[QUEUE] Article ${articleId} already transformed or not found, skipping`);
        continue;
      }

      const article = result.rows[0];
      console.log(`[QUEUE] Transforming article ${articleId}: ${article.original_title?.substring(0, 40)}...`);

      // Transform with DeepSeek
      const transformed = await transformWithDeepSeek(article);

      // Update article
      await pgPool.query(`
        UPDATE articles SET
          transformed_title = $1,
          transformed_content = $2,
          ovh_links = $3,
          disclaimer = $4,
          status = 'transformed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        transformed.title,
        transformed.content,
        JSON.stringify(transformed.ovhLinks || []),
        transformed.disclaimer,
        articleId
      ]);

      console.log(`[QUEUE] Article ${articleId} transformed successfully`);

      // Log activity
      await logActivity('transformation', `Transformed: ${article.original_title?.substring(0, 50)}...`, {
        articleId
      });

      // Small delay between transformations to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));

    } catch (error) {
      console.error(`[QUEUE] Error transforming article ${articleId}:`, error.message);
      await logActivity('error', `Transform failed for article ${articleId}: ${error.message}`, {
        articleId
      });
    }
  }

  isProcessingQueue = false;
  console.log('[QUEUE] Queue processing completed');
}

// Process translation queue
async function processTranslationQueue() {
  if (isProcessingTranslations || translationQueue.length === 0) return;

  isProcessingTranslations = true;
  console.log(`[TRANSLATE] Starting to process ${translationQueue.length} translation jobs`);

  while (translationQueue.length > 0) {
    const job = translationQueue.shift();
    const { articleId, targetLangs } = job;

    try {
      // Get the source article
      const result = await pgPool.query(
        'SELECT * FROM articles WHERE id = $1 AND status = $2',
        [articleId, 'transformed']
      );

      if (result.rows.length === 0) {
        console.log(`[TRANSLATE] Article ${articleId} not found or not transformed, skipping`);
        continue;
      }

      const sourceArticle = result.rows[0];
      console.log(`[TRANSLATE] Translating article ${articleId} to ${targetLangs.length} languages`);

      for (const targetLang of targetLangs) {
        try {
          // Check if translation already exists
          const existingResult = await pgPool.query(
            'SELECT id FROM articles WHERE parent_article_id = $1 AND language = $2',
            [articleId, targetLang]
          );

          if (existingResult.rows.length > 0) {
            console.log(`[TRANSLATE] ${targetLang.toUpperCase()} already exists, skipping`);
            continue;
          }

          console.log(`[TRANSLATE] Translating to ${targetLang.toUpperCase()}...`);

          // Translate using OVH AI
          const translated = await translateWithDeepSeek(sourceArticle, targetLang);

          // Insert as child article
          await pgPool.query(`
            INSERT INTO articles (
              provider_id, source_url, language, original_title, original_content,
              transformed_title, transformed_content, ovh_links, disclaimer,
              status, parent_article_id, word_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            sourceArticle.provider_id,
            sourceArticle.source_url,
            targetLang,
            sourceArticle.original_title,
            sourceArticle.original_content,
            translated.title,
            translated.content,
            JSON.stringify(translated.ovhLinks || sourceArticle.ovh_links || []),
            translated.disclaimer || sourceArticle.disclaimer,
            'translated',
            articleId,
            translated.content ? translated.content.split(/\s+/).length : 0
          ]);

          console.log(`[TRANSLATE] ${targetLang.toUpperCase()} translation saved`);

          // Log activity
          await logActivity('translation', `Translated to ${targetLang.toUpperCase()}: ${sourceArticle.transformed_title?.substring(0, 40)}...`, {
            articleId
          });

          // Delay between translations
          await new Promise(r => setTimeout(r, 1500));

        } catch (langError) {
          console.error(`[TRANSLATE] Error translating to ${targetLang}:`, langError.message);
          await logActivity('error', `Translation to ${targetLang} failed for article ${articleId}`, {
            articleId
          });
        }
      }

    } catch (error) {
      console.error(`[TRANSLATE] Error processing article ${articleId}:`, error.message);
    }
  }

  isProcessingTranslations = false;
  console.log('[TRANSLATE] Translation queue processing completed');
}

// Translate article using DeepSeek
async function translateWithDeepSeek(article, targetLang) {
  const langNames = {
    fr: 'French', en: 'English', es: 'Spanish', de: 'German',
    it: 'Italian', pt: 'Portuguese', nl: 'Dutch', pl: 'Polish'
  };

  const targetLangName = langNames[targetLang] || targetLang;
  const content = article.transformed_content || article.original_content;
  const title = article.transformed_title || article.original_title;

  const prompt = `Translate the following article to ${targetLangName}.
Keep the same structure and formatting. Maintain technical accuracy.
Do not add any commentary, just provide the translation.

Title: ${title}

Content:
${content.substring(0, 15000)}

Respond with:
TITLE: [translated title]
CONTENT:
[translated content]`;

  try {
    const response = await ovhAI.chat.completions.create({
      model: 'DeepSeek-R1-Distill-Llama-70B',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.3
    });

    let result = response.choices[0]?.message?.content || '';

    // Remove DeepSeek <think> tags
    result = result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Try multiple parsing strategies
    let translatedTitle = null;
    let translatedContent = null;

    // Strategy 1: TITLE: and CONTENT: format
    const titleMatch = result.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/si);
    const contentMatch = result.match(/CONTENT:\s*([\s\S]+)/i);

    if (titleMatch && contentMatch) {
      translatedTitle = titleMatch[1].trim();
      translatedContent = contentMatch[1].trim();
    }

    // Strategy 2: First line is title, rest is content
    if (!translatedTitle || !translatedContent) {
      const lines = result.split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        translatedTitle = lines[0].replace(/^#+\s*/, '').trim();
        translatedContent = lines.slice(1).join('\n').trim();
      }
    }

    // Strategy 3: Use entire response as content with modified title
    if (!translatedContent || translatedContent.length < 50) {
      translatedContent = result;
      if (!translatedTitle) {
        translatedTitle = `${title} (${targetLangName})`;
      }
    }

    // Final validation
    if (!translatedContent || translatedContent.length < 50) {
      throw new Error('Invalid translation response - content too short');
    }

    return {
      title: translatedTitle || `${title} (${targetLangName})`,
      content: translatedContent,
      ovhLinks: article.ovh_links,
      disclaimer: article.disclaimer
    };
  } catch (error) {
    console.error(`[TRANSLATE] AI error for ${targetLang}:`, error.message);
    // Don't save failed translations - throw to skip
    throw error;
  }
}

// Initialize listener after a short delay to ensure pool is ready
setTimeout(() => {
  initPgListener().catch(err => console.error('[PG LISTENER] Init error:', err.message));
}, 2000);

// ==================== OVH AI CONFIGURATION ====================

const OVH_AI_API_KEY = process.env.OVH_AI_API_KEY || 'eyJhbGciOiJFZERTQSIsImtpZCI6IjgzMkFGNUE5ODg3MzFCMDNGM0EzMTRFMDJFRUJFRjBGNDE5MUY0Q0YiLCJraW5kIjoicGF0IiwidHlwIjoiSldUIn0.eyJ0b2tlbiI6InltMGFjS25TVHJNZFpTUG1mMzdZbWhzNGRpUFpjOWpKTGR0VENHM0xvT1U9In0.2XL4_On8F91xhPLOMO_voxiWLjvJMgO8V7KH73VO2kzN0lR_zS7swoHzmJaSdn0U9MCTV2IzRJUBRWeK7TCVDA';
const OVH_AI_BASE_URL = 'https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';

const ovhAI = new OpenAI({
  apiKey: OVH_AI_API_KEY,
  baseURL: OVH_AI_BASE_URL
});

// Firecrawl configuration - Self-hosted version on VM
const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || 'http://91.134.72.199:3002';
let firecrawlApiKey = process.env.FIRECRAWL_API_KEY || 'fc-test-key'; // Local instance doesn't require real key

// ==================== PROVIDERS API (Collection Points) ====================

// Get all providers with enhanced stats
app.get('/api/providers', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        p.*,
        (SELECT COUNT(*) FROM articles WHERE provider_id = p.id AND parent_article_id IS NULL) as articles_collected,
        (SELECT COUNT(*) FROM collection_jobs WHERE provider_id = p.id AND status = 'running') as active_jobs,
        (SELECT MAX(started_at) FROM collection_jobs WHERE provider_id = p.id) as last_job_at
      FROM providers p
      ORDER BY name
    `);

    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      domain: row.domain || row.slug + '.com',
      baseUrls: row.base_urls,
      targetUrl: row.target_url,
      status: row.status || 'active',
      articlesCollected: parseInt(row.articles_collected) || 0,
      lastRun: row.last_run || row.last_job_at,
      nextRun: row.next_run,
      successRate: parseFloat(row.success_rate) || 100,
      schedule: row.schedule || 'manual',
      crawlDepth: row.crawl_depth || 2,
      includePatterns: row.include_patterns || [],
      excludePatterns: row.exclude_patterns || [],
      isActive: row.is_active,
      activeJobs: parseInt(row.active_jobs) || 0
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get provider by ID
app.get('/api/providers/:id', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        p.*,
        (SELECT COUNT(*) FROM articles WHERE provider_id = p.id AND parent_article_id IS NULL) as articles_collected
      FROM providers p
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      domain: row.domain || row.slug + '.com',
      baseUrls: row.base_urls,
      targetUrl: row.target_url,
      status: row.status || 'active',
      articlesCollected: parseInt(row.articles_collected) || 0,
      lastRun: row.last_run,
      nextRun: row.next_run,
      successRate: parseFloat(row.success_rate) || 100,
      schedule: row.schedule || 'manual',
      crawlDepth: row.crawl_depth || 2,
      includePatterns: row.include_patterns || [],
      excludePatterns: row.exclude_patterns || [],
      isActive: row.is_active
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new provider
app.post('/api/providers', async (req, res) => {
  const {
    name, slug, domain, baseUrls, targetUrl, schedule,
    crawlDepth, includePatterns, excludePatterns
  } = req.body;

  try {
    const result = await pgPool.query(`
      INSERT INTO providers (
        name, slug, domain, base_urls, target_url, schedule,
        crawl_depth, include_patterns, exclude_patterns
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [
      name,
      slug,
      domain,
      JSON.stringify(baseUrls || {}),
      targetUrl,
      schedule || 'manual',
      crawlDepth || 2,
      JSON.stringify(includePatterns || []),
      JSON.stringify(excludePatterns || [])
    ]);

    await logActivity('collection', `Collection point "${name}" created`, { providerId: result.rows[0].id });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update provider
app.put('/api/providers/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, domain, baseUrls, targetUrl, status, schedule,
    crawlDepth, includePatterns, excludePatterns, nextRun
  } = req.body;

  try {
    const result = await pgPool.query(`
      UPDATE providers SET
        name = COALESCE($1, name),
        domain = COALESCE($2, domain),
        base_urls = COALESCE($3, base_urls),
        target_url = COALESCE($4, target_url),
        status = COALESCE($5, status),
        schedule = COALESCE($6, schedule),
        crawl_depth = COALESCE($7, crawl_depth),
        include_patterns = COALESCE($8, include_patterns),
        exclude_patterns = COALESCE($9, exclude_patterns),
        next_run = COALESCE($10, next_run)
      WHERE id = $11 RETURNING *
    `, [
      name,
      domain,
      baseUrls ? JSON.stringify(baseUrls) : null,
      targetUrl,
      status,
      schedule,
      crawlDepth,
      includePatterns ? JSON.stringify(includePatterns) : null,
      excludePatterns ? JSON.stringify(excludePatterns) : null,
      nextRun,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete provider
app.delete('/api/providers/:id', async (req, res) => {
  try {
    const provider = await pgPool.query('SELECT name FROM providers WHERE id = $1', [req.params.id]);
    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    await pgPool.query('DELETE FROM providers WHERE id = $1', [req.params.id]);
    await logActivity('collection', `Collection point "${provider.rows[0].name}" deleted`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle provider active status
app.patch('/api/providers/:id/toggle', async (req, res) => {
  try {
    const result = await pgPool.query(
      'UPDATE providers SET is_active = NOT is_active WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start collection for a provider
app.post('/api/providers/:id/start', async (req, res) => {
  const { id } = req.params;
  const { language = 'fr', url } = req.body;

  try {
    const provider = await pgPool.query('SELECT * FROM providers WHERE id = $1', [id]);
    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Create a collection job
    const jobResult = await pgPool.query(`
      INSERT INTO collection_jobs (provider_id, status)
      VALUES ($1, 'running') RETURNING id
    `, [id]);

    const jobId = jobResult.rows[0].id;

    // Update provider status
    await pgPool.query(`
      UPDATE providers SET status = 'active', last_run = CURRENT_TIMESTAMP WHERE id = $1
    `, [id]);

    await logActivity('collection', `Started collection for ${provider.rows[0].name}`, {
      providerId: parseInt(id),
      jobId
    });

    // Determine URL to scrape
    const targetUrl = url || provider.rows[0].target_url ||
      (provider.rows[0].base_urls?.fr) ||
      Object.values(provider.rows[0].base_urls || {})[0];

    if (!targetUrl) {
      return res.status(400).json({ error: 'No target URL configured for this provider' });
    }

    res.json({ success: true, jobId, message: 'Collection started' });

    // Start scraping in background (reuse existing scraping logic)
    scrapeWithFirecrawlJob(targetUrl, parseInt(id), language, jobId).catch(err => {
      console.error('[JOB ERROR]', err.message);
      pgPool.query("UPDATE collection_jobs SET status = 'error' WHERE id = $1", [jobId]);
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause collection for a provider
app.post('/api/providers/:id/pause', async (req, res) => {
  const { id } = req.params;

  try {
    // Update any running jobs for this provider to paused
    await pgPool.query(`
      UPDATE collection_jobs SET status = 'paused' WHERE provider_id = $1 AND status = 'running'
    `, [id]);

    await pgPool.query(`
      UPDATE providers SET status = 'paused' WHERE id = $1
    `, [id]);

    const provider = await pgPool.query('SELECT name FROM providers WHERE id = $1', [id]);
    await logActivity('collection', `Paused collection for ${provider.rows[0]?.name}`, {
      providerId: parseInt(id)
    });

    res.json({ success: true, message: 'Collection paused' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule collection for a provider
app.post('/api/providers/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { schedule, nextRun } = req.body;

  try {
    await pgPool.query(`
      UPDATE providers SET
        status = 'scheduled',
        schedule = $1,
        next_run = $2
      WHERE id = $3
    `, [schedule, nextRun, id]);

    const provider = await pgPool.query('SELECT name FROM providers WHERE id = $1', [id]);
    await logActivity('collection', `Scheduled collection for ${provider.rows[0]?.name}: ${schedule}`, {
      providerId: parseInt(id),
      metadata: { schedule, nextRun }
    });

    res.json({ success: true, message: 'Collection scheduled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== JOBS API (Live Monitor) ====================

// Get all active/recent jobs
app.get('/api/jobs', async (req, res) => {
  const { status, active, limit = 10 } = req.query;

  try {
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // If active=true, show only running/paused jobs
    if (active === 'true') {
      whereClause = "WHERE j.status IN ('running', 'paused')";
    } else if (status) {
      whereClause = `WHERE j.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const result = await pgPool.query(`
      SELECT
        j.*,
        p.name as provider_name,
        p.domain as provider_domain
      FROM collection_jobs j
      LEFT JOIN providers p ON j.provider_id = p.id
      ${whereClause}
      ORDER BY j.started_at DESC
      LIMIT $${paramIndex}
    `, [...params, parseInt(limit)]);

    // Also get queue status
    const queueStatus = {
      transformQueue: {
        enabled: autoTransformEnabled,
        queueSize: transformQueue.length,
        isProcessing: isProcessingQueue
      },
      translateQueue: {
        enabled: autoTranslateEnabled,
        queueSize: translationQueue.length,
        isProcessing: isProcessingTranslations
      }
    };

    res.json({
      jobs: result.rows.map(row => ({
        id: row.id,
        providerId: row.provider_id,
        providerName: row.provider_name,
        providerDomain: row.provider_domain,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        articlesFound: row.articles_found || 0,
        articlesProcessed: row.articles_processed || 0,
        estimatedTotal: row.estimated_total || 0,
        articlesPerHour: row.articles_per_hour || 0,
        errors: row.errors || [],
        recentDiscoveries: row.recent_discoveries || []
      })),
      ...queueStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        j.*,
        p.name as provider_name
      FROM collection_jobs j
      LEFT JOIN providers p ON j.provider_id = p.id
      WHERE j.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job logs
app.get('/api/jobs/:id/logs', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT logs FROM collection_jobs WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ logs: result.rows[0].logs || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause a job
app.post('/api/jobs/:id/pause', async (req, res) => {
  try {
    await pgPool.query("UPDATE collection_jobs SET status = 'paused' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume a job
app.post('/api/jobs/:id/resume', async (req, res) => {
  try {
    await pgPool.query("UPDATE collection_jobs SET status = 'running' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel a job
app.post('/api/jobs/:id/cancel', async (req, res) => {
  try {
    await pgPool.query(`
      UPDATE collection_jobs SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCRAPING ====================

let scrapingProgress = {
  status: 'idle',
  provider: null,
  language: null,
  total: 0,
  current: 0,
  articles: [],
  logs: []
};

// Track active jobs for pause/cancel
const activeJobs = new Map();

function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  scrapingProgress.logs.push({ timestamp, message, type });
  console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
}

app.post('/api/firecrawl/config', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });
  firecrawlApiKey = apiKey;
  res.json({ message: 'Firecrawl API key configured' });
});

app.get('/api/scrape/progress', (req, res) => {
  res.json(scrapingProgress);
});

app.post('/api/scrape', async (req, res) => {
  const { providerId, language, url } = req.body;

  if (!firecrawlApiKey) {
    return res.status(400).json({ error: 'Firecrawl API key not configured' });
  }

  if (scrapingProgress.status === 'running') {
    return res.status(400).json({ error: 'Scraping already in progress' });
  }

  scrapingProgress = {
    status: 'running',
    provider: providerId,
    language: language,
    total: 0,
    current: 0,
    articles: [],
    logs: []
  };

  res.json({ message: 'Scraping started' });

  // Run scraping in background
  scrapeWithFirecrawl(url, providerId, language).catch(err => {
    addLog(`Erreur: ${err.message}`, 'error');
    scrapingProgress.status = 'error';
  });
});

async function scrapeWithFirecrawl(baseUrl, providerId, language) {
  try {
    addLog(`Demarrage collecte: ${baseUrl}`, 'info');
    addLog(`Firecrawl: ${FIRECRAWL_API_URL} (self-hosted)`, 'info');

    const firecrawl = new FirecrawlApp({
      apiKey: firecrawlApiKey,
      apiUrl: FIRECRAWL_API_URL
    });

    addLog('Mapping du site...', 'info');
    const mapResult = await firecrawl.mapUrl(baseUrl, { limit: 500 });

    if (!mapResult.success) {
      throw new Error(mapResult.error || 'Map failed');
    }

    const allUrls = mapResult.links || [];
    addLog(`${allUrls.length} URLs trouvees`, 'success');

    // Filter for article URLs
    const articleUrls = allUrls.filter(url => {
      if (!url.includes('/tutoriels/') && !url.includes('/tutorials/') && !url.includes('/tutoriales/')) return false;
      const match = url.match(/\/(tutoriels|tutorials|tutoriales)\/([^\/\?#]+)/);
      if (!match) return false;
      const slug = match[2];
      if (slug.length < 10 || !slug.includes('-')) return false;
      if (slug.startsWith('page') || url.includes('/page/')) return false;
      return true;
    });

    const uniqueUrls = [...new Set(articleUrls)];
    addLog(`${uniqueUrls.length} articles a collecter`, 'info');

    scrapingProgress.total = uniqueUrls.length;
    const maxArticles = Math.min(uniqueUrls.length, 50);

    for (let i = 0; i < maxArticles; i++) {
      const url = uniqueUrls[i];
      scrapingProgress.current = i + 1;

      try {
        addLog(`[${i + 1}/${maxArticles}] ${url.split('/').pop().substring(0, 40)}...`, 'info');

        const scrapeResult = await firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
          onlyMainContent: true
        });

        if (scrapeResult.success && scrapeResult.markdown) {
          const content = scrapeResult.markdown;
          const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

          if (wordCount < 300) {
            addLog(`Ignore (contenu insuffisant): ${wordCount} mots`, 'info');
            continue;
          }

          const title = (scrapeResult.metadata?.title || 'Sans titre')
            .replace(/ - Hostinger.*$/, '')
            .replace(/ \| Hostinger.*$/, '')
            .trim();

          // Save to database
          const dbResult = await pgPool.query(
            `INSERT INTO articles (provider_id, source_url, language, original_title, original_content, category, word_count, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'collected')
             RETURNING id`,
            [providerId, url, language, title, content, extractCategory(url), wordCount]
          );

          scrapingProgress.articles.push({
            id: dbResult.rows[0].id,
            title: title,
            url: url,
            wordCount: wordCount,
            language: language
          });

          addLog(`OK: ${title.substring(0, 40)}... (${wordCount} mots)`, 'success');
        }

        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        addLog(`Erreur: ${e.message}`, 'error');
      }
    }

    // Update provider last sync
    await pgPool.query(
      'UPDATE providers SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
      [providerId]
    );

    addLog(`Collecte terminee! ${scrapingProgress.articles.length} articles`, 'success');
    scrapingProgress.status = 'completed';

  } catch (error) {
    addLog(`Erreur: ${error.message}`, 'error');
    scrapingProgress.status = 'error';
  }
}

function extractCategory(url) {
  const categories = {
    'wordpress': 'WordPress',
    'vps': 'VPS',
    'hebergement': 'Hebergement',
    'hosting': 'Hebergement',
    'domaine': 'Domaines',
    'domain': 'Domaines',
    'email': 'Email',
    'ssl': 'Securite',
    'security': 'Securite'
  };
  for (const [key, value] of Object.entries(categories)) {
    if (url.toLowerCase().includes(key)) return value;
  }
  return 'Tutoriel';
}

// Enhanced scraping function with job tracking
async function scrapeWithFirecrawlJob(baseUrl, providerId, language, jobId) {
  const jobLogs = [];
  const addJobLog = (message, type = 'info') => {
    const entry = { timestamp: new Date().toISOString(), message, type };
    jobLogs.push(entry);
    console.log(`[JOB ${jobId}] ${type.toUpperCase()}: ${message}`);
  };

  const updateJobProgress = async (updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      idx++;
    }

    // Always update logs
    fields.push(`logs = $${idx}`);
    values.push(JSON.stringify(jobLogs));
    idx++;

    values.push(jobId);
    await pgPool.query(
      `UPDATE collection_jobs SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  };

  try {
    addJobLog(`Starting collection: ${baseUrl}`, 'info');

    const firecrawl = new FirecrawlApp({
      apiKey: firecrawlApiKey,
      apiUrl: FIRECRAWL_API_URL
    });

    addJobLog('Mapping site...', 'info');
    const mapResult = await firecrawl.mapUrl(baseUrl, { limit: 500 });

    if (!mapResult.success) {
      throw new Error(mapResult.error || 'Map failed');
    }

    const allUrls = mapResult.links || [];
    addJobLog(`${allUrls.length} URLs found`, 'success');

    // Filter for article URLs
    const articleUrls = allUrls.filter(url => {
      if (!url.includes('/tutoriels/') && !url.includes('/tutorials/') && !url.includes('/tutoriales/')) return false;
      const match = url.match(/\/(tutoriels|tutorials|tutoriales)\/([^\/\?#]+)/);
      if (!match) return false;
      const slug = match[2];
      if (slug.length < 10 || !slug.includes('-')) return false;
      if (slug.startsWith('page') || url.includes('/page/')) return false;
      return true;
    });

    const uniqueUrls = [...new Set(articleUrls)];
    const estimatedTotal = uniqueUrls.length;

    await updateJobProgress({
      estimated_total: estimatedTotal,
      articles_found: uniqueUrls.length
    });

    addJobLog(`${uniqueUrls.length} articles to collect`, 'info');

    const maxArticles = Math.min(uniqueUrls.length, 100);
    const recentDiscoveries = [];
    const errors = [];
    let articlesProcessed = 0;
    const startTime = Date.now();

    for (let i = 0; i < maxArticles; i++) {
      // Check if job was cancelled/paused
      const jobStatus = await pgPool.query('SELECT status FROM collection_jobs WHERE id = $1', [jobId]);
      if (jobStatus.rows[0]?.status === 'cancelled' || jobStatus.rows[0]?.status === 'paused') {
        addJobLog(`Job ${jobStatus.rows[0].status}`, 'info');
        break;
      }

      const url = uniqueUrls[i];

      try {
        addJobLog(`[${i + 1}/${maxArticles}] Processing: ${url.split('/').pop()?.substring(0, 40)}...`, 'info');

        const scrapeResult = await firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
          onlyMainContent: true
        });

        if (scrapeResult.success && scrapeResult.markdown) {
          const content = scrapeResult.markdown;
          const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

          if (wordCount < 300) {
            addJobLog(`Skipped (insufficient content): ${wordCount} words`, 'info');
            continue;
          }

          const title = (scrapeResult.metadata?.title || 'Sans titre')
            .replace(/ - Hostinger.*$/, '')
            .replace(/ \| Hostinger.*$/, '')
            .trim();

          // Save to database
          const dbResult = await pgPool.query(
            `INSERT INTO articles (provider_id, source_url, language, original_title, original_content, category, word_count, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'collected')
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [providerId, url, language, title, content, extractCategory(url), wordCount]
          );

          if (dbResult.rows.length > 0) {
            articlesProcessed++;

            // Track recent discoveries
            recentDiscoveries.unshift({
              title: title.substring(0, 60),
              url,
              timestamp: new Date().toISOString()
            });
            if (recentDiscoveries.length > 10) recentDiscoveries.pop();

            addJobLog(`OK: ${title.substring(0, 40)}... (${wordCount} words)`, 'success');

            // Log activity
            await logActivity('collection', `Collected: ${title.substring(0, 50)}...`, {
              articleId: dbResult.rows[0].id,
              providerId,
              jobId
            });
          } else {
            addJobLog(`Skipped (duplicate): ${title.substring(0, 40)}`, 'info');
          }
        }

        // Calculate articles per hour
        const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
        const articlesPerHour = elapsedHours > 0 ? Math.round(articlesProcessed / elapsedHours) : 0;

        // Update progress
        await updateJobProgress({
          articles_processed: articlesProcessed,
          articles_per_hour: articlesPerHour,
          recent_discoveries: recentDiscoveries
        });

        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        addJobLog(`Error: ${e.message}`, 'error');
        errors.push({
          message: e.message,
          url,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update provider stats
    const totalArticles = await pgPool.query(
      'SELECT COUNT(*) as count FROM articles WHERE provider_id = $1 AND parent_article_id IS NULL',
      [providerId]
    );
    const successRate = articlesProcessed > 0 ?
      ((articlesProcessed / (articlesProcessed + errors.length)) * 100).toFixed(2) : 100;

    await pgPool.query(`
      UPDATE providers SET
        last_run = CURRENT_TIMESTAMP,
        success_rate = $1,
        articles_count = $2
      WHERE id = $3
    `, [successRate, totalArticles.rows[0].count, providerId]);

    // Finalize job
    await pgPool.query(`
      UPDATE collection_jobs SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        articles_processed = $1,
        errors = $2,
        recent_discoveries = $3,
        logs = $4
      WHERE id = $5
    `, [articlesProcessed, JSON.stringify(errors), JSON.stringify(recentDiscoveries), JSON.stringify(jobLogs), jobId]);

    addJobLog(`Collection completed! ${articlesProcessed} articles collected`, 'success');

    await logActivity('collection', `Completed collection: ${articlesProcessed} articles`, {
      providerId,
      jobId,
      metadata: { articlesProcessed, errors: errors.length }
    });

  } catch (error) {
    addJobLog(`Fatal error: ${error.message}`, 'error');

    await pgPool.query(`
      UPDATE collection_jobs SET
        status = 'error',
        completed_at = CURRENT_TIMESTAMP,
        errors = $1,
        logs = $2
      WHERE id = $3
    `, [
      JSON.stringify([{ message: error.message, timestamp: new Date().toISOString() }]),
      JSON.stringify(jobLogs),
      jobId
    ]);

    await logActivity('error', `Collection failed: ${error.message}`, {
      providerId,
      jobId
    });
  }
}

// Direct single article scraping endpoint
app.post('/api/scrape/single', async (req, res) => {
  const { url, providerId, language } = req.body;

  if (!url || !providerId || !language) {
    return res.status(400).json({ error: 'url, providerId, and language are required' });
  }

  try {
    const firecrawl = new FirecrawlApp({
      apiKey: firecrawlApiKey,
      apiUrl: FIRECRAWL_API_URL
    });

    const scrapeResult = await firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true
    });

    if (!scrapeResult.success || !scrapeResult.markdown) {
      return res.status(400).json({ error: 'Failed to scrape URL' });
    }

    const content = scrapeResult.markdown;
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    const title = (scrapeResult.metadata?.title || 'Sans titre')
      .replace(/ - Hostinger.*$/, '')
      .replace(/ \| Hostinger.*$/, '')
      .trim();

    const dbResult = await pgPool.query(
      `INSERT INTO articles (provider_id, source_url, language, original_title, original_content, category, word_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'collected')
       RETURNING *`,
      [providerId, url, language, title, content, extractCategory(url), wordCount]
    );

    res.json({ success: true, article: dbResult.rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ARTICLES API (Content Repository) ====================

// Get articles with filters, search, sorting
app.get('/api/articles', async (req, res) => {
  const {
    language, providerId, status, search,
    limit = 50, offset = 0,
    sortBy = 'created_at', sortOrder = 'desc',
    parentOnly = 'false'
  } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filter by parent articles only (no translations)
    if (parentOnly === 'true') {
      whereClause += ' AND a.parent_article_id IS NULL';
    }

    if (language) {
      whereClause += ` AND a.language = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }

    if (providerId) {
      whereClause += ` AND a.provider_id = $${paramIndex}`;
      params.push(parseInt(providerId));
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Search in title
    if (search) {
      whereClause += ` AND (
        a.original_title ILIKE $${paramIndex}
        OR a.transformed_title ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM articles a ${whereClause}`;
    const totalResult = await pgPool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].total);

    // Validate sort column
    const validSortColumns = ['created_at', 'word_count', 'original_title', 'transformed_at', 'seo_score'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get paginated results with translation counts
    const query = `
      SELECT
        a.*,
        p.name as provider_name,
        p.slug as provider_slug,
        (SELECT COUNT(*) FROM articles t WHERE t.parent_article_id = a.id) as translations_count
      FROM articles a
      LEFT JOIN providers p ON a.provider_id = p.id
      ${whereClause}
      ORDER BY a.${sortColumn} ${order} NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pgPool.query(query, params);

    // Get counts by language
    const langCountResult = await pgPool.query(`
      SELECT language, COUNT(*) as count FROM articles GROUP BY language
    `);

    // Get counts by status
    const statusCountResult = await pgPool.query(`
      SELECT status, COUNT(*) as count FROM articles GROUP BY status
    `);

    res.json({
      articles: result.rows.map(row => ({
        id: row.id,
        title: row.transformed_title || row.original_title,
        originalTitle: row.original_title,
        transformedTitle: row.transformed_title,
        sourceUrl: row.source_url,
        providerName: row.provider_name,
        providerSlug: row.provider_slug,
        status: row.status,
        language: row.language,
        wordCount: row.word_count,
        seoScore: row.seo_score || 0,
        createdAt: row.created_at,
        transformedAt: row.transformed_at,
        publishedAt: row.published_at,
        translationsCount: parseInt(row.translations_count) || 0,
        parentArticleId: row.parent_article_id
      })),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      counts: langCountResult.rows.reduce((acc, row) => {
        acc[row.language] = parseInt(row.count);
        return acc;
      }, {}),
      statusCounts: statusCountResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article with translations
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

    const article = result.rows[0];

    // Get translations (child articles)
    const translations = await pgPool.query(`
      SELECT id, language, status, transformed_title as title, created_at
      FROM articles
      WHERE parent_article_id = $1
      ORDER BY language
    `, [req.params.id]);

    // Build hasTranslations map
    const hasTranslations = {};
    for (const t of translations.rows) {
      hasTranslations[t.language] = true;
    }

    res.json({
      id: article.id,
      providerId: article.provider_id,
      providerName: article.provider_name,
      sourceUrl: article.source_url,
      language: article.language,
      status: article.status,
      originalTitle: article.original_title,
      originalContent: article.original_content,
      transformedTitle: article.transformed_title,
      transformedContent: article.transformed_content,
      wordCount: article.word_count,
      seoScore: article.seo_score || 0,
      ovhLinks: article.ovh_links,
      disclaimer: article.disclaimer,
      createdAt: article.created_at,
      transformedAt: article.transformed_at,
      publishedAt: article.published_at,
      translations: translations.rows,
      hasTranslations,
      translationsCount: translations.rows.length,
      parentArticleId: article.parent_article_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BATCH OPERATIONS API ====================

// Batch transform articles
app.post('/api/articles/batch/transform', async (req, res) => {
  const { articleIds } = req.body;

  if (!articleIds || articleIds.length === 0) {
    return res.status(400).json({ error: 'No articles selected' });
  }

  try {
    // Add all articles to transform queue
    transformQueue.push(...articleIds);

    await logActivity('transformation', `Batch transformation queued: ${articleIds.length} articles`);

    // Start processing if not already
    if (!isProcessingQueue && transformQueue.length > 0) {
      processTransformQueue();
    }

    res.json({
      success: true,
      message: `${articleIds.length} articles added to transform queue`,
      queueSize: transformQueue.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch translate articles
app.post('/api/articles/batch/translate', async (req, res) => {
  const { articleIds, targetLanguages } = req.body;

  if (!articleIds || articleIds.length === 0) {
    return res.status(400).json({ error: 'No articles selected' });
  }

  try {
    const langs = targetLanguages || ALL_LANGUAGES;

    for (const articleId of articleIds) {
      // Get article language to exclude it from targets
      const result = await pgPool.query('SELECT language FROM articles WHERE id = $1', [articleId]);
      if (result.rows.length > 0) {
        const sourceLang = result.rows[0].language;
        const targets = langs.filter(l => l !== sourceLang);
        translationQueue.push({ articleId, targetLangs: targets });
      }
    }

    await logActivity('translation', `Batch translation queued: ${articleIds.length} articles to ${langs.length} languages`);

    // Start processing if not already
    if (!isProcessingTranslations && translationQueue.length > 0) {
      processTranslationQueue();
    }

    res.json({
      success: true,
      message: `${articleIds.length} articles added to translation queue`,
      queueSize: translationQueue.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch delete articles
app.post('/api/articles/batch/delete', async (req, res) => {
  const { articleIds } = req.body;

  if (!articleIds || articleIds.length === 0) {
    return res.status(400).json({ error: 'No articles selected' });
  }

  try {
    // First delete child translations
    await pgPool.query('DELETE FROM articles WHERE parent_article_id = ANY($1)', [articleIds]);

    // Then delete the parent articles
    const result = await pgPool.query('DELETE FROM articles WHERE id = ANY($1) RETURNING id', [articleIds]);

    await logActivity('delete', `Deleted ${result.rows.length} articles (and their translations)`);

    res.json({
      success: true,
      deleted: result.rows.length,
      message: `${result.rows.length} articles deleted`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch publish articles
app.post('/api/articles/batch/publish', async (req, res) => {
  const { articleIds } = req.body;

  if (!articleIds || articleIds.length === 0) {
    return res.status(400).json({ error: 'No articles selected' });
  }

  try {
    const result = await pgPool.query(`
      UPDATE articles
      SET status = 'published', published_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1)
      RETURNING id
    `, [articleIds]);

    await logActivity('publish', `Published ${result.rows.length} articles`);

    res.json({
      success: true,
      published: result.rows.length,
      message: `${result.rows.length} articles published`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SETTINGS API ====================

// Get all settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT key, value FROM settings');

    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    // Add runtime settings
    settings.autoTransform = {
      ...(settings.autoTransform || {}),
      enabled: autoTransformEnabled,
      queueSize: transformQueue.length,
      isProcessing: isProcessingQueue
    };

    settings.autoTranslate = {
      ...(settings.autoTranslate || {}),
      enabled: autoTranslateEnabled,
      queueSize: translationQueue.length,
      isProcessing: isProcessingTranslations
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
app.put('/api/settings', async (req, res) => {
  const updates = req.body;

  try {
    for (const [key, value] of Object.entries(updates)) {
      // Handle special runtime settings
      if (key === 'autoTransform' && typeof value.enabled === 'boolean') {
        autoTransformEnabled = value.enabled;
      }
      if (key === 'autoTranslate' && typeof value.enabled === 'boolean') {
        autoTranslateEnabled = value.enabled;
      }

      // Persist to database
      await pgPool.query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      `, [key, JSON.stringify(value)]);
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific setting
app.get('/api/settings/:key', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT value FROM settings WHERE key = $1', [req.params.key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: req.params.key, value: result.rows[0].value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSFORMATION API ====================

let transformProgress = {
  status: 'idle',
  current: 0,
  total: 0,
  logs: []
};

app.get('/api/transform/progress', (req, res) => {
  res.json(transformProgress);
});

// Auto-transform queue status and control
app.get('/api/transform/auto', (req, res) => {
  res.json({
    enabled: autoTransformEnabled,
    queueSize: transformQueue.length,
    isProcessing: isProcessingQueue,
    queue: transformQueue.slice(0, 10) // Show first 10 items
  });
});

app.post('/api/transform/auto', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    autoTransformEnabled = enabled;
    console.log(`[AUTO-TRANSFORM] ${enabled ? 'Enabled' : 'Disabled'}`);
  }
  res.json({ enabled: autoTransformEnabled });
});

// Manually trigger queue processing for all scraped articles
app.post('/api/transform/auto/process-all', async (req, res) => {
  try {
    const result = await pgPool.query(
      "SELECT id FROM articles WHERE status = 'scraped' ORDER BY created_at ASC"
    );

    const ids = result.rows.map(r => r.id);
    transformQueue.push(...ids);

    console.log(`[AUTO-TRANSFORM] Added ${ids.length} articles to queue`);

    if (!isProcessingQueue && transformQueue.length > 0) {
      processTransformQueue();
    }

    res.json({
      message: `${ids.length} articles added to transform queue`,
      queueSize: transformQueue.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSLATION API ====================

// Auto-translate queue status and control
app.get('/api/translate/auto', (req, res) => {
  res.json({
    enabled: autoTranslateEnabled,
    queueSize: translationQueue.length,
    isProcessing: isProcessingTranslations,
    queue: translationQueue.slice(0, 10)
  });
});

app.post('/api/translate/auto', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    autoTranslateEnabled = enabled;
    console.log(`[AUTO-TRANSLATE] ${enabled ? 'Enabled' : 'Disabled'}`);
  }
  res.json({ enabled: autoTranslateEnabled });
});

// Manually trigger translation for all transformed articles without translations
app.post('/api/translate/auto/process-all', async (req, res) => {
  try {
    // Get all transformed articles that don't have any child translations
    const result = await pgPool.query(`
      SELECT a.id, a.language
      FROM articles a
      WHERE a.status = 'transformed'
        AND a.parent_article_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM articles t WHERE t.parent_article_id = a.id
        )
      ORDER BY a.created_at ASC
    `);

    let totalJobs = 0;
    for (const row of result.rows) {
      const sourceLang = row.language || 'en';
      const targetLangs = ALL_LANGUAGES.filter(l => l !== sourceLang);
      translationQueue.push({ articleId: row.id, targetLangs });
      totalJobs++;
    }

    console.log(`[AUTO-TRANSLATE] Added ${totalJobs} articles to translation queue`);

    if (!isProcessingTranslations && translationQueue.length > 0) {
      processTranslationQueue();
    }

    res.json({
      message: `${totalJobs} articles added to translation queue`,
      queueSize: translationQueue.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Translate a specific article to all languages
app.post('/api/translate/:id', async (req, res) => {
  const { id } = req.params;
  const { targetLangs } = req.body;

  try {
    const result = await pgPool.query(
      'SELECT * FROM articles WHERE id = $1 AND status = $2',
      [id, 'transformed']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found or not transformed' });
    }

    const article = result.rows[0];
    const sourceLang = article.language || 'en';
    const langs = targetLangs || ALL_LANGUAGES.filter(l => l !== sourceLang);

    translationQueue.push({ articleId: parseInt(id), targetLangs: langs });

    if (!isProcessingTranslations) {
      processTranslationQueue();
    }

    res.json({
      message: `Article ${id} added to translation queue for ${langs.length} languages`,
      targetLangs: langs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transform', async (req, res) => {
  const { articleIds } = req.body;

  if (!articleIds || articleIds.length === 0) {
    return res.status(400).json({ error: 'No articles selected' });
  }

  if (transformProgress.status === 'running') {
    return res.status(400).json({ error: 'Transformation in progress' });
  }

  transformProgress = {
    status: 'running',
    current: 0,
    total: articleIds.length,
    logs: []
  };

  res.json({ message: 'Transformation started' });

  // Run transformation in background
  transformArticles(articleIds).catch(err => {
    transformProgress.logs.push({ timestamp: new Date().toLocaleTimeString(), message: err.message, type: 'error' });
    transformProgress.status = 'error';
  });
});

async function transformArticles(articleIds) {
  for (let i = 0; i < articleIds.length; i++) {
    transformProgress.current = i + 1;
    const articleId = articleIds[i];

    try {
      const result = await pgPool.query('SELECT * FROM articles WHERE id = $1', [articleId]);
      if (result.rows.length === 0) continue;

      const article = result.rows[0];
      transformProgress.logs.push({
        timestamp: new Date().toLocaleTimeString(),
        message: `[${i + 1}/${articleIds.length}] Transformation: ${article.original_title.substring(0, 40)}...`,
        type: 'info'
      });

      // Transform with DeepSeek
      const transformed = await transformWithDeepSeek(article);

      // Update article in database
      await pgPool.query(`
        UPDATE articles SET
          transformed_title = $1,
          transformed_content = $2,
          ovh_links = $3,
          disclaimer = $4,
          status = 'transformed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        transformed.title,
        transformed.content,
        JSON.stringify(transformed.ovhLinks || []),
        transformed.disclaimer,
        articleId
      ]);

      transformProgress.logs.push({
        timestamp: new Date().toLocaleTimeString(),
        message: `OK: ${transformed.title.substring(0, 40)}...`,
        type: 'success'
      });

      await new Promise(r => setTimeout(r, 500));

    } catch (error) {
      transformProgress.logs.push({
        timestamp: new Date().toLocaleTimeString(),
        message: `Erreur article ${articleId}: ${error.message}`,
        type: 'error'
      });
    }
  }

  transformProgress.status = 'completed';
  transformProgress.logs.push({
    timestamp: new Date().toLocaleTimeString(),
    message: `Transformation terminee! ${articleIds.length} articles traites`,
    type: 'success'
  });
}

// Clean scraped content before AI processing
function cleanScrapedContent(content) {
  if (!content) return '';

  let cleaned = content;

  // Remove navigation links at the top
  cleaned = cleaned.replace(/^\[.*?\]\(https?:\/\/[^\)]+\)\s*\n*/gm, '');

  // Remove share/social media blocks
  cleaned = cleaned.replace(/Share:[\s\S]*?(?=\n\n|\n[A-Z])/gi, '');
  cleaned = cleaned.replace(/\[Copier le lien[\s\S]*?\]\([^\)]+\)/gi, '');
  cleaned = cleaned.replace(/\[.*?(ChatGPT|Claude|Grok|Perplexity|Google AI).*?\]\([^\)]+\)/gi, '');

  // Remove URL-encoded strings (long encoded URLs in links)
  cleaned = cleaned.replace(/\[.*?\]\(https?:\/\/[^\)]*%[0-9A-F]{2}[^\)]{100,}\)/gi, '');

  // Remove "Resumez avec:" blocks
  cleaned = cleaned.replace(/R[eé]sumez avec:[\s\S]*?(?=\n\n[A-Z])/gi, '');

  // Remove date/author lines at the very top
  cleaned = cleaned.replace(/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s*\n+\w+\s*\n+\d+\s*minutes?\s+de\s+lecture\s*\n*/i, '');

  // Remove empty link references
  cleaned = cleaned.replace(/\[\]\([^\)]+\)\s*/g, '');

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

async function transformWithDeepSeek(article) {
  // Pre-clean the content
  const cleanedContent = cleanScrapedContent(article.original_content);

  const systemPrompt = `Tu es un expert en redaction technique pour OVHcloud. Transforme cet article de ${article.provider_name || 'concurrent'} pour OVHcloud.

IMPORTANT - Tu dois:
1. NETTOYER le contenu: supprimer toute navigation, liens sociaux, headers de site web
2. GARDER uniquement le contenu editorial de l'article (introduction, sections, conclusions)
3. Remplacer toutes les mentions de "${article.provider_name || 'Hostinger'}" par "OVHcloud"
4. Remplacer "hPanel" par "Manager OVHcloud", "Hostinger" par "OVHcloud"
5. Adapter les URLs vers docs.ovh.com ou ovhcloud.com
6. Formater en Markdown propre et lisible

Le contenu transforme doit etre un article PROPRE et LISIBLE, sans pollution visuelle.

Reponds UNIQUEMENT en JSON valide:
{
  "title": "titre de l'article (sans marque concurrente)",
  "content": "contenu de l'article nettoye et transforme en Markdown",
  "ovhLinks": [{"keyword": "mot-cle", "url": "https://docs.ovh.com/..."}],
  "disclaimer": "Cet article a ete adapte pour OVHcloud. Consultez la documentation officielle pour plus d'informations."
}`;

  try {
    const completion = await ovhAI.chat.completions.create({
      model: 'DeepSeek-R1-Distill-Llama-70B',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Titre: ${article.original_title}\n\nContenu:\n${cleanedContent.substring(0, 8000)}` }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Extract JSON
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) jsonStr = jsonObjectMatch[0];

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI transformation error, using fallback:', error.message);

    // Fallback: clean content + simple replacement
    const brandReplacements = {
      'Hostinger': 'OVHcloud',
      'hostinger': 'ovhcloud',
      'hPanel': 'Manager OVHcloud',
      'hostinger.fr': 'ovhcloud.com',
      'hostinger.com': 'ovhcloud.com'
    };

    // Use cleaned content in fallback too
    let content = cleanedContent || '';
    let title = article.original_title;

    for (const [from, to] of Object.entries(brandReplacements)) {
      content = content.split(from).join(to);
      title = title.split(from).join(to);
    }

    return {
      title,
      content,
      ovhLinks: [{ keyword: 'documentation', url: 'https://docs.ovh.com/fr/' }],
      disclaimer: 'Cet article a ete adapte pour OVHcloud. Consultez docs.ovh.com pour plus d\'informations.'
    };
  }
}

// ==================== TRANSLATION API ====================

app.post('/api/translate', async (req, res) => {
  const { articleId, targetLanguage } = req.body;

  try {
    const result = await pgPool.query('SELECT * FROM articles WHERE id = $1', [articleId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = result.rows[0];

    // Check if translation already exists
    const existing = await pgPool.query(
      'SELECT id FROM articles WHERE parent_article_id = $1 AND language = $2',
      [articleId, targetLanguage]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Translation already exists', articleId: existing.rows[0].id });
    }

    res.json({ message: 'Translation started' });

    // Translate in background
    translateArticle(article, targetLanguage).catch(console.error);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function translateArticle(article, targetLanguage) {
  const languageNames = {
    'fr': 'francais',
    'en': 'anglais',
    'es': 'espagnol',
    'de': 'allemand',
    'it': 'italien',
    'pt': 'portugais',
    'nl': 'neerlandais',
    'pl': 'polonais'
  };

  const systemPrompt = `Tu es un traducteur professionnel. Traduis ce contenu technique en ${languageNames[targetLanguage] || targetLanguage}.
Garde le formatage markdown. Adapte les expressions idiomatiques.

Reponds UNIQUEMENT en JSON:
{
  "title": "titre traduit",
  "content": "contenu traduit"
}`;

  try {
    const contentToTranslate = article.transformed_content || article.original_content;
    const titleToTranslate = article.transformed_title || article.original_title;

    const completion = await ovhAI.chat.completions.create({
      model: 'DeepSeek-R1-Distill-Llama-70B',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Titre: ${titleToTranslate}\n\nContenu:\n${contentToTranslate?.substring(0, 8000)}` }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    const responseText = completion.choices[0]?.message?.content || '';

    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) jsonStr = jsonObjectMatch[0];

    const translated = JSON.parse(jsonStr);

    // Save translation as new article
    await pgPool.query(`
      INSERT INTO articles (
        provider_id, source_url, language, original_title, original_content,
        transformed_title, transformed_content, category, word_count, ovh_links,
        disclaimer, status, parent_article_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'transformed', $12)
    `, [
      article.provider_id,
      article.source_url,
      targetLanguage,
      translated.title,
      translated.content,
      translated.title,
      translated.content,
      article.category,
      translated.content.split(/\s+/).length,
      article.ovh_links,
      article.disclaimer,
      article.id
    ]);

    console.log(`Translation to ${targetLanguage} completed for article ${article.id}`);

  } catch (error) {
    console.error('Translation error:', error.message);
  }
}

// ==================== ACTIVITY LOGGER ====================

async function logActivity(type, message, options = {}) {
  const { articleId, providerId, jobId, metadata } = options;
  try {
    await pgPool.query(`
      INSERT INTO activity_log (type, message, article_id, provider_id, job_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [type, message, articleId || null, providerId || null, jobId || null, JSON.stringify(metadata || {})]);
  } catch (err) {
    console.error('[ACTIVITY LOG] Error:', err.message);
  }
}

// ==================== STATS API (Enhanced for Dashboard) ====================

app.get('/api/stats', async (req, res) => {
  try {
    // Main counts
    const stats = await pgPool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'collected' AND parent_article_id IS NULL) as collected,
        COUNT(*) FILTER (WHERE status = 'transformed' AND parent_article_id IS NULL) as transformed,
        COUNT(*) FILTER (WHERE status = 'translated' OR parent_article_id IS NOT NULL) as translated,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE parent_article_id IS NULL) as parent_articles,
        COALESCE(AVG(word_count), 0) as avg_word_count,
        COALESCE(AVG(seo_score) FILTER (WHERE seo_score > 0), 0) as avg_seo_score
      FROM articles
    `);

    // Active jobs count
    const jobsResult = await pgPool.query(`
      SELECT COUNT(*) as active_jobs FROM collection_jobs WHERE status = 'running'
    `);

    // Language counts
    const langCounts = await pgPool.query(`
      SELECT language, COUNT(*) as count
      FROM articles
      GROUP BY language ORDER BY count DESC
    `);

    // Status counts
    const statusCounts = await pgPool.query(`
      SELECT status, COUNT(*) as count
      FROM articles
      GROUP BY status ORDER BY count DESC
    `);

    // By provider
    const byProvider = await pgPool.query(`
      SELECT p.name, p.slug, COUNT(a.id) as count
      FROM providers p
      LEFT JOIN articles a ON p.id = a.provider_id
      GROUP BY p.id ORDER BY count DESC
    `);

    res.json({
      totalArticles: parseInt(stats.rows[0].total),
      collected: parseInt(stats.rows[0].collected),
      transformed: parseInt(stats.rows[0].transformed),
      translated: parseInt(stats.rows[0].translated),
      published: parseInt(stats.rows[0].published),
      parentArticles: parseInt(stats.rows[0].parent_articles),
      avgWordCount: Math.round(parseFloat(stats.rows[0].avg_word_count)),
      avgSeoScore: Math.round(parseFloat(stats.rows[0].avg_seo_score)),
      activeJobs: parseInt(jobsResult.rows[0].active_jobs),
      languageCounts: langCounts.rows.reduce((acc, row) => {
        acc[row.language] = parseInt(row.count);
        return acc;
      }, {}),
      statusCounts: statusCounts.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      byProvider: byProvider.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIVITY FEED API ====================

app.get('/api/activity', async (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;

  try {
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (type) {
      whereClause = `WHERE type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    const result = await pgPool.query(`
      SELECT
        al.*,
        a.original_title as article_title,
        p.name as provider_name
      FROM activity_log al
      LEFT JOIN articles a ON al.article_id = a.id
      LEFT JOIN providers p ON al.provider_id = p.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await pgPool.query(
      `SELECT COUNT(*) as total FROM activity_log ${whereClause}`,
      params
    );

    res.json({
      activities: result.rows.map(row => ({
        id: row.id,
        type: row.type,
        message: row.message,
        timestamp: row.created_at,
        articleId: row.article_id,
        articleTitle: row.article_title,
        providerId: row.provider_id,
        providerName: row.provider_name,
        jobId: row.job_id,
        metadata: row.metadata
      })),
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK & APP INFO ====================

app.get('/api/health', async (req, res) => {
  let pgStatus = 'disconnected';
  let redisStatus = 'disconnected';
  let firecrawlStatus = 'unknown';

  try {
    await pgPool.query('SELECT 1');
    pgStatus = 'connected';
  } catch (e) {
    pgStatus = `error: ${e.message}`;
  }

  if (redisClient && redisClient.isOpen) {
    redisStatus = 'connected';
  }

  // Check Firecrawl
  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/`);
    firecrawlStatus = response.ok ? 'connected' : 'error';
  } catch (e) {
    firecrawlStatus = 'disconnected';
  }

  res.json({
    app: APP_NAME,
    version: APP_VERSION,
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      postgresql: pgStatus,
      redis: redisStatus,
      firecrawl: firecrawlStatus,
      ovhAi: 'configured'
    },
    queues: {
      transform: {
        enabled: autoTransformEnabled,
        size: transformQueue.length,
        processing: isProcessingQueue
      },
      translate: {
        enabled: autoTranslateEnabled,
        size: translationQueue.length,
        processing: isProcessingTranslations
      }
    }
  });
});

// App info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    description: 'SEO Content Absorption Platform for OVHcloud',
    features: [
      'Web scraping with Firecrawl',
      'AI-powered content transformation',
      'Multi-language translation',
      'Real-time job monitoring',
      'Batch operations'
    ],
    ai: {
      provider: 'OVHcloud AI Endpoints',
      model: 'DeepSeek-R1-Distill-Llama-70B'
    }
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                    HOT STINGER                        ║
║         SEO Content Absorption Platform               ║
║                   Version ${APP_VERSION}                       ║
╠═══════════════════════════════════════════════════════╣
║  API Server running on port ${PORT}                       ║
║  PostgreSQL: ${process.env.PG_HOST || '91.134.72.199'}:5432                    ║
║  Firecrawl: ${FIRECRAWL_API_URL}              ║
║  OVH AI: DeepSeek-R1-Distill-Llama-70B                ║
╚═══════════════════════════════════════════════════════╝
  `);
});
