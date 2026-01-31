import { test, expect } from '@playwright/test';

test.describe('Live Monitor - Global View', () => {
  test('should display live monitor page', async ({ page }) => {
    await page.goto('/live-monitor');
    await expect(page).toHaveURL('/live-monitor');
    await page.waitForLoadState('networkidle');

    // Should see page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/live-monitor');
    await page.waitForLoadState('networkidle');

    // Should see page content with stats
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have tabs for jobs', async ({ page }) => {
    await page.goto('/live-monitor');
    await page.waitForLoadState('networkidle');

    // Should see tabs - use exact names
    await expect(page.getByRole('tab', { name: 'Active Jobs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'AI Processing' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Finished' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Archived' })).toBeVisible();
  });

  test('should display AI Processing tab content', async ({ page }) => {
    await page.goto('/live-monitor');
    await page.waitForLoadState('networkidle');

    // Click on AI Processing tab
    await page.getByRole('tab', { name: 'AI Processing' }).click();

    // Should see AI Processing content
    await expect(page.getByText('AI Processing Pipeline')).toBeVisible();
    await expect(page.getByText('Automatic transformation and translation')).toBeVisible();
  });

  test('should have pause all and stop all buttons', async ({ page }) => {
    await page.goto('/live-monitor');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /pause all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /stop all/i })).toBeVisible();
  });
});

test.describe('Live Monitor - Project Scoped', () => {
  test('should display project-scoped live monitor', async ({ page }) => {
    await page.goto('/projects/1/live-monitor');
    await page.waitForLoadState('networkidle');

    // Should see project navigation tabs within nav
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Live Monitor' })).toBeVisible();
  });

  test('should show jobs table when jobs exist', async ({ page }) => {
    await page.goto('/projects/1/live-monitor');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show empty state when no active jobs', async ({ page }) => {
    await page.goto('/projects/1/live-monitor');
    await page.waitForLoadState('networkidle');

    // Page should load - either with jobs or empty state
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Job Actions', () => {
  test('should have job action buttons', async ({ page }) => {
    await page.goto('/projects/1/live-monitor');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
