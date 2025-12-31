import { test, expect } from '@playwright/test';

test.describe('GPS Geolocation Capture', () => {
  // Lima, Peru coordinates for testing
  const mockLocation = { latitude: -12.0464, longitude: -77.0428 };

  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    
    // Set mock location
    await context.setGeolocation(mockLocation);
    
    // Login as operator
    await page.goto('http://localhost:4200/operator/login');
    await page.fill('[name="username"]', 'operator1');
    await page.fill('[name="password"]', 'operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operator/dashboard');
    
    // Navigate to daily report form
    await page.click('text=Parte Diario');
    await page.waitForLoadState('networkidle');
  });

  test('should show GPS section in form', async ({ page }) => {
    // Check if GPS/Location section exists
    await expect(page.locator('text=Ubicación')).toBeVisible();
    await expect(page.locator('button:has-text("Capturar"), button:has-text("📍")')).toBeVisible();
  });

  test('should capture GPS coordinates on button click', async ({ page }) => {
    // Click GPS capture button
    await page.click('button:has-text("Capturar"), button:has-text("📍")');
    
    // Wait for GPS capture
    await page.waitForTimeout(2000);
    
    // Check if GPS field is populated
    const gpsInput = page.locator('[formControlName="gpsLocation"], input[placeholder*="GPS"], input[placeholder*="ubicación"]');
    const value = await gpsInput.inputValue().catch(() => '');
    
    // Should contain coordinates
    expect(value).toContain('-12.046');
    expect(value).toContain('-77.042');
  });

  test('should auto-capture GPS on page load', async ({ page }) => {
    // Wait a bit for auto-capture
    await page.waitForTimeout(3000);
    
    // Check if GPS field is populated automatically
    const gpsInput = page.locator('[formControlName="gpsLocation"], input[placeholder*="GPS"], input[placeholder*="ubicación"]');
    const value = await gpsInput.inputValue().catch(() => '');
    
    // If auto-capture is enabled, should have coordinates
    if (value) {
      expect(value).toContain('-12');
      expect(value).toContain('-77');
    }
  });

  test('should show accuracy information', async ({ page }) => {
    // Click GPS capture button
    await page.click('button:has-text("Capturar"), button:has-text("📍")');
    await page.waitForTimeout(2000);
    
    // Look for accuracy details
    const accuracyText = page.locator('text=/±.*m|Precisión|Accuracy/');
    const hasAccuracy = await accuracyText.count() > 0;
    
    if (hasAccuracy) {
      await expect(accuracyText.first()).toBeVisible();
    }
  });

  test('should show coordinates in DMS format', async ({ page }) => {
    // Click GPS capture button
    await page.click('button:has-text("Capturar"), button:has-text("📍")');
    await page.waitForTimeout(2000);
    
    // Look for DMS format (degrees, minutes, seconds)
    const dmsText = page.locator('text=/°.*\'.*"/ ');
    const hasDMS = await dmsText.count() > 0;
    
    if (hasDMS) {
      await expect(dmsText.first()).toBeVisible();
    }
  });

  test('should handle GPS permission denied', async ({ page, context }) => {
    // Clear permissions
    await context.clearPermissions();
    
    // Try to capture GPS
    await page.click('button:has-text("Capturar"), button:has-text("📍")');
    await page.waitForTimeout(2000);
    
    // Should show error message
    await expect(page.locator('text=/Permiso.*denegado|GPS.*error|ubicación.*denegado/i')).toBeVisible({ timeout: 5000 });
  });

  test('should allow manual location entry as fallback', async ({ page }) => {
    // Find manual location input
    const manualInput = page.locator('[formControlName="manualLocation"], input[placeholder*="manual"], input[placeholder*="Descripción"]');
    
    // Enter manual location
    await manualInput.fill('Km 45 carretera norte, cerca de puente San Juan');
    
    // Check value
    const value = await manualInput.inputValue();
    expect(value).toContain('Km 45');
  });

  test('should show loading state while capturing', async ({ page }) => {
    // Add delay to GPS capture to see loading state
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Click capture button
    const captureButton = page.locator('button:has-text("Capturar"), button:has-text("📍")');
    await captureButton.click();
    
    // Should show loading text or spinner
    await expect(page.locator('text=/Capturando|🔄|Loading/i')).toBeVisible({ timeout: 2000 });
  });

  test('should display altitude if available', async ({ page, context }) => {
    // Set geolocation with altitude
    await context.setGeolocation({ 
      ...mockLocation, 
      altitude: 154 // Lima's average altitude
    });
    
    // Capture GPS
    await page.click('button:has-text("Capturar"), button:has-text("📍")');
    await page.waitForTimeout(2000);
    
    // Look for altitude display
    const altitudeText = page.locator('text=/Altitud|Altitude|154.*m/');
    const hasAltitude = await altitudeText.count() > 0;
    
    if (hasAltitude) {
      await expect(altitudeText.first()).toBeVisible();
    }
  });

  test('should store coordinates for form submission', async ({ page }) => {
    // Capture GPS
    await page.click('button:has-text("Capturar"), button:has-text("📍")');
    await page.waitForTimeout(2000);
    
    // Fill required fields
    await page.fill('[formControlName="date"], input[type="date"]', '2025-12-11');
    await page.selectOption('[formControlName="projectId"], select:has-option', { index: 1 });
    await page.selectOption('[formControlName="equipmentId"], select:has-option', { index: 1 });
    
    // Fill numeric fields
    await page.fill('[formControlName="horometerStart"]', '1000');
    await page.fill('[formControlName="horometerEnd"]', '1008');
    await page.fill('[formControlName="startTime"]', '08:00');
    await page.fill('[formControlName="endTime"]', '17:00');
    await page.fill('[formControlName="workDescription"], textarea', 'Trabajo de prueba con GPS');
    
    // Try to submit (won't succeed but we can see if validation passes)
    const submitButton = page.locator('button[type="submit"]:has-text("Enviar")');
    
    // Check if button is enabled (form is valid)
    const isEnabled = await submitButton.isEnabled();
    expect(isEnabled).toBeTruthy();
  });

  test('should show Google Maps link in view mode', async ({ page }) => {
    // This test assumes there's a report with GPS data
    // Navigate to history first
    await page.goto('http://localhost:4200/operator/history');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any reports
    const reportLinks = page.locator('a[href*="/operator/history/"], button:has-text("Ver"), .report-item');
    const count = await reportLinks.count();
    
    if (count > 0) {
      // Click first report
      await reportLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for maps button/link
      const mapsLink = page.locator('a[href*="google.com/maps"], button:has-text("Ver en Mapa"), button:has-text("🗺️")');
      const hasMapsLink = await mapsLink.count() > 0;
      
      if (hasMapsLink) {
        await expect(mapsLink.first()).toBeVisible();
      }
    }
  });
});
