import { test, expect } from '@playwright/test';

test.describe('Verify All Modules with Data', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3401');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should display equipment data', async ({ page }) => {
    await page.click('text=Equipos');
    await page.waitForLoadState('networkidle');

    // Check for equipment table
    const equipmentCount = await page.locator('table tbody tr').count();
    console.log(`Equipment count: ${equipmentCount}`);
    expect(equipmentCount).toBeGreaterThan(0);
  });

  test('should display operators data', async ({ page }) => {
    await page.click('text=Operadores');
    await page.waitForLoadState('networkidle');

    // Check for operators table
    const operatorCount = await page.locator('table tbody tr').count();
    console.log(`Operator count: ${operatorCount}`);
    expect(operatorCount).toBeGreaterThan(0);
  });

  test('should display daily reports data', async ({ page }) => {
    await page.click('text=Partes Diarios');
    await page.waitForLoadState('networkidle');

    // Check for reports table
    const reportCount = await page.locator('table tbody tr').count();
    console.log(`Daily report count: ${reportCount}`);
    expect(reportCount).toBeGreaterThan(0);
  });

  test('should display contracts data', async ({ page }) => {
    await page.click('text=Contratos');
    await page.waitForLoadState('networkidle');

    // Check for contracts table
    const contractCount = await page.locator('table tbody tr').count();
    console.log(`Contract count: ${contractCount}`);
    expect(contractCount).toBeGreaterThan(0);
  });

  test('should display projects data', async ({ page }) => {
    await page.click('text=Proyectos');
    await page.waitForLoadState('networkidle');

    // Check for projects table or cards
    const projectCount = await page.locator('table tbody tr, .project-card').count();
    console.log(`Project count: ${projectCount}`);
    expect(projectCount).toBeGreaterThan(0);
  });
});
