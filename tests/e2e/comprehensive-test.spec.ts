import { test, expect } from '@playwright/test';

test.describe('Comprehensive System Test', () => {
  test('should complete full admin workflow', async ({ page }) => {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin');
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✓ Logged in, on dashboard');

    // Step 2: Check Equipment Module
    console.log('\nStep 2: Testing Equipment Module');
    await page.click('text=Equipos');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.equipment-table', { timeout: 10000 });

    const equipmentCount = await page.locator('.equipment-table tbody tr').count();
    console.log(`✓ Equipment count: ${equipmentCount}`);
    expect(equipmentCount).toBeGreaterThan(0);

    // Step 3: Check Operators Module
    console.log('\nStep 3: Testing Operators Module');
    await page.goto('http://localhost:3420/operators');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('table', { timeout: 10000 });

    const operatorCount = await page.locator('table tbody tr').count();
    console.log(`✓ Operator count: ${operatorCount}`);
    expect(operatorCount).toBeGreaterThan(0);

    // Step 4: Check Daily Reports Module
    console.log('\nStep 4: Testing Daily Reports Module');
    await page.goto('http://localhost:3420/daily-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.reports-container', { timeout: 10000 });
    console.log('✓ Daily reports page loaded');

    // Step 5: Check Contracts Module
    console.log('\nStep 5: Testing Contracts Module');
    await page.goto('http://localhost:3420/contracts');
    await page.waitForLoadState('networkidle');
    const contractsTitle = await page.locator('h1:has-text("Contratos")').isVisible();
    console.log(`✓ Contracts page loaded: ${contractsTitle}`);

    // Step 6: Check Projects Module (might be coming soon)
    console.log('\nStep 6: Testing Projects Module');
    await page.goto('http://localhost:3420/projects');
    await page.waitForLoadState('networkidle');
    const pageLoaded = await page.locator('body').isVisible();
    console.log(`✓ Projects page loaded: ${pageLoaded}`);

    console.log('\n✅ All admin workflow tests passed!');
  });

  test('should complete operator workflow', async ({ page }) => {
    // Step 1: Login as operator
    console.log('Step 1: Logging in as operator');
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    const url = page.url();
    console.log(`✓ Logged in, redirected to: ${url}`);

    // Should be on operator dashboard
    expect(url).toMatch(/operator.*dashboard|dashboard/);

    // Step 2: Navigate to daily report form
    console.log('\nStep 2: Navigating to daily report form');
    await page.goto('http://localhost:3420/operator/daily-report');
    await page.waitForLoadState('networkidle');

    const formExists = (await page.locator('form').count()) > 0;
    console.log(`✓ Daily report form exists: ${formExists}`);
    expect(formExists).toBe(true);

    // Step 3: Check history
    console.log('\nStep 3: Checking operator history');
    await page.goto('http://localhost:3420/operator/history');
    await page.waitForLoadState('networkidle');
    const historyUrl = page.url();
    console.log(`✓ History page URL: ${historyUrl}`);

    // Step 4: Check profile
    console.log('\nStep 4: Checking operator profile');
    await page.goto('http://localhost:3420/operator/profile');
    await page.waitForLoadState('networkidle');
    const profileUrl = page.url();
    console.log(`✓ Profile page URL: ${profileUrl}`);

    console.log('\n✅ All operator workflow tests passed!');
  });

  test('should verify data persistence across page reloads', async ({ page }) => {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Navigate to equipment
    console.log('Navigating to equipment...');
    await page.goto('http://localhost:3420/equipment');
    await page.waitForSelector('.equipment-table', { timeout: 10000 });
    // Wait for table to fully load
    await page.waitForTimeout(2000);
    const countBefore = await page.locator('.equipment-table tbody tr').count();
    console.log(`Equipment count before reload: ${countBefore}`);

    // Reload page
    console.log('Reloading page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.equipment-table', { timeout: 10000 });
    // Wait for table to fully load after reload
    await page.waitForTimeout(2000);

    // Check count again
    const countAfter = await page.locator('.equipment-table tbody tr').count();
    console.log(`Equipment count after reload: ${countAfter}`);

    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBe(countBefore);
    console.log('✅ Data persisted across reload!');
  });
});
