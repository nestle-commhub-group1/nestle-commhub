# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module_6_7_8_stock.spec.js >> MODULE 6, 7, 8: Stock Requests >> TC-43: Staff rejects a stock request with reason
- Location: tests/e2e/module_6_7_8_stock.spec.js:148:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Manage Orders')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - img "Nestlé" [ref=e6]
    - paragraph [ref=e7]: CommHub
  - generic [ref=e8]:
    - generic [ref=e9]:
      - heading "Welcome back" [level=1] [ref=e10]
      - paragraph [ref=e11]: Sign in to your Nestlé CommHub account
    - generic [ref=e12]: Invalid email or password
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email *
        - textbox "john@example.com" [ref=e16]: staff1@nestle.com
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Password *
          - link "Forgot password?" [ref=e20] [cursor=pointer]:
            - /url: /forgot-password
        - generic [ref=e21]:
          - textbox "••••••••" [ref=e22]: password123
          - button [ref=e23] [cursor=pointer]:
            - img [ref=e24]
      - button "Sign in" [ref=e27] [cursor=pointer]
    - paragraph [ref=e28]:
      - text: Don't have an account?
      - link "Register" [ref=e29] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  44  |     const inputs = this.page.locator('input[type="text"], input:not([type])');
  45  |     if (title) await inputs.first().fill(title);
  46  |     if (desc) await this.page.locator('textarea').fill(desc);
  47  |     
  48  |     // Category select
  49  |     await this.page.locator('select').first().selectOption({ index: 1 });
  50  |     
  51  |     if (discount) await this.page.locator('input[type="number"]').fill(discount.replace('%',''));
  52  |     
  53  |     const dateInputs = this.page.locator('input[type="date"]');
  54  |     if (start) await dateInputs.first().fill(start);
  55  |     if (end) await dateInputs.last().fill(end);
  56  |   }
  57  | 
  58  |   async saveAndPublish() {
  59  |     await this.page.locator('button:has-text("Publish Campaign"), button:has-text("Save")').first().click();
  60  |     await this.page.waitForTimeout(1000);
  61  |   }
  62  | }
  63  | 
  64  | class NotificationsPage {
  65  |   constructor(page) {
  66  |     this.page = page;
  67  |   }
  68  | 
  69  |   async openNotifications() {
  70  |     await this.page.locator('.hidden.lg\\:flex button').click();
  71  |     await expect(this.page.locator('text=Notifications').first()).toBeVisible({ timeout: 5000 });
  72  |   }
  73  | 
  74  |   async getNotificationContent() {
  75  |     return this.page.locator('.divide-y .p-5').first().innerText();
  76  |   }
  77  | 
  78  |   async clickFirstNotification() {
  79  |     await this.page.locator('.divide-y .p-5').first().click();
  80  |     await this.page.waitForTimeout(500);
  81  |   }
  82  | }
  83  | 
  84  | class TicketsPage {
  85  |   constructor(page) {
  86  |     this.page = page;
  87  |   }
  88  | 
  89  |   async gotoTickets() {
  90  |     await this.page.goto('/staff/tickets');
  91  |     await this.page.waitForTimeout(1500);
  92  |   }
  93  | 
  94  |   async openFirstTicket() {
  95  |     await this.page.locator('tr').first().click();
  96  |     await this.page.waitForTimeout(1000);
  97  |   }
  98  | 
  99  |   async requestDetails(msg) {
  100 |     await this.page.click('button:has-text("Request Additional Details"), button:has-text("Request Info")');
  101 |     if (msg) {
  102 |       await this.page.locator('textarea[placeholder*="message"], textarea[name="requestDetails"]').fill(msg);
  103 |     }
  104 |     await this.page.click('button:has-text("Send")');
  105 |     await this.page.waitForTimeout(1000);
  106 |   }
  107 | }
  108 | 
  109 | class StockRequestsPage {
  110 |   constructor(page) {
  111 |     this.page = page;
  112 |   }
  113 | 
  114 |   async gotoNewRequest() {
  115 |     await this.page.click('text=Stock Requests');
  116 |     await this.page.waitForURL('**/stock-requests', { timeout: 10000 }).catch(() => {});
  117 |     await this.page.waitForTimeout(1500);
  118 |   }
  119 | 
  120 |   async submitRequest(productName, qty) {
  121 |     // Navigate using the class selector from Sprint 3
  122 |     const addBtn = this.page.locator('button.bg-nestle-brown').first();
  123 |     if (await addBtn.count() > 0) {
  124 |       await addBtn.click();
  125 |       
  126 |       if (qty && qty !== '1') {
  127 |         const input = this.page.locator('input[type="number"]').first();
  128 |         if (await input.count() > 0) {
  129 |           await input.fill(qty);
  130 |         }
  131 |       }
  132 |       
  133 |       const confirmBtn = this.page.locator('button:has-text("Confirm Order"), button:has-text("Submit Request")');
  134 |       if (await confirmBtn.count() > 0) {
  135 |         await confirmBtn.click();
  136 |       }
  137 |       await this.page.waitForTimeout(1500);
  138 |     } else {
  139 |       console.log('Skipping stock request logic: No products listed on the platform');
  140 |     }
  141 |   }
  142 | 
  143 |   async gotoManageRequests() {
> 144 |     await this.page.click('text=Manage Orders');
      |                     ^ Error: page.click: Test timeout of 30000ms exceeded.
  145 |     await this.page.waitForURL('**/orders', { timeout: 10000 }).catch(() => {});
  146 |     await this.page.waitForTimeout(1500);
  147 |   }
  148 | 
  149 |   async processRequest(action, reason) {
  150 |     const processBtn = this.page.locator('button:has-text("View & Process"), button:has-text("Process"), button:has-text("View")').first();
  151 |     if (await processBtn.count() > 0) {
  152 |       await processBtn.click();
  153 |       
  154 |       await this.page.waitForTimeout(500);
  155 |       if (action === 'Approve') {
  156 |         // Find a way to select approved if it's a dropdown, or click an Approve button
  157 |         const approveBtn = this.page.locator('button:has-text("Approve")');
  158 |         if (await approveBtn.count() > 0) {
  159 |            await approveBtn.click();
  160 |         } else {
  161 |            // Fallback to select dropdown if used like in Sprint 3
  162 |            const selectStatus = this.page.locator('select').first();
  163 |            if (await selectStatus.count() > 0) await selectStatus.selectOption('accepted');
  164 |         }
  165 | 
  166 |         const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Update")').first();
  167 |         if (await confirmBtn.count() > 0) await confirmBtn.click();
  168 |       } else {
  169 |         const rejectBtn = this.page.locator('button:has-text("Reject")');
  170 |         if (await rejectBtn.count() > 0) await rejectBtn.click();
  171 |         
  172 |         if (reason) await this.page.locator('textarea').fill(reason);
  173 |         const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Update")').first();
  174 |         if (await confirmBtn.count() > 0) await confirmBtn.click();
  175 |       }
  176 |       await this.page.waitForTimeout(1500);
  177 |     } else {
  178 |       console.log('No pending requests found to process');
  179 |     }
  180 |   }
  181 | }
  182 | 
  183 | class DeliveryPage {
  184 |   constructor(page) {
  185 |     this.page = page;
  186 |   }
  187 | 
  188 |   async gotoDeliveries() {
  189 |     await this.page.click('button:has-text("Order Deliveries"), text=Deliveries');
  190 |     await this.page.waitForTimeout(1500);
  191 |   }
  192 | 
  193 |   async markStatus(status) {
  194 |     const btnText = status === 'Out for Delivery' ? 'Mark Out for Delivery' : 'Mark Delivered';
  195 |     await this.page.click(`button:has-text("${btnText}")`);
  196 |     await this.page.waitForTimeout(1500);
  197 |   }
  198 | }
  199 | 
  200 | module.exports = {
  201 |   LoginPage,
  202 |   PromotionsPage,
  203 |   NotificationsPage,
  204 |   TicketsPage,
  205 |   StockRequestsPage,
  206 |   DeliveryPage
  207 | };
  208 | 
```