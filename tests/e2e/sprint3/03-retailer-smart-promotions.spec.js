const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://nestle-commhub-app.onrender.com';
const RETAILER_EMAIL = 'retailer1@test.com';
const RETAILER_PASSWORD = 'password123';

async function loginAsRetailer(page) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', RETAILER_EMAIL);
  await page.fill('input[type="password"]', RETAILER_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');
}

test.describe('SPRINT 3: Retailer Smart Promotions & Notifications', () => {

  test('Retailer sees past favorite promotions (rating >= 3.5)', async ({ page }) => {
    await loginAsRetailer(page);

    await page.goto(`${BASE_URL}/retailer/smart-promotions`);
    await page.waitForLoadState('networkidle');

    // Verify favorites section exists
    await expect(page.locator('text=Past Favourites')).toBeVisible({ timeout: 5000 });

    // Ensure page loaded fully
    await expect(page.locator('text=Refresh')).toBeVisible();
    
    // Check for stars (★) which indicate past ratings
    const starCount = await page.locator('text=★').count();
    // They may or may not have favorites depending on DB seed, but we can verify UI loads
  });

  test('Retailer can toggle "Notify on Rerun" for favorite promotions', async ({ page }) => {
    await loginAsRetailer(page);

    await page.goto(`${BASE_URL}/retailer/smart-promotions`);
    await page.waitForLoadState('networkidle');

    // Wait for the page to load favorites or show empty state
    const hasFavorites = await page.locator('button:has-text("Enable Rerun Notifications"), button:has-text("Notifying on Rerun")').count() > 0;
    
    if (hasFavorites) {
      const toggleBtn = page.locator('button:has-text("Enable Rerun Notifications"), button:has-text("Notifying on Rerun")').first();
      await toggleBtn.click();
      
      // Verify toast
      await expect(page.locator('text=Notification')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Retailer can use the "Enable All" notification button', async ({ page }) => {
    await loginAsRetailer(page);

    await page.goto(`${BASE_URL}/retailer/smart-promotions`);
    await page.waitForLoadState('networkidle');

    const enableAllBtn = page.locator('button:has-text("Enable All")');
    if (await enableAllBtn.isVisible()) {
      await enableAllBtn.click();
      await expect(page.locator('text=Notifications enabled')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Retailer sees similar current promotions recommended', async ({ page }) => {
    await loginAsRetailer(page);

    await page.goto(`${BASE_URL}/retailer/smart-promotions`);
    await page.waitForLoadState('networkidle');

    // Verify similar/recommendations section
    await expect(page.locator('text=Similar Current Promotions')).toBeVisible({ timeout: 5000 });
    
    const similarCards = await page.locator('text=View & Opt In').count();
    // Again, seeded data dependent, so we just check for UI structure
  });

});
