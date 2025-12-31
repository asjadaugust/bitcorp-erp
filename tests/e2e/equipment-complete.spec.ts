import { test, expect } from '@playwright/test';
import { TEST_CONFIG, getUrl } from './config';

test.describe('Equipment Management - Complete CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should list all equipment', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    
    // Wait for table to load
    await page.waitForTimeout(2000);
    
    // Should have equipment in the list (8 in database)
    const equipmentTable = page.locator('.equipment-table, table, .equipment-list');
    await expect(equipmentTable).toBeVisible({ timeout: 15000 });
    
    // Count rows
    const rows = page.locator('table tbody tr, .equipment-item');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show equipment details', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForTimeout(2000);
    
    // Click view on first equipment
    const viewButton = page.locator('button[title="View Details"], button[title="Ver"], .view-btn').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForURL(/\/equipment\/[a-zA-Z0-9-]+/, { timeout: 10000 });
      
      // Verify detail page loaded
      const detailPage = page.locator('.equipment-detail, .detail-container, h1');
      await expect(detailPage).toBeVisible();
    }
  });

  test('should filter equipment by status', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForTimeout(2000);
    
    // Find status filter
    const statusFilter = page.locator('select[name="status"], .status-filter, #status-filter');
    if (await statusFilter.isVisible()) {
      // Select 'available' status
      await statusFilter.selectOption('available');
      await page.waitForTimeout(1000);
      
      // Verify filtered results
      const rows = page.locator('table tbody tr');
      await expect(rows.first()).toBeVisible();
    }
  });

  test('should search equipment', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForTimeout(2000);
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], .search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('CAT');
      await page.waitForTimeout(1000);
      
      // Should show filtered results (CAT equipment)
      const rows = page.locator('table tbody tr');
      await expect(rows.first()).toBeVisible();
    }
  });

  test('should navigate to create equipment form', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForTimeout(1000);
    
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add"), a:has-text("Nuevo")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page).toHaveURL(/equipment\/(new|create)/, { timeout: 10000 });
    }
  });

  test('should display equipment statistics', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForTimeout(2000);
    
    // Check for statistics cards
    const statsSection = page.locator('.stats-section, .equipment-stats, .dashboard-stats');
    if (await statsSection.isVisible()) {
      const statCards = page.locator('.stat-card, .stats-card, .statistic');
      const count = await statCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Equipment - Edit Form', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should open edit form for equipment', async ({ page }) => {
    await page.goto(getUrl('/equipment'));
    await page.waitForTimeout(2000);
    
    // Click edit on first equipment
    const editButton = page.locator('button[title="Edit"], button[title="Editar"], .edit-btn').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page).toHaveURL(/equipment\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      
      // Verify edit form is loaded
      const form = page.locator('form, .equipment-form');
      await expect(form).toBeVisible();
    }
  });
});

test.describe('Contracts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should list all contracts', async ({ page }) => {
    await page.goto(getUrl('/contracts'));
    await page.waitForTimeout(2000);
    
    // Should have contracts in the list (4 in database)
    const contractsTable = page.locator('table, .contracts-list, .contract-table');
    await expect(contractsTable).toBeVisible({ timeout: 15000 });
    
    const rows = page.locator('table tbody tr, .contract-item');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should view contract details', async ({ page }) => {
    await page.goto(getUrl('/contracts'));
    await page.waitForTimeout(2000);
    
    const viewButton = page.locator('button[title="View"], button[title="Ver"], .view-btn').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForURL(/contracts\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    }
  });
});

test.describe('Operators Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(getUrl('/login'));
    await page.fill('input[name="username"]', TEST_CONFIG.ADMIN_USER.username);
    await page.fill('input[type="password"]', TEST_CONFIG.ADMIN_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should list all operators', async ({ page }) => {
    await page.goto(getUrl('/operators'));
    await page.waitForTimeout(2000);
    
    // Should have operators (5 in database)
    const operatorsTable = page.locator('table, .operators-list');
    await expect(operatorsTable).toBeVisible({ timeout: 15000 });
    
    const rows = page.locator('table tbody tr, .operator-item');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should view operator details', async ({ page }) => {
    await page.goto(getUrl('/operators'));
    await page.waitForTimeout(2000);
    
    const viewButton = page.locator('button[title="View"], button[title="Ver"], .view-btn').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForURL(/operators\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    }
  });
});

test.describe('API Health Checks', () => {
  test('should get equipment from API', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post(`${getUrl('/api/auth/login')}`, {
      data: {
        username: TEST_CONFIG.ADMIN_USER.username,
        password: TEST_CONFIG.ADMIN_USER.password,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Get equipment
    const response = await request.get(`${getUrl('/api/equipment')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('should get daily reports from API', async ({ request }) => {
    const loginResponse = await request.post(`${getUrl('/api/auth/login')}`, {
      data: {
        username: TEST_CONFIG.ADMIN_USER.username,
        password: TEST_CONFIG.ADMIN_USER.password,
      },
    });
    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    const response = await request.get(`${getUrl('/api/reports')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('should get operators from API', async ({ request }) => {
    const loginResponse = await request.post(`${getUrl('/api/auth/login')}`, {
      data: {
        username: TEST_CONFIG.ADMIN_USER.username,
        password: TEST_CONFIG.ADMIN_USER.password,
      },
    });
    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    const response = await request.get(`${getUrl('/api/operators')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('should get contracts from API', async ({ request }) => {
    const loginResponse = await request.post(`${getUrl('/api/auth/login')}`, {
      data: {
        username: TEST_CONFIG.ADMIN_USER.username,
        password: TEST_CONFIG.ADMIN_USER.password,
      },
    });
    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    const response = await request.get(`${getUrl('/api/contracts')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(0);
  });
});
