import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from './config';

test.describe('Spanish Alignment & Form Standardization Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Step 1: Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('Module Navigation and Spanish Headers', async ({ page }) => {
    const modules = [
      { name: 'Equipos', url: '/equipment', header: 'Equipos' },
      { name: 'Proveedores', url: '/providers', header: 'Gestión de Proveedores' },
      { name: 'Proyectos', url: '/projects', header: 'Proyectos' },
      { name: 'Contratos', url: '/contracts', header: 'Contratos' },
      { name: 'Valorizaciones', url: '/valuations', header: 'Valorizaciones' },
      { name: 'Mantenimiento', url: '/equipment/maintenance', header: 'Gestión de Mantenimiento' },
    ];

    for (const module of modules) {
      await page.goto(getUrl(module.url));
      await page.waitForLoadState('networkidle');
      const h1 = page.locator('h1');
      await expect(h1).toContainText(module.header);
      console.log(`✓ Module ${module.name} loaded with Spanish header.`);
    }
  });

  test('Equipment Form and Dropdown Spanish Values', async ({ page }) => {
    await page.goto(getUrl('/equipment/new'));

    // Check FormContainer title
    await expect(page.locator('h1')).toContainText('Nuevo Equipo');

    // Check for Spanish field labels
    await expect(page.locator('label:has-text("Código")')).toBeVisible();
    await expect(page.locator('label:has-text("Estado")')).toBeVisible();

    // Check Status dropdown options
    const statusSelect = page.locator('select[formControlName="estado"]');
    const options = await statusSelect.locator('option').allInnerTexts();
    const expectedOptions = ['Disponible', 'En Uso', 'Mantenimiento', 'Retirado'];

    for (const option of expectedOptions) {
      expect(options.some((o) => o.includes(option))).toBeTruthy();
    }
    console.log('✓ Equipment status dropdown uses Spanish labels.');
  });

  test('Validation Messages in Spanish', async ({ page }) => {
    await page.goto(getUrl('/equipment/new'));

    // Submit empty form to trigger validations
    await page.click('button:has-text("Crear Equipo")');

    // Check for Spanish validation errors
    // Assuming our ValidationErrorsComponent or hasError shows localized messages
    const errorMessages = page.locator('.error-msg, .alert-error, app-validation-errors');
    await expect(errorMessages.first()).toBeVisible();
    const text = await errorMessages.allInnerTexts();
    expect(text.some((t) => t.includes('es requerido') || t.includes('requerido'))).toBeTruthy();

    console.log('✓ Validation messages appear in Spanish.');
  });

  test('Project Form Refactor Verification', async ({ page }) => {
    await page.goto(getUrl('/projects/new'));

    // Verify FormContainer usage (title, icon, subtitle)
    await expect(page.locator('h1')).toContainText('Nuevo Proyecto');
    await expect(page.locator('.form-container')).toBeVisible();

    // Verify field names alignment (nombres/apellidos instead of first_name/last_name)
    // Wait, project form uses project info, let's check field labels
    await expect(page.locator('label:has-text("Código")')).toBeVisible();
    await expect(page.locator('label:has-text("Nombre")')).toBeVisible();

    console.log('✓ Project form structure verified.');
  });

  test('Provider Form Refactor Verification', async ({ page }) => {
    await page.goto(getUrl('/providers/new'));

    await expect(page.locator('h1')).toContainText('Nuevo Proveedor');
    await expect(page.locator('label:has-text("Razón Social")')).toBeVisible();
    await expect(page.locator('label:has-text("RUC")')).toBeVisible();

    console.log('✓ Provider form structure verified.');
  });

  test('Timesheet Form Refactor Verification', async ({ page }) => {
    await page.goto(getUrl('/operaciones/timesheets/new'));

    await expect(page.locator('h1')).toContainText('Nuevo Parte de Horas');
    await expect(page.locator('label:has-text("Inicio de Semana")')).toBeVisible();

    // Check Status dropdown
    const statusSelect = page.locator('select[id="status"]');
    const options = await statusSelect.locator('option').allInnerTexts();
    expect(options).toContain('Borrador');
    expect(options).toContain('Enviado');
    expect(options).toContain('Aprobado');
    expect(options).toContain('Rechazado');

    console.log('✓ Timesheet form structure and Spanish status verified.');
  });

  test('Daily Report Turno Verification', async ({ page }) => {
    await page.goto(getUrl('/operaciones/daily-reports/new'));

    const turnoSelect = page.locator('select[id="turno"]');
    const options = await turnoSelect.locator('option').allInnerTexts();
    expect(options).toContain('DIA');
    expect(options).toContain('NOCHE');

    console.log('✓ Daily Report turno options verified in Spanish.');
  });
});
