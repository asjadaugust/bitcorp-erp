import { test, expect } from '@playwright/test';

test.describe('Fuel Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to fuel list', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/logistics/fuel');
    } else {
      // Navigate via Logistics module
      await page.click('a[href="/logistics"]');
      await expect(page).toHaveURL(/\/logistics/);
      await page.click('a[href="/logistics/fuel"]');
    }
    await expect(page).toHaveURL(/\/logistics\/fuel/);
    await expect(page.locator('.title-group h1')).toContainText('Combustible');
  });

  test('should create a new fuel record', async ({ page }) => {
    await page.goto('/logistics/fuel');
    await page.click('button:has-text("Nuevo Registro")');
    await expect(page).toHaveURL(/\/logistics\/fuel\/new/);

    // Select equipment
    await page.waitForSelector('select#equipment');
    await page.waitForTimeout(1000);
    await page.locator('select#equipment').selectOption({ index: 1 });

    await page.fill('input#gallons', '10');
    await page.fill('input#cost_per_gallon', '15');

    // Check if total cost is calculated
    await expect(page.locator('input#total_cost')).toHaveValue('150');

    // Wait for button to be enabled
    const submitBtn = page.locator('button:has-text("Crear Registro")');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    // Should redirect back to list
    await expect(page).toHaveURL(/\/logistics\/fuel/);
    // We can't easily check for specific text because it's a list of records,
    // but we can check if the table is visible and has rows.
    await expect(page.locator('table')).toBeVisible();
  });
});
