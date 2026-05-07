require('dotenv').config();
const mongoose = require('mongoose');

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

async function runAudit() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const audit = {};

    // 1. Collection Counts
    audit.counts = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      promotions: await Promotion.countDocuments(),
      orders: await Order.countDocuments(),
      tickets: await Ticket.countDocuments(),
      feedback: await Feedback.countDocuments(),
      notifications: await Notification.countDocuments(),
      demandAnalytics: await ProductDemandAnalytics.countDocuments(),
      preferences: await RetailerPromotionPreference.countDocuments()
    };

    // 2. Promotion Details
    audit.promotions = {
      total: audit.counts.promotions,
      withDescription: await Promotion.countDocuments({ description: { $exists: true, $ne: '' } }),
      withCreatedBy: await Promotion.countDocuments({ createdBy: { $exists: true } }),
      statusBreakdown: await Promotion.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    };

    // 3. Opt-In Data
    audit.preferences = {
      total: audit.counts.preferences,
      optedIn: await RetailerPromotionPreference.countDocuments({ optedIn: true }),
      withRating: await RetailerPromotionPreference.countDocuments({ rating: { $exists: true } })
    };

    // 4. Fulfillment Status
    audit.orders = {
      total: audit.counts.orders,
      statusBreakdown: await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      withRejectionCount: await Order.countDocuments({ rejectionCount: { $exists: true, $gt: 0 } })
    };

    // 5. Feedback Linkage
    audit.feedback = {
      total: audit.counts.feedback,
      withPromotionId: await Feedback.countDocuments({ promotionId: { $exists: true } }),
      ratingDistribution: await Feedback.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }])
    };

    // 6. Demand Scores
    audit.demand = {
      total: audit.counts.demandAnalytics,
      scoreStats: await ProductDemandAnalytics.aggregate([
        { $group: { _id: null, minScore: { $min: '$demandScore' }, maxScore: { $max: '$demandScore' }, avgScore: { $avg: '$demandScore' } } }
      ])
    };

    console.log(JSON.stringify(audit, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runAudit();
