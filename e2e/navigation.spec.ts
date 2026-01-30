import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through all main pages', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Navigate to Collection Points
    await page.getByRole('link', { name: /Collection Points/i }).first().click();
    await expect(page).toHaveURL('/collection-points');
    await expect(page.getByRole('heading', { name: 'Collection Points', exact: true })).toBeVisible();

    // Navigate to Live Monitor
    await page.getByRole('link', { name: /Live Monitor/i }).first().click();
    await expect(page).toHaveURL('/live-monitor');
    await expect(page.getByRole('heading', { name: 'Live Monitor' })).toBeVisible();

    // Navigate to Content Repository
    await page.getByRole('link', { name: /Content Repository/i }).first().click();
    await expect(page).toHaveURL('/repository');
    await expect(page.getByRole('heading', { name: 'Content Repository' })).toBeVisible();

    // Navigate to Settings
    await page.getByRole('link', { name: /Settings/i }).first().click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).first().click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should display sidebar with Hot Stinger branding', async ({ page }) => {
    await page.goto('/');

    // Check for Hot Stinger branding in sidebar
    await expect(page.getByText('Hot Stinger').first()).toBeVisible();
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Should show 404 or redirect to home
    // Depending on implementation, adjust this assertion
    await expect(page.getByText(/not found/i).or(page.getByRole('heading', { name: 'Dashboard' }))).toBeVisible();
  });
});
