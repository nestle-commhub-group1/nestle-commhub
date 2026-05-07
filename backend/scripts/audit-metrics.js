/**
 * audit-metrics.js
 * Comprehensive diagnostic script to check why dashboards show 0 values
 * even when data exists.
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const Order = require('../src/models/Order');
const ProductDemandAnalytics = require('../src/models/ProductDemandAnalytics');
const RetailerPromotionPreference = require('../src/models/RetailerPromotionPreference');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nestle-commhub';

async function audit() {
  try {
    console.log('--- COMMHUB ANALYTICS AUDIT ---');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Opt-in Audit
    console.log('\n[1] OPT-IN AUDIT');
    const promos = await Promotion.find().lean();
    console.log(`Total Promotions: ${promos.length}`);
    
    let totalOptInsInPromos = 0;
    promos.forEach(p => {
      const optIns = (p.participatingRetailers || []).filter(r => r.optedIn).length;
      totalOptInsInPromos += optIns;
      if (optIns > 0) {
        console.log(`  - Promo "${p.title}": ${optIns} opt-ins`);
      }
    });
    console.log(`Total Opt-ins found in Promotion.participatingRetailers: ${totalOptInsInPromos}`);

    const prefs = await RetailerPromotionPreference.find({ optedIn: true }).countDocuments();
    console.log(`Total Opt-ins found in RetailerPromotionPreference collection: ${prefs}`);

    // 2. Fulfillment Audit
    console.log('\n[2] FULFILLMENT AUDIT');
    const orders = await Order.find().lean();
    console.log(`Total Orders: ${orders.length}`);
    
    const statusCounts = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    console.log('Order Status Distribution:', statusCounts);

    const rejections = orders.filter(o => (o.rejectionCount || 0) > 0).length;
    console.log(`Orders with rejectionCount > 0: ${rejections}`);

    // 3. Product Demand Audit
    console.log('\n[3] PRODUCT DEMAND AUDIT');
    const analytics = await ProductDemandAnalytics.find().populate('productId').lean();
    console.log(`ProductDemandAnalytics records: ${analytics.length}`);
    
    analytics.forEach(a => {
      console.log(`  - ${a.productId?.name || 'Unknown'}: Score=${a.demandScore}, Stock=${a.productId?.stockQuantity || 0}`);
    });

    // 4. Time Window Check
    console.log('\n[4] TIME WINDOW CHECK');
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000);
    const recentOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    console.log(`Orders in last 30 days: ${recentOrders}`);
    
    if (orders.length > 0 && recentOrders === 0) {
      console.log('⚠️ ALERT: All orders are older than 30 days. Dashboards with 30d filters will show 0.');
    }

    // 5. Region/Province Check
    console.log('\n[5] REGION AUDIT');
    const retailers = await User.find({ role: 'retailer' }).lean();
    const provinceCounts = {};
    retailers.forEach(r => {
      provinceCounts[r.province || 'MISSING'] = (provinceCounts[r.province || 'MISSING'] || 0) + 1;
    });
    console.log('Retailer Province Distribution:', provinceCounts);

    process.exit(0);
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

audit();
