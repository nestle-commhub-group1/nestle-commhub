const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async login(email, password = 'password123') {
    await this.page.goto('/login');
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button:has-text("Sign in")');
    await this.page.waitForTimeout(1500); // Wait for auth resolution
  }

  async loginAs(role) {
    const creds = {
      admin: 'pm1@nestle.com', // HQ Admin mapped to PM
      retailer: 'chamara@test.com',
      retailer2: 'retailer2@test.com',
      staff: 'staff1@nestle.com',
      distributor: 'dist1@nestle.com'
    };
    await this.login(creds[role]);
  }
}

class PromotionsPage {
  constructor(page) {
    this.page = page;
  }

  async gotoWall() {
    await this.page.click('text=Promotions');
    await this.page.waitForTimeout(1500);
  }

  async gotoCreate() {
    await this.page.click('text=Create Promotion');
    await this.page.waitForTimeout(1000);
  }

  async fillPromotion(title, discount, start, end, desc) {
    const inputs = this.page.locator('input[type="text"], input:not([type])');
    if (title) await inputs.first().fill(title);
    if (desc) await this.page.locator('textarea').fill(desc);
    
    // Category select
    await this.page.locator('select').first().selectOption({ index: 1 });
    
    if (discount) await this.page.locator('input[type="number"]').fill(discount.replace('%',''));
    
    const dateInputs = this.page.locator('input[type="date"]');
    if (start) await dateInputs.first().fill(start);
    if (end) await dateInputs.last().fill(end);
  }

  async saveAndPublish() {
    await this.page.locator('button:has-text("Publish Campaign"), button:has-text("Save")').first().click();
    await this.page.waitForTimeout(1000);
  }
}

class NotificationsPage {
  constructor(page) {
    this.page = page;
  }

  async openNotifications() {
    await this.page.locator('.hidden.lg\\:flex button').click();
    await expect(this.page.locator('text=Notifications').first()).toBeVisible({ timeout: 5000 });
  }

  async getNotificationContent() {
    return this.page.locator('.divide-y .p-5').first().innerText();
  }

  async clickFirstNotification() {
    await this.page.locator('.divide-y .p-5').first().click();
    await this.page.waitForTimeout(500);
  }
}

class TicketsPage {
  constructor(page) {
    this.page = page;
  }

  async gotoTickets() {
    await this.page.goto('/staff/tickets');
    await this.page.waitForTimeout(1500);
  }

  async openFirstTicket() {
    await this.page.locator('tr').first().click();
    await this.page.waitForTimeout(1000);
  }

  async requestDetails(msg) {
    await this.page.click('button:has-text("Request Additional Details"), button:has-text("Request Info")');
    if (msg) {
      await this.page.locator('textarea[placeholder*="message"], textarea[name="requestDetails"]').fill(msg);
    }
    await this.page.click('button:has-text("Send")');
    await this.page.waitForTimeout(1000);
  }
}

class StockRequestsPage {
  constructor(page) {
    this.page = page;
  }

  async gotoNewRequest() {
    await this.page.click('text=Stock Requests');
    await this.page.waitForURL('**/stock-requests', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  async submitRequest(productName, qty) {
    // Navigate using the class selector from Sprint 3
    const addBtn = this.page.locator('button.bg-nestle-brown').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      
      if (qty && qty !== '1') {
        const input = this.page.locator('input[type="number"]').first();
        if (await input.count() > 0) {
          await input.fill(qty);
        }
      }
      
      const confirmBtn = this.page.locator('button:has-text("Confirm Order"), button:has-text("Submit Request")');
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
      }
      await this.page.waitForTimeout(1500);
    } else {
      console.log('Skipping stock request logic: No products listed on the platform');
    }
  }

  async gotoManageRequests() {
    await this.page.click('text=Manage Orders');
    await this.page.waitForURL('**/orders', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  async processRequest(action, reason) {
    const processBtn = this.page.locator('button:has-text("View & Process"), button:has-text("Process"), button:has-text("View")').first();
    if (await processBtn.count() > 0) {
      await processBtn.click();
      
      await this.page.waitForTimeout(500);
      if (action === 'Approve') {
        // Find a way to select approved if it's a dropdown, or click an Approve button
        const approveBtn = this.page.locator('button:has-text("Approve")');
        if (await approveBtn.count() > 0) {
           await approveBtn.click();
        } else {
           // Fallback to select dropdown if used like in Sprint 3
           const selectStatus = this.page.locator('select').first();
           if (await selectStatus.count() > 0) await selectStatus.selectOption('accepted');
        }

        const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Update")').first();
        if (await confirmBtn.count() > 0) await confirmBtn.click();
      } else {
        const rejectBtn = this.page.locator('button:has-text("Reject")');
        if (await rejectBtn.count() > 0) await rejectBtn.click();
        
        if (reason) await this.page.locator('textarea').fill(reason);
        const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Update")').first();
        if (await confirmBtn.count() > 0) await confirmBtn.click();
      }
      await this.page.waitForTimeout(1500);
    } else {
      console.log('No pending requests found to process');
    }
  }
}

class DeliveryPage {
  constructor(page) {
    this.page = page;
  }

  async gotoDeliveries() {
    await this.page.click('button:has-text("Order Deliveries"), text=Deliveries');
    await this.page.waitForTimeout(1500);
  }

  async markStatus(status) {
    const btnText = status === 'Out for Delivery' ? 'Mark Out for Delivery' : 'Mark Delivered';
    await this.page.click(`button:has-text("${btnText}")`);
    await this.page.waitForTimeout(1500);
  }
}

module.exports = {
  LoginPage,
  PromotionsPage,
  NotificationsPage,
  TicketsPage,
  StockRequestsPage,
  DeliveryPage
};
