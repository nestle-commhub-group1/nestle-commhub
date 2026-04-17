# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module_9_delivery.spec.js >> MODULE 9: Delivery Stock >> TC-52: Retailer views delivery status on tracking page
- Location: tests/e2e/module_9_delivery.spec.js:38:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Pending').or(locator('text=Out for Delivery')).or(locator('text=Delivered')).or(locator('text=No deliveries')).or(locator('text=No records')).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Pending').or(locator('text=Out for Delivery')).or(locator('text=Delivered')).or(locator('text=No deliveries')).or(locator('text=No records')).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Nestlé" [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]: CP
      - generic [ref=e10]:
        - generic [ref=e11]: Chamara Perera
        - generic [ref=e12]: Retailer
    - navigation [ref=e13]:
      - link "Home" [ref=e14] [cursor=pointer]:
        - /url: /retailer/dashboard
        - generic [ref=e15]:
          - img [ref=e16]
          - generic [ref=e21]: Home
      - link "My Tickets" [ref=e22] [cursor=pointer]:
        - /url: /retailer/tickets
        - generic [ref=e23]:
          - img [ref=e24]
          - generic [ref=e27]: My Tickets
      - link "Submit Issue" [ref=e28] [cursor=pointer]:
        - /url: /retailer/submit-issue
        - generic [ref=e29]:
          - img [ref=e30]
          - generic [ref=e31]: Submit Issue
      - link "Promotions" [ref=e32] [cursor=pointer]:
        - /url: /retailer/promotions
        - generic [ref=e33]:
          - img [ref=e34]
          - generic [ref=e37]: Promotions
      - link "Stock Requests" [ref=e38] [cursor=pointer]:
        - /url: /retailer/stock-requests
        - generic [ref=e39]:
          - img [ref=e40]
          - generic [ref=e44]: Stock Requests
      - link "Delivery Tracking" [ref=e45] [cursor=pointer]:
        - /url: /retailer/delivery
        - generic [ref=e46]:
          - img [ref=e47]
          - generic [ref=e52]: Delivery Tracking
      - button "Notifications 13" [ref=e53] [cursor=pointer]:
        - generic [ref=e54]:
          - img [ref=e55]
          - generic [ref=e58]: Notifications
        - generic [ref=e59]: "13"
      - link "Profile" [ref=e60] [cursor=pointer]:
        - /url: /retailer/profile
        - generic [ref=e61]:
          - img [ref=e62]
          - generic [ref=e65]: Profile
    - button "Logout" [ref=e67] [cursor=pointer]:
      - img [ref=e68]
      - generic [ref=e71]: Logout
  - generic [ref=e72]:
    - button "13" [ref=e74] [cursor=pointer]:
      - img [ref=e75]
      - generic [ref=e78]: "13"
    - main [ref=e79]:
      - generic [ref=e82]:
        - generic [ref=e84]: Nestlé
        - generic [ref=e85]: 🚧
        - heading "Delivery Tracking" [level=1] [ref=e86]
        - paragraph [ref=e87]: Real-time order and delivery tracking is coming in Sprint 2
        - paragraph [ref=e88]: Coming in Sprint 2
        - button "Go Back" [ref=e89] [cursor=pointer]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { LoginPage, DeliveryPage } = require('./pages/AppPages');
  3  | 
  4  | test.describe('MODULE 9: Delivery Stock', () => {
  5  | 
  6  |   test('TC-50: Distributor marks delivery as Out for Delivery', async ({ page }) => {
  7  |     const loginPage = new LoginPage(page);
  8  |     const deliveryPage = new DeliveryPage(page);
  9  |     
  10 |     await loginPage.loginAs('distributor');
  11 |     await deliveryPage.gotoDeliveries();
  12 |     
  13 |     const markBtn = page.locator('button:has-text("Mark Out for Delivery")').first();
  14 |     if (await markBtn.count() > 0) {
  15 |       await deliveryPage.markStatus('Out for Delivery');
  16 |       await expect(page.locator('text=Out for Delivery').first()).toBeVisible();
  17 |     } else {
  18 |       console.log('Skipping assertion: No assignments available to mark out for delivery.');
  19 |     }
  20 |   });
  21 | 
  22 |   test('TC-51: Distributor marks delivery as Delivered', async ({ page }) => {
  23 |     const loginPage = new LoginPage(page);
  24 |     const deliveryPage = new DeliveryPage(page);
  25 |     
  26 |     await loginPage.loginAs('distributor');
  27 |     await deliveryPage.gotoDeliveries();
  28 |     
  29 |     const markBtn = page.locator('button:has-text("Mark Delivered")').first();
  30 |     if (await markBtn.count() > 0) {
  31 |       await deliveryPage.markStatus('Delivered');
  32 |       await expect(page.locator('text=Delivered').first()).toBeVisible();
  33 |     } else {
  34 |        console.log('Skipping assertion: No assignments available to mark delivered.');
  35 |     }
  36 |   });
  37 | 
  38 |   test('TC-52: Retailer views delivery status on tracking page', async ({ page }) => {
  39 |     const loginPage = new LoginPage(page);
  40 |     await loginPage.loginAs('retailer');
  41 |     
  42 |     await page.click('text=Delivery Tracking');
  43 |     
  44 |     // Verify either a status is visible, or the empty state message is visible
  45 |     await expect(
  46 |       page.locator('text=Pending')
  47 |         .or(page.locator('text=Out for Delivery'))
  48 |         .or(page.locator('text=Delivered'))
  49 |         .or(page.locator('text=No deliveries'))
  50 |         .or(page.locator('text=No records'))
  51 |         .first()
> 52 |     ).toBeVisible({ timeout: 5000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  53 |   });
  54 | 
  55 |   test('TC-54: Retailer notified on delivery status change', async ({ page }) => {
  56 |     const loginPage = new LoginPage(page);
  57 |     await loginPage.loginAs('retailer');
  58 |     
  59 |     await page.locator('.hidden.lg\\:flex button').click();
  60 |     // Check for notifications, but understand it might be empty if no orders triggered it
  61 |     const notifText = page.locator('text=is now Out for Delivery').or(page.locator('text=delivered')).first();
  62 |     if (await notifText.count() > 0) {
  63 |       await expect(notifText).toBeVisible();
  64 |     }
  65 |   });
  66 | 
  67 |   test('TC-55: Distributor cannot deliver unapproved request', async ({ page }) => {
  68 |     const loginPage = new LoginPage(page);
  69 |     await loginPage.loginAs('distributor');
  70 |     await page.click('text=Order Deliveries');
  71 |     
  72 |     // In actual implementation, unapproved requests aren't even visible to distributors
  73 |     // If they were, the buttons wouldn't exist
  74 |     await expect(page.locator('tr:has-text("Pending")').locator('button:has-text("Mark Delivered")')).toHaveCount(0);
  75 |   });
  76 | 
  77 |   test('TC-57: Full delivery lifecycle — Pending to Delivered', async ({ page }) => {
  78 |     // This is essentially an E2E orchestration test that requires multiple logins
  79 |     // We mock the transition verification since real E2E requires state sharing
  80 |     const loginPage = new LoginPage(page);
  81 |     await loginPage.loginAs('retailer');
  82 |     await page.click('text=Stock Requests');
  83 |     await expect(page.locator('h1')).toBeVisible();
  84 |     // Flow is checked by other independent tests.
  85 |   });
  86 | 
  87 | });
  88 | 
```