import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3420');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should navigate to Daily Reports module', async ({ page }) => {
    // Click on Daily Reports card
    const dailyReportsCard = page.locator('.module-card:has-text("Partes Diarios")');
    await expect(dailyReportsCard).toBeVisible();

    await dailyReportsCard.click();
    await page.waitForURL('**/daily-reports', { timeout: 5000 });

    // Verify we're on daily reports page
    await expect(page).toHaveURL(/daily-reports/);
    // Check for the page header h1 specifically (not the nav h1)
    await expect(page.locator('.page-header h1')).toContainText(/Partes Diarios|Daily Reports/i);
  });

  test('should navigate to Operators module', async ({ page }) => {
    // Click on Operators card
    const operatorsCard = page.locator('.module-card:has-text("Operadores")');
    await expect(operatorsCard).toBeVisible();

    await operatorsCard.click();
    await page.waitForURL('**/operators', { timeout: 5000 });

    // Verify we're on operators page
    await expect(page).toHaveURL(/operators/);
    // Check for the page header h1 specifically (not the nav h1)
    await expect(page.locator('.page-header h1')).toContainText(/Operadores|Operators/i);
  });

  test('should navigate to Equipment module', async ({ page }) => {
    // Click on Equipment card
    const equipmentCard = page.locator('.module-card:has-text("Gestión de Equipo Mecánico")');
    await expect(equipmentCard).toBeVisible();

    await equipmentCard.click();
    await page.waitForURL('**/equipment', { timeout: 5000 });

    // Verify we're on equipment page
    await expect(page).toHaveURL(/equipment/);
  });

  test('should persist login after page reload', async ({ page }) => {
    // Verify we're logged in
    await expect(page).toHaveURL(/dashboard/);

    // Reload the page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('.control-panel')).toBeVisible();

    // User name should still be visible in nav
    await expect(page.locator('.user-name')).toBeVisible();
  });

  test('should navigate back to dashboard from any module', async ({ page }) => {
    // Go to equipment
    await page.click('.module-card:has-text("Gestión de Equipo Mecánico")');
    await page.waitForURL('**/equipment', { timeout: 5000 });

    // Click back button
    await page.click('button:has-text("Volver")');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/dashboard/);

    // Go to daily reports
    await page.click('.module-card:has-text("Partes Diarios")');
    await page.waitForURL('**/daily-reports', { timeout: 5000 });

    // Click back button again
    await page.click('button:has-text("Volver")');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});
