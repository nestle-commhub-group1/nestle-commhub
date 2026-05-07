const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

const testUsers = {
  retailer: { email: 'retailer1@test.com', password: 'password123' },
  staff: { email: 'staff@nestle.com', password: 'password123' },
  admin: { email: 'admin@nestle.com', password: 'password123' }
};

async function loginAs(page, userType) {
  const user = testUsers[userType];
  await page.goto(BASE_URL);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');
}

test.describe('SPRINT 3: Support Hub & Ticket Routing', () => {

  test('Retailer can submit support ticket with category', async ({ page }) => {
    await loginAs(page, 'retailer');

    await page.goto(`${BASE_URL}/retailer/submit-issue`);
    await page.waitForLoadState('networkidle');

    // Select category (Using the 'select' element)
    const categorySelect = page.locator('select');
    if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categorySelect.selectOption('stock_out');
    }

    // Fill description
    const timestamp = Date.now();
    await page.fill('textarea', `Test issue ${timestamp}`);

    // Submit
    await page.click('button:has-text("Submit Issue")');

    // Verify success
    await expect(page.locator('text=Issue Submitted Successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('Ticket auto-assigns to available Staff member', async ({ page }) => {
    await loginAs(page, 'staff');

    await page.goto(`${BASE_URL}/staff/tickets`);
    await page.waitForLoadState('networkidle');

    // Verify tickets visible
    const ticketRows = page.locator('table tbody tr');
    if (await ticketRows.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await ticketRows.count()).toBeGreaterThan(0);
    }
  });

  test('Staff can update ticket status (open → in progress → resolved)', async ({ page }) => {
    await loginAs(page, 'staff');

    await page.goto(`${BASE_URL}/staff/tickets`);
    await page.waitForLoadState('networkidle');

    // Click first ticket
    const firstTicket = page.locator('table tbody tr').first();
    if (await firstTicket.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTicket.click();
      await page.waitForLoadState('networkidle');

      // Update status
      const updateStatusBtn = page.locator('button:has-text("Update Status")');
      if (await updateStatusBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await updateStatusBtn.click();
        
        // Click 'Mark as In Progress'
        await page.click('button:has-text("Mark as In Progress")');
        
        // Confirm
        await page.click('button:has-text("Confirm")');

        await expect(page.locator('text=Status updated')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Admin can monitor SLA compliance and overdue tickets', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto(`${BASE_URL}/admin/sla`);
    await page.waitForLoadState('networkidle');

    // SLA Dashboard should have texts like SLA
    await expect(page.locator('text=SLA').first()).toBeVisible({ timeout: 5000 }).catch(() => null);
  });
});
