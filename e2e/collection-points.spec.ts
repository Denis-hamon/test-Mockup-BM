import { test, expect } from '@playwright/test';

test.describe('Collection Points', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collection-points');
  });

  test('should display collection points page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Collection Points', exact: true })).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.getByText('Total Sources')).toBeVisible();
    await expect(page.getByText('Total Articles Collected')).toBeVisible();
    await expect(page.getByText('Avg Success Rate')).toBeVisible();
  });

  test('should display providers table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Source' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Articles' })).toBeVisible();
  });

  test('should open add provider modal', async ({ page }) => {
    await page.getByRole('button', { name: /Add Collection Point/i }).click();

    // Check modal is open - use more specific selector
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Collection Point' })).toBeVisible();

    // Check form fields exist
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#domain')).toBeVisible();
  });

  test('should close add provider modal on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /Add Collection Point/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should search providers', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search sources...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Hostinger');
    // Wait for filtering
    await page.waitForTimeout(500);

    // Verify table still displays
    await expect(page.getByRole('table')).toBeVisible();
  });
});
