import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hot Stinger/);
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
  });

  test('projects page loads and displays projects', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('reporting page loads', async ({ page }) => {
    await page.goto('/reporting');
    await expect(page.getByRole('heading', { name: 'Reporting' })).toBeVisible();
  });
});

test.describe('Project Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/2');
    await page.waitForLoadState('networkidle');
  });

  test('project dashboard loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kimsufi' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nav').locator('text=Dashboard')).toBeVisible();
  });

  test('can navigate to collection points', async ({ page }) => {
    await page.locator('nav').locator('text=Collection Points').click();
    await expect(page).toHaveURL(/\/projects\/2\/collection-points/);
  });

  test('can navigate to live monitor', async ({ page }) => {
    await page.locator('nav').locator('text=Live Monitor').click();
    await expect(page).toHaveURL(/\/projects\/2\/live-monitor/);
  });

  test('can navigate to repository', async ({ page }) => {
    await page.locator('nav').locator('text=Repository').click();
    await expect(page).toHaveURL(/\/projects\/2\/repository/);
  });

  test('can navigate to AI Guidelines', async ({ page }) => {
    await page.locator('nav').locator('text=AI Guidelines').click();
    await expect(page).toHaveURL(/\/projects\/2\/ai-guidelines/);
    await expect(page.getByRole('heading', { name: 'AI Guidelines' })).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to settings', async ({ page }) => {
    await page.locator('nav').locator('text=Settings').click();
    await expect(page).toHaveURL(/\/projects\/2\/settings/);
    await expect(page.getByRole('heading', { name: 'Project Settings' })).toBeVisible({ timeout: 10000 });
  });
});
