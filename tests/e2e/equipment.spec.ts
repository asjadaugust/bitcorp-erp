import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from './config';

test.describe('Equipment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to equipment list
    await page.goto(getUrl('/equipment'));
  });

  test('should list equipment', async ({ page }) => {
    await expect(page.locator('.equipment-table')).toBeVisible({ timeout: 10000 });
    // Wait for data to load
    await page.waitForSelector('.equipment-table tbody tr', { timeout: 10000 });
  });

  test('should view equipment details', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('.equipment-table tbody tr', { timeout: 10000 });
    
    // Click on the "View Details" button in the first row
    // The button has title="View Details"
    const viewButton = page.locator('.equipment-table tbody tr').first().locator('button[title="View Details"]');
    await expect(viewButton).toBeVisible();
    
    // Wait for navigation
    await Promise.all([
      page.waitForURL(/\/equipment\/[a-zA-Z0-9-]+/, { timeout: 10000 }),
      viewButton.click({ force: true })
    ]);

    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to create equipment form', async ({ page }) => {
    await page.click('button:has-text("Add Equipment")');
    await expect(page).toHaveURL(/\/equipment\/new/);
    await expect(page.locator('h1')).toContainText('Add Equipment');
  });
});
