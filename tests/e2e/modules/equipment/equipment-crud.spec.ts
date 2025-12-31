import { test, expect } from '@playwright/test';

test.describe('Equipment Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.fixme('should create a new equipment', async ({ page, isMobile }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    // Navigate to Equipment module
    if (isMobile) {
      await page.goto('/equipment');
    } else {
      await page.click('a[href="/equipment"]');
    }
    await page.waitForURL('/equipment');

    // Click "Agregar Equipo" button
    await page.getByRole('button', { name: 'Agregar Equipo' }).click();
    await page.waitForURL('/equipment/new');
    
    // Fill form
    const randomCode = `EQ-${Math.floor(Math.random() * 10000)}`;
    await page.fill('input[formControlName="code"]', randomCode);
    await page.fill('input[formControlName="name"]', 'Test Equipment Description');
    await page.fill('input[formControlName="brand"]', 'Caterpillar');
    await page.fill('input[formControlName="model"]', '320D');
    await page.selectOption('select[formControlName="status"]', 'available');
    await page.selectOption('select[formControlName="categoria_equipo"]', 'Excavadora');
    
    // Optional fields
    await page.fill('input[formControlName="año_fabricacion"]', '2023');
    await page.fill('input[formControlName="placa"]', 'ABC-123');
    await page.fill('input[formControlName="location"]', 'Site A');
    await page.fill('input[formControlName="hourmeter_reading"]', '1500');
    await page.selectOption('select[formControlName="tipo_combustible"]', 'diesel');
    
    // Submit form
    const submitBtn = page.locator('button:has-text("Crear Equipo")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Check for error alerts
    const errorAlert = page.locator('.alert-error');
    if (await errorAlert.isVisible()) {
      console.log('Error alert found:', await errorAlert.textContent());
    }

    // Verify redirection to list
    await page.waitForURL('/equipment');

    // Verify new equipment is in the list
    await expect(page.locator('table')).toContainText(randomCode);
    await expect(page.locator('table')).toContainText('Caterpillar');
    await expect(page.locator('table')).toContainText('320D');
  });
});
