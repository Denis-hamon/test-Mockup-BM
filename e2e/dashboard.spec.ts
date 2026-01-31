import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/');

    // Check page title - Hot Stinger title
    await expect(page).toHaveTitle(/Hot Stinger|Content/);

    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display page content', async ({ page }) => {
    await page.goto('/');

    // Wait for app to fully load
    await page.waitForLoadState('networkidle');

    // Page should have content
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
