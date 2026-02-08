import { test, expect } from '@playwright/test';

test.describe('Contracts Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to contracts list', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/equipment/contracts');
    } else {
      // Navigate via Equipment module
      await page.click('a[href="/equipment"]');
      await expect(page).toHaveURL(/\/equipment/);
      await page.click('a[href="/equipment/contracts"]');
    }
    await expect(page).toHaveURL(/\/equipment\/contracts/);
    await expect(page.locator('.title-group h1')).toContainText('Contratos');
  });

  test('should create a new contract', async ({ page }) => {
    // First ensure we have at least one provider and one equipment
    // We can assume seed data or previous tests created them, but to be safe we could create them here.
    // For now, let's assume they exist and try to select the first option.

    await page.goto('/equipment/contracts');
    await page.click('button:has-text("Nuevo Contrato")');
    await expect(page).toHaveURL(/\/equipment\/contracts\/new/);

    const contractNumber = `CTR-${Date.now()}`;
    await page.fill('input#numero_contrato', contractNumber);

    // Select first available equipment and provider
    await page.waitForSelector('select#equipment_id');
    // Wait a bit for options to load
    await page.waitForTimeout(1000);
    await page.locator('select#equipment_id').selectOption({ index: 1 });

    await page.waitForSelector('select#provider_id');
    await page.locator('select#provider_id').selectOption({ index: 1 });

    await page.fill('input#fecha_inicio', '2025-01-01');
    await page.fill('input#fecha_fin', '2025-12-31');
    await page.fill('input#tarifa', '100');

    // Wait for button to be enabled
    const submitBtn = page.locator('button:has-text("Crear Contrato")');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    // Should redirect back to list
    await expect(page).toHaveURL(/\/equipment\/contracts/);
    await expect(page.locator('table')).toContainText(contractNumber);
  });
});
