const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  
  const roles = ['retailer', 'pm', 'stock_manager', 'hq_admin'];
  
  for (const role of roles) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log(`\n=== Console output for role: ${role} ===`);
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('PASS:') || text.includes('FAIL:') || text.includes('SKIPPED') || text.includes('Running Role Dashboard Tests')) {
        console.log(text);
      }
    });

    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          insights: [
            { _id: '1', type: 'metric', message: 'Insight 1' },
            { _id: '2', type: 'metric', message: 'Insight 2' },
            { _id: '3', type: 'metric', message: 'Insight 3' },
            { _id: '4', type: 'metric', message: 'Insight 4' }
          ],
          user: { id: 'test', email: 'test@nestle.com', role: role }
        })
      });
    });

    await page.goto('http://localhost:5173');
    
    await page.evaluate((r) => {
      localStorage.setItem('user', JSON.stringify({ role: r }));
      localStorage.setItem('token', 'mock_token');
    }, role);
    
    await page.reload();
    
    // The tests have some wait(2000) and wait(5000), so we should wait a bit
    await page.waitForTimeout(8000);
    
    await context.close();
  }

  await browser.close();
})();
