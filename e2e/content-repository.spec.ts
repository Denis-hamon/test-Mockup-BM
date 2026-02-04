import { test, expect } from '@playwright/test';

test.describe('Content Repository', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/2/repository');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with articles table', async ({ page }) => {
    // Wait for articles to load
    await page.waitForResponse(resp => resp.url().includes('/api/articles') && resp.status() === 200);
    // Check table is visible
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('displays article titles in table', async ({ page }) => {
    await page.waitForResponse(resp => resp.url().includes('/api/articles') && resp.status() === 200);
    // Wait for table body to have rows
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
  });

  test('has filter controls', async ({ page }) => {
    // Check for status filter
    await expect(page.locator('button:has-text("Status"), [placeholder*="status"]')).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to article detail', async ({ page }) => {
    await page.waitForResponse(resp => resp.url().includes('/api/articles') && resp.status() === 200);
    // Click on first article link
    const firstArticleLink = page.locator('table tbody tr a').first();
    await expect(firstArticleLink).toBeVisible({ timeout: 10000 });
    await firstArticleLink.click();
    // Should navigate to article detail page
    await expect(page).toHaveURL(/\/article\/\d+/);
  });
});
