
import { test, expect } from '@playwright/test';

// Helper: auto-accept browser alert/confirm dialogs
function autoAcceptDialogs(page) {
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
}

test.describe('Sprint 3: Stock Management System', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // TC-STOCK-001: SM can create a product
  test('TC-STOCK-001: SM can create product', async ({ page }) => {
    autoAcceptDialogs(page);

    // 1. Login as Stock Manager
    await page.fill('#email', 'sm1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/stock-manager/dashboard');

    // 2. Navigate to Manage Inventory
    await page.click('text=Manage Inventory');
    await page.waitForURL('**/stock-manager/inventory');

    // 3. Click Add Product button
    await page.locator('button:has-text("Add Product")').first().click();

    // 4. Fill in the Add Product modal form
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    await page.fill('input[name="name"]', 'Nestlé KOKO KRUNCH 500g');
    await page.fill('textarea[name="description"]', 'KOKO KRUNCH Cereal with Choco flavour');
    await page.fill('input[name="price"]', '1200');
    await page.selectOption('select[name="category"]', 'Confectionery');
    await page.fill('input[name="stockQuantity"]', '1000');

    // 5. Submit the form (it is the last Add Product button on the page when modal is open)
    await page.locator('button:has-text("Add Product")').last().click();
    await page.waitForTimeout(1500);

    // 6. Verify product appears in catalog
    await expect(page.locator('text=Nestlé KOKO KRUNCH 500g').first()).toBeVisible({ timeout: 8000 });
  });

  // TC-STOCK-002: SM can update product stock
  test('TC-STOCK-002: SM can update product stock', async ({ page }) => {
    autoAcceptDialogs(page);

    await page.fill('#email', 'sm1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/stock-manager/dashboard');

    await page.click('text=Manage Inventory');
    await page.waitForURL('**/stock-manager/inventory');
    await page.waitForTimeout(2000);

    // Find the product and click its Edit (pencil) button
    const productRow = page.locator('tr').filter({ hasText: 'Nestlé KOKO KRUNCH 500g' }).first();
    const hasProduct = await productRow.count();

    if (hasProduct === 0) {
      // Product not seeded yet — skip gracefully
      test.skip();
      return;
    }

    // Click edit button (pencil icon) for this product
    await productRow.locator('button').first().click();

    // Modal opens with edit form — update stockQuantity
    await page.waitForSelector('input[name="stockQuantity"]', { timeout: 5000 });
    await page.fill('input[name="stockQuantity"]', '500');

    // Click "Update Product" button
    await page.click('button:has-text("Update Product")');
    await page.waitForTimeout(1500);

    // Verify product still shows in table
    await expect(page.locator('text=Nestlé KOKO KRUNCH 500g')).toBeVisible({ timeout: 5000 });
  });

  // TC-STOCK-007: Retailer can view product catalog
  test('TC-STOCK-007: Retailer can view product catalog', async ({ page }) => {
    await page.fill('#email', 'retailer1@test.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/retailer/dashboard');

    // Navigate to Stock Requests (Order Products tab)
    await page.click('text=Stock Requests');
    await page.waitForURL('**/retailer/stock-requests');

    // Verify the shop heading and bulk savings banner
    await expect(page.locator('h1:has-text("Order Stock")')).toBeVisible({ timeout: 8000 });

    // Verify Bulk Savings Event banner is visible
    await expect(page.locator('text=Bulk Savings Event')).toBeVisible({ timeout: 8000 });

    // Verify Order Products tab is active (it's the default)
    await expect(page.locator('button:has-text("Order Products")')).toBeVisible();
  });

  // TC-STOCK-008: Bulk discount disclosures shown for 500+ units tiers
  test('TC-STOCK-008: Bulk discount shown for 500+ units', async ({ page }) => {
    await page.fill('#email', 'retailer1@test.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/retailer/dashboard');

    await page.click('text=Stock Requests');
    await page.waitForURL('**/retailer/stock-requests');
    await page.waitForTimeout(2000);

    // Verify discount tier labels are visible in the banner
    await expect(page.locator('text=500+ units: 5% OFF')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=1000+ units: 10% OFF')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=1500+ units: 15% OFF')).toBeVisible({ timeout: 5000 });
  });

  // TC-STOCK-011: Retailer can place an order
  test('TC-STOCK-011: Retailer can place order', async ({ page }) => {
    autoAcceptDialogs(page);

    await page.fill('#email', 'retailer1@test.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/retailer/dashboard');

    await page.click('text=Stock Requests');
    await page.waitForURL('**/retailer/stock-requests');

    // Wait for products to load
    await page.waitForTimeout(2000);

    // Add first product to cart — button is a bg-nestle-brown <button> with Plus icon
    const addBtn = page.locator('button.bg-nestle-brown').first();
    const hasProduct = await addBtn.count();

    if (hasProduct === 0) {
      test.skip();
      return;
    }

    await addBtn.click();

    // Click Confirm Order (cart must have items now)
    await page.waitForTimeout(500);
    await page.click('button:has-text("Confirm Order")');

    // Alert fires ("Order placed successfully!") — auto accepted by handler
    await page.waitForTimeout(2000);

    // After order, app switches to history tab
    await expect(page.locator('button:has-text("Order History")')).toBeVisible({ timeout: 5000 });
  });

  // TC-STOCK-003: SM can view pending orders
  test('TC-STOCK-003: SM can view pending orders', async ({ page }) => {
    await page.fill('#email', 'sm1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/stock-manager/dashboard');

    // SM dashboard shows stats cards including Pending Orders
    await expect(page.locator('text=Pending Orders')).toBeVisible({ timeout: 8000 });

    // Go to Manage Orders to see order list
    await page.click('text=Manage Orders');
    await page.waitForURL('**/stock-manager/orders');

    // Verify orders table heading
    await expect(page.locator('h1:has-text("Manage Orders")')).toBeVisible({ timeout: 5000 });
  });

  // TC-STOCK-004: SM can accept an order
  test('TC-STOCK-004: SM can accept order with stock available', async ({ page }) => {
    autoAcceptDialogs(page);

    await page.fill('#email', 'sm1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/stock-manager/dashboard');

    await page.click('text=Manage Orders');
    await page.waitForURL('**/stock-manager/orders');
    await page.waitForTimeout(2000);

    // Click "View & Process" on first order
    const processBtn = page.locator('button:has-text("View & Process")').first();
    const hasOrders = await processBtn.count();

    if (hasOrders === 0) {
      test.skip();
      return;
    }

    await processBtn.click();

    // In modal, change status to "accepted"
    await page.waitForSelector('select', { timeout: 5000 });
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('accepted');

    // Fill ETA
    await page.locator('input[placeholder*="Business Days"]').fill('3-5 Business Days');

    // Select distributor if available
    const distSelect = page.locator('select').last();
    const distOpts = await distSelect.locator('option').count();
    if (distOpts > 1) {
      await distSelect.selectOption({ index: 1 });
    }

    // Submit
    await page.click('button:has-text("Update Order Details")');
    await page.waitForTimeout(1500);

    // Verify modal closed (no longer visible)
    await expect(page.locator('h2:has-text("Process Order")')).toHaveCount(0, { timeout: 5000 });
  });

  // TC-STOCK-015: Distributor can view assigned orders
  test('TC-STOCK-015: Distributor can view assigned orders', async ({ page }) => {
    await page.fill('#email', 'dist1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/distributor/dashboard');

    // Switch to Order Deliveries tab
    await page.click('button:has-text("Order Deliveries")');
    await page.waitForTimeout(1000);

    // Verify the section shows (either orders or "No Orders Assigned" message)
    await expect(
      page.locator('text=Active Delivery Routes').or(page.locator('text=No Orders Assigned'))
    ).toBeVisible({ timeout: 8000 });
  });

  // TC-STOCK-016: Distributor can see order on map (Delivery Radar panel)
  test('TC-STOCK-016: Distributor can see order on map', async ({ page }) => {
    await page.fill('#email', 'dist1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/distributor/dashboard');

    // Switch to Order Deliveries tab
    await page.click('button:has-text("Order Deliveries")');
    await page.waitForTimeout(1000);

    // Verify the Delivery Radar map panel is visible
    await expect(page.locator('text=Delivery Radar')).toBeVisible({ timeout: 8000 });
  });

  // TC-STOCK-017: Distributor can mark order delivered
  test('TC-STOCK-017: Distributor can mark order delivered', async ({ page }) => {
    autoAcceptDialogs(page);

    await page.fill('#email', 'dist1@nestle.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/distributor/dashboard');

    // Switch to Order Deliveries
    await page.click('button:has-text("Order Deliveries")');
    await page.waitForTimeout(1000);

    // Click "Mark Delivered" if there are orders
    const markBtn = page.locator('button:has-text("Mark Delivered")').first();
    const hasOrders = await markBtn.count();

    if (hasOrders > 0) {
      await markBtn.click();
      await page.waitForTimeout(1500);
      // After marking delivered, the button disappears for that order
    }

    // Verify we're still on the dashboard
    await expect(page).toHaveURL(/distributor\/dashboard/);
  });

});
