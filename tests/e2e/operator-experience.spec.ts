import { test, expect } from '@playwright/test';

test.describe('Operator Experience & Security', () => {
  test.slow(); // Mark this test suite as slow (triples the timeout)

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', (msg) => console.log(`BROWSER: ${msg.text()}`));

    // Login as operator
    await page.goto('/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operator/dashboard', { timeout: 30000 });

    // Verify token exists
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log('Token after login:', token ? 'Present' : 'Missing');
    expect(token).toBeTruthy();
  });

  test('Security: should not access admin routes', async ({ page }) => {
    // Try to access equipment module
    await page.goto('/equipment');

    // Check if token still exists
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log('Token after navigation:', token ? 'Present' : 'Missing');

    // Should be redirected back to operator dashboard
    await expect(page).toHaveURL(/operator\/dashboard/, { timeout: 10000 });

    // Try to access maintenance module
    await page.goto('/maintenance');
    await expect(page).toHaveURL(/operator\/dashboard/, { timeout: 10000 });
  });

  test('History: should view report details', async ({ page }) => {
    await page.goto('/operator/history');
    await page.waitForLoadState('networkidle');

    // Wait for the list to populate
    await expect(page.locator('.report-card').first()).toBeVisible({ timeout: 10000 });

    // Click "Ver" on the first report
    const viewButton = page.locator('button.action-btn.view').first();
    await viewButton.waitFor({ state: 'visible' });
    await viewButton.click();

    // Should navigate to details page
    await expect(page).toHaveURL(/\/operator\/daily-report\/\d+/, { timeout: 10000 });

    // Should see "Detalle de Parte Diario"
    await expect(page.getByRole('heading', { name: 'Detalle de Parte Diario' })).toBeVisible();

    // Fields should be readonly
    await expect(page.locator('input[formControlName="date"]')).not.toBeEditable();
  });

  test('History: should trigger PDF download', async ({ page }) => {
    await page.goto('/operator/history');
    await page.waitForLoadState('networkidle');

    // Wait for the list to populate
    await expect(page.locator('.report-card').first()).toBeVisible({ timeout: 10000 });

    // Setup dialog handler for alert
    page.on('dialog', async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      expect(dialog.message()).toContain('Descargando PDF');
      await dialog.accept();
    });

    // Click "PDF" on the first report
    const pdfButton = page.locator('button.action-btn.download').first();
    await pdfButton.waitFor({ state: 'visible' });
    await pdfButton.click();
  });
});
