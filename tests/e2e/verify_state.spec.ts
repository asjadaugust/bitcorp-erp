import { test, expect } from '@playwright/test';

test('Verify Application State', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:3420/login');
  await page.waitForTimeout(2000); // Wait for load
  await page.screenshot({ path: 'e2e/screenshots/login_page.png' });

  // Try generic selectors
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button'); // Generic button click

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Login successful');

  // 2. Dashboard
  await page.screenshot({ path: 'e2e/screenshots/dashboard.png' });

  // 3. Providers
  await page.goto('http://localhost:3420/providers');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/providers_list.png' });
  // Check Add button
  const addProviderBtn = page.locator('button:has-text("Nuevo Proveedor")');
  if (await addProviderBtn.isVisible()) {
    await addProviderBtn.click();
    await page.waitForTimeout(1000);
    console.log('Provider Add URL:', page.url());
    await page.screenshot({ path: 'e2e/screenshots/provider_form.png' });
  } else {
    console.log('Provider Add button not found');
  }

  // 4. Contracts
  await page.goto('http://localhost:3420/contracts');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/contracts_list.png' });
  const addContractBtn = page.locator('button:has-text("Nuevo Contrato")');
  if (await addContractBtn.isVisible()) {
    await addContractBtn.click();
    await page.waitForTimeout(1000);
    console.log('Contract Add URL:', page.url());
    await page.screenshot({ path: 'e2e/screenshots/contract_form.png' });
  }

  // 5. Fuel
  await page.goto('http://localhost:3420/fuel');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/fuel_list.png' });
  const addFuelBtn = page.locator('button:has-text("Nuevo Registro")');
  if (await addFuelBtn.isVisible()) {
    await addFuelBtn.click();
    await page.waitForTimeout(1000);
    console.log('Fuel Add URL:', page.url());
    await page.screenshot({ path: 'e2e/screenshots/fuel_form.png' });
  }

  // 6. Maintenance
  await page.goto('http://localhost:3420/maintenance');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/maintenance_list.png' });
  const addMaintBtn = page.locator('button:has-text("Nuevo Mantenimiento")');
  if (await addMaintBtn.isVisible()) {
    await addMaintBtn.click();
    await page.waitForTimeout(1000);
    console.log('Maintenance Add URL:', page.url());
    await page.screenshot({ path: 'e2e/screenshots/maintenance_form.png' });
  }

  // 7. Valuations
  await page.goto('http://localhost:3420/valuations');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/valuations_list.png' });
  const addValBtn = page.locator('button:has-text("Nueva Valorización")');
  if (await addValBtn.isVisible()) {
    await addValBtn.click();
    await page.waitForTimeout(1000);
    console.log('Valuation Add URL:', page.url());
    await page.screenshot({ path: 'e2e/screenshots/valuation_form.png' });
  }
  // Check Dashboard button
  await page.goto('http://localhost:3420/valuations');
  const valDashBtn = page.locator('button:has-text("Dashboard")');
  if (await valDashBtn.isVisible()) {
    await valDashBtn.click();
    await page.waitForTimeout(1000);
    console.log('Valuation Dashboard URL:', page.url());
    await page.screenshot({ path: 'e2e/screenshots/valuation_dashboard.png' });
  }

  // 8. Projects
  await page.goto('http://localhost:3420/projects');
  await page.waitForTimeout(1000);
  console.log('Projects URL:', page.url());
  await page.screenshot({ path: 'e2e/screenshots/projects_list.png' });

  // 9. Scheduling
  await page.goto('http://localhost:3420/scheduling');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/scheduling_dashboard.png' });

  // 10. Reports
  await page.goto('http://localhost:3420/reports');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/reports_page.png' });

  // 11. Logistics
  await page.goto('http://localhost:3420/logistics/products');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/logistics_products.png' });
});
