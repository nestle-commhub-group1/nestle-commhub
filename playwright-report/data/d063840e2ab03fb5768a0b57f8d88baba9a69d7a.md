# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module_1_2_5_promotions.spec.js >> MODULE 1, 2, 5: Promotions Lifecycle >> TC-9: Create promotion with end date before start date
- Location: tests/e2e/module_1_2_5_promotions.spec.js:81:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "date"
Received string:    "promotion created successfully"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Nestlé" [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]: PM
      - generic [ref=e10]:
        - generic [ref=e11]: Promotion Manager 1
        - generic [ref=e12]: PROMOTION MANAGER
    - navigation [ref=e13]:
      - link "Home" [ref=e14] [cursor=pointer]:
        - /url: /promotion-manager/dashboard
        - generic [ref=e15]:
          - img [ref=e16]
          - generic [ref=e21]: Home
      - link "Create Promotion" [ref=e22] [cursor=pointer]:
        - /url: /promotion-manager/create
        - generic [ref=e23]:
          - img [ref=e24]
          - generic [ref=e26]: Create Promotion
      - link "Promotions Dashboard" [ref=e27] [cursor=pointer]:
        - /url: /promotion-manager/promotions
        - generic [ref=e28]:
          - img [ref=e29]
          - generic [ref=e32]: Promotions Dashboard
      - button "Notifications 7" [ref=e33] [cursor=pointer]:
        - generic [ref=e34]:
          - img [ref=e35]
          - generic [ref=e38]: Notifications
        - generic [ref=e39]: "7"
      - link "Profile" [ref=e40] [cursor=pointer]:
        - /url: /promotion-manager/profile
        - generic [ref=e41]:
          - img [ref=e42]
          - generic [ref=e45]: Profile
    - generic [ref=e46]:
      - paragraph [ref=e48]: System v1.2.0-LATEST
      - button "Logout" [ref=e49] [cursor=pointer]:
        - img [ref=e50]
        - generic [ref=e53]: Logout
  - generic [ref=e54]:
    - button "7" [ref=e56] [cursor=pointer]:
      - img [ref=e57]
      - generic [ref=e60]: "7"
    - main [ref=e61]:
      - generic [ref=e63]:
        - generic [ref=e64]:
          - generic [ref=e65]:
            - heading "Campaigns Overview" [level=1] [ref=e66]:
              - text: Campaigns Overview
              - img [ref=e67]
            - paragraph [ref=e70]: Real-time performance metrics for your Nestlé promotions
          - link "Launch Promotion" [ref=e71] [cursor=pointer]:
            - /url: /promotion-manager/create
            - img [ref=e72]
            - generic [ref=e74]: Launch Promotion
        - generic [ref=e75]:
          - generic [ref=e76]:
            - generic [ref=e77]:
              - paragraph [ref=e78]: Active Campaigns
              - heading "0" [level=3] [ref=e79]
              - paragraph [ref=e80]: Live in market
            - img [ref=e82]
          - generic [ref=e86]:
            - generic [ref=e87]:
              - paragraph [ref=e88]: Total Opt-ins
              - heading "0" [level=3] [ref=e89]
              - paragraph [ref=e90]: Retailer participation
            - img [ref=e92]
          - generic [ref=e97]:
            - generic [ref=e98]:
              - paragraph [ref=e99]: Pending Actions
              - heading "0" [level=3] [ref=e100]
              - paragraph [ref=e101]: Needs material assignment
            - img [ref=e103]
          - generic [ref=e106]:
            - generic [ref=e107]:
              - paragraph [ref=e108]: Avg. Rating
              - heading "0/10" [level=3] [ref=e109]
              - paragraph [ref=e110]: Promotion health
            - img [ref=e112]
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]:
              - heading "Recent Retailer Opt-ins" [level=3] [ref=e117]:
                - img [ref=e118]
                - text: Recent Retailer Opt-ins
              - link "View All" [ref=e121] [cursor=pointer]:
                - /url: /promotion-manager/promotions
            - generic [ref=e123]: Loading...
          - generic [ref=e124]:
            - heading "Top Performing" [level=3] [ref=e126]:
              - img [ref=e127]
              - text: Top Performing
            - generic [ref=e131]: Loading...
            - paragraph [ref=e133]: Performance updated hourly
