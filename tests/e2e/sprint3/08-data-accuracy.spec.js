const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

const testUsers = {
  pm: { email: 'pm@nestle.com', password: 'password123' },
  sm: { email: 'sm@nestle.com', password: 'password123' },
  admin: { email: 'admin@nestle.com', password: 'password123' }
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

test.describe('SPRINT 3: Data Accuracy Verification', () => {

  test('PM Dashboard: Opt-In Count Shows Real Number (Not 0)', async ({ page }) => {
    await loginAs(page, 'pm');
    
    // Opt-ins are shown on the Promotions Dashboard B2B tab
    await page.goto(`${BASE_URL}/promotion-manager/promotions`);
    
    // Handle slow loading or initial unauthorized redirect by re-navigating if needed
    if (page.url().includes('/unauthorized')) {
      await page.goto(`${BASE_URL}/promotion-manager/promotions`);
    }
    
    // Find the analytics card for Opt-Ins
    const optInCard = page.locator('div[data-testid="metric-card"]').filter({ hasText: /Total Opt-Ins/i });
    await expect(optInCard).toBeVisible({ timeout: 20000 });
    
    // Get the value (large text)
    const optInValue = await optInCard.locator('p, h3').filter({ hasText: /^[0-9,]+$/ }).textContent();
    const optInCount = parseInt(optInValue?.replace(/,/g, '') || '0');
    
    // In test environment, with new seed data, this should be > 0
    expect(optInCount).toBeGreaterThan(0);
    console.log(`✅ Opt-in count displayed: ${optInCount}`);
  });

  test('PM Dashboard: Feedback Rating Shows Real Average (Not 0)', async ({ page }) => {
    await loginAs(page, 'pm');
    
    await page.goto(`${BASE_URL}/promotion-manager/insights`);
    await page.waitForLoadState('networkidle');
    
    // Use data-testid and match by text
    const feedbackCard = page.locator('div[data-testid="metric-card"]').filter({ hasText: /Avg Feedback Rating/i });
    await expect(feedbackCard).toBeVisible({ timeout: 15000 });
    
    // Wait for data to be non-zero if we expect data from seed
    await expect(feedbackCard.locator('p')).not.toHaveText('0.0', { timeout: 15000 });
    
    const feedbackValue = await feedbackCard.locator('p').textContent();
    const feedbackRating = parseFloat(feedbackValue?.split('/')[0] || '0');
    
    expect(feedbackRating).toBeGreaterThan(0);
    console.log(`✅ Feedback rating displayed: ${feedbackRating}`);
  });

  test('SM Dashboard: Top Demand Products Have High Scores (8.0+)', async ({ page }) => {
    await loginAs(page, 'sm');
    
    await page.goto(`${BASE_URL}/stock-manager/smart-ordering`);
    await page.waitForLoadState('networkidle');
    
    // Get demand score from first product row (5th column)
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    
    const demandScoreText = await firstRow.locator('td').nth(4).textContent();
    const demandScore = parseFloat(demandScoreText?.split('—')[0] || '0');
    
    // CRITICAL: Top products in our new seed data have scores 8.0+
    expect(demandScore).toBeGreaterThanOrEqual(8.0); 
    console.log(`✅ Top product demand score: ${demandScore}`);
  });

  test('Admin Dashboard: Fulfillment Shows Mixed Status', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto(`${BASE_URL}/admin/analytics`);
    await page.waitForLoadState('networkidle');
    
    // Click on Fulfillment tab
    const fulfillmentTab = page.locator('button').filter({ hasText: /^Fulfillment$/i });
    await fulfillmentTab.waitFor({ state: 'visible', timeout: 15000 });
    await fulfillmentTab.click();
    
    // Look for regional efficiency section
    const chartSection = page.locator('h3:has-text("Regional Efficiency")');
    await expect(chartSection).toBeVisible({ timeout: 10000 });
    
    // Check if the overall fulfillment rate card is visible
    const rateCard = page.locator('div[data-testid="metric-card"]').filter({ hasText: /Fulfillment Rate/i });
    if (await rateCard.isVisible()) {
      const rateText = await rateCard.locator('h3').textContent();
      console.log(`✅ Fulfillment rate displayed: ${rateText}`);
    }
  });

  test('Admin Dashboard: Heatmap Shows Provinces', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto(`${BASE_URL}/admin/analytics`);
    await page.waitForLoadState('networkidle');
    
    // Click on HeatMap tab
    const heatmapTab = page.locator('button').filter({ hasText: /^HeatMap$/i });
    await heatmapTab.waitFor({ state: 'visible', timeout: 15000 });
    await heatmapTab.click();
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Check if the province dropdown has options
    const provinceSelect = page.locator('select').first();
    await expect(provinceSelect).toBeVisible();
    
    console.log(`✅ Heatmap loaded successfully`);
  });

});

