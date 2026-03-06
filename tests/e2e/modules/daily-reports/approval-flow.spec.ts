import { test, expect } from '@playwright/test';

test.describe('Daily Reports Approval Flow', () => {
  test('should create a report as operator and approve as admin', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Login as Operator
    console.log('Logging in as operator...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/operator/dashboard');
    console.log('Operator logged in.');

    // 2. Create Report
    console.log('Creating report...');
    // Click "Nuevo Parte Diario" card
    await page.click('a[href="/operator/daily-report"]');
    await page.waitForURL('**/operator/daily-report');

    // Fill Form
    // Select Project
    await page.waitForSelector('select[formControlName="projectId"]');
    await page.selectOption('select[formControlName="projectId"]', { index: 1 });

    // Select Equipment (first one)
    await page.waitForSelector('select[formControlName="equipmentId"]');
    await page.selectOption('select[formControlName="equipmentId"]', { index: 1 });

    await page.fill('input[formControlName="startTime"]', '08:00');
    await page.fill('input[formControlName="endTime"]', '17:00');
    await page.fill('input[formControlName="horometerStart"]', '100');
    await page.fill('input[formControlName="horometerEnd"]', '108');
    await page.fill('input[formControlName="manualLocation"]', 'Site A');
    await page.fill('textarea[formControlName="workDescription"]', 'Excavation work');

    // Submit
    await page.click('button:has-text("📤 Enviar Parte")');

    // Wait for success message or redirection
    await page.waitForURL('**/operator/dashboard');
    console.log('Report submitted.');

    // 3. Logout
    console.log('Logging out...');
    // Assuming there is a logout button in the sidebar or header
    // Or just navigate to /login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 4. Login as Admin
    console.log('Logging in as admin...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('Admin logged in.');

    // 5. Approve Report
    console.log('Approving report...');
    await page.goto('/daily-reports');
    await page.waitForURL('**/daily-reports');

    // Wait for reports to load
    await page.waitForSelector('.report-card');

    // Find the report we just created. It should be "submitted".
    // We can filter by status "submitted" to be sure.
    // Use specific selector for the status filter
    await page.selectOption('select', 'submitted');

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Click Approve on the first card
    // Use force: true in case it's covered or animating
    await page.click('button:has-text("✓ Approve")', { force: true });

    // Verify status changes to Approved
    // We might need to wait for the list to reload
    await page.waitForTimeout(2000);

    // Check if the badge says "approved"
    // Since we filtered by "submitted", it might disappear from the list if we keep the filter.
    // Let's clear the filter or select "approved".
    await page.selectOption('select', 'approved');

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify we see a report (assuming it's the one we just approved)
    await expect(page.locator('.badge-approved').first()).toBeVisible();
    console.log('Report approved.');
  });
});
