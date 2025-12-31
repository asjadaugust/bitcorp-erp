import { test, expect } from '@playwright/test';

test('debug daily reports page', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3420');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Navigate to daily reports
  const dailyReportsCard = page.locator('.module-card:has-text("Partes Diarios")');
  await dailyReportsCard.click();
  await page.waitForURL('**/daily-reports', { timeout: 5000 });

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check what's on the page
  console.log('=== PAGE CONTENT ===');
  const h1s = await page.locator('h1').allTextContents();
  const h2s = await page.locator('h2').allTextContents();
  console.log('H1 tags:', h1s);
  console.log('H2 tags:', h2s);

  // Check if page-header exists
  const hasPageHeader = await page
    .locator('.page-header')
    .isVisible()
    .catch(() => false);
  console.log('Page header visible:', hasPageHeader);

  // Take screenshot
  await page.screenshot({ path: 'test-results/daily-reports-page.png', fullPage: true });

  // Get all text content
  const bodyText = await page.locator('body').textContent();
  console.log('Body contains "Partes Diarios":', bodyText?.includes('Partes Diarios'));
});
