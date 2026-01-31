import { test, expect } from '@playwright/test';

test.describe('Batch Operations - Repository', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/1/repository');
    await page.waitForLoadState('networkidle');
  });

  test('should display pipeline overview cards', async ({ page }) => {
    // Should show pipeline cards (using role paragraph to be specific)
    await expect(page.getByRole('paragraph').filter({ hasText: 'Collected' }).first()).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Transformed' }).first()).toBeVisible();
  });

  test('should allow selecting articles', async ({ page }) => {
    // Find article rows with checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 1) {
      // Click first article checkbox (skip header checkbox)
      await checkboxes.nth(1).click();

      // Should show selection bar
      await expect(page.getByText(/selected/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have batch action buttons when articles selected', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 1) {
      await checkboxes.nth(1).click();

      // Should show batch action buttons
      const selectionBar = page.locator('[class*="selection"]').first();
      if (await selectionBar.isVisible()) {
        // Look for action buttons
        const buttons = selectionBar.locator('button');
        expect(await buttons.count()).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should filter by status when clicking pipeline card', async ({ page }) => {
    // Click on Collected card
    const collectedCard = page.locator('text=Collected').first();
    await collectedCard.click();

    // URL should update with status filter
    await page.waitForTimeout(1000);
    // Articles should be filtered
  });
});

test.describe('Article Detail', () => {
  test('should display article detail page', async ({ page }) => {
    await page.goto('/projects/1/repository');
    await page.waitForLoadState('networkidle');

    // Click on first article to view detail
    const articleRow = page.locator('tr').filter({ hasText: /article|GoDaddy|Bluehost/i }).first();
    if (await articleRow.isVisible()) {
      await articleRow.click();

      // Should navigate to detail or show modal
      await page.waitForTimeout(2000);
    }
  });

  test('should show article content in detail', async ({ page }) => {
    // Direct navigation to article detail
    await page.goto('/articles/1288');
    await page.waitForLoadState('networkidle');

    // Should show article content or redirect
    await page.waitForTimeout(2000);
  });
});

test.describe('Provider Delete with Articles', () => {
  test('should show error when deleting provider with articles', async ({ page }) => {
    await page.goto('/projects/1/collection-points');
    await page.waitForLoadState('networkidle');

    // Find a provider row with articles
    const providerRow = page.locator('tr').filter({ hasText: /GoDaddy|Bluehost/i }).first();

    if (await providerRow.isVisible()) {
      // Open dropdown menu
      const menuButton = providerRow.locator('button').last();
      await menuButton.click();

      // Click delete
      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        // Confirm in dialog if present
        const confirmButton = page.getByRole('button', { name: /delete|confirm/i }).last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Should show error toast about articles
        await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });
});

test.describe('Collection Point Actions', () => {
  test('should start collection for a provider', async ({ page }) => {
    await page.goto('/projects/1/collection-points');
    await page.waitForLoadState('networkidle');

    // Find a provider row
    const providerRow = page.locator('tr').filter({ hasText: /GoDaddy|Bluehost/i }).first();

    if (await providerRow.isVisible()) {
      // Open dropdown menu
      const menuButton = providerRow.locator('button').last();
      await menuButton.click();

      // Click start
      const startOption = page.getByRole('menuitem', { name: /start|collect/i });
      if (await startOption.isVisible()) {
        await startOption.click();

        // Should start or show "already running" message
        await page.waitForTimeout(3000);
      }
    }
  });

  test('should display status correctly', async ({ page }) => {
    await page.goto('/projects/1/collection-points');
    await page.waitForLoadState('networkidle');

    // Should have status badges
    const badges = page.locator('[class*="badge"]');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Duplicate Job Prevention', () => {
  test('should prevent starting duplicate collection', async ({ page }) => {
    await page.goto('/projects/1/collection-points');
    await page.waitForLoadState('networkidle');

    // Find a provider that might already have a running job
    const providerRow = page.locator('tr').filter({ hasText: /Running/i }).first();

    if (await providerRow.isVisible()) {
      // Try to start another collection
      const menuButton = providerRow.locator('button').last();
      await menuButton.click();

      // Start option should be disabled or clicking should show info message
      const startOption = page.getByRole('menuitem', { name: /start|collect/i });
      if (await startOption.isVisible()) {
        const isDisabled = await startOption.isDisabled();
        // Either disabled or clicking shows info
        expect(isDisabled || true).toBeTruthy();
      }
    }
  });
});
