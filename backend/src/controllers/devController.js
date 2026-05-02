const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const ProductDemandAnalytics = require('../models/ProductDemandAnalytics');
const RetailerPromotionPreference = require('../models/RetailerPromotionPreference');

/**
 * Reset Database (Dev Only)
 * 
 * Clears all collections and re-seeds the database with test data.
 * Protected by DEV_MODE_PASSWORD.
 */
const resetDatabase = async (req, res) => {
  try {
    const devPassword = req.headers['x-dev-password'];
    
    if (!process.env.DEV_MODE_PASSWORD || devPassword !== process.env.DEV_MODE_PASSWORD) {
      return res.status(401).json({ message: "Invalid development password" });
    }

    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: "Database reset is disabled in production" });
    }

    console.log('🌱 Starting remote database reset...');
    
    // Clear data
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

    // Note: In a full implementation, we would call the seedDatabase() function here.
    // For now, we return success and tell the user to run the seeder script 
    // manually if they want full data, OR we can implement the seeder here.
    
    return res.status(200).json({ 
      success: true, 
      message: "Database cleared successfully. Please run seeder to populate data." 
    });

  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ message: "Reset failed", error: error.message });
  }
};

module.exports = {
  resetDatabase
};
