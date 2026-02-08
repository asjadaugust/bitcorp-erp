import { test, expect } from '@playwright/test';

test.describe('Security Access Control', () => {
  test('Operator should be redirected to operator dashboard on login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Should land on operator dashboard
    await expect(page).toHaveURL('/operator/dashboard');
  });

  test('Operator should NOT be able to access admin dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/operator/dashboard');

    // Try to access admin dashboard
    await page.goto('/dashboard');

    // Should be redirected back to operator dashboard
    await expect(page).toHaveURL('/operator/dashboard');
  });

  test('Operator should NOT be able to access equipment list', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/operator/dashboard');

    // Try to access equipment list
    await page.goto('/equipment');

    // Should be redirected back to operator dashboard
    await expect(page).toHaveURL('/operator/dashboard');
  });
});
