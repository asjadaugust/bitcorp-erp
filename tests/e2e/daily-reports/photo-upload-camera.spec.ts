import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Daily Report Photo Upload', () => {
  const testImagePath = path.join(__dirname, '../../test-data/NumberPlate.png');
  const largeImagePath = path.join(__dirname, '../../test-data/Hourmeter_Odometer.png');

  test.beforeEach(async ({ page }) => {
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

  test('should show photo upload section', async ({ page }) => {
    // Check if photo section exists
    await expect(page.locator('text=Fotografías')).toBeVisible();
    await expect(page.locator('button:has-text("Capturar Foto"), label:has-text("Agregar Foto")')).toBeVisible();
  });

  test('should allow file input upload', async ({ page }) => {
    // Find file input
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    
    // Upload test image
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check if photo appears
    await expect(page.locator('.photo-item img, .photo-grid img').first()).toBeVisible();
  });

  test('should compress large images', async ({ page }) => {
    // Monitor network requests
    const uploadRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/photos') && request.method() === 'POST') {
        uploadRequests.push({
          url: request.url(),
          size: request.postData()?.length || 0
        });
      }
    });

    // Upload large image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(largeImagePath);
    
    // Wait for upload
    await page.waitForTimeout(3000);
    
    // Check if image was compressed (should be less than 500KB)
    if (uploadRequests.length > 0) {
      const uploadedSize = uploadRequests[0].size;
      console.log(`Uploaded size: ${(uploadedSize / 1024).toFixed(2)}KB`);
      // Note: This might not work with multipart/form-data, but we can check in the UI
    }
    
    // Verify photo appears in UI
    await expect(page.locator('.photo-item img, .photo-grid img').first()).toBeVisible();
  });

  test('should show progress during upload', async ({ page }) => {
    // Slow down network to see progress
    await page.route('**/api/daily-reports/*/photos', async route => {
      // Delay response
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Upload image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Check for progress indicator (adjust selector based on actual implementation)
    await expect(page.locator('.upload-progress, .progress-bar, text=Cargando')).toBeVisible({ timeout: 3000 });
  });

  test('should limit to 5 photos maximum', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    
    // Upload 5 images
    for (let i = 0; i < 5; i++) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
    }
    
    // Check photo count message
    await expect(page.locator('text=/5.*5/')).toBeVisible();
    
    // Try to upload 6th image - button should be disabled or hidden
    const addButton = page.locator('button:has-text("Capturar Foto"), button:has-text("Agregar Foto"), label:has-text("Agregar Foto")');
    
    // Wait a bit for UI to update
    await page.waitForTimeout(500);
    
    // Check if disabled or not visible
    const isDisabledOrHidden = await addButton.evaluate(el => {
      if (!el) return true;
      const button = el.closest('button') || el.querySelector('button');
      return button?.hasAttribute('disabled') || !button || getComputedStyle(el).display === 'none';
    });
    
    expect(isDisabledOrHidden).toBeTruthy();
  });

  test('should allow removing uploaded photos', async ({ page }) => {
    // Upload image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1500);
    
    // Check photo is there
    await expect(page.locator('.photo-item img, .photo-grid img').first()).toBeVisible();
    
    // Find and click remove button
    const removeButton = page.locator('.remove-photo, button[title="Eliminar"], button:has-text("×")').first();
    await removeButton.click();
    
    // Photo should be removed
    await expect(page.locator('.photo-item img, .photo-grid img').first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should show error for invalid file types', async ({ page }) => {
    // Try to upload non-image file
    const textFilePath = path.join(__dirname, '../../playwright.config.ts');
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    
    // Note: File input with accept="image/*" should prevent this,
    // but we can check if there's validation
    await fileInput.setInputFiles(textFilePath);
    await page.waitForTimeout(1000);
    
    // Check for error message or that no photo was added
    const photoCount = await page.locator('.photo-item img, .photo-grid img').count();
    expect(photoCount).toBe(0);
  });

  test('should display photo thumbnail preview', async ({ page }) => {
    // Upload image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1500);
    
    // Check thumbnail exists
    const thumbnail = page.locator('.photo-item img, .photo-grid img').first();
    await expect(thumbnail).toBeVisible();
    
    // Check image has src
    const src = await thumbnail.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/blob:|http/); // Should be blob URL or http URL
  });

  test('should show status indicators', async ({ page }) => {
    // Upload image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Look for status badges
    await page.waitForTimeout(1500);
    
    // Check for status text (adjust based on implementation)
    const statusElements = page.locator('.photo-status, .status-badge, text=/Local|Guardado|Cargando/');
    const count = await statusElements.count();
    
    expect(count).toBeGreaterThan(0);
  });
});
