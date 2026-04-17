# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module_6_7_8_stock.spec.js >> MODULE 6, 7, 8: Stock Requests >> TC-40: Filter stock requests by status
- Location: tests/e2e/module_6_7_8_stock.spec.js:121:3

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
  24  |     const loginPage = new LoginPage(page);
  25  |     await loginPage.loginAs('retailer');
  26  |     await page.click('text=Stock Requests');
  27  |     // Click submit when cart/form is empty
  28  |     const confirmBtn = page.locator('button:has-text("Confirm Order")').first();
  29  |     if (await confirmBtn.isVisible()) {
  30  |       await confirmBtn.click();
  31  |       await expect(page.locator('text=Product is required').or(page.locator('text=Cart is empty'))).toBeVisible();
  32  |     }
  33  |   });
  34  | 
  35  |   test('TC-31: Stock request requires quantity', async ({ page }) => {
  36  |     // If quantity input can be empty:
  37  |     const loginPage = new LoginPage(page);
  38  |     await loginPage.loginAs('retailer');
  39  |     await page.click('text=Stock Requests');
  40  |     
  41  |     const addBtn = page.locator('button.bg-nestle-brown').first();
  42  |     if (await addBtn.count() > 0) {
  43  |       await addBtn.click();
  44  |       await page.locator('input[type="number"]').first().fill('');
  45  |       await page.click('button:has-text("Confirm Order")');
  46  |       const errorMsg = page.locator('text=Quantity is required').or(page.locator('text=minimum'));
  47  |       if (await errorMsg.count() > 0) {
  48  |         await expect(errorMsg).toBeVisible({ timeout: 5000 });
  49  |       }
  50  |     }
  51  |   });
  52  | 
  53  |   test('TC-32: Stock request with quantity zero shows error', async ({ page }) => {
  54  |     const loginPage = new LoginPage(page);
  55  |     await loginPage.loginAs('retailer');
  56  |     await page.click('text=Stock Requests');
  57  |     
  58  |     const addBtn = page.locator('button.bg-nestle-brown').first();
  59  |     if (await addBtn.count() > 0) {
  60  |       await addBtn.click();
  61  |       await page.locator('input[type="number"]').first().fill('0');
  62  |       await page.click('button:has-text("Confirm Order")');
  63  |       const errorMsg = page.locator('text=must be greater than zero').or(page.locator('text=Invalid quantity'));
  64  |       if (await errorMsg.count() > 0) {
  65  |         await expect(errorMsg).toBeVisible({ timeout: 5000 });
  66  |       }
  67  |     }
  68  |   });
  69  | 
  70  |   test('TC-34: Stock request auto-assigns reference number', async ({ page }) => {
  71  |     const loginPage = new LoginPage(page);
  72  |     await loginPage.loginAs('retailer');
  73  |     await page.goto('/retailer/stock-requests');
  74  |     // Check history tab for references
  75  |     await page.click('button:has-text("Order History"), text=Order History');
  76  |     const refMatch = page.locator('text=/STK-\\d+/').first();
  77  |     if (await refMatch.count() > 0) {
  78  |       await expect(refMatch).toBeVisible({ timeout: 5000 });
  79  |     }
  80  |   });
  81  | 
  82  |   test('TC-35: Staff notified when new stock request submitted', async ({ page }) => {
  83  |     const loginPage = new LoginPage(page);
  84  |     await loginPage.loginAs('staff');
  85  |     await page.locator('.hidden.lg\\:flex button').click();
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
> 124 |     await page.click('text=Manage Orders');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  186 |     await expect(page.locator('text=has been approved').first()).toBeVisible();
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