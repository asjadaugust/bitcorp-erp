import { test, expect } from '@playwright/test';

test.describe('Valuations Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to valuations list', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/equipment/valuations');
    } else {
      // Navigate via Equipment module
      await page.click('a[href="/equipment"]');
      await expect(page).toHaveURL(/\/equipment/);
      await page.click('a[href="/equipment/valuations"]');
    }
    await expect(page).toHaveURL(/\/equipment\/valuations/);
    await expect(page.locator('.title-group h1')).toContainText('Valorizaciones');
  });

  test('should create a new valuation', async ({ page }) => {
    await page.goto('/equipment/valuations');
    await page.click('button:has-text("Nueva Valorización")');
    await expect(page).toHaveURL(/\/equipment\/valuations\/new/);

    // Select contract
    await page.waitForSelector('select#contract');
    await page.waitForTimeout(1000);
    await page.locator('select#contract').selectOption({ index: 1 });

    const randomYear = 2025 + Math.floor(Math.random() * 10);
    await page.fill('input#period_start', `${randomYear}-01-01`);
    await page.fill('input#period_end', `${randomYear}-01-31`);
    await page.fill('input#amount', '1000');
    await page.selectOption('select#status', 'pending');

    // Wait for button to be enabled
    const submitBtn = page.locator('button:has-text("Crear Valorización")');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    // Should redirect back to list
    await expect(page).toHaveURL(/\/equipment\/valuations/);
    await expect(page.locator('table')).toBeVisible();
  });
});
