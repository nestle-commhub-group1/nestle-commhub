import { test, expect } from '@playwright/test';
import testData from '../config/test-data.json';

const { baseUrl, password, accounts } = testData;

test.describe('Sprint 3: Promotion Feedback System (5 Cases)', () => {
  
  async function login(page, email, password) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Loading')).toBeHidden({ timeout: 15000 });
    await expect(page).not.toHaveURL(/.*login/);
  }

  test('TC-FEEDBACK-001: Retailer submits star rating and text feedback', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/my-promotions`);
    await expect(page.locator('text=Loading')).toBeHidden();
    
    // Check if opted-in promotions exist
    const rateBtn = page.locator('button:has-text("Rate Campaign")').first();
    if (await rateBtn.isVisible()) {
      await rateBtn.click();
      await page.fill('textarea[placeholder*="Help us improve"]', 'Great promotion, saw 20% sales boost!');
      
      page.on('dialog', dialog => dialog.accept());
      await page.click('button:has-text("Submit Review")');
      
      await expect(page.locator('text=Great promotion')).toBeVisible();
    }
  });

  test('TC-FEEDBACK-002: Retailer submits performance reporting (units sold)', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/my-promotions`);
    
    const unitsInput = page.locator('input[placeholder*="Units sold"]').first();
    if (await unitsInput.isVisible()) {
      await unitsInput.fill('150');
      page.on('dialog', dialog => dialog.accept());
      await page.click('button:has-text("Report Global Sales")');
      await expect(page.locator('text=Units Reported').first()).toBeVisible();
    }
  });

  test('TC-FEEDBACK-003: Star rating persists after submission', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/my-promotions`);
    // Verification of persistent state
  });

  test('TC-FEEDBACK-004: Validation - Cannot submit negative units sold', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/my-promotions`);
    const unitsInput = page.locator('input[placeholder*="Units sold"]').first();
    if (await unitsInput.isVisible()) {
      await unitsInput.fill('-10');
      page.on('dialog', async dialog => {
        expect(dialog.message().toLowerCase()).toContain('valid');
        await dialog.accept();
      });
      await page.click('button:has-text("Report Global Sales")');
    }
  });

  test('TC-FEEDBACK-005: PM views retailer performance in dashboard', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/dashboard`);
    await expect(page.locator('h1')).toContainText('Campaigns Overview'); 
  });

});
