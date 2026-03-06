import { test, expect } from '@playwright/test';

test.describe('Verify All Modules with Data', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER: ${msg.text()}`));

    // Login as admin
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should display equipment data', async ({ page }) => {
    await page.click('text=Equipo Mecánico');
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

    // Wait for either grid or empty state
    await page.waitForSelector('.reports-grid, .empty-state');

    // Check for reports cards (Daily Reports uses cards, not table)
    const reportCount = await page.locator('.report-card').count();
    console.log(`Daily report count: ${reportCount}`);
    if (reportCount === 0) {
      // Check if empty state is shown
      const emptyState = await page.locator('.empty-state').isVisible();
      console.log(`Empty state visible: ${emptyState}`);
      if (emptyState) {
        console.log('No reports found message displayed');
      }
    }
    expect(reportCount).toBeGreaterThan(0);
  });

  test('should display contracts data', async ({ page }) => {
    await page.click('text=Equipo Mecánico');
    await page.waitForLoadState('networkidle');
    await page.click('text=Contratos');
    await page.waitForLoadState('networkidle');

    // Check for contracts table
    const contractCount = await page.locator('table tbody tr').count();
    console.log(`Contract count: ${contractCount}`);
    expect(contractCount).toBeGreaterThan(0);
  });

  test('should display projects data', async ({ page }) => {
    await page.click('text=Operaciones');
    await page.waitForLoadState('networkidle');
    await page.click('text=Proyectos');
    await page.waitForLoadState('networkidle');

    // Check for projects table or cards
    const projectCount = await page.locator('table tbody tr, .project-card').count();
    console.log(`Project count: ${projectCount}`);
    expect(projectCount).toBeGreaterThan(0);
  });

  test('should display SIG data', async ({ page }) => {
    await page.click('text=SIG');
    await page.waitForLoadState('networkidle');

    // Check for SIG dashboard
    await expect(page.locator('main h1')).toContainText('Sistema Integrado de Gestión');
    await page.waitForSelector('table tbody tr');
    const docCount = await page.locator('table tbody tr').count();
    expect(docCount).toBeGreaterThan(0);
  });

  test('should display Tenders data', async ({ page }) => {
    await page.click('text=Licitaciones');
    await page.waitForLoadState('networkidle');

    // Check for Tenders list
    await expect(page.locator('main h1')).toContainText('Licitaciones');
    const tenderCount = await page.locator('table tbody tr').count();
    expect(tenderCount).toBeGreaterThan(0);
  });

  test('should display SST data', async ({ page }) => {
    await page.click('text=SST');
    await page.waitForLoadState('networkidle');

    // Check for SST list
    await expect(page.locator('main h1')).toContainText('Seguridad y Salud');
    const incidentCount = await page.locator('table tbody tr').count();
    expect(incidentCount).toBeGreaterThan(0);
  });

  test('should display Administration data', async ({ page }) => {
    await page.click('text=Administración');
    await page.waitForLoadState('networkidle');

    // Check for Cost Centers list
    await expect(page.locator('main h1')).toContainText('Centros de Costo');
    const ccCount = await page.locator('table tbody tr').count();
    expect(ccCount).toBeGreaterThan(0);
  });
});
