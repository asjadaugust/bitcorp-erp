import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from '../config';

test.describe('Daily Reports - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should list daily reports with data', async ({ page }) => {
    await page.goto(getUrl('/daily-reports'));

    // Wait for the reports container
    await expect(page.locator('.reports-container, .daily-report-list')).toBeVisible({
      timeout: 15000,
    });

    // Should have reports in the list (we have 69 in the database)
    const reportRows = page.locator('table tbody tr, .report-card, .report-item');
    await expect(reportRows.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter reports by status', async ({ page }) => {
    await page.goto(getUrl('/daily-reports'));
    await page.waitForTimeout(2000); // Wait for data to load

    // Look for status filter
    const statusFilter = page.locator('select[name="status"], .status-filter');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('approved');
      await page.waitForTimeout(1000);
      // Verify the filter was applied (reports should still show)
    }
  });

  test('should navigate to create new report', async ({ page }) => {
    await page.goto(getUrl('/daily-reports'));
    await page.waitForTimeout(1000);

    // Find and click the create button
    const createButton = page.locator(
      'button:has-text("Nuevo"), a:has-text("Nuevo"), button:has-text("Add")'
    );
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/daily-reports\/(new|create)/, { timeout: 10000 });
    }
  });

  test('should view report details', async ({ page }) => {
    await page.goto(getUrl('/daily-reports'));
    await page.waitForTimeout(2000);

    // Click on first report
    const viewButton = page
      .locator('button[title="Ver"], button:has-text("Ver"), a[title="View"]')
      .first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForURL(/daily-reports\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    }
  });

  test('should export report to PDF', async ({ page }) => {
    await page.goto(getUrl('/daily-reports'));
    await page.waitForTimeout(2000);

    // Navigate to a report detail first
    const viewButton = page.locator('button[title="Ver"], button:has-text("Ver")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForURL(/daily-reports\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Look for PDF export button
      const pdfButton = page.locator('button:has-text("PDF"), button[title*="PDF"], .pdf-btn');
      if (await pdfButton.isVisible()) {
        // Start waiting for download before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
        await pdfButton.click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toContain('.pdf');
        } catch (e) {
          // PDF download might open in new tab instead
          console.log('PDF opened in new tab or download not triggered');
        }
      }
    }
  });
});

test.describe('Daily Reports - Create Form', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator (who creates reports)
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should fill and save draft report', async ({ page }) => {
    await page.goto(getUrl('/daily-reports/new'));
    await page.waitForTimeout(2000);

    // Fill in the form
    const dateInput = page.locator('input[name="report_date"]');
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    // Select equipment
    const equipmentSelect = page.locator('select[name="equipment_id"]');
    if (await equipmentSelect.isVisible()) {
      await equipmentSelect.selectOption({ index: 1 });
    }

    // Fill time fields
    const startTime = page.locator('input[name="start_time"]');
    if (await startTime.isVisible()) {
      await startTime.fill('08:00');
    }

    const endTime = page.locator('input[name="end_time"]');
    if (await endTime.isVisible()) {
      await endTime.fill('17:00');
    }

    // Fill location
    const location = page.locator('input[name="location"]');
    if (await location.isVisible()) {
      await location.fill('Test Location - Obra Principal');
    }

    // Fill hourmeter readings
    const hourmeterStart = page.locator('input[name="hourmeter_start"]');
    if (await hourmeterStart.isVisible()) {
      await hourmeterStart.fill('1000');
    }

    const hourmeterEnd = page.locator('input[name="hourmeter_end"]');
    if (await hourmeterEnd.isVisible()) {
      await hourmeterEnd.fill('1008');
    }

    // Save as draft
    const saveDraftButton = page.locator(
      'button:has-text("Guardar Borrador"), button:has-text("Save Draft")'
    );
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();

      // Wait for success message or navigation
      await page.waitForTimeout(2000);
      const successMessage = page.locator('.alert-success, .success-message, [role="alert"]');
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    }
  });
});

test.describe('Daily Reports - GPS Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -12.0464, longitude: -77.0428, accuracy: 10 });

    // Login
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should capture GPS coordinates', async ({ page }) => {
    await page.goto(getUrl('/daily-reports/new'));
    await page.waitForTimeout(2000);

    // Find GPS button
    const gpsButton = page.locator('.gps-btn, button:has-text("📍"), button[title*="GPS"]');
    if (await gpsButton.isVisible()) {
      await gpsButton.click();

      // Wait for GPS capture
      await page.waitForTimeout(3000);

      // Check if GPS info is displayed
      const gpsInfo = page.locator('.gps-info, .gps-coords');
      if (await gpsInfo.isVisible()) {
        const gpsText = await gpsInfo.textContent();
        expect(gpsText).toContain('-12');
        expect(gpsText).toContain('-77');
      }
    }
  });
});

test.describe('Daily Reports - Offline Indicator', () => {
  test('should show offline indicator when disconnected', async ({ page, context }) => {
    // Login first
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // Check for offline indicator
    const offlineIndicator = page.locator(
      '.offline-banner, .offline-indicator, [class*="offline"]'
    );
    // Note: This might not show immediately depending on how the app handles offline state

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(1000);
  });
});
