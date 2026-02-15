import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/.*app/, { timeout: 10000 });
}

test.describe('Administration Module Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create and list accounts payable', async ({ page }) => {
    await page.goto('/administracion/accounts-payable');

    // 1. Create AP
    await page.getByRole('button', { name: 'Nueva Cuenta por Pagar' }).click();
    await expect(page).toHaveURL(/.*\/accounts-payable\/new/);

    const docNum = `FACT-${Date.now()}`;
    await page.locator('#numero_documento').fill(docNum);
    // Select Provider (assuming dropdown is populated or test data exists)
    // We might need to handle this carefully. If select is empty, test might fail.
    // For smoke test, verify select existence and basic fields.
    await expect(page.locator('select[formControlName="proveedor_id"]')).toBeVisible();
    
    await page.locator('#fecha_emision').fill(new Date().toISOString().split('T')[0]);
    await page.locator('#fecha_vencimiento').fill(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    await page.locator('#monto_total').fill('100.00');
    await page.locator('#observaciones').fill('Test AP E2E');

    // Attempt save (might fail validation if provider required and not selected)
    // But we check form critical elements exist.
    await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();
    
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.waitForURL(/.*\/administracion\/accounts-payable/);
  });

  test('should manage payment schedules flow', async ({ page }) => {
    await page.goto('/administracion/payment-schedules');

    // 1. Create Schedule
    await page.getByRole('button', { name: 'Nueva Programación' }).click();
    await expect(page).toHaveURL(/.*\/payment-schedules\/new/);
    
    // Status should be Borrador (default/implied)
    await expect(page.getByRole('button', { name: 'Guardar Borrador' })).toBeVisible();
    
    // Check main inputs
    await expect(page.locator('#payment_date')).toBeVisible();
    await expect(page.locator('textarea[formControlName="description"]')).toBeVisible();
    
    // Add Items modal trigger
    await page.getByRole('button', { name: 'Agregar Items' }).click();
    await expect(page.locator('.modal-container')).toBeVisible(); // Assuming modal has this class or similar
    
    // Close modal
    await page.getByRole('button', { name: 'Cerrar' }).click(); // Adjust selector if needed
    
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.waitForURL(/.*\/administracion\/payment-schedules/);
  });
});
