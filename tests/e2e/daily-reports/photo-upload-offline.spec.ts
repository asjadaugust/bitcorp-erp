import { test, expect } from '@playwright/test';

test.describe('Daily Reports - Photo Upload & Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto('http://localhost:3420/login');
    await page.fill('[name="username"]', 'operator1');
    await page.fill('[name="password"]', 'operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should upload photos to daily report', async ({ page }) => {
    // Navigate to daily reports
    await page.goto('http://localhost:3420/daily-reports/new');

    // Fill basic information
    await page.fill('[name="report_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('[name="equipment_id"]', { index: 1 });
    await page.fill('[name="location"]', 'Test Site 1');

    // Fill time
    await page.fill('[name="start_time"]', '08:00');
    await page.fill('[name="end_time"]', '16:00');

    // Fill hourmeter
    await page.fill('[name="hourmeter_start"]', '100');
    await page.fill('[name="hourmeter_end"]', '108');

    // Fill work description
    await page.fill('[name="work_description"]', 'Test work with photos');

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test photo content'),
      },
    ]);

    // Wait for upload
    await page.waitForSelector('.photo-item', { timeout: 5000 });

    // Verify photo preview appears
    const photoPreview = page.locator('.photo-item');
    await expect(photoPreview).toBeVisible();

    // Submit report
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('should capture GPS coordinates', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -12.0464, longitude: -77.0428 }); // Lima, Peru

    await page.goto('http://localhost:3420/daily-reports/new');

    // Click GPS button
    await page.click('.btn-location');

    // Wait for location to be filled
    await page.waitForTimeout(1000);

    // Verify location field contains GPS coordinates
    const locationValue = await page.inputValue('[name="location"]');
    expect(locationValue).toContain('GPS:');
    expect(locationValue).toContain('-12.04');
    expect(locationValue).toContain('-77.04');
  });

  test('should save report offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    await page.goto('http://localhost:3420/daily-reports/new');

    // Fill required fields
    await page.fill('[name="report_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('[name="equipment_id"]', { index: 1 });
    await page.fill('[name="location"]', 'Offline Site');
    await page.fill('[name="start_time"]', '08:00');
    await page.fill('[name="end_time"]', '16:00');
    await page.fill('[name="hourmeter_start"]', '100');
    await page.fill('[name="hourmeter_end"]', '108');
    await page.fill('[name="work_description"]', 'Offline report test');

    // Submit report
    await page.click('button[type="submit"]');

    // Verify offline save message
    await expect(page.locator('.alert-success')).toContainText('guardado');

    // Verify offline indicator
    await expect(page.locator('.status-indicator .offline')).toBeVisible();
  });
});
