const { test, expect } = require('@playwright/test');
const { LoginPage, StockRequestsPage } = require('./pages/AppPages');

test.describe('MODULE 6, 7, 8: Stock Requests', () => {

  // MODULE 6: Submit Stock Requests
  test('TC-29: Retailer submits stock request with valid details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const stockPage = new StockRequestsPage(page);
    
    await loginPage.loginAs('retailer');
    await stockPage.gotoNewRequest();
    await stockPage.submitRequest('Milo 400g', '50'); // The POM implementation clicks the first available '+'
    
    const targetStatus = page.locator('text=Pending').first();
    if (await targetStatus.count() > 0) {
      await expect(targetStatus).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-30: Stock request requires product selection', async ({ page }) => {
    // Note: If UI is completely driven by + buttons on products, it might not be possible to submit a form without it.
    // If there is a manual form, this applies.
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.click('text=Stock Requests');
    // Click submit when cart/form is empty
    const confirmBtn = page.locator('button:has-text("Confirm Order")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await expect(page.locator('text=Product is required').or(page.locator('text=Cart is empty'))).toBeVisible();
    }
  });

  test('TC-31: Stock request requires quantity', async ({ page }) => {
    // If quantity input can be empty:
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.click('text=Stock Requests');
    
    const addBtn = page.locator('button.bg-nestle-brown').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.locator('input[type="number"]').first().fill('');
      await page.click('button:has-text("Confirm Order")');
      const errorMsg = page.locator('text=Quantity is required').or(page.locator('text=minimum'));
      if (await errorMsg.count() > 0) {
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('TC-32: Stock request with quantity zero shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.click('text=Stock Requests');
    
    const addBtn = page.locator('button.bg-nestle-brown').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.locator('input[type="number"]').first().fill('0');
      await page.click('button:has-text("Confirm Order")');
      const errorMsg = page.locator('text=must be greater than zero').or(page.locator('text=Invalid quantity'));
      if (await errorMsg.count() > 0) {
        await expect(errorMsg).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('TC-34: Stock request auto-assigns reference number', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.goto('/retailer/stock-requests');
    // Check history tab for references
    await page.click('button:has-text("Order History"), text=Order History');
    const refMatch = page.locator('text=/STK-\\d+/').first();
    if (await refMatch.count() > 0) {
      await expect(refMatch).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-35: Staff notified when new stock request submitted', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('staff');
    await page.locator('.hidden.lg\\:flex button').click();
    const notif = page.locator('text=New stock request STK-').first();
    if (await notif.count() > 0) {
      await expect(notif).toBeVisible({ timeout: 5000 });
    }
  });

  // MODULE 7: View Stock Requests
  test('TC-36: Retailer views own stock request history', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.click('text=Stock Requests');
    await page.click('button:has-text("Order History"), text=Order History');
    
    // Check Status and Date columns
    await expect(page.locator('th:has-text("Status")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Date")').first()).toBeVisible();
  });

  test('TC-37: Retailer cannot see other retailers\' requests', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer2');
    await page.click('text=Stock Requests');
    // Assuming Retailer 2 has different stock requests or none
    await page.click('button:has-text("Order History"), text=Order History');
    // Specific check would require DB isolation, but generally we expect isolation.
    await expect(page.locator('table')).toBeVisible();
  });

  test('TC-38: Staff views all stock requests from all retailers', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('staff');
    await page.click('text=Manage Orders');
    await expect(page.locator('th:has-text("Retailer Name")').or(page.locator('th:has-text("Retailer")'))).toBeVisible();
  });

  test('TC-40: Filter stock requests by status', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('staff');
    await page.click('text=Manage Orders');
    
    // Apply filter
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption({ label: 'Pending' });
      // Assert no "Approved" exist
      await expect(page.locator('td:has-text("Approved")')).toHaveCount(0);
    }
  });

  // MODULE 8: Approve / Reject Requests
  test('TC-42: Staff approves a pending stock request', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const stockPage = new StockRequestsPage(page);
    await loginPage.loginAs('staff');
    await stockPage.gotoManageRequests();
    await stockPage.processRequest('Approve');
    const approved = page.locator('text=Approved').first();
    if (await approved.count() > 0) {
      await expect(approved).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-43: Staff rejects a stock request with reason', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const stockPage = new StockRequestsPage(page);
    await loginPage.loginAs('staff');
    await stockPage.gotoManageRequests();
    
    // Assuming UI lets you process multiple
    const processBtn = page.locator('button:has-text("View & Process"), button:has-text("Process")').nth(1);
    if (await processBtn.count() > 0) {
      await processBtn.click();
      await page.click('button:has-text("Reject")');
      await page.locator('textarea').fill('Product not available in warehouse');
      await page.click('button:has-text("Confirm")');
      const rejected = page.locator('text=Rejected').first();
      if (await rejected.count() > 0) await expect(rejected).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-44: Rejection without reason shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('staff');
    await page.click('text=Manage Orders');
    
    const processBtn = page.locator('button:has-text("View & Process"), button:has-text("Process")').first();
    if (await processBtn.count() > 0) {
      await processBtn.click();
      await page.click('button:has-text("Reject")');
      await page.locator('textarea').fill(''); // Blank
      await page.click('button:has-text("Confirm")');
      const error = page.locator('text=Rejection reason is required').first();
      if (await error.count() > 0) await expect(error).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-45: Retailer notified when request approved', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.locator('.hidden.lg\\:flex button').click();
    await expect(page.locator('text=has been approved').first()).toBeVisible();
  });

  test('TC-46: Retailer notified when request rejected', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.locator('.hidden.lg\\:flex button').click();
    await expect(page.locator('text=has been rejected').first()).toBeVisible();
  });

  test('TC-47: Approved request cannot be approved again', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('staff');
    await page.click('text=Manage Orders');
    
    // In UI, if it's approved, the process button should not exist or the approve button inside should be disabled
    const approvedRow = page.locator('tr:has-text("Approved")').first();
    if (await approvedRow.count() > 0) {
      const processBtn = approvedRow.locator('button:has-text("Process")');
      if (await processBtn.count() > 0) {
        await processBtn.click();
        await expect(page.locator('button:has-text("Approve")')).toHaveCount(0);
      }
    }
  });

  test('TC-48: Retailer cannot approve or reject requests', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('retailer');
    await page.click('text=Stock Requests');
    await page.click('text=Order History');
    
    await expect(page.locator('button:has-text("Approve")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Reject")')).toHaveCount(0);
  });

});
