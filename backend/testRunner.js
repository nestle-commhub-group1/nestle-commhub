const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: true,
      args: ['--ignore-certificate-errors']
    });
  } catch(e) {
    console.log("Could not launch Edge. Trying Chrome...");
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--ignore-certificate-errors']
    });
  }
  
  const roles = [
    { name: 'HQ Admin', email: 'admin@nestle.com', path: '/admin/insights' },
    { name: 'PM', email: 'pman1@nestle.com', path: '/pm/insights' },
    { name: 'Stock Manager', email: 'mahesh@nestle.com', path: '/stock/insights' },
    { name: 'Retailer', email: 'test@hosted.com', path: '/retailer/insights' }
  ];
  
  for (const role of roles) {
    console.log(`\n=== OUTPUT FOR ${role.name.toUpperCase()} ===`);
    const page = await browser.newPage();
    
    let isFinished = false;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('PASS') || text.includes('FAIL') || text.includes('SKIPPED') || text.includes('tests passed') || text.includes('INCONCLUSIVE')) {
        console.log(text);
        if (text.includes('tests passed')) {
          isFinished = true;
        }
      } else if (msg.type() === 'error') {
        console.log('ERROR LOG: ', text);
      }
    });

    try {
      await page.goto('http://localhost:5173/login');
      // Look for inputs
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', 'password123');
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
      
      await page.goto(`http://localhost:5173${role.path}`);
      
      // wait until isFinished is true or 45s max
      let elapsed = 0;
      while (!isFinished && elapsed < 45) {
        await page.waitForTimeout(1000);
        elapsed++;
      }
      
    } catch (e) {
      console.log('Error running role:', role.name, e.message);
    }
    
    await page.close();
  }
  
  await browser.close();
})();
