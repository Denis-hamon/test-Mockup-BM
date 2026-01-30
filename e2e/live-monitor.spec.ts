import { test, expect } from '@playwright/test';

test.describe('Live Monitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/live-monitor');
  });

  test('should display live monitor page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Live Monitor' })).toBeVisible();
  });

  test('should display queue status cards', async ({ page }) => {
    // Use more specific selectors since "Transform Queue" appears in multiple places
    await expect(page.getByText('Transform Queue').first()).toBeVisible();
    await expect(page.getByText('Translation Queue').first()).toBeVisible();
  });

  test('should display jobs section', async ({ page }) => {
    // The page shows "No Active Jobs" when there are no jobs, or job cards when there are jobs
    await expect(page.getByText('No Active Jobs').or(page.locator('.cursor-pointer'))).toBeVisible();
  });
});
