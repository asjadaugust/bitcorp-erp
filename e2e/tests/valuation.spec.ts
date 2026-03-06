import { test, expect } from '@playwright/test';

test.describe('Valuation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bitcorp.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should generate a valuation for a project', async ({ page }) => {
    // Navigate to Valuations
    await page.click('a[href="/valuations"]');
    await expect(page).toHaveURL('/valuations');

    // Click Generate Valuation
    await page.click('button:has-text("Generar Valorización")');

    // Fill Form
    // Assuming there's a project and date range
    // Select first project in dropdown
    await page.selectOption('select[name="projectId"]', { index: 1 });

    // Set dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    await page.fill('input[name="startDate"]', firstDay);
    await page.fill('input[name="endDate"]', lastDay);

    // Submit
    await page.click('button:has-text("Generar")');

    // Verify Success
    // Expect to see the new valuation in the list
    // This might require waiting for the list to reload
    await expect(page.locator('table')).toContainText(firstDay);

    // Optional: Verify amount if predictable
    // await expect(page.locator('td.amount').first()).not.toBeEmpty();
  });
});
