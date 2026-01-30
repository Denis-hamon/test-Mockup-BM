const express = require('express');
const cors = require('cors');
const FirecrawlApp = require('@mendable/firecrawl-js').default;
const OpenAI = require('openai');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// ==================== PROVIDERS API ====================

// Get all providers
app.get('/api/providers', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM articles WHERE provider_id = p.id) as articles_count
      FROM providers p
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get provider by ID
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

// Add new provider
app.post('/api/providers', async (req, res) => {
  const { name, slug, base_urls } = req.body;
  try {
    const result = await pgPool.query(
      'INSERT INTO providers (name, slug, base_urls) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, JSON.stringify(base_urls)]
    );
    res.json(result.rows[0]);
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

// ==================== ARTICLES API ====================

// Get articles with filters
app.get('/api/articles', async (req, res) => {
  const { language, providerId, status, limit = 100, offset = 0 } = req.query;

  try {
    let query = `
      SELECT a.*, p.name as provider_name, p.slug as provider_slug
      FROM articles a
      LEFT JOIN providers p ON a.provider_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (language) {
      query += ` AND a.language = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }

    if (providerId) {
      query += ` AND a.provider_id = $${paramIndex}`;
      params.push(providerId);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pgPool.query(query, params);

    // Get counts by language
    const countResult = await pgPool.query(`
      SELECT language, COUNT(*) as count FROM articles GROUP BY language
    `);

    res.json({
      articles: result.rows,
      counts: countResult.rows.reduce((acc, row) => {
        acc[row.language] = parseInt(row.count);
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article
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
    const translations = await pgPool.query(`
      SELECT id, language, status, transformed_title
      FROM articles
      WHERE parent_article_id = $1 OR id = $1
      ORDER BY language
    `, [req.params.id]);

    res.json({
      ...result.rows[0],
      translations: translations.rows
    });
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
      model: 'deepseek-r1-distill-llama-70b',
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
      model: 'deepseek-r1-distill-llama-70b',
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

// ==================== STATS API ====================

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pgPool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected,
        COUNT(CASE WHEN status = 'transformed' THEN 1 END) as transformed,
        SUM(word_count) as total_words
      FROM articles
    `);

    const byLanguage = await pgPool.query(`
      SELECT language, COUNT(*) as count, SUM(word_count) as words
      FROM articles GROUP BY language ORDER BY count DESC
    `);

    const byProvider = await pgPool.query(`
      SELECT p.name, p.slug, COUNT(a.id) as count
      FROM providers p
      LEFT JOIN articles a ON p.id = a.provider_id
      GROUP BY p.id ORDER BY count DESC
    `);

    res.json({
      total: parseInt(stats.rows[0].total),
      collected: parseInt(stats.rows[0].collected),
      transformed: parseInt(stats.rows[0].transformed),
      totalWords: parseInt(stats.rows[0].total_words) || 0,
      byLanguage: byLanguage.rows,
      byProvider: byProvider.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', async (req, res) => {
  let pgStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await pgPool.query('SELECT 1');
    pgStatus = 'connected';
  } catch (e) {
    pgStatus = `error: ${e.message}`;
  }

  if (redisClient && redisClient.isOpen) {
    redisStatus = 'connected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: { postgresql: pgStatus, redis: redisStatus }
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Content Pipeline API v2 running on port ${PORT}`);
});
