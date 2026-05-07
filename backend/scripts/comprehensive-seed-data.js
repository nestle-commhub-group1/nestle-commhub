require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const Order = require('../src/models/Order');
const Ticket = require('../src/models/Ticket');
const Feedback = require('../src/models/Feedback');
const Notification = require('../src/models/Notification');
const ProductDemandAnalytics = require('../src/models/ProductDemandAnalytics');
const RetailerPromotionPreference = require('../src/models/RetailerPromotionPreference');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nestle-commhub';

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // Connect
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Promotion.deleteMany({}),
      Order.deleteMany({}),
      Ticket.deleteMany({}),
      Feedback.deleteMany({}),
      Notification.deleteMany({}),
      ProductDemandAnalytics.deleteMany({}),
      RetailerPromotionPreference.deleteMany({})
    ]);
    console.log('✅ Cleared\n');

    // 1. Create Users
    console.log('👥 Creating 30 users...');
    const users = await seedUsers();
    console.log(`✅ Created ${users.length} users\n`);

    // 2. Create Products
    console.log('📦 Creating 12 products...');
    const products = await seedProducts();
    console.log(`✅ Created ${products.length} products\n`);

    // 3. Create Promotions
    console.log('🎁 Creating 25 promotions (5 archived, 20 active)...');
    const promotions = await seedPromotions(users);
    console.log(`✅ Created ${promotions.length} promotions\n`);

    // 4. Create Orders
    console.log('📊 Creating 150 orders...');
    const orders = await seedOrders(users, products);
    console.log(`✅ Created ${orders.length} orders\n`);

    // 5. Create Tickets
    console.log('🎫 Creating 50 tickets...');
    const tickets = await seedTickets(users);
    console.log(`✅ Created ${tickets.length} tickets\n`);

    // 6. Create Feedback
    console.log('⭐ Creating 80 feedback entries...');
    const feedback = await seedFeedback(users, promotions);
    console.log(`✅ Created ${feedback.length} feedback entries\n`);

    // 7. Create Notifications
    console.log('🔔 Creating 60 notifications...');
    const notifications = await seedNotifications(users);
    console.log(`✅ Created ${notifications.length} notifications\n`);

    // 8. Create Product Demand Analytics
    console.log('📈 Creating 12 demand analytics...');
    const demandAnalytics = await seedDemandAnalytics(products);
    console.log(`✅ Created ${demandAnalytics.length} demand analytics\n`);

    // 9. Create Retailer Promotion Preferences
    console.log('💝 Creating 100 retailer preferences...');
    const preferences = await seedRetailerPreferences(users, promotions);
    console.log(`✅ Created ${preferences.length} preferences\n`);

    // 10. Mark HOW Products
    console.log('⭐ Marking 8 products as HOW...');
    const howProducts = await seedHOWProducts(users, products);
    console.log(`✅ Marked ${howProducts.length} as HOW\n`);

    console.log('🎉 Database seeding complete!\n');
    console.log('📊 SUMMARY:');
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Products: ${products.length}`);
    console.log(`  • Promotions: ${promotions.length}`);
    console.log(`  • Orders: ${orders.length}`);
    console.log(`  • Tickets: ${tickets.length}`);
    console.log(`  • Feedback: ${feedback.length}`);
    console.log(`  • Notifications: ${notifications.length}`);
    console.log(`  • Demand Analytics: ${demandAnalytics.length}`);
    console.log(`  • Retailer Preferences: ${preferences.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

async function seedUsers() {
  const userData = [
    // HQ Admin (1)
    { email: 'admin@nestle.com', fullName: 'Admin User', role: 'hq_admin', employeeId: 'NES001', phone: '0712345678' },

    // Staff (3)
    { email: 'staff@nestle.com', fullName: 'John Staff', role: 'staff', employeeId: 'NES002', phone: '0712345679' },
    { email: 'staff2@nestle.com', fullName: 'Jane Staff', role: 'staff', employeeId: 'NES003', phone: '0712345680' },
    { email: 'staff3@nestle.com', fullName: 'Mike Staff', role: 'staff', employeeId: 'NES004', phone: '0712345681' },

    // PM (2)
    { email: 'pm@nestle.com', fullName: 'Alice PM', role: 'promotion_manager', employeeId: 'NES005', phone: '0712345682' },
    { email: 'pm2@nestle.com', fullName: 'Bob PM', role: 'promotion_manager', employeeId: 'NES006', phone: '0712345683' },

    // Stock Manager (2)
    { email: 'sm@nestle.com', fullName: 'Charlie SM', role: 'stock_manager', employeeId: 'NES007', phone: '0712345684' },
    { email: 'sm2@nestle.com', fullName: 'Diana SM', role: 'stock_manager', employeeId: 'NES008', phone: '0712345685' },

    // Retailers (20)
    ...Array.from({ length: 20 }, (_, i) => ({
      email: `retailer${i + 1}@test.com`,
      fullName: `Retailer Store ${i + 1}`,
      role: 'retailer',
      retailerId: `RET${String(i + 1).padStart(3, '0')}`,
      province: getProvinceForRetailer(i),
      latitude: 6.9 + (Math.random() * 3),
      longitude: 80.7 + (Math.random() * 1.5),
      phone: `077${String(i + 1).padStart(7, '0')}`
    })),

    // Distributors (2)
    { email: 'distributor@test.com', fullName: 'Distributor One', role: 'distributor', employeeId: 'DIST001', phone: '0712345686' },
    { email: 'distributor2@test.com', fullName: 'Distributor Two', role: 'distributor', employeeId: 'DIST002', phone: '0712345687' }
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = userData.map(user => ({
    ...user,
    password: hashedPassword
  }));

  return await User.insertMany(users);
}

async function seedProducts() {
  const products = [
    { name: 'Nescafé Gold', category: 'Coffee', price: 450, basePrice: 450, stockQuantity: 1000, description: 'Premium coffee blend' },
    { name: 'Nescafé Classic', category: 'Coffee', price: 350, basePrice: 350, stockQuantity: 800, description: 'Rich and bold coffee' },
    { name: 'Milo', category: 'Beverages', price: 280, basePrice: 280, stockQuantity: 1200, description: 'Chocolate malt drink' },
    { name: 'Aero Bar', category: 'Confectionery', price: 150, basePrice: 150, stockQuantity: 500, description: 'Bubbly milk chocolate' },
    { name: 'KitKat', category: 'Confectionery', price: 120, basePrice: 120, stockQuantity: 600, description: 'Crispy wafer bar' },
    { name: 'Maggi 1kg', category: 'Nutrition', price: 380, basePrice: 380, stockQuantity: 900, description: 'Convenient instant noodles' },
    { name: 'Cerelac', category: 'Nutrition', price: 520, basePrice: 520, stockQuantity: 400, description: 'Nutritious infant cereal' },
    { name: 'Nespresso', category: 'Coffee', price: 1200, basePrice: 1200, stockQuantity: 200, description: 'High-end coffee capsules' },
    { name: 'Milkybar', category: 'Confectionery', price: 110, basePrice: 110, stockQuantity: 700, description: 'Creamy white chocolate' },
    { name: 'Smarties', category: 'Confectionery', price: 85, basePrice: 85, stockQuantity: 800, description: 'Colorful chocolate buttons' },
    { name: 'Buttermilk', category: 'Dairy', price: 95, basePrice: 95, stockQuantity: 600, description: 'Fresh and nutritious dairy' },
    { name: 'Nougat', category: 'Confectionery', price: 200, basePrice: 200, stockQuantity: 350, description: 'Sweet chewy confection' }
  ];

  return await Product.insertMany(products);
}

async function seedPromotions(users) {
  const pm = users.find(u => u.role === 'promotion_manager');
  
  // ARCHIVED PROMOTIONS (replaces 'ended')
  const endedPromotions = [
    {
      title: 'Summer Sale 2024',
      description: 'Big summer discounts for retailers',
      promotionType: 'B2B_RETAILER',
      category: 'discount',
      discount: 20,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      status: 'archived',
      createdBy: pm._id
    },
    {
      title: 'Spring Deal 2024',
      description: 'Spring season bulk offers',
      promotionType: 'B2B_RETAILER',
      category: 'discount',
      discount: 15,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31'),
      status: 'archived',
      createdBy: pm._id
    },
    {
      title: 'Flash Sale 2024',
      description: 'One month customer flash sale',
      promotionType: 'B2C_CUSTOMER',
      category: 'flash_sale',
      discount: 50,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-28'),
      status: 'archived',
      createdBy: pm._id,
      b2cConfig: { bundleRules: '2 for 1' }
    },
    {
      title: 'Year-End Mega Deal',
      description: 'End of year stock clearance',
      promotionType: 'B2B_RETAILER',
      category: 'discount',
      discount: 25,
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-31'),
      status: 'archived',
      createdBy: pm._id
    },
    {
      title: 'Winter Warmer Bundle',
      description: 'Bundle deals for winter products',
      promotionType: 'B2C_CUSTOMER',
      category: 'bundled',
      discount: 33,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      status: 'archived',
      createdBy: pm._id,
      b2cConfig: { bundleRules: 'Buy 3 Get 1' }
    }
  ];

  // ACTIVE PROMOTIONS
  const now = new Date();
  const activePromotions = [
    {
      title: 'May Monsoon Special',
      description: 'Rainy season retailer support',
      promotionType: 'B2B_RETAILER',
      category: 'discount',
      discount: 18,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdBy: pm._id,
      b2bConfig: { minUnitsRequired: 100, discountPercentage: 18 }
    },
    {
      title: 'Coffee Lovers Bundle',
      description: 'Premium coffee bundle for customers',
      promotionType: 'B2C_CUSTOMER',
      category: 'bundled',
      discount: 40,
      startDate: now,
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdBy: pm._id,
      b2cConfig: { bundleRules: '2 for 1' }
    },
    ...Array.from({ length: 18 }, (_, i) => ({
      title: `Active Promotion ${i + 3}`,
      description: `Description for active promotion ${i + 3}`,
      promotionType: Math.random() > 0.5 ? 'B2B_RETAILER' : 'B2C_CUSTOMER',
      category: ['seasonal', 'discount', 'bundled', 'flash_sale'][Math.floor(Math.random() * 4)],
      discount: 10 + Math.floor(Math.random() * 25),
      startDate: now,
      endDate: new Date(now.getTime() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000),
      status: 'active',
      createdBy: pm._id
    }))
  ];

  return await Promotion.insertMany([...endedPromotions, ...activePromotions]);
}

async function seedOrders(users, products) {
  const retailers = users.filter(u => u.role === 'retailer');
  const distributors = users.filter(u => u.role === 'distributor');
  const orders = [];

  for (let i = 0; i < 150; i++) {
    const retailer = retailers[i % retailers.length];
    const distributor = distributors[i % distributors.length];
    const product = products[i % products.length];
    const daysAgo = Math.floor(Math.random() * 90);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);

    const qty = 50 + Math.floor(Math.random() * 400);

    orders.push({
      retailer: retailer._id,
      items: [{
        product: product._id,
        quantity: qty,
        priceAtTime: product.price,
        discountApplied: Math.random() > 0.5 ? 10 : 0
      }],
      totalAmount: product.price * qty,
      status: ['pending', 'accepted', 'denied', 'shipped', 'delivered'][Math.floor(Math.random() * 5)],
      distributor: distributor._id,
      createdAt: orderDate,
      notes: 'Sample order note'
    });
  }

  return await Order.insertMany(orders);
}

async function seedTickets(users) {
  const retailers = users.filter(u => u.role === 'retailer');
  const staff = users.filter(u => u.role === 'staff');
  const tickets = [];

  const categories = ['stock_out', 'product_quality', 'logistics_delay', 'pricing_issue'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'in_progress', 'resolved'];

  for (let i = 0; i < 50; i++) {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));

    const isResolved = Math.random() > 0.3;
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    // Manual SLA calculation (matching the model logic)
    const slaMap = { critical: 2, high: 4, medium: 8, low: 24 };
    const slaDeadline = new Date(createdDate.getTime() + (slaMap[priority] * 60 * 60 * 1000));

    tickets.push({
      ticketNumber: `TKT-${1001 + i}`, // Manually assign to avoid null/duplicates in insertMany
      retailerId: retailers[i % retailers.length]._id,
      category: categories[i % categories.length],
      status: isResolved ? 'resolved' : statuses[Math.floor(Math.random() * 2)],
      priority,
      description: `Ticket issue ${i + 1}: Detailed problem description`,
      assignedTo: staff[i % staff.length]._id,
      createdAt: createdDate,
      resolvedAt: isResolved ? new Date(createdDate.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000)) : null,
      slaDeadline
    });
  }

  return await Ticket.insertMany(tickets);
}

