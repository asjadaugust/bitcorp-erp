import { test, expect } from '@playwright/test';

test.describe('Providers Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to providers list', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/providers');
    } else {
      await page.click('a[href="/providers"]');
    }
    await expect(page).toHaveURL('/providers');
    await expect(page.locator('.title-group h1')).toContainText('Proveedores');
  });

  test('should create a new provider', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
    page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} ${request.failure()?.errorText}`));

    await page.goto('/providers');
    await page.click('button:has-text("Nuevo Proveedor")');
    await expect(page).toHaveURL('/providers/new');

    const providerCode = `PROV-${Date.now()}`;
    const randomRuc = `20${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
    await page.fill('input#code', providerCode);
    await page.fill('input#business_name', 'Test Provider E2E');
    await page.fill('input#tax_id', randomRuc);
    await page.selectOption('select#provider_type', 'rental');
    await page.selectOption('select#status', 'active');
    
    // Fill optional fields
    await page.fill('input#contact_name', 'Juan Perez');
    await page.fill('input#email', 'juan@test.com');
    await page.fill('input#phone', '987654321');
    await page.fill('input#address', 'Av. Test 123');
    
    // Wait for button to be enabled
    const submitBtn = page.locator('button:has-text("Crear Proveedor")');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();
    
    // Should redirect back to list
    await expect(page).toHaveURL('/providers');
    await expect(page.locator('table')).toContainText('Test Provider E2E');
    await expect(page.locator('table')).toContainText(randomRuc);
  });
});
