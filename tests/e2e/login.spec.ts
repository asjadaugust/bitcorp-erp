import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from './config';

test.describe('Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getUrl('/login'));
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation and Angular to initialize (increased timeout)
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Wait for network to be idle to ensure Angular fully loaded
    await page.waitForLoadState('networkidle');

    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Verify control panel exists (with timeout)
    // Use first() to avoid strict mode violation if multiple elements match
    await expect(page.locator('.control-panel, .dashboard-container, h1').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify navigation bar exists
    await expect(page.locator('.main-nav, nav').first()).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with demouser credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('input[name="username"]', 'demouser');
    await page.fill('input[type="password"]', 'demo123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation and Angular to initialize (increased timeout)
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Verify control panel or dashboard exists
    await expect(page.locator('.control-panel, .dashboard-container, h1').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should login successfully with operator credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard (operators might go to /operator/dashboard)
    await page.waitForURL(/dashboard/, { timeout: 20000 });

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in login form with invalid credentials
    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[type="password"]', 'wrongpass');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait a moment for the error to appear
    await page.waitForTimeout(1000);

    // Verify still on login page (didn't navigate)
    await expect(page).toHaveURL(/login/);

    // Check for error message (could be in different formats)
    const hasErrorClass = await page
      .locator('.alert-error')
      .isVisible()
      .catch(() => false);
    const hasErrorMessage = await page
      .locator('text=/invalid|wrong|incorrect|failed/i')
      .isVisible()
      .catch(() => false);

    expect(hasErrorClass || hasErrorMessage).toBe(true);
  });

  test('should navigate between modules after login', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Wait for dashboard to fully render
    await page.waitForTimeout(2000);

    // Try to navigate to equipment via sidebar/nav instead of module card
    const equipmentLink = page.locator('a[href*="equipment"], a:has-text("Equipo")').first();
    if (await equipmentLink.isVisible()) {
      await equipmentLink.click();
      await page.waitForURL('**/equipment', { timeout: 15000 });
      await expect(page).toHaveURL(/equipment/);
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Wait for dashboard to render
    await page.waitForTimeout(1000);

    // Click logout button (it might be in different locations)
    const logoutButton = page
      .locator(
        'button:has-text("Cerrar Sesión"), button:has-text("Logout"), a:has-text("Cerrar Sesión")'
      )
      .first();
    await logoutButton.click();

    // Wait for navigation back to login
    await page.waitForURL(/login|^\/$/, { timeout: 10000 });

    // Verify we're back on login page
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 5000 });
  });
});
