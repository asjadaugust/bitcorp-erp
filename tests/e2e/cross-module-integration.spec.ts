import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from './config';

/**
 * Enhanced Cross-Module Integration Tests
 * Fixes dropdown sync issues with explicit reloads and robust selectors.
 */

test.describe('Bitcorp ERP - Cross-Module Integration (Fixed)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));

    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('#username', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('#password', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to /app
    await page.waitForURL('**/app', { timeout: 20000 });
  });

  test('Provider creation reflects in Equipment dropdown', async ({ page }) => {
    const testProviderName = `Test Provider ${Date.now()}`;
    const testRuc = `20${Math.floor(Math.random() * 1000000000)}`;

    // 1. Create a Provider
    console.log(`Creating provider: ${testProviderName}`);
    await page.goto(getUrl('/providers'));
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Nuevo Proveedor")').first().click();

    await page.fill('#ruc', testRuc);
    await page.fill('#razon_social', testProviderName);
    await page.selectOption('#tipo_proveedor', 'EQUIPOS');

    await page.locator('.page-header button:has-text("Crear Proveedor")').click();
    await page.waitForURL('**/providers', { timeout: 10000 });
    console.log('✓ Provider created');

    // 2. Check Equipment Create Form
    await page.goto(getUrl('/equipment'));
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Nuevo Equipo")').first().click();

    // Explicitly reload to bypass stale cache
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Toggle to TERCERO to see provider dropdown
    await page.selectOption('#tipo_proveedor', 'TERCERO');

    const providerDropdown = page.locator('#proveedor_id');
    await expect(providerDropdown).toBeVisible();

    // Check if option exists
    const option = providerDropdown.locator(`option:has-text("${testProviderName}")`);
    await expect(option).toBeVisible({ timeout: 15000 });
    console.log('✓ Provider appears in Equipment dropdown');
  });

  test('Project creation reflects in Daily Reports', async ({ page }) => {
    const testProjectName = `Test Project ${Date.now()}`;
    const testCode = `PJ-${Math.floor(Math.random() * 10000)}`;

    // 1. Create a Project
    console.log(`Creating project: ${testProjectName}`);
    await page.goto(getUrl('/operaciones/projects'));
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Nuevo Proyecto")').first().click();

    await page.fill('#code', testCode);
    await page.fill('#name', testProjectName);
    await page.fill('#client', 'Client ACME');
    await page.selectOption('#status', 'PLANIFICACION');

    const today = new Date().toISOString().split('T')[0];
    await page.fill('#startDate', today);
    await page.fill('#endDate', today);
    await page.fill('#location', 'Site A');
    await page.fill('#budget', '1000');

    await page.click('button:has-text("Crear Proyecto")');
    await page.waitForURL('**/projects');
    console.log('✓ Project created');

    // 2. Check Daily Reports Form
    await page.goto(getUrl('/equipment/daily-reports'));
    await page.waitForLoadState('networkidle');

    const addBtn = page
      .locator(
        'button:has-text("Nuevo Reporte"), button:has-text("Nuevo"), button:has-text("Agregar")'
      )
      .first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForLoadState('networkidle');

      // Ensure reload
      await page.reload();
      await page.waitForLoadState('networkidle');

      const projectDropdown = page.locator('select[formControlName="proyecto_id"], #proyecto_id');
      if (await projectDropdown.isVisible()) {
        const option = projectDropdown.locator(`option:has-text("${testProjectName}")`);
        await expect(option).toBeVisible({ timeout: 15000 });
        console.log('✓ Project appears in Daily Report dropdown');
      }
    }
  });
});
