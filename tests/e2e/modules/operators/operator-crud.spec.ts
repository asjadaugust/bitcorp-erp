import { test, expect } from '@playwright/test';

test.describe('Operator Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new operator', async ({ page, isMobile }) => {
    // Navigate to Operators module
    if (isMobile) {
      await page.goto('/operators');
    } else {
      await page.click('a[href="/operators"]');
    }
    await page.waitForURL('/operators');

    // Click "Nuevo Operador" button
    await page.click('button:has-text("Nuevo Operador")');
    await page.waitForURL('/operators/new');

    // Fill form
    const randomId = Math.floor(Math.random() * 10000);
    await page.fill('input[name="first_name"]', `Test${randomId}`);
    await page.fill('input[name="last_name"]', 'Operator');
    await page.fill('input[name="email"]', `operator${randomId}@test.com`);
    await page.fill('input[name="phone"]', '555-1234');
    await page.selectOption('select[name="status"]', 'active');
    await page.fill('input[name="employment_start_date"]', '2023-01-01');
    await page.fill('input[name="hourly_rate"]', '25');

    // Optional fields
    await page.fill('input[name="license_number"]', `LIC-${randomId}`);

    // Submit form
    await page.click('button:has-text("Save Operator")');

    // Verify success message
    await expect(page.locator('.alert-success')).toContainText('Operator created successfully!');

    // Verify redirection to list
    await page.waitForURL('/operators');

    // Verify new operator is in the list
    await expect(page.locator('table')).toContainText(`Test${randomId}`);
    await expect(page.locator('table')).toContainText('Operator');
  });
});
