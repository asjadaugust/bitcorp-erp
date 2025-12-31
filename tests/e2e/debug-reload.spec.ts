import { test, expect } from '@playwright/test';

test('debug reload issue', async ({ page }) => {
  // Enable console logging
  page.on('console', (msg) => console.log(`CONSOLE ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => console.log(`PAGE ERROR: ${err.message}`));

  // Login
  await page.goto('http://localhost:3420');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  console.log('=== BEFORE RELOAD ===');
  const htmlBefore = await page.content();
  console.log('Dashboard visible before reload:', await page.locator('.control-panel').isVisible());

  // Reload
  await page.reload();
  await page.waitForLoadState('networkidle');

  console.log('=== AFTER RELOAD ===');
  console.log('Current URL:', page.url());
  const htmlAfter = await page.content();
  console.log(
    'Dashboard visible after reload:',
    await page
      .locator('.control-panel')
      .isVisible()
      .catch(() => false)
  );
  console.log('Body classes:', await page.locator('body').getAttribute('class'));

  // Take screenshot
  await page.screenshot({ path: 'test-results/reload-debug.png', fullPage: true });

  // Check what's actually rendered
  const appRoot = await page.locator('app-root').innerHTML();
  console.log('App root content length:', appRoot.length);
  console.log('Has router-outlet:', appRoot.includes('router-outlet'));
});
