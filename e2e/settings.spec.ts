import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  });

  test('should display tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Automation' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Queues' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Integrations' })).toBeVisible();
  });

  test('should display automation settings', async ({ page }) => {
    // Automation tab should be active by default
    await expect(page.getByText('Transformation Settings')).toBeVisible();
    await expect(page.getByText('Auto-transform new articles')).toBeVisible();
    await expect(page.getByText('Translation Settings')).toBeVisible();
    await expect(page.getByText('Auto-translate after transform')).toBeVisible();
  });

  test('should display queue status', async ({ page }) => {
    await page.getByRole('tab', { name: 'Queues' }).click();

    await expect(page.getByText('Transform Queue')).toBeVisible();
    await expect(page.getByText('Translation Queue')).toBeVisible();
    // Use first() to avoid strict mode violation
    await expect(page.getByText('Pending').first()).toBeVisible();
    await expect(page.getByText('Processing').first()).toBeVisible();
  });

  test('should display integrations and health status', async ({ page }) => {
    await page.getByRole('tab', { name: 'Integrations' }).click();

    await expect(page.getByText('System Health')).toBeVisible();
    await expect(page.getByText('PostgreSQL Database')).toBeVisible();
    await expect(page.getByText('Redis Cache')).toBeVisible();
    await expect(page.getByText('Firecrawl (Web Scraping)')).toBeVisible();
    await expect(page.getByText('OVHcloud AI Endpoints')).toBeVisible();
  });

  test('should display app info', async ({ page }) => {
    await page.getByRole('tab', { name: 'Integrations' }).click();

    await expect(page.getByText('Application Info')).toBeVisible();
    // Be more specific to avoid multiple matches
    await expect(page.locator('.font-medium').filter({ hasText: 'Hot Stinger' })).toBeVisible();
    await expect(page.getByText('2.0.0')).toBeVisible();
  });
});
