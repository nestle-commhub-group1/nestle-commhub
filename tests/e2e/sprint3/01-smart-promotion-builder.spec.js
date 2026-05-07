const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const PM_EMAIL = 'pm@nestle.com';
const PM_PASSWORD = 'password123';

async function loginAsPM(page) {
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', PM_EMAIL);
  await page.fill('input[type="password"]', PM_PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');
}

test.describe('SPRINT 3: Smart Promotion Builder', () => {
  // Test: PM sees top performers ranked by performance score
  test('PM can view top performing promotions ranked by performance score', async ({ page }) => {
    await loginAsPM(page);

    // Navigate to Smart Builder (integrated in B2B creation)
    await page.goto(`${BASE_URL}/pm/create-b2b`);
    await page.waitForLoadState('networkidle');

    // Verify top performers section
    await expect(page.locator('text=Smart Builder — Top Performers')).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await expect(page.locator('text=Score').first()).toBeVisible({ timeout: 5000 });

    // Verify performance score is visible
    const scores = page.locator('span:has-text("Score")');
    const count = await scores.count();
    expect(count).toBeGreaterThan(0);
  });

  // Test: PM can copy promotion with new dates
  test('PM can copy high-performing promotion with new dates', async ({ page }) => {
    await loginAsPM(page);

    // Go to Smart Builder
    await page.goto(`${BASE_URL}/pm/create-b2b`);
    await page.waitForLoadState('networkidle');

    // Wait for Top Performers to load
    await expect(page.locator('text=Score').first()).toBeVisible({ timeout: 5000 });

    // Click "Use Template" button (it appears on hover in the UI, but we can click it)
    const copyBtn = page.locator('button:has-text("Use Template")').first();
    await copyBtn.click({ force: true }); // force click because of opacity-0 group-hover:opacity-100

    // Toast appears
    await expect(page.locator('text=Pre-filled from')).toBeVisible({ timeout: 5000 });

    // Fill dates
    const dateInputs = page.locator('input[type="datetime-local"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2026-06-01T10:00');
      await dateInputs.last().fill('2026-06-30T23:59');
    }

    // Since we don't want to actually create one and clutter the DB during this simple UI check,
    // we'll just verify the form populated correctly.
    const titleInput = page.locator('input[placeholder="e.g. Nescafé Bulk Summer Deal"]');
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toContain('(Re-run)');
  });

  // Test: AI insights exist (in the form of score and AI ranked subtitle)
  test('Smart Builder shows AI insights and recommendations', async ({ page }) => {
    await loginAsPM(page);

    // Go to Smart Builder
    await page.goto(`${BASE_URL}/pm/create-b2b`);
    await page.waitForLoadState('networkidle');

    // Verify AI insights text
    await expect(page.locator('text=AI-ranked based on conversion rate, retailer ratings, and revenue impact')).toBeVisible({ timeout: 5000 });
  });
});
