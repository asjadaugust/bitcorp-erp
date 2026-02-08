import { test, expect } from '@playwright/test';

test.describe('Maintenance Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to maintenance list', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/equipment/maintenance');
    } else {
      // Navigate via Equipment module
      await page.click('a[href="/equipment"]');
      await expect(page).toHaveURL(/\/equipment/);
      await page.click('a[href="/equipment/maintenance"]');
    }
    await expect(page).toHaveURL(/\/equipment\/maintenance/);
    await expect(page.locator('.page-header h1')).toContainText('Programación de Mantenimiento');
  });

  test('should create a new maintenance record', async ({ page }) => {
    await page.goto('/equipment/maintenance');
    await page.click('button:has-text("Nuevo Mantenimiento")');
    await expect(page).toHaveURL(/\/equipment\/maintenance\/new/);

    // Select equipment
    await page.waitForSelector('select#equipment');
    await page.waitForTimeout(1000);
    await page.locator('select#equipment').selectOption({ index: 1 });

    await page.selectOption('select#maintenance_type', 'preventive');
    await page.fill('textarea#description', 'Test Maintenance E2E');
    await page.fill('input#start_date', '2025-01-01');
    await page.fill('input#cost', '500');
    await page.selectOption('select#status', 'scheduled');

    // Wait for button to be enabled
    const submitBtn = page.locator('button:has-text("Crear Mantenimiento")');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    // Should redirect back to list
    await expect(page).toHaveURL(/\/equipment\/maintenance/);
    await expect(page.locator('table')).toContainText('Test Maintenance E2E');
  });
});
