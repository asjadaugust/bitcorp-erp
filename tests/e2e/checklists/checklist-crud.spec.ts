import { test, expect } from '@playwright/test';

test.describe('Checklist Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:4200/login');
    await page.fill('input[name="email"]', 'admin@bitcorp.com');
    await page.fill('input[name="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create a checklist template', async ({ page }) => {
    // Navigate to checklist templates
    await page.goto('http://localhost:4200/checklists/templates');

    // Click create template button
    await page.click('button:has-text("Create Template")');

    // Fill template form
    await page.fill('input[name="template_name"]', 'Excavator Pre-Op Check');
    await page.selectOption('select[name="checklist_type"]', 'pre_operation');
    await page.fill(
      'textarea[name="description"]',
      'Standard pre-operation checklist for excavators'
    );

    // Add checklist items
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="item_description_0"]', 'Check engine oil level');
    await page.check('input[name="is_required_0"]');

    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="item_description_1"]', 'Inspect hydraulic hoses');
    await page.check('input[name="is_required_1"]');
    await page.check('input[name="allow_photos_1"]');

    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="item_description_2"]', 'Test bucket operation');
    await page.check('input[name="is_required_2"]');

    // Save template
    await page.click('button[type="submit"]:has-text("Save Template")');

    // Verify success
    await expect(page.locator('.success-message')).toContainText('Template created successfully');
    await expect(page.locator('text=Excavator Pre-Op Check')).toBeVisible();
  });

  test('should complete a pre-operation checklist', async ({ page }) => {
    // Navigate to daily reports
    await page.goto('http://localhost:4200/daily-reports/new');

    // Fill basic report info
    await page.selectOption('select[name="equipment_id"]', { index: 1 });
    await page.fill('input[name="start_time"]', '08:00');

    // Open pre-operation checklist
    await page.click('button:has-text("Pre-Operation Checklist")');

    // Complete checklist items
    const checklistItems = await page.locator('.checklist-item').count();

    for (let i = 0; i < checklistItems; i++) {
      // Mark first two items as PASS
      if (i < 2) {
        await page.locator(`.checklist-item:nth-child(${i + 1}) button:has-text("Pass")`).click();
      }
      // Mark third item as NEEDS_ATTENTION
      else if (i === 2) {
        await page
          .locator(`.checklist-item:nth-child(${i + 1}) button:has-text("Needs Attention")`)
          .click();
        await page
          .locator(`.checklist-item:nth-child(${i + 1}) textarea[placeholder*="Comments"]`)
          .fill('Minor hydraulic leak detected');
      }
    }

    // Add general observations
    await page.fill(
      'textarea[placeholder*="general observations"]',
      'Equipment generally in good condition, scheduled maintenance recommended for hydraulic system'
    );

    // Save checklist
    await page.click('button:has-text("Save Checklist")');

    // Verify checklist saved
    await expect(page.locator('.success-message')).toContainText('Checklist saved');
    await expect(page.locator('.overall-status')).toContainText('Needs Attention');
  });

  test('should view checklist history for equipment', async ({ page }) => {
    // Navigate to equipment detail page
    await page.goto('http://localhost:4200/equipment/1');

    // Click on checklist history tab
    await page.click('button:has-text("Checklist History")');

    // Verify checklist history displayed
    await expect(page.locator('.checklist-history-table')).toBeVisible();

    // Check for recent checklists
    const rows = await page.locator('.checklist-history-table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Click on a checklist to view details
    await page.locator('.checklist-history-table tbody tr:first-child').click();

    // Verify checklist details displayed
    await expect(page.locator('.checklist-detail')).toBeVisible();
    await expect(page.locator('.checklist-date')).toBeVisible();
    await expect(page.locator('.operator-name')).toBeVisible();
    await expect(page.locator('.checklist-items')).toBeVisible();
  });

  test('should filter checklists by status', async ({ page }) => {
    // Navigate to checklists page
    await page.goto('http://localhost:4200/checklists');

    // Apply status filter
    await page.selectOption('select[name="status_filter"]', 'fail');

    // Verify filtered results
    const failedChecklists = await page.locator('.checklist-card').count();

    // Verify all displayed checklists have FAIL status
    for (let i = 0; i < failedChecklists; i++) {
      await expect(page.locator(`.checklist-card:nth-child(${i + 1}) .status-badge`)).toContainText(
        'Fail'
      );
    }
  });

  test('should generate checklist summary report', async ({ page }) => {
    // Navigate to checklist analytics
    await page.goto('http://localhost:4200/checklists/analytics');

    // Set date range
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-12-31');

    // Click generate report
    await page.click('button:has-text("Generate Report")');

    // Verify summary displayed
    await expect(page.locator('.summary-card:has-text("Total Checklists")')).toBeVisible();
    await expect(page.locator('.summary-card:has-text("Pass Rate")')).toBeVisible();
    await expect(page.locator('.summary-card:has-text("Failed Inspections")')).toBeVisible();

    // Verify charts rendered
    await expect(page.locator('.status-chart')).toBeVisible();
    await expect(page.locator('.trend-chart')).toBeVisible();
  });

  test('should require all mandatory items before saving checklist', async ({ page }) => {
    // Navigate to create checklist
    await page.goto('http://localhost:4200/daily-reports/new');
    await page.selectOption('select[name="equipment_id"]', { index: 1 });
    await page.click('button:has-text("Pre-Operation Checklist")');

    // Try to save without completing required items
    await page.click('button:has-text("Save Checklist")');

    // Verify save button is disabled or error message shown
    const saveButton = page.locator('button:has-text("Save Checklist")');
    await expect(saveButton).toBeDisabled();
  });

  test('should integrate checklist with daily report', async ({ page }) => {
    // Create daily report with checklist
    await page.goto('http://localhost:4200/daily-reports/new');

    // Fill basic info
    await page.selectOption('select[name="equipment_id"]', { index: 1 });
    await page.fill('input[name="start_time"]', '08:00');
    await page.fill('input[name="end_time"]', '17:00');
    await page.fill('input[name="hourmeter_start"]', '1000');
    await page.fill('input[name="hourmeter_end"]', '1009');

    // Complete pre-operation checklist
    await page.click('button:has-text("Pre-Operation Checklist")');

    // Mark all items as pass
    const itemCount = await page.locator('.checklist-item').count();
    for (let i = 0; i < itemCount; i++) {
      await page.locator(`.checklist-item:nth-child(${i + 1}) button:has-text("Pass")`).click();
    }
    await page.click('button:has-text("Save Checklist")');

    // Complete post-operation checklist
    await page.click('button:has-text("Post-Operation Checklist")');
    for (let i = 0; i < itemCount; i++) {
      await page.locator(`.checklist-item:nth-child(${i + 1}) button:has-text("Pass")`).click();
    }
    await page.click('button:has-text("Save Checklist")');

    // Submit daily report
    await page.click('button[type="submit"]:has-text("Submit Report")');

    // Verify report saved with checklists
    await expect(page.locator('.success-message')).toContainText('Report submitted successfully');

    // Navigate to report details
    await page.click('text=View Report');

    // Verify checklists are linked
    await expect(page.locator('text=Pre-Operation: Pass')).toBeVisible();
    await expect(page.locator('text=Post-Operation: Pass')).toBeVisible();
  });
});

