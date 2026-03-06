import { test, expect } from '@playwright/test';

test.describe('Logistics Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new product', async ({ page }) => {
    // Navigate directly to avoid sidebar issues
    await page.goto('/logistica/products');
    await page.waitForURL('**/logistica/products');

    // Click New Product
    await page.click('text=Nuevo Producto');
    await page.waitForURL('**/logistica/products/new');

    // Fill Form
    const uniqueCode = `PROD-${Date.now()}`;
    await page.fill('input[formControlName="codigo"]', uniqueCode);
    await page.fill('input[formControlName="nombre"]', 'Test Product ' + uniqueCode);
    await page.selectOption('select[formControlName="unidad_medida"]', 'UND');
    await page.fill('input[formControlName="costo_unitario"]', '10.50');

    // Submit
    await page.click('button[type="submit"]');

    // Verify Redirect and List
    await page.waitForURL('**/logistica/products');
    await expect(page.locator('table')).toContainText(uniqueCode);
  });

  test('should register an inventory movement (IN)', async ({ page }) => {
    // Create a product first to ensure we have something to move
    const uniqueCode = `PROD-MOV-${Date.now()}`;
    await page.goto('/logistica/products/new');
    await page.fill('input[formControlName="codigo"]', uniqueCode);
    await page.fill('input[formControlName="nombre"]', 'Movement Test Product');
    await page.selectOption('select[formControlName="unidad_medida"]', 'UND');
    await page.fill('input[formControlName="costo_unitario"]', '10.00');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/logistica/products');

    // Now register movement
    await page.goto('/logistica/movements');
    await page.waitForURL('**/logistica/movements');

    // Click Register Income
    await page.click('text=Registrar Ingreso');
    await page.waitForURL('**/logistica/movements/new?type=IN');

    // Fill Header
    await page.fill('input[formControlName="numero_documento"]', `DOC-${Date.now()}`);

    // Add Item
    // Wait for product dropdown to be populated
    const productSelect = page.locator('select[formControlName="product_id"]').first();
    await expect(productSelect).toBeVisible();

    // Wait for our specific product to be in the list
    // We can search by text content of the option
    await expect(productSelect).toContainText(uniqueCode);

    // Select the product by label (easier than index)
    await productSelect.selectOption({ label: `${uniqueCode} - Movement Test Product` });

    await page.fill('input[formControlName="cantidad"]', '10');
    await page.fill('input[formControlName="costo_unitario"]', '15.00');

    // Submit
    await page.click('button[type="submit"]');

    // Verify Redirect and List
    await page.waitForURL('**/logistica/movements');
    // Should see the new movement (top of list usually)
    await expect(page.locator('table tbody tr').first()).toContainText('INGRESO');
  });
});
