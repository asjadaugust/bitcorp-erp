import { test, expect } from '@playwright/test';

test.describe('Security Access Control', () => {
  test('should restrict access to admin routes for non-admin users', async ({ page }) => {
    // Login as Operator (assuming 'operator@bitcorp.com' exists)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'operador@bitcorp.com');
    await page.fill('input[name="password"]', 'operador123'); // Assuming default password
    await page.click('button[type="submit"]');

    // Verify login success (dashboard access)
    await expect(page).toHaveURL('/dashboard');

    // Attempt to access Admin User Management
    await page.goto('/admin/users');

    // Expect redirection or error
    // Either back to dashboard or login
    await expect(page).not.toHaveURL('/admin/users');
    // await expect(page.locator('text=Unauthorized')).toBeVisible(); // If toast
  });
});
