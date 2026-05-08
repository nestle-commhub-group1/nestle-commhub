const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

const testUsers = {
  sm: { email: 'sm@nestle.com', password: 'password123' }
};

async function loginAs(page, role) {
  const user = testUsers[role];
  await page.goto(BASE_URL);
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button:has-text("Sign in")');
  await page.waitForSelector('nav', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Stock Manager Advanced Features Verification', () => {

  test('Insights Dashboard: Filters and Regional Sync', async ({ page }) => {
    await loginAs(page, 'sm');
    await page.goto(`${BASE_URL}/stock-manager/insights`);
    
    // Select Western Province
    const regionSelect = page.locator('select').nth(1);
    await regionSelect.selectOption('Western Province');
    
    // Check if loaders appear and disappear
    await expect(page.locator('.animate-spin').first()).toBeVisible();
    await page.waitForSelector('.animate-spin', { state: 'hidden' });
    
    // Select Last 7 Days
    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('7');
    await page.waitForSelector('.animate-spin', { state: 'hidden' });

    console.log('✅ Stock Manager regional and period filters verified');
  });

});
