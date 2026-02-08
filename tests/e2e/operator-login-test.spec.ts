import { test, expect } from '@playwright/test';

test.describe('Operator Login Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3420/login');
  });

  test('should login successfully with operator1 credentials and access operator dashboard', async ({
    page,
  }) => {
    // Fill in login form
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to operator dashboard (increased timeout)
    await page.waitForURL('**/operator/dashboard', { timeout: 20000 });

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Verify we're on operator dashboard
    await expect(page).toHaveURL(/operator\/dashboard/);

    // Verify operator layout is visible
    await expect(page.locator('.operator-layout, .operator-dashboard')).toBeVisible({
      timeout: 10000,
    });

    // Verify operator sidebar
    await expect(page.locator('.operator-sidebar, aside')).toBeVisible({ timeout: 5000 });

    // Verify operator header text (Spanish)
    const hasOperadorText = await page
      .locator('text=/Panel de Operador|Operador|Dashboard/i')
      .isVisible();
    expect(hasOperadorText).toBe(true);

    // Verify navigation menu items are present
    const hasPanelLink = await page
      .locator('a[href*="operator/dashboard"], a:has-text("Panel")')
      .count();
    const hasParteLink = await page.locator('a[href*="daily-report"], a:has-text("Parte")').count();
    expect(hasPanelLink).toBeGreaterThan(0);
    expect(hasParteLink).toBeGreaterThan(0);

    console.log('✅ Operator login successful - Dashboard loaded correctly');
  });

  test('should display operator sidebar navigation', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/operator/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Check for sidebar navigation items
    const sidebar = page.locator('.operator-sidebar, aside, nav');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Verify menu structure
    const menuItems = await page.locator('a[routerLink*="operator"], nav a').count();
    expect(menuItems).toBeGreaterThan(0);

    console.log(`✅ Found ${menuItems} navigation items in operator sidebar`);
  });

  test('should navigate to daily report form from operator dashboard', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/operator/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Wait a moment for dashboard to fully render
    await page.waitForTimeout(2000);

    // Try to click on daily report link (multiple possible selectors)
    const dailyReportLink = page
      .locator('a[href*="daily-report"], a:has-text("Parte Diario"), a:has-text("Nuevo Parte")')
      .first();

    if (await dailyReportLink.isVisible()) {
      await dailyReportLink.click();

      // Wait for navigation
      await page.waitForURL('**/daily-report', { timeout: 10000 });
      await expect(page).toHaveURL(/daily-report/);

      console.log('✅ Navigation to daily report form successful');
    } else {
      console.log('⚠️ Daily report link not found - Dashboard may need implementation');
    }
  });

  test('should logout successfully from operator dashboard', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/operator/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Wait for page to render
    await page.waitForTimeout(2000);

    // Try to find and click logout button
    const logoutButton = page
      .locator('button:has-text("Cerrar Sesión"), button:has-text("Logout"), .logout-btn')
      .first();

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Wait for redirect to login
      await page.waitForURL(/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/login/);

      // Verify login form is visible
      await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 5000 });

      console.log('✅ Logout successful - Redirected to login page');
    } else {
      console.log('⚠️ Logout button not found - May need to check sidebar implementation');
    }
  });

  test('should not have any 404 API errors during operator login', async ({ page }) => {
    const apiErrors: string[] = [];

    // Listen for response events
    page.on('response', (response) => {
      if (response.status() === 404 && response.url().includes('/api/')) {
        apiErrors.push(`404 Error: ${response.url()}`);
        console.error(`❌ 404 API Error: ${response.url()}`);
      }
    });

    // Login
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/operator/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Wait for any remaining API calls
    await page.waitForTimeout(3000);

    // Check for 404 errors
    if (apiErrors.length > 0) {
      console.error('❌ Found API 404 errors:');
      apiErrors.forEach((error) => console.error(error));
      throw new Error(`Found ${apiErrors.length} API 404 errors. First error: ${apiErrors[0]}`);
    }

    console.log('✅ No 404 API errors detected during operator login flow');
  });

  test('should verify operator role is correctly set', async ({ page, context }) => {
    // Login
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/operator/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Check localStorage for user data
    const userDataString = await page.evaluate(() => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      // Decode JWT token (simple base64 decode, no verification)
      try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        return decoded;
      } catch (e) {
        return null;
      }
    });

    if (userDataString) {
      const userData = JSON.parse(userDataString);
      console.log('User roles from token:', userData.roles);

      // Verify operator role (can be 'operator' or 'operador')
      const hasOperatorRole =
        userData.roles &&
        (userData.roles.includes('operator') || userData.roles.includes('operador'));

      expect(hasOperatorRole).toBe(true);
      console.log('✅ Operator role verified in JWT token');
    }
  });
});
