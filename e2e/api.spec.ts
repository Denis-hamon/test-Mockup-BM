import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBeDefined();
    expect(data.database.postgresql).toBe('ok');
    expect(data.database.redis).toBe('ok');
  });

  test('should return stats', async ({ request }) => {
    const response = await request.get('/api/stats');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.totalArticles).toBeDefined();
    expect(typeof data.totalArticles).toBe('number');
    expect(data.transformedArticles).toBeDefined();
    expect(data.translatedArticles).toBeDefined();
    expect(data.totalProviders).toBeDefined();
    expect(data.totalWords).toBeDefined();
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
    expect(provider.slug).toBeDefined();
  });

  test('should return articles', async ({ request }) => {
    const response = await request.get('/api/articles?limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBeTruthy();
  });

  test('should return single provider', async ({ request }) => {
    // First get list of providers to find a valid ID
    const listResponse = await request.get('/api/providers');
    const providers = await listResponse.json();

    if (providers.length === 0) {
      // Skip if no providers
      return;
    }

    const providerId = providers[0].id;
    const response = await request.get(`/api/providers/${providerId}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBeDefined();
  });

  test('should return jobs list', async ({ request }) => {
    const response = await request.get('/api/jobs');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
