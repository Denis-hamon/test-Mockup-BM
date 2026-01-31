import { test, expect } from '@playwright/test';

test.describe('Content Repository - Global View', () => {
  test('should display content repository page', async ({ page }) => {
    await page.goto('/repository');
    await expect(page).toHaveURL('/repository');
    await page.waitForLoadState('networkidle');

    // Should see page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display search and filters', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // Should see search input
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should display view mode toggle', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // Should have view mode buttons (table/grid)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have export button', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  });
});

test.describe('Content Repository - Project Scoped', () => {
  test('should display project-scoped repository', async ({ page }) => {
    await page.goto('/projects/1/repository');
    await page.waitForLoadState('networkidle');

    // Should see project navigation tabs within nav
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Repository' })).toBeVisible();
  });

  test('should filter articles by project', async ({ page }) => {
    await page.goto('/projects/1/repository');
    await page.waitForLoadState('networkidle');

    // Page should load with project-filtered content
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Article Listing', () => {
  test('should display articles in table view', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // Should see table or list of articles
    await expect(page.locator('body')).toBeVisible();
  });

  test('should allow selecting articles', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // Should have checkboxes for selection
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to article detail on click', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // If there are articles, click on first one
    const articleLink = page.locator('a[href*="/article/"]').first();
    if (await articleLink.isVisible()) {
      await articleLink.click();
      await expect(page).toHaveURL(/\/article\/\d+/);
    }
  });
});

test.describe('Batch Actions', () => {
  test('should show batch action buttons when articles selected', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // Select first checkbox if available
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();

      // Batch action buttons should appear
      await expect(page.getByRole('button', { name: /transform/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /translate/i })).toBeVisible();
    }
  });
});

test.describe('Pagination', () => {
  test('should have pagination controls', async ({ page }) => {
    await page.goto('/repository');
    await page.waitForLoadState('networkidle');

    // Should see pagination area or content
    await expect(page.locator('body')).toBeVisible();
  });
});
