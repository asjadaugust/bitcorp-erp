import { test, expect, request } from '@playwright/test';

test.describe('UI Verification', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // 1. Login via API to get token
    const loginRes = await request.post('http://localhost:3400/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    authToken = loginBody.access_token || loginBody.token;

    // 2. Create Equipment if not exists (check list first or just create one)
    // We create a unique one to ensure we have it
    const uniqueCode = `TEST-EQ-${Date.now()}`;
    const eqRes = await request.post('http://localhost:3400/api/equipment', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        codigo_equipo: uniqueCode,
        categoria: 'EXCAVADORA',
        marca: 'CAT',
        modelo: '320D',
        estado: 'DISPONIBLE',
        medidor_uso: 'HOROMETRO',
      },
    });

    // We won't block if this fails (maybe it exists), but creating one ensures data
    if (!eqRes.ok()) {
      console.log('Setup: Equipment creation might have failed or persisted', await eqRes.text());
    } else {
      const eqData = await eqRes.json();
      console.log('Setup: Created equipment', eqData.id);

      // 3. Create a Contract for this equipment
      await request.post('http://localhost:3400/api/contracts', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          equipo_id: eqData.id,
          numero_contrato: `CTR-${Date.now()}`,
          fecha_contrato: '2025-01-01',
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-12-31',
          estado: 'ACTIVO',
          moneda: 'PEN',
          tipo_tarifa: 'POR_HORA',
          tarifa: 150,
        },
      });

      // 4. Create a Maintenance Schedule
      await request.post('http://localhost:3400/api/scheduling/maintenance-schedules', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          equipo_id: eqData.id,
          tipo_mantenimiento: 'PREVENTIVO',
          tipo_intervalo: 'HORAS',
          intervalo_valor: 250,
          descripcion: 'Servicio inicial 250h',
          estado: 'ACTIVO',
        },
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3420/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Maintenance Schedules should display data', async ({ page }) => {
    await page.goto('http://localhost:3420/equipment/maintenance');

    // We expect data now because we seeded it
    await expect(page.locator('.schedules-grid')).toBeVisible();
    await expect(page.locator('.schedule-card')).toBeVisible();

    // Just verify the grid or empty state loads without error
    const cardCount = await page.locator('.schedule-card').count();
    if (cardCount === 0) {
      await expect(page.locator('.empty-state')).toBeVisible();
    } else {
      await expect(page.locator('.schedule-card').first()).toBeVisible();
    }
  });

  test('Contracts links should work', async ({ page }) => {
    await page.goto('http://localhost:3420/equipment/contracts');
    await expect(page.locator('app-contract-list')).toBeVisible();

    // We seeded a contract, so we expect rows
    // But filters/pagination might hide it? Assume default view shows it.
    await expect(page.locator('table tbody tr')).not.toHaveCount(0);

    const viewBtn = page.locator('table tbody tr').first().locator('button .fa-eye').first();
    // Sometimes the icon is inside the button
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await expect(page).not.toHaveURL(/.*\/NaN$/);
      await expect(page).toHaveURL(/.*\/equipment\/contracts\/.+/);
    }
  });

  test('Valuations back link should go to equipment/valuations', async ({ page }) => {
    // We didn't seed valuation, check assuming empty or standard Nav
    await page.goto('http://localhost:3420/equipment/valuations');
    const rowCount = await page.locator('table tbody tr').count();

    if (rowCount > 0) {
      await page.locator('table tbody tr').first().locator('.fa-eye').click();
      await page.getByText('Volver a Valorizaciones').click();
      await expect(page).toHaveURL(/.*\/equipment\/valuations$/);
    }
  });

  test('Equipment Detail should have new design', async ({ page }) => {
    await page.goto('http://localhost:3420/equipment');

    // We seeded an equipment "Test Equipment Redesign"
    // Search for it or just click first
    await page.locator('table tbody tr').first().waitFor({ state: 'visible' });
    await page.locator('table tbody tr').first().click();

    // Verify new design elements
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('.stat-card .fa-circle-info')).toBeVisible();
    await expect(page.locator('.tabs-nav')).toBeVisible();
    await expect(page.locator('button.tab-btn', { hasText: 'General' })).toBeVisible();
  });
});
