# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module_6_7_8_stock.spec.js >> MODULE 6, 7, 8: Stock Requests >> TC-45: Retailer notified when request approved
- Location: tests/e2e/module_6_7_8_stock.spec.js:182:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=has been approved').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=has been approved').first()

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
    - button "13" [active] [ref=e74] [cursor=pointer]:
      - img [ref=e75]
      - generic [ref=e78]: "13"
    - main [ref=e79]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - heading "Good evening, Chamara 👋" [level=1] [ref=e83]
          - paragraph [ref=e84]: Friday, April 17, 2026
        - generic [ref=e85]:
          - link "Open Tickets 0 Awaiting response" [ref=e86] [cursor=pointer]:
            - /url: /retailer/dashboard
            - generic [ref=e88]:
              - paragraph [ref=e89]: Open Tickets
              - paragraph [ref=e90]: "0"
              - paragraph [ref=e91]: Awaiting response
            - img [ref=e93]
          - link "In Progress 0 Being handled" [ref=e96] [cursor=pointer]:
            - /url: /retailer/dashboard
            - generic [ref=e98]:
              - paragraph [ref=e99]: In Progress
              - paragraph [ref=e100]: "0"
              - paragraph [ref=e101]: Being handled
            - img [ref=e103]
          - link "Resolved 5 Completed" [ref=e107] [cursor=pointer]:
            - /url: /retailer/dashboard
            - generic [ref=e109]:
              - paragraph [ref=e110]: Resolved
              - paragraph [ref=e111]: "5"
              - paragraph [ref=e112]: Completed
            - img [ref=e114]
          - link "Promotions 3 Currently active" [ref=e117] [cursor=pointer]:
            - /url: /retailer/dashboard
            - generic [ref=e119]:
              - paragraph [ref=e120]: Promotions
              - paragraph [ref=e121]: "3"
              - paragraph [ref=e122]: Currently active
            - img [ref=e124]
        - generic [ref=e127]:
          - generic [ref=e128]:
            - heading "Recent Tickets" [level=2] [ref=e129]
            - generic [ref=e130]:
              - button "Refresh" [ref=e131] [cursor=pointer]:
                - img [ref=e132]
                - text: Refresh
              - link "View All ›" [ref=e137] [cursor=pointer]:
                - /url: /retailer/tickets
                - text: View All
                - generic [ref=e138]: ›
          - table [ref=e140]:
            - rowgroup [ref=e141]:
              - row "Ticket ID Issue Type Priority Status Date" [ref=e142]:
                - columnheader "Ticket ID" [ref=e143]
                - columnheader "Issue Type" [ref=e144]
                - columnheader "Priority" [ref=e145]
                - columnheader "Status" [ref=e146]
                - columnheader "Date" [ref=e147]
            - rowgroup [ref=e148]:
              - row "TKT-1047 Stock Out MEDIUM RESOLVED Mar 22, 2026" [ref=e149]:
                - cell "TKT-1047" [ref=e150]
                - cell "Stock Out" [ref=e151]
                - cell "MEDIUM" [ref=e152]
                - cell "RESOLVED" [ref=e153]
                - cell "Mar 22, 2026" [ref=e154]
              - row "TKT-1046 Pricing Issue HIGH ESCALATED Mar 22, 2026" [ref=e155]:
                - cell "TKT-1046" [ref=e156]
                - cell "Pricing Issue" [ref=e157]
                - cell "HIGH" [ref=e158]
                - cell "ESCALATED" [ref=e159]
                - cell "Mar 22, 2026" [ref=e160]
              - row "TKT-1045 Stock Out HIGH ESCALATED Mar 22, 2026" [ref=e161]:
                - cell "TKT-1045" [ref=e162]
                - cell "Stock Out" [ref=e163]
                - cell "HIGH" [ref=e164]
                - cell "ESCALATED" [ref=e165]
                - cell "Mar 22, 2026" [ref=e166]
              - row "TKT-1044 Logistics Delay HIGH ESCALATED Mar 22, 2026" [ref=e167]:
                - cell "TKT-1044" [ref=e168]
                - cell "Logistics Delay" [ref=e169]
                - cell "HIGH" [ref=e170]
                - cell "ESCALATED" [ref=e171]
                - cell "Mar 22, 2026" [ref=e172]
          - generic [ref=e174]:
            - button "‹" [ref=e175] [cursor=pointer]
            - button "1" [ref=e176] [cursor=pointer]
            - button "2" [ref=e177] [cursor=pointer]
            - button "›" [ref=e178] [cursor=pointer]
        - generic [ref=e179]:
          - img [ref=e181]
          - heading "Promotions Coming Soon" [level=3] [ref=e184]
          - paragraph [ref=e185]: Our personalized promotion system is currently under development and will be available in Sprint 2.
          - generic [ref=e186]: Sprint 2 Development
        - generic [ref=e187]:
          - button "Request Stock Order additional inventory" [ref=e188] [cursor=pointer]:
            - img [ref=e190]
            - generic [ref=e194]:
              - heading "Request Stock" [level=3] [ref=e195]
              - paragraph [ref=e196]: Order additional inventory
          - button "Track Delivery Check your delivery status" [ref=e197] [cursor=pointer]:
            - img [ref=e199]
            - generic [ref=e204]:
              - heading "Track Delivery" [level=3] [ref=e205]
              - paragraph [ref=e206]: Check your delivery status
  - generic [ref=e208]:
    - generic [ref=e209]:
      - generic [ref=e210]:
        - img [ref=e211]
        - heading "Notifications" [level=2] [ref=e214]
        - generic [ref=e215]: "13"
      - generic [ref=e216]:
        - button "Mark all as read" [ref=e217] [cursor=pointer]
        - button [ref=e218] [cursor=pointer]:
          - img [ref=e219]
    - generic [ref=e223]:
      - generic [ref=e224] [cursor=pointer]:
        - img [ref=e226]
        - generic [ref=e229]:
          - paragraph [ref=e230]: "New promotion available: Invalid Date Promo"
          - paragraph [ref=e231]: 42 seconds ago
      - generic [ref=e232] [cursor=pointer]:
        - img [ref=e234]
        - generic [ref=e237]:
          - paragraph [ref=e238]: "New promotion available: Nescafe Promo"
          - paragraph [ref=e239]: 42 seconds ago
      - generic [ref=e241] [cursor=pointer]:
        - img [ref=e243]
        - generic [ref=e246]:
          - paragraph [ref=e247]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e248]: 4 minutes ago
      - generic [ref=e250] [cursor=pointer]:
        - img [ref=e252]
        - generic [ref=e255]:
          - paragraph [ref=e256]: "New promotion available: Invalid Date Promo"
          - paragraph [ref=e257]: 5 minutes ago
      - generic [ref=e258] [cursor=pointer]:
        - img [ref=e260]
        - generic [ref=e263]:
          - paragraph [ref=e264]: "New promotion available: Nescafe Promo"
          - paragraph [ref=e265]: 5 minutes ago
      - generic [ref=e267] [cursor=pointer]:
        - img [ref=e269]
        - generic [ref=e272]:
          - paragraph [ref=e273]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e274]: 9 minutes ago
      - generic [ref=e276] [cursor=pointer]:
        - img [ref=e278]
        - generic [ref=e281]:
          - paragraph [ref=e282]: "New promotion available: Invalid Date Promo"
          - paragraph [ref=e283]: 10 minutes ago
      - generic [ref=e284] [cursor=pointer]:
        - img [ref=e286]
        - generic [ref=e289]:
          - paragraph [ref=e290]: "New promotion available: Nescafe Promo"
          - paragraph [ref=e291]: 10 minutes ago
      - generic [ref=e293] [cursor=pointer]:
        - img [ref=e295]
        - generic [ref=e298]:
          - paragraph [ref=e299]: "New promotion available: Invalid Date Promo"
          - paragraph [ref=e300]: 15 minutes ago
      - generic [ref=e302] [cursor=pointer]:
        - img [ref=e304]
        - generic [ref=e307]:
          - paragraph [ref=e308]: "New promotion available: Nescafe Promo"
          - paragraph [ref=e309]: 16 minutes ago
      - generic [ref=e311] [cursor=pointer]:
        - img [ref=e313]
        - generic [ref=e316]:
          - paragraph [ref=e317]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e318]: 1 hours ago
      - generic [ref=e320] [cursor=pointer]:
        - img [ref=e322]
        - generic [ref=e325]:
          - paragraph [ref=e326]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e327]: 1 hours ago
      - generic [ref=e329] [cursor=pointer]:
        - img [ref=e331]
        - generic [ref=e334]:
          - paragraph [ref=e335]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e336]: 1 hours ago
      - generic [ref=e338] [cursor=pointer]:
        - img [ref=e340]
        - generic [ref=e343]:
          - paragraph [ref=e344]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e345]: 1 hours ago
      - generic [ref=e347] [cursor=pointer]:
        - img [ref=e349]
        - generic [ref=e352]:
          - paragraph [ref=e353]: "A distributor has been assigned to deliver promotional materials for: test promo 1"
          - paragraph [ref=e354]: 1 hours ago
      - generic [ref=e356] [cursor=pointer]:
        - img [ref=e358]
        - generic [ref=e361]:
          - paragraph [ref=e362]: "New promotion available: Summer Sale 2026"
          - paragraph [ref=e363]: 1 hours ago
      - generic [ref=e365] [cursor=pointer]:
        - img [ref=e367]
        - generic [ref=e370]:
          - paragraph [ref=e371]: "New promotion available: test promo 002"
          - paragraph [ref=e372]: 1 days ago
      - generic [ref=e373] [cursor=pointer]:
        - img [ref=e375]
        - generic [ref=e378]:
          - paragraph [ref=e379]: "New promotion available: test promo 1"
          - paragraph [ref=e380]: 3 days ago
      - generic [ref=e381] [cursor=pointer]:
        - img [ref=e383]
        - generic [ref=e386]:
          - paragraph [ref=e387]: Your ticket TKT-1047 status has been updated to resolved
          - paragraph [ref=e388]: 25 days ago
      - generic [ref=e389] [cursor=pointer]:
        - img [ref=e391]
        - generic [ref=e394]:
          - paragraph [ref=e395]: Your ticket TKT-1040 status has been updated to resolved
          - paragraph [ref=e396]: 25 days ago
      - generic [ref=e397] [cursor=pointer]:
        - img [ref=e399]
        - generic [ref=e402]:
          - paragraph [ref=e403]: Your ticket TKT-1031 status has been updated to in_progress
          - paragraph [ref=e404]: 26 days ago
      - generic [ref=e405] [cursor=pointer]:
        - img [ref=e407]
        - generic [ref=e410]:
          - paragraph [ref=e411]: Sales Agent replied to your ticket TKT-1031
          - paragraph [ref=e412]: 26 days ago
      - generic [ref=e413] [cursor=pointer]:
        - img [ref=e415]
        - generic [ref=e418]:
          - paragraph [ref=e419]: Your ticket TKT-1025 status has been updated to in_progress
          - paragraph [ref=e420]: 26 days ago
      - generic [ref=e421] [cursor=pointer]:
        - img [ref=e423]
        - generic [ref=e426]:
          - paragraph [ref=e427]: Your ticket TKT-1016 status has been updated to resolved
          - paragraph [ref=e428]: 26 days ago
      - generic [ref=e429] [cursor=pointer]:
        - img [ref=e431]
        - generic [ref=e434]:
          - paragraph [ref=e435]: Your ticket TKT-1017 status has been updated to in_progress
          - paragraph [ref=e436]: 26 days ago
      - generic [ref=e437] [cursor=pointer]:
        - img [ref=e439]
        - generic [ref=e442]:
          - paragraph [ref=e443]: Sales Agent replied to your ticket TKT-1015
          - paragraph [ref=e444]: 26 days ago
      - generic [ref=e445] [cursor=pointer]:
        - img [ref=e447]
        - generic [ref=e450]:
          - paragraph [ref=e451]: Your ticket TKT-1015 status has been updated to resolved
          - paragraph [ref=e452]: 26 days ago
      - generic [ref=e453] [cursor=pointer]:
        - img [ref=e455]
        - generic [ref=e458]:
          - paragraph [ref=e459]: Your ticket TKT-1015 status has been updated to in_progress
          - paragraph [ref=e460]: 26 days ago
      - generic [ref=e461] [cursor=pointer]:
        - img [ref=e463]
        - generic [ref=e466]:
          - paragraph [ref=e467]: Sales Agent replied to your ticket TKT-1015
          - paragraph [ref=e468]: 26 days ago
      - generic [ref=e469] [cursor=pointer]:
        - img [ref=e471]
        - generic [ref=e474]:
          - paragraph [ref=e475]: Your ticket TKT-1008 status has been updated to in_progress
          - paragraph [ref=e476]: 28 days ago
      - generic [ref=e477] [cursor=pointer]:
        - img [ref=e479]
        - generic [ref=e482]:
          - paragraph [ref=e483]: Your ticket TKT-1006 status has been updated to resolved
          - paragraph [ref=e484]: 28 days ago
      - generic [ref=e485] [cursor=pointer]:
        - img [ref=e487]
        - generic [ref=e490]:
          - paragraph [ref=e491]: Your ticket TKT-1006 status has been updated to resolved
          - paragraph [ref=e492]: 28 days ago
      - generic [ref=e493] [cursor=pointer]:
        - img [ref=e495]
        - generic [ref=e498]:
          - paragraph [ref=e499]: Your ticket TKT-1007 status has been updated to resolved
          - paragraph [ref=e500]: 28 days ago
      - generic [ref=e501] [cursor=pointer]:
        - img [ref=e503]
        - generic [ref=e506]:
          - paragraph [ref=e507]: Your ticket TKT-1007 status has been updated to resolved
          - paragraph [ref=e508]: 28 days ago
      - generic [ref=e509] [cursor=pointer]:
        - img [ref=e511]
        - generic [ref=e514]:
          - paragraph [ref=e515]: Ryan replied to your ticket TKT-1007
          - paragraph [ref=e516]: 28 days ago
      - generic [ref=e517] [cursor=pointer]:
        - img [ref=e519]
        - generic [ref=e522]:
          - paragraph [ref=e523]: Ryan replied to your ticket TKT-1006
          - paragraph [ref=e524]: 28 days ago
      - generic [ref=e525] [cursor=pointer]:
        - img [ref=e527]
        - generic [ref=e530]:
          - paragraph [ref=e531]: Your ticket TKT-1001 status has been updated to in_progress
          - paragraph [ref=e532]: 29 days ago
