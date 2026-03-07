import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from './config';

/**
 * Enhanced Comprehensive CRUD & Filters
 * Tests detailed form submission and filtering for major modules.
 */

test.describe('Bitcorp ERP - Detailed CRUD & Filters', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));

    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('#username', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('#password', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to /app
    await page.waitForURL('**/app', { timeout: 20000 });
    console.log('✓ Login successful');
  });

  test('Module: Equipment - Detailed CRUD', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForLoadState('networkidle');

    // CREATE - Specific text from equipment-list.component.ts
    await page.locator('.page-header button:has-text("Nuevo Equipo")').click();
    console.log('Clicked "Nuevo Equipo"');

    const testCode = `EQ-${Date.now()}`;
    await page.fill('#codigo_equipo', testCode);
    await page.selectOption('#categoria', 'Excavadora');
    await page.fill('#marca', 'CAT');
    await page.fill('#modelo', '336D');

    // Submit
    await page.locator('.page-header button:has-text("Crear Equipo")').click();
    await page.waitForURL('**/equipment', { timeout: 10000 });
    console.log('✓ Equipment created');

    // READ & FILTER
    const searchInput = page.locator('input[placeholder*="Buscar"], .search-input').first();
    await searchInput.fill(testCode);
    await page.waitForTimeout(1000);
    await expect(page.locator('table tbody tr').first()).toContainText(testCode);
  });

  test('Module: Providers - Detailed CRUD', async ({ page }) => {
    await page.goto(getUrl('/providers'));
    await page.waitForLoadState('networkidle');

    // CREATE - Specific text from provider-list.component.ts
    await page.locator('button:has-text("Nuevo Proveedor")').first().click();
    console.log('Clicked "Nuevo Proveedor"');

    const testRuc = `20${Date.now().toString().slice(-9)}`;
    const testName = `Test Provider ${Date.now()}`;

    await page.fill('#ruc', testRuc);
    await page.fill('#razon_social', testName);
    await page.selectOption('#tipo_proveedor', 'EQUIPOS');
    await page.fill('#correo_electronico', `test.${Date.now()}@example.com`);

    // Submit
    await page.locator('.page-header button:has-text("Crear Proveedor")').click();
    await page.waitForURL('**/providers', { timeout: 10000 });
    console.log('✓ Provider created');

    // READ & FILTER
    const searchInput = page.locator('input[placeholder*="Buscar"], .search-input').first();
    await searchInput.fill(testName);
    await page.waitForTimeout(1000);
    await expect(page.locator('table tbody tr').first()).toContainText(testName);
  });

  test('Module: Projects - Detailed CRUD', async ({ page }) => {
    await page.goto(getUrl('/operaciones/projects'));
    await page.waitForLoadState('networkidle');

    // CREATE - Specific text from project-list.component.ts
    await page.locator('button:has-text("Nuevo Proyecto")').first().click();
    console.log('Clicked "Nuevo Proyecto"');

    const testCode = `PJ-${Math.floor(Math.random() * 10000)}`;
    const testName = `Test Project ${Date.now()}`;

    await page.fill('#code', testCode);
    await page.fill('#name', testName);
    await page.fill('#client', 'Client ACME');
    await page.selectOption('#status', 'PLANIFICACION');

    const today = new Date().toISOString().split('T')[0];
    await page.fill('#startDate', today);
    await page.fill('#endDate', today);
    await page.fill('#location', 'Site A');
    await page.fill('#budget', '150000');

    // Submit
    await page.locator('.page-header button:has-text("Crear Proyecto")').click();
    await page.waitForURL('**/projects', { timeout: 10000 });
    console.log('✓ Project created');

    // READ & FILTER
    const searchInput = page.locator('input[placeholder*="Buscar"], .search-input').first();
    await searchInput.fill(testName);
    await page.waitForTimeout(1000);
    await expect(page.locator('table tbody tr').first()).toContainText(testName);
  });
});
