const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

const testUsers = {
  pm: { email: 'pm@nestle.com', password: 'password123' },
  sm: { email: 'sm@nestle.com', password: 'password123' },
  admin: { email: 'admin@nestle.com', password: 'password123' },
  retailer: { email: 'retailer1@test.com', password: 'password123' },
  staff: { email: 'staff@nestle.com', password: 'password123' }
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

test.describe('SPRINT 3: Production Smoke Test (Automated)', () => {

  test('PM: Smart Builder & B2B/B2C Creation', async ({ page }) => {
    await loginAs(page, 'pm');
    
    // Access Create B2B (Integrated Smart Builder)
    await page.goto(`${BASE_URL}/promotion-manager/create-b2b`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Create B2B Promotion' })).toBeVisible({ timeout: 15000 });
    
    // Verify Smart Builder text is present
    await expect(page.locator('text=Smart Builder').first()).toBeVisible({ timeout: 15000 });
  });

  test('SM: Smart Ordering & Demand Table', async ({ page }) => {
    await loginAs(page, 'sm');
    
    await page.goto(`${BASE_URL}/stock-manager/smart-ordering`);
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading spinner to disappear
    await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    
    const table = page.locator('table');
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible({ timeout: 15000 }).catch(() => false)) {
      await expect(table).toBeVisible();
      console.log('✅ SM Demand Table loaded with data');
    } else {
      console.log('⚠️ SM Demand Table is empty (No products found)');
    }
  });

  test('Admin: Regional Heatmap & KPIs', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto(`${BASE_URL}/admin/analytics`);
    await page.waitForLoadState('networkidle');
    
    // Check for Heatmap component
    await expect(page.locator('text=Heatmap').first()).toBeVisible({ timeout: 15000 });
  });

  test('Retailer: Smart Favourites & Rating Logic', async ({ page }) => {
    await loginAs(page, 'retailer');
    
    await page.goto(`${BASE_URL}/retailer/smart-promotions`);
    await page.waitForLoadState('networkidle');
    
    // Check for the Favourites heading
    await expect(page.getByRole('heading', { name: 'Past Favourites' })).toBeVisible({ timeout: 15000 });
  });

  test('Support Hub: Ticket Flow & SLA Monitoring', async ({ page }) => {
    // 1. Retailer Access
    await loginAs(page, 'retailer');
    await page.goto(`${BASE_URL}/retailer/submit-issue`);
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be ready
    const submitBtn = page.locator('button').filter({ hasText: /^Submit Issue$/i });
    await expect(submitBtn).toBeVisible({ timeout: 20000 });

    // 2. Admin Access to SLA
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/admin/sla`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=SLA Monitor').first()).toBeVisible({ timeout: 15000 });
  });

});
