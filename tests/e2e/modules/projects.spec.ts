import { test, expect } from '@playwright/test';

test.describe('Projects Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to projects list', async ({ page, isMobile }) => {
    if (isMobile) {
      // On mobile, sidebar is hidden and we can't easily toggle it yet (bug)
      await page.goto('/operations/projects');
    } else {
      // Navigate via Operations module
      await page.click('a[href="/operaciones"]');
      await expect(page).toHaveURL(/\/operations/);
      await page.click('a[href="/operations/projects"]');
    }
    await expect(page).toHaveURL('/operations/projects');
    await expect(page.locator('.title-group h1')).toContainText('Proyectos');
  });

  test('should create a new project', async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`BROWSER ERROR: ${err}`));
    page.on('requestfailed', (request) =>
      console.log(`REQUEST FAILED: ${request.url()} ${request.failure()?.errorText}`)
    );

    await page.goto('/operations/projects');
    await page.click('button:has-text("Nuevo Proyecto")');
    await expect(page).toHaveURL('/operations/projects/new');

    const projectCode = `PROJ-${Date.now()}`;
    await page.fill('input#codigo_proyecto', projectCode);
    await page.fill('input#nombre', 'Test Project E2E');
    await page.fill('textarea#descripcion', 'Created via E2E test');

    // Fill optional fields to ensure form validity
    await page.fill('input#cliente', 'Test Client');
    await page.fill('input#ubicacion', 'Test Location');

    // Wait for button to be enabled
    const submitBtn = page.locator('button:has-text("Crear Proyecto")');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    // Should redirect back to list
    await expect(page).toHaveURL('/operations/projects');
    await expect(page.locator('table')).toContainText(projectCode);
  });
});
