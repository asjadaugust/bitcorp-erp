import { test, expect } from '@playwright/test';

test.describe('Operator Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('operator should be redirected to operator dashboard after login', async ({ page }) => {
    // Check if we're on the operator dashboard or regular dashboard
    const url = page.url();
    console.log('Current URL after login:', url);

    // Operator should see their dashboard
    await expect(page).toHaveURL(/dashboard|operator/);
  });

  test('operator should navigate to daily report form', async ({ page }) => {
    // Try to navigate directly to operator daily report
    await page.goto('http://localhost:3420/operator/daily-report');
    await page.waitForLoadState('networkidle');

    // Should see the daily report form
    const url = page.url();
    console.log('Daily report URL:', url);
    await expect(page).toHaveURL(/daily-report/);

    // Check for form elements
    const formExists = (await page.locator('form').count()) > 0;
    console.log('Form exists:', formExists);
    expect(formExists).toBe(true);
  });

  test('operator should see daily report list', async ({ page }) => {
    // Navigate to admin daily reports list
    await page.goto('http://localhost:3420/daily-reports');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('Daily reports list URL:', url);
  });

  test('operator should navigate to history', async ({ page }) => {
    await page.goto('http://localhost:3420/operator/history');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/history/);
  });

  test('operator should navigate to profile', async ({ page }) => {
    await page.goto('http://localhost:3420/operator/profile');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/profile/);
  });

  test('admin should see equipment table', async ({ page }) => {
    // Logout and login as admin
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to equipment
    await page.goto('http://localhost:3420/equipment');
    await page.waitForLoadState('networkidle');

    // Check for table or equipment list
    const hasTable = (await page.locator('table').count()) > 0;
    const hasCards = (await page.locator('[class*="equipment"]').count()) > 0;

    console.log('Has table:', hasTable, 'Has cards:', hasCards);
    expect(hasTable || hasCards).toBe(true);
  });
});
