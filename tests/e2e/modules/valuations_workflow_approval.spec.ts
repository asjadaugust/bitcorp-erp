import { test, expect } from '@playwright/test';

test.describe('Valuations Workflow - Approval Process (WS-2 & WS-3)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button:has-text("Iniciar Sesión")');
    // Wait for redirect to /app or /dashboard
    await page.waitForURL(/\/app|\/dashboard/);
  });

  test('should complete the full approval workflow from BORRADOR to APROBADO', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER-CONSOLE: ${msg.text()}`));

    // Listen for alert dialog and accept it
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. Navigate to Valuations
    await page.goto('/equipment/valuations');
    
    // 2. Find the Feb 2026 valuation we generated in WS-1
    console.log('Step 2: Locating Feb 2026 valuation...');
    const searchInput = page.getByPlaceholder('Buscar por contrato, factura...');
    await searchInput.fill('CONT-2025-001');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    
    const febRow = page.locator('tr').filter({ hasText: 'CONT-2025-001' }).filter({ hasText: '01/02/2026' });
    await expect(febRow).toBeVisible();
    
    // Ensure it is in BORRADOR state
    await expect(febRow.locator('td').filter({ hasText: 'BORRADOR' })).toBeVisible();

    // 3. View Details
    await febRow.locator('button[title="Ver Detalles"]').click();
    await page.waitForURL(/\/\d+(\/edit)?/);
    await page.waitForTimeout(2000);

    // 4. BORRADOR -> PENDIENTE
    console.log('Step 4: Submitting Draft (BORRADOR -> PENDIENTE)...');
    await page.click('button:has-text("Marcar como Pendiente")');
    await expect(page.locator('.status-badge')).toContainText('Pendiente');

    // 5. Try PENDIENTE -> EN_REVISION (should fail or button hidden without conformity)
    console.log('Step 5: Verifying conformity gate...');
    const submitForReviewBtn = page.locator('button:has-text("Enviar a Revisión")');
    await expect(submitForReviewBtn).toBeVisible();
    await submitForReviewBtn.click();
    
    // It should show an error or stay in PENDIENTE because conformity is missing
    // Based on implementation, it might show a flash message or error dialog
    await page.waitForTimeout(2000);
    await expect(page.locator('.status-badge')).toContainText('Pendiente');

    // 6. Register Conformity
    console.log('Step 6: Registering Provider Conformity...');
    await page.click('button:has-text("Registrar Conformidad")');
    await expect(page.locator('.modal-content h2')).toContainText('Registrar Conformidad');
    
    // Fill date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('.modal-body input[type="date"]', today);
    await page.fill('.modal-body textarea', 'Conformidad recibida vía correo.');
    await page.click('.modal-footer button:has-text("Registrar Conformidad")');
    
    // Verify conformity is registered
    await expect(page.locator('.conformidad-status.conformidad-ok')).toBeVisible();

    // 7. PENDIENTE -> EN_REVISION
    console.log('Step 7: Submitting for Review (PENDIENTE -> EN_REVISION)...');
    await page.click('button:has-text("Enviar a Revisión")');
    await page.waitForTimeout(2000);
    await expect(page.locator('.status-badge')).toContainText('En Revisión');

    // 8. EN_REVISION -> VALIDADO
    console.log('Step 8: Validating (EN_REVISION -> VALIDADO)...');
    await page.click('button:has-text("Validar")');
    await page.waitForTimeout(2000);
    await expect(page.locator('.status-badge')).toContainText('Validado');

    // 9. VALIDADO -> APROBADO
    console.log('Step 9: Approving (VALIDADO -> APROBADO)...');
    await page.click('button:has-text("Aprobar Valorización")');
    await expect(page.locator('.modal-content h2')).toContainText('Confirmar Aprobación');
    await page.click('.modal-footer button:has-text("Aprobar")');
    
    await page.waitForTimeout(2000);
    await expect(page.locator('.status-badge')).toContainText('Aprobado');
    
    console.log('Workflow complete!');
  });
});
