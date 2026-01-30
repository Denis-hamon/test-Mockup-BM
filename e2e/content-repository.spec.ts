import { test, expect } from '@playwright/test';

test.describe('Content Repository', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/repository');
  });

  test('should display content repository page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Content Repository' })).toBeVisible();
    await expect(page.getByText(/articles found/)).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    await expect(page.getByPlaceholder('Search articles...')).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible(); // Status filter
  });

  test('should display articles table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Language' })).toBeVisible();
  });

  test('should toggle between table and grid view', async ({ page }) => {
    // Initially in table view
    await expect(page.getByRole('table')).toBeVisible();

    // Click grid view button - it's the second icon button in the view toggle group
    // The buttons have rounded-r-none and rounded-l-none classes
    await page.locator('button.rounded-l-none').click();

    // Wait for view change and verify grid is shown
    await page.waitForTimeout(500);

    // In grid mode, table should be hidden and cards should appear
    // Grid view has article cards
    await expect(page.locator('.grid.grid-cols-1').first()).toBeVisible();
  });

  test('should search articles', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search articles...');
    await searchInput.fill('test');

    // Wait for search
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    // Click status dropdown
    await page.getByRole('combobox').first().click();

    // Select "Transformed"
    await page.getByRole('option', { name: 'Transformed' }).click();

    // Wait for filter
    await page.waitForTimeout(500);

    // Verify filter is applied
    await expect(page.getByRole('combobox').first()).toContainText('Transformed');
  });

  test('should have export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
  });

  test('should navigate to article detail', async ({ page }) => {
    // Wait for articles to load
    await page.waitForSelector('table tbody tr');

    // Click on first article title
    const firstArticleLink = page.locator('table tbody tr').first().locator('a').first();
    await firstArticleLink.click();

    // Should navigate to article detail page
    await expect(page).toHaveURL(/\/article\/\d+/);
  });
});