async function seedFeedback(users, promotions) {
  const retailers = users.filter(u => u.role === 'retailer');
  const feedback = [];

  for (let p = 0; p < Math.min(20, promotions.length); p++) {
    for (let f = 0; f < 4; f++) {
      feedback.push({
        promotionId: promotions[p]._id,
        retailerId: retailers[(p * 4 + f) % retailers.length]._id,
        rating: 2 + Math.floor(Math.random() * 4),
        comment: 'Sample feedback comment',
        createdAt: new Date()
      });
    }
  }

  return await Feedback.insertMany(feedback);
}

async function seedNotifications(users) {
  const notifications = [];
  const types = ['ticket_updated', 'promotion', 'warning', 'new_message'];

  for (let i = 0; i < 60; i++) {
    notifications.push({
      userId: users[i % users.length]._id,
      type: types[i % types.length],
      message: `Sample notification message ${i + 1}`,
      isRead: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }

  return await Notification.insertMany(notifications);
}

async function seedDemandAnalytics(products) {
  const analytics = [];

  for (const product of products) {
    analytics.push({
      productId: product._id,
      demandScore: 5 + Math.random() * 5,
      avgRequestsPerWeek: 200 + Math.floor(Math.random() * 400),
      fulfillmentRate: 0.75 + Math.random() * 0.25,
      growthTrend: -0.1 + Math.random() * 0.3,
      retailerInterest: 5 + Math.floor(Math.random() * 6),
      peakDemandDay: 'MONDAY',
      seasonalDemand: {
        SUMMER: 1.2 + Math.random() * 0.4,
        MONSOON: 0.7 + Math.random() * 0.4,
        WINTER: 0.9 + Math.random() * 0.3,
        SPRING: 0.9 + Math.random() * 0.2
      },
      recommendations: { optimalStockLevel: 500, reorderThreshold: 100, safetyStock: 50 }
    });
  }

  return await ProductDemandAnalytics.insertMany(analytics);
}

async function seedRetailerPreferences(users, promotions) {
  const retailers = users.filter(u => u.role === 'retailer');
  const preferences = [];

  for (let r = 0; r < retailers.length; r++) {
    for (let p = 0; p < 5; p++) {
      const rating = 2 + Math.floor(Math.random() * 4);

      preferences.push({
        retailerId: retailers[r]._id,
        promotionId: promotions[(r * 5 + p) % promotions.length]._id,
        notifyOnRerun: rating >= 4,
        rating,
        feedback: 'Sample preference feedback',
        unitsOrdered: 200 + Math.floor(Math.random() * 800),
        totalRevenue: 50000 + Math.random() * 100000,
        lastOrderDate: new Date()
      });
    }
  }

  return await RetailerPromotionPreference.insertMany(preferences);
}

async function seedHOWProducts(users, products) {
  const sm = users.find(u => u.role === 'stock_manager');
  const howProducts = [];

  for (let i = 0; i < 8 && i < products.length; i++) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const howStatus = {
      isHOW: true,
      markedBy: sm._id,
      markedAt: new Date(),
      expiryDate,
      reason: 'High demand, recommend stock increase'
    };

    await Product.updateOne({ _id: products[i]._id }, { howStatus });
    howProducts.push(products[i]);
  }

  return howProducts;
}

function getProvinceForRetailer(index) {
  const provinces = [
    'Western', 'Western', 'Western', 'Western', 'Western',
    'Central', 'Central', 'Central', 'Central', 'Central',
    'Southern', 'Southern', 'Southern', 'Southern', 'Southern',
    'Northern', 'Northern', 'Northern',
    'Eastern', 'Eastern', 'Eastern',
    'North Central', 'North Western', 'Uva', 'Sabaragamuwa'
  ];
  return provinces[index] || 'Western';
}

seedDatabase();
