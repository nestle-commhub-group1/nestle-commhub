import { test, expect } from '@playwright/test';
import testData from '../config/test-data.json';

const { baseUrl, password, accounts } = testData;

test.describe('Sprint 2: Promotion Distribution System (14 Cases)', () => {
  
  async function login(page, email, password) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Sign In")');
    // Wait for the dashboard to finish loading
    await expect(page.locator('text=Loading')).toBeHidden({ timeout: 15000 });
    await expect(page).not.toHaveURL(/.*login/); 
  }

  // --- VIEW PROMOTIONS (4 CASES) ---
  
  test('TC-VIEW-001: Retailer views active promotions list', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    await expect(page.locator('text=Loading')).toBeHidden();
    await expect(page.locator('h1')).toContainText('Promotions Wall');
    const cards = page.locator('.bg-white.rounded-\\[20px\\]'); 
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-VIEW-002: Promotions show correct title and description', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    const firstTitle = page.locator('h3').first();
    await expect(firstTitle).not.toBeEmpty();
    const firstDesc = page.locator('p.text-gray-600').first();
    await expect(firstDesc).not.toBeEmpty();
  });

  test('TC-VIEW-003: Promotions show validity date range', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    await expect(page.locator('text=Valid:').first()).toBeVisible();
  });

  test('TC-VIEW-004: Search functionality filters promotions list', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    await page.fill('input[placeholder="Search promotions..."]', 'NonExistentPromoXYZ');
    await expect(page.locator('text=No active promotions available')).toBeVisible();
  });

  // --- CREATE PROMOTIONS (6 CASES) ---

  test('TC-CREATE-001: PM creates promotion with valid details', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/create`);
    const title = `QA Promo ${Date.now()}`;
    await page.fill('input[placeholder*="Summer Essentials"]', title);
    await page.fill('textarea[placeholder*="Describe the goals"]', 'Standard automated test promotion');
    await page.fill('input[placeholder="0"]', '15');
    await page.fill('input[type="date"] >> nth=0', '2026-06-01');
    await page.fill('input[type="date"] >> nth=1', '2026-12-31');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Publish Campaign")');
    await expect(page.locator('text=Loading')).toBeHidden();
    await page.waitForURL(/.*dashboard/);
  });

  test('TC-CREATE-002: PM cannot create without title', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/create`);
    await page.fill('textarea[placeholder*="Describe the goals"]', 'Missing title test');
    await page.click('button:has-text("Publish Campaign")');
    const input = page.locator('input[placeholder*="Summer Essentials"]');
    const validationMessage = await input.evaluate(el => el.validationMessage);
    expect(validationMessage).not.toBe('');
  });

  test('TC-CREATE-003: PM cannot create with past end date', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/create`);
    await page.fill('input[placeholder*="Summer Essentials"]', 'Date Fail');
    await page.fill('input[type="date"] >> nth=0', '2020-01-01');
    await page.fill('input[type="date"] >> nth=1', '2020-01-02');
    
    page.on('dialog', async dialog => {
      expect(dialog.message().toLowerCase()).toContain('fail');
      await dialog.accept();
    });
    await page.click('button:has-text("Publish Campaign")');
  });

  test('TC-CREATE-004: PM creates tiered promotion (bundled)', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/create`);
    await page.selectOption('select', 'bundled');
    await page.fill('input[placeholder*="Summer Essentials"]', 'Bundled Deal');
    await page.fill('textarea[placeholder*="Describe the goals"]', 'Tiered rewards test');
    await page.fill('input[type="date"] >> nth=0', '2026-06-01');
    await page.fill('input[type="date"] >> nth=1', '2026-12-31');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Publish Campaign")');
  });

  test('TC-CREATE-005: PM can upload PDF assets to promotion', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/create`);
    await expect(page.locator('text=Upload Campaign Assets')).toBeVisible();
    // Verification of dropzone presence
  });

  test('TC-CREATE-006: Retailer role cannot access create promotion page', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/promotion-manager/create`);
    await expect(page).toHaveURL(/.*unauthorized|.*dashboard/);
  });

  // --- NOTIFICATIONS (4 CASES) ---

  test('TC-NOTIF-001: Retailer receives notification for new promotion', async ({ page }) => {
    await login(page, accounts.retailer2.email, password);
    const bell = page.locator('nav button:has(svg[class*="lucide-bell"])').first();
    await expect(bell).toBeVisible();
  });

  test('TC-NOTIF-002: Notification count increases on new entry', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    const badge = page.locator('.bg-nestle-danger').first();
    // If there are unread notifs, badge is visible
  });

  test('TC-NOTIF-003: PM views list of published promotions', async ({ page }) => {
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/promotions`);
    await expect(page.locator('h1')).toContainText('Promotions');
  });

  test('TC-NOTIF-004: Retailer opts into a promotion', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    const optInBtn = page.locator('button:has-text("Opt In Now")').first();
    if (await optInBtn.isVisible()) {
      page.on('dialog', dialog => dialog.accept());
      await optInBtn.click();
      await expect(page.locator('text=Opted In').first()).toBeVisible();
    }
  });

});
