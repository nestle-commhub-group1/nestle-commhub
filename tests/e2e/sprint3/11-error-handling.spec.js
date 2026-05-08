const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

const testUsers = {
  pm: { email: 'pm@nestle.com', password: 'password123' },
  retailer: { email: 'retailer1@test.com', password: 'password123' }
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

test.describe('SPRINT 3: Error Handling & Edge Cases', () => {

  test('Invalid Login: Wrong Password Shows Error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('input[id="email"]', 'pm@nestle.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign in")');
    
    // Should show error banner
    const errorMsg = page.locator('div.bg-red-50');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText(/Invalid|wrong|Failed/i);
    console.log(`✅ Invalid login error shown`);
  });

  test('Form Validation: Submit Empty Promotion Form Shows Error', async ({ page }) => {
    await loginAs(page, 'pm');
    
    await page.goto(`${BASE_URL}/promotion-manager/create-b2b`);
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling (Title is required)
    const submitBtn = page.locator('button:has-text("Create B2B Promotion")');
    await submitBtn.waitFor({ state: 'visible', timeout: 15000 });
    await submitBtn.click({ force: true });
    
    // Should show validation error message
    const error = page.locator('text=/required|Specify|Title/i').filter({ hasText: /Specify a promotion title|required/i });
    await expect(error.first()).toBeVisible({ timeout: 5000 });
    console.log(`✅ Form validation working`);
  });

  test('Unauthorized Access: Retailer Cannot Access Admin Dashboard', async ({ page }) => {
    await loginAs(page, 'retailer');
    
    // Try to access admin URL directly
    await page.goto(`${BASE_URL}/admin/analytics`);
    
    // ProtectedRoute in App.jsx redirects to /unauthorized or back home
    await page.waitForURL(/unauthorized|retailer/i, { timeout: 10000 });
    
    const url = page.url();
    expect(url).not.toContain('/admin/');
    
    console.log(`✅ Unauthorized access blocked (Redirected to: ${url})`);
  });

  test('Loading States: Dashboard Shows Loading Indicator', async ({ page }) => {
    await loginAs(page, 'pm');
    
    // Navigate and immediately look for loader
    await page.goto(`${BASE_URL}/promotion-manager/insights`);
    
    // Should show lucide loader with animate-spin
    const loader = page.locator('.animate-spin');
    await expect(loader.first()).toBeVisible({ timeout: 5000 });
    
    // Then should load content
    await page.waitForLoadState('networkidle');
    const cards = page.locator('div[data-testid="metric-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ Loading states handled correctly`);
  });

});

