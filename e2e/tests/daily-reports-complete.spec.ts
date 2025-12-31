import { test, expect } from '@playwright/test';

test.describe('Daily Reports - Complete Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('BITCORP-002: Create daily report with all fields', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Fill basic info
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    await page.fill('input[formControlName="date"]', '2024-01-15');
    
    // Fill time fields
    await page.fill('input[formControlName="start_time"]', '08:00');
    await page.fill('input[formControlName="end_time"]', '17:00');
    
    // Fill readings
    await page.fill('input[formControlName="start_hourmeter"]', '1000');
    await page.fill('input[formControlName="end_hourmeter"]', '1009');
    await page.fill('input[formControlName="fuel_consumed"]', '45.5');
    
    // Fill location
    await page.fill('input[formControlName="location"]', 'Site A - North Section');
    
    // Fill notes
    await page.fill('textarea[formControlName="notes"]', 'Equipment performed well. Minor vibration noted.');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*daily-reports$/);
  });

  test('BITCORP-002: Photo upload functionality', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Fill minimum required fields
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    await page.fill('input[formControlName="date"]', '2024-01-15');
    
    // Test photo upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/Users/klm95441/Library/CloudStorage/SynologyDrive-projects/bitcorp-erp/tests/test-data/test-image.jpg');
    
    // Wait for preview
    await expect(page.locator('.photo-preview')).toBeVisible({ timeout: 5000 });
    
    // Verify file name displayed
    await expect(page.locator('.file-name')).toContainText('test-image.jpg');
  });

  test('BITCORP-002: GPS location capture', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 18.4655, longitude: -69.9312 });
    
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Click capture GPS button
    await page.click('button:has-text("Capture GPS")');
    
    // Verify GPS coordinates populated
    await expect(page.locator('input[formControlName="gps_latitude"]')).toHaveValue(/18\.46/, { timeout: 5000 });
    await expect(page.locator('input[formControlName="gps_longitude"]')).toHaveValue(/-69\.93/);
  });

  test('BITCORP-003: Equipment checklist integration', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Select equipment
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    
    // Wait for checklist to load
    await expect(page.locator('.checklist-section')).toBeVisible({ timeout: 5000 });
    
    // Verify checklist items
    await expect(page.locator('.checklist-item')).toHaveCount(10, { timeout: 3000 });
    
    // Check some items
    await page.click('.checklist-item:nth-child(1) input[type="checkbox"]');
    await page.click('.checklist-item:nth-child(2) input[type="checkbox"]');
    await page.click('.checklist-item:nth-child(3) input[type="checkbox"]');
    
    // Add note to first item
    await page.click('.checklist-item:nth-child(1) button:has-text("Add Note")');
    await page.fill('.checklist-item:nth-child(1) textarea', 'Oil level checked - OK');
    
    // Verify checked count
    const checkedCount = await page.locator('.checklist-item input[type="checkbox"]:checked').count();
    expect(checkedCount).toBe(3);
  });

  test('BITCORP-003: Offline mode functionality', async ({ page, context }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Fill form
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    await page.fill('input[formControlName="date"]', '2024-01-15');
    await page.fill('input[formControlName="start_time"]', '08:00');
    await page.fill('input[formControlName="end_time"]', '17:00');
    
    // Go offline
    await context.setOffline(true);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify offline indicator
    await expect(page.locator('.offline-indicator')).toBeVisible({ timeout: 3000 });
    
    // Verify report saved to queue
    await expect(page.locator('.sync-queue-count')).toContainText('1');
    
    // Go back online
    await context.setOffline(false);
    
    // Trigger sync
    await page.click('button:has-text("Sync Now")');
    
    // Verify sync success
    await expect(page.locator('.sync-success')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.sync-queue-count')).toContainText('0');
  });

  test('BITCORP-003: Form validation', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('.error-message:has-text("Equipment is required")')).toBeVisible();
    await expect(page.locator('.error-message:has-text("Project is required")')).toBeVisible();
    await expect(page.locator('.error-message:has-text("Date is required")')).toBeVisible();
    
    // Fill equipment and project
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    
    // Test invalid hourmeter values
    await page.fill('input[formControlName="start_hourmeter"]', '1000');
    await page.fill('input[formControlName="end_hourmeter"]', '999');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message:has-text("End hourmeter must be greater than start")')).toBeVisible();
  });

  test('BITCORP-003: View and edit existing report', async ({ page }) => {
    // Navigate to reports list
    await page.goto('http://localhost:4200/daily-reports');
    
    // Wait for list to load
    await expect(page.locator('.report-list-item')).toHaveCount(5, { timeout: 5000 });
    
    // Click first report
    await page.click('.report-list-item:first-child');
    
    // Verify detail view
    await expect(page.locator('.report-detail')).toBeVisible();
    
    // Click edit button
    await page.click('button:has-text("Edit")');
    
    // Modify notes
    await page.fill('textarea[formControlName="notes"]', 'Updated notes - Equipment maintenance scheduled');
    
    // Save
    await page.click('button[type="submit"]');
    
    // Verify update success
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 5000 });
  });

  test('BITCORP-003: Filter and search reports', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports');
    
    // Test date filter
    await page.fill('input[name="date_from"]', '2024-01-01');
    await page.fill('input[name="date_to"]', '2024-01-31');
    await page.click('button:has-text("Filter")');
    
    // Verify filtered results
    await page.waitForTimeout(1000);
    const filteredCount = await page.locator('.report-list-item').count();
    expect(filteredCount).toBeGreaterThan(0);
    
    // Test equipment filter
    await page.selectOption('select[name="equipment"]', { index: 1 });
    await page.click('button:has-text("Filter")');
    
    await page.waitForTimeout(1000);
    
    // Test search
    await page.fill('input[name="search"]', 'Site A');
    await page.click('button:has-text("Search")');
    
    await page.waitForTimeout(1000);
  });

  test('BITCORP-003: Export reports to PDF', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports');
    
    // Select reports
    await page.click('.report-list-item:nth-child(1) input[type="checkbox"]');
    await page.click('.report-list-item:nth-child(2) input[type="checkbox"]');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export PDF")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('BITCORP-003: Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Verify mobile layout
    await expect(page.locator('.mobile-form-container')).toBeVisible();
    
    // Verify stacked fields
    const formWidth = await page.locator('.form-group').first().evaluate(el => el.offsetWidth);
    expect(formWidth).toBeLessThan(400);
    
    // Test mobile navigation
    await page.click('.mobile-menu-toggle');
    await expect(page.locator('.mobile-nav')).toBeVisible();
  });

  test('BITCORP-003: Calculate working hours automatically', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    
    // Fill time fields
    await page.fill('input[formControlName="start_time"]', '08:00');
    await page.fill('input[formControlName="end_time"]', '17:30');
    
    // Trigger calculation
    await page.click('input[formControlName="date"]');
    
    // Verify calculated hours
    await expect(page.locator('input[formControlName="hours_worked"]')).toHaveValue('9.5', { timeout: 2000 });
  });

  test('BITCORP-003: Fuel efficiency calculation', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    
    // Fill readings
    await page.fill('input[formControlName="start_hourmeter"]', '1000');
    await page.fill('input[formControlName="end_hourmeter"]', '1010');
    await page.fill('input[formControlName="fuel_consumed"]', '50');
    
    // Trigger calculation
    await page.click('input[formControlName="date"]');
    
    // Verify fuel efficiency (50L / 10h = 5.0 L/h)
    await expect(page.locator('.fuel-efficiency')).toContainText('5.0 L/h', { timeout: 2000 });
  });
});

test.describe('Daily Reports - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Handle network error gracefully', async ({ page, context }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Fill form
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    await page.fill('input[formControlName="date"]', '2024-01-15');
    
    // Block network
    await context.setOffline(true);
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('.error-message:has-text("Network error")')).toBeVisible({ timeout: 5000 });
    
    // Verify form data retained
    await expect(page.locator('input[formControlName="date"]')).toHaveValue('2024-01-15');
  });

  test('Handle duplicate report submission', async ({ page }) => {
    await page.goto('http://localhost:4200/daily-reports/new');
    
    // Fill form with existing report data
    await page.selectOption('select[formControlName="equipment_id"]', { index: 1 });
    await page.selectOption('select[formControlName="project_id"]', { index: 1 });
    await page.fill('input[formControlName="date"]', '2024-01-01'); // Assuming this date exists
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify duplicate warning
    await expect(page.locator('.warning-message:has-text("duplicate")')).toBeVisible({ timeout: 5000 });
  });
});