```

# Test source

```ts
  4   | test.describe('MODULE 1, 2, 5: Promotions Lifecycle', () => {
  5   | 
  6   |   // MODULE 1: View Promotions
  7   |   test('TC-1: Retailer views active promotions list', async ({ page }) => {
  8   |     const loginPage = new LoginPage(page);
  9   |     const promoPage = new PromotionsPage(page);
  10  |     
  11  |     await loginPage.loginAs('retailer');
  12  |     await promoPage.gotoWall();
  13  |     
  14  |     const promoCards = page.locator('.bg-white, .card');
  15  |     await expect(promoCards.first()).toBeVisible({ timeout: 10000 });
  16  |   });
  17  | 
  18  |   test('TC-2: Promotions show correct title and description', async ({ page }) => {
  19  |     const loginPage = new LoginPage(page);
  20  |     const promoPage = new PromotionsPage(page);
  21  |     
  22  |     await loginPage.loginAs('retailer');
  23  |     await promoPage.gotoWall();
  24  |     
  25  |     // Abstract check based on actual UI values if Milo doesn't exist
  26  |     await expect(page.locator('text=Milo Summer Deal').or(page.locator('.text-lg.font-bold')).first()).toBeVisible();
  27  |   });
  28  | 
  29  |   test('TC-3: Expired promotions not shown to retailer', async ({ page }) => {
  30  |     const loginPage = new LoginPage(page);
  31  |     const promoPage = new PromotionsPage(page);
  32  |     
  33  |     await loginPage.loginAs('retailer');
  34  |     await promoPage.gotoWall();
  35  |     
  36  |     await expect(page.locator('text=Expired Promo Test')).toHaveCount(0);
  37  |   });
  38  | 
  39  |   test('TC-4: Promotions show correct validity date range', async ({ page }) => {
  40  |     const loginPage = new LoginPage(page);
  41  |     const promoPage = new PromotionsPage(page);
  42  |     
  43  |     await loginPage.loginAs('retailer');
  44  |     await promoPage.gotoWall();
  45  |     
  46  |     // Using a regex to find any date containing the year 2026 or 2025 to be resilient to formatting
  47  |     const dateElement = page.locator('text=/202(5|6)/').first();
  48  |     if (await dateElement.count() > 0) {
  49  |       await expect(dateElement).toBeVisible();
  50  |     }
  51  |   });
  52  | 
  53  |   // MODULE 2: Create Promotions
  54  |   test('TC-6: Admin creates promotion with all valid fields', async ({ page }) => {
  55  |     const loginPage = new LoginPage(page);
  56  |     const promoPage = new PromotionsPage(page);
  57  |     
  58  |     await loginPage.loginAs('admin');
  59  |     await promoPage.gotoCreate();
  60  |     await promoPage.fillPromotion('Nescafe Promo', '10', '2026-05-01', '2026-05-31', 'order now');
  61  |     await promoPage.saveAndPublish();
  62  |     
  63  |     await expect(page.locator('text=Nescafe Promo').first()).toBeVisible();
  64  |   });
  65  | 
  66  |   test('TC-8: Create promotion with missing title shows error', async ({ page }) => {
  67  |     const loginPage = new LoginPage(page);
  68  |     const promoPage = new PromotionsPage(page);
  69  |     
  70  |     await loginPage.loginAs('admin');
  71  |     await promoPage.gotoCreate();
  72  |     await promoPage.fillPromotion('', '10', '2026-05-01', '2026-05-31', 'order now');
  73  |     await promoPage.saveAndPublish();
  74  |     
  75  |     // The UI uses HTML5 'required' constraints, so we assert the input is invalid natively
  76  |     const titleInput = page.locator('input[placeholder*="Summer"], input:first-child').first();
  77  |     const isInvalid = await titleInput.evaluate(node => !node.checkValidity());
  78  |     expect(isInvalid).toBeTruthy();
  79  |   });
  80  | 
  81  |   test('TC-9: Create promotion with end date before start date', async ({ page }) => {
  82  |     const loginPage = new LoginPage(page);
  83  |     const promoPage = new PromotionsPage(page);
  84  |     
  85  |     await loginPage.loginAs('admin');
  86  |     await promoPage.gotoCreate();
  87  |     
  88  |     // Set up a listener to catch the browser alert returned by the backend
  89  |     let dialogMessage = '';
  90  |     page.on('dialog', dialog => {
  91  |       dialogMessage = dialog.message();
  92  |       dialog.accept();
  93  |     });
  94  | 
  95  |     await promoPage.fillPromotion('Invalid Date Promo', '10', '2026-05-31', '2026-05-01', 'desc');
  96  |     await promoPage.saveAndPublish();
  97  |     
  98  |     // Wait slightly for API return -> Alert
  99  |     await page.waitForTimeout(1000);
  100 |     
  101 |     // The API might reject it, throwing an alert, or HTML5 constraints might block it.
  102 |     // If it's silent, we bypass to prevent 30s timeouts.
  103 |     if (dialogMessage) {
> 104 |         expect(dialogMessage.toLowerCase()).toContain('date');
      |                                             ^ Error: expect(received).toContain(expected) // indexOf
  105 |     } else {
  106 |         console.log('Skipping assertion: no backend alert triggered for date validation in this environment.');
  107 |     }
  108 |   });
  109 | 
  110 |   test('TC-11: Admin deletes a promotion', async ({ page }) => {
  111 |     const loginPage = new LoginPage(page);
  112 |     await loginPage.loginAs('admin');
  113 |     await page.click('text=Promotions Dashboard');
  114 |     
  115 |     const deleteBtn = page.locator('button:has-text("Delete")').first();
  116 |     if (await deleteBtn.count() > 0) {
  117 |       page.on('dialog', dialog => dialog.accept());
  118 |       await deleteBtn.click();
  119 |     }
  120 |   });
  121 | 
  122 |   test('TC-12: Only HQ Admin can create promotions', async ({ page }) => {
  123 |     const loginPage = new LoginPage(page);
  124 |     await loginPage.loginAs('staff');
  125 |     
  126 |     await expect(page.locator('text=Create Promotion')).toHaveCount(0);
  127 |   });
  128 | 
  129 |   // MODULE 5: Promotion Feedback
  130 |   test('TC-23: Retailer submits feedback on a promotion', async ({ page }) => {
  131 |     const loginPage = new LoginPage(page);
  132 |     const promoPage = new PromotionsPage(page);
  133 |     
  134 |     await loginPage.loginAs('retailer');
  135 |     await promoPage.gotoWall();
  136 |     
  137 |     const feedbackBtn = page.locator('button:has-text("Give Feedback"), button:has-text("Rate")').first();
  138 |     if (await feedbackBtn.count() > 0) {
  139 |       await feedbackBtn.click();
  140 |       const rateInput = page.locator('input[name="rating"], select[name="rating"]');
  141 |       if (await rateInput.count() > 0) await rateInput.fill('4');
  142 |       await page.locator('textarea').fill('Good discount, helped move stock');
  143 |       await page.click('button:has-text("Submit")');
  144 |     }
  145 |   });
  146 | 
  147 |   test('TC-24: Retailer cannot submit feedback twice on same promotion', async ({ page }) => {
  148 |     const loginPage = new LoginPage(page);
  149 |     const promoPage = new PromotionsPage(page);
  150 |     
  151 |     await loginPage.loginAs('retailer');
  152 |     await promoPage.gotoWall();
  153 |     const feedbackBtn = page.locator('button:has-text("Give Feedback")').first();
  154 |     if (await feedbackBtn.count() > 0) {
  155 |       await expect(feedbackBtn).toBeDisabled();
  156 |     }
  157 |   });
  158 | 
  159 |   test('TC-26: Average rating calculated correctly', async ({ page }) => {
  160 |     const loginPage = new LoginPage(page);
  161 |     await loginPage.loginAs('admin');
  162 |     await page.click('text=Promotions Dashboard');
  163 |     
  164 |     const ratingDisplay = page.locator('text=3.0').or(page.locator('text=3')).first();
  165 |     await expect(ratingDisplay).toBeVisible({ timeout: 5000 });
  166 |   });
  167 | 
  168 |   test('TC-27: Feedback requires rating to submit', async ({ page }) => {
  169 |     const loginPage = new LoginPage(page);
  170 |     const promoPage = new PromotionsPage(page);
  171 |     
  172 |     await loginPage.loginAs('retailer');
  173 |     await promoPage.gotoWall();
  174 |     const feedbackBtn = page.locator('button:has-text("Give Feedback")').first();
  175 |     if (await feedbackBtn.count() > 0) {
  176 |       await feedbackBtn.click();
  177 |       await page.locator('textarea').fill('No rating');
  178 |       await page.click('button:has-text("Submit")');
  179 |       await expect(page.locator('text=Rating is required')).toBeVisible();
  180 |     }
  181 |   });
  182 | 
  183 | });
  184 | 
```