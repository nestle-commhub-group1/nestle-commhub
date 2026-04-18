import { test, expect } from '@playwright/test';
import testData from '../config/test-data.json';

const { baseUrl, password, accounts } = testData;

test.describe('Sprint 3: Promotion Rewards & Credit System (5 Cases)', () => {
  test.describe.configure({ mode: 'serial' });
  
  async function login(page, email, password) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Loading')).toBeHidden({ timeout: 15000 });
    await expect(page).not.toHaveURL(/.*login/);
  }

  test('TC-REWARD-001/002: Full Lifecycle - Opt-in, Report, and PM Approval', async ({ page }) => {
    // 1. Retailer navigates to promotions
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    await page.waitForLoadState('networkidle');

    // Pick the first promotion title
    const promoTitle = await page.locator('h3').first().textContent();
    console.log(`Testing with promotion: ${promoTitle}`);

    // Opt-in step - only if the button is present
    const optInBtn = page.locator('button:has-text("Opt In Now")').first();
    if (await optInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Opt In...');
      // Use page.on so ALL dialogs (success OR error) are auto-accepted
      page.on('dialog', dialog => dialog.accept());
      await optInBtn.click();
      // Wait for API + re-render — reload guarantees fresh state
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // After reload: verify "Opted In" button is present (the fix to PromotionsWall.jsx makes this work now)
    await expect(page.locator('button:has-text("Opted In")').first()).toBeVisible({ timeout: 10000 });
    console.log('Opt-in confirmed.');

    // Rate Campaign step - only if not already rated
    const rateBtn = page.locator('button:has-text("Rate Campaign")').first();
    if (await rateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Submitting Sales Report...');
      await rateBtn.click();
      await page.fill('input[placeholder*="products sold today"]', '500');
      // Set rating slider to 8
      await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"]');
        if (slider) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(slider, '8');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.fill('textarea[placeholder*="Help us improve"]', 'Great sales performance!');
      
      page.on('dialog', dialog => dialog.accept());
      await page.click('button:has-text("Submit Review")');
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      console.log('Sales report submitted.');
    } else {
      console.log('Already rated, skipping rate step.');
    }

    // 2. PM approves reward
    await login(page, accounts.pm.email, password);
    await page.goto(`${baseUrl}/promotion-manager/dashboard`);
    await page.waitForLoadState('networkidle');

    const pmPromoCard = page.locator('div.bg-white', { hasText: promoTitle }).first();
    
    const salesBtn = pmPromoCard.locator('button:has-text("Sales & Rewards")');
    if (await salesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await salesBtn.click();
    }

    const approveBtn = pmPromoCard.locator('button:has-text("Approve & Pay")').first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Approving reward...');
      page.on('dialog', dialog => dialog.accept());
      await approveBtn.click();
      await page.waitForTimeout(2000);
      await expect(pmPromoCard.locator('text=Paid').first()).toBeVisible({ timeout: 10000 });
      console.log('Reward approved!');
    } else {
      console.log('No approve button visible - reward may already be paid.');
      // Still check that there is a "Paid" indicator
      await expect(pmPromoCard.locator('text=Paid').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-REWARD-003: Check Rewards Wallet', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/promotions`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=Rewards Wallet')).toBeVisible();
    
    // The wallet shows "X CREDITS" - grab the full text
    const walletText = await page.locator('.bg-nestle-brown').first().textContent();
    console.log(`Wallet text: ${walletText}`);
    
    // Extract a number from the wallet area
    const numbers = walletText.match(/[\d,]+/g);
    const balance = numbers ? parseInt(numbers[0].replace(',', '')) : 0;
    console.log(`Retailer credit balance: ${balance}`);
    
    expect(balance).toBeGreaterThan(0);
  });

  test('TC-REWARD-004: Apply credit discount in checkout', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/stock-requests`);
    await page.waitForLoadState('networkidle');
    
    // Add one item to cart
    await page.locator('button:has(svg[class*="lucide-plus"])').first().click();
    await page.waitForTimeout(500);
    
    const applyBtn = page.locator('button:has-text("Apply")');
    const isEnabled = await applyBtn.isEnabled({ timeout: 5000 }).catch(() => false);
    
    if (isEnabled) {
      await applyBtn.click();
      await expect(page.locator('text=Applied')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Credit Discount')).toBeVisible({ timeout: 5000 });
      console.log('Credits applied successfully.');
    } else {
      console.log('Apply button is disabled (user may have no credits). Skipping apply step.');
      // This is an acceptable outcome if TC-002 has not run or credits are 0
      throw new Error('Apply button disabled - credits not yet issued. Ensure TC-REWARD-001/002 runs first.');
    }
  });

  test('TC-REWARD-005: Final total calculation verification', async ({ page }) => {
    await login(page, accounts.retailer1.email, password);
    await page.goto(`${baseUrl}/retailer/stock-requests`);
    await page.waitForLoadState('networkidle');
    
    await page.locator('button:has(svg[class*="lucide-plus"])').first().click();
    await page.waitForTimeout(500);
    
    // Get subtotal text before applying credits
    const subtotalEl = page.locator('text=Subtotal').first();
    const subtotalText = await subtotalEl.textContent();
    
    const applyBtn = page.locator('button:has-text("Apply")');
    await expect(applyBtn).toBeEnabled({ timeout: 5000 });
    await applyBtn.click();
    
    await page.waitForTimeout(1000);
    
    // Get total after credits applied
    const totalText = await page.locator('text=Total').last().textContent();
    const subtotal = parseFloat(subtotalText.replace(/[^\d.]/g, ''));
    const total = parseFloat(totalText.replace(/[^\d.]/g, ''));
    
    console.log(`Subtotal: ${subtotal} | Total after credits: ${total}`);
    expect(total).toBeLessThan(subtotal);
  });
});