test.describe('Checklist Template Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    await page.fill('input[name="email"]', 'admin@bitcorp.com');
    await page.fill('input[name="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should edit existing template', async ({ page }) => {
    await page.goto('http://localhost:4200/checklists/templates');

    // Click edit on first template
    await page.locator('.template-card:first-child button:has-text("Edit")').click();

    // Modify template
    await page.fill('input[name="template_name"]', 'Updated Template Name');
    await page.click('button:has-text("Add Item")');
    const itemCount = await page.locator('[name^="item_description_"]').count();
    await page.fill(`input[name="item_description_${itemCount - 1}"]`, 'New checklist item');

    // Save changes
    await page.click('button[type="submit"]:has-text("Update Template")');

    // Verify update
    await expect(page.locator('.success-message')).toContainText('Template updated');
    await expect(page.locator('text=Updated Template Name')).toBeVisible();
  });

  test('should deactivate template', async ({ page }) => {
    await page.goto('http://localhost:4200/checklists/templates');

    // Click deactivate on template
    await page.locator('.template-card:first-child button:has-text("Deactivate")').click();

    // Confirm deactivation
    await page.click('button:has-text("Confirm")');

    // Verify template hidden from active list
    await expect(page.locator('.success-message')).toContainText('Template deactivated');

    // Show inactive templates
    await page.check('input[name="show_inactive"]');

    // Verify template shown as inactive
    await expect(page.locator('.template-card.inactive')).toBeVisible();
  });
});
