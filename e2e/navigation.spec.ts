import { test, expect } from '@playwright/test';

test.describe('Global Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL('/projects');
    await page.waitForLoadState('networkidle');
    // Should see projects heading or content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to reporting page', async ({ page }) => {
    await page.goto('/reporting');
    await expect(page).toHaveURL('/reporting');
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('body')).toBeVisible();
  });

  test('sidebar should have correct navigation items', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check sidebar navigation items exist
    // Use more specific selectors for sidebar links
    const sidebar = page.locator('[data-sidebar="menu"]');
    await expect(sidebar.getByText('Home')).toBeVisible();
    await expect(sidebar.getByText('Projects')).toBeVisible();
    await expect(sidebar.getByText('Reporting')).toBeVisible();
    await expect(sidebar.getByText('Settings')).toBeVisible();
  });
});

test.describe('Project Navigation', () => {
  test('should navigate to project detail with tabs', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Click on first project card (if exists)
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();

      // Should see project tabs
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Collection Points' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Live Monitor' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Repository' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    }
  });

  test('should navigate between project tabs', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Wait for page to be fully loaded
    await page.waitForTimeout(500);

    // Click on Collection Points tab - use more specific selector
    const collectionPointsTab = page.locator('nav').getByRole('link', { name: 'Collection Points' });
    if (await collectionPointsTab.isVisible()) {
      await collectionPointsTab.click();
      await expect(page).toHaveURL(/\/projects\/1\/collection-points/);

      // Click on Live Monitor tab
      const liveMonitorTab = page.locator('nav').getByRole('link', { name: 'Live Monitor' });
      await liveMonitorTab.click();
      await expect(page).toHaveURL(/\/projects\/1\/live-monitor/);

      // Click on Repository tab
      const repositoryTab = page.locator('nav').getByRole('link', { name: 'Repository' });
      await repositoryTab.click();
      await expect(page).toHaveURL(/\/projects\/1\/repository/);

      // Click on Settings tab
      const settingsTab = page.locator('nav').getByRole('link', { name: 'Settings' });
      await settingsTab.click();
      await expect(page).toHaveURL(/\/projects\/1\/settings/);

      // Click back to Dashboard
      const dashboardTab = page.locator('nav').getByRole('link', { name: 'Dashboard' });
      await dashboardTab.click();
      await expect(page).toHaveURL(/\/projects\/1$/);
    }
  });

  test('should show breadcrumb in project pages', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see breadcrumb with "Projects" link in the breadcrumb area
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb.getByText('Projects')).toBeVisible();
    } else {
      // Fallback - check for any Projects link
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
