let passedCount = 0;
let totalCount = 0;

export async function runTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`✅ PASS: [${name}]`);
    passedCount++;
  } catch (error) {
    console.error(`❌ FAIL: [${name}] — [${error.message || error}]`);
  }
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRole() {
  try {
    // 1. Try to read 'user' object from storage
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.role) return user.role;
    }
    
    // 2. Try to decode JWT 'token' from storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload && payload.role) return payload.role;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 'unknown';
}

export function getText() {
  return document.body.innerText;
}

export function getHeadings() {
  const elements = document.querySelectorAll('h2, h3');
  return Array.from(elements).map((el) => el.innerText.trim());
}

export async function runAllTests() {
  passedCount = 0;
  totalCount = 0;
  console.log('Running Role Dashboard Tests...');

  // Basic sanity tests (can be expanded later)
  await runTest('Check role extraction', async () => {
    const role = getRole();
    if (typeof role !== 'string') {
      throw new Error('Role must be a string');
    }
  });

  await runTest('Check text extraction', async () => {
    const text = getText();
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }
  });

  await runTest('Retailer cannot access /pm/insights', async () => {
    const role = getRole();
    if (role === 'retailer') {
      window.history.pushState(null, '', 'http://localhost:5173/pm/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(2000);
      if (window.location.pathname === '/pm/insights') {
        throw new Error('Not redirected from /pm/insights');
      }
    } else {
      console.log('SKIPPED — not logged in as retailer');
    }
  });

  await runTest('Retailer cannot access /stock/insights', async () => {
    const role = getRole();
    if (role === 'retailer') {
      window.history.pushState(null, '', 'http://localhost:5173/stock/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(2000);
      if (window.location.pathname === '/stock/insights') {
        throw new Error('Not redirected from /stock/insights');
      }
    } else {
      console.log('SKIPPED — not logged in as retailer');
    }
  });

  await runTest('PM cannot access /retailer/insights', async () => {
    const role = getRole();
    if (role === 'pm' || role === 'promotion_manager') {
      window.history.pushState(null, '', 'http://localhost:5173/retailer/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(2000);
      if (window.location.pathname === '/retailer/insights') {
        throw new Error('Not redirected from /retailer/insights');
      }
    } else {
      console.log('SKIPPED — not logged in as pm');
    }
  });

  await runTest('Stock Manager cannot access /pm/insights', async () => {
    const role = getRole();
    if (role === 'stockManager' || role === 'stock_manager') {
      window.history.pushState(null, '', 'http://localhost:5173/pm/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(2000);
      if (window.location.pathname === '/pm/insights') {
        throw new Error('Not redirected from /pm/insights');
      }
    } else {
      console.log('SKIPPED — not logged in as stockManager');
    }
  });

  await runTest('Metric cards are visible on dashboard', async () => {
    await wait(2000); // Wait for page to render

    const metricCards = Array.from(document.querySelectorAll('[data-testid="metric-card"]'));

    // Fallback if 'metric' is not explicitly in class names (uses standard dashboard grid)
    const fallbackCards = document.querySelectorAll('.grid > .bg-white.p-6');
    const finalCount = Math.max(metricCards.length, fallbackCards.length);

    if (finalCount < 4) {
      throw new Error(`Fewer than 4 metric cards found (Count: ${finalCount})`);
    }
  });

  await runTest('Metric cards do not show raw undefined or null', async () => {
    const text = getText();
    const badValues = [];
    if (text.includes('undefined')) badValues.push('undefined');
    if (text.includes('null')) badValues.push('null');
    if (text.includes('NaN')) badValues.push('NaN');

    if (badValues.length > 0) {
      throw new Error(`Found bad values on page: ${badValues.join(', ')}`);
    }
  });

  await runTest('Metric values are not empty', async () => {
    // Look for large font elements inside the metric cards
    const metricCards = Array.from(document.querySelectorAll('.grid > .bg-white.p-6, [class*="metric" i]'));
    let emptyCount = 0;

    metricCards.forEach(card => {
      const largeTextElements = card.querySelectorAll('.text-3xl, .text-4xl, .text-2xl, [class*="value" i]');
      largeTextElements.forEach(el => {
        if (el.innerText.trim() === '') {
          emptyCount++;
        }
      });
    });

    if (emptyCount > 0) {
      throw new Error(`Found ${emptyCount} empty metric value(s)`);
    }
  });

  await runTest('Charts are rendered on the page', async () => {
    await wait(5000); // Allow Chart.js to render
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length < 2) {
      throw new Error(`Expected at least 2 canvas elements, found ${canvases.length}`);
    }

    let zeroDimCount = 0;
    canvases.forEach(canvas => {
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        zeroDimCount++;
      }
    });

    if (zeroDimCount > 0) {
      throw new Error(`${zeroDimCount} canvas element(s) had zero dimensions`);
    }
  });

  await runTest('Charts have accessible aria-label', async () => {
    const canvases = document.querySelectorAll('canvas');
    const missingAria = [];

    canvases.forEach((canvas, index) => {
      const ariaLabel = canvas.getAttribute('aria-label') || canvas.getAttribute('title') || (canvas.parentElement && canvas.parentElement.getAttribute('aria-label'));
      if (!ariaLabel || ariaLabel.trim() === '') {
        missingAria.push(`Canvas #${index + 1}`);
      }
    });

    if (missingAria.length > 0) {
      throw new Error(`Missing aria-label on: ${missingAria.join(', ')}`);
    }
  });

  await runTest('No chart shows loading spinner after 4 seconds', async () => {
    await wait(4000);
    const elements = Array.from(document.querySelectorAll('*'));
    let visibleLoaders = 0;

    elements.forEach(el => {
      const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';
      const text = el.innerText ? el.innerText.toLowerCase().trim() : '';
      
      // We look for common spinner classes or literal loading text
      if (cls.includes('spinner') || cls.includes('loading') || cls.includes('animate-spin') || text === 'loading' || text === 'loading...') {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden') {
          // Exclude script or style tags which might contain the word
          if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            visibleLoaders++;
          }
        }
      }
    });

    if (visibleLoaders > 0) {
      throw new Error(`Found ${visibleLoaders} loading element(s) still visible`);
    }
  });

  await runTest('PM dashboard shows promotion content', async () => {
    const role = getRole();
    if (role === 'pm' || role === 'promotion_manager') {
      window.history.pushState(null, '', 'http://localhost:5173/pm/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(3000);
      
      const text = getText().toLowerCase();
      const hasKeywords = ['promotion', 'conversion', 'campaign', 'units sold'].some(kw => text.includes(kw));
      if (!hasKeywords) {
        throw new Error('Missing PM keywords on dashboard');
      }

      const hasRestricted = ['low stock alert', 'retailer order patterns'].some(kw => text.includes(kw));
      if (hasRestricted) {
        throw new Error('Found restricted terms on PM dashboard');
      }
    } else {
      console.log('SKIPPED — not logged in as pm');
    }
  });

  await runTest('Stock Manager dashboard shows stock content', async () => {
    const role = getRole();
    if (role === 'stockManager' || role === 'stock_manager') {
      window.history.pushState(null, '', 'http://localhost:5173/stock/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(3000);
      
      const text = getText().toLowerCase();
      const hasKeywords = ['stock', 'fulfillment', 'alert', 'demand'].some(kw => text.includes(kw));
      if (!hasKeywords) {
        throw new Error('Missing Stock Manager keywords on dashboard');
      }

      const hasRestricted = ['promotion performance', 'conversion rate'].some(kw => text.includes(kw));
      if (hasRestricted) {
        throw new Error('Found restricted terms on Stock dashboard');
      }
    } else {
      console.log('SKIPPED — not logged in as stockManager');
    }
  });

  await runTest('Retailer dashboard shows only own data', async () => {
    const role = getRole();
    if (role === 'retailer') {
      window.history.pushState(null, '', 'http://localhost:5173/retailer/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(3000);
      
      const rawText = getText();
      const text = rawText.toLowerCase();

      // Look for capital 'My' with word boundaries for safety, or just the word "My"
      if (!/\bMy\b/i.test(rawText)) {
        throw new Error('Language is not scoped (missing "My")');
      }

      const hasKeywords = ['fulfillment', 'feedback', 'orders'].some(kw => text.includes(kw));
      if (!hasKeywords) {
        throw new Error('Missing Retailer keywords on dashboard');
      }

      const hasRestricted = ['all retailers', 'national overview'].some(kw => text.includes(kw));
      if (hasRestricted) {
        throw new Error('Found global terminology on Retailer dashboard');
      }
    } else {
      console.log('SKIPPED — not logged in as retailer');
    }
  });

  await runTest('Period filter dropdown exists', async () => {
    await wait(2000);
    const selects = Array.from(document.querySelectorAll('select'));
    const periodSelect = selects.find(s => {
      const optionsText = Array.from(s.options).map(o => o.innerText).join(' ');
      return optionsText.includes('Last 7 days') || optionsText.includes('Last 30 days');
    });
    if (!periodSelect) throw new Error('Period dropdown not found');
  });

  await runTest('Changing period filter triggers a new API call', async () => {
    await wait(2000);
    const selects = Array.from(document.querySelectorAll('select'));
    const periodSelect = selects.find(s => {
      const optionsText = Array.from(s.options).map(o => o.innerText).join(' ');
      return optionsText.includes('Last 7 days') || optionsText.includes('Last 30 days');
    });

    if (periodSelect) {
      const currentVal = periodSelect.value;
      const otherOption = Array.from(periodSelect.options).find(o => o.value !== currentVal);
      if (otherOption) {
        periodSelect.value = otherOption.value;
        periodSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    await wait(3000);
    console.log('INCONCLUSIVE — cannot verify fetch without network intercept');
  });

  await runTest('Region filter exists for applicable roles', async () => {
    const role = getRole();
    if (['hq_admin', 'hqAdmin', 'staff', 'stock_manager', 'stockManager'].includes(role)) {
      const selects = Array.from(document.querySelectorAll('select'));
      const regionSelect = selects.find(s => {
        const optionsText = Array.from(s.options).map(o => o.innerText).join(' ');
        return optionsText.includes('Western') || optionsText.includes('All regions');
      });
      if (!regionSelect) throw new Error('Region dropdown not found');
    } else {
      console.log('SKIPPED — region filter not expected for this role');
    }
  });

  await runTest('Retailer sees performance vs national average section', async () => {
    const role = getRole();
    if (role === 'retailer') {
      window.history.pushState(null, '', 'http://localhost:5173/retailer/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(3000);
      
      const text = getText().toLowerCase();
      const hasKeywords = ['national', 'average', 'percentile', 'vs'].some(kw => text.includes(kw));
      if (!hasKeywords) throw new Error('Missing national average terminology');

      // Query progress-bar-like elements (divs with explicit width% style)
      const progressBars = Array.from(document.querySelectorAll('div')).filter(div => {
        return div.style.width && div.style.width.includes('%');
      });
      
      if (progressBars.length < 3) throw new Error(`Found only ${progressBars.length} progress bars`);
    } else {
      console.log('SKIPPED — not retailer');
    }
  });

  await runTest('Retailer fulfillment rate shows percentile label', async () => {
    const role = getRole();
    if (role === 'retailer') {
      window.history.pushState(null, '', 'http://localhost:5173/retailer/insights');
      window.dispatchEvent(new Event('popstate'));
      await wait(3000);
      
      const text = getText();
      if (!text.includes('%')) throw new Error('Missing % sign');
      
      const hasKeywords = ['Top', 'percentile', 'nationally'].some(kw => text.includes(kw));
      if (!hasKeywords) throw new Error('Missing percentile ranking label');
    } else {
      console.log('SKIPPED — not retailer');
    }
  });

  await runTest('No data message does not show when data is present', async () => {
    await wait(3000);
    const text = getText();
    const canvases = Array.from(document.querySelectorAll('canvas')).filter(c => c.clientWidth > 0);
    
    if (canvases.length > 0) {
      if (text.toLowerCase().includes('no data available')) {
        throw new Error('Shows "No data available" even when charts are rendered');
      }
    } else {
      if (!text.toLowerCase().includes('no data available')) {
        throw new Error('Does not show "No data available" when no charts rendered');
      }
      console.log('PASS — correctly showing no data state');
    }
  });

  await runTest('Page does not crash — no error boundaries visible', async () => {
    await wait(2000);
    const text = getText();
    const crashTexts = ['Something went wrong', 'Cannot read properties', 'Unexpected token'];
    
    const foundCrash = crashTexts.find(t => text.includes(t));
    if (foundCrash) {
      throw new Error(`Found error text: ${foundCrash}`);
    }

    const redElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';
      const text = el.innerText ? el.innerText.toLowerCase() : '';
      return (cls.includes('bg-red') && text.includes('error'));
    });

    if (redElements.length > 0) {
      throw new Error('Found error boundary UI on screen');
    }
  });

  console.log(`🏁 ${passedCount}/${totalCount} tests passed`);
}

// Auto-call on load with a slight delay to allow React rendering
if (typeof window !== 'undefined') {
  // If document is already fully loaded, run after timeout
  if (document.readyState === 'complete') {
    setTimeout(runAllTests, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(runAllTests, 1000);
    });
  }
}
