import { test, expect } from '@playwright/test';

test.describe('Daily Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (who has access to daily reports list)
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');

    // Navigate to daily reports
    await page.goto('http://localhost:3420/daily-reports');
  });

  test('should list daily reports', async ({ page }) => {
    await expect(page.locator('.reports-container')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to create report form', async ({ page }) => {
    // Ensure the list is loaded
    await expect(page.locator('.reports-container')).toBeVisible({ timeout: 10000 });

    const createButton = page.locator('button:has-text("Nuevo Parte")');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    
    // Wait for navigation
    await Promise.all([
      page.waitForURL(/\/daily-reports\/new/, { timeout: 20000 }),
      createButton.click()
    ]);
    
    // Use last() to avoid strict mode violation (header h1 vs page h1)
    // The title should be "Nuevo Parte" for creation
    await expect(page.locator('h1').last()).toContainText('Nuevo Parte');
  });
});
