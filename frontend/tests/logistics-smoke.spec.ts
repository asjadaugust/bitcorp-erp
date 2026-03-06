import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('Admin@123');
  await page.getByRole('button', { name: 'Login' }).click();
  // Wait for navigation to complete
  await page.waitForURL(/.*app/, { timeout: 10000 });
}

test.describe('Logistics Module Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should create, view, and list products', async ({ page }) => {
    await page.goto('/logistics/products');

    // 1. Create Product
    await page.getByRole('button', { name: 'Nuevo Producto' }).click();
    await expect(page).toHaveURL(/.*\/products\/new/);

    const testCode = `PROD-TEST-${Date.now()}`;
    await page.locator('#codigo').fill(testCode);
    await page.locator('#nombre').fill('Producto Prueba E2E');
    await page.locator('#categoria').selectOption('Herramientas');
    await page.locator('#unidad_medida').selectOption('UND');
    await page.locator('#stock_actual').fill('100');
    await page.locator('#precio_unitario').fill('50.00');

    await page.getByRole('button', { name: 'Guardar' }).click();

    // Allow time for toast/navigation
    await page.waitForURL(/.*\/logistics\/products/);

    // 2. Verify in List
    // Search for the new product
    await page.locator('input[placeholder="Buscar productos..."]').fill(testCode);
    await page.keyboard.press('Enter');

    // Wait for table to filter
    await expect(page.locator('table')).toContainText(testCode);
    // Verify Status Badge (Activo)
    await expect(page.locator(`.badge-status-available`)).toContainText('Activo');
  });

  test('should register movements (Ingreso/Salida)', async ({ page }) => {
    await page.goto('/logistics/movements');

    // 1. Register Ingreso
    await page.getByRole('button', { name: 'Registrar Ingreso' }).click();
    await expect(page).toHaveURL(/.*\/movements\/new\?type=entrada/);

    // Check Badge text
    await expect(page.locator('.badge-status-available')).toHaveText('INGRESO');

    // Fill Form (Basic)
    await page.locator('#numero_documento').fill(`DOC-IN-${Date.now()}`);
    // Add Item
    // Note: This assumes products exist. We might need to handle the dropdown carefully.
    // For smoke test, we verify the form loads and controls are present.
    await expect(page.locator('select[formControlName="producto_id"]')).toBeVisible();
    await expect(page.locator('input[formControlName="cantidad"]')).toBeVisible();

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.waitForURL(/.*\/logistics\/movements/);

    // 2. Register Salida
    await page.getByRole('button', { name: 'Registrar Salida' }).click();
    await expect(page).toHaveURL(/.*\/movements\/new\?type=salida/);

    // Check Badge text
    await expect(page.locator('.badge-status-retired')).toHaveText('SALIDA');
  });
});
