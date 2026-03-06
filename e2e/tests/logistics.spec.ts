import { test, expect } from '@playwright/test';

test.describe('Logistics Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Logistics Manager (or Admin for simplicity if roles not fully set up in seed)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bitcorp.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should manage product lifecycle', async ({ page }) => {
    const productName = `Test Product ${Date.now()}`;

    // 1. Create Product
    await page.goto('/logistics/products');
    await page.click('button:has-text("Nuevo Producto")');
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="sku"]', `SKU-${Date.now()}`);
    await page.fill('input[name="category"]', 'Filtros');
    await page.click('button:has-text("Guardar")');

    // Verify creation
    await expect(page.locator('table')).toContainText(productName);

    // 2. Register Inbound Movement
    await page.goto('/logistics/movements');
    await page.click('button:has-text("Registrar Movimiento")');
    await page.selectOption('select[name="type"]', 'IN');
    // Select the product we just created - might need search or select by text
    // Simplified: Assuming it's at the top or searchable
    // await page.click('ng-select');
    // await page.type('ng-select input', productName);
    // await page.click('.ng-option:first-child');

    // For standard select:
    // await page.selectOption('select[name="productId"]', { label: productName });

    // NOTE: UI implementation details matter here. Assuming standard inputs for now.

    // 3. Register Outbound Movement
    // ... similar steps
  });
});
