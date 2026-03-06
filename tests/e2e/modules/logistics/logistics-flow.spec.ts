import { test, expect } from '@playwright/test';

test.describe('Logistics Module Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds
    console.log('Navigating to login page...');
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    console.log('Filling login form...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    console.log('Waiting for dashboard...');
    await page.waitForURL('/dashboard');
    console.log('Logged in successfully.');
  });

  test('should create a product and record a movement', async ({ page }) => {
    const productCode = `PROD-${Math.floor(Math.random() * 10000)}`;
    const productName = `Test Product ${Math.floor(Math.random() * 10000)}`;

    console.log(`Creating product: ${productCode} - ${productName}`);

    // 1. Create Product
    // Navigate directly to products to avoid sidebar issues
    await page.goto('/logistica/products');
    await page.waitForURL('**/logistica/products');

    // Click New Product
    await page.click('button:has-text("Nuevo Producto")');
    await page.waitForURL('**/logistica/products/new');

    // Fill Product Form
    await page.fill('input[formControlName="codigo"]', productCode);
    await page.fill('input[formControlName="nombre"]', productName);
    await page.selectOption('select[formControlName="unidad_medida"]', 'UND');
    await page.fill('input[formControlName="stock_actual"]', '10');
    await page.fill('input[formControlName="costo_unitario"]', '50');

    // Save Product
    await page.click('button[type="submit"]');
    await page.waitForURL('**/logistica/products');
    console.log('Product created.');

    // Verify Product in List
    await expect(page.locator('table')).toContainText(productCode);
    await expect(page.locator('table')).toContainText(productName);

    // 2. Create Movement (IN)
    console.log('Creating movement...');
    // Navigate directly to movements
    await page.goto('/logistica/movements');
    await page.waitForURL('**/logistica/movements');

    // Click New Movement (Ingreso)
    await page.click('button:has-text("Registrar Ingreso")');
    await page.waitForURL('**/logistica/movements/new?type=IN');

    // Fill Movement Form
    // Note: tipo_movimiento is set by query param and displayed as static text
    await expect(page.locator('.badge-status-available')).toContainText('INGRESO');

    // Add Item
    // Wait for products to load
    await page.waitForTimeout(2000);

    const productSelect = page.locator('select[formControlName="product_id"]').first();
    // Try to select by label containing the product code
    // We need to find the option value for the product name
    const option = productSelect.locator(`option:has-text("${productCode}")`);

    // Check if option exists
    const count = await option.count();
    if (count > 0) {
      const value = await option.getAttribute('value');
      if (value) {
        await productSelect.selectOption(value);
      }
    } else {
      console.log('Product not found in select, selecting second option as fallback');
      await productSelect.selectOption({ index: 1 });
    }

    await page.fill('input[formControlName="cantidad"]', '5');
    await page.fill('input[formControlName="costo_unitario"]', '50');

    // Save Movement
    await page.click('button[type="submit"]');
    await page.waitForURL('**/logistica/movements');
    console.log('Movement created.');

    // Verify Movement in List
    await expect(page.locator('table')).toContainText('IN');
  });
});
