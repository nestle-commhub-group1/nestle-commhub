const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const Order = require('../src/models/Order');
const Ticket = require('../src/models/Ticket');
const Feedback = require('../src/models/Feedback');
const Notification = require('../src/models/Notification');
const ProductDemandAnalytics = require('../src/models/ProductDemandAnalytics');
const RetailerPromotionPreference = require('../src/models/RetailerPromotionPreference');

const MONGO_URI = process.env.MONGO_URI;

async function seedDatabase() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    let retries = 5;
    while (retries > 0) {
      try {
        await mongoose.connect(MONGO_URI, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        break;
      } catch (err) {
        retries -= 1;
        console.log(`⚠️ Connection failed. Retrying... (${retries} left)`);
        if (retries === 0) throw err;
        await new Promise(res => setTimeout(res, 3000));
      }
    }
    console.log('✅ Connected to MongoDB');

    // ==================== STEP 0: CLEAR DATA ====================
    console.log('\n🗑️ Clearing all collections...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Promotion.deleteMany({}),
      Order.deleteMany({}),
      Ticket.deleteMany({}),
      Feedback.deleteMany({}),
      Notification.deleteMany({}),
      ProductDemandAnalytics.deleteMany({}),
      RetailerPromotionPreference.deleteMany({}),
      mongoose.connection.collection('systemlogs').deleteMany({}).catch(() => {}),
      mongoose.connection.collection('insights').deleteMany({}).catch(() => {}),
    ]);
    console.log('✅ All collections cleared');

    // ==================== STEP 1: CREATE USERS ====================
    console.log('\n📝 Creating users with real names...');
    
    // Passwords will be hashed automatically by the pre-save hook
    const hqAdmin = await User.create({
      fullName: 'Dilini Fernando',
      email: 'admin@nestle.com',
      password: 'password123',
      role: 'hq_admin',
      employeeId: 'NES-ADM-001',
      department: 'Head Office',
      phone: '+94112345678',
      isActive: true
    });
    console.log('✅ HQ Admin created:', hqAdmin.fullName);

    const genStaff = await User.create({
      fullName: 'Kasun Perera',
      email: 'staff@nestle.com',
      password: 'password123',
      role: 'staff',
      employeeId: 'NES-STF-001',
      department: 'Support',
      staffCategory: 'General Staff',
      phone: '+94112345679',
      isActive: true
    });
    console.log('✅ General Staff created:', genStaff.fullName);

    const stockoutStaff = await User.create({
      fullName: 'Buddhika Jayawardena',
      email: 'stockout@nestle.com',
      password: 'password123',
      role: 'staff',
      employeeId: 'NES-STF-002',
      department: 'Supply Chain',
      staffCategory: 'Stockout Staff',
      phone: '+94112345682',
      isActive: true
    });
    console.log('✅ Stockout Staff created:', stockoutStaff.fullName);

    const qualityStaff = await User.create({
      fullName: 'Ruwan Kumara',
      email: 'quality@nestle.com',
      password: 'password123',
      role: 'staff',
      employeeId: 'NES-STF-003',
      department: 'Quality Assurance',
      staffCategory: 'Product Quality Staff',
      phone: '+94112345683',
      isActive: true
    });
    console.log('✅ Quality Staff created:', qualityStaff.fullName);

    const logisticsStaff = await User.create({
      fullName: 'Tharindu Wijesinghe',
      email: 'logistics@nestle.com',
      password: 'password123',
      role: 'staff',
      employeeId: 'NES-STF-004',
      department: 'Logistics',
      staffCategory: 'Logistics Staff',
      phone: '+94112345684',
      isActive: true
    });
    console.log('✅ Logistics Staff created:', logisticsStaff.fullName);

    const pricingStaff = await User.create({
      fullName: 'Chaminda Silva',
      email: 'pricing@nestle.com',
      password: 'password123',
      role: 'staff',
      employeeId: 'NES-STF-005',
      department: 'Finance',
      staffCategory: 'Pricing Staff',
      phone: '+94112345685',
      isActive: true
    });
    console.log('✅ Pricing Staff created:', pricingStaff.fullName);

    const pm = await User.create({
      fullName: 'Mahesh Wickramasinghe',
      email: 'pm@nestle.com',
      password: 'password123',
      role: 'promotion_manager',
      employeeId: 'NES-PM-001',
      department: 'Marketing',
      phone: '+94112345680',
      isActive: true
    });
    console.log('✅ PM created:', pm.fullName);

    const stockManager = await User.create({
      fullName: 'Nadeeka Ratnayake',
      email: 'sm@nestle.com',
      password: 'password123',
      role: 'stock_manager',
      employeeId: 'NES-SM-001',
      department: 'Inventory',
      phone: '+94112345681',
      isActive: true
    });
    console.log('✅ Stock Manager created:', stockManager.fullName);

    const distributor1 = await User.create({
      fullName: 'Kamal Jayawardena',
      email: 'dist1@nestle.com',
      password: 'password123',
      role: 'distributor',
      employeeId: 'NES-DIST-001',
      department: 'Logistics',
      phone: '+94112345686',
      isActive: true
    });
    console.log('✅ Distributor 1 created:', distributor1.fullName);

    const distributor2 = await User.create({
      fullName: 'Saman Kumara',
      email: 'dist2@nestle.com',
      password: 'password123',
      role: 'distributor',
      employeeId: 'NES-DIST-002',
      department: 'Logistics',
      phone: '+94112345687',
      isActive: true
    });
    console.log('✅ Distributor 2 created:', distributor2.fullName);

    const retailers = [];
    const retailerSeeds = [
      { name: 'Aruna Silva', biz: 'Silva Super Center', prov: 'Western Province', dist: 'Colombo', lat: 6.9271, lng: 79.8612, email: 'retailer1@test.com' },
      { name: 'Priyantha De Silva', biz: 'Kandy Grocers', prov: 'Central Province', dist: 'Kandy', lat: 7.2906, lng: 80.6337, email: 'retailer2@test.com' },
      { name: 'Sajith Ramanayake', biz: 'Negombo Fresh Market', prov: 'Western Province', dist: 'Gampaha', lat: 7.2008, lng: 79.8737, email: 'retailer3@test.com' },
      { name: 'Nimal Perera', biz: 'Galle Coastal Mart', prov: 'Southern Province', dist: 'Galle', lat: 6.0535, lng: 80.2210, email: 'retailer4@test.com' },
      { name: 'Sunil Wijesinghe', biz: 'Jaffna Heritage Store', prov: 'Northern Province', dist: 'Jaffna', lat: 9.6615, lng: 80.0255, email: 'retailer5@test.com' },
      { name: 'Kamal Gunaratne', biz: 'Trinco Bay Foods', prov: 'Eastern Province', dist: 'Trincomalee', lat: 8.5873, lng: 81.2152, email: 'retailer6@test.com' },
      { name: 'Ravi Kumar', biz: 'Batticaloa Central', prov: 'Eastern Province', dist: 'Batticaloa', lat: 7.7102, lng: 81.6924, email: 'retailer7@test.com' },
      { name: 'Anura Kumara', biz: 'Anuradhapura Ancient Mart', prov: 'North Central Province', dist: 'Anuradhapura', lat: 8.3114, lng: 80.4037, email: 'retailer8@test.com' },
      { name: 'Bandula Warnapura', biz: 'Ratnapura Gem Store', prov: 'Sabaragamuwa Province', dist: 'Ratnapura', lat: 6.6828, lng: 80.3992, email: 'retailer9@test.com' },
      { name: 'Dinesh Chandimal', biz: 'Matara Ocean View', prov: 'Southern Province', dist: 'Matara', lat: 5.9549, lng: 80.5550, email: 'retailer10@test.com' }
    ];

    for (const s of retailerSeeds) {
      const r = await User.create({
        fullName: s.name,
        email: s.email,
        password: 'password123',
        role: 'retailer',
        businessName: s.biz,
        businessAddress: `Main St, ${s.dist}`,
        province: s.prov,
        district: s.dist,
        latitude: s.lat,
        longitude: s.lng,
        phone: '+94770000000',
        credits: s.email === 'retailer1@test.com' ? 8500 : s.email === 'retailer2@test.com' ? 4200 : 0,
        isActive: true
      });
      retailers.push(r);
      console.log(`✅ Retailer created: ${s.biz} (${s.prov}) — Credits: ${r.credits}`);
    }

    // ==================== STEP 2: CREATE PRODUCTS ====================
    console.log('\n📦 Creating products...');

    const productsData = [
      {
        name: 'Nescafé Gold',
        description: 'Premium instant coffee blend with roasted Arabica beans.',
        category: 'Coffee',
        price: 2500,
        stockQuantity: 150,
        howStatus: { isHOW: true, reason: 'Viral Social Media Trend', markedAt: new Date() },
        isActive: true
      },
      {
        name: 'Milo Powder',
        description: 'Malt extract with cocoa and milk solids.',
        category: 'Beverages',
        price: 1800,
        stockQuantity: 200,
        isActive: true
      },
      {
        name: 'KitKat 4-Pack',
        description: 'Crispy wafer fingers covered in smooth milk chocolate.',
        category: 'Confectionery',
        price: 450,
        stockQuantity: 300,
        isActive: true
      },
      {
        name: 'Maggi Instant Noodles',
        description: 'Popular quick-cook noodles with signature spice blend.',
        category: 'Nutrition',
        price: 80,
        stockQuantity: 1000,
        howStatus: { isHOW: true, reason: 'Seasonal Monsoon Demand', markedAt: new Date() },
        isActive: true
      },
      {
        name: 'Nescafé Classic',
        description: 'Original instant coffee with a rich and bold taste.',
        category: 'Coffee',
        price: 1500,
        stockQuantity: 400,
        isActive: true
      },
      {
        name: 'Maggi Coconut Milk Powder',
        description: 'Real coconut milk in powder form for rich curries.',
        category: 'Nutrition',
        price: 350,
        stockQuantity: 800,
        isActive: true
      },
      {
        name: 'Nestlé Cerevita',
        description: 'Nutritious grain-based cereal for growing children.',
        category: 'Nutrition',
        price: 650,
        stockQuantity: 450,
        isActive: true
      },
      {
        name: 'Nescafé 3-in-1',
        description: 'Perfect mix of coffee, creamer and sugar in a sachet.',
        category: 'Coffee',
        price: 45,
        stockQuantity: 5000,
        isActive: true
      },
      {
        name: 'KitKat Chunky',
        description: 'Thick crispy wafer finger covered in milk chocolate.',
        category: 'Confectionery',
        price: 150,
        stockQuantity: 600,
        isActive: true
      },
      {
        name: 'Nestlé Full Cream Milk',
        description: '100% fresh cow milk for the whole family.',
        category: 'Dairy',
        price: 450,
        stockQuantity: 250,
        isActive: true
      }
    ];

    const products = await Product.create(productsData);
    console.log(`✅ Created ${products.length} products`);

    // ==================== STEP 3: CREATE PROMOTIONS ====================
    console.log('\n🎁 Creating promotions...');

    // Ended promotions (for Smart Builder to analyze)
    const endedPromo1 = await Promotion.create({
      title: 'Avurudu Coffee Festival',
      description: 'Massive discount on Nescafé Gold for the New Year season.',
      category: 'seasonal',
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-04-15'),
      promotionType: 'B2B_RETAILER',
      createdBy: pm._id,
      status: 'archived', 
      b2bConfig: {
        minUnitsRequired: 50,
        discountPercentage: 15,
        targetRetailers: ['ALL']
      },
      participatingRetailers: retailers.slice(0, 5).map(r => ({
        retailerId: r._id, optedIn: true, rating: 4.0 + Math.random(), feedback: 'Good performance.'
      })),
      salesData: [
        { retailerId: retailers[0]._id, unitsSold: 450, rewardAmount: 11250 },
        { retailerId: retailers[1]._id, unitsSold: 320, rewardAmount: 8000 }
      ]
    });

    const endedPromo2 = await Promotion.create({
      title: 'Milo Back-to-School',
      description: 'Boost energy for the new school term with Milo bulk deals.',
      category: 'bundled',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      promotionType: 'B2B_RETAILER',
      createdBy: pm._id,
      status: 'archived',
      b2bConfig: {
        minUnitsRequired: 100,
        discountPercentage: 10,
        targetRetailers: ['HIGH_VOLUME']
      },
      participatingRetailers: retailers.slice(3, 8).map(r => ({
        retailerId: r._id, optedIn: true, rating: 3.5 + Math.random(), feedback: 'Steady demand.'
      })),
      salesData: [
        { retailerId: retailers[0]._id, unitsSold: 800, rewardAmount: 15000 }
      ]
    });

    // Active Promotions
    const activeB2BPromo = await Promotion.create({
      title: 'Vesak Bulk Special',
      description: 'Retailer exclusive: Get 12% off on bulk Maggi and Milo orders.',
      category: 'seasonal',
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      promotionType: 'B2B_RETAILER',
      createdBy: pm._id,
      status: 'active',
      b2bConfig: {
        minUnitsRequired: 200,
        discountPercentage: 12,
        targetRetailers: ['ALL']
      },
      participatingRetailers: retailers.slice(0, 8).map(r => ({
        retailerId: r._id, optedIn: true, rating: 4.2 + Math.random(), feedback: 'Interested in this deal.'
      })),
      salesData: retailers.slice(0, 4).map(r => ({
        retailerId: r._id, unitsSold: Math.floor(Math.random() * 300) + 200, rewardAmount: 5000
      }))
    });

    const activeB2CPromo = await Promotion.create({
      title: 'KitKat Break Time Bundle',
      description: 'Customer Offer: Buy 3 KitKats and get the 4th free!',
      category: 'bundled',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      promotionType: 'B2C_CUSTOMER',
      createdBy: pm._id,
      status: 'active',
      b2cConfig: {
        displayName: 'KitKat Buy 3 Get 1',
        customerFacingPrice: 1350,
        bundleRules: 'Buy 3 Get 1',
        requiresRetailerApproval: true,
        currentlyActive: retailers.slice(0, 3).map(r => r._id)
      }
    });

    console.log('✅ Created 4 mixed promotions');

    // ==================== STEP 4: CREATE ORDERS ====================
    console.log('\n📋 Creating orders...');

    const orders = [];
    const ORDER_COUNT = 100;
    for (let i = 0; i < ORDER_COUNT; i++) {
      const retailer = retailers[i % retailers.length];
      const product = products[i % products.length];
      const qty = Math.floor(Math.random() * 200) + 20;
      const amount = qty * product.price;
      
      orders.push({
        retailer: retailer._id,
        items: [{
          product: product._id,
          quantity: qty,
          priceAtTime: product.price,
          discountApplied: i % 5 === 0 ? 10 : 0
        }],
        totalAmount: amount,
        status: ['delivered', 'shipped', 'accepted', 'pending', 'denied'][Math.floor(Math.random() * 5)],
        distributor: i % 2 === 0 ? distributor1._id : distributor2._id,
        createdAt: new Date(Date.now() - (i * 8 * 60 * 60 * 1000)) // Spread over past month
      });
    }

    await Order.create(orders);
    console.log(`✅ Created ${ORDER_COUNT} mock orders`);

    // ==================== STEP 5: CREATE TICKETS ====================
    console.log('\n🎫 Creating tickets...');

    const categories = ['stock_out', 'logistics_delay', 'product_quality', 'pricing_issue'];
    const TICKET_COUNT = 25;
    for (let i = 0; i < TICKET_COUNT; i++) {
      const r = retailers[i % retailers.length];
      await Ticket.create({
        retailerId: r._id,
        category: categories[i % categories.length],
        priority: i % 3 === 0 ? 'high' : i % 5 === 0 ? 'critical' : 'medium',
        status: i % 4 === 0 ? 'open' : i % 5 === 0 ? 'resolved' : 'in_progress',
        description: `Simulated issue ${i + 1} for ${r.businessName}: regarding recent shipment of ${products[i % products.length].name}.`,
        assignedTo: genStaff._id,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      });
    }
    console.log(`✅ Created ${TICKET_COUNT} support tickets`);

    // ==================== STEP 6: DEMAND ANALYTICS ====================
    console.log('\n📊 Creating demand analytics...');

    for (let idx = 0; idx < products.length; idx++) {
      const product = products[idx];
      await ProductDemandAnalytics.create({
        productId: product._id,
        demandScore: (idx === 0) ? 9.5 : (idx === 3) ? 9.2 : (idx === 1) ? 8.8 : (Math.random() * 4 + 5).toFixed(1),
        avgRequestsPerWeek: Math.floor(Math.random() * 500) + 100,
        peakDemandDay: ['MONDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'][Math.floor(Math.random() * 4)],
        seasonalDemand: { SUMMER: 1.2, MONSOON: 0.9, WINTER: 1.4, SPRING: 1.1 },
        demandHistory: Array.from({ length: 12 }, (_, i) => ({
          period: `Week ${i + 1}`,
          requests: Math.floor(Math.random() * 400) + 150,
          fulfillmentRate: 0.85 + (Math.random() * 0.1)
        })),
        recommendations: {
          optimalStockLevel: 600,
          reorderThreshold: 150,
          safetyStock: 75
        },
        lastCalculatedAt: new Date()
      });
    }
    console.log('✅ Created demand analytics for all products');

    // ==================== STEP 7: RETAILER PREFERENCES ====================
    console.log('\n💝 Creating retailer preferences...');

    await RetailerPromotionPreference.create(
      retailers.slice(0, 7).map(r => ({
        retailerId: r._id,
        promotionId: endedPromo1._id,
        optedIn: true,
        rating: 4 + Math.floor(Math.random() * 2),
        notifyOnRerun: true
      }))
    );
    console.log('✅ Created retailer promotion preferences');

    console.log('\n' + '='.repeat(40));
    console.log('✅ SEEDING COMPLETE');
    console.log('='.repeat(40));
    console.log('HQ Admin:       admin@nestle.com / password123');
    console.log('PM:             pm@nestle.com / password123');
    console.log('Stock Manager:  sm@nestle.com / password123');
    console.log('General Staff:  staff@nestle.com / password123');
    console.log('Retailer 1:     retailer1@test.com / password123 (Credits: 8500)');
    console.log('Retailer 2:     retailer2@test.com / password123 (Credits: 4200)');
    console.log('='.repeat(40));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
