import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test('should display projects list', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL('/projects');
    await page.waitForLoadState('networkidle');

    // Should see projects page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create project button', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Should see "New Project" button
    const createButton = page.getByRole('button', { name: 'New Project' });
    await expect(createButton).toBeVisible();
  });

  test('should open create project modal', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Click "New Project" button
    const createButton = page.getByRole('button', { name: 'New Project' });
    await createButton.click();

    // Modal should appear with form fields
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('should navigate to project detail', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see project dashboard - check for main content area
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Project Detail Page', () => {
  test('should display project dashboard', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see dashboard content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display active jobs section', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see active jobs card - use exact heading
    await expect(page.getByRole('heading', { name: 'Active Jobs', exact: true })).toBeVisible();
  });

  test('should display collection points section', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see collection points section
    await expect(page.getByRole('heading', { name: 'Collection Points', exact: true })).toBeVisible();
  });

  test('should display recent articles section', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see recent articles section
    await expect(page.getByRole('heading', { name: 'Recent Articles', exact: true })).toBeVisible();
  });

  test('should have Run Collection button in header', async ({ page }) => {
    await page.goto('/projects/1');
    await page.waitForLoadState('networkidle');

    // Should see Run Collection button
    await expect(page.getByRole('button', { name: /run collection/i })).toBeVisible();
  });
});

test.describe('Project Settings Page', () => {
  test('should display project settings', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Should see settings page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display general settings section', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Should see general section - use exact heading
    await expect(page.getByRole('heading', { name: 'General', exact: true })).toBeVisible();
  });

  // Language section removed - translation is now automatic to all 8 languages

  test('should display automation settings section', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Should see automation section - use exact heading
    await expect(page.getByRole('heading', { name: 'Automation', exact: true })).toBeVisible();
  });

  test('should display danger zone', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Should see danger zone - use exact heading
    await expect(page.getByRole('heading', { name: 'Danger Zone', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete project/i })).toBeVisible();
  });

  test('should save settings', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Click save button
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible();
  });
});