```

# Test source

```ts
  86  |     const notif = page.locator('text=New stock request STK-').first();
  87  |     if (await notif.count() > 0) {
  88  |       await expect(notif).toBeVisible({ timeout: 5000 });
  89  |     }
  90  |   });
  91  | 
  92  |   // MODULE 7: View Stock Requests
  93  |   test('TC-36: Retailer views own stock request history', async ({ page }) => {
  94  |     const loginPage = new LoginPage(page);
  95  |     await loginPage.loginAs('retailer');
  96  |     await page.click('text=Stock Requests');
  97  |     await page.click('button:has-text("Order History"), text=Order History');
  98  |     
  99  |     // Check Status and Date columns
  100 |     await expect(page.locator('th:has-text("Status")').first()).toBeVisible();
  101 |     await expect(page.locator('th:has-text("Date")').first()).toBeVisible();
  102 |   });
  103 | 
  104 |   test('TC-37: Retailer cannot see other retailers\' requests', async ({ page }) => {
  105 |     const loginPage = new LoginPage(page);
  106 |     await loginPage.loginAs('retailer2');
  107 |     await page.click('text=Stock Requests');
  108 |     // Assuming Retailer 2 has different stock requests or none
  109 |     await page.click('button:has-text("Order History"), text=Order History');
  110 |     // Specific check would require DB isolation, but generally we expect isolation.
  111 |     await expect(page.locator('table')).toBeVisible();
  112 |   });
  113 | 
  114 |   test('TC-38: Staff views all stock requests from all retailers', async ({ page }) => {
  115 |     const loginPage = new LoginPage(page);
  116 |     await loginPage.loginAs('staff');
  117 |     await page.click('text=Manage Orders');
  118 |     await expect(page.locator('th:has-text("Retailer Name")').or(page.locator('th:has-text("Retailer")'))).toBeVisible();
  119 |   });
  120 | 
  121 |   test('TC-40: Filter stock requests by status', async ({ page }) => {
  122 |     const loginPage = new LoginPage(page);
  123 |     await loginPage.loginAs('staff');
  124 |     await page.click('text=Manage Orders');
  125 |     
  126 |     // Apply filter
  127 |     const filterSelect = page.locator('select').first();
  128 |     if (await filterSelect.isVisible()) {
  129 |       await filterSelect.selectOption({ label: 'Pending' });
  130 |       // Assert no "Approved" exist
  131 |       await expect(page.locator('td:has-text("Approved")')).toHaveCount(0);
  132 |     }
  133 |   });
  134 | 
  135 |   // MODULE 8: Approve / Reject Requests
  136 |   test('TC-42: Staff approves a pending stock request', async ({ page }) => {
  137 |     const loginPage = new LoginPage(page);
  138 |     const stockPage = new StockRequestsPage(page);
  139 |     await loginPage.loginAs('staff');
  140 |     await stockPage.gotoManageRequests();
  141 |     await stockPage.processRequest('Approve');
  142 |     const approved = page.locator('text=Approved').first();
  143 |     if (await approved.count() > 0) {
  144 |       await expect(approved).toBeVisible({ timeout: 5000 });
  145 |     }
  146 |   });
  147 | 
  148 |   test('TC-43: Staff rejects a stock request with reason', async ({ page }) => {
  149 |     const loginPage = new LoginPage(page);
  150 |     const stockPage = new StockRequestsPage(page);
  151 |     await loginPage.loginAs('staff');
  152 |     await stockPage.gotoManageRequests();
  153 |     
  154 |     // Assuming UI lets you process multiple
  155 |     const processBtn = page.locator('button:has-text("View & Process"), button:has-text("Process")').nth(1);
  156 |     if (await processBtn.count() > 0) {
  157 |       await processBtn.click();
  158 |       await page.click('button:has-text("Reject")');
  159 |       await page.locator('textarea').fill('Product not available in warehouse');
  160 |       await page.click('button:has-text("Confirm")');
  161 |       const rejected = page.locator('text=Rejected').first();
  162 |       if (await rejected.count() > 0) await expect(rejected).toBeVisible({ timeout: 5000 });
  163 |     }
  164 |   });
  165 | 
  166 |   test('TC-44: Rejection without reason shows error', async ({ page }) => {
  167 |     const loginPage = new LoginPage(page);
  168 |     await loginPage.loginAs('staff');
  169 |     await page.click('text=Manage Orders');
  170 |     
  171 |     const processBtn = page.locator('button:has-text("View & Process"), button:has-text("Process")').first();
  172 |     if (await processBtn.count() > 0) {
  173 |       await processBtn.click();
  174 |       await page.click('button:has-text("Reject")');
  175 |       await page.locator('textarea').fill(''); // Blank
  176 |       await page.click('button:has-text("Confirm")');
  177 |       const error = page.locator('text=Rejection reason is required').first();
  178 |       if (await error.count() > 0) await expect(error).toBeVisible({ timeout: 5000 });
  179 |     }
  180 |   });
  181 | 
  182 |   test('TC-45: Retailer notified when request approved', async ({ page }) => {
  183 |     const loginPage = new LoginPage(page);
  184 |     await loginPage.loginAs('retailer');
  185 |     await page.locator('.hidden.lg\\:flex button').click();
> 186 |     await expect(page.locator('text=has been approved').first()).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  187 |   });
  188 | 
  189 |   test('TC-46: Retailer notified when request rejected', async ({ page }) => {
  190 |     const loginPage = new LoginPage(page);
  191 |     await loginPage.loginAs('retailer');
  192 |     await page.locator('.hidden.lg\\:flex button').click();
  193 |     await expect(page.locator('text=has been rejected').first()).toBeVisible();
  194 |   });
  195 | 
  196 |   test('TC-47: Approved request cannot be approved again', async ({ page }) => {
  197 |     const loginPage = new LoginPage(page);
  198 |     await loginPage.loginAs('staff');
  199 |     await page.click('text=Manage Orders');
  200 |     
  201 |     // In UI, if it's approved, the process button should not exist or the approve button inside should be disabled
  202 |     const approvedRow = page.locator('tr:has-text("Approved")').first();
  203 |     if (await approvedRow.count() > 0) {
  204 |       const processBtn = approvedRow.locator('button:has-text("Process")');
  205 |       if (await processBtn.count() > 0) {
  206 |         await processBtn.click();
  207 |         await expect(page.locator('button:has-text("Approve")')).toHaveCount(0);
  208 |       }
  209 |     }
  210 |   });
  211 | 
  212 |   test('TC-48: Retailer cannot approve or reject requests', async ({ page }) => {
  213 |     const loginPage = new LoginPage(page);
  214 |     await loginPage.loginAs('retailer');
  215 |     await page.click('text=Stock Requests');
  216 |     await page.click('text=Order History');
  217 |     
  218 |     await expect(page.locator('button:has-text("Approve")')).toHaveCount(0);
  219 |     await expect(page.locator('button:has-text("Reject")')).toHaveCount(0);
  220 |   });
  221 | 
  222 | });
  223 | 
```