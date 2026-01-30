import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.app).toBe('Hot Stinger');
    expect(data.version).toBe('2.0.0');
    expect(data.status).toBe('ok');
    expect(data.services).toBeDefined();
  });

  test('should return stats', async ({ request }) => {
    const response = await request.get('/api/stats');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.totalArticles).toBeDefined();
    expect(typeof data.totalArticles).toBe('number');
    expect(data.languageCounts).toBeDefined();
  });

  test('should return providers', async ({ request }) => {
    const response = await request.get('/api/providers');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Check first provider structure
    const provider = data[0];
    expect(provider.id).toBeDefined();
    expect(provider.name).toBeDefined();
  });

  test('should return articles', async ({ request }) => {
    const response = await request.get('/api/articles?limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBeTruthy();
    expect(data.total).toBeDefined();
  });

  test('should return activity', async ({ request }) => {
    const response = await request.get('/api/activity?limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.activities).toBeDefined();
    expect(Array.isArray(data.activities)).toBeTruthy();
  });

  test('should return settings', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.autoTransform).toBeDefined();
    expect(data.autoTranslate).toBeDefined();
  });

  test('should return transform status', async ({ request }) => {
    const response = await request.get('/api/transform/status');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(typeof data.pending).toBe('number');
    expect(typeof data.processing).toBe('number');
    expect(typeof data.completed).toBe('number');
  });

  test('should return translate status', async ({ request }) => {
    const response = await request.get('/api/translate/status');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(typeof data.pending).toBe('number');
    expect(typeof data.processing).toBe('number');
    expect(typeof data.completed).toBe('number');
  });

  test('should return jobs', async ({ request }) => {
    const response = await request.get('/api/jobs');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.jobs).toBeDefined();
    expect(data.transformQueue).toBeDefined();
    expect(data.translateQueue).toBeDefined();
  });

  test('should filter articles by status', async ({ request }) => {
    const response = await request.get('/api/articles?status=transformed&limit=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.articles).toBeDefined();
    // All returned articles should be transformed
    for (const article of data.articles) {
      expect(article.status).toBe('transformed');
    }
  });
});
