import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Bitcorp ERP/);
});

test('login failure with wrong credentials', async ({ page }) => {
  await page.goto('/login');

  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expect error message to appear
  await expect(page.locator('.alert-error')).toBeVisible();
});

test('login success with correct credentials', async ({ page }) => {
  await page.goto('/login');

  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();

  // Expect to be redirected to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
});
