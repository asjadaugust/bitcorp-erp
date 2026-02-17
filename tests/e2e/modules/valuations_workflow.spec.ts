import { test, expect } from '@playwright/test';

test.describe('Valuations Workflow - Auto-Calculation (WS-1)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Iniciar Sesión")');
    // Wait for redirect to /app or /dashboard
    await page.waitForURL(/\/app|\/dashboard/);
  });

  test('should generate valuation for Feb 2026 and verify auto-calculation', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER-CONSOLE: ${msg.text()}`));

    // Listen for alert dialog and accept it
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. Navigate to Valuations
    await page.goto('/equipment/valuations');
    await expect(page.getByRole('heading', { name: 'Valorizaciones' })).toBeVisible();

    // 2. Open Generation Modal
    await page.click('button:has-text("Generar")');
    await expect(page.locator('.modal-content h3')).toContainText('Generar Valorizaciones');

    // 3. Select February 2026
    const monthDropdown = page.locator('.modal-body app-dropdown').first();
    await monthDropdown.click();
    await page.locator('.option-item:has-text("Febrero")').click();
    await page.locator('.modal-body label:has-text("Año")').click(); // Blur dropdown
    
    await page.locator('.modal-body input[type="number"]').click();
    await page.locator('.modal-body input[type="number"]').fill('2026');


    // 4. Confirm Generation
    console.log('Step 4: Confirming generation...');
    const confirmButton = page.locator('.modal-content .modal-footer button.btn-primary');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click({ force: true });

    // Wait for modal to close
    await expect(page.locator('.modal-content')).not.toBeVisible({ timeout: 15000 });

    // 5. Verify the new valuation in the list
    // Wait for a bit for the backend to process and UI to reload
    await page.waitForTimeout(5000);
    
    // 6. Verify row in list
    console.log('Step 6: Verifying row in list...');
    const searchInput = page.getByPlaceholder('Buscar por contrato, factura...');
    await searchInput.click();
    await searchInput.fill('CONT-2025-001');
    await searchInput.press('Enter');
    
    // Wait for the specific row for Feb 2026 to appear
    // The list should now be filtered
    await page.waitForTimeout(2000); // Wait for filter to apply
    const febRow = page.locator('tr').filter({ hasText: 'CONT-2025-001' }).filter({ hasText: '01/02/2026' });
    if (!await febRow.isVisible()) {
      // Try searching and pressing Enter again just in case
      await searchInput.click();
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
    }
    await expect(febRow).toBeVisible({ timeout: 15000 });

    // Verify Total (Gross Total: 7600.00)
    // Column 4 (Total)
    // Note: It might be "PEN7,600.00" or similar
    await expect(febRow.locator('td').nth(3)).toContainText('7,600.00');

    // 6. View Details
    await febRow.locator('button[title="Ver Detalles"]').click();
    await page.waitForURL(/\/\d+(\/edit)?/);
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: 'test-results/valuation-detail.png', fullPage: true });

    // 7. Verify detailed breakdown
    // Base amount
    const baseRow = page.locator('tr').filter({ hasText: 'Cantidad a Valorizar' });
    await expect(baseRow.locator('td').last()).toContainText('7,000.00');

    // Excess hours
    const excessRow = page.locator('tr').filter({ hasText: 'Horas en Exceso' });
    await expect(excessRow.locator('td').last()).toContainText('600.00');

    // Net value: (7000 + 600) - Deductions
    const netRow = page.locator('tr.row-total').filter({ hasText: 'VALORIZACION NETA' });
    await expect(netRow.locator('td').last()).toContainText('6,010.75');

    // IGV: 1081.94
    const igvRow = page.locator('tr').filter({ hasText: 'I.G.V. 18%' });
    await expect(igvRow.locator('td').last()).toContainText('1,081.94');

    // Final Total: 7,092.69
    const grandTotalRow = page.locator('tr.row-grand-total').filter({ hasText: 'NETO A FACTURAR' });
    await expect(grandTotalRow.locator('td').last()).toContainText('7,092.68');
  });
});
