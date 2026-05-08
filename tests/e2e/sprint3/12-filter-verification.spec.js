const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

const testUsers = {
  admin: { email: 'admin@nestle.com', password: 'password123' },
  retailer: { email: 'retailer1@test.com', password: 'password123' }
};

async function loginAs(page, role) {
  const user = testUsers[role];
  await page.goto(BASE_URL);
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button:has-text("Sign in")');
  await page.waitForSelector('nav', { timeout: 30000 });
}

test.describe('Filter Verification', () => {

  test('Retailer: Search and Category Filters', async ({ page }) => {
    await loginAs(page, 'retailer');
    await page.goto(`${BASE_URL}/retailer/stock-requests`);
    await page.waitForLoadState('networkidle');

    // Test Search by Name
    const searchInput = page.locator('input[placeholder*="Search products"]');
    await searchInput.fill('Milo');
    await page.waitForTimeout(1000); // Wait for filter
    
    const miloProducts = page.locator('h3:has-text("Milo")');
    const otherProducts = page.locator('h3:has-text("Nescafé")');
    
    await expect(miloProducts.first()).toBeVisible();
    await expect(otherProducts.first()).not.toBeVisible();
    console.log('✅ Retailer name search filter verified');

    // Test Category Filter via Search
    await searchInput.fill('Coffee');
    await page.waitForTimeout(1000);
    
    const nescafeProducts = page.locator('h3:has-text("Nescafé")');
    await expect(nescafeProducts.first()).toBeVisible();
    await expect(miloProducts.first()).not.toBeVisible();
    console.log('✅ Retailer category search filter verified');
  });

  test('Admin: Heatmap and Insights Filters', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/admin/analytics`);
    await page.waitForLoadState('networkidle');

    // Test Insights Period Filter
    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('7');
    await expect(page.locator('.animate-spin')).toBeVisible(); // Check for loader
    await page.waitForSelector('.animate-spin', { state: 'hidden' });
    console.log('✅ Admin insights period filter verified');

    // Test Heatmap Filters
    await page.click('button:has-text("HeatMap")');
    const provinceSelect = page.locator('select').first();
    await provinceSelect.selectOption('Western Province');
    
    // Check if loader appears
    await expect(page.locator('text=Recalculating Contours')).toBeVisible();
    await page.waitForSelector('text=Recalculating Contours', { state: 'hidden' });
    
    const issueSelect = page.locator('select').nth(1);
    await issueSelect.selectOption('Stock rejection');
    await expect(page.locator('text=Recalculating Contours')).toBeVisible();
    
    console.log('✅ Admin heatmap filters verified');
  });

});
