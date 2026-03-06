import { test, expect } from '@playwright/test';

test.describe('Module Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Providers: should navigate to new provider form', async ({ page }) => {
    await page.goto('/providers');
    await page.click('button:has-text("Nuevo Proveedor")');
    await expect(page).toHaveURL('/providers/new');
    await expect(page.getByRole('heading', { name: 'Nuevo Proveedor' })).toBeVisible();
  });

  test('Contracts: should navigate to new contract form', async ({ page }) => {
    await page.goto('/equipment/contracts');
    await page.click('button:has-text("Nuevo Contrato")');
    await expect(page).toHaveURL('/equipment/contracts/new');
    await expect(page.getByRole('heading', { name: 'Nuevo Contrato' })).toBeVisible();
  });

  test('Fuel: should navigate to new fuel record form', async ({ page }) => {
    await page.goto('/logistics/fuel');
    await page.click('button:has-text("Nuevo Registro")');
    await expect(page).toHaveURL('/logistics/fuel/new');
    await expect(page.getByRole('heading', { name: 'Nuevo Registro' })).toBeVisible();
  });

  test('Maintenance: should navigate to new maintenance form', async ({ page }) => {
    await page.goto('/equipment/maintenance');
    await page.click('button:has-text("Nuevo Mantenimiento")');
    await expect(page).toHaveURL('/equipment/maintenance/new');
    await expect(page.getByRole('heading', { name: 'Nuevo Mantenimiento' })).toBeVisible();
  });

  test('Valuations: should navigate to new valuation form', async ({ page }) => {
    await page.goto('/equipment/valuations');
    await page.click('button:has-text("Nueva Valorización")');
    await expect(page).toHaveURL('/equipment/valuations/new');
    await expect(page.getByRole('heading', { name: 'Nueva Valorización' })).toBeVisible();
  });

  test('Projects: should navigate to projects list', async ({ page }) => {
    await page.goto('/operations/projects');
    // If it redirects to dashboard, this will fail
    await expect(page).toHaveURL('/operations/projects');
    await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible();
  });
});
