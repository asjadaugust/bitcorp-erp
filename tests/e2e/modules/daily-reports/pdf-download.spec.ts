import { test, expect } from '@playwright/test';

test.describe('Daily Reports PDF Download', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should download PDF for a daily report', async ({ page, request }) => {
    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log('Token:', token);
    expect(token).toBeTruthy();

    // 1. Create a report via API to ensure we have one
    const newReport = await request.post('/api/reports', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        report_date: '2025-01-01',
        operator_id: 17, // Valid operator ID
        equipment_id: 59, // Assuming equipment 59 exists
        project_id: 'b946c3fc-1b8d-4dcc-a035-c84f1ac71161', // Valid UUID
        start_time: '08:00',
        end_time: '17:00',
        hourmeter_start: 100,
        hourmeter_end: 108,
        location: 'Test Location',
        work_description: 'Test Work',
        status: 'draft'
      }
    });
    
    if (!newReport.ok()) {
        console.log(await newReport.text());
    }
    expect(newReport.ok()).toBeTruthy();
    const reportData = await newReport.json();
    const reportId = reportData.data.id;

    // 2. Try to download PDF
    const response = await request.get(`/api/reports/${reportId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    
    // 3. Verify body size > 0
    const body = await response.body();
    expect(body.length).toBeGreaterThan(0);
  });
});
