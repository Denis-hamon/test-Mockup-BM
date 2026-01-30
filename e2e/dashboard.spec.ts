import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Hot Stinger/);

    // Check dashboard header
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Check stats cards are present
    await expect(page.getByText('Total Articles')).toBeVisible();
    await expect(page.getByText('Transformed').first()).toBeVisible();
    await expect(page.getByText('Translated').first()).toBeVisible();
  });

  test('should display activity feed', async ({ page }) => {
    await page.goto('/');

    // Check activity section
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
  });

  test('should navigate to collection points', async ({ page }) => {
    await page.goto('/');

    // Click on Collection Points in sidebar (use first() for multiple matches)
    await page.getByRole('link', { name: /Collection Points/i }).first().click();

    // Verify navigation
    await expect(page).toHaveURL('/collection-points');
    await expect(page.getByRole('heading', { name: 'Collection Points', exact: true })).toBeVisible();
  });
});
