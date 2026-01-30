import { test, expect } from '@playwright/test';

test.describe('Article Detail', () => {
  test('should display article detail page', async ({ page }) => {
    // First go to repository to get an article ID
    await page.goto('/repository');
    await page.waitForSelector('table tbody tr');

    // Click on first article
    const firstArticleLink = page.locator('table tbody tr').first().locator('a').first();
    await firstArticleLink.click();

    // Wait for navigation
    await page.waitForURL(/\/article\/\d+/);

    // Check page elements
    await expect(page.getByRole('button', { name: /Re-transform/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Translate All/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Publish/i })).toBeVisible();
  });

  test('should display content comparison tabs', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForSelector('table tbody tr');

    const firstArticleLink = page.locator('table tbody tr').first().locator('a').first();
    await firstArticleLink.click();

    await page.waitForURL(/\/article\/\d+/);

    // Check tabs
    await expect(page.getByRole('tab', { name: 'Side by Side' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Original' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Transformed' })).toBeVisible();
  });

  test('should display translation status', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForSelector('table tbody tr');

    const firstArticleLink = page.locator('table tbody tr').first().locator('a').first();
    await firstArticleLink.click();

    await page.waitForURL(/\/article\/\d+/);

    // Check translation status section
    await expect(page.getByText('Translation Status')).toBeVisible();
  });

  test('should navigate back to repository', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForSelector('table tbody tr');

    const firstArticleLink = page.locator('table tbody tr').first().locator('a').first();
    await firstArticleLink.click();

    await page.waitForURL(/\/article\/\d+/);

    // Click back button
    await page.locator('a[href="/repository"]').first().click();

    // Verify navigation back
    await expect(page).toHaveURL('/repository');
  });
});
