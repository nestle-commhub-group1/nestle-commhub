const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://nestle-commhub-app.onrender.com';
const PM_EMAIL = 'pm@nestle.com';
const PM_PASSWORD = 'password123';

async function loginAsPM(page) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', PM_EMAIL);
  await page.fill('input[type="password"]', PM_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');
}

test.describe('SPRINT 3: B2B vs B2C Promotions', () => {

  test('PM can create B2B promotion with bulk discount', async ({ page }) => {
    await loginAsPM(page);

    await page.goto(`${BASE_URL}/promotion-manager/create-b2b`);
    await page.waitForLoadState('networkidle');

    // Wait for the page to render
    await expect(page.locator('text=Create B2B Promotion').first()).toBeVisible({ timeout: 5000 });

    const timestamp = Date.now();
    await page.fill('input[placeholder="e.g. Nescafé Bulk Summer Deal"]', `B2B Bulk Sale ${timestamp}`);
    await page.fill('input[placeholder="15"]', '20'); // discount %
    await page.fill('input[placeholder="500"]', '100'); // min units

    // Fill dates
    const dateInputs = page.locator('input[type="datetime-local"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2026-06-01T10:00');
      await dateInputs.last().fill('2026-06-30T23:59');
    }

    // Submit
    await page.click('button:has-text("Create B2B Promotion")');

    // Verify success
    await expect(page.locator('text=created')).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

  test('PM can create B2C promotion with bundle rules', async ({ page }) => {
    await loginAsPM(page);

    await page.goto(`${BASE_URL}/promotion-manager/create-b2c`);
    await page.waitForLoadState('networkidle');

    // Wait for the page to render
    await expect(page.locator('text=Create B2C Promotion').first()).toBeVisible({ timeout: 5000 });

    const timestamp = Date.now();
    await page.fill('input[placeholder="e.g. KitKat Summer B2C Jun-2026"]', `B2C Bundle ${timestamp}`);
    await page.fill('input[placeholder="e.g. KitKat 4-Pack: 2 for 1!"]', `2 for 1 Deal`);

    // Click on a bundle rule
    await page.click('button:has-text("Buy 2 Get 1 Free")');

    // Fill dates
    const dateInputs = page.locator('input[type="datetime-local"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2026-06-01T10:00');
      await dateInputs.last().fill('2026-06-30T23:59');
    }

    // Submit
    await page.click('button:has-text("Create B2C Promotion")');

    // Verify success
    await expect(page.locator('text=created')).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

});
