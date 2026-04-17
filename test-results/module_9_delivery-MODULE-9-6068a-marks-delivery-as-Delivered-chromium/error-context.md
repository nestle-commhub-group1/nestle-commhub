# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module_9_delivery.spec.js >> MODULE 9: Delivery Stock >> TC-51: Distributor marks delivery as Delivered
- Location: tests/e2e/module_9_delivery.spec.js:22:3

# Error details

```
Error: page.click: Unexpected token "=" while parsing css selector "button:has-text("Order Deliveries"), text=Deliveries". Did you mean to CSS.escape it?
Call log:
  - waiting for button:has-text("Order Deliveries"), text=Deliveries

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Nestlé" [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]: DO
      - generic [ref=e10]:
        - generic [ref=e11]: Distributor One
        - generic [ref=e12]: Distributor
    - navigation [ref=e13]:
      - link "Dashboard" [ref=e14] [cursor=pointer]:
        - /url: /distributor/dashboard
        - generic [ref=e15]:
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
      - link "My Allocations" [ref=e22] [cursor=pointer]:
        - /url: /distributor/dashboard
        - generic [ref=e23]:
          - img [ref=e24]
          - generic [ref=e27]: My Allocations
      - button "Notifications 2" [ref=e28] [cursor=pointer]:
        - generic [ref=e29]:
          - img [ref=e30]
          - generic [ref=e33]: Notifications
        - generic [ref=e34]: "2"
      - link "Profile" [ref=e35] [cursor=pointer]:
        - /url: /distributor/profile
        - generic [ref=e36]:
          - img [ref=e37]
          - generic [ref=e40]: Profile
    - button "Logout" [ref=e42] [cursor=pointer]:
      - img [ref=e43]
      - generic [ref=e46]: Logout
  - generic [ref=e47]:
    - button "2" [ref=e49] [cursor=pointer]:
      - img [ref=e50]
      - generic [ref=e53]: "2"
    - main [ref=e54]:
      - generic [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]:
            - heading "Distributor Dashboard" [level=1] [ref=e59]
            - paragraph [ref=e60]: Real-time logistics and field service management.
          - generic [ref=e61]:
            - button "Support Tickets" [ref=e62] [cursor=pointer]
            - button "Order Deliveries" [ref=e63] [cursor=pointer]
        - generic [ref=e64]:
          - generic [ref=e65]:
            - img [ref=e67]
            - generic [ref=e70]:
              - paragraph [ref=e71]: Active Tickets
              - paragraph [ref=e72]: "0"
          - generic [ref=e73]:
            - img [ref=e75]
            - generic [ref=e80]:
              - paragraph [ref=e81]: Pending Deliveries
              - paragraph [ref=e82]: "1"
          - generic [ref=e83]:
            - img [ref=e85]
            - generic [ref=e88]:
              - paragraph [ref=e89]: Completed Tasks
              - paragraph [ref=e90]: "10"
        - generic [ref=e91]:
          - heading "Active Allocations 0" [level=2] [ref=e92]:
            - text: Active Allocations
            - generic [ref=e93]: "0"
          - generic [ref=e94]:
            - img [ref=e95]
            - paragraph [ref=e98]: No Active Allocations
            - paragraph [ref=e99]: HQ hasn't allocated any issues to you yet.
```

# Test source

```ts
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
  144 |     await this.page.click('text=Manage Orders');
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
> 189 |     await this.page.click('button:has-text("Order Deliveries"), text=Deliveries');
      |                     ^ Error: page.click: Unexpected token "=" while parsing css selector "button:has-text("Order Deliveries"), text=Deliveries". Did you mean to CSS.escape it?
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