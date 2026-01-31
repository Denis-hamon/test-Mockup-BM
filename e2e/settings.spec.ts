import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display settings content', async ({ page }) => {
    // Check for any settings-related content
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
