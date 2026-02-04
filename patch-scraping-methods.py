#!/usr/bin/env python3
"""
Add scraping method options and failure logging triggers to server.js
"""

def patch_server():
    with open('/home/debian/content-pipeline-ovh/server.js', 'r') as f:
        content = f.read()

    patches_applied = 0

    # Patch 1: Add js_render and scraping_method columns to providers (if not exists check)
    # This is handled via SQL migration, but we add logging for method changes

    # Patch 2: Update scrapeWithFirecrawl to use js_render option
    old_crawl_call = '''    // First, crawl to discover URLs
    logger.info('Crawling du site...', { url: baseUrl });
    var crawlResult = await firecrawlApp.crawlUrl(baseUrl, {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown', 'html']
      }
    });'''

    new_crawl_call = '''    // Get provider settings for scraping method
    var providerSettings = await pgPool.query('SELECT js_render, scraping_method FROM providers WHERE id = $1', [job.providerId]);
    var jsRender = providerSettings.rows[0]?.js_render || false;
    var scrapingMethod = providerSettings.rows[0]?.scraping_method || 'firecrawl';

    // Log scraping method being used
    logger.info('[SCRAPE_METHOD] Starting collection', {
      providerId: job.providerId,
      method: scrapingMethod,
      jsRender: jsRender,
      url: baseUrl
    });

    // First, crawl to discover URLs
    logger.info('Crawling du site...', { url: baseUrl, jsRender });
    var crawlResult = await firecrawlApp.crawlUrl(baseUrl, {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        waitFor: jsRender ? 3000 : 0
      }
    });'''

    if old_crawl_call in content:
        content = content.replace(old_crawl_call, new_crawl_call)
        print("Patch 1: Added js_render support to crawl")
        patches_applied += 1
    else:
        print("Patch 1: Crawl pattern not found (may already be patched)")

    # Patch 3: Add failure detection and logging triggers
    old_bot_detection = '''    // Check for bot protection
    if (markdown && (
      markdown.includes('please wait while your request is being verified') ||
      markdown.toLowerCase().includes('cloudflare') ||
      markdown.toLowerCase().includes('access denied') ||
      markdown.toLowerCase().includes('ray id:')
    )) {'''

    new_bot_detection = '''    // Check for bot protection
    var botProtectionDetected = markdown && (
      markdown.includes('please wait while your request is being verified') ||
      markdown.toLowerCase().includes('cloudflare') ||
      markdown.toLowerCase().includes('access denied') ||
      markdown.toLowerCase().includes('ray id:') ||
      markdown.toLowerCase().includes('ddos protection') ||
      markdown.toLowerCase().includes('checking your browser') ||
      markdown.toLowerCase().includes('just a moment')
    );

    if (botProtectionDetected) {
      // LOG TRIGGER: Bot protection detected - recommend method change
      logger.warn('[COLLECTION_FAILURE] Bot protection detected', {
        providerId: job.providerId,
        url: pageUrl,
        trigger: 'BOT_PROTECTION',
        recommendation: 'ENABLE_JS_RENDER',
        currentMethod: scrapingMethod || 'firecrawl',
        jsRenderEnabled: jsRender || false
      });'''

    if old_bot_detection in content:
        content = content.replace(old_bot_detection, new_bot_detection)
        print("Patch 2: Added bot protection logging trigger")
        patches_applied += 1
    else:
        print("Patch 2: Bot detection pattern not found")

    # Patch 4: Add logging trigger for content too short
    old_content_check = '''      if (!markdown || markdown.length < 100) {
        job.addLog('warning', `Contenu trop court: ${pageUrl}`, pageUrl);
        continue;
      }'''

    new_content_check = '''      if (!markdown || markdown.length < 100) {
        // LOG TRIGGER: Content too short - may need JS rendering
        logger.warn('[COLLECTION_FAILURE] Content too short', {
          providerId: job.providerId,
          url: pageUrl,
          trigger: 'CONTENT_TOO_SHORT',
          contentLength: markdown ? markdown.length : 0,
          recommendation: jsRender ? 'CHECK_SELECTORS' : 'TRY_JS_RENDER'
        });
        job.addLog('warning', `Contenu trop court: ${pageUrl}`, pageUrl);
        continue;
      }'''

    if old_content_check in content:
        content = content.replace(old_content_check, new_content_check)
        print("Patch 3: Added content too short logging trigger")
        patches_applied += 1
    else:
        print("Patch 3: Content check pattern not found")

    # Patch 5: Add endpoint to update provider scraping settings
    old_provider_update = '''app.put('/api/providers/:id', async (req, res) => {
  try {
    const providerId = parseInt(req.params.id, 10);
    const {'''

    new_provider_update = '''// Update provider scraping method settings
app.put('/api/providers/:id/scraping-method', async (req, res) => {
  try {
    const providerId = parseInt(req.params.id, 10);
    const { jsRender, scrapingMethod } = req.body;

    logger.info('[SCRAPING_METHOD_UPDATE] Updating provider scraping settings', {
      providerId,
      jsRender,
      scrapingMethod
    });

    await pgPool.query(
      `UPDATE providers
       SET js_render = $1,
           scraping_method = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [jsRender || false, scrapingMethod || 'firecrawl', providerId]
    );

    res.json({
      success: true,
      message: 'Scraping method updated',
      jsRender,
      scrapingMethod
    });
  } catch (error) {
    logger.error('Failed to update scraping method', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/providers/:id', async (req, res) => {
  try {
    const providerId = parseInt(req.params.id, 10);
    const {'''

    if old_provider_update in content and '/api/providers/:id/scraping-method' not in content:
        content = content.replace(old_provider_update, new_provider_update)
        print("Patch 4: Added scraping method update endpoint")
        patches_applied += 1
    else:
        print("Patch 4: Provider update pattern not found or already patched")

    # Patch 6: Update provider PUT endpoint to handle jsRender and scrapingMethod
    old_provider_fields = '''    const {
      name,
      slug,
      domain,
      entryUrl,
      base_urls,
      crawlDepth,
      urlPatterns,
      excludePatterns,
      contentSelectors,
      schedule,
      autoTransform,
      autoTranslate,
      is_active,
      folder_id
    } = req.body;'''

    new_provider_fields = '''    const {
      name,
      slug,
      domain,
      entryUrl,
      base_urls,
      crawlDepth,
      urlPatterns,
      excludePatterns,
      contentSelectors,
      schedule,
      autoTransform,
      autoTranslate,
      jsRender,
      scrapingMethod,
      is_active,
      folder_id
    } = req.body;'''

    if old_provider_fields in content:
        content = content.replace(old_provider_fields, new_provider_fields)
        print("Patch 5: Updated provider fields to include jsRender and scrapingMethod")
        patches_applied += 1
    else:
        print("Patch 5: Provider fields pattern not found")

    # Patch 7: Update the SQL query to save jsRender and scrapingMethod
    old_provider_sql = '''    const result = await pgPool.query(
      `UPDATE providers SET
        name = $1,
        domain = $2,
        entry_url = $3,
        crawl_depth = $4,
        url_patterns = $5,
        exclude_patterns = $6,
        content_selectors = $7,
        schedule = $8,
        auto_transform = $9,
        auto_translate = $10,
        is_active = $11,
        folder_id = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING *`,
      [
        name,
        domain,
        entryUrl,
        crawlDepth || 2,
        urlPatterns || [],
        excludePatterns || [],
        contentSelectors || '',
        schedule || 'manual',
        autoTransform !== false,
        autoTranslate === true,
        is_active !== false,
        folder_id || null,
        providerId
      ]
    );'''

    new_provider_sql = '''    const result = await pgPool.query(
      `UPDATE providers SET
        name = $1,
        domain = $2,
        entry_url = $3,
        crawl_depth = $4,
        url_patterns = $5,
        exclude_patterns = $6,
        content_selectors = $7,
        schedule = $8,
        auto_transform = $9,
        auto_translate = $10,
        is_active = $11,
        folder_id = $12,
        js_render = $13,
        scraping_method = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *`,
      [
        name,
        domain,
        entryUrl,
        crawlDepth || 2,
        urlPatterns || [],
        excludePatterns || [],
        contentSelectors || '',
        schedule || 'manual',
        autoTransform !== false,
        autoTranslate === true,
        is_active !== false,
        folder_id || null,
        jsRender === true,
        scrapingMethod || 'firecrawl',
        providerId
      ]
    );'''

    if old_provider_sql in content:
        content = content.replace(old_provider_sql, new_provider_sql)
        print("Patch 6: Updated provider SQL to save jsRender and scrapingMethod")
        patches_applied += 1
    else:
        print("Patch 6: Provider SQL pattern not found")

    # Patch 8: Update GET providers to include jsRender and scrapingMethod
    old_provider_select = '''      SELECT p.*,
        pr.name as project_name,
        f.name as folder_name,
        COUNT(DISTINCT a.id) as articles_count'''

    new_provider_select = '''      SELECT p.*,
        p.js_render as "jsRender",
        p.scraping_method as "scrapingMethod",
        pr.name as project_name,
        f.name as folder_name,
        COUNT(DISTINCT a.id) as articles_count'''

    if old_provider_select in content and '"jsRender"' not in content:
        content = content.replace(old_provider_select, new_provider_select)
        print("Patch 7: Updated provider SELECT to include jsRender and scrapingMethod")
        patches_applied += 1
    else:
        print("Patch 7: Provider SELECT pattern not found or already patched")

    # Patch 9: Add diagnostic recommendations endpoint
    diagnostic_endpoint = '''
// Get diagnostic recommendations for a provider
app.get('/api/providers/:id/diagnostic-recommendations', async (req, res) => {
  try {
    const providerId = parseInt(req.params.id, 10);

    // Get provider settings
    const providerResult = await pgPool.query(
      'SELECT js_render, scraping_method, domain FROM providers WHERE id = $1',
      [providerId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = providerResult.rows[0];

    // Get article stats
    const statsResult = await pgPool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'invalid') as invalid,
        COUNT(*) FILTER (WHERE
          content ILIKE '%cloudflare%' OR
          content ILIKE '%access denied%' OR
          content ILIKE '%please wait%' OR
          content ILIKE '%checking your browser%'
        ) as bot_blocked,
        AVG(CASE WHEN content IS NOT NULL THEN LENGTH(content) ELSE 0 END) as avg_content_length
      FROM articles
      WHERE provider_id = $1
    `, [providerId]);

    const stats = statsResult.rows[0];
    const recommendations = [];

    // Check for bot protection issues
    if (parseInt(stats.bot_blocked) > 0) {
      recommendations.push({
        type: 'BOT_PROTECTION',
        severity: 'high',
        message: 'Protection anti-bot détectée sur ' + stats.bot_blocked + ' article(s)',
        action: 'ENABLE_JS_RENDER',
        actionLabel: 'Activer JavaScript Rendering',
        currentValue: provider.js_render,
        suggestedValue: true
      });
    }

    // Check for short content
    if (parseFloat(stats.avg_content_length) < 500 && !provider.js_render) {
      recommendations.push({
        type: 'SHORT_CONTENT',
        severity: 'medium',
        message: 'Contenu court détecté (moyenne: ' + Math.round(stats.avg_content_length) + ' caractères)',
        action: 'TRY_JS_RENDER',
        actionLabel: 'Essayer avec JS Rendering',
        currentValue: provider.js_render,
        suggestedValue: true
      });
    }

    // Check for high failure rate
    const failureRate = parseInt(stats.total) > 0
      ? parseInt(stats.invalid) / parseInt(stats.total)
      : 0;

    if (failureRate > 0.3) {
      recommendations.push({
        type: 'HIGH_FAILURE_RATE',
        severity: 'high',
        message: 'Taux d\\'échec élevé: ' + Math.round(failureRate * 100) + '%',
        action: provider.js_render ? 'CHECK_SELECTORS' : 'CHANGE_METHOD',
        actionLabel: provider.js_render
          ? 'Vérifier les sélecteurs CSS'
          : 'Changer de méthode de collecte',
        currentValue: provider.scraping_method,
        suggestedValue: provider.js_render ? provider.scraping_method : 'playwright'
      });
    }

    logger.info('[DIAGNOSTIC] Provider recommendations generated', {
      providerId,
      totalArticles: stats.total,
      botBlocked: stats.bot_blocked,
      recommendationsCount: recommendations.length
    });

    res.json({
      provider: {
        id: providerId,
        domain: provider.domain,
        jsRender: provider.js_render,
        scrapingMethod: provider.scraping_method
      },
      stats: {
        total: parseInt(stats.total),
        invalid: parseInt(stats.invalid),
        botBlocked: parseInt(stats.bot_blocked),
        avgContentLength: Math.round(parseFloat(stats.avg_content_length) || 0)
      },
      recommendations
    });
  } catch (error) {
    logger.error('Failed to get diagnostic recommendations', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

'''

    # Find a good place to insert the endpoint (before a similar endpoint)
    if '/api/providers/:id/diagnostic-recommendations' not in content:
        # Insert before the diagnose endpoint
        insert_marker = "// Validate articles endpoint"
        if insert_marker in content:
            content = content.replace(insert_marker, diagnostic_endpoint + insert_marker)
            print("Patch 8: Added diagnostic recommendations endpoint")
            patches_applied += 1
        else:
            print("Patch 8: Could not find insertion point for diagnostic endpoint")
    else:
        print("Patch 8: Diagnostic endpoint already exists")

    with open('/home/debian/content-pipeline-ovh/server.js', 'w') as f:
        f.write(content)

    print(f"\nDone! {patches_applied} patches applied.")
    return patches_applied > 0

if __name__ == '__main__':
    import sys
    success = patch_server()
    sys.exit(0 if success else 1)
