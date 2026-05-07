require('dotenv').config();
const mongoose = require('mongoose');
const Promotion = require('../src/models/Promotion');
const RetailerPromotionPreference = require('../src/models/RetailerPromotionPreference');
const Feedback = require('../src/models/Feedback');
const Order = require('../src/models/Order');
const ProductDemandAnalytics = require('../src/models/ProductDemandAnalytics');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nestle-commhub';

async function debugEndpoints() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // DEBUG 1: Check opt-in counts
    console.log('=== OPT-IN DATA DEBUG ===');
    const totalPrefs = await RetailerPromotionPreference.countDocuments();
    const optedInPrefs = await RetailerPromotionPreference.countDocuments({ optedIn: true });
    const notOptedIn = await RetailerPromotionPreference.countDocuments({ optedIn: false });
    
    console.log(`Total preferences: ${totalPrefs}`);
    console.log(`Opted in (true): ${optedInPrefs}`);
    console.log(`Not opted in (false): ${notOptedIn}`);
    
    const sample = await RetailerPromotionPreference.findOne().populate('promotionId', 'title');
    console.log(`Sample preference:`, {
      promotion: sample?.promotionId?.title,
      optedIn: sample?.optedIn,
      rating: sample?.rating,
      unitsOrdered: sample?.unitsOrdered
    });
    console.log();

    // DEBUG 2: Check rejection counts
    console.log('=== FULFILLMENT DATA DEBUG ===');
    const ordersWithRejection = await Order.countDocuments({ rejectionCount: { $gt: 0 } });
    const ordersNoRejection = await Order.countDocuments({ rejectionCount: 0 });
    const rejectionBreakdown = await Order.aggregate([
      { $group: { _id: '$rejectionCount', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`Orders WITH rejection count: ${ordersWithRejection}`);
    console.log(`Orders WITHOUT rejection count: ${ordersNoRejection}`);
    console.log(`Rejection distribution:`, rejectionBreakdown);
    console.log();

    // DEBUG 3: Check demand scores
    console.log('=== DEMAND ANALYTICS DEBUG ===');
    const allAnalytics = await ProductDemandAnalytics.find()
      .populate('productId', 'name')
      .select('productId demandScore avgRequestsPerWeek fulfillmentRate');
    
    console.log(`Total demand analytics: ${allAnalytics.length}`);
    console.log(`Average demand score: ${(allAnalytics.reduce((sum, a) => sum + a.demandScore, 0) / allAnalytics.length).toFixed(2)}`);
    console.log(`Max demand score: ${Math.max(...allAnalytics.map(a => a.demandScore)).toFixed(2)}`);
    
    console.log(`\nDemand scores by product:`);
    allAnalytics.forEach(a => {
      console.log(`  ${a.productId?.name}: ${a.demandScore?.toFixed(2)}`);
    });
    console.log();

    // DEBUG 4: Check feedback
    console.log('=== FEEDBACK DATA DEBUG ===');
    const feedbackCount = await Feedback.countDocuments();
    const ratingBreakdown = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`Total feedback: ${feedbackCount}`);
    console.log(`Rating distribution:`, ratingBreakdown);
    console.log();

    // DEBUG 5: Check promotions
    console.log('=== PROMOTION DATA DEBUG ===');
    const archivedPromos = await Promotion.countDocuments({ status: 'archived' });
    const activePromos = await Promotion.countDocuments({ status: 'active' });
    
    console.log(`Archived promotions: ${archivedPromos}`);
    console.log(`Active promotions: ${activePromos}`);

    console.log('\n✅ Debug complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

debugEndpoints();
