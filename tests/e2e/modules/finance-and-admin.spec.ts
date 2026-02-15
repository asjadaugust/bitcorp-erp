import { test, expect } from '@playwright/test';

test.describe('Finance & Admin Modules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Providers', () => {
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
      page.on('console', (msg) => console.log(`BROWSER: ${msg.text()}`));
      page.on('pageerror', (err) => console.log(`BROWSER ERROR: ${err}`));
      page.on('requestfailed', (request) =>
        console.log(`REQUEST FAILED: ${request.url()} ${request.failure()?.errorText}`)
      );

      await page.goto('/providers');
      await page.click('button:has-text("Nuevo Proveedor")');
      await expect(page).toHaveURL('/providers/new');

      const ruc = `20${Date.now()}`;
      await page.fill('input#ruc', ruc);
      await page.fill('input#razon_social', 'Test Provider E2E');
      await page.selectOption('select#tipo_proveedor', 'EQUIPOS');

      await page.click('button:has-text("Crear Proveedor")');

      await expect(page).toHaveURL('/providers');
      await expect(page.locator('table')).toContainText(ruc);
    });
  });

  test.describe('Contracts', () => {
    test('should navigate to contracts list', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.goto('/contracts');
      } else {
        await page.click('a[href="/contracts"]');
      }
      await expect(page).toHaveURL('/contracts');
      await expect(page.locator('.title-group h1')).toContainText('Contratos');
    });

    test('should create a new contract', async ({ page }) => {
      await page.goto('/contracts');
      await page.click('button:has-text("Nuevo Contrato")');
      await expect(page).toHaveURL('/contracts/new');

      const contractCode = `CTR-${Date.now()}`;
      await page.fill('input#numero_contrato', contractCode);
      await page.fill('input#fecha_contrato', '2025-01-01');

      // Select first available equipment and provider
      await page.locator('select#equipo_id').selectOption({ index: 1 });
      await page.locator('select#proveedor_id').selectOption({ index: 1 });

      await page.fill('input#fecha_inicio', '2025-01-01');
      await page.fill('input#fecha_fin', '2025-12-31');
      await page.selectOption('select#moneda', 'PEN');
      await page.selectOption('select#tipo_tarifa', 'POR_HORA');
      await page.fill('input#tarifa', '150');
      await page.selectOption('select#estado', 'ACTIVO');

      await page.click('button:has-text("Crear Contrato")');

      await expect(page).toHaveURL('/contracts');
      await expect(page.locator('table')).toContainText(contractCode);
    });
  });
});
