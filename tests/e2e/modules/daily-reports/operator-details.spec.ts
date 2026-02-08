import { test, expect } from '@playwright/test';

test.describe('Operator Daily Report Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'operator1');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/operator/dashboard');
  });

  test('should view daily report details', async ({ page, request }) => {
    // 1. Create a report via API (as admin, or operator if allowed)
    // Operator can create reports.
    // But easier to use API with admin token or just use the one created in previous test if we knew ID.
    // Let's create one using operator token.

    const token = await page.evaluate(() => localStorage.getItem('access_token'));

    const newReport = await request.post('/api/reports', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        report_date: '2025-01-02',
        operator_id: 17,
        equipment_id: 59,
        project_id: 'b946c3fc-1b8d-4dcc-a035-c84f1ac71161',
        start_time: '08:00',
        end_time: '17:00',
        hourmeter_start: 110,
        hourmeter_end: 118,
        location: 'Test Location',
        work_description: 'Test Work',
        status: 'draft',
      },
    });

    expect(newReport.ok()).toBeTruthy();
    const reportData = await newReport.json();
    const reportId = reportData.data.id;

    // 2. Navigate to details view
    await page.goto(`/operator/daily-report/${reportId}`);

    // 3. Verify content
    await expect(page.locator('h1')).toContainText('Parte Diario');
    await expect(page.locator('textarea[formControlName="workDescription"]')).toHaveValue(
      'Test Work'
    );
  });
});
