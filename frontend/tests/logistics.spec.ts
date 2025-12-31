import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  // Wait for navigation to complete
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('Logistics Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display Product List with KLM Design System elements', async ({ page }) => {
    await page.goto('/logistica/products');

    // Verify Page Header
    await expect(page.locator('.page-title h1')).toHaveText('Gestión de Inventario');
    await expect(page.locator('.breadcrumb')).toBeVisible();

    // Verify Action Bar
    await expect(page.locator('.action-bar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuevo Producto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filtros Avanzados' })).toBeVisible();

    // Verify Stats Bar
    await expect(page.locator('.stats-bar')).toBeVisible();
    await expect(page.locator('.stat-card').first()).toBeVisible();

    // Verify Table
    await expect(page.locator('.equipment-table')).toBeVisible();
    await expect(page.locator('th.sticky-col.code-col')).toBeVisible(); // Check for sticky column
  });

  test('should display Movement List with KLM Design System elements', async ({ page }) => {
    await page.goto('/logistica/movements');

    // Verify Page Header
    await expect(page.locator('.page-title h1')).toHaveText('Movimientos de Inventario');

    // Verify Action Bar buttons
    await expect(page.getByRole('button', { name: 'Registrar Ingreso' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar Salida' })).toBeVisible();

    // Verify Table
    await expect(page.locator('.equipment-table')).toBeVisible();
  });

  test('should toggle filters in Product List', async ({ page }) => {
    await page.goto('/logistica/products');

    // Filters should be hidden initially
    await expect(page.locator('.filter-panel')).not.toBeVisible();

    // Click to show filters
    await page.getByRole('button', { name: 'Filtros Avanzados' }).click();
    await expect(page.locator('.filter-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ocultar Filtros' })).toBeVisible();

    // Click to hide filters
    await page.getByRole('button', { name: 'Ocultar Filtros' }).click();
    await expect(page.locator('.filter-panel')).not.toBeVisible();
  });
});
