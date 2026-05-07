require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Promotion = require('../src/models/Promotion');
const Order = require('../src/models/Order');
const Feedback = require('../src/models/Feedback');
const ProductDemandAnalytics = require('../src/models/ProductDemandAnalytics');
const RetailerPromotionPreference = require('../src/models/RetailerPromotionPreference');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nestle-commhub';

async function fixDataQuality() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Fix Opt-In Data (Set 70% of preferences to optedIn = true)
    console.log('🔄 Fixing Opt-In Data...');
    const preferences = await RetailerPromotionPreference.find();
    for (const pref of preferences) {
      if (Math.random() < 0.7) {
        await RetailerPromotionPreference.updateOne(
          { _id: pref._id },
          { $set: { optedIn: true } }
        );
      }
    }

    // 2. Fix Fulfillment Status & Rejection Counts
    console.log('🔄 Fixing Fulfillment & Rejection Data...');
    const orders = await Order.find();
    for (const order of orders) {
      const isDenied = order.status === 'denied';
      await Order.updateOne(
        { _id: order._id },
        { 
          $set: { 
            rejectionCount: isDenied ? 1 : (Math.random() > 0.9 ? 1 : 0) 
          } 
        }
      );
    }

    // 3. Fix Demand Scores (Boost top products)
    console.log('🔄 Boosting Demand Scores...');
    const topProducts = ['Nescafé Gold', 'Maggi 1kg', 'Cerelac', 'Milo'];
    const analytics = await ProductDemandAnalytics.find().populate('productId');
    
    for (const item of analytics) {
      let newScore;
      if (item.productId && topProducts.includes(item.productId.name)) {
        newScore = 9.0 + (Math.random() * 0.8); // 9.0 - 9.8
      } else {
        newScore = 5.0 + (Math.random() * 3.5); // 5.0 - 8.5
      }
      await ProductDemandAnalytics.updateOne(
        { _id: item._id },
        { $set: { demandScore: newScore } }
      );
    }

    console.log('🎉 Data Quality Fixes Applied Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix error:', error);
    process.exit(1);
  }
}

fixDataQuality();
